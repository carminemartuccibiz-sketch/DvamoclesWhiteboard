"""
DVAMOCLES SWORD™: Whiteboard — system-agnostic API.
Uses pathlib + stdlib json only for filesystem portability (Windows, macOS, Linux).
"""

from __future__ import annotations

import json
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

from modules.loader import mount_plugin_routers

BASE_DIR = Path(__file__).resolve().parent
PROJECTS_DIR = BASE_DIR / "data" / "projects"

PROJECT_ID_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$")


def ensure_projects_dir() -> None:
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_project_id(raw: str) -> str:
    slug = re.sub(r"[^\w.-]", "-", raw.strip())
    slug = re.sub(r"-+", "-", slug).strip("-").lower()
    if not slug:
        slug = "untitled"
    return slug[:128]


def resolve_project_path(project_id: str) -> Path:
    if not PROJECT_ID_PATTERN.match(project_id):
        raise HTTPException(status_code=400, detail="Invalid project id")
    path = (PROJECTS_DIR / f"{project_id}.json").resolve()
    if PROJECTS_DIR.resolve() not in path.parents:
        raise HTTPException(status_code=400, detail="Invalid project path")
    return path


class SaveProjectPayload(BaseModel):
    """Accepts DVAMOCLES world documents and legacy tldraw snapshots (opaque document blob)."""

    model_config = ConfigDict(extra="ignore")

    document: dict[str, Any] = Field(
        ...,
        description=(
            "DVAMOCLES world document (schemaVersion, camera, entities, spatialLinks, meta) "
            "or legacy tldraw snapshot — migrated client-side on load"
        ),
    )
    project_name: str | None = Field(None, description="Human-readable name")
    id: str | None = Field(None, description="Stable project id")
    schema_version: int | None = Field(
        None,
        description="Top-level schema version mirror (document.schemaVersion)",
    )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_projects_dir()
    yield


app = FastAPI(
    title="DVAMOCLES SWORD API",
    description="System-agnostic whiteboard persistence engine",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_mounted_plugins = mount_plugin_routers(app)
if _mounted_plugins:
    print(f"[DVAMOCLES] Mounted plugin routers: {', '.join(_mounted_plugins)}")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


async def _persist_project(payload: SaveProjectPayload) -> dict[str, str]:
    ensure_projects_dir()

    raw_id = payload.id or payload.project_name or "untitled"
    project_id = sanitize_project_id(raw_id)

    doc = payload.document
    schema_version = payload.schema_version
    if schema_version is None and isinstance(doc.get("schemaVersion"), int):
        schema_version = doc["schemaVersion"]

    record = {
        "id": project_id,
        "project_name": payload.project_name or project_id,
        "schema_version": schema_version,
        "document": doc,
    }

    path = resolve_project_path(project_id)
    path.write_text(json.dumps(record, indent=2), encoding="utf-8")

    return {"id": project_id, "path": str(path.relative_to(BASE_DIR))}


async def _read_project(project_id: str) -> dict[str, Any]:
    ensure_projects_dir()
    slug = sanitize_project_id(project_id)
    path = resolve_project_path(slug)

    if not path.is_file():
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        record = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail="Corrupt project file") from exc

    if not isinstance(record, dict):
        raise HTTPException(status_code=500, detail="Invalid project record")

    record.setdefault("id", slug)
    record.setdefault("project_name", slug)
    return record


@app.post("/api/save")
async def api_save(payload: SaveProjectPayload) -> dict[str, str]:
    """Primary save endpoint (DVAMOCLES JSON)."""
    return await _persist_project(payload)


@app.post("/api/projects/save")
async def save_project(payload: SaveProjectPayload) -> dict[str, str]:
    """Alias for backward compatibility."""
    return await _persist_project(payload)


@app.get("/api/load")
async def api_load(
    project_id: str = Query("untitled", description="Project id / slug"),
) -> dict[str, Any]:
    """Load project JSON — DVAMOCLES or legacy tldraw (client migrates on import)."""
    return await _read_project(project_id)


@app.get("/api/projects/{project_id}")
async def load_project(project_id: str) -> dict[str, Any]:
    """Alias for backward compatibility."""
    return await _read_project(project_id)
