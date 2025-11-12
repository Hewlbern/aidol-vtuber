import { useEffect, useRef } from 'react';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import * as PIXI from 'pixi.js';
import { ModelAction } from './modelStateReducer';
import { centerModelOnStage, Live2DDisplayObject } from '../loaders/ModelLoader';

interface UseModelTransformProps {
  modelRef: Live2DModel | null;
  appRef: PIXI.Application | null;
  scale: number;
  position: { x: number; y: number };
  width: number;
  height: number;
  isScrollToResizeEnabled: boolean;
  dispatch: React.Dispatch<ModelAction>;
}

export function useModelTransform({
  modelRef,
  appRef,
  scale,
  position,
  width,
  height,
  isScrollToResizeEnabled,
  dispatch
}: UseModelTransformProps) {
  const rafRef = useRef<number | null>(null);
  const isScalingRef = useRef<boolean>(false);
  const scaleRef = useRef(scale);
  const positionRef = useRef(position);

  // Update refs when props change
  useEffect(() => {
    scaleRef.current = scale;
    positionRef.current = position;
  }, [scale, position]);

  // Handle wheel events for scaling
  useEffect(() => {
    if (!modelRef || !appRef || !isScrollToResizeEnabled) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!modelRef || !appRef) return;

      isScalingRef.current = true;
      const delta = -Math.sign(e.deltaY) * 0.1;
      const newScale = Math.max(0.5, Math.min(2.0, scaleRef.current + delta));
      scaleRef.current = newScale;

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (modelRef && appRef) {
            const containerAspect = appRef.renderer.width / appRef.renderer.height;
            const modelAspect = modelRef.width / modelRef.height;
            
            let baseScaleFactor;
            if (containerAspect > modelAspect) {
              baseScaleFactor = appRef.renderer.height / modelRef.height;
            } else {
              baseScaleFactor = appRef.renderer.width / modelRef.width;
            }
            
            const finalScale = baseScaleFactor * newScale;
            modelRef.scale.set(finalScale);
            centerModelOnStage(modelRef as unknown as Live2DDisplayObject, appRef, positionRef.current);
            dispatch({ type: 'SET_MODEL_SCALE', payload: newScale });
          }
          rafRef.current = null;
          isScalingRef.current = false;
        });
      }
    };

    const container = (appRef.view as HTMLCanvasElement).parentElement;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }
  }, [isScrollToResizeEnabled, modelRef, appRef, dispatch]);

  // Update model transform when size changes
  useEffect(() => {
    if (!modelRef || !appRef) return;
    
    const containerAspect = appRef.renderer.width / appRef.renderer.height;
    const modelAspect = modelRef.width / modelRef.height;
    
    let baseScaleFactor;
    if (containerAspect > modelAspect) {
      baseScaleFactor = appRef.renderer.height / modelRef.height;
    } else {
      baseScaleFactor = appRef.renderer.width / modelRef.width;
    }
    
    const finalScale = baseScaleFactor * scale;
    modelRef.scale.set(finalScale);
    centerModelOnStage(modelRef as unknown as Live2DDisplayObject, appRef, position);
  }, [scale, position, width, height, modelRef, appRef]);

  return {
    scaleRef,
    positionRef
  };
} 