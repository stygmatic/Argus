# Argus Ground Station - Handoff Document

## Project Overview

Universal ground-station web app for autonomous robot swarms. Manages a fleet of 2 drones, 2 ground rovers, and 1 underwater vehicle (UUV) in the Fremont, CA area. Features real-time map visualization, AI-assisted mission planning, voice-controlled fleet management, and autonomy tiers.

---

## Architecture

```
Phone Call → Vapi Voice Agent (STT + GPT-4o + ElevenLabs TTS)
                 ↓ (tool call)
            Convex HTTP Action (bridge)
                 ↓ (HTTP POST)
Frontend ←→ WebSocket ←→ FastAPI Backend ←→ MQTT ←→ Simulator
                              ↓
                         PostgreSQL / TimescaleDB
```

**Stack:**
- **Backend:** Python 3.12, FastAPI, MQTT (aiomqtt), WebSocket, asyncpg
- **Frontend:** React 19, TypeScript, Vite, Zustand, Tailwind CSS 4, MapLibre GL JS
- **Simulator:** Python, 5 robots around Fremont CA
- **AI:** OpenAI GPT-4o for mission planning (via `backend/app/ai/`)
- **Voice:** Vapi (voice agent) → Convex (bridge) → FastAPI REST → MQTT
- **Infra:** Docker Compose (Mosquitto, PostgreSQL/TimescaleDB, backend, frontend, simulator)

---

## Current State (as of 2026-02-21)

### What's Working
- Real-time map with all 5 robots moving (drones orbit, rovers follow streets, UUV patrols Quarry Lakes)
- Trail lines for all robot types (green=drone, purple=rover, blue=UUV)
- Robot selection → detail panel with commands (Go To Location, Patrol, Stop, Return Home)
- Click-to-goto: select robot → click "Go To Location" → click map → robot navigates there
- Autonomy tier system (Manual/Assisted/Supervised/Autonomous) per robot
- AI suggestions panel with approve/reject workflow
- Mission planning dialog ("Update Mission" button) → GPT-4o generates plans
- Voice integration: Vapi assistant (ID: 0fc26349-d0f7-42cd-87a3-fc5a62cf9231) with ElevenLabs TTS
- Vapi phone number: **+1 (573) 266-6725** assigned to assistant
- Convex bridge deployed at https://qualified-hound-47.convex.cloud
- Backend REST endpoints: POST /api/commands/execute, GET /api/commands/fleet-status (API key protected)
- WebSocket command flow: Frontend → WS → Backend → MQTT → Simulator → ACK → WS broadcast

### What's In Progress (Phase 7)
Simulator commands just added but not yet wired to frontend/AI:
- `set_home` — change robot's home position
- `follow_waypoints` — sequential multi-waypoint navigation
- `circle_area` — orbit around a center point at given radius

### What's Not Done Yet
1. **Frontend UI for new commands** (set_home, waypoints, circle_area map interaction modes)
2. **AI command execution endpoint** (`POST /api/ai/execute`) — takes natural language, GPT-4o generates commands, dispatches them automatically
3. **Voice AI integration** — `executeAICommand` Convex action for complex voice instructions routed through GPT-4o
4. **Plan approval dispatch** — `approve_mission_plan` creates Mission record but doesn't actually send commands to robots
5. **Backend valid_commands** — new command types need to be added to `backend/app/api/commands.py` valid_commands set

---

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app, WebSocket handler, WS→MQTT command routing |
| `backend/app/config.py` | Settings (AI_ENABLED, AI_PROVIDER, OPENAI_API_KEY, VOICE_API_KEY) |
| `backend/app/api/ai.py` | AI endpoints: suggestions, mission planning, plan approval |
| `backend/app/api/commands.py` | REST command endpoints (voice/external), fleet status |
| `backend/app/ai/mission_planner.py` | GPT-4o mission plan generation |
| `backend/app/ai/providers/openai.py` | OpenAI provider with structured output |
| `backend/app/middleware/api_key_auth.py` | API key auth for voice endpoints |
| `backend/app/services/state_manager.py` | In-memory robot state (source of truth for real-time) |
| `backend/app/services/command_service.py` | Command lifecycle management |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | **Single-file UI** (~1800 lines): all components, map, panels, commands |
| `frontend/src/stores/useRobotStore.ts` | Robot state + trail accumulation |
| `frontend/src/stores/useUIStore.ts` | UI state: selectedRobot, commandMode, trails, search/filter |
| `frontend/src/stores/useCommandStore.ts` | Command sending via WebSocket |
| `frontend/src/stores/useAIStore.ts` | AI suggestions, mission planning |
| `frontend/src/stores/useAutonomyStore.ts` | Autonomy tier management |
| `frontend/src/hooks/useWebSocket.ts` | WebSocket connection + message handling |

### Simulator
| File | Purpose |
|------|---------|
| `simulator/simulator/main.py` | Robot simulation: DroneSim, GroundRobotSim, UnderwaterRobotSim |
| `simulator/simulator/config.py` | Robot configs: positions, speeds, patrol radii |

