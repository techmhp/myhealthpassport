from fastapi import APIRouter, Depends

from . import router
from src.utils.response import StandardResponse


@router.get("/", response_model=StandardResponse)
async def home():
    return StandardResponse(
        status=True,
        message="ok"
    )