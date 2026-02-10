import { useState, useMemo } from "react";
import { useRobotStore } from "../../stores/useRobotStore";
import { useUIStore } from "../../stores/useUIStore";
import { useConnectionStore } from "../../stores/useConnectionStore";
import { useAutonomyStore } from "../../stores/useAutonomyStore";
import type { RobotState, RobotStatus, AutonomyTier } from "../../types/robot";
import { AutonomyBadge } from "../autonomy/AutonomyBadge";
import { FleetStatsPanel } from "./FleetStatsPanel";
import { Plane, Search, Filter, ChevronDown, Sparkles, Menu } from "lucide-react";
import clsx from "clsx";

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
  idle: "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]",
  returning: "bg-amber-500 shadow-[0_0_6px_rgba(234,179,8,0.5)] animate-pulse",
  error: "bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse",
  offline: "bg-slate-600",
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

/* ---------- Robot row ---------- */
function RobotRow({ robot }: { robot: RobotState }) {
  const selectRobot = useUIStore((s) => s.selectRobot);
  const selectedId = useUIStore((s) => s.selectedRobotId);
  const isSelected = selectedId === robot.id;

  const battPercent = robot.health?.batteryPercent ?? 0;
  const battColor = battPercent > 50 ? "bg-emerald-500" : battPercent > 20 ? "bg-amber-500" : "bg-rose-500";

  return (
    <button
      onClick={() => selectRobot(isSelected ? null : robot.id)}
      className={clsx(
        "w-full text-left rounded-xl p-4 transition-all duration-200",
        isSelected
          ? "bg-blue-500/10 border border-blue-500/30 shadow-lg shadow-blue-500/5"
          : "hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status dot */}
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[robot.status] || "bg-slate-600"}`} />

        {/* Name + type */}
        <div className="flex-1 min-w-0">
          <div className="text-base font-medium text-slate-200 truncate">{robot.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">{TYPE_LABELS[robot.robotType] || robot.robotType}</span>
            <AutonomyBadge tier={(robot.autonomyTier ?? "assisted") as AutonomyTier} />
          </div>
        </div>

        {/* Battery */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-sm font-medium text-slate-300">{battPercent.toFixed(0)}%</span>
          <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${battColor} transition-all duration-500`} style={{ width: `${battPercent}%` }} />
          </div>
        </div>
      </div>
    </button>
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

  const [tab, setTab] = useState<Tab>("units");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const robotList = Object.values(robots);

  const tierLabel = fleetDefaultTier.slice(0, 3).toUpperCase();

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
    return list;
  }, [robotList, filterStatus, searchQuery]);

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

  const filterLabel: Record<string, string> = {
    all: "All Status",
    active: "Active",
    idle: "Idle",
    returning: "Returning",
    error: "Error",
    offline: "Offline",
  };

  const sortLabel: Record<string, string> = {
    name: "Sort: Name",
    status: "Sort: Status",
    battery: "Sort: Battery",
    type: "Sort: Type",
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Fleet Command</h1>
            <p className="text-sm text-slate-400 mt-1.5">{tierLabel} Operations</p>
          </div>
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <Menu className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Connection Status */}
        <div className={clsx(
          "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200",
          connected
            ? "bg-emerald-500/10 border-emerald-500/20"
            : reconnecting
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-rose-500/10 border-rose-500/20"
        )}>
          <div className={clsx(
            "w-2 h-2 rounded-full transition-colors",
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
      <div className="flex border-b border-slate-800 px-6 gap-2 mt-2">
        {(["units", "analytics", "missions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-3 text-sm font-medium transition-colors relative rounded-t-lg",
              tab === t ? "text-blue-400 bg-slate-800/50" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {tab === t && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "units" ? (
        <>
          {/* Search and Filter */}
          <div className="px-6 py-6 border-b border-slate-800 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search units..."
                className="w-full pl-11 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-lg font-light"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {/* Filter dropdown */}
              <div className="relative flex-1">
                <button
                  onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false); }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-750 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5" />
                    <span>{filterLabel[filterStatus] || "All Status"}</span>
                  </div>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {filterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 animate-in fade-in duration-100">
                    {(["all", "active", "idle", "returning", "error", "offline"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setFilterStatus(s as RobotStatus | "all"); setFilterOpen(false); }}
                        className={clsx(
                          "w-full text-left px-3 py-2 text-xs transition-colors",
                          filterStatus === s ? "text-blue-400 bg-blue-500/10" : "text-slate-300 hover:bg-slate-700"
                        )}
                      >
                        {filterLabel[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative flex-1">
                <button
                  onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false); }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-750 hover:border-slate-600 transition-all"
                >
                  <span>{sortLabel[sortBy] || "Sort: Name"}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {sortOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 animate-in fade-in duration-100">
                    {(["name", "status", "battery", "type"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setSortBy(s); setSortOpen(false); }}
                        className={clsx(
                          "w-full text-left px-3 py-2 text-xs transition-colors",
                          sortBy === s ? "text-blue-400 bg-blue-500/10" : "text-slate-300 hover:bg-slate-700"
                        )}
                      >
                        {sortLabel[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Robot list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center mb-5 border border-blue-500/20">
                  <Plane className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {robotList.length === 0 ? "No Units Connected" : "No Matches"}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {robotList.length === 0
                    ? "Waiting for fleet telemetry. Units will appear here once they establish connection."
                    : "Try adjusting your search or filters."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sorted.map((robot) => <RobotRow key={robot.id} robot={robot} />)}
              </div>
            )}
          </div>
        </>
      ) : tab === "analytics" ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
          <FleetStatsPanel />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          <div className="text-sm text-slate-500 text-center py-10 leading-relaxed">
            Mission planning available via AI Mission Plan button below.
          </div>
        </div>
      )}

      {/* AI Mission Plan button */}
      {onMissionPlan && (
        <div className="px-6 py-5 border-t border-slate-800 mt-auto">
          <button
            onClick={onMissionPlan}
            className="w-full px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold text-base hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2.5"
          >
            <Sparkles className="w-5 h-5" />
            AI Mission Plan
          </button>
        </div>
      )}
    </div>
  );
}