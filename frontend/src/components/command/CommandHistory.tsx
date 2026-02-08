import { useCommandStore } from "../../stores/useCommandStore";

const EMPTY_IDS: string[] = [];

const STATUS_PILLS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-400", label: "Pending" },
  sent: { bg: "bg-sky-500/15 border-sky-500/30", text: "text-sky-400", label: "Sent" },
  acknowledged: { bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-400", label: "Pending" },
  completed: { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-400", label: "Completed" },
  failed: { bg: "bg-rose-500/15 border-rose-500/30", text: "text-rose-400", label: "Failed" },
};

interface CommandHistoryProps {
  robotId: string;
}

export function CommandHistory({ robotId }: CommandHistoryProps) {
  const commands = useCommandStore((s) => s.commands);
  const robotCommandIds = useCommandStore((s) => s.robotCommands[robotId] ?? EMPTY_IDS);

  const recentIds = robotCommandIds.slice(-5).reverse();
  const recentCommands = recentIds
    .map((id) => commands[id])
    .filter((c): c is NonNullable<typeof c> => c != null);

  return (
    <div>
      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        Recent Commands
      </div>
      {recentCommands.length === 0 ? (
        <div className="text-[13px] text-zinc-600 py-3 text-center">
          No recent commands
        </div>
      ) : (
        <div className="space-y-1.5">
          {recentCommands.map((cmd) => {
            const pill = (STATUS_PILLS[cmd.status] || STATUS_PILLS.pending)!;
            const params = cmd.parameters && Object.keys(cmd.parameters).length > 0
              ? Object.entries(cmd.parameters)
                  .map(([k, v]) => `${k}: ${typeof v === "number" ? (v as number).toFixed(2) : v}`)
                  .join(", ")
              : null;

            return (
              <div
                key={cmd.id}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-zinc-800/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-zinc-300 font-mono truncate">
                    {cmd.commandType}
                  </div>
                  {params && (
                    <div className="text-[11px] text-zinc-600 truncate mt-0.5">
                      {params}
                    </div>
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ml-2 ${pill.bg} ${pill.text}`}
                >
                  {pill.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
