"""
retry.py — Retry with Exponential Backoff + Dead-Letter Queue
==============================================================
Provides a decorator for retrying failed operations and a dead-letter
queue for events that fail after all retries.

Usage:
    from retry import retry_with_backoff, DeadLetterQueue

    @retry_with_backoff(max_retries=3, base_delay=1.0)
    def call_api():
        ...

    dlq = DeadLetterQueue(Path("data/dead_letter.json"))
    dlq.add(event, error="timeout after 3 retries")
"""

import json
import os
import tempfile
import time
import functools
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional, TypeVar

from logger import get_logger

log = get_logger("retry")

T = TypeVar("T")


def retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    retryable_exceptions: tuple = (Exception,),
) -> Callable:
    """Decorator that retries a function with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts (0 = no retries)
        base_delay: Initial delay in seconds before first retry
        max_delay: Maximum delay cap in seconds
        backoff_factor: Multiplier for each subsequent delay
        retryable_exceptions: Tuple of exception types to retry on

    Example:
        @retry_with_backoff(max_retries=3, base_delay=1.0)
        def fetch_data():
            response = urllib.request.urlopen(url)
            return response.read()
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exception: Optional[Exception] = None
            delay = base_delay

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e

                    if attempt == max_retries:
                        log.error(
                            "All retries exhausted",
                            function=func.__name__,
                            attempt=attempt + 1,
                            max_retries=max_retries,
                            error=str(e),
                        )
                        raise

                    log.warning(
                        "Retrying after failure",
                        function=func.__name__,
                        attempt=attempt + 1,
                        max_retries=max_retries,
                        delay_seconds=delay,
                        error=str(e),
                    )

                    time.sleep(delay)
                    delay = min(delay * backoff_factor, max_delay)

            # Should not reach here, but satisfy type checker
            raise last_exception  # type: ignore[misc]

        return wrapper
    return decorator


class DeadLetterQueue:
    """Persistent dead-letter queue for events that failed after all retries.

    Events are stored in a JSON file and can be manually inspected,
    retried, or purged.

    File format:
    {
        "events": [
            {
                "original_event": {...},
                "error": "description",
                "failed_at": "2026-03-04T12:00:00Z",
                "retry_count": 3
            }
        ]
    }
    """

    def __init__(self, path: Path):
        self._path = path
        self._path.parent.mkdir(parents=True, exist_ok=True)

    def add(self, event: dict, error: str, retry_count: int = 0) -> None:
        """Add a failed event to the dead-letter queue."""
        events = self._load()
        events.append({
            "original_event": event,
            "error": error,
            "failed_at": datetime.now(timezone.utc).isoformat(),
            "retry_count": retry_count,
        })
        self._save(events)
        log.warning(
            "Event moved to dead-letter queue",
            event_type=event.get("type", "unknown"),
            error=error,
            dlq_size=len(events),
        )

    def peek(self, limit: int = 10) -> list[dict]:
        """View events in the queue without removing them."""
        events = self._load()
        return events[:limit]

    def size(self) -> int:
        """Return the number of events in the queue."""
        return len(self._load())

    def pop(self, count: int = 1) -> list[dict]:
        """Remove and return events from the front of the queue."""
        events = self._load()
        popped = events[:count]
        remaining = events[count:]
        self._save(remaining)
        return popped

    def clear(self) -> int:
        """Clear all events. Returns count of cleared events."""
        events = self._load()
        count = len(events)
        self._save([])
        return count

    def _load(self) -> list[dict]:
        if not self._path.exists():
            return []
        try:
            with open(self._path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get("events", [])
        except (json.JSONDecodeError, OSError):
            return []

    def _save(self, events: list[dict]) -> None:
        """Atomically write events to disk."""
        fd, tmp_path = tempfile.mkstemp(
            dir=str(self._path.parent), suffix=".tmp"
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(
                    {"events": events}, f, indent=2, ensure_ascii=False
                )
            os.replace(tmp_path, str(self._path))
        except Exception:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise
