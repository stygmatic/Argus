export type RobotType = "drone" | "ground" | "underwater";
export type RobotStatus = "idle" | "active" | "returning" | "error" | "offline";

export interface RobotPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
}

export interface RobotHealth {
  batteryPercent: number;
  signalStrength: number;
}

export interface RobotState {
  id: string;
  name: string;
  robotType: RobotType;
  status: RobotStatus;
  position: RobotPosition;
  speed: number;
  health: RobotHealth;
  lastSeen: number;
  metadata: Record<string, unknown>;
}
