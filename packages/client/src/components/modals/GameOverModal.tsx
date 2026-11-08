import React, { useEffect } from 'react';
import { ClientGameState, getStationById } from '@fuyardesque/shared';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, Crosshair, Users, Timer, Shield } from 'lucide-react';

interface GameOverModalProps {
  gameState: ClientGameState | null;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ gameState, onRestart }) => {
  const isGameOver = gameState?.phase === 'game_over';
  const winner = gameState?.winner ?? null;
  const isWinner = isGameOver && winner === gameState?.myRole;
  const isVoteEnded = gameState?.winReason === 'vote_ended';
  const isNeutralEnd = isVoteEnded || winner === null;

  // NOTE: This hook must run on every render. The early return below previously
  // sat above it, so the component rendered 0 hooks during play and 1 hook at
  // game over, which crashed the game screen with "Rendered more hooks than
  // during the previous render".
  useEffect(() => {
    if (isGameOver && isWinner) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isGameOver, isWinner]);

  if (!gameState || !isGameOver) return null;

  const captureStation = gameState.captureStationId
    ? getStationById(gameState.captureStationId)
    : null;
  const capturingPursuers =
    gameState.winReason === 'captured' && gameState.captureStationId
      ? gameState.players.filter(
          (player) =>
            player.role === 'pursuer' &&
            player.currentStationId === gameState.captureStationId
        )
      : [];

  const getReasonText = () => {
    switch (gameState.winReason) {
      case 'captured':
        return `The Fugitive was intercepted and captured at station ${
          captureStation ? `${captureStation.name} (${captureStation.id})` : 'target location'
        }!`;
      case 'survived':
        return 'The Fugitive survived the complete 8 minutes and 30 seconds without being captured!';
      case 'extension_survived':
        return 'The Fugitive survived both the full survival period and the bonus 5-minute extension!';
      case 'vote_ended':
        return 'The human players chose to stop the match by majority vote.';
      default:
        return 'Match completed.';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-dark-900 border-2 border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Victory / Defeat Header Icon */}
        <div
          className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center border-2 ${
            isWinner
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
              : isNeutralEnd
                ? 'bg-slate-800 border-slate-500 text-slate-300'
                : 'bg-rose-950/80 border-rose-500 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)]'
          }`}
        >
          {isWinner ? (
              <Trophy className="w-10 h-10 animate-bounce" />
          ) : isNeutralEnd ? (
              <Users className="w-10 h-10" />
          ) : (
              <Skull className="w-10 h-10" />
          )}
        </div>

        <h2 className="text-3xl font-black font-mono tracking-wider text-slate-100 mb-1">
          {isVoteEnded
              ? 'MATCH ENDED BY VOTE'
              : winner === 'fugitive'
                ? 'FUGITIVE VICTORY'
                : winner === 'pursuer'
                  ? 'PURSUERS VICTORY'
                  : 'MATCH COMPLETE'}
        </h2>

        <div
          className={`inline-block text-xs font-mono font-bold px-3 py-1 rounded-full border mb-4 ${
            isWinner
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
              : isNeutralEnd
                ? 'bg-slate-800 border-slate-500 text-slate-300'
                : 'bg-rose-950/60 border-rose-500 text-rose-300'
          }`}
        >
          {isWinner
            ? '★ MISSION ACCOMPLISHED ★'
            : isVoteEnded
              ? 'HUMAN MAJORITY VOTE'
              : isNeutralEnd
                ? 'MATCH COMPLETE'
                : 'MISSION FAILED'}
        </div>

        <p className="text-slate-300 text-xs mb-6 px-2 leading-relaxed font-sans">
          {getReasonText()}
        </p>

        {/* Tactical Match Summary */}
        <div className="bg-dark-950/80 border border-slate-800 rounded-xl p-3.5 mb-6 text-xs font-mono space-y-2 text-left">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
              Total Phases:
            </span>
            <span className="font-bold text-slate-200">{gameState.currentPhaseNumber}</span>
          </div>

          {captureStation && (
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-red-400" />
                Capture Location:
              </span>
              <span className="font-bold text-red-400">
                {captureStation.name} ({captureStation.id})
              </span>
            </div>
          )}

          {capturingPursuers.length > 0 && (
            <div className="flex items-start justify-between gap-3 text-slate-400">
              <span className="flex shrink-0 items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Caught by:
              </span>
              <span className="text-right font-bold text-cyan-300">
                {capturingPursuers.map((player) => player.name).join(', ')}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Total Operatives:
            </span>
            <span className="font-bold text-slate-200">{gameState.players.length}</span>
          </div>
        </div>

        {/* Return to Lobby / Play Again */}
        <button
          onClick={onRestart}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:scale-101 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RETURN TO LOBBY</span>
        </button>
      </div>
    </div>
  );
};
