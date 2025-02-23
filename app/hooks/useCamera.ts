import { useEffect, useRef } from 'react';
import { synthesizeSpeech } from '@/lib/elevenlabs-service';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function initializeCamera() {
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
  }

  const announceMessage = async (message: string) => {
    try {
      await synthesizeSpeech(message);
    } catch (error) {
      console.error('Error with ElevenLabs TTS:', error);
    }
  };

  useEffect(() => {
    initializeCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return { videoRef, canvasRef, announceMessage };
}
