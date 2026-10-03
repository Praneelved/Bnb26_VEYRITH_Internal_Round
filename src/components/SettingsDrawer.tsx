// SettingsDrawer — slide-in settings panel with comprehensive audio, video, caption, and device controls
import React, { useState } from 'react';
import { useAppStore } from '../store';
import './SettingsDrawer.css';

interface SettingsDrawerProps {
  onClose: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English (US)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'zh', name: 'Chinese (中文)' },
];

export function SettingsDrawer({ onClose }: SettingsDrawerProps) {
  const {
    captionFontSize,
    setCaptionFontSize,
    theme,
    setTheme,
    areCaptionsOn,
    setAreCaptionsOn,
    selectedLanguage,
    setSelectedLanguage,
    isNoiseSuppressionOn,
    setIsNoiseSuppressionOn,
    isBackgroundBlurOn,
    setIsBackgroundBlurOn,
    addToast,
  } = useAppStore();

  const [testingAudio, setTestingAudio] = useState(false);

  const handleTestAudio = () => {
    setTestingAudio(true);
    addToast('Playing test chime...', 'info');
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
    setTimeout(() => setTestingAudio(false), 500);
  };

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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="settings-body">
          {/* Captions Toggle & Size */}
          <div className="settings-section">
            <div className="settings-switch-row">
              <div>
                <label className="input-label" style={{ marginBottom: 2 }}>Closed Captions</label>
                <p className="body-sm" style={{ color: 'var(--text-secondary)' }}>Show live subtitles on screen</p>
              </div>
              <input
                type="checkbox"
                checked={areCaptionsOn}
                onChange={(e) => setAreCaptionsOn(e.target.checked)}
                className="settings-toggle-checkbox"
                aria-label="Toggle closed captions"
              />
            </div>
          </div>

          <div className="divider" />

          {/* Caption size */}
          <div className="settings-section">
            <label className="input-label" id="caption-size-label">Caption Text Size</label>
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
                  <span style={{ fontSize: size === 'sm' ? 13 : size === 'md' ? 16 : 20, fontWeight: 700 }}>Aa</span>
                  <span className="body-sm">{size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Translation Language */}
          <div className="settings-section">
            <label className="input-label" htmlFor="caption-lang-select">Live Caption Language</label>
            <select
              id="caption-lang-select"
              className="settings-select"
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                addToast('Caption language updated', 'success');
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="divider" />

          {/* Video & Effects */}
          <div className="settings-section">
            <label className="input-label">Video & Audio Processing</label>
            <div className="settings-checkbox-list">
              <label className="settings-checkbox-item">
                <input
                  type="checkbox"
                  checked={isBackgroundBlurOn}
                  onChange={(e) => setIsBackgroundBlurOn(e.target.checked)}
                />
                <div>
                  <span className="body-md" style={{ fontWeight: 600 }}>Virtual Background Blur</span>
                  <p className="body-sm" style={{ color: 'var(--text-secondary)' }}>Soften room background on camera</p>
                </div>
              </label>

              <label className="settings-checkbox-item">
                <input
                  type="checkbox"
                  checked={isNoiseSuppressionOn}
                  onChange={(e) => setIsNoiseSuppressionOn(e.target.checked)}
                />
                <div>
                  <span className="body-md" style={{ fontWeight: 600 }}>AI Spatial Noise Cancellation</span>
                  <p className="body-sm" style={{ color: 'var(--text-secondary)' }}>Suppresses keyboard typing and HVAC hum</p>
                </div>
              </label>
            </div>
          </div>

          <div className="divider" />

          {/* Audio test */}
          <div className="settings-section">
            <label className="input-label">Speaker & Audio Test</label>
            <button className="btn-secondary" onClick={handleTestAudio} disabled={testingAudio}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              <span>{testingAudio ? 'Testing audio...' : 'Test Speaker Chime'}</span>
            </button>
          </div>

          <div className="divider" />

          {/* Privacy note */}
          <div className="settings-section settings-privacy">
            <div className="settings-privacy-icon" aria-hidden="true">🔒</div>
            <div>
              <p className="body-md" style={{ fontWeight: 600 }}>Zero Data Retention</p>
              <p className="body-sm" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                Voice identification embeddings are ephemeral for this session and discarded on disconnect.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
