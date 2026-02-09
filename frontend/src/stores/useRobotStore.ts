import { create } from "zustand";
import type { RobotState } from "../types/robot";

const MAX_TRAIL_POINTS = 200;

interface RobotStore {
  robots: Record<string, RobotState>;
  trails: Record<string, [number, number][]>;
  setRobots: (robots: Record<string, RobotState>) => void;
  updateRobot: (id: string, robot: RobotState) => void;
}

export const useRobotStore = create<RobotStore>()((set) => ({
  robots: {},
  trails: {},

  setRobots: (robots) => set({ robots }),

  updateRobot: (id, robot) =>
    set((state) => {
      const prev = state.trails[id] ?? [];
      const lng = robot.position?.longitude;
      const lat = robot.position?.latitude;
      let trail = prev;
      if (lng !== undefined && lat !== undefined) {
        const last = prev[prev.length - 1];
        if (!last || last[0] !== lng || last[1] !== lat) {
          trail = [...prev.slice(-(MAX_TRAIL_POINTS - 1)), [lng, lat] as [number, number]];
        }
      }
      return {
        robots: { ...state.robots, [id]: robot },
        trails: { ...state.trails, [id]: trail },
      };
    }),
}));
