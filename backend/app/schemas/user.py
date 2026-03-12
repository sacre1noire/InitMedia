from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole


# Схемы для создания пользователя
class UserCreate(BaseModel):
    """Схема для регистрации пользователя"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = UserRole.APPLICANT


class UserLogin(BaseModel):
    """Схема для входа пользователя"""
    email: EmailStr
    password: str


# Схемы для ответов
class UserResponse(BaseModel):
    """Схема пользователя в ответах"""
    id: int
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Схема ответа с токенами"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefresh(BaseModel):
    """Схема для обновления токена"""
    refresh_token: str
