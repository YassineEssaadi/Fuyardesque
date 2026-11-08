import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@fuyardesque/shared';
import { MessageSquare, Send } from 'lucide-react';

interface RoomChatPanelProps {
  messages: ChatMessage[];
  myPlayerId: string;
  onSendChat: (text: string) => void;
}

export const RoomChatPanel: React.FC<RoomChatPanelProps> = ({
  messages,
  myPlayerId,
  onSendChat,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    onSendChat(text);
    setInputText('');
  };

  return (
    <section className="bg-dark-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <h3 className="flex items-center gap-2 font-mono font-bold text-xs tracking-wider text-slate-200">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          ROOM CHAT
        </h3>
        <span className="text-[9px] font-mono text-emerald-300 border border-emerald-800 bg-emerald-950/40 rounded px-1.5 py-0.5">
          EVERYONE
        </span>
      </div>

      <div className="h-40 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 ? (
          <p className="h-full flex items-center justify-center text-center text-[11px] font-mono text-slate-500">
            Say hello to everyone in the room.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.senderId === myPlayerId ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[9px] font-mono text-slate-500 mb-0.5">
                {message.senderName} ·{' '}
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span
                className={`max-w-[95%] break-words rounded-xl px-2.5 py-1.5 text-xs ${
                  message.senderId === myPlayerId
                    ? 'bg-cyan-700 text-white rounded-br-none'
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                }`}
              >
                {message.text}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="Message everyone..."
          maxLength={150}
          className="flex-1 min-w-0 bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white px-3 rounded-lg transition"
          aria-label="Send room message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </section>
  );
};
