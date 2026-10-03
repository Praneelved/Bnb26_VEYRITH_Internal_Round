// Home page — exact visual match to Roundtable screenshot with fully functional interactive buttons & modals
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { HelpModal } from '../components/HelpModal';
import { createDemoSession } from '../api';
import { useAppStore } from '../store';
import { getColorIndex } from '../utils';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [newMeetingMenuOpen, setNewMeetingMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const { setSession, setMyParticipantId, setMyRole, addParticipant, addToast } = useAppStore();

  // 3-card swipeable carousel state
  const [activeSlide, setActiveSlide] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const isPointerDown = useRef(false);

  const totalSlides = 3;

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'ArrowRight') {
        handleNextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close new meeting dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setNewMeetingMenuOpen(false);
      }
    };
    if (newMeetingMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [newMeetingMenuOpen]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - dragStartX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    if (dragOffset < -40) {
      handleNextSlide();
    } else if (dragOffset > 40) {
      handlePrevSlide();
    }
    setDragOffset(0);
    setIsDragging(false);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isPointerDown.current = true;
    dragStartX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPointerDown.current) return;
    const diff = e.clientX - dragStartX.current;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    if (dragOffset < -40) {
      handleNextSlide();
    } else if (dragOffset > 40) {
      handlePrevSlide();
    }
    setDragOffset(0);
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (isPointerDown.current) {
      handleMouseUp();
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/join?code=${encodeURIComponent(joinCode.trim().toUpperCase())}`);
    } else {
      navigate('/join');
    }
  };

  // Start instant meeting handler
  const handleStartInstant = () => {
    const resp = createDemoSession('Instant Sync & Review', 'Praneel (Host)');
    setSession({
      id: resp.session_id,
      name: resp.name,
      code: resp.code,
      phase: 'live',
      hostId: resp.participant_id,
      createdAt: Date.now(),
      participantCount: 3,
    });
    setMyParticipantId(resp.participant_id);
    setMyRole('host');
    addParticipant({
      id: resp.participant_id,
      name: 'Praneel (Host)',
      role: 'host',
      connectionState: 'connected',
      isSpeaking: false,
      isMuted: false,
      audioQuality: 'good',
      colorIndex: getColorIndex(0),
      joinedAt: Date.now(),
      hasVoiceProfile: true,
    });
    sessionStorage.setItem('rt_token', resp.host_token);
    sessionStorage.setItem('rt_session_id', resp.session_id);
    navigate(`/session/${resp.session_id}/live`);
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
              <div className="new-meeting-wrapper" ref={menuRef}>
                <button
                  id="btn-new-roundtable"
                  className="btn-new-meeting"
                  onClick={() => setNewMeetingMenuOpen(!newMeetingMenuOpen)}
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

                {newMeetingMenuOpen && (
                  <div className="new-meeting-dropdown animate-scale-up">
                    <button className="dropdown-item" onClick={handleStartInstant}>
                      <span className="item-icon">⚡</span>
                      <div>
                        <div className="item-title">Start an instant meeting</div>
                        <div className="item-desc">Join a live session right now with captions</div>
                      </div>
                    </button>
                    <button className="dropdown-item" onClick={() => navigate('/create')}>
                      <span className="item-icon">➕</span>
                      <div>
                        <div className="item-title">Create a meeting for later</div>
                        <div className="item-desc">Generate a code and invite link to share</div>
                      </div>
                    </button>
                  </div>
                )}
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

          {/* Right Column: Hero Preview 3-Card Swipeable Carousel */}
          <div className="hero-preview-wrapper">
            <div
              className={`hero-carousel-viewport ${isDragging ? 'is-dragging' : ''}`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              role="region"
              aria-label="Features swipeable carousel"
            >
              <div
                className="hero-carousel-track"
                style={{
                  transform: `translateX(calc(${6 - activeSlide * 92}% + ${dragOffset}px))`,
                  transition: isDragging ? 'none' : 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Slide 0: Live Captions */}
                <div
                  className={`preview-card-slide ${activeSlide === 0 ? 'active' : ''}`}
                  onClick={() => activeSlide !== 0 && setActiveSlide(0)}
                  aria-hidden={activeSlide !== 0}
                >
                  <div className="preview-card-header">
                    <div className="preview-live-badge">
                      <span className="live-dot" />
                      LIVE STREAM
                    </div>
                    <div className="preview-latency-badge">
                      32ms LATENCY
                    </div>
                  </div>

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

                  <div className="preview-card-footer">
                    <h3 className="preview-footer-title">Live Captions with Zero Clutter</h3>
                    <p className="preview-footer-desc">
                      Colors clearly track who spoke what, in real time, without blocking video faces.
                    </p>
                  </div>
                </div>

                {/* Slide 1: Multi-Phone Mic Fusion */}
                <div
                  className={`preview-card-slide ${activeSlide === 1 ? 'active' : ''}`}
                  onClick={() => activeSlide !== 1 && setActiveSlide(1)}
                  aria-hidden={activeSlide !== 1}
                >
                  <div className="preview-card-header">
                    <div className="preview-live-badge badge-spatial">
                      <span className="live-dot dot-cyan" />
                      SPATIAL MIC SYNC
                    </div>
                    <div className="preview-latency-badge badge-highlight">
                      3 PHONES ACTIVE
                    </div>
                  </div>

                  <div className="preview-caption-stream spatial-stream">
                    <div className="spatial-devices-grid">
                      <div className="spatial-device-chip active">
                        <div className="device-status-dot green" />
                        <div className="device-info">
                          <span className="device-name">Maya&rsquo;s iPhone 15</span>
                          <span className="device-meta">Primary Near Beam &bull; 98%</span>
                        </div>
                      </div>
                      <div className="spatial-device-chip active">
                        <div className="device-status-dot green" />
                        <div className="device-info">
                          <span className="device-name">David&rsquo;s Pixel 8</span>
                          <span className="device-meta">Satellite Sync &bull; 95%</span>
                        </div>
                      </div>
                      <div className="spatial-device-chip hub">
                        <div className="device-status-dot blue" />
                        <div className="device-info">
                          <span className="device-name">Host MacBook Pro</span>
                          <span className="device-meta">Central Hub &amp; Display</span>
                        </div>
                      </div>
                    </div>

                    <div className="spatial-fusion-bar">
                      <div className="fusion-wave-visual">
                        <span className="f-bar fb-1" />
                        <span className="f-bar fb-2" />
                        <span className="f-bar fb-3" />
                        <span className="f-bar fb-4" />
                        <span className="f-bar fb-5" />
                        <span className="f-bar fb-6" />
                      </div>
                      <span className="fusion-label">Acoustic voting suppresses echo &amp; background noise</span>
                    </div>
                  </div>

                  <div className="preview-card-footer">
                    <h3 className="preview-footer-title">Turn Phones into a Shared Mic Array</h3>
                    <p className="preview-footer-desc">
                      Everyone places their phone on the table. Beamforming fuses them into a studio-grade array.
                    </p>
                  </div>
                </div>

                {/* Slide 2: AI Summaries & Export */}
                <div
                  className={`preview-card-slide ${activeSlide === 2 ? 'active' : ''}`}
                  onClick={() => activeSlide !== 2 && setActiveSlide(2)}
                  aria-hidden={activeSlide !== 2}
                >
                  <div className="preview-card-header">
                    <div className="preview-live-badge badge-ai">
                      <span className="live-dot dot-purple" />
                      INSTANT SUMMARY
                    </div>
                    <div className="preview-latency-badge">
                      READY IN 1.2s
                    </div>
                  </div>

                  <div className="preview-caption-stream summary-stream">
                    <div className="summary-search-box">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <span>Search speaker notes, decisions, and topics...</span>
                    </div>

                    <div className="summary-points-list">
                      <div className="summary-point-item">
                        <span className="summary-point-badge action">ACTION</span>
                        <p className="summary-point-text">Maya to share final caption latency benchmarks by Thursday EOD.</p>
                      </div>
                      <div className="summary-point-item">
                        <span className="summary-point-badge decision">DECISION</span>
                        <p className="summary-point-text">Standardize 16kHz audio sampling for optimal battery &amp; speed.</p>
                      </div>
                      <div className="summary-point-item">
                        <span className="summary-point-badge privacy">PRIVACY</span>
                        <p className="summary-point-text">Zero persistent server voice retention confirmed.</p>
                      </div>
                    </div>

                    <div className="summary-export-chips">
                      <span className="export-chip">📄 .TXT</span>
                      <span className="export-chip">📊 .JSON</span>
                      <span className="export-chip">⏱️ .SRT</span>
                    </div>
                  </div>

                  <div className="preview-card-footer">
                    <h3 className="preview-footer-title">Searchable Notes &amp; One-Click Export</h3>
                    <p className="preview-footer-desc">
                      Review speaker-attributed notes, filter by participant, and export full transcripts in one click.
                    </p>
                  </div>
                </div>
              </div>

              {/* Shared Carousel Controls with active dots and arrows */}
              <div className="preview-carousel-controls">
                <div className="carousel-dots" role="tablist" aria-label="Carousel pagination">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      className={`dot ${activeSlide === idx ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlide(idx);
                      }}
                      role="tab"
                      aria-selected={activeSlide === idx}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
                <div className="carousel-arrows">
                  <button
                    className="arrow-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevSlide();
                    }}
                    aria-label="Previous preview"
                  >
                    &lt;
                  </button>
                  <button
                    className="arrow-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextSlide();
                    }}
                    aria-label="Next preview"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Section */}
        <section className="home-feature-cards-grid">
          <div className="feature-card" onClick={handleStartInstant} style={{ cursor: 'pointer' }}>
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

          <div className="feature-card" onClick={handleStartInstant} style={{ cursor: 'pointer' }}>
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

          <div className="feature-card" onClick={handleStartInstant} style={{ cursor: 'pointer' }}>
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
          <button className="footer-link-btn" onClick={() => setPrivacyOpen(true)}>
            Privacy Policy
          </button>
          <button className="footer-link-btn" onClick={() => setTermsOpen(true)}>
            Terms of Service
          </button>
          <button className="footer-link-btn" onClick={() => setHelpOpen(true)}>
            Keyboard Shortcuts
          </button>
        </div>
        <div className="footer-copyright">
          &copy; 2025 Roundtable. Clean, friendly live meetings.
        </div>
      </footer>

      {/* Help Modal */}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {/* Privacy Modal */}
      {privacyOpen && (
        <div className="help-modal-backdrop" onClick={() => setPrivacyOpen(false)} role="dialog">
          <div className="help-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal-header">
              <div className="help-title-wrap">
                <span className="help-icon-badge">🔒</span>
                <h3 className="help-modal-title">Privacy Policy</h3>
              </div>
              <button className="help-close-btn" onClick={() => setPrivacyOpen(false)}>&times;</button>
            </div>
            <div className="help-modal-body">
              <p className="help-text">
                Roundtable is architected from the ground up for strict ephemeral processing.
              </p>
              <div className="help-section">
                <h4 className="help-section-title">Zero Voice Retention</h4>
                <p className="help-text">
                  Voice prints and acoustic embeddings are generated locally or in ephemeral memory buffers. No permanent recordings or raw voice samples are saved on disk after a session ends.
                </p>
              </div>
              <div className="help-section">
                <h4 className="help-section-title">Client-Side Export Control</h4>
                <p className="help-text">
                  Transcripts and summaries exist in your browser session and are solely under your control when you export to TXT, JSON, or SRT.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {termsOpen && (
        <div className="help-modal-backdrop" onClick={() => setTermsOpen(false)} role="dialog">
          <div className="help-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal-header">
              <div className="help-title-wrap">
                <span className="help-icon-badge">📄</span>
                <h3 className="help-modal-title">Terms of Service</h3>
              </div>
              <button className="help-close-btn" onClick={() => setTermsOpen(false)}>&times;</button>
            </div>
            <div className="help-modal-body">
              <p className="help-text">
                By using Roundtable, you agree to fair usage of real-time audio fusion and speech transcription services.
              </p>
              <div className="help-section">
                <h4 className="help-section-title">Session Usage</h4>
                <p className="help-text">
                  Meeting rooms are private to the participants who hold the room code or QR invite link.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
