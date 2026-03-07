# src/auth.py
import logging
import os

from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from src.models.user_models import ConsultantTeam

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")
# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/login", auto_error=False)


async def get_token(authorization: str = Header(default=None)):
    """
    Retrieve token from Authorization header.
    """
    logger.info(f"Received Authorization header: {authorization}")
    if not authorization:
        logger.warning("No authentication token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No authentication token provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    scheme, token = authorization.split(" ") if " " in authorization else (None, None)
    if scheme.lower() != "bearer" or not token:
        logger.warning("Invalid authentication scheme in header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
            headers={"WWW-Authenticate": "Bearer"},
        )
    logger.info("Using token from Authorization header")
    return token


async def get_current_user(token: str = Depends(get_token)):
    """
    Decode JWT token and return the current user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        logger.info(f"Decoding token: {token[:10]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.error("No user ID in token payload")
            raise credentials_exception
        user = await ConsultantTeam.filter(doctor_id=int(user_id)).first()
        if user is None:
            logger.error(f"No user found for ID: {user_id}")
            raise credentials_exception
        logger.info(f"Successfully authenticated user: {user.first_name}")
        return user
    except JWTError as e:
        logger.error(f"JWT decoding error: {str(e)}")
        raise credentials_exception


