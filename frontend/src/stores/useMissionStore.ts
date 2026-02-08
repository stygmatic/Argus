import { create } from "zustand";
import type { Mission } from "../types/mission";

interface MissionStore {
  missions: Record<string, Mission>;
  activeMissionId: string | null;
  setMissions: (missions: Record<string, Mission>) => void;
  updateMission: (mission: Mission) => void;
  setActiveMission: (id: string | null) => void;
}

export const useMissionStore = create<MissionStore>()((set) => ({
  missions: {},
  activeMissionId: null,

  setMissions: (missions) => set({ missions }),

  updateMission: (mission) =>
    set((state) => ({
      missions: { ...state.missions, [mission.id]: mission },
      activeMissionId:
        mission.status === "active" ? mission.id : state.activeMissionId,
    })),

  setActiveMission: (id) => set({ activeMissionId: id }),
}));
