import React from 'react';
import './EndCallModal.css';

interface EndCallModalProps {
  isHost: boolean;
  onLeave: () => void;
  onEndForAll: () => void;
  onCancel: () => void;
}

export function EndCallModal({ isHost, onLeave, onEndForAll, onCancel }: EndCallModalProps) {
  return (
    <div className="end-call-backdrop" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="end-call-card" onClick={(e) => e.stopPropagation()}>
        <div className="end-call-icon-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C2.95 9.01 6.89 7.5 12 7.5s9.05 1.51 11.71 4.17c.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
          </svg>
        </div>

        <h3 className="end-call-title">Leave the meeting?</h3>
        <p className="end-call-desc">
          {isHost
            ? 'As the host, you can leave the call or end the session for all participants and export transcripts.'
            : 'You will leave this meeting and can view or download the conversation transcript.'}
        </p>

        <div className="end-call-actions">
          {isHost && (
            <button className="btn-danger-full" onClick={onEndForAll}>
              End meeting for all
            </button>
          )}

          <button className="btn-secondary-full" onClick={onLeave}>
            Leave meeting
          </button>

          <button className="btn-cancel-link" onClick={onCancel}>
            Stay in call
          </button>
        </div>
      </div>
    </div>
  );
}
