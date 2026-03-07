from fastapi import Depends, status
from fastapi.responses import JSONResponse
from tortoise.exceptions import IntegrityError

from src.core.file_manager import save_base64_image, get_new_url
from src.core.manager import get_current_user
from src.models.school_models import Schools,StudentSchoolPayment
from src.models.student_models import Students,SchoolStudents
from src.models.user_models import (AdminTeamRoles, AnalystRoles,
                                    OnGroundTeamRoles, SchoolRoles,
                                    SchoolStaff, ScreeningTeamRoles)

from src.utils.response import StandardResponse


from .. import router
from ..schema import SchoolUpdateSchema

SCHOOL_LOGO_BASE_PATH = "uploads/school_logos"



@router.get("/list", response_model=StandardResponse)
async def list_schools(
        skip: int = 0,
        limit: int = 100, # Default page size
        current_user: dict = Depends(get_current_user)  # Ensures the user is authenticated
):
    """
    Retrieves a paginated list of all schools.
    Requires user authentication.
    """


    allowed_roles = [
        SchoolRoles.SCHOOL_ADMIN,
        SchoolRoles.TEACHER,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        OnGroundTeamRoles.REGISTRATION_TEAM,
        OnGroundTeamRoles.CAMP_COORDINATOR,
        ScreeningTeamRoles.PHYSICAL_WELLBEING,
        ScreeningTeamRoles.DENTIST,
        ScreeningTeamRoles.EYE_SPECIALIST,
        ScreeningTeamRoles.NUTRITIONIST,
        ScreeningTeamRoles.PSYCHOLOGIST,
        AnalystRoles.NUTRITIONIST,
        AnalystRoles.PSYCHOLOGIST,
        AnalystRoles.MEDICAL_OFFICER
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role.value} is not allowed to create student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    schools_query = Schools.filter(is_deleted=False)
    total_schools = await schools_query.count()

    # Fetch schools with pagination and order them (e.g., by creation date or name)
    # Using .order_by('-created_at') to get the most recently created schools first.
    db_schools = await schools_query.offset(skip).limit(limit).order_by('school_code')

    if not db_schools:
        response_payload = StandardResponse(
            status=False,  # Request was successful, but no data to return
            message="No schools found.",
            data={},
            errors={},
        )
        return JSONResponse(content=response_payload.__dict__, status_code=status.HTTP_200_OK)

    schools_list = []
    for school in db_schools:
        # Convert each school object to a dictionary using the Pydantic model
        try:
            school_logo = await get_new_url(school.school_logo)
        except:
            school_logo = ""
        school_admin = await SchoolStaff.filter(school=school,user_role=SchoolRoles.SCHOOL_ADMIN).first()
        school_admin_username= school_admin.username if school_admin else ""
        
        school_details = {
            "school_id": school.school_id,
            "school_admin_username":school_admin_username,
            "school_name": school.school_name,
            "school_full_name": school.school_full_name,
            "school_logo": school_logo,
            "school_code": school.school_code,
            "registration_no": school.registration_no,
            "country_code": school.country_code,
            "phone": school.phone,
            "location": school.location,
            "address_line1": school.address_line1,
            "address_line2": school.address_line2,
            "landmark": school.landmark,
            "street": school.street,
            "state": school.state,
            "pincode": school.pincode,
            "country": school.country,
            "on_boarding": True,
            "total_staff": await SchoolStaff.filter(school=school).count(),
            "total_students": await Students.filter(school_students__school=school).count(),

        }
        schools_list.append(school_details)


    # Prepare the data payload for the StandardResponse
    # .model_dump() is used for Pydantic v2, use .dict() for Pydantic v1
    # This ensures that the items in the list are dictionaries, suitable for JSON serialization.
    data_payload = {
        "total": total_schools,
        "limit": limit,
        "skip": skip,
        "items": schools_list,
    }

    response = StandardResponse(
        status=True,
        message="Schools retrieved successfully.",
        data={
            "schools_list": data_payload
        },
        errors={},
    )
    return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)



