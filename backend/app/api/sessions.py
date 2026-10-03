from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.session import SessionCreate, SessionStatusUpdate
from app.schemas.participant import JoinRequest
from app.services import (
    create_session,
    get_session_by_id,
    get_session_by_code,
    start_session,
    end_session,
    join_session,
)
from app.auth import create_access_token, get_current_participant
from app.websocket import manager

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

@router.post("", status_code=status.HTTP_201_CREATED)
def create_new_session(payload: Optional[SessionCreate] = None, db: Session = Depends(get_db)):
    mode = payload.mode if payload and payload.mode else "fused"
    session_obj = create_session(db, mode=mode)
    return {
        "session_id": session_obj.id,
        "code": session_obj.code,
        "status": session_obj.status,
        "mode": session_obj.mode,
        "created_at": session_obj.created_at,
        "host_participant_id": session_obj.host_participant_id,
    }

@router.post("/{code}/join", status_code=status.HTTP_200_OK)
def join_session_by_code(code: str, payload: JoinRequest, db: Session = Depends(get_db)):
    session_obj = get_session_by_code(db, code)
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid meeting code"
        )
    if session_obj.status == "ended":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session has already ended"
        )

    participant = join_session(
        db=db,
        session_obj=session_obj,
        display_name=payload.name,
        role=payload.role,
        device_id=payload.device_id
    )

    token = create_access_token(
        participant_id=participant.id,
        session_id=session_obj.id,
        role=participant.role
    )

    return {
        "participant_id": participant.id,
        "session_id": session_obj.id,
        "code": session_obj.code,
        "role": participant.role,
        "token": token,
        "resume_token": participant.resume_token
    }

@router.get("/{session_id}")
def get_session_details(session_id: str, db: Session = Depends(get_db)):
    session_obj = get_session_by_id(db, session_id)
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return {
        "session_id": session_obj.id,
        "code": session_obj.code,
        "host_participant_id": session_obj.host_participant_id,
        "status": session_obj.status,
        "mode": session_obj.mode,
        "created_at": session_obj.created_at,
        "ended_at": session_obj.ended_at
    }

@router.post("/{session_id}/start")
async def start_session_endpoint(
    session_id: str,
    db: Session = Depends(get_db),
    current_participant: dict = Depends(get_current_participant)
):
    if current_participant.get("session_id") != session_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token does not match session")
    if current_participant.get("role") != "host":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only host can start session")
    
    session_obj = start_session(db, session_id)
    
    # Broadcast session_state change via WebSocket
    await manager.broadcast(session_id, {
        "type": "session_state",
        "session_id": session_id,
        "status": session_obj.status,
        "mode": session_obj.mode
    })

    return {
        "session_id": session_obj.id,
        "code": session_obj.code,
        "status": session_obj.status,
        "mode": session_obj.mode
    }

@router.post("/{session_id}/end")
async def end_session_endpoint(
    session_id: str,
    db: Session = Depends(get_db),
    current_participant: dict = Depends(get_current_participant)
):
    if current_participant.get("session_id") != session_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token does not match session")
    if current_participant.get("role") != "host":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only host can end session")
    
    session_obj = end_session(db, session_id)

    # Broadcast session_ended via WebSocket
    await manager.broadcast(session_id, {
        "type": "session_state",
        "session_id": session_id,
        "status": session_obj.status,
        "mode": session_obj.mode,
        "ended_at": session_obj.ended_at.isoformat() if session_obj.ended_at else None
    })

    return {
        "session_id": session_obj.id,
        "code": session_obj.code,
        "status": session_obj.status,
        "ended_at": session_obj.ended_at
    }
