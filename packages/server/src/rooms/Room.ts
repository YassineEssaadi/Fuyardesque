import {
  ChatMessage,
  DEFAULT_SETTINGS,
  Difficulty,
  Player,
  Role,
  RoomSettings,
  SOCKET_EVENTS,
  STATIONS,
} from '@fuyardesque/shared';
import { GameEngine } from '../game/GameEngine';
import { BotAgent } from '../ai/BotAgent';
import { Server, Socket } from 'socket.io';

export class Room {
  public id: string; // 6-character invitation code
  public hostId: string;
  public settings: RoomSettings;
  public players: Map<string, Player> = new Map();
  public gameEngine: GameEngine | null = null;
  public fugitiveChat: ChatMessage[] = [];
  public pursuerChat: ChatMessage[] = [];

  /**
   * Stable identity maps. Player ids never change for the lifetime of a room,
   * so a reconnecting socket can take over the same player instead of being
   * treated as a new one. Tokens are server-side only and never serialized
   * into lobby/game state.
   */
  private playerTokens: Map<string, string> = new Map();
  private tokenToPlayerId: Map<string, string> = new Map();
  private playerSocketIds: Map<string, string> = new Map();

  private io: Server;

  constructor(id: string, hostId: string, hostName: string, io: Server, token?: string) {
    this.id = id;
    this.hostId = hostId;
    this.io = io;
    this.settings = { ...DEFAULT_SETTINGS };

    // Add host as first player (default role: fugitive)
    this.addPlayer(hostId, hostName, true, token);
  }

  public addPlayer(
    id: string,
    name: string,
    isHost: boolean = false,
    token?: string
  ): Player | null {
    if (this.players.size >= this.settings.maxPlayers) {
      return null;
    }

    // Determine initial role: if no fugitive, assign fugitive, otherwise pursuer
    const hasFugitive = Array.from(this.players.values()).some((p) => p.role === 'fugitive');
    const role: Role = hasFugitive ? 'pursuer' : 'fugitive';

    const colors = ['#0ea5e9', '#38bdf8', '#818cf8', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308'];
    const color = colors[this.players.size % colors.length];

    const player: Player = {
      id,
      name,
      role,
      isHost,
      isAi: false,
      isReady: isHost, // Host is ready by default
      connected: true,
      color,
      currentStationId: '',
    };

    this.players.set(id, player);
    this.playerSocketIds.set(player.id, id);
    if (token) {
      this.playerTokens.set(player.id, token);
      this.tokenToPlayerId.set(token, player.id);
    }
    return player;
  }

  public addBot(role?: Role, difficulty: Difficulty = 'normal'): Player | null {
    if (this.players.size >= this.settings.maxPlayers) return null;

    const botNumber = Array.from(this.players.values()).filter((p) => p.isAi).length + 1;
    const botId = `bot_${Date.now()}_${botNumber}`;
    const botRole: Role = role || 'pursuer';

    const colors = ['#64748b', '#94a3b8', '#cbd5e1'];
    const color = colors[botNumber % colors.length];

    const botPlayer: Player = {
      id: botId,
      name: `Agent ${botRole === 'fugitive' ? 'Ghost' : 'Delta'}-${botNumber} [AI]`,
      role: botRole,
      isHost: false,
      isAi: true,
      isReady: true,
      connected: true,
      difficulty,
      color,
      currentStationId: '',
    };

    this.players.set(botId, botPlayer);
    return botPlayer;
  }

  public removeBot(botId: string): boolean {
    const player = this.players.get(botId);
    if (!player || !player.isAi) return false;
    return this.players.delete(botId);
  }

  public removePlayer(playerId: string): void {
    const token = this.playerTokens.get(playerId);
    if (token) {
      this.playerTokens.delete(playerId);
      this.tokenToPlayerId.delete(token);
    }
    this.playerSocketIds.delete(playerId);
    this.players.delete(playerId);

    // If host left, reassign host deterministically
    if (this.hostId === playerId) {
      const remainingHuman = Array.from(this.players.values()).find((p) => !p.isAi);
      if (remainingHuman) {
        remainingHuman.isHost = true;
        this.hostId = remainingHuman.id;
      }
    }
  }

  public findPlayerByToken(token: string): Player | undefined {
    const playerId = this.tokenToPlayerId.get(token);
    return playerId ? this.players.get(playerId) : undefined;
  }

  public getSocketIdForPlayer(playerId: string): string | undefined {
    return this.playerSocketIds.get(playerId);
  }

  public getPlayerIdBySocket(socketId: string): string | undefined {
    for (const [playerId, currentSocketId] of this.playerSocketIds.entries()) {
      if (currentSocketId === socketId) return playerId;
    }
    return undefined;
  }

  /** Rebind a returning player to their new socket without changing their id. */
  public reconnectPlayer(playerId: string, socketId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    this.playerSocketIds.set(playerId, socketId);
    player.connected = true;
    return true;
  }

  /** Clear a disconnected socket binding while retaining the player's stable token. */
  public disconnectPlayer(playerId: string, socketId: string): boolean {
    const player = this.players.get(playerId);
    if (!player || this.playerSocketIds.get(playerId) !== socketId) return false;

    this.playerSocketIds.delete(playerId);
    player.connected = false;
    return true;
  }

  /** Promote a connected human to host after the previous host leaves. */
  public reassignHost(playerId: string): boolean {
    const nextHost = this.players.get(playerId);
    if (!nextHost || nextHost.isAi) return false;

    for (const player of this.players.values()) {
      player.isHost = player.id === playerId;
    }
    this.hostId = playerId;
    return true;
  }

  public setReady(playerId: string, isReady: boolean) {
    const player = this.players.get(playerId);
    if (player && !player.isHost) {
      player.isReady = isReady;
    }
  }

  public setRole(playerId: string, newRole: Role): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    // If making this player the fugitive, ensure only 1 fugitive exists
    if (newRole === 'fugitive') {
      for (const p of this.players.values()) {
        if (p.role === 'fugitive' && p.id !== playerId) {
          p.role = 'pursuer';
        }
      }
    }

    player.role = newRole;
    return true;
  }

