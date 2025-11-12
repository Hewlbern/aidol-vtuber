"use client"
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { AGENT_CONFIG } from './agentsConfig';
import type { AgentDetails, AgentsContextType } from './agentsConfig';

const AgentsContext = createContext<AgentsContextType | undefined>(undefined);

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Record<string, AgentDetails>>(AGENT_CONFIG);

  const addAgent = async (agent: AgentDetails) => {
    setAgents(prev => ({
      ...prev,
      [agent.name]: agent
    }));
  };

  const updateAgent = async (name: string, agent: AgentDetails) => {
    setAgents(prev => ({
      ...prev,
      [name]: agent
    }));
  };

  const deleteAgent = async (name: string) => {
    setAgents(prev => {
      const newAgents = { ...prev };
      delete newAgents[name];
      return newAgents;
    });
  };

  return (
    <AgentsContext.Provider value={{ agents, addAgent, updateAgent, deleteAgent }}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  const context = useContext(AgentsContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentsProvider');
  }
  return context;
} 