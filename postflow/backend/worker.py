"""
PostFlow background worker — runs independently of the FastAPI process.
Uses the Supabase service-role key to poll all users' scheduled posts.

Run with:  python worker.py
Docker:    command: python worker.py
"""
import logging
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.core.security import decrypt_password
from app.core.supabase_client import get_admin_client
from app.services.instagram import InstagramPoster
from app.services.tiktok import TikTokPoster

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("worker")

JOB_TIMEOUT_SECONDS = 15 * 60
MAX_RETRIES = 2
RETRY_DELAY_MINUTES = 5
POLL_INTERVAL_SECONDS = 60
MAX_CONCURRENT_JOBS = 3


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def recover_stuck_jobs() -> None:
    """On startup: reset posts stuck in 'running' for more than 30 minutes."""
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
    db = get_admin_client()
    result = (
        db.table("posts")
        .update({"status": "scheduled", "started_at": None})
        .eq("status", "running")
        .lt("started_at", cutoff)
        .execute()
    )
    count = len(result.data) if result.data else 0
    if count:
        logger.warning("recovered_stuck_jobs count=%s", count)


def _execute_job(post_id: str, platform: str, media_path: str, caption: str,
                 username: str, encrypted_password: str) -> tuple[bool, str]:
    """Run the Playwright automation for a single post."""
    try:
        password = decrypt_password(encrypted_password)
    except (ValueError, RuntimeError) as e:
        return False, str(e)

    # Download media from Supabase Storage to a temp file
    db = get_admin_client()
    try:
        media_bytes = db.storage.from_("post-media").download(media_path)
    except Exception as e:
        return False, f"Failed to download media: {e}"

    import tempfile
    ext = media_path.rsplit(".", 1)[-1] if "." in media_path else "bin"
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(media_bytes)
        tmp_path = tmp.name

    try:
        if platform == "tiktok":
            poster = TikTokPoster(username=username, password=password)
            return poster.post(media_path=tmp_path, caption=caption)
        else:
            poster = InstagramPoster(username=username, password=password)
            return poster.post(image_path=tmp_path, caption=caption)
    except Exception:
        logger.exception("playwright_error post_id=%s", post_id)
        return False, "Unexpected automation error"
    finally:
        os.unlink(tmp_path)


def process_post(post: dict) -> None:
    """Process a single post: run job with timeout, update Supabase status."""
    post_id = post["id"]
    account = post.get("accounts") or {}
    logger.info("post_start post_id=%s platform=%s", post_id, post["platform"])

    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(
            _execute_job,
            post_id,
            post["platform"],
            post["media_path"],
            post["caption"],
            account.get("username", ""),
            account.get("encrypted_password", ""),
        )
        try:
            success, error_msg = future.result(timeout=JOB_TIMEOUT_SECONDS)
        except FuturesTimeoutError:
            success = False
            error_msg = "Timeout after 15 minutes"
            logger.error("post_timeout post_id=%s", post_id)

    db = get_admin_client()
    now = _now_iso()

    if success:
        db.table("posts").update({"status": "published", "published_at": now, "failed_reason": None}).eq("id", post_id).execute()
        logger.info("post_published post_id=%s", post_id)
    else:
        retry_count = post.get("retry_count", 0)
        if retry_count < MAX_RETRIES:
            retry_at = (datetime.now(timezone.utc) + timedelta(minutes=RETRY_DELAY_MINUTES)).isoformat()
            db.table("posts").update({
                "status": "scheduled",
                "started_at": None,
                "retry_count": retry_count + 1,
                "scheduled_at": retry_at,
                "failed_reason": error_msg,
            }).eq("id", post_id).execute()
            logger.warning("post_retrying post_id=%s retry=%s", post_id, retry_count + 1)
        else:
            db.table("posts").update({
                "status": "failed",
                "failed_reason": error_msg or "Automation failed after retries",
            }).eq("id", post_id).execute()
            logger.error("post_failed post_id=%s error=%s", post_id, error_msg)


def check_and_publish() -> None:
    """Find due posts, mark them running, launch worker threads."""
    db = get_admin_client()
    now = _now_iso()

    pending = (
        db.table("posts")
        .select("*, accounts(username, encrypted_password)")
        .eq("status", "scheduled")
        .lte("scheduled_at", now)
        .limit(MAX_CONCURRENT_JOBS)
        .execute()
    )
    if not pending.data:
        return

    post_ids = [p["id"] for p in pending.data]
    db.table("posts").update({"status": "running", "started_at": now}).in_("id", post_ids).execute()
    logger.info("dispatching_posts count=%s", len(post_ids))

    for post in pending.data:
        t = threading.Thread(target=process_post, args=(post,), daemon=True)
        t.start()


def main() -> None:
    logger.info("PostFlow worker starting environment=%s", settings.ENVIRONMENT)
    recover_stuck_jobs()
    while True:
        try:
            check_and_publish()
        except Exception:
            logger.exception("poll_loop_error")
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
