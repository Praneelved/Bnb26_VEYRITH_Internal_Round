import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { TopNav } from '../components/TopNav';
import { useAppStore } from '../store';
import { buildJoinUrl, copyToClipboard, getInitials, getSpeakerColor } from '../utils';
import { startSession, getSessionState } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import './Lobby.css';

const CONNECTION_LABELS: Record<string, string> = {
  connected: 'Connected',
  connecting: 'Connecting…',
  reconnecting: 'Reconnecting…',
  disconnected: 'Disconnected',
};

export default function Lobby() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, setSession, participants, myParticipantId, myRole } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const token = sessionStorage.getItem('rt_token') || undefined;
  const isHost = myRole === 'host';
  const joinUrl = session ? buildJoinUrl(session.code) : '';

  // Connect to live WebSocket in Lobby so participants sync in real time
  useWebSocket(sessionId, token);

  // Restore session from backend if refreshed or opened directly
  useEffect(() => {
    if (!session && sessionId && token) {
      getSessionState(sessionId, token)
        .then((s) => {
          setSession({
            id: s.session_id,
            name: s.name || 'Roundtable',
            code: s.code,
            phase: s.phase,
            hostId: s.host_id,
            createdAt: s.created_at,
            participantCount: s.participants?.length || 1,
          });
        })
        .catch(() => {
          // If not authenticated or not found, navigate to join
          navigate('/join');
        });
    } else if (!session && !token) {
      navigate('/join');
    }
  }, [session, sessionId, token, navigate, setSession]);

  // When meeting starts, automatically navigate non-host participants to voice enrollment or live
  useEffect(() => {
    if (session?.phase === 'live' || (session as any)?.status === 'live') {
      if (myRole === 'viewer') {
        navigate(`/session/${sessionId}/live`);
      } else {
        navigate(`/session/${sessionId}/enroll`);
      }
    }
  }, [session?.phase, (session as any)?.status, myRole, sessionId, navigate]);

  const handleCopyCode = async () => {
    if (!session) return;
    await copyToClipboard(session.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    await copyToClipboard(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    if (!session || !sessionId) return;
    setStarting(true);
    setError('');
    try {
      const activeToken = sessionStorage.getItem('rt_token') || 'demo-host-token';
      await startSession(sessionId, activeToken);
      navigate(`/session/${sessionId}/enroll`);
    } catch (err) {
      // Navigate anyway in case backend was bypassed
      navigate(`/session/${sessionId}/enroll`);
    } finally {
      setStarting(false);
    }
  };

  if (!session) return null;

  return (
    <div className="page lobby-page">
      <TopNav />
      <main className="lobby-main" role="main">
        <div className="lobby-inner">

          {/* Left panel */}
          <div className="lobby-left">
            <div className="lobby-header">
              <div className="lobby-phase-badge">
                <span className="status-dot muted" aria-hidden="true" />
                Lobby
              </div>
              <h1 className="headline-lg lobby-title">{session.name}</h1>
            </div>

            {/* Room code */}
            <div className="lobby-code-block card">
              <p className="input-label" style={{ marginBottom: 'var(--space-sm)' }}>Room Code</p>
              <div className="lobby-code-display">
                <span className="code-display lobby-code-value" aria-label={`Room code: ${session.code}`}>
                  {session.code}
                </span>
                <button
                  id="btn-copy-code"
                  className="btn-icon"
                  onClick={handleCopyCode}
                  aria-label={copied ? 'Copied!' : 'Copy room code'}
                  title="Copy code"
                >
                  {copied ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-active)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  )}
                </button>
              </div>
              <button
                className="btn-secondary lobby-link-btn"
                onClick={handleCopyLink}
                aria-label="Copy join link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                {copied ? 'Copied!' : 'Copy invite link'}
              </button>
            </div>

            {/* Participants */}
            <div className="lobby-participants">
              <h2 className="headline-md" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Participants ({participants.length})
              </h2>
              <ul className="lobby-participant-list" role="list" aria-label="Session participants">
                {participants.map((p, index) => (
                  <li key={p.id || (p as any).participant_id || `lobby-p-${index}`} className="lobby-participant-item" role="listitem">
                    <div
                      className="lobby-participant-avatar"
                      style={{ background: getSpeakerColor(p.colorIndex), color: '#fff' }}
                      aria-hidden="true"
                    >
                      {getInitials(p.name)}
                    </div>
                    <div className="lobby-participant-info">
                      <span className="body-md" style={{ fontWeight: 600 }}>
                        {p.name}
                        {p.id === myParticipantId && (
                          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>(you)</span>
                        )}
                      </span>
                      <span className="body-sm" style={{ color: 'var(--text-muted)' }}>
                        {p.role === 'host' ? 'Host' : p.role === 'viewer' ? 'Viewer' : 'Participant'}
                      </span>
                    </div>
                    <div className={`lobby-connection-badge lobby-connection-badge--${p.connectionState}`}>
                      <span className="status-dot" style={{
                        background: p.connectionState === 'connected' ? 'var(--status-active)' :
                          p.connectionState === 'reconnecting' ? 'var(--status-warning)' :
                            'var(--status-error)'
                      }} aria-hidden="true" />
                      <span className="body-sm">{CONNECTION_LABELS[p.connectionState] || p.connectionState}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="lobby-actions">
              {isHost ? (
                <>
                  {error && <p className="body-sm" style={{ color: 'var(--status-error)' }} role="alert">{error}</p>}
                  <button
                    id="btn-start-session"
                    className="btn-primary"
                    onClick={handleStart}
                    disabled={starting}
                    aria-busy={starting}
                    style={{ width: '100%', justifyContent: 'center', height: 52 }}
                  >
                    {starting ? (
                      <>
                        <span className="spinner" aria-hidden="true" />
                        Starting…
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Start Roundtable
                      </>
                    )}
                  </button>
                  <p className="body-sm lobby-hint">
                    All participants will be prompted to enroll their voice.
                  </p>
                </>
              ) : (
                <div className="lobby-waiting" role="status" aria-live="polite">
                  <span className="lobby-waiting-dot" aria-hidden="true" />
                  Waiting for host to start the session…
                </div>
              )}
            </div>
          </div>

          {/* Right panel — QR */}
          <div className="lobby-right">
            <div className="card lobby-qr-card">
              <p className="input-label" style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
                Scan to join
              </p>
              <div className="lobby-qr-wrapper" role="img" aria-label={`QR code to join session at ${joinUrl}`}>
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  level="M"
                  fgColor="#111827"
                  bgColor="#ffffff"
                />
              </div>
              <p className="body-sm lobby-qr-hint">
                Point phone camera at the QR code
              </p>
              <div className="lobby-qr-url body-sm truncate" title={joinUrl}>
                {joinUrl}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
