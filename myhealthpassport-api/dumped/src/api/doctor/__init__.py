from fastapi import APIRouter

from .doctors import router as doctors_router_api


router = APIRouter(prefix="/api/v1", tags=["doctor"])

router.include_router(doctors_router_api)

