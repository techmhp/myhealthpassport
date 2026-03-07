# from fastapi import APIRouter, Depends, Form
# from fastapi.responses import JSONResponse
# from typing import Dict
# import json

# from src.models.screening_models import EyeScreening
# from src.models.student_models import Students
# from src.models.user_models import ScreeningTeam, ScreeningTeamRoles
# from src.schemas.screening_schema import EyeScreeningRequest
# from src.core.manager import get_current_user
# from src.api.screening import router

# from fastapi import status

# from src.utils.response import StandardResponse


# @router.post("/eye-screening")
# async def create_eye_screening(request: EyeScreeningRequest, current_user=Depends(get_current_user)):
#     allowed_roles = [
#         ScreeningTeamRoles.EYE_SPECIALIST,
#     ]

#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role} is not allowed to create student records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     try:
#         student = await Students.get_or_none(id=request.student_id)
#         if not student:
#             return JSONResponse(
#                 status_code=404,
#                 content={
#                     "status": False,
#                     "message": "Student not found",
#                     "data": {},
#                     "errors": {"student_id": request.student_id}
#                 }
#             )

#         screening_user = await ScreeningTeam.get_or_none(id=request.screening_user_id)
#         if not screening_user:
#             return JSONResponse(
#                 status_code=404,
#                 content={
#                     "status": False,
#                     "message": "Screening user not found",
#                     "data": {},
#                     "errors": {"screening_user_id": request.screening_user_id}
#                 }
#             )

#         eye_screening = await EyeScreening.create(
#             student=student,
#             screening_user=screening_user,
#             patient_concern=json.dumps(request.patient_concern),
#             vision_lefteye_res=json.dumps(request.vision_lefteye_res.dict()),
#             vision_righteye_res=json.dumps(request.vision_righteye_res.dict()),
#             additional_find=request.additional_find,
#             report_summary=request.report_summary,
#             recommendations=json.dumps(request.recommendations),
#             next_followup=request.next_followup
#         )

#         return JSONResponse(
#             status_code=201,
#             content={
#                 "status": True,
#                 "message": "Eye screening created successfully",
#                 "data": {
#                     "es_id": eye_screening.es_id,
#                     "student_id": eye_screening.student.id,
#                     "screening_user_id": eye_screening.screening_user.id,
#                     "patient_concern": json.loads(eye_screening.patient_concern),
#                     "vision_lefteye_res": json.loads(eye_screening.vision_lefteye_res),
#                     "vision_righteye_res": json.loads(eye_screening.vision_righteye_res),
#                     "additional_find": eye_screening.additional_find,
#                     "report_summary": eye_screening.report_summary,
#                     "recommendations": json.loads(eye_screening.recommendations),
#                     "next_followup": eye_screening.next_followup,
#                     "created_at": str(eye_screening.created_at),
#                     "updated_at": str(eye_screening.updated_at)
#                 }
#             }
#         )

#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={
#                 "status": False,
#                 "message": "Failed to create eye screening",
#                 "data": {},
#                 "errors": {"detail": str(e)}
#             }
#         )


# @router.get("/eye-screening/{es_id}")
# async def get_eye_screening(es_id: int, current_user=Depends(get_current_user)):
#     allowed_roles = [
#         ScreeningTeamRoles.EYE_SPECIALIST,
#     ]

#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role} is not allowed to create student records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     eye_screening = await EyeScreening.get_or_none(es_id=es_id)
#     student = await Students.get_or_none(id=eye_screening.student_id)

#     data = {
#         "student": {
#             "student_id": student.id,
#             "first_name": student.first_name,
#             "last_name": student.last_name,
#             "middle_name": student.middle_name,
#             "class": student.class_room,
#             "section": student.section
#         },
#         "eye_screening": {
#             "es_id": eye_screening.es_id,
#             "student_id": eye_screening.student_id,
#             "screening_user_id": eye_screening.screening_user_id,
#             "patient_concern": json.loads(eye_screening.patient_concern),
#             "vision_lefteye_res": json.loads(eye_screening.vision_lefteye_res),
#             "vision_righteye_res": json.loads(eye_screening.vision_righteye_res),
#             "additional_find": eye_screening.additional_find,
#             "report_summary": eye_screening.report_summary,
#             "recommendations": json.loads(eye_screening.recommendations),
#             "next_followup": eye_screening.next_followup,
#             "created_at": str(eye_screening.created_at),
#             "updated_at": str(eye_screening.updated_at)
#         }
#     }

