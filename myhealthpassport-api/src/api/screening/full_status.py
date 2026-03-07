from fastapi import Depends, Query, status, APIRouter
from fastapi.responses import JSONResponse
from tortoise.transactions import in_transaction
from src.models.student_models import SchoolStudents, Students
from src.models.school_models import Schools
from src.models.user_models import SchoolStaff, SchoolRoles, AdminTeamRoles, OnGroundTeamRoles
from src.core.manager import get_current_user
from src.utils.response import StandardResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# Assuming these models are defined in your models file
from src.models.student_models import AttendanceStatus, SmartScaleData
from src.models.screening_models import DentalScreening, EyeScreening, BehaviouralScreening, NutritionScreening
from src.models.school_models import Schools,AssignSchool
from . import router

# Pydantic schema for update request
class ScreeningStatusUpdate(BaseModel):
    registration_status: Optional[bool] = None
    dental_screening_status: Optional[bool] = None
    eye_screening_status: Optional[bool] = None
    behavioural_screening_status: Optional[bool] = None
    nutrition_screening_status: Optional[bool] = None
    smart_scale_status: Optional[bool] = None

# ##not using this api 
# @router.get("/overall-screening-status", response_model=StandardResponse)
# async def get_all_students_screening_status(
#     current_user: dict = Depends(get_current_user),
#     school_id: int = Query(..., description="School ID to fetch all students' screening statuses"),
# ):
#     # Validate Role
#     user_role = current_user.get("user_role", "UNKNOWN")
#     role_type = current_user.get("role_type", "UNKNOWN")
#     try:
#         if role_type == "ON_GROUND_TEAM":
#             creator_role = OnGroundTeamRoles(user_role)
#         elif role_type == "SCHOOL_STAFF":
#             creator_role = SchoolRoles(user_role)
#         elif role_type == "ADMIN_TEAM":
#             creator_role = AdminTeamRoles(user_role)
#         else:
#             raise ValueError(f"Invalid role type: {role_type}")
#     except ValueError:
#         resp = StandardResponse(
#             status=False,
#             message=f"Invalid role type: {role_type} or not authorized for screening dashboard",
#             data={},
#             errors={"detail": f"Invalid role: {user_role}"},
#         )
#         return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)

#     allowed_roles = [
#         SchoolRoles.SCHOOL_ADMIN,
#         SchoolRoles.TEACHER,
#         OnGroundTeamRoles.REGISTRATION_TEAM,  # Only REGISTRATION_TEAM allowed for OnGroundTeam
#         AdminTeamRoles.PROGRAM_COORDINATOR,
#         AdminTeamRoles.SUPER_ADMIN,
#     ]
    
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role.value} is not allowed to view screening status.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)

#     # Validate School ID
#     school = await Schools.get_or_none(school_id=school_id)
#     if not school:
#         resp = StandardResponse(
#             status=False,
#             message="School not found.",
#             data={},
#             errors={"school_id": f"School with ID {school_id} does not exist."},
#         )
#         return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_404_NOT_FOUND)

#     # Validate School Access for SCHOOL_ADMIN and TEACHER roles
#     if creator_role in [SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER]:
#         user_id = current_user.get("user_id")
#         if not user_id:
#             resp = StandardResponse(
#                 status=False,
#                 message="User ID is missing in authentication data.",
#                 data={},
#                 errors={"detail": "No user_id provided in current_user."},
#             )
#             return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_401_UNAUTHORIZED)
        
#         staff_member = await SchoolStaff.get_or_none(id=user_id).prefetch_related('school')
#         if not staff_member or not staff_member.school:
#             resp = StandardResponse(
#                 status=False,
#                 message="User is not associated with any school.",
#                 data={},
#                 errors={"detail": f"No SchoolStaff record or school association found for user_id {user_id}."},
#             )
#             return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)
        
#         if staff_member.school.school_id != school_id:
#             resp = StandardResponse(
#                 status=False,
#                 message="User is not authorized to view students from this school.",
#                 data={},
#                 errors={"detail": f"User is associated with school_id {staff_member.school.school_id}, but requested school_id {school_id}."},
#             )
#             return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)

