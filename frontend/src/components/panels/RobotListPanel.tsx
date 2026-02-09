import { useState, useMemo } from "react";
import { useRobotStore } from "../../stores/useRobotStore";
import { useUIStore } from "../../stores/useUIStore";
import { useAIStore } from "../../stores/useAIStore";
import { useCommandStore } from "../../stores/useCommandStore";
import { useMissionStore } from "../../stores/useMissionStore";
import type { RobotState, RobotType, RobotStatus, AutonomyTier } from "../../types/robot";
import { AutonomyBadge } from "../autonomy/AutonomyBadge";
import { FleetStatsPanel } from "./FleetStatsPanel";
import clsx from "clsx";

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

const STATUS_ORDER: Record<string, number> = {
  error: 0,
  active: 1,
  returning: 2,
  idle: 3,
  offline: 4,
};

function estimateTimeToCritical(battPercent: number): string {
  if (battPercent <= 15) return "critical";
  const minsLeft = Math.round((battPercent - 15) * 1.2);
  if (minsLeft < 60) return `~${minsLeft}m`;
  return `~${(minsLeft / 60).toFixed(1)}h`;
}

/* ---------- Expanded row content ---------- */
function ExpandedRow({ robot }: { robot: RobotState }) {
  const selectRobot = useUIStore((s) => s.selectRobot);
  const sendCommand = useCommandStore((s) => s.sendCommand);
  const aiLocked = useUIStore((s) => s.aiLocked[robot.id] ?? false);
  const toggleAiLock = useUIStore((s) => s.toggleAiLock);
  const missions = useMissionStore((s) => s.missions);

  const battPercent = robot.health?.batteryPercent ?? 0;
  const signalStrength = robot.health?.signalStrength ?? 0;
  const battColor = battPercent > 50 ? "bg-emerald-500" : battPercent > 20 ? "bg-amber-500" : "bg-rose-500";
  const sigColor = signalStrength > 60 ? "bg-emerald-500" : signalStrength > 30 ? "bg-amber-500" : "bg-rose-500";

  const robotMission = Object.values(missions).find(
    (m) => m.assignedRobots?.includes(robot.id) && (m.status === "active" || m.status === "paused")
  );

  const missionProgress = useMemo(() => {
    const wps = robotMission?.waypoints?.[robot.id];
    if (!wps) return null;
    const completed = wps.filter((w) => w.status === "completed").length;
    return { completed, total: wps.length, pct: wps.length > 0 ? Math.round((completed / wps.length) * 100) : 0 };
  }, [robotMission, robot.id]);

  const pendingActions = useAIStore((s) =>
    Object.values(s.suggestions).filter((sg) => sg.robotId === robot.id && sg.status === "pending").length
  );

  return (
    <div className="px-3 pb-2.5 pt-1 space-y-2.5 border-t border-zinc-700/30">
      {/* Battery + Signal gauges */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-zinc-500">Battery</span>
            <span className="text-zinc-400">{battPercent.toFixed(0)}% ({estimateTimeToCritical(battPercent)})</span>
          </div>
          <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${battColor} transition-all duration-500`} style={{ width: `${battPercent}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-zinc-500">Link</span>
            <span className="text-zinc-400">{signalStrength.toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${sigColor} transition-all duration-500`} style={{ width: `${signalStrength}%` }} />
          </div>
        </div>
      </div>

      {/* Current task + mission */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-zinc-500">Task:</span>
        <span className="text-[10px] text-zinc-300 capitalize">{robot.status === "active" ? "patrolling" : robot.status}</span>
        {robotMission && (
          <>
            <span className="text-[10px] text-zinc-600">|</span>
            <span className="text-[10px] text-sky-400 truncate max-w-[100px]">{robotMission.name}</span>
            {missionProgress && (
              <span className="text-[10px] text-zinc-500">
                {missionProgress.completed}/{missionProgress.total} wp
              </span>
            )}
          </>
        )}
      </div>

      {/* AI transparency row */}
      {pendingActions > 0 && (
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-violet-400">{pendingActions} pending AI action{pendingActions > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => selectRobot(robot.id)}
          className="text-[10px] px-2 py-1 rounded-md bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-600/50 transition-colors"
        >
          Focus
        </button>
        {robot.status === "active" && (
          <button
            onClick={() => sendCommand(robot.id, "hold_position")}
            className="text-[10px] px-2 py-1 rounded-md bg-zinc-700/50 text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            Pause
          </button>
        )}
        <button
          onClick={() => sendCommand(robot.id, "return_home")}
          className="text-[10px] px-2 py-1 rounded-md bg-zinc-700/50 text-sky-400 hover:bg-sky-500/20 transition-colors"
        >
          RTB
        </button>
        <button
          onClick={() => toggleAiLock(robot.id)}
          className={clsx(
            "text-[10px] px-2 py-1 rounded-md transition-colors",
            aiLocked
              ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
              : "bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-600/50"
          )}
          title={aiLocked ? "Unlock AI actions" : "Lock AI actions"}
        >
          {aiLocked ? "AI Locked" : "AI Lock"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Alert badge (inline) ---------- */
function AlertBadge({ robotId }: { robotId: string }) {
  const count = useAIStore((s) =>
    Object.values(s.suggestions).filter(
      (sg) => sg.robotId === robotId && sg.status === "pending" && sg.severity !== "info"
    ).length
  );
  if (count === 0) return null;
  return (
    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold flex-shrink-0">
      {count}
    </span>
  );
}

/* ---------- Robot row ---------- */
function RobotRow({ robot }: { robot: RobotState }) {
  const selectRobot = useUIStore((s) => s.selectRobot);
  const selectedId = useUIStore((s) => s.selectedRobotId);
  const isSelected = selectedId === robot.id;
  const expandedId = useUIStore((s) => s.expandedRobotId);
  const setExpandedRobotId = useUIStore((s) => s.setExpandedRobotId);
  const isExpanded = expandedId === robot.id;
  const selectedIds = useUIStore((s) => s.selectedRobotIds);
  const toggleSelection = useUIStore((s) => s.toggleRobotSelection);
  const isMultiSelected = selectedIds.includes(robot.id);
  const aiLocked = useUIStore((s) => s.aiLocked[robot.id] ?? false);

  const battPercent = robot.health?.batteryPercent ?? 0;
  const battColor = battPercent > 50 ? "bg-emerald-500" : battPercent > 20 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div
      className={clsx(
        "rounded-xl transition-all duration-150 overflow-hidden",
        isSelected
          ? "bg-gradient-to-r from-sky-500/15 to-sky-500/5 border border-sky-500/30"
          : isMultiSelected
            ? "bg-gradient-to-r from-violet-500/10 to-violet-500/5 border border-violet-500/25"
            : "hover:bg-zinc-800/60 border border-transparent"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Multi-select checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelection(robot.id);
          }}
          className={clsx(
            "w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
            isMultiSelected
              ? "bg-violet-500 border-violet-400"
              : "border-zinc-600 hover:border-zinc-400"
          )}
        >
          {isMultiSelected && (
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[robot.status] || "bg-zinc-600"}`} />

        {/* Type icon + name */}
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => selectRobot(isSelected ? null : robot.id)}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[13px]">{TYPE_ICON[robot.robotType] || "\u2022"}</span>
            <span className="text-[13px] font-medium text-zinc-200 truncate">{robot.name}</span>
            {aiLocked && <span className="text-[9px] text-rose-400" title="AI locked">AI</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500">{TYPE_LABELS[robot.robotType] || robot.robotType}</span>
            <AutonomyBadge tier={(robot.autonomyTier ?? "assisted") as AutonomyTier} />
          </div>
        </button>

        {/* Alert badge */}
        <AlertBadge robotId={robot.id} />

        {/* Battery */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[11px] text-zinc-400">{battPercent.toFixed(0)}%</span>
          <div className="w-10 h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${battColor} transition-all duration-500`} style={{ width: `${battPercent}%` }} />
          </div>
        </div>

        {/* Expand chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedRobotId(robot.id);
          }}
          className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0 p-0.5"
        >
          <svg className={clsx("w-3 h-3 transition-transform", isExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && <ExpandedRow robot={robot} />}
    </div>
  );
}

/* ---------- Fleet health summary ---------- */
function FleetHealthSummary({ robots }: { robots: RobotState[] }) {
  if (robots.length === 0) return null;

  const worstBattery = robots.reduce((worst, r) => {
    const batt = r.health?.batteryPercent ?? 100;
    return batt < (worst.health?.batteryPercent ?? 100) ? r : worst;
  }, robots[0]!);

  const worstSignal = robots.reduce((worst, r) => {
    const sig = r.health?.signalStrength ?? 100;
    return sig < (worst.health?.signalStrength ?? 100) ? r : worst;
  }, robots[0]!);

  const offlineCount = robots.filter((r) => r.status === "offline").length;
  const errorCount = robots.filter((r) => r.status === "error").length;

  const worstBatt = worstBattery.health?.batteryPercent ?? 0;
  const worstSig = worstSignal.health?.signalStrength ?? 0;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] border-b border-zinc-700/30">
      <span className={clsx("flex items-center gap-1", worstBatt < 25 ? "text-rose-400" : "text-zinc-500")}>
        Batt: {worstBatt.toFixed(0)}% ({worstBattery.name})
      </span>
      <span className="text-zinc-700">|</span>
      <span className={clsx("flex items-center gap-1", worstSig < 30 ? "text-rose-400" : "text-zinc-500")}>
        Link: {worstSig.toFixed(0)}%
      </span>
      {offlineCount > 0 && (
        <>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-500">{offlineCount} offline</span>
        </>
      )}
      {errorCount > 0 && (
        <>
          <span className="text-zinc-700">|</span>
          <span className="text-rose-400">{errorCount} error</span>
        </>
      )}
    </div>
  );
}

/* ---------- Search + filter bar ---------- */
function SearchFilterBar() {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const sortBy = useUIStore((s) => s.sortBy);
  const setSortBy = useUIStore((s) => s.setSortBy);
  const filterStatus = useUIStore((s) => s.filterStatus);
  const setFilterStatus = useUIStore((s) => s.setFilterStatus);

  return (
    <div className="px-3 space-y-1.5">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search units..."
          className="w-full text-[11px] bg-zinc-800/60 border border-zinc-700/50 rounded-lg pr-6 py-1.5 pl-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500/60 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
          >
            &times;
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as RobotStatus | "all")}
          className="text-[10px] bg-zinc-800/60 border border-zinc-700/50 rounded-md px-1.5 py-1 text-zinc-400 focus:outline-none cursor-pointer"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="idle">Idle</option>
          <option value="returning">Returning</option>
          <option value="error">Error</option>
          <option value="offline">Offline</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "status" | "battery" | "type")}
          className="text-[10px] bg-zinc-800/60 border border-zinc-700/50 rounded-md px-1.5 py-1 text-zinc-400 focus:outline-none cursor-pointer"
        >
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Status</option>
          <option value="battery">Sort: Battery</option>
          <option value="type">Sort: Type</option>
        </select>
      </div>
    </div>
  );
}

