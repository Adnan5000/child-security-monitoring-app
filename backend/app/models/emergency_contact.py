from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    contact_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("parents.parent_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    priority = Column(Integer, default=1, nullable=False)  # Lower number = higher priority
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parent = relationship("Parent", back_populates="emergency_contacts")
    alert_distributions = relationship("AlertDistribution", secondary="alert_distribution_contacts", back_populates="emergency_contacts")

