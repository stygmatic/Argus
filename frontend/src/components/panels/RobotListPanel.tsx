import { useState, useMemo } from "react";
import { useRobotStore } from "../../stores/useRobotStore";
import { useUIStore } from "../../stores/useUIStore";
import { useAIStore } from "../../stores/useAIStore";
import { useCommandStore } from "../../stores/useCommandStore";
import { useConnectionStore } from "../../stores/useConnectionStore";
import { useMissionStore } from "../../stores/useMissionStore";
import { useAutonomyStore } from "../../stores/useAutonomyStore";
import type { RobotState, RobotType, RobotStatus, AutonomyTier } from "../../types/robot";
import { AutonomyBadge } from "../autonomy/AutonomyBadge";
import { FleetStatsPanel } from "./FleetStatsPanel";
import { Plane, Search, ChevronDown, Activity } from "lucide-react";
import clsx from "clsx";

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
  idle: "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]",
  returning: "bg-amber-500 shadow-[0_0_6px_rgba(234,179,8,0.5)] animate-pulse",
  error: "bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse",
  offline: "bg-slate-600",
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
    <div className="px-4 pb-3 pt-1.5 space-y-2.5 border-t border-slate-700/30">
      {/* Battery + Signal gauges */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Battery</span>
            <span className="text-slate-400">{battPercent.toFixed(0)}% ({estimateTimeToCritical(battPercent)})</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${battColor} transition-all duration-500`} style={{ width: `${battPercent}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Link</span>
            <span className="text-slate-400">{signalStrength.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${sigColor} transition-all duration-500`} style={{ width: `${signalStrength}%` }} />
          </div>
        </div>
      </div>

      {/* Current task + mission */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-slate-500">Task:</span>
        <span className="text-[10px] text-slate-300 capitalize">{robot.status === "active" ? "patrolling" : robot.status}</span>
        {robotMission && (
          <>
            <span className="text-[10px] text-slate-600">|</span>
            <span className="text-[10px] text-blue-400 truncate max-w-[120px]">{robotMission.name}</span>
            {missionProgress && (
              <span className="text-[10px] text-slate-500">
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
          className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-750 transition-colors"
        >
          Focus
        </button>
        {robot.status === "active" && (
          <button
            onClick={() => sendCommand(robot.id, "hold_position")}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 hover:bg-amber-500/15 transition-colors"
          >
            Pause
          </button>
        )}
        <button
          onClick={() => sendCommand(robot.id, "return_home")}
          className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-blue-400 hover:bg-blue-500/15 transition-colors"
        >
          RTB
        </button>
        <button
          onClick={() => toggleAiLock(robot.id)}
          className={clsx(
            "text-[10px] px-2.5 py-1 rounded-lg border transition-colors",
            aiLocked
              ? "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25"
              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
          )}
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
          ? "bg-blue-500/10 border border-blue-500/30"
          : isMultiSelected
            ? "bg-violet-500/10 border border-violet-500/25"
            : "hover:bg-slate-800/60 border border-transparent"
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
              : "border-slate-600 hover:border-slate-400"
          )}
        >
          {isMultiSelected && (
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[robot.status] || "bg-slate-600"}`} />

        {/* Type icon + name */}
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => selectRobot(isSelected ? null : robot.id)}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{TYPE_ICON[robot.robotType] || "\u2022"}</span>
            <span className="text-sm font-medium text-slate-200 truncate">{robot.name}</span>
            {aiLocked && <span className="text-[9px] text-rose-400" title="AI locked">AI</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">{TYPE_LABELS[robot.robotType] || robot.robotType}</span>
            <AutonomyBadge tier={(robot.autonomyTier ?? "assisted") as AutonomyTier} />
          </div>
        </button>

        {/* Alert badge */}
        <AlertBadge robotId={robot.id} />

        {/* Battery */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs text-slate-400">{battPercent.toFixed(0)}%</span>
          <div className="w-10 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${battColor} transition-all duration-500`} style={{ width: `${battPercent}%` }} />
          </div>
        </div>

        {/* Expand chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedRobotId(robot.id);
          }}
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 p-0.5"
        >
          <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
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
    <div className="flex items-center gap-2 px-6 py-2 text-xs border-b border-slate-800">
      <span className={clsx("flex items-center gap-1", worstBatt < 25 ? "text-rose-400" : "text-slate-500")}>
        Batt: {worstBatt.toFixed(0)}% ({worstBattery.name})
      </span>
      <span className="text-slate-700">|</span>
      <span className={clsx("flex items-center gap-1", worstSig < 30 ? "text-rose-400" : "text-slate-500")}>
        Link: {worstSig.toFixed(0)}%
      </span>
      {offlineCount > 0 && (
        <>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500">{offlineCount} off</span>
        </>
      )}
      {errorCount > 0 && (
        <>
          <span className="text-slate-700">|</span>
          <span className="text-rose-400">{errorCount} err</span>
        </>
      )}
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
    <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-violet-400 font-medium">
          {selectedIds.length} selected
        </span>
        <button
          onClick={clearSelection}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => sendBatchCommand(selectedIds, "return_home")}
          className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
        >
          RTB All
        </button>
        <button
          onClick={() => sendBatchCommand(selectedIds, "hold_position")}
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
        >
          Hold All
        </button>
        <button
          onClick={() => sendBatchCommand(selectedIds, "patrol")}
          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
        >
          Resume
        </button>
        <button
          onClick={() => sendBatchCommand(selectedIds, "stop")}
          className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
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

type Tab = "units" | "analytics" | "missions";

export function RobotListPanel({ onMissionPlan }: RobotListPanelProps) {
  const robots = useRobotStore((s) => s.robots);
  const connected = useConnectionStore((s) => s.connected);
  const reconnecting = useConnectionStore((s) => s.reconnecting);
  const fleetDefaultTier = useAutonomyStore((s) => s.fleetDefaultTier);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const sortBy = useUIStore((s) => s.sortBy);
  const setSortBy = useUIStore((s) => s.setSortBy);
  const filterStatus = useUIStore((s) => s.filterStatus);
  const setFilterStatus = useUIStore((s) => s.setFilterStatus);
  const collapseInactive = useUIStore((s) => s.collapseInactive);
  const selectedIds = useUIStore((s) => s.selectedRobotIds);
  const selectAllRobots = useUIStore((s) => s.selectAllRobots);
  const clearSelection = useUIStore((s) => s.clearSelection);

  const [tab, setTab] = useState<Tab>("units");
  const robotList = Object.values(robots);

  const tierLabel = fleetDefaultTier.charAt(0).toUpperCase() + fleetDefaultTier.slice(0, 3).toUpperCase();

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
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Fleet Command</h1>
            <p className="text-sm text-slate-400 mt-1">{tierLabel} Operations</p>
          </div>
          <span className="text-xs text-slate-500">
            {sorted.length}/{robotList.length}
          </span>
        </div>

        {/* Connection Status */}
        <div className={clsx(
          "flex items-center gap-3 px-4 py-3 rounded-xl border",
          connected
            ? "bg-emerald-500/10 border-emerald-500/20"
            : reconnecting
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-rose-500/10 border-rose-500/20"
        )}>
          <div className={clsx(
            "w-2 h-2 rounded-full",
            connected ? "bg-emerald-500 animate-pulse" : reconnecting ? "bg-amber-500 animate-pulse" : "bg-rose-500"
          )} />
          <span className={clsx(
            "text-sm font-medium",
            connected ? "text-emerald-400" : reconnecting ? "text-amber-400" : "text-rose-400"
          )}>
            {connected ? "System Connected" : reconnecting ? "Reconnecting..." : "Offline"}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 px-6">
        {(["units", "analytics", "missions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              tab === t ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {tab === t && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "units" ? (
        <>
          {/* Search and Filter */}
          <div className="p-6 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search units..."
                className="w-full pl-10 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm"
                >
                  &times;
                </button>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as RobotStatus | "all")}
                  className="appearance-none flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-750 transition-colors cursor-pointer focus:outline-none pr-7"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="returning">Returning</option>
                  <option value="error">Error</option>
                  <option value="offline">Offline</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "status" | "battery" | "type")}
                  className="appearance-none flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-750 transition-colors cursor-pointer focus:outline-none pr-7"
                >
                  <option value="name">Sort: Name</option>
                  <option value="status">Sort: Status</option>
                  <option value="battery">Sort: Battery</option>
                  <option value="type">Sort: Type</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Fleet health summary */}
          <FleetHealthSummary robots={robotList} />

          {/* Select all / collapse toggle */}
          <div className="flex items-center justify-between px-6 py-2">
            <button
              onClick={() => allSelected ? clearSelection() : selectAllRobots(allFilteredIds)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
            <button
              onClick={useUIStore.getState().toggleCollapseInactive}
              className={clsx(
                "text-xs transition-colors",
                collapseInactive ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {collapseInactive ? "Show all" : "Hide inactive"}
            </button>
          </div>

          {/* Robot list */}
          <div className="flex-1 overflow-y-auto px-4 pb-2 scrollbar-thin">
            <div className="space-y-1">
              {sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
                    <Plane className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {robotList.length === 0 ? "No Units Connected" : "No Matches"}
                  </h3>
                  <p className="text-sm text-slate-400 max-w-xs">
                    {robotList.length === 0
                      ? "Waiting for fleet telemetry. Units will appear here once they establish connection."
                      : "Try adjusting your search or filters."}
                  </p>
                </div>
              ) : (
                sorted.map((robot) => <RobotRow key={robot.id} robot={robot} />)
              )}
            </div>
          </div>

          {/* Swarm command bar */}
          <SwarmCommandBar />
        </>
      ) : tab === "analytics" ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
          <FleetStatsPanel />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          <div className="text-sm text-slate-500 text-center py-10">
            Mission planning available via AI Mission Plan button below.
          </div>
        </div>
      )}

      {/* AI Mission Plan button */}
      {onMissionPlan && selectedIds.length === 0 && (
        <div className="p-6 border-t border-slate-800">
          <button
            onClick={onMissionPlan}
            className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4" />
            AI Mission Plan
          </button>
        </div>
      )}
    </div>
  );
}
