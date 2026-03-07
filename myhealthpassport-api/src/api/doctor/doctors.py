from tortoise.expressions import Q
from typing import Optional, Any, List
from datetime import datetime, date
from fastapi import Depends, HTTPException, Form, Query, status, UploadFile, File,Path  
import json
from passlib.context import CryptContext
from fastapi.responses import JSONResponse
from tortoise.exceptions import DoesNotExist
from src.models.consultation_models import Consultations,DentalReport, EyeReport, PsychologistReport,PediatricianReport
from src.core.manager import get_current_user
from src.models.user_models import ConsultantTeam, Parents
from src.models.user_models import AdminTeamRoles,ConsultantRoles, ParentRoles
from src.schemas.doctor_schema import DoctorCreateRequest, DoctorUpdateRequest, DoctorListResponse
from src.api.user.schema import ExpertUserUpdateSchema, ExpertUserCreateSchema
from src.core.file_manager import save_base64_image, save_uploaded_file, get_new_url
from src.api.doctor import router
from tortoise.expressions import Q
from src.utils.response import StandardResponse
from src.models.student_models import ParentChildren, Students
from src.models.screening_models import DentalScreening, EyeScreening, BehaviouralScreening
import base64
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
DOCTOR_IMAGES_DIR = "uploads/doctor_images"


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# @router.get("/screening/{student_id}/case-history", response_model=StandardResponse)
# async def get_student_case_history(
#     student_id: int,
#     current_user=Depends(get_current_user)
# ):
#     try:
#         # Verify student exists
#         student = await Students.get(id=student_id)
#         full_name = " ".join(filter(None, [student.first_name, student.middle_name, student.last_name]))

#         # Role → Model mapping
#         role_to_config = {
#             ConsultantRoles.DENTIST: {
#                 "model": DentalReport,
#                 "label": "dental",
#                 "pk_field": "dr_id",
#                 "field_map": {
#                     "report_summary": "diagnosis",
#                     "next_followup": "next_followup",
#                     "status": None
#                 }
#             },
#             ConsultantRoles.EYE_SPECIALIST: {
#                 "model": EyeReport,
#                 "label": "eye",
#                 "pk_field": "er_id",
#                 "field_map": {
#                     "report_summary": "additional_findings",
#                     "next_followup": "next_followup",
#                     "status": None
#                 }
#             },
#             ConsultantRoles.PSYCHOLOGIST: {
#                 "model": PsychologistReport,
#                 "label": "behavioral",
#                 "pk_field": "pr_id",
#                 "field_map": {
#                     "report_summary": "findings",
#                     "next_followup": "next_followup",
#                     "status": None
#                 }
#             },
#             ConsultantRoles.PEDIATRICIAN: {
#                 "model": PediatricianReport,
#                 "label": "pediatric",
#                 "pk_field": "pdr_id",
#                 "field_map": {
#                     "report_summary": "findings",
#                     "next_followup": "next_followup",
#                     "status": None
#                 }
#             }
#         }

#         user_role = current_user["user_role"]
#         case_history = {}

#         def build_history_entry(rpt, config, student_id, full_name, student_aadhaar):
#             """Helper to build consistent history entry with JSON parsing"""
#             report_summary_field = config["field_map"].get("report_summary")
#             report_summary = getattr(rpt, report_summary_field, None) if report_summary_field else None
#             if isinstance(report_summary, str):
#                 try:
#                     report_summary = json.loads(report_summary)
#                 except json.JSONDecodeError:
#                     pass

#             next_followup_field = config["field_map"].get("next_followup")
#             next_followup = getattr(rpt, next_followup_field, None) if next_followup_field else None
#             if isinstance(next_followup, str):
#                 try:
#                     next_followup = json.loads(next_followup)
#                 except json.JSONDecodeError:
#                     pass
#             elif next_followup and hasattr(next_followup, 'isoformat'):
#                 next_followup = str(next_followup)

#             status_field = config["field_map"].get("status")
#             status = getattr(rpt, status_field, None) if status_field else None

#             return {
#                 "report_id": getattr(rpt, config["pk_field"], None),
#                 "date": str(rpt.created_at.date()),
#                 "student_id": student_id,
#                 "student_name": full_name,
#                 "aadhaar_number": student_aadhaar,
#                 "report_summary": report_summary,
#                 "next_followup": next_followup,
#                 "status": status,
#                 "role": getattr(rpt, "created_user_role", None)
#             }

#         # 🔹 Super Admin → fetch all screenings and include all labels
#         if user_role == AdminTeamRoles.SUPER_ADMIN:
#             for _, config in role_to_config.items():
#                 reports = await config["model"].filter(
#                     student_id=student_id,
#                     is_deleted=False
#                 ).order_by("-created_at")
#                 print(f"DEBUG: {config['model'].__name__} records fetched: {len(reports)}")
#                 history = [build_history_entry(rpt, config, student.id, full_name, student.aadhaar_no) for rpt in reports]
#                 case_history[config["label"]] = history  # Include all labels (dental, eye, etc.)

#         # 🔹 Normal Consultant → fetch only their own screening, no label key
#         elif user_role in role_to_config:
#             config = role_to_config[user_role]
#             reports = await config["model"].filter(
#                 student_id=student_id,
#                 is_deleted=False
#             ).order_by("-created_at")
#             print(f"DEBUG: {config['model'].__name__} records fetched: {len(reports)}")
#             case_history = [build_history_entry(rpt, config, student.id, full_name, student.aadhaar_no) for rpt in reports]  # Direct list, no label

#         else:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message=f"{user_role} is not allowed to view case history",
#                     data={},
#                     errors={}
#                 ).dict(),
#                 status_code=status.HTTP_403_FORBIDDEN
#             )

#         # Check if case_history is empty
#         if not case_history:
#             response = StandardResponse(
#                 status=False,
#                 message="No case history found for this student",
#                 data={
#                     "student_id": student.id,
#                     "student_name": full_name,
#                     "aadhaar_number": student.aadhaar_no,
#                     "case_history": case_history
#                 },
#                 errors={}
#             )
#             return JSONResponse(content=response.dict(), status_code=status.HTTP_200_OK)

#         response = StandardResponse(
#             status=True,
#             message="Case history retrieved successfully",
#             data={
#                 "student_id": student.id,
#                 "student_name": full_name,
#                 "aadhaar_number": student.aadhaar_no,
#                 "case_history": case_history
#             }
#         )
#         return JSONResponse(content=response.dict(), status_code=status.HTTP_200_OK)

#     except DoesNotExist:
#         response = StandardResponse(
#             status=False,
#             message="Student not found",
#             errors={"not_found": f"Student with ID {student_id} does not exist"}
#         )
#         return JSONResponse(content=response.dict(), status_code=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         response = StandardResponse(
#             status=False,
#             message="Failed to fetch case history",
#             errors={"detail": str(e)}
#         )
#         return JSONResponse(content=response.dict(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

