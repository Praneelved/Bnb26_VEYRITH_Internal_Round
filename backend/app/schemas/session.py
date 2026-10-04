from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict

class SessionCreate(BaseModel):
    mode: Optional[Literal["fused", "single"]] = "fused"
    name: Optional[str] = None
    host_name: Optional[str] = "Host"

class SessionResponse(BaseModel):
    session_id: str
    code: str
    name: Optional[str] = None
    host_participant_id: Optional[str] = None
    status: Literal["lobby", "live", "ended"]
    mode: Literal["fused", "single"]
    created_at: datetime
    ended_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class SessionStatusUpdate(BaseModel):
    status: Literal["lobby", "live", "ended"]
