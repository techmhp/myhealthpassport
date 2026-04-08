import os
from datetime import datetime

from fastapi import Depends, APIRouter, status, Query
from fastapi.responses import JSONResponse
from tortoise.transactions import in_transaction

from src.core.file_manager import save_base64_image
from src.core.manager import get_current_user
from src.models.student_models import Students, SchoolStudents, ParentChildren
from src.models.user_models import SchoolStaff
from src.models.user_models import Parents, SchoolRoles, AdminTeamRoles, OnGroundTeamRoles
from src.utils.calculator import calculate_age_string
from src.utils.response import StandardResponse
from src.api.school.dependencies import ParentChildrenCreateSchema
from src.core.file_manager import get_new_url
from src.models.school_models import Schools,AssignSchool
from src.models.student_models import AttendanceStatus, ParentChildren, SchoolStudents, SmartScaleData, Students
from src.models.user_models import (
    AdminTeamRoles,
    AnalystRoles,
    ConsultantRoles,
    OnGroundTeamRoles,
    Parents,
    ParentRoles,
    SchoolRoles,
    SchoolStaff,
    ScreeningTeamRoles
)
from src.models.consultation_models import MedicalScreeningStatus
from src.models.other_models import ClinicalRecomendations,ClinicalFindings
from src.models.screening_models import DentalScreening,EyeScreening,BehaviouralScreening,NutritionScreening
from src.models.student_models import SmartScaleData,AttendanceStatus
from .schema import StudentData
from . import router


STUDENT_IMAGES_DIR = "uploads/student_images"

# Medical Officer Status Types
MEDICAL_OFFICER_STATUS_TYPES = [
    "physical_screening_status",
    "nutritional_report_status", 
    "psychological_report_status",
    "vision_screening_status",
    "dental_screening_status",
    "lab_report_status",
    "medical_report_status"
]


# @router.get("/student/{student_id}/basic", response_model=StandardResponse)
# async def get_student_details_basic(student_id: str, current_user: dict = Depends(get_current_user)):
#     # Define allowed roles
#     allowed_roles = [
#         SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER,
#         ParentRoles.PARENT, ParentRoles.GUARDIAN,
#         AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,AdminTeamRoles.HEALTH_BUDDY,
#         OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
#         ScreeningTeamRoles.NUTRITIONIST, ScreeningTeamRoles.PSYCHOLOGIST, ScreeningTeamRoles.DENTIST, ScreeningTeamRoles.EYE_SPECIALIST,
#         ScreeningTeamRoles.PHYSICAL_WELLBEING,
#         AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER,
#         ConsultantRoles.PEDIATRICIAN, ConsultantRoles.DENTIST, ConsultantRoles.NUTRITIONIST, ConsultantRoles.PSYCHOLOGIST
#     ]
#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role} is not allowed to view student records.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)
        
#     # Fetch student with prefetch_related for parent details
#     student = await Students.filter(id=student_id, is_deleted=False).prefetch_related("parent_children_rel").first()
#     if not student:
#         resp = StandardResponse(
#             status=False,
#             message="Student not found",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Fetch profile image
#     try:
#         student_image = await get_new_url(student.profile_image) or ""
#     except:
#         student_image = ""

#     # Base student details
#     student_details = {
#         "id": student.id,
#         "image": student_image,
#         "first_name": student.first_name,
#         "middle_name": student.middle_name,
#         "last_name": student.last_name,
#         "gender": student.gender,
#         "blood_group": student.blood_group,
#         "age": calculate_age_string(student.dob),
#         "dob": str(student.dob),
#         "identity_details": {
#             "aadhaar_no": student.aadhaar_no,
#             "mp_uhid": student.mp_uhid,
#             "abha_id": student.abha_id,
#             "class_room": student.class_room,
#             "section": student.section,
#             "roll_no": student.roll_no,
#         },
#         "food": {
#             "food_preferences": student.food_preferences,
#         },
#         "address_details": {
#             "address_line1": student.address_line1,
#             "address_line2": student.address_line2,
#             "landmark": student.landmark,
#             "state": student.state,
#             "street": student.street,
#             "country": student.country,
#             "pincode": student.pincode,
#             "country_code": student.country_code,
#             "phone": student.phone,
#         }
#     }

