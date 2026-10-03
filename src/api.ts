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
  return apiFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ name, host_name: hostName }),
  });
}

export async function joinSession(
  code: string,
  displayName: string,
  mode: 'participant' | 'viewer'
): Promise<JoinSessionResponse> {
  return apiFetch(`/api/sessions/${code}/join`, {
    method: 'POST',
    body: JSON.stringify({ display_name: displayName, mode }),
  });
}

export async function getSessionState(sessionId: string, token: string): Promise<SessionStateResponse> {
  return apiFetch(`/api/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function startSession(sessionId: string, token: string): Promise<void> {
  return apiFetch(`/api/sessions/${sessionId}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function endSession(sessionId: string, token: string): Promise<void> {
  return apiFetch(`/api/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function muteParticipant(
  sessionId: string,
  participantId: string,
  token: string
): Promise<void> {
  return apiFetch(`/api/sessions/${sessionId}/participants/${participantId}/mute`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function removeParticipant(
  sessionId: string,
  participantId: string,
  token: string
): Promise<void> {
  return apiFetch(`/api/sessions/${sessionId}/participants/${participantId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Evaluation ────────────────────────────────────────────────

export interface EvalResult {
  run_id: string;
  session_id: string;
  wer_single: number;
  wer_fused: number;
  speaker_accuracy: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  total_segments: number;
  mode: 'single' | 'fused';
  created_at: number;
}

export async function getEvalResults(sessionId: string, token: string): Promise<EvalResult[]> {
  return apiFetch(`/api/sessions/${sessionId}/eval`, {
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
