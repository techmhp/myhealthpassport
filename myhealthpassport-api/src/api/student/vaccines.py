from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse


from src.core.manager import get_current_user
from src.models.other_models import StudentVaccination, Vaccinations
from src.models.student_models import  Students
from src.utils.calculator import calculate_age_string
from src.utils.response import StandardResponse

from . import router
from .schema import VaccineStatusUpdateRequest


import re

def extract_age_for_sorting(age_string):
    """
    Extract numeric value from age string for proper sorting.
    Handles formats like: "Birth", "At Birth", "6 Weeks", "9 Months", "4-6 Years", "9-14 Years", "10-12 Years"
    """
    # Handle birth-related strings
    if age_string in ["Birth", "At Birth"]:
        return 0
    
    # Extract first number from the string
    match = re.search(r'\d+', age_string)
    if match:
        numeric_value = int(match.group())
        
        # Convert to months for consistent comparison
        if "Week" in age_string:
            return numeric_value / 4.33  # weeks to months
        elif "Month" in age_string:
            return numeric_value
        elif "Year" in age_string:
            return numeric_value * 12  # years to months
    
    return float('inf')  # Put unknown formats at the end

# Add these imports at the top
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ===================================================================
# MODIFIED: GET VACCINATION STATUS (with Academic Year Filter)
# ===================================================================
@router.get("/student/vaccination-status/{student_id}", response_model=StandardResponse)
async def get_vaccination_status(
    student_id: str,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user: dict = Depends(get_current_user)
):
    # Fetch Student Details
    student = await Students.get_or_none(id=student_id)
    if student is None:
        response_obj = StandardResponse(
            status=False,
            message=f"Student with ID {student_id} not found",
            errors={"detail": "Student not found"}
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

    # Fetch List of all available Vaccines from DB
    all_vaccines_in_system = await Vaccinations.all().values("vaccine_id", "vaccine_name", "age")

    # Ensure a StudentVaccination record exists for every vaccine type for this student
    for vaccine_ref_data in all_vaccines_in_system:
        # Check with academic year filter
        student_vaccine_record = await StudentVaccination.filter(
            year_filter,
            student_id=student.id,
            vaccine_id=vaccine_ref_data["vaccine_id"]
        ).first()

        if student_vaccine_record is None:
            vaccine_instance_to_link = await Vaccinations.get_or_none(vaccine_id=vaccine_ref_data["vaccine_id"])

            if vaccine_instance_to_link:
                new_student_vaccination_entry = StudentVaccination(
                    student=student,
                    vaccine=vaccine_instance_to_link,
                    status=False
                )
                await new_student_vaccination_entry.save()
                print(f"Created placeholder vaccination record for student {student_id}, vaccine {vaccine_instance_to_link.vaccine_name}")
            else:
                print(f"Warning: Vaccine with ID {vaccine_ref_data['vaccine_id']} was in initial list but not found for linking.")

    # Fetch all vaccination records for the student with academic year filter
    student_vaccination_records_list = await StudentVaccination.filter(
        year_filter,
        student=student
    ).all().values(
        "sv_id",
        "status",
        "student_id",
        "vaccine__vaccine_id",
        "vaccine__vaccine_name",
        "vaccine__age"
    )

    # Reformat the data for the response
    formatted_vaccination_statuses = {}
    if student_vaccination_records_list:
        for record_data in student_vaccination_records_list:
            age_key = record_data["vaccine__age"]
            vaccine_data = {
                "sv_id": record_data["sv_id"],
                "vaccine_id": record_data["vaccine__vaccine_id"],
                "vaccine_name": record_data["vaccine__vaccine_name"],
                "vaccine_recommended_age": record_data["vaccine__age"],
                "status": record_data["status"]
            }
            
            if age_key in formatted_vaccination_statuses:
                formatted_vaccination_statuses[age_key].append(vaccine_data)
            else:
                formatted_vaccination_statuses[age_key] = [vaccine_data]

    # Sort by age using custom sorting function
    reformatted_vaccination_statuses = []
    sorted_age_keys = sorted(formatted_vaccination_statuses.keys(), key=extract_age_for_sorting)
    
    for age_key in sorted_age_keys:
        vc = {
            "vaccine_id": age_key,
            "vaccine_data": formatted_vaccination_statuses[age_key],
        }
        reformatted_vaccination_statuses.append(vc)

    # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
    data_dict = {
        "status": True,
        "message": "Student Vaccination Details",
        "data": {
            "vaccination_statuses": reformatted_vaccination_statuses,
            "student_details": {
                "studnet_id": student.id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "middle_name": student.middle_name,
                "age": calculate_age_string(student.dob),
                "blood_group": student.blood_group,
                "gender": student.gender
            }
        },  # ← Same format as original
        "errors": {},
    }

    response_obj = StandardResponse(**data_dict)
    json_response = JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)
    json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
    return json_response


