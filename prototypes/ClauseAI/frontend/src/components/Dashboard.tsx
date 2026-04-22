'use client';

import { useEffect, useState } from 'react';
import type { SessionResponse } from '@/lib/api';

interface DashboardProps {
  userId: string;
  username: string;
  onSelectSession: (session: SessionResponse) => void;
  onNewDocument: () => void;
  onLogout: () => void;
}

export default function Dashboard({ userId, username, onSelectSession, onNewDocument, onLogout }: DashboardProps) {
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/users/${userId}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(sessionId);
    try {
      const res = await fetch(`http://localhost:8000/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-[var(--stroke)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--deep-navy)]">My Documents</h2>
          <p className="text-sm text-[var(--slate-gray)] mt-1">Welcome back, {username}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onNewDocument}
            className="px-6 py-2 bg-[var(--steel-blue)] text-white font-medium rounded-lg hover:bg-[var(--deep-navy)] transition-colors"
          >
            New Document
          </button>
          <button
            onClick={onLogout}
            className="px-6 py-2 border border-[var(--stroke)] text-[var(--slate-gray)] font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--slate-gray)]">
          Loading your documents...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--slate-gray)] mb-4">You haven't created any documents yet.</p>
          <button
            onClick={onNewDocument}
            className="px-6 py-3 bg-[var(--steel-blue)] text-white font-medium rounded-lg hover:bg-[var(--deep-navy)] transition-colors"
          >
            Create Your First Document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="border border-[var(--stroke)] rounded-lg p-4 hover:border-[var(--steel-blue)] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--deep-navy)]">
                    {session.document_type.replace(/-/g, ' ').replace('.md', '')}
                  </h3>
                  <p className="text-sm text-[var(--slate-gray)] mt-1">
                    {session.form_data.purpose.substring(0, 100)}
                    {session.form_data.purpose.length > 100 ? '...' : ''}
                  </p>
                  <p className="text-xs text-[var(--slate-gray)] mt-2">
                    Last updated: {formatDate(session.updated_at)}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onSelectSession(session)}
                    className="px-4 py-2 text-sm bg-[var(--steel-blue)] text-white rounded-lg hover:bg-[var(--deep-navy)] transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    disabled={deletingId === session.id}
                    className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deletingId === session.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
