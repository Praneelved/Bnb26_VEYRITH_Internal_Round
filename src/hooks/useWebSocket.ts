// WebSocket client — connects to the backend and handles typed messages
import { useEffect, useRef, useCallback } from 'react';
import { useAppStore, type Caption, type Participant } from '../store';
import { getColorIndex } from '../utils';

// WS_BASE must NOT end with /
const WS_BASE = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'ws://localhost:8000')
  .replace(/^http/, 'ws')
  .replace(/\/$/, '');

export type WsMessageType =
  | 'audio_frame'
  | 'heartbeat'
  | 'enrollment'
  | 'resume'
  | 'caption_partial'
  | 'caption_final'
  | 'participant_joined'
  | 'participant_left'
  | 'participant_reconnecting'
  | 'audio_quality'
  | 'overlap_detected'
  | 'session_state'
  | 'session_started'
  | 'session_ended'
  | 'error';

export interface WsMessage {
  type: WsMessageType;
  payload: Record<string, unknown>;
}

let colorCounter = 0;

export function useWebSocket(sessionId: string | undefined, token: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    setWs,
    setConnectionStatus,
    addCaption,
    updateCaption,
    addParticipant,
    updateParticipant,
    removeParticipant,
    myParticipantId,
  } = useAppStore();

  const handleMessage = useCallback(
    (rawMsg: any) => {
      const msgType = rawMsg.type;
      const data = (rawMsg.payload && typeof rawMsg.payload === 'object')
        ? { ...rawMsg, ...rawMsg.payload }
        : rawMsg;

      switch (msgType) {
        case 'caption':
        case 'caption_partial': {
          const captionId = data.caption_id || data.id;
          const speakerId = data.speaker_id || data.speakerId;
          const speakerName = data.speaker_name || data.speakerName || 'Participant';
          const text = data.text || '';
          const startedAt = data.started_at || data.startedAt || Date.now();
          const isFinal = Boolean(data.is_final || data.isFinal || msgType === 'caption_final');

          if (!captionId) break;

          const existing = useAppStore.getState().captions.find((c: Caption) => c.id === captionId);
          if (existing) {
            updateCaption(captionId, {
              text,
              state: isFinal ? 'final' : 'partial',
              finalizedAt: isFinal ? Date.now() : undefined,
            });
          } else {
            colorCounter++;
            const newCaption: Caption = {
              id: captionId,
              speakerId: speakerId || 'speaker-unknown',
              speakerName,
              speakerColorIndex: getColorIndex(colorCounter),
              text,
              state: isFinal ? 'final' : 'partial',
              startedAt,
              finalizedAt: isFinal ? Date.now() : undefined,
            };
            addCaption(newCaption);
          }
          if (speakerId) {
            updateParticipant(speakerId, { isSpeaking: !isFinal });
          }
          break;
        }

        case 'caption_final': {
          const captionId = data.caption_id || data.id;
          const speakerId = data.speaker_id || data.speakerId;
          const speakerName = data.speaker_name || data.speakerName || 'Participant';
          const text = data.text || '';
          const startedAt = data.started_at || data.startedAt || Date.now();
          const finalizedAt = data.finalized_at || data.finalizedAt || Date.now();

          if (!captionId) break;

          const existingFinal = useAppStore.getState().captions.find((c: Caption) => c.id === captionId);
          if (existingFinal) {
            updateCaption(captionId, { text, state: 'final', finalizedAt });
          } else {
            colorCounter++;
            addCaption({
              id: captionId,
              speakerId: speakerId || 'speaker-unknown',
              speakerName,
              speakerColorIndex: getColorIndex(colorCounter),
              text,
              state: 'final',
              startedAt,
              finalizedAt,
            });
          }
          if (speakerId) {
            updateParticipant(speakerId, { isSpeaking: false });
          }
          break;
        }

        case 'participant_joined': {
          const id = data.id || data.participant_id;
          const name = data.name || data.display_name || 'Participant';
          const role = (data.role || 'participant') as 'host' | 'participant' | 'viewer';
          if (!id) break;

          const existing = useAppStore.getState().participants.find((p: Participant) => p.id === id);
          if (existing) {
            updateParticipant(id, { connectionState: 'connected', name, role });
          } else {
            colorCounter++;
            const newP: Participant = {
              id,
              name,
              role,
              connectionState: 'connected',
              isSpeaking: false,
              isMuted: false,
              audioQuality: 'good',
              colorIndex: getColorIndex(colorCounter),
              joinedAt: Date.now(),
              hasVoiceProfile: false,
            };
            addParticipant(newP);
          }
          break;
        }

        case 'participant_left': {
          const id = data.id || data.participant_id;
          if (id) {
            updateParticipant(id, { connectionState: 'disconnected' });
          }
          break;
        }

        case 'participant_reconnecting': {
          const id = data.id || data.participant_id;
          if (id) {
            updateParticipant(id, { connectionState: 'reconnecting' });
          }
          break;
        }

        case 'audio_quality': {
          const pid = data.participant_id || data.id;
          const quality = data.quality || 'good';
          if (pid) {
            updateParticipant(pid, { audioQuality: quality });
          }
          break;
        }

        case 'overlap_detected': {
          const captionIds = data.caption_ids || [];
          captionIds.forEach((cid: string) => {
            updateCaption(cid, {
              isOverlap: true,
              overlapWith: captionIds.filter((x: string) => x !== cid),
            });
          });
          break;
        }

        case 'session_state': {
          const phase = data.phase || data.status;
          const { session, setSession } = useAppStore.getState();
          if (session && phase) {
            setSession({
              ...session,
              phase: phase as any,
              name: data.name || session.name,
            });
          }
          if (Array.isArray(data.participants)) {
            data.participants.forEach((p: any) => {
              const pid = p.id || p.participant_id;
              if (!pid) return;
              const exists = useAppStore.getState().participants.find((x: Participant) => x.id === pid);
              if (exists) {
                updateParticipant(pid, {
                  name: p.name || p.display_name || exists.name,
                  role: p.role || exists.role,
                  connectionState: (p.connectionState || 'connected') as any,
                });
              } else {
                colorCounter++;
                addParticipant({
                  id: pid,
                  name: p.name || p.display_name || 'Participant',
                  role: (p.role || 'participant') as any,
                  connectionState: (p.connectionState || 'connected') as any,
                  isSpeaking: false,
                  isMuted: false,
                  audioQuality: 'good',
                  colorIndex: getColorIndex(colorCounter),
                  joinedAt: Date.now(),
                  hasVoiceProfile: false,
                });
              }
            });
          }
          break;
        }

        case 'session_started': {
          const { session, setSession } = useAppStore.getState();
          if (session) setSession({ ...session, phase: 'live', startedAt: Date.now() });
          break;
        }

        case 'session_ended': {
          const { session, setSession } = useAppStore.getState();
          if (session) setSession({ ...session, phase: 'ended', endedAt: Date.now() });
          break;
        }

        case 'chat_message': {
          const { addChatMessage } = useAppStore.getState();
          if (addChatMessage && data.text) {
            addChatMessage({
              senderId: data.sender_id || data.senderId || 'unknown',
              senderName: data.sender_name || data.senderName || 'Participant',
              text: data.text,
              colorIndex: 1,
            });
          }
          break;
        }

        case 'raise_hand': {
          const pid = data.participant_id || data.id;
          const raised = Boolean(data.raised !== undefined ? data.raised : true);
          if (pid) {
            updateParticipant(pid, { isHandRaised: raised });
          }
          break;
        }

        default:
          break;
      }
    },
    [addCaption, updateCaption, addParticipant, updateParticipant, removeParticipant]
  );

  const connect = useCallback(() => {
    if (!sessionId || !token) return;

    // Backend registers /ws/sessions/{id} (plural)
    const url = `${WS_BASE}/ws/sessions/${sessionId}?token=${token}`;
    setConnectionStatus({ wsState: 'connecting' });

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setWs(ws);

    ws.onopen = () => {
      setConnectionStatus({ wsState: 'connected' });
      // Start heartbeat
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const t = Date.now();
          ws.send(JSON.stringify({ type: 'heartbeat', payload: { client_ts: t } }));
        }
      }, 5000);
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        // Handle latency from heartbeat echo
        if (msg.type === 'heartbeat' && (msg.payload as Record<string, unknown>).client_ts) {
          const latencyMs = Date.now() - Number((msg.payload as Record<string, unknown>).client_ts);
          setConnectionStatus({ latencyMs });
        } else {
          handleMessage(msg);
        }
      } catch {
        console.error('WS parse error', event.data);
      }
    };

    ws.onclose = () => {
      setConnectionStatus({ wsState: 'disconnected' });
      setWs(null);
      wsRef.current = null;
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      // Mark current user as reconnecting
      if (myParticipantId) {
        updateParticipant(myParticipantId, { connectionState: 'reconnecting' });
      }
    };

    ws.onerror = () => {
      setConnectionStatus({ wsState: 'error' });
    };
  }, [sessionId, token, handleMessage, setConnectionStatus, setWs, myParticipantId, updateParticipant]);

  const disconnect = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
    setWs(null);
  }, [setWs]);

  const sendMessage = useCallback((type: WsMessageType, payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }, []);

  useEffect(() => {
    if (sessionId && token) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [sessionId, token]);

  return { sendMessage, connect, disconnect };
}
