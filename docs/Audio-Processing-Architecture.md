# Audio Processing Architecture

## Overview

This document describes the audio processing architecture in the VTuber application, explaining how audio data flows from the WebSocket server to the Live2D model for playback and lip-sync animation.

## Why Audio is Played in the Browser

The audio is played in the browser for several important reasons:

1. **Real-time Processing**: The browser provides immediate access to audio APIs for real-time processing and playback
2. **Lip-sync Integration**: The Live2D model requires direct access to audio data for mouth movement synchronization
3. **User Experience**: Playing audio locally ensures low latency and smooth interaction
4. **Cross-platform Compatibility**: Browser audio APIs work consistently across different operating systems
5. **Security**: Audio processing happens client-side, reducing server load and potential security concerns

## Audio Flow Architecture

### High-Level Flow Diagram

```mermaid
graph TD
    A[WebSocket Server] -->|Audio Data| B[WebSocketContext]
    B -->|Custom Event| C[VTuberUI]
    C -->|Audio Processing| D[ModelContext]
    D -->|Character Handler| E[CharacterController]
    E -->|Model speak method| F[Live2D Model]
    F -->|Audio Playback| G[Browser Audio]
    F -->|Lip Sync| H[Character Animation]
    
    I[Audio Queue] -->|Fallback| C
    J[Model Load Events] -->|Trigger| C
    K[Periodic Check] -->|Backup| C
```

### Detailed Component Flow

```mermaid
sequenceDiagram
    participant WS as WebSocket Server
    participant WSC as WebSocketContext
    participant VUI as VTuberUI
    participant MC as ModelContext
    participant CH as CharacterHandler
    participant LM as Live2D Model
    participant BA as Browser Audio

    WS->>WSC: Audio data (base64/ArrayBuffer)
    WSC->>WSC: Parse and validate audio
    WSC->>VUI: Dispatch 'audio' custom event
    
    VUI->>VUI: Check conditions (model ready, audio ready)
    alt Conditions met
        VUI->>MC: handleAudioUpdate(audioData)
        MC->>CH: handleAudioUpdate(audioData)
        CH->>CH: Convert base64 to ArrayBuffer
        CH->>CH: Create Blob and ObjectURL
        CH->>LM: model.speak(audioUrl, options)
        LM->>BA: Play audio
        LM->>LM: Animate mouth (lip sync)
    else Conditions not met
        VUI->>VUI: Queue audio for later
        Note over VUI: Multiple triggers check queue:<br/>- Model load complete<br/>- Periodic check (2s)<br/>- State changes
    end
```

## Component Responsibilities

### 1. WebSocketContext
- **Purpose**: Receives audio data from the server
- **Key Functions**:
  - Parse incoming WebSocket messages
  - Validate audio data format
  - Dispatch custom events to other components
  - Maintain audio queue as backup

```mermaid
graph LR
    A[WebSocket Message] --> B[Parse JSON]
    B --> C[Validate Audio Data]
    C --> D[Dispatch 'audio' Event]
    C --> E[Add to Audio Queue]
```

### 2. VTuberUI (Centralized Audio Processing)
- **Purpose**: Central coordinator for all audio processing
- **Key Functions**:
  - Listen for audio events from WebSocketContext
  - Check if model and audio context are ready
  - Queue audio if conditions not met
  - Process queued audio when ready
  - Handle multiple fallback mechanisms

```mermaid
graph TD
    A[Audio Event Received] --> B{Model Ready?}
    B -->|Yes| C{Audio Context Ready?}
    B -->|No| D[Queue Audio]
    C -->|Yes| E[Process Immediately]
    C -->|No| D
    D --> F[Multiple Triggers Check Queue]
    F --> G[Model Load Complete]
    F --> H[Periodic Check 2s]
    F --> I[State Changes]
    G --> J[Process Queued Audio]
    H --> J
    I --> J
```

### 3. ModelContext
- **Purpose**: Provides audio processing interface to components
- **Key Functions**:
  - Maintain character handler reference
  - Provide audio update methods
  - Manage model state and readiness

### 4. CharacterHandler
- **Purpose**: Core audio processing and Live2D integration
- **Key Functions**:
  - Convert audio data formats (base64 → ArrayBuffer)
  - Create audio blobs and URLs
  - Interface with Live2D model's speak method
  - Handle lip-sync animation
  - Manage audio queue and playback state

```mermaid
graph TD
    A[Audio Data] --> B{Data Type?}
    B -->|String| C[Convert Base64 to ArrayBuffer]
    B -->|ArrayBuffer| D[Use Directly]
    C --> E[Create Blob]
    D --> E
    E --> F[Create ObjectURL]
    F --> G[Create Audio Element]
    G --> H[Call model speak method]
    H --> I[Audio Playback + Lip Sync]
```

