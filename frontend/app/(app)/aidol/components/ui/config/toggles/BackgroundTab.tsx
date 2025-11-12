'use client';

import { useState, useEffect } from 'react';
import { useModel } from '../../../contexts/ModelContext';

interface Background {
  name: string;
  path: string;
}

const formatBackgroundName = (path: string): string => {
  const fileName = path.split('/').pop() || '';
  return fileName
    .replace(/\.(jpeg|jpg|png)$/i, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const DEFAULT_BACKGROUNDS: Background[] = [
  { name: 'Night City View', path: '/backgrounds/ceiling-window-room-night.jpeg' },
  { name: 'Classroom', path: '/backgrounds/lernado-diff-classroom-center.jpeg' },
  { name: 'Computer Room', path: '/backgrounds/computer-room-illustration.jpeg' },
  { name: 'Cityscape', path: '/backgrounds/cityscape.jpeg' },
  { name: 'Night Scene', path: '/backgrounds/night-scene-cartoon-moon.jpeg' },
  { name: 'Mountain Range', path: '/backgrounds/mountain-range-illustration.jpeg' }
];

export default function BackgroundTab() {
  const { handleBackgroundChange, backgroundPath } = useModel();
  const [backgrounds, setBackgrounds] = useState<Background[]>(DEFAULT_BACKGROUNDS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBackgrounds();
  }, []);

  const loadBackgrounds = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let backgroundList: Background[] = [];
      
      // Try to load from window.appConfig first
      if (window.appConfig && window.appConfig.backgrounds) {
        backgroundList = window.appConfig.backgrounds.map(path => ({
          name: formatBackgroundName(path),
          path
        }));
      }
      
      // If no backgrounds loaded, use defaults
      if (backgroundList.length === 0) {
        backgroundList = DEFAULT_BACKGROUNDS;
      }
      
      setBackgrounds(backgroundList);
      
      // If no background is currently set, set the default
      if (!backgroundPath) {
        handleBackgroundChange(DEFAULT_BACKGROUNDS[0].path);
      }
    } catch (err) {
      console.error('Error loading backgrounds:', err);
      setError(err instanceof Error ? err.message : 'Unknown error loading backgrounds');
      // On error, fall back to defaults
      setBackgrounds(DEFAULT_BACKGROUNDS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackgroundSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const backgroundUrl = e.target.value;
    handleBackgroundChange(backgroundUrl);
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Select Background</label>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <span>Loading backgrounds...</span>
          </div>
        ) : (
          <select 
            className="w-full p-2 border rounded bg-white dark:bg-gray-700"
            onChange={handleBackgroundSelect}
          >
            <option value="">None</option>
            {backgrounds.map((bg, index) => (
              <option key={index} value={bg.path}>
                {bg.name}
              </option>
            ))}
          </select>
        )}
        
        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
      </div>
      
      <button 
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={loadBackgrounds}
        disabled={isLoading}
      >
        Refresh Backgrounds
      </button>
    </div>
  );
} 