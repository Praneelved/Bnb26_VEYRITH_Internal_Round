from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

class JoinRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    role: Literal["host", "participant", "viewer"] = "participant"
    device_id: Optional[str] = None

class JoinResponse(BaseModel):
    participant_id: str
    session_id: str
    code: str
    role: str
    token: str
    resume_token: str

class ParticipantResponse(BaseModel):
    participant_id: str
    session_id: str
    display_name: str
    role: Literal["host", "participant", "viewer"]
    device_id: Optional[str] = None
    status: Literal["connected", "disconnected", "left"]
    joined_at: datetime
    left_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
