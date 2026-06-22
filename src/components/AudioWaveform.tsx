import React from "react";

interface AudioWaveformProps {
  className?: string;
  isPlaying?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ className = "", isPlaying = false }) => {
  const bars = Array.from({ length: 12 });

  return (
    <div className={`flex items-end justify-center gap-1 h-12 w-fit px-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 ${className}`}>
      {bars.map((_, i) => {
        // Generate a random duration to stagger the pixel bounce effect
        const duration = 0.5 + Math.random() * 0.7;
        const delay = Math.random() * 0.5;

        return (
          <div
            key={i}
            className={`w-2 bg-[#5A67FF] rounded-t-sm transition-all duration-300 ${
              isPlaying ? "animate-bounce" : "h-1"
            }`}
            style={
              isPlaying
                ? {
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    height: `${20 + Math.random() * 28}px`,
                  }
                : { height: "4px" }
            }
          />
        );
      })}
    </div>
  );
};

export default AudioWaveform;
