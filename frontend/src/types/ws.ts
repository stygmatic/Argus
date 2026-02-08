import type { RobotState } from "./robot";
import type { Mission } from "./mission";

export interface WSMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

export interface StateSyncPayload {
  robots: Record<string, RobotState>;
  missions?: Record<string, Mission>;
}

export interface RobotUpdatedPayload extends RobotState {}
