"""
logger.py — Structured JSON Logging for Seedor Bot
====================================================
Replaces print() and basic logging with structured JSON output.
Each log line is a valid JSON object with context fields.

Usage:
    from logger import get_logger
    log = get_logger("sync_service")
    log.info("Snapshot refreshed", tenant_id="abc", workers=12)
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any


class JSONFormatter(logging.Formatter):
    """Formats log records as single-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add extra context fields (passed via log.info("msg", extra={...}))
        # We use a custom attribute `ctx` to avoid conflicts with LogRecord attrs
        ctx = getattr(record, "ctx", None)
        if ctx and isinstance(ctx, dict):
            log_entry["context"] = ctx

        # Add exception info if present
        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
            }

        return json.dumps(log_entry, ensure_ascii=False, default=str)


class ContextLogger:
    """Wrapper around stdlib logger that supports structured context fields.

    Usage:
        log = get_logger("bot")
        log.info("Worker authenticated", worker_id="w1", chat_id=123)
        log.error("API call failed", tenant_id="abc", error="timeout")
    """

    def __init__(self, logger: logging.Logger):
        self._logger = logger

    def _log(self, level: int, message: str, **kwargs: Any) -> None:
        """Log with context fields as keyword arguments."""
        extra = {"ctx": kwargs} if kwargs else {}
        self._logger.log(level, message, extra=extra)

    def debug(self, message: str, **kwargs: Any) -> None:
        self._log(logging.DEBUG, message, **kwargs)

    def info(self, message: str, **kwargs: Any) -> None:
        self._log(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs: Any) -> None:
        self._log(logging.WARNING, message, **kwargs)

    def error(self, message: str, **kwargs: Any) -> None:
        self._log(logging.ERROR, message, **kwargs)

    def critical(self, message: str, **kwargs: Any) -> None:
        self._log(logging.CRITICAL, message, **kwargs)

    def exception(self, message: str, **kwargs: Any) -> None:
        """Log error with exception traceback."""
        extra = {"ctx": kwargs} if kwargs else {}
        self._logger.exception(message, extra=extra)


# ─── Module-level setup ─────────────────────────────────

_configured = False


def _configure_root() -> None:
    """Configure root logger once. Idempotent."""
    global _configured
    if _configured:
        return

    log_format = os.environ.get("LOG_FORMAT", "json").lower()
    log_level = os.environ.get("LOG_LEVEL", "INFO").upper()

    root = logging.getLogger()
    root.setLevel(getattr(logging, log_level, logging.INFO))

    # Remove any existing handlers
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)

    if log_format == "json":
        handler.setFormatter(JSONFormatter())
    else:
        # Human-readable fallback (useful for local dev)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s [%(name)s] %(levelname)s — %(message)s"
        ))

    root.addHandler(handler)

    # Suppress noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("telegram").setLevel(logging.WARNING)
    logging.getLogger("telegram.ext").setLevel(logging.WARNING)

    _configured = True


def get_logger(name: str) -> ContextLogger:
    """Get a structured logger with context support.

    Args:
        name: Logger name (e.g., "bot", "sync", "notifications")

    Returns:
        ContextLogger wrapping a stdlib Logger
    """
    _configure_root()
    return ContextLogger(logging.getLogger(f"seedor.{name}"))
