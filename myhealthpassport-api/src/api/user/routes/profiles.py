import os

from fastapi import status
from fastapi import Depends, Query
from fastapi.responses import JSONResponse


from src.core.file_manager import save_base64_image, get_new_url
from src.schemas.user_schema import  UserUpdateRequest, CurrentUserUpdateRequest

from src.api.user import router
from src.core.manager import get_current_user
from src.schemas.user_schema import (AdminTeamResponse, AnalystTeamResponse,
                                     ConsultantTeamResponse,
                                     OnGroundTeamResponse, ParentResponse,
                                     ScreeningTeamResponse, TeacherResponse)
from src.models.user_models import (
    AdminTeam, AdminTeamRoles, AnalystTeam, AnalystRoles,
    ConsultantTeam, ConsultantRoles, OnGroundTeam, OnGroundTeamRoles,
    ScreeningTeam, ScreeningTeamRoles, SchoolStaff, SchoolRoles, Parents, ParentRoles
)
from src.utils.response import StandardResponse
from tortoise.exceptions import DoesNotExist


# Define image storage directory
USER_IMAGES_DIR = "uploads/profile_images"


# Map role_type to model
MODEL_MAP = {
    "PARENT": Parents,
    "SCHOOL_STAFF": SchoolStaff,
    "ON_GROUND_TEAM": OnGroundTeam,
    "SCREENING_TEAM": ScreeningTeam,
    "ANALYST_TEAM": AnalystTeam,
    "ADMIN_TEAM": AdminTeam,
    "CONSULTANT_TEAM": ConsultantTeam,
}

# Map role_type to response schema
RESPONSE_MAP = {
    "PARENT": ParentResponse,
    "SCHOOL_STAFF": TeacherResponse,
    "ON_GROUND_TEAM": OnGroundTeamResponse,
    "SCREENING_TEAM": ScreeningTeamResponse,
    "ANALYST_TEAM": AnalystTeamResponse,
    "ADMIN_TEAM": AdminTeamResponse,
    "CONSULTANT_TEAM": ConsultantTeamResponse,
}

