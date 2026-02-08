export type CommandType = "goto" | "stop" | "return_home" | "patrol" | "set_speed";
export type CommandSource = "operator" | "ai";
export type CommandStatus = "pending" | "sent" | "acknowledged" | "completed" | "failed";

export interface Command {
  id: string;
  robotId: string;
  commandType: CommandType;
  parameters: Record<string, unknown>;
  source: CommandSource;
  status: CommandStatus;
  createdAt: number;
  updatedAt: number;
}
