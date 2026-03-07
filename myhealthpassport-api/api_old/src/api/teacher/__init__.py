from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["teacher"])

from . import teacher_emotional_developmental_api
from . import teacher_nutritional_api
# from .home import router as home_route
from .school_going_teachers_nutrition_questionare import router