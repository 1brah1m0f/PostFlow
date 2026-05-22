from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
import os, tempfile, httpx
from app.database import SessionLocal
from app.models import Post
from app.services.instagram import InstagramPoster
from app.core.security import decrypt

scheduler = BackgroundScheduler()


def _download_image(image_url: str) -> str:
    """Download image from any URL to a temp file. Returns local path."""
    r = httpx.get(image_url, follow_redirects=True, timeout=30)
    r.raise_for_status()
    ext = image_url.split(".")[-1].split("?")[0][:4] or "jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}")
    tmp.write(r.content)
    tmp.close()
    return tmp.name


def check_and_publish():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        pending = db.query(Post).filter(
            Post.status == "scheduled",
            Post.scheduled_at <= now,
        ).all()
        if pending:
            print(f"[Scheduler] {len(pending)} post(s) due — processing...")

        for post in pending:
            account = post.instagram_account
            error_message = None
            success = False
            tmp_path = None

            try:
                if not post.image_url:
                    error_message = "No image attached. Re-upload the image and reschedule."
                else:
                    print(f"[Scheduler] Downloading image: {post.image_url}")
                    tmp_path = _download_image(post.image_url)
                    poster = InstagramPoster(
                        username=account.username,
                        password=decrypt(account.password_encrypted),
                    )
                    poster.post(image_path=tmp_path, caption=post.caption)
                    success = True

            except Exception as e:
                error_message = str(e) or "Instagram automation failed — check uvicorn logs for details"
            finally:
                if tmp_path and os.path.exists(tmp_path):
                    os.unlink(tmp_path)

            if success:
                post.status = "published"
                post.published_at = now
                post.error_message = None
            else:
                post.status = "failed"
                post.error_message = error_message

            db.commit()
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        check_and_publish,
        "interval",
        minutes=1,
        misfire_grace_time=300,  # run even if up to 5 min late (e.g. after restart)
        coalesce=True,           # if multiple runs were missed, fire once
    )
    scheduler.start()
    print("Scheduler started — checking for due posts every minute (Baku UTC+4)")
