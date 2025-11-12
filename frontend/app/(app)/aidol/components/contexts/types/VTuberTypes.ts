/**
 * Shared types for VTuber application components
 */

// Message type for chat
export interface ChatMessage {
  text: string;
  role: 'user' | 'ai';
}

// Model position type
export interface ModelPosition {
  x: number;
  y: number;
}

// Background type
export interface Background {
  name: string;
  path: string;
}

// Connection related props
export interface ConnectionProps {
  isConnected: boolean;
  connectionError: string | null;
  clientId: string;
}

// Model related props
export interface ModelProps {
  modelPath: string;
  backgroundPath: string;
  modelScale: number;
  modelPosition: ModelPosition;
  showSubtitles: boolean;
  isPointerInteractive?: boolean;
  isScrollToResizeEnabled?: boolean;
}

// Chat related props
export interface ChatProps {
  messages: ChatMessage[];
}

// Event handler props
export interface EventHandlerProps {
  onSendMessage: (text: string) => void;
  onCharacterChange: (characterId: string, modelUrl: string) => void;
  onBackgroundChange: (backgroundUrl: string) => void;
  onScaleChange: (scale: number) => void;
  onPositionChange: (x: number, y: number) => void;
  onSubtitleToggle: (show: boolean) => void;
  onPointerInteractiveChange?: (enabled: boolean) => void;
  onScrollToResizeChange?: (enabled: boolean) => void;
}

// Background tab props
export interface BackgroundTabProps {
  onBackgroundChange: (backgroundUrl: string) => void;
}

// Audio data type
export interface AudioData {
  data: ArrayBuffer | string;
  format?: string;
  timestamp?: number;
  duration?: number;
  volumes?: number[];
  slice_length?: number;
  display_text?: { text: string; name?: string; avatar?: string };
  actions?: Record<string, unknown>;
}

// Props for components that need audio data
export interface AudioProps {
  currentAudio?: AudioData;
  onAudioComplete?: () => void;
}

// Props for VTuberApp component
export interface VTuberAppProps {
  initialModelPath?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  text?: string;
  config_id?: string;
  [key: string]: unknown;
} 