//'use client';

//import { useState, useCallback, useEffect, useRef } from 'react';
//import { createTranscriber } from '@/lib/assemblyai-client';
//import type { RealtimeTranscriber } from 'assemblyai';

//interface UseAssemblyAIProps {
//  onPartialTranscript?: (text: string) => void;
//  onFinalTranscript?: (text: string) => void;
//  onError?: (error: Error) => void;
//}

//export function useAssemblyAI({
//  onPartialTranscript,
//  onFinalTranscript,
//  onError,
//}: UseAssemblyAIProps) {
//  const [isRecording, setIsRecording] = useState(false);
//  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//  const transcriberRef = useRef<RealtimeTranscriber | null>(null);
//  const audioChunksRef = useRef<Blob[]>([]);

//  const startRecording = useCallback(async () => {
//    try {
//      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//      const mediaRecorder = new MediaRecorder(stream);
//      mediaRecorderRef.current = mediaRecorder;
//      audioChunksRef.current = [];

//      const transcriber = await createTranscriber(16000);

//      transcriber.on('open', () => {
//        console.log('AssemblyAI WebSocket opened');
//      });

//      transcriber.on('transcript', (transcript) => {
//        if (!transcript.text) return;

//        if (transcript.message_type === 'PartialTranscript') {
//          onPartialTranscript?.(transcript.text);
//        } else {
//          onFinalTranscript?.(transcript.text);
//        }
//      });

//      transcriber.on('error', (error) => {
//        console.error('AssemblyAI WebSocket error:', error);
//        onError?.(error);
//      });

//      await transcriber.connect();
//      transcriberRef.current = transcriber;

//      mediaRecorder.ondataavailable = async (event) => {
//        if (event.data.size > 0) {
//          audioChunksRef.current.push(event.data);

//          // Convert blob to ArrayBuffer
//          const arrayBuffer = await event.data.arrayBuffer();
//          const uint8Array = new Uint8Array(arrayBuffer);

//          // Send audio data to transcriber
//          if (transcriberRef.current?.isConnected()) {
//            transcriberRef.current.sendAudio(uint8Array);
//          }
//        }
//      };

//      mediaRecorder.start(100);
//      setIsRecording(true);
//    } catch (error) {
//      console.error('Error starting recording:', error);
//      onError?.(error as Error);
//    }
//  }, [onPartialTranscript, onFinalTranscript, onError]);

//  const stopRecording = useCallback(async () => {
//    if (mediaRecorderRef.current) {
//      mediaRecorderRef.current.stop();
//      mediaRecorderRef.current.stream
//        .getTracks()
//        .forEach((track) => track.stop());
//      mediaRecorderRef.current = null;
//    }

//    if (transcriberRef.current) {
//      await transcriberRef.current.disconnect();
//      transcriberRef.current = null;
//    }

//    audioChunksRef.current = [];
//    setIsRecording(false);
//  }, []);

//  useEffect(() => {
//    // Cleanup function
//    return () => {
//      if (mediaRecorderRef.current) {
//        mediaRecorderRef.current.stream
//          .getTracks()
//          .forEach((track) => track.stop());
//      }
//      if (transcriberRef.current?.isConnected()) {
//        transcriberRef.current.disconnect();
//      }
//    };
//  }, []);

//  return {
//    isRecording,
//    startRecording,
//    stopRecording,
//  };
//}
