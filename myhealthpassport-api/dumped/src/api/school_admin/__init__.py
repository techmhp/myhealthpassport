from fastapi import APIRouter

from .create_school_admin import router as create_school_admin_router

school_admin_router = APIRouter(prefix="/api/v1/school", tags=["school_admin"])

school_admin_router.include_router(create_school_admin_router)