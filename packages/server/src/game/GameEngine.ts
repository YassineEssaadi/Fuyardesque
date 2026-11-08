import {
  ClientGameState,
  ClientPlayerState,
  FugitivePublicRecord,
  FUGITIVE_LOCATION_REVEAL_INTERVAL,
  GamePhase,
  MovementRecord,
  PendingMove,
  Player,
  Role,
  RoomSettings,
  STARTING_POSITION_DURATION_SECONDS,
  TransportType,
  STATIONS,
  isValidMove,
} from '@fuyardesque/shared';

/**
 * How long the Fugitive has to answer the survival-expired prompt before the
 * server awards survival victory automatically. This prevents an AFK or
 * disconnected Fugitive from freezing the match at the decision screen.
 */
export const FUGITIVE_DECISION_TIMEOUT_MS = 30_000;

export interface GameEngineCallbacks {
  onStateUpdate: (engine: GameEngine) => void;
  onPhaseResolved: (engine: GameEngine, phaseNumber: number) => void;
  onTurnChanged: (engine: GameEngine) => void;
  onGameOver: (engine: GameEngine, winner: Role | null, reason: string) => void;
  onFugitiveDecisionNeeded: (engine: GameEngine) => void;
  onNotification: (message: string, type?: 'info' | 'warning' | 'alert') => void;
}

export class GameEngine {
  public roomId: string;
  public settings: RoomSettings;
  public phase: GamePhase = 'setup';
  public turnRole: Role | null = null;
  public currentPhaseNumber: number = 1;
  public phaseTimeRemaining: number;
  public survivalTimeRemaining: number;
  public extensionUsed: boolean = false;
  
  public players: Map<string, Player> = new Map();
  public pendingMoves: Map<string, PendingMove> = new Map();
  public fugitiveHistory: MovementRecord[] = [];
  
  // Revelation system
  public revelationActive: boolean = false;
  public revelationStationId: string | null = null;
  public revelationExpiresAt: number = 0;
  public nextRevealIn: number;
  public lastKnownFugitiveStationId: string | null = null;
  public lastFugitiveTransport: TransportType | null = null;

  public winner: Role | null = null;
  public winReason:
    | 'captured'
    | 'survived'
    | 'extension_survived'
    | 'host_ended'
    | 'vote_ended'
    | null = null;
  public captureStationId: string | null = null;
  private endVotes: Set<string> = new Set();

  /** Configurable for tests; production uses FUGITIVE_DECISION_TIMEOUT_MS. */
  public fugitiveDecisionTimeoutMs: number = FUGITIVE_DECISION_TIMEOUT_MS;

  private phaseTimerInterval: NodeJS.Timeout | null = null;
  private matchTimerInterval: NodeJS.Timeout | null = null;
  private fugitiveDecisionTimeout: NodeJS.Timeout | null = null;
  private callbacks: GameEngineCallbacks;

  constructor(roomId: string, settings: RoomSettings, players: Player[], callbacks: GameEngineCallbacks) {
    this.roomId = roomId;
    this.settings = { ...settings };
    this.callbacks = callbacks;
    this.phaseTimeRemaining = STARTING_POSITION_DURATION_SECONDS;
    this.survivalTimeRemaining = settings.survivalDuration;
    this.nextRevealIn = settings.revealInterval;

    for (const player of players) {
      player.currentStationId = '';
      this.players.set(player.id, player);
    }
  }

  public start() {
    this.phase = 'setup';
    this.turnRole = null;
    this.phaseTimeRemaining = STARTING_POSITION_DURATION_SECONDS;
    this.startPhaseTimer();
    this.callbacks.onStateUpdate(this);
  }

  private beginTurn(role: Role) {
    this.phase = 'planning';
    this.turnRole = role;
    this.startPhaseTimer();
  }

