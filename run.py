#!/usr/bin/env python3
"""
DVAMOCLES SWORD™: Whiteboard — unified dev launcher (Windows, macOS, Linux).
Starts Vite (frontend) and Uvicorn (backend) concurrently; Ctrl+C stops both.
"""

from __future__ import annotations

import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT / "frontend"
BACKEND_DIR = ROOT / "backend"


def resolve_python() -> str:
    if sys.platform == "win32":
        candidates = [
            BACKEND_DIR / ".venv" / "Scripts" / "python.exe",
            BACKEND_DIR / ".venv" / "Scripts" / "python.exe",
        ]
    else:
        candidates = [
            BACKEND_DIR / ".venv" / "bin" / "python",
            BACKEND_DIR / ".venv" / "bin" / "python",
        ]
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    return sys.executable


def resolve_npm() -> str:
    npm = shutil.which("npm")
    if not npm:
        raise RuntimeError("npm not found on PATH. Install Node.js to run the frontend.")
    return npm


def spawn_process(
    args: list[str],
    cwd: Path,
    name: str,
) -> subprocess.Popen[bytes]:
    env = os.environ.copy()
    print(f"[run.py] Starting {name}: {' '.join(args)}")
    kwargs: dict = {
        "cwd": str(cwd),
        "env": env,
    }
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP  # type: ignore[attr-defined]
    return subprocess.Popen(args, **kwargs)


def terminate_process(proc: subprocess.Popen[bytes], name: str) -> None:
    if proc.poll() is not None:
        return
    print(f"[run.py] Stopping {name}…")
    try:
        if sys.platform == "win32":
            proc.send_signal(signal.CTRL_BREAK_EVENT)  # type: ignore[attr-defined]
            time.sleep(0.5)
        proc.terminate()
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=3)
    except Exception:
        proc.kill()


def main() -> int:
    npm = resolve_npm()
    python = resolve_python()

    frontend = spawn_process([npm, "run", "dev"], FRONTEND_DIR, "frontend (Vite)")
    backend = spawn_process(
        [python, "-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"],
        BACKEND_DIR,
        "backend (Uvicorn)",
    )

    print("[run.py] DVAMOCLES SWORD™ dev stack running.")
    print("  Frontend → http://localhost:5173")
    print("  Backend  → http://localhost:8000")
    print("  Press Ctrl+C to stop.\n")

    try:
        while True:
            fe_code = frontend.poll()
            be_code = backend.poll()
            if fe_code is not None:
                print(f"[run.py] Frontend exited with code {fe_code}")
                terminate_process(backend, "backend")
                return fe_code or 1
            if be_code is not None:
                print(f"[run.py] Backend exited with code {be_code}")
                terminate_process(frontend, "frontend")
                return be_code or 1
            time.sleep(0.25)
    except KeyboardInterrupt:
        print("\n[run.py] Shutting down…")
        terminate_process(frontend, "frontend")
        terminate_process(backend, "backend")
        return 0


if __name__ == "__main__":
    sys.exit(main())
