from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from tortoise.expressions import Q

from src.models.user_models import SchoolRoles, AdminTeamRoles, SchoolStaff
from src.models.school_models import Schools
from src.utils.response import StandardResponse
from src.utils.calculator import calculate_age_string
from src.core.manager import get_current_user
from src.core.file_manager import get_new_url

from .. import router

@router.get("/staff", response_model=StandardResponse)
async def get_school_staff_list(
    school_id: int = Query(None, description="School ID (required for SUPER_ADMIN or PROGRAM_COORDINATOR)"),
    current_user: dict = Depends(get_current_user)
):
    user_role = current_user["user_role"]

    # Valid roles
    allowed_roles = [
        SchoolRoles.SCHOOL_ADMIN.value,
        AdminTeamRoles.PROGRAM_COORDINATOR.value,
        AdminTeamRoles.SUPER_ADMIN.value,
    ]

    if user_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{user_role} is not allowed to fetch school staff records.",
            errors={},
            data={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # Determine school ID
    if user_role in [AdminTeamRoles.PROGRAM_COORDINATOR.value, AdminTeamRoles.SUPER_ADMIN.value]:
        if not school_id:
            resp = StandardResponse(
                status=False,
                message="School ID is required for Program Coordinator or Super Admin.",
                errors={"school_id": "Missing school ID"},
                data={}
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
        target_school_id = school_id
    else:
        target_school_id = current_user.get("school_id")
        if not target_school_id:
            resp = StandardResponse(
                status=False,
                message="School ID not found for School Admin.",
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # Validate the school exists
    school = await Schools.get_or_none(school_id=target_school_id)
    if not school:
        resp = StandardResponse(
            status=False,
            message="Invalid school ID or school not found.",
            data={},
            errors={"school_id": "Invalid"},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Fetch staff
    staff_members = await SchoolStaff.filter(school_id=target_school_id).all()

    staff_list = []
    for staff in staff_members:
        profile_image_url = await get_new_url(staff.profile_image) if staff.profile_image else None
        staff_list.append({
            "id": staff.id,
            "full_name": f"{staff.first_name or ''} {staff.middle_name or ''} {staff.last_name or ''}".strip(),
            "email": staff.email,
            "user_role": staff.user_role,
            "role_type": staff.role_type,
            "profile_image": profile_image_url,
            "class_room": staff.class_room,
            "section": staff.section,
            "dob": str(staff.dob) if staff.dob else None,
            "gender": staff.gender,
            "age": str(calculate_age_string(staff.dob)) if staff.dob else "N/A",
            "country_calling_code": staff.country_calling_code,
            "street": staff.street,
            "state": staff.state,
            "pincode": staff.pincode,
            "country": staff.country,
            "address_line_1": staff.address_line_1,
            "address_line_2": staff.address_line_2,
            "landmark": staff.landmark,
            "location": staff.location,
            "created_at": str(staff.created_at)
        })

    resp = StandardResponse(
        status=True,
        message="School staff list retrieved successfully.",
        data={"staff_list": staff_list},
        errors={}
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)