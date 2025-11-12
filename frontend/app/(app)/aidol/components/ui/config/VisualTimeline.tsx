import React, { useRef, useState, useEffect } from 'react';
import { useModel } from '../../contexts/ModelContext';

interface TimelineEvent {
  id: string;
  time: number;
  type: 'text' | 'expression' | 'motion' | 'action';
  content: string;
  motionGroup?: string;
  motionIndex?: number;
}

interface VisualTimelineProps {
  events: TimelineEvent[];
  selectedTime: number;
  onTimeSelect: (time: number) => void;
  onEventHover: (id: string | null) => void;
  hoveredEvent: string | null;
  duration: number;
  pixelsPerSecond: number;
  eventColors: {
    [key: string]: {
      bg: string;
      border: string;
      hover: string;
      ring: string;
    };
  };
  onAddEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  onUpdateEventTime: (eventId: string, newTime: number) => void;
  onClearAll: () => void;
  isPlaying: boolean;
}

export const VisualTimeline: React.FC<VisualTimelineProps> = ({
  events,
  selectedTime,
  onTimeSelect,
  onEventHover,
  hoveredEvent,
  duration,
  pixelsPerSecond,
  eventColors,
  onAddEvent,
  onUpdateEventTime,
  onClearAll,
  isPlaying,
}) => {
  const { handleModelExpression, characterHandler } = useModel();
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [newEventContent, setNewEventContent] = useState('');
  const [selectedMotionGroup, setSelectedMotionGroup] = useState<string>('');
  const [selectedMotionIndex, setSelectedMotionIndex] = useState<number>(0);
  const [showMotionMenu, setShowMotionMenu] = useState(false);
  const [motionMenuPosition, setMotionMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedEventType, setSelectedEventType] = useState<'text' | 'motion' | 'expression'>('text');
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 2 = 200%, etc.
  // const [scrollPosition, setScrollPosition] = useState(0);

  // Calculate zoomed pixels per second
  const zoomedPixelsPerSecond = pixelsPerSecond * zoomLevel;

  // Add effect to handle auto-scrolling during playback
  useEffect(() => {
    if (isPlaying && timelineRef.current) {
      const currentPosition = selectedTime * pixelsPerSecond;
      const containerWidth = timelineRef.current.clientWidth;
      const scrollTarget = currentPosition - (containerWidth / 2);
      
      // Smooth scroll to keep current time centered
      timelineRef.current.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: 'smooth'
      });
    }
  }, [selectedTime, isPlaying, pixelsPerSecond]);

  // Update scroll position when zooming
  useEffect(() => {
    if (timelineRef.current) {
      const currentPosition = selectedTime * pixelsPerSecond;
      const containerWidth = timelineRef.current.clientWidth;
      const scrollTarget = currentPosition - (containerWidth / 2);
      
      timelineRef.current.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: 'smooth'
      });
    }
  }, [zoomLevel, pixelsPerSecond, selectedTime]);

  // Handle zoom in
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4)); // Max zoom 400%
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.25)); // Min zoom 25%
  };

  // Get available motion groups
  const motionGroups = ['idle', 'tap_body', 'tap_head', 'pinch_in', 'pinch_out', 'shake', 'flick_head'];
  const expressions = [
    { id: 0, name: 'Default' },
    { id: 1, name: 'Wink' },
    { id: 2, name: 'Cute Frown' },
    { id: 3, name: 'Laugh Smile' }
  ];

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return; // Disable timeline interaction during playback
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    const time = (x / pixelsPerSecond);
    onTimeSelect(Math.max(0, Math.min(duration, Number(time.toFixed(2)))));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return; // Disable timeline interaction during playback
    if (!timelineRef.current) return;
    
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartTime(selectedTime);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !timelineRef.current) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaTime = deltaX / pixelsPerSecond;
    const newTime = Math.max(0, Math.min(duration, dragStartTime + deltaTime));
    onTimeSelect(Number(newTime.toFixed(2)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleAddEvent = () => {
    if (selectedEventType === 'motion' && selectedMotionGroup) {
      onAddEvent({
        time: selectedTime,
        type: 'motion',
        content: `${selectedMotionGroup} - Motion ${selectedMotionIndex + 1}`,
        motionGroup: selectedMotionGroup,
        motionIndex: selectedMotionIndex
      });
      setSelectedMotionGroup('');
      setSelectedMotionIndex(0);
    } else if (selectedEventType === 'expression' && selectedMotionGroup) {
      onAddEvent({
        time: selectedTime,
        type: 'expression',
        content: selectedMotionGroup,
        motionGroup: selectedMotionGroup
      });
      setSelectedMotionGroup('');
    } else if (selectedEventType === 'text' && newEventContent.trim()) {
      onAddEvent({
        time: selectedTime,
        type: 'text',
        content: newEventContent
      });
      setNewEventContent('');
    }
  };

  const handleTimelineContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    const time = (x / pixelsPerSecond);
    const selectedTime = Math.max(0, Math.min(duration, Number(time.toFixed(2))));
    
    setMotionMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMotionMenu(true);
    onTimeSelect(selectedTime);
  };

  const handleAddMotionAtTime = (motionGroup: string, index: number) => {
    onAddEvent({
      time: selectedTime,
      type: 'motion',
      content: `${motionGroup} - Motion ${index + 1}`,
      motionGroup,
      motionIndex: index
    });
    setShowMotionMenu(false);
  };

  // Handle expression click
  const handleExpressionClick = (expressionId: number) => {
    if (!characterHandler) {
      console.warn('[VisualTimeline] Character handler not available');
      return;
    }

    // Play the expression
    handleModelExpression({
      expressionId: expressionId,
      duration: 2000 // 2 seconds duration
    });

    // Set the selected motion group for the timeline
    const expression = expressions.find(exp => exp.id === expressionId);
    if (expression) {
      setSelectedMotionGroup(expression.name.toLowerCase());
    }
  };

  const handleEventDragStart = (e: React.MouseEvent<HTMLDivElement>, eventId: string, currentTime: number) => {
    if (isPlaying) return; // Disable event dragging during playback
    e.stopPropagation();
    setIsDragging(true);
    setDraggedEventId(eventId);
    setDragStartX(e.clientX);
    setDragStartTime(currentTime);
  };

  const handleEventDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !draggedEventId || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    const newTime = Math.max(0, Math.min(duration, x / pixelsPerSecond));
    
    // Update the event time
    onUpdateEventTime(draggedEventId, Number(newTime.toFixed(2)));
  };

  const handleEventDragEnd = () => {
    setIsDragging(false);
    setDraggedEventId(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEventDragEnd();
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
        const newTime = Math.max(0, Math.min(duration, x / pixelsPerSecond));
        
        // Update the event time
        if (draggedEventId) {
          onUpdateEventTime(draggedEventId, Number(newTime.toFixed(2)));
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, draggedEventId, duration, pixelsPerSecond, onUpdateEventTime]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalClick = (e: MouseEvent) => {
      if (showMotionMenu && !(e.target as Element).closest('.motion-menu')) {
        setShowMotionMenu(false);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [showMotionMenu]);

  return (
    <div className="space-y-2">
      {/* Event Input */}
      <div className="space-y-1">
        {/* Event Type Toggles */}
        <div className={`flex gap-1 p-0.5 bg-[#1a1b2e] rounded-lg border border-[#6366f1]/20 ${isPlaying ? 'opacity-50 pointer-events-none' : ''}`}>
          <button
            onClick={() => {
              setSelectedEventType('text');
              setSelectedMotionGroup('');
              setNewEventContent('');
            }}
            className={`flex-1 px-2 py-0.5 rounded-md transition-all duration-200 text-sm ${
              selectedEventType === 'text'
                ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-[#2d2e47]'
            }`}
            title="Text Event"
          >
            ✍️
          </button>
          <button
            onClick={() => {
              setSelectedEventType('motion');
              setSelectedMotionGroup('');
              setNewEventContent('');
            }}
            className={`flex-1 px-2 py-0.5 rounded-md transition-all duration-200 text-sm ${
              selectedEventType === 'motion'
                ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-[#2d2e47]'
            }`}
            title="Motion Event"
          >
            💃
          </button>
          <button
            onClick={() => {
              setSelectedEventType('expression');
              setSelectedMotionGroup('');
              setNewEventContent('');
            }}
            className={`flex-1 px-2 py-0.5 rounded-md transition-all duration-200 text-sm ${
              selectedEventType === 'expression'
                ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-[#2d2e47]'
            }`}
            title="Expression Event"
          >
            😊
          </button>
        </div>

        {/* Clear All Button */}
        {events.length > 0 && (
          <button
            onClick={onClearAll}
            disabled={isPlaying}
            className={`w-full px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] transform hover:scale-105 text-xs flex items-center justify-center gap-1 ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Clear All Events
          </button>
        )}

        {/* Event Input Fields */}
        <div className={`flex flex-col gap-1 ${isPlaying ? 'opacity-50 pointer-events-none' : ''}`}>
          {selectedEventType === 'text' && (
            <div className="flex flex-col gap-1">
              <textarea
                value={newEventContent}
                onChange={(e) => setNewEventContent(e.target.value)}
                placeholder="Enter text content..."
                className="w-full p-1.5 min-h-[40px] bg-[#2d2e47] text-white rounded-lg border border-[#6366f1]/20 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/50 transition-all duration-200 text-sm resize-y"
              />
              <button
                onClick={handleAddEvent}
                disabled={!newEventContent.trim()}
                className="w-full px-2 py-1 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white rounded-lg hover:from-[#ec4899] hover:to-[#8b5cf6] transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none text-xs"
              >
                Add
              </button>
            </div>
          )}

          {selectedEventType === 'motion' && (
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                <select
                  value={selectedMotionGroup}
                  onChange={(e) => {
                    setSelectedMotionGroup(e.target.value);
                    setSelectedMotionIndex(0);
                  }}
                  className="flex-1 p-1 bg-[#2d2e47] text-white rounded-lg border border-[#6366f1]/20 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/50 transition-all duration-200 text-sm"
                >
                  <option value="">Select Motion Group</option>
                  {motionGroups.map((group) => (
                    <option key={group} value={group} className="py-0.5">{group}</option>
                  ))}
                </select>
              </div>
              {selectedMotionGroup && motionGroups.includes(selectedMotionGroup) && (
                <div className="flex gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedMotionIndex(i)}
                      className={`flex-1 px-2 py-0.5 rounded-lg transition-all duration-200 text-xs ${
                        selectedMotionIndex === i
                          ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                          : 'bg-[#2d2e47] text-gray-400 hover:text-white border border-[#6366f1]/20'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={handleAddEvent}
                disabled={!selectedMotionGroup}
                className="w-full px-2 py-1 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white rounded-lg hover:from-[#ec4899] hover:to-[#8b5cf6] transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none text-xs"
              >
                Add
              </button>
            </div>
          )}

          {selectedEventType === 'expression' && (
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-2 gap-1">
                {expressions.map((expression) => (
                  <button
                    key={expression.id}
                    onClick={() => handleExpressionClick(expression.id)}
                    className={`p-1 rounded-lg transition-all duration-200 text-xs ${
                      selectedMotionGroup === expression.name.toLowerCase()
                        ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                        : 'bg-[#2d2e47] text-gray-400 hover:text-white border border-[#6366f1]/20'
                    }`}
                  >
                    {expression.name}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddEvent}
                disabled={!selectedMotionGroup}
                className="w-full px-2 py-1 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white rounded-lg hover:from-[#ec4899] hover:to-[#8b5cf6] transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none text-xs"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Visualization */}
      <div 
        ref={containerRef}
        className={`relative h-48 bg-[#1a1b2e] rounded-lg overflow-x-auto overflow-y-hidden custom-scrollbar border border-[#6366f1]/20 shadow-lg ${isPlaying ? 'cursor-default' : ''}`}
      >
        {/* Zoom Controls */}
        <div className="absolute bottom-1 right-1 flex items-center gap-0.5 z-20">
          <button
            onClick={handleZoomOut}
            className="w-5 h-5 flex items-center justify-center bg-[#2d2e47]/80 text-white rounded-lg border border-[#6366f1]/20 hover:bg-[#3d3e5a] transition-colors text-xs"
            title="Zoom Out"
          >
            -
          </button>
          <button
            onClick={handleZoomIn}
            className="w-5 h-5 flex items-center justify-center bg-[#2d2e47]/80 text-white rounded-lg border border-[#6366f1]/20 hover:bg-[#3d3e5a] transition-colors text-xs"
            title="Zoom In"
          >
            +
          </button>
        </div>

        <div 
          ref={timelineRef}
          onClick={handleTimelineClick}
          onContextMenu={handleTimelineContextMenu}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`absolute inset-0 cursor-pointer ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isPlaying ? 'pointer-events-none' : ''}`}
          style={{ width: `${duration * zoomedPixelsPerSecond}px` }}
        >
          {/* Timeline background with markers */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: duration * 2 + 1 }).map((_, i) => {
              const time = i * 0.5; // Show markers every 0.5 seconds
              const isWholeNumber = time % 1 === 0;
              return (
                <div key={i} className="relative" style={{ width: `${zoomedPixelsPerSecond * 0.5}px` }}>
                  <div className="absolute left-0 top-0 w-px h-full bg-[#6366f1]/20"></div>
                  {/* Time markers at the bottom */}
                  <div className="absolute bottom-0 left-0 w-full flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-px ${isWholeNumber ? 'h-4 bg-[#6366f1]/40' : 'h-3 bg-[#6366f1]/20'}`}></div>
                      {isWholeNumber && (
                        <div className="text-xs font-medium text-[#6366f1] mt-1 bg-[#1a1b2e]/80 px-1 rounded">
                          {time.toFixed(0)}s
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Quarter-second markers */}
                  {i < duration * 2 && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <div className="w-px h-2 bg-[#6366f1]/10"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Events */}
          {events.map((event, index) => (
            <React.Fragment key={event.id}>
              {/* Connecting line */}
              {index < events.length - 1 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#6366f1]/40 to-[#8b5cf6]/40"
                  style={{
                    left: `${event.time * zoomedPixelsPerSecond}px`,
                    width: `${(events[index + 1].time - event.time) * zoomedPixelsPerSecond}px`,
                    zIndex: 0
                  }}
                />
              )}
              {/* Event dot */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 ${eventColors[event.type].bg} ${eventColors[event.type].border} border-2 w-4 h-4 rounded-full cursor-move ${eventColors[event.type].hover} transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-150 hover:ring-4 ${eventColors[event.type].ring} z-10 ${draggedEventId === event.id ? 'ring-4 ring-white/50' : ''}`}
                style={{ left: `${event.time * zoomedPixelsPerSecond}px` }}
                onMouseEnter={() => onEventHover(event.id)}
                onMouseLeave={() => onEventHover(null)}
                onMouseDown={(e) => handleEventDragStart(e, event.id, event.time)}
                onMouseMove={handleEventDrag}
                onMouseUp={handleEventDragEnd}
              >
                {hoveredEvent === event.id && (
                  <div className="absolute -top-8 left-0 bg-[#2d2e47] text-white px-2 py-1 rounded-lg shadow-lg border border-[#6366f1]/20 min-w-[150px] text-xs">
                    <div className="font-medium text-[#8b5cf6]">{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</div>
                    <div className="text-gray-300">{event.content}</div>
                    <div className="text-[#6366f1] mt-1">Time: {event.time.toFixed(2)}s</div>
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}

          {/* Current time indicator */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8b5cf6] to-[#6366f1] shadow-[0_0_15px_rgba(139,92,246,0.7)]"
            style={{ 
              left: `${selectedTime * zoomedPixelsPerSecond}px`,
              transition: isPlaying ? 'none' : 'left 0.1s ease-out'
            }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-[#8b5cf6]"></div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-[#6366f1]"></div>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-3 h-3 bg-white rounded-full border-2 border-[#8b5cf6] shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
          </div>

          {/* Time display */}
          <div 
            className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#2d2e47] px-2 py-0.5 rounded-lg border border-[#6366f1]/20 shadow-lg text-xs"
            style={{ 
              left: `${selectedTime * zoomedPixelsPerSecond}px`,
              transition: isPlaying ? 'none' : 'left 0.1s ease-out'
            }}
          >
            <span className="font-medium text-[#8b5cf6]">{selectedTime.toFixed(2)}s</span>
          </div>
        </div>
      </div>

      {/* Motion Menu */}
      {showMotionMenu && (
        <div 
          className="fixed motion-menu bg-[#2d2e47] rounded-lg border border-[#6366f1]/20 shadow-lg p-2 z-50"
          style={{ 
            left: motionMenuPosition.x,
            top: motionMenuPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="text-sm font-medium text-[#8b5cf6] mb-2">Add Motion at {selectedTime.toFixed(2)}s</div>
          <div className="space-y-1">
            {motionGroups.map((group) => (
              <div key={group} className="space-y-1">
                <div className="text-xs text-gray-400 px-2">{group}</div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddMotionAtTime(group, i)}
                    className="w-full text-left px-3 py-1 text-sm text-white hover:bg-[#6366f1]/20 rounded transition-colors"
                  >
                    Motion {i + 1}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 