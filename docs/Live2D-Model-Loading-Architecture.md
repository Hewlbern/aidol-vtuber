# Live2D Model Loading Architecture

This document explains how Live2D models are loaded and managed in the Vaidol application, including the complete flow from initialization to rendering.

## Overview

The Live2D model loading system is built with a modular architecture that separates concerns and provides a clean interface for model management. The system handles both Cubism 2.1 and Cubism 4.0 models, with automatic detection and appropriate library loading.

## Architecture Components

### Core Components

1. **ModelContext** - Central state management for model configuration
2. **WebSocketContext** - Handles real-time communication and audio data
3. **CharacterHandler** - Manages model interactions, audio, and animations
4. **ModelLoader** - Handles the actual loading of Live2D models
5. **useLiveModel Hook** - Provides a clean interface for components
6. **Specialized Hooks** - Handle specific aspects like audio, expressions, and interactions

## Model Loading Flow

```mermaid
graph TD
    A[Application Start] --> B[ModelContext Initialization]
    B --> C[CharacterHandler Creation]
    C --> D[useLiveModel Hook]
    D --> E[useModelLoader Hook]
    E --> F[Model Path Change Event]
    F --> G[ModelLoader.initializeModelLoading]
    G --> H[Library Detection & Loading]
    H --> I[PIXI Application Creation]
    I --> J[Live2D Model Loading]
    J --> K[Model Configuration]
    K --> L[Event Dispatch]
    L --> M[Model Ready for Interaction]
    
    style A fill:#e1f5fe
    style M fill:#c8e6c9
    style G fill:#fff3e0
    style J fill:#fce4ec
```

## Detailed Component Interactions

```mermaid
sequenceDiagram
    participant App as Application
    participant MC as ModelContext
    participant CH as CharacterHandler
    participant ML as ModelLoader
    participant PIXI as PIXI Application
    participant L2D as Live2D Model
    
    App->>MC: Initialize with config
    MC->>CH: Create CharacterHandler
    CH->>CH: Initialize handlers (Motion, Expression, etc.)
    
    App->>MC: Model path change
    MC->>MC: Dispatch model-path-change event
    MC->>ML: initializeModelLoading()
    
    ML->>ML: Detect model version (Cubism 2.1/4.0)
    ML->>ML: Load appropriate library
    ML->>PIXI: Create PIXI Application
    ML->>L2D: Load Live2D model from path
    L2D->>ML: Model loaded successfully
    ML->>MC: Dispatch model-load-complete event
    MC->>CH: Set model reference
    CH->>CH: Configure model handlers
    
    Note over App,L2D: Model is now ready for interaction
```

## State Management Architecture

```mermaid
graph LR
    subgraph "Context Layer"
        MC[ModelContext]
        WSC[WebSocketContext]
    end
    
    subgraph "Hook Layer"
        ULM[useLiveModel]
        UML[useModelLoader]
        UMA[useModelAudio]
        UME[useModelExpressions]
        UMI[useModelInteraction]
        UMT[useModelTransform]
    end
    
    subgraph "Handler Layer"
        CH[CharacterHandler]
        MH[MotionHandler]
        EH[ExpressionHandler]
        MCH[ModelConfigHandler]
        MTH[MouseTrackingHandler]
    end
    
    subgraph "Loader Layer"
        ML[ModelLoader]
        PIXI[PIXI Application]
        L2D[Live2D Model]
    end
    
    MC --> ULM
    WSC --> ULM
    ULM --> UML
    ULM --> UMA
    ULM --> UME
    ULM --> UMI
    ULM --> UMT
    
    UML --> ML
    UMA --> CH
    UME --> CH
    UMI --> CH
    
    CH --> MH
    CH --> EH
    CH --> MCH
    CH --> MTH
    
    ML --> PIXI
    ML --> L2D
    
    style MC fill:#e3f2fd
    style WSC fill:#e8f5e8
    style CH fill:#fff3e0
    style ML fill:#fce4ec
```

## Model Loading Process

### 1. Initialization Phase

```mermaid
flowchart TD
    A[Component Mount] --> B[useLiveModel Hook]
    B --> C[useReducer with modelStateReducer]
    C --> D[useModelLoader Hook]
    D --> E[Container Reference Created]
    E --> F[Model Path Change Detection]
    F --> G[Custom Event Dispatch]
    
    style A fill:#e1f5fe
    style G fill:#fff3e0
```

### 2. Library Loading Phase

```mermaid
flowchart TD
    A[Model Path Received] --> B[getModelLoader Function]
    B --> C{Model Version Detection}
    C -->|Cubism 4.0| D[Load Cubism 4.0 Library]
    C -->|Cubism 2.1| E[Load Cubism 2.1 Library]
    D --> F[Live2DModelCubism4]
    E --> G[Live2DModelCubism2]
    F --> H[Library Ready]
    G --> H
    
    style A fill:#e1f5fe
    style H fill:#c8e6c9
```

### 3. PIXI Application Setup

```mermaid
flowchart TD
    A[Library Loaded] --> B[Create PIXI Application]
    B --> C[Configure Renderer]
    C --> D[Set Background Alpha]
    D --> E[Enable Antialiasing]
    E --> F[Add to Container]
    F --> G[PIXI App Ready]
    
    style A fill:#e1f5fe
    style G fill:#c8e6c9
```

### 4. Live2D Model Loading

```mermaid
flowchart TD
    A[PIXI App Ready] --> B[Live2DModel.from Path]
    B --> C[Load Model Resources]
    C --> D[Parse Model JSON]
    D --> E[Load Textures]
    E --> F[Load Motions]
    F --> G[Load Expressions]
    G --> H[Initialize Model]
    H --> I[Add to PIXI Stage]
    I --> J[Model Ready]
    
    style A fill:#e1f5fe
    style J fill:#c8e6c9
```

