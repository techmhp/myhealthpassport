import re
from datetime import datetime
from typing import Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import ValidationError
from tortoise.exceptions import IntegrityError
from tortoise.transactions import in_transaction
from passlib.context import CryptContext

from src.core.manager import get_current_user
from src.models.school_models import Schools
from src.models.student_models import ParentChildren, SchoolStudents, Students
from src.models.user_models import Parents, ParentRoles
from src.schemas.parent_schema import ParentCreate, ParentResponse
from src.schemas.student_schema import (
    ParentChildrenCreate,
    SchoolStudentsCreate,
    StudentCreate,
    StudentResponse,
    StudentUpdate,
)
from src.utils.response import StandardResponse

router = APIRouter()

# Password hashing context (if needed for parent creation)
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

async def get_parent_by_mobile(mobile: str) -> Optional[Parents]:
    """Helper function to fetch a parent by mobile number."""
    return await Parents.filter(mobile=mobile).first()

async def get_user_school(current_user: dict) -> Optional[Schools]:
    """Helper function to fetch the school associated with the current user."""
    school_id = current_user.get("school_id")
    if not school_id:
        return None
    school = await Schools.filter(school_id=school_id).first()  # Use school_id instead of id
    return school

async def create_parent(
    parent_data: ParentCreate,
) -> tuple[Optional[Parents], Optional[StandardResponse]]:
    """Helper function to create a new parent."""
    try:
        parent = Parents(
            first_name=parent_data.first_name,
            last_name=parent_data.last_name,
            middle_name=parent_data.middle_name or "",
            mobile=parent_data.mobile,
            email=parent_data.email or "",
            relation=parent_data.relation,
            user_role=parent_data.user_role,
            is_active=parent_data.is_active,
            is_verified=parent_data.is_verified,
            profile_image=parent_data.profile_image or "",
            dob=parent_data.dob,
            gender=parent_data.gender or "",
            address_line_1=parent_data.address_line_1 or "",
            address_line_2=parent_data.address_line_2 or "",
            landmark=parent_data.landmark or "",
            street_name=parent_data.street_name or "",
            state=parent_data.state or "",
            pincode=parent_data.pincode or "",
            country_calling_code=parent_data.country_calling_code or "",
            country=parent_data.country or "",
        )
        await parent.save()
        return parent, None
    except IntegrityError:
        return None, StandardResponse(
            status=False,
            message="Parent with this mobile number already exists.",
            errors={"mobile": "Duplicate mobile number."}
        )

