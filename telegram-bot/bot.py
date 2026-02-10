"""
bot.py — Seedor Telegram Bot (Async)
=====================================
Reads from data/snapshot.json (NEVER from the production DB).
Writes worker actions to data/updates_queue.json.

Usage:
    export TELEGRAM_BOT_TOKEN="your-token-here"
    python bot.py
"""

import json
import logging
import os
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
    MessageHandler,
    filters,
)

# ─── Logging ───────────────────────────────────────────────
logging.basicConfig(
    format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("SeedorBot")

# ─── Paths ─────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
SNAPSHOT_PATH = os.path.join(DATA_DIR, "snapshot.json")
UPDATES_PATH = os.path.join(DATA_DIR, "updates_queue.json")
SESSIONS_PATH = os.path.join(DATA_DIR, "sessions.json")

# ─── Persistent session stores ─────────────────────────────
# chat_id → worker_id (persisted to sessions.json)

def _load_sessions() -> dict[int, str]:
    """Load authenticated sessions from disk."""
    if os.path.exists(SESSIONS_PATH):
        try:
            with open(SESSIONS_PATH, "r", encoding="utf-8") as f:
                raw = json.load(f)
                # JSON keys are strings, convert to int
                return {int(k): v for k, v in raw.items()}
        except (json.JSONDecodeError, ValueError):
            pass
    return {}

def _save_sessions() -> None:
    """Persist authenticated sessions to disk."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(SESSIONS_PATH, "w", encoding="utf-8") as f:
        json.dump({str(k): v for k, v in _authenticated_workers.items()}, f, indent=2)

_authenticated_workers: dict[int, str] = _load_sessions()

# task_id → new status (local overrides for immediate UX)
_local_task_overrides: dict[str, str] = {}


# ─── API Config ────────────────────────────────────────────
API_URL = os.environ.get("SEEDOR_API_URL", "http://localhost:3000")
API_KEY = os.environ.get("SEEDOR_API_KEY", "")


# ═══════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════

def _load_snapshot() -> dict:
    """Load and return the current snapshot."""
    with open(SNAPSHOT_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _push_event_to_api(event: dict) -> bool:
    """Push a single event directly to the Seedor API. Returns True on success."""
    if not API_KEY:
        logger.warning("SEEDOR_API_KEY not set, cannot push event to API")
        return False

    import urllib.request
    import urllib.error

    url = f"{API_URL.rstrip('/')}/api/telegram/updates"
    payload = json.dumps({"events": [event]}).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            logger.info("API push OK: %s", result)
            return True
    except Exception as e:
        logger.error("API push failed: %s", e)
        return False


def _append_event(event: dict) -> None:
    """Push event to API in real-time, and also save to queue file as backup."""
    # 1. Try to push directly to the API
    pushed = _push_event_to_api(event)

    # 2. Also save to queue file (backup if API was down)
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
    Telegram sends +542995751149, but contacts are often stored as +5492995751149.
    """
    cleaned = raw.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not cleaned.startswith("+"):
        cleaned = "+" + cleaned
    # Normalize Argentine numbers: remove the '9' after +54
    if cleaned.startswith("+549") and len(cleaned) > 6:
        cleaned = "+54" + cleaned[4:]
    return cleaned


def _find_worker_by_phone(snapshot: dict, phone: str) -> Optional[dict]:
    """Search snapshot workers by normalized phone."""
    normalized = _normalize_phone(phone)
    for w in snapshot.get("workers", []):
        if _normalize_phone(w["phone"]) == normalized:
            return w
    return None


def _get_worker_name(worker: dict) -> str:
    return f"{worker['first_name']} {worker['last_name']}"


def _get_lot_display(snapshot: dict, lot_id: str) -> str:
    """Return 'LotName (FieldName)' for display."""
    for field in snapshot.get("fields", []):
        for lot in field.get("lots", []):
            if lot["id"] == lot_id:
                return f"{lot['name']} — {field['name']}"
    return lot_id


def _main_menu_keyboard() -> ReplyKeyboardMarkup:
    """Return the main reply keyboard for authenticated workers."""
    return ReplyKeyboardMarkup(
        [
            [KeyboardButton("📋 Mis Tareas")],
            [KeyboardButton("📍 Check-in", request_location=True)],
        ],
        resize_keyboard=True,
    )


# ═══════════════════════════════════════════════════════════
# HANDLERS
# ═══════════════════════════════════════════════════════════

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /start — ask the user to share their contact."""
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


async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Authenticate the worker via their shared phone number."""
    contact = update.message.contact
    if not contact or not contact.phone_number:
        await update.message.reply_text("❌ No se pudo leer tu contacto. Intentá de nuevo.")
        return

    phone = contact.phone_number
    logger.info("Contact received: %s", phone)

    try:
        snapshot = _load_snapshot()
    except FileNotFoundError:
        await update.message.reply_text(
            "⚠️ El sistema no está sincronizado aún. "
            "Contactá al supervisor."
        )
        return

    worker = _find_worker_by_phone(snapshot, phone)

    if worker is None:
        await update.message.reply_text(
            "❌ Tu número de teléfono no está registrado en el sistema.\n"
            "Contactá al supervisor para que te agreguen.",
            reply_markup=ReplyKeyboardRemove(),
        )
        return

    if not worker.get("active", True):
        await update.message.reply_text(
            "⚠️ Tu cuenta está desactivada. Contactá al supervisor.",
            reply_markup=ReplyKeyboardRemove(),
        )
        return

    chat_id = update.message.chat_id
    _authenticated_workers[chat_id] = worker["id"]
    _save_sessions()

    name = _get_worker_name(worker)
    role = worker.get("function_type", "")

    await update.message.reply_text(
        f"✅ *¡Hola, {name}!*\n"
        f"Rol: _{role}_\n\n"
        "Usá el menú para ver tus tareas o registrar tu presencia.",
        parse_mode="Markdown",
        reply_markup=_main_menu_keyboard(),
    )
    logger.info("Worker authenticated: %s (%s) → chat_id=%d", name, worker["id"], chat_id)


async def handle_my_tasks(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show the worker's assigned tasks with inline buttons."""
    chat_id = update.message.chat_id
    worker_id = _authenticated_workers.get(chat_id)

    if not worker_id:
        await update.message.reply_text(
            "⚠️ Primero necesitás identificarte. Usá /start"
        )
        return

    try:
        snapshot = _load_snapshot()
    except FileNotFoundError:
        await update.message.reply_text("⚠️ Snapshot no disponible.")
        return

    # Find tasks assigned to this worker
    my_tasks = [
        t for t in snapshot.get("tasks", [])
        if worker_id in t.get("assigned_worker_ids", [])
    ]

    # Apply local overrides
    for task in my_tasks:
        if task["id"] in _local_task_overrides:
            task["status"] = _local_task_overrides[task["id"]]

    # Filter out completed tasks
    active_tasks = [t for t in my_tasks if t["status"] != "COMPLETED"]

    if not active_tasks:
        await update.message.reply_text(
            "🎉 ¡No tenés tareas pendientes! Buen trabajo.",
            reply_markup=_main_menu_keyboard(),
        )
        return

    # Build message
    status_emoji = {
        "PENDING": "🟡",
        "IN_PROGRESS": "🔵",
        "LATE": "🔴",
    }

    lines = ["📋 *Tus tareas activas:*\n"]
    buttons = []

    for t in active_tasks:
        emoji = status_emoji.get(t["status"], "⚪")
        lots_display = ", ".join(
            _get_lot_display(snapshot, lid) for lid in t.get("lot_ids", [])
        )
        lines.append(
            f"{emoji} *{t['description']}*\n"
            f"   Tipo: {t['task_type']}\n"
            f"   Lote: {lots_display}\n"
            f"   Vence: {t['due_date']}\n"
        )
        buttons.append(
            [InlineKeyboardButton(
                f"✅ Completar: {t['description'][:30]}",
                callback_data=f"done:{t['id']}",
            )]
        )

    reply_markup = InlineKeyboardMarkup(buttons)

    await update.message.reply_text(
        "\n".join(lines),
        parse_mode="Markdown",
        reply_markup=reply_markup,
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

    # Apply local override for immediate UX
    _local_task_overrides[task_id] = "COMPLETED"

    # Append to updates queue
    _append_event({
        "type": "TASK_COMPLETED",
        "worker_id": worker_id,
        "task_id": task_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    logger.info("Task %s marked as COMPLETED by worker %s", task_id, worker_id)

    await query.edit_message_text(
        f"✅ *Tarea completada:* Se registró correctamente.\n\n"
        f"Usá '📋 Mis Tareas' para ver las que quedan.",
        parse_mode="Markdown",
    )


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

    # Append attendance event
    _append_event({
        "type": "ATTENDANCE",
        "worker_id": worker_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "latitude": lat,
        "longitude": lon,
    })

    logger.info("Check-in: worker=%s lat=%s lon=%s", worker_id, lat, lon)

    await update.message.reply_text(
        f"📍 *Check-in registrado*\n\n"
        f"📌 Ubicación: `{lat:.6f}, {lon:.6f}`\n"
        f"🕐 Hora: {datetime.now().strftime('%H:%M:%S')}",
        parse_mode="Markdown",
        reply_markup=_main_menu_keyboard(),
    )


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
            reply_markup=_main_menu_keyboard(),
        )


# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

def main() -> None:
    """Start the bot."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.error(
            "TELEGRAM_BOT_TOKEN not set. "
            "Create a bot via @BotFather and export the token:\n"
            "  export TELEGRAM_BOT_TOKEN='your-token-here'"
        )
        raise SystemExit(1)

    app = Application.builder().token(token).build()

    # ── Register handlers (order matters) ──
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    app.add_handler(MessageHandler(filters.Regex(r"^📋 Mis Tareas$"), handle_my_tasks))
    app.add_handler(MessageHandler(filters.LOCATION, handle_location))
    app.add_handler(CallbackQueryHandler(handle_task_done, pattern=r"^done:"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_unknown))

    logger.info("🌿 Seedor Bot starting… Press Ctrl+C to stop.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
