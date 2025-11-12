'use client';

import { useState, useEffect, useRef } from 'react';
import { useModel } from '../../contexts/ModelContext';

interface SettingsTabProps {
  onPositionChange: (x: number, y: number) => void;
  onScaleChange: (scale: number) => void;
  currentPosition: { x: number, y: number };
  currentScale: number;
  onPointerInteractiveChange?: (enabled: boolean) => void;
  onScrollToResizeChange?: (enabled: boolean) => void;
  isPointerInteractive?: boolean;
  isScrollToResizeEnabled?: boolean;
}

export default function SettingsTab({
  onPositionChange,
  onScaleChange,
  currentPosition,
  currentScale,
  onPointerInteractiveChange,
  onScrollToResizeChange,
  isPointerInteractive = true,
  isScrollToResizeEnabled = false
}: SettingsTabProps) {
  const { scaleState, handlePositionChange } = useModel();
  const rafRef = useRef<number | null>(null);
  
  // Use refs to track the current values
  const positionRef = useRef<{ x: number, y: number }>(currentPosition);
  const isDraggingRef = useRef<boolean>(false);
  
  // Local state for UI rendering
  const [position, setPosition] = useState<{ x: number, y: number }>(currentPosition);
  const [pointerInteractive, setPointerInteractive] = useState<boolean>(isPointerInteractive);
  const [scrollToResize, setScrollToResize] = useState<boolean>(isScrollToResizeEnabled);
  
  // Update local state and refs when props change
  useEffect(() => {
    if (!isDraggingRef.current) {
      console.log('[SettingsTab] Updating position from props:', currentPosition);
      positionRef.current = currentPosition;
      setPosition(currentPosition);
    }
  }, [currentPosition]);
  
  // Update toggle states when props change
  useEffect(() => {
    if (isPointerInteractive !== pointerInteractive) {
      setPointerInteractive(isPointerInteractive);
    }
  }, [isPointerInteractive]);
  
  useEffect(() => {
    if (isScrollToResizeEnabled !== scrollToResize) {
      setScrollToResize(isScrollToResizeEnabled);
    }
  }, [isScrollToResizeEnabled]);
  
  // Setup animation frame for smoother updates
  useEffect(() => {
    let rafId: number | null = null;
    
    const updateValues = () => {
      if (isDraggingRef.current) {
        onPositionChange(positionRef.current.x, positionRef.current.y);
      }
      if (isDraggingRef.current) {
        rafId = requestAnimationFrame(updateValues);
      }
    };

    if (isDraggingRef.current) {
      rafId = requestAnimationFrame(updateValues);
    }
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [onPositionChange]);
  
  // Handle scale change with RAF for smooth updates
  const handleScaleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    
    // Cancel any pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    // Use RAF for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      onScaleChange(newScale);
      rafRef.current = null;
    });
  };

  // Handle position change with refs
  const handlePositionXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isDraggingRef.current = true;
    const x = parseFloat(e.target.value);
    const newPosition = { ...positionRef.current, x };
    positionRef.current = newPosition;
    setPosition(newPosition);
    
    console.log('[SettingsTab] X position change:', { x, newPosition });
    
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        handlePositionChange(newPosition);
        rafRef.current = null;
      });
    }
  };
  
  const handlePositionYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isDraggingRef.current = true;
    const y = parseFloat(e.target.value);
    const newPosition = { ...positionRef.current, y };
    positionRef.current = newPosition;
    setPosition(newPosition);
    
    console.log('[SettingsTab] Y position change:', { y, newPosition });
    
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        handlePositionChange(newPosition);
        rafRef.current = null;
      });
    }
  };
  
  // Apply position changes on mouse up / touch end
  const applyPositionChange = () => {
    isDraggingRef.current = false;
    console.log('[SettingsTab] Applying final position:', positionRef.current);
    handlePositionChange(positionRef.current);
  };
  
  // Reset to default values
  const handleReset = () => {
    const defaultScale = 0.8;
    const defaultPosition = { x: 0.5, y: 0.5 };
    
    positionRef.current = defaultPosition;
    setPosition(defaultPosition);
    
    onScaleChange(defaultScale);
    onPositionChange(defaultPosition.x, defaultPosition.y);
  };
  
  // Handle toggle changes
  const handlePointerInteractiveToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    if (onPointerInteractiveChange) {
      onPointerInteractiveChange(newValue);
    }
  };
  
  const handleScrollToResizeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    if (onScrollToResizeChange) {
      onScrollToResizeChange(newValue);
    }
  };

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 bg-[#2d2e47]/80 rounded-lg border border-[#6366f1]/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
        <h3 className="text-lg font-bold text-white mb-4">Model Settings</h3>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-[#8b5cf6]">
              Scale
            </label>
            <span className="text-sm font-mono bg-[#1a1b2e]/80 text-white px-3 py-1 rounded-lg border border-[#6366f1]/20">
              {scaleState.currentScale.toFixed(1)}
            </span>
          </div>

          <input 
            type="range" 
            min="0.1" 
            max="2" 
            step="0.1" 
            value={currentScale}
            onChange={handleScaleInput}
            className="w-full h-2 bg-[#1a1b2e] rounded-lg appearance-none cursor-pointer accent-[#8b5cf6] hover:accent-[#ec4899]"
          />

          <div className="flex justify-between text-xs text-[#a5b4fc] mt-2">
            <span>Small</span>
            <span>Default</span>
            <span>Large</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-[#8b5cf6]">Position</h3>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-[#8b5cf6]">
                Horizontal (X)
              </label>
              <span className="text-sm font-mono bg-[#1a1b2e]/80 text-white px-3 py-1 rounded-lg border border-[#6366f1]/20">
                {position.x.toFixed(2)}
              </span>
            </div>

            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={position.x}
              onChange={handlePositionXChange}
              onMouseDown={() => isDraggingRef.current = true}
              onMouseUp={applyPositionChange}
              onTouchStart={() => isDraggingRef.current = true}
              onTouchEnd={applyPositionChange}
              className="w-full h-2 bg-[#1a1b2e] rounded-lg appearance-none cursor-pointer accent-[#8b5cf6] hover:accent-[#ec4899]"
            />

            <div className="flex justify-between text-xs text-[#a5b4fc] mt-2">
              <span>Left</span>
              <span>Center</span>
              <span>Right</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-[#8b5cf6]">
                Vertical (Y)
              </label>
              <span className="text-sm font-mono bg-[#1a1b2e]/80 text-white px-3 py-1 rounded-lg border border-[#6366f1]/20">
                {position.y.toFixed(2)}
              </span>
            </div>

            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={position.y}
              onChange={handlePositionYChange}
              onMouseDown={() => isDraggingRef.current = true}
              onMouseUp={applyPositionChange}
              onTouchStart={() => isDraggingRef.current = true}
              onTouchEnd={applyPositionChange}
              className="w-full h-2 bg-[#1a1b2e] rounded-lg appearance-none cursor-pointer accent-[#8b5cf6] hover:accent-[#ec4899]"
            />

            <div className="flex justify-between text-xs text-[#a5b4fc] mt-2">
              <span>Top</span>
              <span>Center</span>
              <span>Bottom</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Options */}
      <div className="p-6 bg-[#2d2e47]/80 rounded-lg border border-[#6366f1]/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
        <h3 className="text-lg font-bold text-white mb-4">Interaction Options</h3>

        {/* Pointer Interactive Toggle */}
        <div className="flex items-center justify-between mb-4">
          <label htmlFor="pointer-interactive" className="flex-1 cursor-pointer">
            <span className="block text-sm font-medium text-[#8b5cf6]">
              Pointer Follow
            </span>
            <span className="text-xs text-[#a5b4fc] mt-1 block">
              Makes the model&apos;s eyes follow your mouse or touch cursor
            </span>
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="pointer-interactive"
              checked={isPointerInteractive}
              onChange={handlePointerInteractiveToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#1a1b2e] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#8b5cf6] peer-checked:to-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.2)]"></div>
          </label>
        </div>

        {/* Scroll to Resize Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="scroll-to-resize" className="flex-1 cursor-pointer">
            <span className="block text-sm font-medium text-[#8b5cf6]">
              Scroll to Resize
            </span>
            <span className="text-xs text-[#a5b4fc] mt-1 block">
              Use mouse wheel to resize the model in real-time
            </span>
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="scroll-to-resize"
              checked={isScrollToResizeEnabled}
              onChange={handleScrollToResizeToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#1a1b2e] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#8b5cf6] peer-checked:to-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.2)]"></div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleReset}
          className="py-3 px-4 bg-[#1a1b2e] text-[#8b5cf6] rounded-lg transition-all duration-200 font-medium border border-[#6366f1]/20 hover:bg-[#2d2e47] hover:text-[#ec4899] shadow-[0_0_15px_rgba(99,102,241,0.1)]"
        >
          Reset to Default
        </button>
        <button
          onClick={() => {
            const centeredPosition = { x: 0.5, y: 0.5 };
            setPosition(centeredPosition);
            onPositionChange(centeredPosition.x, centeredPosition.y);
          }}
          className="py-3 px-4 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white rounded-lg font-medium hover:from-[#ec4899] hover:to-[#8b5cf6] transition-all duration-200 shadow-[0_0_15px_rgba(139,92,246,0.3)] transform hover:-translate-y-1"
        >
          Center Position
        </button>
      </div>
    </div>
  );
} 