@router.post(
    "/create-student",
    response_model=StandardResponse,
    status_code=201,
)
async def create_student(
    student_data: StudentCreate,
    parent_data: ParentCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new student and attach to an existing or new parent and the school
    associated with the current user.
    Parent data (first_name, last_name, mobile) is mandatory.
    """
    async with in_transaction():
        try:
            # Fetch the school associated with the current user
            school = await get_user_school(current_user)
            if not school:
                return StandardResponse(
                    status=False,
                    message="No school associated with the current user.",
                    errors={"school": "User is not linked to any school."}
                )

            # Create student
            student = Students(
                first_name=student_data.first_name,
                middle_name=student_data.middle_name or "",
                last_name=student_data.last_name,
                gender=student_data.gender,
                dob=student_data.dob,
                class_room=student_data.klass,
                section=student_data.section,
                roll_no=student_data.roll_no,
                aadhaar_no=student_data.aadhaar_no,
                abha_id=student_data.abha_id,
                mp_uhid=student_data.mp_uhid or "",
                food_preferences=student_data.food_preferences or "",
                address_line1=student_data.address_line1,
                address_line2=student_data.address_line2 or "",
                landmark=student_data.landmark or "",
                street=student_data.street,
                state=student_data.state,
                pincode=str(student_data.pincode),
                country_code=student_data.country_code,
                phone=student_data.phone,
                country=student_data.country,
                blood_group=student_data.blood_group or "",
                profile_image=student_data.profile_image or "",
            )
            await student.save()

            # Handle parent linkage
            parent = await get_parent_by_mobile(parent_data.mobile)
            if not parent:
                parent, error_response = await create_parent(parent_data)
                if error_response:
                    return error_response

            # Create ParentChildren relationship
            parent_children = ParentChildren(
                parent=parent,
                student=student,
                primary_phone_no=parent_data.mobile,
                secondary_phone_no=parent_data.mobile,
                status=True,
            )
            await parent_children.save()

            # Create SchoolStudents relationship
            school_student = SchoolStudents(
                school=school,
                student=student,
                status=True,
            )
            await school_student.save()

            # Prepare response
            student_response = StudentResponse(
                student_id=student.student_id,
                first_name=student.first_name,
                middle_name=student.middle_name,
                last_name=student.last_name,
                gender=student.gender,
                dob=student.dob,
                klass=student.class_room,
                section=student.section,
                roll_no=student.roll_no,
                aadhaar_no=student.aadhaar_no,
                abha_id=student.abha_id,
                mp_uhid=student.mp_uhid,
                food_preferences=student.food_preferences,
                address_line1=student.address_line1,
                address_line2=student.address_line2,
                landmark=student.landmark,
                street=student.street,
                state=student.state,
                pincode=int(student.pincode),
                country_code=student.country_code,
                phone=student.phone,
                country=student.country,
                blood_group=student.blood_group,
                profile_image=student.profile_image,
                created_at=student.created_at,
                updated_at=student.updated_at,
                deleted_at=None,
            )

            parent_response = ParentResponse(
                id=parent.id,
                first_name=parent.first_name,
                last_name=parent.last_name,
                middle_name=parent.middle_name,
                mobile=parent.mobile,
                email=parent.email,
                relation=parent.relation,
                dob=parent.dob,
                gender=parent.gender,
                address_line_1=parent.address_line_1,
                address_line_2=parent.address_line_2,
                landmark=parent.landmark,
                street_name=parent.street_name,
                state=parent.state,
                pincode=parent.pincode,
                country_calling_code=parent.country_calling_code,
                country=parent.country,
                user_role=parent.user_role,
                is_active=parent.is_active,
                is_verified=parent.is_verified,
                profile_image=parent.profile_image,
                created_at=parent.created_at,
                updated_at=parent.updated_at,
            )

            return StandardResponse(
                status=True,
                message="Student created and linked to parent and school successfully.",
                data={"student": student_response.dict(), "parent": parent_response.dict()},
            )

        except ValidationError as ve:
            return StandardResponse(
                status=False,
                message="Validation error.",
                errors=ve.errors()
            )
        except IntegrityError as ie:
            return StandardResponse(
                status=False,
                message="Duplicate entry for unique field (e.g., aadhaar_no, abha_id, or parent mobile).",
                errors={"database": str(ie)}
            )
        except Exception as e:
            return StandardResponse(
                status=False,
                message="An unexpected error occurred.",
                errors={"server": str(e)}
            )

@router.put(
    "/update-student/{student_id}",
    response_model=StandardResponse,
    status_code=200,
)
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    parent_data: Optional[ParentCreate] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Update a student's details and optionally update or create parent linkage.
    The student is automatically linked to the school associated with the current user.
    Parent data (first_name, last_name, mobile) is mandatory when provided.
    """
    async with in_transaction():
        try:
            # Fetch existing student
            student = await Students.filter(student_id=student_id).first()
            if not student:
                return StandardResponse(
                    status=False,
                    message="Student not found.",
                    errors={"student_id": "Invalid student ID."}
                )

            # Fetch the school associated with the current user
            school = await get_user_school(current_user)
            if not school:
                return StandardResponse(
                    status=False,
                    message="No school associated with the current user.",
                    errors={"school": "User is not linked to any school."}
                )

            # Update student fields
            update_data = student_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                if field == "klass":
                    setattr(student, "class_room", value)
                elif field == "pincode" and value is not None:
                    setattr(student, field, str(value))
                elif value is not None:
                    setattr(student, field, value)
            await student.save()

            # Handle parent linkage if parent_data is provided
            parent = None
            if parent_data:
                parent = await get_parent_by_mobile(parent_data.mobile)
                if not parent:
                    parent, error_response = await create_parent(parent_data)
                    if error_response:
                        return error_response
                else:
                    # Update existing parent with new data
                    update_parent_data = parent_data.dict(exclude_unset=True)
                    for field, value in update_parent_data.items():
                        if value is not None:
                            setattr(parent, field, value)
                    await parent.save()

                # Check if ParentChildren relationship exists
                parent_children = await ParentChildren.filter(
                    student_id=student.student_id, parent_id=parent.id
                ).first()
                if not parent_children:
                    parent_children = ParentChildren(
                        parent=parent,
                        student=student,
                        primary_phone_no=parent_data.mobile,
                        secondary_phone_no=parent_data.mobile,
                        status=True,
                    )
                    await parent_children.save()
                else:
                    # Update existing ParentChildren
                    parent_children.primary_phone_no = parent_data.mobile
                    parent_children.secondary_phone_no = parent_data.mobile
                    parent_children.status = True
                    await parent_children.save()

            # Handle SchoolStudents relationship
            school_student = await SchoolStudents.filter(
                student_id=student.student_id
            ).first()
            if not school_student:
                school_student = SchoolStudents(
                    school=school,
                    student=student,
                    status=True,
                )
                await school_student.save()
            else:
                school_student.school = school
                school_student.status = True
                await school_student.save()

            # Prepare response
            student_response = StudentResponse(
                student_id=student.student_id,
                first_name=student.first_name,
                middle_name=student.middle_name,
                last_name=student.last_name,
                gender=student.gender,
                dob=student.dob,
                klass=student.class_room,
                section=student.section,
                roll_no=student.roll_no,
                aadhaar_no=student.aadhaar_no,
                abha_id=student.abha_id,
                mp_uhid=student.mp_uhid,
                food_preferences=student.food_preferences,
                address_line1=student.address_line1,
                address_line2=student.address_line2,
                landmark=student.landmark,
                street=student.street,
                state=student.state,
                pincode=int(student.pincode),
                country_code=student.country_code,
                phone=student.phone,
                country=student.country,
                blood_group=student.blood_group,
                profile_image=student.profile_image,
                created_at=student.created_at,
                updated_at=student.updated_at,
                deleted_at=None,
            )

            parent_response = None
            if parent:
                parent_response = ParentResponse(
                    id=parent.id,
                    first_name=parent.first_name,
                    last_name=parent.last_name,
                    middle_name=parent.middle_name,
                    mobile=parent.mobile,
                    email=parent.email,
                    relation=parent.relation,
                    dob=parent.dob,
                    gender=parent.gender,
                    address_line_1=parent.address_line_1,
                    address_line_2=parent.address_line_2,
                    landmark=parent.landmark,
                    street_name=parent.street_name,
                    state=parent.state,
                    pincode=parent.pincode,
                    country_calling_code=parent.country_calling_code,
                    country=parent.country,
                    user_role=parent.user_role,
                    is_active=parent.is_active,
                    is_verified=parent.is_verified,
                    profile_image=parent.profile_image,
                    created_at=parent.created_at,
                    updated_at=parent.updated_at,
                )

            return StandardResponse(
                status=True,
                message="Student updated successfully.",
                data={
                    "student": student_response.dict(),
                    "parent": parent_response.dict() if parent_response else None
                },
            )

        except ValidationError as ve:
            return StandardResponse(
                status=False,
                message="Validation error.",
                errors=ve.errors()
            )
        except IntegrityError as ie:
            return StandardResponse(
                status=False,
                message="Duplicate entry for unique field (e.g., aadhaar_no, abha_id, or parent mobile).",
                errors={"database": str(ie)}
            )
        except Exception as e:
            return StandardResponse(
                status=False,
                message="An unexpected error occurred.",
                errors={"server": str(e)}
            )