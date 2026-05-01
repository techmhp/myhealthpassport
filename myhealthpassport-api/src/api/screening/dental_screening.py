import json
from fastapi import Depends, APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from tortoise.exceptions import DoesNotExist
from src.utils.response import StandardResponse
from src.utils.constants import DROPDOWN_OPTIONS
from src.core.manager import get_current_user
from src.models.user_models import ScreeningTeam, ScreeningTeamRoles, AdminTeamRoles
from src.models.student_models import Students
from src.models.screening_models import DentalScreening
from src.schemas.screening_schema import ToothSelection, DentalScreeningRequest, DentalScreeningUpdateRequest, DentalScreeningResponse
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)
from . import router

# Dependency to restrict access to valid ScreeningTeamRoles
async def get_valid_screening_user(current_user: Dict = Depends(get_current_user)):
    if not isinstance(current_user, dict) or "user_role" not in current_user or current_user["user_role"] not in [role.value for role in AdminTeamRoles]:
        response = StandardResponse(
            status=False,
            message="Unauthorized: User role is not a valid Screening team role",
            errors={"detail": f"Invalid or missing user_role in user data: {current_user.get('user_role', 'missing')}"}
        )
        return JSONResponse(content=response.dict())
    return current_user

@router.get("/dental-screening-dropdown-options", response_model=StandardResponse)
async def get_dropdown_options(current_user=Depends(get_current_user)):
    allowed_roles = [
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        ScreeningTeamRoles.PHYSICAL_WELLBEING,
        ScreeningTeamRoles.DENTIST,
        ScreeningTeamRoles.EYE_SPECIALIST,
        ScreeningTeamRoles.NUTRITIONIST,
        ScreeningTeamRoles.PSYCHOLOGIST,
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to create student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    response = StandardResponse(
        status=True,
        message="Dropdown options retrieved successfully",
        data={"dropdown_options": DROPDOWN_OPTIONS}
    )
    return JSONResponse(content=response.dict())


# ===================================================================
# NEW: GET DENTAL SCREENING (with Academic Year Filter)
# ===================================================================
@router.get("/dental-screening/{student_id}", response_model=StandardResponse)
async def get_dental_screening(
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user=Depends(get_current_user)
):
    allowed_roles = [
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        ScreeningTeamRoles.DENTIST,
    ]

    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to view dental screening records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        # Validate student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            response = StandardResponse(
                status=False,
                message=f"Student with ID {student_id} not found",
                data={},
                errors={"detail": "Student does not exist"}
            )
            return JSONResponse(content=response.__dict__, status_code=status.HTTP_404_NOT_FOUND)

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

        # Fetch dental screening with academic year filter
        dental_screening = await DentalScreening.filter(
            year_filter,
            student_id=student_id
        ).first()

        # Fallback: record saved today is outside the year filter range
        if not dental_screening:
            dental_screening = await DentalScreening.filter(
                student_id=student_id
            ).first()

        if not dental_screening:
            response = StandardResponse(
                status=False,
                message=f"No dental screening found for student ID {student_id}",
                data={},
                errors={}
            )
            return JSONResponse(content=response.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        resp_data = {
            "ds_id": dental_screening.ds_id,
            "student_id": dental_screening.student_id,
            "screening_user_id": dental_screening.screening_user_id,
            "patient_concern": json.loads(dental_screening.patient_concern) if dental_screening.patient_concern else [],
            "oral_examination": json.loads(dental_screening.oral_examination) if dental_screening.oral_examination else [],
            "examination_note": dental_screening.examination_note,
            "diagnosis": json.loads(dental_screening.diagnosis) if dental_screening.diagnosis else [],
            "treatment_recommendations": json.loads(dental_screening.treatment_recommendations) if dental_screening.treatment_recommendations else [],
            "report_summary": dental_screening.report_summary,
            "next_followup": dental_screening.next_followup,
            "treatment_recommendations_note": dental_screening.treatment_recommendations_note,
            "status": dental_screening.status,
            "screening_status": dental_screening.screening_status,
            "created_at": str(dental_screening.created_at),
            "updated_at": str(dental_screening.updated_at)
        }

        response = StandardResponse(
            status=True,
            message="Dental screening retrieved successfully",
            data=resp_data  # ← Same format as original
        )
        
        json_response = JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)
        json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return json_response

    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to retrieve dental screening",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/dental-screening", response_model=StandardResponse)