## Audio Processing States

### State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> AudioReceived
    AudioReceived --> CheckingConditions
    CheckingConditions --> ModelNotReady: Model loading
    CheckingConditions --> AudioNotReady: Audio context not ready
    CheckingConditions --> Processing: All conditions met
    ModelNotReady --> Queued
    AudioNotReady --> Queued
    Queued --> Processing: Model ready + Periodic check
    Processing --> Playing: Audio starts
    Processing --> Error: Processing fails
    Playing --> Complete: Audio finishes
    Playing --> Error: Playback fails
    Complete --> [*]
    Error --> Queued: Retry
    Error --> [*]: Give up
```

## Fallback Mechanisms

The system includes multiple fallback mechanisms to ensure audio is processed:

### 1. Immediate Processing
- When model and audio context are ready
- Direct processing without queuing

### 2. Model Load Complete Event
- Triggers when Live2D model finishes loading
- Processes any queued audio

### 3. Periodic Check (2-second interval)
- Backup mechanism for missed events
- Ensures queued audio is eventually processed

### 4. State Change Triggers
- Monitors changes in model readiness
- Processes queue when conditions are met

## Audio Data Format

### Input Format (from WebSocket)
```typescript
interface AudioData {
  data: ArrayBuffer | string;        // Audio data (base64 string or binary)
  format?: string;                   // Audio format (mp3, wav, etc.)
  timestamp?: number;                // Timestamp of audio
  duration?: number;                 // Duration in milliseconds
  volumes?: number[];                // Volume data for lip sync
  slice_length?: number;             // Length of volume slices
  display_text?: {                   // Text to display
    text: string;
    name?: string;
    avatar?: string;
  };
  actions?: {                        // Actions to perform
    expressions?: Array<number | string>;
    [key: string]: unknown;
  };
}
```

### Processing Flow
1. **Base64 Decoding**: Convert base64 string to ArrayBuffer
2. **Blob Creation**: Create audio blob with proper MIME type
3. **URL Generation**: Generate object URL for audio element
4. **Model Integration**: Pass URL to Live2D model's speak method
5. **Playback**: Model handles audio playback and lip sync

## Error Handling

### Common Issues and Solutions

1. **Audio Not Playing**
   - **Cause**: Model not ready or audio context issues
   - **Solution**: Multiple fallback mechanisms ensure eventual processing
   - **Recent Fix**: Removed strict audio context requirement - audio now processes when model is ready

2. **Base64 Decoding Errors**
   - **Cause**: Invalid base64 data
   - **Solution**: Validation and error logging in CharacterHandler

3. **Model Speak Method Failures**
   - **Cause**: Live2D model not properly initialized
   - **Solution**: Queue audio until model is ready

4. **Audio Context Issues**
   - **Cause**: Browser audio context suspended or not ready
   - **Solution**: Automatic context creation, resumption, and fallback mechanisms
   - **Recent Fix**: Audio context is created immediately and fallback contexts are available

5. **WebGL Context Issues**
   - **Cause**: WebGL context lost or not properly initialized
   - **Solution**: Comprehensive WebGL context monitoring and error recovery
   - **Note**: This affects model rendering but not audio processing

## Performance Considerations

### Optimization Strategies

1. **Audio Queue Management**
   - Limit queue size to prevent memory issues
   - Process one audio at a time to avoid conflicts

2. **Memory Management**
   - Clean up object URLs after playback
   - Remove processed audio from queue

3. **Error Recovery**
   - Automatic retry mechanisms
   - Graceful degradation on failures

## Debugging

### Console Logs

The system provides extensive logging for debugging:

- `[WebSocket]` - WebSocket connection and message handling
- `[VTuberUI]` - Centralized audio processing decisions
- `[ModelContext]` - Model state and audio routing
- `[CharacterHandler]` - Audio processing and Live2D integration

### Key Log Messages

- `"Audio response received (CENTRALIZED AUDIO PROCESSING)"` - Audio received
- `"Queueing audio for later processing"` - Audio queued due to conditions
- `"Processing audio immediately"` - Audio processed without queuing
- `"Model ready - processing queued audio items"` - Queue processing triggered
- `"Audio playback started"` - Audio successfully started playing

## Conclusion

The audio processing architecture provides a robust, multi-layered approach to handling audio in the VTuber application. By centralizing audio processing in VTuberUI and implementing multiple fallback mechanisms, the system ensures reliable audio playback and lip-sync animation even under challenging conditions.

The browser-based approach offers the best balance of performance, compatibility, and user experience for real-time audio processing and Live2D model integration.
