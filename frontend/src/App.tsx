import { useState } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { MapView } from "./components/map/MapView";
import { HeaderBar } from "./components/layout/HeaderBar";
import { RobotListPanel } from "./components/panels/RobotListPanel";
import { DetailPopup } from "./components/panels/DetailDrawer";
import { AlertsPanel } from "./components/panels/AISuggestionPanel";
import { AltitudeInset } from "./components/panels/AltitudeInset";
import { SettingsPanel } from "./components/panels/SettingsPanel";
import { MissionPlanDialog } from "./components/mission/MissionPlanDialog";
import { MissionPlanReview } from "./components/mission/MissionPlanReview";
import { useAIStore } from "./stores/useAIStore";

export default function App() {
  useWebSocket();
  useKeyboardShortcuts();

  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const pendingPlan = useAIStore((s) => s.pendingPlan);
  const planError = useAIStore((s) => s.planError);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <RobotListPanel onMissionPlan={() => setMissionDialogOpen(true)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar />

        {/* Map + overlay panels */}
        <div className="flex-1 relative">
          <MapView />
          <DetailPopup />
          <AlertsPanel />
          <SettingsPanel />
          <AltitudeInset />
        </div>
      </div>

      {/* Modal overlays */}
      <MissionPlanDialog
        open={missionDialogOpen}
        onClose={() => setMissionDialogOpen(false)}
      />
      {(pendingPlan || planError) && (
        <MissionPlanReview onClose={() => useAIStore.getState().clearPlan()} />
      )}
    </div>
  );
}
