from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

from app.ai.mission_planner import MissionIntent, mission_planner
from app.ai.suggestions import suggestion_service
from app.config import settings
from app.mqtt.client import mqtt_client
from app.services.command_service import command_service
from app.services.state_manager import state_manager
from app.ws.manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/suggestions")
async def list_suggestions(robot_id: str | None = None) -> dict[str, Any]:
    pending = suggestion_service.get_pending(robot_id)
    return {"suggestions": [s.to_dict() for s in pending]}


@router.get("/suggestions/all")
async def list_all_suggestions(limit: int = 50) -> dict[str, Any]:
    items = suggestion_service.get_all(limit)
    return {"suggestions": [s.to_dict() for s in items]}


@router.post("/suggestions/{suggestion_id}/approve")
async def approve_suggestion(suggestion_id: str) -> dict[str, Any]:
    suggestion = suggestion_service.approve(suggestion_id)
    if suggestion is None:
        return {"error": "Suggestion not found or not pending"}

    # Execute the proposed action if present
    if suggestion.proposed_action:
        robot_id = suggestion.proposed_action.get("robotId", suggestion.robot_id)
        command_type = suggestion.proposed_action.get("commandType", "")
        parameters = suggestion.proposed_action.get("parameters", {})

        if robot_id and command_type and state_manager.robots.get(robot_id):
            cmd = command_service.create_command(
                robot_id=robot_id,
                command_type=command_type,
                parameters=parameters,
                source="ai",
            )
            await mqtt_client.publish(
                f"argus/{robot_id}/command/execute",
                {
                    "command_id": cmd.id,
                    "command_type": command_type,
                    "parameters": parameters,
                },
            )
            command_service.update_status(cmd.id, "sent")
            logger.info("AI suggestion approved: %s -> %s (%s)", command_type, robot_id, cmd.id)

    # Broadcast update
    await ws_manager.broadcast({
        "type": "ai.suggestion",
        "payload": suggestion.to_dict(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return suggestion.to_dict()


@router.post("/suggestions/{suggestion_id}/reject")
async def reject_suggestion(suggestion_id: str) -> dict[str, Any]:
    suggestion = suggestion_service.reject(suggestion_id)
    if suggestion is None:
        return {"error": "Suggestion not found or not pending"}

    await ws_manager.broadcast({
        "type": "ai.suggestion",
        "payload": suggestion.to_dict(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return suggestion.to_dict()


@router.post("/missions/plan")
async def generate_mission_plan(body: dict[str, Any]) -> dict[str, Any]:
    if not settings.ai_enabled:
        return {"error": "AI is not enabled. Set AI_ENABLED=true."}

    intent = MissionIntent(
        objective=body.get("objective", ""),
        zone=body.get("zone"),
        constraints=body.get("constraints", []),
        rules_of_engagement=body.get("rulesOfEngagement", []),
        preferences=body.get("preferences", {}),
        selected_robots=body.get("selectedRobots"),
    )

    if not intent.objective:
        return {"error": "objective is required"}

    try:
        plan = await mission_planner.generate_plan(intent)
        return {"plan": plan}
    except Exception as e:
        logger.exception("Mission planning failed")
        return {"error": str(e)}


@router.post("/missions/plan/approve")
async def approve_mission_plan(body: dict[str, Any]) -> dict[str, Any]:
    """Convert an approved AI plan into a live mission."""
    from app.services.mission_service import mission_service

    plan = body.get("plan", {})
    name = plan.get("name", "AI Mission")
    assignments = plan.get("assignments", [])

    assigned_robots = [a["robotId"] for a in assignments]
    waypoints: dict[str, list[dict[str, Any]]] = {}
    for assignment in assignments:
        robot_id = assignment["robotId"]
        waypoints[robot_id] = [
            {
                "latitude": wp["latitude"],
                "longitude": wp["longitude"],
                "altitude": wp.get("altitude", 0),
                "action": wp.get("action", "navigate"),
            }
            for wp in assignment.get("waypoints", [])
        ]

    mission = mission_service.create_mission(name, assigned_robots, waypoints)
    mission_service.update_status(mission.id, "active")

    await ws_manager.broadcast({
        "type": "mission.updated",
        "payload": mission.to_dict(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return mission.to_dict()