# @router.get("/screening/{student_id}/case-history", response_model=StandardResponse)
# async def get_student_case_history(
#     student_id: int,
#     current_user=Depends(get_current_user)
# ):
#     try:
#         # Verify student exists
#         student = await Students.get(id=student_id)
#         full_name = " ".join(filter(None, [student.first_name, student.middle_name, student.last_name]))

#         # Role → Model mapping
#         role_to_config = {
#             ConsultantRoles.DENTIST: {
#                 "model": DentalReport,
#                 "label": "dental",
#                 "pk_field": "dr_id",
#                 "field_map": {
#                     "report_summary": "diagnosis",
#                     "next_followup": "next_followup",
#                     "status": None
#                 }
#             },
#             ConsultantRoles.EYE_SPECIALIST: {
#                 "model": EyeReport,
#                 "label": "eye",
#                 "pk_field": "er_id",
#                 "field_map": {
#                     "report_summary": "additional_findings",
#                     "next_followup": "next_followup",
#                     "status": None
#                 }
#             },
#             ConsultantRoles.PSYCHOLOGIST: {
#                 "model": PsychologistReport,
#                 "label": "behavioral",
#                 "pk_field": "pr_id",
#                 "field_map": {
#                     "report_summary": "findings",
#                     "next_followup": "next_followup",
#                     "status": None
#                 }
#             },
#             ConsultantRoles.PEDIATRICIAN: {
#                 "model": PediatricianReport,
#                 "label": "pediatric",
#                 "pk_field": "pdr_id",
#                 "field_map": {
#                     "report_summary": "findings",
#                     "next_followup": "next_followup",
#                     "status": None
#                 }
#             }
#         }

#         user_role = current_user["user_role"]
#         case_history = {}

#         def build_history_entry(rpt, config, student_id, full_name, student_aadhaar):
#             """Helper to build consistent history entry with JSON parsing"""
#             report_summary_field = config["field_map"].get("report_summary")
#             report_summary = getattr(rpt, report_summary_field, None) if report_summary_field else None
#             if isinstance(report_summary, str):
#                 try:
#                     report_summary = json.loads(report_summary)
#                 except json.JSONDecodeError:
#                     pass

#             next_followup_field = config["field_map"].get("next_followup")
#             next_followup = getattr(rpt, next_followup_field, None) if next_followup_field else None
#             if isinstance(next_followup, str):
#                 try:
#                     next_followup = json.loads(next_followup)
#                 except json.JSONDecodeError:
#                     pass
#             elif next_followup and hasattr(next_followup, 'isoformat'):
#                 next_followup = str(next_followup)

#             status_field = config["field_map"].get("status")
#             status = getattr(rpt, status_field, None) if status_field else None

#             return {
#                 "report_id": getattr(rpt, config["pk_field"], None),
#                 "date": str(rpt.created_at.date()),
#                 "student_id": student_id,
#                 "student_name": full_name,
#                 "aadhaar_number": student_aadhaar,
#                 "report_summary": report_summary,
#                 "next_followup": next_followup,
#                 "status": status,
#                 "role": getattr(rpt, "created_user_role", None)
#             }

#         # 🔹 Super Admin → fetch all screenings and include all labels
#         if user_role == AdminTeamRoles.SUPER_ADMIN:
#             for _, config in role_to_config.items():
#                 reports = await config["model"].filter(
#                     student_id=student_id,
#                     is_deleted=False
#                 ).order_by("-created_at")
#                 print(f"DEBUG: {config['model'].__name__} records fetched: {len(reports)}")
#                 history = [build_history_entry(rpt, config, student.id, full_name, student.aadhaar_no) for rpt in reports]
#                 case_history[config["label"]] = history  # Include all labels, even if empty

#         # 🔹 Normal Consultant → fetch only their own screening, include only their label
#         elif user_role in role_to_config:
#             config = role_to_config[user_role]
#             reports = await config["model"].filter(
#                 student_id=student_id,
#                 is_deleted=False
#             ).order_by("-created_at")
#             print(f"DEBUG: {config['model'].__name__} records fetched: {len(reports)}")
#             history = [build_history_entry(rpt, config, student.id, full_name, student.aadhaar_no) for rpt in reports]
#             case_history[config["label"]] = history  # Include only the consultant's label

#         else:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message=f"{user_role} is not allowed to view case history",
#                     data={},
#                     errors={}
#                 ).dict(),
#                 status_code=status.HTTP_403_FORBIDDEN
#             )

#         # Check if case_history is empty
#         if not case_history or all(not history for history in case_history.values()):
#             response = StandardResponse(
#                 status=False,
#                 message="No case history found for this student",
#                 data={
#                     "student_id": student.id,
#                     "student_name": full_name,
#                     "aadhaar_number": student.aadhaar_no,
#                     "case_history": case_history
#                 },
#                 errors={}
#             )
#             return JSONResponse(content=response.dict(), status_code=status.HTTP_200_OK)

#         response = StandardResponse(
#             status=True,
#             message="Case history retrieved successfully",
#             data={
#                 "student_id": student.id,
#                 "student_name": full_name,
#                 "aadhaar_number": student.aadhaar_no,
#                 "case_history": case_history
#             }
#         )
#         return JSONResponse(content=response.dict(), status_code=status.HTTP_200_OK)

#     except DoesNotExist:
#         response = StandardResponse(
#             status=False,
#             message="Student not found",
#             errors={"not_found": f"Student with ID {student_id} does not exist"}
#         )
#         return JSONResponse(content=response.dict(), status_code=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         response = StandardResponse(
#             status=False,
#             message="Failed to fetch case history",
#             errors={"detail": str(e)}
#         )
#         return JSONResponse(content=response.dict(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

# @router.get("/screening/{student_id}/detailed-report", response_model=StandardResponse)
# async def get_student_detailed_report(
#     student_id: int,
#     report_id: Optional[int] = Query(None, description="Specific report ID (ds_id / es_id / bs_id)"),
#     current_user=Depends(get_current_user)
# ):
#     try:
#         # Verify student exists
#         await Students.get(id=student_id)

#         user_role = current_user["user_role"]

