from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ShakeDetectorBase(BaseModel):
    sensitivity: float = Field(1.5, ge=0.1, le=10.0, description="Shake sensitivity multiplier (higher = more sensitive)")
    threshold: float = Field(2.0, ge=0.5, le=10.0, description="Acceleration threshold for triggering")
    is_enabled: bool = Field(True, description="Whether shake detection is enabled")


class ShakeDetectorCreate(ShakeDetectorBase):
    pass


class ShakeDetectorUpdate(BaseModel):
    sensitivity: Optional[float] = Field(None, ge=0.1, le=10.0)
    threshold: Optional[float] = Field(None, ge=0.5, le=10.0)
    is_enabled: Optional[bool] = None


class ShakeDetectorResponse(ShakeDetectorBase):
    detector_id: str
    child_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShakeDetectorListResponse(BaseModel):
    detectors: list[ShakeDetectorResponse]

