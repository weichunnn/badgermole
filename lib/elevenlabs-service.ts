import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient({
  apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
});

let isSpeaking = false;
let currentSpeechPromise: Promise<void> | null = null;

export const isCurrentlySpeaking = (): boolean => isSpeaking;

const playAudioWithUserGesture = async (
  audio: HTMLAudioElement
): Promise<void> => {
  try {
    await audio.play();
  } catch (error) {
    if (error instanceof Error && error.name === 'NotAllowedError') {
      // Create a user gesture requirement
      const playPromise = new Promise<void>((resolve) => {
        const handleUserGesture = async () => {
          try {
            await audio.play();
            document.removeEventListener('click', handleUserGesture);
            document.removeEventListener('touchstart', handleUserGesture);
            resolve();
          } catch (playError) {
            console.error('Error playing audio after user gesture:', playError);
          }
        };

        document.addEventListener('click', handleUserGesture);
        document.addEventListener('touchstart', handleUserGesture);
      });

      return playPromise;
    }
    throw error;
  }
};

export const synthesizeSpeech = async (text: string): Promise<void> => {
  if (currentSpeechPromise) {
    await currentSpeechPromise;
  }

  currentSpeechPromise = new Promise(async (resolve, reject) => {
    try {
      if (!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key is not configured');
      }

      isSpeaking = true;

      const audioStream = await client.textToSpeech.convertAsStream(
        process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'XfNU2rGpBa01ckF309OY', // nichalia schwartz
        {
          text,
          // Using Multilingual v2 for better emotional expression
          model_id: 'eleven_flash_v2_5',
          // Higher quality audio settings
          output_format: 'mp3_44100_128',
          // Voice settings for a warmer, more natural sound
        }
      );

      const chunks: Uint8Array[] = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }

      const blob = new Blob(chunks, { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        URL.revokeObjectURL(url);
        isSpeaking = false;
        currentSpeechPromise = null;
        resolve();
      };

      audio.onerror = (error) => {
        isSpeaking = false;
        currentSpeechPromise = null;
        reject(error);
      };

      await playAudioWithUserGesture(audio);
    } catch (error) {
      console.error('ElevenLabs synthesis error:', error);
      isSpeaking = false;
      currentSpeechPromise = null;
      reject(error);
    }
  });

  return currentSpeechPromise;
};
