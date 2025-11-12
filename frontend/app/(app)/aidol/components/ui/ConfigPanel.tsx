'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SettingsTab from './config/SettingsTab';
import GeneralTab from './config/GeneralTab';
import ChatTab from './config/ChatTab';
import MotionTab from './config/MotionTab';
import TimelineTab from './config/TimelineTab';
import TabNavigation from './config/TabNavigation';
import { ChatMessage } from '../contexts/types/VTuberTypes';

interface ConfigPanelProps {
  onBackgroundChange: (backgroundUrl: string) => void;
  onPositionChange: (x: number, y: number) => void;
  onScaleChange: (scale: number) => void;
  onSubtitleToggle?: (showSubtitles: boolean) => void;
  onPointerInteractiveChange?: (enabled: boolean) => void;
  onScrollToResizeChange?: (enabled: boolean) => void;
  currentPosition?: { x: number, y: number };
  currentScale?: number;
  isPointerInteractive?: boolean;
  isScrollToResizeEnabled?: boolean;
  isConnected: boolean;
  connectionError: string;
  backgroundError: string | null;
  clientId: string;
  messages: ChatMessage[];
}

const CONFIG_TABS = ['general', 'settings', 'motion', 'timeline'];
type ConfigTab = typeof CONFIG_TABS[number];