  private startMatchTimer() {
    if (this.matchTimerInterval) clearInterval(this.matchTimerInterval);
    if (this.settings.unlimitedTime) return;

    this.matchTimerInterval = setInterval(() => {
      if (this.phase === 'game_over' || this.phase === 'fugitive_decision') {
        return;
      }

      this.survivalTimeRemaining = Math.max(0, this.survivalTimeRemaining - 1);
      this.nextRevealIn = Math.max(0, this.nextRevealIn - 1);

      // Check periodic revelation
      if (this.nextRevealIn === 0 && !this.revelationActive) {
        this.triggerRevelation();
      }

      // Check if active revelation expired
      if (this.revelationActive && Date.now() >= this.revelationExpiresAt) {
        this.revelationActive = false;
        this.revelationStationId = null;
        this.callbacks.onStateUpdate(this);
      }

      // Check survival timer expiration (8:30 or 5m extension)
      if (this.survivalTimeRemaining === 0) {
        this.handleTimerExpired();
      }
    }, 1000);
  }

  private startPhaseTimer() {
    if (this.phaseTimerInterval) clearInterval(this.phaseTimerInterval);
    if (this.settings.unlimitedTime) {
      this.phaseTimeRemaining = 0;
      this.phaseTimerInterval = null;
      return;
    }

    this.phaseTimeRemaining =
      this.phase === 'setup' ? STARTING_POSITION_DURATION_SECONDS : this.settings.phaseDuration;
    this.phaseTimerInterval = setInterval(() => {
      if (this.phase !== 'setup' && this.phase !== 'planning') return;

      this.phaseTimeRemaining = Math.max(0, this.phaseTimeRemaining - 1);

      if (this.phaseTimeRemaining === 0) {
        // Setup assigns unclaimed stations; timed-out turns leave players in place.
        this.resolvePhase();
      } else {
        this.callbacks.onStateUpdate(this);
      }
    }, 1000);
  }

  private triggerRevelation() {
    if (this.settings.unlimitedTime) return;
    const fugitive = Array.from(this.players.values()).find((p) => p.role === 'fugitive');
    if (!fugitive) return;

    this.revelationActive = true;
    this.revelationStationId = fugitive.currentStationId;
    this.lastKnownFugitiveStationId = fugitive.currentStationId;
    this.revelationExpiresAt = Date.now() + this.settings.revealDuration * 1000;
    this.nextRevealIn = this.settings.revealInterval;

    this.callbacks.onNotification(
      `RADAR SWEEP: Fugitive detected at station ${fugitive.currentStationId}!`,
      'alert'
    );
    this.callbacks.onStateUpdate(this);
  }

  public submitMove(playerId: string, toStationId: string, transport: TransportType): boolean {
    if (this.phase !== 'planning' && this.phase !== 'setup') return false;

    const player = this.players.get(playerId);
    if (!player) return false;

    // Check if player already locked their move
    const existing = this.pendingMoves.get(playerId);
    if (existing && existing.locked) return false;

    if (this.phase === 'setup') {
      if (!STATIONS.some((station) => station.id === toStationId)) return false;
      const stationClaimed = Array.from(this.pendingMoves.values()).some(
        (move) => move.playerId !== playerId && move.toStationId === toStationId
      );
      if (stationClaimed) return false;
    } else {
      if (player.role !== this.turnRole || !isValidMove(player.currentStationId, toStationId, transport)) {
        return false;
      }
    }

    this.pendingMoves.set(playerId, {
      playerId,
      toStationId,
      transport,
      locked: false,
    });

    this.callbacks.onStateUpdate(this);
    return true;
  }

  public confirmMove(playerId: string): boolean {
    if (this.phase !== 'planning' && this.phase !== 'setup') return false;

    const pending = this.pendingMoves.get(playerId);
    if (!pending) return false;
    const player = this.players.get(playerId);
    if (!player) return false;
    if (this.phase === 'planning' && player.role !== this.turnRole) return false;

    pending.locked = true;
    this.callbacks.onStateUpdate(this);

    const expectedPlayers = Array.from(this.players.values()).filter(
      (candidate) =>
        (candidate.connected || candidate.isAi) &&
        (this.phase === 'setup' || candidate.role === this.turnRole)
    );
    const allLocked = expectedPlayers.every((candidate) => {
      const move = this.pendingMoves.get(candidate.id);
      return move && move.locked;
    });

    if (allLocked) {
      this.resolvePhase();
    }

    return true;
  }

