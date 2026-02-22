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
- Frontend `executeAI` action in `lib.ts` with loading state and explanation display

**Autonomy System (Phase 5):**
- Autonomy tier system (Manual/Assisted/Supervised/Autonomous) per robot and fleet-wide default
- AI suggestions panel with approve/reject/auto-execute based on tier
- Countdown timer for supervised auto-execution

**Voice Integration (Phase 6-7 - Complete):**
- Vapi voice agent with ElevenLabs TTS
- Vapi phone number: **+1 (573) 266-6725**
- Convex bridge with 6 voice commands: `dispatchDrones`, `getFleetStatus`, `recallRobots`, `stopRobots`, `createSurveillanceMission`, **`executeAICommand`**
- **`executeAICommand`**: catch-all for complex voice instructions → routes through `POST /api/ai/execute` → GPT-4o determines commands → dispatches automatically

**Simulator (Phase 7 - Complete):**
- 8 command types: goto, stop, return_home, patrol, set_speed, set_home, follow_waypoints, circle_area
- Waypoint queue with sequential progression (pop next waypoint when current one reached)
- Circle orbit logic (continuous until stopped) for all 3 robot types
- Commands properly clear conflicting state (stop clears circle, goto clears waypoints, etc.)

**Production Hardening (Complete):**
- Secrets removed from docker-compose.yml — all read from `.env` via `${VAR}` syntax
- `OPENAI_API_KEY` is **required** (`${OPENAI_API_KEY:?}` — compose refuses to start without it)
- CORS origins configurable via `CORS_ORIGINS` env var
- `DEBUG=false` by default in production compose; `true` only in dev override
- MQTT auth: entrypoint script auto-generates password file when `MQTT_USER`/`MQTT_PASSWORD` are set; falls back to anonymous in dev mode
- Backend and simulator MQTT clients support username/password credentials
- Backend healthcheck: `GET /api/health` (liveness) + `GET /api/health/ready` (readiness — checks DB + MQTT)
- Docker healthchecks on all services (mosquitto, postgres, backend); frontend depends on backend healthy
- Resource limits on all containers (memory + CPU caps)
- Structured JSON logging in production (human-readable in debug mode)
- Rate limiting middleware: 120 req/min per IP on `/api/*` (disabled in debug mode)
- Nginx: security headers (`X-Frame-Options`, `X-Content-Type-Options`), gzip, asset caching
- Production nginx config with HTTPS (TLS 1.2+, HSTS, HTTP→HTTPS redirect)
- Production compose overlay: `docker-compose.prod.yml`
- `.env.example` template for all required env vars

### Build Status
- `npx tsc --noEmit` — **PASS** (zero errors)
- `npx vite build` — **PASS** (builds in ~2s)
- Python syntax — **PASS** (all backend + simulator files)

---

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app, WebSocket handler, structured logging, rate limiter |
| `backend/app/config.py` | Settings (mqtt_user/password, cors_origins, AI, voice) |
| `backend/app/api/health.py` | `GET /api/health` (liveness) + `GET /api/health/ready` (readiness) |
| `backend/app/api/ai.py` | AI endpoints: suggestions, mission planning, `POST /api/ai/execute` |
| `backend/app/api/commands.py` | REST command endpoints (voice/external), fleet status |
| `backend/app/middleware/rate_limit.py` | In-memory rate limiter (120 req/min per IP) |
| `backend/app/middleware/api_key_auth.py` | API key auth for voice endpoints |
| `backend/app/ai/prompts/command_execution.py` | AI command execution prompt + JSON schema |
| `backend/app/mqtt/client.py` | MQTT client with optional username/password auth |
| `backend/app/services/state_manager.py` | In-memory robot state (source of truth for real-time) |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | **Single-file UI** (~1950 lines): all components, map, panels, commands, overlays, toolbars |
| `frontend/src/lib.ts` | **Single merged support file**: all types, Zustand stores (robot, UI, command, AI, autonomy, connection, mission), and hooks (WebSocket, keyboard shortcuts, trail data) |
| `frontend/nginx.conf` | Dev nginx config (HTTP, security headers, gzip) |
| `frontend/nginx.prod.conf` | Production nginx config (HTTPS, HSTS, HTTP redirect) |

### Simulator
| File | Purpose |
|------|---------|
| `simulator/simulator/main.py` | Robot simulation with MQTT auth support |
| `simulator/simulator/config.py` | Robot configs + MQTT credentials from env vars |

### Voice
| File | Purpose |
|------|---------|
| `voice/convex/actions/fleetCommands.ts` | Convex actions (6 tools including `executeAICommand`) |
| `voice/convex/http.ts` | Vapi webhook handler (/vapi/tool-call) |

### Infrastructure
| File | Purpose |
|------|---------|
| `docker/docker-compose.yml` | Main compose with healthchecks + resource limits |
| `docker/docker-compose.dev.yml` | Dev overrides: hot reload, DEBUG=true |
| `docker/docker-compose.prod.yml` | Production overrides: HTTPS, no simulator |
| `docker/mosquitto/mosquitto.conf` | Mosquitto config (auth managed by entrypoint) |
| `docker/mosquitto/entrypoint.sh` | Auto-generates MQTT password file from env vars |
| `.env.example` | Template for all required environment variables |
| `Makefile` | `make dev` / `make up` / `make prod` / `make down` / `make clean` |

---

## Running the Project

### Development

```bash
# 1. Copy .env.example to .env and fill in your API keys
cp .env.example .env

# 2. Start everything (dev mode with hot reload + simulator)
make dev

# Frontend dev server at http://localhost:3000
# Backend API at http://localhost:8000
```

### Production

```bash
# 1. Create .env with all secrets filled in (see .env.example)
# 2. Place SSL certs at docker/ssl/fullchain.pem and docker/ssl/privkey.pem
# 3. Set CORS_ORIGINS to your domain

make prod

# HTTPS on port 443, HTTP redirects to HTTPS
```

### Environment Variables

All secrets are read from `.env` at the repo root (gitignored). See `.env.example` for the full list:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
| `POSTGRES_PASSWORD` | No | Database password (default: `argus_dev`) |
| `MQTT_USER` / `MQTT_PASSWORD` | No | MQTT credentials (anonymous if unset) |
| `VOICE_API_KEY` | No | API key for voice endpoint auth |
| `AI_PROVIDER` | No | `openai` or `anthropic` (default: `openai`) |
| `AI_MODEL` | No | Model name (default: `gpt-4o`) |
| `CORS_ORIGINS` | No | JSON array of allowed origins |

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

## API Endpoints

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness probe (always 200) |
| GET | `/api/health/ready` | Readiness probe (checks DB + MQTT) |

### AI
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/execute` | Natural language → AI dispatches commands |
| POST | `/api/ai/missions/plan` | Generate mission plan from intent |
| POST | `/api/ai/missions/plan/approve` | Approve plan and dispatch commands |

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

1. **Vapi tool registration:** Add `executeAICommand` tool definition to Vapi assistant via their dashboard
2. **CI/CD pipeline:** GitHub Actions for lint, type-check, build, and deploy
3. **Test coverage:** Integration tests for backend, E2E tests for frontend
4. **3D visualization:** AltitudeInset component exists, could expand to full 3D view
5. **Geofencing:** Add no-fly zones / operational boundaries
6. **Multi-operator:** Add user authentication and role-based access
7. **Persistent missions:** Currently missions are in-memory; could persist to database
8. **Video feed overlay:** Camera feeds from drones on the map
9. **Replay mode:** Play back historical telemetry from TimescaleDB
