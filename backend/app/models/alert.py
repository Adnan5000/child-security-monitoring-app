from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum
from app.database import Base


class AlertType(str, enum.Enum):
    SHAKE_TRIGGER = "SHAKE_TRIGGER"
    SOS_BUTTON = "SOS_BUTTON"


class AlertStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    ACKNOWLEDGED = "ACKNOWLEDGED"


class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.child_id", ondelete="CASCADE"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.location_id", ondelete="SET NULL"), nullable=True)
    alert_type = Column(SQLEnum(AlertType), nullable=False)
    status = Column(SQLEnum(AlertStatus), default=AlertStatus.PENDING, nullable=False)
    message = Column(String(500), nullable=True)
    child_name = Column(String(100), nullable=False)  # Denormalized for quick access
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)

    # Relationships
    child = relationship("Child", back_populates="alerts")
    location = relationship("Location", back_populates="alerts")
    alert_distribution = relationship("AlertDistribution", back_populates="alert", uselist=False, cascade="all, delete-orphan")


class AlertDistribution(Base):
    __tablename__ = "alert_distributions"

    distribution_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    alert_id = Column(UUID(as_uuid=True), ForeignKey("alerts.alert_id", ondelete="CASCADE"), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    alert = relationship("Alert", back_populates="alert_distribution")
    # Many-to-many with EmergencyContact via association table
    emergency_contacts = relationship(
        "EmergencyContact",
        secondary="alert_distribution_contacts",
        back_populates="alert_distributions"
    )


# Association table for many-to-many relationship
alert_distribution_contacts = Table(
    'alert_distribution_contacts',
    Base.metadata,
    Column('distribution_id', UUID(as_uuid=True), ForeignKey('alert_distributions.distribution_id', ondelete="CASCADE")),
    Column('contact_id', UUID(as_uuid=True), ForeignKey('emergency_contacts.contact_id', ondelete="CASCADE"))
)

