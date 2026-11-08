import React from 'react';
import {
  ClientGameState,
  STARTING_POSITION_DURATION_SECONDS,
  TRANSPORT_CONFIG,
} from '@fuyardesque/shared';
import { Shield, Radio, Volume2, VolumeX, Eye, AlertTriangle } from 'lucide-react';
import { sound } from '../../services/sound';

interface TopNavProps {
  gameState: ClientGameState | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  gameState,
  soundEnabled,
  onToggleSound,
}) => {
  if (!gameState) return null;

  // Format survival time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isFugitive = gameState.myRole === 'fugitive';
  const survivalLow = !gameState.settings.unlimitedTime && gameState.survivalTimeRemaining < 90;
  const phaseDuration =
    gameState.phase === 'setup'
      ? STARTING_POSITION_DURATION_SECONDS
      : gameState.settings.phaseDuration;
  const phasePercent = Math.max(
    0,
    Math.min(100, (gameState.phaseTimeRemaining / phaseDuration) * 100)
  );

  return (
    <header className="w-full bg-dark-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 select-none z-30">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-mono shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            FY
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-slate-100 font-mono">
              FUYARDESQUE
            </h1>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <span>ROOM:</span>
              <span className="text-cyan-400 font-bold tracking-wider">{gameState.roomId}</span>
              {gameState.extensionUsed && (
                <span className="text-amber-400 font-bold bg-amber-950/60 px-1 py-0.2 rounded border border-amber-800/60">
                  +5M EXT
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Center Tactical Timers */}
      <div className="flex items-center gap-6">
        {/* Survival Match Timer */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium">
            Survival Clock
          </div>
          <div
            className={`text-xl font-black font-mono tracking-wider ${
              survivalLow
                ? 'text-red-400 animate-pulse drop-shadow-[0_0_8px_#ef4444]'
                : 'text-slate-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]'
            }`}
          >
            {gameState.settings.unlimitedTime ? 'NO LIMIT' : formatTime(gameState.survivalTimeRemaining)}
          </div>
        </div>

        {/* Phase Movement Timer */}
        <div className="flex flex-col items-center w-36">
          <div className="flex items-center justify-between w-full text-[10px] font-mono tracking-wider text-slate-400 mb-0.5">
            <span>
              {gameState.phase === 'setup'
                ? 'START POSITIONS'
                : gameState.phase === 'planning'
                  ? `${gameState.turnRole === 'fugitive' ? 'FUGITIVE' : 'DETECTIVES'} TURN · ROUND ${gameState.currentPhaseNumber}`
                  : `ROUND ${gameState.currentPhaseNumber}`}
            </span>
            <span className="font-bold text-cyan-400">
              {gameState.settings.unlimitedTime ? 'NO DEADLINE' : `${gameState.phaseTimeRemaining}s`}
            </span>
          </div>
          {!gameState.settings.unlimitedTime && (
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className={`h-full transition-all duration-1000 ${
                  gameState.phaseTimeRemaining <= 5 ? 'bg-red-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${phasePercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Radar / Revelation Alert Status */}
        <div className="hidden md:flex items-center gap-2 bg-dark-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          {gameState.settings.unlimitedTime ? (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
              <Radio className="w-3.5 h-3.5 text-slate-500" />
              <span>TIMED RADAR OFF</span>
            </div>
          ) : gameState.revelation.active ? (
            <div className="flex items-center gap-1.5 text-red-400 animate-pulse text-xs font-mono font-bold">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>RADAR SWEEP ACTIVE!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>
                Radar sweep in:{' '}
                <strong className="text-cyan-300">{gameState.revelation.nextRevealIn}s</strong>
              </span>
            </div>
          )}
        </div>

        {/* Fugitive Last Transport Intel Badge */}
        {gameState.lastFugitiveTransport ? (
          <div className="flex items-center gap-2 bg-dark-950/90 px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 font-bold hidden xl:inline">
              FUGITIVE LAST MOVED:
            </span>
            <span
              className="px-2.5 py-0.5 rounded font-mono font-black text-xs border uppercase tracking-wider animate-pulse shadow-sm"
              style={{
                backgroundColor: TRANSPORT_CONFIG[gameState.lastFugitiveTransport].bg,
                color: TRANSPORT_CONFIG[gameState.lastFugitiveTransport].color,
                borderColor: TRANSPORT_CONFIG[gameState.lastFugitiveTransport].borderColor,
              }}
            >
              {TRANSPORT_CONFIG[gameState.lastFugitiveTransport].label}
            </span>
          </div>
        ) : (
          <div className="hidden xl:flex items-center gap-1.5 bg-dark-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-500">
            <span>FUGITIVE: ROUND 1 (WAITING MOVE)</span>
          </div>
        )}
      </div>

      {/* Right: Role Badge & Sound Controls */}
      <div className="flex items-center gap-3">
        {/* Role Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border tracking-wide shadow-sm ${
            isFugitive
              ? 'bg-rose-950/70 border-rose-600 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'bg-cyan-950/70 border-cyan-600 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
          }`}
        >
          {isFugitive ? <Eye className="w-3.5 h-3.5 text-rose-400" /> : <Shield className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{isFugitive ? 'FUGITIVE' : 'PURSUER'}</span>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={onToggleSound}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg transition"
          title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>
      </div>
    </header>
  );
};
