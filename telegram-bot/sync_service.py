"""
sync_service.py — Snapshot Generator for the Seedor Telegram Bot
================================================================
Fetches data from the Seedor API and writes a read-only snapshot
to data/snapshot.json. Also pushes pending updates back to the API.

Phase 0 improvements:
  - Structured JSON logging
  - Retry with exponential backoff
  - Dead-letter queue for failed events

Usage:
    python sync_service.py              # one-shot sync
    python sync_service.py --daemon     # periodic sync every 60s
    python sync_service.py --push       # push pending updates only
    python sync_service.py --dlq        # show dead-letter queue stats
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

# ─── Structured logging ──────────────────────────────────
from logger import get_logger
from retry import retry_with_backoff, DeadLetterQueue

log = get_logger("sync")

# ─── Config ────────────────────────────────────────────────
DATA_DIR = BASE_DIR / "data"
SNAPSHOT_PATH = DATA_DIR / "snapshot.json"
UPDATES_PATH = DATA_DIR / "updates_queue.json"
DLQ_PATH = DATA_DIR / "dead_letter.json"

API_URL = os.environ.get("SEEDOR_API_URL", "http://localhost:3000")
API_KEY = os.environ.get("SEEDOR_API_KEY", "")
TENANT_ID = os.environ.get("SEEDOR_TENANT_ID", "")

# ─── Dead-letter queue ────────────────────────────────────
dlq = DeadLetterQueue(DLQ_PATH)


@retry_with_backoff(max_retries=3, base_delay=2.0, max_delay=30.0)
def _api_request(method: str, path: str, body: Optional[dict] = None) -> dict:
    """Make an authenticated request to the Seedor API with retry + backoff."""
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
        log.error(
            "API HTTP error",
            method=method,
            path=path,
            status_code=e.code,
            response=error_body[:500],
        )
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
        log.critical("Required env vars not set: check SEEDOR_API_KEY and SEEDOR_TENANT_ID")
        raise SystemExit(1)

    snapshot = fetch_snapshot()
    write_snapshot(snapshot)

    w = len(snapshot.get("workers", []))
    f = len(snapshot.get("fields", []))
    t = len(snapshot.get("tasks", []))

    log.info(
        "Snapshot synced",
        generated_at=snapshot.get("generated_at", "?"),
        workers=w,
        fields=f,
        tasks=t,
        path=str(SNAPSHOT_PATH),
    )


def push_updates() -> None:
    """Push pending updates from updates_queue.json to the Seedor API.
    Events that fail after retries are moved to the dead-letter queue.
    """
    if not UPDATES_PATH.exists():
        log.info("No updates file found")
        return

    with open(UPDATES_PATH, "r", encoding="utf-8") as f:
        try:
            queue = json.load(f)
        except json.JSONDecodeError:
            log.warning("updates_queue.json is malformed, skipping")
            return

    events = queue.get("events", [])
    if not events:
        log.info("No events in queue")
        return

    log.info("Pushing events to API", count=len(events))

    # Process events individually so failures don't block the whole batch
    succeeded = 0
    failed = 0

    for event in events:
        try:
            result = _api_request("POST", "/api/telegram/updates", {"events": [event]})
            processed = result.get("processed", 0)
            if processed > 0:
                succeeded += 1
                log.info(
                    "Event pushed successfully",
                    event_type=event.get("type"),
                )
            else:
                errors = result.get("errors", [])
                log.warning(
                    "Event push returned 0 processed",
                    event_type=event.get("type"),
                    errors=errors,
                )
                dlq.add(event, error=f"API returned 0 processed: {errors}")
                failed += 1
        except Exception as e:
            log.error(
                "Event push failed after retries",
                event_type=event.get("type"),
                error=str(e),
            )
            dlq.add(event, error=str(e), retry_count=3)
            failed += 1

    # Clear the queue (failed events are now in DLQ)
    with open(UPDATES_PATH, "w", encoding="utf-8") as f:
        json.dump({"events": []}, f, indent=2, ensure_ascii=False)

    log.info(
        "Push complete",
        succeeded=succeeded,
        failed=failed,
        dlq_size=dlq.size(),
    )


def show_dlq_stats() -> None:
    """Display dead-letter queue statistics."""
    size = dlq.size()
    log.info("Dead-letter queue stats", total_events=size)

    if size > 0:
        events = dlq.peek(limit=5)
        for i, entry in enumerate(events):
            log.info(
                f"DLQ event #{i + 1}",
                event_type=entry.get("original_event", {}).get("type"),
                error=entry.get("error"),
                failed_at=entry.get("failed_at"),
                retry_count=entry.get("retry_count"),
            )

        if size > 5:
            log.info(f"... and {size - 5} more events")


def run_daemon() -> None:
    """Run sync_once every 60 seconds using schedule."""
    import schedule
    import time

    SYNC_INTERVAL = int(os.environ.get("SEEDOR_SYNC_INTERVAL_SECONDS", "60"))
    PUSH_INTERVAL = int(os.environ.get("SEEDOR_PUSH_INTERVAL_MINUTES", "5"))

    log.info(
        "Daemon starting",
        sync_interval_seconds=SYNC_INTERVAL,
        push_interval_minutes=PUSH_INTERVAL,
    )

    sync_once()
    schedule.every(SYNC_INTERVAL).seconds.do(_safe_sync)
    schedule.every(PUSH_INTERVAL).minutes.do(_safe_push)

    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        log.info("Daemon stopped by user")


def _safe_sync() -> None:
    """Wrapper for sync_once that catches and logs errors."""
    try:
        sync_once()
    except Exception as e:
        log.error("Sync cycle failed", error=str(e))


def _safe_push() -> None:
    """Wrapper for push_updates that catches and logs errors."""
    try:
        push_updates()
    except Exception as e:
        log.error("Push cycle failed", error=str(e))


# ─── CLI ───────────────────────────────────────────────────
if __name__ == "__main__":
    if "--dlq" in sys.argv:
        show_dlq_stats()
    elif "--push" in sys.argv:
        push_updates()
    elif "--daemon" in sys.argv:
        run_daemon()
    else:
        sync_once()
