"use client";

import { useEffect, useRef, useState } from "react";

export function WebcamAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      role: string;
      content: string | Array<{ type: string; text?: string; image?: string }>;
    }>
  >([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function setupWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }

    async function captureAndAnalyze() {
      if (!videoRef.current || !isActive) return;

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
            setDescriptions((prev) => [data.description, ...prev].slice(0, 5));
            setMessages(data.messages);
          }
        } catch (err) {
          console.error("Error analyzing image:", err);
        }
      }
    }

    if (isActive) {
      setupWebcam();
      interval = setInterval(captureAndAnalyze, 2000); // Capture every 2 seconds
    }

    return () => {
      clearInterval(interval);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive, messages]);

  return (
    <div className="p-4">
      <button
        onClick={() => setIsActive(!isActive)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isActive ? "Stop Camera" : "Start Camera"}
      </button>

      <div className="flex gap-4">
        <div className="w-1/2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
        </div>

        <div className="w-1/2">
          <h2 className="text-xl font-bold mb-2 text-white">
            Recent Descriptions:
          </h2>
          <ul className="space-y-2">
            {descriptions.map((desc, index) => (
              <li key={index} className="p-2 bg-gray-100 text-black rounded">
                {desc}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="container mx-auto">
      <h1 className="text-2xl font-bold my-4">Webcam AI Analyzer</h1>
      <WebcamAnalyzer />
    </main>
  );
}
