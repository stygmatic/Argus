import type { AutonomyTier } from "../../types/robot";
import { useAutonomyStore } from "../../stores/useAutonomyStore";

const TIERS: { value: AutonomyTier; label: string; color: string; activeColor: string }[] = [
  { value: "manual", label: "MAN", color: "text-zinc-500", activeColor: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40" },
  { value: "assisted", label: "AST", color: "text-zinc-500", activeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
  { value: "supervised", label: "SUP", color: "text-zinc-500", activeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  { value: "autonomous", label: "AUT", color: "text-zinc-500", activeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
];

interface AutonomyTierSelectorProps {
  robotId: string;
  currentTier: AutonomyTier;
}

export function AutonomyTierSelector({ robotId, currentTier }: AutonomyTierSelectorProps) {
  const setRobotTier = useAutonomyStore((s) => s.setRobotTier);

  return (
    <div>
      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
        Autonomy Tier
      </div>
      <div className="flex gap-1">
        {TIERS.map((t) => {
          const isActive = currentTier === t.value;
          return (
            <button
              key={t.value}
              onClick={() => {
                if (!isActive) setRobotTier(robotId, t.value);
              }}
              className={`flex-1 text-[11px] font-bold tracking-wide py-1.5 rounded-lg border transition-all duration-150 ${
                isActive
                  ? t.activeColor
                  : "border-transparent hover:bg-zinc-800/60 " + t.color
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
