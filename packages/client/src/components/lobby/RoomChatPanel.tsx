import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@fuyardesque/shared';
import { X, MessageSquare, Send } from 'lucide-react';
import { sound } from '../../services/sound';

interface RoomChatPanelProps {
  messages: ChatMessage[];
  myPlayerId: string;
  historyReady: boolean;
  onSendChat: (text: string) => void;
}

export const RoomChatPanel: React.FC<RoomChatPanelProps> = ({
  messages,
  myPlayerId,
  historyReady,
  onSendChat,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isOpenRef = useRef(false);
  const previousMessageIdsRef = useRef<Set<string> | null>(null);
  const historyReadyRef = useRef(false);

  useEffect(() => {
    const currentIds = new Set(messages.map((message) => message.id));

    if (!historyReady) {
      previousMessageIdsRef.current = currentIds;
      historyReadyRef.current = false;
      return;
    }

    const previousIds = previousMessageIdsRef.current;
    if (
      !historyReadyRef.current ||
      !previousIds ||
      Array.from(previousIds).some((id) => !currentIds.has(id))
    ) {
      previousMessageIdsRef.current = currentIds;
      historyReadyRef.current = true;
      return;
    }

    const incomingMessages = messages.filter(
      (message) => !previousIds.has(message.id) && message.senderId !== myPlayerId
    );
    previousMessageIdsRef.current = currentIds;

    if (incomingMessages.length === 0) return;
    incomingMessages.forEach(() => sound.playClick());
    if (!isOpenRef.current) {
      setUnreadCount((count) => count + incomingMessages.length);
    }
  }, [messages, myPlayerId, historyReady]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const toggleOpen = () => {
    const nextIsOpen = !isOpenRef.current;
    isOpenRef.current = nextIsOpen;
    setIsOpen(nextIsOpen);
    if (nextIsOpen) setUnreadCount(0);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    onSendChat(text);
    setInputText('');
  };

  return (
    <div className="fixed right-3 top-1/2 z-[60] -translate-y-1/2 md:right-4">
      {isOpen && (
        <section
          aria-label="Room chat"
          className="absolute right-14 top-1/2 flex h-[min(32rem,75vh)] w-[min(22rem,calc(100vw-5rem))] -translate-y-1/2 flex-col rounded-2xl border border-slate-700 bg-dark-900/98 p-4 text-slate-100 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <h2 className="font-mono text-xs font-bold tracking-wider text-slate-100">
                ROOM CHAT
              </h2>
              <span className="text-[9px] font-mono text-emerald-300">VISIBLE TO EVERYONE</span>
            </div>
            <button
              onClick={toggleOpen}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label="Close room chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="flex h-full items-center justify-center text-center font-mono text-[11px] text-slate-500">
                Say hello to everyone in the room.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.senderId === myPlayerId ? 'items-end' : 'items-start'}`}
                >
                  <span className="mb-0.5 font-mono text-[9px] text-slate-500">
                    {message.senderName} ·{' '}
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span
                    className={`max-w-[95%] break-words rounded-xl px-2.5 py-1.5 text-xs ${
                      message.senderId === myPlayerId
                        ? 'rounded-br-none bg-cyan-700 text-white'
                        : 'rounded-bl-none border border-slate-700 bg-slate-800 text-slate-200'
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
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-dark-950 px-3 py-2 font-mono text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="rounded-lg bg-cyan-600 px-3 text-white transition hover:bg-cyan-500 disabled:opacity-40"
              aria-label="Send room message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </section>
      )}

      <button
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close room chat' : 'Open room chat'}
        aria-expanded={isOpen}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border shadow-xl transition ${
          unreadCount > 0
            ? 'border-rose-300 bg-rose-600 text-white hover:bg-rose-500'
            : 'border-cyan-300/70 bg-cyan-600 text-white hover:bg-cyan-500'
        }`}
      >
        <MessageSquare className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-dark-950 bg-amber-400 px-1 font-mono text-[9px] font-black text-dark-950">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
