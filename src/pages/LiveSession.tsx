// LiveSession — hero screen matching Roundtable live meeting reference with full interactivity
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { endSession, getSessionState, DEMO_MODE } from '../api';
import { ParticipantStrip } from '../components/ParticipantStrip';
import { CaptionFeed } from '../components/CaptionFeed';
import { BottomControls } from '../components/BottomControls';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { ParticipantsPanel } from '../components/ParticipantsPanel';
import { ChatPanel } from '../components/ChatPanel';
import { InCallTranscriptPanel } from '../components/InCallTranscriptPanel';
import { EndCallModal } from '../components/EndCallModal';
import { HelpModal } from '../components/HelpModal';
import { FeedbackModal } from '../components/FeedbackModal';
import { LanguageModal } from '../components/LanguageModal';
import { ToastContainer } from '../components/ToastContainer';
import { useCameraCapture } from '../hooks/useCameraCapture';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import './LiveSession.css';


export default function LiveSession() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const {
    session,
    setSession,
    myRole,
    myParticipantId,
    participants,
    captions,
    addCaption,
    updateParticipant,
    captionFontSize,
    setCaptionFontSize,
    areCaptionsOn,
    setAreCaptionsOn,
    selectedLanguage,
    isHandRaised,
    toggleRaisedHand,
    isRecording,
    setIsRecording,
    isVideoOn,
    setIsVideoOn,
    isScreenSharing,
    setIsScreenSharing,
    screenShareStream,
    setScreenShareStream,
    activePanel,
    setActivePanel,
    addToast,
  } = useAppStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [endCallModalOpen, setEndCallModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const screenVideoRef = useRef<HTMLVideoElement>(null);

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

  // Attach screen share stream if active
  useEffect(() => {
    if (screenVideoRef.current && screenShareStream) {
      screenVideoRef.current.srcObject = screenShareStream;
    }
  }, [screenShareStream, isScreenSharing]);

  // Restore session from backend if refreshed, or redirect if completely unauthenticated
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
        .catch(() => navigate('/'));
    } else if (!session && !token) {
      navigate('/');
    }
  }, [session, sessionId, token, navigate, setSession]);

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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'm') {
        const next = !isRecording;
        setIsRecording(next);
        addToast(next ? 'Microphone unmuted' : 'Microphone muted', next ? 'info' : 'warning');
      } else if (key === 'v') {
        const next = !isVideoOn;
        setIsVideoOn(next);
        addToast(next ? 'Camera enabled' : 'Camera turned off', next ? 'info' : 'warning');
      } else if (key === 'c') {
        const next = !areCaptionsOn;
        setAreCaptionsOn(next);
        addToast(next ? '💬 Captions turned on' : 'Captions turned off', 'info');
      } else if (key === 'h') {
        toggleRaisedHand();
      } else if (key === 's') {
        if (isScreenSharing) {
          setIsScreenSharing(false);
          setScreenShareStream(null);
          addToast('Screen sharing ended', 'info');
        } else {
          setIsScreenSharing(true);
          addToast('🖥️ Screen sharing started', 'success');
        }
      } else if (key === 'p') {
        setActivePanel(activePanel === 'participants' ? 'none' : 'participants');
      } else if (key === 't') {
        setActivePanel(activePanel === 'chat' ? 'none' : 'chat');
      } else if (e.key === 'Escape') {
        setActivePanel('none');
        setSettingsOpen(false);
        setHelpOpen(false);
        setFeedbackOpen(false);
        setLanguageOpen(false);
        setEndCallModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isRecording,
    isVideoOn,
    areCaptionsOn,
    isScreenSharing,
    activePanel,
    toggleRaisedHand,
    setIsRecording,
    setIsVideoOn,
    setAreCaptionsOn,
    setIsScreenSharing,
    setScreenShareStream,
    setActivePanel,
    addToast,
  ]);

  // NO demo/fake caption injection.
  // Captions come ONLY from useSpeechRecognition (real mic → WebSpeech API)
  // or from the backend via WebSocket caption_partial / caption_final events.

  const handleCopyCode = () => {
    if (session?.code) {
      const joinUrl = `${window.location.origin}/join/${session.code}`;
      navigator.clipboard.writeText(`${session.code}\nJoin Link: ${joinUrl}`);
      setCopied(true);
      addToast('Room code and invite link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEndSessionConfirmed = async (forAll: boolean) => {
    setEndCallModalOpen(false);
    if (!sessionId) return;
    if (forAll && isHost) {
      try {
        await endSession(sessionId, token || '');
      } catch { /* ignore in demo */ }
    }
    navigate(`/session/${sessionId}/transcript`);
  };

  const getLanguageName = (code: string) => {
    const map: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      hi: 'Hindi',
      ja: 'Japanese',
      zh: 'Chinese',
    };
    return map[code] || 'English';
  };

  if (!session) return null;

  return (
    <div className="live-page">
      {/* Toast Notification Banner Container */}
      <ToastContainer />

      {/* Custom Header Bar for Live Session */}
      <header className="live-header-bar">
        <div className="live-header-left">
          <span className="live-status-dot" aria-hidden="true" />
          <span className="live-title-text">{session.name || 'Sync & Design Review'}</span>
          <span className="header-divider">&bull;</span>
          <button className="live-code-chip" onClick={handleCopyCode} title="Click to copy code and link">
            <span>{session.code || 'RT-MEET-492'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            {copied && <span className="copied-tooltip">Copied!</span>}
          </button>
        </div>

        <div className="live-header-right">
          {/* Closed Captions Status & Language Button */}
          <button
            className={`captions-status-badge ${areCaptionsOn ? 'active' : 'disabled'}`}
            onClick={() => setLanguageOpen(true)}
            title="Click to change caption language"
            aria-label="Caption status and language"
          >
            <span className="captions-badge-icon">💬</span>
            <span>{areCaptionsOn ? `Captions on (${getLanguageName(selectedLanguage)})` : 'Captions off'}</span>
          </button>

          {/* Caption Font Size Adjuster Buttons */}
          <div className="font-size-adjuster hide-mobile">
            <button
              className={`font-btn ${captionFontSize === 'sm' ? 'active' : ''}`}
              onClick={() => {
                setCaptionFontSize('sm');
                addToast('Caption text size: Small', 'info');
              }}
              title="Small caption text"
            >
              A-
            </button>
            <button
              className={`font-btn ${captionFontSize === 'md' ? 'active' : ''}`}
              onClick={() => {
                setCaptionFontSize('md');
                addToast('Caption text size: Medium', 'info');
              }}
              title="Medium caption text"
            >
              A
            </button>
            <button
              className={`font-btn ${captionFontSize === 'lg' ? 'active' : ''}`}
              onClick={() => {
                setCaptionFontSize('lg');
                addToast('Caption text size: Large', 'info');
              }}
              title="Large caption text"
            >
              A+
            </button>
          </div>

          {/* Participant Count Chip Button */}
          <button
            className="participant-count-badge"
            onClick={() => setActivePanel(activePanel === 'participants' ? 'none' : 'participants')}
            title="View participants list"
            aria-label="View participants list"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>{participants.length || 3}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`live-main-content ${activePanel !== 'none' ? 'panel-open' : ''}`}>
        {/* If Screen Share is Active, Show Screen Presentation Stage */}
        {isScreenSharing ? (
          <div className="presentation-stage-container">
            <div className="presentation-header-bar">
              <div className="presentation-indicator">
                <span className="live-dot dot-cyan" />
                <span>You are sharing your screen to everyone</span>
              </div>
              <button
                className="btn-stop-presenting"
                onClick={() => {
                  setIsScreenSharing(false);
                  setScreenShareStream(null);
                  addToast('Stopped sharing screen', 'info');
                }}
              >
                Stop Presenting
              </button>
            </div>

            <div className="presentation-viewport">
              {screenShareStream ? (
                <video ref={screenVideoRef} autoPlay playsInline muted className="presentation-video-element" />
              ) : (
                /* Interactive Presentation Mock Demo View */
                <div className="presentation-demo-canvas">
                  <div className="demo-canvas-header">
                    <span className="canvas-dot red" />
                    <span className="canvas-dot yellow" />
                    <span className="canvas-dot green" />
                    <span className="canvas-title">Project Roadmap & Release Architecture.fig</span>
                  </div>
                  <div className="demo-canvas-body">
                    <div className="canvas-card c1">
                      <h4>Phase 1: Multi-Mic Beamforming</h4>
                      <p>Acoustic fusion array calibrated across 3 nearby devices.</p>
                      <div className="canvas-bar fill-100" />
                    </div>
                    <div className="canvas-card c2">
                      <h4>Phase 2: Live Translation Pipeline</h4>
                      <p>Instant translation to Spanish, French, and Hindi with &lt;45ms latency.</p>
                      <div className="canvas-bar fill-85" />
                    </div>
                    <div className="canvas-card c3">
                      <h4>Phase 3: Interactive Visual Controls</h4>
                      <p>Hand raising, dock controls, in-call chat, and subtitle scaling.</p>
                      <div className="canvas-bar fill-95" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Video participants in mini strip */}
            <div className="presentation-participants-strip">
              <ParticipantStrip isHost={isHost} />
            </div>
          </div>
        ) : (
          /* Normal Video Cards Grid */
          <ParticipantStrip isHost={isHost} />
        )}

        {/* Floating Dark Live Caption Card — Rendered ONLY when areCaptionsOn is true! */}
        <CaptionFeed />

        {/* Side Panels */}
        {activePanel === 'participants' && (
          <ParticipantsPanel onClose={() => setActivePanel('none')} />
        )}
        {activePanel === 'chat' && (
          <ChatPanel onClose={() => setActivePanel('none')} />
        )}
        {activePanel === 'transcript' && (
          <InCallTranscriptPanel onClose={() => setActivePanel('none')} />
        )}
      </main>

      {/* Bottom Floating Control Dock with all working icons */}
      <BottomControls
        isViewer={isViewer}
        isHost={isHost}
        onEndSession={() => setEndCallModalOpen(true)}
        onExport={() => navigate(`/session/${sessionId}/transcript`)}
        onSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenLanguage={() => setLanguageOpen(true)}
      />

      {/* Settings Drawer */}
      {settingsOpen && (
        <SettingsDrawer onClose={() => setSettingsOpen(false)} />
      )}

      {/* End Call Modal */}
      {endCallModalOpen && (
        <EndCallModal
          isHost={isHost}
          onLeave={() => handleEndSessionConfirmed(false)}
          onEndForAll={() => handleEndSessionConfirmed(true)}
          onCancel={() => setEndCallModalOpen(false)}
        />
      )}

      {/* Help Modal */}
      {helpOpen && (
        <HelpModal onClose={() => setHelpOpen(false)} />
      )}

      {/* Feedback Modal */}
      {feedbackOpen && (
        <FeedbackModal onClose={() => setFeedbackOpen(false)} />
      )}

      {/* Language Modal */}
      {languageOpen && (
        <LanguageModal onClose={() => setLanguageOpen(false)} />
      )}
    </div>
  );
}