#         # Role → ScreeningType mapping
#         role_to_config = {
#             ConsultantRoles.DENTIST: {
#                 "model": DentalScreening,
#                 "label": "dental",
#                 "pk_field": "ds_id",   # 👈 use correct PK
#                 "fields": lambda rpt: {
#                     "student_id": rpt.student_id,
#                     "screening_user_id": rpt.screening_user_id,
#                     "patient_concern": json.loads(rpt.patient_concern),
#                     "oral_examination": json.loads(rpt.oral_examination),
#                     "examination_note": rpt.examination_note,
#                     "diagnosis": json.loads(rpt.diagnosis),
#                     "treatment_recommendations": json.loads(rpt.treatment_recommendations),
#                     "treatment_recommendations_note": rpt.treatment_recommendations_note,
#                     "report_summary": rpt.report_summary,
#                     "next_followup": rpt.next_followup,
#                     "status": rpt.status,
#                     "created_at": str(rpt.created_at),
#                     "updated_at": str(rpt.updated_at),
#                 }
#             },
#             ConsultantRoles.EYE_SPECIALIST: {
#                 "model": EyeScreening,
#                 "label": "eye",
#                 "pk_field": "es_id",   # 👈 use correct PK
#                 "fields": lambda rpt: {
#                     "student_id": rpt.student_id,
#                     "screening_user_id": rpt.screening_user_id,
#                     "patient_concern": json.loads(rpt.patient_concern),
#                     "report_summary": rpt.report_summary,
#                     "next_followup": rpt.next_followup,
#                     "status": rpt.status,
#                     "created_at": str(rpt.created_at),
#                     "updated_at": str(rpt.updated_at),
#                 }
#             },
#             ConsultantRoles.PSYCHOLOGIST: {
#                 "model": BehaviouralScreening,
#                 "label": "behavorial",
#                 "pk_field": "bs_id",   # 👈 use correct PK
#                 "fields": lambda rpt: {
#                     "student_id": rpt.student_id,
#                     "next_followup": rpt.next_followup,
#                     "status": rpt.screening_status,
#                     "created_at": str(rpt.created_at),
#                     "updated_at": str(rpt.updated_at),
#                 }
#             },
#         }

#         detailed_reports = {}

#         # 🔹 Super Admin → fetch all (latest or specific report if report_id is provided)
#         if user_role == AdminTeamRoles.SUPER_ADMIN:
#             for role, config in role_to_config.items():
#                 query = config["model"].filter(student_id=student_id)
#                 if report_id:
#                     query = query.filter(**{config["pk_field"]: report_id})
#                 rpt = await query.order_by("-created_at").first()
#                 if rpt:
#                     detailed_reports[config["label"]] = config["fields"](rpt)

#         # 🔹 Normal Consultant → fetch only their own screening type
#         elif user_role in role_to_config:
#             config = role_to_config[user_role]
#             query = config["model"].filter(student_id=student_id)
#             if report_id:
#                 query = query.filter(**{config["pk_field"]: report_id})
#             rpt = await query.order_by("-created_at").first()
#             if not rpt:
#                 return JSONResponse(
#                     content=StandardResponse(
#                         status=False,
#                         message=f"No {config['label']} screening found for this student",
#                         errors={"not_found": f"Student ID {student_id} has no {config['label']} screenings"}
#                     ).dict(),
#                     status_code=404
#                 )
#             detailed_reports[config["label"]] = config["fields"](rpt)

#         else:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message=f"{user_role} is not allowed to view detailed reports",
#                     data={},
#                     errors={}
#                 ).dict(),
#                 status_code=403
#             )

#         response = StandardResponse(
#             status=True,
#             message="Detailed report(s) retrieved successfully",
#             data={"detailed_reports": detailed_reports}
#         )
#         return JSONResponse(content=response.dict(), status_code=200)

#     except DoesNotExist:
#         response = StandardResponse(
#             status=False,
#             message="Student not found",
#             errors={"not_found": f"Student with ID {student_id} does not exist"}
#         )
#         return JSONResponse(content=response.dict(), status_code=404)
#     except Exception as e:
#         response = StandardResponse(
#             status=False,
#             message="Failed to fetch detailed report",
#             errors={"detail": str(e)}
#         )
#         return JSONResponse(content=response.dict(), status_code=500)

