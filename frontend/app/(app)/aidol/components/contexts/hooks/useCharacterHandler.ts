/**
 * Character Handler Hook Module
 * 
 * This module provides a React hook for managing the CharacterHandler instance,
 * which serves as the central coordination point for Live2D character interactions.
 * 
 * Key Features:
 * - Character handler lifecycle management
 * - Audio context and source management
 * - Model configuration and scaling
 * - Expression and motion coordination
 * - Audio playback and lip-sync control
 * 
 * @module useCharacterHandler
 */

import { useRef, useEffect, useCallback } from 'react';
import { CharacterHandler } from '../character/CharacterController';
import { AudioData } from '../types/VTuberTypes';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import { MODEL_CONFIGS } from '../types/types';
import { AudioState } from './audioStateReducer';

/**
 * Props interface for the useCharacterHandler hook
 * 
 * @interface UseCharacterHandlerProps
 * @property {AudioContext | null} audioContext - Web Audio API context for audio processing
 * @property {AudioState} audioState - Current state of audio playback and recording
 * @property {Live2DModel | null} modelRef - Reference to the Live2D model instance
 * @property {string} modelPath - Path to the model file
 * @property {number} scale - Current scale of the model
 */
interface UseCharacterHandlerProps {
  audioContext: AudioContext | null;
  audioState: AudioState;
  modelRef: Live2DModel | null;
  modelPath: string;
  scale: number;
}

/**
 * Hook for managing Live2D character interactions and state
 * 
 * This hook provides a comprehensive set of methods for managing character interactions,
 * including audio playback, lip-sync, expressions, and motion control. It maintains
 * internal state through refs and coordinates between the Live2D model and audio system.
 * 
 * The hook handles:
 * - Character initialization and cleanup
 * - Audio context and source management
 * - Model configuration and scaling
 * - Expression and motion playback
 * - Lip-sync animation
 * 
 * @param {UseCharacterHandlerProps} props - Configuration object for the hook
 * @returns {Object} Object containing character handler and interaction methods
 * @property {CharacterHandler | null} characterHandler - The character handler instance
 * @property {Function} handleAudioUpdate - Function to update audio data and trigger playback
 * @property {Function} handleMicrophoneToggle - Function to toggle microphone input
 * @property {Function} cleanupAudio - Function to clean up audio resources
 * @property {Function} handleLipSync - Function to control lip-sync animation
 * @property {Function} handleModelExpression - Function to apply expressions to the model
 * @property {Function} playModelMotion - Function to play model motions with expressions
 */
