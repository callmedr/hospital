import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { ChatMessage, ChatStep, UserData } from '../types';
import { INITIAL_BOT_MESSAGE } from '../constants';
import Header from './Header';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [chatStep, setChatStep] = useState<ChatStep>(ChatStep.NAME);
  const [userData, setUserData] = useState<UserData>({
    patient_name: '',
    birth_date: '',
    chief_complaint: '',
    phone_number: '',
  });

  useEffect(() => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);

    setMessages([
      {
        type: 'bot',
        content: INITIAL_BOT_MESSAGE,
        timestamp: new Date()
      }
    ]);
  }, []);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading || chatStep === ChatStep.COMPLETED) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: userInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const currentStep = chatStep;
    let nextStep: ChatStep = currentStep;
    const updatedUserData = { ...userData };

    // 변경된 질문 순서: 이름 -> 연락처 -> 생년월일 -> 방문 사유
    if (currentStep === ChatStep.NAME) {
      updatedUserData.patient_name = userInput;
      nextStep = ChatStep.PHONE;
    } else if (currentStep === ChatStep.PHONE) {
      updatedUserData.phone_number = userInput;
      nextStep = ChatStep.BIRTH_DATE;
    } else if (currentStep === ChatStep.BIRTH_DATE) {
      updatedUserData.birth_date = userInput;
      nextStep = ChatStep.COMPLAINT;
    } else if (currentStep === ChatStep.COMPLAINT) {
      updatedUserData.chief_complaint = userInput;
      nextStep = ChatStep.COMPLETED;
    }
    setUserData(updatedUserData);
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-handler', {
        body: {
          message: userInput,
          sessionId: sessionId,
          step: currentStep,
          userData: updatedUserData,
        },
      });

      if (error) {
        // The error object from `invoke` contains the actual response from the function
        throw error;
      }

      const botMessage: ChatMessage = {
        type: 'bot',
        content: data.response || '응답을 받지 못했습니다. 다시 시도해주세요.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setChatStep(nextStep);

    } catch (error: any) {
      let detailedMessage = '알 수 없는 오류가 발생했습니다.';
      
      // Attempt to parse the detailed error message from the Edge Function's response
      if (error.context && typeof error.context.json === 'function') {
        try {
          const functionError = await error.context.json();
          detailedMessage = functionError.error || error.message;
        } catch (e) {
          detailedMessage = error.message;
        }
      } else {
        detailedMessage = error.message;
      }

      console.error('--- Detailed Error From Supabase Function ---');
      console.error(detailedMessage);
      console.error('Full error object:', error);

      const errorMessage: ChatMessage = {
        type: 'bot',
        content: `죄송합니다, 시스템에 오류가 발생했습니다. (오류: ${detailedMessage})`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, chatStep, sessionId, userData]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <Header />
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading} 
        isCompleted={chatStep === ChatStep.COMPLETED} 
      />
    </div>
  );
};

export default ChatContainer;