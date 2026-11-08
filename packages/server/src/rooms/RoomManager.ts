import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@fuyardesque/shared';
import { Room } from './Room';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public createRoom(hostSocket: Socket, hostName: string, token?: string): Room {
    // A socket may only belong to one room at a time.
    if (this.socketToRoom.has(hostSocket.id)) {
      this.handleDisconnect(hostSocket);
    }

    const roomId = this.generateRoomCode();
    const room = new Room(roomId, hostSocket.id, hostName, this.io, token);
    this.rooms.set(roomId, room);
    this.socketToRoom.set(hostSocket.id, roomId);
    hostSocket.join(`room_${roomId}`);
    return room;
  }

  public joinRoom(
    socket: Socket,
    roomId: string,
    playerName: string,
    token?: string
  ): {
    room?: Room;
    error?: string;
    errorCode?: 'ROOM_NOT_FOUND' | 'GAME_IN_PROGRESS' | 'ROOM_FULL' | 'DUPLICATE_SESSION';
    playerId?: string;
    reconnected?: boolean;
  } {
    const code = (roomId || '').toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) {
      return {
        error: 'Room not found. Please check your invitation code.',
        errorCode: 'ROOM_NOT_FOUND',
      };
    }

    const currentRoomId = this.socketToRoom.get(socket.id);
    if (currentRoomId === code) {
      // Repeated join from the same socket is idempotent.
      const currentPlayerId = room.getPlayerIdBySocket(socket.id);
      if (currentPlayerId) {
        return { room, playerId: currentPlayerId, reconnected: true };
      }
    } else if (currentRoomId) {
      // A socket may only belong to one room at a time.
      this.handleDisconnect(socket);
    }

    // A returning player is identified by a stable token, never by socket id.
    const existing = token ? room.findPlayerByToken(token) : undefined;

    if (existing) {
      const currentSocketId = room.getSocketIdForPlayer(existing.id);
      const gameActive = !!room.gameEngine && room.gameEngine.phase !== 'game_over';
      const isDuplicateConnection =
        existing.connected && !!currentSocketId && currentSocketId !== socket.id;

      if (isDuplicateConnection) {
        if (!gameActive) {
          return {
            error: 'This session is already connected to the room.',
            errorCode: 'DUPLICATE_SESSION',
          };
        }

        // Mid-game takeover: the token holder is authoritative. Drop the stale
        // socket so both tabs cannot submit moves for the same player.
        const wasHost = room.hostId === existing.id;
        const staleSocket = currentSocketId
          ? this.io.sockets.sockets.get(currentSocketId)
          : undefined;
        staleSocket?.disconnect(true);
        if (wasHost && room.players.has(existing.id)) {
          room.reassignHost(existing.id);
        }
      }

      if (room.players.has(existing.id)) {
        room.reconnectPlayer(existing.id, socket.id);
        this.socketToRoom.set(socket.id, code);
        socket.join(`room_${code}`);
        return { room, playerId: existing.id, reconnected: true };
      }
    }

    if (room.gameEngine && room.gameEngine.phase !== 'game_over') {
      return {
        error: 'Match already in progress. Cannot join active game.',
        errorCode: 'GAME_IN_PROGRESS',
      };
    }

    if (room.players.size >= room.settings.maxPlayers) {
      return {
        error: `Room is full (max ${room.settings.maxPlayers} players).`,
        errorCode: 'ROOM_FULL',
      };
    }

    if (
      room.settings.gameMode === 'solo' &&
      Array.from(room.players.values()).some((player) => !player.isAi)
    ) {
      return { error: 'Solo rooms allow only one human player.' };
    }

    const player = room.addPlayer(socket.id, playerName, false, token);
    if (!player) {
      return { error: 'Could not join room.', errorCode: 'ROOM_FULL' };
    }

    this.socketToRoom.set(socket.id, code);
    socket.join(`room_${code}`);

    return { room, playerId: player.id };
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.toUpperCase().trim());
  }

  public getRoomBySocket(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  public handleDisconnect(socket: Socket): void {
    const roomId = this.socketToRoom.get(socket.id);
    if (!roomId) return;

    // A socket can join a different room without disconnecting from Socket.IO.
    // Remove its channel membership before broadcasting any old-room updates.
    socket.leave(`room_${roomId}`);
    this.socketToRoom.delete(socket.id);

    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerId = room.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const player = room.players.get(playerId);
    if (!player) return;

    // Ignore stale sockets after a reconnect/takeover: the player is already
    // bound to a newer socket.
    const currentSocketId = room.getSocketIdForPlayer(playerId);
    if (currentSocketId && currentSocketId !== socket.id) return;

    room.disconnectPlayer(playerId, socket.id);

    // If game has not started, remove player entirely
    if (!room.gameEngine || room.gameEngine.phase === 'game_over') {
      room.removePlayer(playerId);

      // If no players remain, clean up room
      if (room.players.size === 0) {
        this.rooms.delete(roomId);
        return;
      }
      room.broadcastLobbyState();
      return;
    }

    // Game is active: notify remaining players, preserve state
    this.io.to(`room_${roomId}`).emit(SOCKET_EVENTS.NOTIFICATION, {
      message: `Player ${player.name} disconnected.`,
      type: 'warning',
    });

    // Host migration: without this, a host disconnect mid-match leaves the
    // room with no one able to restart or manage it.
    if (room.hostId === playerId) {
      const successor = Array.from(room.players.values()).find(
        (p) => !p.isAi && p.connected && p.id !== playerId
      );
      if (successor && room.reassignHost(successor.id)) {
        this.io.to(`room_${roomId}`).emit(SOCKET_EVENTS.NOTIFICATION, {
          message: `${successor.name} is now the host.`,
          type: 'info',
        });
      }
    }

    room.broadcastGameState();
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }
}
