/**
 * Model Hooks Collection Module
 * 
 * This module provides a collection of React hooks for managing different aspects
 * of Live2D model interactions. Each hook is designed to handle a specific aspect
 * of model manipulation and state management.
 * 
 * Key Features:
 * - Model scaling and positioning
 * - Expression and motion management
 * - Audio playback and lip-sync
 * - Character state management
 * 
 * @module useModelHooks
 */

import { useCallback } from 'react';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import { CharacterHandler } from '../character/CharacterController';
import { AudioData } from '../types/VTuberTypes';
import { ModelPosition } from '../types/VTuberTypes';
import { 
  setScale, 
  setPosition, 
  setExpression, 
  setMotionGroup, 
  setMotionIndex, 
  setIsPlaying 
} from '../types/modelReducers';

/**
 * Hook for managing model scale transformations
 * 
 * This hook provides functionality to update and control the scale of the Live2D model.
 * It maintains scale state through a reducer and updates the model's visual representation.
 * 
 * @param {CharacterHandler | null} characterHandler - The character handler instance
 * @param {React.Dispatch<ReturnType<typeof setScale>>} scaleDispatch - Reducer dispatch function
 * @returns {Object} Object containing scale management functions
 * @property {Function} handleScaleChange - Function to update the model's scale
 */
export function useModelScale(
  characterHandler: CharacterHandler | null,
  scaleDispatch: React.Dispatch<ReturnType<typeof setScale>>
) {
  const handleScaleChange = useCallback((scale: number) => {
    scaleDispatch(setScale(scale));
    
    if (characterHandler) {
      characterHandler.updateModelScale(scale);
    }
  }, [characterHandler, scaleDispatch]);

  return { handleScaleChange };
}

/**
 * Hook for managing model position in the viewport
 * 
 * This hook provides functionality to update and control the position of the Live2D model
 * within its container. It maintains position state through a reducer.
 * 
 * @param {CharacterHandler | null} characterHandler - The character handler instance
 * @param {React.Dispatch<ReturnType<typeof setPosition>>} positionDispatch - Reducer dispatch function
 * @returns {Object} Object containing position management functions
 * @property {Function} handlePositionChange - Function to update the model's position
 */
export function useModelPosition(
  characterHandler: CharacterHandler | null,
  positionDispatch: React.Dispatch<ReturnType<typeof setPosition>>
) {
  const handlePositionChange = useCallback((position: ModelPosition) => {
    positionDispatch(setPosition(position));
  }, [positionDispatch]);

  return { handlePositionChange };
}

/**
 * Hook for managing model expressions and motion sequences
 * 
 * This hook provides comprehensive functionality for controlling model expressions
 * and motion sequences. It handles:
 * - Expression changes and transitions
 * - Motion group selection
 * - Motion index updates
 * - Motion playback control
 * 
 * @param {CharacterHandler | null} characterHandler - The character handler instance
 * @param {React.Dispatch} motionDispatch - Reducer dispatch function for motion actions
 * @param {Live2DModel | null} modelRef - Reference to the Live2D model
 * @returns {Object} Object containing expression and motion management functions
 * @property {Function} handleExpressionChange - Function to update model expressions
 * @property {Function} handleMotionGroupChange - Function to change motion groups
 * @property {Function} handleMotionIndexChange - Function to update motion indices
 * @property {Function} handlePlayMotion - Function to play selected motion
 * @property {Function} handleModelExpression - Function to apply expressions with duration
 */
export function useModelExpressions(
  characterHandler: CharacterHandler | null,
  motionDispatch: React.Dispatch<ReturnType<typeof setExpression> | ReturnType<typeof setMotionGroup> | ReturnType<typeof setMotionIndex> | ReturnType<typeof setIsPlaying>>,
  modelRef: Live2DModel | null
) {
  const handleExpressionChange = useCallback((expressionId: number) => {
    motionDispatch(setExpression(expressionId));
  }, [motionDispatch]);

  const handleMotionGroupChange = useCallback((motionGroup: string) => {
    motionDispatch(setMotionGroup(motionGroup));
  }, [motionDispatch]);

  const handleMotionIndexChange = useCallback((motionIndex: number) => {
    motionDispatch(setMotionIndex(motionIndex));
  }, [motionDispatch]);

  const handlePlayMotion = useCallback(() => {
    if (characterHandler && modelRef) {
      motionDispatch(setIsPlaying(true));
      
      modelRef.internalModel?.motionManager?.startMotion(
        'idle', // Default motion group
        0, // Default motion index
        3 // Priority
      );
      motionDispatch(setIsPlaying(false));
    }
  }, [characterHandler, modelRef, motionDispatch]);

  const handleModelExpression = useCallback((params: { expressionId: number; duration: number }) => {
    if (characterHandler && modelRef) {
      const { expressionId, duration } = params;
      
      modelRef.expression(expressionId);
      if (duration) {
        setTimeout(() => {
          modelRef.expression(0);
        }, duration);
      }
    }
  }, [characterHandler, modelRef]);

  return {
    handleExpressionChange,
    handleMotionGroupChange,
    handleMotionIndexChange,
    handlePlayMotion,
    handleModelExpression
  };
}

/**
 * Hook for managing audio playback and lip-sync functionality
 * 
 * This hook provides comprehensive audio management capabilities for the Live2D model:
 * - Audio data updates and playback
 * - Microphone input handling
 * - Lip-sync animation control
 * - Audio resource cleanup
 * 
 * @param {CharacterHandler | null} characterHandler - The character handler instance
 * @returns {Object} Object containing audio management functions
 * @property {Function} handleAudioUpdate - Function to update audio data and trigger playback
 * @property {Function} handleMicrophoneToggle - Function to toggle microphone input
 * @property {Function} cleanupAudio - Function to clean up audio resources
 * @property {Function} handleLipSync - Function to control lip-sync animation based on audio volume
 */
export function useModelAudio(characterHandler: CharacterHandler | null) {
  const handleAudioUpdate = useCallback(async (audioData: AudioData) => {
    if (characterHandler) {
      await characterHandler.handleAudioUpdate(audioData);
    }
  }, [characterHandler]);

  const handleMicrophoneToggle = useCallback(async () => {
    if (characterHandler) {
      await characterHandler.requestAudioPermissions();
    }
  }, [characterHandler]);

  const cleanupAudio = useCallback(() => {
    if (characterHandler) {
      characterHandler.cleanup();
    }
  }, [characterHandler]);

  const handleLipSync = useCallback(async (model: Live2DModel, volume: number) => {
    if (characterHandler) {
      await characterHandler.handleLipSync(model, volume);
    }
  }, [characterHandler]);

  return {
    handleAudioUpdate,
    handleMicrophoneToggle,
    cleanupAudio,
    handleLipSync
  };
} 