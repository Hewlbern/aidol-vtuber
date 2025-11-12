"use client"
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { MCPChat } from './MCPChat';

interface Agent {
  name: string;
  type: string;
}

interface ChatContextType {
  isOpen: boolean;
  currentAgent: Agent | null;
  openChat: (agent?: Agent) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const openChat = (agent?: Agent) => {
    setCurrentAgent(agent || null);
    setIsOpen(true);
    setIsClosing(false);
  };

  const closeChat = () => {
    setIsClosing(true);
    setIsOpen(false);
  };

  return (
    <ChatContext.Provider value={{ isOpen, currentAgent, openChat, closeChat }}>
      {children}
      {/* Overlay with blur effect */}
      <div 
        className={`fixed inset-0 bg-black/5 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeChat}
      />
      {/* Chat window */}
      <div 
        className={`fixed inset-y-0 right-0 w-[400px] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 50 }}
        onTransitionEnd={() => {
          if (isClosing) {
            setCurrentAgent(null);
            setIsClosing(false);
          }
        }}
      >
        <div className="h-full bg-white shadow-xl rounded-l-xl overflow-hidden">
          <MCPChat agent={currentAgent} />
        </div>
      </div>
    </ChatContext.Provider>
  );
}

export function useChatWindow() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatWindow must be used within a ChatProvider');
  }
  return context;
} 