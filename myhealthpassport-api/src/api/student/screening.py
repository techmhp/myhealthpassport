import json

from fastapi import status, Depends
from fastapi.responses import JSONResponse

from src.models.student_models import Students
from src.utils.response import StandardResponse
from src.core.manager import get_current_user

from src.models.screening_models import EyeScreening, DentalScreening

from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)


from . import router

@router.get("/students/{student_id}/eye-screening")
async def get_eye_screening_by_student(
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user=Depends(get_current_user)
):
    try:
        # Determine academic year
        if academic_year is None:
            academic_year = get_current_academic_year()

        try:
            ay_start, ay_end = parse_academic_year(academic_year)
        except ValueError as e:
            return JSONResponse(
                status_code=400,
                content={
                    "status": False,
                    "message": str(e),
                    "data": {},
                    "errors": {"academic_year": str(e)}
                }
            )

        # Build academic year filter
        year_filter = build_academic_year_filter(academic_year)

        student = await Students.get_or_none(id=student_id)
        if not student:
            return JSONResponse(
                status_code=404,
                content={
                    "status": False,
                    "message": "Student not found",
                    "data": {},
                    "errors": {"student_id": student_id}
                }
            )

        # Apply academic year filter to eye screening query
        eye_screening = await EyeScreening.filter(year_filter, student_id=student_id).order_by("-created_at").last()
        if not eye_screening:
            return JSONResponse(
                status_code=404,
                content={
                    "status": False,
                    "message": "No eye screening record found for this student",
                    "data": {},
                    "errors": {"student_id": student_id}
                }
            )

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
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
                "status": eye_screening.status,
                "recommendations": json.loads(eye_screening.recommendations),
                "next_followup": eye_screening.next_followup,
                "created_at": str(eye_screening.created_at),
                "updated_at": str(eye_screening.updated_at)
            }
        }

        json_response = JSONResponse(
            status_code=200,
            content={
                "status": True,
                "message": "Eye screening details fetched successfully",
                "data": data,
                "errors": {}
            }
        )
        json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return json_response

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": False,
                "message": "Error fetching screening details",
                "data": {},
                "errors": {"detail": str(e)}
            }
        )

@router.get("/students/{student_id}/dental-screening")
async def get_dental_screening_by_student(
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user=Depends(get_current_user)
):
    try:
        # Determine academic year
        if academic_year is None:
            academic_year = get_current_academic_year()

        try:
            ay_start, ay_end = parse_academic_year(academic_year)
        except ValueError as e:
            return JSONResponse(
                status_code=400,
                content={
                    "status": False,
                    "message": str(e),
                    "data": {},
                    "errors": {"academic_year": str(e)}
                }
            )

        # Build academic year filter
        year_filter = build_academic_year_filter(academic_year)

        student = await Students.get_or_none(id=student_id)
        if not student:
            return JSONResponse(
                status_code=404,
                content={
                    "status": False,
                    "message": "Student not found",
                    "data": {},
                    "errors": {"student_id": student_id}
                }
            )

        # Apply academic year filter to dental screening query
        dental_screening = await DentalScreening.filter(year_filter, student_id=student_id).order_by("-created_at").last()
        if not dental_screening:
            return JSONResponse(
                status_code=404,
                content={
                    "status": False,
                    "message": "No Dental screening record found for this student",
                    "data": {},
                    "errors": {"student_id": student_id}
                }
            )

        dental_resp = {
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
            "created_at": str(dental_screening.created_at),
            "updated_at": str(dental_screening.updated_at),
            "status": dental_screening.status
        }
        
        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        data = {
            "student": {
                "student_id": student.id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "middle_name": student.middle_name,
                "class": student.class_room,
                "section": student.section
            },
            "dental_screening": dental_resp
        }
        
        json_response = JSONResponse(
            status_code=200,
            content={
                "status": True,
                "message": "Dental screening details fetched successfully",
                "data": data,
                "errors": {}
            }
        )
        json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return json_response

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": False,
                "message": "Error fetching screening details",
                "data": {},
                "errors": {"detail": str(e)}
            }
        )

# @router.get("/students/{student_id}/eye-screening")
# async def get_eye_screening_by_student(student_id: int, current_user=Depends(get_current_user)):

