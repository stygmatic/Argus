import { create } from "zustand";
import type { Suggestion, MissionPlan, MissionIntent } from "../types/ai";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface AIStore {
  suggestions: Record<string, Suggestion>;
  pendingPlan: MissionPlan | null;
  planLoading: boolean;
  planError: string | null;

  addSuggestion: (suggestion: Suggestion) => void;
  updateSuggestion: (id: string, suggestion: Suggestion) => void;
  removeSuggestion: (id: string) => void;

  approveSuggestion: (id: string) => Promise<void>;
  rejectSuggestion: (id: string) => Promise<void>;

  generatePlan: (intent: MissionIntent) => Promise<void>;
  approvePlan: () => Promise<void>;
  clearPlan: () => void;
}

export const useAIStore = create<AIStore>()((set, get) => ({
  suggestions: {},
  pendingPlan: null,
  planLoading: false,
  planError: null,

  addSuggestion: (suggestion) =>
    set((s) => ({ suggestions: { ...s.suggestions, [suggestion.id]: suggestion } })),

  updateSuggestion: (id, suggestion) =>
    set((s) => ({ suggestions: { ...s.suggestions, [id]: suggestion } })),

  removeSuggestion: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.suggestions;
      return { suggestions: rest };
    }),

  approveSuggestion: async (id) => {
    const resp = await fetch(`${API_BASE}/api/ai/suggestions/${id}/approve`, { method: "POST" });
    if (resp.ok) {
      const data = await resp.json();
      set((s) => ({ suggestions: { ...s.suggestions, [id]: data } }));
    }
  },

  rejectSuggestion: async (id) => {
    const resp = await fetch(`${API_BASE}/api/ai/suggestions/${id}/reject`, { method: "POST" });
    if (resp.ok) {
      const data = await resp.json();
      set((s) => ({ suggestions: { ...s.suggestions, [id]: data } }));
    }
  },

  generatePlan: async (intent) => {
    set({ planLoading: true, planError: null, pendingPlan: null });
    try {
      const resp = await fetch(`${API_BASE}/api/ai/missions/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intent),
      });
      const data = await resp.json();
      if (data.error) {
        set({ planError: data.error, planLoading: false });
      } else {
        set({ pendingPlan: data.plan, planLoading: false });
      }
    } catch (e) {
      set({ planError: String(e), planLoading: false });
    }
  },

  approvePlan: async () => {
    const plan = get().pendingPlan;
    if (!plan) return;
    try {
      const resp = await fetch(`${API_BASE}/api/ai/missions/plan/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (resp.ok) {
        set({ pendingPlan: null });
      }
    } catch (e) {
      set({ planError: String(e) });
    }
  },

  clearPlan: () => set({ pendingPlan: null, planError: null }),
}));
