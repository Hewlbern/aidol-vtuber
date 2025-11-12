console.log('Starting initialization setup...');
let app = null;
let currentModel = null;
let backgrounds = [];
let enablePointerInteraction = true;
let enableScrollResize = true;
let scrollSensitivity = 1;
let enableAIVoice = true;
let enableAutoResponse = false;
let isAISpeaking = false;
let ttsSocket = null;
// Define baseConfig as a global variable
window.baseConfig = null;
// Expose currentModel to the window object for lip sync
window.currentModel = null;

// Initialize Live2D after all dependencies are loaded
window.initializeLive2D = async () => {
    console.log('Initializing Live2D...');
    try {
        // Check if ConfigManager is available
        if (!window.ConfigManager) {
            console.error('ConfigManager is not defined. Cannot initialize Live2D.');
            document.getElementById('status').textContent = 'Error: ConfigManager not loaded';
            return;
        }
        
        // Register event handlers for configuration
        ConfigManager.onConfigEvent('onConfigLoaded', handleConfigLoaded);
        ConfigManager.onConfigEvent('onCharacterChanged', handleCharacterChanged);
        ConfigManager.onConfigEvent('onBackgroundsLoaded', handleBackgroundsLoaded);
        ConfigManager.onConfigEvent('onConfigFilesLoaded', handleConfigFilesLoaded);
        ConfigManager.onConfigEvent('onError', handleError);
        
        // Load base configuration
        ConfigManager.loadBaseConfig();
        
        // Initialize PIXI Live2D
        PIXI.live2d.Live2DModel.registerTicker(PIXI.Ticker);
        console.log('Live2D ticker registered');

        // Create PIXI Application
        app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            transparent: true,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
        });
        console.log('PIXI application created');

        document.getElementById('live2d-container').appendChild(app.view);

        // Initialize Live2D Framework
        if (PIXI.live2d.Live2DModel.initConfig) {
            PIXI.live2d.Live2DModel.initConfig({
                pixelRatio: window.devicePixelRatio || 1,
                autoUpdate: true,
                autoLoad: true
            });
            console.log('Live2D config initialized');
        }

        // Set up model selection handler
        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
            console.log('Character selection changed:', e.target.value);
            if (e.target.value) {
                loadCharacter(e.target.value);
            }
        });
        }

        // Load initial model if config was loaded successfully
        if (window.baseConfig && window.baseConfig.characters && window.baseConfig.characters.length > 0) {
                // Fallback to first character
                console.log('Loading first available character:', window.baseConfig.characters[0].id);
                await loadCharacter(window.baseConfig.characters[0].id);
            } else {
                // Last resort - try to load a default model
                console.log('No characters available, trying default model');
            await loadModel('/live2d-models/shizuku/shizuku.model.json');
        }

        // Load backgrounds
        await loadBackgrounds();
    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('status').textContent = `Error: ${error.message}`;
    }
};

/**
 * Load a Live2D model
 * @param {string} modelUrl - URL to the model JSON file
 */
