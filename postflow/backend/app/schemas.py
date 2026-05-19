from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PostOut(BaseModel):
    id: int
    caption: str
    image_path: str
    scheduled_at: datetime
    status: str
    error_message: Optional[str]
    created_at: datetime
    published_at: Optional[datetime]

    model_config = {"from_attributes": True}
