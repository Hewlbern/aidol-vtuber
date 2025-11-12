'use client';

import React, { useState, useEffect } from 'react';
import { useModel } from '../../contexts/ModelContext';

// Remove empty interface and use a more specific type
type MotionTabProps = Record<string, never>;

export default function MotionTab({}: MotionTabProps) {
  const { 
    handleModelExpression,
    characterHandler,
    modelPath,
    motionState,
    handleExpressionChange,
    handleMotionGroupChange,
    handleMotionIndexChange,
    handlePlayMotion
  } = useModel();

  // State for expressions and motions
  const [expressions, setExpressions] = useState<Array<{ id: number; name: string; file?: string }>>([]);
  const [motionGroups, setMotionGroups] = useState<string[]>([]);
  const [motionIndices, setMotionIndices] = useState<number[]>([]);
  const [customExpression, setCustomExpression] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load available expressions and motions when model changes
  useEffect(() => {
    if (!characterHandler || !modelPath) return;
    
    console.log('[MotionTab] Loading expressions for model:', modelPath);
    
    // Get model configuration
    const modelConfig = characterHandler.getModelConfig();
    
    if (modelConfig) {
      // Load expressions dynamically based on model
      loadModelExpressions(modelPath);
      
      // Set available motion groups
      const availableMotionGroups = ['idle', 'tap_body', 'tap_head', 'pinch_in', 'pinch_out', 'shake', 'flick_head'];
      setMotionGroups(availableMotionGroups);
      
      // Set available motion indices (0-5 as default)
      const availableMotionIndices = [0, 1, 2, 3, 4, 5];
      setMotionIndices(availableMotionIndices);
      
      console.log('[MotionTab] Available expressions and motions loaded:', {
        motionGroups: availableMotionGroups,
        motionIndices: availableMotionIndices,
        timestamp: new Date().toISOString()
      });
    }
  }, [characterHandler, modelPath]);

  // Function to load expressions dynamically from model files
  const loadModelExpressions = async (modelPath: string) => {
    try {
      console.log('[MotionTab] Loading expressions for model:', modelPath);
      
      // Extract model directory from path
      const modelDir = modelPath.substring(0, modelPath.lastIndexOf('/'));
      console.log('[MotionTab] Model directory:', modelDir);
      
      // Define available expressions based on model type
      let availableExpressions: Array<{ id: number; name: string; file?: string }> = [];
      
      if (modelPath.includes('woodDog')) {
        // Load woodDog specific expressions
        availableExpressions = [
          { id: 0, name: 'Default' },
          { id: 1, name: 'Sad', file: 'Sad.exp3.json' },
          { id: 2, name: 'Angy', file: 'Angy.exp3.json' },
          { id: 3, name: 'Blush', file: 'Blush.exp3.json' }
        ];
        
        // Verify expression files exist
        for (const expression of availableExpressions) {
          if (expression.file) {
            try {
              const response = await fetch(`${modelDir}/${expression.file}`);
              if (!response.ok) {
                console.warn(`[MotionTab] Expression file not found: ${expression.file}`);
                expression.name += ' (Missing)';
              } else {
                console.log(`[MotionTab] Expression file found: ${expression.file}`);
              }
            } catch (error) {
              console.warn(`[MotionTab] Error checking expression file ${expression.file}:`, error);
              expression.name += ' (Error)';
            }
          }
        }
      } else if (modelPath.includes('vanilla')) {
        // Load vanilla specific expressions
        availableExpressions = [
          { id: 0, name: 'Default' },
          { id: 1, name: 'Wink' },
          { id: 2, name: 'Cute Frown' },
          { id: 3, name: 'Laugh Smile' }
        ];
      } else if (modelPath.includes('mao_pro')) {
        // Load mao_pro specific expressions
        availableExpressions = [
          { id: 0, name: 'Default' },
          { id: 1, name: 'Expression 1' },
          { id: 2, name: 'Expression 2' },
          { id: 3, name: 'Expression 3' },
          { id: 4, name: 'Expression 4' },
          { id: 5, name: 'Expression 5' },
          { id: 6, name: 'Expression 6' },
          { id: 7, name: 'Expression 7' },
          { id: 8, name: 'Expression 8' }
        ];
      } else {
        // Default expressions for unknown models
        availableExpressions = [
          { id: 0, name: 'Default' },
          { id: 1, name: 'Expression 1' },
          { id: 2, name: 'Expression 2' },
          { id: 3, name: 'Expression 3' }
        ];
      }
      
      setExpressions(availableExpressions);
      
      console.log('[MotionTab] Loaded expressions:', {
        modelPath,
        expressions: availableExpressions,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('[MotionTab] Error loading expressions:', error);
      
      // Fallback to default expressions
      const fallbackExpressions = [
        { id: 0, name: 'Default' },
        { id: 1, name: 'Expression 1' },
        { id: 2, name: 'Expression 2' },
        { id: 3, name: 'Expression 3' }
      ];
      setExpressions(fallbackExpressions);
    }
  };

  // Handle expression button click
  const handleExpressionClick = (expressionId: number) => {
    console.log('[MotionTab] Expression button clicked:', {
      expressionId,
      currentExpressionId: motionState.expressionId,
      hasCharacterHandler: !!characterHandler,
      timestamp: new Date().toISOString()
    });
    
    if (!characterHandler) {
      console.warn('[MotionTab] Character handler not available');
      return;
    }
    
    // Update the expression state
    handleExpressionChange(expressionId);
    
    // Apply the expression using handleModelExpression
    handleModelExpression({
      expressionId: expressionId,
      duration: 2000 // 2 seconds duration
    });
  };

  // Handle custom expression input
  const handleCustomExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setCustomExpression(value);
    }
  };

  // Handle custom expression button click
  const handleCustomExpressionClick = () => {
    console.log('[MotionTab] Custom expression button clicked:', {
      customExpression,
      currentExpressionId: motionState.expressionId,
      hasCharacterHandler: !!characterHandler,
      timestamp: new Date().toISOString()
    });
    
    if (!characterHandler) {
      console.warn('[MotionTab] Character handler not available');
      return;
    }
    
    // Update the expression state
    handleExpressionChange(customExpression);
    
    // Apply the expression to the model with a longer duration for better visibility
    handleModelExpression({
      expressionId: customExpression,
      duration: 3000 // Increased duration for better visibility
    });
  };

  // Handle motion group selection
  const handleMotionGroupSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGroup = e.target.value;
    console.log('[MotionTab] Motion group selected:', {
      selectedGroup,
      currentGroup: motionState.motionGroup,
      timestamp: new Date().toISOString()
    });
    
    handleMotionGroupChange(selectedGroup);
  };

  // Handle motion index selection
  const handleMotionIndexSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = parseInt(e.target.value);
    console.log('[MotionTab] Motion index selected:', {
      selectedIndex,
      currentIndex: motionState.motionIndex,
      timestamp: new Date().toISOString()
    });
    
    handleMotionIndexChange(selectedIndex);
  };

  // Handle play motion button click
  const handlePlayMotionClick = () => {
    console.log('[MotionTab] Play motion button clicked:', {
      motionGroup: motionState.motionGroup,
      motionIndex: motionState.motionIndex,
      expressionId: motionState.expressionId,
      isPlaying: motionState.isPlaying,
      hasCharacterHandler: !!characterHandler,
      timestamp: new Date().toISOString()
    });
    
    if (!characterHandler) {
      console.warn('[MotionTab] Character handler not available');
      return;
    }
    
    setIsPlaying(true);
    handlePlayMotion();
    
    // Reset playing state after a short delay
    setTimeout(() => {
      setIsPlaying(false);
    }, 1000);
  };

  // Add new handler for playing expression
  const handlePlayExpressionClick = () => {
    console.log('[MotionTab] Play expression button clicked:', {
      expressionId: motionState.expressionId,
      hasCharacterHandler: !!characterHandler,
      timestamp: new Date().toISOString()
    });
    
    if (!characterHandler) {
      console.warn('[MotionTab] Character handler not available');
      return;
    }
    
    // Apply the expression to the model with a longer duration for better visibility
    handleModelExpression({
      expressionId: motionState.expressionId,
      duration: 2000 // 2 seconds duration
    });
  };

  return (
    <div className="p-6 space-y-8 bg-[#1a1b26] rounded-lg shadow-lg">
      {!characterHandler && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-lg" role="alert">
          <p className="font-bold">Model not ready</p>
          <p>Please wait for the model to load before trying to play motions or expressions.</p>
        </div>
      )}
      
      {/* Quick Expressions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Quick Expressions</h3>
          <span className="text-sm text-gray-400">
            Current: {expressions.find(exp => exp.id === motionState.expressionId)?.name || 'None'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {expressions.map((expression) => (
            <button
              key={expression.id}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                motionState.expressionId === expression.id
                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-lg'
                  : 'bg-[#2d2e3a] text-white hover:bg-[#3d3e5a]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={() => handleExpressionClick(expression.id)}
              disabled={!characterHandler}
              title={expression.file ? `File: ${expression.file}` : 'Built-in expression'}
            >
              {expression.name}
            </button>
          ))}
        </div>

        {/* Play Expression Button */}
        <button
          className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
            isPlaying
              ? 'bg-[#4d4e6a] text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-lg hover:from-[#7c4deb] hover:to-[#5558e0]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handlePlayExpressionClick}
          disabled={isPlaying || !characterHandler}
        >
          Play Expression
        </button>
      </div>

      {/* Custom Expression Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Custom Expression</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <input
              type="number"
              min="0"
              max="10"
              value={customExpression}
              onChange={handleCustomExpressionChange}
              className="w-full px-3 py-2 bg-[#2d2e3a] text-white rounded-lg border border-[#4d4e6a] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!characterHandler}
            />
          </div>
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#3d3e5a] text-white hover:bg-[#4d4e6a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCustomExpressionClick}
            disabled={!characterHandler}
          >
            Apply
          </button>
        </div>
      </div>
      
      {/* Motions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Motions</h3>
          <span className="text-sm text-gray-400">
            {isPlaying ? 'Playing...' : 'Ready'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Motion Group
            </label>
            <select
              value={motionState.motionGroup}
              onChange={handleMotionGroupSelect}
              className="w-full px-3 py-2 bg-[#2d2e3a] text-white rounded-lg border border-[#4d4e6a] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!characterHandler}
            >
              {motionGroups.map((group) => (
                <option key={group} value={group}>
                  {group.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Motion Index
            </label>
            <select
              value={motionState.motionIndex}
              onChange={handleMotionIndexSelect}
              className="w-full px-3 py-2 bg-[#2d2e3a] text-white rounded-lg border border-[#4d4e6a] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!characterHandler}
            >
              {motionIndices.map((index) => (
                <option key={index} value={index}>
                  {index}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
            isPlaying
              ? 'bg-[#4d4e6a] text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-lg hover:from-[#7c4deb] hover:to-[#5558e0]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handlePlayMotionClick}
          disabled={isPlaying || !characterHandler}
        >
          {isPlaying ? 'Playing...' : 'Play Motion'}
        </button>
      </div>
    </div>
  );
} 