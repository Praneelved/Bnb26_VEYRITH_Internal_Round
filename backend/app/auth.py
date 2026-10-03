from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

security = HTTPBearer(auto_error=False)

def create_access_token(participant_id: str, session_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": participant_id,
        "participant_id": participant_id,
        "session_id": session_id,
        "role": role,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_participant(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
        )
    return decode_access_token(credentials.credentials)

def require_host(participant_data: dict = Depends(get_current_participant)) -> dict:
    if participant_data.get("role") != "host":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the session host can perform this action",
        )
    return participant_data
