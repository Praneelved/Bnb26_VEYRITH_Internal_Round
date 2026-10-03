// WebSocket client — connects to the backend and handles typed messages
import { useEffect, useRef, useCallback } from 'react';
import { useAppStore, type Caption, type Participant } from '../store';
import { getColorIndex } from '../utils';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

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
    (msg: WsMessage) => {
      switch (msg.type) {
        case 'caption_partial': {
          const p = msg.payload as {
            caption_id: string;
            speaker_id: string;
            speaker_name: string;
            text: string;
            started_at: number;
          };
          // Check if this partial already exists → update it
          const existing = useAppStore.getState().captions.find((c: Caption) => c.id === p.caption_id);
          if (existing) {
            updateCaption(p.caption_id, { text: p.text });
          } else {
            colorCounter++;
            const newCaption: Caption = {
              id: p.caption_id,
              speakerId: p.speaker_id,
              speakerName: p.speaker_name,
              speakerColorIndex: getColorIndex(colorCounter),
              text: p.text,
              state: 'partial',
              startedAt: p.started_at || Date.now(),
            };
            addCaption(newCaption);
          }
          // Mark speaker as speaking
          updateParticipant(p.speaker_id, { isSpeaking: true });
          break;
        }

        case 'caption_final': {
          const f = msg.payload as {
            caption_id: string;
            speaker_id: string;
            speaker_name: string;
            text: string;
            started_at: number;
            finalized_at: number;
          };
          const existingFinal = useAppStore.getState().captions.find((c: Caption) => c.id === f.caption_id);
          if (existingFinal) {
            updateCaption(f.caption_id, { text: f.text, state: 'final', finalizedAt: f.finalized_at });
          } else {
            colorCounter++;
            addCaption({
              id: f.caption_id,
              speakerId: f.speaker_id,
              speakerName: f.speaker_name,
              speakerColorIndex: getColorIndex(colorCounter),
              text: f.text,
              state: 'final',
              startedAt: f.started_at || Date.now(),
              finalizedAt: f.finalized_at,
            });
          }
          updateParticipant(f.speaker_id, { isSpeaking: false });
          break;
        }

        case 'participant_joined': {
          const pj = msg.payload as {
            id: string;
            name: string;
            role: 'host' | 'participant' | 'viewer';
          };
          colorCounter++;
          const newP: Participant = {
            id: pj.id,
            name: pj.name,
            role: pj.role,
            connectionState: 'connected',
            isSpeaking: false,
            isMuted: false,
            audioQuality: 'good',
            colorIndex: getColorIndex(colorCounter),
            joinedAt: Date.now(),
            hasVoiceProfile: false,
          };
          addParticipant(newP);
          break;
        }

        case 'participant_left': {
          const pl = msg.payload as { id: string };
          updateParticipant(pl.id, { connectionState: 'disconnected' });
          break;
        }

        case 'participant_reconnecting': {
          const pr = msg.payload as { id: string };
          updateParticipant(pr.id, { connectionState: 'reconnecting' });
          break;
        }

        case 'audio_quality': {
          const aq = msg.payload as { participant_id: string; quality: 'good' | 'degraded' | 'poor' };
          updateParticipant(aq.participant_id, { audioQuality: aq.quality });
          break;
        }

        case 'overlap_detected': {
          const od = msg.payload as { caption_ids: string[] };
          od.caption_ids.forEach((cid) => {
            updateCaption(cid, {
              isOverlap: true,
              overlapWith: od.caption_ids.filter((x) => x !== cid),
            });
          });
          break;
        }

        case 'session_state': {
          const ss = msg.payload as { phase: 'lobby' | 'enrollment' | 'live' | 'ended'; participants: Participant[] };
          const { session, setSession } = useAppStore.getState();
          if (session) setSession({ ...session, phase: ss.phase });
          // Sync participants
          ss.participants?.forEach((p: Participant) => {
            const exists = useAppStore.getState().participants.find((x: Participant) => x.id === p.id);
            if (exists) {
              updateParticipant(p.id, p);
            } else {
              colorCounter++;
              addParticipant({ ...p, colorIndex: getColorIndex(colorCounter) });
            }
          });
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

        default:
          break;
      }
    },
    [addCaption, updateCaption, addParticipant, updateParticipant, removeParticipant]
  );

  const connect = useCallback(() => {
    if (!sessionId || !token) return;

    const url = `${WS_BASE}/ws/session/${sessionId}?token=${token}`;
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
