import type { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

/**
 * Interface for model configuration
 * Defines parameters and expressions for the Live2D model
 */
export interface ModelConfig {
  expressions?: Array<{
    parameters: Array<{
      id: string;
      value: number;
    }>;
  }>;
  version?: 'v2' | 'v3';
  parameters?: {
    mouthOpen?: string;
    mouthForm?: string;
    eyeLOpen?: string;
    eyeROpen?: string;
    angleX?: string;
    angleY?: string;
    angleZ?: string;
    browLForm?: string;
    browRForm?: string;
    cheek?: string;
    eyeBallX?: string;
    eyeBallY?: string;
    bodyAngleX?: string;
    bodyAngleY?: string;
    bodyAngleZ?: string;
  };
}

/**
 * ModelConfigHandler class responsible for managing Live2D model configuration
 * Implements the Single Responsibility Principle by handling only configuration-related functionality
 */
export class ModelConfigHandler {
  private model: Live2DModel | null = null;
  private config: ModelConfig | null = null;
  private configListeners: Array<(config: ModelConfig | null) => void> = [];

  /**
   * Sets the Live2D model for configuration handling
   * @param model - The Live2D model to control
   */
  setModel(model: Live2DModel | null): void {
    this.model = model;
    console.log('[ModelConfigHandler] Model set:', model ? 'available' : 'null');
  }

  /**
   * Sets the model configuration
   * @param config - The model configuration to use
   */
  setConfig(config: ModelConfig | null): void {
    if (!config) {
      console.warn('[ModelConfigHandler] Attempted to set null config');
      return;
    }

    this.config = config;
    console.log('[ModelConfigHandler] Config updated:', {
      hasExpressions: !!config.expressions,
      expressionCount: config.expressions?.length || 0,
      hasParameters: !!config.parameters,
      version: config.version
    });

    // Notify listeners
    this.notifyConfigChange();
  }

  /**
   * Gets the current model configuration
   * @returns The current model configuration
   */
  getConfig(): ModelConfig | null {
    return this.config;
  }

  /**
   * Gets the model version
   * @returns The model version or null if not set
   */
  getVersion(): 'v2' | 'v3' | null {
    return this.config?.version || null;
  }

  /**
   * Gets the expression parameters for a specific expression ID
   * @param expressionId - The ID of the expression
   * @returns The expression parameters or null if not found
   */
  getExpressionParameters(expressionId: number): Array<{ id: string; value: number }> | null {
    return this.config?.expressions?.[expressionId]?.parameters || null;
  }

  /**
   * Gets a specific parameter ID from the configuration
   * @param parameterName - The name of the parameter
   * @returns The parameter ID or null if not found
   */
  getParameterId(parameterName: keyof ModelConfig['parameters']): string | null {
    return this.config?.parameters?.[parameterName] || null;
  }

  /**
   * Adds a listener for configuration changes
   * @param listener - The listener function to add
   * @returns A function to remove the listener
   */
  addConfigListener(listener: (config: ModelConfig | null) => void): () => void {
    this.configListeners.push(listener);
    // Call immediately with current config
    listener(this.config);
    
    return () => {
      this.configListeners = this.configListeners.filter(l => l !== listener);
    };
  }

  /**
   * Validates the model configuration
   * @returns Whether the configuration is valid
   */
  validateConfig(): boolean {
    if (!this.config) {
      console.warn('[ModelConfigHandler] No configuration to validate');
      return false;
    }

    try {
      // Validate version
      if (this.config.version && !['v2', 'v3'].includes(this.config.version)) {
        console.warn('[ModelConfigHandler] Invalid model version:', this.config.version);
        return false;
      }

      // Validate expressions
      if (this.config.expressions) {
        for (let i = 0; i < this.config.expressions.length; i++) {
          const expression = this.config.expressions[i];
          if (!expression.parameters || !Array.isArray(expression.parameters)) {
            console.warn(`[ModelConfigHandler] Invalid expression at index ${i}`);
            return false;
          }

          for (const param of expression.parameters) {
            if (!param.id || typeof param.value !== 'number') {
              console.warn(`[ModelConfigHandler] Invalid parameter in expression ${i}:`, param);
              return false;
            }
          }
        }
      }

      // Validate parameters
      if (this.config.parameters) {
        for (const [key, value] of Object.entries(this.config.parameters)) {
          if (value && typeof value !== 'string') {
            console.warn(`[ModelConfigHandler] Invalid parameter ${key}:`, value);
            return false;
          }
        }
      }

      console.log('[ModelConfigHandler] Configuration validated successfully');
      return true;
    } catch (error) {
      console.error('[ModelConfigHandler] Error validating configuration:', error);
      return false;
    }
  }

  /**
   * Notifies all listeners of configuration changes
   */
  private notifyConfigChange(): void {
    this.configListeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('[ModelConfigHandler] Error notifying listener:', error);
      }
    });
  }
} 