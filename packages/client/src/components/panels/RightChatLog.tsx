import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  ChatChannel,
  ClientGameState,
  FUGITIVE_LOCATION_REVEAL_INTERVAL,
  TRANSPORT_CONFIG,
  getStationById,
} from '@fuyardesque/shared';
import { MessageSquare, History, Send, Lock, Radio } from 'lucide-react';

interface RightChatLogProps {
  gameState: ClientGameState;
  teamChatMessages: ChatMessage[];
  onSendChat: (text: string, channel: ChatChannel) => void;
}

export const RightChatLog: React.FC<RightChatLogProps> = ({
  gameState,
  teamChatMessages,
  onSendChat,
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'history'>(
    gameState.myRole === 'pursuer' ? 'team' : 'history'
  );
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const isFugitive = gameState.myRole === 'fugitive';
  const messages = teamChatMessages;

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendChat(inputText, 'team');
    setInputText('');
  };

  return (
    <aside className="w-full md:w-64 lg:w-80 h-44 md:h-full shrink-0 bg-dark-900/80 backdrop-blur-md border-t md:border-t-0 md:border-l border-slate-800 flex flex-col overflow-hidden select-none">
      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {!isFugitive && (
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'team'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>TEAM</span>
            {teamChatMessages.length > 0 && (
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1 rounded border border-cyan-800/60">
                {teamChatMessages.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'history'
              ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>MISSION LOG</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab !== 'history' ? (
          <div className="flex flex-col h-full justify-between">
            {/* Channel Header */}
            <div className="mb-2 bg-dark-950/70 border border-slate-800 rounded px-2.5 py-1.5 flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1 text-slate-400">
                <Lock className="w-3 h-3 text-cyan-400" />
                Channel:
              </span>
              <span
                className={`font-bold ${
                  'text-cyan-400'
                }`}
              >
                PURSUER SECURE LINK
              </span>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs font-mono p-4">
                  <Radio className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
                  <p>Channel secure.</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Coordinate tactical movements with your pursuer team.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === gameState.myPlayerId;
                  const time = new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMe ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-0.5">
                        <span className="font-bold text-slate-300">{msg.senderName}</span>
                        <span>•</span>
                        <span className="text-slate-500">{time}</span>
                      </div>
                      <div
                        className={`text-xs px-3 py-2 rounded-xl max-w-[90%] break-words font-sans ${
                          isMe
                            ? 'bg-cyan-600 text-white rounded-br-none shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Coordinate with pursuers..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={150}
                className="flex-1 bg-dark-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white px-3 py-2 rounded-lg transition flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)]"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          /* Shared Fugitive transport and reveal history */
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
              Public Fugitive Log · Transport each move, location every {FUGITIVE_LOCATION_REVEAL_INTERVAL} moves
            </div>

            {(!gameState?.fugitiveHistory || gameState.fugitiveHistory.length === 0) ? (
              <div className="text-center text-slate-500 text-xs font-mono py-8">
                No movements recorded yet.
              </div>
            ) : (
              gameState.fugitiveHistory.map((item, idx) => {
                const config = TRANSPORT_CONFIG[item.transport];
                return (
                  <div
                    key={idx}
                      className={`bg-dark-950/80 rounded-lg p-2 flex items-center justify-between text-xs font-mono ${
                        item.revealedStationId
                          ? 'border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                          : 'border border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded bg-slate-800 text-[9px] text-slate-300 flex flex-col items-center justify-center font-bold leading-tight">
                          <span>M{item.moveNumber}</span>
                          <span className="text-[8px] text-slate-500">R{item.phase}</span>
                        </span>
                      <span
                        className="px-2 py-0.5 rounded font-bold text-[11px] border"
                        style={{
                          backgroundColor: config.bg,
                          color: config.color,
                          borderColor: config.borderColor,
                        }}
                      >
                        {config.label}
                      </span>
                    </div>

                    {item.revealedStationId ? (
                      <span className="text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-1 rounded border border-emerald-800/60 text-[10px] text-right">
                        <span className="block">
                          {getStationById(item.revealedStationId)?.name || 'Station'}
                        </span>
                        <span className="block text-[9px] text-emerald-500">
                          REVEALED · {item.revealedStationId}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px] italic text-right">
                        LOCATION NOT REVEALED
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
