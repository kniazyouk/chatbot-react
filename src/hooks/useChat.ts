import { useState, useRef, useEffect, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { sendMessage, API_URL } from '../services/api';
import type { ChatTurn } from '../types/chat';

export function useChat() {
  const [messages, setMessages] = useState<ChatTurn[]>([
    { role: 'model', parts: [{ text: 'Hello! How can I assist you?' }] },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHandoff, setIsHandoff] = useState(false);
  const sessionId = useRef(crypto.randomUUID());
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    socket.current = io(API_URL);
    socket.current.emit('join-room', { sessionId: sessionId.current });

    socket.current.on('agent-response', (data: { message: string }) => {
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: `*Agente:* ${data.message}` }] }]);
    });

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  const send = useCallback(async (text: string) => {
    const userTurn: ChatTurn = { role: 'user', parts: [{ text }] };
    setMessages(prev => [...prev, userTurn]);
    setIsLoading(true);

    try {
      const res = await sendMessage(text, sessionId.current);

      const botTurn: ChatTurn = { role: 'model', parts: [{ text: res.response }] };
      setMessages(prev => [...prev, botTurn]);

      if (res.action === 'HANDOFF_INITIATED') {
        setIsHandoff(true);
      }
    } catch (e) {
      const errTurn: ChatTurn = {
        role: 'model',
        parts: [{ text: `Error: ${e instanceof Error ? e.message : 'Communication failed'}` }],
      };
      setMessages(prev => [...prev, errTurn]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, isHandoff, send };
}
