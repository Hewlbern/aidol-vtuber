'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IslandTestModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [showHint, setShowHint] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === 'PALA') {
      router.push('/aidol');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl mx-4 p-8 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl border border-pink-500/30 shadow-[0_0_50px_rgba(255,105,180,0.3)]">
        {/* Surreal floating elements */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[rotate_100s_linear_infinite] opacity-20 pointer-events-none">
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-[#ff69b4] blur-[150px]"></div>
          <div className="absolute top-[60%] left-[60%] w-[400px] h-[400px] rounded-full bg-[#0066ff] blur-[150px]"></div>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#ff69b4] to-[#0066ff]">
            The Island Test
          </h2>
          
          <div className="mb-8 space-y-4">
            <p className="text-pink-200">
              &quot;In the island of Pala, perception is reality. Look beyond the obvious...&quot;
            </p>
            
            {/* Muller-Lyer like test */}
            <div className="grid grid-cols-5 gap-4 my-8">
              {['P', 'A', 'L', 'A', '?'].map((letter, index) => (
                <div key={index} className="relative">
                  <div className="w-full h-2 bg-gradient-to-r from-[#ff69b4] to-[#0066ff] mb-2"></div>
                  <div className="w-full h-2 bg-gradient-to-r from-[#0066ff] to-[#ff69b4]"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
                    {letter}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="w-full h-2 bg-gradient-to-r from-[#ff69b4] to-[#0066ff] mb-2 transform rotate-45"></div>
              <div className="w-full h-2 bg-gradient-to-r from-[#0066ff] to-[#ff69b4] transform -rotate-45"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 bg-black/50 border border-pink-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Enter the code..."
              maxLength={4}
            />
            
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-pink-300 hover:text-pink-400 transition-colors"
              >
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
              
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-[#ff69b4] to-[#0066ff] text-white rounded-lg hover:shadow-[0_0_20px_#ff69b4] transition-all duration-300"
              >
                Submit
              </button>
            </div>

            {showHint && (
              <div className="mt-4 p-4 bg-black/30 rounded-lg border border-pink-500/30">
                <p className="text-pink-200">
                  &quot;The answer lies in the intersection of perception and reality. Look at the angles...&quot;
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 