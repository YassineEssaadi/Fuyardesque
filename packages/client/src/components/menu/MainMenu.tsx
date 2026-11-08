import React, { useState } from 'react';
import { Play, Users, KeyRound, HelpCircle, Volume2, VolumeX, Shield, Eye, Sparkles } from 'lucide-react';

interface MainMenuProps {
  playerName: string;
  onChangeName: (name: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onPlaySolo: (role: 'fugitive' | 'pursuer') => void;
  onOpenHowToPlay: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  onChangeName,
  onCreateRoom,
  onJoinRoom,
  onPlaySolo,
  onOpenHowToPlay,
  soundEnabled,
  onToggleSound,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showSoloSelect, setShowSoloSelect] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase());
  };

  return (
    <div className="relative min-h-screen bg-dark-950 text-slate-100 flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      {/* Background Ambience & Cyber Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/15 via-dark-950 to-dark-950 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          onClick={onToggleSound}
          className="p-2 text-slate-400 hover:text-white bg-dark-900/80 border border-slate-800 hover:border-slate-700 rounded-xl transition"
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
        </button>

        <button
          onClick={onOpenHowToPlay}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-slate-300 hover:text-white bg-dark-900/80 border border-slate-800 hover:border-slate-700 rounded-xl transition"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>HOW TO PLAY</span>
        </button>
      </div>

      {/* Central Hero & Menu */}
      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-6">
        {/* Logo Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 border border-cyan-400/50 flex items-center justify-center text-white font-mono font-black text-2xl shadow-[0_0_35px_rgba(6,182,212,0.4)]">
          FY
        </div>

        {/* Title */}
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-200 to-slate-200 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            FUYARDESQUE
          </h1>
          <p className="text-xs md:text-sm font-mono tracking-wider text-slate-400 mt-2 uppercase">
            Urban Pursuit & Hidden Movement Strategy
          </p>
        </div>

        {/* Player Name Field */}
        <div className="w-full bg-dark-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <label className="text-[11px] font-mono text-slate-400 block mb-1.5 text-left uppercase tracking-wider">
            Operative Call-Sign:
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={18}
            className="w-full bg-dark-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-cyan-300 font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
        </div>

        {/* Menu Buttons */}
        <div className="w-full space-y-3">
          {/* Play Solo Button */}
          {!showSoloSelect ? (
            <button
              onClick={() => setShowSoloSelect(true)}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.35)] transition hover:scale-101 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY SOLO (VS AI)</span>
            </button>
          ) : (
            <div className="bg-dark-900 border border-cyan-500/60 p-3 rounded-xl space-y-2 animate-in fade-in duration-200">
              <div className="text-[11px] font-mono text-slate-300">Choose Your Role vs AI:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onPlaySolo('fugitive')}
                  className="py-2.5 bg-rose-950/80 hover:bg-rose-900/80 border border-rose-600/80 text-rose-200 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-4 h-4 text-rose-400" />
                  <span>PLAY AS FUGITIVE</span>
                </button>
                <button
                  onClick={() => onPlaySolo('pursuer')}
                  className="py-2.5 bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-600/80 text-cyan-200 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>PLAY AS PURSUER</span>
                </button>
              </div>
            </div>
          )}

          {/* Create Private Room Button */}
          <button
            onClick={onCreateRoom}
            className="w-full py-3.5 bg-dark-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2 transition hover:scale-101 cursor-pointer"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>CREATE PRIVATE ROOM</span>
          </button>

          {/* Join Room Button / Form */}
          {!showJoinInput ? (
            <button
              onClick={() => setShowJoinInput(true)}
              className="w-full py-3.5 bg-dark-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2 transition hover:scale-101 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>JOIN WITH CODE</span>
            </button>
          ) : (
            <form onSubmit={handleJoin} className="flex gap-2 animate-in fade-in duration-200">
              <input
                type="text"
                placeholder="6-LETTER CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="flex-1 bg-dark-950 border border-cyan-500 rounded-xl px-4 py-3 text-sm font-mono font-bold tracking-widest text-cyan-300 placeholder-slate-600 text-center uppercase focus:outline-none focus:ring-1 focus:ring-cyan-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white px-5 rounded-xl font-mono text-xs font-bold transition shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                JOIN
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 text-[10px] font-mono text-slate-500">
          FUYARDESQUE v1.0 • SERVER-AUTHORITATIVE TACTICAL GAME ENGINE
        </div>
      </div>
    </div>
  );
};