#     # Fetch parent details
#     parent_details = {}
#     for pa in student.parent_children_rel:
#         parent = await Parents.filter(id=pa.parent_id).first()
#         if parent:
#             parent_details = {
#                 "id": parent.id,
#                 "primary_first_name": parent.primary_first_name,
#                 "primary_middle_name": parent.primary_middle_name,
#                 "primary_last_name": parent.primary_last_name,
#                 "primary_country_calling_code": parent.primary_country_calling_code,
#                 "primary_mobile": parent.primary_mobile,
#                 "primary_email": parent.primary_email,
#                 "secondary_first_name": parent.secondary_first_name,
#                 "secondary_middle_name": parent.secondary_middle_name,
#                 "secondary_last_name": parent.secondary_last_name,
#                 "secondary_country_calling_code": parent.secondary_country_calling_code,
#                 "secondary_mobile": parent.secondary_mobile,
#                 "secondary_email": parent.secondary_email,
#             }

#     # Initialize status dictionary
#     status_update = {}

#     # Role-based status mapping
#     role_status_map = {
#         ScreeningTeamRoles.PHYSICAL_WELLBEING: ["smart_scale_status"],
#         ScreeningTeamRoles.DENTIST: ["dental_screening_status"],
#         ScreeningTeamRoles.EYE_SPECIALIST: ["eye_screening_status"],
#         ScreeningTeamRoles.NUTRITIONIST: ["nutrition_screening_status"],
#         ScreeningTeamRoles.PSYCHOLOGIST: ["behavioural_screening_status"],
#         AnalystRoles.NUTRITIONIST: ["nutrition_analysis_status"],
#         AnalystRoles.PSYCHOLOGIST: ["psychological_analysis_status"],
#     }

#     # Add screening statuses for specific roles
#     if current_user.get("user_role") in {OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR, SchoolRoles.SCHOOL_ADMIN,
#                                         AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,ParentRoles.PARENT} or \
#        current_user.get("user_role") in role_status_map or current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
        
#         # Fetch school associated with the student
#         school_student = await SchoolStudents.filter(student_id=student_id, is_deleted=False).first()
#         if school_student:
#             assign_school = await AssignSchool.filter(school=school_student.school_id, is_deleted=False).first()
#             is_completed = assign_school.is_completed if assign_school else False
#             status_update["is_completed"] = is_completed

#             # Fetch all relevant screening statuses
#             attendance_status = await AttendanceStatus.filter(student_id=student_id).order_by('-created_at').first()
#             dental_screening = await DentalScreening.filter(student_id=student_id).order_by('-created_at').first()
#             eye_screening = await EyeScreening.filter(student_id=student_id).order_by('-created_at').first()
#             behavioural_screening = await BehaviouralScreening.filter(student_id=student_id).order_by('-created_at').first()
#             nutrition_screening = await NutritionScreening.filter(student_id=student_id).order_by('-created_at').first()
#             smart_scale_data = await SmartScaleData.filter(student_id=student_id).order_by('-created_at').first()
#             # nutritional_analysis_status = await ClinicalRecomendations.filter(student_id=student_id).order_by('-created_at').first()
#             # psychological_analysis_status = await ClinicalFindings.filter(student_id=student_id).order_by('-created_at').first()
#             nutritional_analysis_status = await ClinicalRecomendations.filter(student__id=student_id).order_by('-created_at').first()
#             psychological_analysis_status = await ClinicalFindings.filter(student__id=student_id).order_by('-created_at').first()

#             # Update statuses based on role
#             if current_user.get("user_role") in {OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR, SchoolRoles.SCHOOL_ADMIN,
#                                                 AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,ParentRoles.PARENT}:
#                 status_update.update({
#                     "registration_status": bool(attendance_status),
#                     # "dental_screening_status": bool(dental_screening),
#                     # "eye_screening_status": bool(eye_screening),
#                     # "behavioural_screening_status": bool(behavioural_screening),
#                     # "nutrition_screening_status": bool(nutrition_screening),
#                     # "smart_scale_status": bool(smart_scale_data),
#                     "dental_screening_status": dental_screening.screening_status if dental_screening else False,
#                     "eye_screening_status": eye_screening.screening_status if eye_screening else False,
#                     "behavioural_screening_status": behavioural_screening.screening_status if behavioural_screening else False,
#                     "nutrition_screening_status": nutrition_screening.screening_status if nutrition_screening else False,
#                     "smart_scale_status": smart_scale_data.screening_status if smart_scale_data else False,

#                     "nutrition_analysis_status": nutritional_analysis_status.analysis_status if nutritional_analysis_status else False,
#                     "psychological_analysis_status": psychological_analysis_status.analysis_status if psychological_analysis_status else False

#                     # "nutrition_analysis_status": bool(nutritional_analysis_status.analysis_status if nutritional_analysis_status else False),
#                     # "psychological_analysis_status": bool(psychological_analysis_status.analysis_status if psychological_analysis_status else False)
#                     })
            
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.PHYSICAL_WELLBEING:
#                 status_update.update({
#                     # "smart_scale_status": bool(smart_scale_data)
#                     "smart_scale_status": smart_scale_data.screening_status if smart_scale_data else False

