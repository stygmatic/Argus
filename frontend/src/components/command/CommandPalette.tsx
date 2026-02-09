import { useCommandStore } from "../../stores/useCommandStore";
import { useUIStore } from "../../stores/useUIStore";
import type { RobotType } from "../../types/robot";

interface CommandDef {
  label: string;
  command: string;
  color: string;
  hoverColor: string;
  borderColor: string;
}

const DRONE_COMMANDS: CommandDef[] = [
  { label: "Take Off", command: "take_off", color: "bg-emerald-500/10 text-emerald-400", hoverColor: "hover:bg-emerald-500/20", borderColor: "border-emerald-500/20" },
  { label: "Land", command: "land", color: "bg-amber-500/10 text-amber-400", hoverColor: "hover:bg-amber-500/20", borderColor: "border-amber-500/20" },
  { label: "Go To Location", command: "goto", color: "bg-sky-500/10 text-sky-400", hoverColor: "hover:bg-sky-500/20", borderColor: "border-sky-500/20" },
  { label: "Hold Position", command: "hold_position", color: "bg-violet-500/10 text-violet-400", hoverColor: "hover:bg-violet-500/20", borderColor: "border-violet-500/20" },
  { label: "Return to Launch", command: "return_home", color: "bg-orange-500/10 text-orange-400", hoverColor: "hover:bg-orange-500/20", borderColor: "border-orange-500/20" },
];

const GROUND_COMMANDS: CommandDef[] = [
  { label: "Go To Location", command: "goto", color: "bg-sky-500/10 text-sky-400", hoverColor: "hover:bg-sky-500/20", borderColor: "border-sky-500/20" },
  { label: "Stop", command: "stop", color: "bg-rose-500/10 text-rose-400", hoverColor: "hover:bg-rose-500/20", borderColor: "border-rose-500/20" },
  { label: "Return to Base", command: "return_home", color: "bg-amber-500/10 text-amber-400", hoverColor: "hover:bg-amber-500/20", borderColor: "border-amber-500/20" },
];

const UNDERWATER_COMMANDS: CommandDef[] = [
  { label: "Go To Location", command: "goto", color: "bg-sky-500/10 text-sky-400", hoverColor: "hover:bg-sky-500/20", borderColor: "border-sky-500/20" },
  { label: "Surface", command: "surface", color: "bg-emerald-500/10 text-emerald-400", hoverColor: "hover:bg-emerald-500/20", borderColor: "border-emerald-500/20" },
  { label: "Dive", command: "dive", color: "bg-violet-500/10 text-violet-400", hoverColor: "hover:bg-violet-500/20", borderColor: "border-violet-500/20" },
  { label: "Hold Depth", command: "hold_depth", color: "bg-amber-500/10 text-amber-400", hoverColor: "hover:bg-amber-500/20", borderColor: "border-amber-500/20" },
  { label: "Return to Launch", command: "return_home", color: "bg-orange-500/10 text-orange-400", hoverColor: "hover:bg-orange-500/20", borderColor: "border-orange-500/20" },
];

const COMMANDS_BY_TYPE: Record<RobotType, CommandDef[]> = {
  drone: DRONE_COMMANDS,
  ground: GROUND_COMMANDS,
  underwater: UNDERWATER_COMMANDS,
};

interface CommandPaletteProps {
  robotId: string;
  robotType: RobotType;
}

export function CommandPalette({ robotId, robotType }: CommandPaletteProps) {
  const sendCommand = useCommandStore((s) => s.sendCommand);
  const setCommandMode = useUIStore((s) => s.setCommandMode);

  const commands = COMMANDS_BY_TYPE[robotType] || DRONE_COMMANDS;

  const handleCommand = (cmd: CommandDef) => {
    if (cmd.command === "goto") {
      const currentMode = useUIStore.getState().commandMode;
      setCommandMode(currentMode === "goto" ? "none" : "goto");
      return;
    }
    console.log(`[Command] ${cmd.label} → robot=${robotId}, type=${cmd.command}`);
    sendCommand(robotId, cmd.command);
  };

  const commandMode = useUIStore((s) => s.commandMode);

  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        Commands
      </div>
      <div className="grid grid-cols-2 gap-2">
        {commands.map((cmd) => {
          const isGotoActive = cmd.command === "goto" && commandMode === "goto";
          return (
            <button
              key={cmd.command}
              onClick={() => handleCommand(cmd)}
              className={`px-3 py-2 text-[13px] font-medium rounded-xl border transition-colors ${
                isGotoActive
                  ? "bg-sky-500/20 text-sky-300 border-sky-500/40 ring-1 ring-sky-500/20"
                  : `${cmd.color} ${cmd.hoverColor} ${cmd.borderColor}`
              }`}
            >
              {isGotoActive ? "Click Map..." : cmd.label}
            </button>
          );
        })}
      </div>
      {commandMode === "goto" && (
        <div className="text-[13px] text-sky-400/80 animate-pulse">
          Click on the map to set destination
        </div>
      )}
    </div>
  );
}
