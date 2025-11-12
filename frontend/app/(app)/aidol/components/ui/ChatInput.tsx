'use client';

import React from 'react';
import { useModel } from '../contexts/ModelContext';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isRecording: boolean;
  onMicrophoneToggle: () => void;
}

export default function ChatInput({ onSendMessage, isRecording, onMicrophoneToggle }: ChatInputProps) {
  const { isSpeaking } = useModel();

  return (
    <div className="p-2 md:p-4">
      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.querySelector('input') as HTMLInputElement;
        if (input && input.value.trim()) {
          onSendMessage(input.value);
          input.value = '';
        }
      }} className="flex items-center gap-2 md:gap-3">
        {/* Chat Input */}
        <div className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="Enter your message..."
            className="w-full p-2 md:p-3 pr-10 md:pr-12 bg-[#2d2e47]/90 text-white rounded-lg border-2 border-[#8b5cf6] focus:ring-2 focus:ring-[#ec4899] focus:border-transparent placeholder-[#6366f1]/50 shadow-[0_0_20px_rgba(139,92,246,0.3)] backdrop-blur-sm text-sm md:text-base"
          />
          <button 
            type="button" 
            className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-[#8b5cf6] hover:text-[#ec4899] transition-colors duration-300 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Send Button */}
        <button 
          type="submit" 
          className="bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white p-2 md:p-3 rounded-lg font-medium hover:from-[#ec4899] hover:to-[#8b5cf6] transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.4)] transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Status and Microphone Controls */}
        <div className="flex items-center gap-1">
          {/* Status Indicator */}
          <div className={`px-2 py-1 font-bold text-xs uppercase rounded-lg transition-all duration-300 ${
            isSpeaking 
              ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]' 
              : isRecording 
                ? 'bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white animate-pulse shadow-[0_0_20px_rgba(236,72,153,0.4)]' 
                : 'bg-[#2d2e47]/90 text-[#6366f1] shadow-[0_0_15px_rgba(99,102,241,0.2)] backdrop-blur-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-[#2d2e47]'
          }`}>
            {isSpeaking ? 'talking' : isRecording ? 'recording' : 'idle'}
          </div>

          {/* Microphone Button */}
          <button
            type="button"
            onClick={onMicrophoneToggle}
            disabled={isSpeaking}
            className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              isRecording 
                ? 'bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]' 
                : isSpeaking
                  ? 'bg-[#2d2e47]/50 text-[#6366f1]/50 cursor-not-allowed'
                  : 'bg-[#2d2e47]/90 text-[#6366f1] shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] backdrop-blur-sm'
            }`}
            aria-label="Toggle microphone"
          >
            {isSpeaking ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 