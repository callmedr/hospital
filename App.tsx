
import React from 'react';
import ChatContainer from './components/ChatContainer';

const App: React.FC = () => {
  return (
    <main className="bg-gray-100 dark:bg-gray-900 w-full h-screen flex items-center justify-center p-4 font-sans">
       <div className="w-full h-full max-w-2xl max-h-[800px] flex flex-col bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <ChatContainer />
      </div>
    </main>
  );
};

export default App;
