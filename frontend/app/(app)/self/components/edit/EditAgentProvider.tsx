"use client"
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { EditAgentWindow } from './EditAgentWindow';

interface Agent {
  name: string;
  type: string;
  availability: 'internal' | 'external' | 'both';
}

interface EditAgentContextType {
  isEditOpen: boolean;
  currentAgent: Agent | null;
  openEdit: (agent: Agent) => void;
  closeEdit: () => void;
}

const EditAgentContext = createContext<EditAgentContextType | undefined>(undefined);

export function EditAgentProvider({ children }: { children: ReactNode }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);

  const openEdit = (agent: Agent) => {
    setCurrentAgent(agent);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setCurrentAgent(null);
  };

  return (
    <EditAgentContext.Provider value={{ isEditOpen, currentAgent, openEdit, closeEdit }}>
      {children}
      {isEditOpen && currentAgent && (
        <EditAgentWindow
          isOpen={isEditOpen}
          onClose={closeEdit}
          agent={currentAgent}
          onSave={async () => {
            // TODO: Implement save functionality
            closeEdit();
          }}
        />
      )}
    </EditAgentContext.Provider>
  );
}

export function useEditAgent() {
  const context = useContext(EditAgentContext);
  if (context === undefined) {
    throw new Error('useEditAgent must be used within an EditAgentProvider');
  }
  return context;
} 