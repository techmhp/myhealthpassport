from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/screening", tags=["screening_team"])


# from . import nutrritional_screening
from . import dental_screening
from . import eye_screening
from . import screening_status
from . import clinical_recomendations_nutritional_analyst
from . import clinical_recomendations_psychological_analyst
from . import summary
from . import full_status
from . import medical_officer_status
from . import exports