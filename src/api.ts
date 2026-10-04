// API client — communicates with the FastAPI backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

export async function createSession(
  name: string,
  hostName: string
): Promise<CreateSessionResponse> {
  try {
    const raw = await apiFetch<{
      session_id: string;
      code: string;
      host_token?: string;
      participant_id?: string;
    }>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ name, host_name: hostName }),
    });

    // If backend didn't return host_token directly, join the room as host to acquire valid JWT token
    if (!raw.host_token && raw.code) {
      const joinResp = await apiFetch<{
        participant_id: string;
        token: string;
      }>(`/api/sessions/${raw.code}/join`, {
        method: 'POST',
        body: JSON.stringify({ name: hostName, role: 'host' }),
      });
      return {
        session_id: raw.session_id,
        code: raw.code,
        name,
        host_token: joinResp.token,
        participant_id: joinResp.participant_id,
      };
    }

    return {
      session_id: raw.session_id,
      code: raw.code,
      name,
      host_token: raw.host_token || 'demo-host-token',
      participant_id: raw.participant_id || 'demo-host-id',
    };
  } catch (err) {
    console.warn('Backend unavailable, falling back to client-side session:', err);
    return createDemoSession(name, hostName);
  }
}

export async function joinSession(
  code: string,
  displayName: string,
  mode: 'participant' | 'viewer'
): Promise<JoinSessionResponse> {
  try {
    const resp = await apiFetch<{
      participant_id: string;
      session_id: string;
      code: string;
      token: string;
    }>(`/api/sessions/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ name: displayName, role: mode }),
    });
    return {
      session_id: resp.session_id,
      code: resp.code,
      name: 'Roundtable',
      participant_token: resp.token,
      participant_id: resp.participant_id,
    };
  } catch (err) {
    console.warn('Backend unavailable, falling back to client-side join:', err);
    return joinDemoSession(code, displayName);
  }
}

export async function getSessionState(sessionId: string, token: string): Promise<SessionStateResponse> {
  try {
    return await apiFetch(`/api/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return {
      session_id: sessionId,
      code: 'RT-DEMO',
      name: 'Roundtable Live Session',
      phase: 'live',
      host_id: 'host-1',
      created_at: Date.now(),
      participants: [],
    };
  }
}

export async function startSession(sessionId: string, token: string): Promise<void> {
  try {
    await apiFetch(`/api/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // client mode fallback
  }
}

export async function endSession(sessionId: string, token: string): Promise<void> {
  try {
    await apiFetch(`/api/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // client mode fallback
  }
}

export async function muteParticipant(
  sessionId: string,
  participantId: string,
  token: string
): Promise<void> {
  try {
    await apiFetch(`/api/sessions/${sessionId}/participants/${participantId}/mute`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // client mode fallback
  }
}

export async function removeParticipant(
  sessionId: string,
  participantId: string,
  token: string
): Promise<void> {
  try {
    await apiFetch(`/api/sessions/${sessionId}/participants/${participantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // client mode fallback
  }
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

// ── Demo/offline mode ─────────────────────────────────────────
// When no backend is reachable, return mock data

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

import { generateId, generateRoomCode } from './utils';

export function createDemoSession(name: string, hostName: string): CreateSessionResponse {
  return {
    session_id: generateId(),
    code: generateRoomCode(),
    name,
    host_token: 'demo-host-token',
    participant_id: generateId(),
  };
}

export function joinDemoSession(code: string, displayName: string): JoinSessionResponse {
  return {
    session_id: generateId(),
    code,
    name: 'Demo Roundtable',
    participant_token: 'demo-participant-token',
    participant_id: generateId(),
  };
}
