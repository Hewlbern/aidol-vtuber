/**
 * Custom hook for Live2D model state management and rendering
 * 
 * This hook encapsulates all the state management and logic for the Live2D model,
 * providing a clean interface for UI components to consume. It handles:
 * - Model loading and initialization
 * - Animation and interaction (mouse tracking, expressions)
 * - Audio synchronization and lip sync
 * - Scaling and positioning
 * - Resource cleanup
 * 
 * The hook integrates with the CharacterHandler to provide a complete solution
 * for rendering and animating Live2D models in a React application.
 */

'use client';

import { useReducer, useEffect } from 'react';
import { Live2DModelProps } from './types/types';
import { useModel } from './ModelContext';
import { modelReducer, initialModelState } from './hooks/modelStateReducer';
import { useModelLoader } from './hooks/useModelLoader';
import { useModelTransform } from './hooks/useModelTransform';
import { useModelInteraction } from './hooks/useModelInteraction';
import { useModelAudio } from './hooks/useModelAudio';

export function useLive2DModel({
  modelPath,
  width,
  height,
  scale = 0.3,
  position = { x: 0.5, y: 0.5 },
  isPointerInteractive = true,
  isScrollToResizeEnabled = false,
  onExpression,
  currentAudio,
  onAudioComplete
}: Live2DModelProps) {
  const {
    characterHandler,
    currentVolume: contextVolume
  } = useModel();

  // Initialize state with reducer
  const [state, dispatch] = useReducer(modelReducer, {
    ...initialModelState,
    modelPath: modelPath,
    modelScale: scale,
    modelPosition: position
  });

  // Set client-side flag when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timeout = setTimeout(() => {
        dispatch({ type: 'SET_SHOULD_RENDER', payload: true });
      }, 0);
      
      return () => clearTimeout(timeout);
    }
  }, []);

  // Use model loader hook
  const { containerRef } = useModelLoader({
    modelPath,
    scale,
    position,
    shouldRender: state.shouldRender,
    dispatch
  });

  // Use model transform hook
  const { scaleRef, positionRef } = useModelTransform({
    modelRef: state.modelRef,
    appRef: state.appRef,
    scale,
    position,
    width,
    height,
    isScrollToResizeEnabled,
    dispatch
  });

  // Use model interaction hook
  useModelInteraction({
    modelRef: state.modelRef,
    appRef: state.appRef,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    isPointerInteractive,
    isScrollToResizeEnabled,
    characterHandler,
    scaleState: { currentScale: state.modelScale, isScaling: false },
    positionState: { x: state.modelPosition.x, y: state.modelPosition.y },
    onScaleChange: (newScale: number) => dispatch({ type: 'SET_MODEL_SCALE', payload: newScale }),
    onPositionChange: (newPosition: { x: number; y: number }) => dispatch({ type: 'SET_MODEL_POSITION', payload: newPosition })
  });

  // Convert audio data to match expected types
  const convertedAudio = currentAudio ? {
    ...currentAudio,
    actions: currentAudio.actions ? {
      ...currentAudio.actions,
      expressions: currentAudio.actions.expressions?.map(String)
    } : undefined
  } : null;

  // Use model audio hook
  useModelAudio({
    modelRef: state.modelRef,
    characterHandler,
    currentAudio: convertedAudio,
    contextVolume,
    currentModelPath: state.modelPath,
    onAudioComplete,
    onExpression: onExpression ? (id: string, duration: number) => onExpression(Number(id), duration) : undefined
  });

  // Return state and refs needed by the UI component
  return {
    // State
    shouldRender: state.shouldRender,
    isLoading: state.isModelLoading,
    error: state.error,
    modelLoaded: state.modelLoaded,
    modelPath: state.modelPath,
    
    // Refs
    containerRef,
    positionRef,
    scaleRef,
    
    // UI state properties
    isPointerInteractive,
    isScrollToResizeEnabled,
    modelPosition: state.modelPosition,
    setModelPosition: (pos: { x: number; y: number }) => 
      dispatch({ type: 'SET_MODEL_POSITION', payload: pos })
  };
}