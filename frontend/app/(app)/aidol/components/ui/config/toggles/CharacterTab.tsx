'use client';

import { useState, useEffect } from 'react';
import { useModel } from '../../../contexts/ModelContext';

interface ModelDictCharacter {
  name: string;
  url: string;
  description?: string;
  kScale?: number;
  initialXshift?: number;
  initialYshift?: number;
  kXOffset?: number;
  kYOffset?: number;
  idleMotionGroupName?: string;
  emotionMap?: Record<string, number>;
  tapMotions?: Record<string, Record<string, number>>;
}

interface Character {
  id: string;
  name: string;
  modelName: string;
  modelPath?: string;
  description?: string;
  kScale?: number;
  initialXshift?: number;
  initialYshift?: number;
  kXOffset?: number;
  kYOffset?: number;
  idleMotionGroupName?: string;
  emotionMap?: Record<string, number>;
  tapMotions?: Record<string, Record<string, number>>;
}

interface CharacterTabProps {
  isConnected: boolean;
}

const CharacterTab: React.FC<CharacterTabProps> = ({ isConnected }) => {
  const { getAvailableCharacters, handleCharacterChange, characterId } = useModel();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [characterSource, setCharacterSource] = useState<'server' | 'local' | 'fallback'>('local');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fetchCharacters = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // First, try to load from local model_dict.json (works without server)
      console.log('[CharacterTab] Loading characters from local model_dict.json');
      try {
        const response = await fetch('/model/model_dict.json');
        if (!response.ok) {
          throw new Error(`Failed to load local characters: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format: expected array of characters');
        }
        
        console.log('[CharacterTab] Raw model_dict.json data:', data);
        
        // Transform the data to match our Character interface
        const transformedCharacters: Character[] = data
          .filter((char: ModelDictCharacter): char is ModelDictCharacter => 
            char && typeof char === 'object' && 
            typeof char.name === 'string' && 
            typeof char.url === 'string'
          )
          .map((char: ModelDictCharacter): Character => ({
            id: char.name,
            name: char.name,
            modelName: char.name,
            modelPath: char.url,
            description: char.description,
            kScale: char.kScale,
            initialXshift: char.initialXshift,
            initialYshift: char.initialYshift,
            kXOffset: char.kXOffset,
            kYOffset: char.kYOffset,
            idleMotionGroupName: char.idleMotionGroupName,
            emotionMap: char.emotionMap,
            tapMotions: char.tapMotions
          }));
        
        console.log('[CharacterTab] Transformed characters:', transformedCharacters);
        
        if (transformedCharacters.length > 0) {
          setCharacters(transformedCharacters);
          setCharacterSource('local');
          
          // Set default selection to wintherscris if available, otherwise use characterId from context
          const defaultId = transformedCharacters.find(c => c.id === 'wintherscris')?.id || characterId || transformedCharacters[0]?.id || '';
          if (defaultId && defaultId !== selectedCharacter) {
            setSelectedCharacter(defaultId);
          }
          setIsLoading(false);
          return;
        }
      } catch (localError) {
        console.warn('[CharacterTab] Failed to load local characters, trying server:', localError);
      }
      
      // If local loading failed, try server characters (if connected)
      if (isConnected) {
        const serverChars = getAvailableCharacters();
        if (serverChars && serverChars.length > 0) {
          console.log('[CharacterTab] Loaded characters from server:', serverChars);
          setCharacters(serverChars);
          setCharacterSource('server');
          
          // Set default selection to wintherscris if available, otherwise use characterId from context
          const defaultId = serverChars.find(c => c.id === 'wintherscris')?.id || characterId || serverChars[0]?.id || '';
          if (defaultId && defaultId !== selectedCharacter) {
            setSelectedCharacter(defaultId);
          }
          setIsLoading(false);
          return;
        }
      }
      
      // If both failed, use fallback characters
      console.log('[CharacterTab] Using fallback characters');
      const defaultChars = [
        { 
          id: 'wintherscris', 
          name: 'Wintherscris', 
          modelName: 'wintherscris', 
          modelPath: '/model/Wintherscris/Wintherscris1.model3.json',
          description: 'Wintherscris Character Model'
        },
        { 
          id: 'shizuku', 
          name: 'Shizuku', 
          modelName: 'shizuku', 
          modelPath: '/model/shizuku/shizuku.model.json',
          description: 'Orange-Haired Girl, locally available'
        },
        { 
          id: 'vanilla', 
          name: 'Vanilla', 
          modelName: 'vanilla', 
          modelPath: '/model/vanilla/vanilla.model3.json',
          description: 'Default character'
        }
      ];
      setCharacters(defaultChars);
      setCharacterSource('fallback');
      setSelectedCharacter('wintherscris');
      
      if (!isConnected) {
        setErrorMessage('Using local characters. Server connection not required for local models.');
      }
    } catch (error) {
      console.error('[CharacterTab] Error fetching characters:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load characters');
      
      // Only set default characters if we have no characters at all
      if (characters.length === 0) {
        console.log('[CharacterTab] Setting default characters as fallback');
        const defaultChars = [
          { 
            id: 'wintherscris', 
            name: 'Wintherscris', 
            modelName: 'wintherscris', 
            modelPath: '/model/Wintherscris/Wintherscris1.model3.json',
            description: 'Wintherscris Character Model'
          },
          { 
            id: 'shizuku', 
            name: 'Shizuku', 
            modelName: 'shizuku', 
            modelPath: '/model/shizuku/shizuku.model.json',
            description: 'Orange-Haired Girl, locally available'
          },
          { 
            id: 'vanilla', 
            name: 'Vanilla', 
            modelName: 'vanilla', 
            modelPath: '/model/vanilla/vanilla.model3.json',
            description: 'Default character'
          }
        ];
        setCharacters(defaultChars);
        setCharacterSource('fallback');
        setSelectedCharacter('wintherscris');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCharacters();
  }, [isConnected]);
  
  // Sync selectedCharacter with characterId from context
  useEffect(() => {
    if (characterId && characterId !== selectedCharacter) {
      setSelectedCharacter(characterId);
    }
  }, [characterId]);
  
  const handleCharacterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const characterId = e.target.value;
    setSelectedCharacter(characterId);
    
    const character = characters.find(c => c.id === characterId);
    if (character) {
      const modelPath = character.modelPath || `/model/${character.id}/${character.modelName}.model.json`;
      handleCharacterChange(characterId, modelPath);
    }
  };
  
  const getSourceMessage = () => {
    switch (characterSource) {
      case 'server':
        return { text: 'Characters loaded from server', color: 'text-green-400', bg: 'bg-green-900/20' };
      case 'local':
        return { text: 'Characters loaded from local files (works offline)', color: 'text-blue-400', bg: 'bg-blue-900/20' };
      case 'fallback':
        return { text: 'Using default characters', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
      default:
        return { text: '', color: '', bg: '' };
    }
  };

  const sourceInfo = getSourceMessage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Character Selection</h3>
        {!isConnected && characterSource === 'local' && (
          <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
            Offline Mode
          </span>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-2"></div>
          <p className="text-gray-400">Loading characters...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status message */}
          {sourceInfo.text && (
            <div className={`p-2 rounded-lg ${sourceInfo.bg} border ${sourceInfo.color.includes('green') ? 'border-green-700' : sourceInfo.color.includes('blue') ? 'border-blue-700' : 'border-yellow-700'}`}>
              <p className={`text-sm ${sourceInfo.color} flex items-center gap-2`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {sourceInfo.text}
              </p>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="p-2 rounded-lg bg-yellow-900/20 border border-yellow-700">
              <p className="text-sm text-yellow-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </p>
            </div>
          )}

          {/* Connection status */}
          {!isConnected && characterSource !== 'local' && (
            <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700">
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-yellow-400">Note:</span> Server not connected. Local characters will work without a server connection.
              </p>
            </div>
          )}

          <div className="relative">
            <label htmlFor="character-select" className="block text-sm font-medium text-gray-300 mb-1">
              Select Character
            </label>
            <select 
              id="character-select"
              value={selectedCharacter}
              onChange={handleCharacterSelect}
              disabled={characters.length === 0}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Choose a character...</option>
              {characters.map(character => (
                <option key={character.id} value={character.id}>
                  {character.name} {character.description ? `- ${character.description}` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={fetchCharacters}
            className="w-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh Characters
          </button>
        </div>
      )}
    </div>
  );
};

export default CharacterTab; 