async function loadModel(modelUrl) {
    console.log('Starting model load:', modelUrl);
    
    try {
        // Clear existing model
        if (currentModel) {
            app.stage.removeChild(currentModel);
            currentModel = null;
            window.currentModel = null;
        }
        
        console.log('Creating new Live2D model');
        const model = await PIXI.live2d.Live2DModel.from(modelUrl);
        
        console.log('Model created:', model);
        
        // Set up model
        model.scale.set(1);
        model.anchor.set(0.5, 0.5);
        model.position.set(app.renderer.width / 2, app.renderer.height / 2);
        
        // Add to stage
        app.stage.addChild(model);
        console.log('Model added to stage');
        
        // Store current model
        currentModel = model;
        window.currentModel = model;
        
        // Log model structure
        console.log('Model loaded successfully. Structure:');
        console.log('Model type:', model.constructor.name);
        
        if (model.internalModel) {
            console.log('Internal model type:', model.internalModel.constructor.name);
            
            // Log available methods
            console.log('Available methods:');
            for (const key in model.internalModel) {
                if (typeof model.internalModel[key] === 'function') {
                    console.log(`- ${key}`);
                }
            }
        }
        
        // Initialize lip sync
        if (window.LipSync) {
            window.LipSync.initLipSync(model);
        } else {
            console.warn('LipSync module not loaded');
        }
        
        // Make model interactive
        model.interactive = true;
        model.buttonMode = true;
        
        // Add drag functionality
        let isDragging = false;
        let dragStartPosition = { x: 0, y: 0 };
        let modelStartPosition = { x: 0, y: 0 };
        
        model.on('pointerdown', (event) => {
            if (!enablePointerInteraction) return;
            
            isDragging = true;
            dragStartPosition.x = event.data.global.x;
            dragStartPosition.y = event.data.global.y;
            modelStartPosition.x = model.position.x;
            modelStartPosition.y = model.position.y;
        });
        
        model.on('pointermove', (event) => {
            if (!isDragging || !enablePointerInteraction) return;
            
            const dx = event.data.global.x - dragStartPosition.x;
            const dy = event.data.global.y - dragStartPosition.y;
            
            model.position.x = modelStartPosition.x + dx;
            model.position.y = modelStartPosition.y + dy;
        });
        
        model.on('pointerup', () => {
            if (isDragging) {
                console.log('Drag ended');
                isDragging = false;
            }
        });
        
        model.on('pointerupoutside', () => {
            if (isDragging) {
                console.log('Drag ended');
                isDragging = false;
            }
        });
        
        // Add scroll to resize
        document.addEventListener('wheel', (event) => {
            if (!enableScrollResize) return;
            
            const delta = -event.deltaY * 0.001 * scrollSensitivity;
            const newScale = model.scale.x + delta;
            
            // Limit scale
            if (newScale > 0.1 && newScale < 5) {
                model.scale.set(newScale);
            }
        });
        
        return model;
    } catch (error) {
        console.error('Error loading model:', error);
        return null;
    }
}

// Drag functionality with logging
let dragData = null;

function onDragStart(event) {
    console.log('Drag started');
    dragData = event.data;
    this.dragging = true;
}

function onDragEnd() {
    console.log('Drag ended');
    this.dragging = false;
    dragData = null;
}

function onDragMove() {
    if (this.dragging && dragData) {
        const newPosition = dragData.getLocalPosition(this.parent);
        this.position.x = newPosition.x;
        this.position.y = newPosition.y;
        
        // Update sliders to match new position
        const xRatio = this.position.x / window.innerWidth;
        const yRatio = this.position.y / window.innerHeight;
        console.log('Model position updated:', {x: xRatio, y: yRatio});
        
        document.getElementById('posXSlider').value = xRatio;
        document.getElementById('posYSlider').value = yRatio;
        document.getElementById('posXValue').textContent = xRatio.toFixed(2);
        document.getElementById('posYValue').textContent = yRatio.toFixed(2);
    }
}

function updateModelParameters() {
    if (!currentModel) {
        console.log('No model to update parameters');
        return;
    }
    
    const scale = parseFloat(document.getElementById('scaleSlider').value);
    const posX = parseFloat(document.getElementById('posXSlider').value) * window.innerWidth;
    const posY = parseFloat(document.getElementById('posYSlider').value) * window.innerHeight;
    
    console.log('Updating model parameters:', {scale, posX, posY});
    currentModel.scale.set(scale);
    currentModel.position.set(posX, posY);
}

// Event listeners with logging
document.getElementById('scaleSlider').addEventListener('input', (e) => {
    console.log('Scale changed:', e.target.value);
    document.getElementById('scaleValue').textContent = e.target.value;
    updateModelParameters();
});

document.getElementById('posXSlider').addEventListener('input', (e) => {
    console.log('X position changed:', e.target.value);
    document.getElementById('posXValue').textContent = e.target.value;
    updateModelParameters();
});

document.getElementById('posYSlider').addEventListener('input', (e) => {
    console.log('Y position changed:', e.target.value);
    document.getElementById('posYValue').textContent = e.target.value;
    updateModelParameters();
});

// Handle window resize with logging
window.addEventListener('resize', () => {
    console.log('Window resized:', {
        width: window.innerWidth,
        height: window.innerHeight
    });
    if (app) {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        updateModelParameters();
    }
});

// Trigger PIXI loaded callback after PIXI loads
if (window.PIXI) {
    window.onPixiLoaded();
} else {
    document.querySelector('script[src*="pixi.js"]').onload = window.onPixiLoaded;
}

