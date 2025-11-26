from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class EmergencyContactBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone_number: str = Field(..., min_length=5, max_length=20)
    email: Optional[EmailStr] = Field(None, max_length=255)
    priority: int = Field(1, ge=1, le=10, description="Lower number means higher priority")


class EmergencyContactCreate(EmergencyContactBase):
    pass


class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, min_length=5, max_length=20)
    email: Optional[EmailStr] = Field(None, max_length=255)
    priority: Optional[int] = Field(None, ge=1, le=10)
    is_verified: Optional[bool] = None


class EmergencyContactResponse(EmergencyContactBase):
    contact_id: str
    parent_id: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class EmergencyContactsListResponse(BaseModel):
    contacts: list[EmergencyContactResponse]


