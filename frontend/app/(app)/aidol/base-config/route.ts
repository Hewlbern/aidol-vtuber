import { NextResponse } from 'next/server';

// Define types for our configuration
interface Character {
  id: string;
  name: string;
  modelName: string;
}

export async function GET() {
  // Default characters if we can't connect to the backend
  const defaultCharacters: Character[] = [
    {
      id: 'haru',
      name: 'Haru',
      modelName: 'haru_greeter_t03'
    },
    {
      id: 'shizuku',
      name: 'Shizuku',
      modelName: 'shizuku'
    }
  ];

  // Default backgrounds
  const defaultBackgrounds: string[] = [
    '/backgrounds/default.jpg',
    '/backgrounds/classroom.jpg',
    '/backgrounds/beach.jpg'
  ];

  // Try to fetch from the backend server first
  try {
    // Attempt to connect to the backend server
    const response = await fetch('http://localhost:12393/config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Short timeout to prevent long waiting if server is down
      signal: AbortSignal.timeout(2000)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Fetched config from backend:', data);
      return NextResponse.json(data);
    } else {
      console.warn('Backend server returned error, using default config');
    }
  } catch (error) {
    console.warn('Failed to connect to backend server, using default config:', error);
  }

  // Return default config if backend is unavailable
  return NextResponse.json({
    characters: defaultCharacters,
    backgrounds: defaultBackgrounds
  });
} 