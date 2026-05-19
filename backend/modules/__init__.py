"""DVAMOCLES plugin modules — each subpackage may expose a FastAPI `router`."""

from modules.loader import discover_plugin_routers

__all__ = ["discover_plugin_routers"]
