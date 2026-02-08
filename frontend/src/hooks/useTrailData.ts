import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface TrailPoint {
  time: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
}

export function useTrailData(robotId: string | null, minutes: number = 10) {
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const intervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!robotId) {
      setTrail([]);
      return;
    }

    const fetchTrail = async () => {
      try {
        const res = await fetch(`${API_URL}/robots/${robotId}/trail?minutes=${minutes}`);
        if (res.ok) {
          const data = await res.json();
          setTrail(data.trail || []);
        }
      } catch {
        // Silently ignore fetch errors
      }
    };

    fetchTrail();
    intervalRef.current = window.setInterval(fetchTrail, 10000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [robotId, minutes]);

  return trail;
}
