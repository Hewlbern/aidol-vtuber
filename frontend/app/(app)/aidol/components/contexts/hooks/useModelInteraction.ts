/**
 * Model Interaction Hook
 * 
 * This hook manages model interactions such as mouse tracking,
 * pointer interactivity, and scroll-to-resize functionality.
 */

import { useCallback, useEffect, useRef } from 'react';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import * as PIXI from 'pixi.js';
import { ModelPosition } from '../types/VTuberTypes';
import { CharacterHandler } from '../character/CharacterController';
import { ScaleState, PositionState } from '../types/modelReducers';

interface UseModelInteractionProps {
  modelRef: Live2DModel | null;
  appRef: PIXI.Application | null;
  containerRef: React.RefObject<HTMLDivElement>;
  isPointerInteractive: boolean;
  isScrollToResizeEnabled: boolean;
  characterHandler: CharacterHandler | null;
  scaleState: ScaleState;
  positionState: PositionState;
  onScaleChange: (scale: number) => void;
  onPositionChange: (position: ModelPosition) => void;
  modelConfig?: {
    expressions?: Array<{ id: string; name: string }>;
    parameters?: Record<string, string>;
    version?: 'v2' | 'v3';
  };
}

/**
 * Hook for managing model interactions
 * 
 * @param props - Props for the hook
 * @returns Object containing methods for handling model interactions
 */
export function useModelInteraction({
  modelRef,
  appRef,
  containerRef,
  isPointerInteractive,
  isScrollToResizeEnabled,
  characterHandler,
  scaleState,
  positionState,
  onScaleChange,
  onPositionChange
}: UseModelInteractionProps) {
  // Refs for mouse tracking
  const mouseMoveRef = useRef({
    last: Date.now(),
    target: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    enabled: isPointerInteractive,
    smoothness: 3.5,
    sensitivity: 0.75
  });

  // Handle mouse tracking
  useEffect(() => {
    if (!modelRef || !appRef || !containerRef.current || !characterHandler) return;
console.log(   positionState) 
console.log(onPositionChange)
    const container = containerRef.current;
    const stage = appRef.stage as PIXI.Container;

    // Set up mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseMoveRef.current.enabled) return;

      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      mouseMoveRef.current.target = { x, y };
    };

    // Set up animation loop
    let animationFrameId: number;
    const animate = () => {
      if (modelRef && appRef && characterHandler) {
        // Update current position with smooth interpolation
        const { target, current, smoothness } = mouseMoveRef.current;
        const dx = target.x - current.x;
        const dy = target.y - current.y;
        
        mouseMoveRef.current.current = {
          x: current.x + dx / smoothness,
          y: current.y + dy / smoothness
        };

        // Animate model based on mouse position
        characterHandler.animateModel(
          modelRef,
          1/60,
          0 // Volume is handled elsewhere
        );
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    // Add event listeners
    container.addEventListener('mousemove', handleMouseMove);
    animationFrameId = requestAnimationFrame(animate);

    // Set up stage interactivity
    stage.interactive = isPointerInteractive;
    stage.cursor = isPointerInteractive ? 'pointer' : 'default';

    if (modelRef) {
      modelRef.interactive = isPointerInteractive;
    }

    // Cleanup
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [modelRef, appRef, containerRef, isPointerInteractive, characterHandler]);

  // Handle scroll-to-resize
  useEffect(() => {
    if (!isScrollToResizeEnabled || !containerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Calculate new scale based on wheel delta
      const scaleDelta = -e.deltaY * 0.001; // Adjust sensitivity as needed
      const newScale = Math.max(0.1, Math.min(2.0, scaleState.currentScale + scaleDelta));
      
      // Only update if scale actually changed
      if (newScale !== scaleState.currentScale) {
        onScaleChange(newScale);
      }
    };

    // Add event listener to the container
    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isScrollToResizeEnabled, scaleState.currentScale, onScaleChange]);

  // Toggle pointer interactivity
  const togglePointerInteractive = useCallback((enabled: boolean) => {
    mouseMoveRef.current.enabled = enabled;
    
    if (appRef) {
      const stage = appRef.stage as PIXI.Container;
      stage.interactive = enabled;
      stage.cursor = enabled ? 'pointer' : 'default';
      
      if (modelRef) {
        modelRef.interactive = enabled;
      }
    }
  }, [appRef, modelRef]);

  // Toggle scroll-to-resize
  const toggleScrollToResize = useCallback(() => {
    // This is handled by the effect above
  }, []);

  return {
    mouseMoveRef,
    togglePointerInteractive,
    toggleScrollToResize
  };
} 