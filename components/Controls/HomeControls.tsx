import { Button } from '@/components/ui/button';
import { Navigation2, Search } from 'lucide-react';
import { stopSpeaking } from '@/lib/elevenlabs-service';

interface HomeControlsProps {
  onQueryClick: () => void;
  onGuideClick: () => void;
}

export function HomeControls({
  onQueryClick,
  onGuideClick,
}: HomeControlsProps) {
  const handleQueryClick = () => {
    stopSpeaking();
    onQueryClick();
  };

  const handleGuideClick = () => {
    stopSpeaking();
    onGuideClick();
  };
  return (
    <div className="flex justify-between gap-4 mx-auto w-full px-2">
      <Button
        onClick={handleQueryClick}
        className="flex-1 h-32 text-2xl flex flex-col items-center gap-4 bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 transition-all duration-300 shadow-xl hover:shadow-indigo-500/30 border border-indigo-400/30 rounded-2xl transform hover:scale-[1.02]"
        aria-label="Query Mode - Click to ask questions about what you see"
      >
        <div className="bg-indigo-400/20 p-4 rounded-xl">
          <Search className="w-12 h-12" />
        </div>
        <span className="font-semibold tracking-wide">Query</span>
      </Button>

      <Button
        onClick={handleGuideClick}
        className="flex-1 h-32 text-2xl flex flex-col items-center gap-4 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 transition-all duration-300 shadow-xl hover:shadow-emerald-500/30 border border-emerald-400/30 rounded-2xl transform hover:scale-[1.02]"
        aria-label="Guide Mode - Click to start walking assistance"
      >
        <div className="bg-emerald-400/20 p-4 rounded-xl">
          <Navigation2 className="w-12 h-12" />
        </div>
        <span className="font-semibold tracking-wide">Guide</span>
      </Button>
    </div>
  );
}
