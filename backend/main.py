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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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
    document: dict[str, Any] = Field(..., description="Tldraw document / snapshot JSON")
    project_name: str | None = Field(None, description="Human-readable name")
    id: str | None = Field(None, description="Stable project id")


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
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/projects/save")
async def save_project(payload: SaveProjectPayload) -> dict[str, str]:
    ensure_projects_dir()

    raw_id = payload.id or payload.project_name or "untitled"
    project_id = sanitize_project_id(raw_id)

    record = {
        "id": project_id,
        "project_name": payload.project_name or project_id,
        "document": payload.document,
    }

    path = resolve_project_path(project_id)
    path.write_text(json.dumps(record, indent=2), encoding="utf-8")

    return {"id": project_id, "path": str(path.relative_to(BASE_DIR))}


@app.get("/api/projects/{project_id}")
async def load_project(project_id: str) -> dict[str, Any]:
    ensure_projects_dir()
    path = resolve_project_path(sanitize_project_id(project_id))

    if not path.is_file():
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail="Corrupt project file") from exc
