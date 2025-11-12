/**
 * Model Expressions Hook Module
 * 
 * This module provides a React hook for managing Live2D model expressions and motions.
 * It handles expression changes, motion playback, and coordinates between the model
 * and the character handler.
 * 
 * Key Features:
 * - Expression management and transitions
 * - Motion group and index control
 * - Motion playback coordination
 * - State management through reducers
 * 
 * @module useModelExpressions
 */

import { useCallback } from 'react';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import { MotionState, MotionAction } from '../types/modelReducers';

/**
 * Core model interface that provides parameter manipulation capabilities
 * 
 * @interface CoreModel
 * @property {Function} setParameterValueById - Function to set parameter value by ID
 */
interface CoreModel {
  setParameterValueById: (parameterId: string, value: number) => void;
}

/**
 * Internal model structure containing the core model instance
 * 
 * @interface InternalModel
 * @property {CoreModel} coreModel - The core model instance
 */
interface InternalModel {
  coreModel: CoreModel;
}

/**
 * Extended Live2D model interface that includes additional properties and methods
 * for expression and internal model handling
 * 
 * @interface ExtendedLive2DModel
 * @property {InternalModel} [internalModel] - The internal model instance
 * @property {Function} [expression] - Function to set model expression
 */
interface ExtendedLive2DModel extends Omit<Live2DModel, 'internalModel' | 'expression'> {
  internalModel?: InternalModel;
  expression?: (id?: string | number) => Promise<boolean>;
}

/**
 * Props interface for the useModelExpressions hook
 * 
 * @interface UseModelExpressionsProps
 * @property {ExtendedLive2DModel | null} modelRef - Reference to the Live2D model
 * @property {string} modelPath - Path to the model file
 * @property {MotionState} motionState - Current state of motions and expressions
 * @property {React.Dispatch<MotionAction>} dispatch - Reducer dispatch function
 * @property {Function} [onExpressionChange] - Callback when expression changes
 * @property {Function} [onMotionGroupChange] - Callback when motion group changes
 * @property {Function} [onMotionIndexChange] - Callback when motion index changes
 * @property {Function} [onPlayMotion] - Callback when motion playback starts
 */
interface UseModelExpressionsProps {
  modelRef: ExtendedLive2DModel | null;
  modelPath: string;
  motionState: MotionState;
  dispatch: React.Dispatch<MotionAction>;
  onExpressionChange?: (expressionId: number) => void;
  onMotionGroupChange?: (motionGroup: string) => void;
  onMotionIndexChange?: (motionIndex: number) => void;
  onPlayMotion?: () => void;
}

/**
 * Hook for managing Live2D model expressions and motions
 * 
 * This hook provides a comprehensive set of methods for controlling model expressions
 * and motions, with state management through a reducer pattern. It handles:
 * - Expression changes and transitions
 * - Motion group selection
 * - Motion index updates
 * - Motion playback control
 * 
 * The hook maintains state through a reducer and provides callbacks for external
 * state synchronization.
 * 
 * @param {UseModelExpressionsProps} props - Configuration object for the hook
 * @returns {Object} Object containing expression and motion management functions
 * @property {Function} handleExpressionChange - Function to update model expressions
 * @property {Function} handleMotionGroupChange - Function to change motion groups
 * @property {Function} handleMotionIndexChange - Function to update motion indices
 * @property {Function} handlePlayMotion - Function to play selected motion
 * @property {Function} handleModelExpression - Function to apply expressions with duration
 */
export function useModelExpressions({
  modelRef,
  modelPath,
  motionState,
  dispatch,
  onExpressionChange,
  onMotionGroupChange,
  onMotionIndexChange,
  onPlayMotion
}: UseModelExpressionsProps) {
  // Handle expression change
  const handleExpressionChange = useCallback((expressionId: number) => {
    console.log('[useModelExpressions] Expression change:', expressionId);
    
    // Update motion state
    dispatch({ type: 'SET_EXPRESSION', payload: expressionId });
    console.log("dispatch motion state update")
    // Call external handler if provided
    if (onExpressionChange) {
      console.log("expression has changed")
      onExpressionChange(expressionId);
    }
    
    console.log("expressions")
  }, [dispatch, onExpressionChange]);
  
  // Handle motion group change
  const handleMotionGroupChange = useCallback((motionGroup: string) => {
    console.log('[useModelExpressions] Motion group change:', motionGroup);
    
    // Update motion state
    dispatch({ type: 'SET_MOTION_GROUP', payload: motionGroup });
    
    // Call external handler if provided
    if (onMotionGroupChange) {
      onMotionGroupChange(motionGroup);
    }
  }, [dispatch, onMotionGroupChange]);
  
  // Handle motion index change
  const handleMotionIndexChange = useCallback((motionIndex: number) => {
    console.log('[useModelExpressions] Motion index change:', motionIndex);
    
    // Update motion state
    dispatch({ type: 'SET_MOTION_INDEX', payload: motionIndex });
    
    // Call external handler if provided
    if (onMotionIndexChange) {
      onMotionIndexChange(motionIndex);
    }
  }, [dispatch, onMotionIndexChange]);
  
  // Handle play motion
  const handlePlayMotion = useCallback(() => {
    if (!modelRef) {
      console.warn('[useModelExpressions] Cannot play motion: model not available');
      return;
    }
    
    console.log('[useModelExpressions] Playing motion:', {
      motionGroup: motionState.motionGroup,
      motionIndex: motionState.motionIndex,
      expressionId: motionState.expressionId
    });
    
    // Update the motion state
    dispatch({ type: 'SET_IS_PLAYING', payload: true });
    
    // Call external handler if provided
    if (onPlayMotion) {
      onPlayMotion();
    }
  }, [modelRef, motionState, dispatch, onPlayMotion]);

  // Handle model expression
  const handleModelExpression = useCallback((params: { expressionId: number; duration: number }) => {
    if (!modelRef) {
      console.warn('[useModelExpressions] Model not available for expression');
      return;
    }

    try {
      const { expressionId, duration } = params;
      
      // Update the motion state
      dispatch({ type: 'SET_EXPRESSION', payload: expressionId });
      console.log('[useModelExpressions] Updated motion state with expression:', expressionId);
      
      // Get the model and apply the expression
      const model = modelRef as ExtendedLive2DModel;

      if (model) {
        // Try using expression method first if available
        if (model.expression) {
          console.log('[useModelExpressions] Using model.expression method');
          
          model.expression(expressionId);
        } else {
          // Fallback to motion method
          console.log('[useModelExpressions] Using model.motion method');
          model.motion('idle', 0, 3, {
            expression: expressionId,
            resetExpression: false
          });
        }

        // If duration is specified, reset expression after that time
        if (duration > 0) {
          console.log('[useModelExpressions] Setting up expression reset timer:', duration);
          setTimeout(() => {
            if (model.expression) {
              console.log('[useModelExpressions] Resetting expression using expression method');
              model.expression(0);
            } else if (model.motion) {
              console.log('[useModelExpressions] Resetting expression using motion method');
              model.motion('idle', 0, 3, {
                expression: 0,
                resetExpression: false
              });
            }
          }, duration);
        }
      }
    } catch (error) {
      console.error('[useModelExpressions] Error handling model expression:', error);
    }
  }, [modelRef, modelPath, dispatch]);

  return {
    handleExpressionChange,
    handleMotionGroupChange,
    handleMotionIndexChange,
    handlePlayMotion,
    handleModelExpression
  };
} 