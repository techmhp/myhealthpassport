from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["Doctors"])


from .doctors import router
from .home import router
from .booking import router
from .labtestslist import router
from .prescriptions import router
from .payments import router
from .healthians_lab_booking import router
from .thyrocare import router