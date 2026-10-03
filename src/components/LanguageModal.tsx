import React from 'react';
import { useAppStore } from '../store';
import './LanguageModal.css';

interface LanguageModalProps {
  onClose: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
];

export function LanguageModal({ onClose }: LanguageModalProps) {
  const { selectedLanguage, setSelectedLanguage, addToast } = useAppStore();

  const handleSelect = (code: string, name: string) => {
    setSelectedLanguage(code);
    addToast(`Live captions language set to ${name}`, 'success');
    onClose();
  };

  return (
    <div className="lang-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lang-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="lang-modal-header">
          <div className="lang-header-title">
            <span className="lang-icon">🌐</span>
            <h3>Caption Language</h3>
          </div>
          <button className="lang-close-btn" onClick={onClose} aria-label="Close language selector">
            &times;
          </button>
        </div>

        <p className="lang-modal-desc">
          Select your preferred language. Spoken dialog will be automatically translated into real-time captions.
        </p>

        <div className="lang-grid">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                className={`lang-card-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelect(lang.code, lang.name)}
              >
                <span className="lang-flag">{lang.flag}</span>
                <div className="lang-details">
                  <span className="lang-name">{lang.name}</span>
                  <span className="lang-native">{lang.native}</span>
                </div>
                {isSelected && (
                  <span className="lang-check">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
