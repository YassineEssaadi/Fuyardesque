export type TransportType = 'taxi' | 'bus' | 'metro';
export type Role = 'fugitive' | 'pursuer';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type GameMode = 'solo' | 'multiplayer' | 'mixed';

export interface Station {
  id: string;
  name: string;
  district: string;
  x: number;
  y: number;
}

export interface Connection {
  from: string;
  to: string;
  transport: TransportType;
}

export interface CityMap {
  id: string;
  name: string;
  stations: Station[];
  connections: Connection[];
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  isHost: boolean;
  isAi: boolean;
  isReady: boolean;
  connected: boolean;
  difficulty?: Difficulty;
  color: string;
  currentStationId: string;
}

export interface RoomSettings {
  minPlayers: number;
  maxPlayers: number;
  phaseDuration: number; // default 15s
  survivalDuration: number; // default 510s (8m 30s)
  extensionDuration: number; // default 300s (5m)
  revealInterval: number; // default 90s
  revealDuration: number; // default 5s
  gameMode: GameMode;
}

export type GamePhase = 'lobby' | 'planning' | 'resolving' | 'fugitive_decision' | 'game_over';

export interface PendingMove {
  playerId: string;
  toStationId: string;
  transport: TransportType;
  locked: boolean;
}

export interface MovementRecord {
  phase: number;
  playerId: string;
  transport: TransportType;
  fromStationId: string;
  toStationId: string;
  timestamp: number;
}

export interface FugitivePublicRecord {
  moveNumber: number;
  phase: number;
  transport: TransportType;
  revealedStationId?: string;
  timestamp: number;
}

export interface RevelationState {
  active: boolean;
  stationId: string | null;
  expiresAt: number;
  nextRevealIn: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  team: Role;
  text: string;
  timestamp: number;
}

export interface ClientPlayerState {
  id: string;
  name: string;
  role: Role;
  isHost: boolean;
  isAi: boolean;
  isReady: boolean;
  connected: boolean;
  difficulty?: Difficulty;
  color: string;
  currentStationId: string | null; // NULL for Fugitive when viewed by Pursuer
  hasLockedMove: boolean;
}

export interface ClientGameState {
  roomId: string;
  phase: GamePhase;
  phaseTimeRemaining: number;
  survivalTimeRemaining: number;
  currentPhaseNumber: number;
  extensionUsed: boolean;
  settings: RoomSettings;
  players: ClientPlayerState[];
  myRole: Role;
  myPlayerId: string;
  myCurrentStationId: string;
  myPendingMove: PendingMove | null;
  revelation: {
    active: boolean;
    stationId: string | null;
    nextRevealIn: number;
  };
  lastKnownFugitiveStationId: string | null;
  lastFugitiveTransport: TransportType | null;
  fugitiveHistory: FugitivePublicRecord[];
  winner: Role | null;
  winReason: 'captured' | 'survived' | 'extension_survived' | 'host_ended' | null;
  captureStationId: string | null;
}