#     try:
#         student = await Students.get_or_none(id=student_id)
#         if not student:
#             return JSONResponse(
#                 status_code=404,
#                 content={
#                     "status": False,
#                     "message": "Student not found",
#                     "data": {},
#                     "errors": {"student_id": student_id}
#                 }
#             )

#         eye_screening = await EyeScreening.filter(student_id=student_id).order_by("-created_at").last()
#         if not eye_screening:
#             return JSONResponse(
#                 status_code=404,
#                 content={
#                     "status": False,
#                     "message": "No eye screening record found for this student",
#                     "data": {},
#                     "errors": {"student_id": student_id}
#                 }
#             )

#         data = {
#             "student": {
#                 "student_id": student.id,
#                 "first_name": student.first_name,
#                 "last_name": student.last_name,
#                 "middle_name": student.middle_name,
#                 "class": student.class_room,
#                 "section": student.section
#             },
#             "eye_screening": {
#                 "es_id": eye_screening.es_id,
#                 "student_id": eye_screening.student_id,
#                 "screening_user_id": eye_screening.screening_user_id,
#                 "patient_concern": json.loads(eye_screening.patient_concern),
#                 "vision_lefteye_res": json.loads(eye_screening.vision_lefteye_res),
#                 "vision_righteye_res": json.loads(eye_screening.vision_righteye_res),
#                 "additional_find": eye_screening.additional_find,
#                 "report_summary": eye_screening.report_summary,
#                 "status":eye_screening.status,
#                 "recommendations": json.loads(eye_screening.recommendations),
#                 "next_followup": eye_screening.next_followup,
#                 "created_at": str(eye_screening.created_at),
#                 "updated_at": str(eye_screening.updated_at)
#             }
#         }

#         return JSONResponse(
#             status_code=200,
#             content={
#                 "status": True,
#                 "message": "Eye screening details fetched successfully",
#                 "data": data,
#                 "errors": {}
#             }
#         )

#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={
#                 "status": False,
#                 "message": "Error fetching screening details",
#                 "data": {},
#                 "errors": {"detail": str(e)}
#             }
#         )



# @router.get("/students/{student_id}/dental-screening")
# async def get_dental_screening_by_student(student_id: int, current_user=Depends(get_current_user)):

#     try:
#         student = await Students.get_or_none(id=student_id)
#         if not student:
#             return JSONResponse(
#                 status_code=404,
#                 content={
#                     "status": False,
#                     "message": "Student not found",
#                     "data": {},
#                     "errors": {"student_id": student_id}
#                 }
#             )

#         dental_screening = await DentalScreening.filter(student_id=student_id).order_by("-created_at").last()
#         if not dental_screening:
#             return JSONResponse(
#                 status_code=404,
#                 content={
#                     "status": False,
#                     "message": "No Dental screening record found for this student",
#                     "data": {},
#                     "errors": {"student_id": student_id}
#                 }
#             )

#         dental_resp = {
#             "ds_id": dental_screening.ds_id,
#             "student_id": dental_screening.student_id,
#             "screening_user_id": dental_screening.screening_user_id,
#             "patient_concern": json.loads(dental_screening.patient_concern),
#             "oral_examination": json.loads(dental_screening.oral_examination),
#             "examination_note": dental_screening.examination_note,
#             "diagnosis": json.loads(dental_screening.diagnosis),
#             "treatment_recommendations": json.loads(dental_screening.treatment_recommendations),
#             "report_summary": dental_screening.report_summary,
#             "next_followup": dental_screening.next_followup,
#             "treatment_recommendations_note": dental_screening.treatment_recommendations_note,
#             "created_at": str(dental_screening.created_at),
#             "updated_at": str(dental_screening.updated_at),
#             "status":dental_screening.status
#         }
#         data = {
#             "student": {
#                 "student_id": student.id,
#                 "first_name": student.first_name,
#                 "last_name": student.last_name,
#                 "middle_name": student.middle_name,
#                 "class": student.class_room,
#                 "section": student.section
#             },
#             "dental_screening": dental_resp
#         }
#         return JSONResponse(
#             status_code=200,
#             content={
#                 "status": True,
#                 "message": "Dental screening details fetched successfully",
#                 "data": data,
#                 "errors": {}
#             }
#         )

#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={
#                 "status": False,
#                 "message": "Error fetching screening details",
#                 "data": {},
#                 "errors": {"detail": str(e)}
#             }
#         )


