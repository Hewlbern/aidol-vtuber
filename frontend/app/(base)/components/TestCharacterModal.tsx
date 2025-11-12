'use client';
import { useState } from 'react';

interface TestCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestCharacterModal({ isOpen, onClose }: TestCharacterModalProps) {
  const [step, setStep] = useState(1);
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileNumber.trim()) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setStep(2);
      }, 1000);
    }
  };

  const handleClose = () => {
    setStep(1);
    setMobileNumber('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 border border-[#e5e7eb] flex flex-col items-center">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#60cfff] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Headline */}
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2 mt-2 tracking-tight">Alpha - Test Your Character</h2>
        {/* Subtitle */}
        <div className="text-base text-gray-700 text-center mb-6">Scan the QR code to test your character</div>
        {/* QR Code (centered) */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-center">
            {/* Replace with real QR code if available */}
            <svg className="w-40 h-40 text-gray-400" viewBox="0 0 160 160" fill="none"><rect width="160" height="160" rx="16" fill="#e5e7eb"/><text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="20" fill="#a1a1aa">QR</text></svg>
          </div>
        </div>
        {/* Or get a download link via SMS */}
        <div className="text-sm text-gray-500 text-center mb-4">or get a test link via SMS</div>
        {/* Phone input pill */}
        <form onSubmit={handleMobileSubmit} className="flex items-center w-full justify-center mb-2">
          <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 mr-2">
            <span className="w-6 h-6 rounded-full overflow-hidden mr-1 flex items-center justify-center"><img src="https://purecatamphetamine.github.io/country-flag-icons/3x2/US.svg" alt="US" className="w-5 h-5" /></span>
            <span className="text-gray-700 text-base font-medium">+1</span>
          </div>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Mobile number"
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#60cfff] text-base border-none"
            required
            style={{minWidth: '120px'}}
          />
          <button
            type="submit"
            disabled={isLoading || !mobileNumber.trim()}
            className="ml-2 bg-[#60cfff] hover:bg-[#3a8dff] text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
            aria-label="Continue"
          >
            {isLoading ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            )}
          </button>
        </form>
        {/* Step 2: Confirmation (optional, can be improved) */}
        {step === 2 && (
          <div className="w-full text-center mt-4">
            <div className="text-sm text-gray-600 mb-2">Link sent to: <span className="font-medium">{mobileNumber}</span></div>
            <button
              onClick={() => setStep(1)}
              className="text-[#60cfff] hover:text-[#3a8dff] text-xs mt-2 underline"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 