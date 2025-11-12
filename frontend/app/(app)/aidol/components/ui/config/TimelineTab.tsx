'use client';

import { useState, useEffect, useRef } from 'react';
import { useModel } from '../../contexts/ModelContext';
import { VisualTimeline } from './VisualTimeline';

interface TimelineEvent {
  id: string;
  time: number;
  type: 'text' | 'expression' | 'motion' | 'action';
  content: string;
  motionGroup?: string;
  motionIndex?: number;
}

interface TimelineState {
  events: TimelineEvent[];
  selectedTime: number;
  hoveredEvent: string | null;
  lastSavedTime: number;
  isDirty: boolean;
}

interface TimelineSaveData {
  events: TimelineEvent[];
  lastSavedTime: number;
  version: string;
  name: string;
  id: string;
  createdAt: number;
  updatedAt: number;
}

interface SavedTimeline {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

interface TikTokTabProps {
  isTikTokEnabled?: boolean;
  onTikTokEnabledChange?: (enabled: boolean) => void;
  tiktokUsername?: string;
  onTikTokUsernameChange?: (username: string) => void;
  tiktokAccessToken?: string;
  onTikTokAccessTokenChange?: (token: string) => void;
}

interface Expression {
  id: number;
  name: string;
}

const EVENT_COLORS = {
  text: {
    bg: 'bg-blue-500',
    border: 'border-blue-400',
    hover: 'hover:bg-blue-400',
    ring: 'ring-blue-500/50'
  },
  expression: {
    bg: 'bg-purple-500',
    border: 'border-purple-400',
    hover: 'hover:bg-purple-400',
    ring: 'ring-purple-500/50'
  },
  motion: {
    bg: 'bg-green-500',
    border: 'border-green-400',
    hover: 'hover:bg-green-400',
    ring: 'ring-green-500/50'
  },
  action: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-400',
    hover: 'hover:bg-yellow-400',
    ring: 'ring-yellow-500/50'
  }
};

const TIMELINE_DURATION = 60;
const PIXELS_PER_SECOND = 100;
const TIMELINE_VERSION = '1.0.0';

const expressions: Expression[] = [
  { id: 0, name: 'Default' },
  { id: 1, name: 'Wink' },
  { id: 2, name: 'Cute Frown' },
  { id: 3, name: 'Laugh Smile' }
];

