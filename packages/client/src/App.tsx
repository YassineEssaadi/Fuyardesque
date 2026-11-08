import React, { useState, useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { TransportType, Role, getAvailableTransports } from '@fuyardesque/shared';
import { MainMenu } from './components/menu/MainMenu';
import { LobbyScreen } from './components/lobby/LobbyScreen';
import { TopNav } from './components/hud/TopNav';
import { LeftRoster } from './components/panels/LeftRoster';
import { RightChatLog } from './components/panels/RightChatLog';
import { BottomMoveBar } from './components/controls/BottomMoveBar';
import { CityMapSvg } from './components/map/CityMapSvg';
import { ExtensionModal } from './components/modals/ExtensionModal';
import { GameOverModal } from './components/modals/GameOverModal';
import { HowToPlayModal } from './components/modals/HowToPlayModal';
import { sound } from './services/sound';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const {
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
  } = useGameSocket();

  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('fy_player_name') || `Agent-${Math.floor(100 + Math.random() * 900)}`;
  });
  const [selectedTransport, setSelectedTransport] = useState<TransportType>('taxi');
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [pendingSoloSetup, setPendingSoloSetup] = useState<Role | null>(null);

  // Sync player name to local storage
  const handleNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('fy_player_name', name);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  // Solo Mode setup handler: creates room and auto-populates AI agents
  const handlePlaySolo = (role: Role) => {
    setPendingSoloSetup(role);
    createRoom(playerName);
  };

  // Stable player id (differs from socketId after a reconnection).
  const myPlayerId = lobbyState?.myPlayerId || socketId;

  useEffect(() => {
    if (pendingSoloSetup && lobbyState && lobbyState.hostId === myPlayerId && !gameState) {
      const targetRole = pendingSoloSetup;
      setPendingSoloSetup(null);

      // Assign host role
      assignRole(myPlayerId, targetRole);
      updateSettings({ gameMode: 'solo' });

      // Add appropriate bots
      if (targetRole === 'fugitive') {
        // Human is Fugitive: Add 3 AI Pursuers
        addBot('pursuer', 'easy');
        addBot('pursuer', 'normal');
        addBot('pursuer', 'hard');
      } else {
        // Human is Pursuer: Add 1 AI Fugitive + 2 AI Pursuers
        addBot('fugitive', 'normal');
        addBot('pursuer', 'easy');
        addBot('pursuer', 'normal');
      }

      // Auto start game after bots populate
      setTimeout(() => {
        startGame();
      }, 600);
    }
  }, [pendingSoloSetup, lobbyState, myPlayerId, gameState, updateSettings]);

  // Reset selected destination when new round phase begins
  useEffect(() => {
    setSelectedDestination(null);
  }, [gameState?.currentPhaseNumber, gameState?.turnRole, gameState?.phase]);

  const handleSelectStation = (stationId: string, preferredTransport?: TransportType) => {
    if (!gameState || gameState.myPendingMove?.locked) return;

    if (gameState.phase === 'setup') {
      setSelectedDestination(stationId);
      selectMove(stationId, 'taxi');
      return;
    }

    if (
      gameState.phase !== 'planning' ||
      gameState.turnRole !== gameState.myRole
    ) return;

    const myStation = gameState.myCurrentStationId;
    const available = getAvailableTransports(myStation, stationId);
    if (available.length === 0) return;

    let transport = preferredTransport || selectedTransport;
    if (!available.includes(transport)) {
      transport = available[0];
    }
    setSelectedTransport(transport);
    setSelectedDestination(stationId);
    selectMove(stationId, transport);
  };

  const handleSelectTransport = (transport: TransportType) => {
    if (
      gameState?.myPendingMove?.locked ||
      gameState?.phase !== 'planning' ||
      gameState.turnRole !== gameState.myRole
    ) return;
    setSelectedTransport(transport);
    setSelectedDestination(null);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-dark-950 text-slate-100 overflow-hidden font-sans">
      {/* Notifications Toast Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-2.5 rounded-xl border text-xs font-mono shadow-2xl backdrop-blur-md pointer-events-auto animate-in slide-in-from-right duration-200 ${
              n.type === 'alert'
                ? 'bg-rose-950/90 border-rose-500/80 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : n.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/80 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                : 'bg-dark-900/90 border-cyan-500/60 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>

      {/* Error Alert Toast */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-950/90 border border-rose-500 text-rose-200 px-4 py-2.5 rounded-xl text-xs font-mono shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Screen Routing */}
      {!lobbyState ? (
        <MainMenu
          playerName={playerName}
          onChangeName={handleNameChange}
          onCreateRoom={() => createRoom(playerName)}
          onJoinRoom={(code) => joinRoom(code, playerName)}
          onPlaySolo={handlePlaySolo}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      ) : !gameState || gameState.phase === 'lobby' ? (
        <LobbyScreen
          lobbyState={lobbyState}
          myPlayerId={myPlayerId}
          onToggleReady={toggleReady}
          onAssignRole={assignRole}
          onAddBot={addBot}
          onRemoveBot={removeBot}
          onUpdateSettings={updateSettings}
          onStartGame={startGame}
          onLeave={() => window.location.reload()}
        />
      ) : (
        /* Active Game Screen */
        <div className="w-full h-full flex flex-col overflow-hidden">
          {/* Top HUD */}
          <TopNav
            gameState={gameState}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />

          {/* Main Body: Left Panel + Center Map + Right Panel */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Left Roster Panel */}
            <LeftRoster gameState={gameState} />

            {/* Center Interactive Map */}
            <main className="flex-1 min-h-0 min-w-0 relative p-2 overflow-hidden flex flex-col">
              <CityMapSvg
                gameState={gameState}
                selectedTransport={selectedTransport}
                selectedDestination={selectedDestination}
                onSelectStation={handleSelectStation}
                onSelectTransport={handleSelectTransport}
              />
            </main>

            {/* Right Chat and History Panel */}
            <RightChatLog
              gameState={gameState}
              chatMessages={chatMessages}
              onSendChat={sendChat}
            />
          </div>

          {/* Bottom Controls Bar */}
          <BottomMoveBar
            gameState={gameState}
            selectedTransport={selectedTransport}
            selectedDestination={selectedDestination}
            onSelectTransport={handleSelectTransport}
            onSelectDestination={handleSelectStation}
            onConfirmMove={confirmMove}
          />

          {/* Modals */}
          <ExtensionModal
            gameState={gameState}
            onDecision={fugitiveDecision}
          />

          <GameOverModal
            gameState={gameState}
            onRestart={restartGame}
          />
        </div>
      )}

      {/* How To Play Modal */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </div>
  );
};

export default App;
