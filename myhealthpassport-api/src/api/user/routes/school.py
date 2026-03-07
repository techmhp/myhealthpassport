from typing import Optional
from fastapi import Depends, status
from fastapi.responses import JSONResponse

from src.api.user import router
from src.core.file_manager import save_base64_image
from src.core.manager import get_current_user
from src.core.password_manager import create_password_hash
from src.models.school_models import Schools
from src.models.user_models import AdminTeamRoles, SchoolRoles, SchoolStaff
from src.utils.response import StandardResponse
from src.utils.transactions import generate_user_code

from ..schema import SchoolCreateSchema



@router.post("/create-school", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_school(
    form_data: SchoolCreateSchema,
    current_user: dict = Depends(get_current_user),
):
    # Authorization check
    creator_role = AdminTeamRoles(current_user["user_role"])
    if creator_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to create school records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)


    # Validation checks
    if await Schools.exists(school_code=form_data.school_code):
        resp = StandardResponse(
            status=False,
            message=f"School code '{form_data.school_code}' already exists.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

    if await Schools.exists(school_name=form_data.school_name):
        resp = StandardResponse(
            status=False,
            message=f"school name '{form_data.school_name}' already exists.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

    
    if await Schools.exists(registration_no=form_data.registration_no):
        resp = StandardResponse(
            status=False,
            message=f"Registration number '{form_data.registration_no}' already exists.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

    if await Schools.exists(primary_contact_email=form_data.primary_contact_email):
        resp = StandardResponse(
            status=False,
            message=f"Primary contact email '{form_data.primary_contact_email}' is already registered.",
            data={},
            errors={"details": "Primary contact email must be unique."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

    if await Schools.exists(primary_contact_phone=form_data.primary_contact_phone):
        resp = StandardResponse(
            status=False,
            message=f"Primary contact phone '{form_data.primary_contact_phone}' is already registered.",
            data={},
            errors={"details": "Primary contact phone must be unique."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

    if await SchoolStaff.exists(phone=form_data.admin_contact_phone):
        resp = StandardResponse(
            status=False,
            message=f"Admin contact phone '{form_data.admin_contact_phone}' is already registered.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)


    # Handle logo upload
    logo_s3_key = None
    if form_data.school_logo:
        try:
            logo_s3_key = await save_base64_image(
                base64_string=form_data.school_logo,
                destination_folder="uploads/school_logos",
                return_key_only=True,
            )
            if not logo_s3_key:
                print(f"Warning: Failed to save school logo for {form_data.school_name}")
        except Exception as err:
            resp = StandardResponse(
                status=False,
                message=f"Error processing school logo: {str(err)}",
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # Prepare school creation data manually mapping schema to model fields:
    school_create_data = {
        "school_name": form_data.school_name,
        "school_full_name": form_data.school_fullname,
        "school_logo": logo_s3_key or "",
        "school_code": form_data.school_code.upper(),
        "registration_no": form_data.registration_no,
        "school_location_link": form_data.school_location_link,
        "country_code": form_data.country_code,
        "phone": form_data.phone,
        "primary_contact_fullname": form_data.primary_contact_fullname,
        "primary_contact_email": form_data.primary_contact_email,
        "primary_contact_phone": form_data.primary_contact_phone,
        "location": form_data.location,
        "admin_contact_fullname": form_data.admin_contact_fullname,
        "admin_contact_email": form_data.admin_contact_email,
        "admin_contact_phone": form_data.admin_contact_phone,
        "address_line1": form_data.address_line1,
        "address_line2": form_data.address_line2,
        "landmark": form_data.landmark,
        "street": form_data.street,
        "state": form_data.state,
        "pincode": str(form_data.pincode) if form_data.pincode is not None else "",
        "country": form_data.country,
        "created_by": current_user["user_id"],
        "created_user_role": current_user["user_role"],
        "created_role_type": current_user["role_type"]
    }


    # Create school record
    school = await Schools.create(**school_create_data)

    # Generate username and password for admin user
    username = form_data.school_code.upper() + "-" + generate_user_code()
    hashed_password = create_password_hash(username)

    # Create school admin user record
    school_admin = await SchoolStaff.create(
        username=username,
        password=hashed_password,
        phone=form_data.admin_contact_phone,
        email=form_data.admin_contact_email,
        user_role=SchoolRoles.SCHOOL_ADMIN,
        school=school,
        is_active=True,
        is_verified=True,
    )

    resp = StandardResponse(
        status=True,
        message="School created successfully.",
        data={
            "school_id": school.school_id,
            "school_name": school.school_name,
            "school_code": school.school_code,
            "admin_username": school_admin.username
        },
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_201_CREATED)