  public resolvePhase() {
    if (this.phase !== 'planning' && this.phase !== 'setup') return;
    if (this.phaseTimerInterval) {
      clearInterval(this.phaseTimerInterval);
      this.phaseTimerInterval = null;
    }

    if (this.phase === 'setup') {
      this.finishStartingPositionSelection();
      return;
    }

    const resolvedRole = this.turnRole;
    if (!resolvedRole) return;
    this.phase = 'resolving';
    this.callbacks.onStateUpdate(this);

    const timestamp = Date.now();

    for (const [playerId, player] of this.players.entries()) {
      if (player.role !== resolvedRole) continue;
      const move = this.pendingMoves.get(playerId);
      if (move && move.locked) {
        const fromStationId = player.currentStationId;

        player.currentStationId = move.toStationId;

        // If this is the fugitive, record history
        if (player.role === 'fugitive') {
          this.fugitiveHistory.push({
            phase: this.currentPhaseNumber,
            playerId,
            transport: move.transport,
            fromStationId,
            toStationId: move.toStationId,
            timestamp,
          });
          this.lastFugitiveTransport = move.transport;
          if (this.fugitiveHistory.length % FUGITIVE_LOCATION_REVEAL_INTERVAL === 0) {
            this.lastKnownFugitiveStationId = move.toStationId;
            this.callbacks.onNotification(
              `FUGITIVE LOCATION REVEALED (MOVE ${this.fugitiveHistory.length}): ${move.toStationId}`,
              'alert'
            );
          }
        }
      }
    }

    this.pendingMoves.clear();

    if (resolvedRole === 'fugitive') {
      this.callbacks.onPhaseResolved(this, this.currentPhaseNumber);
    }

    if (this.checkForCapture()) return;

    if (resolvedRole === 'fugitive') {
      this.beginTurn('pursuer');
      this.callbacks.onStateUpdate(this);
      this.callbacks.onTurnChanged(this);
      return;
    }

    this.currentPhaseNumber += 1;
    this.beginTurn('fugitive');
    this.callbacks.onStateUpdate(this);
    this.callbacks.onTurnChanged(this);
  }

  public toggleEndVote(playerId: string): boolean {
    if (
      !this.settings.unlimitedTime ||
      this.phase === 'game_over' ||
      this.phase === 'lobby'
    ) {
      return false;
    }

    const player = this.players.get(playerId);
    if (!player || player.isAi || !player.connected) return false;

    if (this.endVotes.has(playerId)) {
      this.endVotes.delete(playerId);
    } else {
      this.endVotes.add(playerId);
    }

    if (this.hasEndVoteMajority()) {
      this.endGame(null, 'vote_ended');
    } else {
      this.callbacks.onStateUpdate(this);
    }
    return true;
  }

  public refreshEndVoteThreshold() {
    if (
      this.settings.unlimitedTime &&
      this.phase !== 'game_over' &&
      this.phase !== 'lobby' &&
      this.hasEndVoteMajority()
    ) {
      this.endGame(null, 'vote_ended');
    }
  }

  private hasEndVoteMajority(): boolean {
    const eligibleHumans = Array.from(this.players.values()).filter(
      (candidate) => !candidate.isAi && candidate.connected
    );
    const voteCount = eligibleHumans.filter((candidate) => this.endVotes.has(candidate.id)).length;
    return voteCount >= Math.floor(eligibleHumans.length / 2) + 1;
  }

