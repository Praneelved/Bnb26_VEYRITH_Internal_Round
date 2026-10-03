// BottomControls — Floating dock control bar with fully interactive icons
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore, type LayoutMode } from '../store';
import './BottomControls.css';

interface BottomControlsProps {
  isViewer: boolean;
  isHost: boolean;
  onEndSession: () => void;
  onExport: () => void;
  onSettings: () => void;
  onOpenHelp?: () => void;
  onOpenLanguage?: () => void;
}

export function BottomControls({
  isViewer,
  isHost,
  onEndSession,
  onExport,
  onSettings,
  onOpenHelp,
  onOpenLanguage,
}: BottomControlsProps) {
  const {
    session,
    isRecording,
    setIsRecording,
    isVideoOn,
    setIsVideoOn,
    areCaptionsOn,
    setAreCaptionsOn,
    isHandRaised,
    toggleRaisedHand,
    isScreenSharing,
    setIsScreenSharing,
    setScreenShareStream,
    activePanel,
    setActivePanel,
    unreadChatCount,
    participants,
    layoutMode,
    setLayoutMode,
    isNoiseSuppressionOn,
    setIsNoiseSuppressionOn,
    isBackgroundBlurOn,
    setIsBackgroundBlurOn,
    addToast,
  } = useAppStore();

  const [timeStr, setTimeStr] = useState<string>('');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close more options popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

  // Mic toggle handler
  const handleToggleMic = () => {
    const nextState = !isRecording;
    setIsRecording(nextState);
    addToast(nextState ? 'Microphone unmuted' : 'Microphone muted', nextState ? 'info' : 'warning');
  };

  // Video toggle handler
  const handleToggleVideo = () => {
    const nextState = !isVideoOn;
    setIsVideoOn(nextState);
    addToast(nextState ? 'Camera turned on' : 'Camera turned off', nextState ? 'info' : 'warning');
  };

  // Captions toggle handler
  const handleToggleCaptions = () => {
    const nextState = !areCaptionsOn;
    setAreCaptionsOn(nextState);
    addToast(nextState ? '💬 Live captions enabled' : 'Live captions turned off', 'info');
  };

  // Raise hand toggle handler
  const handleToggleHand = () => {
    toggleRaisedHand();
  };

  // Screen share toggle handler
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      setScreenShareStream(null);
      addToast('Screen sharing stopped', 'info');
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          setScreenShareStream(stream);
          setIsScreenSharing(true);
          addToast('🖥️ You are sharing your screen', 'success');

          // Handle when user stops sharing via browser bar
          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            setScreenShareStream(null);
            addToast('Screen sharing ended', 'info');
          };
        } else {
          // Fallback to presentation mode
          setIsScreenSharing(true);
          addToast('🖥️ Presentation mode started', 'success');
        }
      } catch (err) {
        // Fallback demo screen share
        setIsScreenSharing(true);
        addToast('🖥️ Presentation view active', 'success');
      }
    }
  };

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      addToast('Entered Fullscreen', 'info');
    } else {
      document.exitFullscreen().catch(() => {});
      addToast('Exited Fullscreen', 'info');
    }
    setMoreMenuOpen(false);
  };

  // Layout mode cycle
  const handleCycleLayout = () => {
    const modes: LayoutMode[] = ['grid', 'spotlight', 'sidebar'];
    const nextIdx = (modes.indexOf(layoutMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setLayoutMode(nextMode);

    const labels: Record<LayoutMode, string> = {
      grid: 'Grid View (All participants equal)',
      spotlight: 'Speaker Spotlight View',
      sidebar: 'Stage & Sidebar View',
    };
    addToast(`Layout: ${labels[nextMode]}`, 'info');
  };

  return (
    <footer className="bottom-dock-wrapper" role="region" aria-label="Meeting controls dock">
      <div className="bottom-dock-container">
        {/* Left Side: Time and Code */}
        <div className="dock-left hide-mobile">
          <span className="dock-time-text">{timeStr || '10:24 AM'}</span>
          <span className="dock-divider">|</span>
          <span className="dock-code-text">{session?.code || 'RTB-VKM-PZO'}</span>
        </div>

        {/* Center: Action Icon Buttons */}
        <div className="dock-center">
          {/* Mute / Unmute Mic */}
          <button
            className={`dock-circle-btn ${!isRecording ? 'disabled' : ''}`}
            onClick={handleToggleMic}
            title={isRecording ? 'Mute Microphone (M)' : 'Unmute Microphone (M)'}
            aria-label={isRecording ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isRecording ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>

          {/* Camera Video Toggle */}
          <button
            className={`dock-circle-btn ${!isVideoOn ? 'disabled' : ''}`}
            onClick={handleToggleVideo}
            title={isVideoOn ? 'Turn Off Camera (V)' : 'Turn On Camera (V)'}
            aria-label="Toggle camera"
          >
            {isVideoOn ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M21 7l-5 3.5V7a2 2 0 0 0-2-2H8.5M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.5-.7" />
              </svg>
            )}
          </button>

          {/* Closed Captions CC */}
          <button
            className={`dock-circle-btn ${areCaptionsOn ? 'active' : ''}`}
            onClick={handleToggleCaptions}
            title={areCaptionsOn ? 'Turn Off Captions (C)' : 'Turn On Captions (C)'}
            aria-label="Toggle closed captions"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M7 15h4M13 15h4M7 11h10" />
            </svg>
          </button>

          {/* Raise Hand Button */}
          <button
            className={`dock-circle-btn ${isHandRaised ? 'active-hand' : ''}`}
            onClick={handleToggleHand}
            title={isHandRaised ? 'Lower Hand (H)' : 'Raise Hand (H)'}
            aria-label={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            {isHandRaised ? (
              <span className="hand-emoji-icon">✋</span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V2.5a2 2 0 0 0-4 0v9" />
                <path d="M18 8a2 2 0 0 1 2 2v6a7 7 0 0 1-14 0v-4" />
              </svg>
            )}
          </button>

          {/* Share Screen */}
          <button
            className={`dock-circle-btn ${isScreenSharing ? 'active-screenshare' : ''}`}
            onClick={handleToggleScreenShare}
            title={isScreenSharing ? 'Stop Presenting (S)' : 'Share Screen (S)'}
            aria-label="Share screen"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>

          {/* More Options (...) with Dropup Menu */}
          <div className="dock-more-wrap" ref={moreMenuRef}>
            <button
              className={`dock-circle-btn ${moreMenuOpen ? 'active' : ''}`}
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              title="More options"
              aria-label="More options"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {moreMenuOpen && (
              <div className="dock-dropup-menu animate-scale-up">
                <button
                  className="dock-menu-item"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onSettings();
                  }}
                >
                  <span className="menu-icon">⚙️</span>
                  <span>Audio & Video Settings</span>
                </button>

                <button
                  className="dock-menu-item"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onOpenLanguage?.();
                  }}
                >
                  <span className="menu-icon">🌐</span>
                  <span>Caption Language</span>
                </button>

                <button
                  className="dock-menu-item"
                  onClick={() => {
                    const next = !isBackgroundBlurOn;
                    setIsBackgroundBlurOn(next);
                    addToast(next ? '✨ Virtual Background blur enabled' : 'Background blur turned off', 'info');
                    setMoreMenuOpen(false);
                  }}
                >
                  <span className="menu-icon">✨</span>
                  <span>{isBackgroundBlurOn ? 'Disable Blur' : 'Blur Background'}</span>
                </button>

                <button
                  className="dock-menu-item"
                  onClick={() => {
                    const next = !isNoiseSuppressionOn;
                    setIsNoiseSuppressionOn(next);
                    addToast(next ? '🔇 AI Noise suppression active' : 'Noise suppression off', 'info');
                    setMoreMenuOpen(false);
                  }}
                >
                  <span className="menu-icon">🔇</span>
                  <span>{isNoiseSuppressionOn ? 'Noise Suppression: On' : 'Noise Suppression: Off'}</span>
                </button>

                <button className="dock-menu-item" onClick={handleToggleFullscreen}>
                  <span className="menu-icon">📺</span>
                  <span>Toggle Fullscreen</span>
                </button>

                <button
                  className="dock-menu-item"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onOpenHelp?.();
                  }}
                >
                  <span className="menu-icon">💡</span>
                  <span>Help & Shortcuts</span>
                </button>
              </div>
            )}
          </div>

          {/* Red End Call Button */}
          <button
            className="dock-end-call-btn"
            onClick={onEndSession}
            title={isHost ? 'End Meeting for All' : 'Leave Meeting'}
            aria-label="End or leave call"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C2.95 9.01 6.89 7.5 12 7.5s9.05 1.51 11.71 4.17c.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
            </svg>
            <span className="end-btn-text">End</span>
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="dock-right hide-mobile">
          {/* Transcript Drawer */}
          <button
            className={`dock-icon-btn ${activePanel === 'transcript' ? 'active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'transcript' ? 'none' : 'transcript')}
            title="Meeting Transcript & Notes"
            aria-label="View meeting transcript"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>

          {/* Participants List */}
          <button
            className={`dock-icon-btn ${activePanel === 'participants' ? 'active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'participants' ? 'none' : 'participants')}
            title="Participants (P)"
            aria-label="Participants list"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="dock-badge-num">{participants.length || 3}</span>
          </button>

          {/* In-call Chat */}
          <button
            className={`dock-icon-btn ${activePanel === 'chat' ? 'active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'chat' ? 'none' : 'chat')}
            title="Chat (T)"
            aria-label="In-call chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {unreadChatCount > 0 && <span className="dock-unread-dot" />}
          </button>

          {/* Grid Layout Switcher */}
          <button
            className={`dock-icon-btn ${layoutMode !== 'grid' ? 'active' : ''}`}
            onClick={handleCycleLayout}
            title={`Switch Layout (Current: ${layoutMode})`}
            aria-label="Change layout"
          >
            {layoutMode === 'grid' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            ) : layoutMode === 'spotlight' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="13" rx="2" />
                <rect x="2" y="18" width="6" height="3" rx="1" />
                <rect x="9" y="18" width="6" height="3" rx="1" />
                <rect x="16" y="18" width="6" height="3" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="14" height="18" rx="2" />
                <rect x="18" y="3" width="4" height="8" rx="1" />
                <rect x="18" y="13" width="4" height="8" rx="1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