  public startGame(): { success: boolean; error?: string } {
    if (this.gameEngine && this.gameEngine.phase !== 'game_over') {
      return { success: false, error: 'Match already in progress.' };
    }

    const activePlayers = Array.from(this.players.values());
    if (activePlayers.length < this.settings.minPlayers) {
      return { success: false, error: `Minimum ${this.settings.minPlayers} players required to start.` };
    }

    const fugitives = activePlayers.filter((p) => p.role === 'fugitive');
    if (fugitives.length !== 1) {
      return { success: false, error: 'Exactly 1 Fugitive required.' };
    }

    const pursuers = activePlayers.filter((p) => p.role === 'pursuer');
    if (pursuers.length < 1) {
      return { success: false, error: 'At least 1 Pursuer required.' };
    }

    const humanCount = activePlayers.filter((player) => !player.isAi).length;
    const botCount = activePlayers.length - humanCount;
    if (this.settings.gameMode === 'solo' && (humanCount !== 1 || botCount < 1)) {
      return {
        success: false,
        error: 'Solo mode requires exactly one human and at least one AI player.',
      };
    }
    if (this.settings.gameMode === 'multiplayer' && botCount > 0) {
      return { success: false, error: 'Multiplayer mode does not allow AI players.' };
    }

    // Clean up a finished engine before replacing it so no stray timers remain.
    if (this.gameEngine) {
      this.gameEngine.destroy();
    }

    // Team chat must never carry over into a new match.
    this.clearChat();

    // Initialize GameEngine
    this.gameEngine = new GameEngine(
      this.id,
      this.settings,
      activePlayers,
      {
        onStateUpdate: () => this.broadcastGameState(),
        onPhaseResolved: (engine, phaseNum) => {
          // Only report a transport if the Fugitive actually moved in THIS
          // round. Otherwise the previous round's transport would be repeated.
          const movement = engine.fugitiveHistory.find((record) => record.phase === phaseNum);
          const transportLabel = movement ? movement.transport.toUpperCase() : null;
          const alertMsg = movement
            ? `🚨 INTEL REPORT: In Round ${phaseNum}, the Fugitive traveled via ${transportLabel}!`
            : `🚨 INTEL REPORT: In Round ${phaseNum}, no movement was detected.`;

          // Broadcast high-priority notification to all players
          this.io.to(`room_${this.id}`).emit(SOCKET_EVENTS.NOTIFICATION, {
            message: alertMsg,
            type: 'warning',
          });

          // Also inject an authoritative tactical intel message into Pursuer Team Chat
          const systemMsg: ChatMessage = {
            id: `sys_${Date.now()}_${phaseNum}`,
            senderId: 'intel_hq',
            senderName: '★ HQ SURVEILLANCE',
            team: 'pursuer',
            text: movement
              ? `Round ${phaseNum}: Fugitive boarded a ${transportLabel}. Destination remains unknown.`
              : `Round ${phaseNum}: No movement detected. Fugitive held position.`,
            timestamp: Date.now(),
          };
          this.pursuerChat.push(systemMsg);
          for (const p of this.players.values()) {
            if (p.role === 'pursuer' && !p.isAi) {
              const socketId = this.getSocketIdForPlayer(p.id);
              const sock = socketId ? this.io.sockets.sockets.get(socketId) : undefined;
              if (sock) {
                sock.emit(SOCKET_EVENTS.CHAT_MESSAGE, systemMsg);
              }
            }
          }

        },
        onTurnChanged: () => this.handleBotMoves(),
        onGameOver: (engine, winner, reason) => {
          this.io.to(`room_${this.id}`).emit(SOCKET_EVENTS.NOTIFICATION, {
            message: `GAME OVER: ${winner.toUpperCase()}S WIN! (${reason})`,
            type: 'alert',
          });
          this.broadcastGameState();
        },
        onFugitiveDecisionNeeded: () => {
          this.io.to(`room_${this.id}`).emit(SOCKET_EVENTS.NOTIFICATION, {
            message: 'Survival clock expired! The Fugitive is deciding their next move...',
            type: 'warning',
          });
          this.broadcastGameState();
          this.handleBotFugitiveDecision();
        },
        onNotification: (message, type) => {
          this.io.to(`room_${this.id}`).emit(SOCKET_EVENTS.NOTIFICATION, { message, type });
        },
      }
    );

    this.gameEngine.start();
    this.broadcastGameState();

    this.handleBotStartingPositions();

    return { success: true };
  }

