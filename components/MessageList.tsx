
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((msg, index) => (
        <MessageBubble key={index} message={msg} />
      ))}
      {isLoading && <TypingIndicator />}
    </div>
  );
};

export default MessageList;
