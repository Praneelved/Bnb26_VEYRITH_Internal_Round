// ParticipantStrip — Video grid cards with live camera, hand raised indicators, layout support, and audio waveforms
import React, { useEffect, useRef } from 'react';
import { useAppStore, type Participant } from '../store';
import { getSpeakerColor, getInitials } from '../utils';
import './ParticipantStrip.css';

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
];

interface ParticipantStripProps {
  isHost: boolean;
  onHostMenu?: (participantId: string) => void;
}

function LiveVideoElement({ stream, blur }: { stream: MediaStream; blur?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`video-tile-img ${blur ? 'video-blur-effect' : ''}`}
    />
  );
}

export function ParticipantStrip({ isHost, onHostMenu }: ParticipantStripProps) {
  const {
    participants,
    videoStream,
    isVideoOn,
    isRecording,
    isHandRaised,
    myParticipantId,
    layoutMode,
    pinnedParticipantId,
    setPinnedParticipantId,
    isBackgroundBlurOn,
  } = useAppStore();

  const defaultParticipants: Participant[] = participants.length > 0 ? participants : [
    {
      id: '1',
      name: 'Alex Rivera (You)',
      isSpeaking: false,
      colorIndex: 1,
      isMuted: !isRecording,
      connectionState: 'connected',
      role: 'host',
      audioQuality: 'good',
      joinedAt: Date.now(),
      hasVoiceProfile: true,
      isHandRaised: isHandRaised,
      isVideoOn: isVideoOn,
    },
    {
      id: '2',
      name: 'Marcus Chen',
      isSpeaking: true,
      colorIndex: 2,
      isMuted: false,
      connectionState: 'connected',
      role: 'participant',
      audioQuality: 'good',
      joinedAt: Date.now(),
      hasVoiceProfile: true,
    },
    {
      id: '3',
      name: 'Sarah Jenkins',
      isSpeaking: false,
      colorIndex: 3,
      isMuted: false,
      connectionState: 'connected',
      role: 'participant',
      audioQuality: 'good',
      joinedAt: Date.now(),
      hasVoiceProfile: true,
    },
  ];

  // Determine spotlighted participant
  const spotlightId =
    pinnedParticipantId ||
    defaultParticipants.find((p) => p.isSpeaking)?.id ||
    defaultParticipants[0]?.id;

  const isSpotlightMode = layoutMode === 'spotlight';

  return (
    <div
      className={`video-grid-container layout--${layoutMode}`}
      role="region"
      aria-label="Video participants grid"
    >
      <div className={`video-grid-inner ${isSpotlightMode ? 'spotlight-grid' : ''}`}>
        {defaultParticipants.map((p, index) => {
          const isLocal = p.id === myParticipantId || index === 0;
          const colorIdx = ((p.colorIndex || 1) as 1 | 2 | 3 | 4);
          const color = getSpeakerColor(colorIdx);
          const avatarUrl = AVATARS[index % AVATARS.length];
          const isSpeaking = isLocal ? false : p.isSpeaking;
          const isMuted = isLocal ? !isRecording : p.isMuted;
          const handActive = isLocal ? isHandRaised : p.isHandRaised;
          const localVideoActive = isLocal ? isVideoOn : (p.isVideoOn ?? true);
          const isPinned = pinnedParticipantId === p.id;
          const isSpotlightHero = isSpotlightMode && p.id === spotlightId;

          return (
            <div
              key={p.id}
              className={`video-tile ${isSpeaking ? 'video-tile--speaking' : ''} ${
                isSpotlightHero ? 'video-tile--spotlight-hero' : ''
              } ${handActive ? 'video-tile--hand-raised' : ''}`}
              style={{ '--speaker-accent': color } as React.CSSProperties}
            >
              {/* Top Right: Raised Hand Badge */}
              {handActive && (
                <div className="tile-hand-raised-badge animate-bounce-in">
                  <span className="hand-emoji">✋</span>
                  <span className="hand-text">Hand Raised</span>
                </div>
              )}

              {/* Pin Tile Action Button */}
              <button
                className={`tile-pin-btn ${isPinned ? 'active' : ''}`}
                onClick={() => setPinnedParticipantId(isPinned ? null : p.id)}
                title={isPinned ? 'Unpin' : 'Pin to spotlight'}
                aria-label="Pin participant"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z" />
                </svg>
              </button>

              {/* Media area (Live camera vs avatar) */}
              <div className="video-tile-media">
                {isLocal && videoStream && localVideoActive ? (
                  <LiveVideoElement stream={videoStream} blur={isBackgroundBlurOn} />
                ) : localVideoActive ? (
                  <img src={avatarUrl} alt={p.name} className="video-tile-img" />
                ) : (
                  /* Camera Off State */
                  <div className="video-tile-off-state">
                    <div className="camera-off-avatar" style={{ background: color }}>
                      {getInitials(p.name)}
                    </div>
                    <span className="camera-off-pill">Camera is off</span>
                  </div>
                )}
              </div>

              {/* Bottom left overlay badge */}
              <div className="video-tile-overlay">
                <span
                  className={`speaker-status-dot ${isSpeaking ? 'speaking' : ''}`}
                  aria-hidden="true"
                />
                <span className="participant-name-text">
                  {p.name} {isLocal && '(You)'}
                </span>

                {/* Muted Mic Indicator */}
                {isMuted ? (
                  <span className="tile-muted-badge" title="Microphone Muted">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2" />
                    </svg>
                  </span>
                ) : isSpeaking ? (
                  <>
                    <span className="mic-icon" aria-label="Speaking mic">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      </svg>
                    </span>
                    <div className="tile-audio-wave">
                      <span className="tile-wave-bar b1" />
                      <span className="tile-wave-bar b2" />
                      <span className="tile-wave-bar b3" />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
