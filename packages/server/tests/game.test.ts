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

  assert(DEFAULT_SETTINGS.phaseDuration === 15, 'Default phase duration matches the documented 15s');
  assert(PHASE_DURATION_OPTIONS.includes(15), 'Default phase duration is an offered option');
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
  assert(fugitive?.currentStationId !== '', 'Fugitive received valid starting station');
  assert(pursuer1?.currentStationId !== '', 'Pursuer 1 received valid starting station');

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
  console.log('\n[Suite 4: Movement Validation & Simultaneous Resolution]');
  engine.phase = 'planning';
  
  // Try illegal move for pursuer 1
  const illegalMoveResult = engine.submitMove('p_pursuer_1', 'st-99_invalid', 'taxi');
  assert(illegalMoveResult === false, 'Illegal move destination rejected by server');

  // Find legal neighbor for pursuer 1
  const p1Station = pursuer1!.currentStationId;
  const p1Neighbors = getConnectionsFrom(p1Station);
  const p1Conn = p1Neighbors[0];
  
  const legalMoveResult = engine.submitMove('p_pursuer_1', p1Conn.to, p1Conn.transport);
  assert(legalMoveResult === true, 'Legal move accepted');

  // Confirm move
  engine.confirmMove('p_pursuer_1');
  assert(engine.pendingMoves.get('p_pursuer_1')?.locked === true, 'Move locked after confirmation');

  // Attempt duplicate move in same phase
  const duplicateMoveResult = engine.submitMove('p_pursuer_1', p1Neighbors[1]?.to || p1Conn.to, 'taxi');
  assert(duplicateMoveResult === false, 'Player CANNOT move twice in the same phase');

  // Move fugitive legally
  const fugStation = fugitive!.currentStationId;
  const fugConn = getConnectionsFrom(fugStation)[0];
  engine.submitMove('p_fugitive', fugConn.to, fugConn.transport);
  engine.confirmMove('p_fugitive');

  // AI pursuer submits move
  const p2Conn = getConnectionsFrom(pursuer2!.currentStationId)[0];
  engine.submitMove('p_pursuer_2', p2Conn.to, p2Conn.transport);
  engine.confirmMove('p_pursuer_2');

  // All moves locked -> phase resolves automatically
  assert(fugitive!.currentStationId === fugConn.to, 'Fugitive moved to new station upon resolution');
  assert(engine.currentPhaseNumber === 2, 'Game phase advanced to Phase 2');

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

  for (let moveNumber = 1; moveNumber <= FUGITIVE_LOCATION_REVEAL_INTERVAL; moveNumber++) {
    if (moveNumber === 2) {
      revealEngine.resolvePhase();
    }

    const destination = getConnectionsFrom(revealFugitive.currentStationId)
      .find((connection) => connection.to !== revealPursuer.currentStationId)!;
    revealEngine.submitMove(revealFugitive.id, destination.to, destination.transport);
    revealEngine.confirmMove(revealFugitive.id);
    revealEngine.resolvePhase();

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
  assert(engine.phase === 'planning', 'Match resumes in planning phase');

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
  assert(responsive.decisionEngine.phase === 'planning', 'A real Fugitive decision cancels the AFK timeout');
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
  const botMove = getConnectionsFrom(botFugitive.currentStationId)[0];
  aiEngine.submitMove(botFugitive.id, botMove.to, botMove.transport);
  aiEngine.confirmMove(botFugitive.id);
  aiEngine.resolvePhase();
  assert(/traveled via/i.test(lastIntel()), 'Intel reports the transport when the Fugitive moves');

  // Round 2: the Fugitive stays put -> intel must NOT repeat that transport.
  aiEngine.pendingMoves.clear();
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
