import os
import re
from datetime import datetime
from typing import Optional

from fastapi import Depends, APIRouter, status, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from tortoise.expressions import Q
from tortoise.queryset import Q
from tortoise.transactions import in_transaction
from src.models.consultation_models import MedicalScreeningStatus
from src.core.file_manager import get_new_url, save_base64_image
from src.core.manager import get_current_user
from src.models.school_models import Schools,AssignSchool,StudentSchoolPayment

from src.models.student_models import AttendanceStatus, ParentChildren, SchoolStudents, SmartScaleData, Students
from src.models.user_models import (
    AdminTeamRoles,
    AnalystRoles,
    ConsultantRoles,
    OnGroundTeamRoles,
    Parents,
    ParentRoles,
    SchoolRoles,
    SchoolStaff,
    ScreeningTeamRoles
)
from src.models.thyrocare_models import (
    ThyrocareProduct, ThyrocareOrder, ThyrocareOrderItem, ThyrocarePatient,LabTransactions
)
from src.models.helthians_booking import (
    HealthiansTest,
    HealthiansPackage,
    HealthiansBooking,
    HealthiansBookingTest,
)
from src.models.questionnaire_models import TeacherAnswers,ParentAnswers,StudentsQuestionBank
from src.models.other_models import ClinicalRecomendations,ClinicalFindings
from src.models.screening_models import DentalScreening,EyeScreening,BehaviouralScreening,NutritionScreening
from src.models.student_models import SmartScaleData,AttendanceStatus
from src.utils.calculator import calculate_age_string
from src.utils.response import StandardResponse
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
    get_available_academic_years
)
from .. import router
from ..dependencies import ParentChildrenCreateSchema
from ..schema import IndividualStudentCreateSchema, StudentCreate

# Medical Officer Status Types
MEDICAL_OFFICER_STATUS_TYPES = [
    "physical_screening_status",
    "nutritional_report_status", 
    "psychological_report_status",
    "vision_screening_status",
    "dental_screening_status",
    "lab_report_status",
    "medical_report_status"
]

STUDENT_IMAGES_DIR = "uploads/student_images"


def sort_key(class_name):
    match = re.search(r'\d+', class_name)
    return int(match.group()) if match else 0


async def get_user_school(current_user: dict) -> Optional[Schools]:
    school_id = current_user.get("school_id")
    if not school_id:
        return None
    return await Schools.filter(school_id=school_id).first()



