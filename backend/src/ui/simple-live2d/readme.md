```graph TD
    A[Audio Input] -->|Volume Analysis| B[Audio Volume Detection]
    B -->|RMS Value| C[LipSync.updateMouthWithAudio]
    C -->|Parameter Mapping| D[Find Mouth Parameters]
    D -->|Model Type Detection| E{Model Type?}
    E -->|Cubism 2. F[Use PARAM_MOUTH_OPEN_Y]
    E -->|Cubism 3/4| G[Use ParamMouthOpenY]
    E -->|Other| H[Try Alternative Parameters]
    F -->|Apply Value| I[setMouthOpenness]
    G -->|Apply Value| I
    H -->|Apply Value| I
    I -->|Model Update| J[Live2D Model Display]
    
    K[Model Loading] -->|Parameter Discovery| L[Cache Model Parameters]
    L --> D
    
    M[initLipSync] -->|Test Methods| N[testMouthMovement]
    N -->|Find Working Method| O[lastSuccessfulMethod]
    O --> I
    
    P[Missing: Proper Parameter Detection] -.->|Should Connect| D
    Q[Missing: Audio Volume Mapping] -.->|Should Connect| B
    R[Missing: Model-Specific Handlers] -.->|Should Connect| E```