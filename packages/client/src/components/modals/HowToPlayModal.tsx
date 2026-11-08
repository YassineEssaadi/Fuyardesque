import React from 'react';
import { X, Shield, Eye, Clock, Radio, Navigation } from 'lucide-react';
import { TRANSPORT_CONFIG } from '@fuyardesque/shared';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-dark-900 border border-slate-700 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
              FY
            </div>
            <h2 className="text-base font-black font-mono text-slate-100 tracking-wider">
              HOW TO PLAY FUYARDESQUE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Rules Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300 font-sans leading-relaxed">
          {/* Roles */}
          <div>
            <h3 className="font-mono font-bold text-slate-100 text-sm mb-2 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-rose-400" />
              1. The Two Opposing Roles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="bg-rose-950/20 border border-rose-900/40 p-3 rounded-lg">
                <div className="font-mono font-bold text-rose-300 mb-1">THE FUGITIVE (1 Player)</div>
                <p className="text-slate-400 text-[11px]">
                  Survive for <strong>8 minutes and 30 seconds</strong>. Move through the city in secret.
                  Your true location is hidden from pursuers except during periodic radar sweeps and every third move.
                </p>
              </div>

              <div className="bg-cyan-950/20 border border-cyan-900/40 p-3 rounded-lg">
                <div className="font-mono font-bold text-cyan-300 mb-1">THE PURSUERS (Remaining)</div>
                <p className="text-slate-400 text-[11px]">
                  Locate and capture the Fugitive by moving onto their station during the detectives’ turn.
                  Coordinate using your private Team Chat!
                </p>
              </div>
            </div>
          </div>

          {/* Sequential Turns */}
          <div>
            <h3 className="font-mono font-bold text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              2. Starting Positions and Sequential Turns
            </h3>
            <p className="text-slate-400 mb-2">
              First, every player chooses a different starting station within 30 seconds. Then the Fugitive gets 30 seconds to choose and lock a move. After the Fugitive moves, the detectives discuss the new intel and choose their moves together within their own 30-second turn. Each turn resolves when everyone on that side locks in or the timer expires. Players who do not lock a move stay where they are.
            </p>
          </div>

          {/* Transportation Networks */}
          <div>
            <h3 className="font-mono font-bold text-slate-100 text-sm mb-2 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-cyan-400" />
              3. The 3 Urban Transportation Methods
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-dark-950/80 rounded border border-slate-800">
                <span
                  className="px-2 py-0.5 rounded font-mono font-bold text-[10px] border"
                  style={{
                    backgroundColor: TRANSPORT_CONFIG.taxi.bg,
                    color: TRANSPORT_CONFIG.taxi.color,
                    borderColor: TRANSPORT_CONFIG.taxi.borderColor,
                  }}
                >
                  TAXI (Yellow)
                </span>
                <span className="text-[11px] text-slate-400">
                  Dense local network. Connects neighboring stations within each district.
                </span>
              </div>

              <div className="flex items-center gap-3 p-2 bg-dark-950/80 rounded border border-slate-800">
                <span
                  className="px-2 py-0.5 rounded font-mono font-bold text-[10px] border"
                  style={{
                    backgroundColor: TRANSPORT_CONFIG.bus.bg,
                    color: TRANSPORT_CONFIG.bus.color,
                    borderColor: TRANSPORT_CONFIG.bus.borderColor,
                  }}
                >
                  BUS (Blue)
                </span>
                <span className="text-[11px] text-slate-400">
                  Medium-range arterials bridging different urban districts.
                </span>
              </div>

              <div className="flex items-center gap-3 p-2 bg-dark-950/80 rounded border border-slate-800">
                <span
                  className="px-2 py-0.5 rounded font-mono font-bold text-[10px] border"
                  style={{
                    backgroundColor: TRANSPORT_CONFIG.metro.bg,
                    color: TRANSPORT_CONFIG.metro.color,
                    borderColor: TRANSPORT_CONFIG.metro.borderColor,
                  }}
                >
                  METRO (Green)
                </span>
                <span className="text-[11px] text-slate-400">
                  Rapid express rail connecting major transit hubs across distant districts.
                </span>
              </div>
            </div>
          </div>

          {/* Periodic Radar Revelations */}
          <div>
            <h3 className="font-mono font-bold text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-400" />
              4. Periodic Radar Revelations & 5-Min Extension
            </h3>
            <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1">
              <li>
                Every <strong>90 seconds</strong>, a radar sweep illuminates the Fugitive's exact station for <strong>5 seconds</strong>.
              </li>
              <li>
                The Pursuers also see the transport type used by the Fugitive each turn in the <strong>Mission Log</strong>.
              </li>
              <li>
                The Fugitive's destination is permanently revealed to everyone in the Mission Log after every <strong>3rd actual move</strong> (moves 3, 6, 9, and so on).
              </li>
              <li>
                If the Fugitive survives 8:30, they can choose to <strong>Claim Victory</strong> or challenge the pursuers to an optional <strong>5-minute extension</strong>!
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl font-mono text-xs font-bold transition shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            GOT IT, LET'S PLAY
          </button>
        </div>
      </div>
    </div>
  );
};
