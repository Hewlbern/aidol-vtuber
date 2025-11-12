import { ModelPosition, WebSocketMessage } from '../types/VTuberTypes';

export interface ModelHandlers {
  handleBackgroundChange: (backgroundUrl: string) => void;
  handleScaleChange: (scale: number) => void;
  handlePositionChange: (x: number, y: number) => void;
  handleSubtitleToggle: (show: boolean) => void;
  handlePointerInteractiveToggle: (enabled: boolean) => void;
  handleScrollToResizeToggle: (enabled: boolean) => void;
  handleBackgroundLoad: () => void;
  handleBackgroundError: () => void;
  handleCharacterChange: (characterId: string, modelPath: string) => void;
}

export const createModelHandlers = (
  setBackgroundPath: (path: string) => void,
  setModelScale: (scale: number) => void,
  setModelPosition: (position: ModelPosition) => void,
  setShowSubtitles: (show: boolean) => void,
  setIsPointerInteractive: (enabled: boolean) => void,
  setIsScrollToResizeEnabled: (enabled: boolean) => void,
  setIsBackgroundLoaded: (loaded: boolean) => void,
  setBackgroundError: (error: string | null) => void,
  setModelPath: (path: string) => void,
  isConnected: boolean,
  sendMessage: (message: WebSocketMessage) => void,
  backgroundPath: string
): ModelHandlers => {

  const handleCharacterChange = (characterId: string, modelPath: string) => {
    if (!modelPath || modelPath.trim() === '') {
      console.warn('Invalid model path provided, using fallback');
      const fallbackUrl = '/model/vanilla/vanilla.model3.json';
      setModelPath(fallbackUrl);
      return;
    }
    
    // Update model path
    setModelPath(modelPath);
    
    // Reset model scale and position
    setModelScale(0.8);
    setModelPosition({ x: 0.5, y: 0.5 });
    
    // Send WebSocket message if connected
    if (isConnected) {
      sendMessage({
        type: 'switch-config',
        config_id: characterId
      } as WebSocketMessage);
    }
  };

  return {
    handleBackgroundChange: (backgroundUrl: string) => {
      setBackgroundPath(backgroundUrl);
    },

    handleScaleChange: (scale: number) => {
      const safeScale = Math.max(0.1, Math.min(scale, 2.0));
      setModelScale(safeScale);
    },

    handlePositionChange: (x: number, y: number) => {
      const safeX = Math.max(0, Math.min(x, 1));
      const safeY = Math.max(0, Math.min(y, 1));
      setModelPosition({ x: safeX, y: safeY });
    },

    handleSubtitleToggle: (show: boolean) => {
      setShowSubtitles(show);
    },

    handlePointerInteractiveToggle: (enabled: boolean) => {
      setIsPointerInteractive(enabled);
      if (enabled) {
        setIsScrollToResizeEnabled(false);
      }
    },

    handleScrollToResizeToggle: (enabled: boolean) => {
      setIsScrollToResizeEnabled(enabled);
    },

    handleBackgroundLoad: () => {
      setIsBackgroundLoaded(true);
      setBackgroundError(null);
    },

    handleBackgroundError: () => {
      console.error(`Failed to load background image: ${backgroundPath}`);
      setBackgroundError(`Failed to load: ${backgroundPath}`);
      setIsBackgroundLoaded(false);
    },

    handleCharacterChange,
  };
}; 