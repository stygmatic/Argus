import { useMemo } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import type { LayerProps } from "react-map-gl/maplibre";
import { useRobotStore } from "../../stores/useRobotStore";
import { useUIStore } from "../../stores/useUIStore";

const ROBOT_TRAIL_COLORS: Record<string, string> = {
  drone: "#22c55e",
  ground: "#a78bfa",
  underwater: "#38bdf8",
};

export function RobotTrailLayer() {
  const robots = useRobotStore((s) => s.robots);
  const trails = useRobotStore((s) => s.trails);
  const trailsEnabled = useUIStore((s) => s.trailsEnabled);

  const features = useMemo(() => {
    if (!trailsEnabled) return [];
    return Object.entries(trails)
      .filter(([, coords]) => coords.length >= 2)
      .map(([robotId, coords]) => {
        const robot = robots[robotId];
        const color = robot ? ROBOT_TRAIL_COLORS[robot.robotType] ?? "#94a3b8" : "#94a3b8";
        return {
          type: "Feature" as const,
          properties: { robotId, color },
          geometry: {
            type: "LineString" as const,
            coordinates: coords,
          },
        };
      });
  }, [trails, robots, trailsEnabled]);

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features,
    }),
    [features]
  );

  const lineLayer: LayerProps = useMemo(
    () => ({
      id: "robot-trails",
      type: "line",
      paint: {
        "line-color": ["get", "color"],
        "line-width": 1.5,
        "line-opacity": 0.35,
      },
    }),
    []
  );

  if (!trailsEnabled || features.length === 0) return null;

  return (
    <Source id="robot-trails-src" type="geojson" data={geojson}>
      <Layer {...lineLayer} />
    </Source>
  );
}