  private handleBotStartingPositions() {
    if (!this.gameEngine || this.gameEngine.phase !== 'setup') return;

    for (const player of this.players.values()) {
      if (!player.isAi) continue;

      const selectedStations = new Set(
        Array.from(this.gameEngine.pendingMoves.values()).map((move) => move.toStationId)
      );
      const station = STATIONS.find((candidate) => !selectedStations.has(candidate.id));
      if (!station) break;

      this.gameEngine.submitMove(player.id, station.id, 'taxi');
      this.gameEngine.confirmMove(player.id);
    }
  }

  public handleBotMoves() {
    if (!this.gameEngine || this.gameEngine.phase !== 'planning' || !this.gameEngine.turnRole) return;

    // Give bot decision a slight humanized delay (800ms - 2000ms)
    setTimeout(() => {
      if (!this.gameEngine || this.gameEngine.phase !== 'planning' || !this.gameEngine.turnRole) return;

      for (const player of this.players.values()) {
        if (player.isAi && player.role === this.gameEngine.turnRole) {
          const clientState = this.gameEngine.getClientState(player.id);
          const decision = BotAgent.makeMove(clientState, player.id);
          if (decision) {
            this.gameEngine.submitMove(player.id, decision.toStationId, decision.transport);
            this.gameEngine.confirmMove(player.id);
          }
        }
      }
    }, 1200);
  }

