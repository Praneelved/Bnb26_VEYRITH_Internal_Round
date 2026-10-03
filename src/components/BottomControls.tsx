// BottomControls — Floating dock control bar matching Roundtable screenshot
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import './BottomControls.css';

interface BottomControlsProps {
  isViewer: boolean;
  isHost: boolean;
  onEndSession: () => void;
  onExport: () => void;
  onSettings: () => void;
}

export function BottomControls({
  isViewer,
  isHost,
  onEndSession,
  onExport,
  onSettings,
}: BottomControlsProps) {
  const { isRecording, setIsRecording } = useAppStore();
  const [timeStr, setTimeStr] = useState<string>('');
  const [handRaised, setHandRaised] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bottom-dock-wrapper" role="region" aria-label="Meeting controls dock">
      <div className="bottom-dock-container">
        {/* Left Side: Time and Code */}
        <div className="dock-left hide-mobile">
          <span className="dock-time-text">{timeStr || '10:24 AM'}</span>
          <span className="dock-divider">|</span>
          <span className="dock-code-text">RTB-VKM-PZO</span>
        </div>

        {/* Center: Action Icon Buttons */}
        <div className="dock-center">
          {/* Mute Mic */}
          <button
            className={`dock-circle-btn ${!isRecording ? 'disabled' : ''}`}
            onClick={() => setIsRecording(!isRecording)}
            title={isRecording ? 'Mute Microphone' : 'Unmute Microphone'}
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

          {/* Video Toggle */}
          <button
            className={`dock-circle-btn ${!videoOn ? 'disabled' : ''}`}
            onClick={() => setVideoOn(!videoOn)}
            title={videoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            aria-label="Toggle camera"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>

          {/* Closed Captions */}
          <button
            className={`dock-circle-btn ${captionsOn ? 'active' : ''}`}
            onClick={() => setCaptionsOn(!captionsOn)}
            title="Toggle Captions"
            aria-label="Toggle closed captions"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M7 15h4M13 15h4M7 11h10" />
            </svg>
          </button>

          {/* Raise Hand */}
          <button
            className={`dock-circle-btn ${handRaised ? 'active' : ''}`}
            onClick={() => setHandRaised(!handRaised)}
            title="Raise Hand"
            aria-label="Raise hand"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V2.5a2 2 0 0 0-4 0v9" />
              <path d="M18 8a2 2 0 0 1 2 2v6a7 7 0 0 1-14 0v-4" />
            </svg>
          </button>

          {/* Share Screen */}
          <button className="dock-circle-btn" title="Present / Share" aria-label="Share screen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>

          {/* More Options */}
          <button className="dock-circle-btn" onClick={onSettings} title="More options" aria-label="More options">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

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
          <button className="dock-icon-btn" onClick={onExport} title="View Transcript / Export">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>

          <button className="dock-icon-btn" title="Participants List">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>

          <button className="dock-icon-btn" title="Chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          <button className="dock-icon-btn" title="Grid Layout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
