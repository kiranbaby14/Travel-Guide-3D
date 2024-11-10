import { Button } from "@/components/ui/button";
import { Pause, Play, Square } from "lucide-react";

interface TourControlsProps {
  isAnimating: boolean;
  isPaused: boolean;
  routeData: any;
  onStart: () => void;
  onTogglePause: () => void;
  onStop: () => void;
}

const TourControls: React.FC<TourControlsProps> = ({
  isAnimating,
  isPaused,
  routeData,
  onStart,
  onTogglePause,
  onStop,
}) => (
  <div className="absolute top-8 right-8 z-10 space-y-2">
    <div className="flex gap-2">
      {!isAnimating ? (
        <Button
          onClick={onStart}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200"
        >
          <Play className="w-4 h-4" />
          Start Tour
        </Button>
      ) : (
        <>
          <Button
            onClick={onTogglePause}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            )}
          </Button>
          <Button
            onClick={onStop}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200"
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
        </>
      )}
    </div>
    {routeData && (
      <div className="bg-white/90 p-2 rounded shadow text-sm text-center">
        {routeData.distance} • {routeData.duration}
      </div>
    )}
  </div>
);

export { TourControls };