#                 })
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.DENTIST:
#                 status_update.update({
#                     # "dental_screening_status": bool(dental_screening)
#                     "dental_screening_status": dental_screening.screening_status if dental_screening else False

#                 })
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.EYE_SPECIALIST:
#                 status_update.update({
#                     # "eye_screening_status": bool(eye_screening)
#                     "eye_screening_status": eye_screening.screening_status if eye_screening else False

#                 })
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.NUTRITIONIST:
#                 status_update.update({
#                     # "nutrition_screening_status": bool(nutrition_screening)
#                     "nutrition_screening_status": nutrition_screening.screening_status if nutrition_screening else False

#                 })
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.PSYCHOLOGIST:
#                 status_update.update({
#                     # "behavioural_screening_status": bool(behavioural_screening)
#                     "behavioural_screening_status": behavioural_screening.screening_status if behavioural_screening else False

#                 })
#             elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.NUTRITIONIST:
#                 status_update.update({
#                     "nutrition_analysis_status": nutritional_analysis_status.analysis_status if nutritional_analysis_status else False,
#                     # "nutrition_analysis_status": bool(nutritional_analysis_status.analysis_status if nutritional_analysis_status else False)
#                 })
#             elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.PSYCHOLOGIST:
#                 status_update.update({
#                     "psychological_analysis_status": psychological_analysis_status.analysis_status if psychological_analysis_status else False
#                     # "psychological_analysis_status": bool(psychological_analysis_status.analysis_status if psychological_analysis_status else False)
#                 })
#             elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
#                 # Fetch medical screening statuses
#                 medical_screening_statuses = await MedicalScreeningStatus.filter(
#                     student_id=student_id,
#                     is_deleted=False
#                 ).all()
                
#                 # Create medical status lookup
#                 medical_status_lookup = {}
#                 for medical_status in medical_screening_statuses:
#                     medical_status_lookup[medical_status.medical_officer_status_type] = medical_status.status
                
#                 # Add medical screening status for medical officers
#                 student_medical_statuses = {}
#                 for status_type in MEDICAL_OFFICER_STATUS_TYPES:
#                     student_medical_statuses[status_type] = medical_status_lookup.get(status_type, "not_verified")
#                     all_reports_verified = all([
#                     student_medical_statuses.get("physical_screening_status") == "verified",
#                     student_medical_statuses.get("nutritional_report_status") == "verified",
#                     student_medical_statuses.get("psychological_report_status") == "verified",
#                     student_medical_statuses.get("vision_screening_status") == "verified",
#                     student_medical_statuses.get("dental_screening_status") == "verified",
#                     student_medical_statuses.get("lab_report_status") == "verified"
#                 ])
#                 if all_reports_verified:
#                     student_medical_statuses["medical_report_status"] = "verified"
        
#                 status_update.update(student_medical_statuses)

#     # Add status to student details
#     student_details.update(status_update)

#     # Construct response
#     data_dict = {
#         "status": True,
#         "message": "Student Details",
#         "data": {
#             "student_details": student_details,
#             "parent_details": parent_details,
#         },
#         "errors": {},
#     }
#     response_obj = StandardResponse(**data_dict)
#     return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)


