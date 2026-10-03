import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { getSpeakerColor, formatTime, exportTranscriptTxt, exportTranscriptJson, exportTranscriptSrt } from '../utils';
import './InCallTranscriptPanel.css';

interface InCallTranscriptPanelProps {
  onClose: () => void;
}

export function InCallTranscriptPanel({ onClose }: InCallTranscriptPanelProps) {
  const { captions, session } = useAppStore();
  const [search, setSearch] = useState('');

  const finalCaptions = useMemo(
    () => captions.filter((c) => c.state === 'final' && c.text.trim()),
    [captions]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return finalCaptions;
    return finalCaptions.filter(
      (c) =>
        c.text.toLowerCase().includes(search.toLowerCase()) ||
        c.speakerName.toLowerCase().includes(search.toLowerCase())
    );
  }, [finalCaptions, search]);

  return (
    <aside className="side-panel transcript-panel animate-slide-left" role="dialog" aria-label="Meeting Transcript">
      <div className="side-panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">Live Transcript</h2>
          <span className="panel-count-chip">{finalCaptions.length}</span>
        </div>
        <button className="panel-close-btn" onClick={onClose} aria-label="Close transcript panel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Export Quick Bar */}
      <div className="transcript-export-bar">
        <button className="panel-export-btn" onClick={() => exportTranscriptTxt(finalCaptions)} title="Download TXT">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>TXT</span>
        </button>
        <button className="panel-export-btn" onClick={() => exportTranscriptJson(finalCaptions)} title="Download JSON">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>JSON</span>
        </button>
        <button className="panel-export-btn" onClick={() => exportTranscriptSrt(finalCaptions)} title="Download SRT Subtitles">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>SRT</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="panel-search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search spoken keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="panel-search-input"
          aria-label="Search transcript"
        />
        {search && (
          <button className="panel-clear-btn" onClick={() => setSearch('')}>
            &times;
          </button>
        )}
      </div>

      {/* Transcript items */}
      <div className="panel-list-scroll">
        {filtered.length === 0 ? (
          <div className="panel-empty-text">
            {finalCaptions.length === 0
              ? 'Transcribing in real-time. Start speaking to see live transcript notes.'
              : `No matches for "${search}"`}
          </div>
        ) : (
          filtered.map((c) => {
            const color = getSpeakerColor(c.speakerColorIndex);
            return (
              <div key={c.id} className="transcript-panel-item">
                <div className="transcript-panel-meta">
                  <span className="transcript-speaker-chip" style={{ color }}>
                    <span className="dot" style={{ background: color }} />
                    {c.speakerName}
                  </span>
                  <span className="transcript-time">{formatTime(c.startedAt)}</span>
                </div>
                <p className="transcript-panel-body">{c.text}</p>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
