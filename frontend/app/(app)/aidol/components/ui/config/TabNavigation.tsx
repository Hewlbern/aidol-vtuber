'use client';

import React, { useRef, useEffect, useState } from 'react';

// Add type declaration for window.scrollTimeout
declare global {
  interface Window {
    scrollTimeout?: NodeJS.Timeout;
  }
}

interface TabNavigationProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Map of tab IDs to display names and icons
const TAB_DISPLAY = {
  general: {
    label: 'General',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    )
  },
  settings: {
    label: 'Settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    )
  },
  motion: {
    label: 'Motion',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
      </svg>
    )
  },
  timeline: {
    label: 'Timeline',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    )
  }
};

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Check if scrolling is needed and update scroll indicators
  const checkScroll = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
    }
  };

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const activeTab = activeTabRef.current;
      
      // Calculate if the active tab is outside the visible area
      const containerRect = container.getBoundingClientRect();
      const activeTabRect = activeTab.getBoundingClientRect();
      
      // Check if the active tab is outside the visible area
      if (
        activeTabRect.left < containerRect.left ||
        activeTabRect.right > containerRect.right
      ) {
        // Scroll the active tab into view with smooth animation
        activeTab.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTab]);

  // Add scroll event listener
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      const handleScroll = () => {
        setIsScrolling(true);
        checkScroll();
        clearTimeout(window.scrollTimeout);
        window.scrollTimeout = setTimeout(() => setIsScrolling(false), 150);
      };

      container.addEventListener('scroll', handleScroll);
      // Initial check
      checkScroll();
      
      // Check on resize
      window.addEventListener('resize', checkScroll);
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  // Handle scroll buttons
  const scrollLeft = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      {/* Left scroll button - only visible when there's content to scroll */}
      {showLeftScroll && (
        <button 
          onClick={scrollLeft}
          className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#2d2e47] to-transparent z-10 flex items-center justify-center text-[#8b5cf6] hover:text-[#ec4899] transition-colors"
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      
      {/* Right scroll button - only visible when there's content to scroll */}
      {showRightScroll && (
        <button 
          onClick={scrollRight}
          className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#2d2e47] to-transparent z-10 flex items-center justify-center text-[#8b5cf6] hover:text-[#ec4899] transition-colors"
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      
      {/* Tabs container with horizontal scrolling */}
      <div 
        ref={tabsContainerRef}
        className={`flex overflow-x-auto py-2 px-2 gap-2 snap-x snap-mandatory hide-scrollbar transition-opacity duration-200 ${isScrolling ? 'opacity-50' : 'opacity-100'}`}
        style={{ 
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {tabs.map((tab) => {
          const display = TAB_DISPLAY[tab as keyof typeof TAB_DISPLAY] || { label: tab, icon: null };
          return (
            <button
              key={tab}
              ref={activeTab === tab ? activeTabRef : null}
              className={`group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap snap-start ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'text-[#8b5cf6] hover:bg-[#3d3e5a]/50 hover:text-[#ec4899]'
              }`}
              onClick={() => onTabChange(tab)}
            >
              {display.icon && (
                <span className={`transition-transform duration-200 ${activeTab === tab ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {display.icon}
                </span>
              )}
              <span className="capitalize">{display.label}</span>
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.4)]"></span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Add global styles for hiding scrollbars */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
} 