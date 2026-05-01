from fastapi import Depends, APIRouter, status, Query
from fastapi.responses import JSONResponse
from src.utils.response import StandardResponse
from src.core.manager import get_current_user
from src.models.consultation_models import MedicalScreeningStatus
from src.models.student_models import Students, SchoolStudents
from src.models.school_models import Schools
from src.models.user_models import (
    AnalystTeam, AnalystRoles, Parents, ParentRoles, SchoolStaff, SchoolRoles,
    AdminTeamRoles, OnGroundTeamRoles, ScreeningTeamRoles,ScreeningTeam,AnalystTeam, ConsultantRoles
)
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

from datetime import datetime
from typing import List, Optional, Any
from tortoise.transactions import in_transaction
from . import router

# Medical Officer Status Types
MEDICAL_OFFICER_STATUS_TYPES = [
    "physical_screening_status",
    "nutritional_report_status", 
    "psychological_report_status",
    "vision_screening_status",
    "dental_screening_status",
    "lab_report_status"
]

# Allowed status values
ALLOWED_STATUS_VALUES = ["not_verified", "remarks", "verified"]


async def get_current_medical_officer(user: dict = Depends(get_current_user)):
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
    
    # Include all roles from get_current_authorized_user plus MEDICAL_OFFICER
    allowed_roles = ["PARENT", "ANALYST_TEAM", "SCREENING_TEAM"]
    
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

    elif role_type == "SCREENING_TEAM":
        if role_to_check not in [role.value for role in ScreeningTeamRoles] and role_to_check != "MEDICAL_OFFICER":
            response_obj = StandardResponse(
                status=False,
                message="Invalid screening team role",
                errors={"detail": f"Invalid user_role: {role_to_check}. Allowed roles: {[role.value for role in ScreeningTeamRoles] + ['MEDICAL_OFFICER']}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)
        
        screening_team = await ScreeningTeam.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
        if not screening_team:
            # Check AnalystTeam for overlapping roles (e.g., MEDICAL_OFFICER, PSYCHOLOGIST, NUTRITIONIST)
            analyst_team = await AnalystTeam.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
            if analyst_team:
                return analyst_team
            existing_roles = await ScreeningTeam.filter(id=user["user_id"]).values_list("user_role", flat=True)
            response_obj = StandardResponse(
                status=False,
                message="Screening team member not found",
                errors={"detail": f"No screening team member found for user_id: {user['user_id']} with user_role: {role_to_check}. Existing roles: {existing_roles or 'None'}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return screening_team

    elif role_type == "ANALYST_TEAM":
        if role_to_check not in [role.value for role in AnalystRoles] and role_to_check != "MEDICAL_OFFICER":
            response_obj = StandardResponse(
                status=False,
                message="Invalid analyst team role",
                errors={"detail": f"Invalid user_role: {role_to_check}. Allowed roles: {[role.value for role in AnalystRoles] + ['MEDICAL_OFFICER']}"}
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

    response_obj = StandardResponse(
        status=False,
        message="User not found",
        errors={"detail": "User not found"}
    )
    return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

# @router.get("/medical-screening-status/{student_id}", response_model=StandardResponse)
# async def get_medical_screening_status(
#     student_id: int,
#     current_medical_officer: Any = Depends(get_current_medical_officer)
# ):
#     """Get medical screening status records for a student"""
#     if isinstance(current_medical_officer, JSONResponse):
#         return current_medical_officer

#     try:
#         # Validate student exists
#         student = await Students.get_or_none(id=student_id, is_deleted=False)
#         if not student:
#             response_obj = StandardResponse(
#                 status=False,
#                 message=f"Student with ID {student_id} not found",
#                 data={},
#                 errors={"detail": f"No student found for ID {student_id}"}
#             )
#             return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#         # Get existing medical screening status records
#         existing_records = await MedicalScreeningStatus.filter(
#             student_id=student_id,
#             is_deleted=False
#         ).prefetch_related('school').all()

#         # Create a dictionary to map status types to records
#         status_records = {record.medical_officer_status_type: record for record in existing_records}

#         # Prepare response data with all required status types
#         medical_status_data = []
#         for status_type in MEDICAL_OFFICER_STATUS_TYPES:
#             if status_type in status_records:
#                 record = status_records[status_type]
#                 medical_status_data.append({
#                     "id": record.id,
#                     "medical_officer_status_type": record.medical_officer_status_type,
#                     "status": record.status,
#                     "remarks": record.remarks,
#                     "school_id": record.school.school_id if record.school else None,
#                     "created_at": record.created_at.isoformat() if record.created_at else None,
#                     "updated_at": record.updated_at.isoformat() if record.updated_at else None
#                 })
#             else:
#                 # Return default structure for missing records
#                 medical_status_data.append({
#                     "id": None,
#                     "medical_officer_status_type": status_type,
#                     "status": "not_verified",
#                     "remarks": "",
#                     "school_id": None,
#                     "created_at": None,
#                     "updated_at": None
#                 })

#         data = {
#             "student_id": student_id,
#             "medical_screening_statuses": medical_status_data
#         }

#         response_obj = StandardResponse(
#             status=True,
#             message="Medical screening status retrieved successfully",
#             data=data,
#             errors={}
#         )
#         return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)

#     except Exception as e:
#         response_obj = StandardResponse(
#             status=False,
#             message="Failed to retrieve medical screening status",
#             data={},
#             errors={"detail": str(e)}
#         )
#         return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===================================================================
# MODIFIED: GET MEDICAL SCREENING STATUS (with Academic Year Filter)
# ===================================================================
@router.get("/medical-screening-status/{student_id}", response_model=StandardResponse)
async def get_medical_screening_status(
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_medical_officer: Any = Depends(get_current_medical_officer)
):
    """Get medical screening status records for a student"""
    if isinstance(current_medical_officer, JSONResponse):
        return current_medical_officer

    try:
        # Validate student exists
        student = await Students.get_or_none(id=student_id, is_deleted=False)
        if not student:
            response_obj = StandardResponse(
                status=False,
                message=f"Student with ID {student_id} not found",
                data={},
                errors={"detail": f"No student found for ID {student_id}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

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

        # Get existing medical screening status records with academic year filter
        existing_records = await MedicalScreeningStatus.filter(
            year_filter,
            student_id=student_id,
            is_deleted=False
        ).prefetch_related('school').all()

        # Fallback: records saved today are outside the year filter range
        if not existing_records:
            existing_records = await MedicalScreeningStatus.filter(
                student_id=student_id,
                is_deleted=False
            ).prefetch_related('school').all()

        # Create a dictionary to map status types to records
        status_records = {record.medical_officer_status_type: record for record in existing_records}

        # Prepare response data with all required status types
        medical_status_data = []
        for status_type in MEDICAL_OFFICER_STATUS_TYPES:
            if status_type in status_records:
                record = status_records[status_type]
                medical_status_data.append({
                    "id": record.id,
                    "medical_officer_status_type": record.medical_officer_status_type,
                    "status": record.status,
                    "remarks": record.remarks,
                    "school_id": record.school.school_id if record.school else None,
                    "created_at": record.created_at.isoformat() if record.created_at else None,
                    "updated_at": record.updated_at.isoformat() if record.updated_at else None
                })
            else:
                # Return default structure for missing records
                medical_status_data.append({
                    "id": None,
                    "medical_officer_status_type": status_type,
                    "status": "not_verified",
                    "remarks": "",
                    "school_id": None,
                    "created_at": None,
                    "updated_at": None
                })

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        data = {
            "student_id": student_id,
            "medical_screening_statuses": medical_status_data
        }

        response_obj = StandardResponse(
            status=True,
            message="Medical screening status retrieved successfully",
            data=data,  # ← Same format as original
            errors={}
        )
        
        json_response = JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)
        json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return json_response

    except Exception as e:
        response_obj = StandardResponse(
            status=False,
            message="Failed to retrieve medical screening status",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)



@router.put("/medical-screening-status", response_model=StandardResponse)
async def update_medical_screening_status(
    request_data: dict,
    current_medical_officer: Any = Depends(get_current_medical_officer)
):
    """Update medical screening status records for a student"""
    if isinstance(current_medical_officer, JSONResponse):
        return current_medical_officer

    try:
        # Validate request data
        student_id = request_data.get("student_id")
        school_id = request_data.get("school_id")
        
        if not student_id or not isinstance(student_id, int):
            response_obj = StandardResponse(
                status=False,
                message="Student ID is required and must be an integer",
                data={},
                errors={"detail": "Missing or invalid student_id"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        if not school_id or not isinstance(school_id, int):
            response_obj = StandardResponse(
                status=False,
                message="School ID is required and must be an integer",
                data={},
                errors={"detail": "Missing or invalid school_id"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Validate student exists
        student = await Students.get_or_none(id=student_id, is_deleted=False)
        if not student:
            response_obj = StandardResponse(
                status=False,
                message=f"Student with ID {student_id} not found",
                data={},
                errors={"detail": f"No student found for ID {student_id}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        # Validate school exists
        school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
        if not school:
            response_obj = StandardResponse(
                status=False,
                message=f"School with ID {school_id} not found",
                data={},
                errors={"detail": f"No school found for ID {school_id}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        # Handle medical_screening_statuses data - accept both dict and list formats
        medical_statuses_raw = request_data.get("medical_screening_statuses")
        if not medical_statuses_raw:
            response_obj = StandardResponse(
                status=False,
                message="Medical screening statuses are required",
                data={},
                errors={"detail": "medical_screening_statuses is required"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Convert single dict to list for uniform processing
        if isinstance(medical_statuses_raw, dict):
            medical_statuses = [medical_statuses_raw]
        elif isinstance(medical_statuses_raw, list):
            medical_statuses = medical_statuses_raw
        else:
            response_obj = StandardResponse(
                status=False,
                message="Invalid medical screening statuses format",
                data={},
                errors={"detail": "medical_screening_statuses must be a dictionary or list of dictionaries"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Validate each status entry
        for status_entry in medical_statuses:
            if not isinstance(status_entry, dict):
                response_obj = StandardResponse(
                    status=False,
                    message="Invalid status entry format",
                    data={},
                    errors={"detail": "Each status entry must be a dictionary"}
                )
                return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

            status_type = status_entry.get("medical_officer_status_type")
            status_value = status_entry.get("status")

            # Validate status type
            if status_type not in MEDICAL_OFFICER_STATUS_TYPES:
                response_obj = StandardResponse(
                    status=False,
                    message=f"Invalid medical officer status type: {status_type}",
                    data={},
                    errors={"detail": f"Allowed status types: {MEDICAL_OFFICER_STATUS_TYPES}"}
                )
                return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

            # Validate status value
            if status_value not in ALLOWED_STATUS_VALUES:
                response_obj = StandardResponse(
                    status=False,
                    message=f"Invalid status value: {status_value}",
                    data={},
                    errors={"detail": f"Allowed status values: {ALLOWED_STATUS_VALUES}"}
                )
                return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        created_records = []
        updated_records = []
        errors = []

        async with in_transaction():
            # Get existing records
            existing_records = await MedicalScreeningStatus.filter(
                student_id=student_id,
                is_deleted=False
            ).all()
            
            # Create a mapping of existing records by status type
            existing_by_type = {
                record.medical_officer_status_type: record 
                for record in existing_records
            }

            for status_entry in medical_statuses:
                status_type = status_entry.get("medical_officer_status_type")
                status_value = status_entry.get("status", "not_verified")
                remarks = status_entry.get("remarks", "")

                try:
                    if status_type in existing_by_type:
                        # Update existing record
                        existing_record = existing_by_type[status_type]
                        existing_record.status = status_value
                        existing_record.remarks = remarks
                        existing_record.updated_by = current_medical_officer.id
                        existing_record.updated_user_role = current_medical_officer.user_role
                        existing_record.updated_role_type = "ANALYST_TEAM"
                        
                        await existing_record.save()
                        updated_records.append(existing_record)
                    else:
                        # Create new record
                        creation_data = {
                            "student": student,
                            "school": school,
                            "medical_officer_status_type": status_type,
                            "status": status_value,
                            "remarks": remarks,
                            "created_at": datetime.utcnow(),
                            "created_by": current_medical_officer.id,
                            "created_user_role": current_medical_officer.user_role,
                            "created_role_type": "ANALYST_TEAM"
                        }
                        
                        new_record = await MedicalScreeningStatus.create(**creation_data)
                        created_records.append(new_record)

                except Exception as e:
                    errors.append(f"Failed to process {status_type}: {str(e)}")

        # Prepare response data
        all_records = created_records + updated_records
        if not all_records and errors:
            response_obj = StandardResponse(
                status=False,
                message="Failed to create or update medical screening status",
                data={},
                errors={"details": errors}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Get fresh data from database for response
        final_records = await MedicalScreeningStatus.filter(
            student_id=student_id,
            is_deleted=False
        ).prefetch_related('school').all()

        medical_status_data = []
        status_records = {record.medical_officer_status_type: record for record in final_records}

        for status_type in MEDICAL_OFFICER_STATUS_TYPES:
            if status_type in status_records:
                record = status_records[status_type]
                medical_status_data.append({
                    "id": record.id,
                    "medical_officer_status_type": record.medical_officer_status_type,
                    "status": record.status,
                    "remarks": record.remarks,
                    "school_id": record.school.school_id if record.school else None,
                    "created_at": record.created_at.isoformat() if record.created_at else None,
                    "updated_at": record.updated_at.isoformat() if record.updated_at else None
                })
            else:
                medical_status_data.append({
                    "id": None,
                    "medical_officer_status_type": status_type,
                    "status": "not_verified",
                    "remarks": "",
                    "school_id": school_id,
                    "created_at": None,
                    "updated_at": None
                })

        data = {
            "student_id": student_id,
            "school_id": school_id,
            "medical_screening_statuses": medical_status_data,
            "created_count": len(created_records),
            "updated_count": len(updated_records)
        }

        message = "Medical screening status created successfully" if created_records and not updated_records else \
                 "Medical screening status updated successfully" if updated_records and not created_records else \
                 "Medical screening status created and updated successfully"

        response_obj = StandardResponse(
            status=True,
            message=message,
            data=data,
            errors={"details": errors} if errors else {}
        )
        
        status_code = status.HTTP_201_CREATED if created_records else status.HTTP_200_OK
        return JSONResponse(content=response_obj.__dict__, status_code=status_code)

    except Exception as e:
        response_obj = StandardResponse(
            status=False,
            message="Failed to create or update medical screening status",
            data={},
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

