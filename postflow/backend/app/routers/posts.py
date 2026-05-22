from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from datetime import datetime, timezone
from collections import defaultdict
import shutil, os, httpx
from app.database import get_db
from app.models import Post
from app.schemas import PostCreate, PostUpdate, PostOut
from app.routers.deps import get_current_user_id
from app.core.config import settings

router = APIRouter(prefix="/posts", tags=["posts"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "video/mp4"}


def _upload_to_supabase(data: bytes, filename: str, content_type: str) -> str:
    """Upload bytes to Supabase Storage and return the public URL."""
    url = f"{settings.SUPABASE_URL}/storage/v1/object/postflow-uploads/{filename}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }
    r = httpx.put(url, content=data, headers=headers, timeout=30)
    if r.status_code not in (200, 201):
        raise HTTPException(500, f"Storage upload failed: {r.text}")
    return f"{settings.SUPABASE_URL}/storage/v1/object/public/postflow-uploads/{filename}"


@router.post("/upload")
def upload_media(file: UploadFile = File(...), user_id: UUID = Depends(get_current_user_id)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Unsupported file type. Use JPG, PNG or MP4.")
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
    filename = f"{uuid4()}.{ext}"
    data = file.file.read()

    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
        url = _upload_to_supabase(data, filename, file.content_type or "application/octet-stream")
    else:
        # fallback: local disk (dev only)
        os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
        dest = os.path.join(settings.UPLOADS_DIR, filename)
        with open(dest, "wb") as f:
            f.write(data)
        url = f"{settings.BASE_URL}/uploads/{filename}"

    return {"url": url}


@router.get("", response_model=list[PostOut])
def list_posts(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return db.query(Post).filter(Post.user_id == user_id).order_by(Post.scheduled_at).all()


@router.post("", response_model=PostOut, status_code=201)
def create_post(payload: PostCreate, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    post = Post(**payload.model_dump(), user_id=user_id)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: UUID, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.put("/{post_id}", response_model=PostOut)
def update_post(post_id: UUID, payload: PostUpdate, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.status == "published":
        raise HTTPException(status_code=400, detail="Published posts cannot be edited")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(post, field, value)
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}", status_code=204)
def delete_post(post_id: UUID, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == user_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()


@router.get("/reports/summary")
def get_reports(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    all_posts = db.query(Post).filter(Post.user_id == user_id).all()

    total = len(all_posts)
    published = sum(1 for p in all_posts if p.status == "published")
    scheduled = sum(1 for p in all_posts if p.status == "scheduled")
    failed = sum(1 for p in all_posts if p.status == "failed")
    drafts = sum(1 for p in all_posts if p.status == "draft")

    # Posts per month (last 6 months)
    monthly: dict = defaultdict(lambda: {"published": 0, "failed": 0, "scheduled": 0})
    for p in all_posts:
        if p.status == "draft":
            continue
        dt = p.published_at or p.scheduled_at
        if dt:
            key = dt.strftime("%b %Y")
            monthly[key][p.status] += 1

    # Keep last 6 months in order
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    months = []
    for i in range(5, -1, -1):
        d = now.replace(day=1) - timedelta(days=i * 28)
        months.append(d.strftime("%b %Y"))
    months_data = [{"month": m, **monthly.get(m, {"published": 0, "failed": 0, "scheduled": 0})} for m in months]

    return {
        "total": total,
        "published": published,
        "scheduled": scheduled,
        "failed": failed,
        "drafts": drafts,
        "monthly": months_data,
    }
