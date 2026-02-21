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
- **AI:** OpenAI GPT-4o for mission planning + command execution (via `backend/app/ai/`)
- **Voice:** Vapi (voice agent) → Convex (bridge) → FastAPI REST → MQTT
- **Infra:** Docker Compose (Mosquitto, PostgreSQL/TimescaleDB, backend, frontend, simulator)

---

## Current State (as of 2026-02-21)

### What's Working (All Phases Complete)

**Core Infrastructure (Phase 1-3):**
- Real-time map with all 5 robots moving (drones orbit, rovers follow streets, UUV patrols Quarry Lakes)
- Trail lines for all robot types (green=drone, purple=rover, blue=UUV)
- WebSocket command flow: Frontend → WS → Backend → MQTT → Simulator → ACK → WS broadcast
- Database persistence with TimescaleDB for historical telemetry

**Robot Control (Phase 7 - Complete):**
- Robot selection → detail panel with full command palette
- **9 command types per robot:** Go To Location, Patrol, Waypoints, Circle Area, Set Home, Hold Position/Stop, Return Home, plus type-specific commands
- **Set Home:** Click "Set Home" → click map → robot's home position updated
- **Waypoints:** Click "Waypoints" → click multiple map points → numbered markers appear with dashed connecting line → floating toolbar with Undo/Clear/Send buttons → sends `follow_waypoints` command → robot visits each waypoint sequentially
- **Circle Area:** Click "Circle Area" → click map to set center → circle polygon overlay appears → drag radius slider (50-500m) → Confirm → robot orbits the center point continuously
- **Go To Location:** Click → click map → robot navigates there (existing)

**AI Command Execution (Phase 7 - Complete):**
- **`POST /api/ai/execute`** endpoint: natural language instruction → GPT-4o determines best commands → dispatches to robots automatically
- **Dual-mode Update Mission dialog:** "Quick Execute" (type instruction, AI dispatches immediately) or "Plan & Review" (generate plan, review assignments, approve to deploy)
- **Plan approval dispatches commands:** `approve_mission_plan` now sends `follow_waypoints` to each assigned robot
- AI command execution prompt with full command schema in `backend/app/ai/prompts/command_execution.py`
- Frontend `executeAI` action in `useAIStore.ts` with loading state and explanation display

**Autonomy System (Phase 5):**
- Autonomy tier system (Manual/Assisted/Supervised/Autonomous) per robot and fleet-wide default
- AI suggestions panel with approve/reject/auto-execute based on tier
- Countdown timer for supervised auto-execution

**Voice Integration (Phase 6-7 - Complete):**
- Vapi voice agent with ElevenLabs TTS
- Vapi phone number: **+1 (573) 266-6725**
- Convex bridge with 6 voice commands: `dispatchDrones`, `getFleetStatus`, `recallRobots`, `stopRobots`, `createSurveillanceMission`, **`executeAICommand`**
- **`executeAICommand`**: catch-all for complex voice instructions → routes through `POST /api/ai/execute` → GPT-4o determines commands → dispatches automatically
- Example voice flow: "Set up a perimeter around Lake Elizabeth" → Vapi transcribes → `executeAICommand` tool call → Convex action → FastAPI → GPT-4o → circle_area/follow_waypoints commands → robots move

**Simulator (Phase 7 - Complete):**
- 8 command types: goto, stop, return_home, patrol, set_speed, set_home, follow_waypoints, circle_area
- Waypoint queue with sequential progression (pop next waypoint when current one reached)
- Circle orbit logic (continuous until stopped) for all 3 robot types
- Commands properly clear conflicting state (stop clears circle, goto clears waypoints, etc.)

### Build Status
- `npx tsc --noEmit` — **PASS** (zero errors)
- `npx vite build` — **PASS** (builds in ~2s)
- Python syntax — **PASS** (all backend files)

---

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app, WebSocket handler, WS→MQTT command routing |
| `backend/app/config.py` | Settings (AI_ENABLED, AI_PROVIDER, OPENAI_API_KEY, VOICE_API_KEY) |
| `backend/app/api/ai.py` | AI endpoints: suggestions, mission planning, plan approval, **`POST /api/ai/execute`** |
| `backend/app/api/commands.py` | REST command endpoints (voice/external), fleet status |
| `backend/app/ai/mission_planner.py` | GPT-4o mission plan generation |
| `backend/app/ai/prompts/command_execution.py` | **NEW:** AI command execution prompt + JSON schema |
| `backend/app/ai/prompts/mission_planning.py` | Mission planning prompt + JSON schema |
| `backend/app/ai/providers/openai.py` | OpenAI provider with structured output |
| `backend/app/middleware/api_key_auth.py` | API key auth for voice endpoints |
| `backend/app/services/state_manager.py` | In-memory robot state (source of truth for real-time) |
| `backend/app/services/command_service.py` | Command lifecycle management |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | **Single-file UI** (~1950 lines): all components, map, panels, commands, overlays, toolbars |
| `frontend/src/lib.ts` | **Single merged support file**: all types, Zustand stores (robot, UI, command, AI, autonomy, connection, mission), and hooks (WebSocket, keyboard shortcuts, trail data) |

