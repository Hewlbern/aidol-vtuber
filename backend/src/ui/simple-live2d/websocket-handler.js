/**
 * WebSocket Handler for Open LLM VTuber
 * Handles communication with the backend WebSocket server
 */

// WebSocket connection and state
let socket = null;
let clientUid = null;
let isConnected = false;
let reconnectAttempts = 0;
let reconnectInterval = null;
let messageQueue = [];
let currentHistoryUid = null;
let isProcessingAudio = false;
let audioChunks = [];
let isRecording = false;
let mediaRecorder = null;
let audioContext = null;
let audioProcessor = null;
let currentGroupMembers = [];
let isOwner = false;
let customWsUrl = null;
let defaultWsUrl = null;

// Event callbacks
const eventCallbacks = {
    onConnect: [],
    onDisconnect: [],
    onMessage: [],
    onHistoryList: [],
    onHistoryData: [],
    onConfigList: [],
    onBackgroundList: [],
    onModelInfo: [],
    onGroupUpdate: [],
    onAudioData: [],
    onTextResponse: [],
    onError: [],
    onSynthComplete: []
};

// Initialize WebSocket connection
function initWebSocket() {
    console.log('Initializing WebSocket connection...');
    console.log('Existing socket state:', socket ? socket.readyState : 'none');
    
    // Close existing socket if it exists
    if (socket) {
        console.log('Closing existing WebSocket connection');
        socket.close();
    }
    
    // Generate a unique client ID if not already set
    if (!clientUid) {
        clientUid = 'client_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Update client ID display
    const clientIdElement = document.getElementById('clientId');
    if (clientIdElement) {
        clientIdElement.textContent = clientUid;
    }
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Use custom URL if set, otherwise use default
    if (!defaultWsUrl) {
        defaultWsUrl = `${protocol}//${window.location.host}/client-ws`;
    }
    
    const wsUrl = customWsUrl || defaultWsUrl;
    
    // Update URL input field
    const wsUrlInput = document.getElementById('wsUrl');
    if (wsUrlInput && !wsUrlInput.value) {
        wsUrlInput.value = wsUrl;
    }
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    socket = new WebSocket(wsUrl);
    
    // Set up event handlers
    socket.onopen = handleSocketOpen;
    socket.onmessage = handleSocketMessage;
    socket.onclose = handleSocketClose;
    socket.onerror = handleSocketError;
    
    // Update status display
    updateWsStatus('connecting');
    
    // Initialize audio context for processing
    if (!audioContext) {
        try {
            // Create audio context with proper options
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext({
                sampleRate: 16000,
                latencyHint: 'interactive'
            });
            
            // Request microphone permission early
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        console.log('Microphone permission granted');
                        // Don't keep the stream, just ensure permission is granted
                        stream.getTracks().forEach(track => track.stop());
                    })
                    .catch(err => {
                        console.error('Error accessing microphone:', err);
                    });
            }
        } catch (e) {
            console.error('Failed to create AudioContext:', e);
        }
    }
}

// Handle WebSocket open event
function handleSocketOpen() {
    console.log('WebSocket connection established with URL:', socket.url);
    console.log('WebSocket readyState:', socket.readyState);
    isConnected = true;
    reconnectAttempts = 0;
    
    // Update status display
    updateWsStatus('connected');
    
    // Display the connected port
    const portMatch = socket.url.match(/:(\d+)/);
    const port = portMatch ? portMatch[1] : 'unknown';
    const portDisplay = document.getElementById('connectionPort');
    if (portDisplay) {
        portDisplay.textContent = `Port: ${port}`;
    }
    
    // Clear any reconnect interval
    if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
    }
    
    // Process any queued messages
    while (messageQueue.length > 0) {
        const message = messageQueue.shift();
        send(message);
    }
    
    // Trigger connect callbacks
    triggerEvent('onConnect');
    
    // Request initial data
    fetchConfigs();
    fetchBackgrounds();
    fetchHistoryList();
}

