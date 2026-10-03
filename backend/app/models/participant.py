import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ParticipantModel(Base):
    __tablename__ = "participants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    display_name = Column(String, nullable=False)
    role = Column(String, default="participant", nullable=False)  # host, participant, viewer
    device_id = Column(String, nullable=True)
    status = Column(String, default="connected", nullable=False)   # connected, disconnected, left
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)
    resume_token = Column(String, default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)

    session = relationship("SessionModel", back_populates="participants")