#     return JSONResponse(
#         status_code=200,
#         content={
#             "status": True,
#             "message": "Eye screening details fetched successfully",
#             "data": data,
#             "errors": {}
#         }
#     )



# @router.put("/eye-screening/{es_id}")
# async def update_eye_screening(es_id: int, request: EyeScreeningRequest, current_user=Depends(get_current_user)):

#     allowed_roles = [
#         ScreeningTeamRoles.EYE_SPECIALIST,
#     ]

#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role} is not allowed to create student records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     try:
#         eye_screening = await EyeScreening.get_or_none(es_id=es_id)
#         if not eye_screening:
#             return JSONResponse(
#                 status_code=404,
#                 content={
#                     "status": False,
#                     "message": "Eye screening record not found",
#                     "data": {},
#                     "errors": {"es_id": es_id}
#                 }
#             )

#         student = await Students.get_or_none(id=request.student_id)
#         if not student:
#             return JSONResponse(
#                 status_code=404,
#                 content={
#                     "status": False,
#                     "message": "Student not found",
#                     "data": {},
#                     "errors": {"student_id": request.student_id}
#                 }
#             )

#         screening_user = await ScreeningTeam.get_or_none(id=request.screening_user_id)
#         if not screening_user:
#             return JSONResponse(
#                 status_code=404,
#                 content={
#                     "status": False,
#                     "message": "Screening user not found",
#                     "data": {},
#                     "errors": {"screening_user_id": request.screening_user_id}
#                 }
#             )

#         eye_screening.student = student
#         eye_screening.screening_user = screening_user
#         eye_screening.patient_concern = json.dumps(request.patient_concern)
#         eye_screening.vision_lefteye_res = json.dumps(request.vision_lefteye_res.dict())
#         eye_screening.vision_righteye_res = json.dumps(request.vision_righteye_res.dict())
#         eye_screening.additional_find = request.additional_find
#         eye_screening.report_summary = request.report_summary
#         eye_screening.recommendations = json.dumps(request.recommendations)
#         eye_screening.next_followup = request.next_followup
#         eye_screening.screening_status = True
#         await eye_screening.save()

#         return JSONResponse(
#             status_code=200,
#             content={
#                 "status": True,
#                 "message": "Eye screening updated successfully",
#                 "data": {
#                     "es_id": eye_screening.es_id,
#                     "student_id": eye_screening.student.id,
#                     "screening_user_id": eye_screening.screening_user.id,
#                     "patient_concern": json.loads(eye_screening.patient_concern),
#                     "vision_lefteye_res": json.loads(eye_screening.vision_lefteye_res),
#                     "vision_righteye_res": json.loads(eye_screening.vision_righteye_res),
#                     "additional_find": eye_screening.additional_find,
#                     "report_summary": eye_screening.report_summary,
#                     "recommendations": json.loads(eye_screening.recommendations),
#                     "next_followup": eye_screening.next_followup,
#                     "created_at": str(eye_screening.created_at),
#                     "updated_at": str(eye_screening.updated_at)
#                 }
#             }
#         )

#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={
#                 "status": False,
#                 "message": "Failed to update eye screening",
#                 "data": {},
#                 "errors": {"detail": str(e)}
#             }
#         )

import json
import logging
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from tortoise import fields, Model
from tortoise.exceptions import DoesNotExist
from src.utils.response import StandardResponse
from src.models.screening_models import EyeScreening
from src.models.student_models import Students
from src.models.user_models import ScreeningTeam, ScreeningTeamRoles, ConsultantRoles
from src.schemas.screening_schema import EyeScreeningRequest, EyeScreeningResponse, VisionResult
from src.core.manager import get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from . import router

