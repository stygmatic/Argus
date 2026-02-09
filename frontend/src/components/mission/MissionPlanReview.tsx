import { useAIStore } from "../../stores/useAIStore";

interface MissionPlanReviewProps {
  onClose: () => void;
}

export function MissionPlanReview({ onClose }: MissionPlanReviewProps) {
  const plan = useAIStore((s) => s.pendingPlan);
  const planError = useAIStore((s) => s.planError);
  const approvePlan = useAIStore((s) => s.approvePlan);
  const clearPlan = useAIStore((s) => s.clearPlan);

  if (!plan && !planError) return null;

  const handleApprove = async () => {
    await approvePlan();
    onClose();
  };

  const handleReject = () => {
    clearPlan();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-[540px] max-h-[80vh] overflow-y-auto p-6 space-y-5 shadow-2xl shadow-black/50">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-slate-100">Mission Plan Review</h2>
          <button onClick={handleReject} className="text-slate-500 hover:text-slate-300 text-lg transition-colors">&times;</button>
        </div>

        {planError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-[13px] text-rose-300">
            {planError}
          </div>
        )}

        {plan && (
          <>
            <div className="space-y-1">
              <div className="text-[13px] text-slate-200 font-medium">{plan.name}</div>
              <div className="text-[11px] text-slate-500">
                Est. duration: {plan.estimatedDurationMinutes} min
              </div>
            </div>

            {/* Assignments */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assignments</div>
              {plan.assignments.map((a, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-slate-200 font-medium">{a.robotId}</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25">{a.role}</span>
                  </div>
                  <div className="text-[13px] text-slate-400">{a.rationale}</div>
                  <div className="text-[11px] text-slate-500">
                    {a.waypoints.length} waypoint{a.waypoints.length !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>

            {/* Contingencies */}
            {plan.contingencies.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contingencies</div>
                {plan.contingencies.map((c, i) => (
                  <div key={i} className="text-[13px] bg-slate-800/50 rounded-xl p-3.5">
                    <span className="text-amber-400">If:</span>{" "}
                    <span className="text-slate-300">{c.trigger}</span>
                    <br />
                    <span className="text-sky-400">Then:</span>{" "}
                    <span className="text-slate-300">{c.action}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-700/40">
              <button
                onClick={handleReject}
                className="text-[13px] px-4 py-2 rounded-xl bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="text-[13px] px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
              >
                Approve & Deploy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
