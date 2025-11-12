"use client"
import { useState, useEffect } from 'react';
import { useChatWindow } from '../ChatProvider';
import { useEditAgent } from './EditAgentProvider';
import { useNewAgent } from '../NewAgentProvider';
import { ConfigureModels } from './ConfigureModels';
import { useAgents } from '../AgentsProvider';
import type { AgentDetails } from '../agentsConfig';

interface Agent {
  name: string;
  type: string;
  informationSources: string;
  knowledge: string;
  visibility: 'Internal' | 'External' | 'Both';
  lastQuery: string;
}

type Tab = 'agents' | 'models';

export function AgentsModule() {
  const { openChat } = useChatWindow();
  const { openEdit } = useEditAgent();
  const { openNew } = useNewAgent();
  const { agents } = useAgents();
  const [currentTab, setCurrentTab] = useState<Tab>('agents');
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<typeof agents[0] | null>(null);
  
  // Convert agents to Agent array
  const [agentList, setAgentList] = useState<Agent[]>(() => {
    return Object.entries(agents).map(([name, details]: [string, AgentDetails]) => ({
      name,
      type: details.type,
      informationSources: details.knowledgeBase.join(', '),
      knowledge: details.knowledge.join(', '),
      visibility: 'Both' as const,
      lastQuery: new Date().toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }));
  });

  // Update agents when agents changes
  useEffect(() => {
    setAgentList(Object.entries(agents).map(([name, details]: [string, AgentDetails]) => ({
      name,
      type: details.type,
      informationSources: details.knowledgeBase.join(', '),
      knowledge: details.knowledge.join(', '),
      visibility: 'Both' as const,
      lastQuery: new Date().toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    })));
  }, [agents]);

  // Update agent count when agents change
  useEffect(() => {
    const agentCounts = agentList.reduce((acc, agent) => {
      acc[agent.type] = (acc[agent.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Log agent counts
    Object.values(agents).forEach((model: AgentDetails) => {
      const count = agentCounts[model.name] || 0;
      console.log(`Agent count for ${model.name}: ${count}`);
    });
  }, [agentList, agents]);

  const renderContent = () => {
    switch (currentTab) {
      case 'models':
        return (
          <div className="bg-white rounded-lg shadow">
            {/* Table Header Actions */}
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Configure Agent</h2>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => {
                    setEditingModel(null);
                    setIsConfigureOpen(true);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <span className="mr-2">+</span>
                  New
                </button>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="pl-10 pr-4 py-2 border rounded-lg bg-gray-50"
                  />
                  <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-black font-medium">Agent Role</th>
                  <th className="text-left p-4 text-black font-medium">Model Type</th>
                  <th className="text-left p-4 text-black font-medium">Information Sources</th>
                  <th className="text-left p-4 text-black font-medium">Knowledge</th>
                  <th className="text-left p-4 text-black font-medium">Active Agents</th>
                  <th className="text-left p-4 text-black font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(agents).map((agent: AgentDetails) => (
                  <tr key={agent.name} className="border-b">
                    <td className="p-4 text-black">{agent.type}</td>
                    <td className="p-4 text-black">{agent.model}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2 min-h-[40px]">
                        <div className="flex flex-wrap gap-1.5">
                          {agent.knowledgeBase.map((kb: string) => (
                            <span 
                              key={kb} 
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                            >
                              {kb}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2 min-h-[40px]">
                        <div className="flex flex-wrap gap-1.5">
                          {agent.knowledge.map((k: string) => (
                            <span 
                              key={k} 
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors duration-200"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-black">{agent.activeAgents}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => {
                            setEditingModel(agent);
                            setIsConfigureOpen(true);
                          }}
                          className="bg-gray-100 px-3 py-1 rounded-full text-sm text-black hover:bg-gray-200"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this agent?')) {
                              console.log(`Deleting agent ${agent.name}`);
                            }
                          }}
                          className="bg-[#FFF1F3] px-3 py-1 rounded-full text-sm text-[#F43F5E] hover:bg-[#FFE4E8]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="p-4 flex items-center justify-between border-t">
              <div className="flex items-center space-x-2 text-black">
                <span>Show</span>
                <select className="border rounded px-2 py-1 text-black bg-white">
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span>Per Page</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-black">1-10 of 100</span>
                <div className="flex space-x-1">
                  <button className="p-1 rounded bg-white text-black hover:bg-gray-50 border">&lt;&lt;</button>
                  <button className="p-1 rounded bg-white text-black hover:bg-gray-50 border">&lt;</button>
                  <button className="p-1 rounded bg-white text-black hover:bg-gray-50 border">&gt;</button>
                  <button className="p-1 rounded bg-white text-black hover:bg-gray-50 border">&gt;&gt;</button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-lg shadow">
            {/* Table Header Actions */}
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Agents</h2>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={openNew}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <span className="mr-2">+</span>
                  Activate Agent
                </button>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="pl-10 pr-4 py-2 border rounded-lg bg-gray-50"
                  />
                  <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-black font-medium">Name</th>
                  <th className="text-left p-4 text-black font-medium">Type</th>
                  <th className="text-left p-4 text-black font-medium">Information Sources</th>
                  <th className="text-left p-4 text-black font-medium">Knowledge</th>
                  <th className="text-left p-4 text-black font-medium">Visibility</th>
                  <th className="text-left p-4 text-black font-medium">Last Query</th>
                  <th className="text-left p-4 text-black font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agentList.map((agent) => (
                  <tr key={agent.name} className="border-b">
                    <td className="p-4 text-black">{agent.name}</td>
                    <td className="p-4 text-black">{agent.type}</td>
                    <td className="p-4 text-black">
                      <div className="flex flex-wrap gap-1.5">
                        {agent.informationSources.split(', ').map((source, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-black">
                      <div className="flex flex-wrap gap-1.5">
                        {agent.knowledge.split(', ').map((k, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors duration-200"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        agent.visibility === 'Internal' 
                          ? 'bg-blue-100 text-blue-800'
                          : agent.visibility === 'External'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {agent.visibility}
                      </span>
                    </td>
                    <td className="p-4 text-black">{agent.lastQuery}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button className="bg-gray-100 px-3 py-1 rounded-full text-sm text-black hover:bg-gray-200">Log</button>
                        <button 
                          onClick={() => openEdit({ 
                            name: agent.name, 
                            type: agent.type,
                            availability: 'both'
                          })}
                          className="bg-gray-100 px-3 py-1 rounded-full text-sm text-black hover:bg-gray-200"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => openChat({ name: agent.name, type: agent.type })}
                          className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm hover:bg-purple-700"
                        >
                          Chat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="p-4 flex items-center justify-between border-t">
              <div className="flex items-center space-x-2 text-black">
                <span>Show</span>
                <select className="border rounded px-2 py-1 text-black bg-white">
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span>Per Page</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-black">1-10 of 100</span>
                <div className="flex space-x-1">
                  <button className="p-1 rounded bg-white text-black hover:bg-gray-50 border">&lt;&lt;</button>
                  <button className="p-1 rounded bg-white text-black hover:bg-gray-50 border">&lt;</button>
                  <button className="p-1 rounded bg-white text-black hover:bg-gray-50 border">&gt;</button>
                  <button className="p-1 rounded bg-white text-black hover:bg-gray-50 border">&gt;&gt;</button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 mb-8">
        <div className="flex justify-between items-center">
          <div className="flex space-x-8">
            <button 
              onClick={() => setCurrentTab('agents')}
              className={`relative px-4 py-2 ${
                currentTab === 'agents' ? 'text-purple-600' : 'text-gray-500'
              } bg-white focus:outline-none focus:ring-0 focus-visible:outline-none`}
            >
              Activate Agent
              {currentTab === 'agents' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
            <button 
              onClick={() => setCurrentTab('models')}
              className={`relative px-4 py-2 ${
                currentTab === 'models' ? 'text-purple-600' : 'text-gray-500'
              } bg-white focus:outline-none focus:ring-0 focus-visible:outline-none`}
            >
              Configure Agent
              {currentTab === 'models' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Configure Models Window */}
      <ConfigureModels 
        isOpen={isConfigureOpen}
        onClose={() => {
          setIsConfigureOpen(false);
          setEditingModel(null);
        }}
        agent={editingModel}
      />
    </div>
  );
} 