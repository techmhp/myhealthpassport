from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse


from src.core.manager import get_current_user
from src.models.other_models import StudentVaccination, Vaccinations
from src.models.student_models import  Students
from src.utils.calculator import calculate_age_string
from src.utils.response import StandardResponse

from . import router
from .schema import VaccineStatusUpdateRequest


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
#         # Check if a record already exists for this student and this specific vaccine
#         student_vaccine_record = await StudentVaccination.filter(
#             student_id=student.id,  # Use student_id for filtering
#             vaccine_id=vaccine_ref_data["vaccine_id"]  # Use vaccine_id for filtering
#         ).first()

#         # If Student Doesn't Have a Vaccination Record for this particular vaccine, create one
#         if student_vaccine_record is None:
#             # Fetch the actual Vaccine model instance to link
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

#     # Fetch all vaccination records for the student, including details from the related Vaccine model
#     student_vaccination_records_list = await StudentVaccination.filter(student=student).all().values(
#         "sv_id",
#         "status",
#         "student_id",
#         "vaccine__vaccine_id",
#         "vaccine__vaccine_name",
#         "vaccine__age"
#     )

#     # Reformat the data for the response
#     # The original code used 'result' for the list.
#     # The key in the response was "student_details", which might be confusing.
#     # Let's call the list 'vaccination_statuses' for clarity in the final response.

#     formatted_vaccination_statuses = {}
#     if student_vaccination_records_list:
#         for record_data in student_vaccination_records_list:
#             if record_data["vaccine__age"] in formatted_vaccination_statuses.keys():
#                 formatted_vaccination_statuses[record_data["vaccine__age"]].append({
#                     "sv_id": record_data["sv_id"],
#                     "vaccine_id": record_data["vaccine__vaccine_id"],
#                     "vaccine_name": record_data["vaccine__vaccine_name"],
#                     "vaccine_recommended_age": record_data["vaccine__age"],
#                     "status": record_data["status"]
#                 })
#             else:
#                 formatted_vaccination_statuses[record_data["vaccine__age"]] = [{
#                         "sv_id": record_data["sv_id"],
#                         "vaccine_id": record_data["vaccine__vaccine_id"],
#                         "vaccine_name": record_data["vaccine__vaccine_name"],
#                         "vaccine_recommended_age": record_data["vaccine__age"],
#                         "status": record_data["status"]
#                     }
#                 ]

#     reformatted_vaccination_statuses = []
#     for key, value in formatted_vaccination_statuses.items():
#         vc = {
#             "vaccine_id": key,
#             "vaccine_data": value,
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


@router.get("/student/vaccination-status/{student_id}", response_model=StandardResponse)
async def get_vaccination_status(
        student_id: str, current_user: dict = Depends(get_current_user)
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

    # Fetch List of all available Vaccines from DB
    all_vaccines_in_system = await Vaccinations.all().values("vaccine_id", "vaccine_name", "age")

    # Ensure a StudentVaccination record exists for every vaccine type for this student
    for vaccine_ref_data in all_vaccines_in_system:
        student_vaccine_record = await StudentVaccination.filter(
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

    # Fetch all vaccination records for the student
    student_vaccination_records_list = await StudentVaccination.filter(student=student).all().values(
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
        },
        "errors": {},
    }

    response_obj = StandardResponse(**data_dict)
    return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)

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




