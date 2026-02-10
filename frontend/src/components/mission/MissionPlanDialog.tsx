import { useState } from "react";
import { X, Plus, Sparkles } from "lucide-react";
import { useAIStore } from "../../stores/useAIStore";
import { useRobotStore } from "../../stores/useRobotStore";
import type { MissionIntent } from "../../types/ai";

interface MissionPlanDialogProps {
  open: boolean;
  onClose: () => void;
}

export function MissionPlanDialog({ open, onClose }: MissionPlanDialogProps) {
  const robots = useRobotStore((s) => s.robots);
  const generatePlan = useAIStore((s) => s.generatePlan);
  const planLoading = useAIStore((s) => s.planLoading);

  const [objective, setObjective] = useState("");
  const [constraintInput, setConstraintInput] = useState("");
  const [constraints, setConstraints] = useState<string[]>([]);
  const [roeInput, setRoeInput] = useState("");
  const [roe, setRoe] = useState<string[]>([]);
  const [selectedRobots, setSelectedRobots] = useState<string[]>([]);

  if (!open) return null;

  const robotList = Object.values(robots).filter((r) => r.status !== "offline");

  const addConstraint = () => {
    if (constraintInput.trim()) {
      setConstraints((c) => [...c, constraintInput.trim()]);
      setConstraintInput("");
    }
  };

  const addRoe = () => {
    if (roeInput.trim()) {
      setRoe((r) => [...r, roeInput.trim()]);
      setRoeInput("");
    }
  };

  const toggleRobot = (id: string) => {
    setSelectedRobots((sel) =>
      sel.includes(id) ? sel.filter((r) => r !== id) : [...sel, id]
    );
  };

  const handleSubmit = async () => {
    const intent: MissionIntent = {
      objective,
      constraints,
      rulesOfEngagement: roe,
      preferences: {},
      selectedRobots: selectedRobots.length > 0 ? selectedRobots : undefined,
    };
    await generatePlan(intent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              AI Mission Planning
            </h2>
            <p className="text-sm text-slate-400 mt-2 ml-[52px]">
              Describe your mission and let AI generate an optimal plan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-thin">
          {/* Objective */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-3">
              Objective <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Describe the mission objective in detail..."
              className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all leading-relaxed"
              rows={4}
            />
          </div>

          {/* Robot Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-3">
              Robots <span className="text-xs text-slate-500 font-normal">({selectedRobots.length || "all"} selected)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {robotList.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleRobot(r.id)}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    selectedRobots.includes(r.id)
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-500/5"
                      : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Constraints */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-3">
              Constraints
            </label>
            <div className="flex gap-2 mb-3">
              <input
                value={constraintInput}
                onChange={(e) => setConstraintInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addConstraint()}
                placeholder="Add a constraint..."
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                onClick={addConstraint}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {constraints.length > 0 && (
              <div className="space-y-2">
                {constraints.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg group hover:bg-slate-800 transition-colors">
                    <span className="flex-1 text-sm text-slate-300">{c}</span>
                    <button
                      onClick={() => setConstraints((cs) => cs.filter((_, j) => j !== i))}
                      className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rules of Engagement */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-3">
              Rules of Engagement
            </label>
            <div className="flex gap-2 mb-3">
              <input
                value={roeInput}
                onChange={(e) => setRoeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRoe()}
                placeholder="Add a rule..."
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                onClick={addRoe}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {roe.length > 0 && (
              <div className="space-y-2">
                {roe.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg group hover:bg-slate-800 transition-colors">
                    <span className="flex-1 text-sm text-slate-300">{r}</span>
                    <button
                      onClick={() => setRoe((rs) => rs.filter((_, j) => j !== i))}
                      className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!objective.trim() || planLoading}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              objective.trim() && !planLoading
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            <Sparkles className={`w-4 h-4 ${planLoading ? "animate-spin" : ""}`} />
            {planLoading ? "Generating Plan..." : "Generate Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}