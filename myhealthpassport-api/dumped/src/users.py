import json
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from jose import jwt
from passlib.context import CryptContext

from src.api.auth import ALGORITHM, SECRET_KEY, get_current_user
from src.db import redis_db
from src.models.user_models import ConsultantTeam, Parents, AdminTeam
from src.schemas.user_schema import (
    LoginRequest,
    LoginResponse,
    SignupRequest,
    TokenResponse,
)

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Auth"])

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# JWT settings
ACCESS_TOKEN_EXPIRE_MINUTES = 86400  # 24 hours for testing


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(user: AdminTeam) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": str(user.id),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "email": user.email,
        "username": user.username,
        "role": user.user_role.value,
        "exp": expire,
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/", response_model=TokenResponse)
async def signup(user: SignupRequest):
    try:
        existing_doctor = await ConsultantTeam.filter(phone=user.phone).first()
        if existing_doctor:
            raise HTTPException(
                status_code=400,
                detail={
                    "status": False,
                    "message": "Phone already exists",
                    "errors": [
                        {
                            "field": "phone",
                            "error": "Phone number is already registered",
                        }
                    ],
                },
            )
        hashed_password = get_password_hash(user.password)
        doctor = await ConsultantTeam.create(
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            username=user.username,
            email=user.email,
            password=hashed_password,
            availability="Available",
            status=True,
        )
        # access_token = create_access_token({"sub": str(doctor.doctor_id)})
        access_token = create_access_token(user)
        return JSONResponse(
            content={
                "access_token": access_token,
                "token_type": "bearer",
                "status": True,
                "message": "Signup successful",
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={
                "status": False,
                "message": f"Signup failed: {str(e)}",
                "errors": [{" gield": "unknown", "error": str(e)}],
            },
        )


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    try:
        logger.info(f"Attempting login for phone: {credentials.phone}")

        # Check the User model for any active user with the given phone
        user = await User.filter(phone=credentials.phone, is_active=True).first()
        if not user:
            logger.warning(f"No active user found for phone: {credentials.phone}")
            raise HTTPException(
                status_code=401,
                detail={
                    "status": False,
                    "message": "Invalid credentials",
                    "errors": [{"field": "phone", "error": "No such user"}],
                },
            )

        # Verify password
        if not verify_password(credentials.password, user.password):
            logger.warning(f"Invalid password for phone: {credentials.phone}")
            raise HTTPException(
                status_code=401,
                detail={
                    "status": False,
                    "message": "Invalid credentials",
                    "errors": [{"field": "password", "error": "Incorrect password"}],
                },
            )

        # Generate access token
        logger.info(f"Login successful for: {user.first_name} ({user.user_role.value})")
        access_token = create_access_token(user)

        # Store session in Redis
        await redis_db.set(
            access_token,
            json.dumps(
                {
                    "id": user.id,
                    "first_name": user.first_name,
                    "phone": user.phone,
                    "email": user.email or "",
                    "username": user.username or "",
                    "user_role": user.user_role.value,
                }
            ),
            ex=1800,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "first_name": user.first_name,
                "phone": user.phone,
                "email": user.email or "",
                "username": user.username or "",
                "role": user.user_role.value,
            },
            "status": True,
            "message": "Login successful",
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "status": False,
                "message": f"Login failed: {str(e)}",
                "errors": [{"field": "unknown", "error": str(e)}],
            },
        )


@router.get("/logout")
async def logout():
    return JSONResponse(content={"status": True, "message": "Logged out successfully"})


@router.get("/user")
async def get_user(current_user: ConsultantTeam = Depends(get_current_user)):
    try:
        return {
            "first_name": current_user.first_name,
            "phone": current_user.phone,
            "email": current_user.email,
            "username": current_user.username,
            "status": True,
            "message": "User data retrieved successfully",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "status": False,
                "message": f"Failed to retrieve user data: {str(e)}",
                "errors": [{"field": "unknown", "error": str(e)}],
            },
        )
