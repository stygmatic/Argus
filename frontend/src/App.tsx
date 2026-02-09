import { useState } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { MapView } from "./components/map/MapView";
import { HeaderBar } from "./components/layout/HeaderBar";
import { RobotListPanel } from "./components/panels/RobotListPanel";
import { DetailPopup } from "./components/panels/DetailDrawer";
import { AlertsPanel } from "./components/panels/AISuggestionPanel";
import { AltitudeInset } from "./components/panels/AltitudeInset";
import { MissionPlanDialog } from "./components/mission/MissionPlanDialog";
import { MissionPlanReview } from "./components/mission/MissionPlanReview";
import { useAIStore } from "./stores/useAIStore";

export default function App() {
  useWebSocket();

  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const pendingPlan = useAIStore((s) => s.pendingPlan);
  const planError = useAIStore((s) => s.planError);

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Full-bleed map */}
      <MapView />

      {/* Each panel is independently fixed-positioned — no full-screen overlay */}
      <HeaderBar />
      <RobotListPanel onMissionPlan={() => setMissionDialogOpen(true)} />
      <DetailPopup />
      <AlertsPanel />
      <AltitudeInset />

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
