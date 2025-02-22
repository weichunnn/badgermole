"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, Navigation2, Search } from "lucide-react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mode = "home" | "query" | "guide";
type Message = {
  role: string;
  content: string | Array<{ type: string; text?: string; image?: string }>;
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("home");
  const [isRecording, setIsRecording] = useState(false);
  const [isGuideRunning, setIsGuideRunning] = useState(false);
  const [response, setResponse] = useState<string>("");
  const guideIntervalRef = useRef<NodeJS.Timeout>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    initializeCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (guideIntervalRef.current) {
        clearInterval(guideIntervalRef.current);
      }
    };
  }, []);

  async function initializeCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      announceMessage("Camera access denied. Please enable camera access.");
    }
  }

  const announceMessage = (message: string) => {
    const utterance = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(utterance);
  };

  async function captureAndAnalyze() {
    if (!videoRef.current || !isGuideRunning) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg");

      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: imageData,
            messages: messages,
          }),
        });

        const data = await response.json();
        if (data.description) {
          setResponse(data.description);
          setMessages(data.messages);
          announceMessage(data.description);
        }
      } catch (err) {
        console.error("Error analyzing image:", err);
      }
    }
  }

  useEffect(() => {
    if (isGuideRunning) {
      guideIntervalRef.current = setInterval(captureAndAnalyze, 2000);
    }

    return () => {
      if (guideIntervalRef.current) {
        clearInterval(guideIntervalRef.current);
      }
    };
  }, [isGuideRunning, messages]);

  const handleRecordToggle = async () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      announceMessage("Recording has started");
      setResponse("Listening...");
      // Here you would typically start recording and send to speech-to-text
      // Then send the text to your AI endpoint
      await captureAndAnalyze(); // Single analysis for query mode
    } else {
      announceMessage("Recording stopped");
    }
  };

  const startGuideMode = () => {
    setMode("guide");
    setIsGuideRunning(true);
    announceMessage("Guide mode activated. I will describe your surroundings.");
    captureAndAnalyze(); // Initial analysis
  };

  const toggleGuide = () => {
    setIsGuideRunning(!isGuideRunning);
    if (isGuideRunning) {
      announceMessage("Guide paused. Click again to resume.");
      setResponse("Guide mode paused");
      if (guideIntervalRef.current) {
        clearInterval(guideIntervalRef.current);
      }
    } else {
      announceMessage("Guide resumed");
      setResponse("Resuming environment description...");
      captureAndAnalyze(); // Immediate analysis on resume
    }
  };

  const handleBack = () => {
    setMode("home");
    setIsRecording(false);
    setIsGuideRunning(false);
    setResponse("");
    if (guideIntervalRef.current) {
      clearInterval(guideIntervalRef.current);
    }
    announceMessage("Returned to home screen");
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Camera View */}
        <div className="relative flex-1 bg-black overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Response Overlay */}
          {response && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 text-white">
              <p className="text-lg font-medium">{response}</p>
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white font-medium">Recording...</span>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="grid gap-4 p-4 bg-gray-950">
          {mode === "home" && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setMode("query")}
                className="h-20 text-lg flex flex-col items-center gap-2 bg-purple-900 hover:bg-purple-800"
                aria-label="Query Mode"
              >
                <Search className="w-8 h-8" />
                <span className="font-medium">Query</span>
              </Button>

              <Button
                onClick={startGuideMode}
                className="h-20 text-lg flex flex-col items-center gap-2 bg-blue-900 hover:bg-blue-800"
                aria-label="Guide Mode"
              >
                <Navigation2 className="w-8 h-8" />
                <span className="font-medium">Guide</span>
              </Button>
            </div>
          )}

          {(mode === "query" || mode === "guide") && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleBack}
                className="h-20 text-lg flex flex-col items-center gap-2 bg-gray-800 hover:bg-gray-700"
                aria-label="Back to home screen"
              >
                <ArrowLeft className="w-8 h-8" />
                <span className="font-medium">Back</span>
              </Button>

              <Button
                onClick={mode === "query" ? handleRecordToggle : toggleGuide}
                className={cn(
                  "h-20 text-lg flex flex-col items-center gap-2",
                  mode === "query"
                    ? isRecording
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-700 hover:bg-green-600"
                    : isGuideRunning
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-700 hover:bg-green-600"
                )}
                aria-label={
                  mode === "query"
                    ? isRecording
                      ? "Stop Recording"
                      : "Start Recording"
                    : isGuideRunning
                    ? "Pause Guide"
                    : "Resume Guide"
                }
              >
                <Mic
                  className={cn(
                    "w-8 h-8",
                    (isRecording || isGuideRunning) && "animate-pulse"
                  )}
                />
                <span className="font-medium">
                  {mode === "query"
                    ? isRecording
                      ? "Stop"
                      : "Record"
                    : isGuideRunning
                    ? "Pause"
                    : "Resume"}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
