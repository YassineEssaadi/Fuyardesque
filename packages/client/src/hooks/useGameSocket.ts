import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ChatMessage,
  ClientGameState,
  Difficulty,
  Player,
  Role,
  RoomSettings,
  SOCKET_EVENTS,
  TransportType,
} from '@fuyardesque/shared';
import { sound } from '../services/sound';

export interface LobbyState {
  roomId: string;
  hostId: string;
  myPlayerId: string;
  settings: RoomSettings;
  players: Player[];
  isGameStarted: boolean;
}

const PLAYER_TOKEN_KEY = 'fy_player_token';

let cachedPlayerToken: string | null = null;

/**
 * Per-tab identity token used to reclaim the same player after a socket
 * reconnection. sessionStorage survives a reload but is not shared between
 * tabs, which also keeps duplicate sessions easy to detect server-side.
 */
function getPlayerToken(): string {
  if (cachedPlayerToken) return cachedPlayerToken;

  const createToken = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  try {
    cachedPlayerToken = sessionStorage.getItem(PLAYER_TOKEN_KEY) || createToken();
    sessionStorage.setItem(PLAYER_TOKEN_KEY, cachedPlayerToken);
  } catch {
    // Storage can be unavailable in privacy modes; the in-memory token still
    // survives reconnections for the lifetime of the page.
    cachedPlayerToken = cachedPlayerToken || createToken();
  }

  return cachedPlayerToken;
}

export function useGameSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string>('');
  
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const prevRevelationRef = useRef(false);

  // Reconnection bookkeeping: remember the room we belong to and the name we
  // joined with so a dropped socket can silently rejoin mid-match.
  const activeRoomRef = useRef<string | null>(null);
  const playerNameRef = useRef('');
  const rejoinAttemptRef = useRef(false);

  useEffect(() => {
    // Dynamic server URL from env or fallback to origin / localhost:4000
    const serverUrl = import.meta.env.VITE_SERVER_URL || (window.location.hostname === 'localhost' ? 'http://localhost:4000' : '/');
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setSocketId(socket.id || '');

      // Automatic rejoin after a transport drop (not on the first connect).
      if (activeRoomRef.current && playerNameRef.current) {
        rejoinAttemptRef.current = true;
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
          roomId: activeRoomRef.current,
          playerName: playerNameRef.current,
          token: getPlayerToken(),
        });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on(SOCKET_EVENTS.ROOM_STATE, (state: LobbyState) => {
      activeRoomRef.current = state.roomId;
      rejoinAttemptRef.current = false;
      setLobbyState(state);
    });

    socket.on(SOCKET_EVENTS.GAME_STATE, (state: ClientGameState) => {
      setGameState(state);

      // Sound triggers on state changes
      if (state.revelation.active && !prevRevelationRef.current) {
        sound.playSonar();
      }
      prevRevelationRef.current = state.revelation.active;

      if (state.winner) {
        if (state.winner === state.myRole) {
          sound.playVictory();
        } else {
          sound.playDefeat();
        }
      }
    });

    // The host restarted the match: every client returns to the lobby.
    socket.on(SOCKET_EVENTS.RESTART_GAME, () => {
      setGameState(null);
      setChatMessages([]);
    });

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
      sound.playClick();
    });

    socket.on(SOCKET_EVENTS.CHAT_HISTORY, (history: ChatMessage[]) => {
      setChatMessages(history);
    });

    socket.on(SOCKET_EVENTS.NOTIFICATION, ({ message, type }: { message: string; type: string }) => {
      const id = `${Date.now()}_${Math.random()}`;
      setNotifications((prev) => [...prev, { id, message, type: type || 'info' }]);
      if (type === 'alert' || type === 'warning') {
        sound.playAlert();
      }

      // Auto dismiss after 5s
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    });

    socket.on(
      SOCKET_EVENTS.ERROR,
      ({ message, code }: { message: string; code?: string }) => {
        if (rejoinAttemptRef.current) {
          rejoinAttemptRef.current = false;

          // The room vanished (for example the server restarted). Drop the
          // stale session and return the player to the main menu.
          if (code === 'ROOM_NOT_FOUND') {
            activeRoomRef.current = null;
            setLobbyState(null);
            setGameState(null);
            setChatMessages([]);
          }
        }

        setErrorMessage(message);
        sound.playAlert();
        setTimeout(() => setErrorMessage(null), 4000);
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((playerName: string) => {
    playerNameRef.current = playerName;
    activeRoomRef.current = null;
    socketRef.current?.emit(SOCKET_EVENTS.CREATE_ROOM, {
      playerName,
      token: getPlayerToken(),
    });
    sound.playClick();
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    playerNameRef.current = playerName;
    activeRoomRef.current = null;
    socketRef.current?.emit(SOCKET_EVENTS.JOIN_ROOM, {
      roomId,
      playerName,
      token: getPlayerToken(),
    });
    sound.playClick();
  }, []);

  const toggleReady = useCallback((isReady: boolean) => {
    socketRef.current?.emit(SOCKET_EVENTS.TOGGLE_READY, { isReady });
    sound.playClick();
  }, []);

  const assignRole = useCallback((playerId: string, role: Role) => {
    socketRef.current?.emit(SOCKET_EVENTS.ASSIGN_ROLE, { playerId, role });
    sound.playClick();
  }, []);

  const addBot = useCallback((role?: Role, difficulty?: Difficulty) => {
    socketRef.current?.emit(SOCKET_EVENTS.ADD_BOT, { role, difficulty });
    sound.playClick();
  }, []);

  const removeBot = useCallback((botId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.REMOVE_BOT, { botId });
    sound.playClick();
  }, []);

  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    socketRef.current?.emit(SOCKET_EVENTS.UPDATE_SETTINGS, { settings });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit(SOCKET_EVENTS.START_GAME);
    sound.playConfirm();
  }, []);

  const selectMove = useCallback((toStationId: string, transport: TransportType) => {
    socketRef.current?.emit(SOCKET_EVENTS.SELECT_MOVE, { toStationId, transport });
    sound.playClick();
  }, []);

  const confirmMove = useCallback(() => {
    socketRef.current?.emit(SOCKET_EVENTS.CONFIRM_MOVE);
    sound.playConfirm();
  }, []);

  const fugitiveDecision = useCallback((choice: 'end' | 'extend') => {
    socketRef.current?.emit(SOCKET_EVENTS.FUGITIVE_DECISION, { choice });
    sound.playConfirm();
  }, []);

  const restartGame = useCallback(() => {
    socketRef.current?.emit(SOCKET_EVENTS.RESTART_GAME);
  }, []);

  const sendChat = useCallback((text: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.SEND_CHAT, { text });
  }, []);

  return {
    connected,
    socketId,
    lobbyState,
    gameState,
    chatMessages,
    notifications,
    errorMessage,
    createRoom,
    joinRoom,
    toggleReady,
    assignRole,
    addBot,
    removeBot,
    updateSettings,
    startGame,
    selectMove,
    confirmMove,
    fugitiveDecision,
    restartGame,
    sendChat,
  };
}
