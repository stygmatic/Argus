import React, { useCallback, useRef, useMemo } from "react";
import { Marker } from "react-map-gl/maplibre";
import type { RobotState, RobotType, AutonomyTier } from "../../types/robot";
import { useUIStore } from "../../stores/useUIStore";

const TIER_SHORT: Record<AutonomyTier, string> = {
  manual: "MAN",
  assisted: "AST",
  supervised: "SUP",
  autonomous: "AUT",
};

const TIER_COLOR: Record<AutonomyTier, string> = {
  manual: "#a1a1aa",
  assisted: "#38bdf8",
  supervised: "#fbbf24",
  autonomous: "#34d399",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  idle: "#3b82f6",
  returning: "#eab308",
  error: "#ef4444",
  offline: "#6b7280",
};

const SELECTED_RING = "#38bdf8";

function robotSvg(type: RobotType, color: string, selected: boolean): string {
  const ring = selected
    ? `<circle cx="14" cy="14" r="13" fill="none" stroke="${SELECTED_RING}" stroke-width="2" opacity="0.8"/>`
    : "";
  const glow = selected
    ? `<circle cx="14" cy="14" r="10" fill="${SELECTED_RING}" opacity="0.15"/>`
    : "";

  switch (type) {
    case "drone":
      return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        ${ring}${glow}
        <polygon points="14,3 23,23 14,18 5,23" fill="${color}" opacity="0.9"/>
      </svg>`;
    case "ground":
      return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        ${ring}${glow}
        <rect x="6" y="8" width="16" height="12" rx="3" fill="${color}" opacity="0.9"/>
        <circle cx="9" cy="22" r="2.5" fill="${color}" opacity="0.7"/>
        <circle cx="19" cy="22" r="2.5" fill="${color}" opacity="0.7"/>
      </svg>`;
    case "underwater":
      return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        ${ring}${glow}
        <ellipse cx="14" cy="14" rx="11" ry="6" fill="${color}" opacity="0.9"/>
        <polygon points="25,14 28,10 28,18" fill="${color}" opacity="0.7"/>
        <rect x="6" y="8" width="2" height="4" rx="1" fill="${color}" opacity="0.6"/>
      </svg>`;
  }
}

interface RobotMarkerProps {
  robot: RobotState;
}

export function RobotMarker({ robot }: RobotMarkerProps) {
  const cumulativeRotation = useRef(robot.position.heading);
  const selectedId = useUIStore((s) => s.selectedRobotId);
  const isSelected = selectedId === robot.id;

  const color = STATUS_COLORS[robot.status] || "#6b7280";

  // Compute smooth rotation
  const prevHeading = useRef(robot.position.heading);
  useMemo(() => {
    let delta = robot.position.heading - ((prevHeading.current % 360) + 360) % 360;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    cumulativeRotation.current += delta;
    prevHeading.current = robot.position.heading;
  }, [robot.position.heading]);

  const svgHtml = useMemo(
    () => robotSvg(robot.robotType, color, isSelected),
    [robot.robotType, color, isSelected]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Toggle selection — read current state to avoid stale closures
      const current = useUIStore.getState().selectedRobotId;
      useUIStore.getState().selectRobot(current === robot.id ? null : robot.id);
    },
    [robot.id]
  );

  const tier = (robot.autonomyTier ?? "assisted") as AutonomyTier;
  const tierLabel = TIER_SHORT[tier];
  const tierColor = TIER_COLOR[tier];

  return (
    <Marker
      longitude={robot.position.longitude}
      latitude={robot.position.latitude}
      anchor="center"
    >
      <div
        className="robot-marker"
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      >
        <div
          className="robot-marker-inner"
          style={{ transform: `rotate(${cumulativeRotation.current}deg)` }}
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
        <div
          className="text-[8px] font-bold tracking-wider text-center mt-0.5 select-none"
          style={{ color: tierColor, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
        >
          {tierLabel}
        </div>
      </div>
    </Marker>
  );
}
