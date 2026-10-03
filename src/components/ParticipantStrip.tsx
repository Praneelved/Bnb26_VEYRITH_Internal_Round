// ParticipantStrip — Portrait video grid cards matching Roundtable screenshot with live MediaStream support
import React, { useEffect, useRef } from 'react';
import { useAppStore, type Participant } from '../store';
import { getSpeakerColor } from '../utils';
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

function LiveVideoElement({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline muted className="video-tile-img" />;
}

export function ParticipantStrip({ isHost, onHostMenu }: ParticipantStripProps) {
  const { participants, videoStream, isVideoOn, myParticipantId } = useAppStore();

  const displayParticipants = participants.length > 0 ? participants : [
    { id: '1', name: 'Alex Rivera', isSpeaking: false, colorIndex: 1, isMuted: false, connectionState: 'connected' },
    { id: '2', name: 'Marcus Chen', isSpeaking: true, colorIndex: 2, isMuted: false, connectionState: 'connected' },
    { id: '3', name: 'Sarah Jenkins', isSpeaking: false, colorIndex: 3, isMuted: false, connectionState: 'connected' },
  ];

  return (
    <div className="video-grid-container" role="region" aria-label="Video participants grid">
      <div className="video-grid-inner">
        {displayParticipants.map((p, index) => {
          const colorIdx = ((p.colorIndex || 1) as 1 | 2 | 3 | 4);
          const color = getSpeakerColor(colorIdx);
          const avatarUrl = AVATARS[index % AVATARS.length];
          const isSpeaking = p.isSpeaking;
          const isLocal = p.id === myParticipantId || index === 0;

          return (
            <div
              key={p.id}
              className={`video-tile ${isSpeaking ? 'video-tile--speaking' : ''}`}
              style={{ '--speaker-accent': color } as React.CSSProperties}
            >
              <div className="video-tile-media">
                {isLocal && videoStream && isVideoOn ? (
                  <LiveVideoElement stream={videoStream} />
                ) : (
                  <img src={avatarUrl} alt={p.name} className="video-tile-img" />
                )}
              </div>

              {/* Bottom left overlay badge */}
              <div className="video-tile-overlay">
                <span className="speaker-status-dot" aria-hidden="true" />
                <span className="participant-name-text">{p.name}</span>
                {isSpeaking && (
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
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
