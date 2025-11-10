from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChildCreate(BaseModel):
    """Schema for creating a new child"""
    name: str = Field(..., min_length=1, max_length=100, description="Child's name")
    age: int = Field(..., ge=0, le=18, description="Child's age (0-18)")
    device_id: Optional[str] = Field(None, max_length=255, description="Device identifier (optional)")


class ChildUpdate(BaseModel):
    """Schema for updating a child"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=18)
    device_id: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class ChildResponse(BaseModel):
    """Schema for child information response"""
    child_id: str
    parent_id: str
    name: str
    age: int
    device_id: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