export default function TimelineTab({
  isTikTokEnabled = false,
  onTikTokEnabledChange,
  tiktokUsername = '',
  onTikTokUsernameChange,
  tiktokAccessToken = '',
  onTikTokAccessTokenChange
}: TikTokTabProps) {
  const { handleModelExpression, characterHandler } = useModel();
  
  // Timeline state
  const [timelineState, setTimelineState] = useState<TimelineState>({
    events: [],
    selectedTime: 0,
    hoveredEvent: null,
    lastSavedTime: Date.now(),
    isDirty: false
  });

  // Timeline management state
  const [savedTimelines, setSavedTimelines] = useState<SavedTimeline[]>([]);
  const [currentTimelineId, setCurrentTimelineId] = useState<string | null>(null);
  const [newTimelineName, setNewTimelineName] = useState('');
  const [isTimelineDropdownOpen, setIsTimelineDropdownOpen] = useState(false);

  // TikTok state
  const [username, setUsername] = useState<string>(tiktokUsername);
  const [accessToken, setAccessToken] = useState<string>(tiktokAccessToken);
  const [enabled, setEnabled] = useState<boolean>(isTikTokEnabled);
  const [showTikTokModal, setShowTikTokModal] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Add debug logging for timeline state changes
  useEffect(() => {
    console.log('🕒 Timeline State Update:', {
      selectedTime: timelineState.selectedTime,
      isPlaying,
      frameCount: frameCountRef.current,
      timestamp: new Date().toISOString()
    });
  }, [timelineState.selectedTime, isPlaying]);

  const handleAddEvent = (event: Omit<TimelineEvent, 'id'>) => {
      const newEvent: TimelineEvent = {
      ...event,
      id: Date.now().toString()
    };
    setTimelineState(prev => ({
      ...prev,
      events: [...prev.events, newEvent].sort((a, b) => a.time - b.time),
      isDirty: true
    }));
  };

  const removeEvent = (id: string) => {
    setTimelineState(prev => ({
      ...prev,
      events: prev.events.filter(event => event.id !== id),
      isDirty: true
    }));
  };

  const handleTimeSelect = (time: number) => {
    setTimelineState(prev => ({
      ...prev,
      selectedTime: time
    }));
  };

  const handleEventHover = (id: string | null) => {
    setTimelineState(prev => ({
      ...prev,
      hoveredEvent: id
    }));
  };

  const handleUpdateEventTime = (eventId: string, newTime: number) => {
    setTimelineState(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === eventId 
          ? { ...event, time: newTime }
          : event
      ).sort((a, b) => a.time - b.time),
      isDirty: true
    }));
  };

  const handleSave = () => {
    const saveData: TimelineSaveData = {
      events: timelineState.events,
      lastSavedTime: Date.now(),
      version: TIMELINE_VERSION,
      name: currentTimelineId ? savedTimelines.find(t => t.id === currentTimelineId)?.name || 'Untitled' : 'Untitled',
      id: currentTimelineId || Date.now().toString(),
      createdAt: currentTimelineId ? savedTimelines.find(t => t.id === currentTimelineId)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now()
    };

    // Save timeline data
    localStorage.setItem(`timeline_${saveData.id}`, JSON.stringify(saveData));

    // Update saved timelines list
    const updatedTimelines = currentTimelineId
      ? savedTimelines.map(t => t.id === currentTimelineId ? { ...t, updatedAt: Date.now() } : t)
      : [...savedTimelines, { id: saveData.id, name: saveData.name, createdAt: saveData.createdAt, updatedAt: saveData.updatedAt }];
    
    setSavedTimelines(updatedTimelines);
    localStorage.setItem('savedTimelines', JSON.stringify(updatedTimelines));
    setCurrentTimelineId(saveData.id);

    setTimelineState(prev => ({
      ...prev,
      lastSavedTime: Date.now(),
      isDirty: false
    }));
  };

  const handleConfirmNewTimeline = () => {
    if (newTimelineName.trim()) {
      setTimelineState({
        events: [],
        selectedTime: 0,
        hoveredEvent: null,
        lastSavedTime: Date.now(),
        isDirty: false
      });
      setCurrentTimelineId(null);
      setNewTimelineName('');
    }
  };

  const handleLoadTimeline = (timelineId: string) => {
    const savedData = localStorage.getItem(`timeline_${timelineId}`);
    if (savedData) {
      try {
        const parsedData: TimelineSaveData = JSON.parse(savedData);
        if (parsedData.version === TIMELINE_VERSION) {
          setTimelineState(prev => ({
            ...prev,
            events: parsedData.events,
            lastSavedTime: parsedData.lastSavedTime,
            isDirty: false
          }));
          setCurrentTimelineId(timelineId);
        }
      } catch (error) {
        console.error('Error loading timeline data:', error);
      }
    }
  };

  const handleDeleteTimeline = (timelineId: string) => {
    localStorage.removeItem(`timeline_${timelineId}`);
    const updatedTimelines = savedTimelines.filter(t => t.id !== timelineId);
    setSavedTimelines(updatedTimelines);
    localStorage.setItem('savedTimelines', JSON.stringify(updatedTimelines));
    
    if (currentTimelineId === timelineId) {
      setTimelineState({
        events: [],
        selectedTime: 0,
        hoveredEvent: null,
        lastSavedTime: Date.now(),
        isDirty: false
      });
      setCurrentTimelineId(null);
    }
  };

  const handleClearAll = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = null;
      }
    }
    setTimelineState(prev => ({
      ...prev,
      events: [],
      selectedTime: 0,
      isDirty: true
    }));
  };

  // Load saved timelines on component mount
  useEffect(() => {
    const savedTimelinesData = localStorage.getItem('savedTimelines');
    if (savedTimelinesData) {
      try {
        const parsedData = JSON.parse(savedTimelinesData);
        setSavedTimelines(parsedData);
      } catch (error) {
        console.error('Error loading saved timelines:', error);
      }
    }
  }, []);

  // Auto-save when events change
  useEffect(() => {
    if (timelineState.isDirty) {
      const autoSaveTimeout = setTimeout(() => {
        handleSave();
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(autoSaveTimeout);
    }
  }, [timelineState.events, timelineState.isDirty]);

  // TikTok handlers
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    if (onTikTokUsernameChange) {
      onTikTokUsernameChange(newUsername);
    }
  };
  
  const handleAccessTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value;
    setAccessToken(newToken);
    if (onTikTokAccessTokenChange) {
      onTikTokAccessTokenChange(newToken);
    }
  };
  
  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setEnabled(newEnabled);
    if (onTikTokEnabledChange) {
      onTikTokEnabledChange(newEnabled);
    }
  };
  
  const handleConnect = () => {
    // This would typically open a TikTok OAuth flow or similar
    console.log('Connecting to TikTok...');
  };

  // Handle playback
  const handlePlayPause = () => {
    if (isPlaying) {
      // Stop playback
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Start playback
      startTimeRef.current = performance.now();
      lastFrameTimeRef.current = startTimeRef.current;
      frameCountRef.current = 0;
      setIsPlaying(true);
      playbackRef.current = requestAnimationFrame(playbackLoop);
    }
  };

  const playbackLoop = (timestamp: number) => {
    if (!isPlaying) return;

    const deltaTime = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;

    // Calculate new time based on delta time
    const newTime = timelineState.selectedTime + (deltaTime / 1000);

    // Update timeline state
    setTimelineState(prev => {
      const updatedTime = Math.min(newTime, 60); // Cap at 60 seconds
      
      // Find events that should be triggered
      const eventsToTrigger = prev.events.filter(event => 
        event.time > prev.selectedTime && event.time <= updatedTime
      );

      // Trigger events
      eventsToTrigger.forEach(event => {
        if (event.type === 'expression' && characterHandler) {
          const expressionId = expressions.find(exp => 
            exp.name.toLowerCase() === event.content.toLowerCase()
          )?.id;
          if (expressionId !== undefined) {
            handleModelExpression({
              expressionId: expressionId,
              duration: 2000
            });
          }
        }
      });

      // Handle end of timeline
      if (updatedTime >= 60) {
        setIsPlaying(false);
        if (playbackRef.current) {
          cancelAnimationFrame(playbackRef.current);
          playbackRef.current = null;
        }
        return { ...prev, selectedTime: 0 };
      }

      return {
        ...prev,
        selectedTime: updatedTime
      };
    });

    // Schedule next frame
    if (isPlaying) {
      playbackRef.current = requestAnimationFrame(playbackLoop);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
      }
    };
  }, []);

  // Add debug logging for event triggers
  useEffect(() => {
    if (timelineState.events.length > 0) {
      console.log('📊 Timeline Events:', {
        count: timelineState.events.length,
        events: timelineState.events.map(e => ({
          type: e.type,
          time: e.time,
          content: e.content
        }))
      });
    }
  }, [timelineState.events]);

  return (
    <div className="space-y-3">
      {/* Timeline Header with Dropdown */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setIsTimelineDropdownOpen(!isTimelineDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#2d2e47] text-white rounded-lg border border-[#6366f1]/20 hover:border-[#8b5cf6]/50 transition-all duration-200"
          >
            <span className="text-[#8b5cf6] text-sm">
              {currentTimelineId 
                ? savedTimelines.find(t => t.id === currentTimelineId)?.name || 'Untitled'
                : 'Select Timeline'}
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-3.5 w-3.5 transition-transform duration-200 ${isTimelineDropdownOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Timeline Dropdown */}
          {isTimelineDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#2d2e47] rounded-lg border border-[#6366f1]/20 shadow-lg z-50">
              <div className="p-1.5 border-b border-[#6366f1]/20">
                <div className="flex items-center gap-1.5">
          <input
                    type="text"
                    value={newTimelineName}
                    onChange={(e) => setNewTimelineName(e.target.value)}
                    placeholder="New timeline name..."
                    className="flex-1 p-1 bg-[#1a1b2e] text-white rounded border border-[#6366f1]/20 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]/50 transition-all duration-200 text-sm"
                  />
                  <button
                    onClick={() => {
                      handleConfirmNewTimeline();
                      setIsTimelineDropdownOpen(false);
                    }}
                    className="p-1 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white rounded hover:from-[#ec4899] hover:to-[#8b5cf6] transition-all duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
        </div>
      </div>
              <div className="max-h-40 overflow-y-auto custom-scrollbar">
                {savedTimelines.map((timeline) => (
                  <div
                    key={timeline.id}
                    className={`group flex items-center justify-between p-1.5 hover:bg-[#6366f1]/10 transition-colors ${
                      currentTimelineId === timeline.id ? 'bg-[#6366f1]/20' : ''
                    }`}
                  >
                    <button
                      onClick={() => {
                        handleLoadTimeline(timeline.id);
                        setIsTimelineDropdownOpen(false);
                      }}
                      className="flex-1 text-left text-sm text-white hover:text-[#8b5cf6] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{timeline.name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(timeline.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteTimeline(timeline.id)}
                      className="p-0.5 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white rounded-lg hover:from-[#ec4899] hover:to-[#8b5cf6] transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transform hover:scale-105 ${timelineState.isDirty ? 'animate-pulse' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{timelineState.isDirty ? 'Save Changes' : 'Saved'}</span>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className={`flex items-center gap-1.5 px-3 py-1.5 ${
            isPlaying 
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              : 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] hover:from-[#ec4899] hover:to-[#8b5cf6]'
          } text-white rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transform hover:scale-105`}
        >
          {isPlaying ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Pause</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Play</span>
            </>
          )}
        </button>
      </div>

      {/* Visual Timeline */}
      <VisualTimeline
        events={timelineState.events}
        selectedTime={timelineState.selectedTime}
        onTimeSelect={handleTimeSelect}
        onEventHover={handleEventHover}
        hoveredEvent={timelineState.hoveredEvent}
        duration={TIMELINE_DURATION}
        pixelsPerSecond={PIXELS_PER_SECOND}
        eventColors={EVENT_COLORS}
        onAddEvent={handleAddEvent}
        onUpdateEventTime={handleUpdateEventTime}
        onClearAll={handleClearAll}
        isPlaying={isPlaying}
      />

      {/* Event List */}
      <div className="relative">
        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
          {timelineState.events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-2 p-1.5 bg-[#2d2e47] rounded-lg border border-[#6366f1]/20 hover:border-[#8b5cf6]/50 transition-all duration-200"
            >
              <div className={`w-3 h-3 rounded-full ${EVENT_COLORS[event.type].bg} ${EVENT_COLORS[event.type].border} border-2`}></div>
              <div className="w-12 text-xs font-medium text-[#8b5cf6]">
                {event.time}s
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-white">
                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </div>
                <div className="text-xs text-gray-300 truncate">
                  {event.content}
                </div>
              </div>
              <button
                onClick={() => removeEvent(event.id)}
                className="p-0.5 text-red-400 hover:text-red-300 transition-colors hover:scale-110 transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* TikTok Settings Button */}
      <button
        onClick={() => setShowTikTokModal(true)}
        className="w-full px-3 py-1.5 bg-[#2d2e47] text-white rounded-lg border border-[#6366f1]/20 hover:border-[#8b5cf6]/50 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
        TikTok Settings
      </button>

      {/* TikTok Modal */}
      {showTikTokModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1b2e] rounded-lg border border-[#6366f1]/20 shadow-lg w-full max-w-lg mx-4">
            <div className="p-4 border-b border-[#6366f1]/20 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">TikTok Integration</h3>
          <button
                onClick={() => setShowTikTokModal(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#8b5cf6]">Enable TikTok Integration</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={handleToggleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#1a1b2e] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#8b5cf6] peer-checked:to-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.2)]"></div>
          </label>
        </div>
        
              <div className="space-y-3">
          <div>
                  <label className="block text-sm font-medium text-[#8b5cf6] mb-1">TikTok Username</label>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your TikTok username"
                    className="w-full p-2 bg-[#2d2e47] text-white rounded-lg border-2 border-[#6366f1]/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6] shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            />
          </div>
          
          <div>
                  <label className="block text-sm font-medium text-[#8b5cf6] mb-1">Access Token</label>
                  <div className="flex gap-2">
              <input
                type="password"
                value={accessToken}
                onChange={handleAccessTokenChange}
                placeholder="Enter your TikTok access token"
                      className="flex-1 p-2 bg-[#2d2e47] text-white rounded-lg border-2 border-[#6366f1]/40 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6] shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              />
              <button 
                onClick={handleConnect}
                      className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white rounded-lg font-medium hover:from-[#ec4899] hover:to-[#8b5cf6] transition-all duration-200 shadow-[0_0_15px_rgba(139,92,246,0.3)] transform hover:-translate-y-1"
              >
                Connect
              </button>
          </div>
        </div>
      </div>
      
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-[#8b5cf6]">Features</h4>
                <div className="space-y-2">
          <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">React to Comments</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                disabled={!enabled}
              />
              <div className="w-11 h-6 bg-[#1a1b2e] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#8b5cf6] peer-checked:to-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.2)] opacity-50"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">React to Gifts</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                disabled={!enabled}
              />
              <div className="w-11 h-6 bg-[#1a1b2e] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#8b5cf6] peer-checked:to-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.2)] opacity-50"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">React to Followers</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                disabled={!enabled}
              />
              <div className="w-11 h-6 bg-[#1a1b2e] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#8b5cf6] peer-checked:to-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.2)] opacity-50"></div>
            </label>
          </div>
        </div>
      </div>
            </div>
          </div>
      </div>
      )}
    </div>
  );
} 