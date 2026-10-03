import React, { useState } from 'react';
import { useAppStore } from '../store';
import { getInitials, getSpeakerColor } from '../utils';
import './ParticipantsPanel.css';

interface ParticipantsPanelProps {
  onClose: () => void;
}

export function ParticipantsPanel({ onClose }: ParticipantsPanelProps) {
  const {
    participants,
    myParticipantId,
    myRole,
    updateParticipant,
    addToast,
    session,
    pinnedParticipantId,
    setPinnedParticipantId,
  } = useAppStore();

  const [search, setSearch] = useState('');
  const isHost = myRole === 'host';

  const defaultParticipants = participants.length > 0 ? participants : [
    { id: '1', name: 'Alex Rivera', isSpeaking: false, colorIndex: 1, isMuted: false, connectionState: 'connected', role: 'participant' as const, isHandRaised: false, audioQuality: 'good' as const, joinedAt: Date.now(), hasVoiceProfile: true },
    { id: '2', name: 'Marcus Chen', isSpeaking: true, colorIndex: 2, isMuted: false, connectionState: 'connected', role: 'participant' as const, isHandRaised: false, audioQuality: 'good' as const, joinedAt: Date.now(), hasVoiceProfile: true },
    { id: '3', name: 'Sarah Jenkins', isSpeaking: false, colorIndex: 3, isMuted: false, connectionState: 'connected', role: 'participant' as const, isHandRaised: false, audioQuality: 'good' as const, joinedAt: Date.now(), hasVoiceProfile: true },
  ];

  const filtered = defaultParticipants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleMuteAll = () => {
    defaultParticipants.forEach((p) => {
      if (p.id !== myParticipantId) {
        updateParticipant(p.id, { isMuted: true });
      }
    });
    addToast('All participants have been muted by host', 'info');
  };

  const handleLowerAllHands = () => {
    defaultParticipants.forEach((p) => {
      updateParticipant(p.id, { isHandRaised: false });
    });
    addToast('All raised hands lowered', 'info');
  };

  const handleCopyLink = () => {
    if (session?.code) {
      navigator.clipboard.writeText(`${window.location.origin}/join/${session.code}`);
      addToast('Meeting link copied to clipboard!', 'success');
    } else {
      addToast('Meeting code copied!', 'success');
    }
  };

  return (
    <aside className="side-panel participants-panel animate-slide-left" role="dialog" aria-label="Participants">
      <div className="side-panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">Participants</h2>
          <span className="panel-count-chip">{defaultParticipants.length}</span>
        </div>
        <button className="panel-close-btn" onClick={onClose} aria-label="Close participants panel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      <div className="panel-search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search participants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="panel-search-input"
          aria-label="Search participants"
        />
        {search && (
          <button className="panel-clear-btn" onClick={() => setSearch('')}>
            &times;
          </button>
        )}
      </div>

      {/* Host quick actions */}
      <div className="panel-actions-row">
        <button className="panel-action-btn" onClick={handleCopyLink} title="Invite link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>Invite</span>
        </button>

        {isHost && (
          <>
            <button className="panel-action-btn" onClick={handleMuteAll} title="Mute everyone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
              <span>Mute All</span>
            </button>

            <button className="panel-action-btn" onClick={handleLowerAllHands} title="Lower all hands">
              <span>✋ Lower All</span>
            </button>
          </>
        )}
      </div>

      {/* Participants List */}
      <div className="panel-list-scroll">
        {filtered.length === 0 ? (
          <div className="panel-empty-text">No participants found matching "{search}"</div>
        ) : (
          filtered.map((p, idx) => {
            const isLocal = p.id === myParticipantId || idx === 0;
            const color = getSpeakerColor((p.colorIndex || 1) as 1 | 2 | 3 | 4);
            const isPinned = pinnedParticipantId === p.id;

            return (
              <div key={p.id} className="participant-item-row">
                <div className="item-avatar" style={{ background: color }}>
                  {getInitials(p.name)}
                </div>

                <div className="item-info">
                  <div className="item-name-line">
                    <span className="item-name">{p.name}</span>
                    {isLocal && <span className="item-badge-you">(You)</span>}
                    {p.role === 'host' && <span className="item-badge-host">Host</span>}
                  </div>
                  <div className="item-sub-line">
                    {p.isSpeaking ? (
                      <span className="status-speaking-text">Speaking...</span>
                    ) : (
                      <span className="status-idle-text">In meeting</span>
                    )}
                  </div>
                </div>

                {/* Status Badges & Controls */}
                <div className="item-controls">
                  {p.isHandRaised && (
                    <span className="item-hand-raised" title="Hand raised">
                      ✋
                    </span>
                  )}

                  <button
                    className={`item-icon-btn ${p.isMuted ? 'muted' : ''}`}
                    onClick={() => updateParticipant(p.id, { isMuted: !p.isMuted })}
                    title={p.isMuted ? 'Unmute participant' : 'Mute participant'}
                  >
                    {p.isMuted ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <line x1="1" y1="1" x2="23" y2="23" />
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                        <path d="M17 16.95A7 7 0 0 1 5 12v-2" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      </svg>
                    )}
                  </button>

                  <button
                    className={`item-icon-btn ${isPinned ? 'pinned' : ''}`}
                    onClick={() => setPinnedParticipantId(isPinned ? null : p.id)}
                    title={isPinned ? 'Unpin' : 'Pin to main stage'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