@router.get("/profile", response_model=StandardResponse)
async def fetch_own_profile(current_user: dict = Depends(get_current_user)):
    """
    Fetches the profile details of the currently logged-in user.
    Returns the profile data in JSON format based on the user's role type.
    """
    try:
        # Extract user details
        user_id = current_user["user_id"]
        role_type = current_user["role_type"]

        # Get the appropriate model based on role_type
        model = MODEL_MAP.get(role_type)
        if not model:
            resp = StandardResponse(
                status=False,
                message=f"Invalid role type: {role_type}",
                errors={},
                data={}
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

        # Fetch user profile
        try:
            profile = await model.filter(id=user_id).first()
        except Exception as e:
            resp = StandardResponse(
                status=False,
                message=f"Error fetching profile: {str(e)}",
                errors={},
                data={}
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not profile:
            resp = StandardResponse(
                status=False,
                message=f"User with ID {user_id} not found",
                errors={},
                data={}
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

        # Convert to Pydantic model
        response_schema = RESPONSE_MAP.get(role_type)
        try:
            profile_response = response_schema.model_validate(profile)
            profile_data = profile_response.dict()
            
            if profile_data.get("profile_image"):
                profile_data["profile_image"] = await get_new_url(profile_data["profile_image"])
        except Exception as e:
            resp = StandardResponse(
                status=False,
                message=f"Error mapping to response schema: {str(e)}",
                errors={"mapping_error": f"Failed to map data to response schema: {str(e)}"},
                data={}
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Convert days_available string back to structured list for response
        def parse_days_available(days_str):
            if not days_str:
                return []
            days_list = []
            for day_block in days_str.split(", "):
                if not day_block:
                    continue
                parts = day_block.split(" ", 1)
                if len(parts) != 2:
                    continue
                day = parts[0].lower()
                time_blocks = parts[1].split()
                timings = []
                time_range = []
                for time_block in time_blocks:
                    time_range.append(time_block)
                    if len(time_range) == 5:  # e.g., ["8:00", "AM", "-", "12:00", "PM"]
                        timings.append({"time": " ".join(time_range), "availability": True})
                        time_range = []
                    elif len(time_range) == 10:  # e.g., two ranges like "8:00 AM - 12:00 PM 12:00 AM - 4:00 PM"
                        timings.append({"time": " ".join(time_range[:5]), "availability": True})
                        timings.append({"time": " ".join(time_range[5:]), "availability": True})
                        break
                if time_range:  # Handle any remaining partial range
                    timings.append({"time": " ".join(time_range), "availability": True})
                days_list.append({"day": day, "timings": timings})
            return days_list

        if "days_available" in profile_data and isinstance(profile_data["days_available"], str):
            profile_data["days_available"] = parse_days_available(profile_data["days_available"])

        # Return profile data
        resp = StandardResponse(
            status=True,
            message="Profile fetched successfully",
            data=profile_data,
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

    except Exception as e:
        resp = StandardResponse(
            status=False,
            message=f"An unexpected error occurred: {str(e)}",
            errors={"unexpected_error": f"An unexpected error occurred: {str(e)}"},
            data={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
from datetime import date

def calculate_age(birthdate):
    """Calculate age from date of birth"""
    if not birthdate:
        return None
    
    today = date.today()
    age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
    return age


@router.get("/user-profile/{user_id}", response_model=StandardResponse)
async def all_user_profile(
        user_id: int,
        role_type: str = Query(..., description="Role type of the user (e.g., ADMIN_TEAM, PARENT)"),
        current_user: dict = Depends(get_current_user)
):
    # RBAC: Only SUPER_ADMIN or PROGRAM_COORDINATOR can update profiles
    user_role = current_user.get("user_role")
    if user_role not in [AdminTeamRoles.SUPER_ADMIN.value, AdminTeamRoles.PROGRAM_COORDINATOR.value]:
        creator_role_str = current_user.get("user_role")
        target_role_str = role_type
        resp = StandardResponse(
            status=False,
            message=f"Users with role '{creator_role_str}' are not allowed '{target_role_str}' accounts.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # Role model mapping with response schemas
    role_model_mapping = {
        "ADMIN_TEAM": (AdminTeam, AdminTeamResponse),
        "SCREENING_TEAM": (ScreeningTeam, ScreeningTeamResponse),
        "ANALYST_TEAM": (AnalystTeam, AnalystTeamResponse),
        "ON_GROUND_TEAM": (OnGroundTeam, OnGroundTeamResponse),
        "CONSULTANT_TEAM": (ConsultantTeam, ConsultantTeamResponse),
        "SCHOOL_STAFF": (SchoolStaff, TeacherResponse),
        "PARENT": (Parents, ParentResponse)
    }

    # Validate role_type
    role_type = role_type.upper()
    if role_type not in role_model_mapping:
        resp = StandardResponse(
            status=False,
            message=f"Invalid role_type: {role_type}",
            errors={"role_type": f"Role type {role_type} is not supported"}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    model, response_schema = role_model_mapping[role_type]

    # Fetch the profile
    try:
        profile = await model.get(id=user_id)
    except DoesNotExist:
        resp = StandardResponse(
            status=False,
            message=f"{role_type} profile with ID {user_id} not found",
            errors={"not_found": f"{role_type} profile with ID {user_id} does not exist"}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    response_schema = RESPONSE_MAP.get(role_type)
    try:
        if role_type == "PARENT":
            # Custom mapping for Parents model to ParentResponse
            profile_data = {
                "id": profile.id,
                "first_name": profile.primary_first_name,
                "last_name": profile.primary_last_name,
                "middle_name": profile.primary_middle_name,
                "mobile": profile.primary_mobile,
                "email": profile.primary_email,
                "profile_image": await get_new_url(profile.profile_image) if profile.profile_image else None,
                # "relation": profile.user_role,  # Use user_role as relation
                "relation": profile.user_role.value if hasattr(profile.user_role, 'value') else profile.user_role,
                "role_type": profile.role_type,
                # "user_role": profile.user_role,
                "user_role": profile.user_role.value if hasattr(profile.user_role, 'value') else profile.user_role,
                "is_active": profile.is_active,
                "is_verified": profile.is_verified,
                # "dob": profile.dob,  # Pydantic serializer will handle conversion
                "dob": str(profile.dob) if profile.dob else None,
                "age": calculate_age(profile.dob),
                "gender": profile.gender,
                "address_line_1": profile.address_line_1,
                "address_line_2": profile.address_line_2, 
                "landmark": profile.landmark,
                "street_name": profile.street_name,
                "state": profile.state,
                "blood_group": profile.blood_group,
                "pincode": profile.pincode,
                "country_calling_code": profile.primary_country_calling_code,
                "country": profile.country,
            }
            # profile_response = response_schema(**profile_data)
        else:
            # ✅ FIX: For other models, use model_validate and convert to dict properly
            profile_response = response_schema.model_validate(profile)
            profile_data = profile_response.model_dump(exclude_none=False, by_alias=True)
            
            # ✅ FIX: Explicitly add blood_group from database model if missing
            if 'blood_group' not in profile_data or profile_data.get('blood_group') is None:
                profile_data['blood_group'] = getattr(profile, 'blood_group', None)
            profile_data['age'] = calculate_age(profile.dob)
            # ✅ FIX: Handle profile_image URL conversion
            if profile_data.get("profile_image"):
                profile_data["profile_image"] = await get_new_url(profile_data["profile_image"])

        # else:
        #     # For other models, use default model_validate
        #     profile_response = response_schema.model_validate(profile)
        #     profile_data = profile_response.dict()
        #     if profile_data.get("profile_image"):
        #         profile_data["profile_image"] = await get_new_url(profile_data["profile_image"])
        # Convert days_available string back to structured list for response
        def parse_days_available(days_str):
            if not days_str:
                return []
            days_list = []
            for day_block in days_str.split(", "):
                if not day_block:
                    continue
                parts = day_block.split(" ", 1)
                if len(parts) != 2:
                    continue
                day = parts[0].lower()
                time_blocks = parts[1].split()
                timings = []
                time_range = []
                for time_block in time_blocks:
                    time_range.append(time_block)
                    if len(time_range) == 5:  # e.g., ["8:00", "AM", "-", "12:00", "PM"]
                        timings.append({"time": " ".join(time_range), "availability": True})
                        time_range = []
                    elif len(time_range) == 10:  # e.g., two ranges like "8:00 AM - 12:00 PM 12:00 AM - 4:00 PM"
                        timings.append({"time": " ".join(time_range[:5]), "availability": True})
                        timings.append({"time": " ".join(time_range[5:]), "availability": True})
                        break
                if time_range:  # Handle any remaining partial range
                    timings.append({"time": " ".join(time_range), "availability": True})
                days_list.append({"day": day, "timings": timings})
            return days_list

        if "days_available" in profile_data and isinstance(profile_data["days_available"], str):
            profile_data["days_available"] = parse_days_available(profile_data["days_available"])

        # Return profile data
        resp = StandardResponse(
            status=True,
            message="Profile fetched successfully",
            data=profile_data,
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

    except Exception as e:
        resp = StandardResponse(
            status=False,
            message=f"Error mapping to response schema: {str(e)}",
            errors={"mapping_error": f"Failed to map data to response schema: {str(e)}"},
            data={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.put("/user-profile-update/{user_id}", response_model=StandardResponse)
async def update_user_profile(user_id: int, update_data: UserUpdateRequest, current_user: dict = Depends(get_current_user)):
    # RBAC: Only SUPER_ADMIN or PROGRAM_COORDINATOR can update profiles
    user_role = current_user.get("user_role")
    if user_role not in [AdminTeamRoles.SUPER_ADMIN.value, AdminTeamRoles.PROGRAM_COORDINATOR.value]:
        resp = StandardResponse(
            status=False,
            message=f"{user_role} is not allowed to update user records.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.dict(), status_code=status.HTTP_403_FORBIDDEN)

    # Role model mapping
    role_model_mapping = {
        "ADMIN_TEAM": (AdminTeam, AdminTeamResponse),
        "SCREENING_TEAM": (ScreeningTeam, ScreeningTeamResponse),
        "ANALYST_TEAM": (AnalystTeam, AnalystTeamResponse),
        "ON_GROUND_TEAM": (OnGroundTeam, OnGroundTeamResponse),
        "CONSULTANT_TEAM": (ConsultantTeam, ConsultantTeamResponse),
        "SCHOOL_STAFF": (SchoolStaff, TeacherResponse),
        "PARENT": (Parents, ParentResponse)
    }

    role_type = update_data.role_type.upper()
    if role_type not in role_model_mapping:
        resp = StandardResponse(
            status=False,
            message=f"Invalid role_type: {role_type}",
            errors={"role_type": f"Role type {role_type} is not supported"}
        )
        return JSONResponse(content=resp.dict(), status_code=status.HTTP_400_BAD_REQUEST)

    model, response_schema = role_model_mapping[role_type]

    # Fetch the profile
    try:
        profile = await model.get(id=user_id)
    except DoesNotExist:
        resp = StandardResponse(
            status=False,
            message=f"{role_type} profile with ID {user_id} not found",
            errors={"not_found": f"{role_type} profile with ID {user_id} does not exist"}
        )
        return JSONResponse(content=resp.dict(), status_code=status.HTTP_404_NOT_FOUND)

    # Handle profile image update
    old_image_path = getattr(profile,"profile_image",None)
    new_image_path = None
    if update_data.profile_image is not None:
        if update_data.profile_image:
            new_image_path = await save_base64_image(
                base64_string=update_data.profile_image,
                destination_folder=USER_IMAGES_DIR
            )
            if not new_image_path:
                resp = StandardResponse(
                    status=False,
                    message="Failed to save profile image",
                    errors={"profile_image": "Invalid or corrupted image data"}
                )
                return JSONResponse(content=resp.dict(), status_code=status.HTTP_400_BAD_REQUEST)
        else:
            new_image_path = ""

    # Check unique constraints (phone and email)
    phone_field = "primary_mobile" if role_type == "PARENT" else "phone"
    email_field = "primary_email" if role_type == "PARENT" else "email"
    if getattr(update_data, phone_field, None) and getattr(update_data, phone_field) != getattr(profile, phone_field):
        if await model.filter(**{phone_field: getattr(update_data, phone_field)}).exclude(id=user_id).exists():
            if new_image_path and new_image_path != old_image_path:
                try:
                    os.remove(new_image_path)
                except OSError:
                    pass
            resp = StandardResponse(
                status=False,
                message="Phone number already exists",
                errors={phone_field: "Phone number is already in use"}
            )
            return JSONResponse(content=resp.dict(), status_code=status.HTTP_409_CONFLICT)

    if getattr(update_data, email_field, None) and getattr(update_data, email_field) != getattr(profile, email_field):
        if await model.filter(**{email_field: getattr(update_data, email_field)}).exclude(id=user_id).exists():
            if new_image_path and new_image_path != old_image_path:
                try:
                    os.remove(new_image_path)
                except OSError:
                    pass
            resp = StandardResponse(
                status=False,
                message="Email already exists",
                errors={email_field: "Email is already in use"}
            )
            return JSONResponse(content=resp.dict(), status_code=status.HTTP_409_CONFLICT)

    if role_type in ["ADMIN_TEAM", "SCREENING_TEAM", "ANALYST_TEAM", "ON_GROUND_TEAM"]:
        if getattr(update_data, "employee_id", None) is not None and getattr(update_data, "employee_id") != getattr(profile, "employee_id"):
            if await model.filter(employee_id=update_data.employee_id).exclude(id=user_id).exists():
                if new_image_path and new_image_path != old_image_path:
                    try:
                        os.remove(new_image_path)
                    except OSError:
                        pass
                resp = StandardResponse(
                    status=False,
                    message="Employee ID already exists",
                    errors={"employee_id": "Employee ID is already in use"}
                )
                return JSONResponse(content=resp.dict(), status_code=status.HTTP_409_CONFLICT)

    # Update fields individually
    try:
        # Common fields across most models
        if role_type == "PARENT":
            if update_data.primary_first_name is not None:
                profile.primary_first_name = update_data.primary_first_name
            if update_data.primary_last_name is not None:
                profile.primary_last_name = update_data.primary_last_name
            if update_data.primary_middle_name is not None:
                profile.primary_middle_name = update_data.primary_middle_name
            if update_data.primary_mobile is not None:
                profile.primary_mobile = update_data.primary_mobile
            if update_data.primary_email is not None:
                profile.primary_email = update_data.primary_email
            if update_data.primary_country_calling_code is not None:
                profile.primary_country_calling_code = update_data.primary_country_calling_code
            if update_data.secondary_first_name is not None:
                profile.secondary_first_name = update_data.secondary_first_name
            if update_data.secondary_last_name is not None:
                profile.secondary_last_name = update_data.secondary_last_name
            if update_data.secondary_middle_name is not None:
                profile.secondary_middle_name = update_data.secondary_middle_name
            if update_data.secondary_mobile is not None:
                profile.secondary_mobile = update_data.secondary_mobile
            if update_data.secondary_email is not None:
                profile.secondary_email = update_data.secondary_email
            if update_data.secondary_country_calling_code is not None:
                profile.secondary_country_calling_code = update_data.secondary_country_calling_code
            if update_data.user_role is not None and update_data.user_role in ParentRoles:
                profile.user_role = update_data.user_role
            if update_data.dob is not None:
                profile.dob = update_data.dob
            if update_data.gender is not None:
                profile.gender = update_data.gender
            if update_data.address_line_1 is not None:
                profile.address_line_1 = update_data.address_line_1
            if update_data.address_line_2 is not None:
                profile.address_line_2 = update_data.address_line_2
            if update_data.landmark is not None:
                profile.landmark = update_data.landmark
            if update_data.street_name is not None:
                profile.street_name = update_data.street_name
            if update_data.state is not None:
                profile.state = update_data.state
            if update_data.pincode is not None:
                profile.pincode = update_data.pincode
            if update_data.country is not None:
                profile.country = update_data.country
            if update_data.location is not None:
                profile.location = update_data.location

            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        else:
            if update_data.first_name is not None:
                profile.first_name = update_data.first_name
            if update_data.last_name is not None:
                profile.last_name = update_data.last_name
            if update_data.middle_name is not None:
                profile.middle_name = update_data.middle_name
            if update_data.phone is not None:
                profile.phone = update_data.phone
            if update_data.email is not None:
                profile.email = update_data.email
            if update_data.dob is not None:
                profile.dob = update_data.dob
            if update_data.gender is not None:
                profile.gender = update_data.gender
            if update_data.address_line_1 is not None:
                profile.address_line_1 = update_data.address_line_1
            if update_data.address_line_2 is not None:
                profile.address_line_2 = update_data.address_line_2
            if update_data.landmark is not None:
                profile.landmark = update_data.landmark
            if update_data.street_name is not None:
                profile.street_name = update_data.street_name
            if update_data.state is not None:
                profile.state = update_data.state
            if update_data.pincode is not None:
                profile.pincode = update_data.pincode
            if update_data.country is not None:
                profile.country = update_data.country
            if update_data.country_calling_code is not None:
                profile.country_calling_code = update_data.country_calling_code
            if update_data.location is not None:
                profile.location = update_data.location


            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        # Role-specific fields
        if role_type == "SCHOOL_STAFF":
            if update_data.class_room is not None:
                profile.class_room = update_data.class_room
            if update_data.section is not None:
                profile.section = update_data.section
            if update_data.user_role is not None and update_data.user_role in SchoolRoles:
                profile.user_role = update_data.user_role


            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        elif role_type == "ON_GROUND_TEAM":
            if update_data.user_role is not None and update_data.user_role in OnGroundTeamRoles:
                profile.user_role = update_data.user_role
            if update_data.blood_group is not None:
                profile.blood_group = update_data.blood_group
            if update_data.spoken_languages is not None:
                profile.spoken_languages = update_data.spoken_languages
            if update_data.days_available is not None:
                if isinstance(update_data.days_available, list):
                    days_available_str = ""
                    for day_entry in update_data.days_available:
                        day = day_entry.day.capitalize() if hasattr(day_entry, 'day') else day_entry.get("day", "").capitalize()
                        timings = day_entry.timings if hasattr(day_entry, 'timings') else day_entry.get("timings", [])
                        if timings:
                            day_timings = []
                            for timing in timings:
                                time_value = timing.time if hasattr(timing, 'time') else timing.get("time", "")
                                availability_value = timing.availability if hasattr(timing, 'availability') else timing.get("avialbility", False)
                                if availability_value:
                                    day_timings.append(time_value)
                            if day_timings:
                                days_available_str += f"{day} {' '.join(day_timings)}, "
                    profile.days_available = days_available_str.rstrip(", ") if days_available_str else None
                else:
                    profile.days_available = str(update_data.days_available) if update_data.days_available is not None else None
            if update_data.employee_id is not None:
                profile.employee_id = update_data.employee_id

            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        elif role_type == "SCREENING_TEAM":
            if update_data.user_role is not None and update_data.user_role in ScreeningTeamRoles:
                profile.user_role = update_data.user_role
            if update_data.blood_group is not None:
                profile.blood_group = update_data.blood_group
            if update_data.spoken_languages is not None:
                profile.spoken_languages = update_data.spoken_languages
            if update_data.days_available is not None:
                if isinstance(update_data.days_available, list):
                    days_available_str = ""
                    for day_entry in update_data.days_available:
                        day = day_entry.day.capitalize() if hasattr(day_entry, 'day') else day_entry.get("day", "").capitalize()
                        timings = day_entry.timings if hasattr(day_entry, 'timings') else day_entry.get("timings", [])
                        if timings:
                            day_timings = []
                            for timing in timings:
                                time_value = timing.time if hasattr(timing, 'time') else timing.get("time", "")
                                availability_value = timing.availability if hasattr(timing, 'availability') else timing.get("avialbility", False)
                                if availability_value:
                                    day_timings.append(time_value)
                            if day_timings:
                                days_available_str += f"{day} {' '.join(day_timings)}, "
                    profile.days_available = days_available_str.rstrip(", ") if days_available_str else None
                else:
                    profile.days_available = str(update_data.days_available) if update_data.days_available is not None else None
            if update_data.employee_id is not None:
                profile.employee_id = update_data.employee_id



            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        elif role_type == "ANALYST_TEAM":
            if update_data.user_role is not None and update_data.user_role in AnalystRoles:
                profile.user_role = update_data.user_role
            if update_data.blood_group is not None:
                profile.blood_group = update_data.blood_group
            if update_data.spoken_languages is not None:
                profile.spoken_languages = update_data.spoken_languages
            if update_data.days_available is not None:
                if isinstance(update_data.days_available, list):
                    days_available_str = ""
                    for day_entry in update_data.days_available:
                        day = day_entry.day.capitalize() if hasattr(day_entry, 'day') else day_entry.get("day", "").capitalize()
                        timings = day_entry.timings if hasattr(day_entry, 'timings') else day_entry.get("timings", [])
                        if timings:
                            day_timings = []
                            for timing in timings:
                                time_value = timing.time if hasattr(timing, 'time') else timing.get("time", "")
                                availability_value = timing.availability if hasattr(timing, 'availability') else timing.get("avialbility", False)
                                if availability_value:
                                    day_timings.append(time_value)
                            if day_timings:
                                days_available_str += f"{day} {' '.join(day_timings)}, "
                    profile.days_available = days_available_str.rstrip(", ") if days_available_str else None
                else:
                    profile.days_available = str(update_data.days_available) if update_data.days_available is not None else None
            if update_data.employee_id is not None:
                profile.employee_id = update_data.employee_id


            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        elif role_type == "ADMIN_TEAM":
            if update_data.user_role is not None and update_data.user_role in AdminTeamRoles:
                profile.user_role = update_data.user_role
            if update_data.blood_group is not None:
                profile.blood_group = update_data.blood_group
            if update_data.spoken_languages is not None:
                profile.spoken_languages = update_data.spoken_languages
            if update_data.days_available is not None:
                if isinstance(update_data.days_available, list):
                    days_available_str = ""
                    for day_entry in update_data.days_available:
                        day = day_entry.day.capitalize() if hasattr(day_entry, 'day') else day_entry.get("day", "").capitalize()
                        timings = day_entry.timings if hasattr(day_entry, 'timings') else day_entry.get("timings", [])
                        if timings:
                            day_timings = []
                            for timing in timings:
                                time_value = timing.time if hasattr(timing, 'time') else timing.get("time", "")
                                availability_value = timing.availability if hasattr(timing, 'availability') else timing.get("avialbility", False)
                                if availability_value:
                                    day_timings.append(time_value)
                            if day_timings:
                                days_available_str += f"{day} {' '.join(day_timings)}, "
                    profile.days_available = days_available_str.rstrip(", ") if days_available_str else None
                else:
                    profile.days_available = str(update_data.days_available) if update_data.days_available is not None else None
            if update_data.employee_id is not None:
                profile.employee_id = update_data.employee_id


            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        elif role_type == "CONSULTANT_TEAM":
            if update_data.education is not None:
                profile.education = update_data.education
            if update_data.specialty is not None:
                profile.specialty = update_data.specialty
            if update_data.experience is not None:
                profile.experience = update_data.experience
            if update_data.availability is not None:
                profile.availability = update_data.availability
            if update_data.user_role is not None and update_data.user_role in ConsultantRoles:
                profile.user_role = update_data.user_role

            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        # Common fields for all models
        if update_data.profile_image is not None:
            profile.profile_image = new_image_path

        await profile.save()
        updated_profile = await model.get(id=user_id)

        # Delete old image after successful update
        if new_image_path and old_image_path and old_image_path != new_image_path and os.path.exists(old_image_path):
            try:
                os.remove(old_image_path)
            except OSError:
                pass

    except Exception as e:
        if new_image_path and new_image_path != old_image_path:
            try:
                os.remove(new_image_path)
            except OSError:
                pass
        resp = StandardResponse(
            status=False,
            message=f"Error updating {role_type} profile: {str(e)}",
            errors={"database_error": f"Failed to update profile: {str(e)}"}
        )
        return JSONResponse(content=resp.dict(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Convert days_available string back to structured list for response
    def parse_days_available(days_str):
        if not days_str:
            return []
        days_list = []
        for day_block in days_str.split(", "):
            if not day_block:
                continue
            parts = day_block.split(" ", 1)
            if len(parts) != 2:
                continue
            day = parts[0].lower()
            time_blocks = parts[1].split()
            timings = []
            time_range = []
            for time_block in time_blocks:
                time_range.append(time_block)
                if len(time_range) == 5:  # e.g., ["8:00", "AM", "-", "12:00", "PM"]
                    timings.append({"time": " ".join(time_range), "availability": True})
                    time_range = []
                elif len(time_range) == 10:  # e.g., two ranges like "8:00 AM - 12:00 PM 12:00 AM - 4:00 PM"
                    timings.append({"time": " ".join(time_range[:5]), "availability": True})
                    timings.append({"time": " ".join(time_range[5:]), "availability": True})
                    break
            if time_range:  # Handle any remaining partial range
                timings.append({"time": " ".join(time_range), "availability": True})
            days_list.append({"day": day, "timings": timings})
        return days_list

    updated_data = response_schema.model_validate(updated_profile).dict()
    if "days_available" in updated_data and isinstance(updated_data["days_available"], str):
        updated_data["days_available"] = parse_days_available(updated_data["days_available"])

    resp = StandardResponse(
        status=True,
        message=f"{role_type} profile updated successfully",
        data=updated_data
    )
    return JSONResponse(content=resp.dict(), status_code=status.HTTP_200_OK)

@router.put("/profile", response_model=StandardResponse)
async def update_current_user(update_data: CurrentUserUpdateRequest, current_user: dict = Depends(get_current_user)):
    """
    Updates the profile details of the currently logged-in user.
    """
    # Get role_type and user_id from current_user
    role_type = current_user.get("role_type")
    user_id = current_user.get("user_id")

    if not role_type or not user_id:
        resp = StandardResponse(
            status=False,
            message="Invalid user data",
            errors={"user_data": "Role type or user ID missing"},
            data={}
        )
        return JSONResponse(content=resp.dict(), status_code=status.HTTP_400_BAD_REQUEST)

    # Role model mapping
    role_model_mapping = {
        "ADMIN_TEAM": (AdminTeam, AdminTeamResponse),
        "SCREENING_TEAM": (ScreeningTeam, ScreeningTeamResponse),
        "ANALYST_TEAM": (AnalystTeam, AnalystTeamResponse),
        "ON_GROUND_TEAM": (OnGroundTeam, OnGroundTeamResponse),
        "CONSULTANT_TEAM": (ConsultantTeam, ConsultantTeamResponse),
        "SCHOOL_STAFF": (SchoolStaff, TeacherResponse),
        "PARENT": (Parents, ParentResponse)
    }

    # Validate role_type
    role_type = role_type.upper()
    if role_type not in role_model_mapping:
        resp = StandardResponse(
            status=False,
            message=f"Invalid role_type: {role_type}",
            errors={"role_type": f"Role type {role_type} is not supported"},
            data={}
        )
        return JSONResponse(content=resp.dict(), status_code=status.HTTP_400_BAD_REQUEST)

    model, response_schema = role_model_mapping[role_type]

    # Fetch the profile
    try:
        profile = await model.get(id=user_id)
    except DoesNotExist:
        resp = StandardResponse(
            status=False,
            message=f"{role_type} profile with ID {user_id} not found",
            errors={"not_found": f"{role_type} profile with ID {user_id} does not exist"},
            data={}
        )
        return JSONResponse(content=resp.dict(), status_code=status.HTTP_404_NOT_FOUND)

    # Handle profile image update
    old_image_path = profile.profile_image
    new_image_path = None
    if update_data.profile_image is not None:
        if update_data.profile_image:
            new_image_path = await save_base64_image(
                base64_string=update_data.profile_image,
                destination_folder=USER_IMAGES_DIR
            )
            if not new_image_path:
                resp = StandardResponse(
                    status=False,
                    message="Failed to save profile image",
                    errors={"profile_image": "Invalid or corrupted image data"},
                    data={}
                )
                return JSONResponse(content=resp.dict(), status_code=status.HTTP_400_BAD_REQUEST)
        else:
            new_image_path = ""

    # Check unique constraints (phone and email)
    phone_field = "primary_mobile" if role_type == "PARENT" else "phone"
    email_field = "primary_email" if role_type == "PARENT" else "email"
    if getattr(update_data, phone_field, None) and getattr(update_data, phone_field) != getattr(profile, phone_field):
        if await model.filter(**{phone_field: getattr(update_data, phone_field)}).exclude(id=user_id).exists():
            if new_image_path and new_image_path != old_image_path:
                try:
                    os.remove(new_image_path)
                except OSError:
                    pass
            resp = StandardResponse(
                status=False,
                message="Phone number already exists",
                errors={phone_field: "Phone number is already in use"},
                data={}
            )
            return JSONResponse(content=resp.dict(), status_code=status.HTTP_409_CONFLICT)

    if getattr(update_data, email_field, None) and getattr(update_data, email_field) != getattr(profile, email_field):
        if await model.filter(**{email_field: getattr(update_data, email_field)}).exclude(id=user_id).exists():
            if new_image_path and new_image_path != old_image_path:
                try:
                    os.remove(new_image_path)
                except OSError:
                    pass
            resp = StandardResponse(
                status=False,
                message="Email already exists",
                errors={email_field: "Email is already in use"},
                data={}
            )
            return JSONResponse(content=resp.dict(), status_code=status.HTTP_409_CONFLICT)
    if role_type in ["ADMIN_TEAM", "SCREENING_TEAM", "ANALYST_TEAM", "ON_GROUND_TEAM"]:
        if getattr(update_data, "employee_id", None) is not None and getattr(update_data, "employee_id") != getattr(profile, "employee_id"):
            if await model.filter(employee_id=update_data.employee_id).exclude(id=user_id).exists():
                if new_image_path and new_image_path != old_image_path:
                    try:
                        os.remove(new_image_path)
                    except OSError:
                        pass
                resp = StandardResponse(
                    status=False,
                    message="Employee ID already exists",
                    errors={"employee_id": "Employee ID is already in use"},
                    data={}
                )
                return JSONResponse(content=resp.dict(), status_code=status.HTTP_409_CONFLICT)

    # Update fields individually
    try:
        # Common fields for PARENT role
        if role_type == "PARENT":
            if update_data.primary_first_name is not None:
                profile.primary_first_name = update_data.primary_first_name
            if update_data.primary_last_name is not None:
                profile.primary_last_name = update_data.primary_last_name
            if update_data.primary_middle_name is not None:
                profile.primary_middle_name = update_data.primary_middle_name
            if update_data.primary_mobile is not None:
                profile.primary_mobile = update_data.primary_mobile
            if update_data.primary_email is not None:
                profile.primary_email = update_data.primary_email
            if update_data.primary_country_calling_code is not None:
                profile.primary_country_calling_code = update_data.primary_country_calling_code
            if update_data.secondary_first_name is not None:
                profile.secondary_first_name = update_data.secondary_first_name
            if update_data.secondary_last_name is not None:
                profile.secondary_last_name = update_data.secondary_last_name
            if update_data.secondary_middle_name is not None:
                profile.secondary_middle_name = update_data.secondary_middle_name
            if update_data.secondary_mobile is not None:
                profile.secondary_mobile = update_data.secondary_mobile
            if update_data.secondary_email is not None:
                profile.secondary_email = update_data.secondary_email
            if update_data.secondary_country_calling_code is not None:
                profile.secondary_country_calling_code = update_data.secondary_country_calling_code
            if update_data.dob is not None:
                profile.dob = update_data.dob
            if update_data.gender is not None:
                profile.gender = update_data.gender
            if update_data.address_line_1 is not None:
                profile.address_line_1 = update_data.address_line_1
            if update_data.address_line_2 is not None:
                profile.address_line_2 = update_data.address_line_2
            if update_data.landmark is not None:
                profile.landmark = update_data.landmark
            if update_data.street_name is not None:
                profile.street_name = update_data.street_name
            if update_data.state is not None:
                profile.state = update_data.state
            if update_data.pincode is not None:
                profile.pincode = update_data.pincode
            if update_data.country is not None:
                profile.country = update_data.country
            if update_data.location is not None:
                profile.location = update_data.location


            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]
        else:
            # Common fields for other roles
            if update_data.first_name is not None:
                profile.first_name = update_data.first_name
            if update_data.last_name is not None:
                profile.last_name = update_data.last_name
            if update_data.middle_name is not None:
                profile.middle_name = update_data.middle_name
            if update_data.phone is not None:
                profile.phone = update_data.phone
            if update_data.email is not None:
                profile.email = update_data.email
            if update_data.dob is not None:
                profile.dob = update_data.dob
            if update_data.gender is not None:
                profile.gender = update_data.gender
            if update_data.address_line_1 is not None:
                profile.address_line_1 = update_data.address_line_1
            if update_data.address_line_2 is not None:
                profile.address_line_2 = update_data.address_line_2
            if update_data.landmark is not None:
                profile.landmark = update_data.landmark
            if update_data.street_name is not None:
                profile.street_name = update_data.street_name
            if update_data.state is not None:
                profile.state = update_data.state
            if update_data.pincode is not None:
                profile.pincode = update_data.pincode
            if update_data.country is not None:
                profile.country = update_data.country
            if update_data.country_calling_code is not None:
                profile.country_calling_code = update_data.country_calling_code
            if update_data.location is not None:
                profile.location = update_data.location


            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        # Role-specific fields
        if role_type == "SCHOOL_STAFF":
            if update_data.class_room is not None:
                profile.class_room = update_data.class_room
            if update_data.section is not None:
                profile.section = update_data.section


            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        elif role_type == "CONSULTANT_TEAM":
            if update_data.education is not None:
                profile.education = update_data.education
            if update_data.specialty is not None:
                profile.specialty = update_data.specialty
            if update_data.experience is not None:
                profile.experience = update_data.experience
            if update_data.availability is not None:
                profile.availability = update_data.availability


            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        elif role_type == "ON_GROUND_TEAM":
            if update_data.blood_group is not None:
                profile.blood_group = update_data.blood_group
            if update_data.spoken_languages is not None:
                profile.spoken_languages = update_data.spoken_languages
            if update_data.days_available is not None:
                if isinstance(update_data.days_available, list):
                    days_available_str = ""
                    for day_entry in update_data.days_available:
                        day = day_entry.day.capitalize() if hasattr(day_entry, 'day') else day_entry.get("day", "").capitalize()
                        timings = day_entry.timings if hasattr(day_entry, 'timings') else day_entry.get("timings", [])
                        if timings:
                            day_timings = []
                            for timing in timings:
                                time_value = timing.time if hasattr(timing, 'time') else timing.get("time", "")
                                availability_value = timing.availability if hasattr(timing, 'availability') else timing.get("avialbility", False)
                                if availability_value:
                                    day_timings.append(time_value)
                            if day_timings:
                                days_available_str += f"{day} {' '.join(day_timings)}, "
                    profile.days_available = days_available_str.rstrip(", ") if days_available_str else None
                else:
                    profile.days_available = str(update_data.days_available) if update_data.days_available is not None else None
            if update_data.employee_id is not None:
                profile.employee_id = update_data.employee_id


            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        elif role_type == "SCREENING_TEAM":
            if update_data.blood_group is not None:
                profile.blood_group = update_data.blood_group
            if update_data.spoken_languages is not None:
                profile.spoken_languages = update_data.spoken_languages
            if update_data.days_available is not None:
                if isinstance(update_data.days_available, list):
                    days_available_str = ""
                    for day_entry in update_data.days_available:
                        day = day_entry.day.capitalize() if hasattr(day_entry, 'day') else day_entry.get("day", "").capitalize()
                        timings = day_entry.timings if hasattr(day_entry, 'timings') else day_entry.get("timings", [])
                        if timings:
                            day_timings = []
                            for timing in timings:
                                time_value = timing.time if hasattr(timing, 'time') else timing.get("time", "")
                                availability_value = timing.availability if hasattr(timing, 'availability') else timing.get("avialbility", False)
                                if availability_value:
                                    day_timings.append(time_value)
                            if day_timings:
                                days_available_str += f"{day} {' '.join(day_timings)}, "
                    profile.days_available = days_available_str.rstrip(", ") if days_available_str else None
                else:
                    profile.days_available = str(update_data.days_available) if update_data.days_available is not None else None
            if update_data.employee_id is not None:
                profile.employee_id = update_data.employee_id



            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]


        elif role_type == "ANALYST_TEAM":
            if update_data.blood_group is not None:
                profile.blood_group = update_data.blood_group
            if update_data.spoken_languages is not None:
                profile.spoken_languages = update_data.spoken_languages
            if update_data.days_available is not None:
                if isinstance(update_data.days_available, list):
                    days_available_str = ""
                    for day_entry in update_data.days_available:
                        day = day_entry.day.capitalize() if hasattr(day_entry, 'day') else day_entry.get("day", "").capitalize()
                        timings = day_entry.timings if hasattr(day_entry, 'timings') else day_entry.get("timings", [])
                        if timings:
                            day_timings = []
                            for timing in timings:
                                time_value = timing.time if hasattr(timing, 'time') else timing.get("time", "")
                                availability_value = timing.availability if hasattr(timing, 'availability') else timing.get("avialbility", False)
                                if availability_value:
                                    day_timings.append(time_value)
                            if day_timings:
                                days_available_str += f"{day} {' '.join(day_timings)}, "
                    profile.days_available = days_available_str.rstrip(", ") if days_available_str else None
                else:
                    profile.days_available = str(update_data.days_available) if update_data.days_available is not None else None
            if update_data.employee_id is not None:
                profile.employee_id = update_data.employee_id


            profile.updated_by = current_user["user_id"]
            profile.updated_user_role = current_user["user_role"]
            profile.updated_role_type = current_user["role_type"]

        elif role_type == "ADMIN_TEAM":
            if update_data.blood_group is not None:
                profile.blood_group = update_data.blood_group
            if update_data.spoken_languages is not None:
                profile.spoken_languages = update_data.spoken_languages
            if update_data.days_available is not None:
                if isinstance(update_data.days_available, list):
                    days_available_str = ""
                    for day_entry in update_data.days_available:
                        day = day_entry.day.capitalize() if hasattr(day_entry, 'day') else day_entry.get("day", "").capitalize()
                        timings = day_entry.timings if hasattr(day_entry, 'timings') else day_entry.get("timings", [])
                        if timings:
                            day_timings = []
                            for timing in timings:
                                time_value = timing.time if hasattr(timing, 'time') else timing.get("time", "")
                                availability_value = timing.availability if hasattr(timing, 'availability') else timing.get("avialbility", False)
                                if availability_value:
                                    day_timings.append(time_value)
                            if day_timings:
                                days_available_str += f"{day} {' '.join(day_timings)}, "
                    profile.days_available = days_available_str.rstrip(", ") if days_available_str else None
                else:
                    profile.days_available = str(update_data.days_available) if update_data.days_available is not None else None
            if update_data.employee_id is not None:
                profile.employee_id = update_data.employee_id

        # Common fields for all models
        if update_data.profile_image is not None:
            profile.profile_image = new_image_path

        profile.updated_by = current_user["user_id"]
        profile.updated_user_role = current_user["user_role"]
        profile.updated_role_type = current_user["role_type"]

        await profile.save()
        updated_profile = await model.get(id=user_id)

        # Delete old image after successful update
        if new_image_path and old_image_path and old_image_path != new_image_path and os.path.exists(old_image_path):
            try:
                os.remove(old_image_path)
            except OSError:
                pass

    except Exception as e:
        if new_image_path and new_image_path != old_image_path:
            try:
                os.remove(new_image_path)
            except OSError:
                pass
        resp = StandardResponse(
            status=False,
            message=f"Error updating {role_type} profile: {str(e)}",
            errors={"database_error": f"Failed to update profile: {str(e)}"},
            data={}
        )
        return JSONResponse(content=resp.dict(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Convert days_available string back to structured list for response
    def parse_days_available(days_str):
        if not days_str:
            return []
        days_list = []
        for day_block in days_str.split(", "):
            if not day_block:
                continue
            parts = day_block.split(" ", 1)
            if len(parts) != 2:
                continue
            day = parts[0].lower()
            time_blocks = parts[1].split()
            timings = []
            time_range = []
            for time_block in time_blocks:
                time_range.append(time_block)
                if len(time_range) == 5:  # e.g., ["8:00", "AM", "-", "12:00", "PM"]
                    timings.append({"time": " ".join(time_range), "availability": True})
                    time_range = []
                elif len(time_range) == 10:  # e.g., two ranges like "8:00 AM - 12:00 PM 12:00 AM - 4:00 PM"
                    timings.append({"time": " ".join(time_range[:5]), "availability": True})
                    timings.append({"time": " ".join(time_range[5:]), "availability": True})
                    break
            if time_range:  # Handle any remaining partial range
                timings.append({"time": " ".join(time_range), "availability": True})
            days_list.append({"day": day, "timings": timings})
        return days_list

    updated_data = response_schema.model_validate(updated_profile).dict()
    if "days_available" in updated_data and isinstance(updated_data["days_available"], str):
        updated_data["days_available"] = parse_days_available(updated_data["days_available"])

    resp = StandardResponse(
        status=True,
        message=f"{role_type} profile updated successfully",
        data=updated_data,
        errors={}
    )
    return JSONResponse(content=resp.dict(), status_code=status.HTTP_200_OK)
          