@router.get("/details/{school_id}", response_model=StandardResponse)
async def school_details(school_id: int, current_user: dict = Depends(get_current_user)):
    allowed_roles = [
        SchoolRoles.SCHOOL_ADMIN,
        SchoolRoles.TEACHER,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.HEALTH_BUDDY,
        OnGroundTeamRoles.REGISTRATION_TEAM,
        OnGroundTeamRoles.CAMP_COORDINATOR,
        ScreeningTeamRoles.PHYSICAL_WELLBEING,
        ScreeningTeamRoles.DENTIST,
        ScreeningTeamRoles.EYE_SPECIALIST,
        ScreeningTeamRoles.NUTRITIONIST,
        ScreeningTeamRoles.PSYCHOLOGIST,
        AnalystRoles.NUTRITIONIST,
        AnalystRoles.PSYCHOLOGIST,
        AnalystRoles.MEDICAL_OFFICER
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role.value} is not allowed to create student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    school = await Schools.get_or_none(school_id=school_id)
    if not school:
        response = StandardResponse(
            status=False,
            message="School not found.",
            data={},
            errors={},
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    try:
        school_logo = await get_new_url(school.school_logo)
    except:
        school_logo = ""

    school_details = {
        "school_id": school.school_id,
        "school_name": school.school_name,
        "school_full_name": school.school_full_name,
        "school_logo": school_logo,
        "school_code": school.school_code,
        "registration_no": school.registration_no,
        "country_code": school.country_code,
        "phone": school.phone,
        "school_location_link": school.school_location_link,
        "location": school.location,
        "address_line1": school.address_line1,
        "address_line2": school.address_line2,
        "landmark": school.landmark,
        "street": school.street,
        "state": school.state,
        "pincode": school.pincode,
        "country": school.country,
        "primary_contact_fullname": school.primary_contact_fullname,
        "primary_contact_email": school.primary_contact_email,
        "primary_contact_phone":school.primary_contact_phone,
        "admin_contact_fullname": school.admin_contact_fullname,
        "admin_contact_email": school.admin_contact_email,
        "admin_contact_phone": school.admin_contact_phone,
        "status": school.status,
        
    }

    response = StandardResponse(
        status=True,
        message="Schools Details.",
        data={
            "school": school_details
        },
        errors={},
    )
    return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)


