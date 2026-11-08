import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from '../src/rooms/RoomManager';
import { setupSocketHandlers } from '../src/socket/socketHandler';
import { ClientGameState, SOCKET_EVENTS, getConnectionsFrom } from '@fuyardesque/shared';

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

async function runMultiplayerE2E() {
  console.log('\n=== RUNNING LIVE MULTIPLAYER SOCKET INTEGRATION TESTS ===\n');

  // Start test server on port 4005
  const app = express();
  const server = http.createServer(app);
  const ioServer = new Server(server, { cors: { origin: '*' } });
  const roomManager = new RoomManager(ioServer);
  setupSocketHandlers(ioServer, roomManager);

  await new Promise<void>((resolve) => server.listen(4005, '127.0.0.1', resolve));
  console.log('Test Socket Server running on 127.0.0.1:4005');

  const tokenA = 'test-token-host-a-0001';
  const tokenB = 'test-token-player-b-0002';

  const clientA: ClientSocketType = ClientSocket('http://127.0.0.1:4005', {
    transports: ['websocket'],
    forceNew: true,
  });
  const clientB: ClientSocketType = ClientSocket('http://127.0.0.1:4005', {
    transports: ['websocket'],
    forceNew: true,
  });

  await Promise.all([
    new Promise((resolve) => clientA.on('connect', resolve)),
    new Promise((resolve) => clientB.on('connect', resolve)),
  ]);
  assert(clientA.connected && clientB.connected, 'Two independent browser clients connected via WebSocket');

  // Register listener BEFORE emitting create_room
  let roomCode = '';
  const lobbyPromiseA = new Promise<any>((resolve) => {
    clientA.on(SOCKET_EVENTS.ROOM_STATE, (state) => {
      if (!roomCode) {
        roomCode = state.roomId;
        resolve(state);
      }
    });
  });

  clientA.emit(SOCKET_EVENTS.CREATE_ROOM, { playerName: 'FugitiveHost', token: tokenA });
  const lobbyA = await lobbyPromiseA;

  assert(roomCode.length === 6, `Room successfully created with 6-char code: ${roomCode}`);
  assert(lobbyA.players.length === 1, 'Lobby contains Host');
  assert(lobbyA.myPlayerId === clientA.id, 'Host receives its stable player id');

  // Client B joins with room code - register listener first
  const lobbyPromiseB = new Promise<any>((resolve) => {
    clientB.on(SOCKET_EVENTS.ROOM_STATE, (state) => {
      if (state.players.length === 2) {
        resolve(state);
      }
    });
  });

  clientB.emit(SOCKET_EVENTS.JOIN_ROOM, {
    roomId: roomCode,
    playerName: 'DetectivePursuer',
    token: tokenB,
  });
  const lobbyB = await lobbyPromiseB;

  assert(lobbyB.players.length === 2, 'Client B successfully joined room with invitation code');
  assert(lobbyB.myPlayerId === clientB.id, 'Joining player receives its stable player id');

  // Client A adds an AI Pursuer
  const botAddedPromise = new Promise((resolve) => {
    clientA.on(SOCKET_EVENTS.ROOM_STATE, (state) => {
      if (state.players.length === 3) resolve(state);
    });
  });

  clientA.emit(SOCKET_EVENTS.ADD_BOT, { role: 'pursuer', difficulty: 'normal' });
  await botAddedPromise;
  assert(true, 'AI Bot added to the match roster');

  // Ready status is broadcast to the lobby.
  const readyPromise = new Promise<any>((resolve) => {
    const handler = (state: any) => {
      const playerB = state.players.find(
        (p: any) => !p.isAi && p.name === 'DetectivePursuer'
      );
      if (playerB?.isReady) {
        clientA.off(SOCKET_EVENTS.ROOM_STATE, handler);
        resolve(state);
      }
    };
    clientA.on(SOCKET_EVENTS.ROOM_STATE, handler);
  });
  clientB.emit(SOCKET_EVENTS.TOGGLE_READY, { isReady: true });
  await readyPromise;
  assert(true, 'Ready status updates and broadcasts to the lobby');

  // Turn duration is fixed to 30 seconds.
  const nextLobbyState = () =>
    new Promise<any>((resolve) => clientA.once(SOCKET_EVENTS.ROOM_STATE, resolve));

  clientA.emit(SOCKET_EVENTS.UPDATE_SETTINGS, { settings: { phaseDuration: 25 } });
  const afterInvalidDuration = await nextLobbyState();
  assert(
    afterInvalidDuration.settings.phaseDuration === 30,
    'Unsupported 25s turn duration is rejected'
  );

  clientA.emit(SOCKET_EVENTS.UPDATE_SETTINGS, { settings: { phaseDuration: 20 } });
  const afterUnsupportedDuration = await nextLobbyState();
  assert(afterUnsupportedDuration.settings.phaseDuration === 30, 'Turn duration cannot be changed from 30 seconds');

  clientA.emit(SOCKET_EVENTS.UPDATE_SETTINGS, { settings: { phaseDuration: 30 } });
  await nextLobbyState();

  clientA.emit(SOCKET_EVENTS.UPDATE_SETTINGS, {
    settings: {
      survivalDuration: 600,
      extensionDuration: 120,
      revealInterval: 60,
      revealDuration: 3,
    },
  });
  const configuredLobby = await nextLobbyState();
  assert(
    configuredLobby.settings.survivalDuration === 600 &&
      configuredLobby.settings.extensionDuration === 120 &&
      configuredLobby.settings.revealInterval === 60 &&
      configuredLobby.settings.revealDuration === 3,
    'Supported survival, extension, and radar settings are applied'
  );

  clientA.emit(SOCKET_EVENTS.UPDATE_SETTINGS, {
    settings: {
      survivalDuration: 61,
      extensionDuration: 121,
      revealInterval: 31,
      revealDuration: 4,
    },
  });
  const invalidConfiguration = await nextLobbyState();
  assert(
    invalidConfiguration.settings.survivalDuration === 600 &&
      invalidConfiguration.settings.extensionDuration === 120 &&
      invalidConfiguration.settings.revealInterval === 60 &&
      invalidConfiguration.settings.revealDuration === 3,
    'Unsupported timer and radar values are rejected'
  );

  clientA.emit(SOCKET_EVENTS.UPDATE_SETTINGS, {
    settings: {
      survivalDuration: 510,
      extensionDuration: 300,
      revealInterval: 90,
      revealDuration: 5,
    },
  });
  await nextLobbyState();

  // Both clients await their initial game:state before starting
  const statePromiseA = new Promise<ClientGameState>((resolve) =>
    clientA.once(SOCKET_EVENTS.GAME_STATE, resolve)
  );
  const statePromiseB = new Promise<ClientGameState>((resolve) =>
    clientB.once(SOCKET_EVENTS.GAME_STATE, resolve)
  );

  // Client A starts the match
  clientA.emit(SOCKET_EVENTS.START_GAME);

  const [stateA, stateB] = await Promise.all([statePromiseA, statePromiseB]);

  assert(stateA.phase === 'setup', 'Game starts with starting-station selection for Client A');
  assert(stateB.phase === 'setup', 'Game starts with starting-station selection for Client B');
  assert(stateA.myRole === 'fugitive', 'Client A is assigned Fugitive role');
  assert(stateB.myRole === 'pursuer', 'Client B is assigned Pursuer role');

  const planningPromiseA = new Promise<ClientGameState>((resolve) => {
    const handler = (state: ClientGameState) => {
      if (state.phase === 'planning') {
        clientA.off(SOCKET_EVENTS.GAME_STATE, handler);
        resolve(state);
      }
    };
    clientA.on(SOCKET_EVENTS.GAME_STATE, handler);
  });
  const planningPromiseB = new Promise<ClientGameState>((resolve) => {
    const handler = (state: ClientGameState) => {
      if (state.phase === 'planning') {
        clientB.off(SOCKET_EVENTS.GAME_STATE, handler);
        resolve(state);
      }
    };
    clientB.on(SOCKET_EVENTS.GAME_STATE, handler);
  });

  clientA.emit(SOCKET_EVENTS.SELECT_MOVE, { toStationId: 'st-49', transport: 'taxi' });
  clientB.emit(SOCKET_EVENTS.SELECT_MOVE, { toStationId: 'st-50', transport: 'taxi' });
  clientA.emit(SOCKET_EVENTS.CONFIRM_MOVE);
  clientB.emit(SOCKET_EVENTS.CONFIRM_MOVE);
  const [planningStateA, planningStateB] = await Promise.all([planningPromiseA, planningPromiseB]);
  assert(
    planningStateA.turnRole === 'fugitive' && planningStateB.turnRole === 'fugitive',
    'The Fugitive receives the first 30-second movement turn'
  );
  assert(planningStateA.phaseTimeRemaining === 30, 'Fugitive turn timer starts at 30 seconds');
  assert(
    new Set(planningStateA.players.map((player) => player.currentStationId).filter(Boolean)).size === 3,
    'All players retain their distinct selected starting stations when setup ends'
  );

  // Strict Security payload check on real WebSocket transmission:
  const fugitiveInViewB = planningStateB.players.find((p) => p.role === 'fugitive');
  assert(
    fugitiveInViewB?.currentStationId === null,
    'SECURITY VERIFIED: Client B (Pursuer) received NULL currentStationId for Fugitive over WebSocket'
  );

  const fugitiveInViewA = planningStateA.players.find((p) => p.role === 'fugitive');
  assert(
    fugitiveInViewA?.currentStationId !== null && fugitiveInViewA?.currentStationId !== '',
    'Client A (Fugitive) received their own currentStationId over WebSocket'
  );

  const detectiveTurnPromise = new Promise<ClientGameState>((resolve) => {
    const handler = (state: ClientGameState) => {
      if (state.phase === 'planning' && state.turnRole === 'pursuer') {
        clientB.off(SOCKET_EVENTS.GAME_STATE, handler);
        resolve(state);
      }
    };
    clientB.on(SOCKET_EVENTS.GAME_STATE, handler);
  });
  const fugitiveMove = getConnectionsFrom(planningStateA.myCurrentStationId).find(
    (connection) => connection.to !== 'st-50' && connection.to !== 'st-01'
  )!;
  clientA.emit(SOCKET_EVENTS.SELECT_MOVE, {
    toStationId: fugitiveMove.to,
    transport: fugitiveMove.transport,
  });
  clientA.emit(SOCKET_EVENTS.CONFIRM_MOVE);
  const detectiveTurnState = await detectiveTurnPromise;
  assert(
    detectiveTurnState.currentPhaseNumber === 1 && detectiveTurnState.phaseTimeRemaining === 30,
    'Detectives receive their own 30-second turn after the Fugitive moves'
  );
  assert(
    detectiveTurnState.players.find((player) => player.role === 'fugitive')?.currentStationId === null &&
      detectiveTurnState.fugitiveHistory[0]?.revealedStationId === undefined,
    'Detective turn begins with the Fugitive location still hidden until a reveal milestone'
  );

  // Test Team Chat Isolation
  let chatLeakDetected = false;
  clientA.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg) => {
    if (msg.team === 'pursuer') chatLeakDetected = true;
  });

  const chatPromiseB = new Promise<any>((resolve) => {
    clientB.once(SOCKET_EVENTS.CHAT_MESSAGE, resolve);
  });

  clientB.emit(SOCKET_EVENTS.SEND_CHAT, { text: 'Tactical intercept rendezvous at Central Hub!' });
  const pursuerMsg = await chatPromiseB;

  assert(pursuerMsg.text.includes('rendezvous'), 'Pursuer chat message broadcast to Client B');
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert(!chatLeakDetected, 'SECURITY: Fugitive client did NOT receive Pursuers team chat message');

  // -------------------------------------------------------------
  // P1: Reconnection, phase guards & host migration
  // -------------------------------------------------------------
  console.log('\n[P1: Session Integrity]');

  const room = roomManager.getRoom(roomCode)!;
  const originalPlayerBId = lobbyB.myPlayerId;

  // Reconnect client B mid-match with the same identity token.
  clientB.disconnect();
  await new Promise((resolve) => setTimeout(resolve, 300));

  assert(
    room.players.get(originalPlayerBId)?.connected === false,
    'Disconnected player is preserved while the match is running'
  );
  assert(room.hostId === lobbyA.myPlayerId, 'Connected host keeps host status');

  const clientB2: ClientSocketType = ClientSocket('http://127.0.0.1:4005', {
    transports: ['websocket'],
    forceNew: true,
  });
  await new Promise((resolve) => clientB2.on('connect', resolve));

  const rejoinLobbyPromise = new Promise<any>((resolve) => {
    clientB2.on(SOCKET_EVENTS.ROOM_STATE, (state) => {
      if (state.myPlayerId === originalPlayerBId) resolve(state);
    });
  });
  const rejoinGamePromise = new Promise<ClientGameState>((resolve) =>
    clientB2.once(SOCKET_EVENTS.GAME_STATE, resolve)
  );

  clientB2.emit(SOCKET_EVENTS.JOIN_ROOM, {
    roomId: roomCode,
    playerName: 'DetectivePursuer',
    token: tokenB,
  });

  const rejoinLobby = await rejoinLobbyPromise;
  const rejoinGame = await rejoinGamePromise;

  assert(
    rejoinLobby.myPlayerId === originalPlayerBId,
    'Reconnecting socket reclaimed the same stable player id'
  );
  assert(
    room.players.get(originalPlayerBId)?.connected === true,
    'Player is marked connected after reconnection'
  );
  assert(
    rejoinGame.myRole === 'pursuer' && rejoinGame.phase === 'planning',
    'Reconnecting client received the live match state'
  );

  // Lobby mutations must be rejected while the match is running.
  const guardErrorPromise = new Promise<any>((resolve) =>
    clientA.once(SOCKET_EVENTS.ERROR, resolve)
  );
  const playersBefore = room.players.size;
  clientA.emit(SOCKET_EVENTS.ADD_BOT, { role: 'pursuer', difficulty: 'normal' });
  const guardError = await guardErrorPromise;

  assert(/lobby/i.test(guardError.message), 'Mid-match lobby mutations are rejected');
  assert(room.players.size === playersBefore, 'Rejected mid-match mutation did not change the roster');

  const restartErrorPromise = new Promise<any>((resolve) =>
    clientA.once(SOCKET_EVENTS.ERROR, resolve)
  );
  clientA.emit(SOCKET_EVENTS.RESTART_GAME);
  const restartError = await restartErrorPromise;

  assert(/over before restarting/i.test(restartError.message), 'Mid-match restart is rejected');
  assert(room.gameEngine !== null, 'Rejected restart keeps the engine alive');

  // Host migration: the remaining connected human takes over.
  clientA.disconnect();
  await new Promise((resolve) => setTimeout(resolve, 300));

  assert(room.hostId === originalPlayerBId, 'Host migrates to the remaining connected human');
  assert(
    room.players.get(originalPlayerBId)?.isHost === true,
    'Promoted player is flagged as host'
  );

  // Moving an active socket to another room must detach it from all old-room
  // broadcasts and direct per-player game-state updates.
  const newRoomPromise = new Promise<any>((resolve) => {
    const handler = (state: any) => {
      if (state.players.length === 1) {
        clientB2.off(SOCKET_EVENTS.ROOM_STATE, handler);
        resolve(state);
      }
    };
    clientB2.on(SOCKET_EVENTS.ROOM_STATE, handler);
  });
  let oldRoomNoticeCount = 0;
  let oldRoomGameStateCount = 0;
  const oldRoomNoticeHandler = () => { oldRoomNoticeCount++; };
  const oldRoomStateHandler = () => { oldRoomGameStateCount++; };
  clientB2.on(SOCKET_EVENTS.NOTIFICATION, oldRoomNoticeHandler);
  clientB2.on(SOCKET_EVENTS.GAME_STATE, oldRoomStateHandler);

  clientB2.emit(SOCKET_EVENTS.CREATE_ROOM, {
    playerName: 'DetectivePursuer',
    token: 'test-token-new-room-b-0003',
  });
  const newRoomState: any = await newRoomPromise;
  ioServer.to(`room_${roomCode}`).emit(SOCKET_EVENTS.NOTIFICATION, {
    message: 'Old-room-only notification',
    type: 'info',
  });
  room.broadcastGameState();
  await new Promise((resolve) => setTimeout(resolve, 150));

  assert(
    room.getSocketIdForPlayer(originalPlayerBId) === undefined,
    'Moving rooms clears the old player socket binding'
  );
  assert(
    roomManager.getRoomBySocket(clientB2.id)?.id !== roomCode,
    'Moved socket is mapped only to its new room'
  );
  assert(oldRoomNoticeCount === 0, 'Moved socket is removed from the previous Socket.IO room');
  assert(oldRoomGameStateCount === 0, 'Old room cannot send game state to the moved socket');

  clientB2.off(SOCKET_EVENTS.NOTIFICATION, oldRoomNoticeHandler);
  clientB2.off(SOCKET_EVENTS.GAME_STATE, oldRoomStateHandler);

  // Unlimited-time private room and human-majority end vote.
  const unlimitedSettingsPromise = new Promise<any>((resolve) => {
    const handler = (state: any) => {
      if (state.settings.unlimitedTime) {
        clientB2.off(SOCKET_EVENTS.ROOM_STATE, handler);
        resolve(state);
      }
    };
    clientB2.on(SOCKET_EVENTS.ROOM_STATE, handler);
  });
  clientB2.emit(SOCKET_EVENTS.UPDATE_SETTINGS, { settings: { unlimitedTime: true } });
  const unlimitedLobby = await unlimitedSettingsPromise;
  assert(unlimitedLobby.settings.unlimitedTime, 'Host can enable unlimited-time mode in a private room');

  const clientC: ClientSocketType = ClientSocket('http://127.0.0.1:4005', {
    transports: ['websocket'],
    forceNew: true,
  });
  await new Promise((resolve) => clientC.on('connect', resolve));
  const secondPlayerLobbyPromise = new Promise<any>((resolve) => {
    const handler = (state: any) => {
      if (state.players.length === 2) {
        clientC.off(SOCKET_EVENTS.ROOM_STATE, handler);
        resolve(state);
      }
    };
    clientC.on(SOCKET_EVENTS.ROOM_STATE, handler);
  });
  clientC.emit(SOCKET_EVENTS.JOIN_ROOM, {
    roomId: newRoomState.roomId,
    playerName: 'SecondVoter',
    token: 'test-token-second-voter-0004',
  });
  const secondPlayerLobby = await secondPlayerLobbyPromise;

  const assignedRolesPromise = new Promise<any>((resolve) => {
    const handler = (state: any) => {
      if (
        state.players.some((player: any) => player.id === newRoomState.myPlayerId && player.role === 'fugitive') &&
        state.players.some((player: any) => player.id === secondPlayerLobby.myPlayerId && player.role === 'pursuer')
      ) {
        clientB2.off(SOCKET_EVENTS.ROOM_STATE, handler);
        resolve(state);
      }
    };
    clientB2.on(SOCKET_EVENTS.ROOM_STATE, handler);
  });
  clientB2.emit(SOCKET_EVENTS.ASSIGN_ROLE, {
    playerId: newRoomState.myPlayerId,
    role: 'fugitive',
  });
  clientB2.emit(SOCKET_EVENTS.ASSIGN_ROLE, {
    playerId: secondPlayerLobby.myPlayerId,
    role: 'pursuer',
  });
  await assignedRolesPromise;

  const unlimitedStartPromise = new Promise<ClientGameState>((resolve) =>
    clientB2.once(SOCKET_EVENTS.GAME_STATE, resolve)
  );
  clientB2.emit(SOCKET_EVENTS.START_GAME);
  const unlimitedStartState = await unlimitedStartPromise;
  assert(
    unlimitedStartState.phase === 'setup' &&
      unlimitedStartState.phaseTimeRemaining === 0 &&
      unlimitedStartState.settings.unlimitedTime,
    'Unlimited matches begin setup with no timer'
  );

  const firstVotePromise = new Promise<ClientGameState>((resolve) => {
    const handler = (state: ClientGameState) => {
      if (state.endVoteCount === 1 && state.phase === 'setup') {
        clientB2.off(SOCKET_EVENTS.GAME_STATE, handler);
        resolve(state);
      }
    };
    clientB2.on(SOCKET_EVENTS.GAME_STATE, handler);
  });
  clientB2.emit(SOCKET_EVENTS.VOTE_END_MATCH);
  const firstVoteState = await firstVotePromise;
  assert(
    firstVoteState.endVoteThreshold === 2 && firstVoteState.phase === 'setup',
    'One of two human votes does not end the match'
  );

  const voteEndedPromise = new Promise<ClientGameState>((resolve) => {
    const handler = (state: ClientGameState) => {
      if (state.phase === 'game_over') {
        clientB2.off(SOCKET_EVENTS.GAME_STATE, handler);
        resolve(state);
      }
    };
    clientB2.on(SOCKET_EVENTS.GAME_STATE, handler);
  });
  clientC.emit(SOCKET_EVENTS.VOTE_END_MATCH);
  const voteEndedState = await voteEndedPromise;
  assert(
    voteEndedState.winner === null && voteEndedState.winReason === 'vote_ended',
    'The second human vote ends the match without a role winner'
  );

  // Disconnect & cleanup
  clientC.disconnect();
  clientB2.disconnect();
  ioServer.close();
  server.close();

  console.log(`\n===============================================`);
  console.log(`MULTIPLAYER E2E SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runMultiplayerE2E().catch((err) => {
  console.error(err);
  process.exit(1);
});
