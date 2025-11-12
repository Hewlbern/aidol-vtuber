/**
 * Model context types
 * 
 * This file contains the type definitions for the model context,
 * including state interfaces and context value interfaces.
 */

import { RefObject } from 'react';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import { CharacterHandler } from '../character/CharacterController';
import { ScaleState, PositionState, MotionState } from './modelReducers';
import { AudioData, ModelPosition, WebSocketMessage } from './VTuberTypes';
import { AppConfig, Model, Character, Background } from '../loaders/ConfigClient';

/**
 * State interface for the model context
 */
export interface ModelContextState {
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
  // Audio state
  currentVolume: number;
  isPlaying: boolean;
  audioPermissionGranted: boolean;
  audioStream: MediaStream | null;
  isRecording: boolean;
  isAudioReady: boolean;
  scaleState: ScaleState;
  positionState: PositionState;
  setModelPosition: (position: { x: number; y: number }) => void;
  motionState: MotionState;
  modelRef: Live2DModel | null; // Reference to the Live2D model
}

/**
 * Context value interface that extends the state interface
 * and adds methods for manipulating the model state
 */
export interface ModelContextValue extends ModelContextState {
  containerRef: RefObject<HTMLDivElement | null>;
  modelState: ModelContextState;
  handleCharacterChange: (characterId: string, modelPath: string) => void;
  handleBackgroundChange: (backgroundPath: string) => void;
  handleConfigUpdate: (config: AppConfig) => void;
  handlePositionChange: (position: ModelPosition) => void;
  handleScaleChange: (scale: number) => void;
  handleSubtitleToggle: (show: boolean) => void;
  handlePointerInteractiveToggle: (enabled: boolean) => void;
  handleScrollToResizeToggle: (enabled: boolean) => void;
  handleBackgroundLoad: () => void;
  handleBackgroundError: (error: string | null) => void;
  findModelByName: (name: string) => Model | undefined;
  findCharacterById: (id: string) => Character | undefined;
  findBackgroundByPath: (path: string) => Background | undefined;
  getAvailableCharacters: () => Character[];
  getAvailableBackgrounds: () => Background[];
  getAvailableModels: () => Model[];
  handleAudioUpdate: (audioData: AudioData) => Promise<void>;
  handleMicrophoneToggle: () => Promise<void>;
  cleanupAudio: () => void;
  handleLipSync: (model: Live2DModel, volume: number) => Promise<void>;
  characterHandler: CharacterHandler | null;
  isAudioReady: boolean;
  motionState: MotionState;
  handleExpressionChange: (expressionId: number) => void;
  handleMotionGroupChange: (motionGroup: string) => void;
  handleMotionIndexChange: (motionIndex: number) => void;
  handlePlayMotion: () => void;
  handleModelExpression: (params: { expressionId: number; duration: number }) => void;
  setIsSpeaking: (speaking: boolean) => void;
  isSpeaking: boolean;
}

/**
 * Props interface for the ModelProvider component
 */
export interface ModelProviderProps {
  children: React.ReactNode;
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  initialConfig?: AppConfig;
  audioContext?: AudioContext | null;
} 