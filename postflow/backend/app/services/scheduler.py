from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models import Post
from app.services.instagram import InstagramPoster
from app.core.security import decrypt

scheduler = BackgroundScheduler()


def check_and_publish():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        pending = db.query(Post).filter(
            Post.status == "scheduled",
            Post.scheduled_at <= now,
        ).all()

        for post in pending:
            account = post.instagram_account
            try:
                poster = InstagramPoster(
                    username=account.username,
                    password=decrypt(account.password_encrypted),
                )
                success = poster.post(image_path=post.image_url, caption=post.caption)
            except Exception as e:
                success = False
                post.error_message = str(e)

            if success:
                post.status = "published"
                post.published_at = now
            else:
                post.status = "failed"
                if not post.error_message:
                    post.error_message = "Playwright automation failed"

            db.commit()
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(check_and_publish, "interval", minutes=1)
    scheduler.start()
