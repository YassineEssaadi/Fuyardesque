import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager';
import { Room } from '../rooms/Room';
import {
  Difficulty,
  EXTENSION_DURATION_OPTIONS,
  GameMode,
  PHASE_DURATION_OPTIONS,
  REVEAL_DURATION_OPTIONS,
  REVEAL_INTERVAL_OPTIONS,
  Role,
  RoomSettings,
  SOCKET_EVENTS,
  SURVIVAL_DURATION_OPTIONS,
  TransportType,
} from '@fuyardesque/shared';

const VALID_ROLES: Role[] = ['fugitive', 'pursuer'];
const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
const VALID_TRANSPORTS: TransportType[] = ['taxi', 'bus', 'metro'];
const VALID_GAME_MODES: GameMode[] = ['solo', 'multiplayer', 'mixed'];

function normalizeName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, 24) || fallback;
}

function normalizeToken(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const token = value.trim();
  return token.length >= 8 && token.length <= 128 ? token : undefined;
}

function isLobbyOpen(room: Room): boolean {
  return !room.gameEngine || room.gameEngine.phase === 'game_over';
}

export function setupSocketHandlers(io: Server, roomManager: RoomManager) {
  const getContext = (socket: Socket) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return null;

    const playerId = room.getPlayerIdBySocket(socket.id);
    if (!playerId) return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    return { room, playerId, player };
  };

  const fail = (socket: Socket, message: string) => {
    socket.emit(SOCKET_EVENTS.ERROR, { message });
  };

  /** Host-only lobby mutations are rejected once a match is running. */
  const requireLobbyHost = (socket: Socket) => {
    const context = getContext(socket);
    if (!context) return null;

    if (context.room.hostId !== context.playerId) {
      fail(socket, 'Only the host can do that.');
      return null;
    }

    if (!isLobbyOpen(context.room)) {
      fail(socket, 'This action is only available in the lobby.');
      return null;
    }

    return context;
  };

  io.on('connection', (socket: Socket) => {
    // -------------------------------------------------------------
    // LOBBY / ROOM MANAGEMENT
    // -------------------------------------------------------------
    socket.on(
      SOCKET_EVENTS.CREATE_ROOM,
      (payload?: { playerName?: string; token?: string }) => {
        const name = normalizeName(payload?.playerName, 'Detective');
        const token = normalizeToken(payload?.token);
        const room = roomManager.createRoom(socket, name, token);

        room.broadcastLobbyState();
      }
    );

    socket.on(
      SOCKET_EVENTS.JOIN_ROOM,
      (payload?: { roomId?: string; playerName?: string; token?: string }) => {
        const name = normalizeName(payload?.playerName, 'Special Agent');
        const roomId = typeof payload?.roomId === 'string' ? payload.roomId : '';
        const token = normalizeToken(payload?.token);

        const result = roomManager.joinRoom(socket, roomId, name, token);

        if (result.error || !result.room || !result.playerId) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: result.error || 'Failed to join',
            code: result.errorCode,
          });
          return;
        }

        const { room, playerId, reconnected } = result;

        room.broadcastLobbyState();
        room.sendChatHistory(socket, playerId);

        if (reconnected && room.gameEngine) {
          room.broadcastGameState();
          socket.emit(SOCKET_EVENTS.NOTIFICATION, {
            message: 'Reconnected to the match.',
            type: 'info',
          });
        }
      }
    );

    socket.on(SOCKET_EVENTS.TOGGLE_READY, (payload?: { isReady?: boolean }) => {
      const context = getContext(socket);
      if (!context || !isLobbyOpen(context.room)) return;

      context.room.setReady(context.playerId, payload?.isReady === true);
      context.room.broadcastLobbyState();
    });

    socket.on(
      SOCKET_EVENTS.ASSIGN_ROLE,
      (payload?: { playerId?: string; role?: Role }) => {
        const context = requireLobbyHost(socket);
        if (!context) return;

        const role = payload?.role;
        if (!role || !VALID_ROLES.includes(role)) {
          fail(socket, 'Invalid role.');
          return;
        }

        if (context.room.setRole(payload?.playerId || '', role)) {
          context.room.broadcastLobbyState();
        }
      }
    );

    socket.on(
      SOCKET_EVENTS.ADD_BOT,
      (payload?: { role?: Role; difficulty?: Difficulty }) => {
        const context = requireLobbyHost(socket);
        if (!context) return;

        const role = payload?.role;
        if (role !== undefined && !VALID_ROLES.includes(role)) {
          fail(socket, 'Invalid bot role.');
          return;
        }

        const difficulty = payload?.difficulty;
        if (difficulty !== undefined && !VALID_DIFFICULTIES.includes(difficulty)) {
          fail(socket, 'Invalid bot difficulty.');
          return;
        }

        if (context.room.settings.gameMode === 'multiplayer') {
          fail(socket, 'AI players are not available in Multiplayer mode.');
          return;
        }

        const bot = context.room.addBot(role, difficulty || 'normal');
        if (bot) {
          context.room.broadcastLobbyState();
        }
      }
    );

    socket.on(SOCKET_EVENTS.REMOVE_BOT, (payload?: { botId?: string }) => {
      const context = requireLobbyHost(socket);
      if (!context) return;

      const botId = payload?.botId;
      if (typeof botId !== 'string') return;

      if (context.room.removeBot(botId)) {
        context.room.broadcastLobbyState();
      }
    });

    socket.on(
      SOCKET_EVENTS.UPDATE_SETTINGS,
      (payload?: { settings?: Partial<RoomSettings> }) => {
        const context = requireLobbyHost(socket);
        if (!context) return;

        const settings = payload?.settings;
        if (!settings || typeof settings !== 'object') return;

        // Merge safe settings
        if (
          typeof settings.phaseDuration === 'number' &&
          PHASE_DURATION_OPTIONS.includes(settings.phaseDuration)
        ) {
          context.room.settings.phaseDuration = settings.phaseDuration;
        }
        if (
          typeof settings.revealInterval === 'number' &&
          REVEAL_INTERVAL_OPTIONS.includes(settings.revealInterval)
        ) {
          context.room.settings.revealInterval = settings.revealInterval;
        }
        if (
          typeof settings.survivalDuration === 'number' &&
          SURVIVAL_DURATION_OPTIONS.includes(settings.survivalDuration)
        ) {
          context.room.settings.survivalDuration = settings.survivalDuration;
        }
        if (
          typeof settings.extensionDuration === 'number' &&
          EXTENSION_DURATION_OPTIONS.includes(settings.extensionDuration)
        ) {
          context.room.settings.extensionDuration = settings.extensionDuration;
        }
        if (
          typeof settings.revealDuration === 'number' &&
          REVEAL_DURATION_OPTIONS.includes(settings.revealDuration)
        ) {
          context.room.settings.revealDuration = settings.revealDuration;
        }
        if (settings.gameMode && VALID_GAME_MODES.includes(settings.gameMode)) {
          context.room.settings.gameMode = settings.gameMode;
        }
        if (context.room.settings.gameMode === 'solo') {
          context.room.settings.unlimitedTime = false;
        } else if (typeof settings.unlimitedTime === 'boolean') {
          context.room.settings.unlimitedTime = settings.unlimitedTime;
        }

        context.room.broadcastLobbyState();
      }
    );

    // -------------------------------------------------------------
    // GAMEPLAY
    // -------------------------------------------------------------
    socket.on(SOCKET_EVENTS.START_GAME, () => {
      const context = getContext(socket);
      if (!context) return;

      if (context.room.hostId !== context.playerId) {
        fail(socket, 'Only the host can start the match.');
        return;
      }

      const res = context.room.startGame();
      if (!res.success) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: res.error || 'Cannot start match.' });
      }
    });

    socket.on(
      SOCKET_EVENTS.SELECT_MOVE,
      (payload?: { toStationId?: string; transport?: TransportType }) => {
        const context = getContext(socket);
        if (!context || !context.room.gameEngine) return;

        const toStationId = payload?.toStationId;
        const transport = payload?.transport;
        if (typeof toStationId !== 'string' || !transport || !VALID_TRANSPORTS.includes(transport)) {
          fail(socket, 'Illegal movement destination or transport.');
          return;
        }

        const success = context.room.gameEngine.submitMove(
          context.playerId,
          toStationId,
          transport
        );
        if (!success) {
          fail(socket, 'Illegal movement destination or transport.');
        }
      }
    );

    socket.on(SOCKET_EVENTS.CONFIRM_MOVE, () => {
      const context = getContext(socket);
      if (!context || !context.room.gameEngine) return;

      context.room.gameEngine.confirmMove(context.playerId);
    });

    socket.on(SOCKET_EVENTS.VOTE_END_MATCH, () => {
      const context = getContext(socket);
      if (!context || !context.room.gameEngine) return;

      if (!context.room.gameEngine.toggleEndVote(context.playerId)) {
        fail(socket, 'You cannot vote to end this match.');
      }
    });

    socket.on(SOCKET_EVENTS.FUGITIVE_DECISION, (payload?: { choice?: 'end' | 'extend' }) => {
      const context = getContext(socket);
      if (!context || !context.room.gameEngine) return;

      if (context.player.role !== 'fugitive') {
        fail(socket, 'Only the Fugitive can decide on extension.');
        return;
      }

      const choice = payload?.choice;
      if (choice !== 'end' && choice !== 'extend') {
        fail(socket, 'Invalid decision.');
        return;
      }

      context.room.gameEngine.handleFugitiveDecision(choice);
    });

    socket.on(SOCKET_EVENTS.RESTART_GAME, () => {
      const context = getContext(socket);
      if (!context) return;

      if (context.room.hostId !== context.playerId) {
        fail(socket, 'Only the host can restart the match.');
        return;
      }

      if (!context.room.gameEngine || context.room.gameEngine.phase !== 'game_over') {
        fail(socket, 'The match must be over before restarting.');
        return;
      }

      // Stop every timer before discarding the engine.
      context.room.gameEngine.destroy();
      context.room.gameEngine = null;
      context.room.clearChat();

      // Tell every client to drop its finished game state, not just the host.
      io.to(`room_${context.room.id}`).emit(SOCKET_EVENTS.RESTART_GAME);
      context.room.broadcastLobbyState();
    });

    // -------------------------------------------------------------
    // TEAM CHAT
    // -------------------------------------------------------------
    socket.on(SOCKET_EVENTS.SEND_CHAT, (payload?: { text?: string }) => {
      const context = getContext(socket);
      if (!context) return;

      if (typeof payload?.text !== 'string') return;
      context.room.addChatMessage(context.playerId, payload.text);
    });

    // -------------------------------------------------------------
    // DISCONNECTION
    // -------------------------------------------------------------
    socket.on('disconnect', () => {
      roomManager.handleDisconnect(socket);
    });
  });
}
