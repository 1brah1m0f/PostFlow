from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models import InstagramAccount
from app.schemas import AccountCreate, AccountOut
from app.core.security import encrypt
from app.routers.deps import get_current_user_id

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountOut])
def list_accounts(user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return db.query(InstagramAccount).filter(InstagramAccount.user_id == user_id).all()


@router.post("", response_model=AccountOut, status_code=201)
def add_account(payload: AccountCreate, user_id: UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    account = InstagramAccount(
        user_id=user_id,
        username=payload.username,
        password_encrypted=encrypt(payload.password),
    )
    db.add(account)
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
