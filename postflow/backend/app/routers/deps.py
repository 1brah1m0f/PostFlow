import logging
from dataclasses import dataclass

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.supabase_client import get_anon_client

logger = logging.getLogger(__name__)
bearer = HTTPBearer()


@dataclass
class AuthUser:
    id: str
    email: str
    token: str


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> AuthUser:
    try:
        response = get_anon_client().auth.get_user(creds.credentials)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return AuthUser(
            id=str(response.user.id),
            email=response.user.email or "",
            token=creds.credentials,
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Token validation failed")
        raise HTTPException(status_code=401, detail="Invalid token")
