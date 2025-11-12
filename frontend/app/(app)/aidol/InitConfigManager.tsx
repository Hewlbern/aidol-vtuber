'use client';

import { useEffect, useState } from 'react';
import { fetchBaseConfig, AppConfig } from './components/contexts/loaders/ConfigClient';
import { ModelProvider } from './components/contexts/ModelContext';

interface InitConfigManagerProps {
  children?: React.ReactNode;
  isConnected: boolean;
  sendMessage: (message: { type: string; [key: string]: unknown }) => void;
}

/**
 * Component that initializes the application by fetching the base configuration
 * from the backend server when the application starts.
 */
export default function InitConfigManager({ children, isConnected, sendMessage }: InitConfigManagerProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUnavailableNotice, setShowUnavailableNotice] = useState(false);

  // Effect to handle server unavailability notice
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!isConnected) {
      // Show notice after 45 seconds of no connection
      timeoutId = setTimeout(() => {
        setShowUnavailableNotice(true);
      }, 45000);
    } else {
      // Hide notice when connected
      setShowUnavailableNotice(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isConnected]);

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        setLoading(true);
        const baseConfig = await fetchBaseConfig();
        
        if (mounted) {
          setConfig(baseConfig);
          // Check if we're using the default config by looking for default values
          const isDefault = baseConfig.character.id === 'default' && 
                          baseConfig.character.name === 'Default Character';
          
          if (isDefault) {
            console.log('Using default configuration due to server unavailability');
          } else {
            console.log('Base configuration loaded:', baseConfig);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to load base configuration:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-2"></div>
        <p className="text-gray-400">Loading configuration...</p>
      </div>
    );
  }

  return (
    <ModelProvider 
      isConnected={isConnected} 
      sendMessage={sendMessage}
      initialConfig={config || {
        tts: {
          model: 'default',
          voice: 'default',
          rate: 1.0,
          volume: 1.0
        },
        character: {
          id: 'default',
          name: 'Default Character',
          modelName: 'default',
          persona: 'A friendly virtual character'
        },
        characters: [{
          id: 'default',
          name: 'Default Character',
          modelName: 'default',
          persona: 'A friendly virtual character'
        }],
        models: [{
          name: 'default',
          description: 'Default model',
          url: ''
        }],
        backgrounds: [{
          name: 'default',
          path: ''
        }]
      }}
    >
      {showUnavailableNotice && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500/90 text-white p-1.5 text-center z-40">
          <p className="text-xs">
            Server is currently unavailable. Using default configuration.
          </p>
        </div>
      )}
      {children}
    </ModelProvider>
  );
} 