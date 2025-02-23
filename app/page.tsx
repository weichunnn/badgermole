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
import { isCurrentlySpeaking } from '@/lib/elevenlabs-service';

export default function Home() {
  const { videoRef, canvasRef, announceMessage } = useCamera();

  const [mode, setMode] = useState<Mode>('home');
  const [isGuideRunning, setIsGuideRunning] = useState(false);
  const guideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [transcription, setTranscription] = useState<string>('');

  //enum IntentResponse {
  //  Describe = 'Describe',
  //  Navigate = 'Navigate',
  //  Search = 'Search',
  //}

  //const [currentLocation, setCurrentLocation] = useState<string>('');
  const { response, setResponse, captureAndAnalyze } = useImageAnalysis(
    videoRef as React.RefObject<HTMLVideoElement>,
    transcription
  );

  const { isRecording, startRecording, stopRecording } = useAudioRecording({
    onTranscriptionComplete: async (text) => {
      setTranscription(text);
      setResponse(text);

      console.log('Transcription:', text);
      console.log('analyzing image');
      captureAndAnalyze(text);

      //try {
      //  const intResp = await fetch('/api/classify_intent', {
      //    method: 'POST',
      //    headers: {
      //      'Content-Type': 'application/json',
      //    },
      //    body: JSON.stringify({ inputPrompt: text }), // Changed from text to inputPrompt
      //  });
      //  if (!intResp.ok) {
      //    throw new Error('Failed to process intent');
      //  }
      //  const intRespFinal = await intResp.json();

      //  console.log('Intent response:', intRespFinal);

      //  switch (intRespFinal.category) {
      //    case IntentResponse.Describe:
      //      announceMessage(
      //        'Processing your request to describe the surroundings'
      //      );
      //      const describeResponse = await captureAndAnalyze();
      //      announceMessage(describeResponse);
      //      break;

      //    case IntentResponse.Navigate:
      //      announceMessage('Finding navigation directions');
      //      const address = null;
      //      // if ("geolocation" in navigator) {
      //      //   navigator.geolocation.getCurrentPosition(
      //      //     async (position) => {
      //      //       try {
      //      //         const response = await fetch(`/api/reverse_geocode`, {
      //      //           method: "POST",
      //      //           headers: {
      //      //             "Content-Type": "application/json",
      //      //           },
      //      //           body: JSON.stringify({
      //      //             lat: position.coords.latitude,
      //      //             lng: position.coords.longitude,
      //      //           }),
      //      //         });
      //      //         address = await response.json();
      //      //       } catch (error) {
      //      //         console.error("Error getting street address:", error);
      //      //       }
      //      //     },
      //      //     (error) => {
      //      //       console.error("Error getting location:", error);
      //      //     }
      //      //   );
      //      // }
      //      const navResp = await fetch('/api/ai/maps', {
      //        method: 'POST',
      //        headers: {
      //          'Content-Type': 'application/json',
      //        },
      //        body: JSON.stringify({
      //          origin: '55 2nd Street, San Francisco, CA 94105',
      //          destination: '425 Mission Street, San Francisco, CA 94105', // Salesforce Transit Center
      //          transitType: 'DRIVE',
      //        }),
      //      });
      //      const navigationData = await navResp.json();
      //      announceMessage('Navigation route found');

      //      announceMessage(navigationData.directions);
      //      break;

      //    case IntentResponse.Search:
      //      announceMessage('Searching for your request');

      //      const searchResp = await fetch('/api/ai/search', {
      //        method: 'POST',
      //        headers: {
      //          'Content-Type': 'appli cation/json',
      //        },
      //        body: JSON.stringify({
      //          query: text,
      //          image: image,
      //        }),
      //      });
      //      console.log('Search response:', searchResp);
      //      const searchData = await searchResp.json();
      //      console.log('Search data:', searchData.answer);

      //      announceMessage('search data found');
      //      announceMessage(searchData.answer);

      //      break;

      //    default:
      //      announceMessage('Intent not recognized. Please try again.');
      //      break;
      //  }
      //} catch (error) {
      //  console.error('Intent processing error:', error);
      //  announceMessage('Error processing your request. Please try again.');
      //}
    },
    onError: (error) => {
      console.error('Transcription error:', error);
      announceMessage('Error with transcription. Please try again.');
      setTranscription('');
    },
  });

  useEffect(() => {
    announceMessage("Hello there! Let's get started!!");
  }, [announceMessage]);

  useEffect(() => {
    if (isGuideRunning) {
      guideIntervalRef.current = setInterval(captureAndAnalyze, 2000);
    }

    return () => {
      if (guideIntervalRef.current) {
        clearInterval(guideIntervalRef.current);
      }
    };
  }, [isGuideRunning, captureAndAnalyze]);

  const handleQueryMode = () => {
    setMode('query');
    announceMessage('Query mode.');
    setResponse('');
  };

  const startGuideMode = () => {
    setMode('guide');
    setIsGuideRunning(true);
    announceMessage("Guide mode. I'll describe your surroundings.");
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
      if (isCurrentlySpeaking()) {
        announceMessage('Please wait for the current response to finish');
        return;
      }
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
    announceMessage('Home Screen');
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
