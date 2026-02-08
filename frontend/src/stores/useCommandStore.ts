import { create } from "zustand";
import type { Command } from "../types/command";

interface CommandStore {
  commands: Record<string, Command>;
  robotCommands: Record<string, string[]>;
  sendFn: ((type: string, payload: unknown) => void) | null;
  setSendFn: (fn: (type: string, payload: unknown) => void) => void;
  addCommand: (cmd: Command) => void;
  updateCommand: (id: string, updates: Partial<Command>) => void;
  sendCommand: (
    robotId: string,
    commandType: string,
    parameters?: Record<string, unknown>
  ) => void;
}

export const useCommandStore = create<CommandStore>()((set, get) => ({
  commands: {},
  robotCommands: {},
  sendFn: null,

  setSendFn: (fn) => set({ sendFn: fn }),

  addCommand: (cmd) =>
    set((state) => ({
      commands: { ...state.commands, [cmd.id]: cmd },
      robotCommands: {
        ...state.robotCommands,
        [cmd.robotId]: [
          ...(state.robotCommands[cmd.robotId] || []),
          cmd.id,
        ],
      },
    })),

  updateCommand: (id, updates) =>
    set((state) => {
      const existing = state.commands[id];
      if (!existing) return state;
      return {
        commands: { ...state.commands, [id]: { ...existing, ...updates } },
      };
    }),

  sendCommand: (robotId, commandType, parameters = {}) => {
    const { sendFn } = get();
    if (sendFn) {
      sendFn("command.send", { robotId, commandType, parameters });
    }
  },
}));
