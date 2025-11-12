import { useState, useEffect } from 'react';
import { useAgents } from '../AgentsProvider';
import type { AgentDetails, InformationType, KnowledgeType } from '../agentsConfig';

interface ConfigureModelsProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AgentDetails | null;
}

export function ConfigureModels({ isOpen, onClose, agent }: ConfigureModelsProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addAgent, updateAgent, deleteAgent } = useAgents();
  
  const defaultFormData: AgentDetails = {
    name: '',
    type: '',
    agentId: '',
    agentAliasId: '',
    knowledgeBase: [],
    knowledge: [],
    model: 'Claude 3.5',
    activeAgents: 0
  };

  const [editingAgent, setEditingAgent] = useState<AgentDetails>(defaultFormData);

  // Reset form when window opens/closes or model changes
  useEffect(() => {
    if (isOpen) {
      if (agent) {
        // When editing, initialize with the model data
        setEditingAgent({
          name: agent.name,
          type: agent.type,
          agentId: agent.agentId,
          agentAliasId: agent.agentAliasId,
          knowledgeBase: [...agent.knowledgeBase],
          knowledge: [...agent.knowledge],
          model: agent.model,
          activeAgents: agent.activeAgents
        });
      } else {
        // When creating new, use default data
        setEditingAgent(defaultFormData);
      }
      setError(null);
      setIsClosing(false);
    }
  }, [isOpen, agent]);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(false);
      requestAnimationFrame(() => {
        setIsMounted(true);
      });
    }
  }, [isOpen]);

  // Validation function
  const validateForm = (): string | null => {
    if (!editingAgent.name.trim()) {
      return 'Model name is required';
    }
    if (!editingAgent.type) {
      return 'Model type is required';
    }
    if (!editingAgent.knowledgeBase.length) {
      return 'At least one knowledge base must be selected';
    }
    return null;
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  // Handle save
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSaving(true);
    
    try {
      if (editingAgent.agentId) {
        // Update existing model
        await updateAgent(editingAgent.name, editingAgent);
      } else {
        // Create new model
        const newAgent = {
          ...editingAgent,
          agentId: `new-${Date.now()}`
        };
        await addAgent(newAgent);
      }
      handleClose();
    } catch (err) {
      console.error('Error saving model:', err);
      setError(err instanceof Error ? err.message : 'Failed to save model');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!editingAgent.agentId) return;

    setError(null);
    setIsSaving(true);
    
    try {
      await deleteAgent(editingAgent.agentId);
      handleClose();
    } catch (err) {
      console.error('Error deleting model:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete model');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className={`fixed inset-0 bg-black/5 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Sliding panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-[480px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          !isMounted || isClosing ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            <div>
              <h2 className="font-medium text-black">Configure Agent</h2>
              <p className="text-sm text-black">Configure your AI Worker</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              className="p-2 bg-white rounded-full"
            >
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 text-black">General</h3>
              <p className="text-sm text-black mb-4">Configure your AI Worker.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Agent Role*</label>
                  <input
                    type="text"
                    value={editingAgent.name}
                    onChange={(e) => setEditingAgent({
                      ...editingAgent,
                      name: e.target.value
                    })}
                    className="w-full bg-gray-100 border-0 rounded-lg p-2 text-black placeholder-gray-500"
                    placeholder="Enter agent role"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Model Type*</label>
                  <select
                    value={editingAgent.model}
                    onChange={(e) => setEditingAgent({
                      ...editingAgent,
                      model: e.target.value
                    })}
                    className="w-full bg-gray-100 border-0 rounded-lg p-2 text-black"
                  >
                    <option value="Claude 3.5">Claude 3.5</option>
                    <option value="GPT-4">GPT-4</option>
                    <option value="GPT-3.5">GPT-3.5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Agent Type*</label>
                  <select
                    value={editingAgent.type}
                    onChange={(e) => setEditingAgent({
                      ...editingAgent,
                      type: e.target.value
                    })}
                    className="w-full bg-gray-100 border-0 rounded-lg p-2 text-black"
                  >
                    <option value="">Select an agent type</option>
                    <option value="Research Analyst">Research Analyst</option>
                    <option value="Marketing Analyst">Marketing Analyst</option>
                    <option value="Operation Manager">Operation Manager</option>
                    <option value="CRM Manager">CRM Manager</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-black">Knowledge Base*</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Payment', 'Menus', 'Live Report Hub', 'Customer Hub', 'Activities', 'Loyalty'] as InformationType[]).map((source) => (
                        <button
                          key={source}
                          onClick={() => {
                            const newSources = editingAgent.knowledgeBase.includes(source)
                              ? editingAgent.knowledgeBase.filter(s => s !== source)
                              : [...editingAgent.knowledgeBase, source];
                            setEditingAgent({
                              ...editingAgent,
                              knowledgeBase: newSources
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-sm ${
                            editingAgent.knowledgeBase.includes(source)
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-black'
                          }`}
                        >
                          {source} {editingAgent.knowledgeBase.includes(source) && '×'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-black">Information Sources*</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Help Centre'] as KnowledgeType[]).map((source) => (
                        <button
                          key={source}
                          onClick={() => {
                            const newSources = editingAgent.knowledge.includes(source)
                              ? editingAgent.knowledge.filter(s => s !== source)
                              : [...editingAgent.knowledge, source];
                            setEditingAgent({
                              ...editingAgent,
                              knowledge: newSources
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-sm ${
                            editingAgent.knowledge.includes(source)
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-black'
                          }`}
                        >
                          {source} {editingAgent.knowledge.includes(source) && '×'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between items-center bg-white">
          {editingAgent.agentId && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-[#FFF1F3] text-[#F43F5E] border border-[#F43F5E] rounded-lg"
            >
              Delete Agent
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2 bg-purple-600 text-white rounded-lg ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
} 