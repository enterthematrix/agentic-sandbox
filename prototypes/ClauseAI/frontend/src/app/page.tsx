'use client';

import { useState } from 'react';
import NDAForm from '@/components/NDAForm';
import DocumentTypeSelector from '@/components/DocumentTypeSelector';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';
import type { SessionResponse } from '@/lib/api';

type View = 'dashboard' | 'editor';

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [view, setView] = useState<View>('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('Mutual-NDA.md');
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);

  const handleLogin = (uid: string, uname: string) => {
    setUserId(uid);
    setUsername(uname);
  };

  const handleLogout = () => {
    setUserId(null);
    setUsername('');
    setView('dashboard');
    setSelectedSession(null);
  };

  const handleNewDocument = () => {
    setSelectedSession(null);
    setSelectedTemplate('Mutual-NDA.md');
    setView('editor');
  };

  const handleSelectSession = (session: SessionResponse) => {
    setSelectedSession(session);
    setSelectedTemplate(session.document_type);
    setView('editor');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSelectedSession(null);
  };

  if (!userId) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <main>
      <header className="bg-[var(--deep-navy)] text-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">ClauseAI</h1>
              <p className="text-sm opacity-80 mt-1">AI-powered legal document assistant</p>
            </div>
            {view === 'editor' && (
              <button
                onClick={handleBackToDashboard}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {view === 'dashboard' ? (
          <Dashboard
            userId={userId}
            username={username}
            onSelectSession={handleSelectSession}
            onNewDocument={handleNewDocument}
            onLogout={handleLogout}
          />
        ) : (
          <>
            <DocumentTypeSelector value={selectedTemplate} onChange={setSelectedTemplate} />
            <NDAForm
              documentType={selectedTemplate}
              userId={userId}
              initialSession={selectedSession}
            />
          </>
        )}
      </div>

      <footer className="mt-16 py-6 border-t border-[var(--stroke)] text-center text-sm text-[var(--slate-gray)]">
        ClauseAI | Templates licensed under CC BY 4.0 from CommonPaper
      </footer>
    </main>
  );
}
