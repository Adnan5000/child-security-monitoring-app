from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base


class Location(Base):
    __tablename__ = "locations"

    location_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    address = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    child = relationship("Child", back_populates="locations")
    alerts = relationship("Alert", back_populates="location")

    # Index for efficient date range queries
    __table_args__ = (
        Index('idx_location_child_timestamp', 'child_id', 'timestamp'),
    )


class LocationHistory(Base):
    __tablename__ = "location_histories"

    history_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False)
    start_date = Column(DateTime, nullable=False, index=True)
    end_date = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Note: Actual location data is stored in locations table
    # This table can be used for storing aggregated history records
    child = relationship("Child")

