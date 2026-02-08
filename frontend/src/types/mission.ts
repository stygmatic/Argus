export type MissionStatus = "draft" | "active" | "paused" | "completed" | "aborted";
export type WaypointStatus = "pending" | "active" | "completed" | "skipped";

export interface Waypoint {
  id: string;
  sequence: number;
  latitude: number;
  longitude: number;
  altitude: number;
  action: string;
  parameters: Record<string, unknown>;
  status: WaypointStatus;
}

export interface Mission {
  id: string;
  name: string;
  status: MissionStatus;
  assignedRobots: string[];
  waypoints: Record<string, Waypoint[]>;
  createdAt: number;
  updatedAt: number;
}
