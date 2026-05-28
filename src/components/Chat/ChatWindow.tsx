import { useState, useRef, useEffect } from 'react';
import type { ChatTurn } from '../../types/chat';
import { Message } from './Message';
import { TypingIndicator } from './TypingIndicator';

interface Props {
  messages: ChatTurn[];
  isLoading: boolean;
  isHandoff: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
}

export function ChatWindow({ messages, isLoading, isHandoff, onClose, onSend }: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading || isHandoff) return;
    setInput('');
    onSend(text);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-white shadow-2xl flex flex-col z-20 sm:inset-auto sm:bottom-20 sm:right-5 sm:max-w-md sm:h-[70vh] sm:rounded-2xl animate-slide-up-fade-in">
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between shadow-md sm:rounded-t-2xl">
        <div className="flex items-center">
          <div className="relative w-12 h-12">
            <img
              className="w-12 h-12 rounded-full"
              src="https://placehold.co/100x100/FFFFFF/3B82F6?text=AI"
              alt="Bot Avatar"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold">Chatbot</h2>
            <p className="text-sm text-blue-100">
              {isHandoff ? 'Agente conectado' : isLoading ? 'Escribiendo...' : 'Online'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-blue-200 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto chat-messages bg-gray-50">
        {messages.map((turn, i) => (
          <Message key={i} turn={turn} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-4 border-t border-gray-200 sm:rounded-b-2xl">
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isHandoff ? 'Chat con agente humano...' : 'Type your message...'}
            disabled={isHandoff}
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || isHandoff || !input.trim()}
            className="ml-3 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
