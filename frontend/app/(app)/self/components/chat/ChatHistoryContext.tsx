"use client"
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  files?: Array<{
    name: string;
    type: string;
    uri: string;
  }>;
}

interface ChatHistory {
  [agentId: string]: Message[];
}

interface ChatHistoryContextType {
  getMessages: (agentId: string) => Message[];
  addMessage: (message: Message, agentId: string) => void;
  clearMessages: (agentId: string) => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined);

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const [chatHistory, setChatHistory] = useState<ChatHistory>(() => {
    try {
      const savedHistory = localStorage.getItem('chatHistory');
      return savedHistory ? JSON.parse(savedHistory) : {};
    } catch (error) {
      console.error('Failed to parse chat history:', error);
      return {};
    }
  });

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [chatHistory]);

  const getMessages = (agentId: string): Message[] => {
    return chatHistory[agentId] || [];
  };

  const addMessage = (message: Message, agentId: string) => {
    setChatHistory(prev => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), message]
    }));
  };

  const clearMessages = (agentId: string) => {
    setChatHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[agentId];
      return newHistory;
    });
  };

  return (
    <ChatHistoryContext.Provider value={{ getMessages, addMessage, clearMessages }}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

export function useChatHistory(agentId: string) {
  const context = useContext(ChatHistoryContext);
  if (context === undefined) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }

  // Initialize messages from context
  const [messages, setMessages] = useState<Message[]>(() => context.getMessages(agentId));

  // Update messages when agentId changes
  useEffect(() => {
    const currentMessages = context.getMessages(agentId);
    setMessages(currentMessages);
  }, [agentId, context]);

  const addMessage = (message: Message) => {
    context.addMessage(message, agentId);
    setMessages(prev => [...prev, message]);
  };

  const clearMessages = () => {
    context.clearMessages(agentId);
    setMessages([]);
  };

  return { messages, addMessage, clearMessages };
} 