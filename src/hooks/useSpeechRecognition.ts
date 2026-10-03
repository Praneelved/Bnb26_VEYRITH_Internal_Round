// useSpeechRecognition hook — Real-time WebSpeech ASR & WebSocket caption synchronization
import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store';

interface SpeechRecognitionOptions {
  sendMessage?: (type: any, data: any) => void;
  enabled?: boolean;
}

export function useSpeechRecognition({ sendMessage, enabled = true }: SpeechRecognitionOptions) {
  const {
    myParticipantId, userProfile, addCaption, updateCaption,
    updateParticipant, isRecording
  } = useAppStore();

  const recognitionRef = useRef<any>(null);
  const activeCaptionIdRef = useRef<string | null>(null);

  const startListening = useCallback(() => {
    if (!enabled || !isRecording) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech Recognition API not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        if (myParticipantId) {
          updateParticipant(myParticipantId, { isSpeaking: true });
        }
      };

      recognition.onresult = (event: any) => {
        const { myParticipantId, userProfile } = useAppStore.getState();
        const speakerName = userProfile.name || 'Participant';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const isFinal = result.isFinal;

          if (!activeCaptionIdRef.current) {
            const newId = `cap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            activeCaptionIdRef.current = newId;

            const captionObj = {
              id: newId,
              speakerId: myParticipantId || 'speaker-local',
              speakerName: speakerName,
              speakerColorIndex: 1 as const,
              text: transcript,
              state: isFinal ? ('final' as const) : ('partial' as const),
              startedAt: Date.now(),
              finalizedAt: isFinal ? Date.now() : undefined,
            };

            addCaption(captionObj);

            if (sendMessage) {
              sendMessage('caption', {
                type: 'caption',
                caption_id: newId,
                speaker_id: myParticipantId,
                speaker_name: speakerName,
                text: transcript,
                is_final: isFinal,
                timestamp: Date.now() / 1000,
              });
            }
          } else {
            const currentId = activeCaptionIdRef.current;
            updateCaption(currentId, {
              text: transcript,
              state: isFinal ? 'final' : 'partial',
              finalizedAt: isFinal ? Date.now() : undefined,
            });

            if (sendMessage) {
              sendMessage('caption', {
                type: 'caption',
                caption_id: currentId,
                speaker_id: myParticipantId,
                speaker_name: speakerName,
                text: transcript,
                is_final: isFinal,
                timestamp: Date.now() / 1000,
              });
            }
          }

          if (isFinal) {
            activeCaptionIdRef.current = null;
            if (myParticipantId) {
              updateParticipant(myParticipantId, { isSpeaking: false });
            }
          } else if (myParticipantId) {
            updateParticipant(myParticipantId, { isSpeaking: true });
          }
        }
      };

      recognition.onerror = (err: any) => {
        if (err.error !== 'no-speech') {
          console.warn('Speech recognition error:', err.error);
        }
      };

      recognition.onend = () => {
        if (myParticipantId) {
          updateParticipant(myParticipantId, { isSpeaking: false });
        }
        activeCaptionIdRef.current = null;

        // Restart continuous listening if still recording
        const store = useAppStore.getState();
        if (store.isRecording && enabled) {
          try {
            recognition.start();
          } catch { /* ignore */ }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
    }
  }, [enabled, isRecording, myParticipantId, userProfile, addCaption, updateCaption, updateParticipant, sendMessage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    activeCaptionIdRef.current = null;
  }, []);

  useEffect(() => {
    if (enabled && isRecording) {
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [enabled, isRecording]);

  return { startListening, stopListening };
}
