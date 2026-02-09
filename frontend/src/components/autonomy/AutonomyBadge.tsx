import type { AutonomyTier } from "../../types/robot";

const TIER_CONFIG: Record<AutonomyTier, { label: string; bg: string; text: string }> = {
  manual: { label: "MAN", bg: "bg-slate-500/15 border-slate-500/30", text: "text-slate-400" },
  assisted: { label: "AST", bg: "bg-sky-500/15 border-sky-500/30", text: "text-sky-400" },
  supervised: { label: "SUP", bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-400" },
  autonomous: { label: "AUT", bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-400" },
};

interface AutonomyBadgeProps {
  tier: AutonomyTier;
  size?: "sm" | "md";
}

export function AutonomyBadge({ tier, size = "sm" }: AutonomyBadgeProps) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.assisted;
  const sizeClasses = size === "sm" ? "text-[9px] px-1.5 py-0" : "text-[11px] px-2 py-0.5";

  return (
    <span
      className={`font-bold tracking-wider rounded-full border ${config.bg} ${config.text} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
}
