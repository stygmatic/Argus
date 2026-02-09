import { create } from "zustand";
import type { RobotStatus } from "../types/robot";

type CommandMode = "none" | "goto";
type SortBy = "name" | "status" | "battery" | "type";

interface UIStore {
  selectedRobotId: string | null;
  commandMode: CommandMode;
  alertsPanelOpen: boolean;
  settingsPanelOpen: boolean;
  trailsEnabled: boolean;

  // Multi-select
  selectedRobotIds: string[];
  toggleRobotSelection: (id: string) => void;
  selectAllRobots: (ids: string[]) => void;
  clearSelection: () => void;

  // Search / filter / sort
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  filterStatus: RobotStatus | "all";
  setFilterStatus: (status: RobotStatus | "all") => void;

  // Expandable rows
  expandedRobotId: string | null;
  setExpandedRobotId: (id: string | null) => void;

  // Collapse inactive
  collapseInactive: boolean;
  toggleCollapseInactive: () => void;

  // AI lock (per-robot)
  aiLocked: Record<string, boolean>;
  toggleAiLock: (robotId: string) => void;

  selectRobot: (id: string | null) => void;
  setCommandMode: (mode: CommandMode) => void;
  toggleAlertsPanel: () => void;
  toggleSettingsPanel: () => void;
  toggleTrails: () => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  selectedRobotId: null,
  commandMode: "none",
  alertsPanelOpen: false,
  settingsPanelOpen: false,
  trailsEnabled: true,

  // Multi-select
  selectedRobotIds: [],
  toggleRobotSelection: (id) =>
    set((s) => ({
      selectedRobotIds: s.selectedRobotIds.includes(id)
        ? s.selectedRobotIds.filter((rid) => rid !== id)
        : [...s.selectedRobotIds, id],
    })),
  selectAllRobots: (ids) => set({ selectedRobotIds: ids }),
  clearSelection: () => set({ selectedRobotIds: [] }),

  // Search / filter / sort
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  sortBy: "name",
  setSortBy: (sort) => set({ sortBy: sort }),
  filterStatus: "all",
  setFilterStatus: (status) => set({ filterStatus: status }),

  // Expandable rows
  expandedRobotId: null,
  setExpandedRobotId: (id) =>
    set((s) => ({ expandedRobotId: s.expandedRobotId === id ? null : id })),

  // Collapse inactive
  collapseInactive: false,
  toggleCollapseInactive: () =>
    set((s) => ({ collapseInactive: !s.collapseInactive })),

  // AI lock
  aiLocked: {},
  toggleAiLock: (robotId) =>
    set((s) => ({
      aiLocked: { ...s.aiLocked, [robotId]: !s.aiLocked[robotId] },
    })),

  selectRobot: (id) =>
    set({
      selectedRobotId: id,
      commandMode: "none",
    }),

  setCommandMode: (mode) => set({ commandMode: mode }),

  toggleAlertsPanel: () =>
    set((state) => ({ alertsPanelOpen: !state.alertsPanelOpen })),

  toggleSettingsPanel: () =>
    set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen })),

  toggleTrails: () =>
    set((state) => ({ trailsEnabled: !state.trailsEnabled })),
}));