# Add these imports at the top
from typing import Optional
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ===================================================================
# MODIFIED: GET STUDENT BASIC DETAILS (with Academic Year Filter)
# ===================================================================
@router.get("/student/{student_id}/basic", response_model=StandardResponse)
async def get_student_details_basic(
    student_id: str,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user: dict = Depends(get_current_user)
):
    # Define allowed roles
    allowed_roles = [
        SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER,
        ParentRoles.PARENT, ParentRoles.GUARDIAN,
        AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, AdminTeamRoles.HEALTH_BUDDY,
        OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
        ScreeningTeamRoles.NUTRITIONIST, ScreeningTeamRoles.PSYCHOLOGIST, ScreeningTeamRoles.DENTIST, ScreeningTeamRoles.EYE_SPECIALIST,
        ScreeningTeamRoles.PHYSICAL_WELLBEING,
        AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER,
        ConsultantRoles.PEDIATRICIAN, ConsultantRoles.DENTIST, ConsultantRoles.NUTRITIONIST, ConsultantRoles.PSYCHOLOGIST
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to view student records.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

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
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # Build academic year filter
    year_filter = build_academic_year_filter(academic_year)
        
    # Fetch student with prefetch_related for parent details
    student = await Students.filter(id=student_id, is_deleted=False).prefetch_related("parent_children_rel").first()
    if not student:
        resp = StandardResponse(
            status=False,
            message="Student not found",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Fetch profile image
    try:
        student_image = await get_new_url(student.profile_image) or ""
    except:
        student_image = ""

    # Base student details
    student_details = {
        "id": student.id,
        "image": student_image,
        "first_name": student.first_name,
        "middle_name": student.middle_name,
        "last_name": student.last_name,
        "gender": student.gender,
        "blood_group": student.blood_group,
        "age": calculate_age_string(student.dob),
        "dob": str(student.dob),
        "identity_details": {
            "aadhaar_no": student.aadhaar_no,
            "mp_uhid": student.mp_uhid,
            "abha_id": student.abha_id,
            "class_room": student.class_room,
            "section": student.section,
            "roll_no": student.roll_no,
        },
        "food": {
            "food_preferences": student.food_preferences,
        },
        "address_details": {
            "address_line1": student.address_line1,
            "address_line2": student.address_line2,
            "landmark": student.landmark,
            "state": student.state,
            "street": student.street,
            "country": student.country,
            "pincode": student.pincode,
            "country_code": student.country_code,
            "phone": student.phone,
        }
    }

    # Fetch parent details
    parent_details = {}
    for pa in student.parent_children_rel:
        parent = await Parents.filter(id=pa.parent_id).first()
        if parent:
            parent_details = {
                "id": parent.id,
                "primary_first_name": parent.primary_first_name,
                "primary_middle_name": parent.primary_middle_name,
                "primary_last_name": parent.primary_last_name,
                "primary_country_calling_code": parent.primary_country_calling_code,
                "primary_mobile": parent.primary_mobile,
                "primary_email": parent.primary_email,
                "secondary_first_name": parent.secondary_first_name,
                "secondary_middle_name": parent.secondary_middle_name,
                "secondary_last_name": parent.secondary_last_name,
                "secondary_country_calling_code": parent.secondary_country_calling_code,
                "secondary_mobile": parent.secondary_mobile,
                "secondary_email": parent.secondary_email,
                "parent_pincode": parent.pincode,
            }

    # Initialize status dictionary
    status_update = {}

    # Role-based status mapping
    role_status_map = {
        ScreeningTeamRoles.PHYSICAL_WELLBEING: ["smart_scale_status"],
        ScreeningTeamRoles.DENTIST: ["dental_screening_status"],
        ScreeningTeamRoles.EYE_SPECIALIST: ["eye_screening_status"],
        ScreeningTeamRoles.NUTRITIONIST: ["nutrition_screening_status"],
        ScreeningTeamRoles.PSYCHOLOGIST: ["behavioural_screening_status"],
        AnalystRoles.NUTRITIONIST: ["nutrition_analysis_status"],
        AnalystRoles.PSYCHOLOGIST: ["psychological_analysis_status"],
    }

    # Add screening statuses for specific roles
    if current_user.get("user_role") in {OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR, SchoolRoles.SCHOOL_ADMIN,
                                        AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, ParentRoles.PARENT} or \
       current_user.get("user_role") in role_status_map or current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
        
        # Fetch school associated with the student
        school_student = await SchoolStudents.filter(student_id=student_id, is_deleted=False).first()
        if school_student:
            assign_school = await AssignSchool.filter(year_filter, school=school_student.school_id, is_deleted=False).first()
            is_completed = assign_school.is_completed if assign_school else False
            status_update["is_completed"] = is_completed

            # Fetch all relevant screening statuses with academic year filter
            attendance_status = await AttendanceStatus.filter(year_filter, student_id=student_id).order_by('-created_at').first()
            dental_screening = await DentalScreening.filter(year_filter, student_id=student_id).order_by('-created_at').first()
            eye_screening = await EyeScreening.filter(year_filter, student_id=student_id).order_by('-created_at').first()
            behavioural_screening = await BehaviouralScreening.filter(year_filter, student_id=student_id).order_by('-created_at').first()
            nutrition_screening = await NutritionScreening.filter(year_filter, student_id=student_id).order_by('-created_at').first()
            smart_scale_data = await SmartScaleData.filter(year_filter, student_id=student_id).order_by('-created_at').first()
            nutritional_analysis_status = await ClinicalRecomendations.filter(year_filter, student__id=student_id).order_by('-created_at').first()
            psychological_analysis_status = await ClinicalFindings.filter(year_filter, student__id=student_id).order_by('-created_at').first()

            # Update statuses based on role
            if current_user.get("user_role") in {OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR, SchoolRoles.SCHOOL_ADMIN,
                                                AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, ParentRoles.PARENT}:
                status_update.update({
                    "registration_status": bool(attendance_status),
                    "dental_screening_status": dental_screening.screening_status if dental_screening else False,
                    "eye_screening_status": eye_screening.screening_status if eye_screening else False,
                    "behavioural_screening_status": behavioural_screening.screening_status if behavioural_screening else False,
                    "nutrition_screening_status": nutrition_screening.screening_status if nutrition_screening else False,
                    "smart_scale_status": smart_scale_data.screening_status if smart_scale_data else False,
                    "nutrition_analysis_status": nutritional_analysis_status.analysis_status if nutritional_analysis_status else False,
                    "psychological_analysis_status": psychological_analysis_status.analysis_status if psychological_analysis_status else False
                })
            
            elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.PHYSICAL_WELLBEING:
                status_update.update({
                    "smart_scale_status": smart_scale_data.screening_status if smart_scale_data else False
                })
            elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.DENTIST:
                status_update.update({
                    "dental_screening_status": dental_screening.screening_status if dental_screening else False
                })
            elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.EYE_SPECIALIST:
                status_update.update({
                    "eye_screening_status": eye_screening.screening_status if eye_screening else False
                })
            elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.NUTRITIONIST:
                status_update.update({
                    "nutrition_screening_status": nutrition_screening.screening_status if nutrition_screening else False
                })
            elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.PSYCHOLOGIST:
                status_update.update({
                    "behavioural_screening_status": behavioural_screening.screening_status if behavioural_screening else False
                })
            elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.NUTRITIONIST:
                status_update.update({
                    "nutrition_analysis_status": nutritional_analysis_status.analysis_status if nutritional_analysis_status else False
                })
            elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.PSYCHOLOGIST:
                status_update.update({
                    "psychological_analysis_status": psychological_analysis_status.analysis_status if psychological_analysis_status else False
                })
            elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
                # Fetch medical screening statuses with academic year filter
                medical_screening_statuses = await MedicalScreeningStatus.filter(
                    year_filter,
                    student_id=student_id,
                    is_deleted=False
                ).all()
                
                # Create medical status lookup
                medical_status_lookup = {}
                for medical_status in medical_screening_statuses:
                    medical_status_lookup[medical_status.medical_officer_status_type] = medical_status.status
                
                # Add medical screening status for medical officers
                student_medical_statuses = {}
                for status_type in MEDICAL_OFFICER_STATUS_TYPES:
                    student_medical_statuses[status_type] = medical_status_lookup.get(status_type, "not_verified")
                
                all_reports_verified = all([
                    student_medical_statuses.get("physical_screening_status") == "verified",
                    student_medical_statuses.get("nutritional_report_status") == "verified",
                    student_medical_statuses.get("psychological_report_status") == "verified",
                    student_medical_statuses.get("vision_screening_status") == "verified",
                    student_medical_statuses.get("dental_screening_status") == "verified",
                    student_medical_statuses.get("lab_report_status") == "verified"
                ])
                if all_reports_verified:
                    student_medical_statuses["medical_report_status"] = "verified"
        
                status_update.update(student_medical_statuses)

    # Add status to student details
    student_details.update(status_update)

    # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
    data_dict = {
        "status": True,
        "message": "Student Details",
        "data": {
            "student_details": student_details,
            "parent_details": parent_details,
        },  # ← Same format as original
        "errors": {},
    }
    response_obj = StandardResponse(**data_dict)
    
    json_response = JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)
    json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
    return json_response


@router.put("/student/{student_id}/basic", response_model=StandardResponse)
async def update_student_details_basic(
    student_id: str,
    update_data: StudentData,
    current_user: dict = Depends(get_current_user),
    school_id: int | None = Query(None, description="School ID for Super Admin, Program Coordinator, or Registration Team"),
):
    # Validate Role
    user_role = current_user["user_role"]

    allowed_roles = [
        SchoolRoles.SCHOOL_ADMIN,
        SchoolRoles.TEACHER,
        OnGroundTeamRoles.REGISTRATION_TEAM,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.HEALTH_BUDDY,
    ]
    
    if user_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{user_role} is not allowed to update student records.",
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

    # Validate Student ID matches request body
    if student_db_id != update_data.student_details.id:
        resp = StandardResponse(
            status=False,
            message="Student ID in URL path does not match student ID in request body.",
            data={},
            errors={"student_id_mismatch": "Path ID and body ID mismatch."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)

    # Fetch Student Details
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
    school_associations = await SchoolStudents.filter(student_id=student_db_id, status=True).prefetch_related('school')
    if not school_associations:
        resp = StandardResponse(
            status=False,
            message="Student is not associated with any school.",
            data={},
            errors={"detail": f"No school association found for student_id {student_db_id}."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)

    # Handle multiple school associations
    if len(school_associations) > 1:
        warning_message = f"Warning: Multiple SchoolStudents records found for student_id {student_db_id}. Using the first active record."
        school_association = school_associations[0]
    else:
        school_association = school_associations[0]

    if not school_association.school:
        resp = StandardResponse(
            status=False,
            message="School association has no valid school.",
            data={},
            errors={"detail": f"No school found for SchoolStudents record with student_id {student_db_id}."},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)

    # Validate School Access
    school_id_to_associate = school_association.school.school_id
    if user_role in [SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER]:
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
        
        if school_association.school.school_id != staff_member.school.school_id:
            resp = StandardResponse(
                status=False,
                message="User is not authorized to update students from this school.",
                data={},
                errors={"detail": f"Student belongs to school_id {school_association.school.school_id}, but user is associated with school_id {staff_member.school.school_id}."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_403_FORBIDDEN)
    else:
        if not school_id:
            resp = StandardResponse(
                status=False,
                message="School ID is required in query parameters for Super Admin, Program Coordinator, or Registration Team.",
                data={},
                errors={"detail": "Missing school_id query parameter."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)
        
        if school_association.school.school_id != school_id:
            resp = StandardResponse(
                status=False,
                message="Student does not belong to the specified school.",
                data={},
                errors={"detail": f"Student belongs to school_id {school_association.school.school_id}, but school_id {school_id} was provided."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)
    
    # Check for duplicate roll_no in the same school and class_room
    if update_data.student_details.identity_details and update_data.student_details.identity_details.roll_no:
        new_roll_no = update_data.student_details.identity_details.roll_no.upper()
        new_class_room = update_data.student_details.identity_details.class_room or student.class_room
        existing_student = await Students.filter(
            roll_no=new_roll_no,
            class_room=new_class_room,
            school_students__school_id=school_id_to_associate
        ).exclude(id=student_db_id).first()
        if existing_student:
            resp = StandardResponse(
                status=False,
                message=f"Student with roll number {new_roll_no} already exists in class {new_class_room} for this school.",
                data={},
                errors={"detail": f"Roll number {new_roll_no} is already associated with another student in class {new_class_room} and school_id {school_id_to_associate}."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)

    # Check Parent Details Id
    if update_data.parent_details:
        parent = update_data.parent_details
        parent_model = await Parents.get_or_none(id=parent.id)
        if not parent_model:
            resp = StandardResponse(
                status=False,
                message=f"Parent with ID {parent.id} not found.",
                data={},
                errors={"parent_details": f"Parent ID {parent.id} not found."},
            )
            return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_404_NOT_FOUND)

    try:
        async with in_transaction():
            # From "student_details" Object
            student_data_from_request = update_data.student_details
            profile_image = student_data_from_request.profile_image

            # --- Image Handling Logic ---
            if profile_image and profile_image.strip():
                image_key = await save_base64_image(
                    base64_string=profile_image,
                    destination_folder=STUDENT_IMAGES_DIR,
                    user_role=current_user.get("user_role"),
                    role_type=current_user.get("role_type"),
                    return_key_only=True
                )
                if image_key:
                    student.profile_image = image_key
                else:
                    resp = StandardResponse(
                        status=False,
                        message="Profile image upload failed. Please check the file and try again.",
                        data={},
                        errors={"profile_image": "Failed to upload image to storage. Ensure the file is a valid JPEG, PNG, or WebP image under 500KB."},
                    )
                    return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)

            # Update Student Details
            if student_data_from_request.first_name is not None:
                student.first_name = student_data_from_request.first_name.upper()
            if student_data_from_request.middle_name is not None:
                student.middle_name = student_data_from_request.middle_name.upper()
            if student_data_from_request.last_name is not None:
                student.last_name = student_data_from_request.last_name.upper()
            if student_data_from_request.gender is not None:
                student.gender = student_data_from_request.gender.upper()
            if student_data_from_request.blood_group is not None:
                student.blood_group = student_data_from_request.blood_group.upper()
            if student_data_from_request.dob is not None:
                if isinstance(student_data_from_request.dob, str):
                    for fmt in ("%d-%m-%Y", "%m/%d/%Y", "%Y-%m-%d", "%d/%m/%Y"):
                        try:
                            student.dob = datetime.strptime(student_data_from_request.dob, fmt).date()
                            break
                        except ValueError:
                            continue
                    else:
                        resp = StandardResponse(
                            status=False,
                            message="Invalid date format for dob.",
                            data={},
                            errors={"detail": f"Invalid date format for dob: {student_data_from_request.dob}. Expected DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD, or DD/MM/YYYY."},
                        )
                        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_400_BAD_REQUEST)
                else:
                    student.dob = student_data_from_request.dob

            if student_data_from_request.identity_details:
                identity_data = student_data_from_request.identity_details
                if identity_data.aadhaar_no is not None:
                    student.aadhaar_no = identity_data.aadhaar_no
                if identity_data.mp_uhid is not None:
                    student.mp_uhid = identity_data.mp_uhid
                if identity_data.abha_id is not None:
                    student.abha_id = identity_data.abha_id
                if identity_data.class_room is not None:
                    student.class_room = identity_data.class_room
                if identity_data.section is not None:
                    student.section = identity_data.section.upper()
                if identity_data.roll_no is not None:
                    student.roll_no = identity_data.roll_no.upper()

            if student_data_from_request.food:
                food_data = student_data_from_request.food
                if food_data.food_preferences is not None:
                    student.food_preferences = food_data.food_preferences.upper()

            if student_data_from_request.address_details:
                address_data = student_data_from_request.address_details
                if address_data.address_line1 is not None:
                    student.address_line1 = address_data.address_line1.upper()
                if address_data.address_line2 is not None:
                    student.address_line2 = address_data.address_line2.upper()
                if address_data.landmark is not None:
                    student.landmark = address_data.landmark.upper()
                if address_data.street is not None:
                    student.street = address_data.street.upper()
                if address_data.state is not None:
                    student.state = address_data.state.upper()
                if address_data.country is not None:
                    student.country = address_data.country.upper()
                if address_data.pincode is not None:
                    student.pincode = address_data.pincode
                if address_data.country_code is not None:
                    student.country_code = address_data.country_code
                if address_data.phone is not None:
                    student.phone = address_data.phone

            student.updated_by = str(current_user.get("user_id", ""))
            student.updated_user_role = str(current_user.get("user_role", ""))
            student.updated_role_type = str(current_user.get("role_type", ""))
            await student.save()

            # Update parent details
            if update_data.parent_details:
                parent_details = update_data.parent_details
                parent_model = await Parents.get_or_none(id=parent_details.id)
                if parent_model:
                    # Determine primary_mobile: use parent_details.primary_mobile if provided, else use student phone
                    primary_mobile = parent_details.primary_mobile if parent_details.primary_mobile else student.phone

                    parent_model.primary_first_name = parent_details.primary_first_name.upper() if parent_details.primary_first_name else parent_model.primary_first_name
                    parent_model.primary_middle_name = parent_details.primary_middle_name.upper() if parent_details.primary_middle_name else parent_model.primary_middle_name
                    parent_model.primary_last_name = parent_details.primary_last_name.upper() if parent_details.primary_last_name else parent_model.primary_last_name
                    parent_model.primary_country_calling_code = parent_details.primary_country_calling_code if parent_details.primary_country_calling_code else parent_model.primary_country_calling_code
                    parent_model.primary_mobile = primary_mobile if primary_mobile else parent_model.primary_mobile
                    parent_model.primary_email = parent_details.primary_email.lower() if parent_details.primary_email else parent_model.primary_email
                    parent_model.secondary_first_name = parent_details.secondary_first_name.upper() if parent_details.secondary_first_name else parent_model.secondary_first_name
                    parent_model.secondary_middle_name = parent_details.secondary_middle_name.upper() if parent_details.secondary_middle_name else parent_model.secondary_middle_name
                    parent_model.secondary_last_name = parent_details.secondary_last_name.upper() if parent_details.secondary_last_name else parent_model.secondary_last_name
                    parent_model.secondary_country_calling_code = parent_details.secondary_country_calling_code if parent_details.secondary_country_calling_code else parent_model.secondary_country_calling_code
                    parent_model.secondary_mobile = parent_details.secondary_mobile if parent_details.secondary_mobile else parent_model.secondary_mobile
                    parent_model.secondary_email = parent_details.secondary_email.lower() if parent_details.secondary_email else parent_model.secondary_email
                    if parent_details.parent_pincode is not None:
                        parent_model.pincode = parent_details.parent_pincode
                    
                    parent_model.updated_by = str(current_user.get("user_id", ""))
                    parent_model.updated_user_role = str(current_user.get("user_role", ""))
                    parent_model.updated_role_type = str(current_user.get("role_type", ""))
                    await parent_model.save()

                    # Ensure ParentChildren link exists and update primary_phone_no
                    parent_child_link = await ParentChildren.get_or_none(parent_id=parent_model.id, student_id=student_db_id)
                    if parent_child_link:
                        parent_child_link.primary_phone_no = parent_model.primary_mobile
                        parent_child_link.secondary_phone_no = parent_model.secondary_mobile
                        parent_child_link.updated_by = str(current_user.get("user_id", ""))
                        parent_child_link.updated_user_role = str(current_user.get("user_role", ""))
                        parent_child_link.updated_role_type = str(current_user.get("role_type", ""))
                        await parent_child_link.save()
                    else:
                        parent_child_data = {
                            "parent_id": parent_model.id,
                            "student_id": student_db_id,
                            "primary_phone_no": parent_model.primary_mobile,
                            "secondary_phone_no": parent_model.secondary_mobile,
                            "status": True,
                            "created_by": str(current_user.get("user_id", "")),
                            "created_user_role": str(current_user.get("user_role", "")),
                            "created_role_type": str(current_user.get("role_type", "")),
                        }
                        parent_child_validated = ParentChildrenCreateSchema(**parent_child_data)
                        await ParentChildren.create(**parent_child_validated.model_dump())

            # Re-fetch student and parent details to ensure fresh data for the response
            updated_student = await Students.get(id=student_db_id)
            try:
                profile_image = await get_new_url(updated_student.profile_image)
            except:
                profile_image = ""

            # Construct response data
            response_student_details = {
                "id": updated_student.id,
                "image": profile_image,
                "first_name": updated_student.first_name,
                "middle_name": updated_student.middle_name,
                "last_name": updated_student.last_name,
                "gender": updated_student.gender,
                "blood_group": updated_student.blood_group,
                "age": calculate_age_string(updated_student.dob) if updated_student.dob else "",
                "dob": str(updated_student.dob) if updated_student.dob else "",
                "identity_details": {
                    "aadhaar_no": updated_student.aadhaar_no,
                    "mp_uhid": updated_student.mp_uhid,
                    "abha_id": updated_student.abha_id,
                    "class_room": updated_student.class_room,
                    "section": updated_student.section,
                    "roll_no": updated_student.roll_no,
                },
                "food": {"food_preferences": updated_student.food_preferences},
                "address_details": {
                    "address_line1": updated_student.address_line1,
                    "address_line2": updated_student.address_line2,
                    "landmark": updated_student.landmark,
                    "street": updated_student.street,
                    "state": updated_student.state,
                    "country": updated_student.country,
                    "pincode": updated_student.pincode,
                    "country_code": updated_student.country_code,
                    "phone": updated_student.phone,
                },
            }

            response_parent_details = {}
            if update_data.parent_details:
                parent = await Parents.get_or_none(id=parent_details.id)
                if parent:
                    response_parent_details = {
                        "id": parent.id,
                        "primary_first_name": parent.primary_first_name,
                        "primary_middle_name": parent.primary_middle_name,
                        "primary_last_name": parent.primary_last_name,
                        "primary_mobile": parent.primary_mobile,
                        "primary_email": parent.primary_email,
                        "primary_country_calling_code": parent.primary_country_calling_code,
                        "secondary_first_name": parent.secondary_first_name,
                        "secondary_middle_name": parent.secondary_middle_name,
                        "secondary_last_name": parent.secondary_last_name,
                        "secondary_mobile": parent.secondary_mobile,
                        "secondary_email": parent.secondary_email,
                        "secondary_country_calling_code": parent.secondary_country_calling_code,
                    }
                else:
                    response_parent_details = {
                        "id": parent_details.id,
                        "primary_first_name": "",
                        "primary_middle_name": "",
                        "primary_last_name": "",
                        "primary_mobile": "",
                        "primary_email": "",
                        "primary_country_calling_code": "",
                        "secondary_first_name": "",
                        "secondary_middle_name": "",
                        "secondary_last_name": "",
                        "secondary_mobile": "",
                        "secondary_email": "",
                        "secondary_country_calling_code": "",
                    }

            final_resp_data = {
                "student_details": response_student_details,
                "parent_details": response_parent_details,
                "warnings": [warning_message] if len(school_associations) > 1 else [],
            }

            final_resp = StandardResponse(
                status=True,
                message="Student and associated parent details updated successfully.",
                data=final_resp_data,
                errors={},
            )
            return JSONResponse(content=final_resp.model_dump(), status_code=status.HTTP_200_OK)

    except Exception as e:
        resp = StandardResponse(
            status=False,
            message="An error occurred while processing the request.",
            data={},
            errors={"error_details": str(e)},
        )
        return JSONResponse(content=resp.model_dump(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
