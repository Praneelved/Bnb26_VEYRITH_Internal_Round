// Voice Enrollment page — collect voice sample for speaker ID
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useAppStore } from '../store';
import './Enrollment.css';

type EnrollmentState = 'idle' | 'requesting' | 'recording' | 'processing' | 'done' | 'error';

const ENROLLMENT_SENTENCE =
  'The quick brown fox jumps over the lazy dog near the river bank.';

const RECORD_DURATION_MS = 5000;

export default function Enrollment() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, myParticipantId, myRole, updateParticipant, audioLevel } = useAppStore();

  const [enrollState, setEnrollState] = useState<EnrollmentState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameBufferRef = useRef<Float32Array[]>([]);

  const { startCapture, stopCapture } = useAudioCapture({
    onAudioFrame: (frame) => {
      if (enrollState === 'recording') {
        frameBufferRef.current.push(frame);
      }
    },
  });

  useEffect(() => {
    if (!session) navigate('/');
    // Viewers skip enrollment
    if (myRole === 'viewer') {
      navigate(`/session/${sessionId}/live`);
    }
  }, [session, myRole, navigate, sessionId]);

  const handleStart = async () => {
    setEnrollState('requesting');
    setError('');
    frameBufferRef.current = [];

    const ok = await startCapture();
    if (!ok) {
      setEnrollState('error');
      setError('Microphone access denied. Please allow microphone access and try again.');
      return;
    }

    setEnrollState('recording');
    setProgress(0);

    // Progress timer
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / RECORD_DURATION_MS) * 100, 100);
      setProgress(pct);
      if (elapsed >= RECORD_DURATION_MS) {
        clearInterval(progressRef.current!);
        handleRecordingComplete();
      }
    }, 50);
  };

  const handleRecordingComplete = async () => {
    setEnrollState('processing');
    stopCapture();

    // Send enrollment frames to server (or skip in demo mode)
    const token = sessionStorage.getItem('rt_token') || 'demo-token';
    try {
      // In real mode: POST frames to /api/sessions/:id/enroll
      // In demo mode: simulate processing
      await new Promise((r) => setTimeout(r, 1200));

      if (myParticipantId) {
        updateParticipant(myParticipantId, { hasVoiceProfile: true });
      }
      setEnrollState('done');
    } catch {
      setEnrollState('error');
      setError('Enrollment failed. Please try again.');
    }
  };

  const handleContinue = () => {
    navigate(`/session/${sessionId}/live`);
  };

  const handleSkip = () => {
    navigate(`/session/${sessionId}/live`);
  };

  const isRecording = enrollState === 'recording';

  // Audio level bars
  const levelBars = Array.from({ length: 12 }, (_, i) => {
    const threshold = (i / 12);
    const active = isRecording && audioLevel > threshold;
    return { active };
  });

  return (
    <div className="page enrollment-page">
      <TopNav />
      <main className="enrollment-main" role="main">
        <div className="enrollment-card card animate-fade-in">
          {enrollState !== 'done' ? (
            <>
              <div className="enrollment-icon" aria-hidden="true">🎙️</div>
              <h1 className="headline-lg">Let's recognize your voice</h1>
              <p className="body-md enrollment-sub">
                Read the sentence below aloud for about 5 seconds. This helps Roundtable
                identify who is speaking during the session.
              </p>

              <div className="enrollment-sentence" role="blockquote" aria-label="Read this sentence aloud">
                <span className="body-xl enrollment-sentence-text">
                  "{ENROLLMENT_SENTENCE}"
                </span>
              </div>

              {/* Mic level visualizer */}
              <div
                className="enrollment-visualizer"
                role="img"
                aria-label={isRecording ? `Microphone level: ${Math.round(audioLevel * 100)}%` : 'Microphone inactive'}
              >
                {levelBars.map((bar, i) => (
                  <div
                    key={i}
                    className={`enrollment-bar ${bar.active ? 'enrollment-bar--active' : ''}`}
                    style={{ animationDelay: isRecording ? `${i * 60}ms` : '0ms' }}
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Progress bar */}
              {isRecording && (
                <div className="enrollment-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Recording progress">
                  <div
                    className="enrollment-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Status text */}
              <div className="enrollment-status body-md" aria-live="polite" role="status">
                {enrollState === 'idle' && 'Click the button below to start recording.'}
                {enrollState === 'requesting' && 'Requesting microphone access…'}
                {enrollState === 'recording' && (
                  <span style={{ color: 'var(--status-active)', fontWeight: 600 }}>
                    🔴 Recording… Read the sentence above
                  </span>
                )}
                {enrollState === 'processing' && (
                  <span style={{ color: 'var(--speaker-2)' }}>
                    Processing voice profile…
                  </span>
                )}
                {enrollState === 'error' && (
                  <span style={{ color: 'var(--status-error)' }}>{error}</span>
                )}
              </div>

              <div className="enrollment-actions">
                {(enrollState === 'idle' || enrollState === 'error') && (
                  <button
                    id="btn-start-enrollment"
                    className="btn-primary enrollment-btn"
                    onClick={handleStart}
                    aria-label="Start voice enrollment recording"
                  >
                    {enrollState === 'error' ? 'Try Again' : 'Start Recording'}
                  </button>
                )}
                {enrollState === 'requesting' && (
                  <button className="btn-primary enrollment-btn" disabled aria-busy>
                    <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} aria-hidden="true" />
                    Requesting…
                  </button>
                )}
                {(enrollState === 'recording' || enrollState === 'processing') && (
                  <button className="btn-primary enrollment-btn" disabled aria-busy>
                    <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} aria-hidden="true" />
                    {enrollState === 'recording' ? 'Recording…' : 'Processing…'}
                  </button>
                )}
                <button
                  className="btn-ghost"
                  onClick={handleSkip}
                  aria-label="Skip voice enrollment"
                  style={{ fontSize: 13 }}
                >
                  Skip for now
                </button>
              </div>
            </>
          ) : (
            /* Done state */
            <div className="enrollment-done animate-fade-in">
              <div className="enrollment-done-icon" aria-hidden="true">✅</div>
              <h1 className="headline-lg">Voice profile ready</h1>
              <p className="body-md enrollment-sub">
                Roundtable will now identify your voice during the session.
              </p>
              <button
                id="btn-continue-to-live"
                className="btn-primary enrollment-btn"
                onClick={handleContinue}
                autoFocus
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Enter Roundtable
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
