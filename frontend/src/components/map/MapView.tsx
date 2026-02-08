import { useCallback, useRef } from "react";
import Map, {
  NavigationControl,
  type MapRef,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRobotStore } from "../../stores/useRobotStore";
import { useUIStore } from "../../stores/useUIStore";
import { useCommandStore } from "../../stores/useCommandStore";
import { useMissionStore } from "../../stores/useMissionStore";
import { RobotMarker } from "./RobotMarker";
import { TrajectoryLayer } from "./TrajectoryLayer";

const DEFAULT_CENTER = { longitude: -118.2437, latitude: 34.0522 }; // Los Angeles
const DEFAULT_ZOOM = 15;

const DARK_STYLE = {
  version: 8 as const,
  sources: {
    "carto-dark": {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster" as const,
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

const ROBOT_COLORS: Record<string, string> = {
  drone: "#22c55e",
  ground: "#a78bfa",
  underwater: "#38bdf8",
};

export function MapView() {
  const mapRef = useRef<MapRef>(null);
  const robots = useRobotStore((s) => s.robots);
  const robotList = Object.values(robots);
  const commandMode = useUIStore((s) => s.commandMode);
  const setCommandMode = useUIStore((s) => s.setCommandMode);
  const sendCommand = useCommandStore((s) => s.sendCommand);
  const missions = useMissionStore((s) => s.missions);

  const activeMission = Object.values(missions).find((m) => m.status === "active");

  // Read selectedRobotId from getState() inside callback — avoids re-render on selection
  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const { commandMode: cm, selectedRobotId } = useUIStore.getState();
      if (cm !== "goto" || !selectedRobotId) return;
      sendCommand(selectedRobotId, "goto", {
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng,
      });
      setCommandMode("none");
    },
    [sendCommand, setCommandMode]
  );

  return (
    <div
      className={commandMode === "goto" ? "cursor-crosshair" : undefined}
      style={{ position: "absolute", inset: 0, willChange: "transform" }}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          ...DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={DARK_STYLE}
        onClick={handleClick}
        attributionControl={true}
      >
        <NavigationControl position="bottom-right" />

        {/* Trajectory layers for active mission */}
        {activeMission &&
          Object.entries(activeMission.waypoints).map(([robotId, waypoints]) => {
            const robot = robots[robotId];
            return (
              <TrajectoryLayer
                key={robotId}
                waypoints={waypoints}
                color={robot ? ROBOT_COLORS[robot.robotType] || "#94a3b8" : "#94a3b8"}
              />
            );
          })}

        {/* Robot markers */}
        {robotList.map((robot) => (
          <RobotMarker key={robot.id} robot={robot} />
        ))}
      </Map>
    </div>
  );
}
