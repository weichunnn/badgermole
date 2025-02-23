import { RefObject } from 'react';

interface CameraProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  response: string;
  isRecording: boolean;
}

export function CameraView({
  videoRef,
  canvasRef,
  response,
  isRecording,
}: CameraProps) {
  return (
    <div className="relative flex-1 bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {response && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 text-white">
          <p className="text-lg font-medium">{response}</p>
        </div>
      )}

      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-medium">Recording...</span>
        </div>
      )}
    </div>
  );
}