// Handle WebSocket message event
function handleSocketMessage(event) {
    try {
        const data = JSON.parse(event.data);
        
        // Add timestamp if not present to help with deduplication
        if (!data.timestamp) {
            data.timestamp = Date.now();
        }
        
        console.log('Received WebSocket message:', {
            type: data.type,
            timestamp: data.timestamp,
            dataSize: event.data.length,
            hasAudio: data.audio ? 'yes' : 'no',
            displayText: data.display_text ? data.display_text.text : 'none'
        });
        
        // Route message to appropriate handler
        switch (data.type) {
            case 'audio':
                console.log('Processing audio message with timestamp:', data.timestamp);
                // Only use MessageHandler if available, otherwise fallback
                if (window.MessageHandler && typeof window.MessageHandler.handleAudioMessage === 'function') {
                    console.log('Delegating audio message to MessageHandler');
                    window.MessageHandler.handleAudioMessage(data);
                } else {
                    console.log('Using fallback audio handler');
                    handleAudioDataMessage(data);
                }
                // Don't trigger event or call other handlers - we're handling it directly
                break;
                
            case 'full-text':
                if (window.MessageHandler && typeof window.MessageHandler.handleTextMessage === 'function') {
                    window.MessageHandler.handleTextMessage(data);
                } else {
                    handleFullTextMessage(data);
                }
                // Don't trigger event - we're handling it directly
                break;
                
            case 'backend-synth-complete':
                if (window.MessageHandler && typeof window.MessageHandler.handleSynthComplete === 'function') {
                    window.MessageHandler.handleSynthComplete(data);
                } else {
                    console.log('Synthesis complete:', data);
                }
                triggerEvent('onSynthComplete', data);
                break;
                
            // For other message types, continue using the event system
            case 'set-model-and-conf':
                handleModelInfoMessage(data);
                triggerEvent('onModelInfo', data);
                break;
                
            case 'history-list':
                handleHistoryListMessage(data);
                triggerEvent('onHistoryList', data.histories);
                break;
                
            case 'history-data':
                handleHistoryDataMessage(data);
                triggerEvent('onHistoryData', data);
                break;
                
            case 'config-files':
                handleConfigFilesMessage(data);
                triggerEvent('onConfigList', data.configs);
                break;
                
            case 'background-files':
                handleBackgroundFilesMessage(data);
                triggerEvent('onBackgroundList', data.files);
                break;
                
            case 'group-update':
                handleGroupUpdateMessage(data);
                triggerEvent('onGroupUpdate', data);
                break;
                
            case 'control':
                handleControlMessage(data);
                break;
                
            case 'error':
                handleErrorMessage(data);
                triggerEvent('onError', data);
                break;
                
            default:
                console.log('Unhandled message type:', data.type);
                break;
        }
    } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
    }
}

// Handle WebSocket close event
function handleSocketClose(event) {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    isConnected = false;
    
    // Update status display
    updateWsStatus('disconnected');
    
    // Attempt to reconnect with fallback ports
    if (reconnectAttempts < 10) {
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
        console.log(`Attempting to reconnect in ${delay}ms...`);
        
        reconnectInterval = setTimeout(() => {
            reconnectAttempts++;
            
            // Try different ports in sequence
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const hostname = window.location.hostname;
            
            // Try different ports in sequence
            const ports = [8000, 8080, 3000, 5000, 12393];
            const portToTry = ports[reconnectAttempts % ports.length];
            
            // Use the correct endpoint: /client-ws
            const wsUrl = `${protocol}//${hostname}:${portToTry}/client-ws`;
            console.log(`Trying alternative port: ${wsUrl}`);
            
            socket = new WebSocket(wsUrl);
            socket.onopen = handleSocketOpen;
            socket.onmessage = handleSocketMessage;
            socket.onclose = handleSocketClose;
            socket.onerror = handleSocketError;
            return;
        }, delay);
    } else {
        console.error('Failed to reconnect after multiple attempts');
        triggerEvent('onError', { 
            message: 'Failed to connect to server after multiple attempts. Please check if the server is running.'
        });
    }
    
    // Trigger disconnect callbacks
    triggerEvent('onDisconnect', event);
}

// Handle WebSocket error event
function handleSocketError(error) {
    console.error('WebSocket error:', error);
    
    // Update status display
    updateWsStatus('error');
    
    triggerEvent('onError', { message: 'WebSocket connection error', error });
}

