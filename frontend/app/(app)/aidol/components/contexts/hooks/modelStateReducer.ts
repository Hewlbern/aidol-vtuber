/**
 * Model State Reducer
 * 
 * This file contains the reducer and action types for managing the core model state,
 * including model loading, configuration, and references.
 */

import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import * as PIXI from 'pixi.js';
import { AppConfig } from '../loaders/ConfigClient';

// Model state interface
export interface ModelState {
  config: AppConfig | null;
  modelPath: string;
  characterId: string;
  backgroundPath: string;
  isModelLoading: boolean;
  modelScale: number;
  modelPosition: { x: number; y: number };
  containerDimensions: { width: number; height: number };
  showSubtitles: boolean;
  isPointerInteractive: boolean;
  isScrollToResizeEnabled: boolean;
  isBackgroundLoaded: boolean;
  backgroundError: string | null;
  shouldRender: boolean;
  error: string | null;
  modelLoaded: boolean;
  modelRef: Live2DModel | null;
  appRef: PIXI.Application | null;
}

// Model action types
export type ModelAction =
  | { type: 'SET_CONFIG'; payload: AppConfig }
  | { type: 'SET_MODEL_PATH'; payload: string }
  | { type: 'SET_CHARACTER_ID'; payload: string }
  | { type: 'SET_BACKGROUND_PATH'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MODEL_SCALE'; payload: number }
  | { type: 'SET_MODEL_POSITION'; payload: { x: number; y: number } }
  | { type: 'SET_CONTAINER_DIMENSIONS'; payload: { width: number; height: number } }
  | { type: 'SET_SHOW_SUBTITLES'; payload: boolean }
  | { type: 'SET_POINTER_INTERACTIVE'; payload: boolean }
  | { type: 'SET_SCROLL_TO_RESIZE'; payload: boolean }
  | { type: 'SET_BACKGROUND_LOADED'; payload: boolean }
  | { type: 'SET_BACKGROUND_ERROR'; payload: string | null }
  | { type: 'SET_MODEL_REF'; payload: Live2DModel | null }
  | { type: 'SET_APP_REF'; payload: PIXI.Application | null }
  | { type: 'SET_SHOULD_RENDER'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MODEL_LOADED'; payload: boolean }
  | { type: 'UPDATE_MODEL_STATE'; payload: Partial<ModelState> };

// Initial state
export const initialModelState: ModelState = {
  config: null,
  modelPath: '',
  characterId: '',
  backgroundPath: '',
  isModelLoading: false,
  modelScale: 0.8,
  modelPosition: { x: 0.5, y: 0.5 },
  containerDimensions: { width: 0, height: 0 },
  showSubtitles: true,
  isPointerInteractive: true,
  isScrollToResizeEnabled: false,
  isBackgroundLoaded: false,
  backgroundError: null,
  shouldRender: false,
  error: null,
  modelLoaded: false,
  modelRef: null,
  appRef: null
};

// Model reducer
export function modelReducer(state: ModelState, action: ModelAction): ModelState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'SET_MODEL_PATH':
      return { ...state, modelPath: action.payload };
    case 'SET_CHARACTER_ID':
      return { ...state, characterId: action.payload };
    case 'SET_BACKGROUND_PATH':
      return { ...state, backgroundPath: action.payload };
    case 'SET_LOADING':
      return { ...state, isModelLoading: action.payload };
    case 'SET_MODEL_SCALE':
      return { ...state, modelScale: action.payload };
    case 'SET_MODEL_POSITION':
      return { ...state, modelPosition: action.payload };
    case 'SET_CONTAINER_DIMENSIONS':
      return { ...state, containerDimensions: action.payload };
    case 'SET_SHOW_SUBTITLES':
      return { ...state, showSubtitles: action.payload };
    case 'SET_POINTER_INTERACTIVE':
      return { ...state, isPointerInteractive: action.payload };
    case 'SET_SCROLL_TO_RESIZE':
      return { ...state, isScrollToResizeEnabled: action.payload };
    case 'SET_BACKGROUND_LOADED':
      return { ...state, isBackgroundLoaded: action.payload };
    case 'SET_BACKGROUND_ERROR':
      return { ...state, backgroundError: action.payload };
    case 'SET_MODEL_REF':
      return { ...state, modelRef: action.payload };
    case 'SET_APP_REF':
      return { ...state, appRef: action.payload };
    case 'SET_SHOULD_RENDER':
      return { ...state, shouldRender: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_MODEL_LOADED':
      return { ...state, modelLoaded: action.payload };
    case 'UPDATE_MODEL_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// Action creators
export const setConfig = (config: AppConfig): ModelAction => ({ type: 'SET_CONFIG', payload: config });
export const setModelPath = (modelPath: string): ModelAction => ({ type: 'SET_MODEL_PATH', payload: modelPath });
export const setCharacterId = (characterId: string): ModelAction => ({ type: 'SET_CHARACTER_ID', payload: characterId });
export const setBackgroundPath = (backgroundPath: string): ModelAction => ({ type: 'SET_BACKGROUND_PATH', payload: backgroundPath });
export const setLoading = (isLoading: boolean): ModelAction => ({ type: 'SET_LOADING', payload: isLoading });
export const setModelScale = (scale: number): ModelAction => ({ type: 'SET_MODEL_SCALE', payload: scale });
export const setModelPosition = (position: { x: number; y: number }): ModelAction => ({ type: 'SET_MODEL_POSITION', payload: position });
export const setContainerDimensions = (dimensions: { width: number; height: number }): ModelAction => ({ type: 'SET_CONTAINER_DIMENSIONS', payload: dimensions });
export const setShowSubtitles = (show: boolean): ModelAction => ({ type: 'SET_SHOW_SUBTITLES', payload: show });
export const setPointerInteractive = (enabled: boolean): ModelAction => ({ type: 'SET_POINTER_INTERACTIVE', payload: enabled });
export const setScrollToResize = (enabled: boolean): ModelAction => ({ type: 'SET_SCROLL_TO_RESIZE', payload: enabled });
export const setBackgroundLoaded = (loaded: boolean): ModelAction => ({ type: 'SET_BACKGROUND_LOADED', payload: loaded });
export const setBackgroundError = (error: string | null): ModelAction => ({ type: 'SET_BACKGROUND_ERROR', payload: error });
export const setModelRef = (modelRef: Live2DModel | null): ModelAction => ({ type: 'SET_MODEL_REF', payload: modelRef });
export const setAppRef = (appRef: PIXI.Application | null): ModelAction => ({ type: 'SET_APP_REF', payload: appRef });
export const setShouldRender = (shouldRender: boolean): ModelAction => ({ type: 'SET_SHOULD_RENDER', payload: shouldRender });
export const setError = (error: string | null): ModelAction => ({ type: 'SET_ERROR', payload: error });
export const setModelLoaded = (loaded: boolean): ModelAction => ({ type: 'SET_MODEL_LOADED', payload: loaded });
export const updateModelState = (state: Partial<ModelState>): ModelAction => ({ type: 'UPDATE_MODEL_STATE', payload: state }); 