# Add these imports at the top
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ===================================================================
# MODIFIED: GET STUDENT CASE HISTORY (with Academic Year Filter)
# ===================================================================
@router.get("/screening/{student_id}/case-history", response_model=StandardResponse)
async def get_student_case_history(
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
                content=StandardResponse(
                    status=False,
                    message=str(e),
                    data={},
                    errors={"academic_year": str(e)}
                ).dict(),
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Build academic year filter
        year_filter = build_academic_year_filter(academic_year)

        # Verify student exists
        student = await Students.get(id=student_id)
        full_name = " ".join(filter(None, [student.first_name, student.middle_name, student.last_name]))

        # Role → Model mapping
        role_to_config = {
            ConsultantRoles.DENTIST: {
                "model": DentalReport,
                "label": "dental",
                "pk_field": "dr_id",
                "field_map": {
                    "report_summary": "diagnosis",
                    "next_followup": "next_followup",
                    "status": None
                }
            },
            ConsultantRoles.EYE_SPECIALIST: {
                "model": EyeReport,
                "label": "eye",
                "pk_field": "er_id",
                "field_map": {
                    "report_summary": "additional_findings",
                    "next_followup": "next_followup",
                    "status": None
                }
            },
            ConsultantRoles.PSYCHOLOGIST: {
                "model": PsychologistReport,
                "label": "behavioral",
                "pk_field": "pr_id",
                "field_map": {
                    "report_summary": "findings",
                    "next_followup": "next_followup",
                    "status": None
                }
            },
            ConsultantRoles.PEDIATRICIAN: {
                "model": PediatricianReport,
                "label": "pediatric",
                "pk_field": "pdr_id",
                "field_map": {
                    "report_summary": "findings",
                    "next_followup": "next_followup",
                    "status": None
                }
            }
        }

        user_role = current_user["user_role"]
        case_history = {}

        def build_history_entry(rpt, config, student_id, full_name, student_aadhaar):
            """Helper to build consistent history entry with JSON parsing"""
            report_summary_field = config["field_map"].get("report_summary")
            report_summary = getattr(rpt, report_summary_field, None) if report_summary_field else None
            if isinstance(report_summary, str):
                try:
                    report_summary = json.loads(report_summary)
                except json.JSONDecodeError:
                    pass

            next_followup_field = config["field_map"].get("next_followup")
            next_followup = getattr(rpt, next_followup_field, None) if next_followup_field else None
            if isinstance(next_followup, str):
                try:
                    next_followup = json.loads(next_followup)
                except json.JSONDecodeError:
                    pass
            elif next_followup and hasattr(next_followup, 'isoformat'):
                next_followup = str(next_followup)

            status_field = config["field_map"].get("status")
            status = getattr(rpt, status_field, None) if status_field else None

            return {
                "report_id": getattr(rpt, config["pk_field"], None),
                "date": str(rpt.created_at.date()),
                "student_id": student_id,
                "student_name": full_name,
                "aadhaar_number": student_aadhaar,
                "report_summary": report_summary,
                "next_followup": next_followup,
                "status": status,
                "role": getattr(rpt, "created_user_role", None)
            }

        # 🔹 Super Admin → fetch all screenings and include all labels
        if user_role == AdminTeamRoles.SUPER_ADMIN:
            for _, config in role_to_config.items():
                reports = await config["model"].filter(
                    year_filter & Q(student_id=student_id, is_deleted=False)
                ).order_by("-created_at")
                print(f"DEBUG: {config['model'].__name__} records fetched: {len(reports)}")
                history = [build_history_entry(rpt, config, student.id, full_name, student.aadhaar_no) for rpt in reports]
                case_history[config["label"]] = history  # ✅ Include all labels (dental, eye, etc.)

        # 🔹 Normal Consultant → fetch only their own screening, no label key (direct list)
        elif user_role in role_to_config:
            config = role_to_config[user_role]
            reports = await config["model"].filter(
                year_filter & Q(student_id=student_id, is_deleted=False)
            ).order_by("-created_at")
            print(f"DEBUG: {config['model'].__name__} records fetched: {len(reports)}")
            case_history = [build_history_entry(rpt, config, student.id, full_name, student.aadhaar_no) for rpt in reports]  # ✅ Direct list, no label

        else:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message=f"{user_role} is not allowed to view case history",
                    data={},
                    errors={}
                ).dict(),
                status_code=status.HTTP_403_FORBIDDEN
            )

        # Check if case_history is empty
        if not case_history:
            response = StandardResponse(
                status=False,
                message="No case history found for this student",
                data={
                    "student_id": student.id,
                    "student_name": full_name,
                    "aadhaar_number": student.aadhaar_no,
                    "case_history": case_history
                },
                errors={}
            )
            json_response = JSONResponse(content=response.dict(), status_code=status.HTTP_200_OK)
            json_response.headers["X-Academic-Year"] = academic_year
            return json_response

        response = StandardResponse(
            status=True,
            message="Case history retrieved successfully",
            data={
                "student_id": student.id,
                "student_name": full_name,
                "aadhaar_number": student.aadhaar_no,
                "case_history": case_history
            }
        )
        json_response = JSONResponse(content=response.dict(), status_code=status.HTTP_200_OK)
        json_response.headers["X-Academic-Year"] = academic_year
        return json_response

    except DoesNotExist:
        response = StandardResponse(
            status=False,
            message="Student not found",
            errors={"not_found": f"Student with ID {student_id} does not exist"}
        )
        return JSONResponse(content=response.dict(), status_code=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to fetch case history",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ===================================================================
# MODIFIED: GET STUDENT DETAILED REPORT (with Academic Year Filter)
# ===================================================================
@router.get("/screening/{student_id}/detailed-report", response_model=StandardResponse)
async def get_student_detailed_report(
    student_id: int,
    report_id: Optional[int] = Query(None, description="Specific report ID (ds_id / es_id / bs_id)"),
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
                content=StandardResponse(
                    status=False,
                    message=str(e),
                    data={},
                    errors={"academic_year": str(e)}
                ).dict(),
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Build academic year filter
        year_filter = build_academic_year_filter(academic_year)

        # Verify student exists
        await Students.get(id=student_id)

        user_role = current_user["user_role"]

        # Role → ScreeningType mapping
        role_to_config = {
            ConsultantRoles.DENTIST: {
                "model": DentalScreening,
                "label": "dental",
                "pk_field": "ds_id",
                "fields": lambda rpt: {
                    "student_id": rpt.student_id,
                    "screening_user_id": rpt.screening_user_id,
                    "patient_concern": json.loads(rpt.patient_concern),
                    "oral_examination": json.loads(rpt.oral_examination),
                    "examination_note": rpt.examination_note,
                    "diagnosis": json.loads(rpt.diagnosis),
                    "treatment_recommendations": json.loads(rpt.treatment_recommendations),
                    "treatment_recommendations_note": rpt.treatment_recommendations_note,
                    "report_summary": rpt.report_summary,
                    "next_followup": rpt.next_followup,
                    "status": rpt.status,
                    "created_at": str(rpt.created_at),
                    "updated_at": str(rpt.updated_at),
                }
            },
            ConsultantRoles.EYE_SPECIALIST: {
                "model": EyeScreening,
                "label": "eye",
                "pk_field": "es_id",
                "fields": lambda rpt: {
                    "student_id": rpt.student_id,
                    "screening_user_id": rpt.screening_user_id,
                    "patient_concern": json.loads(rpt.patient_concern),
                    "report_summary": rpt.report_summary,
                    "next_followup": rpt.next_followup,
                    "status": rpt.status,
                    "created_at": str(rpt.created_at),
                    "updated_at": str(rpt.updated_at),
                }
            },
            ConsultantRoles.PSYCHOLOGIST: {
                "model": BehaviouralScreening,
                "label": "behavorial",
                "pk_field": "bs_id",
                "fields": lambda rpt: {
                    "student_id": rpt.student_id,
                    "next_followup": rpt.next_followup,
                    "status": rpt.screening_status,
                    "created_at": str(rpt.created_at),
                    "updated_at": str(rpt.updated_at),
                }
            },
        }

        detailed_reports = {}

        # 🔹 Super Admin → fetch all with academic year filter
        if user_role == AdminTeamRoles.SUPER_ADMIN:
            for role, config in role_to_config.items():
                query = config["model"].filter(year_filter, student_id=student_id)
                if report_id:
                    query = query.filter(**{config["pk_field"]: report_id})
                rpt = await query.order_by("-created_at").first()
                if rpt:
                    detailed_reports[config["label"]] = config["fields"](rpt)

        # 🔹 Normal Consultant → fetch only their own screening with academic year filter
        elif user_role in role_to_config:
            config = role_to_config[user_role]
            query = config["model"].filter(year_filter, student_id=student_id)
            if report_id:
                query = query.filter(**{config["pk_field"]: report_id})
            rpt = await query.order_by("-created_at").first()
            if not rpt:
                return JSONResponse(
                    content=StandardResponse(
                        status=False,
                        message=f"No {config['label']} screening found for this student",
                        errors={"not_found": f"Student ID {student_id} has no {config['label']} screenings"}
                    ).dict(),
                    status_code=404
                )
            detailed_reports[config["label"]] = config["fields"](rpt)

        else:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message=f"{user_role} is not allowed to view detailed reports",
                    data={},
                    errors={}
                ).dict(),
                status_code=403
            )

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        response = StandardResponse(
            status=True,
            message="Detailed report(s) retrieved successfully",
            data={"detailed_reports": detailed_reports}
        )
        json_response = JSONResponse(content=response.dict(), status_code=200)
        json_response.headers["X-Academic-Year"] = academic_year
        return json_response

    except DoesNotExist:
        response = StandardResponse(
            status=False,
            message="Student not found",
            errors={"not_found": f"Student with ID {student_id} does not exist"}
        )
        return JSONResponse(content=response.dict(), status_code=404)
    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to fetch detailed report",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict(), status_code=500)

