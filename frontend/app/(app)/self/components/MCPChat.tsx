import { useState, useEffect, useRef } from 'react';
import SCButton from './sc/SCButton';
import { useChatWindow } from './ChatProvider';
import { useMcpChat } from './chat/useMcpChat';
import { useChatHistory } from './chat/ChatHistoryContext';
import { useAgents } from './AgentsProvider';
import type { AgentDetails, InformationType,  } from './agentsConfig';

interface Agent {
  name: string;
  type: string;
}

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

interface McpResponse {
  text: string;
  files?: Array<{
    name: string;
    type: string;
    uri: string;
  }>;
}

interface MCPChatProps {
  agent: Agent | null;
}

// Organization business IDs
const ORGANIZATION = {
  BUSINESS_IDS: ['748', '1', '152']
} as const;

type ValidBusinessId = typeof ORGANIZATION.BUSINESS_IDS[number];

export function MCPChat({ agent }: MCPChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedBusinesses, setSelectedBusinesses] = useState<ValidBusinessId[]>([...ORGANIZATION.BUSINESS_IDS]);
  const [tempBusiness, setTempBusiness] = useState('');
  const [selectedInfoTypes, setSelectedInfoTypes] = useState<InformationType[]>([]);
  const [currentAgentDetails, setCurrentAgentDetails] = useState<AgentDetails | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { closeChat } = useChatWindow();
  const { sendMessage, isLoading } = useMcpChat();
  const { messages, addMessage, clearMessages } = useChatHistory(agent?.name || 'default');
  const { agents } = useAgents();

  // Debug log for initial props and context
  useEffect(() => {
    console.log('🔍 MCP Chat: Initial setup:', {
      agent,
      agents,
      availableAgents: Object.keys(agents),
      currentAgentDetails
    });
  }, []);

  // Update agent details when agent prop changes
  useEffect(() => {
    console.log('🔄 MCP Chat: Agent changed:', { 
      agent,
      agentName: agent?.name,
      agents,
      availableAgents: Object.keys(agents),
      agentExists: agent?.name ? agents[agent.name] !== undefined : false,
      exactMatch: agent?.name ? Object.keys(agents).find(key => key === agent.name) : null
    });

    if (agent?.name && agents[agent.name]) {
      const details = agents[agent.name];
      console.log('✅ MCP Chat: Found agent details:', {
        name: details.name,
        type: details.type,
        knowledgeBase: details.knowledgeBase,
        knowledgeBaseLength: details.knowledgeBase.length,
        exactConfig: agents[agent.name]
      });
      setCurrentAgentDetails(details);
    } else {
      console.warn('⚠️ MCP Chat: No agent details found for:', {
        requestedAgent: agent?.name,
        availableAgents: Object.keys(agents),
        exactMatch: agent?.name ? Object.keys(agents).find(key => key === agent.name) : null
      });
      setCurrentAgentDetails(null);
    }
  }, [agent, agents]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Validate information types when no specific business is selected
    if (selectedBusinesses.length === 0 && selectedInfoTypes.length === 0 && 
        !(currentAgentDetails?.knowledge.length === 1 && currentAgentDetails?.knowledge[0] === 'Help Centre')) {
      console.warn('⚠️ MCP Chat: Information types required when no specific business is selected');
      return;
    }

    console.log('💬 MCP Chat: Starting message send process', {
      currentAgent: agent,
      currentAgentDetails,
      selectedInfoTypes,
      knowledgeBase: currentAgentDetails?.knowledgeBase,
      knowledgeBaseLength: currentAgentDetails?.knowledgeBase?.length
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true
    };
    console.log('👤 MCP Chat: Created user message:', userMessage);
    addMessage(userMessage);
    setInputValue('');
    
    try {
      console.log('🔄 MCP Chat: Calling MCP API...', { 
        businessIds: selectedBusinesses.length > 0 ? selectedBusinesses : [...ORGANIZATION.BUSINESS_IDS],
        agentId: currentAgentDetails?.agentId,
        agentAliasId: currentAgentDetails?.agentAliasId,
        informationTypes: selectedBusinesses.length === 0 ? selectedInfoTypes : currentAgentDetails?.knowledgeBase,
        informationTypesLength: selectedBusinesses.length === 0 ? selectedInfoTypes.length : currentAgentDetails?.knowledgeBase.length
      });
      
      const mcpResponse = await sendMessage(
        inputValue, 
        selectedBusinesses.length > 0 ? selectedBusinesses : [...ORGANIZATION.BUSINESS_IDS],
        currentAgentDetails?.agentId,
        currentAgentDetails?.agentAliasId,
        // Don't send Help Centre as an information type
        selectedBusinesses.length === 0 
          ? selectedInfoTypes
          : currentAgentDetails?.knowledgeBase
      ) as string | McpResponse;
      console.log('📥 MCP Chat: Received MCP response:', mcpResponse);
      
      const mcpMessage: Message = {
        id: Date.now().toString(),
        text: typeof mcpResponse === 'string' ? mcpResponse : mcpResponse.text,
        isUser: false,
        files: typeof mcpResponse === 'string' ? undefined : mcpResponse.files
      };
      console.log('🤖 MCP Chat: Created MCP message:', mcpMessage);
      
      addMessage(mcpMessage);
      console.log('✅ MCP Chat: Message flow completed successfully');
    } catch (error) {
      console.error('❌ MCP Chat: Error in handleSendMessage:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        isUser: false
      };
      console.log('⚠️ MCP Chat: Created error message:', {
        id: errorMessage.id,
        text: errorMessage.text,
        isUser: errorMessage.isUser
      });
      addMessage(errorMessage);
    }
  };

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempBusiness(value);
  };

  const handleBusinessSubmit = () => {
    const trimmedBusiness = tempBusiness.trim();
    if (trimmedBusiness && ORGANIZATION.BUSINESS_IDS.includes(trimmedBusiness as ValidBusinessId)) {
      setSelectedBusinesses(prev => [...prev, trimmedBusiness as ValidBusinessId]);
      setTempBusiness('');
    }
  };

  const handleBusinessBlur = () => {
    const trimmedBusiness = tempBusiness.trim();
    if (trimmedBusiness && ORGANIZATION.BUSINESS_IDS.includes(trimmedBusiness as ValidBusinessId)) {
      setSelectedBusinesses(prev => [...prev, trimmedBusiness as ValidBusinessId]);
      setTempBusiness('');
    }
  };

  const handleTagRemove = (indexToRemove: number) => {
    setSelectedBusinesses(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBusinessSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && tempBusiness === '' && selectedBusinesses.length > 0) {
      e.preventDefault();
      setSelectedBusinesses(prev => prev.slice(0, -1));
    }
  };

  const handleInfoTypeChange = (type: InformationType) => {
    setSelectedInfoTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col border-b">
        {/* Agent Info and Controls */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              {agent ? (
                <span className="text-sm font-medium text-gray-600">
                  {agent.name.charAt(0)}
                </span>
              ) : (
                <img src="/mcp-icon.png" alt="MCP-1" className="h-8 w-8 rounded-full" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">
                {agent ? agent.name : 'MCP-1'}
              </span>
              {agent && (
                <span className="text-sm text-gray-500">{agent.type}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={clearMessages}
              className="rounded-full bg-white p-2 hover:bg-gray-100"
              title="Clear chat"
            >
              <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              onClick={closeChat}
              className="rounded-full bg-white p-2 hover:bg-gray-100"
            >
              <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Sections */}
        <div className="px-4 py-2 bg-gray-50">
          <div className="flex flex-col gap-1">
            {/* Business ID Section */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="business-select" className="text-xs font-medium text-gray-700">
                  Business ID
                </label>
                <div className="flex items-center gap-1.5 text-yellow-700 text-xs">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="italic">
                    Leave it blank to query all business
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-1.5 rounded-lg border border-gray-200 bg-white">
                {selectedBusinesses.map((business, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs border border-purple-200"
                  >
                    <span>{business}</span>
                    <button
                      onClick={() => handleTagRemove(index)}
                      className="text-purple-500 hover:text-purple-700"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <input
                  id="business-select"
                  type="text"
                  value={tempBusiness}
                  onChange={handleBusinessChange}
                  onBlur={handleBusinessBlur}
                  onKeyPress={handleKeyPress}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedBusinesses.length === 0 ? "Enter business ID" : ""}
                  className="flex-1 min-w-[120px] bg-transparent px-2 py-0.5 text-xs text-black focus:outline-none"
                />
              </div>
            </div>

            {/* Information Type Selection - Only show if not Help Centre only */}
            {!(currentAgentDetails?.knowledge.length === 1 && currentAgentDetails?.knowledge[0] === 'Help Centre') && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-700">
                    Information Types
                  </label>
                  {selectedBusinesses.length === 0 && (
                    <span className="text-xs text-red-500">(Required when no business selected)</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 p-1.5 rounded-lg border border-gray-200 bg-white min-h-[32px]">
                  {currentAgentDetails?.knowledgeBase.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleInfoTypeChange(type)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        selectedInfoTypes.includes(type)
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(message => {
          console.log('🔍 MCP Chat: Rendering message:', {
            id: message.id,
            text: message.text,
            isUser: message.isUser,
            hasText: Boolean(message.text),
            files: message.files
          });
          
          // Defensive check for message structure
          if (!message || typeof message.text !== 'string') {
            console.error('❌ MCP Chat: Invalid message structure:', message);
            return null;
          }

          return (
            <div
              key={message.id}
              className={`mb-4 ${message.isUser ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block px-4 py-2 rounded-lg ${
                  message.isUser 
                    ? 'bg-white text-black' 
                    : message.text.startsWith('Error:')
                      ? 'bg-red-50 text-red-600'
                      : 'bg-white text-[#7500FF]'
                }`}
              >
                {message.text.split('\n').map((line, index) => {
                  // Handle numbered lists
                  if (/^\d+\./.test(line)) {
                    return (
                      <div key={index} className="mt-2">
                        <span className="font-medium">{line}</span>
                      </div>
                    );
                  }
                  // Handle bullet points
                  if (line.trim().startsWith('-')) {
                    return (
                      <div key={index} className="ml-4 mt-1">
                        {line}
                      </div>
                    );
                  }
                  // Handle section headers (text ending with :)
                  if (line.trim().endsWith(':')) {
                    return (
                      <div key={index} className="mt-3 font-medium">
                        {line}
                      </div>
                    );
                  }
                  // Regular text
                  return (
                    <div key={index} className="mt-1">
                      {line}
                    </div>
                  );
                })}
                {message.files && message.files.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {message.files.map((file, index) => (
                      file.type.startsWith('image/') && (
                        <div key={index} className="rounded-lg overflow-hidden">
                          <img 
                            src={file.uri.replace('s3://', 'https://')} 
                            alt={file.name}
                            className="max-w-full h-auto rounded-lg"
                          />
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="text-left mb-4">
            <div className="inline-block px-4 py-2 rounded-lg bg-gray-50 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${agent ? agent.name : 'MCP-1'}...`}
              className="w-full rounded-full border-0 bg-[#F5F5F5] px-6 py-4 text-gray-700 placeholder-gray-500 text-base focus:outline-none focus:ring-0 disabled:opacity-50"
              disabled={isLoading}
            />
          </div>
          <SCButton
            variant="primary"
            action={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="rounded-full px-8 py-4 text-base font-medium disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Send'
            )}
          </SCButton>
        </div>
      </div>
    </div>
  );
} 