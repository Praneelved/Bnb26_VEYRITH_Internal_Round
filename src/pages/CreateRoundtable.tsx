// CreateRoundtable page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { createSession, createDemoSession, DEMO_MODE } from '../api';
import { useAppStore } from '../store';
import { generateId, getColorIndex } from '../utils';
import './CreateJoin.css';

export default function CreateRoundtable() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [hostName, setHostName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setSession, setMyParticipantId, setMyRole, addParticipant } = useAppStore();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hostName.trim()) {
      setError('Please fill in both fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      let resp;
      if (DEMO_MODE) {
        resp = createDemoSession(name.trim(), hostName.trim());
      } else {
        resp = await createSession(name.trim(), hostName.trim());
      }

      // Set global session state
      setSession({
        id: resp.session_id,
        name: resp.name,
        code: resp.code,
        phase: 'lobby',
        hostId: resp.participant_id,
        createdAt: Date.now(),
        participantCount: 1,
      });

      setMyParticipantId(resp.participant_id);
      setMyRole('host');

      // Add host as first participant
      addParticipant({
        id: resp.participant_id,
        name: hostName.trim(),
        role: 'host',
        connectionState: 'connected',
        isSpeaking: false,
        isMuted: false,
        audioQuality: 'good',
        colorIndex: getColorIndex(0),
        joinedAt: Date.now(),
        hasVoiceProfile: false,
      });

      // Store token in sessionStorage
      sessionStorage.setItem('rt_token', resp.host_token);
      sessionStorage.setItem('rt_session_id', resp.session_id);

      navigate(`/lobby/${resp.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page create-join-page">
      <TopNav />
      <main className="create-join-main" role="main">
        <div className="create-join-card card animate-fade-in">
          <div className="create-join-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <h1 className="headline-lg">New Roundtable</h1>
          <p className="body-md create-join-sub">
            Create a live caption session. Share the code or QR with participants.
          </p>

          <form onSubmit={handleCreate} className="create-join-form" noValidate>
            <div className="input-group">
              <label htmlFor="session-name" className="input-label">Session name</label>
              <input
                id="session-name"
                className="input-field"
                type="text"
                placeholder="e.g. Team Standup, Dinner Chat"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
                autoFocus
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <label htmlFor="host-name" className="input-label">Your display name</label>
              <input
                id="host-name"
                className="input-field"
                type="text"
                placeholder="e.g. Praneel"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                maxLength={40}
                required
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="create-join-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              id="btn-create-session"
              type="submit"
              className="btn-primary create-join-submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Creating…
                </>
              ) : 'Create Roundtable'}
            </button>
          </form>

          <div className="create-join-divider">
            <span className="create-join-divider-text body-sm">or</span>
          </div>

          <button
            className="btn-ghost"
            onClick={() => navigate('/join')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Join with a code instead
          </button>
        </div>
      </main>
    </div>
  );
}
