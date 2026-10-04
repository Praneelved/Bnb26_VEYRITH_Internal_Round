import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.database import Base


class ScheduledMeetingModel(Base):
    __tablename__ = "scheduled_meetings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=True)          # FK to sessions.id (set when session is created)
    code = Column(String(6), nullable=True)             # meeting code (same as session.code once session created)
    title = Column(String, nullable=False)
    host_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=True)
    status = Column(String, default="scheduled", nullable=False)  # scheduled, live, ended, cancelled
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
