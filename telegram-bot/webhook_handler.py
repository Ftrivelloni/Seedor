"""
webhook_handler.py — Webhook server for Seedor Telegram Bot
============================================================
Used when deploying to Railway (serverless).
Receives Telegram updates via POST /webhook.

Set env var WEBHOOK_URL to activate webhook mode.
Otherwise bot.py defaults to polling (dev mode).

Usage:
    WEBHOOK_URL=https://your-app.up.railway.app/webhook python bot.py
"""

import asyncio
import os

from aiohttp import web

from logger import get_logger

log = get_logger("webhook")

# Port for the webhook server — Railway sets PORT env var
PORT = int(os.environ.get("PORT", "8443"))
WEBHOOK_URL = os.environ.get("WEBHOOK_URL", "")
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")


async def health_handler(request: web.Request) -> web.Response:
    """GET /health — healthcheck for Railway."""
    return web.json_response({"status": "ok", "mode": "webhook"})


async def run_webhook(app) -> None:
    """Start the webhook server with the given telegram Application."""
    from telegram import Update

    # WEBHOOK_SECRET is required when running in webhook mode
    if not WEBHOOK_SECRET:
        raise RuntimeError(
            "WEBHOOK_SECRET must be set when WEBHOOK_URL is configured. "
            "Generate a strong random token and set it as an environment variable."
        )

    # Build the aiohttp web app
    webapp = web.Application()

    # Webhook endpoint
    async def webhook_handler(request: web.Request) -> web.Response:
        """POST /webhook — receive Telegram updates."""
        # Always validate the secret token header
        token_header = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
        if token_header != WEBHOOK_SECRET:
            return web.Response(status=403, text="Forbidden")

        try:
            data = await request.json()
            update = Update.de_json(data, app.bot)
            # Process update in-band
            await app.process_update(update)
            return web.Response(status=200, text="OK")
        except Exception:
            log.exception("Webhook update processing failed")
            return web.Response(status=500, text="Internal Server Error")

    webapp.router.add_post("/webhook", webhook_handler)
    webapp.router.add_get("/health", health_handler)
    webapp.router.add_get("/", health_handler)

    # Initialize the telegram application
    await app.initialize()

    # Set the webhook on Telegram's side
    webhook_kwargs = {"url": WEBHOOK_URL}
    if WEBHOOK_SECRET:
        webhook_kwargs["secret_token"] = WEBHOOK_SECRET
    await app.bot.set_webhook(**webhook_kwargs)
    log.info("Webhook set", url=WEBHOOK_URL)

    # Start background tasks (notifications, snapshot refresh)
    await app.start()

    runner = web.AppRunner(webapp)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    await site.start()
    log.info("Webhook server started", port=PORT)

    # Keep running until interrupted
    try:
        await asyncio.Event().wait()
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        log.info("Shutting down webhook server")
        await app.bot.delete_webhook()
        await app.stop()
        await app.shutdown()
        await runner.cleanup()
