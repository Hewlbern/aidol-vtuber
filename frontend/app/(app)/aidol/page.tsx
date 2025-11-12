"use client"
import { WebSocketProvider } from './components/contexts/WebSocketContext';
import VTuberApp from './components/VTuberUI';
import InitConfigManager from './InitConfigManager';

export default function Home() {
  return (
    <>
      <WebSocketProvider>
        {({ isConnected, sendMessage }) => (
          <InitConfigManager 
            isConnected={isConnected} 
            sendMessage={sendMessage}
          >
            <VTuberApp />
          </InitConfigManager>
        )}
      </WebSocketProvider>
    </>
  );
}
