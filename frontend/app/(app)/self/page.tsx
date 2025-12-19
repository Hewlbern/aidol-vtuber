'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WebSocketProvider } from '../aidol/components/contexts/WebSocketContext';
import InitConfigManager from '../aidol/InitConfigManager';
import { useModel } from '../aidol/components/contexts/ModelContext';
import { useWebSocket } from '../aidol/components/contexts/WebSocketContext';
import SettingsTab from '../aidol/components/ui/config/SettingsTab';
import GeneralTab from '../aidol/components/ui/config/GeneralTab';
import MotionTab from '../aidol/components/ui/config/MotionTab';
import TimelineTab from '../aidol/components/ui/config/TimelineTab';
import TabNavigation from '../aidol/components/ui/config/TabNavigation';
import './index.css';

const CONFIG_TABS = ['general', 'settings', 'motion', 'timeline'];
type ConfigTab = typeof CONFIG_TABS[number];

function ConfigurationContent() {
  const router = useRouter();
  const { 
    handleBackgroundChange, 
    handleScaleChange, 
    handlePositionChange,
    handleSubtitleToggle,
    handlePointerInteractiveToggle,
    handleScrollToResizeToggle,
    modelScale,
    positionState,
    isPointerInteractive,
    isScrollToResizeEnabled,
    backgroundError
  } = useModel();
  
  const { isConnected, connectionError, clientId } = useWebSocket();
  
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('general');

  const handleTabChange = (tab: string) => {
    if (CONFIG_TABS.includes(tab as ConfigTab)) {
      setActiveConfigTab(tab as ConfigTab);
    }
  };

  // Convert positionState to the format expected by SettingsTab
  const currentPosition = { x: positionState.x, y: positionState.y };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-[#6366f1]/20 bg-gradient-to-r from-[#2d2e47] to-[#3d2e5a]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/aidol')}
                className="p-2 hover:bg-[#3d3e5a]/50 transition-colors rounded-lg text-[#8b5cf6] hover:text-[#ec4899] shadow-[0_0_15px_rgba(139,92,246,0.2)] active:scale-95"
                aria-label="Close configuration and return to main view"
                title="Close Configuration"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Configuration
              </h1>
            </div>
            <div className={`flex items-center ${isConnected ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
              <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-[#f87171] shadow-[0_0_10px_rgba(248,113,113,0.5)]'}`}></div>
              <span className="text-sm font-bold uppercase">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gradient-to-r from-[#2d2e47] to-[#3d2e5a] border-b border-[#6366f1]/20 overflow-x-auto">
          <TabNavigation 
            tabs={CONFIG_TABS} 
            activeTab={activeConfigTab} 
            onTabChange={handleTabChange} 
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1a1b2e]/95 backdrop-blur-sm">
          <div className="p-4 md:p-6">
            <div className={activeConfigTab === 'general' ? 'block' : 'hidden'}>
              <GeneralTab
                onBackgroundChange={handleBackgroundChange}
                onSubtitleToggle={handleSubtitleToggle}
                isConnected={isConnected}
                backgroundError={backgroundError}
                connectionError={connectionError || ''}
                clientId={clientId}
              />
            </div>
            <div className={activeConfigTab === 'settings' ? 'block' : 'hidden'}>
              <SettingsTab
                onPositionChange={(x, y) => handlePositionChange({ x, y })}
                onScaleChange={handleScaleChange}
                currentPosition={currentPosition}
                currentScale={modelScale}
                onPointerInteractiveChange={handlePointerInteractiveToggle}
                onScrollToResizeChange={handleScrollToResizeToggle}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfigurationPage() {
  return (
    <WebSocketProvider>
      {({ isConnected, sendMessage }) => (
        <InitConfigManager 
          isConnected={isConnected} 
          sendMessage={sendMessage}
        >
          <ConfigurationContent />
        </InitConfigManager>
      )}
    </WebSocketProvider>
  );
}
