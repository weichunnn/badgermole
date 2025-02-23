import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeControlsProps {
  mode: 'query' | 'guide';
  isRecording: boolean;
  isGuideRunning: boolean;
  onBack: () => void;
  onToggle: () => void;
  instructions?: string;
  transcription?: string; // Add this prop
}

export function ModeControls({
  mode,
  isRecording,
  isGuideRunning,
  onBack,
  onToggle,
  instructions,
  transcription,
}: ModeControlsProps) {
  return (
    <div className="flex flex-col gap-4 mx-auto w-full">
      {/*{mode === 'guide' && (
        <div className="mx-auto w-full">
          <elevenlabs-convai
            agent-id="UxsgpVJHVXtTODvoSeZU"
            className="w-full"
          />
        </div>
      )}*/}
      {instructions && (
        <div className="text-center text-gray-300 text-lg font-medium px-2">
          {instructions}
        </div>
      )}
      {transcription && (
        <div className="text-center bg-gray-800/50 rounded-lg p-4 mx-2">
          <p className="text-emerald-400 text-lg font-medium break-words">
            {transcription}
          </p>
          {transcription.startsWith('Transcribing: ') && (
            <div className="mt-2">
              <div className="animate-pulse h-1 w-24 bg-emerald-400/50 mx-auto rounded" />
            </div>
          )}
        </div>
      )}
      <div className="flex justify-between gap-4 px-2">
        <Button
          onClick={onBack}
          className="flex-1 h-32 text-2xl flex flex-col items-center gap-4 bg-gradient-to-br from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 transition-all duration-300 shadow-xl hover:shadow-slate-500/30 border border-slate-400/30 rounded-2xl transform hover:scale-[1.02]"
          aria-label="Back to home screen"
        >
          <div className="bg-slate-400/20 p-4 rounded-xl">
            <ArrowLeft className="w-12 h-12" />
          </div>
          <span className="font-semibold tracking-wide">Back</span>
        </Button>

        <Button
          onClick={onToggle}
          className={cn(
            'flex-1 h-32 text-2xl flex flex-col items-center gap-4 transition-all duration-300 shadow-xl border rounded-2xl transform hover:scale-[1.02]',
            mode === 'query'
              ? isRecording
                ? 'bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 hover:shadow-rose-500/30 border-rose-400/30'
                : 'bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 hover:shadow-emerald-500/30 border-emerald-400/30'
              : isGuideRunning
              ? 'bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 hover:shadow-rose-500/30 border-rose-400/30'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 hover:shadow-emerald-500/30 border-emerald-400/30'
          )}
          aria-label={
            mode === 'query'
              ? isRecording
                ? 'Stop Recording'
                : 'Start Recording'
              : isGuideRunning
              ? 'Pause Guide'
              : 'Resume Guide'
          }
        >
          <div
            className={cn(
              'p-4 rounded-xl',
              isRecording || isGuideRunning
                ? 'bg-rose-400/20'
                : 'bg-emerald-400/20'
            )}
          >
            <Mic
              className={cn(
                'w-12 h-12',
                (isRecording || isGuideRunning) && 'animate-pulse'
              )}
            />
          </div>
          <span className="font-semibold tracking-wide">
            {mode === 'query'
              ? isRecording
                ? 'Stop'
                : 'Record'
              : isGuideRunning
              ? 'Pause'
              : 'Resume'}
          </span>
        </Button>
      </div>
    </div>
  );
}
