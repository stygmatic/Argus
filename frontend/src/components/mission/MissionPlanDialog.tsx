import { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-[500px] max-h-[80vh] overflow-y-auto p-6 space-y-5 shadow-2xl shadow-black/50">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-zinc-100">AI Mission Planning</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg transition-colors">&times;</button>
        </div>

        {/* Objective */}
        <div>
          <label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">Objective</label>
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Describe the mission objective..."
            className="w-full bg-zinc-800/60 border border-zinc-700/40 rounded-xl p-3 text-[13px] text-zinc-200 placeholder:text-zinc-600 resize-none focus:border-sky-500/40 focus:outline-none transition-colors"
            rows={3}
          />
        </div>

        {/* Robot selection */}
        <div>
          <label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
            Robots ({selectedRobots.length || "all"} selected)
          </label>
          <div className="flex flex-wrap gap-2">
            {robotList.map((r) => (
              <button
                key={r.id}
                onClick={() => toggleRobot(r.id)}
                className={`text-[13px] px-3 py-1.5 rounded-xl border transition-colors ${
                  selectedRobots.includes(r.id)
                    ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                    : "border-zinc-700/40 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div>
          <label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">Constraints</label>
          <div className="flex gap-2">
            <input
              value={constraintInput}
              onChange={(e) => setConstraintInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addConstraint()}
              placeholder="Add constraint..."
              className="flex-1 bg-zinc-800/60 border border-zinc-700/40 rounded-xl px-3 py-1.5 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:border-sky-500/40 focus:outline-none transition-colors"
            />
            <button onClick={addConstraint} className="text-[13px] px-3 py-1.5 bg-zinc-700/60 rounded-xl text-zinc-300 hover:bg-zinc-600/60 transition-colors">
              Add
            </button>
          </div>
          {constraints.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {constraints.map((c, i) => (
                <span key={i} className="text-[11px] bg-zinc-700/40 text-zinc-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  {c}
                  <button onClick={() => setConstraints((cs) => cs.filter((_, j) => j !== i))} className="text-zinc-500 hover:text-zinc-300 transition-colors">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rules of Engagement */}
        <div>
          <label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">Rules of Engagement</label>
          <div className="flex gap-2">
            <input
              value={roeInput}
              onChange={(e) => setRoeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRoe()}
              placeholder="Add ROE..."
              className="flex-1 bg-zinc-800/60 border border-zinc-700/40 rounded-xl px-3 py-1.5 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:border-sky-500/40 focus:outline-none transition-colors"
            />
            <button onClick={addRoe} className="text-[13px] px-3 py-1.5 bg-zinc-700/60 rounded-xl text-zinc-300 hover:bg-zinc-600/60 transition-colors">
              Add
            </button>
          </div>
          {roe.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {roe.map((r, i) => (
                <span key={i} className="text-[11px] bg-zinc-700/40 text-zinc-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  {r}
                  <button onClick={() => setRoe((rs) => rs.filter((_, j) => j !== i))} className="text-zinc-500 hover:text-zinc-300 transition-colors">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-700/40">
          <button onClick={onClose} className="text-[13px] px-4 py-2 rounded-xl bg-zinc-700/60 text-zinc-300 hover:bg-zinc-600/60 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!objective.trim() || planLoading}
            className="text-[13px] px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {planLoading ? "Generating..." : "Generate Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
