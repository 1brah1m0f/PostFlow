from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserOut(BaseModel):
    id: UUID
    email: str
    name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AccountCreate(BaseModel):
    username: str
    password: str


class AccountUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None


class AccountOut(BaseModel):
    id: UUID
    username: str
    is_active: bool
    profile_pic_url: Optional[str] = None
    is_verified: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class PostCreate(BaseModel):
    account_id: UUID
    caption: str
    image_url: Optional[str] = None
    scheduled_at: datetime
    status: str = "scheduled"


class PostUpdate(BaseModel):
    caption: Optional[str] = None
    image_url: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None


class PostOut(BaseModel):
    id: UUID
    account_id: Optional[UUID]
    caption: str
    image_url: Optional[str]
    scheduled_at: datetime
    status: str
    error_message: Optional[str]
    created_at: datetime
    published_at: Optional[datetime]

    model_config = {"from_attributes": True}
