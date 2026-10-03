// LiveSession — hero screen matching Roundtable live meeting reference
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { useAppStore } from '../store';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { endSession, DEMO_MODE } from '../api';
import { ParticipantStrip } from '../components/ParticipantStrip';
import { CaptionFeed } from '../components/CaptionFeed';
import { BottomControls } from '../components/BottomControls';
import { SettingsDrawer } from '../components/SettingsDrawer';
import './LiveSession.css';

import { useCameraCapture } from '../hooks/useCameraCapture';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

// Demo caption sequence
const DEMO_CAPTIONS_DATA = [
  { name: 'Alex Rivera', delay: 1000, text: 'Absolutely, the live captions are updating effortlessly in real time.', colorIndex: 1 as const },
  { name: 'Marcus Chen', delay: 4500, text: 'We should finalize the user journey for the release next week—especially making sure caption scale defaults to comfortable contrast across mobile.', colorIndex: 2 as const },
  { name: 'Sarah Jenkins', delay: 9000, text: 'I agree! The multi-mic fusion is working smoothly without any voice collision.', colorIndex: 3 as const },
];

export default function LiveSession() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const {
    session, myRole, myParticipantId, participants,
    captions, connectionStatus, addCaption, updateParticipant,
    captionFontSize, setCaptionFontSize
  } = useAppStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = sessionStorage.getItem('rt_token') || undefined;
  const isHost = myRole === 'host';
  const isViewer = myRole === 'viewer';

  // WebSocket
  const { sendMessage } = useWebSocket(sessionId, token);

  // Camera Capture
  const { startCamera, stopCamera } = useCameraCapture();

  // Real-time Speech Recognition ASR
  useSpeechRecognition({ sendMessage, enabled: !isViewer });

  // Audio capture
  const { startCapture, stopCapture } = useAudioCapture({
    onAudioFrame: useCallback((frame: Float32Array, ts: number) => {
      if (!isViewer && sendMessage) {
        const buf = new Uint8Array(frame.buffer);
        const b64 = btoa(String.fromCharCode(...Array.from(buf)));
        sendMessage('audio_frame', {
          data: b64,
          timestamp: ts,
          participant_id: myParticipantId,
          sample_rate: 16000,
        });
      }
    }, [sendMessage, isViewer, myParticipantId]),
  });

  // Redirect if no session
  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  // Start mic and camera on mount
  useEffect(() => {
    if (!isViewer) {
      startCapture();
      startCamera();
    }
    return () => {
      stopCapture();
      stopCamera();
    };
  }, [isViewer]);

  // Demo caption injection
  useEffect(() => {
    if (!DEMO_MODE) return;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    DEMO_CAPTIONS_DATA.forEach((demo, i) => {
      const partialId = `demo-${i}`;
      const partialTimeout = setTimeout(() => {
        addCaption({
          id: partialId,
          speakerId: `demo-speaker-${demo.colorIndex}`,
          speakerName: demo.name,
          speakerColorIndex: demo.colorIndex,
          text: demo.text.slice(0, Math.floor(demo.text.length * 0.5)),
          state: 'partial',
          startedAt: Date.now(),
        });
        updateParticipant(`demo-speaker-${demo.colorIndex}`, { isSpeaking: true });

        const finalTimeout = setTimeout(() => {
          const { updateCaption } = useAppStore.getState();
          updateCaption(partialId, {
            text: demo.text,
            state: 'final',
            finalizedAt: Date.now(),
          });
          updateParticipant(`demo-speaker-${demo.colorIndex}`, { isSpeaking: false });
        }, 1800);
        timeouts.push(finalTimeout);
      }, demo.delay);
      timeouts.push(partialTimeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const handleCopyCode = () => {
    if (session?.code) {
      navigator.clipboard.writeText(session.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    if (isHost) {
      try {
        await endSession(sessionId, token || '');
      } catch { /* ignore in demo */ }
    }
    navigate(`/session/${sessionId}/transcript`);
  };

  const handleExportTranscript = () => {
    navigate(`/session/${sessionId}/transcript`);
  };

  if (!session) return null;

  return (
    <div className="live-page">
      {/* Custom Header Bar for Live Session matching screenshot */}
      <header className="live-header-bar">
        <div className="live-header-left">
          <span className="live-status-dot" aria-hidden="true" />
          <span className="live-title-text">{session.name || 'Sync & Design Review'}</span>
          <span className="header-divider">&bull;</span>
          <button className="live-code-chip" onClick={handleCopyCode} title="Click to copy code">
            <span>{session.code || 'RT-MEET-492'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            {copied && <span className="copied-tooltip">Copied!</span>}
          </button>
        </div>

        <div className="live-header-right">
          <div className="captions-status-badge">
            <span className="captions-badge-icon">💬</span>
            <span>Captions on (English)</span>
          </div>

          <div className="font-size-adjuster hide-mobile">
            <button
              className={`font-btn ${captionFontSize === 'sm' ? 'active' : ''}`}
              onClick={() => setCaptionFontSize('sm')}
              title="Small text"
            >
              A-
            </button>
            <button
              className={`font-btn ${captionFontSize === 'lg' ? 'active' : ''}`}
              onClick={() => setCaptionFontSize('lg')}
              title="Large text"
            >
              A+
            </button>
          </div>

          <div className="participant-count-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>{participants.length || 3}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="live-main-content">
        {/* Video Cards Grid */}
        <ParticipantStrip isHost={isHost} />

        {/* Floating Dark Live Caption Card */}
        <CaptionFeed />
      </main>

      {/* Bottom Floating Control Dock */}
      <BottomControls
        isViewer={isViewer}
        isHost={isHost}
        onEndSession={handleEndSession}
        onExport={handleExportTranscript}
        onSettings={() => setSettingsOpen(true)}
      />

      {/* Settings Drawer */}
      {settingsOpen && (
        <SettingsDrawer onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
