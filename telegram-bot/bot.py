"""
bot.py — Seedor Telegram Bot (Async)
=====================================
Reads from data/snapshot.json (NEVER from the production DB).
Writes worker actions to data/updates_queue.json.

Phase 0 improvements:
  - Structured JSON logging (logger.py)
  - Retry with exponential backoff (retry.py)
  - ConversationHandler for multi-step flows

Usage:
    export TELEGRAM_BOT_TOKEN="your-token-here"
    python bot.py
"""

import asyncio
import json
import os
import re
import tempfile
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ─── Load .env (minimal, no dependency) ────────────────────
def _load_dotenv(path: str) -> None:
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

_load_dotenv(str(Path(__file__).parent / ".env"))

# ─── Structured logging ──────────────────────────────────
from logger import get_logger
from retry import retry_with_backoff, DeadLetterQueue
from bot_registry import BotRegistry

log = get_logger("bot")

from telegram import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    Update,
)
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

# ─── Paths ─────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
SNAPSHOT_PATH = os.path.join(DATA_DIR, "snapshot.json")  # legacy / fallback
UPDATES_PATH = os.path.join(DATA_DIR, "updates_queue.json")
SESSIONS_PATH = os.path.join(DATA_DIR, "sessions.json")
NOTIFICATIONS_PATH = os.path.join(DATA_DIR, "notifications_queue.json")
DLQ_PATH = Path(DATA_DIR) / "dead_letter.json"


def _snapshot_path(tenant_id: str = "") -> str:
    """Return the per-tenant snapshot path, or the global fallback."""
    if tenant_id:
        safe = re.sub(r"[^a-zA-Z0-9_-]", "_", tenant_id)
        return os.path.join(DATA_DIR, f"snapshot_{safe}.json")
    return SNAPSHOT_PATH

# ─── Dead-letter queue ────────────────────────────────────
dlq = DeadLetterQueue(DLQ_PATH)

# ─── Registry (replaces raw session dicts) ────────────────
registry = BotRegistry(SESSIONS_PATH)

# Legacy aliases for code that still uses the old names
_authenticated_workers = registry.workers
_authenticated_phones = registry.phones
_selected_tenants = registry.tenants
_worker_tenants = registry.available

def _save_sessions() -> None:
    registry.save()

# task_id → new status (local overrides for immediate UX)
_local_task_overrides: dict[str, str] = {}


# ─── API Config ────────────────────────────────────────────
API_URL = os.environ.get("SEEDOR_API_URL", "http://localhost:3000")
API_KEY = os.environ.get("SEEDOR_API_KEY", "")
TENANT_ID = os.environ.get("SEEDOR_TENANT_ID", "")
SNAPSHOT_TTL_SECONDS = int(os.environ.get("SEEDOR_SNAPSHOT_TTL_SECONDS", "30"))
NOTIFICATION_POLL_SECONDS = int(os.environ.get("SEEDOR_NOTIFICATION_POLL_SECONDS", "15"))


# ═══════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════

def _load_snapshot(tenant_id: str = "") -> dict:
    """Load and return the snapshot for the given tenant (or global fallback)."""
    path = _snapshot_path(tenant_id)
    if tenant_id and not os.path.exists(path):
        path = SNAPSHOT_PATH  # fall back to global if tenant file missing
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_snapshot(snapshot: dict, tenant_id: str = "") -> None:
    """Atomically write snapshot to disk for the given tenant."""
    path = _snapshot_path(tenant_id)
    os.makedirs(DATA_DIR, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=DATA_DIR, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, indent=2, ensure_ascii=False)
        os.replace(tmp_path, path)
    except Exception:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise


def _should_refresh_snapshot(tenant_id: str = "") -> bool:
    """Return True if the tenant's snapshot is missing or stale."""
    path = _snapshot_path(tenant_id)
    if not os.path.exists(path):
        if tenant_id and os.path.exists(SNAPSHOT_PATH):
            path = SNAPSHOT_PATH  # fall back to global
        else:
            return True
    try:
        age = datetime.now().timestamp() - os.path.getmtime(path)
    except OSError:
        return True
    return age > SNAPSHOT_TTL_SECONDS


