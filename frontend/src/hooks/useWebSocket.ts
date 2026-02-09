import { useEffect, useRef, useCallback } from "react";
import { useRobotStore } from "../stores/useRobotStore";
import { useConnectionStore } from "../stores/useConnectionStore";
import { useCommandStore } from "../stores/useCommandStore";
import { useMissionStore } from "../stores/useMissionStore";
import { useAIStore } from "../stores/useAIStore";
import { useAutonomyStore } from "../stores/useAutonomyStore";
import type { WSMessage, StateSyncPayload, RobotUpdatedPayload } from "../types/ws";
import type { Command } from "../types/command";
import type { Mission } from "../types/mission";
import type { Suggestion } from "../types/ai";
import type { AutonomyChangeEntry, CountdownSuggestion } from "../types/autonomy";

function getWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

const WS_URL = getWsUrl();

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | undefined>(undefined);
  const { setConnected, setReconnecting } = useConnectionStore();
  const { setRobots, updateRobot } = useRobotStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setReconnecting(false);
      // Register send function into command store
      useCommandStore.getState().setSendFn((type: string, payload: unknown) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({ type, payload, timestamp: new Date().toISOString() })
          );
        }
      });
      console.log("[WS] Connected");
    };

    ws.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);
      switch (msg.type) {
        case "state.sync": {
          const payload = msg.payload as StateSyncPayload;
          setRobots(payload.robots);
          if (payload.missions) {
            useMissionStore.getState().setMissions(payload.missions);
          }
          break;
        }
        case "robot.updated": {
          const robot = msg.payload as RobotUpdatedPayload;
          updateRobot(robot.id, robot);
          break;
        }
        case "command.status": {
          const cmd = msg.payload as Command;
          const store = useCommandStore.getState();
          if (store.commands[cmd.id]) {
            store.updateCommand(cmd.id, cmd);
          } else {
            store.addCommand(cmd);
          }
          break;
        }
        case "mission.updated": {
          const mission = msg.payload as Mission;
          useMissionStore.getState().updateMission(mission);
          break;
        }
        case "ai.suggestion": {
          const suggestion = msg.payload as Suggestion;
          const aiStore = useAIStore.getState();
          if (aiStore.suggestions[suggestion.id]) {
            aiStore.updateSuggestion(suggestion.id, suggestion);
          } else {
            aiStore.addSuggestion(suggestion);
          }
          break;
        }
        case "autonomy.changed": {
          const entry = msg.payload as AutonomyChangeEntry;
          const autoStore = useAutonomyStore.getState();
          autoStore.addChangeLogEntry(entry);
          if (entry.robotId === "__fleet__") {
            autoStore.setFleetDefaultTier(entry.newTier);
          } else {
            // Merge tier into existing robot state (don't replace)
            const existing = useRobotStore.getState().robots[entry.robotId];
            if (existing) {
              updateRobot(entry.robotId, { ...existing, autonomyTier: entry.newTier });
            }
          }
          break;
        }
        case "autonomy.countdown": {
          const countdown = msg.payload as CountdownSuggestion;
          useAutonomyStore.getState().addCountdown(countdown);
          break;
        }
      }
    };

    ws.onclose = () => {
      setConnected(false);
      useCommandStore.getState().setSendFn(null as unknown as (type: string, payload: unknown) => void);
      console.log("[WS] Disconnected. Reconnecting in 3s...");
      setReconnecting(true);
      reconnectTimer.current = window.setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [setConnected, setReconnecting, setRobots, updateRobot]);

  const send = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type, payload, timestamp: new Date().toISOString() })
      );
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { send };
}
