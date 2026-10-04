// API client — communicates with the FastAPI backend
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || 'http://localhost:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Session ──────────────────────────────────────────────────

export interface CreateSessionResponse {
  session_id: string;
  code: string;
  name: string;
  host_token: string;
  participant_id: string;
}

export interface JoinSessionResponse {
  session_id: string;
  code: string;
  name: string;
  participant_token: string;
  participant_id: string;
}

export interface SessionStateResponse {
  session_id: string;
  code: string;
  name: string;
  phase: 'lobby' | 'enrollment' | 'live' | 'ended';
  host_id: string;
  created_at: number;
  started_at?: number;
  ended_at?: number;
  participants: Array<{
    id: string;
    name: string;
    role: 'host' | 'participant' | 'viewer';
    connection_state: 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
    is_speaking: boolean;
    is_muted: boolean;
    audio_quality: 'good' | 'degraded' | 'poor' | 'unavailable';
    has_voice_profile: boolean;
  }>;
}

/** Lookup session info by code — used on the join page to verify the meeting exists */
export async function lookupSession(code: string): Promise<{ session_id: string; code: string; name: string; status: string }> {
  // The backend GET /api/sessions/{id} works with session_id; we need code lookup.
  // Use the join endpoint with a HEAD-like pre-check via GET on sessions filtered by code.
  // Since the backend doesn't have a GET-by-code endpoint, we try to join as viewer briefly
  // OR we expose a lightweight check. For now call the participants list or just GET sessions.
  // Fallback: if VITE_API_URL not set, return stub.
  try {
    const res = await apiFetch<{
      session_id?: string;
      id?: string;
      code: string;
      status: string;
      name?: string;
    }>(`/api/sessions/code/${code.toUpperCase()}`);
    return {
      session_id: res.session_id || res.id || '',
      code: res.code,
      name: res.name || code,
      status: res.status,
    };
  } catch {
    // If no dedicated endpoint, fall back silently — join will verify anyway
    return { session_id: '', code, name: '', status: 'unknown' };
  }
}

export async function createSession(
  name: string,
  hostName: string
): Promise<CreateSessionResponse> {
  // Step 1: create the session
  const raw = await apiFetch<{
    session_id: string;
    code: string;
    status: string;
    mode: string;
    host_participant_id?: string;
  }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ name, host_name: hostName }),
  });

  // Step 2: join as host to get a valid JWT token and participant ID
  const joinResp = await apiFetch<{
    participant_id: string;
    session_id: string;
    code: string;
    role: string;
    token: string;
    resume_token: string;
  }>(`/api/sessions/${raw.code}/join`, {
    method: 'POST',
    body: JSON.stringify({ name: hostName, role: 'host' }),
  });

  return {
    session_id: joinResp.session_id,
    code: joinResp.code,
    name,
    host_token: joinResp.token,
    participant_id: joinResp.participant_id,
  };
}

export async function joinSession(
  code: string,
  displayName: string,
  mode: 'participant' | 'viewer'
): Promise<JoinSessionResponse> {
  const resp = await apiFetch<{
    participant_id: string;
    session_id: string;
    code: string;
    name?: string;
    role: string;
    token: string;
    resume_token: string;
  }>(`/api/sessions/${code}/join`, {
    method: 'POST',
    body: JSON.stringify({ name: displayName, role: mode }),
  });
  return {
    session_id: resp.session_id,
    code: resp.code,
    name: resp.name || 'Roundtable',
    participant_token: resp.token,
    participant_id: resp.participant_id,
  };
}

export async function getSessionState(sessionId: string, token: string): Promise<SessionStateResponse> {
  return apiFetch(`/api/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function startSession(sessionId: string, token: string): Promise<void> {
  await apiFetch(`/api/sessions/${sessionId}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function endSession(sessionId: string, token: string): Promise<void> {
  await apiFetch(`/api/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function muteParticipant(
  sessionId: string,
  participantId: string,
  token: string
): Promise<void> {
  await apiFetch(`/api/sessions/${sessionId}/participants/${participantId}/mute`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function removeParticipantApi(
  sessionId: string,
  participantId: string,
  token: string
): Promise<void> {
  await apiFetch(`/api/sessions/${sessionId}/participants/${participantId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Transcript ────────────────────────────────────────────────

export interface TranscriptEntry {
  id: string;
  speaker_id: string;
  speaker_name: string;
  text: string;
  started_at: number;
  finalized_at?: number;
}

export async function getTranscript(sessionId: string, token: string): Promise<TranscriptEntry[]> {
  return apiFetch(`/api/sessions/${sessionId}/transcript`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Scheduled Meetings ────────────────────────────────────────

export interface ScheduledMeeting {
  id: string;
  title: string;
  code: string;
  session_id: string;
  scheduled_start: string;   // ISO datetime string
  scheduled_end?: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  created_at: string;
}

export interface ScheduleMeetingRequest {
  title: string;
  scheduled_start: string;   // ISO datetime
  scheduled_end?: string;
  description?: string;
  host_name: string;
}

export async function scheduleMeeting(payload: ScheduleMeetingRequest): Promise<ScheduledMeeting> {
  return apiFetch<ScheduledMeeting>('/api/scheduled', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getScheduledMeetings(): Promise<ScheduledMeeting[]> {
  return apiFetch<ScheduledMeeting[]>('/api/scheduled');
}

export async function cancelScheduledMeeting(id: string, token: string): Promise<void> {
  await apiFetch(`/api/scheduled/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Demo/offline mode ─────────────────────────────────────────
// ONLY used when VITE_DEMO_MODE=true is explicitly set

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

import { generateId, generateRoomCode } from './utils';

export function createDemoSession(name: string, hostName: string): CreateSessionResponse {
  const code = generateRoomCode();
  const sessionId = `demo-${code}`;
  return {
    session_id: sessionId,
    code,
    name,
    host_token: `demo-host-${code}`,
    participant_id: generateId(),
  };
}

/** 
 * CRITICAL FIX: joinDemoSession must use a STABLE session_id derived from the code,
 * NOT a fresh generateId() — otherwise each browser tab joins a different session.
 */
export function joinDemoSession(code: string, _displayName: string): JoinSessionResponse {
  // Derive a deterministic session ID from the code so all tabs share the same session
  const sessionId = `demo-${code.toUpperCase()}`;
  return {
    session_id: sessionId,
    code: code.toUpperCase(),
    name: 'Roundtable',
    participant_token: `demo-participant-${code}`,
    participant_id: generateId(),
  };
}