/* ---------- Swarm Command Bar ---------- */
function SwarmCommandBar() {
  const selectedIds = useUIStore((s) => s.selectedRobotIds);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const sendBatchCommand = useCommandStore((s) => s.sendBatchCommand);

  if (selectedIds.length === 0) return null;

  return (
    <div className="px-3 py-2 border-t border-zinc-700/40 bg-zinc-800/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-violet-400 font-medium">
          {selectedIds.length} selected
        </span>
        <button
          onClick={clearSelection}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => sendBatchCommand(selectedIds, "return_home")}
          className="text-[10px] px-2.5 py-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 hover:bg-sky-500/25 transition-colors"
        >
          RTB All
        </button>
        <button
          onClick={() => sendBatchCommand(selectedIds, "hold_position")}
          className="text-[10px] px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
        >
          Hold All
        </button>
        <button
          onClick={() => sendBatchCommand(selectedIds, "patrol")}
          className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
        >
          Resume All
        </button>
        <button
          onClick={() => sendBatchCommand(selectedIds, "stop")}
          className="text-[10px] px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition-colors"
        >
          E-Stop
        </button>
      </div>
    </div>
  );
}

/* ---------- Main panel ---------- */
interface RobotListPanelProps {
  onMissionPlan?: () => void;
}

