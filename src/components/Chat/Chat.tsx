import { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';

export function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, isHandoff, send } = useChat();

  return (
    <>
      {!isOpen && <ChatButton onClick={() => setIsOpen(true)} />}
      {isOpen && (
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          isHandoff={isHandoff}
          onClose={() => setIsOpen(false)}
          onSend={send}
        />
      )}
    </>
  );
}
