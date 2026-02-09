import { useState } from "react";
import { useAIStore } from "../../stores/useAIStore";
import { useUIStore } from "../../stores/useUIStore";
import { useRobotStore } from "../../stores/useRobotStore";
import { useAutonomyStore } from "../../stores/useAutonomyStore";
import type { Suggestion } from "../../types/ai";
import type { AutonomyTier } from "../../types/robot";
import { CountdownTimer } from "../autonomy/CountdownTimer";
import clsx from "clsx";

const SEVERITY_STYLES: Record<string, { border: string; icon: string }> = {
  critical: { border: "border-rose-500/40", icon: "!!!" },
  warning: { border: "border-amber-500/40", icon: "!" },
  info: { border: "border-sky-500/40", icon: "i" },
};

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const [expanded, setExpanded] = useState(false);
  const approve = useAIStore((s) => s.approveSuggestion);
  const reject = useAIStore((s) => s.rejectSuggestion);
  const robot = useRobotStore((s) => s.robots[suggestion.robotId]);
  const countdown = useAutonomyStore((s) => s.countdowns[suggestion.id]);
  const style = (SEVERITY_STYLES[suggestion.severity] ?? SEVERITY_STYLES.info)!;

  const tier = (robot?.autonomyTier ?? "assisted") as AutonomyTier;

  const timeLeft = suggestion.expiresAt > 0
    ? Math.max(0, Math.round((suggestion.expiresAt - Date.now() / 1000)))
    : null;

  // Determine what action buttons to show based on tier
  const renderActions = () => {
    if (suggestion.status !== "pending") {
      return (
        <span className={clsx(
          "text-[11px] capitalize",
          suggestion.status === "approved" ? "text-emerald-400" : "text-zinc-500"
        )}>
          {suggestion.status}
        </span>
      );
    }

    if (tier === "autonomous") {
      return (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-emerald-500/15 border-emerald-500/30 text-emerald-400">
          Auto-executed
        </span>
      );
    }

    if (tier === "supervised" && countdown) {
      return (
        <CountdownTimer
          suggestionId={suggestion.id}
          autoExecuteAt={countdown.autoExecuteAt}
        />
      );
    }

    // manual or assisted
    return (
      <>
        <button
          onClick={() => reject(suggestion.id)}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-700/60 text-zinc-400 hover:bg-zinc-600/60 transition-colors"
        >
          Dismiss
        </button>
        {tier !== "manual" && suggestion.proposedAction && (
          <button
            onClick={() => approve(suggestion.id)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors"
          >
            Approve
          </button>
        )}
      </>
    );
  };

  return (
    <div className={clsx(
      "rounded-xl border p-3.5 space-y-2.5 bg-zinc-800/40",
      style.border
    )}>
      <div className="flex items-start gap-2.5">
        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-700/50 text-zinc-300">
          {style.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-zinc-200 truncate">{suggestion.title}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">{suggestion.description}</div>
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <span className="text-[11px] text-zinc-500">{suggestion.source}</span>
          {suggestion.confidence > 0 && (
            <span className="text-[11px] text-zinc-500">
              {(suggestion.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="text-[13px] text-zinc-400 bg-zinc-800/50 rounded-lg p-2.5">
          {suggestion.reasoning}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {expanded ? "Less" : "More"}
        </button>
        <div className="flex-1" />
        {timeLeft !== null && !countdown && (
          <span className="text-[11px] text-zinc-600">{timeLeft}s</span>
        )}
        {renderActions()}
      </div>
    </div>
  );
}

/* ---------- Fleet Alert Stack ---------- */
function FleetAlertStack({ suggestions }: { suggestions: Suggestion[] }) {
  const robots = useRobotStore((s) => s.robots);
  const robotList = Object.values(robots);

  const lowBattery = robotList.filter((r) => (r.health?.batteryPercent ?? 100) < 25);
  const lostComms = robotList.filter((r) => r.status === "offline");
  const criticalAlerts = suggestions.filter((s) => s.status === "pending" && s.severity === "critical");

  if (lowBattery.length === 0 && lostComms.length === 0 && criticalAlerts.length === 0) {
    return null;
  }

  return (
    <div className="mx-3 mb-2 space-y-1.5">
      {criticalAlerts.length > 0 && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/25">
          <span className="text-rose-400 text-[11px] font-bold">!!!</span>
          <span className="text-[11px] text-rose-300">{criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? "s" : ""}</span>
        </div>
      )}
      {lowBattery.length > 0 && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
          <span className="text-amber-400 text-[11px]">{"\u26A1"}</span>
          <span className="text-[11px] text-amber-300">{lowBattery.length} low battery: {lowBattery.map((r) => r.name).join(", ")}</span>
        </div>
      )}
      {lostComms.length > 0 && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-zinc-500/10 border border-zinc-500/25">
          <span className="text-zinc-400 text-[11px]">{"\uD83D\uDCE1"}</span>
          <span className="text-[11px] text-zinc-300">{lostComms.length} lost comms: {lostComms.map((r) => r.name).join(", ")}</span>
        </div>
      )}
    </div>
  );
}

export function AlertsPanel() {
  const suggestions = useAIStore((s) => s.suggestions);
  const isOpen = useUIStore((s) => s.alertsPanelOpen);
  const toggleAlertsPanel = useUIStore((s) => s.toggleAlertsPanel);

  const allSuggestions = Object.values(suggestions)
    .sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const sa = severityOrder[a.severity as keyof typeof severityOrder] ?? 2;
      const sb = severityOrder[b.severity as keyof typeof severityOrder] ?? 2;
      return sa - sb || b.createdAt - a.createdAt;
    });

  const pending = allSuggestions.filter((s) => s.status === "pending");

  if (!isOpen) return null;

  return (
    <div className="fixed top-14 right-0 bottom-0 w-[340px] z-30 bg-zinc-900 border-l border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-zinc-700/40">
        <div>
          <div className="text-sm font-semibold text-zinc-200">Alerts</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {pending.length} pending
          </div>
        </div>
        <button
          onClick={toggleAlertsPanel}
          className="text-zinc-500 hover:text-zinc-300 text-lg leading-none p-1 transition-colors"
        >
          &times;
        </button>
      </div>

      {/* Fleet alert stack */}
      <div className="pt-3">
        <FleetAlertStack suggestions={allSuggestions} />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {allSuggestions.length === 0 ? (
          <div className="text-[13px] text-zinc-500 text-center py-10">No alerts</div>
        ) : (
          allSuggestions.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))
        )}
      </div>
    </div>
  );
}
