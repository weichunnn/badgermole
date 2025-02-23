import { useState } from 'react';
import { Message } from '@/app/types';
import {
  isCurrentlySpeaking,
  synthesizeSpeech,
} from '@/lib/elevenlabs-service';

export function useImageAnalysis(videoRef: React.RefObject<HTMLVideoElement>) {
  const [response, setResponse] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  async function captureAndAnalyze() {
    if (!videoRef.current) return;

    if (isCurrentlySpeaking()) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');

      try {
        const response = await fetch('/api/ai/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageData,
            messages: messages,
          }),
        });

        const data = await response.json();
        if (data.description) {
          setResponse(data.description);
          setMessages(data.messages);
          await synthesizeSpeech(data.description);
          return data.description;
        }
      } catch (err) {
        console.error('Error analyzing image:', err);
      }
    }
    return null;
  }

  return { response, setResponse, messages, setMessages, captureAndAnalyze };
}
