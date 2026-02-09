import type { AutonomyTier } from "./robot";

export interface AutonomyChangeEntry {
  id: string;
  robotId: string;
  oldTier: AutonomyTier;
  newTier: AutonomyTier;
  changedBy: string;
  timestamp: number;
}

export interface CountdownSuggestion {
  suggestionId: string;
  robotId: string;
  commandType: string;
  autoExecuteAt: number;
}
