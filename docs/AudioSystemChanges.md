# Audio System Changes

## What Changed

We've made significant changes to the audio system to fix the timing and initialization issues:

1. **Moved AudioContext Initialization**: The AudioContext is now initialized at the top level (VTuberUI component) and passed down to all components that need it.

2. **Robust Audio Handling**: We've added queue systems and fallback mechanisms to ensure audio data is never lost, even if it arrives before the model is ready.

3. **Consolidated Audio Processing**: All audio handling is now centralized in CharacterHandler, removing the duplicate functionality in AudioManager and AudioStateManager.

4. **Improved Error Handling**: We've added comprehensive error handling throughout the audio system.

## How Audio Flows Now

1. Audio data arrives via WebSocket events in VTuberUI
2. VTuberUI checks if CharacterHandler is ready
   - If ready: Passes audio to CharacterHandler
   - If not ready: Queues audio for later processing
3. CharacterHandler processes audio:
   - If model is available: Processes audio immediately
   - If model is not available: Queues audio until model is loaded
4. When model becomes available, queued audio is processed

## Using the Audio System

To work with the audio system, follow these guidelines:

### 1. Sending Audio to the System

```typescript
// In a component with access to ModelContext
const { handleAudioUpdate, characterHandler, isAudioReady } = useModel();

// To send audio data:
if (characterHandler && isAudioReady) {
  await handleAudioUpdate({
    data: audioBuffer, // ArrayBuffer or base64 string
    format: 'mp3',     // Audio format
    volumes: [0.5, 0.6, 0.7], // Volume data for lip sync
    slice_length: 20,  // Duration of each volume slice in ms
    actions: {
      expressions: [1] // Expression indices to apply
    }
  });
}
```

### 2. Processing Audio Events

```typescript
// Setup an event listener for audio
useEffect(() => {
  const audioHandler = (e: CustomEvent<AudioData>) => {
    // Handle audio event here
    // Call handleAudioUpdate and handle promise rejection
    handleAudioUpdate(e.detail).catch(error => {
      console.error('Error handling audio:', error);
    });
  };
  
  window.addEventListener('audio', audioHandler as EventListener);
  
  return () => {
    window.removeEventListener('audio', audioHandler as EventListener);
  };
}, [handleAudioUpdate]);
```

### 3. Working with the Live2D Model and Audio

The Live2D model is now directly controlled by CharacterHandler:

```typescript
// In Live2DModel component (useCore.tsx)
useEffect(() => {
  if (modelRef.current && characterHandler) {
    // Set the model in CharacterHandler for lip sync
    characterHandler.setModel(modelRef.current as unknown as Live2DModel);
    
    // Set up animation
    characterHandler.setupAnimation(modelRef.current as unknown as Live2DModel);
  }
}, [modelRef.current, characterHandler]);
```

## Troubleshooting

If you encounter audio issues:

1. **"Model not available"**: The audio was received before the model loaded. This is normal and the audio will be processed once the model is ready.

2. **"AudioContext not initialized"**: Make sure VTuberUI is properly initializing the AudioContext and passing it down.

3. **No audio playback**: Check browser permissions. The system tries to get microphone permissions early which also enables audio playback.

4. **Audio queue not processing**: Ensure that the model is being properly set in CharacterHandler after it loads.

## Future Improvements

For future development:

1. Complete removal of AudioManager and AudioStateManager
2. Direct initialization of CharacterHandler in VTuberUI 
3. More robust volume level analysis for better lip sync
4. Better integration with expression changes and motion
5. Progressive loading of audio data for large files 