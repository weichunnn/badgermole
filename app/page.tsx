'use client';

import { useEffect, useRef, useState } from 'react';
import Layout from '@/components/layout';
import { CameraView } from '@/components/Camera/CameraView';
import { HomeControls } from '@/components/Controls/HomeControls';
import { ModeControls } from '@/components/Controls/ModeControls';
import { useCamera } from '@/app/hooks/useCamera';
import { useImageAnalysis } from '@/app/hooks/useImageAnalysis';
import { Mode } from './types';
import { useAudioRecording } from './hooks/useAudioRecording';

export default function Home() {
  const { videoRef, canvasRef, announceMessage } = useCamera();
  const { response, setResponse, captureAndAnalyze } = useImageAnalysis(
    videoRef as React.RefObject<HTMLVideoElement>
  );

  const [mode, setMode] = useState<Mode>('home');
  const [isGuideRunning, setIsGuideRunning] = useState(false);
  const guideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [transcription, setTranscription] = useState<string>('');

  const { isRecording, startRecording, stopRecording } = useAudioRecording({
    onTranscriptionComplete: async (text) => {
      setTranscription(text);
      setResponse(text);
      await captureAndAnalyze();
    },
    onError: (error) => {
      console.error('Transcription error:', error);
      announceMessage('Error with transcription. Please try again.');
      setTranscription('');
    },
  });

  useEffect(() => {
    announceMessage(
      'Welcome to BadgerMole. Click left button for query mode, right button for walk mode.'
    );
  }, []);

  useEffect(() => {
    if (isGuideRunning) {
      guideIntervalRef.current = setInterval(captureAndAnalyze, 5000);
    }

    return () => {
      if (guideIntervalRef.current) {
        clearInterval(guideIntervalRef.current);
      }
    };
  }, [isGuideRunning, captureAndAnalyze]);

  const handleQueryMode = () => {
    setMode('query');
    announceMessage(
      'Query mode activated. Press record to ask your query about what you see.'
    );
    setResponse('Press record to ask your query');
  };

  const startGuideMode = () => {
    setMode('guide');
    setIsGuideRunning(true);
    announceMessage('Guide mode activated. I will describe your surroundings.');
    captureAndAnalyze();
  };

  const toggleGuide = () => {
    setIsGuideRunning(!isGuideRunning);
    if (isGuideRunning) {
      announceMessage('Guide paused. Click again to resume.');
      setResponse('Guide mode paused');
      if (guideIntervalRef.current) {
        clearInterval(guideIntervalRef.current);
      }
    } else {
      announceMessage('Guide resumed');
      setResponse('Resuming environment description...');
      captureAndAnalyze();
    }
  };

  const handleRecordToggle = async () => {
    if (!isRecording) {
      try {
        announceMessage('Recording has started');
        setResponse('Listening...');
        setTranscription('');
        await startRecording();
      } catch (error) {
        console.error('Failed to start recording:', error);
        announceMessage(
          'Failed to start recording. Please check microphone permissions.'
        );
      }
    } else {
      stopRecording();
      announceMessage('Recording stopped');
    }
  };

  const handleBack = () => {
    if (isRecording) {
      stopRecording();
    }
    setIsGuideRunning(false);
    setTranscription('');
    setResponse('');
    setMode('home');
    if (guideIntervalRef.current) {
      clearInterval(guideIntervalRef.current);
    }
    announceMessage('Returned to home screen');
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <h1 className="sr-only">Lumos - Visual Assistance App</h1>

        <CameraView
          videoRef={videoRef as React.RefObject<HTMLVideoElement>}
          canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
          response={response}
          isRecording={isRecording}
        />

        <div className="grid gap-4 p-4 bg-gray-950">
          {mode === 'home' ? (
            <HomeControls
              onQueryClick={handleQueryMode}
              onGuideClick={startGuideMode}
            />
          ) : (
            <ModeControls
              mode={mode as 'query' | 'guide'}
              isRecording={isRecording}
              isGuideRunning={isGuideRunning}
              onBack={handleBack}
              onToggle={mode === 'query' ? handleRecordToggle : toggleGuide}
              instructions={mode === 'query' ? '' : undefined}
              transcription={transcription}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
