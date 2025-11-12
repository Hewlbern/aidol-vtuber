interface WebSocketHandler {
  on: (event: string, callback: (data: { text: string; name?: string; avatar?: string; actions?: Record<string, unknown> }) => void) => void;
  off: (event: string, callback: (data: { text: string; name?: string; avatar?: string; actions?: Record<string, unknown> }) => void) => void;
}

interface Window {
  PIXI: typeof import('pixi.js');
  Live2D: typeof import('pixi-live2d-display-lipsyncpatch');
  Live2DCubismCore: typeof import('pixi-live2d-display-lipsyncpatch/cubism4');
  LipSync?: {
    initLipSync: (model: import('pixi-live2d-display-lipsyncpatch').Live2DModel) => void;
  };
  currentModel: import('pixi-live2d-display-lipsyncpatch').Live2DModel;
  WebSocketHandler?: WebSocketHandler;
} 