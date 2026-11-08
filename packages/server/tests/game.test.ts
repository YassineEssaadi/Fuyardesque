import {
  DEFAULT_SETTINGS,
  EXTENSION_DURATION_OPTIONS,
  FUGITIVE_LOCATION_REVEAL_INTERVAL,
  PHASE_DURATION_OPTIONS,
  REVEAL_DURATION_OPTIONS,
  REVEAL_INTERVAL_OPTIONS,
  Player,
  Role,
  SOCKET_EVENTS,
  STARTING_POSITION_DURATION_SECONDS,
  SURVIVAL_DURATION_OPTIONS,
  findShortestPath,
  getConnectionsFrom,
  getNeighbors,
  isValidMove,
  STATIONS,
} from '@fuyardesque/shared';
import { GameEngine } from '../src/game/GameEngine';
import { BotAgent } from '../src/ai/BotAgent';
import { Room } from '../src/rooms/Room';
import { Server } from 'socket.io';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=== RUNNING FUYARDESQUE GAME MECHANICS & SECURITY TESTS ===\n');

  // Test 1: Map Graph Connectivity
  console.log('[Suite 1: City Map Graph & Transports]');
  assert(STATIONS.length === 50, 'Map has exactly 50 stations');
  
  const st01Conns = getConnectionsFrom('st-01');
  assert(st01Conns.length > 0, 'Central Hub has valid outgoing connections');
  
  const taxiValid = isValidMove('st-01', 'st-02', 'taxi');
  assert(taxiValid === true, 'Legal taxi move between st-01 and st-02 is validated');

  const illegalMove = isValidMove('st-01', 'st-50', 'taxi');
  assert(illegalMove === false, 'Illegal long-distance taxi move is rejected');

  const path = findShortestPath('st-01', 'st-50');
  assert(path.length > 0 && path[0] === 'st-01' && path[path.length - 1] === 'st-50', 'Shortest path found across city');

  assert(DEFAULT_SETTINGS.phaseDuration === 30, 'Default turn duration is 30 seconds');
  assert(PHASE_DURATION_OPTIONS.length === 1 && PHASE_DURATION_OPTIONS[0] === 30, 'Only the requested 30s turn duration is offered');
  assert(STARTING_POSITION_DURATION_SECONDS === 30, 'Starting position selection lasts 30 seconds');
  assert(!PHASE_DURATION_OPTIONS.includes(25), 'Unsupported 25s duration is not offered');
  assert(SURVIVAL_DURATION_OPTIONS.includes(DEFAULT_SETTINGS.survivalDuration), 'Default survival duration is configurable');
  assert(EXTENSION_DURATION_OPTIONS.includes(DEFAULT_SETTINGS.extensionDuration), 'Default extension duration is configurable');
  assert(REVEAL_INTERVAL_OPTIONS.includes(DEFAULT_SETTINGS.revealInterval), 'Default radar interval is configurable');
  assert(REVEAL_DURATION_OPTIONS.includes(DEFAULT_SETTINGS.revealDuration), 'Default radar duration is configurable');

  // Test 2: GameEngine Initialization & Role Assignment
  console.log('\n[Suite 2: Game Initialization & Role Visibility]');
  const mockPlayers: Player[] = [
    {
      id: 'p_fugitive',
      name: 'The Ghost',
      role: 'fugitive',
      isHost: true,
      isAi: false,
      isReady: true,
      connected: true,
      color: '#0ea5e9',
      currentStationId: '',
    },
    {
      id: 'p_pursuer_1',
      name: 'Inspector Morse',
      role: 'pursuer',
      isHost: false,
      isAi: false,
      isReady: true,
      connected: true,
      color: '#f43f5e',
      currentStationId: '',
    },
    {
      id: 'p_pursuer_2',
      name: 'Agent Delta',
      role: 'pursuer',
      isHost: false,
      isAi: true,
      isReady: true,
      connected: true,
      difficulty: 'hard',
      color: '#10b981',
      currentStationId: '',
    },
  ];

  let stateUpdated = 0;
  let phaseResolved = 0;
  let gameOverWinner: Role | null = null;
  let fugitiveDecisionTriggered = false;

  const engine = new GameEngine(
    'TEST01',
    DEFAULT_SETTINGS,
    mockPlayers,
    {
      onStateUpdate: () => stateUpdated++,
      onPhaseResolved: () => phaseResolved++,
      onTurnChanged: () => {},
      onGameOver: (_, winner) => { gameOverWinner = winner; },
      onFugitiveDecisionNeeded: () => { fugitiveDecisionTriggered = true; },
      onNotification: () => {},
    }
  );

  const fugitive = engine.players.get('p_fugitive');
  const pursuer1 = engine.players.get('p_pursuer_1');
  const pursuer2 = engine.players.get('p_pursuer_2');

  assert(fugitive?.role === 'fugitive', 'Fugitive assigned correctly');
  assert(pursuer1?.role === 'pursuer' && pursuer2?.role === 'pursuer', 'Pursuers assigned correctly');
  assert(engine.phase === 'setup', 'Game opens with a starting-position selection phase');
  assert(!engine.toggleEndVote('p_fugitive'), 'End voting is unavailable in timed matches');
  assert(fugitive?.currentStationId === '', 'Fugitive is not assigned a random starting station');
  assert(pursuer1?.currentStationId === '', 'Pursuers are not assigned random starting stations');

  const startingSelections = [
    ['p_fugitive', 'st-01'],
    ['p_pursuer_1', 'st-24'],
    ['p_pursuer_2', 'st-50'],
  ] as const;
  for (const [playerId, stationId] of startingSelections) {
    if (playerId === 'p_pursuer_1') {
      assert(!engine.submitMove(playerId, 'st-01', 'taxi'), 'A station already chosen during setup cannot be claimed twice');
    }
    assert(engine.submitMove(playerId, stationId, 'taxi'), `${playerId} can select a starting station`);
    assert(engine.confirmMove(playerId), `${playerId} can lock their starting station`);
  }
  assert(engine.phase === 'planning' && engine.turnRole === 'fugitive', 'Fugitive starts after all stations are locked');
  assert(
    new Set(Array.from(engine.players.values()).map((player) => player.currentStationId)).size === 3,
    'Starting stations must be unique'
  );

  const setupTimeoutEngine = new GameEngine(
    'TEST_SETUP_TIMEOUT',
    DEFAULT_SETTINGS,
    mockPlayers.slice(0, 2).map((player) => ({ ...player, currentStationId: '' })),
    {
      onStateUpdate: () => {},
      onPhaseResolved: () => {},
      onTurnChanged: () => {},
      onGameOver: () => {},
      onFugitiveDecisionNeeded: () => {},
      onNotification: () => {},
    }
  );
  setupTimeoutEngine.start();
  assert(
    setupTimeoutEngine.phaseTimeRemaining === STARTING_POSITION_DURATION_SECONDS,
    'Starting position timer begins at 30 seconds'
  );
  setupTimeoutEngine.resolvePhase();
  const timeoutPositions = Array.from(setupTimeoutEngine.players.values()).map(
    (player) => player.currentStationId
  );
  assert(
    setupTimeoutEngine.phase === 'planning' &&
      new Set(timeoutPositions).size === 2 &&
      timeoutPositions.every(Boolean),
    'Setup timeout fills missing starting selections with distinct stations'
  );
  assert(
    setupTimeoutEngine.survivalTimeRemaining === DEFAULT_SETTINGS.survivalDuration,
    'Survival clock starts only after starting-position selection ends'
  );
  const fugitiveStart = setupTimeoutEngine.players.get('p_fugitive')!.currentStationId;
  setupTimeoutEngine.resolvePhase();
  assert(
    setupTimeoutEngine.turnRole === 'pursuer' &&
      setupTimeoutEngine.players.get('p_fugitive')!.currentStationId === fugitiveStart,
    'Fugitive timeout leaves them at their current station and hands turn to detectives'
  );
  setupTimeoutEngine.destroy();

  const untimedEngine = new GameEngine(
    'TEST_UNTIMED',
    { ...DEFAULT_SETTINGS, unlimitedTime: true, survivalDuration: 1, revealInterval: 1 },
    mockPlayers.map((player) => ({ ...player, currentStationId: '' })),
    {
      onStateUpdate: () => {},
      onPhaseResolved: () => {},
      onTurnChanged: () => {},
      onGameOver: () => {},
      onFugitiveDecisionNeeded: () => {},
      onNotification: () => {},
    }
  );
  untimedEngine.start();
  assert(
    untimedEngine.phase === 'setup' && untimedEngine.phaseTimeRemaining === 0,
    'Unlimited matches start setup without a countdown'
  );
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert(
    untimedEngine.phase === 'setup' && untimedEngine.phaseTimeRemaining === 0,
    'Unlimited setup does not auto-resolve'
  );
  untimedEngine.resolvePhase();
  const revealCountdownBeforeWait = untimedEngine.nextRevealIn;
  await new Promise((resolve) => setTimeout(resolve, 1100));
  untimedEngine.handleTimerExpired();
  assert(
    untimedEngine.phase === 'planning' &&
      untimedEngine.phaseTimeRemaining === 0 &&
      untimedEngine.survivalTimeRemaining === 1 &&
      untimedEngine.nextRevealIn === revealCountdownBeforeWait &&
      !untimedEngine.revelationActive,
    'Unlimited turns, survival, and timed radar do not expire'
  );
  assert(!untimedEngine.toggleEndVote('p_pursuer_2'), 'AI players cannot vote to end a match');
  assert(untimedEngine.toggleEndVote('p_fugitive'), 'A connected human can cast an end-match vote');
  const oneVoteState = untimedEngine.getClientState('p_pursuer_1');
  assert(
    oneVoteState.endVoteCount === 1 &&
      oneVoteState.endVoteThreshold === 2 &&
      !oneVoteState.hasVotedToEnd,
    'Vote tally uses a strict majority of connected human players'
  );
  assert(untimedEngine.toggleEndVote('p_fugitive'), 'A human can withdraw their vote before the majority');
  assert(untimedEngine.toggleEndVote('p_fugitive'), 'A human can vote again after withdrawing');
  assert(untimedEngine.toggleEndVote('p_pursuer_1'), 'The Fugitive counts toward the human majority');
  assert(
    untimedEngine.phase === 'game_over' &&
      untimedEngine.winner === null &&
      untimedEngine.winReason === 'vote_ended',
    'A strict human majority ends the match without awarding either role a win'
  );
  untimedEngine.destroy();

  const electoratePlayers = [
    ...mockPlayers.filter((player) => !player.isAi).map((player) => ({ ...player })),
    {
      ...mockPlayers[1],
      id: 'p_pursuer_3',
      name: 'Detective Three',
      connected: true,
    },
    {
      ...mockPlayers[1],
      id: 'p_pursuer_4',
      name: 'Detective Four',
      connected: true,
    },
  ];
  const changingElectorateEngine = new GameEngine(
    'TEST_VOTE_DISCONNECT',
    { ...DEFAULT_SETTINGS, unlimitedTime: true },
    electoratePlayers,
    {
      onStateUpdate: () => {},
      onPhaseResolved: () => {},
      onTurnChanged: () => {},
      onGameOver: () => {},
      onFugitiveDecisionNeeded: () => {},
      onNotification: () => {},
    }
  );
  assert(changingElectorateEngine.toggleEndVote('p_fugitive'), 'First vote is recorded for the connected electorate');
  assert(changingElectorateEngine.toggleEndVote('p_pursuer_1'), 'Second vote remains below a four-human majority');
  changingElectorateEngine.players.get('p_pursuer_3')!.connected = false;
  changingElectorateEngine.refreshEndVoteThreshold();
  assert(
    changingElectorateEngine.phase === 'game_over' &&
      changingElectorateEngine.winReason === 'vote_ended',
    'A disconnect recalculates the connected-human majority'
  );
  changingElectorateEngine.destroy();

  // Test 3: ZERO-LEAKAGE SECURITY CHECK
  console.log('\n[Suite 3: Information Security & Role Views]');
  const fugitiveView = engine.getClientState('p_fugitive');
  const pursuerView = engine.getClientState('p_pursuer_1');

  const fugitivePlayerInFugitiveView = fugitiveView.players.find((p) => p.id === 'p_fugitive');
  const fugitivePlayerInPursuerView = pursuerView.players.find((p) => p.id === 'p_fugitive');
  const pursuerPlayerInPursuerView = pursuerView.players.find((p) => p.id === 'p_pursuer_2');

  assert(
    fugitivePlayerInFugitiveView?.currentStationId === fugitive?.currentStationId,
    'Fugitive CAN see their own station'
  );
  assert(
    fugitivePlayerInPursuerView?.currentStationId === null,
    'SECURITY: Pursuer CANNOT see Fugitive currentStationId (is null)'
  );
  assert(
    pursuerPlayerInPursuerView?.currentStationId === pursuer2?.currentStationId,
    'Pursuers CAN see each other positions'
  );

  // Test 4: Legal & Illegal Movement Validation
  console.log('\n[Suite 4: Sequential Movement & Turn Validation]');
  engine.phase = 'planning';
  engine.turnRole = 'fugitive';
  
  // Detectives may not move until the Fugitive has finished their turn.
  const illegalMoveResult = engine.submitMove('p_pursuer_1', 'st-99_invalid', 'taxi');
  assert(illegalMoveResult === false, 'Out-of-turn detective movement is rejected');

  // Move fugitive legally
  const fugStation = fugitive!.currentStationId;
  const fugConn = getConnectionsFrom(fugStation).find(
    (connection) => connection.to !== pursuer1!.currentStationId && connection.to !== pursuer2!.currentStationId
  )!;
  engine.submitMove('p_fugitive', fugConn.to, fugConn.transport);
  engine.confirmMove('p_fugitive');
  assert(engine.turnRole === 'pursuer', 'Detective team turn begins after Fugitive movement');

  const p1Conn = getConnectionsFrom(pursuer1!.currentStationId).find(
    (connection) => connection.to !== fugConn.to
  )!;
  const legalMoveResult = engine.submitMove('p_pursuer_1', p1Conn.to, p1Conn.transport);
  assert(legalMoveResult === true, 'Legal detective move accepted on the detective turn');
  engine.confirmMove('p_pursuer_1');
  assert(engine.pendingMoves.get('p_pursuer_1')?.locked === true, 'Move locked after confirmation');
  const duplicateMoveResult = engine.submitMove('p_pursuer_1', p1Conn.to, p1Conn.transport);
  assert(duplicateMoveResult === false, 'Player CANNOT change a locked move');

  // AI pursuer submits move
  const p2Conn = getConnectionsFrom(pursuer2!.currentStationId).find(
    (connection) => connection.to !== fugConn.to && connection.to !== p1Conn.to
  )!;
  engine.submitMove('p_pursuer_2', p2Conn.to, p2Conn.transport);
  engine.confirmMove('p_pursuer_2');

  // Detective team moves resolve once everyone has locked.
  assert(fugitive!.currentStationId === fugConn.to, 'Fugitive moved to new station upon resolution');
  assert(engine.currentPhaseNumber === 2 && engine.turnRole === 'fugitive', 'Game advances to the next Fugitive turn');

  const fugitiveMoveRecord = engine.fugitiveHistory[engine.fugitiveHistory.length - 1];
  assert(
    fugitiveMoveRecord?.fromStationId === fugStation,
    'Fugitive history records the origin station (not the destination)'
  );
  assert(
    fugitiveMoveRecord?.toStationId === fugConn.to,
    'Fugitive history records the destination station'
  );
  assert(
    engine.getClientState('p_pursuer_1').fugitiveHistory[0].revealedStationId === undefined,
    'Pursuers do not learn the Fugitive destination before the third move'
  );

  // Test 5: Capture Mechanics
  console.log('\n[Suite 5: Capture Rule]');
  // Force pursuer to move to same station as fugitive
  const currentFugStation = fugitive!.currentStationId;
  // Move pursuer 1 to fugitive's station
  pursuer1!.currentStationId = currentFugStation;
  // Trigger resolution
  engine.resolvePhase();
  assert(engine.phase === 'game_over', 'Game transitions to game_over on capture');
  assert(engine.winner === 'pursuer', 'Pursuers win on capture');
  assert(engine.winReason === 'captured', 'Win reason is "captured"');

  // Every third actual Fugitive move is disclosed, independent of phase count.
  console.log('\n[Suite 6: Move-Count Location Revelations]');
  let locationRevealNotice = '';
  const revealPlayers = mockPlayers.slice(0, 2).map((player) => ({
    ...player,
    currentStationId: '',
  }));
  const revealEngine = new GameEngine('TEST_REVEAL', DEFAULT_SETTINGS, revealPlayers, {
    onStateUpdate: () => {},
    onPhaseResolved: () => {},
    onTurnChanged: () => {},
    onGameOver: () => {},
    onFugitiveDecisionNeeded: () => {},
    onNotification: (message) => {
      if (message.includes('FUGITIVE LOCATION REVEALED')) locationRevealNotice = message;
    },
  });
  const revealFugitive = revealEngine.players.get('p_fugitive')!;
  const revealPursuer = revealEngine.players.get('p_pursuer_1')!;
  revealFugitive.currentStationId = 'st-01';
  revealPursuer.currentStationId = 'st-50';
  revealEngine.phase = 'planning';
  revealEngine.turnRole = 'fugitive';

  for (let moveNumber = 1; moveNumber <= FUGITIVE_LOCATION_REVEAL_INTERVAL; moveNumber++) {
    if (moveNumber > 1) {
      revealEngine.resolvePhase();
    }

    const destination = getConnectionsFrom(revealFugitive.currentStationId)
      .find((connection) => connection.to !== revealPursuer.currentStationId)!;
    revealEngine.submitMove(revealFugitive.id, destination.to, destination.transport);
    revealEngine.confirmMove(revealFugitive.id);

    const pursuerState = revealEngine.getClientState(revealPursuer.id);
    const historyRecord = pursuerState.fugitiveHistory[pursuerState.fugitiveHistory.length - 1];
    if (moveNumber < FUGITIVE_LOCATION_REVEAL_INTERVAL) {
      assert(
        historyRecord.revealedStationId === undefined,
        `Fugitive move ${moveNumber} remains hidden`
      );
    } else {
      assert(
        historyRecord.moveNumber === FUGITIVE_LOCATION_REVEAL_INTERVAL &&
          historyRecord.revealedStationId === destination.to,
        'Third actual move location is permanently revealed to Pursuers'
      );
      assert(
        pursuerState.players.find((player) => player.id === revealFugitive.id)?.currentStationId === null,
        'Move-count reveal does not expose the Fugitive current position'
      );
      assert(
        pursuerState.lastKnownFugitiveStationId === destination.to,
        'Map last-known marker updates to the revealed station'
      );
      assert(
        locationRevealNotice.includes(destination.to),
        'All players receive a notification naming the revealed station'
      );
    }
  }
  revealEngine.destroy();

  // Test 6: AI Information Restriction & Decisions
  console.log('\n[Suite 7: AI Bot Zero-Cheating]');
  // Give AI bot pursuer view
  const botPursuerView = engine.getClientState('p_pursuer_2');
  assert(
    botPursuerView.players.find((p) => p.role === 'fugitive')?.currentStationId === currentFugStation ||
    botPursuerView.players.find((p) => p.role === 'fugitive')?.currentStationId === null,
    'Bot input respects information rules'
  );

  const botDecision = BotAgent.makeMove(botPursuerView, 'p_pursuer_2');
  assert(botDecision !== null, 'AI bot successfully produced a legal move');
  assert(
    isValidMove(pursuer2!.currentStationId, botDecision!.toStationId, botDecision!.transport),
    'AI bot move is strictly legal on the graph'
  );

  pursuer2!.difficulty = 'hard';
  const hardPursuerView = engine.getClientState('p_pursuer_2');
  const hardPursuerDecision = BotAgent.makeMove(hardPursuerView, 'p_pursuer_2');
  assert(
    !!hardPursuerDecision &&
      isValidMove(pursuer2!.currentStationId, hardPursuerDecision.toStationId, hardPursuerDecision.transport),
    'Hard pursuer uses role-safe lookahead and returns a legal move'
  );
  fugitive!.difficulty = 'hard';
  const hardFugitiveView = engine.getClientState('p_fugitive');
  const hardFugitiveDecision = BotAgent.makeMove(hardFugitiveView, 'p_fugitive');
  assert(
    !!hardFugitiveDecision &&
      isValidMove(fugitive!.currentStationId, hardFugitiveDecision.toStationId, hardFugitiveDecision.transport),
    'Hard fugitive evaluates escape options and returns a legal move'
  );

  // Test 7: Periodic Revelation
  console.log('\n[Suite 8: Revelation System]');
  engine.phase = 'planning';
  engine.revelationActive = true;
  engine.revelationStationId = fugitive!.currentStationId;
  const revealedPursuerView = engine.getClientState('p_pursuer_1');
  assert(
    revealedPursuerView.revelation.active === true,
    'Active revelation is reflected in Pursuer view'
  );
  assert(
    revealedPursuerView.revelation.stationId === fugitive!.currentStationId,
    'Fugitive position visible during authorized revelation'
  );

  // Test 8: Fugitive 5-Minute Extension Option
  console.log('\n[Suite 9: Timer Expiry & 5-Minute Extension]');
  engine.phase = 'fugitive_decision';
  engine.extensionUsed = false;
  
  const extendSuccess = engine.handleFugitiveDecision('extend');
  assert(extendSuccess === true, 'Fugitive 5-minute extension accepted');
  assert(engine.extensionUsed === true, 'extensionUsed flag is set to true');
  assert(engine.survivalTimeRemaining === DEFAULT_SETTINGS.extensionDuration, 'Timer reset to 5 minutes (300s)');
  assert(
    engine.phase === 'planning' && engine.turnRole === 'fugitive',
    'Match resumes with the Fugitive turn'
  );

  // Attempt second extension (should fail)
  engine.phase = 'fugitive_decision';
  const secondExtend = engine.handleFugitiveDecision('extend');
  assert(secondExtend === false, 'Cannot extend game twice (extension can only be used once)');

  // Fugitive decides to end game
  engine.phase = 'fugitive_decision';
  const endSuccess = engine.handleFugitiveDecision('end');
  assert(endSuccess === true, 'Fugitive can choose to end match and win');
  assert(engine.winner === 'fugitive', 'Fugitive wins upon ending survival match');

  engine.destroy();

  // Test 9: AFK / disconnected Fugitive decision timeout
  console.log('\n[Suite 10: Fugitive Decision Timeout]');
  const makeDecisionEngine = (timeoutMs: number) => {
    const players: Player[] = [
      {
        id: 't_fugitive',
        name: 'Ghost',
        role: 'fugitive',
        isHost: true,
        isAi: false,
        isReady: true,
        connected: true,
        color: '#0ea5e9',
        currentStationId: '',
      },
      {
        id: 't_pursuer',
        name: 'Hunter',
        role: 'pursuer',
        isHost: false,
        isAi: false,
        isReady: true,
        connected: true,
        color: '#f43f5e',
        currentStationId: '',
      },
    ];

    let notified = false;
    let timeoutWinner: Role | null = null;

    const decisionEngine = new GameEngine('TEST_TIMEOUT', DEFAULT_SETTINGS, players, {
      onStateUpdate: () => {},
      onPhaseResolved: () => {},
      onTurnChanged: () => {},
      onGameOver: (_, winner) => { timeoutWinner = winner; },
      onFugitiveDecisionNeeded: () => {},
      onNotification: () => { notified = true; },
    });
    decisionEngine.fugitiveDecisionTimeoutMs = timeoutMs;

    return { decisionEngine, wasNotified: () => notified, getWinner: () => timeoutWinner };
  };

  const afk = makeDecisionEngine(25);
  afk.decisionEngine.handleTimerExpired();
  assert(afk.decisionEngine.phase === 'fugitive_decision', 'Survival expiry opens the Fugitive decision window');
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert(afk.decisionEngine.phase === 'game_over', 'AFK Fugitive decision auto-resolves via timeout');
  assert(afk.getWinner() === 'fugitive', 'Timeout awards the survival victory to the Fugitive');
  assert(afk.wasNotified(), 'Players are notified when the decision times out');
  afk.decisionEngine.destroy();

  // Test 10: A real decision cancels the timeout
  const responsive = makeDecisionEngine(25);
  responsive.decisionEngine.handleTimerExpired();
  responsive.decisionEngine.handleFugitiveDecision('extend');
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert(
    responsive.decisionEngine.phase === 'planning' &&
      responsive.decisionEngine.turnRole === 'fugitive',
    'A real Fugitive decision cancels the AFK timeout and resumes the Fugitive turn'
  );
  assert(responsive.decisionEngine.extensionUsed === true, 'Extension decision is applied normally');
  responsive.decisionEngine.destroy();

  // Test 11: AI Fugitive answers the decision prompt on its own
  console.log('\n[Suite 11: AI Fugitive Decision & Match Hygiene]');
  const emitted: Array<{ event: string; payload: any }> = [];
  const ioStub = {
    to: () => ({
      emit: (event: string, payload: any) => {
        emitted.push({ event, payload });
      },
    }),
    sockets: { sockets: new Map() },
  } as unknown as Server;

  const room = new Room('TEST_AI', 'host_ai', 'Host', ioStub);
  room.settings.gameMode = 'solo';
  room.setRole('host_ai', 'pursuer');
  const aiFugitive = room.addBot('fugitive', 'normal');
  assert(aiFugitive !== null, 'AI Fugitive added to the room');

  // Chat from a previous match must not survive the next start.
  room.addChatMessage('host_ai', 'pre-match note');
  assert(room.pursuerChat.length === 1, 'Chat message is stored before the match starts');
  assert(room.startGame().success, 'Solo mode starts with one human and AI players');
  assert(room.pursuerChat.length === 0, 'Chat is cleared when a new match starts');

  const aiEngine = room.gameEngine!;
  assert(aiEngine.phase === 'setup', 'New match waits for players to choose starting stations');
  assert(aiEngine.submitMove('host_ai', 'st-50', 'taxi'), 'Human can choose an unclaimed starting station');
  assert(aiEngine.confirmMove('host_ai'), 'Human can lock their starting station');
  assert(
    aiEngine.phase === 'planning' && aiEngine.turnRole === 'fugitive',
    'Setup hands the first turn to the Fugitive'
  );
  const intelMessages = () =>
    emitted
      .filter(
        (entry) =>
          entry.event === SOCKET_EVENTS.NOTIFICATION &&
          typeof entry.payload?.message === 'string' &&
          entry.payload.message.includes('INTEL REPORT')
      )
      .map((entry) => entry.payload.message as string);
  const lastIntel = () => intelMessages()[intelMessages().length - 1] || '';

  // Round 1: the Fugitive moves -> intel names the transport.
  const botFugitive = Array.from(aiEngine.players.values()).find((p) => p.role === 'fugitive')!;
  const botMove = getConnectionsFrom(botFugitive.currentStationId).find(
    (connection) => connection.to !== 'st-50'
  )!;
  aiEngine.submitMove(botFugitive.id, botMove.to, botMove.transport);
  aiEngine.confirmMove(botFugitive.id);
  aiEngine.resolvePhase();
  assert(/traveled via/i.test(lastIntel()), 'Intel reports the transport when the Fugitive moves');

  // Resolve the detective turn, then let the Fugitive's next timer expire.
  aiEngine.resolvePhase();
  aiEngine.resolvePhase();
  assert(
    /no movement/i.test(lastIntel()),
    'Intel reports no movement instead of repeating the last transport'
  );

  // Chat can also be cleared explicitly on restart.
  room.addChatMessage('host_ai', 'post-match note');
  room.clearChat();
  assert(room.pursuerChat.length === 0, 'Chat history is cleared between matches');

  aiEngine.handleTimerExpired();
  assert(aiEngine.phase === 'fugitive_decision', 'AI Fugitive match reaches the decision phase');
  await new Promise((resolve) => setTimeout(resolve, 1500));
  assert(aiEngine.phase === 'game_over', 'AI Fugitive match does NOT stall at the decision screen');
  assert(aiEngine.winner === 'fugitive', 'AI Fugitive resolves the decision and wins by survival');
  aiEngine.destroy();

  const multiplayerRoom = new Room('TEST_MODE', 'host_mode', 'Host', ioStub);
  multiplayerRoom.settings.gameMode = 'multiplayer';
  multiplayerRoom.addBot('pursuer');
  assert(
    !multiplayerRoom.startGame().success,
    'Multiplayer mode rejects matches containing AI players'
  );

  console.log(`\n===============================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
