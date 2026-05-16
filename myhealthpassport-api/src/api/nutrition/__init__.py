from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/nutrition", tags=["nutrition"])

from . import mhb_integration