@router.post("/create-student", response_model=StandardResponse)
async def create_individual_student(
    student_payload: IndividualStudentCreateSchema,
    current_user: dict = Depends(get_current_user),
    school_id: int | None = Query(None, description="School ID for Super Admin or Program Coordinator"),
):
    user_role = current_user["user_role"]

    allowed_roles = [
        SchoolRoles.SCHOOL_ADMIN,
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        OnGroundTeamRoles.REGISTRATION_TEAM,
        OnGroundTeamRoles.CAMP_COORDINATOR
    ]
    
    if user_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{user_role} is not allowed to create student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # Determine school_id_to_associate
    school_id_to_associate = None
    if user_role in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR]:
        if not school_id:
            resp = StandardResponse(
                status=False,
                message="School ID is required in query parameters for Super Admin or Program Coordinator.",
                data={},
                errors={"detail": "Missing school_id query parameter."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        school_id_to_associate = school_id
        school_obj = await Schools.get_or_none(school_id=school_id_to_associate)
        if not school_obj:
            resp = StandardResponse(
                status=False,
                message="Invalid school ID provided.",
                data={},
                errors={"detail": f"School with school_id {school_id_to_associate} does not exist."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
    else:
        user_id = current_user.get("user_id")
        if not user_id:
            resp = StandardResponse(
                status=False,
                message="User ID is missing in authentication data.",
                data={},
                errors={"detail": "No user_id provided in current_user."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_401_UNAUTHORIZED)
        
        staff_member = await SchoolStaff.get_or_none(id=user_id).prefetch_related('school')
        if not staff_member:
            resp = StandardResponse(
                status=False,
                message="School Admin user is not associated with any staff record.",
                data={},
                errors={"detail": f"No SchoolStaff record found for user_id {user_id}."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
        
        if not staff_member.school:
            resp = StandardResponse(
                status=False,
                message="Could not determine school for School Admin user.",
                data={},
                errors={"detail": f"SchoolStaff record for user_id {user_id} is not associated with a school."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
        
        school_id_to_associate = staff_member.school.school_id

    # Check for duplicate student by roll_no, school_id, and class_room
    existing_student = await Students.filter(
        roll_no=student_payload.roll_no.upper(),
        class_room=student_payload.class_room
    ).filter(school_students__school_id=school_id_to_associate).first()
    if existing_student:
        resp = StandardResponse(
            status=False,
            message=f"Student with roll number {student_payload.roll_no} already exists in class {student_payload.class_room} for this school.",
            data={},
            errors={"detail": f"Roll number {student_payload.roll_no} is already associated with a student in class {student_payload.class_room} and school_id {school_id_to_associate}."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # Convert DOB string to date object
    dob = None
    dob_str = student_payload.dob.strip()
    for fmt in ("%d-%m-%Y", "%m/%d/%Y", "%Y-%m-%d", "%d/%m/%Y"):
        try:
            dob = datetime.strptime(dob_str, fmt).date()
            break
        except ValueError:
            continue
    if dob is None:
        resp = StandardResponse(
            status=False,
            message="Invalid date format for dob.",
            data={},
            errors={"detail": f"Invalid date format for dob: {dob_str}. Expected DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD, or DD/MM/YYYY."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    image_key = ""
    if student_payload.profile_image:
        try:
            image_key = await save_base64_image(
                base64_string=student_payload.profile_image,
                destination_folder=STUDENT_IMAGES_DIR,
                user_role=current_user.get("user_role"),
                role_type=current_user.get("role_type"),
                return_key_only=True
            )
        except Exception as e:
            resp = StandardResponse(
                status=False,
                message="Failed to upload profile image.",
                errors={"detail": str(e)},
                data={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    student_data = {
        "first_name": student_payload.first_name.upper(),
        "middle_name": student_payload.middle_name.upper() if student_payload.middle_name else "",
        "last_name": student_payload.last_name.upper() if student_payload.last_name else "",
        "gender": student_payload.gender.upper() if student_payload.gender else "",
        "dob": dob,
        "class_room": student_payload.class_room,
        "section": student_payload.section.upper(),
        "roll_no": student_payload.roll_no.upper(),
        "aadhaar_no": student_payload.aadhaar_no if student_payload.aadhaar_no else "",
        "abha_id": student_payload.abha_id if student_payload.abha_id else "",
        "mp_uhid": student_payload.mp_uhid if student_payload.mp_uhid else "",
        "food_preferences": student_payload.food_preferences.upper() if student_payload.food_preferences else "",
        "address_line1": student_payload.address_line1.upper() if student_payload.address_line1 else "",
        "address_line2": student_payload.address_line2.upper() if student_payload.address_line2 else "",
        "landmark": student_payload.landmark.upper() if student_payload.landmark else "",
        "street": student_payload.street.upper() if student_payload.street else "",
        "state": student_payload.state.upper() if student_payload.state else "",
        "pincode": student_payload.pincode if student_payload.pincode else "",
        "country_code": student_payload.country_code if student_payload.country_code else "",
        "phone": student_payload.phone,
        "country": student_payload.country.upper() if student_payload.country else "",
        "blood_group": student_payload.blood_group.upper() if student_payload.blood_group else "",
        "profile_image": image_key,
        "created_by": str(current_user.get("user_id", "")),
        "created_user_role": str(current_user.get("user_role", "")),
        "created_role_type": str(current_user.get("role_type", "")),
    }

    try:
        async with in_transaction():
            student_validated = StudentCreate(**student_data)
            school_obj = await Schools.get_or_none(school_id=school_id_to_associate)
            if not school_obj:
                resp = StandardResponse(
                    status=False,
                    message="Invalid school ID provided.",
                    data={},
                    errors={"detail": f"School with school_id {school_id_to_associate} does not exist."},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

            student_record = await Students.create(**student_validated.model_dump(exclude_unset=True))

            parent_details = []
            phone = student_payload.phone.strip()
            primary_mobile = student_payload.primary_phone.strip() if student_payload.primary_phone else phone

            # Define parent_data
            parent_data = {
                "primary_first_name": student_payload.primary_first_name.upper() if student_payload.primary_first_name else "",
                "primary_middle_name": student_payload.primary_middle_name.upper() if student_payload.primary_middle_name else "",
                "primary_last_name": student_payload.primary_last_name.upper() if student_payload.primary_last_name else "",
                "primary_mobile": primary_mobile,
                "primary_email": student_payload.primary_email.lower() if student_payload.primary_email else "",
                "secondary_first_name": student_payload.secondary_first_name.upper() if student_payload.secondary_first_name else "",
                "secondary_middle_name": student_payload.secondary_middle_name.upper() if student_payload.secondary_middle_name else "",
                "secondary_last_name": student_payload.secondary_last_name.upper() if student_payload.secondary_last_name else "",
                "secondary_mobile": str(student_payload.secondary_phone) if student_payload.secondary_phone else "",
                "secondary_email": student_payload.secondary_email.lower() if student_payload.secondary_email else "",
                "pincode": student_payload.parent_pincode,
                "profile_image": "",
                "is_active": True,
                "is_verified": True,
                "created_by": str(current_user.get("user_id", "")),
                "created_user_role": str(current_user.get("user_role", "")),
                "created_role_type": str(current_user.get("role_type", "")),
            }

            if primary_mobile:
                parent = await Parents.filter(primary_mobile=primary_mobile).first()
                if not parent:
                    parent = await Parents.create(**parent_data)
                else:
                    parent.primary_first_name = parent_data["primary_first_name"]
                    parent.primary_middle_name = parent_data["primary_middle_name"]
                    parent.primary_last_name = parent_data["primary_last_name"]
                    parent.primary_email = parent_data["primary_email"]
                    parent.primary_mobile = parent_data["primary_mobile"]
                    parent.secondary_first_name = parent_data["secondary_first_name"]
                    parent.secondary_middle_name = parent_data["secondary_middle_name"]
                    parent.secondary_last_name = parent_data["secondary_last_name"]
                    parent.secondary_mobile = parent_data["secondary_mobile"]
                    parent.secondary_email = parent_data["secondary_email"]
                    parent.pincode = parent_data["parent_pincode"]
                    parent.is_active = parent_data["is_active"]
                    parent.is_verified = parent_data["is_verified"]
                    parent.updated_by = str(current_user.get("user_id", ""))
                    parent.updated_user_role = str(current_user.get("user_role", ""))
                    parent.updated_role_type = str(current_user.get("role_type", ""))
                    await parent.save()

                parent_details_primary = {
                    "id": parent.id,
                    "primary_first_name": parent.primary_first_name,
                    "primary_middle_name": parent.primary_middle_name,
                    "primary_last_name": parent.primary_last_name,
                    "primary_mobile": parent.primary_mobile,
                    "primary_email": parent.primary_email,
                    "secondary_first_name": parent.secondary_first_name,
                    "secondary_middle_name": parent.secondary_middle_name,
                    "secondary_last_name": parent.secondary_last_name,
                    "secondary_mobile": parent.secondary_mobile,
                    "secondary_email": parent.secondary_email,
                }
                parent_details.append(parent_details_primary)

                parent_child = await ParentChildren.filter(parent_id=parent.id, student_id=student_record.id).first()
                if not parent_child:
                    parent_child_data = {
                        "parent_id": parent.id,
                        "student_id": student_record.id,
                        "primary_phone_no": parent.primary_mobile,
                        "secondary_phone_no": parent.secondary_mobile,
                        "status": True,
                        "created_by": str(current_user.get("user_id", "")),
                        "created_user_role": str(current_user.get("user_role", "")),
                        "created_role_type": str(current_user.get("role_type", "")),
                    }
                    parent_child_validated = ParentChildrenCreateSchema(**parent_child_data)
                    await ParentChildren.create(**parent_child_validated.model_dump())
                else:
                    parent_child.primary_phone_no = parent.primary_mobile
                    parent_child.secondary_phone_no = parent.secondary_mobile
                    parent_child.updated_by = str(current_user.get("user_id", ""))
                    parent_child.updated_user_role = str(current_user.get("user_role", ""))
                    parent_child.updated_role_type = str(current_user.get("role_type", ""))
                    await parent_child.save()

            school_student_data = {
                "school_id": school_id_to_associate,
                "student_id": student_record.id,
                "status": True,
                "created_by": str(current_user.get("user_id", "")),
                "created_user_role": str(current_user.get("user_role", "")),
                "created_role_type": str(current_user.get("role_type", "")),
            }
            # Check for existing SchoolStudents record to prevent duplicates
            existing_school_student = await SchoolStudents.filter(student_id=student_record.id, school_id=school_id_to_associate, status=True).first()
            if not existing_school_student:
                await SchoolStudents.create(**school_student_data)
            else:
                existing_school_student.updated_by = str(current_user.get("user_id", ""))
                existing_school_student.updated_user_role = str(current_user.get("user_role", ""))
                existing_school_student.updated_role_type = str(current_user.get("role_type", ""))
                await existing_school_student.save()

            response_student_details = student_validated.model_dump()
            response_student_details["id"] = student_record.id
            response_student_details["dob"] = str(dob)
            response_student_details["profile_image"] = image_key

            final_response_data = {
                "student": response_student_details,
                "parents": parent_details,
                "school_association": {
                    "school_id": school_id_to_associate,
                    "student_id": student_record.id,
                    "status": True
                }
            }

            resp = StandardResponse(
                status=True,
                message="Student created successfully.",
                data=final_response_data,
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_201_CREATED)

    except Exception as e:
        resp = StandardResponse(
            status=False,
            message=f"Error creating student record: {str(e)}",
            data={},
            errors={"detail": str(e)},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)
    
# @router.get("/{school_id}/students-list-by-category", response_model=StandardResponse)
# async def get_school_students_by_category(
#     school_id: int,
#     current_user: dict = Depends(get_current_user),
#     klass: Optional[int] = Query(None, ge=1, le=12),
#     section: Optional[str] = Query(None, max_length=10),
#     search: Optional[str] = Query(None, max_length=100),
#     page: int = Query(1, ge=1),
#     page_size: int = Query(1000, ge=1, le=1000),
# ):
#     creator_role = current_user["user_role"]
#     allowed_roles = [
#         SchoolRoles.SCHOOL_ADMIN,
#         ParentRoles.PARENT,ParentRoles.GUARDIAN,
#         SchoolRoles.TEACHER,
#         AdminTeamRoles.PROGRAM_COORDINATOR,
#         AdminTeamRoles.SUPER_ADMIN,
#         AdminTeamRoles.HEALTH_BUDDY,
#         OnGroundTeamRoles.REGISTRATION_TEAM,
#         OnGroundTeamRoles.CAMP_COORDINATOR,
#         ScreeningTeamRoles.PHYSICAL_WELLBEING,
#         ScreeningTeamRoles.DENTIST,
#         ScreeningTeamRoles.EYE_SPECIALIST,
#         ScreeningTeamRoles.NUTRITIONIST,
#         ScreeningTeamRoles.PSYCHOLOGIST,
#         AnalystRoles.NUTRITIONIST,
#         AnalystRoles.PSYCHOLOGIST,
#         AnalystRoles.MEDICAL_OFFICER
#     ]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role.value} is not allowed to Fetch student records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
#     if not school:
#         resp = StandardResponse(
#             status=False,
#             message="School not found.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Apply filters
#     query = Students.filter(school_students__school_id=school_id, is_deleted=False)
#     if klass:
#         query = query.filter(class_room=klass)
#     if section:
#         query = query.filter(section=section)
#     if search:
#         query = query.filter(
#             Q(first_name__icontains=search) |
#             Q(middle_name__icontains=search) |
#             Q(last_name__icontains=search) |
#             Q(gender__icontains=search) |
#             Q(class_room__icontains=search) |
#             Q(section__icontains=search) |
#             Q(roll_no__icontains=search) |
#             Q(aadhaar_no__icontains=search) |
#             Q(abha_id__icontains=search) |
#             Q(mp_uhid__icontains=search) |
#             Q(dob__icontains=search)
#         )

#     school_students = await query.distinct()

#     class_values_dict = {
#         "12": "12th Class",
#         "11": "11th Class",
#         "10": "10th Class",
#         "9": "9th Class",
#         "8": "8th Class",
#         "7": "7th Class",
#         "6": "6th Class",
#         "5": "5th Class",
#         "4": "4th Class",
#         "3": "3rd Class",
#         "2": "2nd Class",
#         "1": "1st Class",
#         "Nursery": "Nursery",
#         "LKG": "LKG",
#         "UKG": "UKG"
#     }

#     class_dict = {}
#     for student in school_students:
#         if not student:
#             continue

#         klass_num = student.class_room
#         class_name = class_values_dict.get(str(student.class_room), "")
#         if class_name not in class_dict:
#             class_dict[class_name] = {}

#         section_key = f"{klass_num}_{student.section}"
#         if section_key not in class_dict[class_name]:
#             class_dict[class_name][section_key] = {
#                 "class": str(klass_num),
#                 "section": student.section,
#                 "students": []
#             }

#         try:
#             student_dict = {
#                 "first_name": student.first_name,
#                 "middle_name": student.middle_name,
#                 "last_name": student.last_name,
#                 "class": str(klass_num),
#                 "section": student.section,
#                 "roll_no": student.roll_no,
#                 "age": str(calculate_age_string(student.dob)),
#                 "profile_image": await get_new_url(student.profile_image) or ""
#             }
#             class_dict[class_name][section_key]["students"].append(student_dict)
#         except Exception:
#             continue

#     school_data = {
#         "higher_secondary": [],
#         "secondary": [],
#         "upper_primary": [],
#         "primary": [],
#         "pre_primary": []
#     }
#     for class_name in sorted(class_dict.keys(), key=sort_key, reverse=True):
#         class_data = []
#         for section_key in sorted(class_dict[class_name].keys()):
#             section_data = class_dict[class_name][section_key]
#             try:
#                 section_dict = {
#                     "class": section_data["class"],
#                     "section": section_data["section"],
#                     "students_count": len(section_data["students"]),
#                     "students": section_data["students"]
#                 }
#                 class_data.append(section_dict)
#             except Exception:
#                 continue
#         if class_data:
#             if class_name in ["12th Class", "11th Class"]:
#                 school_data["higher_secondary"].append({"class": class_name, "sections": class_data})
#             if class_name in ["10th Class", "9th Class"]:
#                 school_data["secondary"].append({"class": class_name, "sections": class_data})
#             if class_name in ["8th Class", "7th Class", "6th Class"]:
#                 school_data["upper_primary"].append({"class": class_name, "sections": class_data})
#             if class_name in ["5th Class", "4th Class", "3rd Class", "2nd Class", "1st Class"]:
#                 school_data["primary"].append({"class": class_name, "sections": class_data})
#             if class_name in ["Nursery", "LKG", "UKG"]:
#                 school_data["pre_primary"].append({"class": class_name, "sections": class_data})

#     resp = StandardResponse(
#         status=True,
#         message="School data retrieved successfully.",
#         data=school_data,
#         errors={}
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

# Pydantic schema for update request
class ScreeningStatusUpdate(BaseModel):
    registration_status: Optional[bool] = None
    screening_status: Optional[bool] = None
    eye_screening_status: Optional[bool] = None
    behavioural_screening_status: Optional[bool] = None
    nutrition_screening_status: Optional[bool] = None
    smart_scale_status: Optional[bool] = None


import re
def natural_sort_key(school_student):
    """Natural sorting for mixed alphanumeric roll numbers"""
    roll_no = school_student.student.roll_no or ""
    return [int(text) if text.isdigit() else text.lower() 
            for text in re.split('([0-9]+)', str(roll_no))]


# @router.get("/{school_id}/students-list", response_model=StandardResponse)
# async def get_school_students(
#     school_id: int,
#     current_user: dict = Depends(get_current_user),
#     search: Optional[str] = Query(None, max_length=100),
#     page: int = Query(1, ge=1),
#     page_size: int = Query(1000, ge=1, le=1000),
# ):
#     allowed_roles = [
#         SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER,
#         ParentRoles.PARENT, ParentRoles.GUARDIAN,
#         AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,
#         AdminTeamRoles.HEALTH_BUDDY,
#         OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
#         ScreeningTeamRoles.NUTRITIONIST, ScreeningTeamRoles.PSYCHOLOGIST, ScreeningTeamRoles.DENTIST,
#         ScreeningTeamRoles.EYE_SPECIALIST, ScreeningTeamRoles.PHYSICAL_WELLBEING,
#         AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER,
#         ConsultantRoles.PEDIATRICIAN, ConsultantRoles.DENTIST, ConsultantRoles.NUTRITIONIST, ConsultantRoles.PSYCHOLOGIST
#     ]

#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(status=False, message=f"{creator_role} is not allowed to view student records.", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
#     if not school:
#         resp = StandardResponse(status=False, message="School not found.", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Base query
#     query = SchoolStudents.filter(
#         school_id=school_id,
#         is_deleted=False,
#         student__is_deleted=False
#     ).prefetch_related('student')

#     if search:
#         query = query.filter(
#             Q(student__first_name__icontains=search) |
#             Q(student__middle_name__icontains=search) |
#             Q(student__last_name__icontains=search) |
#             Q(student__gender__icontains=search) |
#             Q(student__class_room__icontains=search) |
#             Q(student__section__icontains=search) |
#             Q(student__roll_no__icontains=search) |
#             Q(student__aadhaar_no__icontains=search) |
#             Q(student__abha_id__icontains=search) |
#             Q(student__mp_uhid__icontains=search) |
#             Q(student__dob__icontains=search)
#         )

#     total_students = await query.count()
#     school_students = await query.offset((page - 1) * page_size).limit(page_size)
#     school_students = sorted(school_students, key=natural_sort_key)

#     # Base student list
#     student_list = [
#         {
#             "id": ss.student.id,
#             "first_name": ss.student.first_name,
#             "middle_name": ss.student.middle_name or "",
#             "last_name": ss.student.last_name,
#             "class_room": ss.student.class_room,
#             "section": ss.student.section,
#             "roll_no": ss.student.roll_no,
#             "aadhaar_no": ss.student.aadhaar_no,
#             "abha_id": ss.student.abha_id,
#             "mp_uhid": ss.student.mp_uhid,
#             "profile_image": ss.student.profile_image or "",
#             "gender": ss.student.gender,
#             "age": str(calculate_age_string(ss.student.dob)),
#             "country_code": ss.student.country_code,
#             "phone": ss.student.phone,
#         }
#         for ss in school_students
#     ]

#     student_ids = [s["id"] for s in student_list]

#     # ===================================================================
#     # 1. LAB TESTS STATUS (Healthians + Thyrocare) - NEW
#     # ===================================================================
#     labtests_status_lookup = {sid: False for sid in student_ids}

#     if student_ids:
#         # Healthians: students who have at least one booking with report_url
#         healthians_reports = await HealthiansBooking.filter(
#             student_id__in=student_ids,
#             report_url__not_isnull=True,
#             report_url__not=""
#         ).group_by("student_id").values_list("student_id", flat=True)

#         # Thyrocare: students who have at least one order with report_url + report_available
#         thyrocare_reports = await ThyrocareOrder.filter(
#             student_id__in=student_ids,
#             report_url__not_isnull=True,
#             report_url__not="",
#             report_available=True
#         ).group_by("student_id").values_list("student_id", flat=True)

#         reported_student_ids = set(healthians_reports) | set(thyrocare_reports)
#         for sid in reported_student_ids:
#             if sid in labtests_status_lookup:
#                 labtests_status_lookup[sid] = True

#     # ===================================================================
#     # 2. ANALYSIS STATUS FIELDS (for Super Admin, PC, Analysts)
#     # ===================================================================
#     show_analysis_fields = current_user["user_role"] in {
#         AdminTeamRoles.SUPER_ADMIN,
#         AdminTeamRoles.PROGRAM_COORDINATOR,
#         AnalystRoles.NUTRITIONIST,
#         AnalystRoles.PSYCHOLOGIST,
#         AnalystRoles.MEDICAL_OFFICER,
#     }

#     nutritionist_analysis_lookup = {sid: False for sid in student_ids}
#     psychologist_analysis_lookup = {sid: False for sid in student_ids}
#     medical_officer_analysis_status = {sid: False for sid in student_ids}

#     if show_analysis_fields and student_ids:
#         # Nutrition & Psychology analysis
#         nutrition_recs = await ClinicalRecomendations.filter(student_id__in=student_ids).only("student_id", "analysis_status")
#         for rec in nutrition_recs:
#             if rec.analysis_status:
#                 nutritionist_analysis_lookup[rec.student_id] = True

#         psych_recs = await ClinicalFindings.filter(student_id__in=student_ids).only("student_id", "analysis_status")
#         for rec in psych_recs:
#             if rec.analysis_status:
#                 psychologist_analysis_lookup[rec.student_id] = True

#         # Medical Officer: all 6 reports verified?
#         if current_user["user_role"] in {AnalystRoles.MEDICAL_OFFICER, AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR}:
#             med_statuses = await MedicalScreeningStatus.filter(
#                 student_id__in=student_ids, is_deleted=False
#             ).all()

#             med_by_student = {}
#             for ms in med_statuses:
#                 med_by_student.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = ms.status

#             required = {
#                 "physical_screening_status", "nutritional_report_status", "psychological_report_status",
#                 "vision_screening_status", "dental_screening_status", "lab_report_status"
#             }

#             for sid in student_ids:
#                 sts = med_by_student.get(sid, {})
#                 if required.issubset(sts.keys()) and all(sts.get(k) == "verified" for k in required):
#                     medical_officer_analysis_status[sid] = True

#     # ===================================================================
#     # 3. EXISTING STATUS LOGIC (OnGround, Screening, Analyst, etc.)
#     # ===================================================================
#     if current_user.get("user_role") in {
#         OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
#         AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, SchoolRoles.SCHOOL_ADMIN
#     } or current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:

#         assign_school = await AssignSchool.filter(school=school_id, is_deleted=False).first()
#         student_ids_all = [ss.student.id for ss in school_students]

#         attendance_statuses = await AttendanceStatus.filter(student_id__in=student_ids_all).order_by('-created_at')
#         dental_screenings = await DentalScreening.filter(student_id__in=student_ids_all).order_by('-created_at')
#         eye_screenings = await EyeScreening.filter(student_id__in=student_ids_all).order_by('-created_at')
#         behavioural_screenings = await BehaviouralScreening.filter(student_id__in=student_ids_all).order_by('-created_at')
#         nutrition_screenings = await NutritionScreening.filter(student_id__in=student_ids_all).order_by('-created_at')
#         smart_scale_data = await SmartScaleData.filter(student_id__in=student_ids_all).order_by('-created_at')
#         nutritional_analysis_status = await ClinicalRecomendations.filter(student_id__in=student_ids_all).order_by('-created_at')
#         psychological_analysis_status = await ClinicalFindings.filter(student_id__in=student_ids_all).order_by('-created_at')

#         medical_screening_statuses = []
#         if current_user.get("user_role") in {AnalystRoles.MEDICAL_OFFICER, ScreeningTeamRoles.DENTIST, ScreeningTeamRoles.EYE_SPECIALIST, AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST}:
#             medical_screening_statuses = await MedicalScreeningStatus.filter(student_id__in=student_ids_all, is_deleted=False).all()

#         # Lookups
#         status_lookup = {s.student_id: s for s in attendance_statuses}
#         dental_lookup = {s.student_id: s for s in dental_screenings}
#         eye_lookup = {s.student_id: s for s in eye_screenings}
#         behavioural_lookup = {s.student_id: s for s in behavioural_screenings}
#         nutrition_lookup = {s.student_id: s for s in nutrition_screenings}
#         smart_scale_lookup = {s.student_id: s for s in smart_scale_data}
#         nutritional_analysis_lookup = {s.student_id: s.analysis_status for s in nutritional_analysis_status}
#         psychological_analysis_lookup = {s.student_id: s.analysis_status for s in psychological_analysis_status}

#         medical_status_lookup = {}
#         for ms in medical_screening_statuses:
#             medical_status_lookup.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = {
#                 "status": ms.status, "remarks": ms.remarks
#             }

#         # ===================================================================
#         # 4. SCHOOL PAYMENT STATUS – Current Academic Year (May 1 → Apr 30)
#         # ===================================================================
#         from datetime import datetime

#         school_payment_status_lookup = {sid: False for sid in student_ids}

#         if student_ids:
#             today = datetime.now().date()

#             # Determine current academic year
#             if today.month < 5:  # Jan–Apr belongs to previous academic year
#                 ay_start = datetime(today.year - 1, 5, 1).date()
#                 ay_end   = datetime(today.year,     4, 30).date()
#             else:
#                 ay_start = datetime(today.year,     5, 1).date()
#                 ay_end   = datetime(today.year + 1, 4, 30).date()

#             # Find students who have at least ONE successful payment in current academic year
#             paid_students = await StudentSchoolPayment.filter(
#                 student_id__in=student_ids,
#                 payment_date__gte=ay_start.strftime("%d/%m/%Y"),
#                 payment_date__lte=ay_end.strftime("%d/%m/%Y"),
#                 is_deleted=False,
#                 is_paid=True
#             ).values_list("student_id", flat=True)

#             for sid in paid_students:
#                 school_payment_status_lookup[sid] = True
                
#         # ===================================================================
#         # FINAL MERGE: Add all statuses to each student
#         # ===================================================================
#         for student in student_list:
#             sid = student["id"]
#             status_update = {}

#             # 1. Lab Tests Status
#             status_update["lab_test_status"] = labtests_status_lookup.get(sid, False)
#             status_update["school_payment_status"] = school_payment_status_lookup.get(sid, False)
            
#             # 2. Analysis Status (Super Admin, PC, Analysts)
#             if show_analysis_fields:
#                 status_update.update({
#                     "nutritionist_analysis_status": nutritionist_analysis_lookup.get(sid, False),
#                     "psychologist_analysis_status": psychologist_analysis_lookup.get(sid, False),
#                     "medical_officer_analysis_status": medical_officer_analysis_status.get(sid, False),
#                 })
#                 status_update["generated_report_status"] = medical_officer_analysis_status.get(sid, False)

#             # 3. Your existing role-based logic
#             if current_user.get("user_role") in {
#                 OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
#                 AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, SchoolRoles.SCHOOL_ADMIN
#             }:
#                 data = {
#                     "registration_status": bool(status_lookup.get(sid)),
#                     "dental_screening_status": dental_lookup.get(sid).screening_status if dental_lookup.get(sid) else False,
#                     "eye_screening_status": eye_lookup.get(sid).screening_status if eye_lookup.get(sid) else False,
#                     "behavioural_screening_status": behavioural_lookup.get(sid).screening_status if behavioural_lookup.get(sid) else False,
#                     "nutrition_screening_status": nutrition_lookup.get(sid).screening_status if nutrition_lookup.get(sid) else False,
#                     "smart_scale_status": smart_scale_lookup.get(sid).screening_status if smart_scale_lookup.get(sid) else False,
#                 }
#                 status_update.update(data)
#                 status_update["completed_status"] = all(data.values())

#             # Keep all your other elif conditions exactly as they were...
#             # (PHYSICAL_WELLBEING, DENTIST, EYE_SPECIALIST, NUTRITIONIST, PSYCHOLOGIST, MEDICAL_OFFICER, etc.)

#             student.update(status_update)

#     # Profile image URLs
#     for student in student_list:
#         student["profile_image"] = await get_new_url(student.get("profile_image")) or ""

#     # Final response
#     resp = StandardResponse(
#         status=True,
#         message="Student list retrieved successfully.",
#         data={
#             "students_list": student_list,
#             "total": total_students,
#             "page": page,
#             "page_size": page_size
#         },
#         errors={}
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

# new api
from src.models.school_models import Schools
from src.models.student_models import Students, SchoolStudents, ParentChildren
from src.models.questionnaire_models import StudentsQuestionBank, ParentAnswers, TeacherAnswers


# ──────────────────────────────────────────────────────────────
#  HELPER FUNCTIONS
# ──────────────────────────────────────────────────────────────
def normalize_grade(grade: str) -> str:
    """Map 'Class X' to 'X' for consistency with question bank."""
    if grade and isinstance(grade, str):
        return grade.replace("Class ", "") if grade.startswith("Class ") else grade
    return ""


def is_grade_in_range(student_grade: str, grade_level: list[str]) -> bool:
    """Check if student_grade is in the grade_level list."""
    if not student_grade or not grade_level:
        return False
    try:
        student_grade_num = normalize_grade(student_grade)
        return str(student_grade_num) in [normalize_grade(g) for g in grade_level]
    except (ValueError, AttributeError):
        return False

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from typing import Optional
from tortoise.expressions import Q
from datetime import datetime

from src.models.school_models import Schools
from src.models.student_models import Students, SchoolStudents, ParentChildren
from src.models.questionnaire_models import StudentsQuestionBank, ParentAnswers, TeacherAnswers

# ──────────────────────────────────────────────────────────────
#  QUESTION ID CONSTANTS
# ──────────────────────────────────────────────────────────────
class ParentQuestionID:
    NUTRITIONAL_HARDCODED_START = 1000000   # 10 lakhs
    EMOTIONAL_HARDCODED_START   = 2100000   # 21 lakhs


class TeacherQuestionID:
    NUTRITIONAL_HARDCODED_START = 3100000   # 31 lakhs
    EMOTIONAL_HARDCODED_START   = 4100000   # 41 lakhs


# ──────────────────────────────────────────────────────────────
#  HELPER FUNCTIONS
# ──────────────────────────────────────────────────────────────
def normalize_grade(grade: str) -> str:
    """Map 'Class X' to 'X' for consistency with question bank."""
    if grade and isinstance(grade, str):
        return grade.replace("Class ", "") if grade.startswith("Class ") else grade
    return ""


def is_grade_in_range(student_grade: str, grade_level: list) -> bool:
    """Check if student_grade is in the grade_level list."""
    if not student_grade or not grade_level:
        return False
    try:
        student_grade_num = normalize_grade(student_grade)
        return str(student_grade_num) in [normalize_grade(str(g)) for g in grade_level]
    except (ValueError, AttributeError):
        return False


async def get_parent_nutritional_questions_for_grade(class_room: str) -> set:
    """Get all parent nutritional question IDs for a specific grade - SAME AS GET API"""
    question_ids = set()
    seen_texts = set()
    
    # 1. Database questions
    db_questions = await StudentsQuestionBank.filter(
        question_type="NUTRITIONAL",
        applicable_to_parent=True,
        is_deleted=False
    ).all()
    
    for dbq in db_questions:
        grades = [g.strip() for g in dbq.grade_level.split(",") if g.strip()]
        normalized_grades = [normalize_grade(g) for g in grades]
        if is_grade_in_range(class_room, normalized_grades):
            question_ids.add(dbq.question_id)
            seen_texts.add(dbq.question_text.lower().strip())
    
    # 2. Hardcoded questions
    try:
        from src.api.parent.nutritional_questions_parents import NUTRITIONAL_QUESTIONS as PARENT_NUTRITIONAL
        for idx, q in enumerate(PARENT_NUTRITIONAL):
            if is_grade_in_range(class_room, q.get("grade_level", [])):
                text = q["question_text"].lower().strip()
                if text not in seen_texts:
                    question_ids.add(ParentQuestionID.NUTRITIONAL_HARDCODED_START + idx)
                    seen_texts.add(text)
    except (ImportError, KeyError):
        pass
    
    return question_ids


async def get_parent_emotional_questions_for_grade(class_room: str) -> set:
    """Get all parent emotional question IDs for a specific grade - SAME AS GET API"""
    question_ids = set()
    
    # Only hardcoded questions for parent emotional
    try:
        from src.api.parent.emotional_developmental_questions_parents import EMOTIONAL_DEVELOPMENTAL_QUESTIONS as PARENT_EMOTIONAL
        for idx, q in enumerate(PARENT_EMOTIONAL):
            if q.get("applicable_to_parent", False) and is_grade_in_range(class_room, q.get("grade_level", [])):
                question_ids.add(ParentQuestionID.EMOTIONAL_HARDCODED_START + idx)
    except (ImportError, KeyError):
        pass
    
    return question_ids


async def get_teacher_nutritional_questions_for_grade(class_room: str) -> set:
    """Get all teacher nutritional question IDs for a specific grade - SAME AS GET API"""
    question_ids = set()
    seen_texts = set()
    
    # 1. Database questions
    db_questions = await StudentsQuestionBank.filter(
        question_type="NUTRITIONAL",
        applicable_to_teacher=True,
        is_deleted=False
    ).all()
    
    for dbq in db_questions:
        grades = [g.strip() for g in dbq.grade_level.split(",") if g.strip()]
        if is_grade_in_range(class_room, [normalize_grade(g) for g in grades]):
            question_ids.add(dbq.question_id)
            seen_texts.add(dbq.question_text.lower().strip())
    
    # 2. Hardcoded questions
    try:
        from src.api.teacher.nutritional_questions_teachers import NUTRITIONAL_QUESTIONS as TEACHER_NUTRITIONAL
        for idx, q in enumerate(TEACHER_NUTRITIONAL):
            if is_grade_in_range(class_room, q.get("grade_level", [])) and q.get("applicable_to_teacher", False):
                text = q["question_text"].lower().strip()
                if text not in seen_texts:
                    question_ids.add(TeacherQuestionID.NUTRITIONAL_HARDCODED_START + idx)
                    seen_texts.add(text)
    except (ImportError, KeyError):
        pass
    
    return question_ids


async def get_teacher_emotional_questions_for_grade(class_room: str) -> set:
    """Get all teacher emotional question IDs for a specific grade - SAME AS GET API"""
    question_ids = set()
    seen_texts = set()
    
    # 1. Database Questions
    db_questions = await StudentsQuestionBank.filter(
        question_type="EMOTIONAL_DEVELOPMENTAL",
        applicable_to_teacher=True,
        is_deleted=False
    ).all()
    
    for dbq in db_questions:
        grades = [g.strip() for g in dbq.grade_level.split(",") if g.strip()]
        if is_grade_in_range(class_room, [normalize_grade(g) for g in grades]):
            question_ids.add(dbq.question_id)
            seen_texts.add(dbq.question_text.lower().strip())
    
    # 2. Hardcoded questions
    try:
        from src.api.teacher.emotional_developmental_questions_teachers import EMOTIONAL_DEVELOPMENTAL_QUESTIONS as TEACHER_EMOTIONAL
        for idx, q in enumerate(TEACHER_EMOTIONAL):
            q_grades = [normalize_grade(str(g)) for g in q.get("grade_level", [])]
            if is_grade_in_range(class_room, q_grades) and q.get("applicable_to_teacher", False):
                text = q["question_text"].lower().strip()
                if text not in seen_texts:
                    question_ids.add(TeacherQuestionID.EMOTIONAL_HARDCODED_START + idx)
                    seen_texts.add(text)
    except (ImportError, KeyError):
        pass
    
    return question_ids


# @router.get("/{school_id}/students-list-by-class", response_model=StandardResponse)
# async def get_students_by_class(
#     school_id: int,
#     current_user: dict = Depends(get_current_user),
#     classroom: Optional[str] = Query(None, max_length=50),
#     section: Optional[str] = Query(None, max_length=10),
#     search: Optional[str] = Query(None, max_length=100),
# ):
#     allowed_roles = [
#         "PARENT", "GUARDIAN", "HEALTH_BUDDY",
#         "SCHOOL_ADMIN", "TEACHER", "PROGRAM_COORDINATOR", "SUPER_ADMIN",
#         "REGISTRATION_TEAM", "CAMP_COORDINATOR", "PHYSICAL_WELLBEING",
#         "DENTIST", "EYE_SPECIALIST", "NUTRITIONIST", "PSYCHOLOGIST",
#         "ANALYST_NUTRITIONIST", "ANALYST_PSYCHOLOGIST", "MEDICAL_OFFICER"
#     ]
#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role} is not allowed to view student records.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     school = await Schools.get_or_none(school_id=school_id)
#     if not school:
#         resp = StandardResponse(
#             status=False,
#             message="School not found.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Fetch SchoolStudents with prefetch_related for student
#     query = SchoolStudents.filter(school_id=school_id, student__is_deleted=False).prefetch_related('student')
#     if classroom:
#         query = query.filter(student__class_room=classroom)
#     if section:
#         query = query.filter(student__section=section)
#     if search:
#         query = query.filter(
#             Q(student__first_name__icontains=search) |
#             Q(student__middle_name__icontains=search) |
#             Q(student__last_name__icontains=search)
#         )

#     students = await query.distinct()
#     students.sort(
#         key=lambda s: (
#             0 if not s.student.roll_no or not str(s.student.roll_no).strip().isdigit()
#             else int(str(s.student.roll_no).strip())
#         )
#     )
    
#     student_list = []
#     assign_school = await AssignSchool.filter(school=school_id, is_deleted=False).first()
#     is_completed = assign_school.is_completed if assign_school else False

#     for school_student in students:
#         student_dict = {
#             "id": school_student.student.id,
#             "first_name": school_student.student.first_name,
#             "middle_name": school_student.student.middle_name,
#             "last_name": school_student.student.last_name,
#             "class_room": school_student.student.class_room,
#             "section": school_student.student.section,
#             "roll_no": school_student.student.roll_no,
#             "aadhaar_no": school_student.student.aadhaar_no,
#             "abha_id": school_student.student.abha_id,
#             "mp_uhid": school_student.student.mp_uhid,
#             "profile_image": await get_new_url(school_student.student.profile_image) or "",
#             "gender": school_student.student.gender,
#             "age": str(calculate_age_string(school_student.student.dob)),
#             "country_code": school_student.student.country_code,
#             "phone": school_student.student.phone,
#         }
        
#         if current_user.get("user_role") in {SchoolRoles.TEACHER}:
#             class_room = normalize_grade(school_student.student.class_room)
            
#             # ===============================================
#             # GET ALL AVAILABLE QUESTIONS USING SAME LOGIC AS GET APIs
#             # ===============================================
#             parent_nutritional_ids = await get_parent_nutritional_questions_for_grade(class_room)
#             parent_emotional_ids = await get_parent_emotional_questions_for_grade(class_room)
#             teacher_nutritional_ids = await get_teacher_nutritional_questions_for_grade(class_room)
#             teacher_emotional_ids = await get_teacher_emotional_questions_for_grade(class_room)
            
#             # ===============================================
#             # GET ANSWERED QUESTIONS FOR THIS STUDENT
#             # ===============================================
#             parent_answered = await ParentAnswers.filter(
#                 student_id=school_student.student.id, 
#                 is_deleted=False
#             ).values_list("question_id", flat=True)
            
#             teacher_answered = await TeacherAnswers.filter(
#                 student_id=school_student.student.id, 
#                 is_deleted=False
#             ).values_list("question_id", flat=True)
            
#             parent_answered_ids = set(parent_answered)
#             teacher_answered_ids = set(teacher_answered)

#             # ===============================================
#             # CALCULATE PARENT QUESTIONNAIRE STATUS
#             # ===============================================
#             if parent_nutritional_ids:
#                 parent_nutritional_complete = parent_nutritional_ids.issubset(parent_answered_ids)
#             else:
#                 parent_nutritional_complete = True
            
#             if parent_emotional_ids:
#                 parent_emotional_complete = parent_emotional_ids.issubset(parent_answered_ids)
#             else:
#                 parent_emotional_complete = True
            
#             parent_questionnaire_status = parent_nutritional_complete and parent_emotional_complete

#             # ===============================================
#             # CALCULATE TEACHER QUESTIONNAIRE STATUS
#             # ===============================================
#             if teacher_nutritional_ids:
#                 teacher_nutritional_complete = teacher_nutritional_ids.issubset(teacher_answered_ids)
#             else:
#                 teacher_nutritional_complete = True
            
#             if teacher_emotional_ids:
#                 teacher_emotional_complete = teacher_emotional_ids.issubset(teacher_answered_ids)
#             else:
#                 teacher_emotional_complete = True
            
#             teacher_questionnaire_status = teacher_nutritional_complete and teacher_emotional_complete

#             # Add to student data
#             student_dict["parent_questionnaire_status"] = parent_questionnaire_status
#             student_dict["teacher_questionnaire_status"] = teacher_questionnaire_status

#         student_list.append(student_dict)

#     # ===============================================
#     # CONSULTATION PAYMENT STATUS - Check tx_status (boolean)
#     # ===============================================
#     student_ids = [school_student.student.id for school_student in students]
    
#     # ===============================================
#     # SCHOOL PAYMENT STATUS - Check StudentSchoolPayment for today
#     # ===============================================
#     # === CURRENT ACADEMIC YEAR PAYMENT STATUS (May 1 - Apr 30) ===
#     from datetime import datetime
#     from src.models.school_models import StudentSchoolPayment

#     today = datetime.now().date()
#     if today.month < 5:
#         ay_start = datetime(today.year - 1, 5, 1).date()
#         ay_end = datetime(today.year, 4, 30).date()
#     else:
#         ay_start = datetime(today.year, 5, 1).date()
#         ay_end = datetime(today.year + 1, 4, 30).date()

#     paid_students = await StudentSchoolPayment.filter(
#         student_id__in=student_ids,
#         payment_date__gte=ay_start.strftime("%d/%m/%Y"),
#         payment_date__lte=ay_end.strftime("%d/%m/%Y"),
#         is_deleted=False,
#         is_paid=True
#     ).values_list("student_id", flat=True)

#     paid_student_set = set(paid_students)

#     for student_dict in student_list:
#         student_dict["school_payment_status"] = student_dict["id"] in paid_student_set
        
#     # ===============================================
#     # SCREENING STATUSES (unchanged - keeping your existing code)
#     # ===============================================
#     role_status_map = {
#         ScreeningTeamRoles.PHYSICAL_WELLBEING: ["smart_scale_status"],
#         ScreeningTeamRoles.DENTIST: ["dental_screening_status"],
#         ScreeningTeamRoles.EYE_SPECIALIST: ["eye_screening_status"],
#         ScreeningTeamRoles.NUTRITIONIST: ["nutrition_screening_status"],
#         ScreeningTeamRoles.PSYCHOLOGIST: ["behavioural_screening_status"],
#         AnalystRoles.NUTRITIONIST: ["nutrition_analysis_status"],
#         AnalystRoles.PSYCHOLOGIST: ["psychological_analysis_status"],
#     }
    
#     if current_user.get("user_role") in {OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR, AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, AdminTeamRoles.HEALTH_BUDDY, SchoolRoles.SCHOOL_ADMIN} or current_user.get("user_role") in role_status_map or current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
        
#         attendance_statuses = await AttendanceStatus.filter(student_id__in=student_ids).order_by('-created_at')
#         dental_screenings = await DentalScreening.filter(student_id__in=student_ids).order_by('-created_at')
#         eye_screenings = await EyeScreening.filter(student_id__in=student_ids).order_by('-created_at')
#         behavioural_screenings = await BehaviouralScreening.filter(student_id__in=student_ids).order_by('-created_at')
#         nutrition_screenings = await NutritionScreening.filter(student_id__in=student_ids).order_by('-created_at')
#         smart_scale_data = await SmartScaleData.filter(student_id__in=student_ids).order_by('-created_at')
#         nutritional_analysis_status = await ClinicalRecomendations.filter(student_id__in=student_ids).order_by('-created_at')
#         psychological_analysis_status = await ClinicalFindings.filter(student_id__in=student_ids).order_by('-created_at')
        
#         medical_screening_statuses = []
#         if (current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER or
#             current_user.get("user_role") == ScreeningTeamRoles.DENTIST or
#             current_user.get("user_role") == ScreeningTeamRoles.EYE_SPECIALIST or
#             current_user.get("user_role") == AnalystRoles.NUTRITIONIST or
#             current_user.get("user_role") == AnalystRoles.PSYCHOLOGIST):
#             medical_screening_statuses = await MedicalScreeningStatus.filter(
#                 student_id__in=student_ids,
#                 is_deleted=False
#             ).all()
        
#         status_lookup = {s.student_id: s for s in attendance_statuses}
#         dental_lookup = {s.student_id: s for s in dental_screenings}
#         eye_lookup = {s.student_id: s for s in eye_screenings}
#         behavioural_lookup = {s.student_id: s for s in behavioural_screenings}
#         nutrition_lookup = {s.student_id: s for s in nutrition_screenings}
#         smart_scale_lookup = {s.student_id: s for s in smart_scale_data}
#         nutritional_analysis_lookup = {s.student_id: s.analysis_status if s else False for s in nutritional_analysis_status}
#         psychological_analysis_lookup = {s.student_id: s.analysis_status if s else False for s in psychological_analysis_status}
        
#         medical_status_lookup = {}
#         if medical_screening_statuses:
#             for medical_status in medical_screening_statuses:
#                 if medical_status.student_id not in medical_status_lookup:
#                     medical_status_lookup[medical_status.student_id] = {}
#                 medical_status_lookup[medical_status.student_id][medical_status.medical_officer_status_type] = {
#                     "status": medical_status.status,
#                     "remarks": medical_status.remarks
#                 }
        
#         for student_dict in student_list:
#             student_id = student_dict["id"]
            
#             if not any(ss.student.id == student_id for ss in students):
#                 continue

#             status_update = {}
            
#             if current_user.get("user_role") in {OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR, AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.HEALTH_BUDDY, AdminTeamRoles.PROGRAM_COORDINATOR, SchoolRoles.SCHOOL_ADMIN}:
#                 status_update.update({
#                     "registration_status": bool(status_lookup.get(student_id)),
#                     "dental_screening_status": dental_lookup.get(student_id).screening_status if dental_lookup.get(student_id) else False,
#                     "eye_screening_status": eye_lookup.get(student_id).screening_status if eye_lookup.get(student_id) else False,
#                     "behavioural_screening_status": behavioural_lookup.get(student_id).screening_status if behavioural_lookup.get(student_id) else False,
#                     "nutrition_screening_status": nutrition_lookup.get(student_id).screening_status if nutrition_lookup.get(student_id) else False,
#                     "smart_scale_status": smart_scale_lookup.get(student_id).screening_status if smart_scale_lookup.get(student_id) else False,
#                     "nutrition_analysis_status": bool(nutritional_analysis_lookup.get(student_id)),
#                     "psychological_analysis_status": bool(psychological_analysis_lookup.get(student_id))
#                 })
#                 data = {
#                     "registration_status": bool(status_lookup.get(student_id)),
#                     "dental_screening_status": dental_lookup.get(student_id).screening_status if dental_lookup.get(student_id) else False,
#                     "eye_screening_status": eye_lookup.get(student_id).screening_status if eye_lookup.get(student_id) else False,
#                     "behavioural_screening_status": behavioural_lookup.get(student_id).screening_status if behavioural_lookup.get(student_id) else False,
#                     "nutrition_screening_status": nutrition_lookup.get(student_id).screening_status if nutrition_lookup.get(student_id) else False,
#                     "smart_scale_status": smart_scale_lookup.get(student_id).screening_status if smart_scale_lookup.get(student_id) else False,
#                 }
                
#                 status_update.update({"completed_status": all(data.values())})
            
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.PHYSICAL_WELLBEING:
#                 status_update.update({
#                     "screening_status": smart_scale_lookup.get(student_id).screening_status if smart_scale_lookup.get(student_id) else False
#                 })
            
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.EYE_SPECIALIST:
#                 if student_id in medical_status_lookup:
#                     eye_specialist_medical_statuses = {
#                         "vision_screening_status": medical_status_lookup[student_id].get("vision_screening_status", {}).get("status", "not_verified") if "vision_screening_status" in medical_status_lookup[student_id] else "not_verified"
#                     }
#                 else:
#                     eye_specialist_medical_statuses = {"vision_screening_status": "not_verified"}
                
#                 status_update.update({
#                     "screening_status": eye_lookup.get(student_id).screening_status if eye_lookup.get(student_id) else False,
#                     **eye_specialist_medical_statuses
#                 })
                
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.DENTIST:
#                 if student_id in medical_status_lookup:
#                     dentist_medical_statuses = {
#                         "dental_screening_status": medical_status_lookup[student_id].get("dental_screening_status", {}).get("status", "not_verified") if "dental_screening_status" in medical_status_lookup[student_id] else "not_verified"
#                     }
#                 else:
#                     dentist_medical_statuses = {"dental_screening_status": "not_verified"}
                
#                 status_update.update({
#                     "screening_status": dental_lookup.get(student_id).screening_status if dental_lookup.get(student_id) else False,
#                     **dentist_medical_statuses
#                 })

#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.NUTRITIONIST:
#                 status_update.update({
#                     "screening_status": nutrition_lookup.get(student_id).screening_status if nutrition_lookup.get(student_id) else False
#                 })
                
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.PSYCHOLOGIST:
#                 status_update.update({
#                     "screening_status": behavioural_lookup.get(student_id).screening_status if behavioural_lookup.get(student_id) else False
#                 })
           
#             elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.NUTRITIONIST:
#                 if student_id in medical_status_lookup:
#                     nutritionist_medical_statuses = {
#                         "physical_screening_status": medical_status_lookup[student_id].get("physical_screening_status", {}).get("status", "not_verified") if "physical_screening_status" in medical_status_lookup[student_id] else "not_verified",
#                         "nutritional_report_status": medical_status_lookup[student_id].get("nutritional_report_status", {}).get("status", "not_verified") if "nutritional_report_status" in medical_status_lookup[student_id] else "not_verified",
#                         "lab_report_status": medical_status_lookup[student_id].get("lab_report_status", {}).get("status", "not_verified") if "lab_report_status" in medical_status_lookup[student_id] else "not_verified"
#                     }
#                 else:
#                     nutritionist_medical_statuses = {
#                         "physical_screening_status": "not_verified",
#                         "nutritional_report_status": "not_verified",
#                         "lab_report_status": "not_verified"
#                     }
                
#                 status_update.update({
#                     "analysis_status": bool(nutritional_analysis_lookup.get(student_id)),
#                     **nutritionist_medical_statuses
#                 })
                
#             elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.PSYCHOLOGIST:
#                 if student_id in medical_status_lookup:
#                     psychologist_medical_statuses = {
#                         "psychological_report_status": medical_status_lookup[student_id].get("psychological_report_status", {}).get("status", "not_verified") if "psychological_report_status" in medical_status_lookup[student_id] else "not_verified"
#                     }
#                 else:
#                     psychologist_medical_statuses = {"psychological_report_status": "not_verified"}
                
#                 status_update.update({
#                     "analysis_status": bool(psychological_analysis_lookup.get(student_id)),
#                     **psychologist_medical_statuses
#                 })
            
#             elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
#                 student_medical_statuses = {}
#                 for status_type in MEDICAL_OFFICER_STATUS_TYPES:
#                     if (student_id in medical_status_lookup and 
#                         status_type in medical_status_lookup[student_id]):
#                         student_medical_statuses[status_type] = medical_status_lookup[student_id][status_type]["status"]
#                     else:
#                         student_medical_statuses[status_type] = "not_verified"
                        
#                 all_reports_verified = all([
#                     student_medical_statuses.get("physical_screening_status") == "verified",
#                     student_medical_statuses.get("nutritional_report_status") == "verified",
#                     student_medical_statuses.get("psychological_report_status") == "verified",
#                     student_medical_statuses.get("vision_screening_status") == "verified",
#                     student_medical_statuses.get("dental_screening_status") == "verified",
#                     student_medical_statuses.get("lab_report_status") == "verified"
#                 ])
#                 if all_reports_verified:
#                     student_medical_statuses["medical_report_status"] = "verified"
    
#                 status_update.update(student_medical_statuses)
                
#             student_dict.update(status_update)

#     resp = StandardResponse(
#         status=True,
#         message="Students retrieved by class successfully.",
#         data={"students_list": student_list},
#         errors={}
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)


# ===================================================================
# NEW ENDPOINT: Get Available Academic Years for Dropdown
# ===================================================================
@router.get("/academic-years/available", response_model=StandardResponse)
async def get_available_academic_years_endpoint(
    current_user: dict = Depends(get_current_user),
    years_back: int = Query(5, ge=1, le=10, description="Number of past years to include")
):
    """
    Get list of available academic years for dropdown selection.
    
    Returns:
        List of academic years in descending order with current year marked.
    """
    academic_years = get_available_academic_years(years_back)
    current_ay = get_current_academic_year()
    
    # Format for frontend dropdown
    dropdown_data = [
        {
            "value": ay,
            "label": f"Academic Year {ay}",
            "is_current": ay == current_ay
        }
        for ay in academic_years
    ]
    
    resp = StandardResponse(
        status=True,
        message="Available academic years retrieved successfully",
        data={
            "academic_years": dropdown_data,
            "current_academic_year": current_ay
        },
        errors={}
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

# ===================================================================
# API 1: STUDENTS LIST BY CATEGORY (with Academic Year Filter)
# ===================================================================
@router.get("/{school_id}/students-list-by-category", response_model=StandardResponse)
async def get_school_students_by_category(
    school_id: int,
    current_user: dict = Depends(get_current_user),
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    klass: Optional[int] = Query(None, ge=1, le=12),
    section: Optional[str] = Query(None, max_length=10),
    search: Optional[str] = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(1000, ge=1, le=1000),
):
    creator_role = current_user["user_role"]
    allowed_roles = [
        SchoolRoles.SCHOOL_ADMIN,
        ParentRoles.PARENT, ParentRoles.GUARDIAN,
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
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role.value} is not allowed to Fetch student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
    if not school:
        resp = StandardResponse(
            status=False,
            message="School not found.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()

    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        resp = StandardResponse(
            status=False,
            message=str(e),
            data={},
            errors={"academic_year": str(e)}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # Apply filters (NO academic year filter on students themselves)
    query = Students.filter(school_students__school_id=school_id, is_deleted=False)
    if klass:
        query = query.filter(class_room=klass)
    if section:
        query = query.filter(section=section)
    if search:
        query = query.filter(
            Q(first_name__icontains=search) |
            Q(middle_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(gender__icontains=search) |
            Q(class_room__icontains=search) |
            Q(section__icontains=search) |
            Q(roll_no__icontains=search) |
            Q(aadhaar_no__icontains=search) |
            Q(abha_id__icontains=search) |
            Q(mp_uhid__icontains=search) |
            Q(dob__icontains=search)
        )

    school_students = await query.distinct()
    student_ids = [s.id for s in school_students]

    # Build Academic Year Filter for Activities
    year_filter = build_academic_year_filter(academic_year)

    # Fetch activity data for academic year
    attendance_lookup = {}
    dental_lookup = {}
    eye_lookup = {}
    behavioural_lookup = {}
    nutrition_lookup = {}
    smart_scale_lookup = {}
    payment_lookup = {}

    if student_ids:
        attendance_statuses = await AttendanceStatus.filter(
            year_filter,
            student_id__in=student_ids
        ).all()
        attendance_lookup = {s.student_id: s for s in attendance_statuses}

        dental_screenings = await DentalScreening.filter(
            year_filter,
            student_id__in=student_ids
        ).all()
        dental_lookup = {s.student_id: s for s in dental_screenings}

        eye_screenings = await EyeScreening.filter(
            year_filter,
            student_id__in=student_ids
        ).all()
        eye_lookup = {s.student_id: s for s in eye_screenings}

        behavioural_screenings = await BehaviouralScreening.filter(
            year_filter,
            student_id__in=student_ids
        ).all()
        behavioural_lookup = {s.student_id: s for s in behavioural_screenings}

        nutrition_screenings = await NutritionScreening.filter(
            year_filter,
            student_id__in=student_ids
        ).all()
        nutrition_lookup = {s.student_id: s for s in nutrition_screenings}

        smart_scale_data = await SmartScaleData.filter(
            year_filter,
            student_id__in=student_ids
        ).all()
        smart_scale_lookup = {s.student_id: s for s in smart_scale_data}

        # Payment records for academic year
        paid_students = await StudentSchoolPayment.filter(
            year_filter,
            student_id__in=student_ids,
            is_deleted=False,
            is_paid=True
        ).values_list("student_id", flat=True)
        payment_lookup = {sid: True for sid in paid_students}

    class_values_dict = {
        "12": "12th Class",
        "11": "11th Class",
        "10": "10th Class",
        "9": "9th Class",
        "8": "8th Class",
        "7": "7th Class",
        "6": "6th Class",
        "5": "5th Class",
        "4": "4th Class",
        "3": "3rd Class",
        "2": "2nd Class",
        "1": "1st Class",
        "Nursery": "Nursery",
        "LKG": "LKG",
        "UKG": "UKG"
    }

    class_dict = {}
    for student in school_students:
        if not student:
            continue

        klass_num = student.class_room
        class_name = class_values_dict.get(str(student.class_room), "")
        if class_name not in class_dict:
            class_dict[class_name] = {}

        section_key = f"{klass_num}_{student.section}"
        if section_key not in class_dict[class_name]:
            class_dict[class_name][section_key] = {
                "class": str(klass_num),
                "section": student.section,
                "students": []
            }

        try:
            student_dict = {
                "id": student.id,
                "first_name": student.first_name,
                "middle_name": student.middle_name,
                "last_name": student.last_name,
                "class": str(klass_num),
                "section": student.section,
                "roll_no": student.roll_no,
                "age": str(calculate_age_string(student.dob)),
                "profile_image": await get_new_url(student.profile_image) or "",
                
                # Add screening status for selected academic year
                "registration_status": bool(attendance_lookup.get(student.id)),
                "dental_screening_status": dental_lookup.get(student.id).screening_status if dental_lookup.get(student.id) else False,
                "eye_screening_status": eye_lookup.get(student.id).screening_status if eye_lookup.get(student.id) else False,
                "behavioural_screening_status": behavioural_lookup.get(student.id).screening_status if behavioural_lookup.get(student.id) else False,
                "nutrition_screening_status": nutrition_lookup.get(student.id).screening_status if nutrition_lookup.get(student.id) else False,
                "smart_scale_status": smart_scale_lookup.get(student.id).screening_status if smart_scale_lookup.get(student.id) else False,
                "school_payment_status": payment_lookup.get(student.id, False),
            }
            class_dict[class_name][section_key]["students"].append(student_dict)
        except Exception:
            continue

    school_data = {
        "higher_secondary": [],
        "secondary": [],
        "upper_primary": [],
        "primary": [],
        "pre_primary": []
    }
    
    for class_name in sorted(class_dict.keys(), key=sort_key, reverse=True):
        class_data = []
        for section_key in sorted(class_dict[class_name].keys()):
            section_data = class_dict[class_name][section_key]
            try:
                section_dict = {
                    "class": section_data["class"],
                    "section": section_data["section"],
                    "students_count": len(section_data["students"]),
                    "students": section_data["students"]
                }
                class_data.append(section_dict)
            except Exception:
                continue
        if class_data:
            if class_name in ["12th Class", "11th Class"]:
                school_data["higher_secondary"].append({"class": class_name, "sections": class_data})
            if class_name in ["10th Class", "9th Class"]:
                school_data["secondary"].append({"class": class_name, "sections": class_data})
            if class_name in ["8th Class", "7th Class", "6th Class"]:
                school_data["upper_primary"].append({"class": class_name, "sections": class_data})
            if class_name in ["5th Class", "4th Class", "3rd Class", "2nd Class", "1st Class"]:
                school_data["primary"].append({"class": class_name, "sections": class_data})
            if class_name in ["Nursery", "LKG", "UKG"]:
                school_data["pre_primary"].append({"class": class_name, "sections": class_data})

    # ✅ SAME FORMAT AS WORKING FILE
    resp = StandardResponse(
        status=True,
        message="School data retrieved successfully.",
        data=school_data,  # ← Direct school_data (not wrapped)
        errors={}
    )
    
    # ✅ Add academic_year to response headers
    response = JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
    response.headers["X-Academic-Year"] = academic_year
    return response


# @router.get("/{school_id}/students-list", response_model=StandardResponse)
# async def get_school_students(
#     school_id: int,
#     current_user: dict = Depends(get_current_user),
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     ),
#     search: Optional[str] = Query(None, max_length=100),
#     page: int = Query(1, ge=1),
#     page_size: int = Query(1000, ge=1, le=1000),
# ):
#     allowed_roles = [
#         SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER,
#         ParentRoles.PARENT, ParentRoles.GUARDIAN,
#         AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,
#         AdminTeamRoles.HEALTH_BUDDY,
#         OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
#         ScreeningTeamRoles.NUTRITIONIST, ScreeningTeamRoles.PSYCHOLOGIST, ScreeningTeamRoles.DENTIST,
#         ScreeningTeamRoles.EYE_SPECIALIST, ScreeningTeamRoles.PHYSICAL_WELLBEING,
#         AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER,
#         ConsultantRoles.PEDIATRICIAN, ConsultantRoles.DENTIST, ConsultantRoles.NUTRITIONIST, ConsultantRoles.PSYCHOLOGIST
#     ]

#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(status=False, message=f"{creator_role} is not allowed to view student records.", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
#     if not school:
#         resp = StandardResponse(status=False, message="School not found.", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Determine academic year
#     if academic_year is None:
#         academic_year = get_current_academic_year()

#     try:
#         ay_start, ay_end = parse_academic_year(academic_year)
#     except ValueError as e:
#         resp = StandardResponse(
#             status=False,
#             message=str(e),
#             data={},
#             errors={"academic_year": str(e)}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     # Base query
#     query = SchoolStudents.filter(
#         school_id=school_id,
#         is_deleted=False,
#         student__is_deleted=False
#     ).prefetch_related('student')

#     if search:
#         query = query.filter(
#             Q(student__first_name__icontains=search) |
#             Q(student__middle_name__icontains=search) |
#             Q(student__last_name__icontains=search) |
#             Q(student__gender__icontains=search) |
#             Q(student__class_room__icontains=search) |
#             Q(student__section__icontains=search) |
#             Q(student__roll_no__icontains=search) |
#             Q(student__aadhaar_no__icontains=search) |
#             Q(student__abha_id__icontains=search) |
#             Q(student__mp_uhid__icontains=search) |
#             Q(student__dob__icontains=search)
#         )

#     total_students = await query.count()
#     school_students = await query.offset((page - 1) * page_size).limit(page_size)
#     school_students = sorted(school_students, key=natural_sort_key)

#     # Base student list
#     student_list = [
#         {
#             "id": ss.student.id,
#             "first_name": ss.student.first_name,
#             "middle_name": ss.student.middle_name or "",
#             "last_name": ss.student.last_name,
#             "class_room": ss.student.class_room,
#             "section": ss.student.section,
#             "roll_no": ss.student.roll_no,
#             "aadhaar_no": ss.student.aadhaar_no,
#             "abha_id": ss.student.abha_id,
#             "mp_uhid": ss.student.mp_uhid,
#             "profile_image": ss.student.profile_image or "",
#             "gender": ss.student.gender,
#             "age": str(calculate_age_string(ss.student.dob)),
#             "country_code": ss.student.country_code,
#             "phone": ss.student.phone,
#         }
#         for ss in school_students
#     ]

#     student_ids = [s["id"] for s in student_list]

#     # Build academic year filter
#     year_filter = build_academic_year_filter(academic_year)

#     # ===================================================================
#     # 1. LAB TESTS STATUS (Healthians + Thyrocare) - with academic year filter
#     # ===================================================================
#     labtests_status_lookup = {sid: False for sid in student_ids}

#     if student_ids:
#         # Healthians: students who have at least one booking with report_url
#         healthians_reports = await HealthiansBooking.filter(
#             year_filter,
#             student_id__in=student_ids,
#             report_url__not_isnull=True,
#             report_url__not=""
#         ).group_by("student_id").values_list("student_id", flat=True)

#         # Thyrocare: students who have at least one order with report_url + report_available
#         thyrocare_reports = await ThyrocareOrder.filter(
#             year_filter,
#             student_id__in=student_ids,
#             report_url__not_isnull=True,
#             report_url__not="",
#             report_available=True
#         ).group_by("student_id").values_list("student_id", flat=True)

#         reported_student_ids = set(healthians_reports) | set(thyrocare_reports)
#         for sid in reported_student_ids:
#             if sid in labtests_status_lookup:
#                 labtests_status_lookup[sid] = True

#     # ===================================================================
#     # 2. ANALYSIS STATUS FIELDS (for Super Admin, PC, Analysts)
#     # ===================================================================
#     show_analysis_fields = current_user["user_role"] in {
#         AdminTeamRoles.SUPER_ADMIN,
#         AdminTeamRoles.PROGRAM_COORDINATOR,
#         AnalystRoles.NUTRITIONIST,
#         AnalystRoles.PSYCHOLOGIST,
#         AnalystRoles.MEDICAL_OFFICER,
#     }

#     nutritionist_analysis_lookup = {sid: False for sid in student_ids}
#     psychologist_analysis_lookup = {sid: False for sid in student_ids}
#     medical_officer_analysis_status = {sid: False for sid in student_ids}

#     if show_analysis_fields and student_ids:
#         # Nutrition & Psychology analysis with academic year filter
#         nutrition_recs = await ClinicalRecomendations.filter(
#             year_filter,
#             student_id__in=student_ids
#         ).only("student_id", "analysis_status")
#         for rec in nutrition_recs:
#             if rec.analysis_status:
#                 nutritionist_analysis_lookup[rec.student_id] = True

#         psych_recs = await ClinicalFindings.filter(
#             year_filter,
#             student_id__in=student_ids
#         ).only("student_id", "analysis_status")
#         for rec in psych_recs:
#             if rec.analysis_status:
#                 psychologist_analysis_lookup[rec.student_id] = True

#         # Medical Officer: all 6 reports verified?
#         if current_user["user_role"] in {AnalystRoles.MEDICAL_OFFICER, AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR}:
#             med_statuses = await MedicalScreeningStatus.filter(
#                 year_filter,
#                 student_id__in=student_ids,
#                 is_deleted=False
#             ).all()

#             med_by_student = {}
#             for ms in med_statuses:
#                 med_by_student.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = ms.status

#             required = {
#                 "physical_screening_status", "nutritional_report_status", "psychological_report_status",
#                 "vision_screening_status", "dental_screening_status", "lab_report_status"
#             }

#             for sid in student_ids:
#                 sts = med_by_student.get(sid, {})
#                 if required.issubset(sts.keys()) and all(sts.get(k) == "verified" for k in required):
#                     medical_officer_analysis_status[sid] = True

#     # ===================================================================
#     # 3. EXISTING STATUS LOGIC (OnGround, Screening, Analyst, etc.)
#     # ===================================================================
#     if current_user.get("user_role") in {
#         OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
#         AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, SchoolRoles.SCHOOL_ADMIN
#     } or current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:

#         assign_school = await AssignSchool.filter(school=school_id, is_deleted=False).first()
#         student_ids_all = [ss.student.id for ss in school_students]

#         # Fetch all screening data with academic year filter
#         attendance_statuses = await AttendanceStatus.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         dental_screenings = await DentalScreening.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         eye_screenings = await EyeScreening.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         behavioural_screenings = await BehaviouralScreening.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         nutrition_screenings = await NutritionScreening.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         smart_scale_data = await SmartScaleData.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         nutritional_analysis_status = await ClinicalRecomendations.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         psychological_analysis_status = await ClinicalFindings.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')

#         medical_screening_statuses = []
#         if current_user.get("user_role") in {AnalystRoles.MEDICAL_OFFICER, ScreeningTeamRoles.DENTIST, ScreeningTeamRoles.EYE_SPECIALIST, AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST}:
#             medical_screening_statuses = await MedicalScreeningStatus.filter(year_filter, student_id__in=student_ids_all, is_deleted=False).all()

#         # Lookups
#         status_lookup = {s.student_id: s for s in attendance_statuses}
#         dental_lookup = {s.student_id: s for s in dental_screenings}
#         eye_lookup = {s.student_id: s for s in eye_screenings}
#         behavioural_lookup = {s.student_id: s for s in behavioural_screenings}
#         nutrition_lookup = {s.student_id: s for s in nutrition_screenings}
#         smart_scale_lookup = {s.student_id: s for s in smart_scale_data}
#         nutritional_analysis_lookup = {s.student_id: s.analysis_status for s in nutritional_analysis_status}
#         psychological_analysis_lookup = {s.student_id: s.analysis_status for s in psychological_analysis_status}

#         medical_status_lookup = {}
#         for ms in medical_screening_statuses:
#             medical_status_lookup.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = {
#                 "status": ms.status, "remarks": ms.remarks
#             }

#         # ===================================================================
#         # 4. SCHOOL PAYMENT STATUS – with academic year filter
#         # ===================================================================
#         school_payment_status_lookup = {sid: False for sid in student_ids}

#         if student_ids:
#             # Find students who have at least ONE successful payment in selected academic year
#             paid_students = await StudentSchoolPayment.filter(
#                 year_filter,
#                 student_id__in=student_ids,
#                 is_deleted=False,
#                 is_paid=True
#             ).values_list("student_id", flat=True)

#             for sid in paid_students:
#                 school_payment_status_lookup[sid] = True
                
#         # ===================================================================
#         # FINAL MERGE: Add all statuses to each student
#         # ===================================================================
#         for student in student_list:
#             sid = student["id"]
#             status_update = {}

#             # 1. Lab Tests Status
#             status_update["lab_test_status"] = labtests_status_lookup.get(sid, False)
#             status_update["school_payment_status"] = school_payment_status_lookup.get(sid, False)
            
#             # 2. Analysis Status (Super Admin, PC, Analysts)
#             if show_analysis_fields:
#                 status_update.update({
#                     "nutritionist_analysis_status": nutritionist_analysis_lookup.get(sid, False),
#                     "psychologist_analysis_status": psychologist_analysis_lookup.get(sid, False),
#                     "medical_officer_analysis_status": medical_officer_analysis_status.get(sid, False),
#                 })
#                 status_update["generated_report_status"] = medical_officer_analysis_status.get(sid, False)

#             # 3. Role-based screening status
#             if current_user.get("user_role") in {
#                 OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
#                 AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, SchoolRoles.SCHOOL_ADMIN
#             }:
#                 data = {
#                     "registration_status": bool(status_lookup.get(sid)),
#                     "dental_screening_status": dental_lookup.get(sid).screening_status if dental_lookup.get(sid) else False,
#                     "eye_screening_status": eye_lookup.get(sid).screening_status if eye_lookup.get(sid) else False,
#                     "behavioural_screening_status": behavioural_lookup.get(sid).screening_status if behavioural_lookup.get(sid) else False,
#                     "nutrition_screening_status": nutrition_lookup.get(sid).screening_status if nutrition_lookup.get(sid) else False,
#                     "smart_scale_status": smart_scale_lookup.get(sid).screening_status if smart_scale_lookup.get(sid) else False,
#                 }
#                 status_update.update(data)
#                 status_update["completed_status"] = all(data.values())

#             elif current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
#                 # Medical Officer statuses
#                 if sid in medical_status_lookup:
#                     for status_type in MEDICAL_OFFICER_STATUS_TYPES:
#                         med_sts = medical_status_lookup.get(sid, {}).get(status_type, {})
#                         status_update[f"{status_type}"] = med_sts.get("status", "")
#                         status_update[f"{status_type}_remarks"] = med_sts.get("remarks", "")

#             student.update(status_update)

#     # Profile image URLs
#     for student in student_list:
#         student["profile_image"] = await get_new_url(student.get("profile_image")) or ""

#     # Final response - SAME FORMAT AS ORIGINAL
#     resp = StandardResponse(
#         status=True,
#         message="Student list retrieved successfully.",
#         data={
#             "students_list": student_list,
#             "total": total_students,
#             "page": page,
#             "page_size": page_size
#         },
#         errors={}
#     )
    
#     response = JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
#     response.headers["X-Academic-Year"] = academic_year
#     return response

# @router.get("/{school_id}/students-list", response_model=StandardResponse)
# async def get_school_students(
#     school_id: int,
#     current_user: dict = Depends(get_current_user),
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     ),
#     search: Optional[str] = Query(None, max_length=100),
#     page: int = Query(1, ge=1),
#     page_size: int = Query(1000, ge=1, le=1000),
# ):
#     allowed_roles = [
#         SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER,
#         ParentRoles.PARENT, ParentRoles.GUARDIAN,
#         AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,
#         AdminTeamRoles.HEALTH_BUDDY,
#         OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
#         ScreeningTeamRoles.NUTRITIONIST, ScreeningTeamRoles.PSYCHOLOGIST, ScreeningTeamRoles.DENTIST,
#         ScreeningTeamRoles.EYE_SPECIALIST, ScreeningTeamRoles.PHYSICAL_WELLBEING,
#         AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER,
#         ConsultantRoles.PEDIATRICIAN, ConsultantRoles.DENTIST, ConsultantRoles.NUTRITIONIST, ConsultantRoles.PSYCHOLOGIST
#     ]
#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(status=False, message=f"{creator_role} is not allowed to view student records.", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)
#     school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
#     if not school:
#         resp = StandardResponse(status=False, message="School not found.", data={}, errors={})
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)
#     # Determine academic year
#     if academic_year is None:
#         academic_year = get_current_academic_year()
#     try:
#         ay_start, ay_end = parse_academic_year(academic_year)
#     except ValueError as e:
#         resp = StandardResponse(
#             status=False,
#             message=str(e),
#             data={},
#             errors={"academic_year": str(e)}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
#     # Base query
#     query = SchoolStudents.filter(
#         school_id=school_id,
#         is_deleted=False,
#         student__is_deleted=False
#     ).prefetch_related('student')
#     if search:
#         query = query.filter(
#             Q(student__first_name__icontains=search) |
#             Q(student__middle_name__icontains=search) |
#             Q(student__last_name__icontains=search) |
#             Q(student__gender__icontains=search) |
#             Q(student__class_room__icontains=search) |
#             Q(student__section__icontains=search) |
#             Q(student__roll_no__icontains=search) |
#             Q(student__aadhaar_no__icontains=search) |
#             Q(student__abha_id__icontains=search) |
#             Q(student__mp_uhid__icontains=search) |
#             Q(student__dob__icontains=search)
#         )
#     total_students = await query.count()
#     school_students = await query.offset((page - 1) * page_size).limit(page_size)
#     school_students = sorted(school_students, key=natural_sort_key)
#     # Base student list
#     student_list = [
#         {
#             "id": ss.student.id,
#             "first_name": ss.student.first_name,
#             "middle_name": ss.student.middle_name or "",
#             "last_name": ss.student.last_name,
#             "class_room": ss.student.class_room,
#             "section": ss.student.section,
#             "roll_no": ss.student.roll_no,
#             "aadhaar_no": ss.student.aadhaar_no,
#             "abha_id": ss.student.abha_id,
#             "mp_uhid": ss.student.mp_uhid,
#             "profile_image": ss.student.profile_image or "",
#             "gender": ss.student.gender,
#             "age": str(calculate_age_string(ss.student.dob)),
#             "country_code": ss.student.country_code,
#             "phone": ss.student.phone,
#         }
#         for ss in school_students
#     ]
#     student_ids = [s["id"] for s in student_list]
#     # Build academic year filter
#     year_filter = build_academic_year_filter(academic_year)
#     # ===================================================================
#     # 1. LAB TESTS STATUS (Healthians + Thyrocare) - with academic year filter
#     # ===================================================================
#     labtests_status_lookup = {sid: False for sid in student_ids}
#     if student_ids:
#         # Healthians: students who have at least one booking with report_url
#         healthians_reports = await HealthiansBooking.filter(
#             year_filter,
#             student_id__in=student_ids,
#             report_url__not_isnull=True,
#             report_url__not=""
#         ).group_by("student_id").values_list("student_id", flat=True)
#         # Thyrocare: students who have at least one order with report_url + report_available
#         thyrocare_reports = await ThyrocareOrder.filter(
#             year_filter,
#             student_id__in=student_ids,
#             report_url__not_isnull=True,
#             report_url__not="",
#             report_available=True
#         ).group_by("student_id").values_list("student_id", flat=True)
#         reported_student_ids = set(healthians_reports) | set(thyrocare_reports)
#         for sid in reported_student_ids:
#             if sid in labtests_status_lookup:
#                 labtests_status_lookup[sid] = True
#     # ===================================================================
#     # 2. MEDICAL SCREENING STATUS - All 6 required statuses verified
#     # ===================================================================
#     generated_report_status_lookup = {sid: False for sid in student_ids}
#     if student_ids:
#         required_statuses = {
#             "physical_screening_status", 
#             "lab_report_status", 
#             "dental_screening_status", 
#             "vision_screening_status", 
#             "psychological_report_status", 
#             "nutritional_report_status"
#         }
#         med_statuses = await MedicalScreeningStatus.filter(
#             year_filter,
#             student_id__in=student_ids,
#             is_deleted=False
#         ).all()
        
#         med_by_student = {}
#         for ms in med_statuses:
#             med_by_student.setdefault(ms.student_id, {}).setdefault(ms.medical_officer_status_type, ms.status)
        
#         for sid in student_ids:
#             student_statuses = med_by_student.get(sid, {})
#             # Check if all required statuses exist and are "verified"
#             if required_statuses.issubset(student_statuses.keys()) and all(
#                 student_statuses[status_type] == "verified" for status_type in required_statuses
#             ):
#                 generated_report_status_lookup[sid] = True
#     # ===================================================================
#     # 3. ANALYSIS STATUS FIELDS (for Super Admin, PC, Analysts)
#     # ===================================================================
#     show_analysis_fields = current_user["user_role"] in {
#         AdminTeamRoles.SUPER_ADMIN,
#         AdminTeamRoles.PROGRAM_COORDINATOR,
#         AnalystRoles.NUTRITIONIST,
#         AnalystRoles.PSYCHOLOGIST,
#         AnalystRoles.MEDICAL_OFFICER,
#     }
#     nutritionist_analysis_lookup = {sid: False for sid in student_ids}
#     psychologist_analysis_lookup = {sid: False for sid in student_ids}
#     medical_officer_analysis_status = {sid: False for sid in student_ids}
#     if show_analysis_fields and student_ids:
#         # Nutrition & Psychology analysis with academic year filter
#         nutrition_recs = await ClinicalRecomendations.filter(
#             year_filter,
#             student_id__in=student_ids
#         ).only("student_id", "analysis_status")
#         for rec in nutrition_recs:
#             if rec.analysis_status:
#                 nutritionist_analysis_lookup[rec.student_id] = True
#         psych_recs = await ClinicalFindings.filter(
#             year_filter,
#             student_id__in=student_ids
#         ).only("student_id", "analysis_status")
#         for rec in psych_recs:
#             if rec.analysis_status:
#                 psychologist_analysis_lookup[rec.student_id] = True
#         # Medical Officer analysis status is now using generated_report_status_lookup
#     # ===================================================================
#     # 4. EXISTING STATUS LOGIC (OnGround, Screening, Analyst, etc.)
#     # ===================================================================
#     if current_user.get("user_role") in {
#         OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
#         AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, SchoolRoles.SCHOOL_ADMIN
#     } or current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
#         assign_school = await AssignSchool.filter(school=school_id, is_deleted=False).first()
#         student_ids_all = [ss.student.id for ss in school_students]
#         # Fetch all screening data with academic year filter
#         attendance_statuses = await AttendanceStatus.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         dental_screenings = await DentalScreening.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         eye_screenings = await EyeScreening.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         behavioural_screenings = await BehaviouralScreening.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         nutrition_screenings = await NutritionScreening.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         smart_scale_data = await SmartScaleData.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         nutritional_analysis_status = await ClinicalRecomendations.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         psychological_analysis_status = await ClinicalFindings.filter(year_filter, student_id__in=student_ids_all).order_by('-created_at')
#         medical_screening_statuses = []
#         if current_user.get("user_role") in {AnalystRoles.MEDICAL_OFFICER, ScreeningTeamRoles.DENTIST, ScreeningTeamRoles.EYE_SPECIALIST, AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST}:
#             medical_screening_statuses = await MedicalScreeningStatus.filter(year_filter, student_id__in=student_ids_all, is_deleted=False).all()
#         # Lookups
#         status_lookup = {s.student_id: s for s in attendance_statuses}
#         dental_lookup = {s.student_id: s for s in dental_screenings}
#         eye_lookup = {s.student_id: s for s in eye_screenings}
#         behavioural_lookup = {s.student_id: s for s in behavioural_screenings}
#         nutrition_lookup = {s.student_id: s for s in nutrition_screenings}
#         smart_scale_lookup = {s.student_id: s for s in smart_scale_data}
#         nutritional_analysis_lookup = {s.student_id: s.analysis_status for s in nutritional_analysis_status}
#         psychological_analysis_lookup = {s.student_id: s.analysis_status for s in psychological_analysis_status}
#         medical_status_lookup = {}
#         for ms in medical_screening_statuses:
#             medical_status_lookup.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = {
#                 "status": ms.status, "remarks": ms.remarks
#             }
#         # ===================================================================
#         # 5. SCHOOL PAYMENT STATUS – with academic year filter
#         # ===================================================================
#         school_payment_status_lookup = {sid: False for sid in student_ids}
#         if student_ids:
#             # Find students who have at least ONE successful payment in selected academic year
#             paid_students = await StudentSchoolPayment.filter(
#                 year_filter,
#                 student_id__in=student_ids,
#                 is_deleted=False,
#                 is_paid=True
#             ).values_list("student_id", flat=True)
#             for sid in paid_students:
#                 school_payment_status_lookup[sid] = True
               
#         # ===================================================================
#         # FINAL MERGE: Add all statuses to each student
#         # ===================================================================
#         for student in student_list:
#             sid = student["id"]
#             status_update = {}
#             # 1. Lab Tests Status (unchanged)
#             status_update["lab_test_status"] = labtests_status_lookup.get(sid, False)
#             status_update["school_payment_status"] = school_payment_status_lookup.get(sid, False)
           
#             # 2. Analysis Status (Super Admin, PC, Analysts)
#             if show_analysis_fields:
#                 status_update.update({
#                     "nutritionist_analysis_status": nutritionist_analysis_lookup.get(sid, False),
#                     "psychologist_analysis_status": psychologist_analysis_lookup.get(sid, False),
#                     "medical_officer_analysis_status": generated_report_status_lookup.get(sid, False),
#                 })
#                 status_update["generated_report_status"] = generated_report_status_lookup.get(sid, False)
#             # 3. Role-based screening status
#             if current_user.get("user_role") in {
#                 OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
#                 AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, SchoolRoles.SCHOOL_ADMIN
#             }:
#                 data = {
#                     "registration_status": bool(status_lookup.get(sid)),
#                     "dental_screening_status": dental_lookup.get(sid).screening_status if dental_lookup.get(sid) else False,
#                     "eye_screening_status": eye_lookup.get(sid).screening_status if eye_lookup.get(sid) else False,
#                     "behavioural_screening_status": behavioural_lookup.get(sid).screening_status if behavioural_lookup.get(sid) else False,
#                     "nutrition_screening_status": nutrition_lookup.get(sid).screening_status if nutrition_lookup.get(sid) else False,
#                     "smart_scale_status": smart_scale_lookup.get(sid).screening_status if smart_scale_lookup.get(sid) else False,
#                 }
#                 status_update.update(data)
#                 status_update["completed_status"] = all(data.values())
#             elif current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
#                 # Medical Officer statuses
#                 if sid in medical_status_lookup:
#                     for status_type in MEDICAL_OFFICER_STATUS_TYPES:
#                         med_sts = medical_status_lookup.get(sid, {}).get(status_type, {})
#                         status_update[f"{status_type}"] = med_sts.get("status", "")
#                         status_update[f"{status_type}_remarks"] = med_sts.get("remarks", "")
#             student.update(status_update)
#     # Profile image URLs
#     for student in student_list:
#         student["profile_image"] = await get_new_url(student.get("profile_image")) or ""
#     # Final response - SAME FORMAT AS ORIGINAL
#     resp = StandardResponse(
#         status=True,
#         message="Student list retrieved successfully.",
#         data={
#             "students_list": student_list,
#             "total": total_students,
#             "page": page,
#             "page_size": page_size
#         },
#         errors={}
#     )
   
#     response = JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
#     response.headers["X-Academic-Year"] = academic_year
#     return response

# @router.get("/{school_id}/students-list", response_model=StandardResponse)
# async def get_school_students(
#     school_id: int,
#     current_user: dict = Depends(get_current_user),
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     ),
#     search: Optional[str] = Query(None, max_length=100),
#     page: int = Query(1, ge=1),
#     page_size: int = Query(1000, ge=1, le=1000),
# ):
#     allowed_roles = [
#         SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER,
#         ParentRoles.PARENT, ParentRoles.GUARDIAN,
#         AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,
#         AdminTeamRoles.HEALTH_BUDDY,
#         OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
#         ScreeningTeamRoles.NUTRITIONIST, ScreeningTeamRoles.PSYCHOLOGIST, ScreeningTeamRoles.DENTIST,
#         ScreeningTeamRoles.EYE_SPECIALIST, ScreeningTeamRoles.PHYSICAL_WELLBEING,
#         AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER,
#         ConsultantRoles.PEDIATRICIAN, ConsultantRoles.DENTIST, ConsultantRoles.NUTRITIONIST, ConsultantRoles.PSYCHOLOGIST
#     ]
#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role} is not allowed to view student records.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
#     if not school:
#         resp = StandardResponse(
#             status=False,
#             message="School not found.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Determine academic year
#     if academic_year is None:
#         academic_year = get_current_academic_year()
#     try:
#         ay_start, ay_end = parse_academic_year(academic_year)
#     except ValueError as e:
#         resp = StandardResponse(
#             status=False,
#             message=str(e),
#             data={},
#             errors={"academic_year": str(e)}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     # Base query
#     query = SchoolStudents.filter(
#         school_id=school_id,
#         is_deleted=False,
#         student__is_deleted=False
#     ).prefetch_related("student")

#     if search:
#         query = query.filter(
#             Q(student__first_name__icontains=search) |
#             Q(student__middle_name__icontains=search) |
#             Q(student__last_name__icontains=search) |
#             Q(student__gender__icontains=search) |
#             Q(student__class_room__icontains=search) |
#             Q(student__section__icontains=search) |
#             Q(student__roll_no__icontains=search) |
#             Q(student__aadhaar_no__icontains=search) |
#             Q(student__abha_id__icontains=search) |
#             Q(student__mp_uhid__icontains=search) |
#             Q(student__dob__icontains=search)
#         )

#     total_students = await query.count()
#     school_students = await query.offset((page - 1) * page_size).limit(page_size)
#     school_students = sorted(school_students, key=natural_sort_key)

#     # Base student list
#     student_list = [
#         {
#             "id": ss.student.id,
#             "first_name": ss.student.first_name,
#             "middle_name": ss.student.middle_name or "",
#             "last_name": ss.student.last_name,
#             "class_room": ss.student.class_room,
#             "section": ss.student.section,
#             "roll_no": ss.student.roll_no,
#             "aadhaar_no": ss.student.aadhaar_no,
#             "abha_id": ss.student.abha_id,
#             "mp_uhid": ss.student.mp_uhid,
#             "profile_image": ss.student.profile_image or "",
#             "gender": ss.student.gender,
#             "age": str(calculate_age_string(ss.student.dob)),
#             "country_code": ss.student.country_code,
#             "phone": ss.student.phone,
#         }
#         for ss in school_students
#     ]
#     student_ids = [s["id"] for s in student_list]

#     # Academic year filter
#     year_filter = build_academic_year_filter(academic_year)

#     # 1. Lab tests status
#     labtests_status_lookup = {sid: False for sid in student_ids}
#     if student_ids:
#         healthians_reports = await HealthiansBooking.filter(
#             year_filter,
#             student_id__in=student_ids,
#             report_url__not_isnull=True,
#             report_url__not=""
#         ).group_by("student_id").values_list("student_id", flat=True)

#         thyrocare_reports = await ThyrocareOrder.filter(
#             year_filter,
#             student_id__in=student_ids,
#             report_url__not_isnull=True,
#             report_url__not="",
#             report_available=True
#         ).group_by("student_id").values_list("student_id", flat=True)

#         reported_student_ids = set(healthians_reports) | set(thyrocare_reports)
#         for sid in reported_student_ids:
#             if sid in labtests_status_lookup:
#                 labtests_status_lookup[sid] = True

#     # 2. Medical screening status → generated_report_status
#     generated_report_status_lookup = {sid: False for sid in student_ids}
#     if student_ids:
#         required_statuses = {
#             "physical_screening_status",
#             "lab_report_status",
#             "dental_screening_status",
#             "vision_screening_status",
#             "psychological_report_status",
#             "nutritional_report_status",
#         }
#         med_statuses = await MedicalScreeningStatus.filter(
#             year_filter,
#             student_id__in=student_ids,
#             is_deleted=False,
#         ).all()

#         med_by_student: Dict[int, Dict[str, str]] = {}
#         for ms in med_statuses:
#             med_by_student.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = ms.status

#         for sid in student_ids:
#             student_statuses = med_by_student.get(sid, {})
#             if required_statuses.issubset(student_statuses.keys()) and all(
#                 student_statuses[status_type] == "verified"
#                 for status_type in required_statuses
#             ):
#                 generated_report_status_lookup[sid] = True

#     # 3. Analysis status (Super Admin, PC, Analysts)
#     show_analysis_fields = current_user["user_role"] in {
#         AdminTeamRoles.SUPER_ADMIN,
#         AdminTeamRoles.PROGRAM_COORDINATOR,
#         AnalystRoles.NUTRITIONIST,
#         AnalystRoles.PSYCHOLOGIST,
#         AnalystRoles.MEDICAL_OFFICER,
#     }
#     nutritionist_analysis_lookup = {sid: False for sid in student_ids}
#     psychologist_analysis_lookup = {sid: False for sid in student_ids}

#     if show_analysis_fields and student_ids:
#         nutrition_recs = await ClinicalRecomendations.filter(
#             year_filter,
#             student_id__in=student_ids,
#         ).only("student_id", "analysis_status")
#         for rec in nutrition_recs:
#             if rec.analysis_status:
#                 nutritionist_analysis_lookup[rec.student_id] = True

#         psych_recs = await ClinicalFindings.filter(
#             year_filter,
#             student_id__in=student_ids,
#         ).only("student_id", "analysis_status")
#         for rec in psych_recs:
#             if rec.analysis_status:
#                 psychologist_analysis_lookup[rec.student_id] = True

#     # 4. Role-based screening + medical details
#     if current_user.get("user_role") in {
#         OnGroundTeamRoles.REGISTRATION_TEAM,
#         OnGroundTeamRoles.CAMP_COORDINATOR,
#         AdminTeamRoles.SUPER_ADMIN,
#         AdminTeamRoles.PROGRAM_COORDINATOR,
#         SchoolRoles.SCHOOL_ADMIN,
#     } or current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
#         assign_school = await AssignSchool.filter(school=school_id, is_deleted=False).first()
#         student_ids_all = [ss.student.id for ss in school_students]

#         attendance_statuses = await AttendanceStatus.filter(
#             year_filter, student_id__in=student_ids_all
#         ).order_by("-created_at")
#         dental_screenings = await DentalScreening.filter(
#             year_filter, student_id__in=student_ids_all
#         ).order_by("-created_at")
#         eye_screenings = await EyeScreening.filter(
#             year_filter, student_id__in=student_ids_all
#         ).order_by("-created_at")
#         behavioural_screenings = await BehaviouralScreening.filter(
#             year_filter, student_id__in=student_ids_all
#         ).order_by("-created_at")
#         nutrition_screenings = await NutritionScreening.filter(
#             year_filter, student_id__in=student_ids_all
#         ).order_by("-created_at")
#         smart_scale_data = await SmartScaleData.filter(
#             year_filter, student_id__in=student_ids_all
#         ).order_by("-created_at")
#         nutritional_analysis_status = await ClinicalRecomendations.filter(
#             year_filter, student_id__in=student_ids_all
#         ).order_by("-created_at")
#         psychological_analysis_status = await ClinicalFindings.filter(
#             year_filter, student_id__in=student_ids_all
#         ).order_by("-created_at")

#         medical_screening_statuses = []
#         if current_user.get("user_role") in {
#             AnalystRoles.MEDICAL_OFFICER,
#             ScreeningTeamRoles.DENTIST,
#             ScreeningTeamRoles.EYE_SPECIALIST,
#             AnalystRoles.NUTRITIONIST,
#             AnalystRoles.PSYCHOLOGIST,
#         }:
#             medical_screening_statuses = await MedicalScreeningStatus.filter(
#                 year_filter, student_id__in=student_ids_all, is_deleted=False
#             ).all()

#         status_lookup = {s.student_id: s for s in attendance_statuses}
#         dental_lookup = {s.student_id: s for s in dental_screenings}
#         eye_lookup = {s.student_id: s for s in eye_screenings}
#         behavioural_lookup = {s.student_id: s for s in behavioural_screenings}
#         nutrition_lookup = {s.student_id: s for s in nutrition_screenings}
#         smart_scale_lookup = {s.student_id: s for s in smart_scale_data}
#         nutritional_analysis_lookup = {
#             s.student_id: s.analysis_status for s in nutritional_analysis_status
#         }
#         psychological_analysis_lookup = {
#             s.student_id: s.analysis_status for s in psychological_analysis_status
#         }

#         medical_status_lookup: Dict[int, Dict[str, Dict[str, str]]] = {}
#         for ms in medical_screening_statuses:
#             medical_status_lookup.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = {
#                 "status": ms.status,
#                 "remarks": ms.remarks,
#             }

#         # 5. School payment status
#         school_payment_status_lookup = {sid: False for sid in student_ids}
#         if student_ids:
#             paid_students = await StudentSchoolPayment.filter(
#                 year_filter,
#                 student_id__in=student_ids,
#                 is_deleted=False,
#                 is_paid=True,
#             ).values_list("student_id", flat=True)
#             for sid in paid_students:
#                 school_payment_status_lookup[sid] = True

#         # 6. Final merge (includes PC medical details)
#         MEDICAL_OFFICER_STATUS_TYPES = [
#             "physical_screening_status",
#             "lab_report_status",
#             "dental_screening_status",
#             "vision_screening_status",
#             "psychological_report_status",
#             "nutritional_report_status",
#             "medical_report_status",
#         ]

#         show_medical_details = current_user.get("user_role") in {
#             AnalystRoles.MEDICAL_OFFICER,
#             AdminTeamRoles.SUPER_ADMIN,
#             AdminTeamRoles.PROGRAM_COORDINATOR,
#         }

#         for student in student_list:
#             sid = student["id"]
#             status_update: Dict[str, Any] = {}

#             status_update["lab_test_status"] = labtests_status_lookup.get(sid, False)
#             status_update["school_payment_status"] = school_payment_status_lookup.get(sid, False)

#             if show_analysis_fields:
#                 status_update.update(
#                     {
#                         "nutritionist_analysis_status": nutritionist_analysis_lookup.get(sid, False),
#                         "psychologist_analysis_status": psychologist_analysis_lookup.get(sid, False),
#                         "medical_officer_analysis_status": generated_report_status_lookup.get(sid, False),
#                     }
#                 )
#                 status_update["generated_report_status"] = generated_report_status_lookup.get(sid, False)

#             if current_user.get("user_role") in {
#                 OnGroundTeamRoles.REGISTRATION_TEAM,
#                 OnGroundTeamRoles.CAMP_COORDINATOR,
#                 AdminTeamRoles.SUPER_ADMIN,
#                 AdminTeamRoles.PROGRAM_COORDINATOR,
#                 SchoolRoles.SCHOOL_ADMIN,
#             }:
#                 data = {
#                     "registration_status": bool(status_lookup.get(sid)),
#                     "dental_screening_status": dental_lookup.get(sid).screening_status
#                     if dental_lookup.get(sid)
#                     else False,
#                     "eye_screening_status": eye_lookup.get(sid).screening_status
#                     if eye_lookup.get(sid)
#                     else False,
#                     "behavioural_screening_status": behavioural_lookup.get(sid).screening_status
#                     if behavioural_lookup.get(sid)
#                     else False,
#                     "nutrition_screening_status": nutrition_lookup.get(sid).screening_status
#                     if nutrition_lookup.get(sid)
#                     else False,
#                     "smart_scale_status": smart_scale_lookup.get(sid).screening_status
#                     if smart_scale_lookup.get(sid)
#                     else False,
#                 }
#                 status_update.update(data)
#                 status_update["completed_status"] = all(data.values())

#             elif show_medical_details:
#                 if sid in medical_status_lookup:
#                     for status_type in MEDICAL_OFFICER_STATUS_TYPES:
#                         med_sts = medical_status_lookup.get(sid, {}).get(status_type, {})
#                         status_update[f"{status_type}"] = med_sts.get("status", "")
#                         status_update[f"{status_type}_remarks"] = med_sts.get("remarks", "")
#                 else:
#                     for status_type in MEDICAL_OFFICER_STATUS_TYPES:
#                         status_update[f"{status_type}"] = ""
#                         status_update[f"{status_type}_remarks"] = ""

#             student.update(status_update)

#     # Profile image URLs
#     for student in student_list:
#         student["profile_image"] = await get_new_url(student.get("profile_image")) or ""

#     resp = StandardResponse(
#         status=True,
#         message="Student list retrieved successfully.",
#         data={
#             "students_list": student_list,
#             "total": total_students,
#             "page": page,
#             "page_size": page_size,
#         },
#         errors={},
#     )
#     response = JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
#     response.headers["X-Academic-Year"] = academic_year
#     return response

@router.get("/{school_id}/students-list", response_model=StandardResponse)
async def get_school_students(
    school_id: int,
    current_user: dict = Depends(get_current_user),
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    search: Optional[str] = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(1000, ge=1, le=1000),
):
    allowed_roles = [
        SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER,
        ParentRoles.PARENT, ParentRoles.GUARDIAN,
        AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.HEALTH_BUDDY,
        OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR,
        ScreeningTeamRoles.NUTRITIONIST, ScreeningTeamRoles.PSYCHOLOGIST, ScreeningTeamRoles.DENTIST,
        ScreeningTeamRoles.EYE_SPECIALIST, ScreeningTeamRoles.PHYSICAL_WELLBEING,
        AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER,
        ConsultantRoles.PEDIATRICIAN, ConsultantRoles.DENTIST, ConsultantRoles.NUTRITIONIST, ConsultantRoles.PSYCHOLOGIST
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to view student records.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
    if not school:
        resp = StandardResponse(
            status=False,
            message="School not found.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()
    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        resp = StandardResponse(
            status=False,
            message=str(e),
            data={},
            errors={"academic_year": str(e)}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # Base query
    query = SchoolStudents.filter(
        school_id=school_id,
        is_deleted=False,
        student__is_deleted=False
    ).prefetch_related("student")

    if search:
        query = query.filter(
            Q(student__first_name__icontains=search) |
            Q(student__middle_name__icontains=search) |
            Q(student__last_name__icontains=search) |
            Q(student__gender__icontains=search) |
            Q(student__class_room__icontains=search) |
            Q(student__section__icontains=search) |
            Q(student__roll_no__icontains=search) |
            Q(student__aadhaar_no__icontains=search) |
            Q(student__abha_id__icontains=search) |
            Q(student__mp_uhid__icontains=search) |
            Q(student__dob__icontains=search)
        )

    total_students = await query.count()
    school_students = await query.offset((page - 1) * page_size).limit(page_size)
    school_students = sorted(school_students, key=natural_sort_key)

    # Base student list
    student_list = [
        {
            "id": ss.student.id,
            "first_name": ss.student.first_name,
            "middle_name": ss.student.middle_name or "",
            "last_name": ss.student.last_name,
            "class_room": ss.student.class_room,
            "section": ss.student.section,
            "roll_no": ss.student.roll_no,
            "aadhaar_no": ss.student.aadhaar_no,
            "abha_id": ss.student.abha_id,
            "mp_uhid": ss.student.mp_uhid,
            "profile_image": ss.student.profile_image or "",
            "gender": ss.student.gender,
            "age": str(calculate_age_string(ss.student.dob)),
            "country_code": ss.student.country_code,
            "phone": ss.student.phone,
        }
        for ss in school_students
    ]
    student_ids = [s["id"] for s in student_list]

    # Academic year filter
    year_filter = build_academic_year_filter(academic_year)

    # Medical Officer status types constant
    MEDICAL_OFFICER_STATUS_TYPES = [
        "physical_screening_status",
        "lab_report_status",
        "dental_screening_status",
        "vision_screening_status",
        "psychological_report_status",
        "nutritional_report_status",
        "medical_report_status",
    ]

    # ===================================================================
    # HELPER FUNCTION TO GET SCREENING STATUS SAFELY
    # ===================================================================
    def get_screening_status(lookup_dict, student_id):
        """Safely get screening_status from lookup dict"""
        record = lookup_dict.get(student_id)
        if record and hasattr(record, 'screening_status'):
            return bool(record.screening_status)
        return False

    # # 1. Lab tests status
    # labtests_status_lookup = {sid: False for sid in student_ids}
    # if student_ids:
        
    #     # ✅ CORRECT (checks if student GOT BOOKED)
    #     healthians_bookings = await HealthiansBooking.filter(
    #         year_filter,
    #         student_id__in=student_ids,
    #         # Optionally: payment_status="paid" or booking_status="confirmed"
    #     ).distinct().values_list("student_id", flat=True)

    #     thyrocare_orders = await ThyrocareOrder.filter(
    #         year_filter,
    #         student_id__in=student_ids,
    #         # Optionally: status="confirmed" or payment confirmed
    #     ).distinct().values_list("student_id", flat=True)

    #     booked_student_ids = set(healthians_bookings) | set(thyrocare_orders)
    #     for sid in booked_student_ids:
    #         labtests_status_lookup[sid] = True
        
    # 1. Lab tests status
    labtests_status_lookup = {sid: False for sid in student_ids}
    if student_ids:
        # Get unique student IDs who have Healthians bookings
        healthians_bookings = await HealthiansBooking.filter(
            year_filter,
            student_id__in=student_ids,
        ).values_list("student_id", flat=True)
        
        # Get unique student IDs who have Thyrocare orders  
        thyrocare_orders = await ThyrocareOrder.filter(
            year_filter,
            student_id__in=student_ids,
        ).values_list("student_id", flat=True)
        
        # Use set() to get unique student IDs from both sources
        booked_student_ids = set(healthians_bookings) | set(thyrocare_orders)
        
        # Update lookup dictionary
        for sid in booked_student_ids:
            labtests_status_lookup[sid] = True


    # 2. School payment status
    school_payment_status_lookup = {sid: False for sid in student_ids}
    if student_ids:
        paid_students = await StudentSchoolPayment.filter(
            year_filter,
            student_id__in=student_ids,
            is_deleted=False,
            is_paid=True,
        ).distinct().values_list("student_id", flat=True)
        for sid in paid_students:
            school_payment_status_lookup[sid] = True

    # 3. Medical screening status → generated_report_status
    generated_report_status_lookup = {sid: False for sid in student_ids}
    if student_ids:
        required_statuses = {
            "physical_screening_status",
            "lab_report_status",
            "dental_screening_status",
            "vision_screening_status",
            "psychological_report_status",
            "nutritional_report_status",
        }
        med_statuses = await MedicalScreeningStatus.filter(
            year_filter,
            student_id__in=student_ids,
            is_deleted=False,
        ).all()

        med_by_student: Dict[int, Dict[str, str]] = {}
        for ms in med_statuses:
            med_by_student.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = ms.status

        for sid in student_ids:
            student_statuses = med_by_student.get(sid, {})
            if required_statuses.issubset(student_statuses.keys()) and all(
                student_statuses[status_type] == "verified"
                for status_type in required_statuses
            ):
                generated_report_status_lookup[sid] = True

    # 4. Analysis status (Super Admin, PC, Analysts)
    show_analysis_fields = current_user["user_role"] in {
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AnalystRoles.NUTRITIONIST,
        AnalystRoles.PSYCHOLOGIST,
        AnalystRoles.MEDICAL_OFFICER,
    }
    nutritionist_analysis_lookup = {sid: False for sid in student_ids}
    psychologist_analysis_lookup = {sid: False for sid in student_ids}

    if show_analysis_fields and student_ids:
        nutrition_recs = await ClinicalRecomendations.filter(
            year_filter,
            student_id__in=student_ids,
        ).only("student_id", "analysis_status")
        for rec in nutrition_recs:
            if rec.analysis_status:
                nutritionist_analysis_lookup[rec.student_id] = True

        psych_recs = await ClinicalFindings.filter(
            year_filter,
            student_id__in=student_ids,
        ).only("student_id", "analysis_status")
        for rec in psych_recs:
            if rec.analysis_status:
                psychologist_analysis_lookup[rec.student_id] = True

    # ===================================================================
    # 5. FETCH SCREENING DATA FOR ALL RELEVANT ROLES
    # ===================================================================
    if current_user.get("user_role") in {
        OnGroundTeamRoles.REGISTRATION_TEAM,
        OnGroundTeamRoles.CAMP_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.HEALTH_BUDDY,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        SchoolRoles.SCHOOL_ADMIN,
        ScreeningTeamRoles.NUTRITIONIST,
        ScreeningTeamRoles.PSYCHOLOGIST,
        ScreeningTeamRoles.DENTIST,
        ScreeningTeamRoles.EYE_SPECIALIST,
        ScreeningTeamRoles.PHYSICAL_WELLBEING,
        AnalystRoles.NUTRITIONIST,
        AnalystRoles.PSYCHOLOGIST,
        AnalystRoles.MEDICAL_OFFICER,
    }:
        student_ids_all = [ss.student.id for ss in school_students]

        # ✅ FETCH ALL SCREENING DATA
        attendance_statuses = await AttendanceStatus.filter(
            year_filter, student_id__in=student_ids_all
        ).order_by("-created_at")
        dental_screenings = await DentalScreening.filter(
            year_filter, student_id__in=student_ids_all
        ).order_by("-created_at")
        eye_screenings = await EyeScreening.filter(
            year_filter, student_id__in=student_ids_all
        ).order_by("-created_at")
        behavioural_screenings = await BehaviouralScreening.filter(
            year_filter, student_id__in=student_ids_all
        ).order_by("-created_at")
        nutrition_screenings = await NutritionScreening.filter(
            year_filter, student_id__in=student_ids_all
        ).order_by("-created_at")
        smart_scale_data = await SmartScaleData.filter(
            year_filter, student_id__in=student_ids_all
        ).order_by("-created_at")

        # ✅ FETCH MEDICAL SCREENING STATUSES
        medical_screening_statuses = []
        if current_user.get("user_role") in {
            AnalystRoles.MEDICAL_OFFICER,
            ScreeningTeamRoles.DENTIST,
            ScreeningTeamRoles.EYE_SPECIALIST,
            AnalystRoles.NUTRITIONIST,
            AnalystRoles.PSYCHOLOGIST,
            AdminTeamRoles.SUPER_ADMIN,
            AdminTeamRoles.PROGRAM_COORDINATOR,
        }:
            medical_screening_statuses = await MedicalScreeningStatus.filter(
                year_filter, student_id__in=student_ids_all, is_deleted=False
            ).all()

        # ✅ BUILD LOOKUPS
        status_lookup = {s.student_id: s for s in attendance_statuses}
        dental_lookup = {s.student_id: s for s in dental_screenings}
        eye_lookup = {s.student_id: s for s in eye_screenings}
        behavioural_lookup = {s.student_id: s for s in behavioural_screenings}
        nutrition_lookup = {s.student_id: s for s in nutrition_screenings}
        smart_scale_lookup = {s.student_id: s for s in smart_scale_data}

        medical_status_lookup: Dict[int, Dict[str, Dict[str, str]]] = {}
        for ms in medical_screening_statuses:
            medical_status_lookup.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = {
                "status": ms.status,
                "remarks": ms.remarks,
            }

        # ===================================================================
        # 6. APPLY STATUS UPDATES BASED ON ROLE
        # ===================================================================
        for student in student_list:
            sid = student["id"]
            status_update: Dict[str, Any] = {}

            # Add common fields for admins and analysts
            status_update["lab_test_status"] = labtests_status_lookup.get(sid, False)
            status_update["school_payment_status"] = school_payment_status_lookup.get(sid, False)

            if show_analysis_fields:
                status_update.update(
                    {
                        "nutrition_analysis_status": nutritionist_analysis_lookup.get(sid, False),
                        "psychological_analysis_status": psychologist_analysis_lookup.get(sid, False),
                        "generated_report_status": generated_report_status_lookup.get(sid, False),
                        "medical_officer_analysis_status": generated_report_status_lookup.get(sid, False), # This is also medical officer analysis status
                    }
                )

            # ✅ ADMIN / REGISTRATION / PC / SCHOOL ADMIN
            if current_user.get("user_role") in {
                OnGroundTeamRoles.REGISTRATION_TEAM,
                OnGroundTeamRoles.CAMP_COORDINATOR,
                AdminTeamRoles.SUPER_ADMIN,
                AdminTeamRoles.PROGRAM_COORDINATOR,
                AdminTeamRoles.HEALTH_BUDDY,
                SchoolRoles.SCHOOL_ADMIN,
            }:
                data = {
                    "registration_status": bool(status_lookup.get(sid)),
                    "dental_screening_status": get_screening_status(dental_lookup, sid),
                    "eye_screening_status": get_screening_status(eye_lookup, sid),
                    "behavioural_screening_status": get_screening_status(behavioural_lookup, sid),
                    "nutrition_screening_status": get_screening_status(nutrition_lookup, sid),
                    "smart_scale_status": get_screening_status(smart_scale_lookup, sid),
                }
                status_update.update(data)
                status_update["completed_status"] = all(data.values())

            # ✅ SCREENING TEAM: PHYSICAL_WELLBEING
            elif (
                current_user.get("role_type") == "SCREENING_TEAM"
                and current_user.get("user_role") == ScreeningTeamRoles.PHYSICAL_WELLBEING
            ):
                status_update["screening_status"] = get_screening_status(smart_scale_lookup, sid)

            # ✅ SCREENING TEAM: EYE_SPECIALIST
            elif (
                current_user.get("role_type") == "SCREENING_TEAM"
                and current_user.get("user_role") == ScreeningTeamRoles.EYE_SPECIALIST
            ):
                if sid in medical_status_lookup:
                    eye_specialist_medical_statuses = {
                        "vision_screening_status": medical_status_lookup[sid]
                        .get("vision_screening_status", {})
                        .get("status", "not_verified")
                        if "vision_screening_status" in medical_status_lookup[sid]
                        else "not_verified"
                    }
                else:
                    eye_specialist_medical_statuses = {
                        "vision_screening_status": "not_verified"
                    }

                status_update.update(
                    {
                        "screening_status": get_screening_status(eye_lookup, sid),
                        **eye_specialist_medical_statuses,
                    }
                )

            # ✅ SCREENING TEAM: DENTIST
            elif (
                current_user.get("role_type") == "SCREENING_TEAM"
                and current_user.get("user_role") == ScreeningTeamRoles.DENTIST
            ):
                if sid in medical_status_lookup:
                    dentist_medical_statuses = {
                        "dental_screening_status": medical_status_lookup[sid]
                        .get("dental_screening_status", {})
                        .get("status", "not_verified")
                        if "dental_screening_status" in medical_status_lookup[sid]
                        else "not_verified"
                    }
                else:
                    dentist_medical_statuses = {
                        "dental_screening_status": "not_verified"
                    }

                status_update.update(
                    {
                        "screening_status": get_screening_status(dental_lookup, sid),
                        **dentist_medical_statuses,
                    }
                )

            # ✅ SCREENING TEAM: NUTRITIONIST
            elif (
                current_user.get("role_type") == "SCREENING_TEAM"
                and current_user.get("user_role") == ScreeningTeamRoles.NUTRITIONIST
            ):
                status_update["screening_status"] = get_screening_status(nutrition_lookup, sid)

            # ✅ SCREENING TEAM: PSYCHOLOGIST
            elif (
                current_user.get("role_type") == "SCREENING_TEAM"
                and current_user.get("user_role") == ScreeningTeamRoles.PSYCHOLOGIST
            ):
                status_update["screening_status"] = get_screening_status(behavioural_lookup, sid)

            # ✅ ANALYST: NUTRITIONIST
            elif (
                current_user.get("role_type") == "ANALYST_TEAM"
                and current_user.get("user_role") == AnalystRoles.NUTRITIONIST
            ):
                if sid in medical_status_lookup:
                    nutritionist_medical_statuses = {
                        "physical_screening_status": medical_status_lookup[sid]
                        .get("physical_screening_status", {})
                        .get("status", "not_verified")
                        if "physical_screening_status" in medical_status_lookup[sid]
                        else "not_verified",
                        "nutritional_report_status": medical_status_lookup[sid]
                        .get("nutritional_report_status", {})
                        .get("status", "not_verified")
                        if "nutritional_report_status" in medical_status_lookup[sid]
                        else "not_verified",
                        "lab_report_status": medical_status_lookup[sid]
                        .get("lab_report_status", {})
                        .get("status", "not_verified")
                        if "lab_report_status" in medical_status_lookup[sid]
                        else "not_verified",
                    }
                else:
                    nutritionist_medical_statuses = {
                        "physical_screening_status": "not_verified",
                        "nutritional_report_status": "not_verified",
                        "lab_report_status": "not_verified",
                    }

                status_update.update(
                    {
                        "analysis_status": bool(nutritionist_analysis_lookup.get(sid)),
                        **nutritionist_medical_statuses,
                    }
                )

            # ✅ ANALYST: PSYCHOLOGIST
            elif (
                current_user.get("role_type") == "ANALYST_TEAM"
                and current_user.get("user_role") == AnalystRoles.PSYCHOLOGIST
            ):
                if sid in medical_status_lookup:
                    psychologist_medical_statuses = {
                        "psychological_report_status": medical_status_lookup[sid]
                        .get("psychological_report_status", {})
                        .get("status", "not_verified")
                        if "psychological_report_status" in medical_status_lookup[sid]
                        else "not_verified"
                    }
                else:
                    psychologist_medical_statuses = {
                        "psychological_report_status": "not_verified"
                    }

                status_update.update(
                    {
                        "analysis_status": bool(psychologist_analysis_lookup.get(sid)),
                        **psychologist_medical_statuses,
                    }
                )

            # ✅ ANALYST: MEDICAL OFFICER
            elif (
                current_user.get("role_type") == "ANALYST_TEAM"
                and current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER
            ):
                if sid in medical_status_lookup:
                    for status_type in MEDICAL_OFFICER_STATUS_TYPES:
                        med_sts = medical_status_lookup.get(sid, {}).get(status_type, {})
                        status_update[f"{status_type}"] = med_sts.get("status", "not_verified")
                        status_update[f"{status_type}_remarks"] = med_sts.get("remarks", "")
                else:
                    for status_type in MEDICAL_OFFICER_STATUS_TYPES:
                        status_update[f"{status_type}"] = "not_verified"
                        status_update[f"{status_type}_remarks"] = ""

            student.update(status_update)

    # Profile image URLs
    for student in student_list:
        student["profile_image"] = await get_new_url(student.get("profile_image")) or ""

    resp = StandardResponse(
        status=True,
        message="Student list retrieved successfully.",
        data={
            "students_list": student_list,
            "total": total_students,
            "page": page,
            "page_size": page_size,
        },
        errors={},
    )
    response = JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
    response.headers["X-Academic-Year"] = academic_year
    return response


@router.get("/{school_id}/students-list-by-class", response_model=StandardResponse)
async def get_students_by_class(
    school_id: int,
    current_user: dict = Depends(get_current_user),
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    classroom: Optional[str] = Query(None, max_length=50),
    section: Optional[str] = Query(None, max_length=10),
    search: Optional[str] = Query(None, max_length=100),
):
    allowed_roles = [
        "PARENT", "GUARDIAN", "HEALTH_BUDDY",
        "SCHOOL_ADMIN", "TEACHER", "PROGRAM_COORDINATOR", "SUPER_ADMIN",
        "REGISTRATION_TEAM", "CAMP_COORDINATOR", "PHYSICAL_WELLBEING",
        "DENTIST", "EYE_SPECIALIST", "NUTRITIONIST", "PSYCHOLOGIST",
        "ANALYST_NUTRITIONIST", "ANALYST_PSYCHOLOGIST", "MEDICAL_OFFICER"
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to view student records.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    school = await Schools.get_or_none(school_id=school_id)
    if not school:
        resp = StandardResponse(
            status=False,
            message="School not found.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()

    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        resp = StandardResponse(
            status=False,
            message=str(e),
            data={},
            errors={"academic_year": str(e)}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # Base students query (no year filter)
    query = SchoolStudents.filter(
        school_id=school_id,
        student__is_deleted=False
    ).prefetch_related("student")

    if classroom:
        query = query.filter(student__class_room=classroom)
    if section:
        query = query.filter(student__section=section)
    if search:
        query = query.filter(
            Q(student__first_name__icontains=search) |
            Q(student__middle_name__icontains=search) |
            Q(student__last_name__icontains=search)
        )

    students = await query.distinct()
    students.sort(
        key=lambda s: (
            0 if not s.student.roll_no or not str(s.student.roll_no).strip().isdigit()
            else int(str(s.student.roll_no).strip())
        )
    )

    student_list = []
    assign_school = await AssignSchool.filter(school=school_id, is_deleted=False).first()
    is_completed = assign_school.is_completed if assign_school else False

    for school_student in students:
        student_dict = {
            "id": school_student.student.id,
            "first_name": school_student.student.first_name,
            "middle_name": school_student.student.middle_name,
            "last_name": school_student.student.last_name,
            "class_room": school_student.student.class_room,
            "section": school_student.student.section,
            "roll_no": school_student.student.roll_no,
            "aadhaar_no": school_student.student.aadhaar_no,
            "abha_id": school_student.student.abha_id,
            "mp_uhid": school_student.student.mp_uhid,
            "profile_image": await get_new_url(school_student.student.profile_image) or "",
            "gender": school_student.student.gender,
            "age": str(calculate_age_string(school_student.student.dob)),
            "country_code": school_student.student.country_code,
            "phone": school_student.student.phone,
        }

        # TEACHER questionnaire status
        if current_user.get("user_role") in {SchoolRoles.TEACHER}:
            class_room_norm = normalize_grade(school_student.student.class_room)

            parent_nutritional_ids = await get_parent_nutritional_questions_for_grade(class_room_norm)
            parent_emotional_ids = await get_parent_emotional_questions_for_grade(class_room_norm)
            teacher_nutritional_ids = await get_teacher_nutritional_questions_for_grade(class_room_norm)
            teacher_emotional_ids = await get_teacher_emotional_questions_for_grade(class_room_norm)

            parent_answered = await ParentAnswers.filter(
                student_id=school_student.student.id,
                is_deleted=False
            ).values_list("question_id", flat=True)
            teacher_answered = await TeacherAnswers.filter(
                student_id=school_student.student.id,
                is_deleted=False
            ).values_list("question_id", flat=True)

            parent_answered_ids = set(parent_answered)
            teacher_answered_ids = set(teacher_answered)

            # Parent
            parent_nutritional_complete = parent_nutritional_ids.issubset(parent_answered_ids) if parent_nutritional_ids else True
            parent_emotional_complete = parent_emotional_ids.issubset(parent_answered_ids) if parent_emotional_ids else True
            parent_questionnaire_status = parent_nutritional_complete and parent_emotional_complete

            # Teacher
            teacher_nutritional_complete = teacher_nutritional_ids.issubset(teacher_answered_ids) if teacher_nutritional_ids else True
            teacher_emotional_complete = teacher_emotional_ids.issubset(teacher_answered_ids) if teacher_emotional_ids else True
            teacher_questionnaire_status = teacher_nutritional_complete and teacher_emotional_complete

            student_dict["parent_questionnaire_status"] = parent_questionnaire_status
            student_dict["teacher_questionnaire_status"] = teacher_questionnaire_status

        student_list.append(student_dict)

    # Academic year filter for activities
    year_filter = build_academic_year_filter(academic_year)
    student_ids = [s.student.id for s in students]

    # SCHOOL PAYMENT
    paid_students = await StudentSchoolPayment.filter(
        year_filter,
        student_id__in=student_ids,
        is_deleted=False,
        is_paid=True
    ).values_list("student_id", flat=True)
    paid_student_set = set(paid_students)

    for student_dict in student_list:
        student_dict["school_payment_status"] = student_dict["id"] in paid_student_set

    # SCREENING / ANALYSIS / MEDICAL
    role_status_map = {
        ScreeningTeamRoles.PHYSICAL_WELLBEING: ["smart_scale_status"],
        ScreeningTeamRoles.DENTIST: ["dental_screening_status"],
        ScreeningTeamRoles.EYE_SPECIALIST: ["eye_screening_status"],
        ScreeningTeamRoles.NUTRITIONIST: ["nutrition_screening_status"],
        ScreeningTeamRoles.PSYCHOLOGIST: ["behavioural_screening_status"],
        AnalystRoles.NUTRITIONIST: ["nutrition_analysis_status"],
        AnalystRoles.PSYCHOLOGIST: ["psychological_analysis_status"],
    }

    if (
        current_user.get("user_role") in {
            OnGroundTeamRoles.REGISTRATION_TEAM,
            OnGroundTeamRoles.CAMP_COORDINATOR,
            AdminTeamRoles.SUPER_ADMIN,
            AdminTeamRoles.PROGRAM_COORDINATOR,
            AdminTeamRoles.HEALTH_BUDDY,
            SchoolRoles.SCHOOL_ADMIN,
        }
        or current_user.get("user_role") in role_status_map
        or current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER
    ):
        attendance_statuses = await AttendanceStatus.filter(
            year_filter, student_id__in=student_ids
        ).order_by("-created_at")
        dental_screenings = await DentalScreening.filter(
            year_filter, student_id__in=student_ids
        ).order_by("-created_at")
        eye_screenings = await EyeScreening.filter(
            year_filter, student_id__in=student_ids
        ).order_by("-created_at")
        behavioural_screenings = await BehaviouralScreening.filter(
            year_filter, student_id__in=student_ids
        ).order_by("-created_at")
        nutrition_screenings = await NutritionScreening.filter(
            year_filter, student_id__in=student_ids
        ).order_by("-created_at")
        smart_scale_data = await SmartScaleData.filter(
            year_filter, student_id__in=student_ids
        ).order_by("-created_at")
        nutritional_analysis_status = await ClinicalRecomendations.filter(
            year_filter, student_id__in=student_ids
        ).order_by("-created_at")
        psychological_analysis_status = await ClinicalFindings.filter(
            year_filter, student_id__in=student_ids
        ).order_by("-created_at")

        medical_screening_statuses = []
        if current_user.get("user_role") in {
            AnalystRoles.MEDICAL_OFFICER,
            ScreeningTeamRoles.DENTIST,
            ScreeningTeamRoles.EYE_SPECIALIST,
            AnalystRoles.NUTRITIONIST,
            AnalystRoles.PSYCHOLOGIST,
            AdminTeamRoles.SUPER_ADMIN,          # ✅ added
            AdminTeamRoles.PROGRAM_COORDINATOR,  # ✅ added
            SchoolRoles.SCHOOL_ADMIN,            # optional
        }:
            medical_screening_statuses = await MedicalScreeningStatus.filter(
                year_filter,
                student_id__in=student_ids,
                is_deleted=False,
            ).all()

        status_lookup = {s.student_id: s for s in attendance_statuses}
        dental_lookup = {s.student_id: s for s in dental_screenings}
        eye_lookup = {s.student_id: s for s in eye_screenings}
        behavioural_lookup = {s.student_id: s for s in behavioural_screenings}
        nutrition_lookup = {s.student_id: s for s in nutrition_screenings}
        smart_scale_lookup = {s.student_id: s for s in smart_scale_data}
        nutritional_analysis_lookup = {
            s.student_id: s.analysis_status if s else False
            for s in nutritional_analysis_status
        }
        psychological_analysis_lookup = {
            s.student_id: s.analysis_status if s else False
            for s in psychological_analysis_status
        }

        medical_status_lookup = {}
        if medical_screening_statuses:
            for medical_status in medical_screening_statuses:
                if medical_status.student_id not in medical_status_lookup:
                    medical_status_lookup[medical_status.student_id] = {}
                medical_status_lookup[medical_status.student_id][
                    medical_status.medical_officer_status_type
                ] = {
                    "status": medical_status.status,
                    "remarks": medical_status.remarks,
                }

        MEDICAL_OFFICER_STATUS_TYPES = [
            "physical_screening_status",
            "lab_report_status",
            "dental_screening_status",
            "vision_screening_status",
            "psychological_report_status",
            "nutritional_report_status",
            "medical_report_status",
        ]

        for student_dict in student_list:
            student_id = student_dict["id"]
            if not any(ss.student.id == student_id for ss in students):
                continue

            status_update = {}

            # ADMIN / PC / SCHOOL ADMIN
            if current_user.get("user_role") in {
                OnGroundTeamRoles.REGISTRATION_TEAM,
                OnGroundTeamRoles.CAMP_COORDINATOR,
                AdminTeamRoles.SUPER_ADMIN,
                AdminTeamRoles.HEALTH_BUDDY,
                AdminTeamRoles.PROGRAM_COORDINATOR,
                SchoolRoles.SCHOOL_ADMIN,
            }:
                data = {
                    "registration_status": bool(status_lookup.get(student_id)),
                    "dental_screening_status": dental_lookup.get(student_id).screening_status
                    if dental_lookup.get(student_id)
                    else False,
                    "eye_screening_status": eye_lookup.get(student_id).screening_status
                    if eye_lookup.get(student_id)
                    else False,
                    "behavioural_screening_status": behavioural_lookup.get(student_id).screening_status
                    if behavioural_lookup.get(student_id)
                    else False,
                    "nutrition_screening_status": nutrition_lookup.get(student_id).screening_status
                    if nutrition_lookup.get(student_id)
                    else False,
                    "smart_scale_status": smart_scale_lookup.get(student_id).screening_status
                    if smart_scale_lookup.get(student_id)
                    else False,
                }
                status_update.update(data)
                status_update["nutrition_analysis_status"] = bool(
                    nutritional_analysis_lookup.get(student_id)
                )
                status_update["psychological_analysis_status"] = bool(
                    psychological_analysis_lookup.get(student_id)
                )
                status_update["completed_status"] = all(data.values())

                # medical_officer_analysis_status for Admin/PC/SCHOOL_ADMIN
                medical_officer_analysis_status = False
                if student_id in medical_status_lookup:
                    tmp_statuses = {}
                    for status_type in [
                        "physical_screening_status",
                        "nutritional_report_status",
                        "psychological_report_status",
                        "vision_screening_status",
                        "dental_screening_status",
                        "lab_report_status",
                    ]:
                        if status_type in medical_status_lookup[student_id]:
                            tmp_statuses[status_type] = medical_status_lookup[student_id][
                                status_type
                            ].get("status", "")
                        else:
                            tmp_statuses[status_type] = "not_verified"

                    medical_officer_analysis_status = all(
                        [
                            tmp_statuses.get("physical_screening_status") == "verified",
                            tmp_statuses.get("nutritional_report_status") == "verified",
                            tmp_statuses.get("psychological_report_status") == "verified",
                            tmp_statuses.get("vision_screening_status") == "verified",
                            tmp_statuses.get("dental_screening_status") == "verified",
                            tmp_statuses.get("lab_report_status") == "verified",
                        ]
                    )

                status_update["medical_officer_analysis_status"] = (
                    medical_officer_analysis_status
                )
                status_update["generated_report_status"] = medical_officer_analysis_status  # same condition


            # SCREENING TEAM
            elif (
                current_user.get("role_type") == "SCREENING_TEAM"
                and current_user.get("user_role") == ScreeningTeamRoles.PHYSICAL_WELLBEING
            ):
                status_update["screening_status"] = (
                    smart_scale_lookup.get(student_id).screening_status
                    if smart_scale_lookup.get(student_id)
                    else False
                )

            elif (
                current_user.get("role_type") == "SCREENING_TEAM"
                and current_user.get("user_role") == ScreeningTeamRoles.EYE_SPECIALIST
            ):
                if student_id in medical_status_lookup:
                    eye_specialist_medical_statuses = {
                        "vision_screening_status": medical_status_lookup[student_id]
                        .get("vision_screening_status", {})
                        .get("status", "not_verified")
                        if "vision_screening_status" in medical_status_lookup[student_id]
                        else "not_verified"
                    }
                else:
                    eye_specialist_medical_statuses = {
                        "vision_screening_status": "not_verified"
                    }

                status_update.update(
                    {
                        "screening_status": eye_lookup.get(student_id).screening_status
                        if eye_lookup.get(student_id)
                        else False,
                        **eye_specialist_medical_statuses,
                    }
                )

            elif (
                current_user.get("role_type") == "SCREENING_TEAM"
                and current_user.get("user_role") == ScreeningTeamRoles.DENTIST
            ):
                if student_id in medical_status_lookup:
                    dentist_medical_statuses = {
                        "dental_screening_status": medical_status_lookup[student_id]
                        .get("dental_screening_status", {})
                        .get("status", "not_verified")
                        if "dental_screening_status" in medical_status_lookup[student_id]
                        else "not_verified"
                    }
                else:
                    dentist_medical_statuses = {
                        "dental_screening_status": "not_verified"
                    }

                status_update.update(
                    {
                        "screening_status": dental_lookup.get(student_id).screening_status
                        if dental_lookup.get(student_id)
                        else False,
                        **dentist_medical_statuses,
                    }
                )

            elif (
                current_user.get("role_type") == "SCREENING_TEAM"
                and current_user.get("user_role") == ScreeningTeamRoles.NUTRITIONIST
            ):
                status_update["screening_status"] = (
                    nutrition_lookup.get(student_id).screening_status
                    if nutrition_lookup.get(student_id)
                    else False
                )

            elif (
                current_user.get("role_type") == "SCREENING_TEAM"
                and current_user.get("user_role") == ScreeningTeamRoles.PSYCHOLOGIST
            ):
                status_update["screening_status"] = (
                    behavioural_lookup.get(student_id).screening_status
                    if behavioural_lookup.get(student_id)
                    else False
                )

            # ANALYST: NUTRITIONIST
            elif (
                current_user.get("role_type") == "ANALYST_TEAM"
                and current_user.get("user_role") == AnalystRoles.NUTRITIONIST
            ):
                if student_id in medical_status_lookup:
                    nutritionist_medical_statuses = {
                        "physical_screening_status": medical_status_lookup[student_id]
                        .get("physical_screening_status", {})
                        .get("status", "not_verified")
                        if "physical_screening_status" in medical_status_lookup[student_id]
                        else "not_verified",
                        "nutritional_report_status": medical_status_lookup[student_id]
                        .get("nutritional_report_status", {})
                        .get("status", "not_verified")
                        if "nutritional_report_status" in medical_status_lookup[student_id]
                        else "not_verified",
                        "lab_report_status": medical_status_lookup[student_id]
                        .get("lab_report_status", {})
                        .get("status", "not_verified")
                        if "lab_report_status" in medical_status_lookup[student_id]
                        else "not_verified",
                    }
                else:
                    nutritionist_medical_statuses = {
                        "physical_screening_status": "not_verified",
                        "nutritional_report_status": "not_verified",
                        "lab_report_status": "not_verified",
                    }

                status_update.update(
                    {
                        "analysis_status": bool(
                            nutritional_analysis_lookup.get(student_id)
                        ),
                        **nutritionist_medical_statuses,
                    }
                )

            # ANALYST: PSYCHOLOGIST
            elif (
                current_user.get("role_type") == "ANALYST_TEAM"
                and current_user.get("user_role") == AnalystRoles.PSYCHOLOGIST
            ):
                if student_id in medical_status_lookup:
                    psychologist_medical_statuses = {
                        "psychological_report_status": medical_status_lookup[student_id]
                        .get("psychological_report_status", {})
                        .get("status", "not_verified")
                        if "psychological_report_status" in medical_status_lookup[student_id]
                        else "not_verified"
                    }
                else:
                    psychologist_medical_statuses = {
                        "psychological_report_status": "not_verified"
                    }

                status_update.update(
                    {
                        "analysis_status": bool(
                            psychological_analysis_lookup.get(student_id)
                        ),
                        **psychologist_medical_statuses,
                    }
                )

            # ANALYST: MEDICAL OFFICER
            elif (
                current_user.get("role_type") == "ANALYST_TEAM"
                and current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER
            ):
                student_medical_statuses = {}
                for status_type in MEDICAL_OFFICER_STATUS_TYPES:
                    if (
                        student_id in medical_status_lookup
                        and status_type in medical_status_lookup[student_id]
                    ):
                        student_medical_statuses[status_type] = medical_status_lookup[
                            student_id
                        ][status_type]["status"]
                    else:
                        student_medical_statuses[status_type] = "not_verified"

                all_reports_verified = all(
                    [
                        student_medical_statuses.get("physical_screening_status")
                        == "verified",
                        student_medical_statuses.get("nutritional_report_status")
                        == "verified",
                        student_medical_statuses.get("psychological_report_status")
                        == "verified",
                        student_medical_statuses.get("vision_screening_status")
                        == "verified",
                        student_medical_statuses.get("dental_screening_status")
                        == "verified",
                        student_medical_statuses.get("lab_report_status")
                        == "verified",
                    ]
                )

                student_medical_statuses["medical_report_status"] = (
                    "verified" if all_reports_verified else "not_verified"
                )
                student_medical_statuses["medical_officer_analysis_status"] = (
                    all_reports_verified
                )

                status_update.update(student_medical_statuses)

            student_dict.update(status_update)

    resp = StandardResponse(
        status=True,
        message="Students retrieved by class successfully.",
        data={"students_list": student_list},
        errors={},
    )
    response = JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
    response.headers["X-Academic-Year"] = academic_year
    return response


# @router.get("/{school_id}/students-list-by-class", response_model=StandardResponse)
# async def get_students_by_class(
#     school_id: int,
#     current_user: dict = Depends(get_current_user),
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     ),
#     classroom: Optional[str] = Query(None, max_length=50),
#     section: Optional[str] = Query(None, max_length=10),
#     search: Optional[str] = Query(None, max_length=100),
# ):
#     allowed_roles = [
#         "PARENT", "GUARDIAN", "HEALTH_BUDDY",
#         "SCHOOL_ADMIN", "TEACHER", "PROGRAM_COORDINATOR", "SUPER_ADMIN",
#         "REGISTRATION_TEAM", "CAMP_COORDINATOR", "PHYSICAL_WELLBEING",
#         "DENTIST", "EYE_SPECIALIST", "NUTRITIONIST", "PSYCHOLOGIST",
#         "ANALYST_NUTRITIONIST", "ANALYST_PSYCHOLOGIST", "MEDICAL_OFFICER"
#     ]
#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role} is not allowed to view student records.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     school = await Schools.get_or_none(school_id=school_id)
#     if not school:
#         resp = StandardResponse(
#             status=False,
#             message="School not found.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Determine academic year
#     if academic_year is None:
#         academic_year = get_current_academic_year()

#     try:
#         ay_start, ay_end = parse_academic_year(academic_year)
#     except ValueError as e:
#         resp = StandardResponse(
#             status=False,
#             message=str(e),
#             data={},
#             errors={"academic_year": str(e)}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     # Fetch SchoolStudents with prefetch_related for student (NO academic year filter on students)
#     query = SchoolStudents.filter(school_id=school_id, student__is_deleted=False).prefetch_related('student')
#     if classroom:
#         query = query.filter(student__class_room=classroom)
#     if section:
#         query = query.filter(student__section=section)
#     if search:
#         query = query.filter(
#             Q(student__first_name__icontains=search) |
#             Q(student__middle_name__icontains=search) |
#             Q(student__last_name__icontains=search)
#         )

#     students = await query.distinct()
#     students.sort(
#         key=lambda s: (
#             0 if not s.student.roll_no or not str(s.student.roll_no).strip().isdigit()
#             else int(str(s.student.roll_no).strip())
#         )
#     )
    
#     student_list = []
#     assign_school = await AssignSchool.filter(school=school_id, is_deleted=False).first()
#     is_completed = assign_school.is_completed if assign_school else False

#     for school_student in students:
#         student_dict = {
#             "id": school_student.student.id,
#             "first_name": school_student.student.first_name,
#             "middle_name": school_student.student.middle_name,
#             "last_name": school_student.student.last_name,
#             "class_room": school_student.student.class_room,
#             "section": school_student.student.section,
#             "roll_no": school_student.student.roll_no,
#             "aadhaar_no": school_student.student.aadhaar_no,
#             "abha_id": school_student.student.abha_id,
#             "mp_uhid": school_student.student.mp_uhid,
#             "profile_image": await get_new_url(school_student.student.profile_image) or "",
#             "gender": school_student.student.gender,
#             "age": str(calculate_age_string(school_student.student.dob)),
#             "country_code": school_student.student.country_code,
#             "phone": school_student.student.phone,
#         }
        
#         if current_user.get("user_role") in {SchoolRoles.TEACHER}:
#             class_room = normalize_grade(school_student.student.class_room)
            
#             # ===============================================
#             # GET ALL AVAILABLE QUESTIONS USING SAME LOGIC AS GET APIs
#             # ===============================================
#             parent_nutritional_ids = await get_parent_nutritional_questions_for_grade(class_room)
#             parent_emotional_ids = await get_parent_emotional_questions_for_grade(class_room)
#             teacher_nutritional_ids = await get_teacher_nutritional_questions_for_grade(class_room)
#             teacher_emotional_ids = await get_teacher_emotional_questions_for_grade(class_room)
            
#             # ===============================================
#             # GET ANSWERED QUESTIONS FOR THIS STUDENT
#             # ===============================================
#             parent_answered = await ParentAnswers.filter(
#                 student_id=school_student.student.id, 
#                 is_deleted=False
#             ).values_list("question_id", flat=True)
            
#             teacher_answered = await TeacherAnswers.filter(
#                 student_id=school_student.student.id, 
#                 is_deleted=False
#             ).values_list("question_id", flat=True)
            
#             parent_answered_ids = set(parent_answered)
#             teacher_answered_ids = set(teacher_answered)

#             # ===============================================
#             # CALCULATE PARENT QUESTIONNAIRE STATUS
#             # ===============================================
#             if parent_nutritional_ids:
#                 parent_nutritional_complete = parent_nutritional_ids.issubset(parent_answered_ids)
#             else:
#                 parent_nutritional_complete = True
            
#             if parent_emotional_ids:
#                 parent_emotional_complete = parent_emotional_ids.issubset(parent_answered_ids)
#             else:
#                 parent_emotional_complete = True
            
#             parent_questionnaire_status = parent_nutritional_complete and parent_emotional_complete

#             # ===============================================
#             # CALCULATE TEACHER QUESTIONNAIRE STATUS
#             # ===============================================
#             if teacher_nutritional_ids:
#                 teacher_nutritional_complete = teacher_nutritional_ids.issubset(teacher_answered_ids)
#             else:
#                 teacher_nutritional_complete = True
            
#             if teacher_emotional_ids:
#                 teacher_emotional_complete = teacher_emotional_ids.issubset(teacher_answered_ids)
#             else:
#                 teacher_emotional_complete = True
            
#             teacher_questionnaire_status = teacher_nutritional_complete and teacher_emotional_complete

#             # Add to student data
#             student_dict["parent_questionnaire_status"] = parent_questionnaire_status
#             student_dict["teacher_questionnaire_status"] = teacher_questionnaire_status

#         student_list.append(student_dict)

#     # ===============================================
#     # Build academic year filter
#     # ===============================================
#     year_filter = build_academic_year_filter(academic_year)
    
#     student_ids = [school_student.student.id for school_student in students]
    
#     # ===============================================
#     # SCHOOL PAYMENT STATUS - with academic year filter
#     # ===============================================
#     paid_students = await StudentSchoolPayment.filter(
#         year_filter,
#         student_id__in=student_ids,
#         is_deleted=False,
#         is_paid=True
#     ).values_list("student_id", flat=True)

#     paid_student_set = set(paid_students)

#     for student_dict in student_list:
#         student_dict["school_payment_status"] = student_dict["id"] in paid_student_set
        
#     # ===============================================
#     # SCREENING STATUSES (with academic year filter)
#     # ===============================================
#     role_status_map = {
#         ScreeningTeamRoles.PHYSICAL_WELLBEING: ["smart_scale_status"],
#         ScreeningTeamRoles.DENTIST: ["dental_screening_status"],
#         ScreeningTeamRoles.EYE_SPECIALIST: ["eye_screening_status"],
#         ScreeningTeamRoles.NUTRITIONIST: ["nutrition_screening_status"],
#         ScreeningTeamRoles.PSYCHOLOGIST: ["behavioural_screening_status"],
#         AnalystRoles.NUTRITIONIST: ["nutrition_analysis_status"],
#         AnalystRoles.PSYCHOLOGIST: ["psychological_analysis_status"],
#     }
    
#     if current_user.get("user_role") in {OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR, AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, AdminTeamRoles.HEALTH_BUDDY, SchoolRoles.SCHOOL_ADMIN} or current_user.get("user_role") in role_status_map or current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
        
#         # Fetch all screening data with academic year filter
#         attendance_statuses = await AttendanceStatus.filter(year_filter, student_id__in=student_ids).order_by('-created_at')
#         dental_screenings = await DentalScreening.filter(year_filter, student_id__in=student_ids).order_by('-created_at')
#         eye_screenings = await EyeScreening.filter(year_filter, student_id__in=student_ids).order_by('-created_at')
#         behavioural_screenings = await BehaviouralScreening.filter(year_filter, student_id__in=student_ids).order_by('-created_at')
#         nutrition_screenings = await NutritionScreening.filter(year_filter, student_id__in=student_ids).order_by('-created_at')
#         smart_scale_data = await SmartScaleData.filter(year_filter, student_id__in=student_ids).order_by('-created_at')
#         nutritional_analysis_status = await ClinicalRecomendations.filter(year_filter, student_id__in=student_ids).order_by('-created_at')
#         psychological_analysis_status = await ClinicalFindings.filter(year_filter, student_id__in=student_ids).order_by('-created_at')
        
#         medical_screening_statuses = []
#         if (current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER or
#             current_user.get("user_role") == ScreeningTeamRoles.DENTIST or
#             current_user.get("user_role") == ScreeningTeamRoles.EYE_SPECIALIST or
#             current_user.get("user_role") == AnalystRoles.NUTRITIONIST or
#             current_user.get("user_role") == AnalystRoles.PSYCHOLOGIST):
#             medical_screening_statuses = await MedicalScreeningStatus.filter(
#                 year_filter,
#                 student_id__in=student_ids,
#                 is_deleted=False
#             ).all()
        
#         status_lookup = {s.student_id: s for s in attendance_statuses}
#         dental_lookup = {s.student_id: s for s in dental_screenings}
#         eye_lookup = {s.student_id: s for s in eye_screenings}
#         behavioural_lookup = {s.student_id: s for s in behavioural_screenings}
#         nutrition_lookup = {s.student_id: s for s in nutrition_screenings}
#         smart_scale_lookup = {s.student_id: s for s in smart_scale_data}
#         nutritional_analysis_lookup = {s.student_id: s.analysis_status if s else False for s in nutritional_analysis_status}
#         psychological_analysis_lookup = {s.student_id: s.analysis_status if s else False for s in psychological_analysis_status}
        
#         medical_status_lookup = {}
#         if medical_screening_statuses:
#             for medical_status in medical_screening_statuses:
#                 if medical_status.student_id not in medical_status_lookup:
#                     medical_status_lookup[medical_status.student_id] = {}
#                 medical_status_lookup[medical_status.student_id][medical_status.medical_officer_status_type] = {
#                     "status": medical_status.status,
#                     "remarks": medical_status.remarks
#                 }
        
#         for student_dict in student_list:
#             student_id = student_dict["id"]
            
#             if not any(ss.student.id == student_id for ss in students):
#                 continue

#             status_update = {}
            
#             if current_user.get("user_role") in {OnGroundTeamRoles.REGISTRATION_TEAM, OnGroundTeamRoles.CAMP_COORDINATOR, AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.HEALTH_BUDDY, AdminTeamRoles.PROGRAM_COORDINATOR, SchoolRoles.SCHOOL_ADMIN}:
#                 status_update.update({
#                     "registration_status": bool(status_lookup.get(student_id)),
#                     "dental_screening_status": dental_lookup.get(student_id).screening_status if dental_lookup.get(student_id) else False,
#                     "eye_screening_status": eye_lookup.get(student_id).screening_status if eye_lookup.get(student_id) else False,
#                     "behavioural_screening_status": behavioural_lookup.get(student_id).screening_status if behavioural_lookup.get(student_id) else False,
#                     "nutrition_screening_status": nutrition_lookup.get(student_id).screening_status if nutrition_lookup.get(student_id) else False,
#                     "smart_scale_status": smart_scale_lookup.get(student_id).screening_status if smart_scale_lookup.get(student_id) else False,
#                     "nutrition_analysis_status": bool(nutritional_analysis_lookup.get(student_id)),
#                     "psychological_analysis_status": bool(psychological_analysis_lookup.get(student_id))
#                 })
#                 data = {
#                     "registration_status": bool(status_lookup.get(student_id)),
#                     "dental_screening_status": dental_lookup.get(student_id).screening_status if dental_lookup.get(student_id) else False,
#                     "eye_screening_status": eye_lookup.get(student_id).screening_status if eye_lookup.get(student_id) else False,
#                     "behavioural_screening_status": behavioural_lookup.get(student_id).screening_status if behavioural_lookup.get(student_id) else False,
#                     "nutrition_screening_status": nutrition_lookup.get(student_id).screening_status if nutrition_lookup.get(student_id) else False,
#                     "smart_scale_status": smart_scale_lookup.get(student_id).screening_status if smart_scale_lookup.get(student_id) else False,
#                 }
                
#                 status_update.update({"completed_status": all(data.values())})
            
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.PHYSICAL_WELLBEING:
#                 status_update.update({
#                     "screening_status": smart_scale_lookup.get(student_id).screening_status if smart_scale_lookup.get(student_id) else False
#                 })
            
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.EYE_SPECIALIST:
#                 if student_id in medical_status_lookup:
#                     eye_specialist_medical_statuses = {
#                         "vision_screening_status": medical_status_lookup[student_id].get("vision_screening_status", {}).get("status", "not_verified") if "vision_screening_status" in medical_status_lookup[student_id] else "not_verified"
#                     }
#                 else:
#                     eye_specialist_medical_statuses = {"vision_screening_status": "not_verified"}
                
#                 status_update.update({
#                     "screening_status": eye_lookup.get(student_id).screening_status if eye_lookup.get(student_id) else False,
#                     **eye_specialist_medical_statuses
#                 })
                
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.DENTIST:
#                 if student_id in medical_status_lookup:
#                     dentist_medical_statuses = {
#                         "dental_screening_status": medical_status_lookup[student_id].get("dental_screening_status", {}).get("status", "not_verified") if "dental_screening_status" in medical_status_lookup[student_id] else "not_verified"
#                     }
#                 else:
#                     dentist_medical_statuses = {"dental_screening_status": "not_verified"}
                
#                 status_update.update({
#                     "screening_status": dental_lookup.get(student_id).screening_status if dental_lookup.get(student_id) else False,
#                     **dentist_medical_statuses
#                 })

#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.NUTRITIONIST:
#                 status_update.update({
#                     "screening_status": nutrition_lookup.get(student_id).screening_status if nutrition_lookup.get(student_id) else False
#                 })
                
#             elif current_user.get("role_type") == "SCREENING_TEAM" and current_user.get("user_role") == ScreeningTeamRoles.PSYCHOLOGIST:
#                 status_update.update({
#                     "screening_status": behavioural_lookup.get(student_id).screening_status if behavioural_lookup.get(student_id) else False
#                 })
           
#             elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.NUTRITIONIST:
#                 if student_id in medical_status_lookup:
#                     nutritionist_medical_statuses = {
#                         "physical_screening_status": medical_status_lookup[student_id].get("physical_screening_status", {}).get("status", "not_verified") if "physical_screening_status" in medical_status_lookup[student_id] else "not_verified",
#                         "nutritional_report_status": medical_status_lookup[student_id].get("nutritional_report_status", {}).get("status", "not_verified") if "nutritional_report_status" in medical_status_lookup[student_id] else "not_verified",
#                         "lab_report_status": medical_status_lookup[student_id].get("lab_report_status", {}).get("status", "not_verified") if "lab_report_status" in medical_status_lookup[student_id] else "not_verified"
#                     }
#                 else:
#                     nutritionist_medical_statuses = {
#                         "physical_screening_status": "not_verified",
#                         "nutritional_report_status": "not_verified",
#                         "lab_report_status": "not_verified"
#                     }
                
#                 status_update.update({
#                     "analysis_status": bool(nutritional_analysis_lookup.get(student_id)),
#                     **nutritionist_medical_statuses
#                 })
                
#             elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.PSYCHOLOGIST:
#                 if student_id in medical_status_lookup:
#                     psychologist_medical_statuses = {
#                         "psychological_report_status": medical_status_lookup[student_id].get("psychological_report_status", {}).get("status", "not_verified") if "psychological_report_status" in medical_status_lookup[student_id] else "not_verified"
#                     }
#                 else:
#                     psychologist_medical_statuses = {"psychological_report_status": "not_verified"}
                
#                 status_update.update({
#                     "analysis_status": bool(psychological_analysis_lookup.get(student_id)),
#                     **psychologist_medical_statuses
#                 })
            
#             elif current_user.get("role_type") == "ANALYST_TEAM" and current_user.get("user_role") == AnalystRoles.MEDICAL_OFFICER:
#                 student_medical_statuses = {}
#                 for status_type in MEDICAL_OFFICER_STATUS_TYPES:
#                     if (student_id in medical_status_lookup and 
#                         status_type in medical_status_lookup[student_id]):
#                         student_medical_statuses[status_type] = medical_status_lookup[student_id][status_type]["status"]
#                     else:
#                         student_medical_statuses[status_type] = "not_verified"
                        
#                 all_reports_verified = all([
#                     student_medical_statuses.get("physical_screening_status") == "verified",
#                     student_medical_statuses.get("nutritional_report_status") == "verified",
#                     student_medical_statuses.get("psychological_report_status") == "verified",
#                     student_medical_statuses.get("vision_screening_status") == "verified",
#                     student_medical_statuses.get("dental_screening_status") == "verified",
#                     student_medical_statuses.get("lab_report_status") == "verified"
#                 ])
#                 if all_reports_verified:
#                     student_medical_statuses["medical_report_status"] = "verified"
    
#                 status_update.update(student_medical_statuses)
                
#             student_dict.update(status_update)

#     # ✅ SAME FORMAT AS ORIGINAL
#     resp = StandardResponse(
#         status=True,
#         message="Students retrieved by class successfully.",
#         data={"students_list": student_list},
#         errors={}
#     )
    
#     response = JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
#     response.headers["X-Academic-Year"] = academic_year
#     return response


# # ===================================================================
# # MODIFIED: STUDENTS LIST BY CATEGORY (with Academic Year Filter)
# # ===================================================================
# @router.get("/{school_id}/students-list-by-category", response_model=StandardResponse)
# async def get_school_students_by_category(
#     school_id: int,
#     current_user: dict = Depends(get_current_user),
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     ),
#     klass: Optional[int] = Query(None, ge=1, le=12),
#     section: Optional[str] = Query(None, max_length=10),
#     search: Optional[str] = Query(None, max_length=100),
#     page: int = Query(1, ge=1),
#     page_size: int = Query(1000, ge=1, le=1000),
# ):
#     creator_role = current_user["user_role"]
#     allowed_roles = [
#         SchoolRoles.SCHOOL_ADMIN,
#         ParentRoles.PARENT, ParentRoles.GUARDIAN,
#         SchoolRoles.TEACHER,
#         AdminTeamRoles.PROGRAM_COORDINATOR,
#         AdminTeamRoles.SUPER_ADMIN,
#         AdminTeamRoles.HEALTH_BUDDY,
#         OnGroundTeamRoles.REGISTRATION_TEAM,
#         OnGroundTeamRoles.CAMP_COORDINATOR,
#         ScreeningTeamRoles.PHYSICAL_WELLBEING,
#         ScreeningTeamRoles.DENTIST,
#         ScreeningTeamRoles.EYE_SPECIALIST,
#         ScreeningTeamRoles.NUTRITIONIST,
#         ScreeningTeamRoles.PSYCHOLOGIST,
#         AnalystRoles.NUTRITIONIST,
#         AnalystRoles.PSYCHOLOGIST,
#         AnalystRoles.MEDICAL_OFFICER
#     ]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role.value} is not allowed to Fetch student records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
#     if not school:
#         resp = StandardResponse(
#             status=False,
#             message="School not found.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Determine academic year
#     if academic_year is None:
#         academic_year = get_current_academic_year()

#     try:
#         ay_start, ay_end = parse_academic_year(academic_year)
#     except ValueError as e:
#         resp = StandardResponse(
#             status=False,
#             message=str(e),
#             data={},
#             errors={"academic_year": str(e)}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     # Apply filters (NO academic year filter on students themselves)
#     query = Students.filter(school_students__school_id=school_id, is_deleted=False)
#     if klass:
#         query = query.filter(class_room=klass)
#     if section:
#         query = query.filter(section=section)
#     if search:
#         query = query.filter(
#             Q(first_name__icontains=search) |
#             Q(middle_name__icontains=search) |
#             Q(last_name__icontains=search) |
#             Q(gender__icontains=search) |
#             Q(class_room__icontains=search) |
#             Q(section__icontains=search) |
#             Q(roll_no__icontains=search) |
#             Q(aadhaar_no__icontains=search) |
#             Q(abha_id__icontains=search) |
#             Q(mp_uhid__icontains=search) |
#             Q(dob__icontains=search)
#         )

#     school_students = await query.distinct()
#     student_ids = [s.id for s in school_students]

#     # ===================================================================
#     # Build Academic Year Filter for Activities
#     # ===================================================================
#     year_filter = build_academic_year_filter(academic_year)

#     # Fetch activity data for academic year
#     attendance_lookup = {}
#     dental_lookup = {}
#     eye_lookup = {}
#     behavioural_lookup = {}
#     nutrition_lookup = {}
#     smart_scale_lookup = {}
#     payment_lookup = {}

#     if student_ids:
#         # Get all screening/activity data with academic year filter
#         attendance_statuses = await AttendanceStatus.filter(
#             year_filter,
#             student_id__in=student_ids
#         ).all()
#         attendance_lookup = {s.student_id: s for s in attendance_statuses}

#         dental_screenings = await DentalScreening.filter(
#             year_filter,
#             student_id__in=student_ids
#         ).all()
#         dental_lookup = {s.student_id: s for s in dental_screenings}

#         eye_screenings = await EyeScreening.filter(
#             year_filter,
#             student_id__in=student_ids
#         ).all()
#         eye_lookup = {s.student_id: s for s in eye_screenings}

#         behavioural_screenings = await BehaviouralScreening.filter(
#             year_filter,
#             student_id__in=student_ids
#         ).all()
#         behavioural_lookup = {s.student_id: s for s in behavioural_screenings}

#         nutrition_screenings = await NutritionScreening.filter(
#             year_filter,
#             student_id__in=student_ids
#         ).all()
#         nutrition_lookup = {s.student_id: s for s in nutrition_screenings}

#         smart_scale_data = await SmartScaleData.filter(
#             year_filter,
#             student_id__in=student_ids
#         ).all()
#         smart_scale_lookup = {s.student_id: s for s in smart_scale_data}

#         # Payment records for academic year (CORRECTED - using created_at/updated_at)
#         paid_students = await StudentSchoolPayment.filter(
#             year_filter,
#             student_id__in=student_ids,
#             is_deleted=False,
#             is_paid=True
#         ).values_list("student_id", flat=True)
#         payment_lookup = {sid: True for sid in paid_students}

#     class_values_dict = {
#         "12": "12th Class",
#         "11": "11th Class",
#         "10": "10th Class",
#         "9": "9th Class",
#         "8": "8th Class",
#         "7": "7th Class",
#         "6": "6th Class",
#         "5": "5th Class",
#         "4": "4th Class",
#         "3": "3rd Class",
#         "2": "2nd Class",
#         "1": "1st Class",
#         "Nursery": "Nursery",
#         "LKG": "LKG",
#         "UKG": "UKG"
#     }

#     class_dict = {}
#     for student in school_students:
#         if not student:
#             continue

#         klass_num = student.class_room
#         class_name = class_values_dict.get(str(student.class_room), "")
#         if class_name not in class_dict:
#             class_dict[class_name] = {}

#         section_key = f"{klass_num}_{student.section}"
#         if section_key not in class_dict[class_name]:
#             class_dict[class_name][section_key] = {
#                 "class": str(klass_num),
#                 "section": student.section,
#                 "students": []
#             }

#         try:
#             student_dict = {
#                 "id": student.id,
#                 "first_name": student.first_name,
#                 "middle_name": student.middle_name,
#                 "last_name": student.last_name,
#                 "class": str(klass_num),
#                 "section": student.section,
#                 "roll_no": student.roll_no,
#                 "age": str(calculate_age_string(student.dob)),
#                 "profile_image": await get_new_url(student.profile_image) or "",
                
#                 # Add screening status for selected academic year
#                 "registration_status": bool(attendance_lookup.get(student.id)),
#                 "dental_screening_status": dental_lookup.get(student.id).screening_status if dental_lookup.get(student.id) else False,
#                 "eye_screening_status": eye_lookup.get(student.id).screening_status if eye_lookup.get(student.id) else False,
#                 "behavioural_screening_status": behavioural_lookup.get(student.id).screening_status if behavioural_lookup.get(student.id) else False,
#                 "nutrition_screening_status": nutrition_lookup.get(student.id).screening_status if nutrition_lookup.get(student.id) else False,
#                 "smart_scale_status": smart_scale_lookup.get(student.id).screening_status if smart_scale_lookup.get(student.id) else False,
#                 "school_payment_status": payment_lookup.get(student.id, False),
#             }
#             class_dict[class_name][section_key]["students"].append(student_dict)
#         except Exception:
#             continue

#     school_data = {
#         "higher_secondary": [],
#         "secondary": [],
#         "upper_primary": [],
#         "primary": [],
#         "pre_primary": []
#     }
#     for class_name in sorted(class_dict.keys(), key=sort_key, reverse=True):
#         class_data = []
#         for section_key in sorted(class_dict[class_name].keys()):
#             section_data = class_dict[class_name][section_key]
#             try:
#                 section_dict = {
#                     "class": section_data["class"],
#                     "section": section_data["section"],
#                     "students_count": len(section_data["students"]),
#                     "students": section_data["students"]
#                 }
#                 class_data.append(section_dict)
#             except Exception:
#                 continue
#         if class_data:
#             if class_name in ["12th Class", "11th Class"]:
#                 school_data["higher_secondary"].append({"class": class_name, "sections": class_data})
#             if class_name in ["10th Class", "9th Class"]:
#                 school_data["secondary"].append({"class": class_name, "sections": class_data})
#             if class_name in ["8th Class", "7th Class", "6th Class"]:
#                 school_data["upper_primary"].append({"class": class_name, "sections": class_data})
#             if class_name in ["5th Class", "4th Class", "3rd Class", "2nd Class", "1st Class"]:
#                 school_data["primary"].append({"class": class_name, "sections": class_data})
#             if class_name in ["Nursery", "LKG", "UKG"]:
#                 school_data["pre_primary"].append({"class": class_name, "sections": class_data})

#     resp = StandardResponse(
#         status=True,
#         message=f"School data retrieved successfully for academic year {academic_year}",
#         data={
#             "academic_year": academic_year,
#             "school_data": school_data
#         },
#         errors={}
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

