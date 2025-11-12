/**
 * Configuration Manager for Open LLM VTuber
 * Handles loading, switching, and managing configurations
 */

// Configuration state
let baseConfig = null;
let characters = [];
let models = [];
let configFiles = [];
let currentCharacter = null;

// Use a different name to avoid conflicts with global variables
let backgroundList = [];

// Event callbacks
const configEventCallbacks = {
    onConfigLoaded: [],
    onCharacterChanged: [],
    onBackgroundsLoaded: [],
    onConfigFilesLoaded: [],
    onError: []
};

/**
 * Load base configuration from the server
 */
function loadBaseConfig() {
    console.log('Loading base configuration...');
    
    // First try to get from WebSocket
    if (window.WebSocketHandler && window.WebSocketHandler.isConnected()) {
        window.WebSocketHandler.on('onConfigList', handleConfigFilesLoaded);
        window.WebSocketHandler.on('onBackgroundList', handleBackgroundsLoaded);
        window.WebSocketHandler.fetchConfigs();
        window.WebSocketHandler.fetchBackgrounds();
        
        // Fetch via HTTP as fallback
        fetch('/api/base-config')
            .then(response => {
                console.log('Base config response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Raw response:', JSON.stringify(data));
                handleBaseConfigLoaded(data);
            })
            .catch(error => {
                console.error('Error loading base config:', error);
                triggerConfigEvent('onError', { message: 'Failed to load base configuration', error });
            });
    } else {
        // Fetch via HTTP if WebSocket is not available
        fetch('/api/base-config')
            .then(response => {
                console.log('Base config response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Raw response:', JSON.stringify(data));
                handleBaseConfigLoaded(data);
            })
            .catch(error => {
                console.error('Error loading base config:', error);
                triggerConfigEvent('onError', { message: 'Failed to load base configuration', error });
            });
    }
}

/**
 * Handle base configuration loaded from server
 */
function handleBaseConfigLoaded(data) {
    console.log('Base config loaded:', data);
    baseConfig = data;
    window.baseConfig = data; // Also set the global baseConfig for backward compatibility
    
    // Extract characters and models
    characters = data.characters || [];
    models = data.models || [];
    currentCharacter = data.character || null;
    
    // Log found characters and models
    console.log(`Found ${characters.length} characters:`, characters.map(c => `${c.name} (${c.id})`));
    console.log(`Found ${models.length} models:`, models.map(m => `${m.name}: ${m.url}`));
    
    // Trigger event
    triggerConfigEvent('onConfigLoaded', { 
        baseConfig, 
        characters, 
        models, 
        currentCharacter 
    });
}

/**
 * Handle backgrounds loaded from server
 */
function handleBackgroundsLoaded(data) {
    console.log('Backgrounds loaded:', data);
    backgroundList = data;
    
    // Trigger event
    triggerConfigEvent('onBackgroundsLoaded', backgroundList);
}

/**
 * Handle config files loaded from server
 */
function handleConfigFilesLoaded(data) {
    console.log('Config files received:', data);
    configFiles = data;
    
    // Trigger event
    triggerConfigEvent('onConfigFilesLoaded', configFiles);
}

/**
 * Switch to a different character
 */
function switchCharacter(characterId) {
    console.log(`Loading character: "${characterId}"`);
    
    // Find the character in the loaded characters list
    const character = findCharacter(characterId);
    
    if (!character) {
        console.error(`Character "${characterId}" not found in characters list`);
        triggerConfigEvent('onError', { message: `Character ${characterId} not found in config` });
        return;
    }
    
    // Use the character's ID to find the file name
    const fileName = characterId.includes('_') ? 
        characterId.split('_').slice(1).join('_') : 
        characterId;
    
    console.log(`Using character file name: ${fileName}`);
    
    // Send the switch-config message via WebSocket if available
    if (window.WebSocketHandler && typeof window.WebSocketHandler.send === 'function') {
        window.WebSocketHandler.send({
            type: 'switch-config',
            config_id: characterId
        });
    } else {
        console.error('WebSocketHandler not available or send method not found');
        
        // Fallback to HTTP API
        fetch(`/api/switch-character/${characterId}`, {
            method: 'POST'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Character switched via HTTP: ${data.message}`);
            currentCharacter = character;
            triggerConfigEvent('onCharacterChanged', character);
        })
        .catch(error => {
            console.error('Error switching character:', error);
            triggerConfigEvent('onError', { message: 'Failed to switch character', error });
        });
    }
}

/**
 * Find a character by ID in the loaded characters list
 */
function findCharacter(characterId) {
    console.log(`Looking for character "${characterId}" in config`);
    const character = characters.find(c => c.id === characterId);
    
    if (character) {
        console.log(`Found character: ${character.name} with model: ${character.modelName}`);
        return character;
    }
    
    console.error(`Character "${characterId}" not found in config`);
    return null;
}

/**
 * Find a model by name in the loaded models list
 */
function findModel(modelName) {
    console.log(`Looking for model "${modelName}" in models list`);
    const model = models.find(m => m.name === modelName);
    
    if (model) {
        console.log(`Found model URL: ${model.url}`);
        return model;
    }
    
    console.error(`Model "${modelName}" not found in models list`);
    return null;
}

/**
 * Register an event handler
 */
function onConfigEvent(eventName, callback) {
    if (configEventCallbacks[eventName]) {
        configEventCallbacks[eventName].push(callback);
    } else {
        console.warn(`Unknown event: ${eventName}`);
    }
}

/**
 * Trigger an event
 */
function triggerConfigEvent(eventName, data) {
    if (configEventCallbacks[eventName]) {
        for (const callback of configEventCallbacks[eventName]) {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${eventName} callback:`, error);
            }
        }
    }
}

/**
 * Populate a character dropdown with available characters
 */
function populateCharacterDropdown(selectElement) {
    if (!selectElement) return;
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Add characters as options
    characters.forEach(character => {
        const option = document.createElement('option');
        option.value = character.id;
        option.textContent = `${character.name} (${character.id})`;
        selectElement.appendChild(option);
        console.log(`Adding character to dropdown: ${character.name} (${character.id})`);
    });
    
    // Set current character as selected if available
    if (currentCharacter && currentCharacter.id) {
        selectElement.value = currentCharacter.id;
    }
    
    console.log(`Character dropdown populated with options: ${characters.length}`);
}

// Export public API
window.ConfigManager = {
    loadBaseConfig,
    switchCharacter,
    findCharacter,
    findModel,
    onConfigEvent,
    populateCharacterDropdown,
    getCharacters: () => characters,
    getModels: () => models,
    getBackgrounds: () => backgroundList,
    getConfigFiles: () => configFiles,
    getCurrentCharacter: () => currentCharacter,
    isConnected: () => window.WebSocketHandler && window.WebSocketHandler.isConnected()
}; 