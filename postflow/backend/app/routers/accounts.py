import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import encrypt_password
from app.core.supabase_client import get_admin_client
from app.routers.deps import AuthUser, get_current_user
from app.schemas import AccountCreate, AccountOut, AccountUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.post("", response_model=AccountOut, status_code=201)
def create_account(
    body: AccountCreate,
    user: AuthUser = Depends(get_current_user),
):
    db = get_admin_client()

    duplicate = (
        db.table("accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", body.platform)
        .eq("username", body.username)
        .execute()
    )
    if duplicate.data:
        raise HTTPException(status_code=409, detail="Account already saved for this platform and username")

    result = (
        db.table("accounts")
        .insert({
            "user_id": user.id,
            "platform": body.platform,
            "username": body.username,
            "encrypted_password": encrypt_password(body.password),
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Internal server error")

    logger.info("account_created user_id=%s platform=%s", user.id, body.platform)
    return result.data[0]


@router.get("", response_model=List[AccountOut])
def list_accounts(user: AuthUser = Depends(get_current_user)):
    result = (
        get_admin_client()
        .table("accounts")
        .select("id, platform, username, created_at, updated_at")
        .eq("user_id", user.id)
        .execute()
    )
    return result.data


@router.put("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: UUID,
    body: AccountUpdate,
    user: AuthUser = Depends(get_current_user),
):
    db = get_admin_client()

    existing = (
        db.table("accounts")
        .select("id")
        .eq("id", str(account_id))
        .eq("user_id", user.id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Account not found")

    updates: dict = {}
    if body.username is not None:
        updates["username"] = body.username
    if body.password is not None:
        updates["encrypted_password"] = encrypt_password(body.password)

    if not updates:
        return existing.data[0]

    result = (
        db.table("accounts")
        .update(updates)
        .eq("id", str(account_id))
        .execute()
    )
    return result.data[0]


@router.delete("/{account_id}", status_code=204)
def delete_account(
    account_id: UUID,
    user: AuthUser = Depends(get_current_user),
):
    db = get_admin_client()

    existing = (
        db.table("accounts")
        .select("id")
        .eq("id", str(account_id))
        .eq("user_id", user.id)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Account not found")

    active_posts = (
        db.table("posts")
        .select("id")
        .eq("account_id", str(account_id))
        .in_("status", ["scheduled", "running"])
        .execute()
    )
    if active_posts.data:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete account — it has active scheduled posts. Delete those posts first.",
        )

    db.table("accounts").delete().eq("id", str(account_id)).execute()
    logger.info("account_deleted user_id=%s account_id=%s", user.id, account_id)
