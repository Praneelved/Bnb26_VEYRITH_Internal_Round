import random
import string
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.session import SessionModel

def generate_meeting_code(db: Session) -> str:
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # exclude easily confused chars (I, O, 0, 1)
    for _ in range(100):
        code = "".join(random.choices(chars, k=6))
        existing = db.query(SessionModel).filter(
            SessionModel.code == code,
            SessionModel.status != "ended"
        ).first()
        if not existing:
            return code
    raise RuntimeError("Failed to generate a unique meeting code")

def create_session(db: Session, mode: str = "fused") -> SessionModel:
    code = generate_meeting_code(db)
    session_obj = SessionModel(
        code=code,
        status="lobby",
        mode=mode
    )
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return session_obj

def get_session_by_id(db: Session, session_id: str) -> Optional[SessionModel]:
    return db.query(SessionModel).filter(SessionModel.id == session_id).first()

def get_session_by_code(db: Session, code: str) -> Optional[SessionModel]:
    return db.query(SessionModel).filter(SessionModel.code == code.upper()).first()

def start_session(db: Session, session_id: str) -> SessionModel:
    session_obj = get_session_by_id(db, session_id)
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    if session_obj.status == "ended":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start an ended session"
        )
    session_obj.status = "live"
    db.commit()
    db.refresh(session_obj)
    return session_obj

def end_session(db: Session, session_id: str) -> SessionModel:
    session_obj = get_session_by_id(db, session_id)
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    session_obj.status = "ended"
    session_obj.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(session_obj)
    return session_obj
