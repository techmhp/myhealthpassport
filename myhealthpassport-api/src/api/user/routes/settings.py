from fastapi import Depends, Header, Form, APIRouter
from fastapi.responses import JSONResponse


from src.core.manager import get_current_user


from src.core.cache_maanger import ObjectCache
from src.core.password_manager import verify_password_hash, create_password_hash
from src.models.user_models import (
    SchoolStaff,
    OnGroundTeam,
    ScreeningTeam,
    AnalystTeam,
    AdminTeam,
    ConsultantTeam,
)

from .. import router

from ..schema import ChangePasswordSchema
from src.utils.response import StandardResponse
from fastapi import status


# Select user Models
USER_MODELS = {
    "SCHOOL_STAFF": SchoolStaff,
    "ON_GROUND_TEAM": OnGroundTeam,
    "SCREENING_TEAM": ScreeningTeam,
    "ANALYST_TEAM": AnalystTeam,
    "ADMIN_TEAM": AdminTeam,
    "CONSULTANT_TEAM": ConsultantTeam,
}


@router.post("/change-password")
async def change_password(payload: ChangePasswordSchema, current_user: dict = Depends(get_current_user)):

    # Set Current User Data to Change Password
    user_data = current_user

    user_model = USER_MODELS.get(user_data["role_type"])
    user = await user_model.get(id=user_data["user_id"])

    if not verify_password_hash(user.password, payload.old_password):
        resp = StandardResponse(
            status=False,
            message="Please Enter Valid Current Password .",
            data={},
            errors={},
        )
        return JSONResponse(
            content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST
        )

    user.password = create_password_hash(payload.new_password)
    await user.save()

    resp = StandardResponse(
        status=True,
        message="User password Updated .",
        data={},
        errors={},
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