# get-experts / list-experts
@router.get("/experts", summary="List all experts", response_model=StandardResponse)
async def list_all_experts(
    current_user: dict = Depends(get_current_user),
):
    allowed_roles = [
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        ParentRoles.PARENT,
        AdminTeamRoles.HEALTH_BUDDY
    ]

    if current_user["user_role"] not in allowed_roles:
        return StandardResponse(
            status=False,
            message="You are not authorized to access this resource",
            data={},
            errors={"detail": "Unauthorized"}
        )

    # Fetch all experts
    experts = await ConsultantTeam.all()

    results = []
    for expert in experts:
        image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""
        results.append({
            "expert_id": expert.id,
            "first_name": expert.first_name,
            "last_name": expert.last_name,
            "middle_name": expert.middle_name,
            "clinic_name":expert.clinic_name,
            "education": expert.education,
            "specialty": expert.specialty,
            "experience": expert.experience,
            "location": expert.location,
            "state": expert.state,
            "country": expert.country,
            "pincode": expert.pincode,
            "user_role": expert.user_role,
            "role_type": expert.role_type,
            "phone": expert.phone,
            "email": expert.email,
            "dob": str(expert.dob) if expert.dob else None,
            "gender": expert.gender,
            "address_line_1": expert.address_line_1,
            "address_line_2": expert.address_line_2,
            "landmark": expert.landmark,
            "street_name": expert.street_name,
            "country_calling_code": expert.country_calling_code,
            "username": expert.username,
            "availability": expert.availability,
            "profile_image_url": image_url,
            "is_deleted": expert.is_deleted,
            "status": getattr(expert, "status", True),
        })

    return StandardResponse(
        status=True,
        message="Experts fetched successfully",
        data={"experts": results},
        errors={},
    )
    
