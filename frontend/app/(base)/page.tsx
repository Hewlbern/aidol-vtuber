'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TestCharacterModal from './components/TestCharacterModal';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleAlphaTest = () => {
    router.push('/aidol');
  };

  return (
    <>
      <main className="relative min-h-screen w-full flex items-center justify-center bg-[#05070d] overflow-hidden">
        {/* Cinematic cyberpunk background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/cyberpunk-hiero.jpg"
            alt="Hiero Cyberpunk Host"
            className="w-full h-full object-cover object-center opacity-18 blur-[2px] scale-105 select-none pointer-events-none"
            style={{ filter: 'contrast(1.2) saturate(1.1) brightness(0.5)' }}
          />
          {/* High-contrast deep blue gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#05070d]/98 via-[#0a2340]/90 to-[#1870ff]/40" />
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{background: 'repeating-linear-gradient(180deg, transparent, transparent 2px, rgba(24,112,255,0.06) 3px, transparent 4px)'}}></div>
        </div>

        {/* Cinematic Title and Subtitle */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen py-32">
          {/* Fade-in animation for title */}
          <h1 className="text-[4.5rem] md:text-[8rem] font-extrabold tracking-widest text-white text-center select-none font-sans drop-shadow-[0_0_32px_#1870ff] animate-fadein" style={{letterSpacing: '0.18em', animationDelay: '0.2s', animationFillMode: 'both'}}>
            Hiero
          </h1>
          {/* Animated blue accent line */}
          <div className="w-36 md:w-72 h-1 bg-gradient-to-r from-[#33aaff] via-[#60cfff] to-[#33aaff] rounded-full mt-2 mb-6 opacity-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#33aaff] via-[#60cfff] to-[#33aaff] animate-extendline" style={{animationDelay: '0.7s', animationFillMode: 'both'}} />
          </div>
          {/* Fade-in for subtitle */}
          <div className="text-xl text-blue-100 mt-4 animate-fadein" style={{animationDelay: '0.8s', animationFillMode: 'both'}}>Create Your Character for Life</div>
          {/* Subtle "this is not a bank" text with anime slide-in */}
          <div className="text-sm text-[#60cfff]/70 italic font-light mt-2 animate-slidein" style={{animationDelay: '1.2s', animationFillMode: 'both'}}>
            not a bank account
          </div>
          {/* Test Your Character CTA Button */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fadein" style={{animationDelay: '1.5s', animationFillMode: 'both'}}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#3a8dff] to-[#60cfff] text-white font-semibold rounded-lg hover:from-[#2a7dff] hover:to-[#50bfff] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Create
            </button>
            <button
              onClick={handleAlphaTest}
              className="px-4 py-2 bg-transparent border-2 border-[#60cfff] text-[#60cfff] font-semibold rounded-lg hover:bg-[#60cfff] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Alpha Test
            </button>
          </div>
        </div>
        {/* Animation styles */}
        <style jsx>{`
          @keyframes extendline {
            from { width: 0; }
            to { width: 100%; }
          }
          .animate-extendline {
            animation: extendline 1.2s cubic-bezier(0.4,0,0.2,1) forwards;
            width: 100%;
          }
          @keyframes fadein {
            from { opacity: 0; transform: translateY(32px); }
            to { opacity: 1; transform: none; }
          }
          .animate-fadein {
            animation: fadein 1.2s cubic-bezier(0.4,0,0.2,1) forwards;
          }
          @keyframes slidein {
            from { opacity: 0; transform: translateX(-100px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-slidein {
            animation: slidein 1s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
          }
        `}</style>
      </main>
      {/* New Section: Glyphic Hiero */}
    
      {/* How does it work section - Minimal Cyberpunk Fintech Vibe */}
      <section className="w-full flex flex-col items-center justify-center py-24 bg-[#070c1a] relative overflow-hidden border-t border-[#1a2a4a]/60">
        {/* Soft blue/purple radial accent */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[70vw] h-80 bg-gradient-radial from-[#3a8dff33] via-[#1a2a4a44] to-transparent blur-2xl opacity-70 z-0" />
        <h2 className="relative z-10 text-3xl md:text-4xl font-extrabold text-white text-center mb-3 tracking-tight" style={{letterSpacing: '0.01em', fontFamily: 'Inter, system-ui, sans-serif'}}>Hosted or Local</h2>
        <p className="relative z-10 text-lg text-blue-100 text-center mb-16 max-w-2xl font-light" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>We work to set up your IP with a functioning model to sell via our commerce middleware, everywhere.</p>
        
        {/* Enhanced Image Section */}
        <div className="relative z-10 mb-16 w-full max-w-2xl">
          <div className="relative group">
            {/* Main Image Container */}
            <div className="relative overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(24,112,255,0.3)] border border-[#3a8dff]/30 backdrop-blur-sm bg-gradient-to-br from-[#0a1a2a]/80 to-[#1a2a4a]/60">
              <Image
                src="/glyphicHiero.jpeg"
                alt="Glyphic Hiero - Advanced Character System"
                width={400}
                height={300}
                className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                priority
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a2a]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Floating Info Card */}
              <div className="absolute bottom-6 left-6 right-6 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <div className="backdrop-blur-xl bg-[#0a1a2a]/90 border border-[#3a8dff]/40 rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                    <span className="text-[#3a8dff] mr-2">✨</span>
                    Glyphic Hiero
                  </h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Advanced character system with real-time expressions, motion tracking, and seamless integration capabilities.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-[#3a8dff] to-[#60cfff] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
            <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-gradient-to-br from-[#60cfff] to-[#3a8dff] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200 animate-pulse" />
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-[#3a8dff]/50 rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-[#3a8dff]/50 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-[#3a8dff]/50 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-[#3a8dff]/50 rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          
          {/* Image Caption */}
          <div className="mt-6 text-center">
            <p className="text-blue-200 text-sm font-medium tracking-wide">
              Experience the future of digital character interaction
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 mb-16">
          <button className="px-8 py-4 bg-gradient-to-r from-[#3a8dff] to-[#60cfff] text-white font-semibold rounded-lg hover:from-[#2a7dff] hover:to-[#50bfff] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
            Get Started
          </button>
          <button className="px-8 py-4 bg-transparent border-2 border-[#3a8dff] text-[#3a8dff] font-semibold rounded-lg hover:bg-[#3a8dff] hover:text-white transition-all duration-300">
            Contact Sales
          </button>
        </div>
        
        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Character Column */}
          <div className="backdrop-blur-lg bg-white/10 border border-[#3a8dff66] rounded-2xl shadow-[0_2px_24px_#1a2a4a22] p-12 flex flex-col items-start min-h-[380px] transition-transform hover:scale-[1.025] group">
            <div className="text-3xl mb-4 text-[#3a8dff]">🧑‍💻</div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Character</h3>
            <p className="text-blue-100 mb-7 font-light" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Your IP, made real in digital channels.</p>
            <ul className="space-y-3 w-full">
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">✨</span>Intuitive Interface</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">🔗</span>Integrations</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">💬</span>Chat Dashboard</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">🎥</span>Useable with OBS</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">📊</span>Analytics</li>
            </ul>
          </div>
          {/* Cloud Column */}
          <div className="backdrop-blur-lg bg-white/10 border border-[#3a8dff66] rounded-2xl shadow-[0_2px_24px_#1a2a4a22] p-12 flex flex-col items-start min-h-[380px] transition-transform hover:scale-[1.025] group">
            <div className="text-3xl mb-4 text-[#3a8dff]">☁️</div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Cloud and on-premise</h3>
            <p className="text-blue-100 mb-7 font-light" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Hosted or Local.</p>
            <ul className="space-y-3 w-full">
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">⚙️</span>Manage Settings</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">🛟</span>Support</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">📑</span>Reports</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">🌐</span>Online Usage</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">💵</span>Financials</li>
            </ul>
          </div>
          {/* Commerce Column */}
          <div className="backdrop-blur-lg bg-white/10 border border-[#3a8dff66] rounded-2xl shadow-[0_2px_24px_#1a2a4a22] p-12 flex flex-col items-start min-h-[380px] transition-transform hover:scale-[1.025] group">
            <div className="text-3xl mb-4 text-[#3a8dff]">🛒</div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Commerce</h3>
            <p className="text-blue-100 mb-7 font-light" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Affiliate selling, right from the start.</p>
            <ul className="space-y-3 w-full">
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">🚚</span>Direct Delivery</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">🔗</span>Chain to QR</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">📈</span>Impression Management</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">🎁</span>Loyalty</li>
              <li className="flex items-center text-blue-50 font-light"><span className="mr-3 text-lg">📣</span>Marketing & CRM</li>
            </ul>
          </div>
        </div>
      </section>
      
      {/* Test Character Modal */}
      <TestCharacterModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
