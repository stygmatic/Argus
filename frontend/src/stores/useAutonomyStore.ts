import { create } from "zustand";
import type { AutonomyTier } from "../types/robot";
import type { AutonomyChangeEntry, CountdownSuggestion } from "../types/autonomy";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface AutonomyStore {
  fleetDefaultTier: AutonomyTier;
  countdowns: Record<string, CountdownSuggestion>;
  changeLog: AutonomyChangeEntry[];

  setFleetDefaultTier: (tier: AutonomyTier) => void;
  addCountdown: (countdown: CountdownSuggestion) => void;
  removeCountdown: (suggestionId: string) => void;
  addChangeLogEntry: (entry: AutonomyChangeEntry) => void;

  setRobotTier: (robotId: string, tier: AutonomyTier) => Promise<void>;
  setFleetDefault: (tier: AutonomyTier) => Promise<void>;
}

export const useAutonomyStore = create<AutonomyStore>()((set) => ({
  fleetDefaultTier: "assisted",
  countdowns: {},
  changeLog: [],

  setFleetDefaultTier: (tier) => set({ fleetDefaultTier: tier }),

  addCountdown: (countdown) =>
    set((s) => ({
      countdowns: { ...s.countdowns, [countdown.suggestionId]: countdown },
    })),

  removeCountdown: (suggestionId) =>
    set((s) => {
      const { [suggestionId]: _, ...rest } = s.countdowns;
      return { countdowns: rest };
    }),

  addChangeLogEntry: (entry) =>
    set((s) => ({
      changeLog: [...s.changeLog.slice(-99), entry],
    })),

  setRobotTier: async (robotId, tier) => {
    await fetch(`${API_BASE}/api/autonomy/robots/${robotId}/tier`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
  },

  setFleetDefault: async (tier) => {
    const resp = await fetch(`${API_BASE}/api/autonomy/fleet/default-tier`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    if (resp.ok) {
      set({ fleetDefaultTier: tier });
    }
  },
}));
