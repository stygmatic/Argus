import { useRobotStore } from "../../stores/useRobotStore";
import { useUIStore } from "../../stores/useUIStore";

const WIDTH = 200;
const HEIGHT = 150;
const SEA_LEVEL_Y = 100;
const SCALE = 1; // 1px per meter

function clampY(altitude: number): number {
  // Convert altitude to Y position (higher altitude = lower Y)
  const y = SEA_LEVEL_Y - altitude * SCALE;
  return Math.max(8, Math.min(HEIGHT - 8, y));
}

export function AltitudeInset() {
  const selectedId = useUIStore((s) => s.selectedRobotId);
  const alertsOpen = useUIStore((s) => s.alertsPanelOpen);
  const robot = useRobotStore((s) => (selectedId ? s.robots[selectedId] : undefined));

  if (!robot) return null;

  const altitude = robot.position?.altitude ?? 0;
  const markerY = clampY(altitude);
  const isDrone = robot.robotType === "drone";
  const isUUV = robot.robotType === "underwater";

  const altitudeLabel = isUUV
    ? `${Math.abs(altitude).toFixed(1)}m depth`
    : `${altitude.toFixed(1)}m alt`;

  return (
    <div
      className="absolute bottom-5 z-20 bg-slate-900 border border-slate-700/60 rounded-xl p-3 shadow-2xl transition-all duration-300"
      style={{ right: alertsOpen ? 356 : 16 }}
    >
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        {isDrone ? "Altitude" : isUUV ? "Depth" : "Elevation"}
      </div>

      <svg width={WIDTH} height={HEIGHT} className="block">
        {/* Sky gradient (above sea level) */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0369a1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Sky fill */}
        <rect x="0" y="0" width={WIDTH} height={SEA_LEVEL_Y} fill="url(#skyGrad)" />

        {/* Water fill (below sea level) */}
        {isUUV && (
          <rect x="0" y={SEA_LEVEL_Y} width={WIDTH} height={HEIGHT - SEA_LEVEL_Y} fill="url(#waterGrad)" />
        )}

        {/* Ground line */}
        <line
          x1="0" y1={SEA_LEVEL_Y} x2={WIDTH} y2={SEA_LEVEL_Y}
          stroke="#52525b" strokeWidth="1" strokeDasharray={isUUV ? "none" : "4 2"}
        />
        <text x="4" y={SEA_LEVEL_Y - 4} fill="#71717a" fontSize="9" fontFamily="Inter, system-ui">
          {isUUV ? "Sea Level" : "Ground"}
        </text>

        {/* Scale marks */}
        {[20, 40, 60].map((m) => {
          const y = SEA_LEVEL_Y - m * SCALE;
          if (y < 4 || y > HEIGHT - 4) return null;
          return (
            <g key={`above-${m}`}>
              <line x1="0" y1={y} x2={WIDTH} y2={y} stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 4" />
              <text x={WIDTH - 4} y={y - 2} fill="#52525b" fontSize="8" textAnchor="end" fontFamily="Inter, system-ui">
                {m}m
              </text>
            </g>
          );
        })}

        {/* Depth marks for UUV */}
        {isUUV && [-10, -20].map((m) => {
          const y = SEA_LEVEL_Y - m * SCALE;
          if (y < 4 || y > HEIGHT - 4) return null;
          return (
            <g key={`below-${m}`}>
              <line x1="0" y1={y} x2={WIDTH} y2={y} stroke="#0e7490" strokeWidth="0.5" strokeDasharray="2 4" />
              <text x={WIDTH - 4} y={y - 2} fill="#0e7490" fontSize="8" textAnchor="end" fontFamily="Inter, system-ui">
                {Math.abs(m)}m
              </text>
            </g>
          );
        })}

        {/* Vertical dashed line from marker to ground (drones) */}
        {isDrone && altitude > 0 && (
          <line
            x1={WIDTH / 2} y1={markerY} x2={WIDTH / 2} y2={SEA_LEVEL_Y}
            stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" opacity="0.5"
          />
        )}

        {/* Vertical dashed line from marker to sea level (UUV) */}
        {isUUV && altitude < 0 && (
          <line
            x1={WIDTH / 2} y1={SEA_LEVEL_Y} x2={WIDTH / 2} y2={markerY}
            stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 2" opacity="0.5"
          />
        )}

        {/* Robot marker */}
        <circle
          cx={WIDTH / 2}
          cy={markerY}
          r="5"
          fill={isDrone ? "#38bdf8" : isUUV ? "#0ea5e9" : "#22c55e"}
          className="transition-all duration-500"
        />
        <circle
          cx={WIDTH / 2}
          cy={markerY}
          r="8"
          fill="none"
          stroke={isDrone ? "#38bdf8" : isUUV ? "#0ea5e9" : "#22c55e"}
          strokeWidth="1"
          opacity="0.3"
          className="transition-all duration-500"
        />

        {/* Altitude label */}
        <text
          x={WIDTH / 2 + 14}
          y={markerY + 4}
          fill="#e4e4e7"
          fontSize="10"
          fontWeight="600"
          fontFamily="Inter, system-ui"
          className="transition-all duration-500"
        >
          {altitudeLabel}
        </text>
      </svg>

      {/* Robot name */}
      <div className="text-[11px] text-slate-500 mt-1 text-center truncate">
        {robot.name}
      </div>
    </div>
  );
}