export function useCharacterHandler({
  audioContext,
  audioState,
  modelRef,
  modelPath,
  scale
}: UseCharacterHandlerProps) {
  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(audioContext);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioQueueRef = useRef<Array<AudioData>>([]);
  const isPlayingRef = useRef<boolean>(false);
  const audioUrlRef = useRef<string | null>(null);
  
  // Character handler ref
  const characterHandlerRef = useRef<CharacterHandler | null>(null);

  // Initialize CharacterHandler
  useEffect(() => {
    if (!characterHandlerRef.current) {
      console.log('[useCharacterHandler] Initializing CharacterHandler');
      
      // Extract model name from path
      const modelName = modelPath.split('/').pop()?.split('.')[0] || '';
      
      // Get model configuration from predefined configs
      const modelConfig = MODEL_CONFIGS[modelName] || MODEL_CONFIGS.vanilla;
      
      console.log('[useCharacterHandler] Using model config for:', modelName, modelConfig);
      
      characterHandlerRef.current = new CharacterHandler({
        audioContextRef,
        audioSourceRef,
        audioQueueRef,
        isPlayingRef,
        audioUrlRef,
        setCurrentAudio: () => {}, // These will be updated when the hook is used
        setAudioPermissionGranted: () => {},
        setAudioStream: () => {},
        setIsRecording: () => {},
        setVolume: () => {},
        modelConfig,
        isConnected: false,
        sendMessage: () => {},
        setIsSpeaking: () => {}
      });
    }

    // Cleanup function
    return () => {
      if (characterHandlerRef.current) {
        console.log('[useCharacterHandler] Cleaning up CharacterHandler');
        characterHandlerRef.current.cleanup();
      }
    };
  }, [modelPath]);

  // Update audioContextRef when audioContext prop changes
  useEffect(() => {
    if (audioContext && !audioContextRef.current) {
      console.log('[useCharacterHandler] Setting AudioContext from props');
      audioContextRef.current = audioContext;
    }
  }, [audioContext]);

  // Update model config when model path changes
  useEffect(() => {
    if (characterHandlerRef.current) {
      const modelName = modelPath.split('/').pop()?.split('.')[0] || '';
      const modelConfig = MODEL_CONFIGS[modelName] || MODEL_CONFIGS.vanilla;
      
      console.log('[useCharacterHandler] Updating model config:', {
        modelName,
        modelConfig
      });
      
      characterHandlerRef.current.setModelConfig(modelConfig);
    }
  }, [modelPath]);

  // Update model scale when scale changes
  useEffect(() => {
    if (characterHandlerRef.current) {
      console.log('[useCharacterHandler] Updating model scale:', scale);
      characterHandlerRef.current.updateModelScale(scale);
    }
  }, [scale]);

  /**
   * Handles audio data updates and triggers playback
   * @param {AudioData} audioData - The audio data to be played
   */
  const handleAudioUpdate = useCallback(async (audioData: AudioData) => {
    if (characterHandlerRef.current) {
      await characterHandlerRef.current.handleAudioUpdate(audioData);
    }
  }, []);

  /**
   * Toggles microphone input and handles permissions
   */
  const handleMicrophoneToggle = useCallback(async () => {
    if (characterHandlerRef.current) {
      await characterHandlerRef.current.handleMicrophoneToggle(
        audioState.isRecording,
        audioState.audioPermissionGranted,
        audioState.audioStream
      );
    }
  }, [audioState.isRecording, audioState.audioPermissionGranted, audioState.audioStream]);

  /**
   * Cleans up audio resources and stops playback
   */
  const cleanupAudio = useCallback(() => {
    if (characterHandlerRef.current) {
      characterHandlerRef.current.cleanup();
    }
  }, []);

  /**
   * Handles lip-sync animation based on audio volume
   * @param {Live2DModel} model - The Live2D model instance
   * @param {number} volume - The current audio volume
   */
  const handleLipSync = useCallback(async (model: Live2DModel, volume: number) => {
    if (characterHandlerRef.current) {
      try {
        await characterHandlerRef.current.handleLipSync(model, volume);
      } catch (error) {
        console.error('[useCharacterHandler] Error handling lip sync:', error);
      }
    }
  }, []);

  /**
   * Applies an expression to the model with optional duration
   * @param {Object} params - Expression parameters
   * @param {number} params.expressionId - The ID of the expression to apply
   * @param {number} params.duration - Duration of the expression in milliseconds
   */
  const handleModelExpression = useCallback((params: { expressionId: number; duration: number }) => {
    if (!characterHandlerRef.current || !modelRef) {
      console.warn('[useCharacterHandler] Character handler or model not available for expression');
      return;
    }

    try {
      const { expressionId, duration } = params;
      
      // Get the model and apply the expression
      const model = modelRef as Live2DModel;
      if (model && characterHandlerRef.current) {
        // Extract model name from path for config
        const modelName = modelPath.split('/').pop()?.split('.')[0] || '';
        const modelConfig = MODEL_CONFIGS[modelName] || MODEL_CONFIGS.vanilla;
        
        console.log('[useCharacterHandler] Applying expression to model:', {
          modelName,
          expressionId,
          duration,
          hasModelConfig: !!modelConfig
        });
        
        // Apply the expression
        characterHandlerRef.current.setModelExpression(
          expressionId,
          duration
        );
      }
    } catch (error) {
      console.error('[useCharacterHandler] Error handling model expression:', error);
    }
  }, [modelRef, modelPath]);

  /**
   * Plays a motion sequence on the model with optional expression
   * @param {string} motionGroup - The motion group to play
   * @param {number} motionIndex - The index of the motion within the group
   * @param {number} expressionId - The expression ID to apply during the motion
   * @param {Function} [onFinish] - Optional callback when motion completes
   */
  const playModelMotion = useCallback((
    motionGroup: string,
    motionIndex: number,
    expressionId: number,
    onFinish?: () => void
  ) => {
    if (characterHandlerRef.current && modelRef) {
      console.log('[useCharacterHandler] Playing motion:', {
        motionGroup,
        motionIndex,
        expressionId
      });
      
      // Use the character handler's playModelMotion method
      characterHandlerRef.current.playModelMotion(
        motionGroup,
        motionIndex,
        6,
        { 
          expression: expressionId, 
          resetExpression: true,
          onFinish
        }
      );
    } else {
      console.warn('[useCharacterHandler] Cannot play motion: character handler or model not available');
    }
  }, [modelRef]);

  return {
    characterHandler: characterHandlerRef.current,
    handleAudioUpdate,
    handleMicrophoneToggle,
    cleanupAudio,
    handleLipSync,
    handleModelExpression,
    playModelMotion
  };
} 