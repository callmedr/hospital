
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-start py-2">
      <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-600 px-4 py-3 rounded-2xl shadow">
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
