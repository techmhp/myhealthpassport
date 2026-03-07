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
        # Validate student and screening user existence
        student = await Students.get(id=request.student_id)
        screening_user = await ScreeningTeam.get(id=request.screening_user_id)

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

##not using this
# @router.get("/dental-screening/{ds_id}", response_model=StandardResponse)
# async def get_dental_screening(ds_id: int, current_user=Depends(get_current_user)):
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
        # Fetch the dental screening record
        dental_screening = await DentalScreening.get(ds_id=ds_id)
        
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
            "created_at": str(dental_screening.created_at),
            "updated_at": str(dental_screening.updated_at)
        }
        
        response = StandardResponse(
            status=True,
            message="Dental screening retrieved successfully",
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
            message="Failed to retrieve dental screening",
            errors={"detail": str(e)}
        )

        return JSONResponse(content=response.dict())