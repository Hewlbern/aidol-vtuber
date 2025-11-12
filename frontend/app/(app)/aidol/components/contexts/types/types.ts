import type { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

/**
 * Interface for mouse movement tracking
 */
export interface MouseMoveRef {
  last: number;
  target: { x: number; y: number };
  current: { x: number; y: number };
  enabled: boolean;
  smoothness: number;
  sensitivity: number;
}

/**
 * Interface for Live2D model parameters
 */
export interface Live2DParameter {
  id: string;
  value: number;
}

/**
 * Interface for Live2D model expressions
 */
export interface Live2DExpression {
  name: string;
  parameters: Live2DParameter[];
}

/**
 * Interface for model-specific configuration
 */
export interface ModelConfig {
  version: 'v2' | 'v3';
  expressions?: Live2DExpression[];
  parameters: {
    mouthOpen?: string;
    mouthForm?: string;
    eyeLOpen?: string;
    eyeROpen?: string;
    angleX?: string;
    angleY?: string;
    angleZ?: string;
    browLForm?: string;
    browRForm?: string;
    cheek?: string;
    eyeBallX?: string;
    eyeBallY?: string;
    bodyAngleX?: string;
    bodyAngleY?: string;
    bodyAngleZ?: string;
  };
}

/**
 * Default configurations for different models
 */
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  shizuku: {
    version: 'v2',
    parameters: {
      mouthOpen: 'PARAM_MOUTH_OPEN_Y',
      mouthForm: 'PARAM_MOUTH_FORM'
    }
  },
  vanilla: {
    version: 'v3',
    parameters: {
      eyeLOpen: 'ParamEyeLOpen',
      eyeROpen: 'ParamEyeROpen',
      mouthOpen: 'ParamMouthOpenY',
      mouthForm: 'ParamMouthForm'
    }
  },
  woodDog: {
    version: 'v3',
    parameters: {
      eyeLOpen: 'ParamEyeLOpen',
      eyeROpen: 'ParamEyeROpen',
      mouthOpen: 'ParamMouthOpenY',
      mouthForm: 'ParamMouthForm',
      angleX: 'ParamAngleX',
      angleY: 'ParamAngleY',
      angleZ: 'ParamAngleZ',
      eyeBallX: 'ParamEyeBallX',
      eyeBallY: 'ParamEyeBallY',
      cheek: 'ParamBlushOn'
    }
  },
  Wintherscris1: {
    version: 'v3',
    parameters: {
      eyeLOpen: 'ParamEyeLOpen',
      eyeROpen: 'ParamEyeROpen',
      mouthOpen: 'ParamMouthOpenY',
      mouthForm: 'ParamMouthForm',
      angleX: 'ParamAngleX',
      angleY: 'ParamAngleY',
      angleZ: 'ParamAngleZ',
      eyeBallX: 'ParamEyeBallX',
      eyeBallY: 'ParamEyeBallY'
    }
  },
  wintherscris: {
    version: 'v3',
    parameters: {
      eyeLOpen: 'ParamEyeLOpen',
      eyeROpen: 'ParamEyeROpen',
      mouthOpen: 'ParamMouthOpenY',
      mouthForm: 'ParamMouthForm',
      angleX: 'ParamAngleX',
      angleY: 'ParamAngleY',
      angleZ: 'ParamAngleZ',
      eyeBallX: 'ParamEyeBallX',
      eyeBallY: 'ParamEyeBallY'
    }
  }
};

/**
 * Parameters for updating model transform
 */
export interface ModelUpdateParams {
  scale: number;
  position: { x: number; y: number };
  width: number;
  height: number;
}

/**
 * Parameters for model expressions
 */
export interface ModelExpressionParams {
  expressionId: number;
  duration?: number;
}

/**
 * Props for the Live2D Model component
 */
export interface Live2DModelProps {
  modelPath: string;
  width: number;
  height: number;
  scale?: number;
  position?: { x: number; y: number };
  isPointerInteractive?: boolean;
  isScrollToResizeEnabled?: boolean;
  onExpression?: (expressionId: number, duration?: number) => void;
  currentVolume?: number;
  currentAudio?: {
    data: ArrayBuffer | string;
    format?: string;
    timestamp?: number;
    duration?: number;
    volumes?: number[];
    slice_length?: number;
    display_text?: { text: string; name?: string; avatar?: string };
    actions?: {
      expressions?: number[];
    };
  };
  onAudioComplete?: () => void;
}

/**
 * Type for the Live2D model
 */
export type Live2DModelType = Live2DModel; 