from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from datetime import datetime
from app.database import Base


class GeofenceType(str, enum.Enum):
    CIRCLE = "CIRCLE"  # Radius-based circular zone
    POLYGON = "POLYGON"  # Custom polygon shape


class Geofence(Base):
    __tablename__ = "geofences"

    geofence_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    geofence_type = Column(SQLEnum(GeofenceType), nullable=False, default=GeofenceType.CIRCLE)
    
    # For CIRCLE type
    center_latitude = Column(Float, nullable=False)
    center_longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, nullable=True)  # Only for CIRCLE type
    
    # For POLYGON type (stored as JSON string of coordinates)
    polygon_coordinates = Column(String(2000), nullable=True)  # JSON array of [lat, lng] pairs
    
    # Alert settings
    alert_on_entry = Column(Boolean, default=True, nullable=False)
    alert_on_exit = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    child = relationship("Child", back_populates="geofences")


class GeofenceEvent(Base):
    __tablename__ = "geofence_events"

    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    geofence_id = Column(UUID(as_uuid=True), ForeignKey("geofences.geofence_id", ondelete="CASCADE"), nullable=False)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.location_id", ondelete="SET NULL"), nullable=True)
    
    event_type = Column(String(20), nullable=False)  # "ENTRY" or "EXIT"
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    geofence = relationship("Geofence")
    child = relationship("Child")
    location = relationship("Location")

