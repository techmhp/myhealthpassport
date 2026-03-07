from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["students"])


# from . import nutrritional_screening
from . import home
from . import parent_questions
from . import vaccines
from . import screening
from . import behavioural_screening
from . import nutrritional_screening
from . import reports
# from . import screening_status


# from .students_catagory_wise import router as students_catagory_wise_router

# student_router.include_router(create_student_router)
# student_router.include_router(fetch_student_router)
# student_router.include_router(home_router)
# student_router.include_router(health_reports_router)