// Message form controls
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const attachmentInput = document.getElementById('attachment-input');
const muteButton = document.getElementById('muteButton');
const handButton = document.getElementById('handButton');

let isMuted = false;
let isHandRaised = false;
let attachments = [];

// Handle mute toggle
muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    muteButton.innerHTML = isMuted ? 
        '<i class="fas fa-microphone-slash"></i>' : 
        '<i class="fas fa-microphone"></i>';
    muteButton.classList.toggle('active', isMuted);
    console.log('Mute toggled:', isMuted);
    
    if (isMuted) {
        WebSocketHandler.stopMicrophone();
    } else {
        WebSocketHandler.startMicrophone();
    }
});

// Handle hand raise toggle
handButton.addEventListener('click', () => {
    if (isMuted) return;
    
    isHandRaised = !isHandRaised;
    handButton.classList.toggle('active', isHandRaised);
    
    if (isHandRaised) {
        // Send interrupt signal
        WebSocketHandler.sendInterruptSignal();
    }
    
    console.log('Hand raised:', isHandRaised);
});

// Handle file attachments
attachmentInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    attachments = [...attachments, ...files];
    console.log('Files attached:', files);
    updateAttachmentPreview();
});

function updateAttachmentPreview() {
    const previewContainer = document.querySelector('.attachment-preview') || 
        document.createElement('div');
    previewContainer.className = 'attachment-preview';
    previewContainer.innerHTML = '';

    attachments.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'attachment-item';
        item.innerHTML = `
            ${file.name}
            <button type="button" data-index="${index}">×</button>
        `;
        previewContainer.appendChild(item);
    });

    if (!previewContainer.parentNode && attachments.length > 0) {
        messageForm.appendChild(previewContainer);
    } else if (attachments.length === 0 && previewContainer.parentNode) {
        previewContainer.remove();
    }
}

// Handle attachment removal
document.addEventListener('click', (e) => {
    if (e.target.matches('.attachment-item button')) {
        const index = parseInt(e.target.dataset.index);
        attachments.splice(index, 1);
        updateAttachmentPreview();
    }
});

// Handle message submission
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message && attachments.length === 0) return;

    console.log('Sending message:', {
        text: message,
        attachments,
        isMuted,
        isHandRaised
    });

    // Send message to backend
    sendMessage(message, attachments);

    // Clear form
    messageInput.value = '';
    attachments = [];
    updateAttachmentPreview();
});

// Add this function to fetch available backgrounds
async function loadBackgrounds() {
    console.log('Loading available backgrounds...');
    try {
        const response = await fetch('/api/backgrounds');
        const data = await response.json();
        backgrounds = data;
        
        const backgroundSelect = document.getElementById('backgroundSelect');
        backgroundSelect.innerHTML = '<option value="">None</option>';
        
        backgrounds.forEach(bg => {
            const option = document.createElement('option');
            option.value = bg.path;
            option.textContent = bg.name;
            backgroundSelect.appendChild(option);
        });

        console.log('Backgrounds loaded:', backgrounds);
    } catch (error) {
        console.error('Error loading backgrounds:', error);
    }
}

// Add background change handler
document.getElementById('backgroundSelect').addEventListener('change', (e) => {
    const bgImage = document.getElementById('background-image');
    const selectedValue = e.target.value;
    
    if (selectedValue) {
        bgImage.src = selectedValue;
        bgImage.style.display = 'block';
        console.log('Background changed to:', selectedValue);
    } else {
        bgImage.style.display = 'none';
        console.log('Background removed');
    }
});

// Add tab switching logic
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.querySelector(`.tab-content[data-tab="${button.dataset.tab}"]`).classList.add('active');
    });
});

// Add interaction controls
document.getElementById('enablePointer').addEventListener('change', (e) => {
    enablePointerInteraction = e.target.checked;
    if (currentModel) {
        currentModel.buttonMode = enablePointerInteraction;
        currentModel.interactive = enablePointerInteraction;
    }
});

document.getElementById('enableScroll').addEventListener('change', (e) => {
    enableScrollResize = e.target.checked;
});

