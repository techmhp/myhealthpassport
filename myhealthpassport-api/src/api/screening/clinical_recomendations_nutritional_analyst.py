from fastapi import Depends, APIRouter, status
from fastapi.responses import JSONResponse
from src.utils.response import StandardResponse
from src.core.manager import get_current_user
from src.models.other_models import ClinicalRecomendations
from datetime import datetime
from typing import Any
from src.models.student_models import Students
from src.models.user_models import AnalystTeam, AnalystRoles, Parents,ParentRoles, SchoolStaff,SchoolRoles,ConsultantRoles, ConsultantTeam
from tortoise.transactions import in_transaction
from . import router
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

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

# @router.get("/nutritional-analyst/{student_id}", response_model=StandardResponse)
# async def get_clinical_recommendations(student_id: int, current_analyst: Any = Depends(get_current_user)):
#     if isinstance(current_analyst, JSONResponse):
#         return current_analyst

#     try:
#         clinical_data_list = await ClinicalRecomendations.filter(student__id=student_id).prefetch_related("student").all()
#         if not clinical_data_list:
#             response_obj = StandardResponse(
#                 status=False,
#                 message=f"No clinical recommendations found for student ID {student_id}",
#                 data={},
#                 errors={}
#             )
#             return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#         data = {
#             "student_id": student_id,
#             "data": [
#                 {
#                     "id": record.id,
#                     "report_type": record.report_type,
#                     "report_data": record.questions_data if record.questions_data else [],
#                     "summary": record.summary,
#                     "status": record.status
#                 } for record in clinical_data_list
#             ],
#             "common_summary": clinical_data_list[0].common_summary,
#             "common_status": clinical_data_list[0].common_status,
#             "clinical_notes": clinical_data_list[0].clinical_notes,
#             "role_type": clinical_data_list[0].role_type,
#             "role_name": clinical_data_list[0].role_name,
#             "analysis_status": clinical_data_list[0].analysis_status
#         }
#         response_obj = StandardResponse(
#             status=True,
#             message="Clinical recommendations retrieved successfully",
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
#             message="Failed to retrieve clinical recommendations",
#             data={},
#             errors={"detail": str(e)}
#         )
#         return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ===================================================================
# MODIFIED: GET CLINICAL RECOMMENDATIONS (with Academic Year Filter)
# ===================================================================
@router.get("/nutritional-analyst/{student_id}", response_model=StandardResponse)
async def get_clinical_recommendations(
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

        # Fetch clinical recommendations with academic year filter
        clinical_data_list = await ClinicalRecomendations.filter(
            year_filter,
            student__id=student_id
        ).prefetch_related("student").all()

        if not clinical_data_list:
            response_obj = StandardResponse(
                status=False,
                message=f"No clinical recommendations found for student ID {student_id}",
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
                    "report_type": record.report_type,
                    "report_data": record.questions_data if record.questions_data else [],
                    "summary": record.summary,
                    "status": record.status
                } for record in clinical_data_list
            ],
            "common_summary": clinical_data_list[0].common_summary,
            "common_status": clinical_data_list[0].common_status,
            "clinical_notes": clinical_data_list[0].clinical_notes,
            "role_type": clinical_data_list[0].role_type,
            "role_name": clinical_data_list[0].role_name,
            "analysis_status": clinical_data_list[0].analysis_status
        }
        
        response_obj = StandardResponse(
            status=True,
            message="Clinical recommendations retrieved successfully",
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
            message="Failed to retrieve clinical recommendations",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/nutritional-analyst", response_model=StandardResponse)
async def create_or_update_clinical_recommendations(create_data: dict, current_analyst: Any = Depends(get_current_analyst_user)):
    """
    Creates or updates clinical recommendations for a student.
    - If no records exist for the student_id, it creates them.
    - If records exist, it updates them based on the provided report_type.
      Any new report_types for that student will be created.
    """
    if isinstance(current_analyst, JSONResponse):
        return current_analyst

    try:
        student_id = create_data.get("student_id")
        if not student_id:
            response_obj = StandardResponse(
                status=False,
                message="Student ID is required",
                data={},
                errors={"detail": "Missing student_id"}
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
                message="No valid reports provided",
                data={},
                errors={"detail": "The 'data' field must be a non-empty list"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        def is_response_complete(data, is_post=False):
            """Check if all mandatory report types and keys in the data dictionary are valid."""
            if data is None or not isinstance(data, dict):
                return False

            # Check top-level mandatory fields (only clinical_notes is mandatory)
            mandatory_fields = {"clinical_notes"}
            for field in mandatory_fields:
                if field not in data or not isinstance(data[field], str) or not data[field].strip():
                    return False

            # Check optional common_summary and common_status
            for field in ["common_summary", "common_status"]:
                if field in data and (not isinstance(data[field], str) or not data[field].strip()):
                    return False

            # Check optional role_type and role_name
            for field in ["role_type", "role_name"]:
                if field in data and (not isinstance(data[field], str) or not data[field].strip()):
                    return False

            # Check student_id
            if "student_id" not in data or data["student_id"] is None:
                return False

            # Check for mandatory report types
            mandatory_reports = {
                "Physical Screening Report",
                "Lab Reports",
                "Nutrition Deficiency Report",
                "Questionnaire Reports"
            }
            if "data" not in data or not isinstance(data["data"], list) or not data["data"]:
                return False

            report_types = {report.get("report_type") for report in data["data"] if report.get("report_type")}
            if not mandatory_reports.issubset(report_types):
                return False

            # Validate each report
            for report in data["data"]:
                if not isinstance(report, dict):
                    return False
                # Define report fields, excluding summary and status for specific report types
                mandatory_report_fields = {"report_type", "report_data"}
                if report.get("report_type") not in {"Questionnaire Reports", "Nutrition Deficiency Report"}:
                    mandatory_report_fields.update({"summary", "status"})

                for field in mandatory_report_fields:
                    if field not in report:
                        return False
                    if field in {"report_type", "summary", "status"} and (not isinstance(report[field], str) or not report[field].strip()):
                        return False
                    if field == "report_data" and not isinstance(report[field], list):
                        return False
                # For POST, id is optional; for PUT, it must be non-None
                if not is_post and "id" in report and report["id"] is None:
                    return False

                # Check report_data
                report_data = report["report_data"]
                has_good_outcomes = False
                has_areas_of_concern = False
                for item in report_data:
                    if not isinstance(item, dict) or "question_type" not in item or "answers" not in item:
                        return False
                    if not isinstance(item["question_type"], str) or not item["question_type"].strip():
                        return False
                    if not isinstance(item["answers"], list) or not item["answers"] or not all(isinstance(a, str) and a.strip() for a in item["answers"]):
                        return False
                    if item["question_type"] == "Good Outcomes":
                        has_good_outcomes = True
                    if item["question_type"] == "Areas of Concern":
                        has_areas_of_concern = True
                if not (has_good_outcomes and has_areas_of_concern):
                    return False

            # Check for unexpected top-level fields
            valid_fields = {"student_id", "data", "common_summary", "common_status", "clinical_notes", "role_type", "role_name"}
            if any(k not in valid_fields for k in data):
                return False

            return True

        processed_records = []
        is_creation = False

        async with in_transaction():
            existing_records = await ClinicalRecomendations.filter(student_id=student_id).all()
            existing_reports_map = {record.report_type: record for record in existing_records}

            if not existing_records:
                is_creation = True

            # Logic to check for completeness of the final state of data
            final_reports_map = {
                record.report_type: {
                    "id": record.id,
                    "report_type": record.report_type,
                    "report_data": record.questions_data or [],
                    "summary": record.summary,
                    "status": record.status
                } for record in existing_records
            }
            # Update with incoming data
            for report in create_data["data"]:
                final_reports_map[report.get("report_type")] = {
                    "id": existing_reports_map.get(report.get("report_type"), type('obj', (object,), {'id': None})).id,
                    "report_type": report.get("report_type"),
                    "report_data": report.get("report_data", []),
                    "summary": report.get("summary"),
                    "status": report.get("status")
                }

            response_data_for_check = {
                "student_id": student_id,
                "data": list(final_reports_map.values()),
                "common_summary": create_data.get("common_summary"),
                "common_status": create_data.get("common_status"),
                "clinical_notes": create_data.get("clinical_notes"),
                "role_type": create_data.get("role_type", current_analyst.user_role),
                "role_name": create_data.get("role_name", current_analyst.user_role)
            }
            is_all_complete = is_response_complete(response_data_for_check, is_post=True)

            # Upsert logic for each report
            for report_data in create_data["data"]:
                report_type = report_data.get("report_type")
                if not report_type:
                    continue  # Skip reports without a type

                common_fields = {
                    "student": student,
                    "user_id": current_analyst.id,
                    "role_type": create_data.get("role_type", current_analyst.user_role),
                    "role_name": create_data.get("role_name", current_analyst.user_role),
                    "common_summary": create_data.get("common_summary"),
                    "common_status": create_data.get("common_status"),
                    "clinical_notes": create_data.get("clinical_notes"),
                    "analysis_status": is_all_complete,
                }

                report_specific_fields = {
                    "report_type": report_type,
                    "questions_data": report_data.get("report_data", []),
                    "summary": report_data.get("summary"),
                    "status": report_data.get("status"),
                }

                if report_type in existing_reports_map:
                    # UPDATE existing record
                    record_to_update = existing_reports_map[report_type]
                    update_data = {**common_fields, **report_specific_fields}

                    for key, value in update_data.items():
                        if value is not None:
                            setattr(record_to_update, key, value)

                    record_to_update.updated_at = datetime.utcnow()
                    record_to_update.updated_by = current_analyst.id
                    record_to_update.updated_user_role = current_analyst.user_role

                    await record_to_update.save()
                    processed_records.append(record_to_update)
                else:
                    # CREATE new record
                    creation_fields = {
                        "created_at": datetime.utcnow(),
                        "created_by": current_analyst.id,
                        "created_role": current_analyst.user_role,
                        "created_role_type": create_data.get("role_type", current_analyst.user_role),
                    }

                    all_fields = {**common_fields, **report_specific_fields, **creation_fields}

                    allowed_fields = set(ClinicalRecomendations._meta.fields_map.keys())
                    filtered_data = {k: v for k, v in all_fields.items() if k in allowed_fields and v is not None}

                    new_record = await ClinicalRecomendations.create(**filtered_data)
                    processed_records.append(new_record)

            # Update common fields and analysis_status for all records
            student_records_to_update = await ClinicalRecomendations.filter(student_id=student_id).all()
            for record in student_records_to_update:
                record.common_summary = create_data.get("common_summary", record.common_summary)
                record.common_status = create_data.get("common_status", record.common_status)
                record.clinical_notes = create_data.get("clinical_notes", record.clinical_notes)
                record.role_type = create_data.get("role_type", record.role_type or current_analyst.user_role)
                record.role_name = create_data.get("role_name", record.role_name or current_analyst.user_role)
                record.analysis_status = is_all_complete
                await record.save()

        if not processed_records:
            response_obj = StandardResponse(
                status=False,
                message="No valid reports were processed",
                data={},
                errors={"detail": "No clinical recommendations were created or updated"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Refresh records from DB to ensure all data is current
        final_records = await ClinicalRecomendations.filter(id__in=[r.id for r in processed_records]).all()

        data = {
            "student_id": student_id,
            "data": [
                {
                    "id": record.id,
                    "report_type": record.report_type,
                    "report_data": record.questions_data if record.questions_data else [],
                    "summary": record.summary,
                    "status": record.status
                } for record in final_records
            ],
            "common_summary": final_records[0].common_summary if final_records else "",
            "common_status": final_records[0].common_status if final_records else "",
            "clinical_notes": final_records[0].clinical_notes if final_records else "",
            "role_type": final_records[0].role_type if final_records else None,
            "role_name": final_records[0].role_name if final_records else None,
            "analysis_status": final_records[0].analysis_status
        }

        message = "Clinical recommendations created successfully" if is_creation else "Clinical recommendations updated successfully"
        status_code = status.HTTP_201_CREATED if is_creation else status.HTTP_200_OK

        response_obj = StandardResponse(
            status=True,
            message=message,
            data=data,
            errors={}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status_code)

    except ValueError as ve:
        response_obj = StandardResponse(
            status=False,
            message="Invalid data provided",
            data={},
            errors={"detail": str(ve)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        response_obj = StandardResponse(
            status=False,
            message="An unexpected error occurred",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

def is_response_complete(data, is_post=False):
    """Check if all mandatory report types and keys in the data dictionary are valid."""
    if data is None or not isinstance(data, dict):
        return False

    # Check top-level mandatory fields (only clinical_notes is mandatory)
    mandatory_fields = {"clinical_notes"}
    for field in mandatory_fields:
        if field not in data or not isinstance(data[field], str) or not data[field].strip():
            return False

    # Check optional common_summary and common_status
    for field in ["common_summary", "common_status"]:
        if field in data and (not isinstance(data[field], str) or not data[field].strip()):
            return False

    # Check optional role_type and role_name
    for field in ["role_type", "role_name"]:
        if field in data and (not isinstance(data[field], str) or not data[field].strip()):
            return False

    # Check student_id
    if "student_id" not in data or data["student_id"] is None:
        return False

    # Check for mandatory report types
    mandatory_reports = {
        "Physical Screening Report",
        "Lab Reports",
        "Nutrition Deficiency Report",
        "Questionnaire Reports"
    }
    if "data" not in data or not isinstance(data["data"], list) or not data["data"]:
        return False

    report_types = {report.get("report_type") for report in data["data"] if report.get("report_type")}
    if not mandatory_reports.issubset(report_types):
        return False

    # Validate each report
    for report in data["data"]:
        if not isinstance(report, dict):
            return False
        # Define report fields, excluding summary and status for specific report types
        mandatory_report_fields = {"report_type", "report_data"}
        if report.get("report_type") not in {"Questionnaire Reports", "Nutrition Deficiency Report"}:
            mandatory_report_fields.update({"summary", "status"})

        for field in mandatory_report_fields:
            if field not in report:
                return False
            if field in {"report_type", "summary", "status"} and (not isinstance(report[field], str) or not report[field].strip()):
                return False
            if field == "report_data" and not isinstance(report[field], list):
                return False
        # For POST, id is optional; for PUT, it must be non-None
        if not is_post and "id" in report and report["id"] is None:
            return False

        # Check report_data
        report_data = report["report_data"]
        has_good_outcomes = False
        has_areas_of_concern = False
        for item in report_data:
            if not isinstance(item, dict) or "question_type" not in item or "answers" not in item:
                return False
            if not isinstance(item["question_type"], str) or not item["question_type"].strip():
                return False
            if not isinstance(item["answers"], list) or not item["answers"] or not all(isinstance(a, str) and a.strip() for a in item["answers"]):
                return False
            if item["question_type"] == "Good Outcomes":
                has_good_outcomes = True
            if item["question_type"] == "Areas of Concern":
                has_areas_of_concern = True
        if not (has_good_outcomes and has_areas_of_concern):
            return False

    # Check for unexpected top-level fields
    valid_fields = {"student_id", "data", "common_summary", "common_status", "clinical_notes", "role_type", "role_name"}
    if any(k not in valid_fields for k in data):
        return False

    return True


@router.put("/nutritional-analyst", response_model=StandardResponse)
async def update_clinical_recommendations(update_data: dict, current_analyst: Any = Depends(get_current_analyst_user)):
    if isinstance(current_analyst, JSONResponse):
        return current_analyst

    try:
        if "data" not in update_data or not update_data["data"] or not isinstance(update_data["data"], list):
            response_obj = StandardResponse(
                status=False,
                message="No valid data provided for update",
                data={},
                errors={"detail": "The 'data' field must be a non-empty list"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        updated_records = []
        errors = []
        student_id = None

        def is_response_complete(data, is_post=False):
            """Check if all mandatory report types and keys in the data dictionary are valid."""
            if data is None or not isinstance(data, dict):
                return False

            # Check top-level mandatory fields (only clinical_notes is mandatory)
            mandatory_fields = {"clinical_notes"}
            for field in mandatory_fields:
                if field not in data or not isinstance(data[field], str) or not data[field].strip():
                    return False

            # Check optional common_summary and common_status
            for field in ["common_summary", "common_status"]:
                if field in data and (not isinstance(data[field], str) or not data[field].strip()):
                    return False

            # Check optional role_type and role_name
            for field in ["role_type", "role_name"]:
                if field in data and (not isinstance(data[field], str) or not data[field].strip()):
                    return False

            # Check student_id
            if "student_id" not in data or data["student_id"] is None:
                return False

            # Check for mandatory report types
            mandatory_reports = {
                "Physical Screening Report",
                "Lab Reports",
                "Nutrition Deficiency Report",
                "Questionnaire Reports"
            }
            if "data" not in data or not isinstance(data["data"], list) or not data["data"]:
                return False

            report_types = {report.get("report_type") for report in data["data"] if report.get("report_type")}
            if not mandatory_reports.issubset(report_types):
                return False

            # Validate each report
            for report in data["data"]:
                if not isinstance(report, dict):
                    return False
                # Define report fields, excluding summary and status for specific report types
                mandatory_report_fields = {"report_type", "report_data"}
                if report.get("report_type") not in {"Questionnaire Reports", "Nutrition Deficiency Report"}:
                    mandatory_report_fields.update({"summary", "status"})

                for field in mandatory_report_fields:
                    if field not in report:
                        return False
                    if field in {"report_type", "summary", "status"} and (not isinstance(report[field], str) or not report[field].strip()):
                        return False
                    if field == "report_data" and not isinstance(report[field], list):
                        return False
                # For POST, id is optional; for PUT, it must be non-None
                if not is_post and "id" in report and report["id"] is None:
                    return False

                # Check report_data
                report_data = report["report_data"]
                has_good_outcomes = False
                has_areas_of_concern = False
                for item in report_data:
                    if not isinstance(item, dict) or "question_type" not in item or "answers" not in item:
                        return False
                    if not isinstance(item["question_type"], str) or not item["question_type"].strip():
                        return False
                    if not isinstance(item["answers"], list) or not item["answers"] or not all(isinstance(a, str) and a.strip() for a in item["answers"]):
                        return False
                    if item["question_type"] == "Good Outcomes":
                        has_good_outcomes = True
                    if item["question_type"] == "Areas of Concern":
                        has_areas_of_concern = True
                if not (has_good_outcomes and has_areas_of_concern):
                    return False

            # Check for unexpected top-level fields
            valid_fields = {"student_id", "data", "common_summary", "common_status", "clinical_notes", "role_type", "role_name"}
            if any(k not in valid_fields for k in data):
                return False

            return True

        async with in_transaction():
            # Fetch student_id
            student_id = update_data.get("student_id")
            if not student_id:
                for report in update_data["data"]:
                    clinical_data = await ClinicalRecomendations.get_or_none(id=report.get("id")).prefetch_related("student")
                    if clinical_data and clinical_data.student:
                        student_id = clinical_data.student.id
                        break
                if not student_id:
                    response_obj = StandardResponse(
                        status=False,
                        message="Student ID not provided and could not be inferred",
                        data={},
                        errors={"detail": "Missing student_id"}
                    )
                    return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

            # Validate only the update_data for analysis_status
            is_all_complete = is_response_complete(update_data, is_post=False)

            # Fetch existing records for response
            existing_records = await ClinicalRecomendations.filter(student_id=student_id).all()
            response_data = {
                "student_id": student_id,
                "data": [
                    {
                        "id": record.id,
                        "report_type": record.report_type,
                        "report_data": record.questions_data or [],
                        "summary": record.summary,
                        "status": record.status
                    } for record in existing_records
                    if record.id not in [report.get("id") for report in update_data["data"]]
                ] + [
                    {
                        "id": report.get("id"),
                        "report_type": report.get("report_type"),
                        "report_data": report.get("report_data", []),
                        "summary": report.get("summary"),
                        "status": report.get("status")
                    } for report in update_data["data"]
                ],
                "common_summary": update_data.get("common_summary", existing_records[0].common_summary if existing_records else ""),
                "common_status": update_data.get("common_status", existing_records[0].common_status if existing_records else ""),
                "clinical_notes": update_data.get("clinical_notes", existing_records[0].clinical_notes if existing_records else ""),
                "role_type": update_data.get("role_type", existing_records[0].role_type if existing_records else current_analyst.user_role),
                "role_name": update_data.get("role_name", existing_records[0].role_name if existing_records else current_analyst.user_role),
                "analysis_status": is_all_complete
            }

            for report in update_data["data"]:
                report_id = report.get("id")
                clinical_data = None

                if report_id:
                    clinical_data = await ClinicalRecomendations.get_or_none(id=report_id).prefetch_related("student")

                # Fallback: look up by student_id + report_type if id is missing or not found
                if not clinical_data and student_id and report.get("report_type"):
                    clinical_data = await ClinicalRecomendations.filter(
                        student_id=student_id,
                        report_type__iexact=report.get("report_type").strip()
                    ).prefetch_related("student").first()

                if not clinical_data:
                    errors.append(f"Clinical recommendation not found for report_type '{report.get('report_type')}'")
                    continue

                if not isinstance(clinical_data, ClinicalRecomendations):
                    errors.append(f"Invalid data type for ID {report_id}, got {type(clinical_data)}")
                    continue

                if student_id is None and clinical_data.student:
                    student_id = clinical_data.student.id

                clinical_data.report_type = report.get("report_type", clinical_data.report_type)
                clinical_data.questions_data = report.get("report_data", clinical_data.questions_data) or []
                clinical_data.summary = report.get("summary", clinical_data.summary)
                clinical_data.status = report.get("status", clinical_data.status)
                clinical_data.role_type = update_data.get("role_type", clinical_data.role_type) or current_analyst.user_role
                clinical_data.role_name = update_data.get("role_name", clinical_data.role_name) or current_analyst.user_role
                clinical_data.updated_at = datetime.utcnow()
                clinical_data.updated_by = current_analyst.id
                clinical_data.updated_user_role = current_analyst.user_role
                clinical_data.created_role_type = update_data.get("role_type", clinical_data.created_role_type) or current_analyst.role_type
                clinical_data.analysis_status = is_all_complete

                await clinical_data.save()
                updated_records.append(clinical_data)

            if student_id and any(key in update_data for key in ["common_summary", "common_status", "clinical_notes"]):
                student_records = await ClinicalRecomendations.filter(student_id=student_id).all()
                if student_records:
                    update_fields = {}
                    if "common_summary" in update_data:
                        update_fields["common_summary"] = update_data["common_summary"]
                    if "common_status" in update_data:
                        update_fields["common_status"] = update_data["common_status"]
                    if "clinical_notes" in update_data:
                        update_fields["clinical_notes"] = update_data["clinical_notes"]
                    if update_fields:
                        update_fields["updated_by"] = current_analyst.id
                        update_fields["updated_user_role"] = current_analyst.user_role
                        update_fields["updated_at"] = datetime.utcnow()
                        update_fields["analysis_status"] = is_all_complete
                        for record in student_records:
                            for key, value in update_fields.items():
                                setattr(record, key, value)
                            await record.save()
                    updated_records = await ClinicalRecomendations.filter(id__in=[r.id for r in updated_records]).all()

        if not updated_records and errors:
            response_obj = StandardResponse(
                status=False,
                message="Failed to update any clinical recommendations",
                data={},
                errors={"details": errors}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        data = {
            "student_id": student_id,
            "data": [
                {
                    "id": record.id,
                    "report_type": record.report_type,
                    "report_data": record.questions_data or [],
                    "summary": record.summary,
                    "status": record.status
                } for record in updated_records
            ],
            "common_summary": updated_records[0].common_summary if updated_records else "",
            "common_status": updated_records[0].common_status if updated_records else "",
            "clinical_notes": updated_records[0].clinical_notes if updated_records else "",
            "role_type": updated_records[0].role_type if updated_records else None,
            "role_name": updated_records[0].role_name if updated_records else None,
            "analysis_status": is_all_complete
        }

        response_obj = StandardResponse(
            status=True,
            message="Clinical recommendations updated successfully",
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
            message="Failed to update clinical recommendations",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    