import { useState, useEffect } from 'react';
import { useAgents } from '../AgentsProvider';

interface Agent {
  id?: string;
  name: string;
  type: string;
  availability: 'internal' | 'external' | 'both';
}

interface EditAgentWindowProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent;
  onSave: (agent: Agent) => Promise<void>;
}

export function EditAgentWindow({ isOpen, onClose, agent, onSave }: EditAgentWindowProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { agents } = useAgents();
  
  const defaultFormData: Agent = {
    id: undefined,
    name: '',
    type: Object.keys(agents).length > 0 ? Object.keys(agents)[0] : '', // Default to first agent if available
    availability: 'internal' // Default to internal
  };

  // Initialize form data safely
  const initialFormData = {
    id: agent?.id ?? defaultFormData.id,
    name: agent?.name ?? defaultFormData.name,
    type: agent?.type || (Object.keys(agents).length > 0 ? Object.keys(agents)[0] : ''),
    availability: agent?.availability ?? defaultFormData.availability
  };

  const [formData, setFormData] = useState<Agent>(initialFormData);

  // Reset form data when agent changes or window opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: agent?.id ?? defaultFormData.id,
        name: agent?.name ?? defaultFormData.name,
        type: agent?.type || (Object.keys(agents).length > 0 ? Object.keys(agents)[0] : ''),
        availability: agent?.availability ?? defaultFormData.availability
      });
      setError(null);
      setIsClosing(false);
    }
  }, [isOpen, agent, agents]);

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
    if (!formData.name.trim()) {
      return 'Agent name is required';
    }
    if (!formData.type) {
      return 'Agent type is required';
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
      await onSave(formData);
      handleClose();
    } catch (err) {
      console.error('Error saving agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to save agent');
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
              <h2 className="font-medium text-black">Edit Agent</h2>
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
                  <label className="block text-sm font-medium mb-1 text-black">Agent Name*</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-100 border-0 rounded-lg p-2 text-black placeholder-gray-500"
                    placeholder="Enter agent name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Agent Type*</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      type: e.target.value
                    })}
                    className="w-full bg-gray-100 border-0 rounded-lg p-2 text-black"
                  >
                    <option value="">Select an agent type</option>
                    {Object.keys(agents).map((agentType) => (
                      <option key={agentType} value={agentType}>
                        {agentType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-black">Availability*</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="internal"
                        checked={formData.availability === 'internal'}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value as 'internal' | 'external' | 'both' })}
                        className="mr-2"
                      />
                      <span className="text-sm text-black">Internal</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="external"
                        checked={formData.availability === 'external'}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value as 'internal' | 'external' | 'both' })}
                        className="mr-2"
                      />
                      <span className="text-sm text-black">External</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="both"
                        checked={formData.availability === 'both'}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value as 'internal' | 'external' | 'both' })}
                        className="mr-2"
                      />
                      <span className="text-sm text-black">Both</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between items-center bg-white">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-[#FFF1F3] text-[#F43F5E] border border-[#F43F5E] rounded-lg"
          >
            Delete Agent
          </button>
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