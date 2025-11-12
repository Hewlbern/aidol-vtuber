import { useChatWindow } from './ChatProvider';
import type { MouseEvent } from 'react';

export function ExampleModule() {
  const { openChat } = useChatWindow();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    openChat();
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Module Title</h2>
      {/* Your module content */}
      <button
        onClick={handleClick}
        className="bg-[#7500FF] text-white px-4 py-2 rounded-full hover:bg-[#7500FF]/90 transition-colors"
      >
        Chat Now
      </button>
    </div>
  );
} 