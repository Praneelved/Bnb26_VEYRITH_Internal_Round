// Store — shared application state using Zustand
import { create } from 'zustand';

export type ParticipantRole = 'host' | 'participant' | 'viewer';
export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
export type CaptionState = 'partial' | 'final';
export type SessionPhase = 'lobby' | 'enrollment' | 'live' | 'ended';
export type LayoutMode = 'grid' | 'spotlight' | 'sidebar';
export type ActivePanel = 'none' | 'participants' | 'chat' | 'transcript' | 'settings';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  connectionState: ConnectionState;
  isSpeaking: boolean;
  isMuted: boolean;
  isHandRaised?: boolean;
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
  translatedText?: string;
  targetLang?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  colorIndex: 1 | 2 | 3 | 4;
}

export interface ToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
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
  areCaptionsOn: boolean;
  selectedLanguage: string;

  // Hand Raised
  isHandRaised: boolean;
  raisedHands: string[];

  // Screen Share & Layout
  isScreenSharing: boolean;
  screenShareStream: MediaStream | null;
  layoutMode: LayoutMode;
  pinnedParticipantId: string | null;

  // Side Panels
  activePanel: ActivePanel;

  // Chat
  chatMessages: ChatMessage[];
  unreadChatCount: number;

  // Connection
  connectionStatus: ConnectionStatus;
  ws: WebSocket | null;

  // Audio & Video
  micStream: MediaStream | null;
  videoStream: MediaStream | null;
  isRecording: boolean;
  isVideoOn: boolean;
  audioLevel: number;
  isNoiseSuppressionOn: boolean;
  isBackgroundBlurOn: boolean;

  // Toasts
  toasts: ToastItem[];

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
  setAreCaptionsOn: (v: boolean) => void;
  setSelectedLanguage: (lang: string) => void;
  setIsHandRaised: (v: boolean) => void;
  toggleRaisedHand: (participantId?: string) => void;
  setIsScreenSharing: (v: boolean) => void;
  setScreenShareStream: (stream: MediaStream | null) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setPinnedParticipantId: (id: string | null) => void;
  setActivePanel: (panel: ActivePanel) => void;
  addChatMessage: (msg: { senderId: string; senderName: string; text: string; colorIndex?: 1 | 2 | 3 | 4 }) => void;
  clearUnreadChat: () => void;
  setConnectionStatus: (s: Partial<ConnectionStatus>) => void;
  setWs: (ws: WebSocket | null) => void;
  setMicStream: (stream: MediaStream | null) => void;
  setVideoStream: (stream: MediaStream | null) => void;
  setIsRecording: (v: boolean) => void;
  setIsVideoOn: (v: boolean) => void;
  setAudioLevel: (level: number) => void;
  setIsNoiseSuppressionOn: (v: boolean) => void;
  setIsBackgroundBlurOn: (v: boolean) => void;
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
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

// Chat messages start empty — messages are added only when real participants send them
const initialChatMessages: ChatMessage[] = [];

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  myParticipantId: null,
  myRole: null,
  userProfile: defaultUserProfile,
  participants: [],
  captions: [],
  activePartialCaptionId: null,
  areCaptionsOn: true,
  selectedLanguage: 'en',
  isHandRaised: false,
  raisedHands: [],
  isScreenSharing: false,
  screenShareStream: null,
  layoutMode: 'grid',
  pinnedParticipantId: null,
  activePanel: 'none',
  chatMessages: initialChatMessages,
  unreadChatCount: 0,
  connectionStatus: initialConnectionStatus,
  ws: null,
  micStream: null,
  videoStream: null,
  isRecording: true,
  isVideoOn: true,
  audioLevel: 0,
  isNoiseSuppressionOn: true,
  isBackgroundBlurOn: false,
  toasts: [],
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

  setAreCaptionsOn: (areCaptionsOn) => set({ areCaptionsOn }),
  setSelectedLanguage: (selectedLanguage) => set({ selectedLanguage }),

  setIsHandRaised: (isHandRaised) => {
    const { myParticipantId, participants } = get();
    set({
      isHandRaised,
      participants: myParticipantId
        ? participants.map((p) => (p.id === myParticipantId ? { ...p, isHandRaised } : p))
        : participants,
    });
  },

  toggleRaisedHand: (participantId) => {
    const { isHandRaised, myParticipantId, participants } = get();
    const targetId = participantId || myParticipantId;
    if (!targetId) return;

    if (targetId === myParticipantId) {
      const next = !isHandRaised;
      set({
        isHandRaised: next,
        participants: participants.map((p) => (p.id === targetId ? { ...p, isHandRaised: next } : p)),
      });
      get().addToast(next ? '✋ You raised your hand' : 'Hand lowered', 'info');
    } else {
      set({
        participants: participants.map((p) =>
          p.id === targetId ? { ...p, isHandRaised: !p.isHandRaised } : p
        ),
      });
    }
  },

  setIsScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setScreenShareStream: (screenShareStream) => set({ screenShareStream }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),
  setPinnedParticipantId: (pinnedParticipantId) => set({ pinnedParticipantId }),

  setActivePanel: (activePanel) => {
    set({ activePanel });
    if (activePanel === 'chat') {
      set({ unreadChatCount: 0 });
    }
  },

  addChatMessage: (msg) =>
    set((s) => {
      const newMsg: ChatMessage = {
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderId: msg.senderId,
        senderName: msg.senderName,
        text: msg.text,
        timestamp: Date.now(),
        colorIndex: msg.colorIndex || 1,
      };
      return {
        chatMessages: [...s.chatMessages, newMsg],
        unreadChatCount: s.activePanel !== 'chat' ? s.unreadChatCount + 1 : 0,
      };
    }),

  clearUnreadChat: () => set({ unreadChatCount: 0 }),

  setConnectionStatus: (status) =>
    set((s) => ({ connectionStatus: { ...s.connectionStatus, ...status } })),

  setWs: (ws) => set({ ws }),
  setMicStream: (micStream) => set({ micStream }),
  setVideoStream: (videoStream) => set({ videoStream }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsVideoOn: (isVideoOn) => set({ isVideoOn }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setIsNoiseSuppressionOn: (isNoiseSuppressionOn) => set({ isNoiseSuppressionOn }),
  setIsBackgroundBlurOn: (isBackgroundBlurOn) => set({ isBackgroundBlurOn }),

  addToast: (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const newToast: ToastItem = { id, message, type, duration: 2800 };
    set((s) => ({ toasts: [...s.toasts, newToast] }));

    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 2800);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

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
      areCaptionsOn: true,
      selectedLanguage: 'en',
      isHandRaised: false,
      raisedHands: [],
      isScreenSharing: false,
      screenShareStream: null,
      layoutMode: 'grid',
      pinnedParticipantId: null,
      activePanel: 'none',
      connectionStatus: initialConnectionStatus,
      ws: null,
      micStream: null,
      videoStream: null,
      isRecording: true,
      isVideoOn: true,
      audioLevel: 0,
      unreadChatCount: 0,
      toasts: [],
    }),
}));
