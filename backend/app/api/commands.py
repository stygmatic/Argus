from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.db.repositories.command_repo import command_repo
from app.services.command_service import command_service

router = APIRouter(prefix="/commands", tags=["commands"])


@router.get("/{robot_id}")
async def get_robot_commands(robot_id: str) -> dict[str, Any]:
    commands = command_service.get_robot_commands(robot_id)
    return {"commands": [c.to_dict() for c in commands]}


@router.get("/{robot_id}/active")
async def get_active_command(robot_id: str) -> dict[str, Any]:
    cmd = command_service.get_active_command(robot_id)
    return {"command": cmd.to_dict() if cmd else None}


@router.get("/history/{robot_id}")
async def get_command_history(robot_id: str, limit: int = 50) -> dict[str, Any]:
    """Get persisted command history from database."""
    commands = await command_repo.get_robot_commands(robot_id, limit)
    return {"commands": commands}
