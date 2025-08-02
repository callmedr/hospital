
import React from 'react';
import { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === 'user';
  
  const bubbleClasses = isUser
    ? 'bg-blue-500 text-white rounded-br-none'
    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none shadow';
    
  const containerClasses = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

  return (
    <div className={containerClasses}>
      <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${bubbleClasses}`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
