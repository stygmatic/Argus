import { useMemo } from "react";
import { Source, Layer, Marker } from "react-map-gl/maplibre";
import type { LayerProps } from "react-map-gl/maplibre";
import type { Waypoint } from "../../types/mission";

interface TrajectoryLayerProps {
  waypoints: Waypoint[];
  color: string;
}

export function TrajectoryLayer({ waypoints, color }: TrajectoryLayerProps) {
  if (!waypoints || waypoints.length === 0) return null;

  const lineGeoJSON = useMemo(
    () => ({
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: waypoints.map((wp) => [wp.longitude, wp.latitude]),
      },
    }),
    [waypoints]
  );

  const lineLayer: LayerProps = useMemo(
    () => ({
      id: `trajectory-line-${waypoints[0]?.id ?? "default"}`,
      type: "line",
      paint: {
        "line-color": color,
        "line-width": 2,
        "line-opacity": 0.6,
        "line-dasharray": [4, 3],
      },
    }),
    [color, waypoints]
  );

  const sourceId = `trajectory-src-${waypoints[0]?.id ?? "default"}`;

  return (
    <>
      <Source id={sourceId} type="geojson" data={lineGeoJSON}>
        <Layer {...lineLayer} />
      </Source>

      {/* Waypoint markers */}
      {waypoints.map((wp) => {
        const isFilled = wp.status === "active" || wp.status === "completed";
        const opacity =
          wp.status === "skipped" ? 0.2 : wp.status === "pending" ? 0.5 : 0.9;

        return (
          <Marker
            key={wp.id}
            longitude={wp.longitude}
            latitude={wp.latitude}
            anchor="center"
          >
            <div
              title={`WP ${wp.sequence + 1} (${wp.action}) — ${wp.status}`}
              style={{ opacity }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle
                  cx="6"
                  cy="6"
                  r="4"
                  fill={isFilled ? color : "transparent"}
                  stroke={color}
                  strokeWidth="2"
                />
              </svg>
            </div>
          </Marker>
        );
      })}
    </>
  );
}
