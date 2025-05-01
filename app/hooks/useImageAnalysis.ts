import { useState } from 'react';
import { Message } from '@/app/types';
import {
  isCurrentlySpeaking,
  synthesizeSpeech,
} from '@/lib/elevenlabs-service';

// Add this enum definition
enum MODE {
  QUERY = 'query',
  WALKING = 'walking',
}

export function useImageAnalysis(
  videoRef: React.RefObject<HTMLVideoElement>,
  transcription: string = ''
) {
  const [response, setResponse] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  async function captureAndAnalyze(currentTranscription?: string) {
    console.log('captureAndAnalyze called');
    if (!videoRef.current) return;
    console.log('videoRef.current', videoRef.current);
    //if (isCurrentlySpeaking()) {
    //  return;
    //}
    console.log('isCurrentlySpeaking', isCurrentlySpeaking());

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    console.log('adsfasfasdfsd');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');

      try {
        // Add logging to debug the request
        console.log('Sending vision request:', {
          transcription: currentTranscription || transcription,
        });

        console.log('trancri[tion?', currentTranscription);
        const response = await fetch(
          currentTranscription ? '/api/ai/visionQuery' : '/api/ai/vision',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: imageData,
              messages: messages,
              type: MODE.QUERY, // Now MODE is defined
              userQuery: currentTranscription || transcription,
            }),
          }
        );

        const data = await response.json();
        console.log('Vision response:', data);

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
