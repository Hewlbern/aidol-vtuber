'use client';

import { useState } from 'react';
import { ChatProvider } from './components/ChatProvider';
import { EditAgentProvider } from './components/edit/EditAgentProvider';
import { NewAgentProvider } from './components/NewAgentProvider';
import { AgentsModule } from './components/edit/AgentsModule';
import { AgentsProvider } from './components/AgentsProvider';
import { ChatHistoryProvider } from './components/chat/ChatHistoryContext';
import './index.css'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === '666') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect code. Please try again.');
      setCode('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Required</h2>
            <p className="text-gray-600">Enter the access code to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter access code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Access Content
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <ChatHistoryProvider>
      <AgentsProvider>
        <ChatProvider>
          <EditAgentProvider>
            <NewAgentProvider>
              <div className="min-h-screen">
                <AgentsModule />
              </div>
            </NewAgentProvider>
          </EditAgentProvider>
        </ChatProvider>
      </AgentsProvider>
    </ChatHistoryProvider>
  );
}