  /**
   * The Fugitive decision prompt is driven by a socket event, so an AI
   * Fugitive would otherwise never answer and the match would hang. Bots
   * answer on their own after a short humanized delay. (The engine also has
   * an AFK timeout for human players, so this path is a convenience rather
   * than the only safeguard.)
   */
  public handleBotFugitiveDecision() {
    if (!this.gameEngine || this.gameEngine.phase !== 'fugitive_decision') return;

    const fugitive = Array.from(this.gameEngine.players.values()).find(
      (p) => p.role === 'fugitive'
    );
    if (!fugitive || !fugitive.isAi) return;

    setTimeout(() => {
      if (!this.gameEngine || this.gameEngine.phase !== 'fugitive_decision') return;
      // Claiming the win immediately is the rational choice for the bot.
      this.gameEngine.handleFugitiveDecision('end');
    }, 1200);
  }

  /** Clear both team channels between matches to prevent cross-match leaks. */
  public clearChat(): void {
    this.fugitiveChat = [];
    this.pursuerChat = [];
  }

  public addChatMessage(senderId: string, text: string): ChatMessage | null {
    const player = this.players.get(senderId);
    if (!player) return null;

    const trimmed = text.trim().slice(0, 200);
    if (!trimmed) return null;

    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: player.id,
      senderName: player.name,
      team: player.role,
      text: trimmed,
      timestamp: Date.now(),
    };

    if (player.role === 'fugitive') {
      this.fugitiveChat.push(msg);
      // Emit exclusively to the Fugitive socket
      const socketId = this.getSocketIdForPlayer(player.id);
      const socket = socketId ? this.io.sockets.sockets.get(socketId) : undefined;
      if (socket) {
        socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, msg);
      }
    } else {
      this.pursuerChat.push(msg);
      // Emit exclusively to Pursuer sockets
      for (const p of this.players.values()) {
        if (p.role === 'pursuer' && !p.isAi) {
          const socketId = this.getSocketIdForPlayer(p.id);
          const sock = socketId ? this.io.sockets.sockets.get(socketId) : undefined;
          if (sock) {
            sock.emit(SOCKET_EVENTS.CHAT_MESSAGE, msg);
          }
        }
      }
    }

    return msg;
  }

  public sendChatHistory(socket: Socket, playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    const history = player.role === 'fugitive' ? this.fugitiveChat : this.pursuerChat;
    socket.emit(SOCKET_EVENTS.CHAT_HISTORY, history);
  }

  /**
   * Broadcast state to each individual socket using role-filtered serialization
   */
  public broadcastGameState() {
    if (!this.gameEngine) return;

    for (const player of this.players.values()) {
      if (!player.isAi) {
        const socketId = this.getSocketIdForPlayer(player.id);
        const socket = socketId ? this.io.sockets.sockets.get(socketId) : undefined;
        if (socket) {
          const clientState = this.gameEngine.getClientState(player.id);
          socket.emit(SOCKET_EVENTS.GAME_STATE, clientState);
        }
      }
    }
  }

  public getLobbyState() {
    return {
      roomId: this.id,
      hostId: this.hostId,
      settings: this.settings,
      players: Array.from(this.players.values()),
      isGameStarted: this.gameEngine !== null && this.gameEngine.phase !== 'game_over',
    };
  }

  /**
   * Lobby state is sent per-socket so each client learns its own stable player
   * id (which differs from the socket id after a reconnection).
   */
  public broadcastLobbyState() {
    const lobbyState = this.getLobbyState();
    for (const player of this.players.values()) {
      if (player.isAi) continue;
      const socketId = this.getSocketIdForPlayer(player.id);
      const socket = socketId ? this.io.sockets.sockets.get(socketId) : undefined;
      if (socket) {
        socket.emit(SOCKET_EVENTS.ROOM_STATE, { ...lobbyState, myPlayerId: player.id });
      }
    }
  }
}