document.getElementById('scrollSensitivity').addEventListener('input', (e) => {
    scrollSensitivity = parseFloat(e.target.value);
    document.getElementById('scrollSensValue').textContent = scrollSensitivity;
});

// Add scroll handler
window.addEventListener('wheel', (e) => {
    if (!enableScrollResize || !currentModel) return;
    
    const delta = -Math.sign(e.deltaY) * 0.1 * scrollSensitivity;
    const newScale = Math.max(0.1, Math.min(2, currentModel.scale.x + delta));
    
    currentModel.scale.set(newScale);
    document.getElementById('scaleSlider').value = newScale;
    document.getElementById('scaleValue').textContent = newScale.toFixed(1);
});

// Initialize TTS WebSocket connection
function initTTSWebSocket() {
    console.log('TTS WebSocket functionality moved to WebSocketHandler');
}

// Audio playback function
async function playAudio(audioPath) {
    if (!enableAIVoice) return;
    
    try {
        const audio = new Audio(audioPath);
        audio.volume = parseFloat(document.getElementById('voiceVolume').value);
        audio.playbackRate = parseFloat(document.getElementById('speakingRate').value);
        
        isAISpeaking = true;
        updateSpeakingStatus();
        
        // Notify backend that audio playback is starting
        WebSocketHandler.sendAudioPlayStart({
            text: currentModel ? currentModel.internalModel?.settings?.name || 'AI' : 'AI'
        });
        
        await audio.play();
        
        audio.onended = () => {
            isAISpeaking = false;
            updateSpeakingStatus();
        };
    } catch (error) {
        console.error('Error playing audio:', error);
        isAISpeaking = false;
        updateSpeakingStatus();
    }
}

// Update UI to show speaking status
function updateSpeakingStatus() {
    const handButton = document.getElementById('handButton');
    handButton.classList.toggle('speaking', isAISpeaking);
    if (isAISpeaking) {
        handButton.innerHTML = '<i class="fas fa-comment-dots"></i>';
    } else {
        handButton.innerHTML = '<i class="fas fa-hand-paper"></i>';
    }
}

// Add AI voice control handlers
document.getElementById('enableAIVoice').addEventListener('change', (e) => {
    enableAIVoice = e.target.checked;
});

document.getElementById('enableAutoResponse').addEventListener('change', (e) => {
    enableAutoResponse = e.target.checked;
});

document.getElementById('voiceVolume').addEventListener('input', (e) => {
    document.getElementById('voiceVolumeValue').textContent = e.target.value;
});

document.getElementById('speakingRate').addEventListener('input', (e) => {
    document.getElementById('speakingRateValue').textContent = e.target.value;
});

// Initialize WebSocketHandler when the page loads
window.addEventListener('load', () => {
    console.log('Page loaded, WebSocketHandler should be initializing...');
});

// Handle config loaded event
function handleConfigLoaded(data) {
    // Populate character dropdown
    const characterSelect = document.getElementById('modelSelect');
    if (characterSelect) {
        ConfigManager.populateCharacterDropdown(characterSelect);
    }
    
    // Load initial character if available
    if (data.currentCharacter && data.currentCharacter.id) {
        loadCharacter(data.currentCharacter.id);
    } else if (data.characters && data.characters.length > 0) {
        loadCharacter(data.characters[0].id);
    }
}

// Handle character changed event
function handleCharacterChanged(character) {
    if (!character) return;
    
    // Find the character and model
    const characterData = ConfigManager.findCharacter(character.id);
    if (!characterData) return;
    
    const modelData = ConfigManager.findModel(characterData.modelName);
    if (!modelData) return;
    
    // Load the model
    loadModel(modelData.url);
}

// Handle backgrounds loaded event
function handleBackgroundsLoaded(backgrounds) {
    // Populate background dropdown
    const backgroundSelect = document.getElementById('backgroundSelect');
    if (backgroundSelect) {
        backgroundSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'None';
        backgroundSelect.appendChild(defaultOption);
        
        // Add backgrounds as options
        backgrounds.forEach(bg => {
            const option = document.createElement('option');
            option.value = bg;
            option.textContent = bg;
            backgroundSelect.appendChild(option);
        });
    }
}

// Handle error event
function handleError(error) {
    console.error('Error received:', error);
    document.getElementById('status').textContent = `Error: ${error.message}`;
}