#     # Fetch all students associated with the school
#     school_students = await SchoolStudents.filter(school_id=school_id).prefetch_related('student')
#     if not school_students:
#         resp = StandardResponse(
#             status=False,
#             message="No students found for the specified school.",
#             data={},
#             errors={"detail": f"No students associated with school_id {school_id}."},
#         )
#         return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_404_NOT_FOUND)

#     # Fetch screening statuses for all students
#     response_data = []
#     for school_student in school_students:
#         student = school_student.student
#         student_id = student.id

#         registration_status = await AttendanceStatus.filter(student_id=student_id).order_by('-created_at').first()
#         dental_screening = await DentalScreening.filter(student_id=student_id).order_by('-created_at').first()
#         eye_screening = await EyeScreening.filter(student_id=student_id).order_by('-created_at').first()
#         behavioural_screening = await BehaviouralScreening.filter(student_id=student_id).order_by('-created_at').first()
#         nutrition_screening = await NutritionScreening.filter(student_id=student_id).order_by('-created_at').first()
#         smart_scale_data = await SmartScaleData.filter(student_id=student_id).order_by('-created_at').first()

#         student_data = {
#             "student_id": student_id,
#             "school_id": school_id,
#             "registration_status": registration_status.attendance_status if registration_status else False,
#             "dental_screening_status": dental_screening.screening_status if dental_screening else False,
#             "eye_screening_status": eye_screening.screening_status if eye_screening else False,
#             "behavioural_screening_status": behavioural_screening.screening_status if behavioural_screening else False,
#             "nutrition_screening_status": nutrition_screening.screening_status if nutrition_screening else False,
#             "smart_scale_status": smart_scale_data.screening_status if smart_scale_data else False,
#         }
#         response_data.append(student_data)

#     resp = StandardResponse(
#         status=True,
#         message="Screening statuses for all students retrieved successfully.",
#         data={"students": response_data},
#         errors={},
#     )
#     return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_200_OK)

