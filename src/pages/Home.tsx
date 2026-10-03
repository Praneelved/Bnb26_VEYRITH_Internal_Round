// Home page — exact visual match to Roundtable screenshot
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/join?code=${encodeURIComponent(joinCode.trim().toUpperCase())}`);
    } else {
      navigate('/join');
    }
  };

  return (
    <div className="page home-page">
      <TopNav />

      {/* Hero Section */}
      <main className="home-main">
        <div className="home-hero-container">
          {/* Left Column */}
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot" />
              Spatial Mic Sync Ready
            </div>

            <h1 className="hero-title">
              Video calls and live captions for everyone.
            </h1>

            <p className="hero-subtitle">
              Connect, speak naturally, and experience effortless multi-person captions with crystal-clear voice clarity and instant translation.
            </p>

            {/* Action Row */}
            <div className="hero-actions-row">
              <div className="new-meeting-wrapper">
                <button
                  id="btn-new-roundtable"
                  className="btn-new-meeting"
                  onClick={() => navigate('/create')}
                  aria-label="Create new meeting"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  <span>New meeting</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleJoin} className="join-input-group">
                <div className="input-icon-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
                  </svg>
                  <input
                    type="text"
                    className="join-code-input"
                    placeholder="Enter a code or link"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    aria-label="Enter meeting code"
                  />
                </div>
                <button
                  type="submit"
                  className={`btn-join-submit ${joinCode.trim() ? 'active' : ''}`}
                >
                  Join
                </button>
              </form>
            </div>

            {/* Info Callout Box */}
            <div className="hero-info-callout">
              <span className="callout-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ca678" strokeWidth="2">
                  <path d="M2 12h4l3-9 6 17 3-8h4" />
                </svg>
              </span>
              <p className="callout-text">
                Multi-phone mic fusion activates automatically when multiple team members sit together in the same room.
              </p>
            </div>
          </div>

          {/* Right Column: Hero Preview Card */}
          <div className="hero-preview-wrapper">
            <div className="preview-card">
              <div className="preview-card-header">
                <div className="preview-live-badge">
                  <span className="live-dot" />
                  LIVE STREAM
                </div>
                <div className="preview-latency-badge">
                  32ms LATENCY
                </div>
              </div>

              {/* Caption Stream Box */}
              <div className="preview-caption-stream">
                {/* Speaker 1 */}
                <div className="preview-caption-item">
                  <div className="preview-speaker-header">
                    <div className="speaker-avatar-name">
                      <div className="speaker-avatar" style={{ background: '#0d9488' }}>
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" alt="Maya Lin" />
                      </div>
                      <span className="speaker-name">Maya Lin</span>
                    </div>
                    <div className="wave-bars-indicator">
                      <span className="wave-bar bar-1" />
                      <span className="wave-bar bar-2" />
                      <span className="wave-bar bar-3" />
                    </div>
                  </div>
                  <p className="caption-body">
                    &ldquo;Let&rsquo;s sync up on the launch metrics right after this session.&rdquo;
                  </p>
                </div>

                {/* Speaker 2 */}
                <div className="preview-caption-item">
                  <div className="preview-speaker-header">
                    <div className="speaker-avatar-name">
                      <div className="speaker-avatar" style={{ background: '#4f46e5' }}>
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" alt="David Vance" />
                      </div>
                      <span className="speaker-name">David Vance</span>
                    </div>
                    <span className="translation-tag">Translating to ES</span>
                  </div>
                  <p className="caption-body">
                    &ldquo;Agreed. I also noticed how clearly each microphone isolates our voices.&rdquo;
                  </p>
                  <p className="caption-translation">
                    &ldquo;De acuerdo. También noté la claridad con que cada micrófono aisla nuestras voces.&rdquo;
                  </p>
                </div>
              </div>

              {/* Preview Footer text */}
              <div className="preview-card-footer">
                <h3 className="preview-footer-title">Live Captions with Zero Clutter</h3>
                <p className="preview-footer-desc">
                  Colors clearly track who spoke what, in real time, without blocking video faces.
                </p>

                <div className="preview-carousel-controls">
                  <div className="carousel-dots">
                    <span className="dot active" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                  <div className="carousel-arrows">
                    <button className="arrow-btn" aria-label="Previous preview">&lt;</button>
                    <button className="arrow-btn" aria-label="Next preview">&gt;</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Section */}
        <section className="home-feature-cards-grid">
          <div className="feature-card">
            <div className="feature-icon-box" style={{ color: '#0d9488', background: '#e6fcf5' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h4M13 15h4M7 11h10" />
              </svg>
            </div>
            <h3 className="feature-title">Multi-Speaker Identification</h3>
            <p className="feature-desc">
              Dynamic audio watermarking automatically tags who speaks, making meeting follow-ups effortless for everyone.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box" style={{ color: '#0ca678', background: '#e6fcf5' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 8l6 6M4 14l6-6 2 2M2 5h12M7 2v3M22 22l-5-10-5 10M14 18h6" />
              </svg>
            </div>
            <h3 className="feature-title">Instant Live Translation</h3>
            <p className="feature-desc">
              Read captions in your preferred native language in real-time, bridging global teams without conversation pauses.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box" style={{ color: '#4f46e5', background: '#eef2ff' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="feature-title">End-to-End Encrypted</h3>
            <p className="feature-desc">
              Your audio frames and transcribed conversations are processed ephemerally with zero persistent voice retention.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="home-site-footer">
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#shortcuts">Keyboard Shortcuts</a>
        </div>
        <div className="footer-copyright">
          &copy; 2025 Roundtable. Clean, friendly live meetings.
        </div>
      </footer>
    </div>
  );
}
