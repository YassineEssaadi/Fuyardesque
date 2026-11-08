import { RoomSettings, TransportType } from './types';

export const DEFAULT_SETTINGS: RoomSettings = {
  minPlayers: 2,
  maxPlayers: 8,
  phaseDuration: 15, // documented default: 15 seconds per simultaneous phase
  survivalDuration: 510, // 8 minutes 30 seconds
  extensionDuration: 300, // 5 minutes
  revealInterval: 90, // Reveal every 90 seconds
  revealDuration: 5, // Display for 5 seconds
  gameMode: 'mixed',
};

export const PHASE_DURATION_OPTIONS = [15, 20, 30, 45, 60];
export const SURVIVAL_DURATION_OPTIONS = [180, 300, 510, 600];
export const EXTENSION_DURATION_OPTIONS = [120, 180, 300, 600];
export const REVEAL_INTERVAL_OPTIONS = [30, 60, 90, 120, 180];
export const REVEAL_DURATION_OPTIONS = [3, 5, 8, 10];
export const FUGITIVE_LOCATION_REVEAL_INTERVAL = 3;

export const TRANSPORT_CONFIG: Record<TransportType, { label: string; color: string; bg: string; borderColor: string }> = {
  taxi: {
    label: 'Taxi',
    color: '#FACC15', // Yellow
    bg: 'rgba(250, 204, 21, 0.2)',
    borderColor: '#EAB308',
  },
  bus: {
    label: 'Bus',
    color: '#38BDF8', // Blue
    bg: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#0284C7',
  },
  metro: {
    label: 'Metro',
    color: '#4ADE80', // Green
    bg: 'rgba(74, 222, 128, 0.2)',
    borderColor: '#16A34A',
  },
};

export const SOCKET_EVENTS = {
  // Room / Lobby
  CREATE_ROOM: 'room:create',
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  ROOM_STATE: 'room:state',
  UPDATE_SETTINGS: 'room:update_settings',
  TOGGLE_READY: 'room:toggle_ready',
  ASSIGN_ROLE: 'room:assign_role',
  ADD_BOT: 'room:add_bot',
  REMOVE_BOT: 'room:remove_bot',
  START_GAME: 'game:start',
  
  // Gameplay
  SELECT_MOVE: 'game:select_move',
  CONFIRM_MOVE: 'game:confirm_move',
  GAME_STATE: 'game:state',
  FUGITIVE_DECISION: 'game:fugitive_decision',
  RESTART_GAME: 'game:restart',

  // Chat
  SEND_CHAT: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
  CHAT_HISTORY: 'chat:history',

  // System
  ERROR: 'system:error',
  NOTIFICATION: 'system:notification',
} as const;
