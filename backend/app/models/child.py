from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base


class Child(Base):
    __tablename__ = "children"

    child_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("parents.parent_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    device_id = Column(String(255), unique=True, nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parent = relationship("Parent", back_populates="children")
    locations = relationship("Location", back_populates="child", cascade="all, delete-orphan", order_by="desc(Location.timestamp)")
    alerts = relationship("Alert", back_populates="child", cascade="all, delete-orphan", order_by="desc(Alert.timestamp)")
    device_status = relationship("DeviceStatus", back_populates="child", uselist=False, cascade="all, delete-orphan")
    shake_detector = relationship("ShakeDetector", back_populates="child", uselist=False, cascade="all, delete-orphan")

