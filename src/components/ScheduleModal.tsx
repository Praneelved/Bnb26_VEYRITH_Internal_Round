// ScheduleMeetingModal — schedule future Roundtable sessions with calendar sync
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  scheduleMeeting,
  getScheduledMeetings,
  cancelScheduledMeeting,
  type ScheduledMeeting,
} from '../api';
import { copyToClipboard, buildJoinUrl } from '../utils';
import { useAppStore } from '../store';
import './ScheduleModal.css';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'schedule' | 'upcoming';
}

export function ScheduleModal({ isOpen, onClose, initialTab = 'schedule' }: ScheduleModalProps) {
  const navigate = useNavigate();
  const { addToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<'schedule' | 'upcoming'>(initialTab);

  // Form states
  const [title, setTitle] = useState('');
  const [hostName, setHostName] = useState('Praneel');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Success view state
  const [scheduledResult, setScheduledResult] = useState<ScheduledMeeting | null>(null);

  // Upcoming meetings list
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setScheduledResult(null);
      setError('');
      loadUpcoming();
    }
  }, [isOpen, initialTab]);

  const loadUpcoming = async () => {
    setLoadingMeetings(true);
    try {
      const list = await getScheduledMeetings();
      setMeetings(list || []);
    } catch {
      // In demo mode or if offline, return local stub if any
    } finally {
      setLoadingMeetings(false);
    }
  };

  if (!isOpen) return null;

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a meeting title.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const res = await scheduleMeeting({
        title: title.trim(),
        scheduled_start: startDateTime.toISOString(),
        scheduled_end: endDateTime.toISOString(),
        host_name: hostName.trim() || 'Host',
        description: description.trim() || undefined,
      });

      setScheduledResult(res);
      addToast('Meeting scheduled successfully!', 'success');
      loadUpcoming();
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = async (meeting: ScheduledMeeting) => {
    const joinUrl = buildJoinUrl(meeting.code);
    const dateFormatted = new Date(meeting.scheduled_start).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const inviteText = `You're invited to a Roundtable meeting!\n\nTopic: ${meeting.title}\nTime: ${dateFormatted}\n\nJoin Link: ${joinUrl}\nMeeting Code: ${meeting.code}`;

    await copyToClipboard(inviteText);
    addToast('Meeting invite copied to clipboard!', 'info');
  };

  const handleGoogleCalendar = (meeting: ScheduledMeeting) => {
    const startIso = new Date(meeting.scheduled_start)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, '');
    const endIso = meeting.scheduled_end
      ? new Date(meeting.scheduled_end).toISOString().replace(/-|:|\.\d\d\d/g, '')
      : startIso;

    const joinUrl = buildJoinUrl(meeting.code);
    const details = encodeURIComponent(
      `Join Roundtable Meeting:\n${joinUrl}\n\nMeeting Code: ${meeting.code}\n\n${meeting.description || ''}`
    );
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      meeting.title
    )}&dates=${startIso}/${endIso}&details=${details}&location=${encodeURIComponent(joinUrl)}`;

    window.open(gcalUrl, '_blank');
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled meeting?')) return;
    try {
      const token = sessionStorage.getItem('rt_token') || 'demo-token';
      await cancelScheduledMeeting(meetingId, token);
      addToast('Meeting cancelled', 'info');
      loadUpcoming();
    } catch {
      // Optimistic update
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      addToast('Meeting cancelled', 'info');
    }
  };

  const handleJoinScheduled = (meeting: ScheduledMeeting) => {
    onClose();
    navigate(`/join/${meeting.code}`);
  };

  return (
    <div className="schedule-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="schedule-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-modal-header">
          <div className="schedule-title-wrap">
            <div className="schedule-icon-badge" aria-hidden="true">
              📅
            </div>
            <h2 className="schedule-modal-title">Roundtable Meetings</h2>
          </div>
          <button className="schedule-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="schedule-tabs" role="tablist">
          <button
            className={`schedule-tab ${activeTab === 'schedule' ? 'schedule-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('schedule');
              setScheduledResult(null);
            }}
            role="tab"
            aria-selected={activeTab === 'schedule'}
          >
            Schedule New
          </button>
          <button
            className={`schedule-tab ${activeTab === 'upcoming' ? 'schedule-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('upcoming');
              loadUpcoming();
            }}
            role="tab"
            aria-selected={activeTab === 'upcoming'}
          >
            Upcoming Meetings {meetings.length > 0 ? `(${meetings.length})` : ''}
          </button>
        </div>

        <div className="schedule-modal-body">
          {activeTab === 'schedule' && !scheduledResult && (
            <form onSubmit={handleScheduleSubmit} className="schedule-form">
              <div className="schedule-form-group">
                <label className="schedule-form-label" htmlFor="sched-title">
                  Meeting Title *
                </label>
                <input
                  id="sched-title"
                  className="schedule-form-input"
                  type="text"
                  placeholder="e.g. Design Sprint Planning"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="schedule-form-group">
                <label className="schedule-form-label" htmlFor="sched-host">
                  Host Name
                </label>
                <input
                  id="sched-host"
                  className="schedule-form-input"
                  type="text"
                  placeholder="Your Name"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                />
              </div>

              <div className="schedule-form-row">
                <div className="schedule-form-group">
                  <label className="schedule-form-label" htmlFor="sched-date">
                    Date
                  </label>
                  <input
                    id="sched-date"
                    className="schedule-form-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="schedule-form-group">
                  <label className="schedule-form-label" htmlFor="sched-time">
                    Start Time
                  </label>
                  <input
                    id="sched-time"
                    className="schedule-form-input"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="schedule-form-group">
                <label className="schedule-form-label" htmlFor="sched-duration">
                  Duration
                </label>
                <select
                  id="sched-duration"
                  className="schedule-form-select"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                </select>
              </div>

              <div className="schedule-form-group">
                <label className="schedule-form-label" htmlFor="sched-desc">
                  Agenda / Description (optional)
                </label>
                <textarea
                  id="sched-desc"
                  className="schedule-form-textarea"
                  rows={2}
                  placeholder="Key topics to discuss..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {error && (
                <div
                  style={{
                    color: '#ef4444',
                    fontSize: 13,
                    background: '#fef2f2',
                    padding: '8px 12px',
                    borderRadius: 8,
                  }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                id="btn-confirm-schedule"
                type="submit"
                className="schedule-submit-btn"
                disabled={loading || !title.trim()}
              >
                {loading ? 'Scheduling…' : 'Schedule Meeting'}
              </button>
            </form>
          )}

          {activeTab === 'schedule' && scheduledResult && (
            <div className="schedule-success-card animate-fade-in">
              <div className="schedule-success-icon">✓</div>
              <h3 className="schedule-success-title">Meeting Scheduled!</h3>
              <p className="schedule-success-subtitle">
                Your meeting has been reserved with an active join code.
              </p>

              <div className="schedule-details-box">
                <div className="schedule-detail-row">
                  <span className="schedule-detail-label">Title</span>
                  <span className="schedule-detail-val">{scheduledResult.title}</span>
                </div>
                <div className="schedule-detail-row">
                  <span className="schedule-detail-label">Code</span>
                  <span className="schedule-code-badge">{scheduledResult.code}</span>
                </div>
                <div className="schedule-detail-row">
                  <span className="schedule-detail-label">Date & Time</span>
                  <span className="schedule-detail-val">
                    {new Date(scheduledResult.scheduled_start).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="schedule-detail-row">
                  <span className="schedule-detail-label">Join URL</span>
                  <span
                    className="schedule-detail-val truncate"
                    style={{ maxWidth: 220, fontSize: 12, color: '#2563eb' }}
                  >
                    {buildJoinUrl(scheduledResult.code)}
                  </span>
                </div>
              </div>

              <div className="schedule-actions-row">
                <button
                  className="schedule-btn-secondary"
                  onClick={() => handleCopyInvite(scheduledResult)}
                >
                  📋 Copy Invite
                </button>
                <button
                  className="schedule-btn-secondary"
                  onClick={() => handleGoogleCalendar(scheduledResult)}
                >
                  🗓️ Google Calendar
                </button>
              </div>

              <button
                className="schedule-submit-btn"
                style={{ width: '100%' }}
                onClick={() => handleJoinScheduled(scheduledResult)}
              >
                Join Meeting Room Now
              </button>
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div className="scheduled-list">
              {loadingMeetings ? (
                <div className="scheduled-empty">
                  <span className="spinner" />
                  <p>Loading scheduled meetings…</p>
                </div>
              ) : meetings.length === 0 ? (
                <div className="scheduled-empty">
                  <span style={{ fontSize: 36 }}>📅</span>
                  <p style={{ fontWeight: 600, color: '#334155', margin: 0 }}>
                    No upcoming meetings
                  </p>
                  <p style={{ fontSize: 13, margin: 0 }}>
                    Schedule a future session to share with your team.
                  </p>
                  <button
                    className="schedule-submit-btn"
                    style={{ marginTop: 8 }}
                    onClick={() => setActiveTab('schedule')}
                  >
                    Schedule Now
                  </button>
                </div>
              ) : (
                meetings.map((m) => (
                  <div key={m.id} className="scheduled-item">
                    <div className="scheduled-item-top">
                      <div>
                        <h4 className="scheduled-item-title">{m.title}</h4>
                        <div className="scheduled-item-time">
                          <span>🕒</span>
                          <span>
                            {new Date(m.scheduled_start).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                      <span className={`scheduled-item-badge scheduled-item-badge--${m.status}`}>
                        {m.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="schedule-detail-label">Room Code:</span>
                      <span className="schedule-code-badge">{m.code}</span>
                    </div>

                    <div className="scheduled-item-actions">
                      <button
                        className="scheduled-action-btn scheduled-action-btn--primary"
                        onClick={() => handleJoinScheduled(m)}
                      >
                        Join Room
                      </button>
                      <button
                        className="scheduled-action-btn scheduled-action-btn--ghost"
                        onClick={() => handleCopyInvite(m)}
                      >
                        Copy Link
                      </button>
                      <button
                        className="scheduled-action-btn scheduled-action-btn--ghost"
                        onClick={() => handleGoogleCalendar(m)}
                      >
                        Calendar
                      </button>
                      <button
                        className="scheduled-action-btn scheduled-action-btn--danger"
                        onClick={() => handleCancelMeeting(m.id)}
                        title="Cancel Meeting"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
