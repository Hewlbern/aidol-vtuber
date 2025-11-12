/**
 * Model Loader Hook
 * 
 * This hook manages model loading and initialization,
 * including handling model path changes and loading events.
 */

import { useCallback, useEffect, useRef } from 'react';
import { MODEL_CONFIGS } from '../types/types';
import { ModelAction } from './modelStateReducer';

interface UseModelLoaderProps {
  modelPath: string;
  scale: number;
  position: { x: number; y: number };
  shouldRender: boolean;
  dispatch: React.Dispatch<ModelAction>;
}

/**
 * Hook for managing model loading and initialization
 * 
 * @param props - Props for the hook
 * @returns Object containing methods for handling model loading
 */
export function useModelLoader({
  modelPath,
  scale,
  position,
  dispatch
}: UseModelLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initAttemptedRef = useRef(false);
  const positionRef = useRef(position);
  const scaleRef = useRef(scale);

  // Update refs when props change
  useEffect(() => {
    positionRef.current = position;
    scaleRef.current = scale;
  }, [position, scale]);

  // Handle model path changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    console.log('[useModelLoader] Model path changed:', modelPath);
    
    // Dispatch custom event to trigger model loading
    const event = new CustomEvent('model-path-change', {
      detail: { modelPath }
    });
    window.dispatchEvent(event);
    
    // Update model path in state
    dispatch({ type: 'SET_MODEL_PATH', payload: modelPath });
    
    // Set loading state
    dispatch({ type: 'SET_LOADING', payload: true });
  }, [modelPath, dispatch]);

  // Initialize model loading
  useEffect(() => {
    if (!containerRef.current || initAttemptedRef.current) return;
    
    initAttemptedRef.current = true;
    
    // Set up event listeners for model loading
    const handleModelLoadStart = () => {
      console.log('[useModelLoader] Model load started');
      dispatch({ type: 'SET_LOADING', payload: true });
    };

    const handleModelLoadComplete = (event: CustomEvent) => {
      console.log('[useModelLoader] Model load completed');
      dispatch({ 
        type: 'SET_LOADING', 
        payload: false 
      });
      
      if (event.detail?.model) {
        dispatch({ 
          type: 'SET_MODEL_REF', 
          payload: event.detail.model 
        });
      }
      
      if (event.detail?.app) {
        dispatch({ 
          type: 'SET_APP_REF', 
          payload: event.detail.app 
        });
      }
    };

    const handleModelLoadError = (event: CustomEvent) => {
      console.error('[useModelLoader] Model load error:', event.detail);
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    window.addEventListener('model-load-start', handleModelLoadStart);
    window.addEventListener('model-load-complete', handleModelLoadComplete as EventListener);
    window.addEventListener('model-load-error', handleModelLoadError as EventListener);

    return () => {
      window.removeEventListener('model-load-start', handleModelLoadStart);
      window.removeEventListener('model-load-complete', handleModelLoadComplete as EventListener);
      window.removeEventListener('model-load-error', handleModelLoadError as EventListener);
    };
  }, [dispatch]);

  // Handle container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        dispatch({
          type: 'SET_CONTAINER_DIMENSIONS',
          payload: {
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight
          }
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [dispatch]);

  // Handle model path change event
  const handleModelPathChange = useCallback((newModelPath: string) => {
    // console.log('[useModelLoader] Handling model path change:', newModelPath);
    
    // Extract model name from path
    const modelName = newModelPath.split('/').pop()?.split('.')[0] || '';
    
    // Get model configuration from predefined configs
    const modelConfig = MODEL_CONFIGS[modelName] || MODEL_CONFIGS.vanilla;
    
    console.log('[useModelLoader] Using model config for:', modelName, modelConfig);
    
    // Dispatch custom event to trigger model loading
    const event = new CustomEvent('model-path-change', {
      detail: { modelPath: newModelPath }
    });
    window.dispatchEvent(event);
    
    // Update model path in state
    dispatch({ type: 'SET_MODEL_PATH', payload: newModelPath });
  }, [dispatch]);

  return {
    containerRef,
    handleModelPathChange
  };
} 