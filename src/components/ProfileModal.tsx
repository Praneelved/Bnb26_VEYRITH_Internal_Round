// ProfileModal — User account & details modal
import React from 'react';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import './ProfileModal.css';

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { userProfile, session, resetSession } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    resetSession();
    sessionStorage.clear();
    onClose();
    navigate('/');
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2 className="profile-modal-title">Account Details</h2>
          <button className="profile-close-btn" onClick={onClose} aria-label="Close profile">
            &times;
          </button>
        </div>

        <div className="profile-card-body">
          <div className="profile-avatar-large">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>

          <h3 className="profile-user-name">{userProfile.name}</h3>
          <span className="profile-role-badge">{userProfile.role}</span>

          <div className="profile-info-list">
            <div className="profile-info-item">
              <span className="profile-info-label">Email</span>
              <span className="profile-info-val">{userProfile.email}</span>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">Phone</span>
              <span className="profile-info-val">{userProfile.phone}</span>
            </div>

            {session && (
              <div className="profile-info-item">
                <span className="profile-info-label">Active Meeting</span>
                <span className="profile-info-val code-val">{session.code}</span>
              </div>
            )}
          </div>

          <div className="profile-nav-links">
            <button
              className="profile-nav-btn"
              onClick={() => {
                onClose();
                navigate('/');
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Lobby / Home</span>
            </button>
            <button
              className="profile-nav-btn"
              onClick={() => {
                onClose();
                navigate('/join');
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h4M13 15h4M7 11h10" />
              </svg>
              <span>Join & Recordings</span>
            </button>
          </div>
        </div>

        <div className="profile-modal-footer">
          <button className="btn-logout" onClick={handleLogout}>
            Sign Out / Leave Session
          </button>
        </div>
      </div>
    </div>
  );
}
