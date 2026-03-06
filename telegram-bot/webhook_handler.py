"""
webhook_handler.py — Webhook server for Seedor Telegram Bot
============================================================
Used when deploying to Railway (production).
Receives Telegram updates via POST /webhook.

A.2: In production (Railway), WEBHOOK_URL and WEBHOOK_SECRET are mandatory.
     Process must exit(1) if either is missing.
     Updates are enqueued via app.update_queue (not processed in-band).

Usage:
    WEBHOOK_URL=https://your-app.up.railway.app/webhook python bot.py
"""

import asyncio
import os
import sys

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
    """Start the webhook server with the given telegram Application.

    A.2: Strict validation — both WEBHOOK_URL and WEBHOOK_SECRET must be set.
    Updates are pushed to app.update_queue for processing by PTB's internal loop.
    Full PTB lifecycle: initialize → start → (run) → stop → shutdown.
    """
    from telegram import Update

    # A.2: Strict env validation — fail fast in production
    if not WEBHOOK_URL:
        log.critical(
            "WEBHOOK_URL must be set in webhook mode. "
            "Set it to the public URL of your Railway deployment."
        )
        sys.exit(1)

    if not WEBHOOK_SECRET:
        log.critical(
            "WEBHOOK_SECRET must be set when WEBHOOK_URL is configured. "
            "Generate a strong random token and set it as an environment variable."
        )
        sys.exit(1)

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
            # A.2: Enqueue update for processing by PTB's internal loop
            # instead of processing in-band per HTTP request
            await app.update_queue.put(update)
            return web.Response(status=200, text="OK")
        except Exception:
            log.exception("Webhook update enqueue failed")
            return web.Response(status=500, text="Internal Server Error")

    webapp.router.add_post("/webhook", webhook_handler)
    webapp.router.add_get("/health", health_handler)
    webapp.router.add_get("/", health_handler)

    # A.2: Full PTB lifecycle — initialize + start
    await app.initialize()

    # Set the webhook on Telegram's side
    await app.bot.set_webhook(url=WEBHOOK_URL, secret_token=WEBHOOK_SECRET)
    log.info("Webhook set", url=WEBHOOK_URL)

    # Start PTB background tasks (post_init, notification poller, snapshot loop)
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
        # A.2: Full PTB shutdown lifecycle — stop + shutdown
        await app.stop()
        await app.shutdown()
        await runner.cleanup()
