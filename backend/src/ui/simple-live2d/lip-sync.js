/**
 * Live2D Lip Sync Module
 * Handles mouth movement synchronization with audio for different Live2D model types
 */

// Cache for model parameter information
let modelParametersCache = null;
let modelMethodsCache = null;
let lastSuccessfulMethod = null;
let modelStructureLogged = false;
let lastMouthValue = 0;
let debugMode = true; // Set to true to enable detailed logging

// Known mouth parameter names for different model types
const MOUTH_PARAM_NAMES = [
    'PARAM_MOUTH_OPEN_Y',
    'ParamMouthOpenY',
    'ParamMouthForm',
    'PARAM_MOUTH_FORM',
    'Mouth Open',
    'Mouth Form',
    'MouthOpenY',
    'MouthForm',
    'mouth_a',
    'mouth_open'
];

/**
 * Initialize lip sync for a model
 * @param {Object} model - The Live2D model
 */
function initLipSync(model) {
    console.log('Initializing lip sync for model');
    
    // Reset caches
    modelParametersCache = null;
    modelMethodsCache = null;
    lastSuccessfulMethod = null;
    lastMouthValue = 0;
    
    if (!model) {
        console.warn('No model provided for lip sync initialization');
        return;
    }
    
    // Log model structure for debugging (only once)
    if (!modelStructureLogged && debugMode) {
        console.log('Model type:', model.constructor.name);
        
        if (model.internalModel) {
            console.log('Internal model type:', model.internalModel.constructor.name);
            
            // Cache available methods
            modelMethodsCache = {};
            for (const key in model.internalModel) {
                if (typeof model.internalModel[key] === 'function') {
                    modelMethodsCache[key] = true;
                }
            }
            
            // Log available methods
            console.log('Available methods:');
            Object.keys(modelMethodsCache).forEach(method => {
                console.log(`- ${method}`);
            });
            
            // Cache available parameters
            if (model.internalModel.parameters) {
                modelParametersCache = {};
                try {
                    // Try to get parameters for Cubism 4 models
                    const params = model.internalModel.parameters;
                    if (params.ids) {
                        console.log('Found Cubism 4 parameters:', params.ids.length);
                        params.ids.forEach((id, index) => {
                            modelParametersCache[id] = index;
                        });
                    }
                } catch (e) {
                    console.warn('Error accessing parameters:', e);
                }
            }
            
            // Try to find mouth parameters
            if (modelParametersCache) {
                console.log('Available parameters:');
                Object.keys(modelParametersCache).forEach(param => {
                    console.log(`- ${param}`);
                    // Check if this is a mouth parameter
                    if (MOUTH_PARAM_NAMES.some(name => param.includes(name))) {
                        console.log(`  (Potential mouth parameter)`);
                    }
                });
            }
            
            modelStructureLogged = true;
        }
    }
    
    // Test mouth movement to find working method
    testMouthMovement(model);
}

/**
 * Test different methods to move the mouth
 * @param {Object} model - The Live2D model
 */
function testMouthMovement(model) {
    console.log('Testing mouth movement methods...');
    
    // Try setting mouth to 1.0 (open) and then back to 0.0 (closed)
    // We'll try different methods with a delay between them
    setMouthOpenness(model, 1.0);
    
    // After a short delay, close the mouth
    setTimeout(() => {
        setMouthOpenness(model, 0.0);
    }, 500);
}

/**
 * Set the mouth openness value
 * @param {Object} model - The Live2D model
 * @param {number} value - Openness value (0-1)
 * @returns {boolean} - Success status
 */
