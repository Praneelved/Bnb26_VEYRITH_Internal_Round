import React from 'react';
import './HelpModal.css';

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="help-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="help-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <div className="help-title-wrap">
            <span className="help-icon-badge">💡</span>
            <h3 className="help-modal-title">Help & Keyboard Shortcuts</h3>
          </div>
          <button className="help-close-btn" onClick={onClose} aria-label="Close help">
            &times;
          </button>
        </div>

        <div className="help-modal-body">
          <div className="help-section">
            <h4 className="help-section-title">⌨️ Keyboard Shortcuts</h4>
            <div className="shortcuts-grid">
              <div className="shortcut-row">
                <span className="shortcut-desc">Mute / Unmute Microphone</span>
                <kbd className="shortcut-key">M</kbd>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">Turn Camera On / Off</span>
                <kbd className="shortcut-key">V</kbd>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">Toggle Closed Captions</span>
                <kbd className="shortcut-key">C</kbd>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">Raise / Lower Hand</span>
                <kbd className="shortcut-key">H</kbd>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">Share Screen</span>
                <kbd className="shortcut-key">S</kbd>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">Open Participants Panel</span>
                <kbd className="shortcut-key">P</kbd>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">Open Chat Panel</span>
                <kbd className="shortcut-key">T</kbd>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">Close any modal / drawer</span>
                <kbd className="shortcut-key">Esc</kbd>
              </div>
            </div>
          </div>

          <div className="help-section">
            <h4 className="help-section-title">🎙️ Multi-Mic Fusion</h4>
            <p className="help-text">
              When teammates sit around the same table, each device acts as a spatial mic element. Roundtable automatically fuses beams and eliminates echo.
            </p>
          </div>

          <div className="help-section">
            <h4 className="help-section-title">🔒 Privacy Assurance</h4>
            <p className="help-text">
              Voice identification embeddings are ephemeral for the duration of the call and permanently discarded when session ends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
