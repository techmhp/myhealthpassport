import json as _json

from fastapi import Depends, APIRouter, status
from fastapi.responses import JSONResponse
from src.utils.response import StandardResponse
from src.core.manager import get_current_user
from src.models.other_models import ClinicalFindings
from datetime import datetime, timezone, timedelta
from typing import Any
from src.models.student_models import Students
from src.models.user_models import AnalystTeam, AnalystRoles, Parents,ParentRoles, SchoolStaff,SchoolRoles,ConsultantRoles, ConsultantTeam


def _parse_clinical_notes(value) -> list:
    """Parse clinical_notes_recommendations field.
    New format: JSON array string  e.g. '["note 1", "note 2"]'
    Legacy format: comma-separated  e.g. 'note 1,note 2'
    Both are handled transparently.
    """
    if not value:
        return []
    try:
        parsed = _json.loads(value)
        if isinstance(parsed, list):
            return parsed
    except (ValueError, TypeError):
        pass
    # Legacy fallback — comma-separated (existing records in DB)
    return [item.strip() for item in value.split(",") if item.strip()]


def _serialise_clinical_notes(notes) -> str:
    """Serialise a list of recommendation strings to JSON for DB storage."""
    if not notes:
        return ""
    if isinstance(notes, list):
        return _json.dumps(notes, ensure_ascii=False)
    return str(notes)

from tortoise.transactions import in_transaction
from . import router
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

FINDINGS_OPTIONS = [
    "General Emotional Health",
    "Social Interactions",
    "Coping Mechanisms",
    "Behavioral Patterns",
    "Sleep and Routine",
    "Self-Regulation and Independence",
    "Emotional Well-being",
    "Emotional Well-being & Social Skills",
    "Language & Communication",
    "Cognitive & Learning",
    "Behavioural Regulation",
    "Adaptive/Self-help Skills",
    "Motor Skills (Gross & Fine)",
    "Work-related stress and Burnout",
    "Anxiety and Depression",
    "Resilience and coping",
    "Sleep quality and fatigue",
    "Job satisfaction & organisational support",
    "Emotional regulation",
    "Empathy and emotional regulation",
    "Family environment and support",
    "Social Relationships",
    "Self-esteem",
    "Academic Engagement",
    "Physical Well-being",
]