function setMouthOpenness(model, value) {
    if (!model) return false;
    
    // Ensure value is a number
    if (typeof value !== 'number') {
        console.error('Invalid mouth value type:', typeof value, value);
        value = parseFloat(value);
        if (isNaN(value)) {
            console.error('Could not convert value to number');
            return false;
        }
    }
    
    // Clamp value between 0 and 1
    value = Math.max(0, Math.min(1, value));
    
    // Store the last value
    lastMouthValue = value;
    
    // If we have a successful method from before, try that first
    if (lastSuccessfulMethod) {
        try {
            const result = applyMouthMethod(model, lastSuccessfulMethod, value);
            if (result) return true;
        } catch (e) {
            console.warn('Previous successful method failed:', e);
            lastSuccessfulMethod = null;
        }
    }
    
    // Try all known methods for setting mouth parameters
    
    // Method 1: Direct parameter access for Cubism 4 models
    try {
        if (model.internalModel && model.internalModel.coreModel) {
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    const paramId = model.internalModel.getParameterId(paramName);
                    if (paramId !== -1) {
                        model.internalModel.setParameterValueById(paramId, value);
                        lastSuccessfulMethod = 'cubism4_direct';
                        return true;
                    }
                } catch (e) {
                    // Continue to next parameter
                }
            }
        }
    } catch (e) {
        // Continue to next method
    }
    
    // Method 2: Using setParameterValueById for Cubism models
    try {
        if (model.internalModel && typeof model.internalModel.setParameterValueById === 'function') {
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model.internalModel.setParameterValueById(paramName, value);
                    lastSuccessfulMethod = 'setParameterValueById';
                return true;
                } catch (e) {
                    // Continue to next parameter
                }
            }
        }
    } catch (e) {
        // Continue to next method
    }
    
    // Method 3: Using setParamFloat for older Live2D models
    try {
        if (model.internalModel && typeof model.internalModel.setParamFloat === 'function') {
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model.internalModel.setParamFloat(paramName, value);
                    lastSuccessfulMethod = 'setParamFloat';
                    return true;
                } catch (e) {
                    // Continue to next parameter
                }
            }
        }
    } catch (e) {
        // Continue to next method
    }
    
    // Method 4: Using parameter object directly
    try {
        if (model.internalModel && model.internalModel.parameters) {
            const params = model.internalModel.parameters;
            
            // Try to find mouth parameter
            for (const paramName of MOUTH_PARAM_NAMES) {
                // Check if parameter exists in the cache
                if (modelParametersCache && modelParametersCache[paramName] !== undefined) {
                    const index = modelParametersCache[paramName];
                    
                    // Try different ways to set the parameter
                    if (params.values && params.values[index] !== undefined) {
                        params.values[index] = value;
                        lastSuccessfulMethod = 'params_values_direct';
                        return true;
                    }
                }
            }
        }
    } catch (e) {
        // Continue to next method
    }
    
    // Method 5: Using model.parameters for some Live2D models
    try {
        if (model.parameters) {
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model.parameters[paramName] = value;
                    lastSuccessfulMethod = 'model_parameters_direct';
                    return true;
                } catch (e) {
                    // Continue to next parameter
                }
            }
        }
    } catch (e) {
        // Continue to next method
    }
    
    // Method 6: Using model.motionManager for some Live2D models
    try {
        if (model.motionManager && typeof model.motionManager.setParameterValue === 'function') {
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model.motionManager.setParameterValue(paramName, value);
                    lastSuccessfulMethod = 'motionManager_setParameterValue';
                return true;
            } catch (e) {
                    // Continue to next parameter
                }
            }
        }
    } catch (e) {
        // Continue to next method
    }
    
    // Method 7: Using model.coreModel for some Live2D models
    try {
        if (model.coreModel) {
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model.coreModel.setParameterValueById(paramName, value);
                    lastSuccessfulMethod = 'coreModel_setParameterValueById';
                return true;
            } catch (e) {
                    // Continue to next parameter
                }
            }
        }
    } catch (e) {
        // Continue to next method
    }
    
    // Method 8: Direct access to Live2DModel for some implementations
    try {
        if (model._model) {
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model._model.setParamFloat(paramName, value);
                    lastSuccessfulMethod = '_model_setParamFloat';
                    return true;
                } catch (e) {
                    // Continue to next parameter
                }
            }
        }
    } catch (e) {
        // Continue to next method
    }
    
    // If we've tried all methods and none worked, log an error
    console.error('Failed to set mouth parameter - no compatible method found');
    return false;
}

/**
 * Apply a specific mouth movement method
 * @param {Object} model - The Live2D model
 * @param {string} method - Method name
 * @param {number} value - Openness value (0-1)
 * @returns {boolean} - Success status
 */
function applyMouthMethod(model, method, value) {
    switch (method) {
        case 'cubism4_direct':
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    const paramId = model.internalModel.getParameterId(paramName);
                    if (paramId !== -1) {
                        model.internalModel.setParameterValueById(paramId, value);
                        return true;
                    }
                } catch (e) {
                    // Continue to next parameter
                }
            }
            return false;
            
        case 'setParameterValueById':
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model.internalModel.setParameterValueById(paramName, value);
                    return true;
                } catch (e) {
                    // Continue to next parameter
                }
            }
            return false;
            
        case 'setParamFloat':
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model.internalModel.setParamFloat(paramName, value);
                    return true;
                } catch (e) {
                    // Continue to next parameter
                }
            }
            return false;
            
        case 'params_values_direct':
            const params = model.internalModel.parameters;
            for (const paramName of MOUTH_PARAM_NAMES) {
                if (modelParametersCache && modelParametersCache[paramName] !== undefined) {
                    const index = modelParametersCache[paramName];
                    if (params.values && params.values[index] !== undefined) {
                        params.values[index] = value;
                        return true;
                    }
                }
            }
            return false;
            
        case 'model_parameters_direct':
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model.parameters[paramName] = value;
                    return true;
                } catch (e) {
                    // Continue to next parameter
                }
            }
            return false;
            
        case 'motionManager_setParameterValue':
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model.motionManager.setParameterValue(paramName, value);
                    return true;
                } catch (e) {
                    // Continue to next parameter
                }
            }
            return false;
            
        case 'coreModel_setParameterValueById':
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model.coreModel.setParameterValueById(paramName, value);
                        return true;
                    } catch (e) {
                    // Continue to next parameter
                }
            }
            return false;
            
        case '_model_setParamFloat':
            for (const paramName of MOUTH_PARAM_NAMES) {
                try {
                    model._model.setParamFloat(paramName, value);
                    return true;
                } catch (e) {
                    // Continue to next parameter
                }
            }
            return false;
            
        default:
            return false;
    }
}

