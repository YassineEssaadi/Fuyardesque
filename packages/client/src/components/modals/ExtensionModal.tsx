import React from 'react';
import { ClientGameState } from '@fuyardesque/shared';
import { Trophy, Clock, AlertCircle } from 'lucide-react';

interface ExtensionModalProps {
  gameState: ClientGameState | null;
  onDecision: (choice: 'end' | 'extend') => void;
}

export const ExtensionModal: React.FC<ExtensionModalProps> = ({ gameState, onDecision }) => {
  if (!gameState || gameState.phase !== 'fugitive_decision') return null;

  const isFugitive = gameState.myRole === 'fugitive';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-dark-900 border-2 border-amber-500/80 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <Clock className="w-8 h-8 animate-spin" />
        </div>

        <h2 className="text-2xl font-black font-mono text-slate-100 tracking-wide mb-2">
          SURVIVAL CLOCK EXPIRED!
        </h2>

        {isFugitive ? (
          <div>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Congratulations, <strong className="text-emerald-400">Ghost</strong>! You have
              successfully survived the full <strong>8 minutes and 30 seconds</strong>. As the
              Fugitive, you hold the power to decide the fate of this match.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => onDecision('end')}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-4 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center gap-2 border border-emerald-400/40 shadow-lg transition hover:scale-102"
              >
                <Trophy className="w-6 h-6 text-yellow-300" />
                <span className="text-sm">CLAIM VICTORY</span>
                <span className="text-[10px] text-emerald-200/80 font-normal">
                  End game immediately and win
                </span>
              </button>

              <button
                onClick={() => onDecision('extend')}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white p-4 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center gap-2 border border-amber-400/40 shadow-lg transition hover:scale-102"
              >
                <Clock className="w-6 h-6 text-amber-200" />
                <span className="text-sm">GIVE 5-MIN EXTENSION</span>
                <span className="text-[10px] text-amber-200/80 font-normal">
                  Challenge pursuers to 5 more minutes
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              The Fugitive has survived the initial <strong>8 minutes and 30 seconds</strong>!
            </p>
            <div className="bg-dark-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-center gap-3 text-amber-400 font-mono text-xs animate-pulse">
              <AlertCircle className="w-5 h-5" />
              <span>Awaiting Fugitive's decision: Victory or 5-Minute Extension...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
