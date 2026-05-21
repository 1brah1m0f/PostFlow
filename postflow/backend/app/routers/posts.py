import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from app.core.limiter import limiter
from app.core.security import decrypt_password
from app.core.supabase_client import get_admin_client
from app.routers.deps import AuthUser, get_current_user
from app.schemas import PostOut, ProfileRequest
from app.services.instagram import get_instagram_profile

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/webp",
    "video/mp4", "video/quicktime",
}
MAX_FILE_BYTES = 50 * 1024 * 1024
MAX_CAPTION_LENGTH = 2200
_UNSAFE_EXT = re.compile(r"[^\w\-]")


def _safe_ext(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    return _UNSAFE_EXT.sub("", ext)[:10]


async def _read_validated_upload(media: UploadFile) -> bytes:
    content_type = media.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"File type '{content_type}' not allowed. Accepted: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )
    chunks, total = [], 0
    while chunk := await media.read(1024 * 1024):
        total += len(chunk)
        if total > MAX_FILE_BYTES:
            raise HTTPException(status_code=413, detail="File exceeds 50 MB limit")
        chunks.append(chunk)
    return b"".join(chunks)


@router.post("/posts", response_model=PostOut, status_code=201)
@limiter.limit("10/minute")
async def create_post(
    request: Request,
    account_id: str = Form(...),
    caption: str = Form(...),
    scheduled_at: str = Form(...),
    media: UploadFile = File(...),
    user: AuthUser = Depends(get_current_user),
):
    if not caption.strip():
        raise HTTPException(status_code=422, detail="Caption cannot be empty")
    if len(caption) > MAX_CAPTION_LENGTH:
        raise HTTPException(status_code=422, detail=f"Caption exceeds {MAX_CAPTION_LENGTH} characters")

    try:
        account_uuid = UUID(account_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid account_id")

    try:
        scheduled_dt = datetime.fromisoformat(scheduled_at)
        if scheduled_dt.tzinfo is None:
            scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid scheduled_at — use ISO 8601 format")

    if scheduled_dt <= datetime.now(timezone.utc) + timedelta(minutes=1):
        raise HTTPException(status_code=422, detail="scheduled_at must be at least 1 minute in the future")

    db = get_admin_client()

    # Verify account belongs to user
    account_row = (
        db.table("accounts")
        .select("id, platform")
        .eq("id", str(account_uuid))
        .eq("user_id", user.id)
        .execute()
    )
    if not account_row.data:
        raise HTTPException(status_code=404, detail="Account not found")

    platform = account_row.data[0]["platform"]

    # Validate and read upload
    data = await _read_validated_upload(media)

    # Upload to Supabase Storage: {user_id}/{uuid}.ext
    ext = _safe_ext(media.filename or "upload")
    storage_path = f"{user.id}/{uuid.uuid4()}.{ext}"
    db.storage.from_("post-media").upload(
        path=storage_path,
        file=data,
        file_options={"content-type": media.content_type or "application/octet-stream"},
    )

    result = (
        db.table("posts")
        .insert({
            "user_id": user.id,
            "account_id": str(account_uuid),
            "platform": platform,
            "caption": caption,
            "media_path": storage_path,
            "scheduled_at": scheduled_dt.isoformat(),
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Internal server error")

    logger.info("post_created user_id=%s post_id=%s platform=%s", user.id, result.data[0]["id"], platform)
    return result.data[0]


@router.get("/posts", response_model=list[PostOut])
def get_posts(user: AuthUser = Depends(get_current_user)):
    result = (
        get_admin_client()
        .table("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_at", desc=True)
        .execute()
    )
    return result.data


@router.delete("/posts/{post_id}", status_code=204)
def delete_post(post_id: UUID, user: AuthUser = Depends(get_current_user)):
    db = get_admin_client()

    existing = (
        db.table("posts")
        .select("status, media_path")
        .eq("id", str(post_id))
        .eq("user_id", user.id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Post not found")

    post = existing.data[0]
    if post["status"] != "scheduled":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete — post is '{post['status']}'. Only scheduled posts can be deleted.",
        )

    # Remove media from Storage
    if post.get("media_path"):
        try:
            db.storage.from_("post-media").remove([post["media_path"]])
        except Exception:
            logger.warning("media_delete_failed path=%s", post["media_path"])

    db.table("posts").delete().eq("id", str(post_id)).execute()
    logger.info("post_deleted user_id=%s post_id=%s", user.id, post_id)


@router.post("/profile")
@limiter.limit("5/minute")
def get_profile(
    request: Request,
    body: ProfileRequest,
    user: AuthUser = Depends(get_current_user),
):
    db = get_admin_client()

    account_row = (
        db.table("accounts")
        .select("username, encrypted_password")
        .eq("id", str(body.account_id))
        .eq("user_id", user.id)
        .eq("platform", "instagram")
        .execute()
    )
    if not account_row.data:
        raise HTTPException(status_code=404, detail="Instagram account not found")

    try:
        password = decrypt_password(account_row.data[0]["encrypted_password"])
    except (ValueError, RuntimeError):
        logger.exception("credential_decrypt_failed account_id=%s", body.account_id)
        raise HTTPException(status_code=500, detail="Internal server error")

    result = get_instagram_profile(account_row.data[0]["username"], password)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
