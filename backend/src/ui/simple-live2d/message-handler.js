/**
 * Message Handler for Open LLM VTuber
 * Handles sending and receiving text and audio messages
 */

// State variables
let isProcessingMessage = false;
// Rename to avoid conflict with websocket-handler.js
let pendingMessages = [];
let lastAudioTimestamp = 0;
const AUDIO_DEBOUNCE_TIME = 100; // ms
let processedMessageIds = new Set(); // Track processed message IDs to prevent duplicates

// Audio queue system
let audioQueue = [];
let isPlayingAudio = false;

/**
 * Add audio to the queue and start playing if not already playing
 * @param {Object} audioData - The audio data to play
 */
function queueAudio(audioData) {
    // Add to queue
    audioQueue.push(audioData);
    console.log(`Added audio to queue. Queue length: ${audioQueue.length}`);
    
    // Start playing if not already playing
    if (!isPlayingAudio) {
        playNextAudio();
    }
}

/**
 * Play the next audio in the queue
 */
function playNextAudio() {
    if (audioQueue.length === 0) {
        isPlayingAudio = false;
        console.log('Audio queue empty');
        return;
    }
    
    isPlayingAudio = true;
    const audioData = audioQueue.shift();
    console.log(`Playing next audio from queue. Remaining: ${audioQueue.length}`);
    
    // Create audio element
    let audio = null;
    let lipSyncInterval = null;
    let volumeIndex = 0;
    let lastUpdateTime = 0;
    
    if (audioData.audioData) {
        // Audio blob
        const blob = new Blob([audioData.audioData], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        audio = new Audio(url);
        
        // Set up lip sync if we have volume data
        if (audioData.volumes && audioData.volumes.length > 0) {
            console.log(`Volume data available: ${audioData.volumes.length} samples`);
            
            const volumes = audioData.volumes;
            const sliceLength = audioData.slice_length || 20; // ms per volume slice
            
            // Function to update mouth based on current audio position
            const updateMouthWithVolume = () => {
                if (!audio.paused) {
                    const currentTime = audio.currentTime * 1000; // Convert to ms
                    
                    // Only update if enough time has passed
                    if (currentTime - lastUpdateTime >= sliceLength) {
                        lastUpdateTime = currentTime;
                        
                        // Calculate the current volume index based on time
                        volumeIndex = Math.floor(currentTime / sliceLength);
                        
                        if (volumeIndex < volumes.length) {
                            const volume = volumes[volumeIndex];
                            
                            // Log periodically to avoid console spam
                            if (volumeIndex % 5 === 0) {
                                console.log(`Lip sync: time=${Math.floor(currentTime)}ms, index=${volumeIndex}, volume=${volume.toFixed(2)}`);
                            }
                            
                            // Update mouth if LipSync module is available
                            if (window.LipSync && window.currentModel) {
                                window.LipSync.updateMouthWithAudio(window.currentModel, volume);
                            }
                        }
                    }
                }
            };
            
            // Set up audio event handlers
            audio.onplay = () => {
                console.log('Audio playback started, initializing lip sync');
                
                // Initialize lip sync
                if (window.LipSync && window.currentModel) {
                    window.LipSync.initLipSync(window.currentModel);
                }
                
                // Reset tracking variables
                volumeIndex = 0;
                lastUpdateTime = 0;
                
                // Start interval for lip sync updates
                lipSyncInterval = setInterval(updateMouthWithVolume, 10); // Update every 10ms for smooth animation
            };
            
            // Reset mouth when audio ends
            audio.onended = () => {
                console.log('Audio playback ended, resetting mouth');
                
                // Clear the update interval
                if (lipSyncInterval) {
                    clearInterval(lipSyncInterval);
                    lipSyncInterval = null;
                }
                
                // Reset mouth to closed position
                if (window.currentModel && window.LipSync) {
                    window.LipSync.resetMouth(window.currentModel);
                }
                
                // Continue with next audio after a short delay
                setTimeout(playNextAudio, 50);
            };
        } else {
            console.log('No volume data available for lip sync');
            
            // Set up normal audio ended handler without lip sync
            audio.onended = () => {
                console.log('Audio playback completed');
                setTimeout(playNextAudio, 50);
            };
        }
    } else if (audioData.audioPath) {
        // Audio path
        audio = new Audio(audioData.audioPath);
        
        // Set up normal audio ended handler
        audio.onended = () => {
            console.log('Audio playback completed');
            setTimeout(playNextAudio, 50);
        };
    } else {
        // No audio, just text
        if (audioData.display_text && audioData.display_text.text) {
            updateChatDisplay(audioData.display_text.text, 'ai');
        }
        // Move to next audio
        playNextAudio();
        return;
    }
    
    // Set volume and rate from UI controls if available
    const volumeControl = document.getElementById('voiceVolume');
    const rateControl = document.getElementById('speakingRate');
    
    if (volumeControl) {
        audio.volume = parseFloat(volumeControl.value);
    }
    
    if (rateControl) {
        audio.playbackRate = parseFloat(rateControl.value);
    }
    
    // Update display text if available
    if (audioData.display_text && audioData.display_text.text) {
        updateChatDisplay(audioData.display_text.text, 'ai');
    }
    
    // Handle errors
    audio.onerror = (error) => {
        console.error('Error playing audio:', error);
        // Move to next audio even if there's an error
        playNextAudio();
    };
    
    // Start playback
    console.log('Audio playback started');
    audio.play().catch(error => {
        console.error('Error starting audio playback:', error);
        playNextAudio();
    });
}

/**
 * Send a text message to the server
 * @param {string} text - The text message to send
 * @param {Array} attachments - Optional attachments
 * @param {boolean} isMuted - Whether the microphone is muted
 * @param {boolean} isHandRaised - Whether the hand is raised
 */
function sendTextMessage(text, attachments = [], isMuted = false, isHandRaised = false) {
    console.log('Sending text message:', text);
    
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
    if (window.WebSocketHandler && typeof window.WebSocketHandler.send === 'function') {
        window.WebSocketHandler.send({
            type: 'text-input',
            text: text,
            attachments: attachments,
            isMuted: isMuted,
            isHandRaised: isHandRaised
        });
    } else {
        console.error('WebSocketHandler not available or send method not found');
    }
}

/**
 * Handle an incoming audio message
 * @param {Object} data - The audio message data
 */
function handleAudioMessage(data) {
    // Skip messages with no audio or display text
    if (!data.audio && (!data.display_text || !data.display_text.text)) {
        console.log('Skipping empty audio message');
        return;
    }
    
    // Generate a more reliable message ID based on content and timestamp
    const messageId = data.timestamp ? 
        `${data.timestamp}-${data.display_text ? data.display_text.text : ''}` : 
        (data.audio ? data.audio.substring(0, 20) : (data.display_text ? data.display_text.text : ''));
    
    console.log('Audio message ID:', messageId);
    console.log('Already processed IDs:', Array.from(processedMessageIds).slice(-5));
    
    // Skip if we've already processed this message
    if (processedMessageIds.has(messageId)) {
        console.log('Skipping duplicate audio message:', messageId);
        return;
    }
    
    console.log('New audio message, adding to processed IDs');
    
    // Add to processed messages
    if (messageId) {
        processedMessageIds.add(messageId);
        console.log('Processed IDs count:', processedMessageIds.size);
        
        // Keep the set from growing too large
        if (processedMessageIds.size > 100) {
            console.log('Trimming processed IDs set');
            // Remove oldest entries (convert to array, slice, convert back to set)
            processedMessageIds = new Set([...processedMessageIds].slice(-50));
        }
    }
    
    console.log('Queueing audio message:', {
        timestamp: data.timestamp,
        text: data.display_text ? data.display_text.text : 'No text',
        audioLength: data.audio ? data.audio.length : 0,
        volumeDataLength: data.volumes ? data.volumes.length : 0
    });
    
    // Add to audio queue instead of playing immediately
    queueAudio(data);
}

/**
 * Handle an incoming text message
 * @param {Object} data - The text message data
 */
function handleTextMessage(data) {
    // Generate a message ID based on content to detect duplicates
    const messageId = data.text || '';
    
    // Skip if we've already processed this message
    if (processedMessageIds.has(messageId)) {
        console.log('Skipping duplicate text message');
        return;
    }
    
    // Add to processed messages
    if (messageId) {
        processedMessageIds.add(messageId);
    }
    
    console.log('Handling text message:', data);
    
    if (data.text) {
        updateChatDisplay(data.text, 'ai');
    }
}

/**
 * Handle backend synthesis complete message
 */
function handleSynthComplete(data) {
    console.log('Synthesis complete received:', data);
    
    // Clear the processed message IDs for audio messages
    console.log('Before clearing, processed IDs count:', processedMessageIds.size);
    
    // This helps ensure we don't accidentally filter out new audio with similar content
    const newProcessedIds = new Set();
    processedMessageIds.forEach(id => {
        // Keep non-audio message IDs
        if (!id.includes('audio-') && !id.includes('base64')) {
            newProcessedIds.add(id);
        }
    });
    processedMessageIds = newProcessedIds;
    
    console.log('After clearing audio IDs, count:', processedMessageIds.size);
    
    // Reset the audio timestamp to allow immediate playback of new audio
    lastAudioTimestamp = 0;
    console.log('Reset audio timestamp to allow immediate playback');
}

/**
 * Update the chat display with a new message
 * @param {string} text - The message text
 * @param {string} role - The role of the sender ('user' or 'ai')
 */
function updateChatDisplay(text, role) {
    const chatDisplay = document.getElementById('chatDisplay');
    if (!chatDisplay) return;
    
    // Check if the last message is from the same role and not complete
    const lastMessage = chatDisplay.lastElementChild;
    if (lastMessage && lastMessage.className === `${role}-message` && role === 'ai' && lastMessage.dataset.complete === 'false') {
        // Update the existing message
        lastMessage.textContent = text;
        
        // Mark as complete if this is a final message
        if (text !== 'Thinking...') {
            lastMessage.dataset.complete = 'true';
        }
    } else {
        // Create a new message element
        const messageElement = document.createElement('div');
        messageElement.className = `${role}-message`;
        messageElement.textContent = text;
        
        // Mark as incomplete if this is a partial message
        if (role === 'ai' && text === 'Thinking...') {
            messageElement.dataset.complete = 'false';
        } else {
            messageElement.dataset.complete = 'true';
        }
        
        chatDisplay.appendChild(messageElement);
    }
    
    // Scroll to the bottom
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// Export public API
window.MessageHandler = {
    sendTextMessage,
    handleAudioMessage,
    handleTextMessage,
    handleSynthComplete,
    clearAudioQueue: () => {
        audioQueue = [];
        isPlayingAudio = false;
        console.log('Audio queue cleared');
    }
}; 