async def create_dental_screening(request: DentalScreeningRequest, current_user=Depends(get_current_user)):
    allowed_roles = [
        ScreeningTeamRoles.DENTIST,
    ]

    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to create student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        # Validate student existence
        student = await Students.get_or_none(id=request.student_id)
        if not student:
            response = StandardResponse(
                status=False,
                message=f"Student with ID {request.student_id} not found",
                data={},
                errors={"detail": "Student does not exist"}
            )
            return JSONResponse(content=response.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        # Validate screening user - fall back to current user if provided ID not found
        screening_user = await ScreeningTeam.get_or_none(id=request.screening_user_id)
        if not screening_user:
            screening_user = await ScreeningTeam.get_or_none(id=current_user["user_id"])
        if not screening_user:
            response = StandardResponse(
                status=False,
                message="Screening user not found",
                data={},
                errors={"detail": f"Invalid screening_user_id: {request.screening_user_id}"}
            )
            return JSONResponse(content=response.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Convert lists to JSON strings for storage
        patient_concern_json = json.dumps(request.patient_concern)
        oral_examination_json = json.dumps([tooth.dict() for tooth in request.oral_examination])
        diagnosis_json = json.dumps(request.diagnosis)
        treatment_recommendations_json = json.dumps(request.treatment_recommendations)

        # Create the dental screening record
        dental_screening = await DentalScreening.create(
            student=student,
            screening_user=screening_user,
            patient_concern=patient_concern_json,
            oral_examination=oral_examination_json,
            examination_note=request.examination_note,
            diagnosis=diagnosis_json,
            treatment_recommendations=treatment_recommendations_json,
            report_summary=request.report_summary,
            next_followup=request.next_followup,
            treatment_recommendations_note=request.treatment_recommendations_note,
            status=request.status,
            screening_status=True,
            created_by=current_user["user_id"],
            created_user_role=current_user["user_role"],
            created_role_type=current_user["user_role"],
        )

        resp = {
            "ds_id": dental_screening.ds_id,
            "student_id": dental_screening.student_id,
            "screening_user_id": dental_screening.screening_user_id,
            "patient_concern": json.loads(dental_screening.patient_concern),
            "oral_examination": json.loads(dental_screening.oral_examination),
            "examination_note": dental_screening.examination_note,
            "diagnosis": json.loads(dental_screening.diagnosis),
            "treatment_recommendations": json.loads(dental_screening.treatment_recommendations),
            "report_summary": dental_screening.report_summary,
            "next_followup": dental_screening.next_followup,
            "treatment_recommendations_note": dental_screening.treatment_recommendations_note,
            "status": dental_screening.status,
            "screening_status": dental_screening.screening_status,
            "created_at": str(dental_screening.created_at),
            "updated_at": str(dental_screening.updated_at)
        }
        
        response = StandardResponse(
            status=True,
            message="Dental screening created successfully",
            data=resp
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)

    except DoesNotExist as e:
        response = StandardResponse(
            status=False,
            message="Failed to create dental screening",
            errors={"detail": f"Invalid student_id or screening_user_id: {str(e)}"}
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to create dental screening",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict())

@router.put("/dental-screening/{ds_id}", response_model=StandardResponse)
async def update_dental_screening(ds_id: int, request: DentalScreeningUpdateRequest, current_user=Depends(get_current_user)):
    allowed_roles = [
        ScreeningTeamRoles.DENTIST,
    ]

    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to create student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        # Fetch the existing dental screening record
        dental_screening = await DentalScreening.get(ds_id=ds_id)

        # Convert lists to JSON strings for storage
        patient_concern_json = json.dumps(request.patient_concern)
        oral_examination_json = json.dumps([tooth.dict() for tooth in request.oral_examination])
        diagnosis_json = json.dumps(request.diagnosis)
        treatment_recommendations_json = json.dumps(request.treatment_recommendations)

        # Update the dental screening record
        dental_screening.patient_concern = patient_concern_json
        dental_screening.oral_examination = oral_examination_json
        dental_screening.examination_note = request.examination_note
        dental_screening.diagnosis = diagnosis_json
        dental_screening.treatment_recommendations = treatment_recommendations_json
        dental_screening.report_summary = request.report_summary
        dental_screening.next_followup = request.next_followup
        dental_screening.treatment_recommendations_note = request.treatment_recommendations_note
        dental_screening.status = request.status
        dental_screening.screening_status = True
        dental_screening.updated_by = current_user["user_id"]
        dental_screening.updated_role_type = current_user["role_type"]
        dental_screening.updated_role = current_user["user_role"]

        await dental_screening.save()

        resp = {
            "ds_id": dental_screening.ds_id,
            "student_id": dental_screening.student_id,
            "screening_user_id": dental_screening.screening_user_id,
            "patient_concern": json.loads(dental_screening.patient_concern),
            "oral_examination": json.loads(dental_screening.oral_examination),
            "examination_note": dental_screening.examination_note,
            "diagnosis": json.loads(dental_screening.diagnosis),
            "treatment_recommendations": json.loads(dental_screening.treatment_recommendations),
            "report_summary": dental_screening.report_summary,
            "next_followup": dental_screening.next_followup,
            "treatment_recommendations_note": dental_screening.treatment_recommendations_note,
            "status": dental_screening.status,
            "screening_status": dental_screening.screening_status,
            "created_at": str(dental_screening.created_at),
            "updated_at": str(dental_screening.updated_at)
        }
        
        response = StandardResponse(
            status=True,
            message="Dental screening updated successfully",
            data=resp
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)

    except DoesNotExist:
        response = StandardResponse(
            status=False,
            message=f"Dental screening with ID {ds_id} not found",
            errors={"not_found": f"Dental screening with ID {ds_id} does not exist"}
        )
        return JSONResponse(content=response.dict())
    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to update dental screening",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict())
