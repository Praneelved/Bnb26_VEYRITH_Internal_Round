// SettingsDrawer — slide-in settings panel
import React from 'react';
import { useAppStore } from '../store';
import './SettingsDrawer.css';

interface SettingsDrawerProps {
  onClose: () => void;
}

export function SettingsDrawer({ onClose }: SettingsDrawerProps) {
  const { captionFontSize, setCaptionFontSize, theme, setTheme } = useAppStore();

  return (
    <>
      {/* Backdrop */}
      <div
        className="settings-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="settings-drawer"
        role="dialog"
        aria-label="Settings"
        aria-modal="true"
      >
        <div className="settings-header">
          <h2 className="headline-md">Settings</h2>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="settings-body">

          {/* Caption size */}
          <div className="settings-section">
            <label className="input-label" id="caption-size-label">Caption size</label>
            <div
              className="settings-option-group"
              role="radiogroup"
              aria-labelledby="caption-size-label"
            >
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <label
                  key={size}
                  className={`settings-option ${captionFontSize === size ? 'settings-option--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="captionSize"
                    value={size}
                    checked={captionFontSize === size}
                    onChange={() => setCaptionFontSize(size)}
                    className="sr-only"
                  />
                  <span style={{ fontSize: size === 'sm' ? 13 : size === 'md' ? 16 : 20 }}>Aa</span>
                  <span className="body-sm">{size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Mic hint */}
          <div className="settings-section">
            <label className="input-label">Microphone</label>
            <p className="body-sm" style={{ color: 'var(--text-secondary)' }}>
              Roundtable uses your default microphone. To change device, use your system audio settings.
            </p>
          </div>

          <div className="divider" />

          {/* Privacy note */}
          <div className="settings-section settings-privacy">
            <div className="settings-privacy-icon" aria-hidden="true">🔒</div>
            <div>
              <p className="body-md" style={{ fontWeight: 600 }}>Privacy</p>
              <p className="body-sm" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                Voice embeddings are only used for this session and deleted when the session ends.
                Raw audio is not permanently stored.
              </p>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}