# @router.get("/student/vaccination-status/{student_id}", response_model=StandardResponse)
# async def get_vaccination_status(
#         student_id: str, current_user: dict = Depends(get_current_user)
# ):
#     # Fetch Student Details
#     student = await Students.get_or_none(id=student_id)
#     if student is None:
#         response_obj = StandardResponse(
#             status=False,
#             message=f"Student with ID {student_id} not found",
#             errors={"detail": "Student not found"}
#         )
#         return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Fetch List of all available Vaccines from DB
#     all_vaccines_in_system = await Vaccinations.all().values("vaccine_id", "vaccine_name", "age")

#     # Ensure a StudentVaccination record exists for every vaccine type for this student
#     for vaccine_ref_data in all_vaccines_in_system:
#         student_vaccine_record = await StudentVaccination.filter(
#             student_id=student.id,
#             vaccine_id=vaccine_ref_data["vaccine_id"]
#         ).first()

#         if student_vaccine_record is None:
#             vaccine_instance_to_link = await Vaccinations.get_or_none(vaccine_id=vaccine_ref_data["vaccine_id"])

#             if vaccine_instance_to_link:
#                 new_student_vaccination_entry = StudentVaccination(
#                     student=student,
#                     vaccine=vaccine_instance_to_link,
#                     status=False
#                 )
#                 await new_student_vaccination_entry.save()
#                 print(f"Created placeholder vaccination record for student {student_id}, vaccine {vaccine_instance_to_link.vaccine_name}")
#             else:
#                 print(f"Warning: Vaccine with ID {vaccine_ref_data['vaccine_id']} was in initial list but not found for linking.")

#     # Fetch all vaccination records for the student
#     student_vaccination_records_list = await StudentVaccination.filter(student=student).all().values(
#         "sv_id",
#         "status",
#         "student_id",
#         "vaccine__vaccine_id",
#         "vaccine__vaccine_name",
#         "vaccine__age"
#     )

#     # Reformat the data for the response
#     formatted_vaccination_statuses = {}
#     if student_vaccination_records_list:
#         for record_data in student_vaccination_records_list:
#             age_key = record_data["vaccine__age"]
#             vaccine_data = {
#                 "sv_id": record_data["sv_id"],
#                 "vaccine_id": record_data["vaccine__vaccine_id"],
#                 "vaccine_name": record_data["vaccine__vaccine_name"],
#                 "vaccine_recommended_age": record_data["vaccine__age"],
#                 "status": record_data["status"]
#             }
            
#             if age_key in formatted_vaccination_statuses:
#                 formatted_vaccination_statuses[age_key].append(vaccine_data)
#             else:
#                 formatted_vaccination_statuses[age_key] = [vaccine_data]

#     # Sort by age using custom sorting function
#     reformatted_vaccination_statuses = []
#     sorted_age_keys = sorted(formatted_vaccination_statuses.keys(), key=extract_age_for_sorting)
    
#     for age_key in sorted_age_keys:
#         vc = {
#             "vaccine_id": age_key,
#             "vaccine_data": formatted_vaccination_statuses[age_key],
#         }
#         reformatted_vaccination_statuses.append(vc)

#     data_dict = {
#         "status": True,
#         "message": "Student Vaccination Details",
#         "data": {
#             "vaccination_statuses": reformatted_vaccination_statuses,
#             "student_details": {
#                 "studnet_id": student.id,
#                 "first_name": student.first_name,
#                 "last_name": student.last_name,
#                 "middle_name": student.middle_name,
#                 "age": calculate_age_string(student.dob),
#                 "blood_group": student.blood_group,
#                 "gender": student.gender
#             }
#         },
#         "errors": {},
#     }

#     response_obj = StandardResponse(**data_dict)
#     return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)

@router.put("/student/vaccination-status/{student_id}", response_model=StandardResponse)
async def update_vaccination_status(
        student_id: str,
        payload: dict = VaccineStatusUpdateRequest,
        current_user: dict = Depends(get_current_user)
):
    # Fetch Student Details
    student = await Students.get_or_none(id=student_id)
    if student is None:
        response_obj = StandardResponse(
            status=False,
            message=f"Student with ID {student_id} not found",
            errors={"detail": "Student not found"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)


    for vaccine in payload["vaccine_data"]:
        student_vaccine = await StudentVaccination.get(student=student, sv_id=vaccine["sv_id"])
        student_vaccine.status = vaccine["status"]
        student_vaccine.updated_by = current_user["user_id"]
        student_vaccine.updated_role = current_user["user_role"]
        student_vaccine.updated_role_type = current_user["role_type"]
        await student_vaccine.save()

        print(vaccine)


    data_dict = {
        "status": True,
        "message": "Student Vaccination Updated",
        "data": {},
        "errors": {},
    }

    response_obj = StandardResponse(**data_dict)
    return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)



