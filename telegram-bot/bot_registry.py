"""
bot_registry.py — Central tenant/worker registry for Seedor Bot
================================================================
Single source of truth for which tenants and workers are active.
Wraps the session dicts and provides a clean API for handlers.
"""

import json
import os
from typing import Optional

from logger import get_logger

log = get_logger("registry")


class BotRegistry:
    """Manages worker sessions, selected tenants, and available tenants per chat."""

    def __init__(self, sessions_path: str):
        self._sessions_path = sessions_path
        self._workers: dict[int, str] = {}       # chat_id → worker_id
        self._phones: dict[int, str] = {}         # chat_id → normalized phone
        self._tenants: dict[int, str] = {}        # chat_id → selected tenant_id
        self._available: dict[int, list[dict]] = {}  # chat_id → list of {worker_id, tenant_id, ...}
        self._load()

    # ─── Persistence ──────────────────────────────────────

    def _load(self) -> None:
        if not os.path.exists(self._sessions_path):
            return
        try:
            with open(self._sessions_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            for key, value in raw.items():
                chat_id = int(key)
                if isinstance(value, str):
                    self._workers[chat_id] = value
                elif isinstance(value, dict):
                    wid = value.get("worker_id") or value.get("workerId")
                    if wid:
                        self._workers[chat_id] = wid
                    phone = value.get("phone")
                    if phone:
                        self._phones[chat_id] = phone
                    tid = value.get("tenant_id")
                    if tid:
                        self._tenants[chat_id] = tid
                    avail = value.get("available_tenants", [])
                    if avail:
                        self._available[chat_id] = avail
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            log.warning("Failed to load sessions", error=str(e))

    def save(self) -> None:
        os.makedirs(os.path.dirname(self._sessions_path), exist_ok=True)
        payload: dict[str, dict] = {}
        for chat_id, worker_id in self._workers.items():
            entry: dict = {"worker_id": worker_id}
            phone = self._phones.get(chat_id)
            if phone:
                entry["phone"] = phone
            tid = self._tenants.get(chat_id)
            if tid:
                entry["tenant_id"] = tid
            avail = self._available.get(chat_id)
            if avail:
                entry["available_tenants"] = avail
            payload[str(chat_id)] = entry
        with open(self._sessions_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    # ─── Queries ──────────────────────────────────────────

    def get_worker_id(self, chat_id: int) -> Optional[str]:
        return self._workers.get(chat_id)

    def get_phone(self, chat_id: int) -> Optional[str]:
        return self._phones.get(chat_id)

    def get_tenant_id(self, chat_id: int) -> Optional[str]:
        return self._tenants.get(chat_id)

    def get_available_tenants(self, chat_id: int) -> list[dict]:
        return self._available.get(chat_id, [])

    def is_authenticated(self, chat_id: int) -> bool:
        return chat_id in self._workers and chat_id in self._tenants

    def is_multi_tenant(self, chat_id: int) -> bool:
        return len(self._available.get(chat_id, [])) > 1

    def get_active_tenant_ids(self) -> set[str]:
        """Return all tenant IDs with at least one active session."""
        return set(self._tenants.values())

    # ─── Mutations ────────────────────────────────────────

    def register(
        self,
        chat_id: int,
        worker_id: str,
        tenant_id: str,
        phone: str = "",
        available_tenants: Optional[list[dict]] = None,
    ) -> None:
        self._workers[chat_id] = worker_id
        self._tenants[chat_id] = tenant_id
        if phone:
            self._phones[chat_id] = phone
        if available_tenants is not None:
            self._available[chat_id] = available_tenants
        self.save()

    def switch_tenant(self, chat_id: int, tenant_id: str, worker_id: str) -> None:
        self._workers[chat_id] = worker_id
        self._tenants[chat_id] = tenant_id
        self.save()

    def set_phone(self, chat_id: int, phone: str) -> None:
        self._phones[chat_id] = phone

    def set_available_tenants(self, chat_id: int, tenants: list[dict]) -> None:
        self._available[chat_id] = tenants

    def unregister(self, chat_id: int) -> None:
        self._workers.pop(chat_id, None)
        self._phones.pop(chat_id, None)
        self._tenants.pop(chat_id, None)
        self._available.pop(chat_id, None)
        self.save()

    # ─── Legacy compat (dict-like access used by bot.py) ──

    @property
    def workers(self) -> dict[int, str]:
        return self._workers

    @property
    def phones(self) -> dict[int, str]:
        return self._phones

    @property
    def tenants(self) -> dict[int, str]:
        return self._tenants

    @property
    def available(self) -> dict[int, list[dict]]:
        return self._available
