"""
Pydantic models for authentication and role-based access.
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


UserRole = Literal["student", "admin"]


class SignupRequestModel(BaseModel):
    fullName: str = Field(..., min_length=2, max_length=80)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=64)
    role: UserRole = "student"


class LoginRequestModel(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=64)


class AuthUserModel(BaseModel):
    id: str
    fullName: str
    email: str
    role: UserRole
    createdAt: datetime


class AuthResponseModel(BaseModel):
    user: AuthUserModel
    message: str
