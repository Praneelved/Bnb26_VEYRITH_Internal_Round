import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class CaptionModel(Base):
    __tablename__ = "captions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    speaker_id = Column(String, nullable=True)
    speaker_name = Column(String, nullable=True)
    text = Column(Text, nullable=False)
    timestamp = Column(Float, default=0.0, nullable=False)
    is_final = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("SessionModel", back_populates="captions")