export default function ConfigPanel({
  onBackgroundChange,
  onPositionChange,
  onScaleChange,
  onSubtitleToggle,
  onPointerInteractiveChange,
  onScrollToResizeChange,
  currentPosition = { x: 0.5, y: 0.5 },
  currentScale = .5,
  isPointerInteractive,
  isScrollToResizeEnabled,
  isConnected,
  connectionError,
  backgroundError,
  clientId,
  messages
}: ConfigPanelProps) {
  const router = useRouter();
  // State to track if config is open or showing chat
  const [showConfig, setShowConfig] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // The active config tab when config is open
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('general');

  // This function preserves the active tab when toggling between chat and settings
  const toggleConfigView = () => {
    setShowConfig(!showConfig);
  };

  const handleTabChange = (tab: string) => {
    if (CONFIG_TABS.includes(tab as ConfigTab)) {
      setActiveConfigTab(tab as ConfigTab);
    }
  };

  return (
    <div className="h-full flex">
      <div className={`bg-[#2d2e47]/95 backdrop-blur-sm h-full overflow-hidden transition-all duration-300 border-r border-[#6366f1]/20 ${isCollapsed ? 'w-0' : 'w-full md:w-[350px]'}`}>
        {!isCollapsed && (
          <>
             <div className="p-4 border-b border-[#6366f1]/20 flex justify-between items-center bg-gradient-to-r from-[#2d2e47] to-[#3d2e5a]">
             <h2 className="text-lg md:text-xl font-bold text-white">
                {showConfig ? 'Settings' : 'Conversation'}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => router.push('/sense')}
                  className="p-2 hover:bg-[#3d3e5a]/50 transition-colors rounded-lg text-[#8b5cf6] hover:text-[#ec4899] shadow-[0_0_15px_rgba(139,92,246,0.2)] active:scale-95"
                  aria-label="Go to sense page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </button>
                <button 
                  onClick={() => router.push('/self')}
                  className="p-2 hover:bg-[#3d3e5a]/50 transition-colors rounded-lg text-[#8b5cf6] hover:text-[#ec4899] shadow-[0_0_15px_rgba(139,92,246,0.2)] active:scale-95"
                  aria-label="Go to self page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <button 
                  onClick={toggleConfigView}
                  className="p-2 hover:bg-[#3d3e5a]/50 transition-colors rounded-lg text-[#8b5cf6] hover:text-[#ec4899] shadow-[0_0_15px_rgba(139,92,246,0.2)] active:scale-95"
                  aria-label={showConfig ? "Show conversation" : "Show settings"}
                >
                  {showConfig ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {showConfig && (
              <div className="bg-gradient-to-r from-[#2d2e47] to-[#3d2e5a] border-b border-[#6366f1]/20 overflow-x-auto">
                <TabNavigation 
                  tabs={CONFIG_TABS} 
                  activeTab={activeConfigTab} 
                  onTabChange={handleTabChange} 
                />
              </div>
            )}
            
            <div className="h-[calc(100%-8rem)] overflow-y-auto custom-scrollbar bg-[#1a1b2e]/95 backdrop-blur-sm">
              <div className="p-2 md:p-4">
                {!showConfig ? (
                  <ChatTab messages={messages} />
                ) : (
                  <>
                    <div className={activeConfigTab === 'general' ? 'block' : 'hidden'}>
                      <GeneralTab
                        onBackgroundChange={onBackgroundChange}
                        onSubtitleToggle={onSubtitleToggle}
                        isConnected={isConnected}
                        backgroundError={backgroundError}
                        connectionError={connectionError}
                        clientId={clientId}
                      />
                    </div>
                    <div className={activeConfigTab === 'settings' ? 'block' : 'hidden'}>
                      <SettingsTab
                        onPositionChange={onPositionChange}
                        onScaleChange={onScaleChange}
                        currentPosition={currentPosition}
                        currentScale={currentScale}
                        onPointerInteractiveChange={onPointerInteractiveChange}
                        onScrollToResizeChange={onScrollToResizeChange}
                        isPointerInteractive={isPointerInteractive}
                        isScrollToResizeEnabled={isScrollToResizeEnabled}
                      />
                    </div>
                    <div className={activeConfigTab === 'motion' ? 'block' : 'hidden'}>
                      <MotionTab />
                    </div>
                    <div className={activeConfigTab === 'timeline' ? 'block' : 'hidden'}>
                      <TimelineTab
                        isTikTokEnabled={false}
                        onTikTokEnabledChange={() => {}}
                        tiktokUsername=""
                        onTikTokUsernameChange={() => {}}
                        tiktokAccessToken=""
                        onTikTokAccessTokenChange={() => {}}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Connection status indicator */}
            <div className="p-2 md:p-3 border-t border-[#6366f1]/20 bg-gradient-to-r from-[#2d2e47] to-[#3d2e5a]">
              <div className={`flex items-center ${isConnected ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                <div className={`h-2 w-2 md:h-3 md:w-3 rounded-full mr-2 ${isConnected ? 'bg-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-[#f87171] shadow-[0_0_10px_rgba(248,113,113,0.5)]'}`}></div>
                <span className="text-xs md:text-sm font-bold uppercase">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Toggle button for config panel */}
      <button 
         className={`p-2 md:p-3 font-bold text-white focus:outline-none transition-all duration-200 border-y border-r border-[#6366f1]/20 active:scale-95 ${
          isCollapsed 
            ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] hover:from-[#ec4899] hover:to-[#8b5cf6] shadow-[0_0_20px_rgba(139,92,246,0.4)]' 
            : 'bg-gradient-to-r from-[#2d2e47] to-[#3d2e5a] hover:from-[#3d2e5a] hover:to-[#2d2e47]'
        }`}
        onClick={() => {
          setIsCollapsed(!isCollapsed);
        }}
        aria-label={isCollapsed ? "Expand settings" : "Collapse settings"}
      >
        {isCollapsed ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </div>
  );
}

declare global {
  interface Window {
    ConfigManager?: {
      loadBaseConfig: () => void;
      getCharacters: () => { id: string; name: string; }[];
      getBackgrounds: () => string[];
      findModel: (modelName: string) => { id: string; path: string; } | null;
      onConfigEvent: (eventName: string, callback: (data: unknown) => void) => void;
    };
    appConfig?: {
      characters?: { id: string; name: string; }[];
      models?: { id: string; path: string; }[];
      backgrounds?: string[];
    };
  }
} 