// Update character selector function
function updateCharacterSelector() {
        const characterSelect = document.getElementById('modelSelect');
        characterSelect.innerHTML = ''; // Clear existing options
        
        if (Array.isArray(window.baseConfig.characters)) {
            window.baseConfig.characters.forEach(character => {
                if (character && character.name) {
                    console.log(`Adding character to dropdown: ${character.name} (${character.id})`);
                    const option = document.createElement('option');
                    option.value = character.id;
                    option.textContent = character.name;
                    characterSelect.appendChild(option);
                } else {
                    console.warn('Invalid character entry:', character);
                }
            });
            console.log('Character dropdown populated with options:', characterSelect.options.length);
    }
}

// Update loadCharacter function to use WebSocketHandler
async function loadCharacter(characterId) {
    if (!characterId) {
        console.error('Invalid character ID (empty or null)');
        return;
    }
    
    console.log(`Loading character: "${characterId}"`);
    
    // Use WebSocketHandler to switch config
    ConfigManager.switchCharacter(characterId);
    
    // The rest of the function can remain for backward compatibility
    // but the actual character switching will be handled by the WebSocket
    try {
        // Make sure baseConfig exists
        if (!window.baseConfig) {
            console.error('Base config is not initialized');
            throw new Error('Configuration not loaded');
        }
        
            // Find the character in the baseConfig
            console.log(`Looking for character "${characterId}" in config`);
            const character = window.baseConfig.characters.find(c => c.id === characterId);
            if (!character) {
                console.error(`Character "${characterId}" not found in characters list:`, 
                    window.baseConfig.characters.map(c => `${c.name} (${c.id})`));
                throw new Error(`Character ${characterId} not found in config`);
            }
            console.log(`Found character: ${character.name} with model: ${character.modelName}`);

            // Find the model for this character
            console.log(`Looking for model "${character.modelName}" in models list`);
            const modelInfo = window.baseConfig.models.find(m => m.name === character.modelName);
            if (!modelInfo || !modelInfo.url) {
                console.error(`Model "${character.modelName}" not found in models list:`, 
                    window.baseConfig.models?.map(m => `${m.name}: ${m.url}`) || 'No models');
                throw new Error(`Model "${character.modelName}" for character ${character.name} not found`);
            }
            console.log(`Found model URL: ${modelInfo.url}`);

            // Update status
            document.getElementById('status').textContent = `Character: ${character.name}`;
            
            // Load the model
            console.log(`Loading model from URL: ${modelInfo.url}`);
            await loadModel(modelInfo.url);
            
            // Update current character in baseConfig
            window.baseConfig.character = character;
            console.log(`Character ${character.name} loaded successfully`);
            
            return true;
    } catch (error) {
        console.error('Error loading character:', error);
        document.getElementById('status').textContent = `Error loading character: ${error.message}`;
        return false;
    }
}

// Add this function to load a model directly without ConfigManager
async function loadModelDirect(modelUrl) {
    console.log(`Starting model load: ${modelUrl}`);
    try {
        if (currentModel) {
            console.log('Removing existing model');
            app.stage.removeChild(currentModel);
            currentModel.destroy();
        }
        
        console.log('Creating new Live2D model');
        currentModel = await PIXI.live2d.Live2DModel.from(modelUrl);
        
        console.log('Model created:', currentModel);
        
        // Add the model to the stage
        app.stage.addChild(currentModel);
        console.log('Model added to stage');
        
        // Center the model
        currentModel.x = app.renderer.width / 2;
        currentModel.y = app.renderer.height / 2;
        
        // Enable dragging if allowed
        if (enablePointerInteraction) {
            currentModel.draggable = true;
        }
        
        // Update model parameters
        updateModelParameters();
        
        // Update status
        document.getElementById('status').textContent = `Model loaded: ${modelUrl}`;
        
        return true;
    } catch (error) {
        console.error('Error loading model:', error);
        document.getElementById('status').textContent = `Error loading model: ${error.message}`;
        return false;
    }
}

