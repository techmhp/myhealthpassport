from fastapi import APIRouter


router = APIRouter(prefix="/api/v1/parent", tags=["parent"])

from . import home
from . import parent_emotional_developmental_api
from . import parent_nutritional_api
from . import question_bank_api
from . import lab_reports

# from .vaccination_childern import router as vaccination_childern_router
# router.include_router(vaccination_childern_router)
# router.include_router(parentchildern_router)
# router.include_router(questionnare_router)
# router.include_router(parent_emotional_questionare_router)