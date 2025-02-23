import { useEffect, useRef, useCallback } from 'react';
import { synthesizeSpeech } from '@/lib/elevenlabs-service';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',

          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      announceMessage('Camera access denied. Please enable camera access.');
      return false;
    }
    return true;
  }, []);

  const announceMessage = async (message: string) => {
    try {
      await synthesizeSpeech(message);
    } catch (error) {
      console.error('Error with ElevenLabs TTS:', error);
    }
  };

  useEffect(() => {
    initializeCamera();
    const video = videoRef.current; // Store ref value
    return () => {
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initializeCamera]);

  return { videoRef, canvasRef, announceMessage };
}
