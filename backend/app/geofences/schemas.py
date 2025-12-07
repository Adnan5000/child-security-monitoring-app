from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, validator


class GeofenceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    geofence_type: str = Field("CIRCLE", description="CIRCLE or POLYGON")
    
    # For CIRCLE type
    center_latitude: float = Field(..., ge=-90, le=90)
    center_longitude: float = Field(..., ge=-180, le=180)
    radius_meters: Optional[float] = Field(None, gt=0, description="Required for CIRCLE type")
    
    # For POLYGON type
    polygon_coordinates: Optional[List[List[float]]] = Field(None, description="List of [lat, lng] pairs for POLYGON type")
    
    # Alert settings
    alert_on_entry: bool = True
    alert_on_exit: bool = True
    is_active: bool = True

    @validator('radius_meters')
    def validate_radius(cls, v, values):
        if values.get('geofence_type') == 'CIRCLE' and not v:
            raise ValueError('radius_meters is required for CIRCLE type geofence')
        return v

    @validator('polygon_coordinates')
    def validate_polygon(cls, v, values):
        if values.get('geofence_type') == 'POLYGON':
            if not v or len(v) < 3:
                raise ValueError('polygon_coordinates must have at least 3 points for POLYGON type')
        return v


class GeofenceCreate(GeofenceBase):
    child_id: UUID


class GeofenceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    center_latitude: Optional[float] = Field(None, ge=-90, le=90)
    center_longitude: Optional[float] = Field(None, ge=-180, le=180)
    radius_meters: Optional[float] = Field(None, gt=0)
    polygon_coordinates: Optional[List[List[float]]] = None
    alert_on_entry: Optional[bool] = None
    alert_on_exit: Optional[bool] = None
    is_active: Optional[bool] = None


class GeofenceResponse(GeofenceBase):
    geofence_id: UUID
    child_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GeofenceEventResponse(BaseModel):
    event_id: UUID
    geofence_id: UUID
    child_id: UUID
    location_id: Optional[UUID]
    event_type: str
    latitude: float
    longitude: float
    timestamp: datetime
    geofence_name: Optional[str] = None
    child_name: Optional[str] = None

    class Config:
        from_attributes = True

