"use client"
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { NewAgentWindow } from './NewAgentWindow';

interface NewAgentContextType {
  isNewOpen: boolean;
  openNew: () => void;
  closeNew: () => void;
}

const NewAgentContext = createContext<NewAgentContextType | undefined>(undefined);

export function NewAgentProvider({ children }: { children: ReactNode }) {
  const [isNewOpen, setIsNewOpen] = useState(false);

  const openNew = () => {
    setIsNewOpen(true);
  };

  const closeNew = () => {
    setIsNewOpen(false);
  };

  return (
    <NewAgentContext.Provider value={{ isNewOpen, openNew, closeNew }}>
      {children}
      <NewAgentWindow
        isOpen={isNewOpen}
        onClose={closeNew}
        onSave={async (agent) => {
          // TODO: Implement save functionality
          console.log('New agent to be created:', agent);
          closeNew();
        }}
      />
    </NewAgentContext.Provider>
  );
}

export function useNewAgent() {
  const context = useContext(NewAgentContext);
  if (context === undefined) {
    throw new Error('useNewAgent must be used within a NewAgentProvider');
  }
  return context;
} 