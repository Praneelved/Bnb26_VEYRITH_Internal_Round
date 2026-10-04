from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scheduled_meeting import ScheduledMeetingModel
from app.services.session_service import create_session, generate_meeting_code

router = APIRouter(prefix="/api/scheduled", tags=["Scheduled Meetings"])


class ScheduleMeetingRequest(BaseModel):
    title: str
    host_name: Optional[str] = "Host"
    description: Optional[str] = None
    scheduled_start: str   # ISO 8601 string
    scheduled_end: Optional[str] = None


class ScheduledMeetingResponse(BaseModel):
    id: str
    title: str
    code: str
    session_id: Optional[str] = None
    host_name: Optional[str] = None
    description: Optional[str] = None
    scheduled_start: str
    scheduled_end: Optional[str] = None
    status: str
    created_at: str

    @classmethod
    def from_model(cls, m: ScheduledMeetingModel) -> "ScheduledMeetingResponse":
        return cls(
            id=m.id,
            title=m.title,
            code=m.code or "",
            session_id=m.session_id,
            host_name=m.host_name,
            description=m.description,
            scheduled_start=m.scheduled_start.isoformat() if m.scheduled_start else "",
            scheduled_end=m.scheduled_end.isoformat() if m.scheduled_end else None,
            status=m.status,
            created_at=m.created_at.isoformat() if m.created_at else "",
        )


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ScheduledMeetingResponse)
def schedule_meeting(payload: ScheduleMeetingRequest, db: Session = Depends(get_db)):
    """Create a scheduled meeting. Also pre-creates the backend session so the code/link is stable."""
    try:
        scheduled_start = datetime.fromisoformat(payload.scheduled_start)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid scheduled_start format. Use ISO 8601.")

    scheduled_end = None
    if payload.scheduled_end:
        try:
            scheduled_end = datetime.fromisoformat(payload.scheduled_end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scheduled_end format. Use ISO 8601.")

    # Pre-create a session so we get a stable meeting code and session_id
    session_obj = create_session(db, mode="fused")
    session_obj.name = payload.title
    db.commit()
    db.refresh(session_obj)

    meeting = ScheduledMeetingModel(
        title=payload.title,
        host_name=payload.host_name,
        description=payload.description,
        scheduled_start=scheduled_start,
        scheduled_end=scheduled_end,
        status="scheduled",
        session_id=session_obj.id,
        code=session_obj.code,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    return ScheduledMeetingResponse.from_model(meeting)


@router.get("", response_model=List[ScheduledMeetingResponse])
def list_scheduled_meetings(db: Session = Depends(get_db)):
    """List all non-cancelled scheduled meetings ordered by scheduled_start."""
    meetings = (
        db.query(ScheduledMeetingModel)
        .filter(ScheduledMeetingModel.status != "cancelled")
        .order_by(ScheduledMeetingModel.scheduled_start.asc())
        .all()
    )
    return [ScheduledMeetingResponse.from_model(m) for m in meetings]


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_scheduled_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """Cancel a scheduled meeting."""
    meeting = db.query(ScheduledMeetingModel).filter(ScheduledMeetingModel.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Scheduled meeting not found")
    meeting.status = "cancelled"
    db.commit()
    return None
