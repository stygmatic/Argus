import { useEffect, useRef, useState } from "react";
import { useAIStore } from "../../stores/useAIStore";
import { useAutonomyStore } from "../../stores/useAutonomyStore";

interface CountdownTimerProps {
  suggestionId: string;
  autoExecuteAt: number;
}

export function CountdownTimer({ suggestionId, autoExecuteAt }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, autoExecuteAt - Date.now() / 1000)
  );
  const totalDuration = useRef(Math.max(1, autoExecuteAt - Date.now() / 1000));
  const rafRef = useRef(0);
  const reject = useAIStore((s) => s.rejectSuggestion);
  const removeCountdown = useAutonomyStore((s) => s.removeCountdown);

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, autoExecuteAt - Date.now() / 1000);
      setRemaining(left);
      if (left > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [autoExecuteAt]);

  const handleOverride = () => {
    reject(suggestionId);
    removeCountdown(suggestionId);
  };

  const pct = remaining / totalDuration.current;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle
            cx="20" cy="20" r={radius}
            fill="none" stroke="#3f3f46" strokeWidth="3"
          />
          <circle
            cx="20" cy="20" r={radius}
            fill="none" stroke="#f59e0b" strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 20 20)"
            className="transition-[stroke-dashoffset] duration-100"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-amber-400">
          {Math.ceil(remaining)}
        </span>
      </div>
      <button
        onClick={handleOverride}
        className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-600/80 text-white hover:bg-rose-500 transition-colors"
      >
        Override
      </button>
    </div>
  );
}
