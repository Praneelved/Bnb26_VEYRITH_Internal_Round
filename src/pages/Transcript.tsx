// Transcript page — searchable, filterable, exportable
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { useAppStore } from '../store';
import { getSpeakerColor, getSpeakerBg, formatTime, exportTranscriptTxt, exportTranscriptJson, exportTranscriptSrt } from '../utils';
import './Transcript.css';

export default function Transcript() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { captions, participants, session } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpeaker, setFilterSpeaker] = useState<string>('all');

  const finalCaptions = useMemo(
    () => captions.filter((c) => c.state === 'final' && c.text.trim()),
    [captions]
  );

  const uniqueSpeakers = useMemo(() => {
    const map = new Map<string, string>();
    finalCaptions.forEach((c) => map.set(c.speakerId, c.speakerName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [finalCaptions]);

  const filtered = useMemo(() => {
    return finalCaptions.filter((c) => {
      const matchesSpeaker = filterSpeaker === 'all' || c.speakerId === filterSpeaker;
      const matchesSearch = !searchQuery || c.text.toLowerCase().includes(searchQuery.toLowerCase()) || c.speakerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSpeaker && matchesSearch;
    });
  }, [finalCaptions, searchQuery, filterSpeaker]);

  const handleExportTxt = () => exportTranscriptTxt(filtered);
  const handleExportJson = () => exportTranscriptJson(filtered);
  const handleExportSrt = () => exportTranscriptSrt(filtered);

  return (
    <div className="page transcript-page">
      <TopNav rightContent={
        <button
          className="btn-ghost"
          onClick={() => navigate(sessionId ? `/session/${sessionId}/live` : '/')}
          aria-label="Back to live session"
        >
          ← Back to session
        </button>
      } />

      <main className="transcript-main" role="main">
        <div className="transcript-inner">

          {/* Header */}
          <div className="transcript-header">
            <div>
              <h1 className="headline-lg">Transcript</h1>
              {session && (
                <p className="body-md" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                  {session.name} &middot; {finalCaptions.length} utterances
                </p>
              )}
            </div>
            <div className="transcript-export-group">
              <button id="btn-export-txt" className="btn-secondary transcript-export-btn" onClick={handleExportTxt}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                TXT
              </button>
              <button id="btn-export-json" className="btn-secondary transcript-export-btn" onClick={handleExportJson}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                JSON
              </button>
              <button id="btn-export-srt" className="btn-secondary transcript-export-btn" onClick={handleExportSrt}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                SRT
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="transcript-filters">
            <div className="transcript-search-wrap">
              <svg className="transcript-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="transcript-search"
                className="input-field transcript-search"
                type="search"
                placeholder="Search transcript…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search transcript"
              />
            </div>

            <div className="transcript-speaker-filter" role="group" aria-label="Filter by speaker">
              <button
                className={`transcript-filter-btn ${filterSpeaker === 'all' ? 'transcript-filter-btn--active' : ''}`}
                onClick={() => setFilterSpeaker('all')}
              >
                All
              </button>
              {uniqueSpeakers.map((s) => (
                <button
                  key={s.id}
                  className={`transcript-filter-btn ${filterSpeaker === s.id ? 'transcript-filter-btn--active' : ''}`}
                  onClick={() => setFilterSpeaker(s.id)}
                  style={filterSpeaker === s.id ? {
                    background: getSpeakerColor(
                      finalCaptions.find((c) => c.speakerId === s.id)?.speakerColorIndex ?? 1
                    ),
                    color: '#fff',
                    borderColor: getSpeakerColor(
                      finalCaptions.find((c) => c.speakerId === s.id)?.speakerColorIndex ?? 1
                    ),
                  } : {}}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Transcript entries */}
          {filtered.length === 0 ? (
            <div className="transcript-empty">
              <p className="body-lg" style={{ color: 'var(--text-muted)' }}>
                {finalCaptions.length === 0
                  ? 'No transcript yet. Join or run a live session first.'
                  : 'No results match your search.'}
              </p>
            </div>
          ) : (
            <ol className="transcript-list" aria-label="Transcript entries">
              {filtered.map((caption, i) => {
                const color = getSpeakerColor(caption.speakerColorIndex);
                const bg = getSpeakerBg(caption.speakerColorIndex);
                return (
                  <li key={caption.id} className="transcript-entry animate-fade-in">
                    <div className="transcript-entry-accent" style={{ background: color }} aria-hidden="true" />
                    <div className="transcript-entry-body">
                      <div className="transcript-entry-header">
                        <span
                          className="transcript-entry-speaker"
                          style={{ color }}
                        >
                          {caption.speakerName}
                        </span>
                        <time
                          className="transcript-entry-time label-mono"
                          dateTime={new Date(caption.startedAt).toISOString()}
                        >
                          {formatTime(caption.startedAt)}
                        </time>
                      </div>
                      <p className="transcript-entry-text body-lg">
                        {caption.text}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </main>
    </div>
  );
}
