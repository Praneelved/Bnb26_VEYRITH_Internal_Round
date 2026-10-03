// Store — shared application state using Zustand
import { create } from 'zustand';

export type ParticipantRole = 'host' | 'participant' | 'viewer';
export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
export type CaptionState = 'partial' | 'final';
export type SessionPhase = 'lobby' | 'enrollment' | 'live' | 'ended';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  connectionState: ConnectionState;
  isSpeaking: boolean;
  isMuted: boolean;
  audioQuality: 'good' | 'degraded' | 'poor' | 'unavailable';
  colorIndex: 1 | 2 | 3 | 4;
  joinedAt: number;
  hasVoiceProfile: boolean;
  deviceId?: string;
  videoStream?: MediaStream | null;
  isVideoOn?: boolean;
}

export interface Caption {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerColorIndex: 1 | 2 | 3 | 4;
  text: string;
  state: CaptionState;
  startedAt: number;
  finalizedAt?: number;
  isOverlap?: boolean;
  overlapWith?: string[];
}

export interface SessionInfo {
  id: string;
  name: string;
  code: string;
  phase: SessionPhase;
  hostId: string;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  participantCount: number;
}

export interface ConnectionStatus {
  wsState: 'connecting' | 'connected' | 'disconnected' | 'error';
  latencyMs: number;
  audioMode: 'single' | 'fused';
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface AppState {
  // Session
  session: SessionInfo | null;
  myParticipantId: string | null;
  myRole: ParticipantRole | null;

  // Profile
  userProfile: UserProfile;

  // Participants
  participants: Participant[];

  // Captions
  captions: Caption[];
  activePartialCaptionId: string | null;

  // Connection
  connectionStatus: ConnectionStatus;
  ws: WebSocket | null;

  // Audio & Video
  micStream: MediaStream | null;
  videoStream: MediaStream | null;
  isRecording: boolean;
  isVideoOn: boolean;
  audioLevel: number;

  // Settings
  captionFontSize: 'sm' | 'md' | 'lg';
  theme: 'light' | 'dark';

  // Actions
  setSession: (session: SessionInfo | null) => void;
  setMyParticipantId: (id: string | null) => void;
  setMyRole: (role: ParticipantRole | null) => void;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  addParticipant: (p: Participant) => void;
  updateParticipant: (id: string, update: Partial<Participant>) => void;
  removeParticipant: (id: string) => void;
  addCaption: (c: Caption) => void;
  updateCaption: (id: string, update: Partial<Caption>) => void;
  setConnectionStatus: (s: Partial<ConnectionStatus>) => void;
  setWs: (ws: WebSocket | null) => void;
  setMicStream: (stream: MediaStream | null) => void;
  setVideoStream: (stream: MediaStream | null) => void;
  setIsRecording: (v: boolean) => void;
  setIsVideoOn: (v: boolean) => void;
  setAudioLevel: (level: number) => void;
  setCaptionFontSize: (size: 'sm' | 'md' | 'lg') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  resetSession: () => void;
}

const initialConnectionStatus: ConnectionStatus = {
  wsState: 'disconnected',
  latencyMs: 0,
  audioMode: 'single',
};

const defaultUserProfile: UserProfile = {
  name: 'Praneel Ved',
  email: 'praneel.ved@example.com',
  phone: '+1 (555) 019-2834',
  role: 'Host & Developer',
};

export const useAppStore = create<AppState>((set) => ({
  session: null,
  myParticipantId: null,
  myRole: null,
  userProfile: defaultUserProfile,
  participants: [],
  captions: [],
  activePartialCaptionId: null,
  connectionStatus: initialConnectionStatus,
  ws: null,
  micStream: null,
  videoStream: null,
  isRecording: false,
  isVideoOn: true,
  audioLevel: 0,
  captionFontSize: 'md',
  theme: 'light',

  setSession: (session) => set({ session }),
  setMyParticipantId: (myParticipantId) => set({ myParticipantId }),
  setMyRole: (myRole) => set({ myRole }),
  setUserProfile: (profile) => set((s) => ({ userProfile: { ...s.userProfile, ...profile } })),

  addParticipant: (p) =>
    set((s) => ({ participants: [...s.participants, p] })),

  updateParticipant: (id, update) =>
    set((s) => ({
      participants: s.participants.map((p) => (p.id === id ? { ...p, ...update } : p)),
    })),

  removeParticipant: (id) =>
    set((s) => ({ participants: s.participants.filter((p) => p.id !== id) })),

  addCaption: (c) =>
    set((s) => ({
      captions: [...s.captions, c],
      activePartialCaptionId: c.state === 'partial' ? c.id : s.activePartialCaptionId,
    })),

  updateCaption: (id, update) =>
    set((s) => ({
      captions: s.captions.map((c) => (c.id === id ? { ...c, ...update } : c)),
      activePartialCaptionId:
        update.state === 'final' && s.activePartialCaptionId === id
          ? null
          : s.activePartialCaptionId,
    })),

  setConnectionStatus: (status) =>
    set((s) => ({ connectionStatus: { ...s.connectionStatus, ...status } })),

  setWs: (ws) => set({ ws }),
  setMicStream: (micStream) => set({ micStream }),
  setVideoStream: (videoStream) => set({ videoStream }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsVideoOn: (isVideoOn) => set({ isVideoOn }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setCaptionFontSize: (captionFontSize) => set({ captionFontSize }),
  setTheme: (theme) => set({ theme }),

  resetSession: () =>
    set({
      session: null,
      myParticipantId: null,
      myRole: null,
      participants: [],
      captions: [],
      activePartialCaptionId: null,
      connectionStatus: initialConnectionStatus,
      ws: null,
      micStream: null,
      videoStream: null,
      isRecording: false,
      isVideoOn: true,
      audioLevel: 0,
    }),
}));
