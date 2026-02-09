import { useConnectionStore } from "../../stores/useConnectionStore";
import { useRobotStore } from "../../stores/useRobotStore";
import { useAIStore } from "../../stores/useAIStore";
import { useUIStore } from "../../stores/useUIStore";
import { useAutonomyStore } from "../../stores/useAutonomyStore";
import { AutonomyBadge } from "../autonomy/AutonomyBadge";

export function HeaderBar() {
  const connected = useConnectionStore((s) => s.connected);
  const reconnecting = useConnectionStore((s) => s.reconnecting);
  const robots = useRobotStore((s) => s.robots);
  const pendingSuggestions = useAIStore((s) =>
    Object.values(s.suggestions).filter((sg) => sg.status === "pending").length
  );
  const alertsPanelOpen = useUIStore((s) => s.alertsPanelOpen);
  const toggleAlertsPanel = useUIStore((s) => s.toggleAlertsPanel);
  const fleetDefaultTier = useAutonomyStore((s) => s.fleetDefaultTier);

  const robotList = Object.values(robots);
  const activeCount = robotList.filter((r) => r.status === "active").length;
  const errorCount = robotList.filter((r) => r.status === "error").length;
  const offlineCount = robotList.filter((r) => r.status === "offline").length;
  const totalCount = robotList.length;

  return (
    <div className="fixed top-0 left-0 right-0 h-14 z-20 flex items-center px-5 bg-zinc-900 border-b border-zinc-800">
      {/* Left: connection + wordmark */}
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            connected
              ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
              : reconnecting
                ? "bg-amber-500 animate-pulse"
                : "bg-rose-500"
          }`}
        />
        <span className="text-[11px] text-zinc-500">
          {connected ? "Connected" : reconnecting ? "Reconnecting..." : "Offline"}
        </span>
        <div className="w-px h-5 bg-zinc-700/60 mx-1" />
        <span className="text-sm font-bold tracking-wide text-zinc-100">
          Fleet Command
        </span>
      </div>

      <div className="flex-1" />

      {/* Right: status counts + alerts */}
      <div className="flex items-center gap-4">
        {/* Live status counts */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">{activeCount} active</span>
          </span>
          {errorCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-zinc-400">{errorCount} error</span>
            </span>
          )}
          {offlineCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span className="text-zinc-400">{offlineCount} offline</span>
            </span>
          )}
          <span className="text-zinc-600">{totalCount} total</span>
        </div>

        <div className="w-px h-5 bg-zinc-700/60" />

        {/* Fleet default tier */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-500">Fleet:</span>
          <AutonomyBadge tier={fleetDefaultTier} size="md" />
        </div>

        <div className="w-px h-5 bg-zinc-700/60" />

        {/* Alerts button */}
        <button
          onClick={toggleAlertsPanel}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all duration-150 ${
            alertsPanelOpen
              ? "bg-amber-500/25 text-amber-200 border-amber-500/40"
              : pendingSuggestions > 0
                ? "bg-amber-500/15 text-amber-300 border-amber-500/25 hover:bg-amber-500/25"
                : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300"
          }`}
        >
          {pendingSuggestions > 0 ? `${pendingSuggestions} Alert${pendingSuggestions > 1 ? "s" : ""}` : "Alerts"}
        </button>
      </div>
    </div>
  );
}
