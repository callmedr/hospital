
import React, { useState } from 'react';
import { SendIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isCompleted: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isCompleted }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading && !isCompleted) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const isDisabled = isLoading || isCompleted;

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isCompleted ? "상담이 종료되었습니다." : "메시지를 입력하세요..."}
          className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 text-gray-900 dark:text-gray-100 disabled:opacity-60"
          disabled={isDisabled}
        />
        <button
          onClick={handleSend}
          disabled={isDisabled}
          className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors duration-200"
          aria-label="Send message"
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
