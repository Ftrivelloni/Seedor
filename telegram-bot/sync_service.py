"""
sync_service.py — Snapshot Generator for the Seedor Telegram Bot
================================================================
Fetches data from the Seedor API and writes a read-only snapshot
to data/snapshot.json. Also pushes pending updates back to the API.

Usage:
    python sync_service.py              # one-shot sync
    python sync_service.py --daemon     # periodic sync every 60s
    python sync_service.py --push       # push pending updates only
"""

import json
import os
import sys
import tempfile
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional

# ─── Load .env (simple, no dependency) ─────────────────────
def _load_dotenv(path: str) -> None:
    """Minimal .env loader — no external dependency needed."""
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key.strip(), value)

BASE_DIR = Path(__file__).parent
_load_dotenv(str(BASE_DIR / ".env"))

# ─── Config ────────────────────────────────────────────────
DATA_DIR = BASE_DIR / "data"
SNAPSHOT_PATH = DATA_DIR / "snapshot.json"
UPDATES_PATH = DATA_DIR / "updates_queue.json"

API_URL = os.environ.get("SEEDOR_API_URL", "http://localhost:3000")
API_KEY = os.environ.get("SEEDOR_API_KEY", "")
TENANT_ID = os.environ.get("SEEDOR_TENANT_ID", "")


def _api_request(method: str, path: str, body: Optional[dict] = None) -> dict:
    """Make an authenticated request to the Seedor API."""
    url = f"{API_URL.rstrip('/')}{path}"
    data = json.dumps(body).encode("utf-8") if body else None

    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"[SYNC] API error {e.code}: {error_body}")
        raise


def fetch_snapshot() -> dict:
    """Fetch the snapshot from the Seedor API."""
    return _api_request("GET", f"/api/telegram/snapshot?tenantId={TENANT_ID}")


def write_snapshot(snapshot: dict) -> None:
    """Atomically write the snapshot to disk."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    fd, tmp_path = tempfile.mkstemp(dir=str(DATA_DIR), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, indent=2, ensure_ascii=False)
        os.replace(tmp_path, str(SNAPSHOT_PATH))
    except Exception:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise


def sync_once() -> None:
    """Run a single sync cycle: fetch snapshot from API and write to file."""
    if not API_KEY or not TENANT_ID:
        print("[SYNC] ERROR: SEEDOR_API_KEY and SEEDOR_TENANT_ID must be set in .env")
        raise SystemExit(1)

    snapshot = fetch_snapshot()
    write_snapshot(snapshot)

    w = len(snapshot.get("workers", []))
    f = len(snapshot.get("fields", []))
    t = len(snapshot.get("tasks", []))
    print(
        f"[SYNC] {snapshot.get('generated_at', '?')} — "
        f"Workers: {w}, Fields: {f}, Tasks: {t} → {SNAPSHOT_PATH}"
    )


def push_updates() -> None:
    """Push pending updates from updates_queue.json to the Seedor API."""
    if not UPDATES_PATH.exists():
        print("[SYNC] No updates to push.")
        return

    with open(UPDATES_PATH, "r", encoding="utf-8") as f:
        try:
            queue = json.load(f)
        except json.JSONDecodeError:
            print("[SYNC] updates_queue.json is malformed, skipping.")
            return

    events = queue.get("events", [])
    if not events:
        print("[SYNC] No events in queue.")
        return

    print(f"[SYNC] Pushing {len(events)} events to API...")

    result = _api_request("POST", "/api/telegram/updates", {"events": events})

    processed = result.get("processed", 0)
    errors = result.get("errors", [])

    print(f"[SYNC] Pushed: {processed}/{len(events)} processed.")
    if errors:
        for err in errors:
            print(f"  ⚠️  {err}")

    # Clear the queue after successful push
    with open(UPDATES_PATH, "w", encoding="utf-8") as f:
        json.dump({"events": []}, f, indent=2, ensure_ascii=False)

    print("[SYNC] Queue cleared.")


def run_daemon() -> None:
    """Run sync_once every 60 seconds using schedule."""
    import schedule
    import time

    print("[SYNC] Starting daemon mode (every 60s). Press Ctrl+C to stop.")
    sync_once()
    schedule.every(60).seconds.do(sync_once)
    # Also push updates every 5 minutes
    schedule.every(5).minutes.do(push_updates)

    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[SYNC] Daemon stopped.")


# ─── CLI ───────────────────────────────────────────────────
if __name__ == "__main__":
    if "--push" in sys.argv:
        push_updates()
    elif "--daemon" in sys.argv:
        run_daemon()
    else:
        sync_once()
