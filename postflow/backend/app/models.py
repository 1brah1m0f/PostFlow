from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    instagram_username = Column(String, nullable=False)
    instagram_password = Column(String, nullable=False)
    caption = Column(Text, nullable=False)
    image_path = Column(String, nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    status = Column(String, default="scheduled")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    published_at = Column(DateTime, nullable=True)