// Send a message through the WebSocket
function send(message) {
    if (!isConnected) {
        console.log('WebSocket not connected, queueing message for later:', message.type);
        messageQueue.push(message);
        return;
    }
    
    try {
        const messageStr = JSON.stringify(message);
        socket.send(messageStr);
        console.log('Sent message:', message.type);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Message handlers
function handleFullTextMessage(data) {
    console.log('Full text message:', data.text);
    triggerEvent('onTextResponse', { text: data.text, isPartial: false });
}

function handleModelInfoMessage(data) {
    console.log('Model info received:', data);
    clientUid = data.client_uid;
    triggerEvent('onModelInfo', data);
}

function handleHistoryListMessage(data) {
    console.log('History list received:', data.histories);
    triggerEvent('onHistoryList', data.histories);
}

function handleHistoryDataMessage(data) {
    console.log('History data received:', data.messages);
    triggerEvent('onHistoryData', data.messages);
}

function handleNewHistoryMessage(data) {
    console.log('New history created:', data.history_uid);
    currentHistoryUid = data.history_uid;
    // Fetch history list to update UI
    fetchHistoryList();
}

function handleHistoryDeletedMessage(data) {
    console.log('History deleted:', data.history_uid);
    if (data.success) {
        // Fetch history list to update UI
        fetchHistoryList();
    }
}

function handleConfigFilesMessage(data) {
    console.log('Config files received:', data.configs);
    triggerEvent('onConfigList', data.configs);
}

function handleBackgroundFilesMessage(data) {
    console.log('Background files received:', data.files);
    triggerEvent('onBackgroundList', data.files);
}

function handleGroupUpdateMessage(data) {
    console.log('Group update received:', data);
    currentGroupMembers = data.members || [];
    isOwner = data.is_owner || false;
    triggerEvent('onGroupUpdate', data);
}

function handleControlMessage(data) {
    console.log('Control message received:', data);
    
    if (data.text === 'start-mic') {
        startMicrophone();
    } else if (data.text === 'stop-mic') {
        stopMicrophone();
    } else if (data.text === 'interrupt') {
        sendInterruptSignal();
    } else if (data.text === 'mic-audio-end') {
        stopMicrophone();
        sendAudioEnd();
    }
}

function handleAudioDataMessage(data) {
    // Skip messages with no audio or display text
    if (!data.audio && (!data.display_text || !data.display_text.text)) {
        console.log('Skipping empty audio message');
        return;
    }
    
    // Generate a message ID based on content and timestamp to detect duplicates
    const messageId = data.timestamp ? 
        `${data.timestamp}-${data.display_text ? data.display_text.text : ''}` : 
        (data.audio ? data.audio.substring(0, 20) : (data.display_text ? data.display_text.text : ''));
    
    // Use a simple static Set for deduplication if MessageHandler is not available
    if (!window._processedAudioIds) {
        window._processedAudioIds = new Set();
    }
    
    // Skip if we've already processed this message
    if (messageId && window._processedAudioIds.has(messageId)) {
        console.log('Skipping duplicate audio message');
        return;
    }
    
    // Add to processed messages
    if (messageId) {
        window._processedAudioIds.add(messageId);
        
        // Keep the set from growing too large
        if (window._processedAudioIds.size > 100) {
            // Remove oldest entries (convert to array, slice, convert back to set)
            window._processedAudioIds = new Set([...window._processedAudioIds].slice(-50));
        }
    }
    
    // Implement a simple debounce
    const now = Date.now();
    if (!window._lastAudioTimestamp) {
        window._lastAudioTimestamp = 0;
    }
    
    if (now - window._lastAudioTimestamp < 100) { // 100ms debounce
        console.log('Skipping audio message due to recent processing');
        return;
    }
    
    window._lastAudioTimestamp = now;
    
    console.log('Received audio data message:', data.display_text ? data.display_text.text : 'No text');
    
    // Check if we have direct audio data (base64 encoded)
    if (data.audio) {
        try {
            // Create audio element from base64 data
            const audioData = `data:audio/wav;base64,${data.audio}`;
            const audio = new Audio(audioData);
            
            // Set volume and rate from UI controls if available
            const volumeControl = document.getElementById('voiceVolume');
            const rateControl = document.getElementById('speakingRate');
            
            if (volumeControl) {
                audio.volume = parseFloat(volumeControl.value);
            }
            
            if (rateControl) {
                audio.playbackRate = parseFloat(rateControl.value);
            }
            
            // Play audio
            audio.play().catch(error => {
                console.error('Error playing audio:', error);
            });
            
            // Update display text if available
            if (data.display_text && data.display_text.text) {
                const chatDisplay = document.getElementById('chatDisplay');
                if (chatDisplay) {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'ai-message';
                    messageElement.textContent = data.display_text.text;
                    chatDisplay.appendChild(messageElement);
                    chatDisplay.scrollTop = chatDisplay.scrollHeight;
                }
            }
            
            console.log('Playing audio from base64 data');
            
            // Notify that audio playback has started
            console.log('Audio playback started');
        } catch (error) {
            console.error('Error creating audio from base64:', error);
        }
    } 
    // Check if we have an audio path instead
    else if (data.audioPath) {
        try {
            const audio = new Audio(data.audioPath);
            
            // Set volume and rate from UI controls if available
            const volumeControl = document.getElementById('voiceVolume');
            const rateControl = document.getElementById('speakingRate');
            
            if (volumeControl) {
                audio.volume = parseFloat(volumeControl.value);
            }
            
            if (rateControl) {
                audio.playbackRate = parseFloat(rateControl.value);
            }
            
            // Play audio
            audio.play().catch(error => {
                console.error('Error playing audio from path:', error);
            });
            
            console.log('Playing audio from path:', data.audioPath);
        } catch (error) {
            console.error('Error creating audio from path:', error);
        }
    } else if (data.display_text && data.display_text.text) {
        // Handle text-only messages (like expressions)
        const chatDisplay = document.getElementById('chatDisplay');
        if (chatDisplay) {
            const messageElement = document.createElement('div');
            messageElement.className = 'ai-message';
            messageElement.textContent = data.display_text.text;
            chatDisplay.appendChild(messageElement);
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
    } else {
        console.error('No audio data or path found in message:', data);
    }
    
    // Trigger event for other components
    triggerEvent('onAudioData', data);
}

function handleErrorMessage(data) {
    console.error('Error message received:', data.message);
    triggerEvent('onError', data);
}

// API functions
function fetchHistoryList() {
    send({ type: 'fetch-history-list' });
}

function fetchAndSetHistory(historyUid) {
    currentHistoryUid = historyUid;
    send({ type: 'fetch-and-set-history', history_uid: historyUid });
}

function createNewHistory() {
    send({ type: 'create-new-history' });
}

function deleteHistory(historyUid) {
    send({ type: 'delete-history', history_uid: historyUid });
}

function fetchConfigs() {
    send({ type: 'fetch-configs' });
}

function switchConfig(configFile) {
    send({ type: 'switch-config', file: configFile });
}

function fetchBackgrounds() {
    send({ type: 'fetch-backgrounds' });
}

function sendTextInput(text) {
    console.log('Sending text input:', text);
    
    // Add the message to the chat display
    const chatDisplay = document.getElementById('chatDisplay');
    if (chatDisplay) {
        const messageElement = document.createElement('div');
        messageElement.className = 'user-message';
        messageElement.textContent = text;
        chatDisplay.appendChild(messageElement);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
    
    // Send the message to the server
    send({
        type: 'text-input',
        text: text
    });
}

function sendInterruptSignal() {
    send({ type: 'interrupt-signal', text: '' });
}

function sendAudioEnd() {
    if (audioChunks.length > 0) {
        const audioData = audioChunks.flat();
        send({ 
            type: 'mic-audio-end', 
            audio: audioData 
        });
        audioChunks = [];
    } else {
        send({ type: 'mic-audio-end' });
    }
}

function sendAudioPlayStart(displayText) {
    send({ 
        type: 'audio-play-start',
        display_text: displayText
    });
}

function addClientToGroup(inviteeUid) {
    send({ 
        type: 'add-client-to-group',
        invitee_uid: inviteeUid
    });
}

function removeClientFromGroup(targetUid) {
    send({ 
        type: 'remove-client-from-group',
        target_uid: targetUid
    });
}

function requestGroupInfo() {
    send({ type: 'request-group-info' });
}

// Microphone handling
function startMicrophone() {
    if (isRecording) return;
    
    console.log('Starting microphone recording');
    
    // Check if AudioContext is suspended (browser policy) and resume it
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('AudioContext resumed successfully');
        });
    }
    
    // Request microphone access with explicit constraints
    const constraints = {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
            channelCount: 1
        }
    };
    
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            isRecording = true;
            
            // Create media recorder
            mediaRecorder = new MediaRecorder(stream);
            
            // Set up audio processing
            const source = audioContext.createMediaStreamSource(stream);
            
            // Use modern AudioWorklet if available, fallback to ScriptProcessor
            if (audioContext.audioWorklet) {
                console.log('Using AudioWorklet for processing');
                // This would require additional setup with an audio worklet processor
                // For now, we'll use the ScriptProcessor
                audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);
                source.connect(audioProcessor);
                audioProcessor.connect(audioContext.destination);
            } else {
                console.log('Using ScriptProcessor for audio (deprecated but widely supported)');
                // Note: ScriptProcessorNode is deprecated but still widely supported
                // A full implementation with AudioWorkletNode would require more complex setup
                audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);
                source.connect(audioProcessor);
                audioProcessor.connect(audioContext.destination);
            }
            
            audioProcessor.onaudioprocess = function(e) {
                if (!isRecording) return;
                
                const inputData = e.inputBuffer.getChannelData(0);
                audioChunks.push(Array.from(inputData));
                
                // Send audio data in chunks
                if (audioChunks.length >= 4) {
                    const audioData = audioChunks.flat();
                    send({ 
                        type: 'mic-audio-data', 
                        audio: audioData 
                    });
                    audioChunks = [];
                }
            };
            
            mediaRecorder.start();
            console.log('Microphone recording started successfully');
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
            // Show a user-friendly error message
            alert('Microphone access is required for voice input. Please allow microphone access and try again.');
            triggerEvent('onError', { message: 'Error accessing microphone', error });
        });
}

