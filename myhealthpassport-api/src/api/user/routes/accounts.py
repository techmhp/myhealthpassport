import os
from typing import Optional

from fastapi import Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from tortoise.exceptions import IntegrityError
from tortoise.queryset import Q

from src.api.user import router
from src.core.file_manager import save_base64_image, get_new_url
from src.core.manager import get_current_user
from src.core.password_manager import create_password_hash
from src.core.rbac import (
    ALLOWED_CREATIONS_ADMIN,
    ALLOWED_CREATIONS_ANALYST,
    ALLOWED_CREATIONS_ON_GROUND_TEAM,
    ALLOWED_CREATIONS_SCREENING,
    ALLOWED_CREATIONS_CONSULTANT
)
from src.models.user_models import (
    AdminTeam,
    AdminTeamRoles,
    AnalystRoles,
    AnalystTeam,
    ConsultantTeam,
    OnGroundTeam,
    OnGroundTeamRoles,
    SchoolStaff,
    ScreeningTeam,
    ScreeningTeamRoles,
    ConsultantRoles
)
from src.models.school_models import (AssignSchool, Schools)
from src.models.student_models import Students, SchoolStudents, SmartScaleData
from src.models.screening_models import EyeScreening, DentalScreening, NutritionScreening, BehaviouralScreening
from src.models.other_models import ClinicalRecomendations,ClinicalFindings
from src.models.consultation_models import MedicalScreeningStatus

from src.utils.calculator import calculate_age_string
from src.utils.constants import TeamType
from src.utils.response import StandardResponse
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)


from ..schema import AdminTeamUserCreateSchema, RegularUserCreateSchema,convert_days_to_string,parse_days_available, ExpertUserCreateSchema



