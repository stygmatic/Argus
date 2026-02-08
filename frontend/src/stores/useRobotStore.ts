import { create } from "zustand";
import type { RobotState } from "../types/robot";

interface RobotStore {
  robots: Record<string, RobotState>;
  setRobots: (robots: Record<string, RobotState>) => void;
  updateRobot: (id: string, robot: RobotState) => void;
}

export const useRobotStore = create<RobotStore>()((set) => ({
  robots: {},

  setRobots: (robots) => set({ robots }),

  updateRobot: (id, robot) =>
    set((state) => ({
      robots: { ...state.robots, [id]: robot },
    })),
}));