@retry_with_backoff(max_retries=3, base_delay=1.0, max_delay=15.0)
def _api_get(url: str, timeout: int = 15) -> dict:
    """Make an authenticated GET request to the Seedor API with retry."""
    import urllib.request
    req = urllib.request.Request(
        url,
        method="GET",
        headers={"Authorization": f"Bearer {API_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


@retry_with_backoff(max_retries=3, base_delay=1.0, max_delay=15.0)
def _api_post(url: str, payload: dict, timeout: int = 10) -> dict:
    """Make an authenticated POST request to the Seedor API with retry."""
    import urllib.request
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


async def _async_refresh_snapshot(tenant_id: str = "") -> bool:
    """Non-blocking wrapper — runs the sync HTTP call in a thread pool."""
    return await asyncio.to_thread(_refresh_snapshot_from_api, tenant_id)


def _refresh_snapshot_from_api(tenant_id: str = "") -> bool:
    """Fetch snapshot from API and update local file. Returns True on success."""
    tid = tenant_id or TENANT_ID
    if not API_KEY or not tid:
        log.warning("Cannot refresh snapshot: missing required env vars")
        return False

    url = f"{API_URL.rstrip('/')}/api/telegram/snapshot?tenantId={tid}"

    try:
        snapshot = _api_get(url)
        _write_snapshot(snapshot, tid)
        log.info(
            "Snapshot refreshed",
            tenant_id=tid,
            workers=len(snapshot.get("workers", [])),
            tasks=len(snapshot.get("tasks", [])),
        )
        return True
    except Exception as e:
        log.error("Snapshot refresh failed after retries", error=str(e))
        return False


def _api_lookup_worker_by_phone(phone: str) -> list[dict]:
    """Lookup worker by phone across all tenants via API."""
    if not API_KEY:
        return []
    normalized = _normalize_phone(phone)
    url = f"{API_URL.rstrip('/')}/api/telegram/worker-lookup?phone={normalized}"
    try:
        result = _api_get(url)
        return result.get("workers", [])
    except Exception as e:
        log.error("Worker lookup failed", error=str(e), phone=phone[:6] + "***")
        return []


def _push_event_to_api(event: dict) -> bool:
    """Push a single event directly to the Seedor API. Returns True on success."""
    if not API_KEY:
        log.warning("Cannot push event: missing API key env var")
        return False

    url = f"{API_URL.rstrip('/')}/api/telegram/updates"

    try:
        result = _api_post(url, {"events": [event]})
        log.info(
            "Event pushed to API",
            event_type=event.get("type"),
            result=result,
        )
        return True
    except Exception as e:
        log.error(
            "Event push failed after retries",
            event_type=event.get("type"),
            error=str(e),
        )
        # Move to dead-letter queue after all retries exhausted
        dlq.add(event, error=str(e), retry_count=3)
        return False


# CUID format: c + 24 lowercase alphanumeric chars (Prisma default IDs)
_CUID_RE = re.compile(r"^c[a-z0-9]{20,30}$")


def _is_valid_id(value: str) -> bool:
    """Validate that value looks like a Prisma CUID."""
    return bool(value and _CUID_RE.match(value))


def _append_event(event: dict) -> None:
    """Push event to API in real-time, and also save to queue file as backup."""
    pushed = _push_event_to_api(event)

    os.makedirs(DATA_DIR, exist_ok=True)

    queue = {"events": []}
    if os.path.exists(UPDATES_PATH):
        with open(UPDATES_PATH, "r", encoding="utf-8") as f:
            try:
                queue = json.load(f)
            except json.JSONDecodeError:
                queue = {"events": []}

    # Only add to queue if API push failed
    if not pushed:
        queue["events"].append(event)

    with open(UPDATES_PATH, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2, ensure_ascii=False)


def _normalize_phone(raw: str) -> str:
    """Normalize phone numbers for comparison.
    Strips spaces, dashes, ensures a leading '+',
    and removes the Argentine mobile '9' prefix (+54 9 → +54).
    """
    cleaned = raw.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not cleaned.startswith("+"):
        cleaned = "+" + cleaned
    if cleaned.startswith("+549") and len(cleaned) > 6:
        cleaned = "+54" + cleaned[4:]
    return cleaned


def _find_workers_by_phone(snapshot: dict, phone: str) -> list[dict]:
    """Return all workers matching the normalized phone."""
    normalized = _normalize_phone(phone)
    return [
        w for w in snapshot.get("workers", [])
        if w.get("phone") and _normalize_phone(w["phone"]) == normalized
    ]


def _count_active_tasks(snapshot: dict, worker_id: str) -> int:
    """Count active (non-completed) tasks assigned to a worker."""
    count = 0
    for t in snapshot.get("tasks", []):
        if worker_id not in t.get("assigned_worker_ids", []):
            continue
        status = _local_task_overrides.get(t["id"], t.get("status"))
        if status != "COMPLETED":
            count += 1
    return count


def _find_worker_by_phone(snapshot: dict, phone: str) -> Optional[dict]:
    """Search snapshot workers by normalized phone."""
    matches = _find_workers_by_phone(snapshot, phone)
    if not matches:
        return None
    if len(matches) == 1:
        return matches[0]
    task_counts = {w["id"]: _count_active_tasks(snapshot, w["id"]) for w in matches}
    return max(matches, key=lambda w: task_counts.get(w["id"], 0))


def _get_worker_name(worker: dict) -> str:
    return f"{worker['first_name']} {worker['last_name']}"


def _get_lot_display(snapshot: dict, lot_id: str) -> str:
    """Return 'LotName (FieldName)' for display."""
    for field in snapshot.get("fields", []):
        for lot in field.get("lots", []):
            if lot["id"] == lot_id:
                return f"{lot['name']} — {field['name']}"
    return lot_id


def _load_notification_events() -> list[dict]:
    if not os.path.exists(NOTIFICATIONS_PATH):
        return []
    try:
        with open(NOTIFICATIONS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        events = data.get("events", [])
        if isinstance(events, list):
            return events
    except (json.JSONDecodeError, OSError, AttributeError):
        pass
    return []


def _save_notification_events(events: list[dict]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=DATA_DIR, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump({"events": events}, f, indent=2, ensure_ascii=False)
        os.replace(tmp_path, NOTIFICATIONS_PATH)
    except Exception:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise


def _get_chat_ids_for_worker(worker: dict) -> list[int]:
    chat_ids: set[int] = set()
    worker_id = worker.get("id")
    if worker_id:
        for chat_id, stored_worker_id in _authenticated_workers.items():
            if stored_worker_id == worker_id:
                chat_ids.add(chat_id)

    if not chat_ids:
        phone = worker.get("phone")
        if phone:
            normalized = _normalize_phone(phone)
            for chat_id, stored_phone in _authenticated_phones.items():
                if _normalize_phone(stored_phone) == normalized:
                    chat_ids.add(chat_id)

    return list(chat_ids)


async def _send_to_chat_ids(bot, chat_ids: list[int], message: str) -> bool:
    sent = False
    for chat_id in chat_ids:
        try:
            await bot.send_message(chat_id=chat_id, text=message)
            sent = True
        except Exception as e:
            log.warning(
                "Failed to send notification",
                chat_id=chat_id,
                error=str(e),
            )
    return sent


async def _process_notification_queue(app) -> None:
    events = _load_notification_events()
    if not events:
        return

    retry_events: list[dict] = []

    for event in events:
        if not isinstance(event, dict):
            continue
        if event.get("type") != "TASK_ASSIGNED":
            retry_events.append(event)
            continue

        message = event.get("message")
        workers = event.get("workers")
        if not message or not isinstance(workers, list):
            continue

        pending_workers: list[dict] = []
        for worker in workers:
            if not isinstance(worker, dict):
                continue
            chat_ids = _get_chat_ids_for_worker(worker)
            if not chat_ids:
                pending_workers.append(worker)
                continue
            sent = await _send_to_chat_ids(app.bot, chat_ids, message)
            if not sent:
                pending_workers.append(worker)

        if pending_workers:
            retry_events.append({**event, "workers": pending_workers})

    _save_notification_events(retry_events)


async def _notification_poller(app) -> None:
    log.info("Notification poller started", interval_seconds=NOTIFICATION_POLL_SECONDS)
    while True:
        try:
            await _process_notification_queue(app)
        except Exception as e:
            log.error("Notification poller error", error=str(e))
        await asyncio.sleep(NOTIFICATION_POLL_SECONDS)


def _main_menu_keyboard(chat_id: int = 0) -> ReplyKeyboardMarkup:
    """Return the main reply keyboard for authenticated workers."""
    buttons = [
        [KeyboardButton("📋 Mis Tareas")],
        [KeyboardButton("📍 Check-in", request_location=True)],
    ]
    # Show 'Cambiar Empresa' if worker belongs to 2+ tenants
    if chat_id and len(_worker_tenants.get(chat_id, [])) > 1:
        buttons.append([KeyboardButton("🏢 Cambiar Empresa")])
    return ReplyKeyboardMarkup(buttons, resize_keyboard=True)


# ═══════════════════════════════════════════════════════════
# CONVERSATION STATES
# ═══════════════════════════════════════════════════════════
# Auth conversation
AUTH_WAITING_CONTACT = 0
AUTH_WAITING_TENANT = 1

# Task completion conversation (future expansion)
TASK_SELECT, TASK_CONFIRM = range(10, 12)


# ═══════════════════════════════════════════════════════════
# HANDLERS — AUTH (ConversationHandler)
# ═══════════════════════════════════════════════════════════

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle /start — ask the user to share their contact."""
    chat_id = update.message.chat_id

    # If already authenticated, refresh tenants and show main menu
    if chat_id in _authenticated_workers and chat_id in _selected_tenants:
        # Refresh available tenants from API (user may have been added to a new company)
        phone = _authenticated_phones.get(chat_id)
        if phone:
            fresh = await asyncio.to_thread(_api_lookup_worker_by_phone, phone)
            if fresh and len(fresh) != len(_worker_tenants.get(chat_id, [])):
                _worker_tenants[chat_id] = fresh
                _save_sessions()
                log.info(
                    "Refreshed available tenants",
                    chat_id=chat_id,
                    count=len(fresh),
                )
        await update.message.reply_text(
            "🌿 Ya estás identificado. Usá el menú para continuar.",
            reply_markup=_main_menu_keyboard(chat_id),
        )
        return ConversationHandler.END

    keyboard = ReplyKeyboardMarkup(
        [[KeyboardButton("📱 Compartir mi contacto", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )
    await update.message.reply_text(
        "🌿 *Bienvenido a Seedor Bot*\n\n"
        "Para comenzar, compartí tu contacto usando el botón de abajo.\n"
        "Esto nos permite verificar tu identidad como trabajador.",
        parse_mode="Markdown",
        reply_markup=keyboard,
    )
    return AUTH_WAITING_CONTACT


async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Authenticate the worker via their shared phone number (cross-tenant)."""
    contact = update.message.contact
    if not contact or not contact.phone_number:
        await update.message.reply_text("❌ No se pudo leer tu contacto. Intentá de nuevo.")
        return AUTH_WAITING_CONTACT

    phone = contact.phone_number
    chat_id = update.message.chat_id
    log.info("Contact received", chat_id=chat_id, phone=phone[:6] + "***")
    # Try API lookup first (cross-tenant)
    api_workers = _api_lookup_worker_by_phone(phone)

    if not api_workers:
        # Fallback: search all known tenant snapshots (and global fallback)
        tenant_ids_to_check: list[str] = list(set(_selected_tenants.values()))
        if TENANT_ID and TENANT_ID not in tenant_ids_to_check:
            tenant_ids_to_check.append(TENANT_ID)
        if not tenant_ids_to_check:
            tenant_ids_to_check = [""]  # global snapshot only

        for tid_check in tenant_ids_to_check:
            if _should_refresh_snapshot(tid_check):
                await _async_refresh_snapshot(tid_check)
            try:
                snapshot = _load_snapshot(tid_check)
                worker = _find_worker_by_phone(snapshot, phone)
                if worker:
                    tenant = snapshot.get("tenant", {})
                    api_workers.append({
                        "worker_id": worker["id"],
                        "first_name": worker.get("first_name", ""),
                        "last_name": worker.get("last_name", ""),
                        "tenant_id": tenant.get("id", tid_check or TENANT_ID),
                        "tenant_name": tenant.get("name", "Empresa"),
                    })
            except FileNotFoundError:
                pass

    if not api_workers:
        log.info("Auth failed: phone not found", chat_id=chat_id)
        await update.message.reply_text(
            "❌ Tu número de teléfono no está registrado en el sistema.\n"
            "Contactá al supervisor para que te agreguen.",
            reply_markup=ReplyKeyboardRemove(),
        )
        return ConversationHandler.END

    _authenticated_phones[chat_id] = _normalize_phone(phone)
    _worker_tenants[chat_id] = api_workers

    if len(api_workers) == 1:
        # Single tenant — auto-select
        w = api_workers[0]
        _authenticated_workers[chat_id] = w["worker_id"]
        _selected_tenants[chat_id] = w["tenant_id"]
        _save_sessions()

        # Refresh snapshot for this tenant
        await _async_refresh_snapshot(w["tenant_id"])

        name = f"{w['first_name']} {w['last_name']}"
        tenant_name = w.get("tenant_name", "")

        log.info(
            "Worker authenticated (single tenant)",
            worker_id=w["worker_id"],
            tenant_id=w["tenant_id"],
            chat_id=chat_id,
        )

        await update.message.reply_text(
            f"✅ *¡Hola, {name}!*\n"
            f"🏢 Empresa: _{tenant_name}_\n\n"
            "Usá el menú para ver tus tareas o registrar tu presencia.",
            parse_mode="Markdown",
            reply_markup=_main_menu_keyboard(chat_id),
        )
        return ConversationHandler.END
    else:
        # Multiple tenants — show selector
        context.user_data["pending_workers"] = api_workers
        buttons = []
        for w in api_workers:
            label = f"🏢 {w['tenant_name']}"
            buttons.append([InlineKeyboardButton(label, callback_data=f"tenant:{w['tenant_id']}:{w['worker_id']}")])

        await update.message.reply_text(
            "🌿 *Pertenecés a varias empresas*\n\n"
            "Elegí desde cuál querés ver tus tareas:",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(buttons),
        )
        return AUTH_WAITING_TENANT


async def handle_tenant_selection(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle tenant selection from inline keyboard."""
    query = update.callback_query
    await query.answer()

    chat_id = query.message.chat_id
    data = query.data  # format: "tenant:{tenant_id}:{worker_id}"
    parts = data.split(":", 2)
    if len(parts) != 3:
        await query.edit_message_text("⚠️ Selección inválida. Usá /start.")
        return ConversationHandler.END

    _, tenant_id, worker_id = parts

    # Validate that the selected (tenant_id, worker_id) pair belongs to this chat
    # before trusting the callback_data to prevent crafted or reused callbacks.
    pending = context.user_data.get("pending_workers")
    candidates = (
        list(pending) if isinstance(pending, list) else []
    ) + _worker_tenants.get(chat_id, [])
    is_valid_pair = any(
        w.get("tenant_id") == tenant_id and w.get("worker_id") == worker_id
        for w in candidates
    )
    if not is_valid_pair:
        await query.edit_message_text("⚠️ Selección inválida o expirada. Usá /start.")
        return ConversationHandler.END

    _authenticated_workers[chat_id] = worker_id
    _selected_tenants[chat_id] = tenant_id
    _save_sessions()

    # Refresh snapshot for selected tenant
    await _async_refresh_snapshot(tenant_id)

    # Find tenant name
    tenant_name = tenant_id
    worker_name = ""
    for w in _worker_tenants.get(chat_id, []):
        if w["tenant_id"] == tenant_id:
            tenant_name = w.get("tenant_name", tenant_id)
            worker_name = f"{w['first_name']} {w['last_name']}"
            break

    log.info(
        "Worker authenticated (tenant selected)",
        worker_id=worker_id,
        tenant_id=tenant_id,
        chat_id=chat_id,
    )

    await query.edit_message_text(
        f"✅ *¡Hola, {worker_name}!*\n"
        f"🏢 Empresa: _{tenant_name}_\n\n"
        "Usá el menú para ver tus tareas o registrar tu presencia.",
        parse_mode="Markdown",
    )
    # Send menu keyboard via a new message (inline buttons + reply keyboard can't be in the same msg)
    await query.message.reply_text(
        "👇 Menú:",
        reply_markup=_main_menu_keyboard(chat_id),
    )
    return ConversationHandler.END


async def handle_change_company(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle 'Cambiar Empresa' button — re-show tenant selector."""
    chat_id = update.message.chat_id
    available = _worker_tenants.get(chat_id, [])

    if len(available) <= 1:
        await update.message.reply_text(
            "ℹ️ Solo pertenecés a una empresa.",
            reply_markup=_main_menu_keyboard(chat_id),
        )
        return

    buttons = []
    current_tenant = _selected_tenants.get(chat_id)
    for w in available:
        check = " ✅" if w["tenant_id"] == current_tenant else ""
        label = f"🏢 {w['tenant_name']}{check}"
        buttons.append([InlineKeyboardButton(label, callback_data=f"switch:{w['tenant_id']}:{w['worker_id']}")])

    await update.message.reply_text(
        "🏢 *Elegí la empresa:*",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(buttons),
    )


async def handle_switch_tenant(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle tenant switch from inline keyboard."""
    query = update.callback_query
    await query.answer()

    chat_id = query.message.chat_id
    data = query.data  # format: "switch:{tenant_id}:{worker_id}"
    parts = data.split(":", 2)
    if len(parts) != 3:
        await query.edit_message_text("⚠️ Selección inválida.")
        return

    _, tenant_id, worker_id = parts

    # Validate that the selected (tenant_id, worker_id) pair belongs to this chat.
    is_valid_pair = any(
        w.get("tenant_id") == tenant_id and w.get("worker_id") == worker_id
        for w in _worker_tenants.get(chat_id, [])
    )
    if not is_valid_pair:
        await query.edit_message_text("⚠️ Selección inválida o expirada. Usá /start.")
        return

    _authenticated_workers[chat_id] = worker_id
    _selected_tenants[chat_id] = tenant_id
    _save_sessions()

    # Refresh snapshot for selected tenant
    await _async_refresh_snapshot(tenant_id)

    # Find tenant name
    tenant_name = tenant_id
    for w in _worker_tenants.get(chat_id, []):
        if w["tenant_id"] == tenant_id:
            tenant_name = w.get("tenant_name", tenant_id)
            break

    log.info("Tenant switched", tenant_id=tenant_id, worker_id=worker_id, chat_id=chat_id)

    await query.edit_message_text(
        f"✅ Cambiaste a: *{tenant_name}*\n\n"
        "Usá '📋 Mis Tareas' para ver tus tareas.",
        parse_mode="Markdown",
    )


async def auth_timeout(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle conversation timeout during auth."""
    if update.message:
        await update.message.reply_text(
            "⏰ Se agotó el tiempo. Usá /start para intentar de nuevo.",
            reply_markup=ReplyKeyboardRemove(),
        )
    return ConversationHandler.END


# ═══════════════════════════════════════════════════════════
# HANDLERS — TASKS
# ═══════════════════════════════════════════════════════════

async def handle_my_tasks(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show the worker's assigned tasks with inline buttons."""
    chat_id = update.message.chat_id
    worker_id = _authenticated_workers.get(chat_id)

    if not worker_id:
        await update.message.reply_text(
            "⚠️ Primero necesitás identificarte. Usá /start"
        )
        return

    # Multi-tenant: show tenant selector first
    available = _worker_tenants.get(chat_id, [])
    if len(available) > 1:
        buttons = []
        for w in available:
            label = f"🏢 {w.get('tenant_name', w['tenant_id'])}"
            buttons.append([InlineKeyboardButton(
                label,
                callback_data=f"tasks_tenant:{w['tenant_id']}:{w['worker_id']}"
            )])
        await update.message.reply_text(
            "📋 *¿De qué empresa querés ver las tareas?*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(buttons),
        )
        return

    # Single tenant: show tasks directly
    user_tenant_id = _selected_tenants.get(chat_id, TENANT_ID)
    await _show_tasks_for_tenant(update.message, chat_id, worker_id, user_tenant_id)


async def handle_tasks_tenant_selection(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle tenant selection for task viewing (multi-tenant workers)."""
    query = update.callback_query
    await query.answer()

    chat_id = query.message.chat_id
    data = query.data  # format: "tasks_tenant:{tenant_id}:{worker_id}"
    parts = data.split(":", 2)
    if len(parts) != 3:
        await query.edit_message_text("⚠️ Selección inválida.")
        return

    _, tenant_id, worker_id = parts

    # Validate that the (tenant_id, worker_id) pair belongs to this chat
    valid_tenants = _worker_tenants.get(chat_id, [])
    if not any(
        w.get("tenant_id") == tenant_id and w.get("worker_id") == worker_id
        for w in valid_tenants
    ):
        await query.edit_message_text("⚠️ Selección inválida.")
        return

    # Update selected tenant so snapshot refresh uses the right one
    _authenticated_workers[chat_id] = worker_id
    _selected_tenants[chat_id] = tenant_id
    _save_sessions()

    # Find tenant name for the header
    tenant_name = tenant_id
    for w in _worker_tenants.get(chat_id, []):
        if w["tenant_id"] == tenant_id:
            tenant_name = w.get("tenant_name", tenant_id)
            break

    await query.edit_message_text(
        f"📋 Tareas de *{tenant_name}*:",
        parse_mode="Markdown",
    )

    await _show_tasks_for_tenant(query.message, chat_id, worker_id, tenant_id)


async def _show_tasks_for_tenant(message, chat_id: int, worker_id: str, tenant_id: str) -> None:
    """Load and display tasks for a specific tenant. Used by both single and multi-tenant flows."""
    refreshed = False
    if _should_refresh_snapshot(tenant_id):
        refreshed = await _async_refresh_snapshot(tenant_id)

    def _resolve_active_tasks(snapshot: dict, worker_id: str) -> tuple[Optional[dict], str, list[dict]]:
        worker = next(
            (w for w in snapshot.get("workers", []) if w["id"] == worker_id),
            None,
        )
        if worker is None:
            return None, worker_id, []

        if worker.get("phone"):
            normalized_phone = _normalize_phone(worker["phone"])
            if _authenticated_phones.get(chat_id) != normalized_phone:
                _authenticated_phones[chat_id] = normalized_phone
                _save_sessions()

        def _active_tasks_for(target_worker_id: str) -> list[dict]:
            tasks = [
                t for t in snapshot.get("tasks", [])
                if target_worker_id in t.get("assigned_worker_ids", [])
            ]
            for task in tasks:
                if task["id"] in _local_task_overrides:
                    task["status"] = _local_task_overrides[task["id"]]
            return [t for t in tasks if t["status"] != "COMPLETED"]

        active_tasks = _active_tasks_for(worker_id)

        if not active_tasks:
            phone = worker.get("phone")
            if phone:
                matches = _find_workers_by_phone(snapshot, phone)
                if len(matches) > 1:
                    task_counts = {w["id"]: _count_active_tasks(snapshot, w["id"]) for w in matches}
                    best = max(matches, key=lambda w: task_counts.get(w["id"], 0))
                    if best["id"] != worker_id and task_counts.get(best["id"], 0) > 0:
                        worker_id = best["id"]
                        _authenticated_workers[chat_id] = worker_id
                        _save_sessions()
                        active_tasks = _active_tasks_for(worker_id)

        return worker, worker_id, active_tasks

    try:
        snapshot = _load_snapshot(tenant_id)
    except FileNotFoundError:
        await message.reply_text("⚠️ Snapshot no disponible.")
        return

    worker, worker_id, active_tasks = _resolve_active_tasks(snapshot, worker_id)
    if worker is None:
        # Snapshot may have been overwritten by another tenant — force refresh for this user.
        if tenant_id and await _async_refresh_snapshot(tenant_id):
            try:
                snapshot = _load_snapshot(tenant_id)
                worker, worker_id, active_tasks = _resolve_active_tasks(snapshot, worker_id)
            except FileNotFoundError:
                pass

    if worker is None:
        _authenticated_workers.pop(chat_id, None)
        _authenticated_phones.pop(chat_id, None)
        _save_sessions()
        await message.reply_text(
            "⚠️ Tu sesión está desactualizada. Usá /start para identificarte de nuevo.",
            reply_markup=ReplyKeyboardRemove(),
        )
        return

    if not active_tasks and not refreshed:
        if await _async_refresh_snapshot(tenant_id):
            try:
                snapshot = _load_snapshot(tenant_id)
            except FileNotFoundError:
                snapshot = None
            if snapshot:
                worker, worker_id, active_tasks = _resolve_active_tasks(snapshot, worker_id)
                if worker is None:
                    _authenticated_workers.pop(chat_id, None)
                    _authenticated_phones.pop(chat_id, None)
                    _save_sessions()
                    await message.reply_text(
                        "⚠️ Tu sesión está desactualizada. Usá /start para identificarte de nuevo.",
                        reply_markup=ReplyKeyboardRemove(),
                    )
                    return

    if not active_tasks:
        await message.reply_text(
            "🎉 ¡No tenés tareas pendientes! Buen trabajo.",
            reply_markup=_main_menu_keyboard(chat_id),
        )
        return

    # Build message
    status_emoji = {
        "PENDING": "🟡",
        "IN_PROGRESS": "🔵",
        "LATE": "🔴",
    }

    def _fmt_due(raw_date: str) -> str:
        try:
            dt = datetime.strptime(raw_date[:10], "%Y-%m-%d")
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            diff = (dt - today).days
            date_str = f"{dt.day}/{dt.month}/{dt.year}"
            if diff < 0:
                return f"⚠️ Vencida ({date_str})"
            elif diff == 0:
                return "🔔 Hoy"
            elif diff == 1:
                return "📅 Mañana"
            elif diff <= 7:
                return f"📅 En {diff} días ({date_str})"
            else:
                return f"📅 {date_str}"
        except (ValueError, TypeError):
            return raw_date

    status_label = {
        "PENDING": "Pendiente",
        "IN_PROGRESS": "En progreso",
        "LATE": "Atrasada",
    }

    # Build a lookup dict for O(1) lot resolution instead of nested loops per task.
    lot_lookup: dict[str, tuple[str, str]] = {}
    for field in snapshot.get("fields", []):
        for lot in field.get("lots", []):
            lot_lookup[lot["id"]] = (field["name"], lot["name"])

    field_groups: dict[str, 'OrderedDict[str, list[dict]]'] = {}

    for t in active_tasks:
        lot_ids = t.get("lot_ids", [])
        if not lot_ids:
            field_groups.setdefault("Sin campo", OrderedDict()).setdefault("Sin lote", []).append(t)
        else:
            for lid in lot_ids:
                field_name, lot_name = lot_lookup.get(lid, ("Sin campo", lid))
                field_groups.setdefault(field_name, OrderedDict()).setdefault(lot_name, []).append(t)

    total = len(active_tasks)
    num_fields = len(field_groups)

    log.info(
        "Tasks listed",
        worker_id=worker_id,
        chat_id=chat_id,
        total_tasks=total,
    )

    await message.reply_text(
        f"📋 *Tenés {total} tareas en {num_fields} campo{'s' if num_fields != 1 else ''}:*",
        parse_mode="Markdown",
        reply_markup=_main_menu_keyboard(chat_id),
    )

    for field_name, lots in field_groups.items():
        lines = [f"🏡  *{field_name}*\n{'━' * 20}\n"]
        buttons = []

        for lot_name, tasks in lots.items():
            lines.append(f"🌱 *{lot_name}*\n")

            for t in tasks:
                emoji = status_emoji.get(t["status"], "⚪")
                label = status_label.get(t["status"], t["status"])

                lines.append(
                    f"  {emoji} *{t['description']}*\n"
                    f"       Tipo: _{t['task_type']}_\n"
                    f"       Estado: {label}\n"
                    f"       Vence: {_fmt_due(t['due_date'])}\n"
                )
                buttons.append(
                    [InlineKeyboardButton(
                        f"✅ Completar: {t['description'][:30]}",
                        callback_data=f"done:{t['id']}",
                    )]
                )

        await message.reply_text(
            "\n".join(lines),
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(buttons),
        )


async def handle_task_done(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle inline button: mark a task as completed."""
    query = update.callback_query
    await query.answer()

    chat_id = query.message.chat_id
    worker_id = _authenticated_workers.get(chat_id)

    if not worker_id:
        await query.edit_message_text("⚠️ Sesión expirada. Usá /start para volver a identificarte.")
        return

    # Parse callback_data: "done:{task_id}"
    data = query.data
    if not data.startswith("done:"):
        return

    task_id = data.split(":", 1)[1]

    if not _is_valid_id(task_id):
        log.warning("Invalid task_id from callback", task_id=task_id, chat_id=chat_id)
        await query.edit_message_text("⚠️ ID de tarea inválido.")
        return

    task_name = task_id
    lot_display = ""
    try:
        snapshot = _load_snapshot(_selected_tenants.get(chat_id, ""))
        for t in snapshot.get("tasks", []):
            if t["id"] == task_id:
                task_name = t.get("description", task_id)
                lot_ids = t.get("lot_ids", [])
                if lot_ids:
                    lot_display = ", ".join(
                        _get_lot_display(snapshot, lid) for lid in lot_ids
                    )
                break
    except FileNotFoundError:
        pass

    confirm_text = (
        f"⚠️ *¿Estás seguro?*\n\n"
        f"Vas a dar como finalizada:\n\n"
        f"📌 *Tarea:* {task_name}\n"
    )
    if lot_display:
        confirm_text += f"🌱 *Lote:* {lot_display}\n"

    buttons = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Sí, confirmar", callback_data=f"confirm:{task_id}"),
            InlineKeyboardButton("❌ Cancelar", callback_data=f"cancel:{task_id}"),
        ]
    ])

    await query.edit_message_text(
        confirm_text,
        parse_mode="Markdown",
        reply_markup=buttons,
    )


async def handle_task_confirm(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle confirmation: actually mark the task as completed."""
    query = update.callback_query
    await query.answer()

    chat_id = query.message.chat_id
    worker_id = _authenticated_workers.get(chat_id)

    if not worker_id:
        await query.edit_message_text("⚠️ Sesión expirada. Usá /start para volver a identificarte.")
        return

    task_id = query.data.split(":", 1)[1]

    if not _is_valid_id(task_id):
        log.warning("Invalid task_id in confirm", task_id=task_id, chat_id=chat_id)
        await query.edit_message_text("⚠️ ID de tarea inválido.")
        return

    _local_task_overrides[task_id] = "COMPLETED"

    _append_event({
        "type": "TASK_COMPLETED",
        "worker_id": worker_id,
        "task_id": task_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    log.info(
        "Task completed",
        task_id=task_id,
        worker_id=worker_id,
        chat_id=chat_id,
    )

    await query.edit_message_text(
        f"✅ *Tarea completada:* Se registró correctamente.\n\n"
        f"Usá '📋 Mis Tareas' para ver las que quedan.",
        parse_mode="Markdown",
    )


async def handle_task_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle cancel button: go back to tasks."""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        "❌ Operación cancelada. Usá '📋 Mis Tareas' para ver tus tareas.",
    )


# ═══════════════════════════════════════════════════════════
# HANDLERS — LOCATION
# ═══════════════════════════════════════════════════════════

async def handle_location(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle location share for check-in."""
    chat_id = update.message.chat_id
    worker_id = _authenticated_workers.get(chat_id)

    if not worker_id:
        await update.message.reply_text(
            "⚠️ Primero necesitás identificarte. Usá /start"
        )
        return

    location = update.message.location
    if not location:
        await update.message.reply_text("❌ No se recibió ubicación. Intentá de nuevo.")
        return

    lat = location.latitude
    lon = location.longitude

    _append_event({
        "type": "ATTENDANCE",
        "worker_id": worker_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "latitude": lat,
        "longitude": lon,
    })

    log.info(
        "Check-in recorded",
        worker_id=worker_id,
        chat_id=chat_id,
        lat=lat,
        lon=lon,
    )

    await update.message.reply_text(
        f"📍 *Check-in registrado*\n\n"
        f"📌 Ubicación: `{lat:.6f}, {lon:.6f}`\n"
        f"🕐 Hora: {datetime.now().strftime('%H:%M:%S')}",
        parse_mode="Markdown",
        reply_markup=_main_menu_keyboard(chat_id),
    )


# ═══════════════════════════════════════════════════════════
# HANDLERS — FALLBACK
# ═══════════════════════════════════════════════════════════

async def handle_unknown(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle any unrecognized text message."""
    chat_id = update.message.chat_id
    if chat_id not in _authenticated_workers:
        await update.message.reply_text(
            "👋 Usá /start para comenzar."
        )
    else:
        await update.message.reply_text(
            "🤔 No entendí ese mensaje. Usá los botones del menú.",
            reply_markup=_main_menu_keyboard(chat_id),
        )


# ═══════════════════════════════════════════════════════════
# HEALTH CHECK — DLQ stats
# ═══════════════════════════════════════════════════════════

async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /status — show bot health info (for debugging)."""
    chat_id = update.message.chat_id
    worker_id = _authenticated_workers.get(chat_id)

    if not worker_id:
        await update.message.reply_text("⚠️ Usá /start primero.")
        return

    dlq_size = dlq.size()
    sessions_count = len(_authenticated_workers)
    snapshot_exists = os.path.exists(SNAPSHOT_PATH)
    snapshot_age = "N/A"
    if snapshot_exists:
        try:
            age_secs = int(datetime.now().timestamp() - os.path.getmtime(SNAPSHOT_PATH))
            if age_secs < 60:
                snapshot_age = f"{age_secs}s"
            else:
                snapshot_age = f"{age_secs // 60}m {age_secs % 60}s"
        except OSError:
            snapshot_age = "error"

    await update.message.reply_text(
        f"📊 *Estado del Bot*\n\n"
        f"👥 Sesiones activas: {sessions_count}\n"
        f"📡 Snapshot: {'✅' if snapshot_exists else '❌'} (edad: {snapshot_age})\n"
        f"📬 Cola de errores (DLQ): {dlq_size} eventos\n"
        f"⏱ TTL snapshot: {SNAPSHOT_TTL_SECONDS}s\n"
        f"🔔 Poll notificaciones: {NOTIFICATION_POLL_SECONDS}s",
        parse_mode="Markdown",
        reply_markup=_main_menu_keyboard(chat_id),
    )


# ═══════════════════════════════════════════════════════════
# SYNC LOOP
# ═══════════════════════════════════════════════════════════

async def _snapshot_refresh_loop() -> None:
    """Periodically refresh snapshot from API for all active tenants."""
    SYNC_INTERVAL = int(os.environ.get("SEEDOR_SYNC_INTERVAL_SECONDS", "60"))
    log.info("Snapshot sync loop started", interval_seconds=SYNC_INTERVAL)
    while True:
        await asyncio.sleep(SYNC_INTERVAL)
        try:
            active_tenants = set(_selected_tenants.values())
            if not active_tenants and TENANT_ID:
                active_tenants = {TENANT_ID}
            for tid in active_tenants:
                await _async_refresh_snapshot(tid)
        except Exception as e:
            log.error("Snapshot refresh loop error", error=str(e))


# ═══════════════════════════════════════════════════════════
# APP BUILDER (shared by polling and webhook modes)
# ═══════════════════════════════════════════════════════════

def build_app(token: str) -> Application:
    """Build and configure the Telegram Application with all handlers."""

    async def _post_init(app: Application) -> None:
        # Initial snapshot fetch for all tenants with active sessions
        active_tenants = registry.get_active_tenant_ids()
        if not active_tenants and TENANT_ID:
            active_tenants = {TENANT_ID}
        for tid in active_tenants:
            await _async_refresh_snapshot(tid)
        app.create_task(_notification_poller(app))
        app.create_task(_snapshot_refresh_loop())
        log.info("Background tasks started")

    app = Application.builder().token(token).post_init(_post_init).build()

    # ── Auth conversation (ConversationHandler) ──
    auth_conv = ConversationHandler(
        entry_points=[CommandHandler("start", cmd_start)],
        states={
            AUTH_WAITING_CONTACT: [
                MessageHandler(filters.CONTACT, handle_contact),
            ],
            AUTH_WAITING_TENANT: [
                CallbackQueryHandler(handle_tenant_selection, pattern=r"^tenant:"),
            ],
        },
        fallbacks=[
            CommandHandler("start", cmd_start),
            MessageHandler(filters.TEXT & ~filters.COMMAND, auth_timeout),
        ],
        conversation_timeout=300,  # 5 minutes
        name="auth",
        persistent=False,
    )

    # ── Register handlers (order matters) ──
    app.add_handler(auth_conv)
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(MessageHandler(filters.Regex(r"^🏢 Cambiar Empresa$"), handle_change_company))
    app.add_handler(MessageHandler(filters.Regex(r"^📋 Mis Tareas$"), handle_my_tasks))
    app.add_handler(MessageHandler(filters.LOCATION, handle_location))
    app.add_handler(CallbackQueryHandler(handle_task_done, pattern=r"^done:"))
    app.add_handler(CallbackQueryHandler(handle_task_confirm, pattern=r"^confirm:"))
    app.add_handler(CallbackQueryHandler(handle_task_cancel, pattern=r"^cancel:"))
    app.add_handler(CallbackQueryHandler(handle_switch_tenant, pattern=r"^switch:"))
    app.add_handler(CallbackQueryHandler(handle_tasks_tenant_selection, pattern=r"^tasks_tenant:"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_unknown))

    return app


# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

def main() -> None:
    """Start the bot (polling or webhook mode)."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        log.critical(
            "TELEGRAM_BOT_TOKEN not set",
            hint="Create a bot via @BotFather and export TELEGRAM_BOT_TOKEN",
        )
        raise SystemExit(1)

    webhook_url = os.environ.get("WEBHOOK_URL", "")

    log.info(
        "Bot starting",
        api_url=API_URL,
        tenant_id=TENANT_ID[:8] + "..." if len(TENANT_ID) > 8 else TENANT_ID or "(none)",
        snapshot_ttl=SNAPSHOT_TTL_SECONDS,
        notification_poll=NOTIFICATION_POLL_SECONDS,
        mode="webhook" if webhook_url else "polling",
    )

    app = build_app(token)

    if webhook_url:
        # ── Webhook mode (Railway / serverless) ──
        import asyncio
        from webhook_handler import run_webhook
        log.info("Starting in WEBHOOK mode", url=webhook_url)
        asyncio.run(run_webhook(app))
    else:
        # ── Polling mode (local development) ──
        log.info("Seedor Bot ready, starting polling")
        app.run_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True)


if __name__ == "__main__":
    main()
