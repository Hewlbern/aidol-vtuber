import type { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

/**
 * Interface for motion options when playing a motion
 */
interface MotionOptions {
  sound?: string;
  volume?: number;
  expression?: number;
  resetExpression?: boolean;
  onFinish?: () => void;
}

/**
 * Interface for motion tracking state
 */
interface MotionState {
  isPlaying: boolean;
  currentMotion?: {
    categoryName: string;
    animationIndex: number;
  };
}

/**
 * MotionHandler class responsible for managing Live2D model motions
 * Implements the Single Responsibility Principle by handling only motion-related functionality
 */
export class MotionHandler {
  private model: Live2DModel | null = null;
  private state: MotionState = {
    isPlaying: false,
  };

  /**
   * Sets the Live2D model for motion handling
   * @param model - The Live2D model to control
   */
  setModel(model: Live2DModel | null): void {
    this.model = model;
    console.log('[MotionHandler] Model set:', model ? 'available' : 'null');
  }

  /**
   * Plays a motion on the model
   * @param categoryName - The category of the motion
   * @param animationIndex - The index of the animation within the category
   * @param priorityNumber - The priority of the animation (higher numbers override lower ones)
   * @param options - Additional options for the motion
   */
  playMotion(
    categoryName: string,
    animationIndex: number,
    priorityNumber: number = 3,
    options: MotionOptions = {}
  ): void {
    if (!this.model) {
      console.warn('[MotionHandler] Cannot play motion: model not available');
      return;
    }

    try {
      console.log('[MotionHandler] Playing motion:', {
        categoryName,
        animationIndex,
        priorityNumber,
        options,
        timestamp: new Date().toISOString()
      });

      // Wait for model to be fully initialized
      if (!this.model.internalModel) {
        console.log('[MotionHandler] Model internal model not ready, retrying in 100ms');
        setTimeout(() => {
          this.playMotion(categoryName, animationIndex, priorityNumber, options);
        }, 100);
        return;
      }

      // Check if the model has a motion method
      if (typeof this.model.motion !== 'function') {
        console.warn('[MotionHandler] Model does not have a motion method');
        return;
      }

      // Prepare motion options
      const motionOptions: Record<string, unknown> = {
        ...options,
        onFinish: () => {
          console.log('[MotionHandler] Motion finished:', {
            categoryName,
            animationIndex,
            timestamp: new Date().toISOString()
          });
          this.state.isPlaying = false;
          this.state.currentMotion = undefined;
          options.onFinish?.();
        }
      };

      // Play the motion
      this.model.motion(categoryName, animationIndex, priorityNumber, motionOptions);
      this.state.isPlaying = true;
      this.state.currentMotion = { categoryName, animationIndex };

      console.log('[MotionHandler] Motion started:', {
        categoryName,
        animationIndex,
        priorityNumber,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[MotionHandler] Error playing motion:', error);
      this.state.isPlaying = false;
      this.state.currentMotion = undefined;
    }
  }

  /**
   * Checks if a motion is currently playing
   * @returns Whether a motion is currently playing
   */
  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  /**
   * Gets the current motion being played
   * @returns The current motion or undefined if no motion is playing
   */
  getCurrentMotion(): { categoryName: string; animationIndex: number } | undefined {
    return this.state.currentMotion;
  }

  /**
   * Stops the current motion
   */
  stopMotion(): void {
    if (this.model && this.state.isPlaying) {
      // Implementation depends on the Live2D model API
      // This is a placeholder for the actual stop implementation
      console.log('[MotionHandler] Stopping current motion');
      this.state.isPlaying = false;
      this.state.currentMotion = undefined;
    }
  }
} 