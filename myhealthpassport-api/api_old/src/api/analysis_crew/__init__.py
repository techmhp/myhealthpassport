from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/analysis-crew", tags=["users"])


from .screening_analysis import router