// Add a fallback initialization function
window.initializeLive2DFallback = async () => {
    console.log('Initializing Live2D with fallback...');
    try {
        // Initialize PIXI Live2D
        PIXI.live2d.Live2DModel.registerTicker(PIXI.Ticker);
        console.log('Live2D ticker registered');

        // Create PIXI Application
        app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            transparent: true,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
        });
        console.log('PIXI application created');

        document.getElementById('live2d-container').appendChild(app.view);

        // Load a default model
        await loadModelDirect('/live2d-models/shizuku/shizuku.model.json');
        
        document.getElementById('status').textContent = 'Fallback model loaded. ConfigManager not available.';
    } catch (error) {
        console.error('Fallback initialization error:', error);
        document.getElementById('status').textContent = `Error: ${error.message}`;
    }
};

// Update the sendMessage function to avoid adding messages to chat display
// (since MessageHandler will handle that)
function sendMessage(text, attachments = []) {
    console.log('Sending message:', text);
    
    // Don't add to chat display here - MessageHandler will do it
    
    if (window.MessageHandler && typeof window.MessageHandler.sendTextMessage === 'function') {
        window.MessageHandler.sendTextMessage(text, attachments, isMuted, isHandRaised);
    } else if (window.WebSocketHandler && typeof window.WebSocketHandler.sendTextInput === 'function') {
        // Only add to chat display if MessageHandler is not available
        const chatDisplay = document.getElementById('chatDisplay');
        if (chatDisplay) {
            const messageElement = document.createElement('div');
            messageElement.className = 'user-message';
            messageElement.textContent = text;
            chatDisplay.appendChild(messageElement);
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
        
        window.WebSocketHandler.sendTextInput(text, attachments, isMuted, isHandRaised);
    } else {
        console.error('Neither MessageHandler nor WebSocketHandler available');
    }
}

// Add this function to the live2d-viewer.js file
function setupMouthTest() {
    const testOpenBtn = document.getElementById('testMouthOpen');
    const testCloseBtn = document.getElementById('testMouthClose');
    const mouthSlider = document.getElementById('mouthTestValue');
    const valueDisplay = document.getElementById('mouthValueDisplay');
    
    if (testOpenBtn) {
        testOpenBtn.addEventListener('click', () => {
            console.log('Testing mouth open');
            setMouthOpenness(1.0);
        });
    }
    
    if (testCloseBtn) {
        testCloseBtn.addEventListener('click', () => {
            console.log('Testing mouth close');
            setMouthOpenness(0.0);
        });
    }
    
    if (mouthSlider) {
        mouthSlider.addEventListener('input', () => {
            const value = parseFloat(mouthSlider.value);
            if (valueDisplay) {
                valueDisplay.textContent = value.toFixed(1);
            }
            setMouthOpenness(value);
        });
    }
}

// Function to set mouth openness directly
function setMouthOpenness(value) {
    if (!window.currentModel) {
        console.warn('No model loaded for mouth test');
        return;
    }
    
    // Ensure value is a number
    value = parseFloat(value);
    if (isNaN(value)) {
        console.error('Invalid mouth value:', value);
        return;
    }
    
    // Use our LipSync module
    if (window.LipSync) {
        window.LipSync.setMouthOpenness(window.currentModel, value);
    } else {
        console.warn('LipSync module not loaded');
    }
}

// Call this in your initialization code
document.addEventListener('DOMContentLoaded', () => {
    // Existing initialization code...
    
    // Setup mouth test controls
    setupMouthTest();
});

/**
 * Debug function to test mouth movement
 * This can be called from the console to manually test mouth movement
 */
function debugMouth(value) {
    if (!window.currentModel) {
        console.warn('No model loaded for mouth test');
        return;
    }
    
    console.log(`Testing mouth with value: ${value}`);
    
    // Ensure value is a number
    value = parseFloat(value);
    if (isNaN(value)) {
        console.error('Invalid mouth value:', value);
        return;
    }
    
    // Use our LipSync module
    if (window.LipSync) {
        // Try the normal method first
        const result = window.LipSync.setMouthOpenness(window.currentModel, value);
        console.log(`Regular setMouthOpenness result: ${result}`);
        
        // If that fails, try the force method
        if (!result) {
            console.log('Trying forceMouthPosition as fallback');
            window.LipSync.forceMouthPosition(window.currentModel, value);
        }
    } else {
        console.warn('LipSync module not loaded');
    }
}

// Add this to the window object so it can be called from the console
window.debugMouth = debugMouth; 