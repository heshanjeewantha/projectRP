"""
API routes for login and signup.
"""
from fastapi import APIRouter

from src.common.auth import auth_service
from src.common.auth.auth import AuthResponseModel, LoginRequestModel, SignupRequestModel

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/signup", response_model=AuthResponseModel)
async def signup(payload: SignupRequestModel):
    """Create a new user account."""
    return await auth_service.signup(payload.model_dump())


@router.post("/login", response_model=AuthResponseModel)
async def login(payload: LoginRequestModel):
    """Authenticate a user by email and password."""
    return await auth_service.login(payload.model_dump())
