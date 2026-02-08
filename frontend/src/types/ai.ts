export type SuggestionSeverity = "info" | "warning" | "critical";
export type SuggestionStatus = "pending" | "approved" | "rejected" | "expired";
export type SuggestionSource = "heuristic" | "ai";

export interface ProposedAction {
  commandType: string;
  robotId: string;
  parameters?: Record<string, unknown>;
}

export interface Suggestion {
  id: string;
  robotId: string;
  title: string;
  description: string;
  reasoning: string;
  severity: SuggestionSeverity;
  proposedAction: ProposedAction | null;
  confidence: number;
  status: SuggestionStatus;
  source: SuggestionSource;
  createdAt: number;
  expiresAt: number;
}

export interface MissionPlan {
  name: string;
  estimatedDurationMinutes: number;
  assignments: MissionAssignment[];
  contingencies: Contingency[];
}

export interface MissionAssignment {
  robotId: string;
  role: string;
  rationale: string;
  waypoints: PlanWaypoint[];
}

export interface PlanWaypoint {
  latitude: number;
  longitude: number;
  altitude: number;
  action: string;
}

export interface Contingency {
  trigger: string;
  action: string;
}

export interface MissionIntent {
  objective: string;
  zone?: Record<string, unknown> | null;
  constraints: string[];
  rulesOfEngagement: string[];
  preferences: Record<string, unknown>;
  selectedRobots?: string[];
}
