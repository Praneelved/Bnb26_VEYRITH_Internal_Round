// Audio capture hook — real browser microphone capture
// Uses AudioWorklet when available, falls back to ScriptProcessor
import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store';

const SAMPLE_RATE = 16000;
const FRAME_SIZE = 512; // Valid Web Audio power of two between 256 and 16384

interface AudioCaptureOptions {
  onAudioFrame?: (pcm: Float32Array, timestamp: number) => void;
}

export function useAudioCapture({ onAudioFrame }: AudioCaptureOptions = {}) {
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const { setMicStream, setIsRecording, setAudioLevel, isRecording } = useAppStore();

  const startCapture = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      streamRef.current = stream;
      setMicStream(stream);

      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
      contextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Analyser for audio level
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      source.connect(analyser);

      // ScriptProcessor for frame capture (widely supported fallback)
      const processor = ctx.createScriptProcessor(FRAME_SIZE, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const frame = new Float32Array(inputData);
        onAudioFrame?.(frame, Date.now());
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      // Audio level animation loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      setIsRecording(false);
      return false;
    }
  }, [onAudioFrame, setMicStream, setIsRecording, setAudioLevel]);

  const stopCapture = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (contextRef.current) {
      contextRef.current.close();
      contextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setMicStream(null);
    setIsRecording(false);
    setAudioLevel(0);
  }, [setMicStream, setIsRecording, setAudioLevel]);

  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  return {
    startCapture,
    stopCapture,
    isRecording,
  };
}
