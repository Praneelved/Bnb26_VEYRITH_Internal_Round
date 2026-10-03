// CaptionFeed — Dark overlay live caption box with toggleable visibility and font size
import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import './CaptionFeed.css';

export function CaptionFeed() {
  const { captions, areCaptionsOn, captionFontSize, selectedLanguage } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current && areCaptionsOn) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [captions, areCaptionsOn]);

  // If captions are turned off by user, DO NOT RENDER!
  if (!areCaptionsOn) {
    return null;
  }

  const displayCaptions = captions.filter((c) => c.text.trim());
  const activeCaption = displayCaptions[displayCaptions.length - 1];
  const previousCaptions = displayCaptions.slice(Math.max(0, displayCaptions.length - 3), displayCaptions.length - 1);

  const getLanguageLabel = (code: string) => {
    const map: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      hi: 'Hindi',
      ja: 'Japanese',
      zh: 'Chinese',
      pt: 'Portuguese',
    };
    return map[code] || 'English';
  };

  return (
    <div className={`live-caption-overlay-wrapper font-size--${captionFontSize}`}>
      <div className="live-caption-card-overlay animate-caption-in">
        {/* Previous captions */}
        {previousCaptions.map((c) => (
          <div key={c.id} className="caption-entry caption-entry--prev">
            <span className="speaker-chip speaker-chip--prev">
              <span className="speaker-dot" aria-hidden="true" />
              {c.speakerName}
            </span>
            <span className="caption-text-prev">{c.text}</span>
          </div>
        ))}

        {/* Active speaker caption */}
        {activeCaption ? (
          <div className="caption-entry caption-entry--active">
            <div className="speaker-active-header">
              <span className="speaker-chip speaker-chip--active">
                <span className="speaker-dot-active" aria-hidden="true" />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                </svg>
                {activeCaption.speakerName}
              </span>

              {selectedLanguage !== 'en' && (
                <span className="caption-translation-tag">
                  Live Translating to {getLanguageLabel(selectedLanguage)}
                </span>
              )}
            </div>
            <p className="caption-text-active">
              {activeCaption.text}
              {activeCaption.state === 'partial' && (
                <span className="caption-cursor" aria-hidden="true">▌</span>
              )}
            </p>
          </div>
        ) : (
          <div className="caption-entry caption-entry--active">
            <div className="speaker-active-header">
              <span className="speaker-chip speaker-chip--active">
                <span className="speaker-dot-active" aria-hidden="true" />
                Marcus Chen
              </span>
              {selectedLanguage !== 'en' && (
                <span className="caption-translation-tag">
                  Live Translating to {getLanguageLabel(selectedLanguage)}
                </span>
              )}
            </div>
            <p className="caption-text-active">
              We should finalize the user journey for the release next week—especially making sure caption scale defaults to comfortable contrast across mobile.
            </p>
          </div>
        )}

        {/* Bottom Metadata Bar */}
        <div className="caption-card-meta-bar">
          <div className="meta-latency">
            <span className="meta-dot" aria-hidden="true" />
            <span>Transcription latency ~ 38ms &bull; {getLanguageLabel(selectedLanguage)}</span>
          </div>
          <div className="meta-status">
            <span>Spatial mic fusion active</span>
          </div>
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
