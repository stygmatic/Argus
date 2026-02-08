import { create } from "zustand";

type CommandMode = "none" | "goto";

interface UIStore {
  selectedRobotId: string | null;
  commandMode: CommandMode;
  alertsPanelOpen: boolean;
  selectRobot: (id: string | null) => void;
  setCommandMode: (mode: CommandMode) => void;
  toggleAlertsPanel: () => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  selectedRobotId: null,
  commandMode: "none",
  alertsPanelOpen: false,

  selectRobot: (id) =>
    set({
      selectedRobotId: id,
      commandMode: "none",
    }),

  setCommandMode: (mode) => set({ commandMode: mode }),

  toggleAlertsPanel: () =>
    set((state) => ({ alertsPanelOpen: !state.alertsPanelOpen })),
}));