  private finishStartingPositionSelection() {
    const claimedStations = new Set(
      Array.from(this.pendingMoves.values()).map((move) => move.toStationId)
    );
    let defaultedPlayers = 0;

    for (const player of this.players.values()) {
      const selectedStation = this.pendingMoves.get(player.id)?.toStationId;
      if (selectedStation) {
        player.currentStationId = selectedStation;
      } else {
        const availableStation = STATIONS.find((station) => !claimedStations.has(station.id));
        if (!availableStation) {
          this.endGame('pursuer', 'host_ended');
          return;
        }
        player.currentStationId = availableStation.id;
        claimedStations.add(availableStation.id);
        defaultedPlayers += 1;
      }
    }

    this.pendingMoves.clear();
    if (defaultedPlayers > 0) {
      this.callbacks.onNotification(
        `Starting positions were assigned for ${defaultedPlayers} player(s) who did not choose in time.`,
        'warning'
      );
    }

    this.turnRole = 'fugitive';
    this.beginTurn('fugitive');
    this.startMatchTimer();
    this.callbacks.onStateUpdate(this);
    this.callbacks.onNotification('Starting positions locked. The Fugitive moves first.', 'info');
    this.callbacks.onTurnChanged(this);
  }

  private checkForCapture(): boolean {
    const fugitive = Array.from(this.players.values()).find((p) => p.role === 'fugitive');
    const pursuers = Array.from(this.players.values()).filter((p) => p.role === 'pursuer');
    if (fugitive) {
      for (const pursuer of pursuers) {
        if (pursuer.currentStationId === fugitive.currentStationId) {
          this.captureStationId = fugitive.currentStationId;
          this.endGame('pursuer', 'captured');
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Called when the survival clock reaches zero. Public so tests (and future
   * admin tooling) can drive the clock without waiting 8 minutes.
   */
  public handleTimerExpired() {
    if (this.settings.unlimitedTime) return;
    if (!this.extensionUsed) {
      // First timer (8m30s) expired! Give Fugitive the choice
      this.phase = 'fugitive_decision';
      if (this.phaseTimerInterval) {
        clearInterval(this.phaseTimerInterval);
        this.phaseTimerInterval = null;
      }
      this.startFugitiveDecisionTimeout();
      this.callbacks.onFugitiveDecisionNeeded(this);
      this.callbacks.onStateUpdate(this);
    } else {
      // 5-minute extension expired! Fugitive wins automatically!
      this.endGame('fugitive', 'extension_survived');
    }
  }

  private startFugitiveDecisionTimeout() {
    this.clearFugitiveDecisionTimeout();

    this.fugitiveDecisionTimeout = setTimeout(() => {
      this.fugitiveDecisionTimeout = null;
      if (this.phase !== 'fugitive_decision') return;

      this.callbacks.onNotification(
        'The Fugitive did not respond in time. Survival victory awarded automatically.',
        'warning'
      );
      // By the rules the Fugitive already survived; ending simply confirms it.
      this.handleFugitiveDecision('end');
    }, this.fugitiveDecisionTimeoutMs);
  }

  private clearFugitiveDecisionTimeout() {
    if (this.fugitiveDecisionTimeout) {
      clearTimeout(this.fugitiveDecisionTimeout);
      this.fugitiveDecisionTimeout = null;
    }
  }

  public handleFugitiveDecision(choice: 'end' | 'extend'): boolean {
    if (this.phase !== 'fugitive_decision') return false;
    // Reject invalid / already-used choices BEFORE cancelling the AFK timeout,
    // otherwise a malformed socket payload could leave the match stuck.
    if (choice !== 'end' && choice !== 'extend') return false;
    if (choice === 'extend' && this.extensionUsed) return false;

    // A real decision always wins the race against the AFK timeout.
    this.clearFugitiveDecisionTimeout();

    if (choice === 'end') {
      this.endGame('fugitive', 'survived');
      return true;
    } else {
      this.extensionUsed = true;
      this.survivalTimeRemaining = this.settings.extensionDuration;
      this.beginTurn('fugitive');
      this.callbacks.onNotification(
        'The Fugitive has granted a 5-minute extension! The hunt continues!',
        'alert'
      );
      this.callbacks.onStateUpdate(this);
      this.callbacks.onTurnChanged(this);
      return true;
    }
    return false;
  }

  public endGame(
    winner: Role | null,
    reason: 'captured' | 'survived' | 'extension_survived' | 'host_ended' | 'vote_ended'
  ) {
    this.phase = 'game_over';
    this.winner = winner;
    this.winReason = reason;

    if (this.phaseTimerInterval) clearInterval(this.phaseTimerInterval);
    if (this.matchTimerInterval) clearInterval(this.matchTimerInterval);
    this.clearFugitiveDecisionTimeout();

    this.callbacks.onGameOver(this, winner, reason);
    this.callbacks.onStateUpdate(this);
  }

  public destroy() {
    if (this.phaseTimerInterval) clearInterval(this.phaseTimerInterval);
    if (this.matchTimerInterval) clearInterval(this.matchTimerInterval);
    this.clearFugitiveDecisionTimeout();
  }

  /**
   * CRITICAL SECURITY METHOD:
   * Generates a filtered client-safe game state. Pursuers only receive exact
   * Fugitive locations during a radar sweep, at every third move, or after game over.
   */
  public getClientState(playerId: string): ClientGameState {
    const viewer = this.players.get(playerId);
    const viewerRole = viewer ? viewer.role : 'pursuer';

    const clientPlayers: ClientPlayerState[] = Array.from(this.players.values()).map((p) => {
      const isViewer = p.id === playerId;
      const isFugitive = p.role === 'fugitive';
      const move = this.pendingMoves.get(p.id);

      // Determine visibility of currentStationId
      let visibleStationId: string | null = p.currentStationId;
      if (isFugitive && viewerRole === 'pursuer' && this.phase !== 'game_over') {
        // Pursuer view: Fugitive position is hidden unless currently revealed
        visibleStationId = this.revelationActive ? this.revelationStationId : null;
      }

      return {
        id: p.id,
        name: p.name,
        role: p.role,
        isHost: p.isHost,
        isAi: p.isAi,
        isReady: p.isReady,
        connected: p.connected,
        difficulty: p.difficulty,
        color: p.color,
        currentStationId:
          this.phase === 'setup' ? move?.toStationId || null : visibleStationId,
        hasLockedMove: move ? move.locked : false,
      };
    });

    // Public movement history for fugitive (only transport type and revelation stations)
    const publicFugitiveHistory: FugitivePublicRecord[] = this.fugitiveHistory.map((rec, index) => {
      return {
        moveNumber: index + 1,
        phase: rec.phase,
        transport: rec.transport,
        timestamp: rec.timestamp,
        revealedStationId:
          viewerRole === 'fugitive' ||
          this.phase === 'game_over' ||
          (index + 1) % FUGITIVE_LOCATION_REVEAL_INTERVAL === 0
            ? rec.toStationId
            : undefined,
      };
    });

    const myPendingMove = this.pendingMoves.get(playerId) || null;

    return {
      roomId: this.roomId,
      phase: this.phase,
      turnRole: this.turnRole,
      phaseTimeRemaining: this.phaseTimeRemaining,
      survivalTimeRemaining: this.survivalTimeRemaining,
      currentPhaseNumber: this.currentPhaseNumber,
      extensionUsed: this.extensionUsed,
      settings: this.settings,
      players: clientPlayers,
      myRole: viewerRole,
      myPlayerId: playerId,
      myCurrentStationId:
        this.phase === 'setup'
          ? myPendingMove?.toStationId || ''
          : viewer ? viewer.currentStationId : '',
      myPendingMove,
      revelation: {
        active: this.revelationActive,
        stationId: this.revelationStationId,
        nextRevealIn: this.nextRevealIn,
      },
      lastKnownFugitiveStationId: this.lastKnownFugitiveStationId,
      lastFugitiveTransport: this.lastFugitiveTransport,
      fugitiveHistory: publicFugitiveHistory,
      winner: this.winner,
      winReason: this.winReason,
      captureStationId: this.captureStationId,
      endVoteCount: Array.from(this.players.values()).filter(
        (player) => !player.isAi && player.connected && this.endVotes.has(player.id)
      ).length,
      endVoteThreshold:
        Math.floor(
          Array.from(this.players.values()).filter((player) => !player.isAi && player.connected)
            .length / 2
        ) + 1,
      hasVotedToEnd: this.endVotes.has(playerId),
    };
  }
}
