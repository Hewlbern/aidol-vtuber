/**
 * Client for fetching configuration from the backend server
 */

export interface TTSConfig {
  model: string;
  voice: string;
  rate: number;
  volume: number;
}

export interface Character {
  id: string;
  name: string;
  modelName: string;
  persona: string;
  modelPath?: string;
  description?: string;
  url?: string;
  kScale?: number;
  initialXshift?: number;
  initialYshift?: number;
  kXOffset?: number;
  kYOffset?: number;
  idleMotionGroupName?: string;
  emotionMap?: Record<string, number>;
  tapMotions?: Record<string, Record<string, number>>;
}

export interface Model {
  name: string;
  description: string;
  url: string;
}

export interface Background {
  name: string;
  path: string;
}

export interface AppConfig {
  tts: TTSConfig;
  character: Character;
  characters: Character[];
  models: Model[];
  backgrounds: Background[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12393';

/**
 * Fetches the base configuration from the backend
 */
export async function fetchBaseConfig(): Promise<AppConfig> {
  try {
    // First check if the server is reachable
    const response = await fetch(`${API_BASE_URL}/api/base-config`, {
      headers: {
        'accept': 'application/json'
      },
      // Add timeout to avoid hanging
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      let errorMessage = `Failed to fetch config: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.message || JSON.stringify(errorData)}`;
      } catch {
        // If we can't parse the error response, just use the status text
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('Server appears to be offline or unreachable:', API_BASE_URL);
      // Return a default config instead of throwing
      return {
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
      };
    } else if (error instanceof Error && error.name === 'AbortError') {
      console.error('Request timed out while fetching base config');
      // Return a default config instead of throwing
      return {
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
      };
    }
    
    console.error('Error fetching base config:', error);
    // Return a default config for any other errors
    return {
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
    };
  }
}

/**
 * Fetches available backgrounds from the backend
 */
export async function fetchBackgrounds(): Promise<Background[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/backgrounds`, {
      headers: {
        'accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch backgrounds: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching backgrounds:', error);
    throw error;
  }
}

/**
 * Finds a model by name in the models array
 */
export function findModelByName(models: Model[], name: string): Model | undefined {
  return models.find(model => model.name === name);
}

/**
 * Finds a character by ID in the characters array
 */
export function findCharacterById(characters: Character[], id: string): Character | undefined {
  return characters.find(character => character.id === id);
} 