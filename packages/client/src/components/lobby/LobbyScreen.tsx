import React, { useState } from 'react';
import {
  Difficulty,
  EXTENSION_DURATION_OPTIONS,
  PHASE_DURATION_OPTIONS,
  REVEAL_DURATION_OPTIONS,
  REVEAL_INTERVAL_OPTIONS,
  Role,
  RoomSettings,
  SURVIVAL_DURATION_OPTIONS,
} from '@fuyardesque/shared';
import { LobbyState } from '../../hooks/useGameSocket';
import {
  Copy,
  Check,
  Users,
  Bot,
  Play,
  Shield,
  Eye,
  Settings,
  Trash2,
  Clock,
  Sparkles,
  ArrowLeft,
  Crown,
} from 'lucide-react';

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

interface LobbyScreenProps {
  lobbyState: LobbyState;
  myPlayerId: string;
  onToggleReady: (isReady: boolean) => void;
  onAssignRole: (playerId: string, role: Role) => void;
  onAddBot: (role?: Role, difficulty?: Difficulty) => void;
  onRemoveBot: (botId: string) => void;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onStartGame: () => void;
  onLeave: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  lobbyState,
  myPlayerId,
  onToggleReady,
  onAssignRole,
  onAddBot,
  onRemoveBot,
  onUpdateSettings,
  onStartGame,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedBotRole, setSelectedBotRole] = useState<Role>('pursuer');
  const [selectedBotDiff, setSelectedBotDiff] = useState<Difficulty>('normal');

  const me = lobbyState.players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost || false;
  const fugitivesCount = lobbyState.players.filter((p) => p.role === 'fugitive').length;
  const pursuersCount = lobbyState.players.filter((p) => p.role === 'pursuer').length;
  const humanCount = lobbyState.players.filter((p) => !p.isAi).length;
  const botCount = lobbyState.players.length - humanCount;
  const modeAllowsStart =
    (lobbyState.settings.gameMode === 'solo' && humanCount === 1 && botCount >= 1) ||
    (lobbyState.settings.gameMode === 'multiplayer' && botCount === 0 && humanCount >= 2) ||
    lobbyState.settings.gameMode === 'mixed';
  const canStart =
    isHost &&
    lobbyState.players.length >= 2 &&
    fugitivesCount === 1 &&
    pursuersCount >= 1 &&
    modeAllowsStart;

  const copyCode = () => {
    navigator.clipboard.writeText(lobbyState.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col p-4 md:p-8 select-none">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between mb-6">
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>MAIN MENU</span>
        </button>

        {/* Room Code Badge */}
        <div className="flex items-center gap-3 bg-dark-900 border border-slate-700/80 px-4 py-2 rounded-xl shadow-lg">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Invitation Code
            </div>
            <div className="text-xl font-black font-mono tracking-widest text-cyan-400">
              {lobbyState.roomId}
            </div>
          </div>
          <button
            onClick={copyCode}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition"
            title="Copy invitation code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left 2 Cols: Player List & AI Management */}
        <div className="lg:col-span-2 space-y-5">
          {/* Operatives Roster Card */}
          <div className="bg-dark-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="font-mono font-bold text-sm tracking-wider text-slate-200">
                  TACTICAL SQUAD ROSTER ({lobbyState.players.length}/{lobbyState.settings.maxPlayers})
                </h3>
              </div>
              <div className="text-xs font-mono text-slate-400">
                <span className="text-rose-400 font-bold">{fugitivesCount} Fugitive</span> •{' '}
                <span className="text-cyan-400 font-bold">{pursuersCount} Pursuers</span>
              </div>
            </div>

            {/* Players Table / Cards */}
            <div className="space-y-2.5">
              {lobbyState.players.map((p) => {
                const isMe = p.id === myPlayerId;
                const isFugitive = p.role === 'fugitive';

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      isMe
                        ? 'bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                        : 'bg-dark-950/60 border-slate-800'
                    }`}
                  >
                    {/* Player Info */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100 font-mono">
                            {p.name}
                          </span>
                          {p.isHost && (
                            <span className="flex items-center gap-0.5 text-[9px] font-mono text-amber-300 bg-amber-950/80 border border-amber-700/60 px-1 rounded">
                              <Crown className="w-2.5 h-2.5" /> HOST
                            </span>
                          )}
                          {p.isAi && (
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1 rounded flex items-center gap-0.5">
                              <Bot className="w-2.5 h-2.5" /> {p.difficulty?.toUpperCase()} AI
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {isMe ? 'You' : p.isAi ? 'Simulated Agent' : 'Human Player'}
                        </div>
                      </div>
                    </div>

                    {/* Role & Controls */}
                    <div className="flex items-center gap-2">
                      {/* Ready Status */}
                      {p.isAi || p.isHost ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border bg-emerald-950/60 border-emerald-700 text-emerald-300">
                          READY
                        </span>
                      ) : isMe ? (
                        <button
                          onClick={() => onToggleReady(!p.isReady)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition cursor-pointer hover:scale-105 ${
                            p.isReady
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                              : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                          }`}
                          title="Toggle your ready status"
                        >
                          {p.isReady ? '✓ READY' : 'READY UP'}
                        </button>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                            p.isReady
                              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                              : 'bg-slate-900 border-slate-700 text-slate-400'
                          }`}
                        >
                          {p.isReady ? 'READY' : 'WAITING'}
                        </span>
                      )}

                      {/* Role Button */}
                      {isHost ? (
                        <button
                          onClick={() => onAssignRole(p.id, isFugitive ? 'pursuer' : 'fugitive')}
                          className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition hover:scale-105 cursor-pointer ${
                            isFugitive
                              ? 'bg-rose-950 border-rose-600 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                              : 'bg-cyan-950 border-cyan-600 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                          }`}
                          title="Click to toggle role"
                        >
                          {isFugitive ? 'FUGITIVE' : 'PURSUER'}
                        </button>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                            isFugitive
                              ? 'bg-rose-950 border-rose-600 text-rose-300'
                              : 'bg-cyan-950 border-cyan-600 text-cyan-300'
                          }`}
                        >
                          {isFugitive ? 'FUGITIVE' : 'PURSUER'}
                        </span>
                      )}

                      {/* Remove Bot Button */}
                      {isHost && p.isAi && (
                        <button
                          onClick={() => onRemoveBot(p.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded transition"
                          title="Remove bot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Bot Controls (Host only) */}
            {isHost &&
              lobbyState.settings.gameMode !== 'multiplayer' &&
              lobbyState.players.length < lobbyState.settings.maxPlayers && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Add AI Operative:</span>
                  <select
                    value={selectedBotRole}
                    onChange={(e) => setSelectedBotRole(e.target.value as Role)}
                    className="bg-dark-950 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="pursuer">Pursuer</option>
                    <option value="fugitive">Fugitive</option>
                  </select>
                  <select
                    value={selectedBotDiff}
                    onChange={(e) => setSelectedBotDiff(e.target.value as Difficulty)}
                    className="bg-dark-950 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <button
                  onClick={() => onAddBot(selectedBotRole, selectedBotDiff)}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition"
                >
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>ADD AI</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Match Configuration & Start Button */}
        <div className="space-y-5">
          <div className="bg-dark-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Settings className="w-4 h-4 text-cyan-400" />
              <h3 className="font-mono font-bold text-sm tracking-wider text-slate-200">
                MATCH SETTINGS
              </h3>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1.5">
                Match Mode:
              </label>
              <select
                value={lobbyState.settings.gameMode}
                disabled={!isHost}
                onChange={(event) =>
                  onUpdateSettings({ gameMode: event.target.value as RoomSettings['gameMode'] })
                }
                className="w-full bg-dark-950 border border-slate-700 text-slate-200 px-2.5 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-60"
              >
                <option value="solo">Solo — one human vs AI</option>
                <option value="multiplayer">Multiplayer — humans only</option>
                <option value="mixed">Mixed — humans and AI</option>
              </select>
              {lobbyState.settings.gameMode === 'solo' && humanCount > 1 && (
                <p className="text-[10px] text-amber-400 font-mono mt-1">
                  Solo mode allows only one human player.
                </p>
              )}
            </div>

            {/* Phase Duration Setting */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1.5">
                Simultaneous Movement Phase:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {PHASE_DURATION_OPTIONS.map((dur) => (
                  <button
                    key={dur}
                    disabled={!isHost}
                    onClick={() => onUpdateSettings({ phaseDuration: dur })}
                    className={`py-1.5 text-xs font-mono rounded-lg border transition ${
                      lobbyState.settings.phaseDuration === dur
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                        : 'bg-dark-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-[11px] font-mono text-slate-400">
                Survival Period:
                <select
                  value={lobbyState.settings.survivalDuration}
                  disabled={!isHost}
                  onChange={(event) =>
                    onUpdateSettings({ survivalDuration: Number(event.target.value) })
                  }
                  className="mt-1 w-full bg-dark-950 border border-slate-700 text-slate-200 px-2 py-2 rounded-lg text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                >
                  {SURVIVAL_DURATION_OPTIONS.map((duration) => (
                    <option key={duration} value={duration}>{formatDuration(duration)}</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-mono text-slate-400">
                Optional Extension:
                <select
                  value={lobbyState.settings.extensionDuration}
                  disabled={!isHost}
                  onChange={(event) =>
                    onUpdateSettings({ extensionDuration: Number(event.target.value) })
                  }
                  className="mt-1 w-full bg-dark-950 border border-slate-700 text-slate-200 px-2 py-2 rounded-lg text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                >
                  {EXTENSION_DURATION_OPTIONS.map((duration) => (
                    <option key={duration} value={duration}>{formatDuration(duration)}</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-mono text-slate-400">
                Radar Interval:
                <select
                  value={lobbyState.settings.revealInterval}
                  disabled={!isHost}
                  onChange={(event) =>
                    onUpdateSettings({ revealInterval: Number(event.target.value) })
                  }
                  className="mt-1 w-full bg-dark-950 border border-slate-700 text-slate-200 px-2 py-2 rounded-lg text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                >
                  {REVEAL_INTERVAL_OPTIONS.map((duration) => (
                    <option key={duration} value={duration}>Every {duration}s</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-mono text-slate-400">
                Radar Duration:
                <select
                  value={lobbyState.settings.revealDuration}
                  disabled={!isHost}
                  onChange={(event) =>
                    onUpdateSettings({ revealDuration: Number(event.target.value) })
                  }
                  className="mt-1 w-full bg-dark-950 border border-slate-700 text-slate-200 px-2 py-2 rounded-lg text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                >
                  {REVEAL_DURATION_OPTIONS.map((duration) => (
                    <option key={duration} value={duration}>{duration}s</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Start / Ready Button */}
            <div className="pt-4 border-t border-slate-800">
              {isHost ? (
                <div>
                  <button
                    disabled={!canStart}
                    onClick={onStartGame}
                    className={`w-full py-3.5 rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2 transition ${
                      canStart
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-101 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>START MATCH</span>
                  </button>
                  {!canStart && (
                    <p className="text-[11px] text-amber-400/90 text-center mt-2 font-mono">
                      {lobbyState.players.length < 2
                        ? 'Requires at least 2 players or bots to start.'
                        : !modeAllowsStart
                        ? lobbyState.settings.gameMode === 'solo'
                          ? 'Solo mode needs exactly one human and at least one AI.'
                          : 'Multiplayer mode requires human players only.'
                        : fugitivesCount !== 1
                        ? 'Exactly 1 Fugitive required.'
                        : 'At least 1 Pursuer required.'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center p-3 bg-dark-950/80 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-cyan-400 animate-spin" />
                  <span>Waiting for host to launch the match...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