### Simulator
| File | Purpose |
|------|---------|
| `simulator/simulator/main.py` | Robot simulation: DroneSim, GroundRobotSim, UnderwaterRobotSim, waypoint queue, circle orbit |
| `simulator/simulator/config.py` | Robot configs: positions, speeds, patrol radii |

### Voice
| File | Purpose |
|------|---------|
| `voice/convex/actions/fleetCommands.ts` | Convex actions: dispatchDrones, getFleetStatus, recallRobots, stopRobots, createSurveillanceMission, **executeAICommand** |
| `voice/convex/http.ts` | Vapi webhook handler (/vapi/tool-call) with all 6 tool routes |
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
OPENAI_API_KEY=sk-proj-RjnBndwFh8oM7lvc8rIw...
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
| `set_home` | `{ latitude, longitude, altitude? }` | Change home position |
| `follow_waypoints` | `{ waypoints: [{latitude, longitude, altitude?}, ...] }` | Sequential waypoint navigation |
| `circle_area` | `{ latitude, longitude, radius }` | Orbit around center point continuously |

---

## Frontend Command Modes

| Mode | UI Flow | Map Interaction |
|------|---------|-----------------|
| `goto` | Click "Go To Location" → crosshair cursor → click map | Sends `goto` command, resets mode |
| `set_home` | Click "Set Home" → floating hint bar → click map | Sends `set_home` command, resets mode |
| `set_waypoints` | Click "Waypoints" → click map multiple times → numbered markers + dashed line appear → floating toolbar (Undo/Clear/Send) | Each click adds waypoint; Send dispatches `follow_waypoints` |
| `circle_area` | Click "Circle Area" → click map to set center → circle polygon overlay + radius slider toolbar (50-500m) → Confirm | Sends `circle_area` command with center + radius |

---

## AI Integration

### Quick Execute Flow
1. User clicks "Update Mission" → dialog opens in "Quick Execute" mode
2. Types natural language instruction (e.g. "set up surveillance around Lake Elizabeth")
3. Clicks "Execute" → `POST /api/ai/execute` called
4. GPT-4o analyzes fleet state + instruction → generates specific commands
5. Commands dispatched via MQTT → robots move → result explanation shown

### Plan & Review Flow
1. User clicks "Update Mission" → switches to "Plan & Review" mode
2. Fills in objective, selects robots, adds constraints/ROE
3. Clicks "Generate Plan" → `POST /api/ai/missions/plan` called
4. GPT-4o generates structured plan with assignments, waypoints, contingencies
5. User reviews plan → clicks "Approve & Deploy"
6. `POST /api/ai/missions/plan/approve` creates Mission + dispatches `follow_waypoints` to each robot

### Voice AI Flow
1. Caller dials +1 (573) 266-6725
2. Vapi transcribes speech, GPT-4o decides which tool to call
3. Simple commands → specific tools (dispatchDrones, recallRobots, etc.)
4. Complex instructions → `executeAICommand` tool → `POST /api/ai/execute` → GPT-4o → dispatched
5. Response spoken back via ElevenLabs TTS

---

## Known Issues & Gotchas

1. **Never use `backdrop-blur` above MapLibre canvas** — causes black screen (GPU compositing issue). Use solid `bg-slate-900` instead.
2. **Never use full-screen `pointer-events-none` overlay** wrapping panels — blacks out WebGL canvas.
3. **localhost.run tunnels are ephemeral** — URL changes on each restart. Must update Convex `ARGUS_BACKEND_URL` env var each time.
4. **Simulator state is in-memory** — robot positions/waypoint queues lost on restart.
5. **Backend state is in-memory** — robot registry cleared on restart. Simulator re-registers on reconnect.
6. **OpenAI structured output `strict: True`** requires fully-specified schemas with `additionalProperties: false`.
7. **Vapi assistant tools** must be updated manually via Vapi dashboard to add `executeAICommand` tool definition.

---

## Remaining / Future Work

1. **Vapi tool registration:** Add `executeAICommand` tool definition (params: `{ instruction: string }`) to the Vapi assistant via their dashboard
2. **3D visualization:** AltitudeInset component exists, could expand to full 3D view
3. **Geofencing:** Add no-fly zones / operational boundaries
4. **Multi-operator:** Add user authentication and role-based access
5. **Persistent missions:** Currently missions are in-memory; could persist to database
6. **Video feed overlay:** Camera feeds from drones on the map
7. **Replay mode:** Play back historical telemetry from TimescaleDB