type Tab = "fleet" | "stats";

export function RobotListPanel({ onMissionPlan }: RobotListPanelProps) {
  const robots = useRobotStore((s) => s.robots);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const sortBy = useUIStore((s) => s.sortBy);
  const filterStatus = useUIStore((s) => s.filterStatus);
  const collapseInactive = useUIStore((s) => s.collapseInactive);
  const selectedIds = useUIStore((s) => s.selectedRobotIds);
  const selectAllRobots = useUIStore((s) => s.selectAllRobots);
  const clearSelection = useUIStore((s) => s.clearSelection);

  const [tab, setTab] = useState<Tab>("fleet");
  const robotList = Object.values(robots);

  const filtered = useMemo(() => {
    let list = robotList;
    if (filterStatus !== "all") {
      list = list.filter((r) => r.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.robotType.toLowerCase().includes(q)
      );
    }
    if (collapseInactive) {
      list = list.filter((r) => r.status !== "offline" && r.status !== "idle");
    }
    return list;
  }, [robotList, filterStatus, searchQuery, collapseInactive]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "status":
        list.sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
        break;
      case "battery":
        list.sort((a, b) => (a.health?.batteryPercent ?? 0) - (b.health?.batteryPercent ?? 0));
        break;
      case "type":
        list.sort((a, b) => a.robotType.localeCompare(b.robotType));
        break;
    }
    return list;
  }, [filtered, sortBy]);

  const allFilteredIds = sorted.map((r) => r.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id));

  return (
    <div className="fixed top-14 left-0 bottom-0 w-[280px] z-20 flex flex-col bg-zinc-900 border-r border-zinc-800 overflow-hidden">
      {/* Header with tabs */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-zinc-200">Fleet</div>
          <div className="text-[11px] text-zinc-500">
            {sorted.length}/{robotList.length} unit{robotList.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-0.5">
          <button
            onClick={() => setTab("fleet")}
            className={`flex-1 text-[11px] py-1 rounded-md transition-all ${
              tab === "fleet" ? "bg-zinc-700/60 text-zinc-200" : "text-zinc-500 hover:text-zinc-400"
            }`}
          >
            Units
          </button>
          <button
            onClick={() => setTab("stats")}
            className={`flex-1 text-[11px] py-1 rounded-md transition-all ${
              tab === "stats" ? "bg-zinc-700/60 text-zinc-200" : "text-zinc-500 hover:text-zinc-400"
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Tab content */}
      {tab === "fleet" ? (
        <>
          {/* Fleet health summary */}
          <FleetHealthSummary robots={robotList} />

          {/* Search + filter */}
          <div className="py-2">
            <SearchFilterBar />
          </div>

          {/* Select all / collapse toggle */}
          <div className="flex items-center justify-between px-3 pb-1.5">
            <button
              onClick={() => allSelected ? clearSelection() : selectAllRobots(allFilteredIds)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
            <button
              onClick={useUIStore.getState().toggleCollapseInactive}
              className={clsx(
                "text-[10px] transition-colors",
                collapseInactive ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {collapseInactive ? "Show all" : "Hide inactive"}
            </button>
          </div>

          {/* Robot list */}
          <div className="flex-1 overflow-y-auto px-2 pb-1 scrollbar-thin">
            <div className="space-y-0.5">
              {sorted.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="text-3xl mb-3 opacity-30">{"\u2708"}</div>
                  <div className="text-[13px] text-zinc-500">
                    {robotList.length === 0 ? "No robots connected" : "No matches"}
                  </div>
                  <div className="text-[11px] text-zinc-600 mt-1">
                    {robotList.length === 0 ? "Waiting for fleet telemetry..." : "Try adjusting filters"}
                  </div>
                </div>
              ) : (
                sorted.map((robot) => <RobotRow key={robot.id} robot={robot} />)
              )}
            </div>
          </div>

          {/* Swarm command bar */}
          <SwarmCommandBar />
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin">
          <div className="px-1 pt-1">
            <FleetStatsPanel />
          </div>
        </div>
      )}

      {/* AI Mission Plan button */}
      {onMissionPlan && selectedIds.length === 0 && tab === "fleet" && (
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
