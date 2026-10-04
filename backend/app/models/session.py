import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base

class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(6), unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)                       # meeting title
    host_participant_id = Column(String, nullable=True)
    status = Column(String, default="lobby", nullable=False)  # lobby, live, ended
    mode = Column(String, default="fused", nullable=False)    # fused, single
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)

    participants = relationship("ParticipantModel", back_populates="session", cascade="all, delete-orphan")
    captions = relationship("CaptionModel", back_populates="session", cascade="all, delete-orphan")