@router.post("/create-admin-team-account", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_team_account(data: AdminTeamUserCreateSchema, current_user: dict = Depends(get_current_user)):
    
    try:
        # Authorization Check
        creator_role_str = current_user.get("user_role")
        try:
            creator_role = AdminTeamRoles(creator_role_str)
            create_role = AdminTeamRoles(data.user_role)
        except ValueError:
            resp = StandardResponse(
                status=False,
                message="Invalid creator or target user role specified.",
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        allowed_set = ALLOWED_CREATIONS_ADMIN.get(creator_role, set())
        if create_role not in allowed_set:
            resp = StandardResponse(
                status=False,
                message=f"Users with role '{creator_role.value}' are not allowed to create '{create_role.value}' accounts.",
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

        # Pre-creation Validation Checks
        existing_phone = await AdminTeam.filter(phone=data.phone).exists()
        if existing_phone:
            resp = StandardResponse(
                status=False,
                message=f"An admin account with the phone number '{data.phone}' already exists.",
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        if data.email:
            existing_email = await AdminTeam.filter(email=data.email).exists()
            if existing_email:
                resp = StandardResponse(
                    status=False,
                    message=f"An admin account with the email '{data.email}' already exists.",
                    data={},
                    errors={},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        if data.employee_id:
            existing_employee_id = await AdminTeam.filter(employee_id=data.employee_id).exists()
            if existing_employee_id:
                resp = StandardResponse(
                    status=False,
                    message=f"An admin account with the employee ID '{data.employee_id}' already exists.",
                    data={},
                    errors={},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        # Profile Image Handling
        profile_image_store_path: Optional[str] = ""
        if data.profile_image:
            try:
                destination = "uploads/profile_images/admin_team/"
                profile_image_store_path = await save_base64_image(
                    base64_string=data.profile_image,
                    destination_folder=destination
                )
                if not profile_image_store_path:
                    print(f"Warning: Failed to save profile image for {data.first_name} {data.last_name}")
            except Exception as upload_err:
                resp = StandardResponse(
                    status=False,
                    message=f"Error saving profile image: {str(upload_err)}",
                    data={},
                    errors={},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Convert days_available to string
        days_available_str = convert_days_to_string(data.days_available)

        # Create User
        username = f"{data.first_name}-{data.last_name}-{data.phone[:3]}".upper()
        hashed_password = create_password_hash(username)

        user = await AdminTeam.create(
            first_name=data.first_name,
            last_name=data.last_name,
            middle_name=data.middle_name or "",
            username=username,
            phone=data.phone,
            email=data.email,
            password=hashed_password,
            user_role=create_role,
            is_active=True,
            is_verified=True,
            profile_image=profile_image_store_path,
            dob=data.dob,
            gender=data.gender,
            address_line_1=data.address_line_1,
            address_line_2=data.address_line_2,
            landmark=data.landmark,
            street_name=data.street_name,
            state=data.state,
            pincode=data.pincode,
            country_calling_code=data.country_calling_code,
            country=data.country,
            blood_group=data.blood_group,
            spoken_languages=data.spoken_languages,
            days_available=days_available_str,
            employee_id=data.employee_id,
            created_by=current_user["user_id"],
            created_user_role=current_user["user_role"],
            created_role_type=current_user["role_type"]   # see i added 3 values yes
        )

        # Prepare Response
        response_data = {
            "user_id": user.id,
            "username": user.username,
            "role": user.user_role.value,
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "last_name": user.last_name,
            "days_available": parse_days_available(user.days_available)
        }

        resp = StandardResponse(
            status=True,
            message=f"Admin user '{user.username}' (ID: {user.id}) created successfully.",
            data=response_data,
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_201_CREATED)

    except IntegrityError as e:
        resp = StandardResponse(
            status=False,
            message=f"An unexpected error occurred during account creation. Error: {str(e)}",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/create-screening-team-account", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_screening_team_account(data: RegularUserCreateSchema, current_user: dict = Depends(get_current_user)):
    try:
        # Authorization Check
        creator_role_str = current_user.get("user_role")
        target_role_str = data.user_role
        try:
            creator_role = AdminTeamRoles(creator_role_str)
            target_role = ScreeningTeamRoles(target_role_str)
        except ValueError:
            resp = StandardResponse(
                status=False,
                message="Invalid creator or target user role specified.",
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        allowed_set = ALLOWED_CREATIONS_SCREENING.get(creator_role, set())
        if target_role not in allowed_set:
            resp = StandardResponse(
                status=False,
                message=f"Users with role '{creator_role.value}' are not allowed to create '{target_role.value}' accounts.",
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

        # Pre-creation Validation Checks
        existing_phone = await ScreeningTeam.filter(phone=data.phone).exists()
        if existing_phone:
            resp = StandardResponse(
                status=False,
                message=f"A screening team account with the phone number '{data.phone}' already exists.",
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        if data.email:
            existing_email = await ScreeningTeam.filter(email=data.email).exists()
            if existing_email:
                resp = StandardResponse(
                    status=False,
                    message=f"A screening team account with the email '{data.email}' already exists.",
                    data={},
                    errors={},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        if data.employee_id:
            existing_employee_id = await ScreeningTeam.filter(employee_id=data.employee_id).exists()
            if existing_employee_id:
                resp = StandardResponse(
                    status=False,
                    message=f"A screening team account with the employee ID '{data.employee_id}' already exists.",
                    data={},
                    errors={},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        # Profile Image Handling
        profile_image_store_path: Optional[str] = ""
        if data.profile_image:
            try:
                destination = "uploads/profile_images/screening_team/"
                profile_image_store_path = await save_base64_image(
                    base64_string=data.profile_image,
                    destination_folder=destination
                )
                if not profile_image_store_path:
                    print(f"Warning: Failed to save profile image for {data.first_name} {data.last_name}")
            except Exception as upload_err:
                resp = StandardResponse(
                    status=False,
                    message=f"Error saving profile image: {str(upload_err)}",
                    data={},
                    errors={},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Convert days_available to string
        days_available_str = convert_days_to_string(data.days_available)

        # Create User
        username = f"SCR-{data.first_name[:3]}-{data.last_name[:3]}-{data.phone[-4:]}".upper()
        hashed_password = create_password_hash(username)

        user = await ScreeningTeam.create(
            first_name=data.first_name,
            last_name=data.last_name,
            middle_name=data.middle_name or "",
            username=username,
            phone=data.phone,
            email=data.email,
            password=hashed_password,
            user_role=target_role,
            is_active=True,
            is_verified=True,
            profile_image=profile_image_store_path or "",
            dob=data.dob,
            gender=data.gender,
            address_line_1=data.address_line_1,
            address_line_2=data.address_line_2,
            landmark=data.landmark,
            street_name=data.street_name,
            state=data.state,
            pincode=data.pincode,
            country_calling_code=data.country_calling_code,
            country=data.country,
            blood_group=data.blood_group,
            spoken_languages=data.spoken_languages,
            days_available=days_available_str,
            employee_id=data.employee_id,
            created_by=current_user["user_id"],
            created_user_role=current_user["user_role"],
            created_role_type=current_user["role_type"]
        )

        # Prepare Response
        response_data = {
            "user_id": user.id,
            "username": user.username,
            "role": user.user_role.value,
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "last_name": user.last_name,
            "days_available": parse_days_available(user.days_available)
        }

        resp = StandardResponse(
            status=True,
            message=f"Screening team user '{user.username}' (ID: {user.id}) created successfully.",
            data=response_data,
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_201_CREATED)

    except IntegrityError as e:
        resp = StandardResponse(
            status=False,
            message=f"Screening team account creation failed due to a conflict. Check unique fields like username, email, phone, or employee_id. Details: {e}",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

    except Exception as e:
        resp = StandardResponse(
            status=False,
            message=f"An unexpected error occurred during screening team account creation: {str(e)}",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/create-on-ground-team-account", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_on_ground_team_account(data: RegularUserCreateSchema, current_user: dict = Depends(get_current_user)):
    try:
        # Initialize profile_image_store_path to None
        profile_image_store_path: Optional[str] = ""

        # Authorization Check
        creator_role_str = current_user.get("user_role")
        target_role_str = data.user_role
        try:
            creator_role = AdminTeamRoles(creator_role_str)
            target_role = OnGroundTeamRoles(target_role_str)
        except ValueError:
            resp = StandardResponse(
                status=False,
                message="Invalid creator or target user role specified.",
                data={},
                errors={"role": f"Invalid role value provided. Creator: '{creator_role_str}', Target: '{target_role_str}'"},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        allowed_set = ALLOWED_CREATIONS_ON_GROUND_TEAM.get(creator_role, set())
        if target_role not in allowed_set:
            resp = StandardResponse(
                status=False,
                message=f"Users with role '{creator_role.value}' are not allowed to create '{target_role.value}' accounts.",
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

        # Pre-creation Validation Checks
        existing_phone = await OnGroundTeam.filter(phone=data.phone).exists()
        if existing_phone:
            resp = StandardResponse(
                status=False,
                message=f"An on-ground team account with the phone number '{data.phone}' already exists.",
                data={},
                errors={"phone": "Phone number already registered."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        if data.email:
            existing_email = await OnGroundTeam.filter(email=data.email).exists()
            if existing_email:
                resp = StandardResponse(
                    status=False,
                    message=f"An on-ground team account with the email '{data.email}' already exists.",
                    data={},
                    errors={"email": "Email address already registered."},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        if data.employee_id:
            existing_employee_id = await OnGroundTeam.filter(employee_id=data.employee_id).exists()
            if existing_employee_id:
                resp = StandardResponse(
                    status=False,
                    message=f"An on-ground team account with the employee ID '{data.employee_id}' already exists.",
                    data={},
                    errors={"employee_id": "Employee ID already registered."},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        # Profile Image Handling
        if data.profile_image:
            try:
                destination = "uploads/profile_images/on_ground_team/"
                profile_image_store_path = await save_base64_image(
                    base64_string=data.profile_image,
                    destination_folder=destination
                )
                if not profile_image_store_path:
                    print(f"Warning: Failed to save profile image for {data.first_name} {data.last_name}")
            except Exception as upload_err:
                resp = StandardResponse(
                    status=False,
                    message=f"Error saving profile image: {str(upload_err)}",
                    data={},
                    errors={"profile_image": "Failed to process uploaded image."},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Convert days_available to string
        days_available_str = convert_days_to_string(data.days_available)

        # Create User
        username_base = f"OGT-{data.first_name[:3]}-{data.last_name[:3]}-{data.phone[-4:]}"
        username = username_base.upper().replace(" ", "")
        hashed_password = create_password_hash(username)

        try:
            user = await OnGroundTeam.create(
                first_name=data.first_name,
                last_name=data.last_name,
                middle_name=data.middle_name or "",
                username=username,
                phone=data.phone,
                email=data.email,
                password=hashed_password,
                user_role=target_role,
                is_active=True,
                is_verified=True,
                profile_image=profile_image_store_path or "",
                dob=data.dob,
                gender=data.gender,
                address_line_1=data.address_line_1,
                address_line_2=data.address_line_2,
                landmark=data.landmark,
                street_name=data.street_name,
                state=data.state,
                pincode=data.pincode,
                country_calling_code=data.country_calling_code,
                country=data.country,
                blood_group=data.blood_group,
                spoken_languages=data.spoken_languages,
                days_available=days_available_str,
                employee_id=data.employee_id,
                created_by=current_user["user_id"],
                created_user_role=current_user["user_role"],
                created_role_type=current_user["role_type"]
            )

            response_data = {
                "user_id": user.id,
                "username": user.username,
                "role": user.user_role.value,
                "first_name": user.first_name,
                "middle_name": user.middle_name,
                "last_name": user.last_name,
                "days_available": parse_days_available(user.days_available)
            }
            resp = StandardResponse(
                status=True,
                message=f"Successfully created OnGroundTeam user. ID: {user.id}, Username: {user.username}",
                data=response_data,
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_201_CREATED)

        except IntegrityError as e:
            error_detail = str(e).lower()
            error_field = "unknown"
            if "username" in error_detail:
                error_field = "username"
            elif "phone" in error_detail:
                error_field = "phone"
            elif "email" in error_detail:
                error_field = "email"
            elif "employee_id" in error_detail:
                error_field = "employee_id"

            resp = StandardResponse(
                status=False,
                message=f"On-ground team account creation failed due to a conflict. The {error_field} might already be in use.",
                data={},
                errors={error_field: f"This {error_field} is already registered."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

    except Exception as e:
        resp = StandardResponse(
            status=False,
            message=f"An unexpected error occurred: {str(e)}",
            data={},
            errors={"server": "An internal server error occurred."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/create-analyst-team-account", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_analyst_team_account(
    data: RegularUserCreateSchema,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Authorization Check
        creator_role_str = current_user.get("user_role")
        target_role_str = data.user_role
        try:
            creator_role = AdminTeamRoles(creator_role_str)
            target_role = AnalystRoles(target_role_str)
        except ValueError:
            resp = StandardResponse(
                status=False,
                message="Invalid creator or target user role specified.",
                data={},
                errors={"role": f"Invalid role value provided. Creator: '{creator_role_str}', Target: '{target_role_str}'"},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        allowed_set = ALLOWED_CREATIONS_ANALYST.get(creator_role, set())
        if target_role not in allowed_set:
            resp = StandardResponse(
                status=False,
                message=f"Users with role '{creator_role.value}' are not allowed to create '{target_role.value}' accounts.",
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

        # Pre-creation Validation Checks
        existing_phone = await AnalystTeam.filter(phone=data.phone).exists()
        if existing_phone:
            resp = StandardResponse(
                status=False,
                message=f"An analyst team account with the phone number '{data.phone}' already exists.",
                data={},
                errors={"phone": "Phone number already registered."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        if data.email:
            existing_email = await AnalystTeam.filter(email=data.email).exists()
            if existing_email:
                resp = StandardResponse(
                    status=False,
                    message=f"An analyst team account with the email '{data.email}' already exists.",
                    data={},
                    errors={"email": "Email address already registered."},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        if data.employee_id:
            existing_employee_id = await AnalystTeam.filter(employee_id=data.employee_id).exists()
            if existing_employee_id:
                resp = StandardResponse(
                    status=False,
                    message=f"An analyst team account with the employee ID '{data.employee_id}' already exists.",
                    data={},
                    errors={"employee_id": "Employee ID already registered."},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        # Profile Image Handling
        profile_image_store_path: Optional[str] = None
        if data.profile_image:
            try:
                destination = "uploads/profile_images/analyst_team/"
                profile_image_store_path = await save_base64_image(
                    base64_string=data.profile_image,
                    destination_folder=destination
                )
                if not profile_image_store_path:
                    print(f"Warning: Failed to save profile image for {data.first_name} {data.last_name}")
            except Exception as upload_err:
                resp = StandardResponse(
                    status=False,
                    message=f"Error saving profile image: {str(upload_err)}",
                    data={},
                    errors={"profile_image": "Failed to process uploaded image."},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Convert days_available to string
        days_available_str = convert_days_to_string(data.days_available)

        # Create User
        username_base = f"ANT-{data.first_name[:3]}-{data.last_name[:3]}-{data.phone[-4:]}"
        username = username_base.upper().replace(" ", "")
        hashed_password = create_password_hash(username)

        try:
            user = await AnalystTeam.create(
                first_name=data.first_name,
                last_name=data.last_name,
                middle_name=data.middle_name or "",
                username=username,
                phone=data.phone,
                email=data.email,
                password=hashed_password,
                user_role=target_role,
                is_active=True,
                is_verified=True,
                profile_image=profile_image_store_path,
                dob=data.dob,
                gender=data.gender,
                address_line_1=data.address_line_1,
                address_line_2=data.address_line_2,
                landmark=data.landmark,
                street_name=data.street_name,
                state=data.state,
                pincode=data.pincode,
                country_calling_code=data.country_calling_code,
                country=data.country,
                blood_group=data.blood_group,
                spoken_languages=data.spoken_languages,
                days_available=days_available_str,
                employee_id=data.employee_id,
                created_by=current_user["user_id"],
                created_user_role=current_user["user_role"],
                created_role_type=current_user["role_type"]
            )

            response_data = {
                "user_id": user.id,
                "username": user.username,
                "role": user.user_role.value,
                "first_name": user.first_name,
                "middle_name": user.middle_name,
                "last_name": user.last_name,
                "days_available": parse_days_available(user.days_available)
            }
            resp = StandardResponse(
                status=True,
                message=f"Successfully created AnalystTeam user. ID: {user.id}, Username: {user.username}",
                data=response_data,
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_201_CREATED)

        except IntegrityError as e:
            error_detail = str(e).lower()
            error_field = "unknown"
            if "username" in error_detail:
                error_field = "username"
            elif "phone" in error_detail:
                error_field = "phone"
            elif "email" in error_detail:
                error_field = "email"
            elif "employee_id" in error_detail:
                error_field = "employee_id"

            resp = StandardResponse(
                status=False,
                message=f"Analyst team account creation failed due to a conflict. The {error_field} might already be in use.",
                data={},
                errors={error_field: f"This {error_field} is already registered."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

    except Exception as e:
        resp = StandardResponse(
            status=False,
            message=f"An unexpected error occurred: {str(e)}",
            data={},
            errors={"server": "An internal server error occurred."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@router.post("/create-consultation-team-account", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_consultation_team_account(
    data: ExpertUserCreateSchema,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Authorization Check
        creator_role_str = current_user.get("user_role")
        target_role_str = data.user_role
        try:
            creator_role = AdminTeamRoles(creator_role_str)
            target_role = ConsultantRoles(target_role_str)
        except ValueError:
            resp = StandardResponse(
                status=False,
                message="Invalid creator or target user role specified.",
                data={},
                errors={"role": f"Invalid role value provided. Creator: '{creator_role_str}', Target: '{target_role_str}'"},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        allowed_set = ALLOWED_CREATIONS_CONSULTANT.get(creator_role, set())
        if target_role not in allowed_set:
            resp = StandardResponse(
                status=False,
                message=f"Users with role '{creator_role.value}' are not allowed to create '{target_role.value}' accounts.",
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

        # Pre-creation Validation Checks
        existing_phone = await ConsultantTeam.filter(phone=data.phone).exists()
        if existing_phone:
            resp = StandardResponse(
                status=False,
                message=f"A consultant team account with the phone number '{data.phone}' already exists.",
                data={},
                errors={"phone": "Phone number already registered."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

        if data.email:
            existing_email = await ConsultantTeam.filter(email=data.email).exists()
            if existing_email:
                resp = StandardResponse(
                    status=False,
                    message=f"A consultant team account with the email '{data.email}' already exists.",
                    data={},
                    errors={"email": "Email address already registered."},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)
            
        if not data.available_time_slots or len(data.available_time_slots) == 0:
            resp = StandardResponse(
                status=False,
                message="Available time slots must be provided.",
                data={},
                errors={"available_time_slots": "This field is required and cannot be empty."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        formatted_slots = [
            {
                "day": day.day,
                "slots": [
                    {"start": slot.start, "end": slot.end}
                    for slot in day.slots
                ]
            }
            for day in data.available_time_slots
        ]
        # Profile Image Handling
        profile_image_store_path: Optional[str] = None
        if data.profile_image:
            try:
                destination = "uploads/profile_images/consultant_team/"
                profile_image_store_path = await save_base64_image(
                    base64_string=data.profile_image,
                    destination_folder=destination
                )
                if not profile_image_store_path:
                    print(f"Warning: Failed to save profile image for {data.first_name} {data.last_name}")
            except Exception as upload_err:
                resp = StandardResponse(
                    status=False,
                    message=f"Error saving profile image: {str(upload_err)}",
                    data={},
                    errors={"profile_image": "Failed to process uploaded image."},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
        # Create Username and Password
        username_base = f"CNT-{data.first_name[:3]}-{data.last_name[:3]}-{data.phone[-4:]}"
        username = username_base.upper().replace(" ", "")
        hashed_password = create_password_hash(username)

        try:
            user = await ConsultantTeam.create(
                first_name=data.first_name,
                last_name=data.last_name,
                middle_name=data.middle_name or "",
                username=username,
                password=hashed_password,
                education=data.education,
                phone=data.phone,
                location= data.location,
                email=data.email,
                clinic_name=data.clinic_name,
                profile_image=profile_image_store_path,
                dob=data.dob,
                gender=data.gender,
                location_link=data.location_link,
                address_line_1=data.address_line_1,
                address_line_2=data.address_line_2,
                landmark=data.landmark,
                experience=data.experience,
                specialty= data.specialty,
                street_name=data.street_name,
                state=data.state,
                pincode=data.pincode,
                qualifiation=data.education,
                country_calling_code=data.country_calling_code,
                country=data.country,
                user_role=target_role,
                role_type="CONSULTANT_TEAM",
                created_by=current_user["user_id"],
                created_user_role=current_user["user_role"],
                created_role_type=current_user["role_type"],
                available_time_slots = formatted_slots,
                consultation_duration=data.consultation_duration,
                max_consultations_per_day=data.max_consultations_per_day,
                consultation_charges=data.consultation_charges,
                brief_bio=data.brief_bio,
                license_number=data.license_number ,
                languages_spoken=data.languages_spoken,
            )

            response_data = {
                "user_id": user.id,
                "username": user.username,
                "role": user.user_role.value,
                "education":user.education,
                "first_name": user.first_name,
                "middle_name": user.middle_name,
                "last_name": user.last_name,
                "clinic_name": user.clinic_name,
                "available_time_slots": user.available_time_slots,
                "consultation_duration": f"{user.consultation_duration} mins",
                "max_consultations_per_day": user.max_consultations_per_day,
                "consultation_charges": user.consultation_charges,
                "brief_bio": user.brief_bio,
                "license_number": user.license_number,
                "languages_spoken": user.languages_spoken,
            }
            resp = StandardResponse(
                status=True,
                message=f"Successfully created ConsultantTeam user. ID: {user.id}, Username: {user.username}",
                data=response_data,
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_201_CREATED)

        except IntegrityError as e:
            error_detail = str(e).lower()
            error_field = "unknown"
            if "username" in error_detail:
                error_field = "username"
            elif "phone" in error_detail:
                error_field = "phone"
            elif "email" in error_detail:
                error_field = "email"

            resp = StandardResponse(
                status=False,
                message=f"Consultant team account creation failed due to a conflict. The {error_field} might already be in use.",
                data={},
                errors={error_field: f"This {error_field} is already registered."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

    except Exception as e:
        resp = StandardResponse(
            status=False,
            message=f"An unexpected error occurred: {str(e)}",
            data={},
            errors={"server": "An internal server error occurred."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)



# @router.get("/", response_model=StandardResponse)
# async def list_users_by_team(
#     team_type: TeamType = Query(..., description="Specify the team type to list users from."),
#     role: Optional[str] = Query(None, description="Filter by a specific user role within the team"),
#     is_active: Optional[bool] = Query(None, description="Filter by active status"),
#     search: Optional[str] = Query(None, description="Search by name, email, or phone"),
#     skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
#     limit: int = Query(100, ge=1, le=500, description="Max number of records to return"),
#     current_user: dict = Depends(get_current_user)
# ):
#     try:
#         # Authorization Check
#         requestor_role = AdminTeamRoles(current_user.get("user_role"))
#         if requestor_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
#             resp = StandardResponse(status=False, message="Forbidden: Insufficient permissions.", data={}, errors={})
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)
#     except ValueError:
#         resp = StandardResponse(status=False, message="Invalid user role.", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     # Determine Model and Base Query based on team_type
#     model_map = {
#         TeamType.ADMIN_TEAM: AdminTeam,
#         TeamType.SCREENING_TEAM: ScreeningTeam,
#         TeamType.ON_GROUND_TEAM: OnGroundTeam,
#         TeamType.ANALYST_TEAM: AnalystTeam,
#         TeamType.CONSULTANT_TEAM: ConsultantTeam,
#         TeamType.SCHOOL_STAFF: SchoolStaff
#     }

#     TargetModel = model_map.get(team_type)
#     if not TargetModel:
#         resp = StandardResponse(status=False, message=f"Invalid team type specified: {team_type}", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     base_query = TargetModel.all()

#     # Apply Filters
#     filters = Q()
#     if role:
#         filters &= Q(user_role=role)
#     if is_active is not None:
#         filters &= Q(is_active=is_active)
#     if search:
#         search_filter = (
#             Q(first_name__icontains=search) |
#             Q(last_name__icontains=search) |
#             Q(username__icontains=search) |
#             Q(email__icontains=search) |
#             Q(phone__icontains=search)
#         )
#         filters &= search_filter

#     query = base_query.filter(filters)

#     # Get Total Count
#     try:
#         total_count = await query.count()
#     except Exception as e:
#         resp = StandardResponse(status=False, message=f"Error counting users: {str(e)}", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     # Fetch Data
#     try:
#         users = await query.offset(skip).limit(limit).order_by('id')
#         user_list = []
#         for user in users:
#             profile_image_url = await get_new_url(user.profile_image) if user.profile_image else ""

#             user_list.append({
#                 "id": user.id,
#                 "first_name": user.first_name,
#                 "last_name": user.last_name,
#                 "email": user.email,
#                 "username": user.username,
#                 "phone": user.phone,
#                 "user_role": user.user_role,
#                 "role_type": user.role_type,
#                 "is_active": user.is_active,
#                 "profile_image": profile_image_url,
#                 "dob": str(user.dob),
#                 "gender": user.gender,
#                 "landmark": user.landmark,
#                 "location": user.location,
#                 "country_calling_code": user.country_calling_code,
#                 "age": calculate_age_string(user.dob),
#                 "days_available": parse_days_available(user.days_available),
#                 "employee_id":user.employee_id
#             })
#     except Exception as e:
#         resp = StandardResponse(
#             status=False,
#             message=f"Error fetching users: {str(e)}",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     # Prepare Response
#     resp_data = {
#         "users": user_list,
#         "total": total_count,
#         "skip": skip,
#         "limit": limit,
#         "team_type": team_type.value
#     }
#     resp = StandardResponse(
#         status=True,
#         message=f"{team_type.value} team users retrieved successfully.",
#         data=resp_data,
#         errors={}
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)



from datetime import datetime # Make sure to import this

from datetime import datetime # Ensure this is imported
# # users-list
# @router.get("/", response_model=StandardResponse)
# async def list_users_by_team(
#     team_type: TeamType = Query(..., description="Specify the team type to list users from."),
#     role: Optional[str] = Query(None, description="Filter by a specific user role within the team"),
#     is_active: Optional[bool] = Query(None, description="Filter by active status"),
#     search: Optional[str] = Query(None, description="Search by name, email, or phone"),
#     skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
#     limit: int = Query(100, ge=1, le=500, description="Max number of records to return"),
#     current_user: dict = Depends(get_current_user)
# ):
#     try:
#         # Authorization Check
#         requestor_role = AdminTeamRoles(current_user.get("user_role"))
#         if requestor_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
#             resp = StandardResponse(status=False, message="Forbidden: Insufficient permissions.", data={}, errors={})
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)
#     except ValueError:
#         resp = StandardResponse(status=False, message="Invalid user role.", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     # Determine Model and Base Query based on team_type
#     model_map = {
#         TeamType.ADMIN_TEAM: AdminTeam,
#         TeamType.SCREENING_TEAM: ScreeningTeam,
#         TeamType.ON_GROUND_TEAM: OnGroundTeam,
#         TeamType.ANALYST_TEAM: AnalystTeam,
#         TeamType.CONSULTANT_TEAM: ConsultantTeam,
#         TeamType.SCHOOL_STAFF: SchoolStaff
#     }

#     TargetModel = model_map.get(team_type)
#     if not TargetModel:
#         resp = StandardResponse(status=False, message=f"Invalid team type specified: {team_type}", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     base_query = TargetModel.all()

#     # Apply Filters
#     filters = Q()
#     if role:
#         filters &= Q(user_role=role)
#     if is_active is not None:
#         filters &= Q(is_active=is_active)
#     if search:
#         search_filter = (
#             Q(first_name__icontains=search) |
#             Q(last_name__icontains=search) |
#             Q(username__icontains=search) |
#             Q(email__icontains=search) |
#             Q(phone__icontains=search)
#         )
#         filters &= search_filter

#     query = base_query.filter(filters)

#     # Get Total Count
#     try:
#         total_count = await query.count()
#     except Exception as e:
#         resp = StandardResponse(status=False, message=f"Error counting users: {str(e)}", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     # Fetch Data
#     try:
#         users = await query.offset(skip).limit(limit).order_by('id')
#         user_list = []
#         for user in users:
#             profile_image_url = await get_new_url(user.profile_image) if user.profile_image else ""

#             # Define the Base User Data (Shared across all assignments)
#             base_user_data = {
#                 "id": user.id,
#                 "first_name": user.first_name,
#                 "last_name": user.last_name,
#                 "email": user.email,
#                 "username": user.username,
#                 "phone": user.phone,
#                 "user_role": user.user_role,
#                 "role_type": user.role_type,
#                 "is_active": user.is_active,
#                 "profile_image": profile_image_url,
#                 "dob": str(user.dob),
#                 "gender": user.gender,
#                 "landmark": user.landmark,
#                 "location": user.location,
#                 "country_calling_code": user.country_calling_code,
#                 "age": calculate_age_string(user.dob),
#                 "days_available": parse_days_available(user.days_available),
#                 "employee_id": user.employee_id
#             }

#             # ---------------------------------------------------------------
#             # FLATTENING LOGIC
#             # ---------------------------------------------------------------
#             assignments_found = False

#             if team_type in [TeamType.ON_GROUND_TEAM, TeamType.SCREENING_TEAM, TeamType.ANALYST_TEAM, TeamType.ADMIN_TEAM]:
#                 # Fetch assignments
#                 # === CHANGE MADE HERE: REMOVED is_completed=False ===
#                 assignments = await AssignSchool.filter(
#                     user_id=user.id,
#                     team_type=team_type.value,
#                     # is_completed=False,  <-- REMOVED THIS LINE so it fetches True AND False
#                     is_deleted=False
#                 ).values('school', 'date', 'is_completed') 
                
#                 if assignments:
#                     assignments_found = True

#                     # Extract IDs and fetch School Names
#                     school_ids = [a['school'] for a in assignments]
#                     schools = await Schools.filter(school_id__in=school_ids).values('school_id', 'school_name')
#                     school_map = {s['school_id']: s['school_name'] for s in schools}

#                     # Iterate through assignments and create separate rows
#                     for assign in assignments:
#                         s_id = assign['school']
#                         date_val = assign['date']
#                         is_comp = assign['is_completed'] # Extract is_completed status
                        
#                         formatted_date = date_val.strftime("%d-%m-%Y") if date_val else None
#                         school_name = school_map.get(s_id, "Unknown School")

#                         user_row = base_user_data.copy()
#                         user_row["assigned_schools"] = school_name
#                         user_row["Assigned_date"] = formatted_date
                        
#                         # Return the actual status (True or False)
#                         user_row["is_completed"] = is_comp 
                        
#                         user_list.append(user_row)

#             # Handle Users with NO Assignments
#             if not assignments_found:
#                 user_row = base_user_data.copy()
#                 user_row["assigned_schools"] = None
#                 user_row["Assigned_date"] = None
#                 user_row["is_completed"] = None 
#                 user_list.append(user_row)

#         # ---------------------------------------------------------------
#         # SORTING LOGIC (GLOBAL)
#         # Sort the entire flattened list by 'Assigned_date' Descending
#         # ---------------------------------------------------------------
#         def date_sorter(item):
#             d_str = item.get("Assigned_date")
#             if d_str:
#                 return datetime.strptime(d_str, "%d-%m-%Y")
#             return datetime.min 

#         # Sort in place: Reverse=True means Latest date first
#         user_list.sort(key=date_sorter, reverse=True)

#     except Exception as e:
#         resp = StandardResponse(
#             status=False,
#             message=f"Error fetching users: {str(e)}",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     # Prepare Response
#     resp_data = {
#         "users": user_list,
#         "total": total_count,
#         "skip": skip,
#         "limit": limit,
#         "team_type": team_type.value
#     }
#     resp = StandardResponse(
#         status=True,
#         message=f"{team_type.value} team users retrieved successfully.",
#         data=resp_data,
#         errors={}
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

from collections import defaultdict

# Map role_type to model (subset relevant to ScreeningTeam)
MODEL_MAP = {
    "SCREENING_TEAM": ScreeningTeam,
    "ON_GROUND_TEAM": OnGroundTeam,
    "ANALYST_TEAM": AnalystTeam,
    "ADMIN_TEAM": AdminTeam,
}

# Map user roles to their specific screening models
ROLE_SCREENING_MAP = {
    ScreeningTeamRoles.PHYSICAL_WELLBEING.value: SmartScaleData,
    ScreeningTeamRoles.PSYCHOLOGIST.value: BehaviouralScreening,
    ScreeningTeamRoles.DENTIST.value: DentalScreening,
    ScreeningTeamRoles.EYE_SPECIALIST.value: EyeScreening,
    ScreeningTeamRoles.NUTRITIONIST.value: NutritionScreening,
    AnalystRoles.NUTRITIONIST.value: NutritionScreening,
    AnalystRoles.PSYCHOLOGIST.value: BehaviouralScreening,
    AnalystRoles.MEDICAL_OFFICER.value: EyeScreening,  # or whatever is relevant

    # OnGround roles
    OnGroundTeamRoles.REGISTRATION_TEAM.value: EyeScreening,  # or SmartScaleData, depending on what they should see
    OnGroundTeamRoles.CAMP_COORDINATOR.value: EyeScreening,  # or another relevant model
}


## /users?team_type
# @router.get("/", response_model=StandardResponse)
# async def list_users_by_team(
#     team_type: TeamType = Query(..., description="Specify the team type to list users from."),
#     school_id: Optional[str] = Query(None, description="Optional: Filter users assigned to this specific school. Leave empty to fetch all schools."),
#     role: Optional[str] = Query(None, description="Filter by a specific user role within the team"),
#     is_active: Optional[bool] = Query(None, description="Filter by active status"),
#     search: Optional[str] = Query(None, description="Search by name, email, or phone"),
#     academic_year: Optional[str] = Query(None, description="Academic year (e.g., 2024-2025)", regex=r"^\d{4}-\d{4}$"),
#     skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
#     limit: int = Query(100, ge=1, le=500, description="Max number of records to return"),
#     current_user: dict = Depends(get_current_user)
# ):
#     try:
#         # Authorization Check
#         requestor_role = AdminTeamRoles(current_user.get("user_role"))
#         if requestor_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
#             resp = StandardResponse(status=False, message="Forbidden: Insufficient permissions.", data={}, errors={})
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)
#     except ValueError:
#         resp = StandardResponse(status=False, message="Invalid user role.", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     # Convert school_id to int if provided and not empty
#     school_id_int = None
#     if school_id and school_id.strip():
#         try:
#             school_id_int = int(school_id)
#         except ValueError:
#             resp = StandardResponse(status=False, message="Invalid school_id. Must be a valid integer.", data={}, errors={})
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     # === Academic Year ===
#     academic_year = academic_year or get_current_academic_year()
#     try:
#         parse_academic_year(academic_year)
#     except ValueError as e:
#         resp = StandardResponse(status=False, message=str(e), data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
    
#     year_filter_q = build_academic_year_filter(academic_year)

#     # Determine Model based on team_type
#     model_map = {
#         TeamType.ADMIN_TEAM: AdminTeam,
#         TeamType.SCREENING_TEAM: ScreeningTeam,
#         TeamType.ON_GROUND_TEAM: OnGroundTeam,
#         TeamType.ANALYST_TEAM: AnalystTeam,
#         TeamType.CONSULTANT_TEAM: ConsultantTeam,
#         TeamType.SCHOOL_STAFF: SchoolStaff
#     }

#     TargetModel = model_map.get(team_type)
#     if not TargetModel:
#         resp = StandardResponse(status=False, message=f"Invalid team type specified: {team_type}", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     # === Fetch Assignments First (to determine which users are assigned) ===
#     assignment_filters = [
#         year_filter_q,
#         Q(team_type=team_type.value),
#         Q(is_deleted=False)
#     ]
    
#     # Only filter by school_id if it's provided
#     if school_id_int is not None:
#         assignment_filters.append(Q(school=school_id_int))

#     assignments = await AssignSchool.filter(*assignment_filters).only(
#         "id", "user_id", "school", "date", "class_no", "section"
#     )

#     # Get assigned user IDs
#     assigned_user_ids = {a.user_id for a in assignments} if assignments else set()

#     # Apply Filters on TargetModel
#     filters = Q()
#     if role:
#         filters &= Q(user_role=role)
#     if is_active is not None:
#         filters &= Q(is_active=is_active)
#     if search:
#         search_filter = (
#             Q(first_name__icontains=search) |
#             Q(last_name__icontains=search) |
#             Q(username__icontains=search) |
#             Q(email__icontains=search) |
#             Q(phone__icontains=search)
#         )
#         filters &= search_filter

#     # Only restrict to assigned users if school_id is provided
#     if school_id_int is not None:
#         if assigned_user_ids:
#             filters &= Q(id__in=assigned_user_ids)
#         else:
#             # No users assigned to this specific school → return empty
#             resp_data = {
#                 "users": [],
#                 "total": 0,
#                 "skip": skip,
#                 "limit": limit,
#                 "team_type": team_type.value,
#                 "academic_year": academic_year,
#                 "school_id": school_id_int
#             }
#             return StandardResponse.success_response(
#                 message="No users assigned to this school in the selected academic year.",
#                 data=resp_data
#             )

#     query = TargetModel.filter(filters)

#     # Get Total Count
#     total_count = await query.count()

#     # Fetch Users with pagination
#     users = await query.offset(skip).limit(limit).order_by('id')

#     # === Pre-fetch school names ===
#     school_ids = {a.school for a in assignments if a.school}
#     schools_map = {}
#     if school_ids:
#         schools = await Schools.filter(school_id__in=school_ids, is_deleted=False).values("school_id", "school_name")
#         schools_map = {s["school_id"]: s["school_name"] for s in schools}

#     # Group assignments by user
#     from collections import defaultdict
#     user_assignments = defaultdict(list)
#     for a in assignments:
#         user_assignments[a.user_id].append(a)

#     # Screening models for completion check
#     screening_models = [SmartScaleData, DentalScreening, EyeScreening, NutritionScreening, BehaviouralScreening]
#     from datetime import date as date_module
#     today = date_module.today()

#     user_list = []
#     for user in users:
#         profile_image_url = await get_new_url(user.profile_image) if user.profile_image else ""

#         user_assigns = user_assignments.get(user.id, [])
        
#         # ✅ FIX: Group assignments by school FIRST
#         schools_assignments = defaultdict(list)
#         for assign in user_assigns:
#             if assign.school:
#                 schools_assignments[assign.school].append(assign)
        
#         schools_dict = {}
#         today_schools_set = set()
#         total_students_all = 0
#         screened_students_all = 0

#         # ✅ FIX: Process all assignments for each school together
#         for school_id_val, school_assigns in schools_assignments.items():
#             school_name = schools_map.get(school_id_val, "Unknown School")
            
#             # Get the first assignment date for display (or latest)
#             first_assign = school_assigns[0]
#             formatted_date = first_assign.date.strftime("%d-%m-%Y") if first_assign.date else None

#             # Check if any assignment is today
#             if any(assign.date and assign.date == today for assign in school_assigns):
#                 today_schools_set.add(school_name)

#             # ✅ FIX: Collect ALL class/sections from ALL assignments for this school
#             assigned_class_sections = set()
#             for assign in school_assigns:
#                 if assign.class_no:
#                     classes = [c.strip() for c in assign.class_no.split(",") if c.strip()]
#                     sections = [s.strip().upper() for s in (assign.section or "").split(",") if s.strip()] or [""]
#                     for c in classes:
#                         for s in sections:
#                             assigned_class_sections.add((c, s if s else ""))

#             # ✅ Build filter for ALL collected class/sections
#             student_filter = Q()
#             for class_room, section in assigned_class_sections:
#                 if section:
#                     student_filter |= Q(class_room=class_room, section=section)
#                 else:
#                     student_filter |= Q(class_room=class_room)

#             # Get students for this school
#             if student_filter:
#                 assigned_students = await Students.filter(
#                     student_filter,
#                     school_students__school=school_id_val
#                 ).values_list("id", flat=True)
#             else:
#                 # If no specific classes, get all students in the school
#                 assigned_students = await Students.filter(
#                     school_students__school=school_id_val
#                 ).values_list("id", flat=True)

#             total_students = len(assigned_students)
#             total_students_all += total_students

#             is_school_completed = False
#             screened_in_school = 0
#             if total_students > 0:
#                 sets = []
#                 for m in screening_models:
#                     done = await m.filter(
#                         year_filter_q & Q(student_id__in=assigned_students, screening_status=True)
#                     ).values_list("student_id", flat=True)
#                     sets.append(set(done))
#                 if sets:
#                     common = set.intersection(*sets)
#                     screened_in_school = len(common)
#                     is_school_completed = screened_in_school == total_students
#             else:
#                 is_school_completed = True

#             screened_students_all += screened_in_school

#             schools_dict[school_id_val] = {
#                 "school_name": school_name,
#                 "assigned_date": formatted_date,
#                 "is_completed": is_school_completed,
#                 "total_students": total_students,
#                 "screened_students": screened_in_school
#             }

#         assigned_schools_list = list(schools_dict.values())
#         is_user_completed = all(s["is_completed"] for s in assigned_schools_list) if assigned_schools_list else False

#         user_data = {
#             "id": user.id,
#             "first_name": user.first_name,
#             "last_name": user.last_name,
#             "email": user.email,
#             "username": user.username,
#             "phone": user.phone,
#             "user_role": user.user_role,
#             "role_type": user.role_type,
#             "is_active": user.is_active,
#             "profile_image": profile_image_url,
#             "dob": str(user.dob),
#             "gender": user.gender,
#             "landmark": user.landmark,
#             "location": user.location,
#             "experience": getattr(user, 'experience', 'NA'),
#             "country_calling_code": user.country_calling_code,
#             "age": calculate_age_string(user.dob),
#             "days_available": parse_days_available(user.days_available) if hasattr(user, 'days_available') and user.days_available else None,
#             "employee_id": getattr(user, "employee_id", "NA"),
#             "assigned_schools": ", ".join(sorted(today_schools_set)) if today_schools_set else None,
#             "assigned_schools_list": assigned_schools_list,
#             "total_students": total_students_all,
#             "screened_students": screened_students_all,
#             "is_completed": is_user_completed
#         }
#         user_list.append(user_data)

#     resp_data = {
#         "users": user_list,
#         "total": total_count,
#         "skip": skip,
#         "limit": limit,
#         "team_type": team_type.value,
#         "academic_year": academic_year,
#         "school_id": school_id_int
#     }

#     # Dynamic message based on whether school_id filter was applied
#     if school_id_int is not None:
#         school_name = schools_map.get(school_id_int, "Unknown School")
#         message = f"Users assigned to school '{school_name}' (ID: {school_id_int}) retrieved."
#     else:
#         message = "Users retrieved successfully from all schools."

#     resp = StandardResponse(
#         status=True,
#         message=message,
#         data=resp_data,
#         errors={}
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

## /users?team_type
@router.get("", response_model=StandardResponse)
async def list_users_by_team(
    team_type: TeamType = Query(..., description="Specify the team type to list users from."),
    school_id: Optional[str] = Query(None, description="Optional: Filter users assigned to this specific school. Leave empty to fetch all schools."),
    role: Optional[str] = Query(None, description="Filter by a specific user role within the team"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    academic_year: Optional[str] = Query(None, description="Academic year (e.g., 2024-2025)", regex=r"^\d{4}-\d{4}$"),
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Max number of records to return"),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Authorization Check
        requestor_role = AdminTeamRoles(current_user.get("user_role"))
        if requestor_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
            resp = StandardResponse(status=False, message="Forbidden: Insufficient permissions.", data={}, errors={})
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)
    except ValueError:
        resp = StandardResponse(status=False, message="Invalid user role.", data={}, errors={})
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # Convert school_id to int if provided and not empty
    school_id_int = None
    if school_id and school_id.strip():
        try:
            school_id_int = int(school_id)
        except ValueError:
            resp = StandardResponse(status=False, message="Invalid school_id. Must be a valid integer.", data={}, errors={})
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # === Academic Year ===
    academic_year = academic_year or get_current_academic_year()
    try:
        parse_academic_year(academic_year)
    except ValueError as e:
        resp = StandardResponse(status=False, message=str(e), data={}, errors={})
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
    
    year_filter_q = build_academic_year_filter(academic_year)

    # Determine Model based on team_type
    model_map = {
        TeamType.ADMIN_TEAM: AdminTeam,
        TeamType.SCREENING_TEAM: ScreeningTeam,
        TeamType.ON_GROUND_TEAM: OnGroundTeam,
        TeamType.ANALYST_TEAM: AnalystTeam,
        TeamType.CONSULTANT_TEAM: ConsultantTeam,
        TeamType.SCHOOL_STAFF: SchoolStaff
    }

    TargetModel = model_map.get(team_type)
    if not TargetModel:
        resp = StandardResponse(status=False, message=f"Invalid team type specified: {team_type}", data={}, errors={})
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # === Fetch Assignments First (to determine which users are assigned) ===
    assignment_filters = [
        year_filter_q,
        Q(team_type=team_type.value),
        Q(is_deleted=False)
    ]
    
    # Only filter by school_id if it's provided
    if school_id_int is not None:
        assignment_filters.append(Q(school=school_id_int))

    assignments = await AssignSchool.filter(*assignment_filters).only(
        "id", "user_id", "school", "date", "class_no", "section"
    )

    # Get assigned user IDs
    assigned_user_ids = {a.user_id for a in assignments} if assignments else set()

    # Apply Filters on TargetModel
    filters = Q()
    if role:
        filters &= Q(user_role=role)
    if is_active is not None:
        filters &= Q(is_active=is_active)
    if search:
        search_filter = (
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(username__icontains=search) |
            Q(email__icontains=search) |
            Q(phone__icontains=search)
        )
        filters &= search_filter

    # Only restrict to assigned users if school_id is provided
    if school_id_int is not None:
        if assigned_user_ids:
            filters &= Q(id__in=assigned_user_ids)
        else:
            # No users assigned to this specific school → return empty
            resp_data = {
                "users": [],
                "total": 0,
                "skip": skip,
                "limit": limit,
                "team_type": team_type.value,
                "academic_year": academic_year,
                "school_id": school_id_int
            }
            return StandardResponse.success_response(
                message="No users assigned to this school in the selected academic year.",
                data=resp_data
            )
    filters &= Q(is_deleted=False)
    query = TargetModel.filter(filters)

    # Get Total Count
    total_count = await query.count()

    # Fetch Users with pagination
    users = await query.offset(skip).limit(limit).order_by('id')

    # === Pre-fetch school names ===
    school_ids = {a.school for a in assignments if a.school}
    schools_map = {}
    if school_ids:
        schools = await Schools.filter(school_id__in=school_ids, is_deleted=False).values("school_id", "school_name")
        schools_map = {s["school_id"]: s["school_name"] for s in schools}

    # Group assignments by user
    from collections import defaultdict
    user_assignments = defaultdict(list)
    for a in assignments:
        user_assignments[a.user_id].append(a)

    # Screening models for completion check (used for admin and other roles)
    screening_models = [SmartScaleData, DentalScreening, EyeScreening, NutritionScreening, BehaviouralScreening]
    from datetime import date as date_module
    today = date_module.today()

    user_list = []
    for user in users:
        profile_image_url = await get_new_url(user.profile_image) if user.profile_image else ""

        user_assigns = user_assignments.get(user.id, [])
        
        # Group assignments by school FIRST
        schools_assignments = defaultdict(list)
        for assign in user_assigns:
            if assign.school:
                schools_assignments[assign.school].append(assign)
        
        schools_dict = {}
        today_schools_set = set()
        total_students_all = 0
        screened_students_all = 0

        # Process all assignments for each school together
        for school_id_val, school_assigns in schools_assignments.items():
            school_name = schools_map.get(school_id_val, "Unknown School")
            
            # Get the first assignment date for display (or latest)
            first_assign = school_assigns[0]
            formatted_date = first_assign.date.strftime("%d-%m-%Y") if first_assign.date else None

            # Check if any assignment is today
            if any(assign.date and assign.date == today for assign in school_assigns):
                today_schools_set.add(school_name)

            # Collect ALL class/sections from ALL assignments for this school
            assigned_class_sections = set()
            for assign in school_assigns:
                if assign.class_no:
                    classes = [c.strip() for c in assign.class_no.split(",") if c.strip()]
                    sections = [s.strip().upper() for s in (assign.section or "").split(",") if s.strip()] or [""]
                    for c in classes:
                        for s in sections:
                            assigned_class_sections.add((c, s if s else ""))

            # Build filter for ALL collected class/sections
            student_filter = Q()
            for class_room, section in assigned_class_sections:
                if section:
                    student_filter |= Q(class_room=class_room, section=section)
                else:
                    student_filter |= Q(class_room=class_room)

            # Get students for this school
            if student_filter:
                assigned_students = await Students.filter(
                    student_filter,
                    school_students__school=school_id_val
                ).values_list("id", flat=True)
            else:
                # If no specific classes, get all students in the school
                assigned_students = await Students.filter(
                    school_students__school=school_id_val
                ).values_list("id", flat=True)

            total_students = len(assigned_students)
            total_students_all += total_students

            is_school_completed = False
            screened_in_school = 0
            
            # Get user role as string
            user_role_str = user.user_role.value if hasattr(user.user_role, 'value') else str(user.user_role)
            
            # ✅ FIX: Determine if user is screening team or analyst team
            SCREENING_TEAM_ROLES = ["NUTRITIONIST", "PSYCHOLOGIST", "DENTIST", "EYE_SPECIALIST", "PHYSICAL_WELLBEING"]
            ANALYST_ROLES = ["NUTRITIONIST", "PSYCHOLOGIST", "MEDICAL_OFFICER"]
            
            is_screening_team = (team_type == TeamType.SCREENING_TEAM and user_role_str in SCREENING_TEAM_ROLES)
            is_analyst = (team_type == TeamType.ANALYST_TEAM and user_role_str in ANALYST_ROLES)
            
            # ✅ Calculate completion based on role type
            if total_students > 0:
                if is_analyst:
                    # ANALYST TEAM - Check analysis_status
                    if user_role_str == "NUTRITIONIST":
                        nutrition_completed = await ClinicalRecomendations.filter(
                            year_filter_q & Q(student_id__in=assigned_students, analysis_status=True)
                        ).distinct().values_list("student_id", flat=True)
                        screened_in_school = len(set(nutrition_completed))
                        
                    elif user_role_str == "PSYCHOLOGIST":
                        psych_completed = await ClinicalFindings.filter(
                            year_filter_q & Q(student_id__in=assigned_students, analysis_status=True)
                        ).distinct().values_list("student_id", flat=True)
                        screened_in_school = len(set(psych_completed))
                        
                    elif user_role_str == "MEDICAL_OFFICER":
                        required_statuses = {
                            "physical_screening_status",
                            "lab_report_status",
                            "dental_screening_status",
                            "vision_screening_status",
                            "psychological_report_status",
                            "nutritional_report_status"
                        }
                        
                        med_statuses = await MedicalScreeningStatus.filter(
                            year_filter_q & Q(student_id__in=assigned_students, is_deleted=False)
                        ).all()
                        
                        med_by_student = {}
                        for ms in med_statuses:
                            med_by_student.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = ms.status
                        
                        completed_ids = set()
                        for sid in assigned_students:
                            student_statuses = med_by_student.get(sid, {})
                            if required_statuses.issubset(student_statuses.keys()) and all(
                                student_statuses[status_type] == "verified" for status_type in required_statuses
                            ):
                                completed_ids.add(sid)
                        
                        screened_in_school = len(completed_ids)
                    
                    is_school_completed = (screened_in_school == total_students)
                    
                elif is_screening_team:
                    # ✅ SCREENING TEAM - Check only their specific screening_status
                    if user_role_str == "NUTRITIONIST":
                        screened_ids = await NutritionScreening.filter(
                            year_filter_q & Q(student_id__in=assigned_students, screening_status=True)
                        ).distinct().values_list("student_id", flat=True)
                        screened_in_school = len(set(screened_ids))
                        
                    elif user_role_str == "PSYCHOLOGIST":
                        screened_ids = await BehaviouralScreening.filter(
                            year_filter_q & Q(student_id__in=assigned_students, screening_status=True)
                        ).distinct().values_list("student_id", flat=True)
                        screened_in_school = len(set(screened_ids))
                        
                    elif user_role_str == "DENTIST":
                        screened_ids = await DentalScreening.filter(
                            year_filter_q & Q(student_id__in=assigned_students, screening_status=True)
                        ).distinct().values_list("student_id", flat=True)
                        screened_in_school = len(set(screened_ids))
                        
                    elif user_role_str == "EYE_SPECIALIST":
                        screened_ids = await EyeScreening.filter(
                            year_filter_q & Q(student_id__in=assigned_students, screening_status=True)
                        ).distinct().values_list("student_id", flat=True)
                        screened_in_school = len(set(screened_ids))
                        
                    elif user_role_str == "PHYSICAL_WELLBEING":
                        screened_ids = await SmartScaleData.filter(
                            year_filter_q & Q(student_id__in=assigned_students, screening_status=True)
                        ).distinct().values_list("student_id", flat=True)
                        screened_in_school = len(set(screened_ids))
                    
                    is_school_completed = (screened_in_school == total_students)
                    
                else:
                    # ADMIN_TEAM and other roles - Check all 5 screenings
                    sets = []
                    for m in screening_models:
                        done = await m.filter(
                            year_filter_q & Q(student_id__in=assigned_students, screening_status=True)
                        ).values_list("student_id", flat=True)
                        sets.append(set(done))
                    if sets:
                        common = set.intersection(*sets)
                        screened_in_school = len(common)
                        is_school_completed = screened_in_school == total_students
            else:
                is_school_completed = True

            screened_students_all += screened_in_school

            schools_dict[school_id_val] = {
                "school_name": school_name,
                "assigned_date": formatted_date,
                "is_completed": is_school_completed,
                "total_students": total_students,
                "screened_students": screened_in_school
            }

        assigned_schools_list = list(schools_dict.values())
        is_user_completed = all(s["is_completed"] for s in assigned_schools_list) if assigned_schools_list else False

        user_data = {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "username": user.username,
            "phone": user.phone,
            "user_role": user.user_role,
            "role_type": user.role_type,
            "is_active": user.is_active,
            "profile_image": profile_image_url,
            "dob": str(user.dob),
            "gender": user.gender,
            "landmark": user.landmark,
            "location": user.location,
            "experience": getattr(user, 'experience', 'NA'),
            "country_calling_code": user.country_calling_code,
            "age": calculate_age_string(user.dob),
            "days_available": parse_days_available(user.days_available) if hasattr(user, 'days_available') and user.days_available else None,
            "employee_id": getattr(user, "employee_id", "NA"),
            "assigned_schools": ", ".join(sorted(today_schools_set)) if today_schools_set else None,
            "assigned_schools_list": assigned_schools_list,
            "total_students": total_students_all,
            "screened_students": screened_students_all,
            "is_completed": is_user_completed
        }
        user_list.append(user_data)

    resp_data = {
        "users": user_list,
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "team_type": team_type.value,
        "academic_year": academic_year,
        "school_id": school_id_int
    }

    # Dynamic message based on whether school_id filter was applied
    if school_id_int is not None:
        school_name = schools_map.get(school_id_int, "Unknown School")
        message = f"Users assigned to school '{school_name}' (ID: {school_id_int}) retrieved."
    else:
        message = "Users retrieved successfully from all schools."

    resp = StandardResponse(
        status=True,
        message=message,
        data=resp_data,
        errors={}
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