function stopMicrophone() {
    if (!isRecording) return;
    
    console.log('Stopping microphone recording');
    
    isRecording = false;
    
    if (mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        mediaRecorder = null;
    }
    
    if (audioProcessor) {
        audioProcessor.disconnect();
        audioProcessor = null;
    }
}

// Event registration
function on(eventName, callback) {
    if (eventCallbacks[eventName]) {
        eventCallbacks[eventName].push(callback);
    } else {
        console.warn(`Unknown event: ${eventName}`);
    }
}

function off(eventName, callback) {
    if (eventCallbacks[eventName]) {
        eventCallbacks[eventName] = eventCallbacks[eventName].filter(cb => cb !== callback);
    }
}

function triggerEvent(eventName, data) {
    if (eventCallbacks[eventName]) {
        eventCallbacks[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${eventName} callback:`, error);
            }
        });
    }
}

// Add this function to send text to the TTS endpoint
function sendTextToTts(text) {
    // Create a new WebSocket for TTS
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = customWsUrl ? new URL(customWsUrl).host : window.location.host;
    const ttsWsUrl = `${protocol}//${host}/tts-ws`;
    
    console.log(`Connecting to TTS WebSocket at ${ttsWsUrl}`);
    const ttsSocket = new WebSocket(ttsWsUrl);
    
    ttsSocket.onopen = () => {
        console.log('TTS WebSocket connection established');
        ttsSocket.send(JSON.stringify({ text: text }));
    };
    
    ttsSocket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('TTS response:', data);
            
            if (data.status === 'partial' && data.audioPath) {
                // Play the audio
                const audio = new Audio(data.audioPath);
                audio.play().catch(error => {
                    console.error('Error playing TTS audio:', error);
                });
            } else if (data.status === 'error') {
                console.error('TTS error:', data.message);
            }
        } catch (error) {
            console.error('Error parsing TTS message:', error);
        }
    };
    
    ttsSocket.onerror = (error) => {
        console.error('TTS WebSocket error:', error);
    };
    
    ttsSocket.onclose = () => {
        console.log('TTS WebSocket connection closed');
    };
}

