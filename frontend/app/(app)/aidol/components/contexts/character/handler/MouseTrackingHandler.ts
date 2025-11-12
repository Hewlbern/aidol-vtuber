import { RefObject } from 'react';
import type { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

/**
 * Interface for mouse movement tracking state
 */
interface MouseMoveState {
  last: number;
  target: { x: number; y: number };
  current: { x: number; y: number };
  enabled: boolean;
  smoothness: number;
  sensitivity: number;
}

/**
 * MouseTrackingHandler class responsible for managing mouse tracking and model focus
 * Implements the Single Responsibility Principle by handling only mouse-related functionality
 */
export class MouseTrackingHandler {
  private model: Live2DModel | null = null;
  private state: MouseMoveState = {
    last: 0,
    target: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    enabled: true,
    smoothness: 3.5,
    sensitivity: 0.75
  };
  private isActive: boolean = true;

  /**
   * Sets the Live2D model for mouse tracking
   * @param model - The Live2D model to control
   */
  setModel(model: Live2DModel | null): void {
    this.model = model;
    console.log('[MouseTrackingHandler] Model set:', model ? 'available' : 'null');
  }

  /**
   * Sets up mouse tracking for the model
   * @param containerRef - Reference to the container element
   * @param isEnabled - Whether mouse tracking is enabled
   * @returns A cleanup function to remove event listeners
   */
  setupTracking(
    containerRef: RefObject<HTMLDivElement>,
    isEnabled: boolean = true
  ): () => void {
    this.state.enabled = isEnabled;
    this.isActive = true;

    const handleMouseMove = (event: MouseEvent) => {
      if (!this.isActive || !this.state.enabled || !containerRef.current) return;

      try {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect) {
          const { clientX, clientY } = event;
          const normalizedX = ((clientX - rect.left) / rect.width - 0.5) * 2;
          const normalizedY = -((clientY - rect.top) / rect.height - 0.5) * 2;

          this.state.target = {
            x: normalizedX * this.state.sensitivity,
            y: normalizedY * this.state.sensitivity,
          };
          this.state.last = Date.now();
        }
      } catch (error) {
        console.warn('[MouseTrackingHandler] Error in mouse tracking:', error);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      this.isActive = false;
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }

  /**
   * Updates the model's focus based on mouse position
   * @param deltaTime - Time since last update
   */
  updateFocus(deltaTime: number): void {
    if (!this.model || !this.state.enabled) return;

    try {
      const now = Date.now();
      const RECENTER_DELAY = 5000;
      const SMOOTHNESS = this.state.smoothness;

      // Handle mouse movement
      if (!this.state.enabled) {
        const smoothFactor = Math.exp(-SMOOTHNESS * deltaTime);
        this.state.current.x *= smoothFactor;
        this.state.current.y *= smoothFactor;
      } else {
        const timeSinceLastMove = now - this.state.last;
        const shouldRecenter = timeSinceLastMove > RECENTER_DELAY;

        if (shouldRecenter) {
          const recenterFactor = Math.min((timeSinceLastMove - RECENTER_DELAY) / 3000, 1);
          const easeFactor = Math.sin(Math.PI * recenterFactor / 2);

          const smoothFactor = Math.exp(-SMOOTHNESS * deltaTime * easeFactor);
          this.state.current.x *= smoothFactor;
          this.state.current.y *= smoothFactor;
        } else {
          const smoothFactor = Math.exp(-SMOOTHNESS * deltaTime);
          this.state.current.x += (this.state.target.x - this.state.current.x) * (1 - smoothFactor);
          this.state.current.y += (this.state.target.y - this.state.current.y) * (1 - smoothFactor);
        }
      }

      // Apply focus to model
      const internalModel = this.model.internalModel;
      if (internalModel?.focusController) {
        const jitterAmount = 0.005;
        const jitterX = (Math.random() - 0.5) * jitterAmount;
        const jitterY = (Math.random() - 0.5) * jitterAmount;

        internalModel.focusController.focus(
          this.state.current.x + jitterX,
          this.state.current.y + jitterY
        );
      }
    } catch (error) {
      console.warn('[MouseTrackingHandler] Error updating focus:', error);
    }
  }

  /**
   * Updates the enabled state of mouse tracking
   * @param isEnabled - Whether mouse tracking is enabled
   */
  setEnabled(isEnabled: boolean): void {
    this.state.enabled = isEnabled;
    if (!isEnabled) {
      this.state.target = { x: 0, y: 0 };
    }
    console.log('[MouseTrackingHandler] Mouse tracking enabled:', isEnabled);
  }

  /**
   * Updates the smoothness of mouse tracking
   * @param smoothness - The new smoothness value
   */
  setSmoothness(smoothness: number): void {
    this.state.smoothness = smoothness;
    console.log('[MouseTrackingHandler] Smoothness updated:', smoothness);
  }

  /**
   * Updates the sensitivity of mouse tracking
   * @param sensitivity - The new sensitivity value
   */
  setSensitivity(sensitivity: number): void {
    this.state.sensitivity = sensitivity;
    console.log('[MouseTrackingHandler] Sensitivity updated:', sensitivity);
  }

  /**
   * Gets the current mouse tracking state
   * @returns The current mouse tracking state
   */
  getState(): MouseMoveState {
    return { ...this.state };
  }
} 