import os
from jose import jwt, JWTError  # type: ignore
from datetime import datetime, timedelta
from typing import Any, Optional

JWT_SECRET = os.getenv("JWT_SECRET", "supersecret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


def create_jwt_token(
    payload: dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = payload.copy()
    expire = datetime.utcnow() + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=JWT_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return str(encoded)


def verify_jwt_token(token: str) -> dict[str, Any] | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if isinstance(payload, dict):
            return dict(payload)
        return None
    except JWTError:
        return None
