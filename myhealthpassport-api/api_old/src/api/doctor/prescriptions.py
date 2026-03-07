import json
from fastapi import Depends, APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from tortoise.exceptions import DoesNotExist
from src.utils.response import StandardResponse
from src.utils.constants import DROPDOWN_OPTIONS
from src.core.manager import get_current_user
from src.models.user_models import ConsultantTeam, AdminTeamRoles, ConsultantRoles, ParentRoles
from src.models.student_models import Students
from src.models.consultation_models import DentalReport, EyeReport, PsychologistReport, PediatricianReport 
from src.schemas.screening_schema import ToothSelection, DentalPrescriptionRequest, DentalScreeningUpdateRequest, CreatePediatricianPresciption, DentalScreeningResponse, CreateEyePresciption, VisionResult,CreatePsychologistPresciption
from datetime import date
from . import router

# Dependency to restrict access to valid ScreeningTeamRoles
async def get_valid_consultant_user(current_user: Dict = Depends(get_current_user)):
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
        ConsultantRoles.DENTIST,
        ConsultantRoles.EYE_SPECIALIST,
        ConsultantRoles.NUTRITIONIST,
        ConsultantRoles.PSYCHOLOGIST,
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

@router.post("/dental-prescription", response_model=StandardResponse)
async def create_dental_screening(request: DentalPrescriptionRequest, current_user=Depends(get_current_user)):
    allowed_roles = [
        ConsultantRoles.DENTIST,
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
        consultant_user = await ConsultantTeam.get(id=request.consultant_user_id)
        # Convert lists to JSON strings for storage
        patient_concern_json = json.dumps(request.patient_concern)
        oral_examination_json = json.dumps([tooth.dict() for tooth in request.oral_examination])
        diagnosis_json = json.dumps(request.diagnosis)
        treatment_recommendations_json = json.dumps(request.treatment_recommendations)

        # Create the dental screening record
        dental_screening = await DentalReport.create(
            student=student,
            consultant_user=consultant_user,
            patient_concern=patient_concern_json,
            oral_examination=oral_examination_json,
            diagnosis=diagnosis_json,
            treatment_recommendations=treatment_recommendations_json,
            next_followup=request.next_followup,
            created_by=current_user["user_id"],
            created_user_role=current_user["user_role"],
            created_role_type=current_user["user_role"],
        )

        resp = {
            "dr_id": dental_screening.dr_id,
            "student_id": dental_screening.student_id,
            "clinic_name": consultant_user.clinic_name if consultant_user else None,
            "consultant_full_name": f"{consultant_user.first_name} {consultant_user.last_name}" if consultant_user else None,
            "consultant_user_id": dental_screening.consultant_user_id,
            "patient_concern": json.loads(dental_screening.patient_concern),
            "oral_examination": json.loads(dental_screening.oral_examination),
            "diagnosis": json.loads(dental_screening.diagnosis),
            "treatment_recommendations": json.loads(dental_screening.treatment_recommendations),
            "next_followup": dental_screening.next_followup,
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
    
@router.get("/dental-prescriptions/{student_id}", response_model=StandardResponse)
async def get_dental_screening(student_id: int, current_user=Depends(get_current_user)):
    allowed_roles = [
        ConsultantRoles.DENTIST,
        ParentRoles.PARENT,
    ]

    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to fetch student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        # Fetch the dental screening record
        # dental_screening = await DentalReport.filter(student_id=student_id).order_by("-created_at").first()
        dental_screening = await DentalReport.filter(student_id=student_id).prefetch_related("student", "consultant_user").order_by("-created_at").first()
        
        if not dental_screening:
            response = StandardResponse(
                status=False,
                message=f"dental screening with student ID {student_id} not found",
                data={},
                errors={"not_found": f"dental screening with student ID {student_id} does not exist"}
            )
            return JSONResponse(content=response.__dict__, status_code=status.HTTP_404_NOT_FOUND)


        student = dental_screening.student
        consultant_user = dental_screening.consultant_user

        dob = student.dob
        age = date.today().year - dob.year - ((date.today().month, date.today().day) < (dob.month, dob.day))
        
        consultant_user = await ConsultantTeam.get(id=dental_screening.consultant_user_id)
        resp = {
            "dr_id": dental_screening.dr_id,
            "student_id": dental_screening.student_id,
            "full_name": f"{student.first_name} {student.middle_name} {student.last_name}".strip(),
            "age": age,
            "gender": student.gender,
            "clinic_name": consultant_user.clinic_name if consultant_user else None,
            "education" : consultant_user.education if consultant_user else None,
            "specialty": consultant_user.specialty if consultant_user else None,
            "consultant_user_id": dental_screening.consultant_user_id,
            "consultant_full_name": f"{consultant_user.first_name} {consultant_user.last_name}" if consultant_user else None,
            "patient_concern": json.loads(dental_screening.patient_concern),
            "oral_examination": json.loads(dental_screening.oral_examination),
            "diagnosis": json.loads(dental_screening.diagnosis),
            "treatment_recommendations": json.loads(dental_screening.treatment_recommendations),
            "next_followup": dental_screening.next_followup,
            "created_at": str(dental_screening.created_at),
            "updated_at": str(dental_screening.updated_at)
        }
        
        response = StandardResponse(
            status=True,
            message="Dental screening retrieved successfully",
            data=resp
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)

    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to retrieve dental screening",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict())

@router.post("/eye-prescription", response_model=StandardResponse)
async def create_eye_screening(request: CreateEyePresciption, current_user=Depends(get_current_user)):
    allowed_roles = [
        ConsultantRoles.EYE_SPECIALIST,
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
        consultant_user = await ConsultantTeam.get(id=request.consultant_user_id)
        # Convert lists to JSON strings for storage
        patient_concern_json = json.dumps(request.patient_concern)
        vision_lefteye_json = json.dumps(request.vision_lefteye_res.dict())
        vision_righteye_json = json.dumps(request.vision_righteye_res.dict())
        additional_findings_json = json.dumps(request.additional_findings)
        treatment_recommendations_json = json.dumps(request.treatment_recommendations)

        # Create the dental screening record
        eye_screening = await EyeReport.create(
            student=student,
            consultant_user=consultant_user,
            patient_concern=patient_concern_json,
            vision_lefteye_res=vision_lefteye_json,
            vision_righteye_res=vision_righteye_json,
            additional_findings=additional_findings_json,
            treatment_recommendations=treatment_recommendations_json,
            next_followup=request.next_followup,
            created_by=current_user["user_id"],
            created_user_role=current_user["user_role"],
            created_role_type=current_user["user_role"],
        )

        resp = {
            "er_id": eye_screening.er_id,
            "student_id": eye_screening.student_id,
            "clinic_name": consultant_user.clinic_name if consultant_user else None,
            "consultant_full_name": f"{consultant_user.first_name} {consultant_user.last_name}" if consultant_user else None,
            "consultant_user_id": eye_screening.consultant_user_id,
            "patient_concern": json.loads(eye_screening.patient_concern),
            "vision_lefteye_res": json.loads(eye_screening.vision_lefteye_res),
            "vision_righteye_res": json.loads(eye_screening.vision_righteye_res),
            "additional_findings": json.loads(eye_screening.additional_findings),
            "treatment_recommendations": json.loads(eye_screening.treatment_recommendations),
            "next_followup": eye_screening.next_followup,
            "created_at": str(eye_screening.created_at),
            "updated_at": str(eye_screening.updated_at)
        }
        
        response = StandardResponse(
            status=True,
            message="eye screening created successfully",
            data=resp
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)

    except DoesNotExist as e:
        response = StandardResponse(
            status=False,
            message="Failed to create eye screening",
            errors={"detail": f"Invalid student_id or screening_user_id: {str(e)}"}
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to create eye screening",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict())
    
@router.get("/eye-prescriptions/{student_id}", response_model=StandardResponse)
async def get_eye_screening(student_id: int, current_user=Depends(get_current_user)):
    allowed_roles = [
        ConsultantRoles.EYE_SPECIALIST,
        ParentRoles.PARENT,
    ]

    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to fetch student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        # Fetch the dental screening record
        # eye_screening = await EyeReport.filter(student_id=student_id).order_by("-created_at").first()
        eye_screening = await EyeReport.filter(student_id=student_id).prefetch_related("student", "consultant_user").order_by("-created_at").first()
        
        if not eye_screening:
            response = StandardResponse(
                status=False,
                message=f"eye screening with student ID {student_id} not found",
                data={},
                errors={"not_found": f"eye screening with student ID {student_id} does not exist"}
            )
            return JSONResponse(content=response.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        student = eye_screening.student
        consultant_user = eye_screening.consultant_user

        dob = student.dob
        age = date.today().year - dob.year - ((date.today().month, date.today().day) < (dob.month, dob.day))
        
        consultant_user = await ConsultantTeam.get(id=eye_screening.consultant_user_id)
        resp = {
            "er_id": eye_screening.er_id,
            "student_id": eye_screening.student_id,
            "full_name": f"{student.first_name} {student.middle_name} {student.last_name}".strip(),
            "age": age,
            "gender": student.gender,
            "clinic_name": consultant_user.clinic_name if consultant_user else None,
            "education" : consultant_user.education if consultant_user else None,
            "specialty": consultant_user.specialty if consultant_user else None,
            "consultant_user_id": eye_screening.consultant_user_id,
            "consultant_full_name": f"{consultant_user.first_name} {consultant_user.last_name}" if consultant_user else None,
            "patient_concern": json.loads(eye_screening.patient_concern),
            "vision_lefteye_res": json.loads(eye_screening.vision_lefteye_res),
            "vision_righteye_res": json.loads(eye_screening.vision_righteye_res),
            "additional_findings": json.loads(eye_screening.additional_findings),
            "treatment_recommendations": json.loads(eye_screening.treatment_recommendations),
            "next_followup": eye_screening.next_followup,
            "created_at": str(eye_screening.created_at),
            "updated_at": str(eye_screening.updated_at)
        }
        
        response = StandardResponse(
            status=True,
            message="eye screening retrieved successfully",
            data=resp
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)

    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to retrieve eye screening",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict())
    
def safe_json_loads(value: str):
    if not value:
        return []
    return json.loads(value)

@router.post("/psychologist-prescription", response_model=StandardResponse)
async def create_psychologist_screening(
    request: CreatePsychologistPresciption,
    current_user=Depends(get_current_user)
):
    allowed_roles = [
        ConsultantRoles.PSYCHOLOGIST,
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
        student = await Students.get(id=request.student_id)
        consultant_user = await ConsultantTeam.get(id=request.consultant_user_id)

        # Convert lists to JSON strings for storage
        patient_concern_json = json.dumps(request.patient_concern)
        findings_json = json.dumps(request.findings)
        treatment_recommendations_json = json.dumps(request.treatment_recommendations)

        psychologist_screening = await PsychologistReport.create(
            student=student,
            consultant_user=consultant_user,
            patient_concern=patient_concern_json,
            findings=findings_json,
            treatment_recommendations=treatment_recommendations_json,
            next_followup=request.next_followup,
            created_by=current_user["user_id"],
            created_user_role=current_user["user_role"],
            created_role_type=current_user["user_role"],
        )

        resp = {
            "pr_id": psychologist_screening.pr_id,
            "student_id": psychologist_screening.student_id,
            "clinic_name": consultant_user.clinic_name if consultant_user else None,
            "consultant_full_name": f"{consultant_user.first_name} {consultant_user.last_name}" if consultant_user else None,
            "consultant_user_id": psychologist_screening.consultant_user_id,
            "patient_concern": safe_json_loads(psychologist_screening.patient_concern),
            "findings": safe_json_loads(psychologist_screening.findings),
            "treatment_recommendations": safe_json_loads(psychologist_screening.treatment_recommendations),
            "next_followup": psychologist_screening.next_followup,
            "created_at": str(psychologist_screening.created_at),
            "updated_at": str(psychologist_screening.updated_at)
        }

        response = StandardResponse(
            status=True,
            message="Psychology screening created successfully",
            data=resp
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)

    except DoesNotExist as e:
        response = StandardResponse(
            status=False,
            message="Failed to create Psychology screening",
            errors={"detail": f"Invalid student_id or screening_user_id: {str(e)}"}
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to create Psychology screening",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict())
    
@router.get("/psychologist-prescriptions/{student_id}", response_model=StandardResponse)
async def get_psychology_screening(student_id: int, current_user=Depends(get_current_user)):
    allowed_roles = [
        ConsultantRoles.PSYCHOLOGIST,
        ParentRoles.PARENT,
    ]

    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to fetch student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        # Fetch the dental screening record
        # psychologist_screening = await PsychologistReport.filter(student_id=student_id).order_by("-created_at").first()
        psychologist_screening = await PsychologistReport.filter(student_id=student_id).prefetch_related("student", "consultant_user").order_by("-created_at").first()
        
        if not psychologist_screening:
            response = StandardResponse(
                status=False,
                message=f"Psychology screening with student ID {student_id} not found",
                data={},
                errors={"not_found": f"Psychology screening with student ID {student_id} does not exist"}
            )
            return JSONResponse(content=response.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        student = psychologist_screening.student
        consultant_user = psychologist_screening.consultant_user

        dob = student.dob
        age = date.today().year - dob.year - ((date.today().month, date.today().day) < (dob.month, dob.day))
        
        consultant_user = await ConsultantTeam.get(id=psychologist_screening.consultant_user_id)
        resp = {
            "pr_id": psychologist_screening.pr_id,
            "student_id": psychologist_screening.student_id,
            "full_name": f"{student.first_name} {student.middle_name} {student.last_name}".strip(),
            "age": age,
            "gender": student.gender,
            "clinic_name": consultant_user.clinic_name if consultant_user else None,
            "education" : consultant_user.education if consultant_user else None,
            "specialty": consultant_user.specialty if consultant_user else None,
            "consultant_user_id": psychologist_screening.consultant_user_id,
            "consultant_full_name": f"{consultant_user.first_name} {consultant_user.last_name}" if consultant_user else None,
            "patient_concern": json.loads(psychologist_screening.patient_concern),
            "findings": json.loads(psychologist_screening.findings),
            "treatment_recommendations": json.loads(psychologist_screening.treatment_recommendations),
            "next_followup": psychologist_screening.next_followup,
            "created_at": str(psychologist_screening.created_at),
            "updated_at": str(psychologist_screening.updated_at)
        }
        
        response = StandardResponse(
            status=True,
            message="Psychology screening retrieved successfully",
            data=resp
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)


    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to retrieve Psychology screening",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict())

@router.post("/pediatrician-prescription", response_model=StandardResponse)
async def create_pediatrician_screening(
    request: CreatePediatricianPresciption,
    current_user=Depends(get_current_user)
):
    allowed_roles = [
        ConsultantRoles.PEDIATRICIAN,
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
        student = await Students.get(id=request.student_id)
        consultant_user = await ConsultantTeam.get(id=request.consultant_user_id)

        # Convert lists to JSON strings for storage
        patient_concern_json = json.dumps(request.patient_concern)
        findings_json = json.dumps(request.findings)
        treatment_recommendations_json = json.dumps(request.treatment_recommendations)

        Pediatrician_screening = await PediatricianReport.create(
            student=student,
            consultant_user=consultant_user,
            patient_concern=patient_concern_json,
            findings=findings_json,
            treatment_recommendations=treatment_recommendations_json,
            next_followup=request.next_followup,
            created_by=current_user["user_id"],
            created_user_role=current_user["user_role"],
            created_role_type=current_user["user_role"],
        )

        resp = {
            "pdr_id": Pediatrician_screening.pdr_id,
            "student_id": Pediatrician_screening.student_id,
            "clinic_name": consultant_user.clinic_name if consultant_user else None,
            "consultant_full_name": f"{consultant_user.first_name} {consultant_user.last_name}" if consultant_user else None,
            "consultant_user_id": Pediatrician_screening.consultant_user_id,
            "patient_concern": safe_json_loads(Pediatrician_screening.patient_concern),
            "findings": safe_json_loads(Pediatrician_screening.findings),
            "treatment_recommendations": safe_json_loads(Pediatrician_screening.treatment_recommendations),
            "next_followup": Pediatrician_screening.next_followup,
            "created_at": str(Pediatrician_screening.created_at),
            "updated_at": str(Pediatrician_screening.updated_at)
        }

        response = StandardResponse(
            status=True,
            message="Pediatrician screening created successfully",
            data=resp
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)

    except DoesNotExist as e:
        response = StandardResponse(
            status=False,
            message="Failed to create Pediatrician screening",
            errors={"detail": f"Invalid student_id or screening_user_id: {str(e)}"}
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to create Pediatrician screening",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict())
    
@router.get("/pediatrician-prescriptions/{student_id}", response_model=StandardResponse)
async def get_pediatrician_screening(student_id: int, current_user=Depends(get_current_user)):
    allowed_roles = [
        ConsultantRoles.PEDIATRICIAN,
        ParentRoles.PARENT,
    ]

    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to fetch student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        # Fetch the dental screening record
        # pediatrician_screening = await PediatricianReport.filter(student_id=student_id).order_by("-created_at").first()
        pediatrician_screening = await PediatricianReport.filter(student_id=student_id).prefetch_related("student", "consultant_user").order_by("-created_at").first()
        
        # if not pediatrician_screening:
        #     raise DoesNotExist()
        if not pediatrician_screening:
            response = StandardResponse(
                status=False,
                message=f"Pediatrician screening with student ID {student_id} not found",
                data={},
                errors={"not_found": f"Pediatrician screening with student ID {student_id} does not exist"}
            )
            return JSONResponse(content=response.__dict__, status_code=status.HTTP_404_NOT_FOUND)


        student = pediatrician_screening.student
        consultant_user = pediatrician_screening.consultant_user

        dob = student.dob
        age = date.today().year - dob.year - ((date.today().month, date.today().day) < (dob.month, dob.day))
        
        consultant_user = await ConsultantTeam.get(id=pediatrician_screening.consultant_user_id)
        resp = {
            "pdr_id": pediatrician_screening.pdr_id,
            "student_id": pediatrician_screening.student_id,
            "full_name": f"{student.first_name} {student.middle_name} {student.last_name}".strip(),
            "age": age,
            "gender": student.gender,
            "education" : consultant_user.education if consultant_user else None,
            "specialty": consultant_user.specialty if consultant_user else None,
            "clinic_name": consultant_user.clinic_name if consultant_user else None,
            "consultant_user_id": pediatrician_screening.consultant_user_id,
            "consultant_full_name": f"{consultant_user.first_name} {consultant_user.last_name}" if consultant_user else None,
            "patient_concern": json.loads(pediatrician_screening.patient_concern),
            "findings": json.loads(pediatrician_screening.findings),
            "treatment_recommendations": json.loads(pediatrician_screening.treatment_recommendations),
            "next_followup": pediatrician_screening.next_followup,
            "created_at": str(pediatrician_screening.created_at),
            "updated_at": str(pediatrician_screening.updated_at)
        }
        
        response = StandardResponse(
            status=True,
            message="pediatrician screening retrieved successfully",
            data=resp
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)


    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to retrieve pediatrician screening",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict())