/**
 * Update mouth based on audio volume
 * @param {Object} model - The Live2D model
 * @param {number} volume - Audio volume (0-1)
 */
function updateMouthWithAudio(model, volume) {
    if (!model) return;
    
    // Ensure volume is a number
    if (typeof volume !== 'number') {
        console.error('Invalid volume type:', typeof volume);
        volume = parseFloat(volume);
        if (isNaN(volume)) {
            console.error('Could not convert volume to number');
            return;
        }
    }
    
    // Apply easing curve for more natural movement
    const easedVolume = Math.pow(volume, 0.7);
    
    // Set minimum openness when sound is detected
    const finalVolume = volume > 0.05 ? Math.max(easedVolume, 0.1) : 0;
    
    // Log volume data periodically (not every frame to avoid console spam)
    if (Math.random() < 0.05 && debugMode) {
        console.log(`Lip sync volume: ${volume.toFixed(2)}, final: ${finalVolume.toFixed(2)}`);
    }
    
    // Set the mouth parameter
    setMouthOpenness(model, finalVolume);
}

/**
 * Get the current mouth openness value
 * @returns {number} - Current mouth openness value
 */
function getCurrentMouthValue() {
    return lastMouthValue;
}

/**
 * Reset mouth to closed position
 * @param {Object} model - The Live2D model
 */
function resetMouth(model) {
    console.log('Resetting mouth to closed position');
    setMouthOpenness(model, 0);
}

/**
 * Force mouth to a specific position for testing
 * @param {Object} model - The Live2D model
 * @param {number} value - Openness value (0-1)
 */
function forceMouthPosition(model, value) {
    console.log(`Forcing mouth position to ${value}`);
    
    // Try all possible methods to set the mouth parameter
    // This is a more aggressive approach for testing
    
    try {
        if (model.internalModel) {
            // Try all parameter names
            for (const paramName of MOUTH_PARAM_NAMES) {
                // Method 1: setParameterValueById
                try {
                    model.internalModel.setParameterValueById(paramName, value);
                    console.log(`Success with setParameterValueById('${paramName}', ${value})`);
                    return true;
                } catch (e) {}
                
                // Method 2: setParamFloat
                try {
                    model.internalModel.setParamFloat(paramName, value);
                    console.log(`Success with setParamFloat('${paramName}', ${value})`);
                    return true;
                } catch (e) {}
                
                // Method 3: Direct parameter access for Cubism 2
                try {
                    if (model.internalModel.live2DModel) {
                        model.internalModel.live2DModel.setParamFloat(paramName, value);
                        console.log(`Success with live2DModel.setParamFloat('${paramName}', ${value})`);
                        return true;
                    }
                } catch (e) {}
            }
            
            // Try direct parameter access
            if (model.internalModel.parameters && model.internalModel.parameters.values) {
                const params = model.internalModel.parameters;
                console.log(`Parameters array length: ${params.values.length}`);
                
                // Try setting all parameters to find the mouth
                for (let i = 0; i < params.values.length; i++) {
                    const originalValue = params.values[i];
                    params.values[i] = value;
                    console.log(`Set parameter ${i} to ${value} (was ${originalValue})`);
                }
                return true;
            }
            
            // Try Cubism 2 specific methods
            if (model.internalModel.coreModel && model.internalModel.coreModel.setParamFloat) {
                for (const paramName of MOUTH_PARAM_NAMES) {
                    try {
                        model.internalModel.coreModel.setParamFloat(paramName, value);
                        console.log(`Success with coreModel.setParamFloat('${paramName}', ${value})`);
                        return true;
                    } catch (e) {}
                }
            }
            
            // Try direct model access for Cubism 2
            if (model.internalModel.model && model.internalModel.model.setParamFloat) {
                for (const paramName of MOUTH_PARAM_NAMES) {
                    try {
                        model.internalModel.model.setParamFloat(paramName, value);
                        console.log(`Success with model.setParamFloat('${paramName}', ${value})`);
                        return true;
                    } catch (e) {}
                }
            }
        }
    } catch (e) {
        console.error('Error in forceMouthPosition:', e);
    }
    
    return false;
}

// Export the module
window.LipSync = {
    initLipSync,
    setMouthOpenness,
    updateMouthWithAudio,
    testMouthMovement,
    getCurrentMouthValue,
    resetMouth,
    forceMouthPosition
}; 