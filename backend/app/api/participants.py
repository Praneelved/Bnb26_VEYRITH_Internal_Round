from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import get_session_participants, participant_leave, get_session_by_id

router = APIRouter(prefix="/api/sessions", tags=["Participants"])

@router.get("/{session_id}/participants")
def list_session_participants(session_id: str, db: Session = Depends(get_db)):
    session_obj = get_session_by_id(db, session_id)
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    participants = get_session_participants(db, session_id)
    return [
        {
            "participant_id": p.id,
            "session_id": p.session_id,
            "display_name": p.display_name,
            "role": p.role,
            "device_id": p.device_id,
            "status": p.status,
            "joined_at": p.joined_at,
            "left_at": p.left_at
        }
        for p in participants
    ]

@router.post("/{session_id}/participants/{participant_id}/leave")
def leave_session_endpoint(session_id: str, participant_id: str, db: Session = Depends(get_db)):
    participant = participant_leave(db, session_id, participant_id)
    return {
        "participant_id": participant.id,
        "session_id": participant.session_id,
        "status": participant.status,
        "left_at": participant.left_at
    }
