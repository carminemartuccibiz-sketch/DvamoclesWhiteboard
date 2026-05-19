"""
Automatic discovery of plugin routers under backend/modules/*/router.py.

Each module is mounted at /api/plugins/{module_name}.
"""

from __future__ import annotations

import importlib
import pkgutil
from pathlib import Path
from typing import Any

from fastapi import APIRouter

MODULES_PACKAGE = "modules"
MODULES_DIR = Path(__file__).resolve().parent


def discover_plugin_routers() -> list[tuple[str, APIRouter]]:
    """
    Scan backend/modules for subpackages containing router.py with `router: APIRouter`.
    Returns (module_name, router) pairs sorted by module name.
    """
    discovered: list[tuple[str, APIRouter]] = []

    for module_info in pkgutil.iter_modules([str(MODULES_DIR)]):
        if not module_info.ispkg:
            continue

        module_name = module_info.name
        if module_name.startswith("_"):
            continue

        module_path = f"{MODULES_PACKAGE}.{module_name}.router"
        try:
            mod = importlib.import_module(module_path)
        except ModuleNotFoundError:
            continue

        router = getattr(mod, "router", None)
        if router is None:
            continue
        if not isinstance(router, APIRouter):
            raise TypeError(
                f"{module_path} must export `router` as fastapi.APIRouter, got {type(router)!r}",
            )

        discovered.append((module_name, router))

    return sorted(discovered, key=lambda item: item[0])


def mount_plugin_routers(app: Any) -> list[str]:
    """Attach discovered routers to the FastAPI app. Returns mounted module names."""
    mounted: list[str] = []
    for module_name, router in discover_plugin_routers():
        prefix = f"/api/plugins/{module_name}"
        app.include_router(router, prefix=prefix, tags=[f"plugin:{module_name}"])
        mounted.append(module_name)
    return mounted
