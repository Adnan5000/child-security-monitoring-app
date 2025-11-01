from sqlalchemy import Column, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base


class ShakeDetector(Base):
    __tablename__ = "shake_detectors"

    detector_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False, unique=True)
    sensitivity = Column(Float, default=1.5, nullable=False)  # Shake sensitivity multiplier
    threshold = Column(Float, default=2.0, nullable=False)  # Threshold for triggering
    is_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    child = relationship("Child", back_populates="shake_detector")