### Voice
| File | Purpose |
|------|---------|
| `voice/convex/actions/fleetCommands.ts` | Convex actions: dispatchDrones, getFleetStatus, recallRobots, etc. |
| `voice/convex/http.ts` | Vapi webhook handler (/vapi/tool-call) |
| `voice/SETUP.md` | Complete setup guide with all API keys and config |

### Infrastructure
| File | Purpose |
|------|---------|
| `docker/docker-compose.yml` | Main compose: mosquitto, postgres, backend, frontend, simulator |
| `docker/docker-compose.dev.yml` | Dev overrides: hot reload, volumes |
| `Makefile` | `make dev` / `make up` / `make down` / `make clean` |

---

## Running the Project

```bash
# Start everything (dev mode with hot reload)
make dev

# Or manually
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml --profile dev up --build

# Frontend dev server at http://localhost:3000
# Backend API at http://localhost:8000
```

### Environment Variables (in docker-compose.yml)
```
AI_ENABLED=true
AI_PROVIDER=openai
AI_MODEL=gpt-4o
OPENAI_API_KEY=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
VOICE_API_KEY=argus-voice-key-2026
```

### Voice Pipeline Setup
1. Backend must be accessible from internet (tunnel needed for local dev)
2. Start tunnel: `ssh -R 80:localhost:8000 nokey@localhost.run`
3. Update Convex env var: `npx convex env set ARGUS_BACKEND_URL "https://<tunnel-url>" --admin-key "..." --url "https://qualified-hound-47.convex.cloud"`
4. Call +1 (573) 266-6725 to test

### API Keys & Credentials
- **Vapi Private Key:** 8a658b0a-1ed1-4ec9-b4b7-21f17df1e2ac
- **Vapi Public Key:** b3c49abd-06cd-47ca-aab4-514fc96c4045
- **Vapi Assistant ID:** 0fc26349-d0f7-42cd-87a3-fc5a62cf9231
- **Convex Deploy Key:** dev:qualified-hound-47|eyJ2MiI6ImU0YzgwYmEwNGJhNDQ3Y2RiYmQxMGJmYmM2OWViOTc3In0=
- **Convex URL:** https://qualified-hound-47.convex.cloud
- **ElevenLabs Key:** sk_61f0e0f26cfd3c92db855eb9c9ab3060b83369fb7fd6b99d

---

## Supported Commands (Simulator)

| Command | Parameters | Behavior |
|---------|-----------|----------|
| `goto` | `{ latitude, longitude, altitude? }` | Navigate to point |
| `stop` | — | Halt all movement |
| `return_home` | — | Navigate to home position |
| `patrol` | — | Resume default patrol pattern |
| `set_speed` | `{ speed }` | Change movement speed |
| `set_home` | `{ latitude, longitude, altitude? }` | Change home position (NEW) |
| `follow_waypoints` | `{ waypoints: [{lat, lon, alt?}, ...] }` | Sequential waypoint navigation (NEW) |
| `circle_area` | `{ latitude, longitude, radius }` | Orbit around center point (NEW) |

---

## Known Issues & Gotchas

1. **Never use `backdrop-blur` above MapLibre canvas** — causes black screen (GPU compositing issue). Use solid `bg-slate-900` instead.
2. **Never use full-screen `pointer-events-none` overlay** wrapping panels — blacks out WebGL canvas.
3. **localhost.run tunnels are ephemeral** — URL changes on each restart. Must update Convex `ARGUS_BACKEND_URL` env var each time.
4. **Simulator state is in-memory** — robot positions/waypoint queues lost on restart.
5. **Backend state is in-memory** — robot registry cleared on restart. Simulator re-registers on reconnect.
6. **OpenAI structured output `strict: True`** requires fully-specified schemas. May need `strict: False` for flexible parameter objects.

---

## Next Steps (Phase 7 Remaining)

Full plan in: `.claude/plans/woolly-questing-lynx.md`

1. **Backend:** Add `set_home`, `follow_waypoints`, `circle_area` to `valid_commands` in `backend/app/api/commands.py`
2. **Frontend stores:** Expand `CommandMode` type, add `pendingWaypoints`, `circleCenter`, `circleRadius` to `useUIStore.ts`
3. **Frontend UI:** New command buttons in CommandPalette, map click handlers for each mode, waypoint/circle overlays, floating toolbars
4. **AI execution:** Create `backend/app/ai/prompts/command_execution.py` prompt + `POST /api/ai/execute` endpoint
5. **Frontend AI:** Add `executeAI` to `useAIStore`, dual-mode Update Mission dialog (Quick Execute vs Plan & Review)
6. **Fix plan approval:** `approve_mission_plan` should dispatch `follow_waypoints` to assigned robots
7. **Voice AI:** Add `executeAICommand` Convex action + Vapi tool for complex voice-to-AI-to-commands flow
8. **Verification:** TypeScript check + Vite build + end-to-end testing
