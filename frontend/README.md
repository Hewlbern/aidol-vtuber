# Frontend

This is the Next.js frontend application for the VTuber interface.

## Structure

- `app/` - Next.js app directory with routes and components
- `public/` - Static assets including Live2D models
- Configuration files for Next.js, TypeScript, ESLint, etc.

## Development

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`

## Backend Connection

The frontend connects to the backend (orphiq) via WebSocket at `ws://localhost:12393/client-ws` by default.

## Features

- Live2D character rendering and animation
- Real-time WebSocket communication
- Character expression and motion control
- Audio playback and lip-sync
- Chat interface
- Configuration management

See the main [README](../README.md) and [Twitch Livestreaming Architecture](../docs/Twitch-Livestreaming-Architecture.md) for more details.

