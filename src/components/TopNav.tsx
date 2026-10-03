// TopNav — shared navigation bar with interactive modals for Help, Feedback, Settings, and Profile
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { ProfileModal } from './ProfileModal';
import { SettingsDrawer } from './SettingsDrawer';
import { HelpModal } from './HelpModal';
import { FeedbackModal } from './FeedbackModal';
import './TopNav.css';

interface TopNavProps {
  showSessionInfo?: boolean;
  rightContent?: React.ReactNode;
}

export function TopNav({ showSessionInfo, rightContent }: TopNavProps) {
  const { session } = useAppStore();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="topnav" role="banner">
      <div className="topnav-left">
        <button
          className="nav-profile-btn-left"
          title="User Account & Profile"
          aria-label="User Profile"
          onClick={() => setProfileOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </button>
      </div>

      {showSessionInfo && session && (
        <div className="nav-session-info">
          <div className="nav-live-badge">
            <span className="nav-live-dot" aria-hidden="true" />
            <span>LIVE</span>
          </div>
          <span className="nav-room-code label-mono">{session.code}</span>
          <span className="nav-session-name hide-mobile">{session.name}</span>
        </div>
      )}

      <div className="nav-right">
        {rightContent ?? (
          <>
            <div className="nav-time-group hide-mobile">
              <span className="nav-time-text">{timeStr || '10:24 AM'}</span>
              <span className="nav-time-dot">&bull;</span>
              <span className="nav-date-text">{dateStr || 'Tue, Oct 24'}</span>
            </div>

            {/* Help & Shortcuts Button */}
            <button
              className="nav-icon-btn"
              aria-label="Help & Keyboard Shortcuts"
              title="Help & Shortcuts"
              onClick={() => setHelpOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>

            {/* Feedback Button */}
            <button
              className="nav-icon-btn"
              aria-label="Send Feedback"
              title="Send Feedback"
              onClick={() => setFeedbackOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            {/* Settings Button */}
            <button
              className="nav-icon-btn"
              aria-label="Audio & Video Settings"
              title="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </>
        )}
      </div>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
      {settingsOpen && <SettingsDrawer onClose={() => setSettingsOpen(false)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </header>
  );
}
