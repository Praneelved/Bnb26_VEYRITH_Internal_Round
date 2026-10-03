// useCameraCapture hook — camera access management with graceful fallback
import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store';

export function useCameraCapture() {
  const { isVideoOn, setVideoStream, setIsVideoOn } = useAppStore();

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsVideoOn(false);
        setVideoStream(null);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      setVideoStream(stream);
      setIsVideoOn(true);
    } catch (err) {
      console.warn('Camera access unavailable or denied:', err);
      setIsVideoOn(false);
      setVideoStream(null);
    }
  }, [setVideoStream, setIsVideoOn]);

  const stopCamera = useCallback(() => {
    const { videoStream } = useAppStore.getState();
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
  }, [setVideoStream]);

  const toggleCamera = useCallback(() => {
    const { isVideoOn, videoStream } = useAppStore.getState();
    if (isVideoOn && videoStream) {
      videoStream.getVideoTracks().forEach((track) => (track.enabled = false));
      setIsVideoOn(false);
    } else if (!isVideoOn && videoStream) {
      videoStream.getVideoTracks().forEach((track) => (track.enabled = true));
      setIsVideoOn(true);
    } else {
      startCamera();
    }
  }, [startCamera, setIsVideoOn]);

  return { startCamera, stopCamera, toggleCamera };
}