@router.post("/eye-screening", response_model=StandardResponse)
async def create_eye_screening(request: EyeScreeningRequest, current_user=Depends(get_current_user)):
    allowed_roles = [ScreeningTeamRoles.EYE_SPECIALIST, ConsultantRoles.EYE_SPECIALIST]
    creator_role = current_user["user_role"].upper()
    if creator_role not in allowed_roles:
        logger.warning(f"Unauthorized role {creator_role} attempted to create eye screening")
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to create eye screening records.",
            data={},
            errors={"role": "not_allowed"}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)


    student = await Students.get_or_none(id=request.student_id)
    if not student:
        logger.warning(f"Student with ID {request.student_id} not found")
        resp = StandardResponse(
            status=False,
            message="Student not found",
            data={},
            errors={"student_id": request.student_id}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Validate screening user
    screening_user = await ScreeningTeam.get_or_none(id=request.screening_user_id)
    if not screening_user:
        logger.warning(f"Screening user with ID {request.screening_user_id} not found")
        resp = StandardResponse(
            status=False,
            message="Screening user not found",
            data={},
            errors={"screening_user_id": request.screening_user_id}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Create the eye screening record
    eye_screening = await EyeScreening.create(
        student=student,
        screening_user=screening_user,
        patient_concern=json.dumps(request.patient_concern),
        vision_lefteye_res=json.dumps(request.vision_lefteye_res.dict()),
        vision_righteye_res=json.dumps(request.vision_righteye_res.dict()),
        additional_find=request.additional_find,
        report_summary=request.report_summary,
        recommendations=json.dumps(request.recommendations),
        next_followup=request.next_followup,
        status=request.status,
        screening_status=request.screening_status if hasattr(request, 'screening_status') else True,
        created_by=current_user["user_id"],
        created_user_role=current_user["user_role"],
        created_role_type=current_user["role_type"]
    )

    resp = {
        "es_id": eye_screening.es_id,
        "student_id": eye_screening.student.id,
        "screening_user_id": eye_screening.screening_user.id,
        "patient_concern": json.loads(eye_screening.patient_concern),
        "vision_lefteye_res": json.loads(eye_screening.vision_lefteye_res),
        "vision_righteye_res": json.loads(eye_screening.vision_righteye_res),
        "additional_find": eye_screening.additional_find,
        "report_summary": eye_screening.report_summary,
        "recommendations": json.loads(eye_screening.recommendations),
        "next_followup": eye_screening.next_followup,
        "status": eye_screening.status,
        "screening_status": eye_screening.screening_status,
        "created_at": str(eye_screening.created_at),
        "updated_at": str(eye_screening.updated_at)
    }

    logger.info(f"Eye screening created successfully: es_id={eye_screening.es_id}")
    response = StandardResponse(
        status=True,
        message="Eye screening created successfully",
        data=resp
    )
    return JSONResponse(content=response.__dict__, status_code=status.HTTP_201_CREATED)


@router.get("/eye-screening/{es_id}", response_model=StandardResponse)
async def get_eye_screening(es_id: int, current_user=Depends(get_current_user)):
    allowed_roles = [ScreeningTeamRoles.EYE_SPECIALIST]
    creator_role = current_user["user_role"].upper()
    if creator_role not in allowed_roles:
        logger.warning(f"Unauthorized role {creator_role} attempted to access eye screening")
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to access eye screening records.",
            data={},
            errors={"role": "not_allowed"}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        eye_screening = await EyeScreening.get_or_none(es_id=es_id)
        if not eye_screening:
            logger.warning(f"Eye screening with ID {es_id} not found")
            resp = StandardResponse(
                status=False,
                message=f"Eye screening with ID {es_id} not found",
                data={},
                errors={"es_id": es_id}
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        student = await Students.get_or_none(id=eye_screening.student_id)
        if not student:
            logger.warning(f"Student with ID {eye_screening.student_id} not found")
            resp = StandardResponse(
                status=False,
                message="Student not found",
                data={},
                errors={"student_id": eye_screening.student_id}
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        data = {
            "student": {
                "student_id": student.id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "middle_name": student.middle_name,
                "class": student.class_room,
                "section": student.section
            },
            "eye_screening": {
                "es_id": eye_screening.es_id,
                "student_id": eye_screening.student_id,
                "screening_user_id": eye_screening.screening_user_id,
                "patient_concern": json.loads(eye_screening.patient_concern),
                "vision_lefteye_res": json.loads(eye_screening.vision_lefteye_res),
                "vision_righteye_res": json.loads(eye_screening.vision_righteye_res),
                "additional_find": eye_screening.additional_find,
                "report_summary": eye_screening.report_summary,
                "recommendations": json.loads(eye_screening.recommendations),
                "next_followup": eye_screening.next_followup,
                "status": eye_screening.status,
                "screening_status": eye_screening.screening_status,
                "created_at": str(eye_screening.created_at),
                "updated_at": str(eye_screening.updated_at)
            }
        }

        logger.info(f"Eye screening retrieved successfully: es_id={es_id}")
        response = StandardResponse(
            status=True,
            message="Eye screening details fetched successfully",
            data=data
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Unexpected error during eye screening retrieval: {str(e)}")
        resp = StandardResponse(
            status=False,
            message="Failed to retrieve eye screening",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.put("/eye-screening/{es_id}", response_model=StandardResponse)
async def update_eye_screening(es_id: int, request: EyeScreeningRequest, current_user=Depends(get_current_user)):
    allowed_roles = [ScreeningTeamRoles.EYE_SPECIALIST]
    creator_role = current_user["user_role"].upper()
    if creator_role not in allowed_roles:
        logger.warning(f"Unauthorized role {creator_role} attempted to update eye screening")
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to update eye screening records.",
            data={},
            errors={"role": "not_allowed"}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        eye_screening = await EyeScreening.get_or_none(es_id=es_id)
        if not eye_screening:
            logger.warning(f"Eye screening with ID {es_id} not found")
            resp = StandardResponse(
                status=False,
                message=f"Eye screening with ID {es_id} not found",
                data={},
                errors={"es_id": es_id}
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        student = await Students.get_or_none(id=request.student_id)
        if not student:
            logger.warning(f"Student with ID {request.student_id} not found")
            resp = StandardResponse(
                status=False,
                message="Student not found",
                data={},
                errors={"student_id": request.student_id}
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        screening_user = await ScreeningTeam.get_or_none(id=request.screening_user_id)
        if not screening_user:
            logger.warning(f"Screening user with ID {request.screening_user_id} not found")
            resp = StandardResponse(
                status=False,
                message="Screening user not found",
                data={},
                errors={"screening_user_id": request.screening_user_id}
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        eye_screening.student = student
        eye_screening.screening_user = screening_user
        eye_screening.patient_concern = json.dumps(request.patient_concern)
        eye_screening.vision_lefteye_res = json.dumps(request.vision_lefteye_res.dict())
        eye_screening.vision_righteye_res = json.dumps(request.vision_righteye_res.dict())
        eye_screening.additional_find = request.additional_find
        eye_screening.report_summary = request.report_summary
        eye_screening.recommendations = json.dumps(request.recommendations)
        eye_screening.next_followup = request.next_followup
        eye_screening.status = request.status
        eye_screening.screening_status = request.screening_status if hasattr(request, 'screening_status') else True
        eye_screening.updated_by = current_user["user_id"]
        eye_screening.updated_user_role = current_user["user_role"]
        eye_screening.updated_role_type = current_user["role_type"]
        await eye_screening.save()

        resp = {
            "es_id": eye_screening.es_id,
            "student_id": eye_screening.student.id,
            "screening_user_id": eye_screening.screening_user.id,
            "patient_concern": json.loads(eye_screening.patient_concern),
            "vision_lefteye_res": json.loads(eye_screening.vision_lefteye_res),
            "vision_righteye_res": json.loads(eye_screening.vision_righteye_res),
            "additional_find": eye_screening.additional_find,
            "report_summary": eye_screening.report_summary,
            "recommendations": json.loads(eye_screening.recommendations),
            "next_followup": eye_screening.next_followup,
            "status": eye_screening.status,
            "screening_status": eye_screening.screening_status,
            "created_at": str(eye_screening.created_at),
            "updated_at": str(eye_screening.updated_at)
        }

        logger.info(f"Eye screening updated successfully: es_id={es_id}")
        response = StandardResponse(
            status=True,
            message="Eye screening updated successfully",
            data=resp
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Unexpected error during eye screening update: {str(e)}")
        resp = StandardResponse(
            status=False,
            message="Failed to update eye screening",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    