// TopNav — shared navigation bar matching Roundtable visual reference
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import './TopNav.css';

import { ProfileModal } from './ProfileModal';

interface TopNavProps {
  showSessionInfo?: boolean;
  rightContent?: React.ReactNode;
}

export function TopNav({ showSessionInfo, rightContent }: TopNavProps) {
  const { session, connectionStatus } = useAppStore();
  const location = useLocation();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState(false);

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="topnav" role="banner">
      <div className="topnav-left">
        <Link to="/" className="nav-logo" aria-label="Roundtable home">
          <span className="nav-logo-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" fill="#e11d48" />
              <circle cx="12" cy="12" r="5" stroke="#ffffff" strokeWidth="2" fill="none" />
              <circle cx="12" cy="12" r="2" fill="#ffffff" />
            </svg>
          </span>
          <span className="nav-logo-name">Roundtable</span>
        </Link>

        {!showSessionInfo && (
          <nav className="nav-pills hide-mobile" aria-label="Main menu">
            <Link to="/" className={`nav-pill ${isActive('/') ? 'active' : ''}`}>
              Lobby
            </Link>
            <Link to="/evaluation" className={`nav-pill ${isActive('/evaluation') ? 'active' : ''}`}>
              Meetings
            </Link>
            <Link to="/join" className={`nav-pill ${isActive('/join') ? 'active' : ''}`}>
              Recordings
            </Link>
          </nav>
        )}
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

            <button className="nav-icon-btn" aria-label="Help" title="Help">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>

            <button className="nav-icon-btn" aria-label="Feedback" title="Feedback">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            <button className="nav-icon-btn" aria-label="Settings" title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>

            <div
              className="nav-profile-avatar"
              title="User Profile"
              aria-label="Profile"
              onClick={() => setProfileOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </>
        )}
      </div>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </header>
  );
}
