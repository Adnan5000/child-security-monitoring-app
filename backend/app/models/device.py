from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base


class DeviceStatus(Base):
    __tablename__ = "device_statuses"

    device_id = Column(String(255), primary_key=True, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False, unique=True)
    battery_level = Column(Integer, nullable=True)  # Percentage 0-100
    network_status = Column(String(50), nullable=True)  # e.g., "WiFi", "4G", "5G", "Offline"
    app_status = Column(String(50), nullable=True)  # e.g., "Active", "Background", "Killed"
    last_update = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    child = relationship("Child", back_populates="device_status")

