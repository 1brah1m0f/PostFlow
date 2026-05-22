from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
import os
from app.database import SessionLocal
from app.models import Post
from app.services.instagram import InstagramPoster
from app.core.security import decrypt
from app.core.config import settings

scheduler = BackgroundScheduler()


def _url_to_local_path(image_url: str | None) -> str | None:
    """Convert https://backend.onrender.com/uploads/file.jpg → absolute local path."""
    if not image_url:
        return None
    if "/uploads/" in image_url:
        filename = image_url.split("/uploads/")[-1]
        path = os.path.abspath(os.path.join(settings.UPLOADS_DIR, filename))
        return path if os.path.exists(path) else None
    # Already a local path
    if os.path.exists(image_url):
        return image_url
    return None


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

            try:
                local_image = _url_to_local_path(post.image_url)
                print(f"[Scheduler] Post {str(post.id)[:8]}... image_url={post.image_url} → local={local_image}")

                if not local_image:
                    error_message = "Image file not found on disk. Re-upload the image and reschedule."
                else:
                    poster = InstagramPoster(
                        username=account.username,
                        password=decrypt(account.password_encrypted),
                    )
                    poster.post(image_path=local_image, caption=post.caption)
                    success = True

            except Exception as e:
                error_message = str(e) or "Instagram automation failed — check uvicorn logs for details"

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
