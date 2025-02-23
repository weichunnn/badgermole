import { useState, useRef } from 'react';

interface UseAudioRecordingProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

interface WebkitWindow extends Window {
  webkitAudioContext: typeof AudioContext;
}

export const useAudioRecording = ({
  onTranscriptionComplete,
  onError,
}: UseAudioRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<AudioWorkletNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as WebkitWindow).webkitAudioContext)();
      await audioContextRef.current.audioWorklet.addModule(
        '/audio-processor.js'
      );

      const source = audioContextRef.current.createMediaStreamSource(stream);
      recorderRef.current = new AudioWorkletNode(
        audioContextRef.current,
        'audio-recorder'
      );

      recorderRef.current.port.onmessage = (event) => {
        audioChunksRef.current.push(event.data);
      };

      source.connect(recorderRef.current);
      recorderRef.current.connect(audioContextRef.current.destination);

      setIsRecording(true);
    } catch (error) {
      console.error('Recording initialization error:', error);
      onError('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    if (!audioContextRef.current || !recorderRef.current) return;

    // Stop recording
    recorderRef.current.disconnect();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Convert audio data to WAV format
    const audioData = concatenateAudioData(audioChunksRef.current);
    const wavBlob = createWavBlob(
      audioData,
      audioContextRef.current.sampleRate
    );

    // Create form data and send to server
    const formData = new FormData();
    formData.append('file', wavBlob, 'audio.wav');

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      onTranscriptionComplete(data.result);
    } catch (error) {
      console.error('Transcription error:', error);
      onError('Failed to transcribe audio. Please try again.');
    }

    // Clean up
    audioChunksRef.current = [];
    setIsRecording(false);
  };

  // Helper function to concatenate audio chunks
  const concatenateAudioData = (chunks: Float32Array[]) => {
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  };

  // Helper function to create WAV blob
  const createWavBlob = (audioData: Float32Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, audioData.length * 2, true);

    // Write audio data
    const length = audioData.length;
    let index = 44;
    for (let i = 0; i < length; i++) {
      view.setInt16(index, audioData[i] * 0x7fff, true);
      index += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  // Helper function to write string to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
};
