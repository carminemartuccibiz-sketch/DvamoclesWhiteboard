"""Example plugin API — mounted at /api/plugins/example."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def plugin_health() -> dict[str, str]:
    return {"plugin": "example", "status": "ok"}


@router.get("/info")
async def plugin_info() -> dict[str, str]:
    return {
        "id": "example",
        "name": "Example Highlight",
        "version": "1.0.0",
        "description": "Reference backend module for the DVAMOCLES plugin registry.",
    }
