import { useEffect } from "react";
import { useUIStore } from "../stores/useUIStore";
import { useRobotStore } from "../stores/useRobotStore";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const ui = useUIStore.getState();

      switch (e.key) {
        case "Escape":
          if (ui.commandMode !== "none") {
            ui.setCommandMode("none");
          } else if (ui.selectedRobotIds.length > 0) {
            ui.clearSelection();
          } else if (ui.selectedRobotId) {
            ui.selectRobot(null);
          } else if (ui.alertsPanelOpen) {
            ui.toggleAlertsPanel();
          } else if (ui.settingsPanelOpen) {
            ui.toggleSettingsPanel();
          }
          break;

        case "ArrowDown":
        case "ArrowUp": {
          e.preventDefault();
          const robots = Object.values(useRobotStore.getState().robots);
          if (robots.length === 0) break;
          const currentId = ui.selectedRobotId;
          const currentIdx = currentId ? robots.findIndex((r) => r.id === currentId) : -1;
          let nextIdx: number;
          if (e.key === "ArrowDown") {
            nextIdx = currentIdx < robots.length - 1 ? currentIdx + 1 : 0;
          } else {
            nextIdx = currentIdx > 0 ? currentIdx - 1 : robots.length - 1;
          }
          const next = robots[nextIdx];
          if (next) ui.selectRobot(next.id);
          break;
        }

        case "t":
        case "T":
          ui.toggleTrails();
          break;

        case "a":
        case "A":
          if (!ui.settingsPanelOpen) {
            ui.toggleAlertsPanel();
          }
          break;

        case "s":
        case "S":
          if (!ui.alertsPanelOpen) {
            ui.toggleSettingsPanel();
          }
          break;

        // / to focus search
        case "/":
          e.preventDefault();
          {
            const searchInput = document.querySelector<HTMLInputElement>(
              'input[placeholder="Search units..."]'
            );
            searchInput?.focus();
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
