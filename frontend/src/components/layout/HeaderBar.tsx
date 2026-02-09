import { Radio, AlertCircle, Bell, Settings } from "lucide-react";
import { useRobotStore } from "../../stores/useRobotStore";
import { useAIStore } from "../../stores/useAIStore";
import { useUIStore } from "../../stores/useUIStore";
import { useAutonomyStore } from "../../stores/useAutonomyStore";
import { AutonomyBadge } from "../autonomy/AutonomyBadge";

export function HeaderBar() {
  const robots = useRobotStore((s) => s.robots);
  const pendingSuggestions = useAIStore((s) =>
    Object.values(s.suggestions).filter((sg) => sg.status === "pending").length
  );
  const alertsPanelOpen = useUIStore((s) => s.alertsPanelOpen);
  const toggleAlertsPanel = useUIStore((s) => s.toggleAlertsPanel);
  const settingsPanelOpen = useUIStore((s) => s.settingsPanelOpen);
  const toggleSettingsPanel = useUIStore((s) => s.toggleSettingsPanel);
  const fleetDefaultTier = useAutonomyStore((s) => s.fleetDefaultTier);

  const robotList = Object.values(robots);
  const activeCount = robotList.filter((r) => r.status === "active").length;
  const totalCount = robotList.length;

  return (
    <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
      {/* Left: active count + total */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Radio className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-300">{activeCount}</span>
            <span className="text-slate-500">active</span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="text-sm">
            <span className="font-medium text-slate-300">{totalCount}</span>
            <span className="text-slate-500"> total units</span>
          </div>
        </div>

        <div className="w-px h-4 bg-slate-700" />

        {/* Fleet default tier */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Fleet:</span>
          <AutonomyBadge tier={fleetDefaultTier} size="md" />
        </div>
      </div>

      {/* Right: alerts, bell, settings */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleAlertsPanel}
          className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${
            alertsPanelOpen
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
              : pendingSuggestions > 0
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          {pendingSuggestions > 0
            ? `${pendingSuggestions} Alert${pendingSuggestions > 1 ? "s" : ""}`
            : "Alerts"}
        </button>

        <button className="p-2.5 hover:bg-slate-800 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-slate-400" />
          {pendingSuggestions > 0 && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        <button
          onClick={toggleSettingsPanel}
          className={`p-2.5 rounded-lg transition-colors ${
            settingsPanelOpen
              ? "bg-slate-700 text-slate-200"
              : "hover:bg-slate-800 text-slate-400"
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