async def get_current_analyst_user(user: dict = Depends(get_current_user)):
    if user is None:
        response_obj = StandardResponse(
            status=False,
            message="No user provided",
            errors={"detail": "User is None"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_401_UNAUTHORIZED)

    if not isinstance(user, dict) or "user_id" not in user or "role_type" not in user:
        response_obj = StandardResponse(
            status=False,
            message="Invalid user data format",
            errors={"detail": f"Expected user_id and role_type, got {user}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    role_type = user["role_type"].strip().upper()
    if role_type != "ANALYST_TEAM":
        response_obj = StandardResponse(
            status=False,
            message="Only analyst team members can access this endpoint",
            errors={"detail": f"Invalid role_type: {role_type}. Allowed role: ANALYST_TEAM"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    role_to_check = user.get("user_role", "").strip().upper()
    allowed_analyst_roles = [role.value for role in AnalystRoles]
    if role_to_check not in allowed_analyst_roles:
        response_obj = StandardResponse(
            status=False,
            message="User role not authorized for this endpoint",
            errors={"detail": f"Invalid user_role: {role_to_check}. Allowed analyst roles: {allowed_analyst_roles}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    analyst_team = await AnalystTeam.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
    if not analyst_team:
        existing_roles = await AnalystTeam.filter(id=user["user_id"]).values_list("user_role", flat=True)
        response_obj = StandardResponse(
            status=False,
            message="Analyst team member not found",
            errors={"detail": f"No analyst team member found for user_id: {user['user_id']} with user_role: {role_to_check}. Existing roles: {existing_roles or 'None'}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
    return analyst_team

async def get_current_user(user: dict = Depends(get_current_user)):
    if user is None:
        response_obj = StandardResponse(
            status=False,
            message="No user provided",
            errors={"detail": "User is None"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_401_UNAUTHORIZED)

    if not isinstance(user, dict) or "user_id" not in user or "role_type" not in user:
        response_obj = StandardResponse(
            status=False,
            message="Invalid user data format",
            errors={"detail": f"Expected user_id and role_type, got {user}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    role_type = user["role_type"].strip().upper()
    allowed_role_types = ["ANALYST_TEAM", "PARENT", "SCHOOL_STAFF", "CONSULTANT_TEAM"]
    
    if role_type not in allowed_role_types:
        response_obj = StandardResponse(
            status=False,
            message="User role type not authorized for this endpoint",
            errors={"detail": f"Invalid role_type: {role_type}. Allowed roles: {allowed_role_types}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    role_to_check = user.get("user_role", "").strip().upper()
    
    # Define allowed roles for each role type
    role_checks = {
        "ANALYST_TEAM": [role.value for role in AnalystRoles],
        "PARENT": [role.value for role in ParentRoles],
        "SCHOOL_STAFF": [role.value for role in SchoolRoles],
        "CONSULTANT_TEAM": [role.value for role in ConsultantRoles]
    }

    # Check if the role is valid for the given role_type
    allowed_roles = role_checks.get(role_type, [])
    if role_to_check not in allowed_roles:
        response_obj = StandardResponse(
            status=False,
            message="User role not authorized for this endpoint",
            errors={"detail": f"Invalid user_role: {role_to_check}. Allowed roles for {role_type}: {allowed_roles}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # Fetch user based on role_type
    user_model = {
        "ANALYST_TEAM": AnalystTeam,
        "PARENT": Parents,
        "SCHOOL_STAFF": SchoolStaff,
        "CONSULTANT_TEAM": ConsultantTeam
    }.get(role_type)

    # Query the appropriate model for the user
    user_instance = await user_model.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
    
    if not user_instance:
        existing_roles = await user_model.filter(id=user["user_id"]).values_list("user_role", flat=True)
        response_obj = StandardResponse(
            status=False,
            message=f"{role_type} member not found",
            errors={"detail": f"No {role_type.lower()} member found for user_id: {user['user_id']} with user_role: {role_to_check}. Existing roles: {existing_roles or 'None'}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    return user_instance

# @router.get("/psychological-analyst/{student_id}", response_model=StandardResponse)
# async def get_clinical_findings(student_id: int, current_analyst: Any = Depends(get_current_user)):
#     if isinstance(current_analyst, JSONResponse):
#         return current_analyst

#     try:
#         if not isinstance(student_id, int):
#             response_obj = StandardResponse(
#                 status=False,
#                 message="Invalid student ID format",
#                 data={},
#                 errors={"detail": "Student ID must be an integer"}
#             )
#             return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#         findings_list = await ClinicalFindings.filter(student__id=student_id).prefetch_related("student").all()
#         if not findings_list:
#             response_obj = StandardResponse(
#                 status=False,
#                 message=f"No clinical findings found for student ID {student_id}",
#                 data={},
#                 errors={}
#             )
#             return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#         data = {
#             "student_id": student_id,
#             "data": [
#                 {
#                     "id": record.id,
#                     "good_strengths_data": record.findings_data,  # Map findings_data to good_strengths_data
#                     "need_attention_data": record.need_attention_data,
#                     # "strengths": record.strengths.split(",") if record.strengths else [],
#                     # "need_attention": record.need_attention.split(",") if record.need_attention else [],
#                     "clinical_notes_recommendations": _parse_clinical_notes(record.clinical_notes_recommendations),
#                     "summary": record.summary,
#                     "status": record.status,
#                     "role_type": record.role_type,
#                     "role_name": record.role_name,
#                     "created_date": record.created_at.isoformat() if record.created_at else None,
#                     "update_date": record.updated_at.isoformat() if record.updated_at else None
#                 }
#                 for record in findings_list
#             ],
#             "analysis_status": findings_list[0].analysis_status if findings_list else False,
#             "role_type": findings_list[0].role_type if findings_list else "psychologist",
#             "role_name": findings_list[0].role_name if findings_list else current_analyst.user_role
#         }
#         response_obj = StandardResponse(
#             status=True,
#             message="Clinical findings retrieved successfully",
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
#     except Exception as e:
#         response_obj = StandardResponse(
#             status=False,
#             message="Failed to retrieve clinical findings",
#             data={},
#             errors={"detail": str(e)}
#         )
#         return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ===================================================================
# MODIFIED: GET CLINICAL FINDINGS (with Academic Year Filter)
# ===================================================================
@router.get("/psychological-analyst/{student_id}", response_model=StandardResponse)
async def get_clinical_findings(
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_analyst: Any = Depends(get_current_user)
):
    if isinstance(current_analyst, JSONResponse):
        return current_analyst

    try:
        if not isinstance(student_id, int):
            response_obj = StandardResponse(
                status=False,
                message="Invalid student ID format",
                data={},
                errors={"detail": "Student ID must be an integer"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

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

        # Fetch clinical findings with academic year filter
        findings_list = await ClinicalFindings.filter(
            year_filter,
            student__id=student_id
        ).prefetch_related("student").all()

        if not findings_list:
            response_obj = StandardResponse(
                status=False,
                message=f"No clinical findings found for student ID {student_id}",
                data={},
                errors={}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        data = {
            "student_id": student_id,
            "data": [
                {
                    "id": record.id,
                    "good_strengths_data": record.findings_data,  # Map findings_data to good_strengths_data
                    "need_attention_data": record.need_attention_data,
                    "clinical_notes_recommendations": _parse_clinical_notes(record.clinical_notes_recommendations),
                    "summary": record.summary,
                    "status": record.status,
                    "role_type": record.role_type,
                    "role_name": record.role_name,
                    "created_date": record.created_at.isoformat() if record.created_at else None,
                    "update_date": record.updated_at.isoformat() if record.updated_at else None
                }
                for record in findings_list
            ],
            "analysis_status": findings_list[0].analysis_status if findings_list else False,
            "role_type": findings_list[0].role_type if findings_list else "psychologist",
            "role_name": findings_list[0].role_name if findings_list else current_analyst.user_role
        }
        
        response_obj = StandardResponse(
            status=True,
            message="Clinical findings retrieved successfully",
            data=data,
            errors={}
        )
        
        response = JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)
        response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return response

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
            message="Failed to retrieve clinical findings",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.post("/psychological-analyst", response_model=StandardResponse)
async def create_clinical_findings(create_data: dict, current_analyst: Any = Depends(get_current_analyst_user)):
    if isinstance(current_analyst, JSONResponse):
        return current_analyst

    try:
        student_id = create_data.get("student_id")
        if not student_id or not isinstance(student_id, int):
            response_obj = StandardResponse(
                status=False,
                message="Student ID is required and must be an integer",
                data={},
                errors={"detail": "Missing or invalid student_id"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        student = await Students.get_or_none(id=student_id)
        if not student:
            response_obj = StandardResponse(
                status=False,
                message=f"Student with ID {student_id} not found",
                data={},
                errors={"detail": f"No student found for ID {student_id}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        if "data" not in create_data or not create_data["data"] or not isinstance(create_data["data"], list):
            response_obj = StandardResponse(
                status=False,
                message="No valid data provided for creation",
                data={},
                errors={"detail": "The 'data' field must be a non-empty list"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        def is_response_complete(data):
            """Check if all required fields are non-empty."""
            if data is None:
                return False
            if isinstance(data, dict):
                if "good_strengths_data" in data or "need_attention_data" in data:
                    for finding in data.get("good_strengths_data", []) + data.get("need_attention_data", []):
                        if not all(k in finding and finding[k] and isinstance(finding[k], str) and finding[k].strip() != ""
                                   for k in ["remarks", "findings"]):
                            return False
                        if finding.get("findings") not in FINDINGS_OPTIONS:
                            return False
                return all(
                    k in data and
                    (data[k] is not None) and
                    (isinstance(data[k], str) and data[k].strip() != "" or
                     isinstance(data[k], list) and all(is_response_complete(item) for item in data[k]) or
                     not isinstance(data[k], (str, list, dict)) or
                     is_response_complete(data[k]))
                    for k in data if k not in ["id"]  # Exclude id for POST
                )
            if isinstance(data, list):
                return len(data) > 0 and all(is_response_complete(item) for item in data)
            if isinstance(data, str):
                return data.strip() != ""
            return True

        created_records = []
        errors = []
        async with in_transaction():
            for report_data in create_data["data"]:
                good_strengths_data = report_data.get("good_strengths_data", [])
                need_attention_data = report_data.get("need_attention_data", [])
                if not good_strengths_data and not need_attention_data:
                    errors.append("No good_strengths_data or need_attention_data provided in report")
                    continue

                # Validate findings
                for finding in good_strengths_data + need_attention_data:
                    if finding.get("findings") not in FINDINGS_OPTIONS:
                        errors.append(f"Invalid findings value: {finding.get('findings')}. Must be one of {FINDINGS_OPTIONS}")
                        continue

                # Prepare key for checking duplicates
                key = (
                    ",".join(report_data.get("clinical_notes_recommendations", [])) if report_data.get("clinical_notes_recommendations") else "",
                    report_data.get("summary", ""),
                    report_data.get("status", "")
                )

                # Check for existing report with the same key
                existing_records = await ClinicalFindings.filter(
                    student__id=student_id,
                    clinical_notes_recommendations=key[0],
                    summary=key[1],
                    status=key[2]
                ).all()

                if existing_records:
                    existing_good_strengths = {tuple(f.items()) for record in existing_records for f in record.findings_data}
                    existing_need_attention = {tuple(f.items()) for record in existing_records for f in (record.need_attention_data or [])}
                    requested_good_strengths = {tuple(f.items()) for f in good_strengths_data}
                    requested_need_attention = {tuple(f.items()) for f in need_attention_data}
                    if existing_good_strengths == requested_good_strengths and existing_need_attention == requested_need_attention:
                        errors.append(f"Report with identical findings already exists for student ID {student_id}")
                        continue

                # Check completeness for clinical_status
                response_data = {
                    "good_strengths_data": good_strengths_data,
                    "need_attention_data": need_attention_data,
                    "clinical_notes_recommendations": report_data.get("clinical_notes_recommendations", []),
                    "summary": report_data.get("summary", ""),
                    "status": report_data.get("status", "")
                }
                is_all_complete = is_response_complete(response_data)

                # Create a single record with all findings
                filtered_data = {
                    "student": student,
                    "user_id": current_analyst.id,
                    "role_type": create_data.get("role_type", current_analyst.user_role),
                    "role_name": create_data.get("role_name", current_analyst.user_role),
                    "created_at": datetime.now(timezone(timedelta(hours=5, minutes=30))),
                    "updated_at": datetime.now(timezone(timedelta(hours=5, minutes=30))),
                    "findings_data": good_strengths_data,
                    "need_attention_data": need_attention_data,
                    "clinical_notes_recommendations": _serialise_clinical_notes(report_data.get("clinical_notes_recommendations", [])),
                    "summary": report_data.get("summary", ""),
                    "status": report_data.get("status", ""),
                    "created_by": current_analyst.id,
                    "created_role": current_analyst.user_role,
                    "created_role_type": create_data.get("role_type", current_analyst.user_role),
                    "analysis_status": is_all_complete
                }
                allowed_fields = set(ClinicalFindings._meta.fields_map.keys())
                filtered_data = {k: v for k, v in filtered_data.items() if k in allowed_fields and v is not None}
                clinical_data = await ClinicalFindings.create(**filtered_data)
                created_records.append(clinical_data)

        if not created_records:
            response_obj = StandardResponse(
                status=False,
                message="No valid reports created",
                data={},
                errors={"details": errors} if errors else {"detail": "No clinical findings were created"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        data = {
            "student_id": student_id,
            "data": [
                {
                    "id": record.id,
                    "good_strengths_data": record.findings_data,
                    "need_attention_data": record.need_attention_data,
                    "clinical_notes_recommendations": _parse_clinical_notes(record.clinical_notes_recommendations),
                    "summary": record.summary,
                    "status": record.status,
                    "role_type": record.role_type,
                    "role_name": record.role_name,
                    "created_date": record.created_at.isoformat() if record.created_at else None,
                    "update_date": record.updated_at.isoformat() if record.updated_at else None,
                    "analysis_status": record.analysis_status
                }
                for record in created_records
            ],
            "role_type": created_records[0].role_type,
            "role_name": created_records[0].role_name,
            "analysis_status": created_records[0].analysis_status
        }
        response_obj = StandardResponse(
            status=True,
            message="Clinical findings created successfully",
            data=data,
            errors={"details": errors} if errors else {}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_201_CREATED)

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
            message="Failed to create clinical findings",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@router.put("/psychological-analyst", response_model=StandardResponse)
async def update_clinical_findings(update_data: dict, current_analyst: Any = Depends(get_current_analyst_user)):
    if isinstance(current_analyst, JSONResponse):
        return current_analyst

    try:
        student_id = update_data.get("student_id")
        if not student_id or not isinstance(student_id, int):
            response_obj = StandardResponse(
                status=False,
                message="Student ID is required and must be an integer",
                data={},
                errors={"detail": "Missing or invalid student_id"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        student = await Students.get_or_none(id=student_id)
        if not student:
            response_obj = StandardResponse(
                status=False,
                message=f"Student with ID {student_id} not found",
                data={},
                errors={"detail": f"No student found for ID {student_id}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        if "data" not in update_data or not update_data["data"] or not isinstance(update_data["data"], list):
            response_obj = StandardResponse(
                status=False,
                message="No valid data provided for update",
                data={},
                errors={"detail": "The 'data' field must be a non-empty list"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        def is_response_complete(data):
            """Check if all required fields are non-empty for analysis_status=True."""
            required_fields = ["good_strengths_data", "need_attention_data", "clinical_notes_recommendations", "summary", "status"]
            if not all(k in data for k in required_fields):
                return False
            if not all(isinstance(data[k], (str, list)) and data[k] for k in required_fields):
                return False
            if isinstance(data["clinical_notes_recommendations"], list) and not data["clinical_notes_recommendations"]:
                return False
            if isinstance(data["summary"], str) and not data["summary"].strip():
                return False
            if isinstance(data["status"], str) and not data["status"].strip():
                return False
            for finding in data.get("good_strengths_data", []) + data.get("need_attention_data", []):
                if not all(k in finding and finding[k] and isinstance(finding[k], str) and finding[k].strip() != ""
                           for k in ["remarks", "findings"]):
                    return False
                if finding.get("findings") not in FINDINGS_OPTIONS:
                    return False
            return True

        updated_records = []
        errors = []
        async with in_transaction():
            for report in update_data["data"]:
                report_id = report.get("id")
                if not report_id or not isinstance(report_id, int):
                    errors.append("Missing or invalid report_id for one of the reports")
                    continue

                good_strengths_data = report.get("good_strengths_data", [])
                need_attention_data = report.get("need_attention_data", [])
                if not good_strengths_data and not need_attention_data:
                    errors.append(f"At least one of good_strengths_data or need_attention_data is required for report ID {report_id}")
                    continue

                # Validate findings
                for finding in good_strengths_data + need_attention_data:
                    if finding.get("findings") not in FINDINGS_OPTIONS:
                        errors.append(f"Invalid findings value for ID {report_id}: {finding.get('findings')}. Must be one of {FINDINGS_OPTIONS}")
                        continue

                # Check if record exists
                existing_record = await ClinicalFindings.get_or_none(id=report_id, student__id=student_id)
                if not existing_record:
                    errors.append(f"Clinical findings with ID {report_id} not found")
                    continue

                # Check completeness for analysis_status
                response_data = {
                    "good_strengths_data": good_strengths_data,
                    "need_attention_data": need_attention_data,
                    "clinical_notes_recommendations": report.get("clinical_notes_recommendations", []),
                    "summary": report.get("summary", ""),
                    "status": report.get("status", "")
                }
                is_all_complete = is_response_complete(response_data)

                # Update the record
                filtered_data = {
                    "user_id": existing_record.user_id,
                    "role_type": update_data.get("role_type", existing_record.role_type),
                    "role_name": update_data.get("role_name", existing_record.role_name) or current_analyst.user_role,
                    "findings_data": good_strengths_data,
                    "need_attention_data": need_attention_data,
                    "clinical_notes_recommendations": _serialise_clinical_notes(report.get("clinical_notes_recommendations", [])),
                    "summary": report.get("summary", ""),
                    "status": report.get("status", ""),
                    "updated_at": datetime.now(timezone(timedelta(hours=5, minutes=30))),
                    "updated_by": current_analyst.id,
                    "updated_user_role": current_analyst.user_role,
                    "updated_role_type": update_data.get("role_type", existing_record.role_type),
                    # "clinical_status": is_all_complete
                    "analysis_status": is_all_complete
                }
                allowed_fields = set(ClinicalFindings._meta.fields_map.keys())
                filtered_data = {k: v for k, v in filtered_data.items() if k in allowed_fields and v is not None}
                await ClinicalFindings.filter(id=report_id).update(**filtered_data)
                updated_record = await ClinicalFindings.get(id=report_id)
                updated_records.append(updated_record)

        if not updated_records and errors:
            response_obj = StandardResponse(
                status=False,
                message="Failed to update any clinical findings",
                data={},
                errors={"details": errors}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        data = {
            "student_id": student_id,
            "data": [
                {
                    "id": record.id,
                    "good_strengths_data": record.findings_data,
                    "need_attention_data": record.need_attention_data,
                    "clinical_notes_recommendations": _parse_clinical_notes(record.clinical_notes_recommendations),
                    "summary": record.summary,
                    "status": record.status,
                    "role_type": record.role_type,
                    "role_name": record.role_name,
                    "created_date": record.created_at.isoformat() if record.created_at else None,
                    "update_date": record.updated_at.isoformat() if record.updated_at else None,
                    "analysis_status": record.analysis_status
                }
                for record in updated_records
            ],
            "role_type": updated_records[0].role_type if updated_records else current_analyst.user_role,
            "role_name": updated_records[0].role_name if updated_records else current_analyst.user_role,
            "analysis_status": updated_records[0].analysis_status if updated_records else False
        }

        response_obj = StandardResponse(
            status=True,
            message="Clinical findings updated successfully",
            data=data,
            errors={"details": errors} if errors else {}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)

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
            message="Failed to update clinical findings",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
    