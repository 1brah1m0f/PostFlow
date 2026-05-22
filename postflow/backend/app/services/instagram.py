"""
Instagram integration using instagrapi — Instagram's private mobile API.
No browser, no Playwright, no timeouts from page rendering.
"""
from instagrapi import Client
from instagrapi.exceptions import (
    LoginRequired, BadPassword, InvalidTargetUser,
    ChallengeRequired, TwoFactorRequired,
)
from pathlib import Path
from PIL import Image
import os


def _session_path(username: str) -> str:
    """Store one session file per account so we don't re-login every time."""
    from app.core.config import settings
    sessions_dir = os.path.join(os.path.dirname(settings.UPLOADS_DIR), "sessions")
    os.makedirs(sessions_dir, exist_ok=True)
    return os.path.join(sessions_dir, f"{username}.json")


def _get_client(username: str, password: str) -> Client:
    """Return an authenticated instagrapi Client, reusing session if possible."""
    cl = Client()
    cl.delay_range = [1, 3]  # humanise request timing

    session_file = _session_path(username)

    if os.path.exists(session_file):
        print(f"[Instagram] Loading saved session for @{username}...")
        try:
            cl.load_settings(session_file)
            cl.login(username, password)
            cl.dump_settings(session_file)
            print("[Instagram] ✓ Session reused")
            return cl
        except Exception as e:
            print(f"[Instagram] Session reuse failed ({e}), logging in fresh...")
            os.remove(session_file)

    print(f"[Instagram] Fresh login for @{username}...")
    try:
        cl.login(username, password)
    except BadPassword:
        raise Exception("Wrong Instagram password. Update it in Settings → Accounts → Edit.")
    except TwoFactorRequired:
        raise Exception("Two-factor authentication is enabled. Disable 2FA on Instagram to use auto-posting.")
    except ChallengeRequired:
        raise Exception(
            "Instagram requires a security challenge (suspicious login). "
            "Log in manually from your phone, approve the login, then try again."
        )
    except Exception as e:
        raise Exception(f"Instagram login failed: {e}")

    cl.dump_settings(session_file)
    print("[Instagram] ✓ Logged in and session saved")
    return cl


def _prepare_image(image_path: str) -> Path:
    """
    Convert JFIF/unsupported formats to JPEG and ensure the image
    is within Instagram's accepted dimensions (max 1440px on longest side).
    """
    path = Path(image_path)

    if path.suffix.lower() in [".jfif", ".jpe", ".jpeg"]:
        out = path.with_suffix(".jpg")
        img = Image.open(path).convert("RGB")
        img.save(out, "JPEG", quality=95)
        path = out

    # Resize if too large
    img = Image.open(path)
    max_side = 1440
    if max(img.size) > max_side:
        img.thumbnail((max_side, max_side), Image.LANCZOS)
        img.save(path, "JPEG", quality=95)

    return path


class InstagramVerifier:
    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password

    def verify(self) -> tuple[bool, str | None]:
        try:
            cl = _get_client(self.username, self.password)
            info = cl.user_info_by_username(self.username)
            pic_url = str(info.profile_pic_url_hd or info.profile_pic_url) if info else None
            return True, pic_url
        except Exception as e:
            print(f"[Instagram] Verify failed: {e}")
            return False, None


class InstagramPoster:
    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password

    def post(self, image_path: str, caption: str) -> bool:
        print(f"[Instagram] Posting for @{self.username}...")

        cl = _get_client(self.username, self.password)

        path = Path(image_path)
        suffix = path.suffix.lower()

        if suffix in [".mp4", ".mov"]:
            print("[Instagram] Uploading video...")
            cl.video_upload(path, caption)
        else:
            print("[Instagram] Preparing image...")
            path = _prepare_image(image_path)
            print(f"[Instagram] Uploading photo: {path.name}")
            cl.photo_upload(path, caption)

        print("[Instagram] ✓ Post published!")
        return True
