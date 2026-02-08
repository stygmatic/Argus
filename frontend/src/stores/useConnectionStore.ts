import { create } from "zustand";

interface ConnectionStore {
  connected: boolean;
  reconnecting: boolean;
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
}

export const useConnectionStore = create<ConnectionStore>()((set) => ({
  connected: false,
  reconnecting: false,
  setConnected: (connected) => set({ connected }),
  setReconnecting: (reconnecting) => set({ reconnecting }),
}));
