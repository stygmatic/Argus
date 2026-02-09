interface AuthorityIndicatorProps {
  source: string;
  timestamp: number;
}

export function AuthorityIndicator({ source, timestamp }: AuthorityIndicatorProps) {
  if (!source) return null;

  const isAI = source === "ai";
  const elapsed = timestamp > 0 ? Math.round((Date.now() / 1000 - timestamp)) : 0;
  const timeAgo =
    elapsed < 60
      ? `${elapsed}s ago`
      : elapsed < 3600
        ? `${Math.floor(elapsed / 60)}m ago`
        : `${Math.floor(elapsed / 3600)}h ago`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-500">Last control:</span>
      <span
        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
          isAI
            ? "bg-violet-500/15 border-violet-500/30 text-violet-400"
            : "bg-sky-500/15 border-sky-500/30 text-sky-400"
        }`}
      >
        {isAI ? "AI" : "Operator"}
      </span>
      {timestamp > 0 && (
        <span className="text-[11px] text-slate-600">{timeAgo}</span>
      )}
    </div>
  );
}
