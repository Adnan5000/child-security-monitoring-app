from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.alert import AlertStatus, AlertType


class AlertLocationPayload(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = Field(None, ge=0)
    address: Optional[str] = Field(None, max_length=500)


class AlertCreate(BaseModel):
    child_id: str
    alert_type: AlertType
    message: Optional[str] = Field(None, max_length=500)
    location_id: Optional[str] = None
    location: Optional[AlertLocationPayload] = None


class EmergencyContactSummary(BaseModel):
    contact_id: str
    name: str


class AlertResponse(BaseModel):
    alert_id: str
    child_id: str
    child_name: str
    alert_type: AlertType
    status: AlertStatus
    message: Optional[str]
    timestamp: datetime
    acknowledged_at: Optional[datetime]
    location: Optional[AlertLocationPayload]
    distribution_contacts: List[EmergencyContactSummary]


class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]


class AlertAcknowledgeResponse(BaseModel):
    alert_id: str
    status: AlertStatus
    acknowledged_at: datetime


