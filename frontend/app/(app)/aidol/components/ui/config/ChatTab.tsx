'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage } from '../../contexts/types/VTuberTypes';

interface ChatTabProps {
  messages: ChatMessage[];
}

export default function ChatTab({ messages }: ChatTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Get the most recent messages (limit to last 15 for performance)
  const recentMessages = messages.slice(-15);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {recentMessages.length === 0 ? (
         <div className="flex items-center justify-center h-full bg-[#2d2e47]/80 rounded-lg p-4 m-2 border border-[#6366f1]/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
            <p className="text-[#8b5cf6] font-medium">No messages yet. Start a conversation below!</p>
          </div>
        ) : (
          <div className="space-y-4 p-2">
            {recentMessages.map((msg, index) => {
              return (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-3/4 px-4 py-3 rounded-lg backdrop-blur-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
                      : 'bg-[#2d2e47]/90 text-white shadow-[0_0_20px_rgba(45,46,71,0.3)] border border-[#6366f1]/20'
                  }`}>
                    <div className="flex items-center mb-1">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        msg.role === 'user' 
                          ? 'bg-[#ec4899]/20 text-white backdrop-blur-sm' 
                          : 'bg-[#6366f1]/20 text-[#8b5cf6] backdrop-blur-sm'
                      }`}>
                        {msg.role === 'user' ? 'You' : 'AI'}
                      </span>
                    </div>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
} 