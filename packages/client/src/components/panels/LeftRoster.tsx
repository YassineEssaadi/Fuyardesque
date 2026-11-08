import React from 'react';
import {
  ClientGameState,
  FUGITIVE_LOCATION_REVEAL_INTERVAL,
  getStationById,
  TRANSPORT_CONFIG,
} from '@fuyardesque/shared';
import { Users, Bot, CheckCircle2, Clock, ShieldAlert, MapPin, EyeOff } from 'lucide-react';

interface LeftRosterProps {
  gameState: ClientGameState | null;
}

export const LeftRoster: React.FC<LeftRosterProps> = ({ gameState }) => {
  if (!gameState) return null;

  const fugitive = gameState.players.find((p) => p.role === 'fugitive');
  const pursuers = gameState.players.filter((p) => p.role === 'pursuer');
  const myRole = gameState.myRole;

  return (
    <aside className="w-full md:w-56 lg:w-64 h-32 md:h-full shrink-0 bg-dark-900/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-800 flex flex-col overflow-hidden select-none">
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>ROSTER & UNITS</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
          {gameState.players.length} UNITS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* The Fugitive Section */}
        <div>
          <div className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Target: The Fugitive</span>
          </div>

          {fugitive && (
            <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[110px]">
                    {fugitive.name}
                  </span>
                  {fugitive.isAi && (
                    <span className="text-[9px] font-mono bg-rose-900/60 text-rose-300 px-1 rounded">
                      AI
                    </span>
                  )}
                </div>
                {fugitive.hasLockedMove ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Locked
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 animate-spin" /> Planning
                  </span>
                )}
              </div>

              {/* Station display */}
              <div className="text-[11px] font-mono flex items-center justify-between bg-dark-950/60 px-2 py-1.5 rounded border border-slate-800/80">
                <span className="text-slate-400">Position:</span>
                {fugitive.currentStationId ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {fugitive.currentStationId} (
                    {getStationById(fugitive.currentStationId)?.name || 'Unknown'})
                  </span>
                ) : (
                  <span className="text-amber-400/90 font-bold flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    HIDDEN
                  </span>
                )}
              </div>

              {/* Last Transport Method */}
              <div className="text-[11px] font-mono flex items-center justify-between bg-dark-950/60 px-2 py-1.5 rounded border border-slate-800/80">
                <span className="text-slate-400">Last Transport:</span>
                {gameState.lastFugitiveTransport ? (
                  <span
                    className="px-2 py-0.5 rounded font-black text-[10px] border uppercase shadow-sm"
                    style={{
                      backgroundColor: TRANSPORT_CONFIG[gameState.lastFugitiveTransport].bg,
                      color: TRANSPORT_CONFIG[gameState.lastFugitiveTransport].color,
                      borderColor: TRANSPORT_CONFIG[gameState.lastFugitiveTransport].borderColor,
                    }}
                  >
                    {TRANSPORT_CONFIG[gameState.lastFugitiveTransport].label}
                  </span>
                ) : (
                  <span className="text-slate-500 italic text-[10px]">None yet</span>
                )}
              </div>
              {myRole === 'pursuer' && (
                <div className="text-[11px] font-mono flex items-center justify-between bg-dark-950/60 px-2 py-1.5 rounded border border-emerald-900/50">
                  <span className="text-slate-400">Next location reveal:</span>
                  <span className="text-emerald-300 font-bold">
                    {FUGITIVE_LOCATION_REVEAL_INTERVAL -
                      (gameState.fugitiveHistory.length % FUGITIVE_LOCATION_REVEAL_INTERVAL)} move(s)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* The Pursuers Section */}
        <div>
          <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Pursuer Task Force</span>
          </div>

          <div className="space-y-2">
            {pursuers.map((pursuer) => {
              const station = pursuer.currentStationId
                ? getStationById(pursuer.currentStationId)
                : null;
              const isMe = pursuer.id === gameState.myPlayerId;

              return (
                <div
                  key={pursuer.id}
                  className={`bg-dark-800/50 border rounded-lg p-2.5 space-y-1.5 transition ${
                    isMe
                      ? 'border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: pursuer.color }}
                      />
                      <span className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">
                        {pursuer.name} {isMe && '(You)'}
                      </span>
                      {pursuer.isAi && (
                        <span className="text-[9px] font-mono bg-slate-700/60 text-slate-300 px-1 rounded flex items-center gap-0.5">
                          <Bot className="w-2.5 h-2.5" /> AI
                        </span>
                      )}
                    </div>
                    {pursuer.hasLockedMove ? (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between bg-dark-950/40 px-2 py-1 rounded">
                    <span>Loc:</span>
                    <span className="text-cyan-300 font-medium">
                      {pursuer.currentStationId || 'Unknown'} - {station?.name || ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Station Tactical Detail */}
        {gameState.myCurrentStationId && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Your Current Station
            </div>
            {(() => {
              const mySt = getStationById(gameState.myCurrentStationId);
              if (!mySt) return null;
              return (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-2 text-xs font-mono">
                  <div className="text-slate-100 font-bold">{mySt.name}</div>
                  <div className="text-[10px] text-slate-400">
                    ID: <strong className="text-cyan-400">{mySt.id}</strong> | District:{' '}
                    <strong className="text-slate-300">{mySt.district}</strong>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </aside>
  );
};
