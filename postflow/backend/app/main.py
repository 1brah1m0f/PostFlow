from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import shutil
import uuid
import os

from app.database import Base, engine, SessionLocal
from app.models import Post
from app.services.scheduler import start_scheduler
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
    start_scheduler()
    yield


app = FastAPI(title="PostFlow API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")


@app.post("/posts")
async def create_post(
    instagram_username: str = Form(...),
    instagram_password: str = Form(...),
    caption: str = Form(...),
    scheduled_at: str = Form(...),
    image: UploadFile = File(...),
):
    ext = image.filename.rsplit(".", 1)[-1] if "." in image.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(settings.UPLOADS_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(image.file, f)

    db = SessionLocal()
    try:
        post = Post(
            instagram_username=instagram_username,
            instagram_password=instagram_password,
            caption=caption,
            image_path=filepath,
            scheduled_at=datetime.fromisoformat(scheduled_at),
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        return post
    finally:
        db.close()


@app.get("/posts")
def get_posts():
    db = SessionLocal()
    try:
        return db.query(Post).order_by(Post.scheduled_at.desc()).all()
    finally:
        db.close()


@app.delete("/posts/{post_id}")
def delete_post(post_id: int):
    db = SessionLocal()
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if post.status != "scheduled":
            raise HTTPException(status_code=400, detail="Only scheduled posts can be deleted")
        db.delete(post)
        db.commit()
        return {"ok": True}
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
