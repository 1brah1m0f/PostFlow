from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


# --- Accounts ---

class AccountCreate(BaseModel):
    platform: str
    username: str
    password: str

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        if v not in ("instagram", "tiktok"):
            raise ValueError("Platform must be 'instagram' or 'tiktok'")
        return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Username cannot be empty")
        return v.strip()


class AccountUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None


class AccountOut(BaseModel):
    id: UUID
    platform: str
    username: str
    created_at: datetime
    updated_at: datetime


# --- Posts ---

class PostOut(BaseModel):
    id: UUID
    user_id: UUID
    account_id: UUID
    platform: str
    caption: str
    media_path: Optional[str] = None
    scheduled_at: datetime
    status: str
    error_message: Optional[str] = None
    failed_reason: Optional[str] = None
    created_at: datetime
    published_at: Optional[datetime] = None
    retry_count: int = 0


# --- Profile ---

class ProfileRequest(BaseModel):
    account_id: UUID
