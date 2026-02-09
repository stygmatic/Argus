import { useMemo } from "react";
import { useRobotStore } from "../../stores/useRobotStore";
import { useAIStore } from "../../stores/useAIStore";
import { useMissionStore } from "../../stores/useMissionStore";
import { useAutonomyStore } from "../../stores/useAutonomyStore";
import type { RobotState } from "../../types/robot";
import clsx from "clsx";

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/30">
      <div className="text-[11px] text-zinc-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-zinc-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-zinc-400 w-8 text-right">{value}</span>
    </div>
  );
}

/* ---------- Battery Burn-Down (SVG sparkline per robot) ---------- */
function BatteryBurnDown({ robots }: { robots: RobotState[] }) {
  // Show current battery levels as a horizontal bar chart (descending)
  const sorted = [...robots].sort((a, b) => (a.health?.batteryPercent ?? 0) - (b.health?.batteryPercent ?? 0));

  return (
    <div>
      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Battery Levels</div>
      <div className="space-y-1">
        {sorted.map((r) => {
          const batt = r.health?.batteryPercent ?? 0;
          const color = batt > 50 ? "bg-emerald-500" : batt > 20 ? "bg-amber-500" : "bg-rose-500";
          const minsLeft = batt <= 15 ? 0 : Math.round((batt - 15) * 1.2);
          return (
            <div key={r.id} className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 w-14 truncate shrink-0">{r.name}</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${batt}%` }} />
              </div>
              <span className={clsx("text-[10px] w-12 text-right", batt < 25 ? "text-rose-400" : "text-zinc-400")}>
                {batt.toFixed(0)}%
              </span>
              <span className="text-[9px] text-zinc-600 w-10 text-right">
                {minsLeft > 0 ? `~${minsLeft}m` : "crit"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Mission Timeline ---------- */
function MissionTimeline() {
  const missions = useMissionStore((s) => s.missions);
  const missionList = Object.values(missions);

  if (missionList.length === 0) {
    return (
      <div>
        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Missions</div>
        <div className="text-[11px] text-zinc-600 text-center py-4">No missions yet</div>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    active: "bg-emerald-500",
    paused: "bg-amber-500",
    completed: "bg-sky-500",
    aborted: "bg-rose-500",
    draft: "bg-zinc-600",
  };

  const sorted = [...missionList].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div>
      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Missions</div>
      <div className="space-y-1.5">
        {sorted.map((m) => {
          const totalWps = Object.values(m.waypoints ?? {}).reduce((sum, wps) => sum + wps.length, 0);
          const completedWps = Object.values(m.waypoints ?? {}).reduce(
            (sum, wps) => sum + wps.filter((w) => w.status === "completed").length,
            0
          );
          const pct = totalWps > 0 ? Math.round((completedWps / totalWps) * 100) : 0;

          return (
            <div key={m.id} className="bg-zinc-800/40 rounded-lg p-2.5 border border-zinc-700/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-zinc-300 font-medium truncate">{m.name}</span>
                <span className={clsx(
                  "text-[9px] px-1.5 py-0.5 rounded-full capitalize",
                  statusColor[m.status] ?? "bg-zinc-600",
                  "text-white"
                )}>
                  {m.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500">{pct}%</span>
              </div>
              <div className="text-[10px] text-zinc-600 mt-1">
                {m.assignedRobots?.length ?? 0} robots, {completedWps}/{totalWps} waypoints
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- AI Intervention History ---------- */
function AIHistory() {
  const suggestions = useAIStore((s) => s.suggestions);
  const changeLog = useAutonomyStore((s) => s.changeLog);

  const allSuggestions = Object.values(suggestions);
  const approved = allSuggestions.filter((s) => s.status === "approved").length;
  const rejected = allSuggestions.filter((s) => s.status === "rejected").length;
  const pending = allSuggestions.filter((s) => s.status === "pending").length;
  const total = allSuggestions.length;

  const recentChanges = changeLog.slice(-5).reverse();

  return (
    <div>
      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">AI Activity</div>

      {/* Suggestion stats */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        <div className="bg-zinc-800/50 rounded-md p-2 text-center border border-zinc-700/30">
          <div className="text-sm font-bold text-zinc-100">{total}</div>
          <div className="text-[9px] text-zinc-500">Total</div>
        </div>
        <div className="bg-zinc-800/50 rounded-md p-2 text-center border border-zinc-700/30">
          <div className="text-sm font-bold text-emerald-400">{approved}</div>
          <div className="text-[9px] text-zinc-500">Approved</div>
        </div>
        <div className="bg-zinc-800/50 rounded-md p-2 text-center border border-zinc-700/30">
          <div className="text-sm font-bold text-rose-400">{rejected}</div>
          <div className="text-[9px] text-zinc-500">Rejected</div>
        </div>
        <div className="bg-zinc-800/50 rounded-md p-2 text-center border border-zinc-700/30">
          <div className="text-sm font-bold text-amber-400">{pending}</div>
          <div className="text-[9px] text-zinc-500">Pending</div>
        </div>
      </div>

      {/* Acceptance rate */}
      {(approved + rejected) > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-zinc-500">Acceptance Rate</span>
            <span className="text-zinc-300">{Math.round((approved / (approved + rejected)) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(approved / (approved + rejected)) * 100}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${(rejected / (approved + rejected)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent autonomy changes */}
      {recentChanges.length > 0 && (
        <div>
          <div className="text-[10px] text-zinc-500 mb-1.5">Recent Tier Changes</div>
          <div className="space-y-1">
            {recentChanges.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-[10px]">
                <span className="text-zinc-500 w-16 truncate">{entry.robotId === "__fleet__" ? "Fleet" : entry.robotId.slice(0, 8)}</span>
                <span className="text-zinc-600">{entry.oldTier}</span>
                <span className="text-zinc-500">{"\u2192"}</span>
                <span className="text-zinc-300">{entry.newTier}</span>
                <span className="text-zinc-600 ml-auto">{entry.changedBy}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Main component ---------- */
export function FleetStatsPanel() {
  const robots = useRobotStore((s) => s.robots);
  const robotList = useMemo(() => Object.values(robots), [robots]);
  const total = robotList.length;

  if (total === 0) {
    return (
      <div className="text-[13px] text-zinc-500 text-center py-10">
        No fleet data available
      </div>
    );
  }

  const byStatus = robotList.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const byType = robotList.reduce<Record<string, number>>((acc, r) => {
    acc[r.robotType] = (acc[r.robotType] || 0) + 1;
    return acc;
  }, {});

  const avgBattery = robotList.reduce((sum, r) => sum + (r.health?.batteryPercent ?? 0), 0) / total;
  const lowBattery = robotList.filter((r) => (r.health?.batteryPercent ?? 100) < 25).length;
  const avgSignal = robotList.reduce((sum, r) => sum + (r.health?.signalStrength ?? 0), 0) / total;
  const avgSpeed = robotList.filter((r: RobotState) => r.status === "active").reduce((sum, r) => sum + (r.speed ?? 0), 0) / Math.max(1, byStatus.active ?? 0);

  return (
    <div className="space-y-4">
      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Fleet Size" value={String(total)} color="text-zinc-100" />
        <StatCard
          label="Avg Battery"
          value={`${avgBattery.toFixed(0)}%`}
          sub={lowBattery > 0 ? `${lowBattery} low` : undefined}
          color={avgBattery > 50 ? "text-emerald-400" : avgBattery > 25 ? "text-amber-400" : "text-rose-400"}
        />
        <StatCard label="Avg Signal" value={`${avgSignal.toFixed(0)}%`} color="text-sky-400" />
        <StatCard
          label="Avg Speed"
          value={`${avgSpeed.toFixed(1)}`}
          sub="m/s (active)"
          color="text-zinc-100"
        />
      </div>

      {/* Status breakdown */}
      <div>
        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Status</div>
        <div className="space-y-1.5">
          <MiniBar label="Active" value={byStatus.active ?? 0} max={total} color="bg-emerald-500" />
          <MiniBar label="Idle" value={byStatus.idle ?? 0} max={total} color="bg-sky-500" />
          <MiniBar label="Returning" value={byStatus.returning ?? 0} max={total} color="bg-amber-500" />
          <MiniBar label="Error" value={byStatus.error ?? 0} max={total} color="bg-rose-500" />
          <MiniBar label="Offline" value={byStatus.offline ?? 0} max={total} color="bg-zinc-500" />
        </div>
      </div>

      {/* Type breakdown */}
      <div>
        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Composition</div>
        <div className="space-y-1.5">
          <MiniBar label="Drones" value={byType.drone ?? 0} max={total} color="bg-emerald-500" />
          <MiniBar label="Rovers" value={byType.ground ?? 0} max={total} color="bg-violet-500" />
          <MiniBar label="UUVs" value={byType.underwater ?? 0} max={total} color="bg-cyan-500" />
        </div>
      </div>

      {/* Battery burn-down */}
      <BatteryBurnDown robots={robotList} />

      {/* Mission timeline */}
      <MissionTimeline />

      {/* AI history */}
      <AIHistory />
    </div>
  );
}
