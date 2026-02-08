import { useRobotStore } from "../../stores/useRobotStore";
import { useUIStore } from "../../stores/useUIStore";
import type { RobotState, RobotType } from "../../types/robot";

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
  idle: "bg-sky-500 shadow-[0_0_6px_rgba(56,189,248,0.5)]",
  returning: "bg-amber-500 shadow-[0_0_6px_rgba(234,179,8,0.5)] animate-pulse",
  error: "bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse",
  offline: "bg-zinc-600",
};

const TYPE_ICON: Record<RobotType, string> = {
  drone: "\u2708",
  ground: "\u2699",
  underwater: "\u2693",
};

const TYPE_LABELS: Record<string, string> = {
  drone: "Drone",
  ground: "Rover",
  underwater: "UUV",
};

function RobotRow({ robot }: { robot: RobotState }) {
  const selectRobot = useUIStore((s) => s.selectRobot);
  const selectedId = useUIStore((s) => s.selectedRobotId);
  const isSelected = selectedId === robot.id;

  const battPercent = robot.health?.batteryPercent ?? 0;
  const battColor =
    battPercent > 50
      ? "bg-emerald-500"
      : battPercent > 20
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <button
      onClick={() => selectRobot(isSelected ? null : robot.id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 hover:scale-[1.01] ${
        isSelected
          ? "bg-gradient-to-r from-sky-500/15 to-sky-500/5 border border-sky-500/30"
          : "hover:bg-zinc-800/60 border border-transparent"
      }`}
    >
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[robot.status] || "bg-zinc-600"}`} />

      {/* Type icon + name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px]">{TYPE_ICON[robot.robotType] || "\u2022"}</span>
          <span className="text-[13px] font-medium text-zinc-200 truncate">{robot.name}</span>
        </div>
        <div className="text-[11px] text-zinc-500">{TYPE_LABELS[robot.robotType] || robot.robotType}</div>
      </div>

      {/* Battery */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[11px] text-zinc-400">{battPercent.toFixed(0)}%</span>
        <div className="w-10 h-1 bg-zinc-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${battColor} transition-all duration-500`} style={{ width: `${battPercent}%` }} />
        </div>
      </div>
    </button>
  );
}

interface RobotListPanelProps {
  onMissionPlan?: () => void;
}

export function RobotListPanel({ onMissionPlan }: RobotListPanelProps) {
  const robots = useRobotStore((s) => s.robots);
  const robotList = Object.values(robots);

  return (
    <div className="fixed top-14 left-0 bottom-0 w-[280px] z-20 flex flex-col bg-zinc-900 border-r border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="text-sm font-semibold text-zinc-200">Fleet</div>
        <div className="text-[11px] text-zinc-500 mt-0.5">
          {robotList.length} unit{robotList.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Robot list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {robotList.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-3xl mb-3 opacity-30">{"\u2708"}</div>
            <div className="text-[13px] text-zinc-500">No robots connected</div>
            <div className="text-[11px] text-zinc-600 mt-1">Waiting for fleet telemetry...</div>
          </div>
        ) : (
          robotList.map((robot) => <RobotRow key={robot.id} robot={robot} />)
        )}
      </div>

      {/* AI Mission Plan button */}
      {onMissionPlan && (
        <div className="px-3 pb-3 pt-1 border-t border-zinc-700/40">
          <button
            onClick={onMissionPlan}
            className="w-full text-[13px] py-2 rounded-xl border border-zinc-600/50 text-zinc-400 hover:border-sky-500/60 hover:text-sky-300 hover:shadow-[0_0_12px_rgba(56,189,248,0.15)] transition-all duration-200"
          >
            AI Mission Plan
          </button>
        </div>
      )}
    </div>
  );
}
