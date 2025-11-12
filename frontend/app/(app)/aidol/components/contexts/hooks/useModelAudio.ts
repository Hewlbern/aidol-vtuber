import { useEffect } from 'react';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import { MODEL_CONFIGS } from '../types/types';
import { CharacterHandler } from '../character/CharacterController';

interface UseModelAudioProps {
  modelRef: Live2DModel | null;
  characterHandler: CharacterHandler | null;
  currentAudio: {
    data?: ArrayBuffer | string;
    actions?: {
      expressions?: string[];
    };
    duration?: number;
  } | null;
  contextVolume: number;
  currentModelPath: string;
  onAudioComplete?: () => void;
  onExpression?: (expressionId: string, duration: number) => void;
}

export function useModelAudio({
  modelRef,
  characterHandler,
  currentAudio,
  contextVolume,
  currentModelPath,
  onAudioComplete,
  onExpression
}: UseModelAudioProps) {
  // Handle audio volume and expression updates
  useEffect(() => {
    if (!modelRef || !characterHandler) {
      return;
    }

    // Handle volume updates with audio data if available
    if (typeof contextVolume === 'number') {
      const audioData = currentAudio?.data;
      const modelName = currentModelPath.split('/').pop()?.split('.')[0] || '';
      const modelConfig = MODEL_CONFIGS[modelName] || MODEL_CONFIGS.vanilla;
      
      // Make sure model config is up to date
      characterHandler.setModelConfig(modelConfig);
      
      // Pass the audio data directly to lipSync
      if (audioData instanceof ArrayBuffer) {
        characterHandler.handleLipSync(
          modelRef,
          contextVolume
        );
      } else if (typeof audioData === 'string') {
        characterHandler.handleLipSync(
          modelRef,
          contextVolume
        );
      }
    }

    // Handle expression updates from audio actions
    if (currentAudio?.actions?.expressions?.length) {
      const expressionId = currentAudio.actions.expressions[0];
      
      if (onExpression) {
        onExpression(expressionId, currentAudio.duration || 3000);
      }

      if (onAudioComplete) {
        onAudioComplete();
      }
    }

    // Cleanup function to stop speaking when component unmounts or audio changes
    return () => {
      if (modelRef) {
        modelRef.stopSpeaking();
        characterHandler.cleanup();
      }
    };
  }, [contextVolume, currentAudio, currentModelPath, modelRef, characterHandler, onExpression, onAudioComplete]);
} 