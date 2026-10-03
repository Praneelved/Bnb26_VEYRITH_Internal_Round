from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class CaptionSchema(BaseModel):
    type: str = "caption"
    caption_id: str
    speaker_id: Optional[str] = None
    speaker_name: Optional[str] = None
    text: str
    timestamp: float
    is_final: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
