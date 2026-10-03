// JoinRoundtable page
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { joinSession, joinDemoSession, DEMO_MODE } from '../api';
import { useAppStore } from '../store';
import { getColorIndex } from '../utils';
import './CreateJoin.css';

export default function JoinRoundtable() {
  const navigate = useNavigate();
  const { code: codeFromUrl } = useParams<{ code?: string }>();

  const [code, setCode] = useState(codeFromUrl?.toUpperCase() ?? '');
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState<'participant' | 'viewer'>('participant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setSession, setMyParticipantId, setMyRole, addParticipant } = useAppStore();

  useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl.toUpperCase());
  }, [codeFromUrl]);

  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(val);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setError('Please enter a 6-character room code.');
      return;
    }
    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let resp;
      if (DEMO_MODE) {
        resp = joinDemoSession(code, displayName.trim());
      } else {
        resp = await joinSession(code, displayName.trim(), mode);
      }

      setSession({
        id: resp.session_id,
        name: resp.name,
        code: resp.code,
        phase: 'lobby',
        hostId: '',
        createdAt: Date.now(),
        participantCount: 1,
      });

      setMyParticipantId(resp.participant_id);
      setMyRole(mode);

      addParticipant({
        id: resp.participant_id,
        name: displayName.trim(),
        role: mode,
        connectionState: 'connecting',
        isSpeaking: false,
        isMuted: false,
        audioQuality: 'good',
        colorIndex: getColorIndex(1),
        joinedAt: Date.now(),
        hasVoiceProfile: false,
      });

      sessionStorage.setItem('rt_token', resp.participant_token);
      sessionStorage.setItem('rt_session_id', resp.session_id);

      navigate(`/lobby/${resp.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join. Check the room code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page create-join-page">
      <TopNav />
      <main className="create-join-main" role="main">
        <div className="create-join-card card animate-fade-in">
          <div className="create-join-icon create-join-icon--join" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
          </div>
          <h1 className="headline-lg">Join Roundtable</h1>
          <p className="body-md create-join-sub">
            Enter the 6-character code shared by the host.
          </p>

          <form onSubmit={handleJoin} className="create-join-form" noValidate>
            <div className="input-group">
              <label htmlFor="room-code" className="input-label">Room code</label>
              <input
                id="room-code"
                className="input-field code-input"
                type="text"
                inputMode="text"
                placeholder="ABC123"
                value={code}
                onChange={handleCodeInput}
                maxLength={6}
                required
                autoFocus={!codeFromUrl}
                autoComplete="off"
                aria-describedby="code-hint"
              />
              <p id="code-hint" className="body-sm" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                6 characters, no spaces
              </p>
            </div>

            <div className="input-group">
              <label htmlFor="display-name" className="input-label">Your display name</label>
              <input
                id="display-name"
                className="input-field"
                type="text"
                placeholder="e.g. Nayan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                required
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Join as</label>
              <div className="mode-selector" role="radiogroup" aria-label="Participation mode">
                <label className={`mode-option ${mode === 'participant' ? 'mode-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="mode"
                    value="participant"
                    checked={mode === 'participant'}
                    onChange={() => setMode('participant')}
                    className="sr-only"
                    id="mode-participant"
                  />
                  <div className="mode-option-icon" aria-hidden="true">🎙️</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Participant</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mic on, speak & listen</div>
                  </div>
                </label>
                <label className={`mode-option ${mode === 'viewer' ? 'mode-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="mode"
                    value="viewer"
                    checked={mode === 'viewer'}
                    onChange={() => setMode('viewer')}
                    className="sr-only"
                    id="mode-viewer"
                  />
                  <div className="mode-option-icon" aria-hidden="true">👁️</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Viewer</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Read only, no mic</div>
                  </div>
                </label>
              </div>
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
              id="btn-join-session"
              type="submit"
              className="btn-primary create-join-submit"
              disabled={loading || code.length < 6}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Joining…
                </>
              ) : 'Join Roundtable'}
            </button>
          </form>

          <div className="create-join-divider">
            <span className="create-join-divider-text body-sm">or</span>
          </div>

          <button
            className="btn-ghost"
            onClick={() => navigate('/create')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Create a new session instead
          </button>
        </div>
      </main>
    </div>
  );
}
