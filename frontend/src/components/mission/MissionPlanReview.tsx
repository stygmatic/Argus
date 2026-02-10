import { X, CheckCircle2, AlertTriangle } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleReject}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              Mission Plan Review
            </h2>
            <p className="text-sm text-slate-400 mt-2 ml-[52px]">
              Review and approve the AI-generated mission plan
            </p>
          </div>
          <button
            onClick={handleReject}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-thin">
          {/* Error State */}
          {planError && (
            <div className="flex items-start gap-3 px-4 py-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-rose-300 mb-1">Plan Generation Failed</div>
                <div className="text-sm text-rose-400/80">{planError}</div>
              </div>
            </div>
          )}

          {/* Plan Details */}
          {plan && (
            <>
              {/* Mission Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{plan.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span>Estimated Duration: {plan.estimatedDurationMinutes} minutes</span>
                    <span>•</span>
                    <span>{plan.assignments.length} robot{plan.assignments.length !== 1 ? "s" : ""} assigned</span>
                  </div>
                </div>
              </div>

              {/* Assignments */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Robot Assignments</h4>
                <div className="space-y-3">
                  {plan.assignments.map((a, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-medium text-slate-100">{a.robotId}</span>
                        <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25 text-xs font-medium uppercase tracking-wide">
                          {a.role}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed mb-3">{a.rationale}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        {a.waypoints.length} waypoint{a.waypoints.length !== 1 ? "s" : ""} planned
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contingencies */}
              {plan.contingencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Contingency Plans</h4>
                  <div className="space-y-3">
                    {plan.contingencies.map((c, i) => (
                      <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-amber-400 shrink-0">If:</span>
                            <span className="text-slate-300">{c.trigger}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-blue-400 shrink-0">Then:</span>
                            <span className="text-slate-300">{c.action}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-slate-800">
          <button
            onClick={handleReject}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm font-medium"
          >
            Reject Plan
          </button>
          {plan && (
            <button
              onClick={handleApprove}
              className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve & Deploy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}