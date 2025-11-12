import { useState } from 'react';
import type { InformationType } from '../agentsConfig';

export const useMcpChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    message: string, 
    businessIds: string[] | undefined,
    agentId: string = 'B6GA2N90WU',
    agentAliasId: string = 'VTRJVBOA8A',
    informationTypes?: InformationType[]
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate information types
      console.log("informationTypes", informationTypes)
      
      if (!informationTypes || informationTypes.length === 0) {
        console.warn('⚠️ MCP Chat: No information types provided, using default set');
        informationTypes = ['Payment', 'Menus']; // Default set
      }

      console.log('📤 MCP Chat: Sending request to MCP API...', { 
        businessIds,
        agentId,
        agentAliasId,
        informationTypes,
        informationTypesLength: informationTypes.length
      });

      const requestBody = {
        query: message,
        business_id: businessIds && businessIds.length > 0 ? businessIds : undefined,
        agent_id: agentId,
        agent_alias_id: agentAliasId,
        session_id: 'optional-session-id',
        enable_trace: false,
        information_type: informationTypes
      };

      console.log('📤 MCP Chat: Request body:', {
        ...requestBody,
        information_type_length: requestBody.information_type?.length
      });

      const response = await fetch('https://44von7fpbsqg2xvduqxr2pfcfi0dspjh.lambda-url.us-west-2.on.aws/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 MCP Chat: Received response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MCP Chat: API returned error status:', response.status, 'Error text:', errorText);
        throw new Error(`Failed to get response from MCP: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ MCP Chat: Successfully parsed response:', data);
      
      if (data.error) {
        console.error('❌ MCP Chat: Response contains error:', data.error);
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('❌ MCP Chat: Error in sendMessage:', {
        error: err,
        message: errorMessage
      });
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading,
    error
  };
}; 