# ===================================================================
# MODIFIED: GET ALL STUDENTS SCREENING STATUS (with Academic Year Filter)
# ===================================================================
@router.get("/overall-screening-status", response_model=StandardResponse)
async def get_all_students_screening_status(
    current_user: dict = Depends(get_current_user),
    school_id: int = Query(..., description="School ID to fetch all students' screening statuses"),
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
):
    # Validate Role
    user_role = current_user.get("user_role", "UNKNOWN")
    role_type = current_user.get("role_type", "UNKNOWN")
    try:
        if role_type == "ON_GROUND_TEAM":
            creator_role = OnGroundTeamRoles(user_role)
        elif role_type == "SCHOOL_STAFF":
            creator_role = SchoolRoles(user_role)
        elif role_type == "ADMIN_TEAM":
            creator_role = AdminTeamRoles(user_role)
        else:
            raise ValueError(f"Invalid role type: {role_type}")
    except ValueError:
        resp = StandardResponse(
            status=False,
            message=f"Invalid role type: {role_type} or not authorized for screening dashboard",
            data={},
            errors={"detail": f"Invalid role: {user_role}"},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)

    allowed_roles = [
        SchoolRoles.SCHOOL_ADMIN,
        SchoolRoles.TEACHER,
        OnGroundTeamRoles.REGISTRATION_TEAM,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
    ]
    
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role.value} is not allowed to view screening status.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)

    # Validate School ID
    school = await Schools.get_or_none(school_id=school_id)
    if not school:
        resp = StandardResponse(
            status=False,
            message="School not found.",
            data={},
            errors={"school_id": f"School with ID {school_id} does not exist."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_404_NOT_FOUND)

    # Validate School Access for SCHOOL_ADMIN and TEACHER roles
    if creator_role in [SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER]:
        user_id = current_user.get("user_id")
        if not user_id:
            resp = StandardResponse(
                status=False,
                message="User ID is missing in authentication data.",
                data={},
                errors={"detail": "No user_id provided in current_user."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_401_UNAUTHORIZED)
        
        staff_member = await SchoolStaff.get_or_none(id=user_id).prefetch_related('school')
        if not staff_member or not staff_member.school:
            resp = StandardResponse(
                status=False,
                message="User is not associated with any school.",
                data={},
                errors={"detail": f"No SchoolStaff record or school association found for user_id {user_id}."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)
        
        if staff_member.school.school_id != school_id:
            resp = StandardResponse(
                status=False,
                message="User is not authorized to view students from this school.",
                data={},
                errors={"detail": f"User is associated with school_id {staff_member.school.school_id}, but requested school_id {school_id}."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)

    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()

    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        resp = StandardResponse(
            status=False,
            message=str(e),
            data={},
            errors={"academic_year": str(e)}
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)

    # Build academic year filter
    year_filter = build_academic_year_filter(academic_year)

    # Fetch all students associated with the school
    school_students = await SchoolStudents.filter(school_id=school_id).prefetch_related('student')
    if not school_students:
        resp = StandardResponse(
            status=False,
            message="No students found for the specified school.",
            data={},
            errors={"detail": f"No students associated with school_id {school_id}."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_404_NOT_FOUND)

    # Fetch screening statuses for all students with academic year filter
    response_data = []
    for school_student in school_students:
        student = school_student.student
        student_id = student.id

        registration_status = await AttendanceStatus.filter(year_filter, student_id=student_id).order_by('-created_at').first()
        dental_screening = await DentalScreening.filter(year_filter, student_id=student_id).order_by('-created_at').first()
        eye_screening = await EyeScreening.filter(year_filter, student_id=student_id).order_by('-created_at').first()
        behavioural_screening = await BehaviouralScreening.filter(year_filter, student_id=student_id).order_by('-created_at').first()
        nutrition_screening = await NutritionScreening.filter(year_filter, student_id=student_id).order_by('-created_at').first()
        smart_scale_data = await SmartScaleData.filter(year_filter, student_id=student_id).order_by('-created_at').first()

        student_data = {
            "student_id": student_id,
            "school_id": school_id,
            "registration_status": registration_status.attendance_status if registration_status else False,
            "dental_screening_status": dental_screening.screening_status if dental_screening else False,
            "eye_screening_status": eye_screening.screening_status if eye_screening else False,
            "behavioural_screening_status": behavioural_screening.screening_status if behavioural_screening else False,
            "nutrition_screening_status": nutrition_screening.screening_status if nutrition_screening else False,
            "smart_scale_status": smart_scale_data.screening_status if smart_scale_data else False,
        }
        response_data.append(student_data)

    # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
    resp = StandardResponse(
        status=True,
        message="Screening statuses for all students retrieved successfully.",
        data={"students": response_data},  # ← Same format as original
        errors={},
    )
    
    json_response = JSONResponse(content=resp.model_dump(), status_code=status.HTTP_200_OK)
    json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
    return json_response


@router.put("/{student_id}/overall-screening-status", response_model=StandardResponse)
async def update_student_screening_status(
    student_id: str,
    update_data: ScreeningStatusUpdate,
    current_user: dict = Depends(get_current_user),
    school_id: int | None = Query(None, description="School ID for Super Admin, Program Coordinator, or Registration Team"),
):
    # Validate Role
    user_role = current_user.get("user_role", "UNKNOWN")
    role_type = current_user.get("role_type", "UNKNOWN")
    try:
        if role_type == "ON_GROUND_TEAM":
            creator_role = OnGroundTeamRoles(user_role)
        elif role_type == "SCHOOL_STAFF":
            creator_role = SchoolRoles(user_role)
        elif role_type == "ADMIN_TEAM":
            creator_role = AdminTeamRoles(user_role)
        else:
            raise ValueError(f"Invalid role type: {role_type}")
    except ValueError:
        resp = StandardResponse(
            status=False,
            message=f"Invalid role type: {role_type} or not authorized for screening dashboard",
            data={},
            errors={"detail": f"Invalid role: {user_role}"},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)

    allowed_roles = [
        SchoolRoles.SCHOOL_ADMIN,
        SchoolRoles.TEACHER,
        OnGroundTeamRoles.REGISTRATION_TEAM,  # Only REGISTRATION_TEAM allowed for OnGroundTeam
        OnGroundTeamRoles.CAMP_COORDINATOR,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
    ]
    
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role.value} is not allowed to update screening status.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)

    # Validate Student ID
    try:
        student_db_id = int(student_id)
    except ValueError:
        resp = StandardResponse(
            status=False,
            message="Invalid student ID format.",
            data={},
            errors={"path_student_id": "Must be an integer"},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)

    # Fetch Student
    student = await Students.get_or_none(id=student_db_id)
    if not student:
        resp = StandardResponse(
            status=False,
            message="Student not found.",
            data={},
            errors={"student_id": "Student with this ID does not exist."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_404_NOT_FOUND)

    # Fetch School Association
    # school_association = await SchoolStudents.get_or_none(student_id=student_db_id).prefetch_related('school')
    school_association = await SchoolStudents.filter(student_id=student_db_id).prefetch_related('school').first()
    if not school_association or not school_association.school:
        resp = StandardResponse(
            status=False,
            message="Student is not associated with any school.",
            data={},
            errors={"detail": f"No school association found for student_id {student_db_id}."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)
    if not school_association or not school_association.school:
        resp = StandardResponse(
            status=False,
            message="Student is not associated with any school.",
            data={},
            errors={"detail": f"No school association found for student_id {student_db_id}."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)

    # Validate School Access
    if creator_role in [SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER]:
        user_id = current_user.get("user_id")
        if staff_member.school.school_id != school_association.school.school_id:
        # if not user_id:
            resp = StandardResponse(
                status=False,
                message="User ID is missing in authentication data.",
                data={},
                errors={"detail": "No user_id provided in current_user."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_401_UNAUTHORIZED)
        
        staff_member = await SchoolStaff.get_or_none(id=user_id).prefetch_related('school')
        if not staff_member or not staff_member.school:
            resp = StandardResponse(
                status=False,
                message="User is not associated with any school.",
                data={},
                errors={"detail": f"No SchoolStaff record or school association found for user_id {user_id}."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)
        
        if staff_member.school.school_id != school_association.school.school_id:
            resp = StandardResponse(
                status=False,
                message="User is not authorized to update students from this school.",
                data={},
                errors={"detail": f"Student belongs to school_id {school_association.school.school_id}, but user is associated with school_id {staff_member.school.school_id}."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)
    else:
        # For SUPER_ADMIN, PROGRAM_COORDINATOR, and REGISTRATION_TEAM
        if not school_id:
            resp = StandardResponse(
                status=False,
                message="School ID is required in query parameters for Super Admin, Program Coordinator, or Registration Team.",
                data={},
                errors={"detail": "Missing school_id query parameter."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)
        
        # if school_association.school.school_id != school_id:
        if school_association.school.school_id != school_id:
            resp = StandardResponse(
                status=False,
                message="Student does not belong to the specified school.",
                data={},
                errors={"detail": f"Student belongs to school_id {school_association.school.school_id}, but school_id {school_id} was provided."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)

    try:
        async with in_transaction():
            # Update or Create Screening Statuses
            if update_data.registration_status is not None:
                registration = await AttendanceStatus.filter(student_id=student_db_id).order_by('-created_at').first()
                if registration:
                    registration.attendance_status = update_data.registration_status
                    registration.updated_by = current_user.get("user_id")
                    registration.updated_user_role = user_role
                    registration.updated_role_type = role_type
                    await registration.save()
                else:
                    registration = await AttendanceStatus.create(
                        student_id=student_db_id,
                        attendance_status=update_data.registration_status,
                        date=datetime.now().date(),
                        user_id=current_user.get("user_id"),
                        role=user_role,
                        role_type=role_type,
                        school_id=school_association.school.school_id,
                        class_name=student.class_room or "",
                        section=student.section or "",
                        created_by=current_user.get("user_id"),
                        created_user_role=user_role,
                        created_role_type=role_type,
                    )

            if update_data.dental_screening_status is not None:
                dental = await DentalScreening.filter(student_id=student_db_id).order_by('-created_at').first()
                if dental:
                    dental.screening_status = update_data.dental_screening_status
                    dental.updated_by = current_user.get("user_id")
                    dental.updated_user_role = user_role
                    dental.updated_role_type = role_type
                    await dental.save()
                else:
                    dental = await DentalScreening.create(
                        student_id=student_db_id,
                        screening_user_id=current_user.get("user_id"),
                        screening_status=update_data.dental_screening_status,
                        created_by=current_user.get("user_id"),
                        created_user_role=user_role,
                        created_role_type=role_type,
                    )

            if update_data.eye_screening_status is not None:
                eye = await EyeScreening.filter(student_id=student_db_id).order_by('-created_at').first()
                if eye:
                    eye.screening_status = update_data.eye_screening_status
                    eye.updated_by = current_user.get("user_id")
                    eye.updated_user_role = user_role
                    eye.updated_role_type = role_type
                    await eye.save()
                else:
                    eye = await EyeScreening.create(
                        student_id=student_db_id,
                        screening_user_id=current_user.get("user_id"),
                        screening_status=update_data.eye_screening_status,
                        created_by=current_user.get("user_id"),
                        created_user_role=user_role,
                        created_role_type=role_type,
                    )

            if update_data.behavioural_screening_status is not None:
                behavioural = await BehaviouralScreening.filter(student_id=student_db_id).order_by('-created_at').first()
                if behavioural:
                    behavioural.screening_status = update_data.behavioural_screening_status
                    behavioural.updated_by = current_user.get("user_id")
                    behavioural.updated_user_role = user_role
                    behavioural.updated_role_type = role_type
                    await behavioural.save()
                else:
                    behavioural = await BehaviouralScreening.create(
                        student_id=student_db_id,
                        screening_status=update_data.behavioural_screening_status,
                        created_by=current_user.get("user_id"),
                        created_user_role=user_role,
                        created_role_type=role_type,
                    )

            if update_data.nutrition_screening_status is not None:
                nutrition = await NutritionScreening.filter(student_id=student_db_id).order_by('-created_at').first()
                if nutrition:
                    nutrition.screening_status = update_data.nutrition_screening_status
                    nutrition.updated_by = current_user.get("user_id")
                    nutrition.updated_user_role = user_role
                    nutrition.updated_role_type = role_type
                    await nutrition.save()
                else:
                    nutrition = await NutritionScreening.create(
                        student_id=student_db_id,
                        screening_status=update_data.nutrition_screening_status,
                        created_by=current_user.get("user_id"),
                        created_user_role=user_role,
                        created_role_type=role_type,
                        
                    )

            if update_data.smart_scale_status is not None:
                smart_scale = await SmartScaleData.filter(student_id=student_db_id).order_by('-created_at').first()
                if smart_scale:
                    smart_scale.screening_status = update_data.smart_scale_status
                    smart_scale.updated_by = current_user.get("user_id")
                    smart_scale.updated_user_role = user_role
                    smart_scale.updated_role_type = role_type
                    await smart_scale.save()
                else:
                    smart_scale = await SmartScaleData.create(
                        student_id=student_db_id,
                        school_id=school_association.school.school_id,
                        screening_status=update_data.smart_scale_status,
                        created_by=current_user.get("user_id"),
                        created_user_role=user_role,
                        created_role_type=role_type,
                    )

            # Fetch updated statuses for response
            registration_status = await AttendanceStatus.filter(student_id=student_db_id).order_by('-created_at').first()
            dental_screening = await DentalScreening.filter(student_id=student_db_id).order_by('-created_at').first()
            eye_screening = await EyeScreening.filter(student_id=student_db_id).order_by('-created_at').first()
            behavioural_screening = await BehaviouralScreening.filter(student_id=student_db_id).order_by('-created_at').first()
            nutrition_screening = await NutritionScreening.filter(student_id=student_db_id).order_by('-created_at').first()
            smart_scale_data = await SmartScaleData.filter(student_id=student_db_id).order_by('-created_at').first()

            # Construct Response
            response_data = {
                "student_id": student_db_id,
                "school_id": school_association.school.school_id,
                "registration_status": registration_status.attendance_status if registration_status else False,
                "dental_screening_status": dental_screening.screening_status if dental_screening else False,
                "eye_screening_status": eye_screening.screening_status if eye_screening else False,
                "behavioural_screening_status": behavioural_screening.screening_status if behavioural_screening else False,
                "nutrition_screening_status": nutrition_screening.screening_status if nutrition_screening else False,
                "smart_scale_status": smart_scale_data.screening_status if smart_scale_data else False,
            }

            resp = StandardResponse(
                status=True,
                message="Screening statuses updated successfully.",
                data=response_data,
                errors={},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_200_OK)

    except Exception as e:
        resp = StandardResponse(
            status=False,
            message="An error occurred while processing the request.",
            data={},
            errors={"error_details": str(e)},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

# Pydantic schema for update request
class AssignSchoolStatusUpdate(BaseModel):
    is_completed: bool

@router.put("/{event_id}/close-event", response_model=StandardResponse)
async def update_assign_school_status(
    event_id: str,
    update_data: AssignSchoolStatusUpdate,
    current_user: dict = Depends(get_current_user),
    school_id: int | None = Query(None, description="School ID for Camp Coordinator"),
):
    # Validate Role
    user_role = current_user.get("user_role", "UNKNOWN")
    role_type = current_user.get("role_type", "UNKNOWN")
    try:
        if role_type == "ON_GROUND_TEAM":
            creator_role = OnGroundTeamRoles(user_role)
        else:
            raise ValueError(f"Invalid role type: {role_type}")
    except ValueError:
        resp = StandardResponse(
            status=False,
            message=f"Invalid role type: {role_type} or not authorized to update assignment status",
            data={},
            errors={"detail": f"Invalid role: {user_role}"},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)

    allowed_roles = [
        OnGroundTeamRoles.CAMP_COORDINATOR,
    ]
    
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role.value} is not allowed to update assignment status.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)

    # Validate Event ID
    try:
        event_db_id = int(event_id)
    except ValueError:
        resp = StandardResponse(
            status=False,
            message="Invalid event ID format.",
            data={},
            errors={"path_event_id": "Must be an integer"},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)

    # Fetch Assignment
    assignment = await AssignSchool.get_or_none(id=event_db_id)
    if not assignment:
        resp = StandardResponse(
            status=False,
            message="Assignment not found.",
            data={},
            errors={"event_id": f"Assignment with ID {event_db_id} does not exist."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_404_NOT_FOUND)

    # Validate School
    school = await Schools.get_or_none(school_id=assignment.school)
    if not school:
        resp = StandardResponse(
            status=False,
            message="School not found.",
            data={},
            errors={"school_id": f"School with ID {assignment.school} does not exist."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_404_NOT_FOUND)

    # Validate School Access for CAMP_COORDINATOR
    if not school_id:
        resp = StandardResponse(
            status=False,
            message="School ID is required in query parameters for Camp Coordinator.",
            data={},
            errors={"detail": "Missing school_id query parameter."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)
    
    if assignment.school != school_id:
        resp = StandardResponse(
            status=False,
            message="Assignment does not belong to the specified school.",
            data={},
            errors={"detail": f"Assignment belongs to school_id {assignment.school}, but school_id {school_id} was provided."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)

    try:
        async with in_transaction():
            # Update is_completed status
            assignment.is_completed = update_data.is_completed
            assignment.updated_by = current_user.get("user_id")
            assignment.updated_user_role = user_role
            assignment.updated_role_type = role_type

            await assignment.save()

            # Construct Response
            response_data = {
                "event_id": assignment.id,
                "school_id": assignment.school,
                "is_completed": assignment.is_completed,
            }

            resp = StandardResponse(
                status=True,
                message="Assignment status updated successfully.",
                data=response_data,
                errors={},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_200_OK)

    except Exception as e:
        resp = StandardResponse(
            status=False,
            message="An error occurred while processing the request.",
            data={},
            errors={"error_details": str(e)},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    