@router.put("/{school_id}", response_model=StandardResponse, tags=["Schools"])
async def update_school_details(
        school_id: int,
        school_data: SchoolUpdateSchema,  # FastAPI will parse the JSON body into this model
        current_user: dict = Depends(get_current_user)
):
    
    allowed_roles = [
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.HEALTH_BUDDY,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        SchoolRoles.SCHOOL_ADMIN
    ]
    updater_role = current_user.get("user_role")

    if updater_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"Role '{updater_role.value if hasattr(updater_role, 'value') else updater_role}' is not authorized to update school details.",
            data={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    school = await Schools.get_or_none(school_id=school_id)

    if not school:
        response = StandardResponse(
            status=False,
            message="School not found.",
            data={},
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Additional authorization: School Admin can only update their own school
    if updater_role == SchoolRoles.SCHOOL_ADMIN:
        # Assuming 'get_current_user' provides 'school_id' for school-affiliated users
        user_school_id = current_user.get("school_id")
        if not user_school_id or user_school_id != school_id:
            resp = StandardResponse(
                status=False,
                message="School administrators can only update their own school details.",
                data={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # Get the update data, excluding fields that were not set in the request
    update_payload = school_data.model_dump(exclude_unset=True)

    if not update_payload:
        return JSONResponse(
            content=StandardResponse(
                status=True,  # Technically successful, but no action taken
                message="No update data provided.",
                data={"school_id": school.school_id}
            ).__dict__,
            status_code=status.HTTP_200_OK
        )

    updated_fields_count = 0

    # Handle school logo update
    if "school_logo" in update_payload:
        updated_fields_count += 1
        logo_data = update_payload.pop("school_logo")  # Process separately

        if logo_data and isinstance(logo_data, str):  # New base64 string provided
            # Potentially delete old logo file before saving new one (optional)


            saved_logo_path = await save_base64_image(logo_data, SCHOOL_LOGO_BASE_PATH)
            if saved_logo_path:
                school.school_logo = saved_logo_path
            else:
                pass
        elif logo_data == "":  # Empty string means clear the logo
            school.school_logo = ""
        # If logo_data is None (explicitly "school_logo": null), it will also clear it.
        # If "school_logo" was not in update_payload (exclude_unset=True), this block is skipped.

    # Update other fields from the payload
    for key, value in update_payload.items():
        if hasattr(school, key):
            setattr(school, key, value)
            updated_fields_count += 1
        else:
            pass


    if updated_fields_count == 0 and "school_logo" not in school_data.model_fields_set:
        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="No effective changes in the provided data.",
                data={"school_id": school.school_id}
            ).__dict__,
            status_code=status.HTTP_200_OK
        )
    school.updated_by = current_user.get("user_id")
    school.updated_user_role = current_user.get("user_role")
    school.updated_role_type = current_user.get("role_type")
    try:
        await school.save()
    except IntegrityError as e:
        error_detail = str(e).lower()
        message = "Data conflict. A unique field (e.g., school code or registration number) may already exist."
        if "school_code" in error_detail:
            message = "School code already exists."
        elif "registration_no" in error_detail:
            message = "Registration number already exists."

        response = StandardResponse(
            status=False,
            message=message,
            errors={"detail": str(e)},
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        response = StandardResponse(
            status=False,
            message="An unexpected error occurred while updating the school.",
            errors={"detail": str(e)},
        )
        return JSONResponse(content=response.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Prepare response data (similar to your school_details endpoint)
    updated_school_data = {
        "school_id": school.school_id,
        "school_name": school.school_name,
        "school_full_name": school.school_full_name,
        "school_logo": await get_new_url(school.school_logo) if school.school_logo else "",
        "school_code": school.school_code,
        "registration_no": school.registration_no,
        "country_code": school.country_code,
        "phone": school.phone,
        "location": school.location,
        "school_location_link":school.school_location_link,
        "address_line1": school.address_line1,
        "address_line2": school.address_line2,
        "landmark": school.landmark,
        "street": school.street,
        "state": school.state,
        "pincode": school.pincode,
        "country": school.country,
        "primary_contact_fullname": school.primary_contact_fullname,
        "primary_contact_email": school.primary_contact_email,
        "primary_contact_phone":school.primary_contact_phone,
        "admin_contact_fullname": school.admin_contact_fullname,
        "admin_contact_email": school.admin_contact_email,
        "admin_contact_phone": school.admin_contact_phone,
        "status": school.status,
    }
    response = StandardResponse(
        status=True,
        message="School details updated successfully.",
        data={"school": updated_school_data},
    )
    return JSONResponse(content=response.__dict__, status_code=status.HTTP_200_OK)


# routers/payment_router.py

from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime

class UpdatePaymentSimpleRequest(BaseModel):
    student_id: int
    is_paid: bool

@router.put("/school-payment/update")
async def update_school_payment_simple(
    payload: UpdatePaymentSimpleRequest,
    current_user: dict = Depends(get_current_user)
):
    allowed_roles = ["REGISTRATION_TEAM", "CAMP_COORDINATOR", "SUPER_ADMIN", "PROGRAM_COORDINATOR", "SCHOOL_ADMIN"]
    
    if current_user.get("user_role") not in allowed_roles:
        return JSONResponse(
            content=StandardResponse(status=False, message="Unauthorized", data={}, errors={}).__dict__,
            status_code=status.HTTP_403_FORBIDDEN
        )

    try:
        

        # Get student + school
        student = await Students.get_or_none(id=payload.student_id, is_deleted=False)
        if not student:
            return JSONResponse(
                content=StandardResponse(status=False, message="Student not found", data={}, errors={}).__dict__,
                status_code=status.HTTP_404_NOT_FOUND
            )

        school_student = await SchoolStudents.get_or_none(
            student_id=payload.student_id,
            is_deleted=False
        )
        if not school_student:
            return JSONResponse(
                content=StandardResponse(status=False, message="Student not enrolled in any school", data={}, errors={}).__dict__,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        school_id = school_student.school_id

        # Auto generate today's date in DD/MM/YYYY
        today_str = datetime.now().strftime("%d/%m/%Y")  # e.g., "08/12/2025"

        # Final date: today if paid, null if not paid
        final_payment_date = today_str if payload.is_paid else None

        # Get or create payment record for today
        payment, created = await StudentSchoolPayment.get_or_create(
            student_id=payload.student_id,
            school_id=school_id,
            payment_date=final_payment_date,
            defaults={
                "is_paid": payload.is_paid,
                "created_by": current_user["user_id"],
                "created_user_role": current_user["user_role"],
            }
        )

        if not created:
            payment.is_paid = payload.is_paid
            payment.payment_date = final_payment_date
            payment.updated_by = current_user["user_id"]
            payment.updated_user_role = current_user["user_role"]
            await payment.save()

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Payment status updated",
                data={
                    "student_id": student.id,
                    "student_name": f"{student.first_name} {student.last_name}".strip(),
                    "payment_date": payment.payment_date,
                    "is_paid": payment.is_paid,
                    "school_id": school_id
                },
                errors={}
            ).__dict__,
            status_code=status.HTTP_200_OK
        )

    except Exception as e:
        import traceback
        return JSONResponse(
            content=StandardResponse(status=False, message="Error", data={}, errors={"detail": str(e)}).__dict__,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        