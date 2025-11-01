from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Schema for user information response"""
    user_id: str
    email: str
    first_name: str
    last_name: str
    phone_number: Optional[str]
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenData(BaseModel):
    """Schema for token payload"""
    user_id: Optional[str] = None
    email: Optional[str] = None

