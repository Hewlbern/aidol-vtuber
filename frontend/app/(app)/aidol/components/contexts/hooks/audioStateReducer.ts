/**
 * Audio State Reducer
 * 
 * This file contains the reducer and action types for managing audio state,
 * including volume, recording status, and audio permissions.
 */

import { AudioData } from '../types/VTuberTypes';

// Audio state interface
export interface AudioState {
  currentAudio: AudioData | null;
  currentVolume: number;
  isPlaying: boolean;
  audioPermissionGranted: boolean;
  audioStream: MediaStream | null;
  isRecording: boolean;
  isAudioReady: boolean;
}

// Audio action types
export type AudioAction =
  | { type: 'SET_CURRENT_AUDIO'; payload: AudioData | null }
  | { type: 'SET_CURRENT_VOLUME'; payload: number }
  | { type: 'SET_IS_PLAYING'; payload: boolean }
  | { type: 'SET_AUDIO_PERMISSION'; payload: boolean }
  | { type: 'SET_AUDIO_STREAM'; payload: MediaStream | null }
  | { type: 'SET_IS_RECORDING'; payload: boolean }
  | { type: 'SET_AUDIO_READY'; payload: boolean }
  | { type: 'UPDATE_AUDIO_STATE'; payload: Partial<AudioState> };

// Initial state
export const initialAudioState: AudioState = {
  currentAudio: null,
  currentVolume: 0,
  isPlaying: false,
  audioPermissionGranted: false,
  audioStream: null,
  isRecording: false,
  isAudioReady: false
};

// Audio reducer
export function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case 'SET_CURRENT_AUDIO':
      return { ...state, currentAudio: action.payload };
    case 'SET_CURRENT_VOLUME':
      return { ...state, currentVolume: action.payload };
    case 'SET_IS_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_AUDIO_PERMISSION':
      return { ...state, audioPermissionGranted: action.payload };
    case 'SET_AUDIO_STREAM':
      return { ...state, audioStream: action.payload };
    case 'SET_IS_RECORDING':
      return { ...state, isRecording: action.payload };
    case 'SET_AUDIO_READY':
      return { ...state, isAudioReady: action.payload };
    case 'UPDATE_AUDIO_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// Action creators
export const setCurrentAudio = (audio: AudioData | null): AudioAction => ({ type: 'SET_CURRENT_AUDIO', payload: audio });
export const setCurrentVolume = (volume: number): AudioAction => ({ type: 'SET_CURRENT_VOLUME', payload: volume });
export const setIsPlaying = (isPlaying: boolean): AudioAction => ({ type: 'SET_IS_PLAYING', payload: isPlaying });
export const setAudioPermission = (granted: boolean): AudioAction => ({ type: 'SET_AUDIO_PERMISSION', payload: granted });
export const setAudioStream = (stream: MediaStream | null): AudioAction => ({ type: 'SET_AUDIO_STREAM', payload: stream });
export const setIsRecording = (isRecording: boolean): AudioAction => ({ type: 'SET_IS_RECORDING', payload: isRecording });
export const setAudioReady = (isReady: boolean): AudioAction => ({ type: 'SET_AUDIO_READY', payload: isReady });
export const updateAudioState = (state: Partial<AudioState>): AudioAction => ({ type: 'UPDATE_AUDIO_STATE', payload: state }); 