## Character Handler Integration

```mermaid
graph TD
    subgraph "CharacterHandler Components"
        CH[CharacterHandler]
        MH[MotionHandler]
        EH[ExpressionHandler]
        MCH[ModelConfigHandler]
        MTH[MouseTrackingHandler]
    end
    
    subgraph "Model Integration"
        L2D[Live2D Model]
        PIXI[PIXI Application]
    end
    
    subgraph "Audio System"
        AC[AudioContext]
        AS[AudioSource]
        AQ[AudioQueue]
    end
    
    CH --> MH
    CH --> EH
    CH --> MCH
    CH --> MTH
    
    MH --> L2D
    EH --> L2D
    MCH --> L2D
    MTH --> L2D
    
    CH --> AC
    CH --> AS
    CH --> AQ
    
    style CH fill:#fff3e0
    style L2D fill:#fce4ec
    style AC fill:#e8f5e8
```

## Event Flow System

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant MC as ModelContext
    participant ML as ModelLoader
    participant CH as CharacterHandler
    participant L2D as Live2D Model
    
    UI->>MC: Character change request
    MC->>MC: Update model path
    MC->>ML: Dispatch 'model-path-change' event
    ML->>ML: Handle path change
    ML->>L2D: Load new model
    L2D->>ML: Model loaded
    ML->>MC: Dispatch 'model-load-complete' event
    MC->>CH: Set new model reference
    CH->>CH: Update all handlers
    CH->>L2D: Configure model settings
    
    Note over UI,L2D: Model is ready for interaction
```

## Audio Integration Flow

```mermaid
graph TD
    A[WebSocket Audio Data] --> B[Audio Event Dispatch]
    B --> C[CharacterHandler.handleAudioUpdate]
    C --> D[Audio Queue Processing]
    D --> E[Audio Playback]
    E --> F[Volume Analysis]
    F --> G[Lip Sync Animation]
    G --> H[Model Expression Update]
    
    style A fill:#e8f5e8
    style H fill:#fce4ec
```

## Error Handling and Fallbacks

```mermaid
flowchart TD
    A[Model Loading Attempt] --> B{Loading Success?}
    B -->|Yes| C[Model Ready]
    B -->|No| D[Error Handling]
    D --> E{Fallback Available?}
    E -->|Yes| F[Load Fallback Model]
    E -->|No| G[Display Error Message]
    F --> H[Retry with Fallback]
    H --> I{Fallback Success?}
    I -->|Yes| C
    I -->|No| G
    
    style A fill:#e1f5fe
    style C fill:#c8e6c9
    style G fill:#ffcdd2
```

## Configuration Management

```mermaid
graph LR
    subgraph "Configuration Sources"
        CFG[AppConfig]
        MC[MODEL_CONFIGS]
        CH[Character Config]
    end
    
    subgraph "Configuration Handlers"
        MCH[ModelConfigHandler]
        CH_H[CharacterHandler]
    end
    
    subgraph "Model Properties"
        SCALE[Scale Settings]
        POS[Position Settings]
        EXPR[Expression Settings]
        MOTION[Motion Settings]
    end
    
    CFG --> MCH
    MC --> MCH
    CH --> CH_H
    
    MCH --> SCALE
    MCH --> POS
    CH_H --> EXPR
    CH_H --> MOTION
    
    style CFG fill:#e3f2fd
    style MCH fill:#fff3e0
    style SCALE fill:#fce4ec
```

## Key Features

### 1. **Automatic Model Version Detection**
- Detects Cubism 2.1 vs 4.0 models automatically
- Loads appropriate library based on model format
- Handles different model file structures

### 2. **Modular Architecture**
- Separated concerns with specialized handlers
- Clean interfaces between components
- Easy to extend and maintain

### 3. **Real-time Audio Integration**
- WebSocket-based audio streaming
- Automatic lip-sync animation
- Volume-based expression changes

### 4. **Interactive Features**
- Mouse tracking for eye movement
- Touch/click interactions
- Scroll-based scaling
- Expression and motion control

### 5. **Error Handling**
- Graceful fallback mechanisms
- Comprehensive error logging
- User-friendly error messages

## Usage Example

```typescript
// Using the useLiveModel hook
const {
  shouldRender,
  isLoading,
  modelLoaded,
  containerRef,
  modelPosition,
  setModelPosition
} = useLive2DModel({
  modelPath: '/model/woodDog_vts/woodDog.model3.json',
  width: 800,
  height: 600,
  scale: 0.4,
  position: { x: 0.5, y: 0.5 },
  isPointerInteractive: true,
  isScrollToResizeEnabled: false,
  currentAudio: audioData,
  onExpression: (id, duration) => {
    console.log(`Expression ${id} for ${duration}ms`);
  }
});
```

## File Structure

```
app/(app)/aidol/components/contexts/
├── ModelContext.tsx              # Central state management
├── WebSocketContext.tsx          # WebSocket communication
├── useLiveModel.tsx              # Main hook interface
├── character/
│   ├── CharacterController.ts    # Main character handler
│   ├── ModelHandlers.ts          # Model interaction handlers
│   └── handler/                  # Specialized handlers
├── hooks/                        # Specialized hooks
├── loaders/
│   └── ModelLoader.tsx           # Model loading logic
└── types/                        # Type definitions
```

This architecture provides a robust, scalable solution for Live2D model management with clear separation of concerns and comprehensive error handling.
