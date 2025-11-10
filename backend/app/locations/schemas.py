from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LocationCreate(BaseModel):
    """Schema for creating a location update"""
    child_id: str = Field(..., description="Child ID")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude (-90 to 90)")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude (-180 to 180)")
    accuracy: Optional[float] = Field(None, ge=0, description="Location accuracy in meters")
    address: Optional[str] = Field(None, max_length=500, description="Address (optional)")


class LocationResponse(BaseModel):
    """Schema for location information response"""
    location_id: str
    child_id: str
    child_name: str
    latitude: float
    longitude: float
    accuracy: Optional[float]
    address: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True


class LocationUpdate(BaseModel):
    """Schema for updating location (from mobile device)"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = Field(None, ge=0)
    address: Optional[str] = Field(None, max_length=500)


class ChildrenLocationsResponse(BaseModel):
    """Schema for all children's current locations"""
    children: list[LocationResponse]

