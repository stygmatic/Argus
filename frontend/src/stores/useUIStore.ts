import { create } from "zustand";
import type { RobotStatus } from "../types/robot";

type CommandMode = "none" | "goto" | "set_home" | "set_waypoints" | "circle_area";
type SortBy = "name" | "status" | "battery" | "type";

interface UIStore {
  selectedRobotId: string | null;
  commandMode: CommandMode;
  alertsPanelOpen: boolean;
  settingsPanelOpen: boolean;
  trailsEnabled: boolean;

  // Waypoint builder
  pendingWaypoints: { lat: number; lng: number }[];
  addWaypoint: (lat: number, lng: number) => void;
  undoWaypoint: () => void;
  clearWaypoints: () => void;

  // Circle area builder
  circleCenter: { lat: number; lng: number } | null;
  circleRadius: number;
  setCircleCenter: (center: { lat: number; lng: number } | null) => void;
  setCircleRadius: (radius: number) => void;

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

  // Waypoint builder
  pendingWaypoints: [],
  addWaypoint: (lat, lng) =>
    set((s) => ({ pendingWaypoints: [...s.pendingWaypoints, { lat, lng }] })),
  undoWaypoint: () =>
    set((s) => ({ pendingWaypoints: s.pendingWaypoints.slice(0, -1) })),
  clearWaypoints: () => set({ pendingWaypoints: [] }),

  // Circle area builder
  circleCenter: null,
  circleRadius: 150,
  setCircleCenter: (center) => set({ circleCenter: center }),
  setCircleRadius: (radius) => set({ circleRadius: radius }),

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
      pendingWaypoints: [],
      circleCenter: null,
    }),

  setCommandMode: (mode) =>
    set({
      commandMode: mode,
      // Reset interactive state when switching modes
      ...(mode === "none" ? { pendingWaypoints: [], circleCenter: null } : {}),
    }),

  toggleAlertsPanel: () =>
    set((state) => ({ alertsPanelOpen: !state.alertsPanelOpen })),

  toggleSettingsPanel: () =>
    set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen })),

  toggleTrails: () =>
    set((state) => ({ trailsEnabled: !state.trailsEnabled })),
}));
