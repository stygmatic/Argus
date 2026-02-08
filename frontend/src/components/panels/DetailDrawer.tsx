import { Component, type ReactNode } from "react";
import { useRobotStore } from "../../stores/useRobotStore";
import { useUIStore } from "../../stores/useUIStore";
import { CommandPalette } from "../command/CommandPalette";
import { CommandHistory } from "../command/CommandHistory";

/* ---------- Error Boundary ---------- */
interface EBProps { children: ReactNode }
interface EBState { hasError: boolean; error: string }

class DetailErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false, error: "" };
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-[13px] text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/30">
          <div className="font-medium mb-1">Render error</div>
          <div className="text-[11px] text-rose-300/70">{this.state.error}</div>
          <button
            onClick={() => this.setState({ hasError: false, error: "" })}
            className="mt-2 text-[11px] px-2.5 py-1 rounded-lg bg-zinc-700/60 text-zinc-300 hover:bg-zinc-600/60 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- Status pill styles ---------- */
const STATUS_PILL: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-400" },
  idle: { bg: "bg-sky-500/15 border-sky-500/30", text: "text-sky-400" },
  returning: { bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-400" },
  error: { bg: "bg-rose-500/15 border-rose-500/30", text: "text-rose-400" },
  offline: { bg: "bg-zinc-500/15 border-zinc-500/30", text: "text-zinc-400" },
};

/* ---------- Sub-components ---------- */
function GaugeBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-zinc-700/60 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Stat({ icon, label, value, unit }: { icon: string; label: string; value: string; unit?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
        <span className="text-[10px]">{icon}</span>
        {label}
      </span>
      <span className="text-[13px] text-zinc-200">
        {value}
        {unit && <span className="text-[11px] text-zinc-500 ml-1">{unit}</span>}
      </span>
    </div>
  );
}

/* ---------- Main component ---------- */
function DetailContent() {
  const selectedId = useUIStore((s) => s.selectedRobotId);
  const selectRobot = useUIStore((s) => s.selectRobot);
  const robot = useRobotStore((s) => (selectedId ? s.robots[selectedId] : undefined));

  if (!robot) return null;

  const statusStyle = (STATUS_PILL[robot.status] ?? STATUS_PILL.offline)!;
  const battPercent = robot.health?.batteryPercent ?? 0;
  const battColor =
    battPercent > 50
      ? "bg-emerald-500"
      : battPercent > 20
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <>
      {/* Backdrop — click to close */}
      <div
        className="fixed inset-0 bg-black/30"
        style={{ zIndex: 29 }}
        onClick={() => selectRobot(null)}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-14 left-[280px] bottom-0 w-[340px] z-30 bg-zinc-900 border-r border-zinc-800 flex flex-col animate-slide-in-left"
      >
        {/* Sticky header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-zinc-700/40 flex-shrink-0">
          <div>
            <div className="text-sm font-semibold text-zinc-100">{robot.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[11px] font-medium capitalize px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text}`}
              >
                {robot.status}
              </span>
              <span className="text-[11px] text-zinc-500">{robot.id}</span>
            </div>
          </div>
          <button
            onClick={() => selectRobot(null)}
            className="text-zinc-500 hover:text-zinc-300 text-lg leading-none p-1 -mr-1 -mt-1 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin">
          {/* Battery */}
          <div>
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                <span className="text-[10px]">{"\u26A1"}</span> Battery
              </span>
              <span className="text-zinc-300">{battPercent.toFixed(0)}%</span>
            </div>
            <GaugeBar value={battPercent} max={100} color={battColor} />
          </div>

          {/* Position */}
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Position</div>
            <div className="space-y-0.5">
              <Stat icon={"\uD83C\uDF10"} label="Lat" value={(robot.position?.latitude ?? 0).toFixed(5)} />
              <Stat icon={"\uD83C\uDF10"} label="Lon" value={(robot.position?.longitude ?? 0).toFixed(5)} />
              <Stat icon={"\uD83E\uDDED"} label="Heading" value={(robot.position?.heading ?? 0).toFixed(0)} unit="deg" />
              <Stat icon={"\u23F1"} label="Speed" value={(robot.speed ?? 0).toFixed(1)} unit="m/s" />
            </div>
          </div>

          {/* Type-specific stats */}
          {robot.robotType === "drone" && (
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Drone</div>
              <div className="space-y-0.5">
                <Stat icon={"\u2708"} label="Altitude" value={(robot.position?.altitude ?? 0).toFixed(1)} unit="m" />
                <Stat icon={"\uD83D\uDCA8"} label="Air Speed" value={(robot.speed ?? 0).toFixed(1)} unit="m/s" />
              </div>
            </div>
          )}
          {robot.robotType === "ground" && (
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Rover</div>
              <div className="space-y-0.5">
                <Stat icon={"\u2699"} label="Ground Speed" value={(robot.speed ?? 0).toFixed(1)} unit="m/s" />
              </div>
            </div>
          )}
          {robot.robotType === "underwater" && (
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">UUV</div>
              <div className="space-y-0.5">
                <Stat icon={"\u2693"} label="Depth" value={Math.abs(robot.position?.altitude ?? 0).toFixed(1)} unit="m" />
                <Stat icon={"\uD83C\uDF0A"} label="Pressure" value={(Math.abs(robot.position?.altitude ?? 0) * 0.1).toFixed(2)} unit="atm" />
              </div>
            </div>
          )}

          {/* Commands */}
          <div className="border-t border-zinc-700/40 pt-3">
            <CommandPalette robotId={robot.id} robotType={robot.robotType} />
          </div>

          {/* History */}
          <div className="border-t border-zinc-700/40 pt-3">
            <CommandHistory robotId={robot.id} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Exported wrapper with error boundary ---------- */
export function DetailPopup() {
  return (
    <DetailErrorBoundary>
      <DetailContent />
    </DetailErrorBoundary>
  );
}