"""
@router.post("/update-vaccination-status", response_model=StandardResponse)
async def update_vaccination_status(
    updates: List[StudentVaccinationUpdate],
    user: dict[] = Depends(get_current_user)
):
    if isinstance(current_parent, StandardResponse):
        return current_parent

    try:
        # Validate that all updates belong to the same student
        student_ids = {update.student_id for update in updates if update.student_id is not None}
        if len(student_ids) > 1:
            return StandardResponse(
                status=False,
                message="All updates must belong to the same student",
                errors={"detail": "Multiple student IDs provided"}
            )

        student_id = student_ids.pop() if student_ids else None
        if not student_id:
            return StandardResponse(
                status=False,
                message="Student ID must be provided in at least one update",
                errors={"detail": "Student ID missing"}
            )

        # Verify the student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            return StandardResponse(
                status=False,
                message=f"Student with ID {student_id} not found",
                errors={"detail": "Student not found"}
            )

        # Check if the student is associated with the parent
        parent_child = await ParentChildren.filter(
            parent_id=current_parent.id,
            student_id=student_id,
            status=True
        ).first()
        if not parent_child:
            valid_students = await ParentChildren.filter(parent_id=current_parent.id, status=True).values_list("student_id", flat=True)
            return StandardResponse(
                status=False,
                message=f"You are not authorized to update vaccinations for student ID {student_id}. Valid student IDs: {valid_students or 'None'}",
                errors={"detail": "Unauthorized access"}
            )

        # Validate vaccine IDs
        vaccine_ids = {update.vaccine_id for update in updates if update.vaccine_id is not None}
        if not vaccine_ids:
            return StandardResponse(
                status=False,
                message="At least one vaccine ID must be provided",
                errors={"detail": "Vaccine ID missing"}
            )

        valid_vaccines = await Vaccinations.filter(vaccine_id__in=vaccine_ids).values_list("vaccine_id", flat=True)
        invalid_vaccines = vaccine_ids - set(valid_vaccines)
        if invalid_vaccines:
            return StandardResponse(
                status=False,
                message=f"Invalid vaccine IDs: {invalid_vaccines}",
                errors={"detail": "Invalid vaccine IDs"}
            )

        # Update or create vaccination records in a transaction
        updated_vaccinations = []
        async with in_transaction():
            for update in updates:
                if update.vaccine_id is None or update.status is None:
                    continue  # Skip incomplete updates
                # Check if record exists, fetching related vaccine data
                student_vaccination = await StudentVaccination.get_or_none(
                    student_id=student_id,
                    vaccine_id=update.vaccine_id
                ).select_related("vaccine")
                if student_vaccination:
                    # Update existing record
                    student_vaccination.status = update.status
                    await student_vaccination.save()
                else:
                    # Create new record
                    student_vaccination = await StudentVaccination.create(
                        student_id=student_id,
                        vaccine_id=update.vaccine_id,
                        status=update.status
                    )
                    # Re-fetch with related vaccine data to include age and vaccine_name
                    student_vaccination = await StudentVaccination.get(
                        sv_id=student_vaccination.sv_id
                    ).select_related("vaccine")
                # Manually construct the response dictionary for updated vaccinations
                updated_vaccinations.append({
                    "sv_id": student_vaccination.sv_id,
                    "student_id": student_vaccination.student_id,
                    "vaccine_id": student_vaccination.vaccine_id,
                    "status": student_vaccination.status,
                    "age": student_vaccination.vaccine.age,
                    "vaccine_name": student_vaccination.vaccine.vaccine_name
                })

        # Fetch all vaccinations for the student
        all_student_vaccinations = await StudentVaccination.filter(
            student_id=student_id
        ).select_related("vaccine")
        
        # Construct the list of all vaccinations for the student
        all_vaccinations = [
            {
                "sv_id": sv.sv_id,
                "student_id": sv.student_id,
                "vaccine_id": sv.vaccine_id,
                "status": sv.status,
                "age": sv.vaccine.age,
                "vaccine_name": sv.vaccine.vaccine_name
            }
            for sv in all_student_vaccinations
        ]

        return StandardResponse(
            status=True,
            message="Vaccination statuses updated successfully",
            data={
                "updated_vaccinations": updated_vaccinations,
                "all_vaccinations": all_vaccinations
            }
        )

    except DoesNotExist:
        return StandardResponse(
            status=False,
            message="Internal database error",
            errors={"detail": "Database error"}
        )
    except Exception as e:
        return StandardResponse(
            status=False,
            message=f"An unexpected error occurred: {str(e)}",
            errors={"detail": str(e)}
        )
         
@router.get("/vaccination-status/{student_id}", response_model=StandardResponse)
async def get_vaccination_status(
    student_id: int,
    current_parent: Any = Depends(get_current_parent)
):
    if isinstance(current_parent, StandardResponse):
        return current_parent

    try:
        # Verify the student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            return StandardResponse(
                status=False,
                message=f"Student with ID {student_id} not found",
                errors={"detail": "Student not found"}
            )

        # Check if the student is associated with the parent
        parent_child = await ParentChildren.filter(
            parent_id=current_parent.id,
            student_id=student_id,
            status=True
        ).first()
        if not parent_child:
            valid_students = await ParentChildren.filter(parent_id=current_parent.id, status=True).values_list("student_id", flat=True)
            return StandardResponse(
                status=False,
                message=f"You are not authorized to view vaccination status for student ID {student_id}. Valid student IDs: {valid_students or 'None'}",
                errors={"detail": "Unauthorized access"}
            )

        # Define the vaccination schedule
        vaccination_schedule = [
            {"vaccine_name": "BCG", "age": "At Birth"},
            {"vaccine_name": "Hepatitis B (1st dose)", "age": "At Birth"},
            {"vaccine_name": "OPV (Oral Polio)", "age": "At Birth"},
            {"vaccine_name": "DTP (1st dose)", "age": "6 Weeks"},
            {"vaccine_name": "IPV (1st dose)", "age": "6 Weeks"},
            {"vaccine_name": "Hepatitis B (2nd dose)", "age": "6 Weeks"},
            {"vaccine_name": "Hib (1st dose)", "age": "6 Weeks"},
            {"vaccine_name": "Rotavirus (1st dose)", "age": "6 Weeks"},
            {"vaccine_name": "PCV (1st dose)", "age": "6 Weeks"},
            {"vaccine_name": "DTP (2nd dose)", "age": "10 Weeks"},
            {"vaccine_name": "IPV (2nd dose)", "age": "10 Weeks"},
            {"vaccine_name": "Hib (2nd dose)", "age": "10 Weeks"},
            {"vaccine_name": "Rotavirus (2nd dose)", "age": "10 Weeks"},
            {"vaccine_name": "PCV (2nd dose)", "age": "10 Weeks"},
            {"vaccine_name": "DTP (3rd dose)", "age": "14 Weeks"},
            {"vaccine_name": "IPV (3rd dose)", "age": "14 Weeks"},
            {"vaccine_name": "Hib (3rd dose)", "age": "14 Weeks"},
            {"vaccine_name": "Rotavirus (3rd dose)", "age": "14 Weeks"},
            {"vaccine_name": "PCV (3rd dose)", "age": "14 Weeks"},
            {"vaccine_name": "Hepatitis B (3rd dose)", "age": "6 Months"},
            {"vaccine_name": "Influenza (1st dose)", "age": "6 Months"},
            {"vaccine_name": "Influenza (2nd dose)", "age": "7-9 Months"},
            {"vaccine_name": "MMR (1st dose)", "age": "9 Months"},
            {"vaccine_name": "Typhoid Conjugate Vaccine (TCV)", "age": "9 Months"},
            {"vaccine_name": "Hepatitis A (1st dose)", "age": "12 Months"},
            {"vaccine_name": "MMR (2nd dose)", "age": "15 Months"},
            {"vaccine_name": "Varicella (1st dose)", "age": "15 Months"},
            {"vaccine_name": "PCV booster", "age": "15 Months"},
            {"vaccine_name": "DTP booster-1", "age": "18 Months"},
            {"vaccine_name": "Hib booster", "age": "18 Months"},
            {"vaccine_name": "Hepatitis A (2nd dose)", "age": "18 Months"},
            {"vaccine_name": "Typhoid Booster", "age": "2 Years"},
            {"vaccine_name": "DTP booster-2", "age": "4-6 Years"},
            {"vaccine_name": "IPV booster-2", "age": "4-6 Years"},
            {"vaccine_name": "Varicella (2nd dose)", "age": "4-6 Years"},
            {"vaccine_name": "MMR (3rd dose)", "age": "4-6 Years"},
            {"vaccine_name": "HPV (1st dose)", "age": "9-14 Years"},
            {"vaccine_name": "HPV (2nd dose)", "age": "9-14 Years"},
            {"vaccine_name": "Tdap/Td booster", "age": "10-12 Years"},
            {"vaccine_name": "Tdap/Td booster", "age": "16-18 Years"}
        ]

        # Fetch student vaccinations
        student_vaccinations = await StudentVaccination.filter(student_id=student_id).select_related("vaccine")

        # If no vaccinations exist, initialize them with status=False
        if not student_vaccinations:
            async with in_transaction():
                for vaccine_data in vaccination_schedule:
                    vaccine_name = vaccine_data["vaccine_name"]
                    vaccine_age = vaccine_data["age"]
                    # Check if vaccine exists, create if not
                    vaccine = await Vaccinations.get_or_none(vaccine_name=vaccine_name)
                    if not vaccine:
                        vaccine = await Vaccinations.create(
                            vaccine_name=vaccine_name,
                            age=vaccine_age
                        )
                    # Check if StudentVaccination already exists to avoid duplicates
                    existing_record = await StudentVaccination.get_or_none(
                        student_id=student_id,
                        vaccine_id=vaccine.vaccine_id
                    )
                    if not existing_record:
                        await StudentVaccination.create(
                            student_id=student_id,
                            vaccine_id=vaccine.vaccine_id,
                            status=False
                        )

            # Re-fetch student vaccinations after initialization
            student_vaccinations = await StudentVaccination.filter(student_id=student_id).select_related("vaccine")

        # Fetch all vaccinations
        vaccinations = await Vaccinations.all()

        # Create a dictionary to map vaccine_id to its status
        vaccine_status_map = {sv.vaccine_id: sv.status for sv in student_vaccinations}

        # Prepare response data
        vaccination_status_list = [
            {
                "vaccine_id": vaccine.vaccine_id,
                "vaccine_name": vaccine.vaccine_name,
                "age": vaccine.age,
                "status": vaccine_status_map.get(vaccine.vaccine_id, False)
            }
            for vaccine in vaccinations
        ]

        return StandardResponse(
            status=True,
            message="Success",
            data={"vaccination_status": vaccination_status_list}
        )

    except Exception as e:
        return StandardResponse(
            status=False,
            message=f"An error occurred: {str(e)}",
            errors={"detail": str(e)}
        )
"""
