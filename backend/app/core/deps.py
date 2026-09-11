"""Shared FastAPI dependencies — the authenticated user."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.crypto import decrypt_secret
from app.core.database import get_db
from app.core.request_context import set_user_llm_key
from app.core.security import decode_token
from app.models.orm import User

_bearer = HTTPBearer(auto_error=False)

_UNAUTHORISED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None or creds.scheme.lower() != "bearer":
        raise _UNAUTHORISED
    user_id = decode_token(creds.credentials)
    if not user_id:
        raise _UNAUTHORISED
    user = db.get(User, user_id)
    if user is None:
        raise _UNAUTHORISED
    # If this user has their own key on file, their traffic uses it instead
    # of the shared server key for the rest of this request.
    set_user_llm_key(decrypt_secret(user.custom_llm_api_key_enc))
    return user
