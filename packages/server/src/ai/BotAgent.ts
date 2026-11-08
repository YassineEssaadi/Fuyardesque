import {
  ClientGameState,
  Difficulty,
  TransportType,
  findShortestPath,
  getConnectionsFrom,
  getDistance,
  getNeighbors,
} from '@fuyardesque/shared';

export interface BotDecision {
  toStationId: string;
  transport: TransportType;
}

export class BotAgent {
  /**
   * Decide bot's next move strictly using the role-filtered client game state!
   */
  public static makeMove(state: ClientGameState, botPlayerId: string): BotDecision | null {
    const me = state.players.find((p) => p.id === botPlayerId);
    if (!me || !state.myCurrentStationId) return null;

    const currentStation = state.myCurrentStationId;
    const difficulty: Difficulty = me.difficulty || 'normal';

    if (state.myRole === 'fugitive') {
      return this.makeFugitiveMove(state, currentStation, difficulty);
    } else {
      return this.makePursuerMove(state, botPlayerId, currentStation, difficulty);
    }
  }

  // ==========================================
  // PURSUER AI (STRICTLY ROLE-SAFE)
  // ==========================================
  private static makePursuerMove(
    state: ClientGameState,
    botId: string,
    currentStation: string,
    difficulty: Difficulty
  ): BotDecision | null {
    const outgoing = getConnectionsFrom(currentStation);
    if (outgoing.length === 0) return null;

    const targetStation = state.revelation.active
      ? state.revelation.stationId
      : state.lastKnownFugitiveStationId;

    // List other pursuer current positions to coordinate
    const otherPursuers = state.players
      .filter((p) => p.id !== botId && p.role === 'pursuer' && p.currentStationId)
      .map((p) => p.currentStationId as string);

    // EASY DIFFICULTY
    if (difficulty === 'easy') {
      // 50% random move, 50% head towards target if known
      if (!targetStation || Math.random() < 0.5) {
        const randConn = outgoing[Math.floor(Math.random() * outgoing.length)];
        return { toStationId: randConn.to, transport: randConn.transport };
      }
      return this.stepTowards(currentStation, targetStation, outgoing);
    }

    // NORMAL DIFFICULTY
    if (difficulty === 'normal') {
      if (targetStation) {
        // If we are already at the target station, search neighboring nodes
        if (currentStation === targetStation) {
          const randConn = outgoing[Math.floor(Math.random() * outgoing.length)];
          return { toStationId: randConn.to, transport: randConn.transport };
        }
        return this.stepTowards(currentStation, targetStation, outgoing);
      }

      // No target known yet: patrol towards major hubs (st-01, st-10, st-18, st-26, st-34, st-42)
      const hubs = ['st-01', 'st-10', 'st-18', 'st-26', 'st-34', 'st-42'];
      const nearestHub = hubs.sort((a, b) => getDistance(currentStation, a) - getDistance(currentStation, b))[0];
      return this.stepTowards(currentStation, nearestHub, outgoing);
    }

    // HARD DIFFICULTY (Coordinated Pursuit & Interception)
    const targetStations = targetStation
      ? state.revelation.active
        ? [targetStation]
        : [targetStation, ...getNeighbors(targetStation)]
      : ['st-01', 'st-10', 'st-18', 'st-26', 'st-34', 'st-42'];

    let bestConn = outgoing[0];
    let bestScore = -Infinity;

    for (const conn of outgoing) {
      const followups = getConnectionsFrom(conn.to);
      const nextTargetDistance = followups.length > 0
        ? Math.min(
            ...followups.map((nextMove) =>
              Math.min(...targetStations.map((target) => getDistance(nextMove.to, target)))
            )
          )
        : Math.min(...targetStations.map((target) => getDistance(conn.to, target)));
      const currentTargetDistance = Math.min(
        ...targetStations.map((target) => getDistance(conn.to, target))
      );
      const coveredTargets = targetStations.filter(
        (target) => getDistance(conn.to, target) <= 1
      ).length;

      let score =
        -nextTargetDistance * 14 -
        currentTargetDistance * 4 +
        coveredTargets * 8 +
        followups.length;

      if (otherPursuers.includes(conn.to)) {
        score -= 25;
      }

      if (currentTargetDistance > 2 && (conn.transport === 'metro' || conn.transport === 'bus')) {
        score += 8;
      }

      if (score > bestScore) {
        bestScore = score;
        bestConn = conn;
      }
    }

    return { toStationId: bestConn.to, transport: bestConn.transport };
  }