// Export public API
window.WebSocketHandler = {
    init: initWebSocket,
    send: send,
    on: on,
    off: off,
    fetchHistoryList: fetchHistoryList,
    fetchAndSetHistory: fetchAndSetHistory,
    createNewHistory: createNewHistory,
    deleteHistory: deleteHistory,
    fetchConfigs: fetchConfigs,
    switchConfig: switchConfig,
    fetchBackgrounds: fetchBackgrounds,
    sendTextInput: sendTextInput,
    sendInterruptSignal: sendInterruptSignal,
    startMicrophone: startMicrophone,
    stopMicrophone: stopMicrophone,
    sendAudioEnd: sendAudioEnd,
    sendAudioPlayStart: sendAudioPlayStart,
    addClientToGroup: addClientToGroup,
    removeClientFromGroup: removeClientFromGroup,
    requestGroupInfo: requestGroupInfo,
    getClientUid: () => clientUid,
    isConnected: () => isConnected,
    getCurrentGroupMembers: () => currentGroupMembers,
    isGroupOwner: () => isOwner,
    sendTextToTts: sendTextToTts
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing WebSocket...');
    initWebSocket();
    
    // Set up WebSocket configuration controls
    const updateWsUrlButton = document.getElementById('updateWsUrl');
    if (updateWsUrlButton) {
        updateWsUrlButton.addEventListener('click', () => {
            const wsUrlInput = document.getElementById('wsUrl');
            if (wsUrlInput && wsUrlInput.value) {
                customWsUrl = wsUrlInput.value;
                
                // Close existing connection if any
                if (socket) {
                    socket.close();
                }
                
                // Initialize new connection
                initWebSocket();
            }
        });
    }
    
    const reconnectWsButton = document.getElementById('reconnectWs');
    if (reconnectWsButton) {
        reconnectWsButton.addEventListener('click', () => {
            // Close existing connection if any
            if (socket) {
                socket.close();
            }
            
            // Initialize new connection
            initWebSocket();
        });
    }
    
    const testWsButton = document.getElementById('testWs');
    if (testWsButton) {
        testWsButton.addEventListener('click', () => {
            if (isConnected) {
                send({ type: 'ping', timestamp: Date.now() });
                alert('Ping message sent to server');
            } else {
                alert('WebSocket is not connected. Please reconnect first.');
            }
        });
    }
    
    // Add a special handler for the localhost:12393 button
    const useLocalButton = document.createElement('button');
    useLocalButton.textContent = 'Use localhost:12393';
    useLocalButton.className = 'control-button';
    useLocalButton.addEventListener('click', () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        customWsUrl = `${protocol}//localhost:12393/client-ws`;
        
        const wsUrlInput = document.getElementById('wsUrl');
        if (wsUrlInput) {
            wsUrlInput.value = customWsUrl;
        }
        
        // Close existing connection if any
        if (socket) {
            socket.close();
        }
        
        // Initialize new connection
        initWebSocket();
    });
    
    // Add the button to the page
    const buttonGroup = document.querySelector('.button-group');
    if (buttonGroup) {
        buttonGroup.appendChild(useLocalButton);
    }
});

// Add this function to resume AudioContext after user interaction
function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('AudioContext resumed successfully');
        }).catch(err => {
            console.error('Failed to resume AudioContext:', err);
        });
    }
}

// Add event listeners to resume AudioContext on user interaction
document.addEventListener('click', resumeAudioContext);
document.addEventListener('touchstart', resumeAudioContext);
document.addEventListener('keydown', resumeAudioContext);

// Add this function to update WebSocket status display
function updateWsStatus(status) {
    const wsStatusElement = document.getElementById('wsStatus');
    if (!wsStatusElement) return;
    
    switch(status) {
        case 'connected':
            wsStatusElement.textContent = 'Connected';
            wsStatusElement.style.color = '#4CAF50';
            break;
        case 'disconnected':
            wsStatusElement.textContent = 'Disconnected';
            wsStatusElement.style.color = '#F44336';
            break;
        case 'connecting':
            wsStatusElement.textContent = 'Connecting...';
            wsStatusElement.style.color = '#FFC107';
            break;
        case 'error':
            wsStatusElement.textContent = 'Error';
            wsStatusElement.style.color = '#F44336';
            break;
    }
} 