from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.participant import ParticipantModel
from app.models.session import SessionModel

def join_session(
    db: Session,
    session_obj: SessionModel,
    display_name: str,
    role: str = "participant",
    device_id: Optional[str] = None
) -> ParticipantModel:
    if session_obj.status == "ended":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot join an ended session"
        )
    
    # If the session does not have a host yet, make the first joiner (or host requester) the host
    if session_obj.host_participant_id is None and role == "host":
        actual_role = "host"
    elif session_obj.host_participant_id is None:
        actual_role = role
    else:
        actual_role = role

    participant = ParticipantModel(
        session_id=session_obj.id,
        display_name=display_name,
        role=actual_role,
        device_id=device_id,
        status="connected"
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)

    # Set as host if host_participant_id is missing or if explicitly host
    if session_obj.host_participant_id is None or actual_role == "host":
        session_obj.host_participant_id = participant.id
        db.commit()

    return participant

def get_session_participants(db: Session, session_id: str) -> List[ParticipantModel]:
    return db.query(ParticipantModel).filter(ParticipantModel.session_id == session_id).all()

def get_participant_by_id(db: Session, participant_id: str) -> Optional[ParticipantModel]:
    return db.query(ParticipantModel).filter(ParticipantModel.id == participant_id).first()

def participant_leave(db: Session, session_id: str, participant_id: str) -> ParticipantModel:
    participant = db.query(ParticipantModel).filter(
        ParticipantModel.id == participant_id,
        ParticipantModel.session_id == session_id
    ).first()
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found in session"
        )
    participant.status = "left"
    participant.left_at = datetime.utcnow()
    db.commit()
    db.refresh(participant)
    return participant
