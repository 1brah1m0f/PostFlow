from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
import httpx
import os
from app.database import get_db, SessionLocal
from app.models import InstagramAccount
from app.schemas import AccountCreate, AccountUpdate, AccountOut
from app.core.security import encrypt
from app.routers.deps import get_current_user_id
from app.core.config import settings

router = APIRouter(prefix="/accounts", tags=["accounts"])

INSTAGRAM_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "x-ig-app-id": "936619743392459",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.instagram.com/",
}


def _extract_og_image(html: str) -> str | None:
    """Extract og:image URL from HTML meta tag."""
    import re
    match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']', html)
    if not match:
        match = re.search(r'content=["\'](https://[^"\']+)["\'][^>]*property=["\']og:image["\']', html)
    return match.group(1) if match else None


def _fetch_instagram_profile(username: str) -> tuple[bool, str | None]:
    """Fetch Instagram public profile page. Returns (found, profile_pic_url)."""
    try:
        with httpx.Client(follow_redirects=True, timeout=12) as client:
            r = client.get(
                f"https://www.instagram.com/{username}/",
                headers=INSTAGRAM_HEADERS,
            )
            if r.status_code != 200:
                return False, None
            # Confirm it's a real profile page (not a login redirect)
            if "accounts/login" in str(r.url):
                return False, None
            pic_url = _extract_og_image(r.text)
            return True, pic_url
    except Exception:
        return False, None


def _download_to_local(cdn_url: str, username: str) -> str | None:
    """
    Download a CDN image server-side and save it in uploads/.
    Returns the local URL (e.g. http://localhost:8000/uploads/profile_xxx.jpg)
    so the browser loads it from our own origin — no CORS issues.
    """
    try:
        with httpx.Client(follow_redirects=True, timeout=15) as client:
            r = client.get(cdn_url, headers={"User-Agent": INSTAGRAM_HEADERS["User-Agent"]})
            if r.status_code != 200:
                return None
            ext = "jpg"
            filename = f"profile_{username}_{uuid4().hex[:8]}.{ext}"
            dest = os.path.join(settings.UPLOADS_DIR, filename)
            with open(dest, "wb") as f:
                f.write(r.content)
            return f"http://localhost:8000/uploads/{filename}"
    except Exception:
        return None


def _fetch_and_store_profile_pic(account_id: UUID, username: str):
    """Run in background: fetch profile pic from Instagram and save locally."""
    found, cdn_url = _fetch_instagram_profile(username)
    if not cdn_url:
        return
    local_url = _download_to_local(cdn_url, username)
    if not local_url:
        return
    db = SessionLocal()
    try:
        acc = db.query(InstagramAccount).filter(InstagramAccount.id == account_id).first()
        if acc:
            acc.profile_pic_url = local_url
            db.commit()
    finally:
        db.close()


@router.get("", response_model=list[AccountOut])
def list_accounts(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return db.query(InstagramAccount).filter(InstagramAccount.user_id == user_id).all()


@router.post("", response_model=AccountOut, status_code=201)
def add_account(
    payload: AccountCreate,
    background_tasks: BackgroundTasks,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    account = InstagramAccount(
        user_id=user_id,
        username=payload.username,
        password_encrypted=encrypt(payload.password),
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    # Fetch profile pic in background so the response is instant
    background_tasks.add_task(_fetch_and_store_profile_pic, account.id, payload.username)
    return account


@router.post("/{account_id}/verify", response_model=AccountOut)
def verify_account(
    account_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == user_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    from app.services.instagram import InstagramVerifier
    from app.core.security import decrypt
    password = decrypt(account.password_encrypted)
    verified, pic_url = InstagramVerifier(account.username, password).verify()

    if not verified:
        raise HTTPException(
            status_code=400,
            detail=f"Could not verify @{account.username}. Check username and password in Settings → Edit."
        )

    account.is_verified = verified
    if pic_url:
        local_url = _download_to_local(pic_url, account.username)
        account.profile_pic_url = local_url or pic_url
    db.commit()
    db.refresh(account)
    return account


@router.put("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: UUID,
    payload: AccountUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == user_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if payload.username:
        account.username = payload.username.replace("@", "")
        account.profile_pic_url = None
        account.is_verified = False
    if payload.password:
        account.password_encrypted = encrypt(payload.password)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=204)
def delete_account(account_id: UUID, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    account = db.query(InstagramAccount).filter(
        InstagramAccount.id == account_id,
        InstagramAccount.user_id == user_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
