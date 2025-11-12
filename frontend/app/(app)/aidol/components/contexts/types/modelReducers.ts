/**
 * Model state reducers and actions
 * 
 * This file contains the reducers and action types for managing model state
 * including scale, position, and motion.
 */

// Scale state type
export interface ScaleState {
  currentScale: number;
  isScaling: boolean;
}

// Position state type
export interface PositionState {
  x: number;
  y: number;
}

// Scale action types
export type ScaleAction = 
  | { type: 'SET_SCALE'; payload: number }
  | { type: 'START_SCALING' }
  | { type: 'END_SCALING' };

// Position action types
export type PositionAction = 
  | { type: 'SET_POSITION'; payload: PositionState }
  | { type: 'SET_X'; payload: number }
  | { type: 'SET_Y'; payload: number };

// Scale reducer
export const scaleReducer = (state: ScaleState, action: ScaleAction): ScaleState => {
  switch (action.type) {
    case 'SET_SCALE':
      return { ...state, currentScale: action.payload };
    case 'START_SCALING':
      return { ...state, isScaling: true };
    case 'END_SCALING':
      return { ...state, isScaling: false };
    default:
      return state;
  }
};

// Position reducer
export const positionReducer = (state: PositionState, action: PositionAction): PositionState => {
  switch (action.type) {
    case 'SET_POSITION':
      return { ...state, ...action.payload };
    case 'SET_X':
      return { ...state, x: action.payload };
    case 'SET_Y':
      return { ...state, y: action.payload };
    default:
      return state;
  }
};

// Motion state type
export interface MotionState {
  expressionId: number;
  motionGroup: string;
  motionIndex: number;
  isPlaying: boolean;
}

// Motion action types
export type MotionAction = 
  | { type: 'SET_EXPRESSION'; payload: number }
  | { type: 'SET_MOTION_GROUP'; payload: string }
  | { type: 'SET_MOTION_INDEX'; payload: number }
  | { type: 'SET_IS_PLAYING'; payload: boolean };

// Motion reducer
export const motionReducer = (state: MotionState, action: MotionAction): MotionState => {
  switch (action.type) {
    case 'SET_EXPRESSION':
      return { ...state, expressionId: action.payload };
    case 'SET_MOTION_GROUP':
      return { ...state, motionGroup: action.payload };
    case 'SET_MOTION_INDEX':
      return { ...state, motionIndex: action.payload };
    case 'SET_IS_PLAYING':
      return { ...state, isPlaying: action.payload };
    default:
      return state;
  }
};

// Action creators for scale
export const setScale = (scale: number): ScaleAction => ({ type: 'SET_SCALE', payload: scale });
export const startScaling = (): ScaleAction => ({ type: 'START_SCALING' });
export const endScaling = (): ScaleAction => ({ type: 'END_SCALING' });

// Action creators for position
export const setPosition = (position: PositionState): PositionAction => ({ type: 'SET_POSITION', payload: position });
export const setX = (x: number): PositionAction => ({ type: 'SET_X', payload: x });
export const setY = (y: number): PositionAction => ({ type: 'SET_Y', payload: y });

// Action creators for motion
export const setExpression = (expressionId: number): MotionAction => ({ type: 'SET_EXPRESSION', payload: expressionId });
export const setMotionGroup = (motionGroup: string): MotionAction => ({ type: 'SET_MOTION_GROUP', payload: motionGroup });
export const setMotionIndex = (motionIndex: number): MotionAction => ({ type: 'SET_MOTION_INDEX', payload: motionIndex });
export const setIsPlaying = (isPlaying: boolean): MotionAction => ({ type: 'SET_IS_PLAYING', payload: isPlaying }); 