@router.put("/update-expert/{expert_id}", summary="Update expert details", response_model=StandardResponse)
async def update_expert(
    expert_id: int,
    expert_payload: ExpertUserUpdateSchema,
    current_user: dict = Depends(get_current_user),
):
    """
    Update an expert's profile.
    Only SUPER_ADMIN can update.
    Accepts optional fields; unchanged fields remain as-is.
    Profile image may be a large base64 string with or without the
    'data:image/...;base64,' prefix.
    """
    try:
        # --- Role check -----------------------------------------------------
        try:
            user_role_enum = AdminTeamRoles(current_user["user_role"])
            if user_role_enum != AdminTeamRoles.SUPER_ADMIN:
                return StandardResponse(
                    status=False,
                    message="Only SUPER_ADMIN can update experts",
                    data={},
                    errors={},
                    status_code=status.HTTP_403_FORBIDDEN
                )
        except ValueError:
            return StandardResponse(
                status=False,
                message="Invalid user role",
                data={},
                errors={},
                status_code=status.HTTP_403_FORBIDDEN
            )
        # --- Fetch current expert -------------------------------------------
        expert = await ConsultantTeam.filter(id=expert_id, is_deleted=False).first()
        if not expert:
            return StandardResponse(
                status=False,
                message="Expert not found",
                data={},
                errors={},
                status_code=status.HTTP_404_NOT_FOUND
            )
        # --- Unique phone/email checks --------------------------------------
        if expert_payload.phone and expert_payload.phone != expert.phone:
            if await ConsultantTeam.filter(phone=expert_payload.phone).exclude(id=expert_id).exists():
                return StandardResponse(
                    status=False,
                    message="Phone number already in use",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        if expert_payload.email and expert_payload.email != expert.email:
            if await ConsultantTeam.filter(email=expert_payload.email).exclude(id=expert_id).exists():
                return StandardResponse(
                    status=False,
                    message="Email already in use",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        # --- Profile image (large base64) -----------------------------------
        profile_image_store_path = expert.profile_image  # default: keep old
        if expert_payload.profile_image:
            try:
                image_data = expert_payload.profile_image
                # Strip the "data:image/png;base64," prefix if present
                if image_data.startswith("data:image"):
                    image_data = image_data.split(",", 1)[1]
                # Validate the base64 string (this can be very large)
                base64.b64decode(image_data, validate=True)
                # Save file to disk/cloud and get the key/path
                profile_image_store_path = await save_base64_image(
                    base64_string=image_data,
                    destination_folder="uploads/profile_images/consultant_team/",
                    user_role=current_user.get("user_role"),
                    role_type=current_user.get("role_type"),
                    return_key_only=True,
                )
                if not profile_image_store_path:
                    profile_image_store_path = expert.profile_image
            except Exception as e:
                return StandardResponse(
                    status=False,
                    message=f"Invalid base64 profile image: {str(e)}",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        # --- Update simple fields -------------------------------------------
        # Iterate over schema fields dynamically to avoid repetition
        for field, value in expert_payload.model_dump(exclude_unset=True).items():
            if field == "profile_image":  # handled separately
                continue
            setattr(expert, field, value)
        # Update audit info
        expert.profile_image = profile_image_store_path or ""
        expert.updated_by = current_user["user_id"]
        expert.updated_user_role = current_user["user_role"]
        expert.updated_role_type = current_user["role_type"]
        expert.updated_at = datetime.utcnow()
        
        if expert_payload.available_time_slots:
            sorted_slots = []
            for day_entry in expert_payload.available_time_slots:
                # Convert Pydantic object (DayAvailabilities) to dict if necessary
                if hasattr(day_entry, "dict"):
                    day_entry = day_entry.dict()
                # Sort the slots by start time
                if "slots" in day_entry:
                    day_entry["slots"] = sorted(
                        day_entry["slots"],
                        key=lambda x: datetime.strptime(x["start"], "%H:%M")
                    )
                sorted_slots.append(day_entry)
            expert.available_time_slots = sorted_slots

        await expert.save()
        # --- Prepare response ------------------------------------------------
        image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""
        response_data = {
            "expert_id": expert.id,
            "first_name": expert.first_name,
            "last_name": expert.last_name,
            "middle_name": expert.middle_name,
            "education": expert.education,
            "specialty": expert.specialty,
            "experience": expert.experience,
            "location": expert.location,
            "state": expert.state,
            "country": expert.country,
            "pincode": expert.pincode,
            "phone": expert.phone,
            "email": expert.email,
            "dob": str(expert.dob) if expert.dob else None,
            "gender": expert.gender,
            "address_line_1": expert.address_line_1,
            "address_line_2": expert.address_line_2,
            "landmark": expert.landmark,
            "street_name": expert.street_name,
            "country_calling_code": expert.country_calling_code,
            "username": expert.username,
            "role_type": expert.role_type,
            "available_time_slots": expert.available_time_slots,
            "consultation_duration": expert.consultation_duration,
            "max_consultations_per_day": expert.max_consultations_per_day,
            "consultation_charges": expert.consultation_charges,
            "brief_bio": expert.brief_bio,
            "license_number": expert.license_number,
            "languages_spoken": expert.languages_spoken,
            "profile_image_url": image_url,
            "is_deleted": expert.is_deleted,
            "status": getattr(expert, "status", True),
        }
        return StandardResponse(
            status=True,
            message="Expert updated successfully",
            data=response_data,
            errors={},
            status_code=status.HTTP_200_OK
        )
    except Exception as e:
        # Catch any unexpected server error
        return StandardResponse(
            status=False,
            message=f"An unexpected error occurred: {str(e)}",
            data={},
            errors={"server": "Internal server error"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/expert-profile/{expert_id}", summary="Get expert profile by ID", response_model=StandardResponse)
async def get_expert_profile(
    expert_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Fetch expert (consultant) profile by expert ID with all fields
    """
    try:
        # Check if expert exists and is not deleted
        expert = await ConsultantTeam.filter(id=expert_id, is_deleted=False).first()
        if not expert:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="Expert not found",
                    data={},
                    errors={},
                ).__dict__,
                status_code=status.HTTP_404_NOT_FOUND,
            )

        # Get profile image URL
        profile_image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""

        # Prepare complete expert profile data
        expert_data = {
            "expert_id": expert.id,
            "first_name": expert.first_name,
            "last_name": expert.last_name,
            "middle_name": expert.middle_name,
            "education": expert.education,
            "specialty": expert.specialty,
            "experience": expert.experience,
            "location": expert.location,
            "state": expert.state,
            "country": expert.country,
            "clinic_name": expert.clinic_name,
            "pincode": expert.pincode,
            "user_role": expert.user_role,
            "role_type": expert.role_type,
            "phone": expert.phone,
            "email": expert.email,
            "dob": str(expert.dob) if expert.dob else None,
            "gender": expert.gender,
            "address_line_1": expert.address_line_1,
            "address_line_2": expert.address_line_2,
            "landmark": expert.landmark,
            "street_name": expert.street_name,
            "country_calling_code": expert.country_calling_code,
            "username": expert.username,
            "availability": expert.availability,
            "profile_image_url": profile_image_url,
            "is_active": expert.is_active,
            "is_verified": expert.is_verified,
            "is_deleted": expert.is_deleted,
            # Additional consultant-specific fields
            "available_time_slots": expert.available_time_slots,
            "consultation_duration": expert.consultation_duration,
            "max_consultations_per_day": expert.max_consultations_per_day,
            "consultation_charges": expert.consultation_charges,
            "brief_bio": expert.brief_bio,
            "license_number": expert.license_number,
            "languages_spoken": expert.languages_spoken,
            "location_link": expert.location_link,
            # Audit fields
            "created_at": str(expert.created_at),
            "created_by": expert.created_by,
            "created_user_role": expert.created_user_role,
            "created_role_type": expert.created_role_type,
            "updated_at": str(expert.updated_at),
            "updated_by": expert.updated_by,
            "updated_user_role": expert.updated_user_role,
            "updated_role_type": expert.updated_role_type,
        }

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Expert profile fetched successfully",
                data=expert_data,
                errors={},
            ).__dict__,
            status_code=status.HTTP_200_OK,
        )

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message=f"Error fetching expert profile: {str(e)}",
                data={},
                errors={},
            ).__dict__,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


        # --- Fetch current expert -------------------------------------------
        expert = await ConsultantTeam.filter(id=expert_id, is_deleted=False).first()
        if not expert:
            return StandardResponse(
                status=False,
                message="Expert not found",
                data={},
                errors={},
                status_code=status.HTTP_404_NOT_FOUND
            )

        # --- Unique phone/email checks --------------------------------------
        if expert_payload.phone and expert_payload.phone != expert.phone:
            if await ConsultantTeam.filter(phone=expert_payload.phone).exclude(id=expert_id).exists():
                return StandardResponse(
                    status=False,
                    message="Phone number already in use",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        if expert_payload.email and expert_payload.email != expert.email:
            if await ConsultantTeam.filter(email=expert_payload.email).exclude(id=expert_id).exists():
                return StandardResponse(
                    status=False,
                    message="Email already in use",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        # --- Profile image (large base64) -----------------------------------
        profile_image_store_path = expert.profile_image  # default: keep old
        if expert_payload.profile_image:
            try:
                image_data = expert_payload.profile_image
                # Strip the "data:image/png;base64," prefix if present
                if image_data.startswith("data:image"):
                    image_data = image_data.split(",", 1)[1]

                # Validate the base64 string (this can be very large)
                base64.b64decode(image_data, validate=True)

                # Save file to disk/cloud and get the key/path
                profile_image_store_path = await save_base64_image(
                    base64_string=image_data,
                    destination_folder="uploads/profile_images/consultant_team/",
                    user_role=current_user.get("user_role"),
                    role_type=current_user.get("role_type"),
                    return_key_only=True,
                )
                if not profile_image_store_path:
                    profile_image_store_path = expert.profile_image
            except Exception as e:
                return StandardResponse(
                    status=False,
                    message=f"Invalid base64 profile image: {str(e)}",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        # --- Update simple fields -------------------------------------------
        # Iterate over schema fields dynamically to avoid repetition
        for field, value in expert_payload.model_dump(exclude_unset=True).items():
            if field == "profile_image":  # handled separately
                continue
            setattr(expert, field, value)

        # Update audit info
        expert.profile_image = profile_image_store_path or ""
        expert.updated_by = current_user["user_id"]
        expert.updated_user_role = current_user["user_role"]
        expert.updated_role_type = current_user["role_type"]
        expert.updated_at = datetime.utcnow()

        await expert.save()

        # --- Prepare response ------------------------------------------------
        image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""
        response_data = {
            "expert_id": expert.id,
            "first_name": expert.first_name,
            "last_name": expert.last_name,
            "middle_name": expert.middle_name,
            "education": expert.education,
            "specialty": expert.specialty,
            "experience": expert.experience,
            "location": expert.location,
            "state": expert.state,
            "country": expert.country,
            "pincode": expert.pincode,
            "phone": expert.phone,
            "email": expert.email,
            "dob": str(expert.dob) if expert.dob else None,
            "gender": expert.gender,
            "address_line_1": expert.address_line_1,
            "address_line_2": expert.address_line_2,
            "landmark": expert.landmark,
            "street_name": expert.street_name,
            "country_calling_code": expert.country_calling_code,
            "username": expert.username,
            "role_type": expert.role_type,
            "available_time_slots": expert.available_time_slots,
            "consultation_duration": expert.consultation_duration,
            "max_consultations_per_day": expert.max_consultations_per_day,
            "consultation_charges": expert.consultation_charges,
            "brief_bio": expert.brief_bio,
            "license_number": expert.license_number,
            "languages_spoken": expert.languages_spoken,
            "profile_image_url": image_url,
            "is_deleted": expert.is_deleted,
            "status": getattr(expert, "status", True),
        }

        return StandardResponse(
            status=True,
            message="Expert updated successfully",
            data=response_data,
            errors={},
            status_code=status.HTTP_200_OK
        )

    except Exception as e:
        # Catch any unexpected server error
        return StandardResponse(
            status=False,
            message=f"An unexpected error occurred: {str(e)}",
            data={},
            errors={"server": "Internal server error"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# @router.get("/prefered-experts",
#             summary="get experts based on parents childern consultations",
#             response_model=StandardResponse)
# async def get_prefered_experts(
#     current_user: dict = Depends(get_current_user),
# ):
#     try:
#         allowed_roles = ["PARENT"]
#         if current_user.get("user_role") not in allowed_roles:
#             return JSONResponse(
#                 content=StandardResponse(
#                 status=False,
#                 message="you are not authorized to access this resource",
#                 data={},
#                 errors={},
#             ).__dict__,
#             status_code=status.HTTP_403_FORBIDDEN)
#         parent_id = current_user["user_id"]
        
#         parent = await Parents.filter(
#             id=parent_id,
#             is_deleted=False,
#             is_active=True
#         ).prefetch_related("students").first()
        
#         if not parent:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message="Parent profile not found",
#                     data={},
#                     errors={},
#                 ).__dict__,
#                 status_code=status.HTTP_404_NOT_FOUND
#             )
#         # student_ids = [student.id for student in parent.students]
        
#         student_ids = await ParentChildren.filter(
#                 parent_id=parent_id,
#                 is_deleted=False
#             ).values_list("student_id", flat=True)
        
#         if not student_ids:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message="No childern found for this parent",
#                     data={},
#                     errors={},
#                 ).__dict__,
#                 status_code=status.HTTP_200_OK
#             )
        
#         expert_ids = await Consultations.filter(
#             Q(patient_id__in=student_ids) &
#             Q(is_deleted = False) &
#             ~Q(booking_status__in=["cancelled","rejected"])
#         ).distinct().values_list("doctor_id", flat=True)
        
#         if not expert_ids:
#             return JSONResponse(
#                 content= StandardResponse(
#                     status=True,
#                     message="No prefered experts found for your childern",
#                     data={"prefered_experts":[]},
#                     errors={},
#                 ).__dict__,
#                 status_code="HTTP_200_OK"
#             )
            
#         experts = await ConsultantTeam.filter(
#             id__in=expert_ids,
#             is_deleted=False,
#             is_active=True
#         )
        
        
#         prefered_list: List[dict] = []
#         for expert in experts:
#             profile_image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""

#             prefered_list.append({
#                 "expert_id": expert.id,
#                 "first_name": expert.first_name,
#                   "last_name": expert.last_name,
#                   "middle_name": expert.middle_name,
#                   "specialty": expert.specialty,
#                   "experience": expert.experience,
#                   "location": expert.location,
#                   "state": expert.state,
#                   "country": expert.country,
#                   "clinic_name": expert.clinic_name,
#                   "pincode": expert.pincode,
#                   "phone": expert.phone,
#                   "email": expert.email,
#                   "profile_image_url": profile_image_url,
#                     "consultation_charges": expert.consultation_charges,
#                     "brief_bio": expert.brief_bio,
#                     "languages_spoken": expert.languages_spoken,
#                     "available_time_slots": expert.available_time_slots,
#                     "consultation_duration": expert.consultation_duration,
#                     "max_consultations_per_day": expert.max_consultations_per_day,
#                     "license_number": expert.license_number,
#                     "user_role": expert.user_role.value,  # ConsultantRoles enum value
#                     "role_type": expert.role_type,
#                     "created_at": str(expert.created_at),
#                     "updated_at": str(expert.updated_at),
#                     "is_active": expert.is_active,
#                     "is_verified": expert.is_verified,
#                 })
#         return JSONResponse(
#                   content=StandardResponse(
#                       status=True,
#                       message="prefered experts fetched successfully",
#                       data={
#                           "prefered_experts": prefered_list,
#                         #   "total_experts": len(prefered_list),
#                         #   "total_childern": len(student_ids)
#                       },
#                       errors={},
#                   ).__dict__,
#                   status_code=status.HTTP_200_OK
#               )
    
#     except Exception as e:
#         return JSONResponse(
#             content=StandardResponse(
#                 status=False,
#                 message=f"Error fetching prefered experts: {str(e)}",
#                 data={},
#                 errors={"server":str(e)},
#             ).__dict__,
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
            

@router.get("/prefered-experts",
            summary="get experts based on parents childern consultations",
            response_model=StandardResponse)
async def get_prefered_experts(
    current_user: dict = Depends(get_current_user),
):
    try:
        allowed_roles = ["PARENT"]
        if current_user.get("user_role") not in allowed_roles:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="you are not authorized to access this resource",
                    data={},
                    errors={},
                ).__dict__,
                status_code=status.HTTP_403_FORBIDDEN  # ✅ Integer, not string
            )
        
        parent_id = current_user["user_id"]
        
        parent = await Parents.filter(
            id=parent_id,
            is_deleted=False,
            is_active=True
        ).prefetch_related("students").first()
        
        if not parent:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="Parent profile not found",
                    data={},
                    errors={},
                ).__dict__,
                status_code=status.HTTP_404_NOT_FOUND  # ✅ Integer
            )
        
        student_ids = await ParentChildren.filter(
            parent_id=parent_id,
            is_deleted=False
        ).values_list("student_id", flat=True)
        
        if not student_ids:
            return JSONResponse(
                content=StandardResponse(
                    status=True,  # ✅ Changed to True since no children is valid
                    message="No children found for this parent",
                    data={"prefered_experts": []},  # ✅ Fixed typo: "childern" -> "children"
                    errors={},
                ).__dict__,
                status_code=status.HTTP_200_OK  # ✅ Integer, not string
            )
        
        expert_ids = await Consultations.filter(
            Q(patient_id__in=student_ids) &
            Q(is_deleted=False) &
            ~Q(booking_status__in=["cancelled", "rejected"])
        ).distinct().values_list("doctor_id", flat=True)
        
        if not expert_ids:
            return JSONResponse(
                content=StandardResponse(
                    status=True,
                    message="No preferred experts found for your children",
                    data={"prefered_experts": []},
                    errors={},
                ).__dict__,
                status_code=status.HTTP_200_OK  # ✅ Integer, not string
            )
        
        experts = await ConsultantTeam.filter(
            id__in=expert_ids,
            is_deleted=False,
            is_active=True
        )
        
        prefered_list: List[dict] = []
        for expert in experts:
            profile_image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""

            prefered_list.append({
                "expert_id": expert.id,
                "first_name": expert.first_name,
                "last_name": expert.last_name,
                "middle_name": expert.middle_name,
                "specialty": expert.specialty,
                "experience": expert.experience,
                "location": expert.location,
                "state": expert.state,
                "country": expert.country,
                "clinic_name": expert.clinic_name,
                "pincode": expert.pincode,
                "phone": expert.phone,
                "email": expert.email,
                "profile_image_url": profile_image_url,
                "consultation_charges": expert.consultation_charges,
                "brief_bio": expert.brief_bio,
                "languages_spoken": expert.languages_spoken,
                "available_time_slots": expert.available_time_slots,
                "consultation_duration": expert.consultation_duration,
                "max_consultations_per_day": expert.max_consultations_per_day,
                "license_number": expert.license_number,
                "user_role": expert.user_role.value,  # ConsultantRoles enum value
                "role_type": expert.role_type,
                "created_at": str(expert.created_at),
                "updated_at": str(expert.updated_at),
                "is_active": expert.is_active,
                "is_verified": expert.is_verified,
            })
        
        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Preferred experts fetched successfully",
                data={
                    "prefered_experts": prefered_list,
                },
                errors={},
            ).__dict__,
            status_code=status.HTTP_200_OK  # ✅ Integer, not string
        )
    
    except Exception as e:
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message=f"Error fetching preferred experts: {str(e)}",
                data={},
                errors={"server": str(e)},
            ).__dict__,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR  # ✅ Integer
        )

       
        
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from typing import List, Dict, Any

@router.get(
    "/nearest-by-location-experts",
    summary="Fetch experts with matching or nearby pincodes to the logged-in parent's pincode",
    response_model=StandardResponse,
)
async def get_doctors_by_parent_location(
    current_user: dict = Depends(get_current_user),
):
    """
    Returns all active, verified experts whose pincode matches the logged-in parent's pincode
    with different levels of proximity:
    - Exact match (all 6 digits)
    - Very close (first 5 digits match - same delivery area)
    - Close (first 4 digits match - same sub-district)
    - Nearby (first 3 digits match - same sorting district)
    """
    try:
        # 1️⃣ Get parent profile
        parent = await Parents.filter(
            id=current_user["user_id"],
            is_deleted=False,
            is_active=True
        ).first()
        
        if not parent or not parent.pincode or parent.pincode.strip() == "":
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=StandardResponse(
                    status=False,
                    message="Parent pincode not found",
                    data={},
                    errors={},
                ).__dict__,
            )

        parent_pincode = parent.pincode.strip()
        
        # Validate pincode has 6 digits
        if len(parent_pincode) != 6 or not parent_pincode.isdigit():
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=StandardResponse(
                    status=False,
                    message="Invalid parent pincode format. Must be 6 digits.",
                    data={},
                    errors={},
                ).__dict__,
            )

        # 2️⃣ Find experts with valid pincodes
        experts = await ConsultantTeam.filter(
            is_active=True,
            is_verified=True,
            is_deleted=False,
        ).exclude(
            pincode__isnull=True
        ).exclude(
            pincode=""
        )

        # 3️⃣ Categorize experts by proximity level
        exact_matches: List[Dict[str, Any]] = []        # All 6 digits match
        very_close_matches: List[Dict[str, Any]] = []   # First 5 digits match
        close_matches: List[Dict[str, Any]] = []        # First 4 digits match
        nearby_matches: List[Dict[str, Any]] = []       # First 3 digits match

        for expert in experts:
            # Skip invalid pincodes
            if not expert.pincode or expert.pincode.strip() == "":
                continue

            expert_pincode = expert.pincode.strip()
            
            # Skip if not 6 digits
            if len(expert_pincode) != 6 or not expert_pincode.isdigit():
                continue
                
            profile_image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""
            
            # Determine proximity level
            proximity_level = "none"
            if expert_pincode == parent_pincode:
                proximity_level = "exact"
            elif expert_pincode[:5] == parent_pincode[:5]:
                proximity_level = "very_close"
            elif expert_pincode[:4] == parent_pincode[:4]:
                proximity_level = "close"
            elif expert_pincode[:3] == parent_pincode[:3]:
                proximity_level = "nearby"
            else:
                # Skip experts that don't match even first 3 digits
                continue
            
            expert_data = {
                "expert_id": expert.id,
                "first_name": expert.first_name,
                "last_name": expert.last_name,
                "user_role": expert.user_role,
                "role_type": expert.role_type,
                "specialty": expert.specialty,
                "experience": expert.experience,
                "location": expert.location,
                "clinic_name": expert.clinic_name,
                "pincode": expert.pincode,
                "phone": expert.phone,
                "email": expert.email,
                "profile_image_url": profile_image_url,
                "consultation_charges": expert.consultation_charges,
                "brief_bio": expert.brief_bio,
                "languages_spoken": expert.languages_spoken,
                "available_time_slots": expert.available_time_slots,
                "consultation_duration": expert.consultation_duration,
                "max_consultations_per_day": expert.max_consultations_per_day,
                "license_number": expert.license_number,
                "created_at": str(expert.created_at),
                "updated_at": str(expert.updated_at),
                "is_active": expert.is_active,
                "is_verified": expert.is_verified,
                "pincode_match": proximity_level
            }

            # Add to appropriate list
            if proximity_level == "exact":
                exact_matches.append(expert_data)
            elif proximity_level == "very_close":
                very_close_matches.append(expert_data)
            elif proximity_level == "close":
                close_matches.append(expert_data)
            elif proximity_level == "nearby":
                nearby_matches.append(expert_data)

        # 4️⃣ Combine all matches in order of proximity (closest first)
        expert_list = exact_matches + very_close_matches + close_matches + nearby_matches

        if not expert_list:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=StandardResponse(
                    status=False,
                    message="No experts found with matching or nearby pincodes",
                    data={},
                    errors={},
                ).__dict__,
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=StandardResponse(
                status=True,
                message="Experts fetched by matching or nearby pincode",
                data={
                    "experts": expert_list,
                    "total_count": len(expert_list),
                    "exact_matches": len(exact_matches),
                    "very_close_matches": len(very_close_matches),
                    "close_matches": len(close_matches),
                    "nearby_matches": len(nearby_matches)
                },
                errors={},
            ).__dict__,
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=StandardResponse(
                status=False,
                message=f"Error fetching Experts: {str(e)}",
                data={},
                errors={"server": str(e)},
            ).__dict__,
        )
