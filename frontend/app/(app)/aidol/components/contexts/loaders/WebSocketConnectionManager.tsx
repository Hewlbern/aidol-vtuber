'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '../WebSocketContext';

export default function WebSocketConnectionManager() {
  const { isConnected, connectionError, sendMessage } = useWebSocket();
  const [customUrl, setCustomUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Try to connect to localhost:12393 on component mount
  useEffect(() => {
    // We can't directly access the WebSocketProvider's internal socket
    // So we'll add a custom event listener to the window to handle reconnection
    const handleReconnect = (event: CustomEvent<{url?: string}>) => {
      const url = event.detail?.url;
      if (url) {
        console.log(`Reconnecting to custom URL: ${url}`);
        setStatusMessage(`Attempting to connect to ${url}...`);
        setIsConnecting(true);
        
        // The actual reconnection happens in the WebSocketProvider
        // This is just for UI feedback
        setTimeout(() => {
          if (isConnected) {
            setStatusMessage(`Connected to ${url}`);
          } else {
            setStatusMessage(`Failed to connect to ${url}. Check if server is running.`);
          }
          setIsConnecting(false);
        }, 2000);
      }
    };

    // Add event listener with proper typing
    window.addEventListener('reconnect-websocket', handleReconnect as EventListener);

    // Try localhost:12393 by default - but only once
    if (!isConnected && !isConnecting) {
      tryLocalhost();
    }

    return () => {
      window.removeEventListener('reconnect-websocket', handleReconnect as EventListener);
    };
  }, [isConnected, isConnecting]);

  // Function to try connecting to localhost:12393
  const tryLocalhost = () => {
    try {
      // Make sure the URL is properly formatted
      const url = 'ws://localhost:12393/client-ws';
      setCustomUrl(url);
      setStatusMessage(`Attempting to connect to ${url}...`);
      setIsConnecting(true);
      
      // Create a proper CustomEvent
      const event = new CustomEvent('reconnect-websocket', { 
        detail: { url } 
      });
      
      console.log('Dispatching reconnect event with URL:', url);
      window.dispatchEvent(event);
      
      // Add a delay before checking connection status
      setTimeout(() => {
        if (isConnected) {
          console.log('Successfully connected to', url);
          setStatusMessage(`Connected to ${url}`);
          
          // Fetch configs after connection is established
          sendMessage({ type: 'fetch-configs' });
        } else {
          console.log('Failed to connect to', url);
          setStatusMessage(`Failed to connect to ${url}. Check if server is running.`);
        }
        setIsConnecting(false);
      }, 3000); // Give it more time to connect
    } catch (error) {
      console.error('Error trying to connect to localhost:', error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setIsConnecting(false);
    }
  };

  // Handle custom URL input change
  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomUrl(e.target.value);
  };

  // Connect to custom URL
  const connectToCustomUrl = () => {
    if (!customUrl) return;
    
    setStatusMessage(`Attempting to connect to ${customUrl}...`);
    setIsConnecting(true);
    
    // Dispatch custom event to trigger reconnection in WebSocketProvider
    const event = new CustomEvent('reconnect-websocket', { 
      detail: { url: customUrl } 
    });
    window.dispatchEvent(event);
    
    // Add a delay before checking connection status
    setTimeout(() => {
      setIsConnecting(false);
    }, 3000);
  };

  // Add this function to test if the server is reachable
  const testServerReachability = () => {
    const url = 'http://localhost:12393/';
    setStatusMessage(`Testing if server is reachable at ${url}...`);
    
    // Use fetch to test if the server is reachable
    fetch(url, { method: 'HEAD', mode: 'no-cors' })
      .then(() => {
        setStatusMessage(`Server at ${url} appears to be reachable. Attempting WebSocket connection...`);
        tryLocalhost();
      })
      .catch(error => {
        setStatusMessage(`Server at ${url} is not reachable: ${error.message}. Check if it's running.`);
      });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      <h2 className="text-lg font-semibold mb-2">WebSocket Connection</h2>
      
      <div className="mb-2">
        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}></span>
        <span className="text-sm">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      {connectionError && (
        <div className="text-red-500 text-sm mb-2">
          Error: {connectionError}
        </div>
      )}
      
      {statusMessage && (
        <div className="text-gray-600 text-sm mb-2">
          Status: {statusMessage}
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <button 
            onClick={tryLocalhost}
            disabled={isConnecting}
            className={`px-2 py-1 text-xs rounded ${
              isConnecting 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Connect to localhost:12393
          </button>
          
          <button 
            onClick={() => {
              // Fetch configs
              sendMessage({ type: 'fetch-configs' });
              setStatusMessage('Fetching configurations...');
            }}
            disabled={!isConnected}
            className={`px-2 py-1 text-xs rounded ${
              isConnected 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Fetch Configs
          </button>
        </div>
        
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={customUrl}
            onChange={handleCustomUrlChange}
            placeholder="ws://localhost:8000/client-ws"
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
          />
          <button
            onClick={connectToCustomUrl}
            disabled={isConnecting}
            className={`px-2 py-1 text-xs rounded ${
              isConnecting 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Connect
          </button>
        </div>

        <div className="flex gap-2 mt-2">
          <button 
            onClick={testServerReachability}
            disabled={isConnecting}
            className={`px-2 py-1 text-xs rounded ${
              isConnecting 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
          >
            Test Server Reachability
          </button>
        </div>
      </div>
    </div>
  );
} 