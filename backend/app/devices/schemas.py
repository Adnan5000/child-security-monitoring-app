from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class DeviceStatusBase(BaseModel):
    device_id: Optional[str] = Field(None, max_length=255)
    battery_level: Optional[int] = Field(None, ge=0, le=100)
    network_status: Optional[str] = Field(None, max_length=50)
    network_type: Optional[str] = Field(None, max_length=50)
    app_status: Optional[str] = Field(None, max_length=50)


class DeviceStatusUpdate(DeviceStatusBase):
    pass


class DeviceStatusResponse(DeviceStatusBase):
    child_id: str
    last_update: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class DeviceStatusListResponse(BaseModel):
    devices: List[DeviceStatusResponse]


