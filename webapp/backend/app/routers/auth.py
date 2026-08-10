"""Router autentikasi: register, login, me.
"""
from __future__ import annotations

import datetime as dt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..dependencies import get_current_user
from ..models import User
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookie(request: Request, response: Response, token: str) -> None:
    """Set HttpOnly access_token cookie, dynamically checking HTTPS scheme."""
    proto = request.headers.get("x-forwarded-proto") or request.url.scheme
    is_secure = proto.lower() == "https"
    response.set_cookie(
        key="access_token",
        value=token,
        path="/",
        httponly=True,
        samesite="lax",
        secure=is_secure,
        max_age=settings.access_token_expire_minutes * 60,
    )


# --------------------------------------------------------------------------- #
#  Schemas                                                                     #
# --------------------------------------------------------------------------- #
class RegisterIn(BaseModel):
    email: EmailStr
    name: str = Field(default="", max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str = "siswa"
    is_active: bool = True

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --------------------------------------------------------------------------- #
#  Endpoints                                                                   #
# --------------------------------------------------------------------------- #
@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, request: Request, response: Response, db: Session = Depends(get_db)) -> TokenOut:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email sudah terdaftar.")

    user = User(
        email=payload.email.lower(),
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        role="siswa",
        is_active=True,
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email sudah terdaftar.")

    token = create_access_token(subject=user.id, extra={"email": user.email, "role": user.role})
    _set_auth_cookie(request, response, token)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)) -> TokenOut:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email atau password salah.")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda telah dinonaktifkan oleh administrator.",
        )

    user.last_login = dt.datetime.now(dt.timezone.utc)
    db.commit()

    token = create_access_token(subject=user.id, extra={"email": user.email, "role": user.role})
    _set_auth_cookie(request, response, token)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    """Logout endpoint: clear access_token cookie."""
    response.delete_cookie("access_token", path="/")
    return {"status": "ok", "message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)) -> User:
    return current
