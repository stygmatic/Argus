from fastapi import APIRouter

from app.services.state_manager import state_manager
from app.ws.manager import ws_manager

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict:
    return {
        "status": "ok",
        "robots_count": len(state_manager.robots),
        "ws_clients": len(ws_manager.active_connections),
    }