  // ==========================================
  // FUGITIVE AI
  // ==========================================
  private static makeFugitiveMove(
    state: ClientGameState,
    currentStation: string,
    difficulty: Difficulty
  ): BotDecision | null {
    const outgoing = getConnectionsFrom(currentStation);
    if (outgoing.length === 0) return null;

    // Pursuer locations are visible to the Fugitive!
    const pursuerStations = state.players
      .filter((p) => p.role === 'pursuer' && p.currentStationId)
      .map((p) => p.currentStationId as string);

    // EASY DIFFICULTY
    if (difficulty === 'easy') {
      // Pick random destination that doesn't immediately have a pursuer on it
      const safeConns = outgoing.filter((c) => !pursuerStations.includes(c.to));
      const pool = safeConns.length > 0 ? safeConns : outgoing;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return { toStationId: pick.to, transport: pick.transport };
    }

    // NORMAL DIFFICULTY
    if (difficulty === 'normal') {
      // Pick destination that maximizes minimum distance to any pursuer
      let bestConn = outgoing[0];
      let maxMinDist = -1;

      for (const conn of outgoing) {
        let minDist = Infinity;
        for (const pStation of pursuerStations) {
          const d = getDistance(conn.to, pStation);
          if (d < minDist) minDist = d;
        }

        if (minDist > maxMinDist) {
          maxMinDist = minDist;
          bestConn = conn;
        }
      }

      return { toStationId: bestConn.to, transport: bestConn.transport };
    }

    // HARD DIFFICULTY (Lookahead Evasion & Hub Hopping)
    const projectedPursuerStations = Array.from(
      new Set(
        pursuerStations.flatMap((station) => [
          station,
          ...getConnectionsFrom(station).map((connection) => connection.to),
        ])
      )
    );

    let bestConn = outgoing[0];
    let bestScore = -Infinity;

    for (const conn of outgoing) {
      const nextConnections = getConnectionsFrom(conn.to);
      const nextTransports = new Set(nextConnections.map((c) => c.transport));
      const immediateSafety = pursuerStations.length > 0
        ? Math.min(...pursuerStations.map((station) => getDistance(conn.to, station)))
        : 0;
      const bestFutureSafety = nextConnections.length > 0 && projectedPursuerStations.length > 0
        ? Math.max(
            ...nextConnections.map((futureMove) =>
              Math.min(
                ...projectedPursuerStations.map((station) =>
                  getDistance(futureMove.to, station)
                )
              )
            )
          )
        : 0;

      let score =
        immediateSafety * 20 +
        bestFutureSafety * 10 +
        nextTransports.size * 10 +
        nextConnections.length * 3;
      if (immediateSafety <= 1) score -= 100;
      if (conn.transport === 'metro') score += 12;

      const recentDestinations = state.fugitiveHistory
        .slice(-3)
        .map((record) => record.revealedStationId);
      if (recentDestinations.includes(conn.to)) score -= 15;

      if (score > bestScore) {
        bestScore = score;
        bestConn = conn;
      }
    }

    return { toStationId: bestConn.to, transport: bestConn.transport };
  }

  private static stepTowards(
    current: string,
    target: string,
    outgoing: ReturnType<typeof getConnectionsFrom>
  ): BotDecision {
    const path = findShortestPath(current, target);
    if (path.length >= 2) {
      const nextStep = path[1];
      const matchingConns = outgoing.filter((c) => c.to === nextStep);
      if (matchingConns.length > 0) {
        // Prefer faster transport if available
        const metroConn = matchingConns.find((c) => c.transport === 'metro');
        const busConn = matchingConns.find((c) => c.transport === 'bus');
        const selected = metroConn || busConn || matchingConns[0];
        return { toStationId: selected.to, transport: selected.transport };
      }
    }

    // Fallback: choose move with minimum distance to target
    let bestConn = outgoing[0];
    let bestDist = Infinity;
    for (const conn of outgoing) {
      const dist = getDistance(conn.to, target);
      if (dist < bestDist) {
        bestDist = dist;
        bestConn = conn;
      }
    }
    return { toStationId: bestConn.to, transport: bestConn.transport };
  }
}
