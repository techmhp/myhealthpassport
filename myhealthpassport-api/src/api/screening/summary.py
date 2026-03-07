from fastapi import Depends, APIRouter, status
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Optional, Any
import json
from src.core.manager import get_current_user
from src.models.student_models import Students, SmartScaleData
from src.models.school_models import Schools
from src.models.user_models import (
    AnalystTeam,
    AnalystRoles,
    Parents,
    SchoolRoles,
    AdminTeamRoles,
    AdminTeam,
    SchoolStaff,
    ScreeningTeamRoles,
    ConsultantRoles,
    ConsultantTeam,
)
from src.models.other_models import ClinicalRecomendations, ClinicalFindings
from src.models.screening_models import DentalScreening, EyeScreening
from src.utils.response import StandardResponse
from . import router



async def get_current_authorized_user(user: Any = Depends(get_current_user)):
    if user is None:
        response_obj = StandardResponse(
            status=False,
            message="No user provided",
            errors={"detail": "User is None"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_401_UNAUTHORIZED)

    if not isinstance(user, dict) or "user_id" not in user or "user_role" not in user or "role_type" not in user:
        response_obj = StandardResponse(
            status=False,
            message="Invalid user data format",
            errors={"detail": f"Expected user_id, user_role, and role_type, got {user}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    role_type = user["role_type"].strip().upper()
    role_to_check = user["user_role"].strip().upper()
    
    # Include SCREENING_TEAM in allowed_roles
    allowed_roles = ["PARENT", "ADMIN_TEAM", "SCHOOL_STAFF", "ANALYST_TEAM","CONSULTANT_TEAM"]
    
    if role_type not in allowed_roles:
        response_obj = StandardResponse(
            status=False,
            message="User role not authorized for this endpoint",
            errors={"detail": f"Invalid role_type: {role_type}. Allowed roles: {allowed_roles}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    if role_type == "PARENT":
        parent = await Parents.get_or_none(id=user["user_id"])
        if not parent:
            response_obj = StandardResponse(
                status=False,
                message="Parent not found",
                errors={"detail": f"No parent found for user_id: {user['user_id']}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return parent

    elif role_type == "SCHOOL_STAFF":
        if role_to_check not in [role.value for role in SchoolRoles]:
            response_obj = StandardResponse(
                status=False,
                message="Invalid School admin",
                errors={"detail": f"Invalid user_role: {role_to_check}. Allowed roles: {[role.value for role in SchoolRoles]}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)
        
        schooladmin = await SchoolStaff.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
        if not schooladmin:
            # Check AnalystTeam for overlapping roles (e.g., PSYCHOLOGIST, NUTRITIONIST)
            school_admin = await SchoolStaff.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
            if school_admin:
                return school_admin
            existing_roles = await SchoolStaff.filter(id=user["user_id"]).values_list("user_role", flat=True)
            response_obj = StandardResponse(
                status=False,
                message="School admin member not found",
                errors={"detail": f"No school admin team member found for user_id: {user['user_id']} with user_role: {role_to_check}. Existing roles: {existing_roles or 'None'}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return schooladmin

    elif role_type == "ADMIN_TEAM":
        if role_to_check not in [role.value for role in AdminTeamRoles]:
            response_obj = StandardResponse(
                status=False,
                message="Invalid Admin team role",
                errors={"detail": f"Invalid user_role: {role_to_check}. Allowed roles: {[role.value for role in AdminTeamRoles]}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)
        
        admin_team = await AdminTeam.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
        if not admin_team:
            existing_roles = await AdminTeam.filter(id=user["user_id"]).values_list("user_role", flat=True)
            response_obj = StandardResponse(
                status=False,
                message="Admin team member not found",
                errors={"detail": f"No Admin team member found for user_id: {user['user_id']} with user_role: {role_to_check}. Existing roles: {existing_roles or 'None'}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return admin_team

    elif role_type == "ANALYST_TEAM":
        if role_to_check not in [role.value for role in AnalystRoles]:
            response_obj = StandardResponse(
                status=False,
                message="Invalid Analyst team role",
                errors={"detail": f"Invalid user_role: {role_to_check}. Allowed roles: {[role.value for role in AnalystRoles]}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)
        
        analyst_team = await AnalystTeam.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
        if not analyst_team:
            existing_roles = await AnalystTeam.filter(id=user["user_id"]).values_list("user_role", flat=True)
            response_obj = StandardResponse(
                status=False,
                message="Analyst team member not found",
                errors={"detail": f"No Analyst team member found for user_id: {user['user_id']} with user_role: {role_to_check}. Existing roles: {existing_roles or 'None'}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return analyst_team

    elif role_type == "CONSULTANT_TEAM":
        if role_to_check not in [role.value for role in ConsultantRoles]:
            response_obj = StandardResponse(
                status=False,
                message="Invalid consultant team role",
                errors={"detail": f"Invalid user_role: {role_to_check}. Allowed roles: {[role.value for role in ConsultantRoles]}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)

        consultant_team = await ConsultantTeam.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
        if not consultant_team:
            existing_roles = await ConsultantTeam.filter(id=user["user_id"]).values_list("user_role", flat=True)
            response_obj = StandardResponse(
                status=False,
                message="Consultant team member not found",
                errors={"detail": f"No Consultant team member found for user_id: {user['user_id']} with user_role: {role_to_check}. Existing roles: {existing_roles or 'None'}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return consultant_team

    response_obj = StandardResponse(
        status=False,
        message="User not found",
        errors={"detail": "User not found"}
    )
    return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

# Add these imports at the top
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ===================================================================
# MODIFIED: GET SCREENING OVERALL SUMMARY (with Academic Year Filter)
# ===================================================================
@router.get("/screening-overall-summary/{student_id}", response_model=StandardResponse)
async def get_health_screening_data(
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_analyst: Any = Depends(get_current_authorized_user)
):
    if isinstance(current_analyst, JSONResponse):
        return current_analyst
    
    try:
        # Determine academic year
        if academic_year is None:
            academic_year = get_current_academic_year()

        try:
            ay_start, ay_end = parse_academic_year(academic_year)
        except ValueError as e:
            response_obj = StandardResponse(
                status=False,
                message=str(e),
                data={},
                errors={"academic_year": str(e)}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Build academic year filter
        year_filter = build_academic_year_filter(academic_year)

        # Apply academic year filter to all queries
        dental_query = DentalScreening.filter(year_filter, student__id=student_id).first()
        dental_data = await dental_query.values("ds_id", "status", "report_summary") if dental_query else None
        
        eye_query = EyeScreening.filter(year_filter, student__id=student_id).first()
        eye_data = await eye_query.values("es_id", "status", "report_summary") if eye_query else None
        
        clinical_query = ClinicalRecomendations.filter(
            year_filter,
            student__id=student_id,
            report_type__iexact="Physical Screening Report"
        ).first()
        clinical_data = await clinical_query.values("id", "report_type", "status", "summary", "common_summary", "common_status") if clinical_query else None

        emotional_query = ClinicalFindings.filter(year_filter, student__id=student_id).first()
        emotional_developemental_data = await emotional_query.values("id", "status", "summary") if emotional_query else None

        lab_query = ClinicalRecomendations.filter(
            year_filter,
            student__id=student_id,
            report_type__iexact="Lab Reports"
        ).first()
        lab_data = await lab_query.values("id", "report_type", "status", "summary", "common_summary", "common_status") if lab_query else None
        
        if not dental_data and not eye_data and not clinical_data:
            response_obj = StandardResponse(
                status=False,
                message=f"no Screening or clinical data found for student ID{student_id}",
                data={},
                errors={}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        
        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        data = {
            "student_id": student_id,
            "dental_screening": {
                "ds_id": dental_data["ds_id"] if dental_data else None,
                "status": dental_data["status"] if dental_data else None,
                "summary": dental_data["report_summary"] if dental_data else None
            },
            "eye_screening": {
                "es_id": eye_data["es_id"] if eye_data else None,
                "status": eye_data["status"] if eye_data else None,
                "summary": eye_data["report_summary"] if eye_data else None
            },
            "physical_screening": {
                "id": clinical_data["id"] if clinical_data else None,
                "report_type": clinical_data["report_type"] if clinical_data else None,
                "status": clinical_data["status"] if clinical_data else None,
                "summary": clinical_data["summary"] if clinical_data else None
            },
            "emotional_developmental": {
                "id": emotional_developemental_data["id"] if emotional_developemental_data else None,
                "status": emotional_developemental_data["status"] if emotional_developemental_data else None,
                "summary": emotional_developemental_data["summary"] if emotional_developemental_data else None
            },
            "nutritional_summary": {
                "summary": clinical_data["common_summary"] if clinical_data else None,
                "status": clinical_data["common_status"] if clinical_data else None
            },
            "lab_reports": {
                "id": lab_data["id"] if lab_data else None,
                "status": lab_data["status"] if lab_data else None,
                "summary": lab_data["summary"] if lab_data else None
            },
        }
        
        response_obj = StandardResponse(
            status=True,
            message="Health screening data retrieved successfully",
            data=data,  # ← Same format as original
            errors={}
        )
        
        json_response = JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)
        json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return json_response

    except ValueError as ve:
        response_obj = StandardResponse(
            status=False,
            message="Invalid data type in query result",
            data={},
            errors={"detail": str(ve)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        response_obj = StandardResponse(
            status=False,
            message="Failed to retrieve health screening data",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)



# ===================================================================
# MODIFIED: GET SCREENING DETAILED SUMMARY (with Academic Year Filter)
# ===================================================================
@router.get("/screening-detailed-summary/{student_id}", response_model=StandardResponse, tags=["SmartScale"])
async def get_smart_scale_detailed_report(
    student_id: int,
    school_id: Optional[int] = None,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user: dict = Depends(get_current_authorized_user)
):
    try:
        # Check if student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="Student not found.",
                    data={},
                    errors={"student_id": "Student with this ID does not exist"}
                ).__dict__,
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Determine academic year
        if academic_year is None:
            academic_year = get_current_academic_year()

        try:
            ay_start, ay_end = parse_academic_year(academic_year)
        except ValueError as e:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message=str(e),
                    data={},
                    errors={"academic_year": str(e)}
                ).__dict__,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Build academic year filter
        year_filter = build_academic_year_filter(academic_year)

        # Build query filters
        filters = {"student": student}

        # If school_id is provided, add it to filters
        if school_id:
            school = await Schools.get_or_none(school_id=school_id)
            if not school:
                return JSONResponse(
                    content=StandardResponse(
                        status=False,
                        message="School not found.",
                        data={},
                        errors={"school_id": "School with this ID does not exist"}
                    ).__dict__,
                    status_code=status.HTTP_404_NOT_FOUND
                )
            filters["school"] = school

        # Get smart scale data with academic year filter
        smart_scale_data = await SmartScaleData.filter(year_filter, **filters).select_related("student", "school").first()

        # Initialize smart scale data dictionary
        data_dict = {
            "id": None,
            "student_id": student.id,
            "school_id": school.school_id if school_id else None,
            "height_cm": None,
            "age_years": None,
            "weighing_time": None,
            "body_weight_kg": None,
            "body_fat_rate_percent": None,
            "device_mac": None,
            "inorganic_salt_content_kg": None,
            "obesity_percent": None,
            "water_content_kg": None,
            "protein_content_kg": None,
            "subcutaneous_fat_volume_kg": None,
            "bmi": None,
            "fat_content_kg": None,
            "muscle_rate_percent": None,
            "muscle_mass_kg": None,
            "visceral_fat_level": None,
            "bmr": None,
            "body_moisture_content_percent": None,
            "bone_mass_kg": None,
            "internal_protein_rate_percent": None,
            "skeletal_muscle_rate_percent": None,
            "lean_body_mass_kg": None,
            "heart_rate_beats_min": None,
            "physical_score": None,
            "body_type": None,
            "physical_age": None,
            "subcutaneous_fat_rate": None,
            "health_level": None,
            "obesity_level": None,
            "fat_control_quantity": None,
            "weight_control_quantity": None,
            "muscle_control_quantity": None,
            "standard_body_weight": None,
            "ideal_weight": None,
            "body_cell_volume_kg": None,
            "extracellular_water_volume_kg": None,
            "intracellular_water_volume_kg": None,
            "left_hand_fat_mass_kg": None,
            "left_foot_fat_mass_kg": None,
            "right_hand_fat_mass_kg": None,
            "right_foot_fat_mass_kg": None,
            "trunk_fat_mass_kg": None,
            "left_hand_fat_rate_percent": None,
            "left_foot_fat_rate_percent": None,
            "right_hand_fat_rate_percent": None,
            "right_foot_fat_rate_percent": None,
            "trunk_fat_rate_percent": None,
            "left_hand_muscle_mass_kg": None,
            "left_foot_muscle_mass_kg": None,
            "right_hand_muscle_mass_kg": None,
            "right_foot_muscle_mass_kg": None,
            "trunk_muscle_mass_kg": None,
            "skeletal_muscle_mass_index": None,
            "whr": None,
            "left_hand_muscle_rate": None,
            "left_leg_muscle_rate": None,
            "right_hand_muscle_rate": None,
            "right_foot_muscle_rate": None,
            "trunk_muscle_rate": None,
            "skeletal_muscle_mass_kg": None,
            "health_score": None,
            "physical_screening_report": None,
            "status": "",
            "overall_summary": ""
        }

        # Populate smart scale data if available
        if smart_scale_data:
            data_dict.update({
                "id": smart_scale_data.id,
                "student_id": smart_scale_data.student.id,
                "school_id": smart_scale_data.school.school_id,
                "height_cm": smart_scale_data.height_cm,
                "age_years": smart_scale_data.age_years,
                "weighing_time": smart_scale_data.weighing_time.isoformat() if isinstance(smart_scale_data.weighing_time, datetime) else smart_scale_data.weighing_time if smart_scale_data.weighing_time else None,
                "body_weight_kg": smart_scale_data.body_weight_kg,
                "body_fat_rate_percent": smart_scale_data.body_fat_rate_percent,
                "device_mac": smart_scale_data.device_mac,
                "inorganic_salt_content_kg": smart_scale_data.inorganic_salt_content_kg,
                "obesity_percent": smart_scale_data.obesity_percent,
                "water_content_kg": smart_scale_data.water_content_kg,
                "protein_content_kg": smart_scale_data.protein_content_kg,
                "subcutaneous_fat_volume_kg": smart_scale_data.subcutaneous_fat_volume_kg,
                "bmi": smart_scale_data.bmi,
                "fat_content_kg": smart_scale_data.fat_content_kg,
                "muscle_rate_percent": smart_scale_data.muscle_rate_percent,
                "muscle_mass_kg": smart_scale_data.muscle_mass_kg,
                "visceral_fat_level": smart_scale_data.visceral_fat_level,
                "bmr": smart_scale_data.bmr,
                "body_moisture_content_percent": smart_scale_data.body_moisture_content_percent,
                "bone_mass_kg": smart_scale_data.bone_mass_kg,
                "internal_protein_rate_percent": smart_scale_data.internal_protein_rate_percent,
                "skeletal_muscle_rate_percent": smart_scale_data.skeletal_muscle_rate_percent,
                "lean_body_mass_kg": smart_scale_data.lean_body_mass_kg,
                "heart_rate_beats_min": smart_scale_data.heart_rate_beats_min,
                "physical_score": smart_scale_data.physical_score,
                "body_type": smart_scale_data.body_type,
                "physical_age": smart_scale_data.physical_age,
                "subcutaneous_fat_rate": smart_scale_data.subcutaneous_fat_rate,
                "health_level": smart_scale_data.health_level,
                "obesity_level": smart_scale_data.obesity_level,
                "fat_control_quantity": smart_scale_data.fat_control_quantity,
                "weight_control_quantity": smart_scale_data.weight_control_quantity,
                "muscle_control_quantity": smart_scale_data.muscle_control_quantity,
                "standard_body_weight": smart_scale_data.standard_body_weight,
                "ideal_weight": smart_scale_data.ideal_weight,
                "body_cell_volume_kg": smart_scale_data.body_cell_volume_kg,
                "extracellular_water_volume_kg": smart_scale_data.extracellular_water_volume_kg,
                "intracellular_water_volume_kg": smart_scale_data.intracellular_water_volume_kg,
                "left_hand_fat_mass_kg": smart_scale_data.left_hand_fat_mass_kg,
                "left_foot_fat_mass_kg": smart_scale_data.left_foot_fat_mass_kg,
                "right_hand_fat_mass_kg": smart_scale_data.right_hand_fat_mass_kg,
                "right_foot_fat_mass_kg": smart_scale_data.right_foot_fat_mass_kg,
                "trunk_fat_mass_kg": smart_scale_data.trunk_fat_mass_kg,
                "left_hand_fat_rate_percent": smart_scale_data.left_hand_fat_rate_percent,
                "left_foot_fat_rate_percent": smart_scale_data.left_foot_fat_rate_percent,
                "right_hand_fat_rate_percent": smart_scale_data.right_hand_fat_rate_percent,
                "right_foot_fat_rate_percent": smart_scale_data.right_foot_fat_rate_percent,
                "trunk_fat_rate_percent": smart_scale_data.trunk_fat_rate_percent,
                "left_hand_muscle_mass_kg": smart_scale_data.left_hand_muscle_mass_kg,
                "left_foot_muscle_mass_kg": smart_scale_data.left_foot_muscle_mass_kg,
                "right_hand_muscle_mass_kg": smart_scale_data.right_hand_muscle_mass_kg,
                "right_foot_muscle_mass_kg": smart_scale_data.right_foot_muscle_mass_kg,
                "trunk_muscle_mass_kg": smart_scale_data.trunk_muscle_mass_kg,
                "skeletal_muscle_mass_index": smart_scale_data.skeletal_muscle_mass_index,
                "whr": smart_scale_data.whr,
                "left_hand_muscle_rate": smart_scale_data.left_hand_muscle_rate,
                "left_leg_muscle_rate": smart_scale_data.left_leg_muscle_rate,
                "right_hand_muscle_rate": smart_scale_data.right_hand_muscle_rate,
                "right_foot_muscle_rate": smart_scale_data.right_foot_muscle_rate,
                "trunk_muscle_rate": smart_scale_data.trunk_muscle_rate,
                "skeletal_muscle_mass_kg": smart_scale_data.skeletal_muscle_mass_kg,
                "health_score": smart_scale_data.physical_score
            })

        # Fetch physical screening data with academic year filter
        physical_clinical_data = await ClinicalRecomendations.filter(
            year_filter,
            student__id=student_id,
            report_type__iexact="physical screening report"
        ).prefetch_related("student").all()

        # Prepare physical screening report
        physical_screening_report = {
            "strengths": [],
            "needs_attention": []
        }
        physical_screening_status = ""
        physical_screening_summary = ""
        
        if physical_clinical_data:
            for clinical_data in physical_clinical_data:
                if clinical_data.questions_data:
                    for item in clinical_data.questions_data:
                        question_type = item.get("question_type", "")
                        answers = item.get("answers", [])
                        if question_type == "Good Outcomes":
                            physical_screening_report["strengths"].extend(answers)
                        elif question_type == "Areas of Concern":
                            physical_screening_report["needs_attention"].extend(answers)
                if clinical_data.status and not physical_screening_status:
                    physical_screening_status = clinical_data.status
                if clinical_data.summary and not physical_screening_summary:
                    physical_screening_summary = clinical_data.summary
        if not physical_screening_report["strengths"]:
            physical_screening_report["strengths"] = [""]
        if not physical_screening_report["needs_attention"]:
            physical_screening_report["needs_attention"] = [""]

        # Update smart scale data with physical screening report
        data_dict["physical_screening_report"] = physical_screening_report
        data_dict["status"] = physical_screening_status
        data_dict["overall_summary"] = physical_screening_summary

        # Fetch nutritional questionnaire data with academic year filter
        questionnaire_data = await ClinicalRecomendations.filter(
            year_filter,
            student__id=student_id,
            report_type__iexact="Questionnaire Reports"
        ).prefetch_related("student").all()

        # Prepare nutritional questionnaire analysis
        nutritional_questionnaire_analysis = {
            "strengths": [],
            "needs_attention": []
        }
        common_summary = ""
        common_status = ""
        recommendations = ""

        if questionnaire_data:
            for q_data in questionnaire_data:
                if q_data.questions_data:
                    for item in q_data.questions_data:
                        question_type = item.get("question_type", "")
                        answers = item.get("answers", [])
                        if question_type == "Good Outcomes":
                            nutritional_questionnaire_analysis["strengths"].extend(answers)
                        elif question_type == "Areas of Concern":
                            nutritional_questionnaire_analysis["needs_attention"].extend(answers)
                if q_data.summary and not common_summary:
                    common_summary = q_data.summary
                if q_data.status and not common_status:
                    common_status = q_data.status
                if q_data.common_summary:
                    common_summary = q_data.common_summary
                if q_data.common_status:
                    common_status = q_data.common_status
                if q_data.clinical_notes and not recommendations:
                    recommendations = q_data.clinical_notes
        if not nutritional_questionnaire_analysis["strengths"]:
            nutritional_questionnaire_analysis["strengths"] = [""]
        if not nutritional_questionnaire_analysis["needs_attention"]:
            nutritional_questionnaire_analysis["needs_attention"] = [""]

        # Fetch nutritional deficiency data with academic year filter
        deficiency_data = await ClinicalRecomendations.filter(
            year_filter,
            student__id=student_id,
            report_type__iexact="Nutrition Deficiency Report"
        ).prefetch_related("student").all()

        # Prepare nutritional screening analysis
        nutritional_screening_analysis = {
            "strengths": [],
            "needs_attention": []
        }

        if deficiency_data:
            for d_data in deficiency_data:
                if d_data.questions_data:
                    for item in d_data.questions_data:
                        question_type = item.get("question_type", "")
                        answers = item.get("answers", [])
                        if question_type == "Good Outcomes":
                            nutritional_screening_analysis["strengths"].extend(answers)
                        elif question_type == "Areas of Concern":
                            nutritional_screening_analysis["needs_attention"].extend(answers)
                if d_data.summary and not common_summary:
                    common_summary = d_data.summary
                if d_data.status and not common_status:
                    common_status = d_data.status
                if d_data.common_summary:
                    common_summary = d_data.common_summary
                if d_data.common_status:
                    common_status = d_data.common_status
                if d_data.clinical_notes and not recommendations:
                    recommendations = d_data.clinical_notes
        if not nutritional_screening_analysis["strengths"]:
            nutritional_screening_analysis["strengths"] = [""]
        if not nutritional_screening_analysis["needs_attention"]:
            nutritional_screening_analysis["needs_attention"] = [""]

        # Prepare nutritional screening report
        nutritional_screening_report = {
            "nutritional_questionnaire_analysis": nutritional_questionnaire_analysis,
            "nutritional_screening_analysis": nutritional_screening_analysis,
            "common_summary": common_summary,
            "common_status": common_status,
            "recommendations": recommendations
        }

        # Fetch developmental and emotional data with academic year filter
        developmental_data = await ClinicalFindings.filter(
            year_filter,
            student__id=student_id
        ).order_by('-updated_at').prefetch_related("student").all()

        # Prepare developmental and emotional assessment
        developmental_emotional_assessment = {
            "strengths": [],
            "needs_attention": [],
            "summary": "",
            "status": "",
            "recommendations": []
        }

        if developmental_data:
            for d_data in developmental_data:
                if d_data.findings_data:
                    if isinstance(d_data.findings_data, str):
                        try:
                            parsed_data = json.loads(d_data.findings_data)
                            if isinstance(parsed_data, list):
                                for item in parsed_data:
                                    if isinstance(item, dict):
                                        findings = item.get("findings", "")
                                        remarks = item.get("remarks", "")
                                        if findings and remarks:
                                            developmental_emotional_assessment["strengths"].append(f"{findings}: {remarks}")
                                        elif findings:
                                            developmental_emotional_assessment["strengths"].append(findings)
                                        elif remarks:
                                            developmental_emotional_assessment["strengths"].append(remarks)
                                    elif isinstance(item, str):
                                        developmental_emotional_assessment["strengths"].append(item)
                            else:
                                developmental_emotional_assessment["strengths"].append(str(parsed_data))
                        except json.JSONDecodeError:
                            developmental_emotional_assessment["strengths"].append(d_data.findings_data)
                    elif isinstance(d_data.findings_data, list):
                        for item in d_data.findings_data:
                            if isinstance(item, dict):
                                findings = item.get("findings", "")
                                remarks = item.get("remarks", "")
                                if findings and remarks:
                                    developmental_emotional_assessment["strengths"].append(f"{findings}: {remarks}")
                                elif findings:
                                    developmental_emotional_assessment["strengths"].append(findings)
                                elif remarks:
                                    developmental_emotional_assessment["strengths"].append(remarks)
                            elif isinstance(item, str):
                                developmental_emotional_assessment["strengths"].append(item)
                if d_data.need_attention_data:
                    if isinstance(d_data.need_attention_data, str):
                        try:
                            parsed_data = json.loads(d_data.need_attention_data)
                            if isinstance(parsed_data, list):
                                for item in parsed_data:
                                    if isinstance(item, dict):
                                        findings = item.get("findings", "")
                                        remarks = item.get("remarks", "")
                                        if findings and remarks:
                                            developmental_emotional_assessment["needs_attention"].append(f"{findings}: {remarks}")
                                        elif findings:
                                            developmental_emotional_assessment["needs_attention"].append(findings)
                                        elif remarks:
                                            developmental_emotional_assessment["needs_attention"].append(remarks)
                                    elif isinstance(item, str):
                                        developmental_emotional_assessment["needs_attention"].append(item)
                            else:
                                developmental_emotional_assessment["needs_attention"].append(str(parsed_data))
                        except json.JSONDecodeError:
                            developmental_emotional_assessment["needs_attention"].append(d_data.need_attention_data)
                    elif isinstance(d_data.need_attention_data, list):
                        for item in d_data.need_attention_data:
                            if isinstance(item, dict):
                                findings = item.get("findings", "")
                                remarks = item.get("remarks", "")
                                if findings and remarks:
                                    developmental_emotional_assessment["needs_attention"].append(f"{findings}: {remarks}")
                                elif findings:
                                    developmental_emotional_assessment["needs_attention"].append(findings)
                                elif remarks:
                                    developmental_emotional_assessment["needs_attention"].append(remarks)
                            elif isinstance(item, str):
                                developmental_emotional_assessment["needs_attention"].append(item)
            if developmental_data:
                latest_data = developmental_data[0]
                developmental_emotional_assessment["summary"] = latest_data.summary or ""
                developmental_emotional_assessment["status"] = latest_data.status or ""
                developmental_emotional_assessment["recommendations"] = latest_data.clinical_notes_recommendations.split(",") if latest_data.clinical_notes_recommendations else []

        if not developmental_emotional_assessment["strengths"]:
            developmental_emotional_assessment["strengths"] = [""]
        if not developmental_emotional_assessment["needs_attention"]:
            developmental_emotional_assessment["needs_attention"] = [""]

        # Fetch dental screening data (latest) with academic year filter
        dental_screening = await DentalScreening.filter(year_filter, student__id=student_id).order_by('-created_at').first()
        dental_screening_report = {
            "patient_concern": [],
            "oral_examination": [],
            "diagnosis": [],
            "treatment_recommendations": [],
            "report_summary": "",
            "next_followup": None,
            "examination_note": "",
            "treatment_recommendations_note": "",
            "status": ""
        }
        if dental_screening:
            dental_screening_report.update({
                "patient_concern": json.loads(dental_screening.patient_concern) if dental_screening.patient_concern else [],
                "oral_examination": json.loads(dental_screening.oral_examination) if dental_screening.oral_examination else [],
                "diagnosis": json.loads(dental_screening.diagnosis) if dental_screening.diagnosis else [],
                "treatment_recommendations": json.loads(dental_screening.treatment_recommendations) if dental_screening.treatment_recommendations else [],
                "report_summary": dental_screening.report_summary or "",
                "next_followup": dental_screening.next_followup.isoformat() if isinstance(dental_screening.next_followup, datetime) else dental_screening.next_followup if dental_screening.next_followup else None,
                "examination_note": dental_screening.examination_note or "",
                "treatment_recommendations_note": dental_screening.treatment_recommendations_note or "",
                "status": dental_screening.status or ""
            })

        # Fetch eye screening data (latest) with academic year filter
        eye_screening = await EyeScreening.filter(year_filter, student__id=student_id).order_by('-created_at').first()
        eye_screening_report = {
            "patient_concern": [],
            "vision_lefteye_res": [],
            "vision_righteye_res": [],
            "additional_find": "",
            "report_summary": "",
            "status": "",
            "recommendations": [],
            "next_followup": None
        }
        if eye_screening:
            eye_screening_report.update({
                "patient_concern": json.loads(eye_screening.patient_concern) if eye_screening.patient_concern else [],
                "vision_lefteye_res": json.loads(eye_screening.vision_lefteye_res) if eye_screening.vision_lefteye_res else [],
                "vision_righteye_res": json.loads(eye_screening.vision_righteye_res) if eye_screening.vision_righteye_res else [],
                "additional_find": eye_screening.additional_find or "",
                "report_summary": eye_screening.report_summary or "",
                "status": eye_screening.status or "",
                "recommendations": json.loads(eye_screening.recommendations) if eye_screening.recommendations else [],
                "next_followup": eye_screening.next_followup.isoformat() if isinstance(eye_screening.next_followup, datetime) else eye_screening.next_followup if eye_screening.next_followup else None
            })

        # Fetch lab reports data with academic year filter
        lab_reports_data = await ClinicalRecomendations.filter(
            year_filter,
            student__id=student_id,
            report_type__iexact="Lab Reports"
        ).prefetch_related("student").all()
        lab_reports = {
            "strengths": [],
            "needs_attention": [],
            "lab_reports_summary": "",
            "lab_status": ""
        }
        if lab_reports_data:
            for lab_data in lab_reports_data:
                if lab_data.questions_data:
                    for item in lab_data.questions_data:
                        question_type = item.get("question_type", "")
                        answers = item.get("answers", [])
                        if question_type == "Good Outcomes":
                            lab_reports["strengths"].extend(answers)
                        elif question_type == "Areas of Concern":
                            lab_reports["needs_attention"].extend(answers)
                if lab_data.summary and not lab_reports["lab_reports_summary"]:
                    lab_reports["lab_reports_summary"] = lab_data.summary
                if lab_data.status:
                    lab_reports["lab_status"] = lab_data.status
        if not lab_reports["strengths"]:
            lab_reports["strengths"] = [""]
        if not lab_reports["needs_attention"]:
            lab_reports["needs_attention"] = [""]

        # Populate student_info
        student_info = {
            "student_id": student.id,
            "first_name": student.first_name,
            "middle_name": student.middle_name,
            "last_name": student.last_name,
            "class": student.class_room,
            "section": student.section
        }

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        resp = JSONResponse(
            content=StandardResponse(
                status=True,
                message="Smart scale data with detailed screening reports retrieved successfully.",
                data={
                    "smart_scale_data": data_dict,
                    "nutritional_screening_report": nutritional_screening_report,
                    "developmental_emotional_assessment": developmental_emotional_assessment,
                    "dental_screening_report": dental_screening_report,
                    "eye_screening_report": eye_screening_report,
                    "lab_reports": lab_reports,
                    "student_info": student_info
                },  # ← Same format as original
                errors={}
            ).__dict__,
            status_code=status.HTTP_200_OK
        )
        resp.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return resp

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message="An unexpected error occurred while retrieving data.",
                data={},
                errors={"unexpected": str(e)}
            ).__dict__,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# @router.get("/screening-overall-summary/{student_id}", response_model=StandardResponse)
# async def get_health_screening_data(student_id: int, current_analyst: Any = Depends(get_current_authorized_user)):
#     if isinstance(current_analyst, JSONResponse):
#         return current_analyst
#     try:
#         dental_query = DentalScreening.filter(student__id=student_id).first()
#         dental_data = await dental_query.values("ds_id", "status", "report_summary") if dental_query else None
        
#         eye_query = EyeScreening.filter(student__id=student_id).first()
#         eye_data = await eye_query.values("es_id", "status", "report_summary") if eye_query else None
        
#         clinical_query = ClinicalRecomendations.filter(
#             student__id=student_id,
#             report_type__iexact="Physical Screening Report"
#         ).first()
#         clinical_data = await clinical_query.values("id", "report_type", "status", "summary", "common_summary", "common_status") if clinical_query else None


        
#         emotional_query = ClinicalFindings.filter(student__id=student_id).first()
#         emotional_developemental_data = await emotional_query.values("id", "status", "summary") if emotional_query else None

#         lab_query = ClinicalRecomendations.filter(
#             student__id=student_id,
#             report_type__iexact="Lab ReportS"
#         ).first()
#         lab_data = await lab_query.values("id", "report_type", "status", "summary", "common_summary", "common_status") if clinical_query else None
        
#         if not dental_data and not eye_data and not clinical_data:
#             response_obj = StandardResponse(
#                 status=False,
#                 message=f"no Screening or clinical data found for student ID{student_id}",
#                 data={},
#                 errors={}
#             )
#             return JSONResponse(content=response_obj.__dict__,status_code=status.HTTP_404_NOT_FOUND)
        
#         data = {
#             "student_id": student_id,
#             "dental_screening": {
#                 "ds_id": dental_data["ds_id"] if dental_data else None,
#                 "status": dental_data["status"] if dental_data else None,
#                 "summary": dental_data["report_summary"] if dental_data else None
#             },
#             "eye_screening": {
#                 "es_id": eye_data["es_id"] if eye_data else None,
#                 "status": eye_data["status"] if eye_data else None,
#                 "summary": eye_data["report_summary"] if eye_data else None
#             },
#             "physical_screening": {
#                 "id": clinical_data["id"] if clinical_data else None,
#                 "report_type": clinical_data["report_type"] if clinical_data else None,
#                 "status": clinical_data["status"] if clinical_data else None,
#                 "summary": clinical_data["summary"] if clinical_data else None
#             },
#             "emotional_developmental": {
#                 "id": emotional_developemental_data["id"] if emotional_developemental_data else None,
#                 "status": emotional_developemental_data["status"] if emotional_developemental_data else None,
#                 "summary": emotional_developemental_data["summary"] if emotional_developemental_data else None
#             },
#             "nutritional_summary": {
#                 "summary": clinical_data["common_summary"] if clinical_data else None,
#                 "status": clinical_data["common_status"] if clinical_data else None
#             },
#             "lab_reports": {
#                 "id": lab_data["id"] if lab_data else None,
#                 "status": lab_data["status"] if lab_data else None,
#                 "summary": lab_data["summary"] if lab_data else None
#             },
#         }
#         response_obj = StandardResponse(
#             status=True,
#             message="Health screening data retrieved successfully",
#             data=data,
#             errors={}
#         )
#         return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)

#     except ValueError as ve:
#         response_obj = StandardResponse(
#             status=False,
#             message="Invalid data type in query result",
#             data={},
#             errors={"detail": str(ve)}
#         )
#         return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)


# @router.get("/screening-detailed-summary/{student_id}", response_model=StandardResponse, tags=["SmartScale"])
# async def get_smart_scale_detailed_report(
#         student_id: int,
#         school_id: Optional[int] = None,
#         current_user: dict = Depends(get_current_authorized_user)
# ):
#     try:
#         # Check if student exists
#         student = await Students.get_or_none(id=student_id)
#         if not student:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message="Student not found.",
#                     data={},
#                     errors={"student_id": "Student with this ID does not exist"}
#                 ).__dict__,
#                 status_code=status.HTTP_404_NOT_FOUND
#             )

#         # Build query filters
#         filters = {"student": student}

#         # If school_id is provided, add it to filters
#         if school_id:
#             school = await Schools.get_or_none(school_id=school_id)
#             if not school:
#                 return JSONResponse(
#                     content=StandardResponse(
#                         status=False,
#                         message="School not found.",
#                         data={},
#                         errors={"school_id": "School with this ID does not exist"}
#                     ).__dict__,
#                     status_code=status.HTTP_404_NOT_FOUND
#                 )
#             filters["school"] = school

#         # Get smart scale data
#         smart_scale_data = await SmartScaleData.filter(**filters).select_related("student", "school").first()

#         # Initialize smart scale data dictionary
#         data_dict = {
#             "id": None,
#             "student_id": student.id,
#             "school_id": school.school_id if school_id else None,
#             "height_cm": None,
#             "age_years": None,
#             "weighing_time": None,
#             "body_weight_kg": None,
#             "body_fat_rate_percent": None,
#             "device_mac": None,
#             "inorganic_salt_content_kg": None,
#             "obesity_percent": None,
#             "water_content_kg": None,
#             "protein_content_kg": None,
#             "subcutaneous_fat_volume_kg": None,
#             "bmi": None,
#             "fat_content_kg": None,
#             "muscle_rate_percent": None,
#             "muscle_mass_kg": None,
#             "visceral_fat_level": None,
#             "bmr": None,
#             "body_moisture_content_percent": None,
#             "bone_mass_kg": None,
#             "internal_protein_rate_percent": None,
#             "skeletal_muscle_rate_percent": None,
#             "lean_body_mass_kg": None,
#             "heart_rate_beats_min": None,
#             "physical_score": None,
#             "body_type": None,
#             "physical_age": None,
#             "subcutaneous_fat_rate": None,
#             "health_level": None,
#             "obesity_level": None,
#             "fat_control_quantity": None,
#             "weight_control_quantity": None,
#             "muscle_control_quantity": None,
#             "standard_body_weight": None,
#             "ideal_weight": None,
#             "body_cell_volume_kg": None,
#             "extracellular_water_volume_kg": None,
#             "intracellular_water_volume_kg": None,
#             "left_hand_fat_mass_kg": None,
#             "left_foot_fat_mass_kg": None,
#             "right_hand_fat_mass_kg": None,
#             "right_foot_fat_mass_kg": None,
#             "trunk_fat_mass_kg": None,
#             "left_hand_fat_rate_percent": None,
#             "left_foot_fat_rate_percent": None,
#             "right_hand_fat_rate_percent": None,
#             "right_foot_fat_rate_percent": None,
#             "trunk_fat_rate_percent": None,
#             "left_hand_muscle_mass_kg": None,
#             "left_foot_muscle_mass_kg": None,
#             "right_hand_muscle_mass_kg": None,
#             "right_foot_muscle_mass_kg": None,
#             "trunk_muscle_mass_kg": None,
#             "skeletal_muscle_mass_index": None,
#             "whr": None,
#             "left_hand_muscle_rate": None,
#             "left_leg_muscle_rate": None,
#             "right_hand_muscle_rate": None,
#             "right_foot_muscle_rate": None,
#             "trunk_muscle_rate": None,
#             "skeletal_muscle_mass_kg": None,
#             "health_score": None,
#             "physical_screening_report": None,
#             "status": "",
#             "overall_summary": ""
#         }

#         # Populate smart scale data if available
#         if smart_scale_data:
#             data_dict.update({
#                 "id": smart_scale_data.id,
#                 "student_id": smart_scale_data.student.id,
#                 "school_id": smart_scale_data.school.school_id,
#                 "height_cm": smart_scale_data.height_cm,
#                 "age_years": smart_scale_data.age_years,
#                 "weighing_time": smart_scale_data.weighing_time.isoformat() if isinstance(smart_scale_data.weighing_time, datetime) else smart_scale_data.weighing_time if smart_scale_data.weighing_time else None,
#                 "body_weight_kg": smart_scale_data.body_weight_kg,
#                 "body_fat_rate_percent": smart_scale_data.body_fat_rate_percent,
#                 "device_mac": smart_scale_data.device_mac,
#                 "inorganic_salt_content_kg": smart_scale_data.inorganic_salt_content_kg,
#                 "obesity_percent": smart_scale_data.obesity_percent,
#                 "water_content_kg": smart_scale_data.water_content_kg,
#                 "protein_content_kg": smart_scale_data.protein_content_kg,
#                 "subcutaneous_fat_volume_kg": smart_scale_data.subcutaneous_fat_volume_kg,
#                 "bmi": smart_scale_data.bmi,
#                 "fat_content_kg": smart_scale_data.fat_content_kg,
#                 "muscle_rate_percent": smart_scale_data.muscle_rate_percent,
#                 "muscle_mass_kg": smart_scale_data.muscle_mass_kg,
#                 "visceral_fat_level": smart_scale_data.visceral_fat_level,
#                 "bmr": smart_scale_data.bmr,
#                 "body_moisture_content_percent": smart_scale_data.body_moisture_content_percent,
#                 "bone_mass_kg": smart_scale_data.bone_mass_kg,
#                 "internal_protein_rate_percent": smart_scale_data.internal_protein_rate_percent,
#                 "skeletal_muscle_rate_percent": smart_scale_data.skeletal_muscle_rate_percent,
#                 "lean_body_mass_kg": smart_scale_data.lean_body_mass_kg,
#                 "heart_rate_beats_min": smart_scale_data.heart_rate_beats_min,
#                 "physical_score": smart_scale_data.physical_score,
#                 "body_type": smart_scale_data.body_type,
#                 "physical_age": smart_scale_data.physical_age,
#                 "subcutaneous_fat_rate": smart_scale_data.subcutaneous_fat_rate,
#                 "health_level": smart_scale_data.health_level,
#                 "obesity_level": smart_scale_data.obesity_level,
#                 "fat_control_quantity": smart_scale_data.fat_control_quantity,
#                 "weight_control_quantity": smart_scale_data.weight_control_quantity,
#                 "muscle_control_quantity": smart_scale_data.muscle_control_quantity,
#                 "standard_body_weight": smart_scale_data.standard_body_weight,
#                 "ideal_weight": smart_scale_data.ideal_weight,
#                 "body_cell_volume_kg": smart_scale_data.body_cell_volume_kg,
#                 "extracellular_water_volume_kg": smart_scale_data.extracellular_water_volume_kg,
#                 "intracellular_water_volume_kg": smart_scale_data.intracellular_water_volume_kg,
#                 "left_hand_fat_mass_kg": smart_scale_data.left_hand_fat_mass_kg,
#                 "left_foot_fat_mass_kg": smart_scale_data.left_foot_fat_mass_kg,
#                 "right_hand_fat_mass_kg": smart_scale_data.right_hand_fat_mass_kg,
#                 "right_foot_fat_mass_kg": smart_scale_data.right_foot_fat_mass_kg,
#                 "trunk_fat_mass_kg": smart_scale_data.trunk_fat_mass_kg,
#                 "left_hand_fat_rate_percent": smart_scale_data.left_hand_fat_rate_percent,
#                 "left_foot_fat_rate_percent": smart_scale_data.left_foot_fat_rate_percent,
#                 "right_hand_fat_rate_percent": smart_scale_data.right_hand_fat_rate_percent,
#                 "right_foot_fat_rate_percent": smart_scale_data.right_foot_fat_rate_percent,
#                 "trunk_fat_rate_percent": smart_scale_data.trunk_fat_rate_percent,
#                 "left_hand_muscle_mass_kg": smart_scale_data.left_hand_muscle_mass_kg,
#                 "left_foot_muscle_mass_kg": smart_scale_data.left_foot_muscle_mass_kg,
#                 "right_hand_muscle_mass_kg": smart_scale_data.right_hand_muscle_mass_kg,
#                 "right_foot_muscle_mass_kg": smart_scale_data.right_foot_muscle_mass_kg,
#                 "trunk_muscle_mass_kg": smart_scale_data.trunk_muscle_mass_kg,
#                 "skeletal_muscle_mass_index": smart_scale_data.skeletal_muscle_mass_index,
#                 "whr": smart_scale_data.whr,
#                 "left_hand_muscle_rate": smart_scale_data.left_hand_muscle_rate,
#                 "left_leg_muscle_rate": smart_scale_data.left_leg_muscle_rate,
#                 "right_hand_muscle_rate": smart_scale_data.right_hand_muscle_rate,
#                 "right_foot_muscle_rate": smart_scale_data.right_foot_muscle_rate,
#                 "trunk_muscle_rate": smart_scale_data.trunk_muscle_rate,
#                 "skeletal_muscle_mass_kg": smart_scale_data.skeletal_muscle_mass_kg,
#                 "health_score": smart_scale_data.physical_score
#             })

#         # Fetch physical screening data
#         physical_clinical_data = await ClinicalRecomendations.filter(
#             student__id=student_id,
#             report_type__iexact="physical screening report"
#         ).prefetch_related("student").all()

#         # Prepare physical screening report
#         physical_screening_report = {
#             "strengths": [],
#             "needs_attention": []
#         }
#         physical_screening_status = ""
#         physical_screening_summary = ""
        
#         if physical_clinical_data:
#             for clinical_data in physical_clinical_data:
#                 if clinical_data.questions_data:
#                     for item in clinical_data.questions_data:
#                         question_type = item.get("question_type", "")
#                         answers = item.get("answers", [])
#                         if question_type == "Good Outcomes":
#                             physical_screening_report["strengths"].extend(answers)
#                         elif question_type == "Areas of Concern":
#                             physical_screening_report["needs_attention"].extend(answers)
#                 if clinical_data.status and not physical_screening_status:
#                     physical_screening_status = clinical_data.status
#                 if clinical_data.summary and not physical_screening_summary:
#                     physical_screening_summary = clinical_data.summary
#         if not physical_screening_report["strengths"]:
#             physical_screening_report["strengths"] = [""]
#         if not physical_screening_report["needs_attention"]:
#             physical_screening_report["needs_attention"] = [""]

#         # Update smart scale data with physical screening report
#         data_dict["physical_screening_report"] = physical_screening_report
#         data_dict["status"] = physical_screening_status
#         data_dict["overall_summary"] = physical_screening_summary

#         # Fetch nutritional questionnaire data
#         questionnaire_data = await ClinicalRecomendations.filter(
#             student__id=student_id,
#             report_type__iexact="Questionnaire Reports"
#         ).prefetch_related("student").all()

#         # Prepare nutritional questionnaire analysis
#         nutritional_questionnaire_analysis = {
#             "strengths": [],
#             "needs_attention": []
#         }
#         common_summary = ""
#         common_status = ""
#         recommendations = ""

#         if questionnaire_data:
#             for q_data in questionnaire_data:
#                 if q_data.questions_data:
#                     for item in q_data.questions_data:
#                         question_type = item.get("question_type", "")
#                         answers = item.get("answers", [])
#                         if question_type == "Good Outcomes":
#                             nutritional_questionnaire_analysis["strengths"].extend(answers)
#                         elif question_type == "Areas of Concern":
#                             nutritional_questionnaire_analysis["needs_attention"].extend(answers)
#                 if q_data.summary and not common_summary:
#                     common_summary = q_data.summary
#                 if q_data.status and not common_status:
#                     common_status = q_data.status
#                 if q_data.common_summary:
#                     common_summary = q_data.common_summary
#                 if q_data.common_status:
#                     common_status = q_data.common_status
#                 if q_data.clinical_notes and not recommendations:
#                     recommendations = q_data.clinical_notes
#         if not nutritional_questionnaire_analysis["strengths"]:
#             nutritional_questionnaire_analysis["strengths"] = [""]
#         if not nutritional_questionnaire_analysis["needs_attention"]:
#             nutritional_questionnaire_analysis["needs_attention"] = [""]

#         # Fetch nutritional deficiency data
#         deficiency_data = await ClinicalRecomendations.filter(
#             student__id=student_id,
#             report_type__iexact="Nutrition Deficiency Report"
#         ).prefetch_related("student").all()

#         # Prepare nutritional screening analysis
#         nutritional_screening_analysis = {
#             "strengths": [],
#             "needs_attention": []
#         }

#         if deficiency_data:
#             for d_data in deficiency_data:
#                 if d_data.questions_data:
#                     for item in d_data.questions_data:
#                         question_type = item.get("question_type", "")
#                         answers = item.get("answers", [])
#                         if question_type == "Good Outcomes":
#                             nutritional_screening_analysis["strengths"].extend(answers)
#                         elif question_type == "Areas of Concern":
#                             nutritional_screening_analysis["needs_attention"].extend(answers)
#                 if d_data.summary and not common_summary:
#                     common_summary = d_data.summary
#                 if d_data.status and not common_status:
#                     common_status = d_data.status
#                 if d_data.common_summary:
#                     common_summary = d_data.common_summary
#                 if d_data.common_status:
#                     common_status = d_data.common_status
#                 if d_data.clinical_notes and not recommendations:
#                     recommendations = d_data.clinical_notes
#         if not nutritional_screening_analysis["strengths"]:
#             nutritional_screening_analysis["strengths"] = [""]
#         if not nutritional_screening_analysis["needs_attention"]:
#             nutritional_screening_analysis["needs_attention"] = [""]

#         # Prepare nutritional screening report
#         nutritional_screening_report = {
#             "nutritional_questionnaire_analysis": nutritional_questionnaire_analysis,
#             "nutritional_screening_analysis": nutritional_screening_analysis,
#             "common_summary": common_summary,
#             "common_status": common_status,
#             "recommendations": recommendations
#         }

#         # Fetch developmental and emotional data
#         developmental_data = await ClinicalFindings.filter(
#             student__id=student_id
#         ).order_by('-updated_at').prefetch_related("student").all()

#         # Prepare developmental and emotional assessment
#         developmental_emotional_assessment = {
#             "strengths": [],
#             "needs_attention": [],
#             "summary": "",
#             "status": "",
#             "recommendations": []
#         }

#         if developmental_data:
#             for d_data in developmental_data:
#                 if d_data.findings_data:
#                     if isinstance(d_data.findings_data, str):
#                         try:
#                             parsed_data = json.loads(d_data.findings_data)
#                             if isinstance(parsed_data, list):
#                                 for item in parsed_data:
#                                     if isinstance(item, dict):
#                                         findings = item.get("findings", "")
#                                         remarks = item.get("remarks", "")
#                                         if findings and remarks:
#                                             developmental_emotional_assessment["strengths"].append(f"{findings}: {remarks}")
#                                         elif findings:
#                                             developmental_emotional_assessment["strengths"].append(findings)
#                                         elif remarks:
#                                             developmental_emotional_assessment["strengths"].append(remarks)
#                                     elif isinstance(item, str):
#                                         developmental_emotional_assessment["strengths"].append(item)
#                             else:
#                                 developmental_emotional_assessment["strengths"].append(str(parsed_data))
#                         except json.JSONDecodeError:
#                             developmental_emotional_assessment["strengths"].append(d_data.findings_data)
#                     elif isinstance(d_data.findings_data, list):
#                         for item in d_data.findings_data:
#                             if isinstance(item, dict):
#                                 findings = item.get("findings", "")
#                                 remarks = item.get("remarks", "")
#                                 if findings and remarks:
#                                     developmental_emotional_assessment["strengths"].append(f"{findings}: {remarks}")
#                                 elif findings:
#                                     developmental_emotional_assessment["strengths"].append(findings)
#                                 elif remarks:
#                                     developmental_emotional_assessment["strengths"].append(remarks)
#                             elif isinstance(item, str):
#                                 developmental_emotional_assessment["strengths"].append(item)
#                 if d_data.need_attention_data:
#                     if isinstance(d_data.need_attention_data, str):
#                         try:
#                             parsed_data = json.loads(d_data.need_attention_data)
#                             if isinstance(parsed_data, list):
#                                 for item in parsed_data:
#                                     if isinstance(item, dict):
#                                         findings = item.get("findings", "")
#                                         remarks = item.get("remarks", "")
#                                         if findings and remarks:
#                                             developmental_emotional_assessment["needs_attention"].append(f"{findings}: {remarks}")
#                                         elif findings:
#                                             developmental_emotional_assessment["needs_attention"].append(findings)
#                                         elif remarks:
#                                             developmental_emotional_assessment["needs_attention"].append(remarks)
#                                     elif isinstance(item, str):
#                                         developmental_emotional_assessment["needs_attention"].append(item)
#                             else:
#                                 developmental_emotional_assessment["needs_attention"].append(str(parsed_data))
#                         except json.JSONDecodeError:
#                             developmental_emotional_assessment["needs_attention"].append(d_data.need_attention_data)
#                     elif isinstance(d_data.need_attention_data, list):
#                         for item in d_data.need_attention_data:
#                             if isinstance(item, dict):
#                                 findings = item.get("findings", "")
#                                 remarks = item.get("remarks", "")
#                                 if findings and remarks:
#                                     developmental_emotional_assessment["needs_attention"].append(f"{findings}: {remarks}")
#                                 elif findings:
#                                     developmental_emotional_assessment["needs_attention"].append(findings)
#                                 elif remarks:
#                                     developmental_emotional_assessment["needs_attention"].append(remarks)
#                             elif isinstance(item, str):
#                                 developmental_emotional_assessment["needs_attention"].append(item)
#             if developmental_data:
#                 latest_data = developmental_data[0]
#                 developmental_emotional_assessment["summary"] = latest_data.summary or ""
#                 developmental_emotional_assessment["status"] = latest_data.status or ""
#                 # developmental_emotional_assessment["recommendations"] = latest_data.clinical_notes_recommendations or ""
#                 developmental_emotional_assessment["recommendations"] = latest_data.clinical_notes_recommendations.split(",") if latest_data.clinical_notes_recommendations else []

#         if not developmental_emotional_assessment["strengths"]:
#             developmental_emotional_assessment["strengths"] = [""]
#         if not developmental_emotional_assessment["needs_attention"]:
#             developmental_emotional_assessment["needs_attention"] = [""]

#         # Fetch dental screening data (latest)
#         dental_screening = await DentalScreening.filter(student__id=student_id).order_by('-created_at').first()
#         dental_screening_report = {
#             "patient_concern": [],
#             "oral_examination": [],
#             "diagnosis": [],
#             "treatment_recommendations": [],
#             "report_summary": "",
#             "next_followup": None,
#             "examination_note": "",
#             "treatment_recommendations_note": "",
#             "status": ""
#         }
#         if dental_screening:
#             dental_screening_report.update({
#                 "patient_concern": json.loads(dental_screening.patient_concern) if dental_screening.patient_concern else [],
#                 "oral_examination": json.loads(dental_screening.oral_examination) if dental_screening.oral_examination else [],
#                 "diagnosis": json.loads(dental_screening.diagnosis) if dental_screening.diagnosis else [],
#                 "treatment_recommendations": json.loads(dental_screening.treatment_recommendations) if dental_screening.treatment_recommendations else [],
#                 "report_summary": dental_screening.report_summary or "",
#                 "next_followup": dental_screening.next_followup.isoformat() if isinstance(dental_screening.next_followup, datetime) else dental_screening.next_followup if dental_screening.next_followup else None,
#                 "examination_note": dental_screening.examination_note or "",
#                 "treatment_recommendations_note": dental_screening.treatment_recommendations_note or "",
#                 "status": dental_screening.status or ""
#             })

#         # Fetch eye screening data (latest)
#         eye_screening = await EyeScreening.filter(student__id=student_id).order_by('-created_at').first()
#         eye_screening_report = {
#             "patient_concern": [],
#             "vision_lefteye_res": [],
#             "vision_righteye_res": [],
#             "additional_find": "",
#             "report_summary": "",
#             "status": "",
#             "recommendations": [],
#             "next_followup": None
#         }
#         if eye_screening:
#             eye_screening_report.update({
#                 "patient_concern": json.loads(eye_screening.patient_concern) if eye_screening.patient_concern else [],
#                 "vision_lefteye_res": json.loads(eye_screening.vision_lefteye_res) if eye_screening.vision_lefteye_res else [],
#                 "vision_righteye_res": json.loads(eye_screening.vision_righteye_res) if eye_screening.vision_righteye_res else [],
#                 "additional_find": eye_screening.additional_find or "",
#                 "report_summary": eye_screening.report_summary or "",
#                 "status": eye_screening.status or "",
#                 "recommendations": json.loads(eye_screening.recommendations) if eye_screening.recommendations else [],
#                 "next_followup": eye_screening.next_followup.isoformat() if isinstance(eye_screening.next_followup, datetime) else eye_screening.next_followup if eye_screening.next_followup else None
#             })

#         # Fetch lab reports data
#         lab_reports_data = await ClinicalRecomendations.filter(
#             student__id=student_id,
#             report_type__iexact="Lab Reports"
#         ).prefetch_related("student").all()
#         lab_reports = {
#             "strengths": [],
#             "needs_attention": [],
#             "lab_reports_summary": "",
#             "lab_status": ""
#         }
#         if lab_reports_data:
#             for lab_data in lab_reports_data:
#                 if lab_data.questions_data:
#                     for item in lab_data.questions_data:
#                         question_type = item.get("question_type", "")
#                         answers = item.get("answers", [])
#                         if question_type == "Good Outcomes":
#                             lab_reports["strengths"].extend(answers)
#                         elif question_type == "Areas of Concern":
#                             lab_reports["needs_attention"].extend(answers)
#                 if lab_data.summary and not lab_reports["lab_reports_summary"]:
#                     lab_reports["lab_reports_summary"] = lab_data.summary
#                 if lab_data.status:
#                     lab_reports["lab_status"] = lab_data.status
#         if not lab_reports["strengths"]:
#             lab_reports["strengths"] = [""]
#         if not lab_reports["needs_attention"]:
#             lab_reports["needs_attention"] = [""]

#         # Populate student_info
#         student_info = {
#             "student_id": student.id,
#             "first_name": student.first_name,
#             "middle_name": student.middle_name,
#             "last_name": student.last_name,
#             "class": student.class_room,
#             "section": student.section
#         }

#         return JSONResponse(
#             content=StandardResponse(
#                 status=True,
#                 message="Smart scale data with detailed screening reports retrieved successfully.",
#                 data={
#                     "smart_scale_data": data_dict,
#                     "nutritional_screening_report": nutritional_screening_report,
#                     "developmental_emotional_assessment": developmental_emotional_assessment,
#                     "dental_screening_report": dental_screening_report,
#                     "eye_screening_report": eye_screening_report,
#                     "lab_reports": lab_reports,
#                     "student_info": student_info
#                 },
#                 errors={}
#             ).__dict__,
#             status_code=status.HTTP_200_OK
#         )

#     except Exception as e:
#         return JSONResponse(
#             content=StandardResponse(
#                 status=False,
#                 message="An unexpected error occurred while retrieving data.",
#                 data={},
#                 errors={"unexpected": str(e)}
#             ).__dict__,
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
        