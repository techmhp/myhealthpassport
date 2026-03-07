from typing import List, Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query, Form
from tortoise.exceptions import DoesNotExist
from pydantic import BaseModel, Field, validator
from src.models.school_models import Schools
from src.models.student_models import SchoolStudents, Students
from src.schemas.student_schema import StudentResponse
import re

router = APIRouter()

# Define the standard response model for consistent API responses
class StandardResponse(BaseModel):
    status: bool = Field(default=False)
    message: str = Field(default="")
    data: Dict[str, Any] = Field(default_factory=dict)
    errors: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True  # Support Pydantic V2 for ORM compatibility

# Pydantic model for validating query parameters for student retrieval
class StudentQuery(BaseModel):
    school_id: int
    klass: Optional[str] = None
    section: Optional[str] = None
    page: int = 1
    per_page: int = 10

    @validator("school_id")
    def validate_school_id(cls, v):
        if v <= 0:
            raise ValueError("School ID must be a positive integer")
        return v

    @validator("klass", "section")
    def validate_string_fields(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Class or section cannot be empty")
            if len(v) > 50:
                raise ValueError("Class or section cannot exceed 50 characters")
            if not re.match(r"^[a-zA-Z0-9\s\-]+$", v):
                raise ValueError("Class or section can only contain letters, numbers, spaces, or hyphens")
        return v

    @validator("page")
    def validate_page(cls, v):
        if v < 1:
            raise ValueError("Page number must be at least 1")
        return v

    @validator("per_page")
    def validate_per_page(cls, v):
        if v < 1 or v > 100:
            raise ValueError("Number of students per page must be between 1 and 100")
        return v

# Fetch all schools with pagination
@router.get("/schools", response_model=StandardResponse)
async def get_all_schools(
    page: int = Form(1, ge=1, description="Page number, starts from 1"),
    per_page: int = Form(10, ge=1, le=100, description="Number of schools per page, max 100")
):
    """
    Retrieve all schools with pagination.
    - Fetches all schools from the database, ordered by school_id.
    - Supports pagination via page and per_page parameters.
    """
    try:
        # Get total count for pagination
        total_schools = await Schools.all().count()

        # Fetch schools with pagination, ordered by school_id
        schools = await Schools.all().order_by("school_id").offset((page - 1) * per_page).limit(per_page).values(
            "school_id",
            "school_name",
            "school_code",
            "registration_no",
            "location",
            "created_at",
            "updated_at"
        )

        # Log for debugging
        print(f"Fetched {len(schools)} schools for page {page}, per_page {per_page}")

        # Handle empty results
        if not schools:
            return StandardResponse(
                status=True,
                message="No schools found in the database",
                data={
                    "schools": [],
                    "total": 0,
                    "page": page,
                    "per_page": per_page,
                    "total_pages": 0
                },
                errors={}
            )

        # Return successful response
        return StandardResponse(
            status=True,
            message="Schools retrieved successfully",
            data={
                "schools": schools,
                "total": total_schools,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_schools + per_page - 1) // per_page
            },
            errors={}
        )

    except Exception as e:
        print(f"Error in get_all_schools: {str(e)}")  # Debug log
        return StandardResponse(
            status=False,
            message="An error occurred",
            data={},
            errors={"detail": str(e)}
        )

# Fetch students for a specific school with filtering and pagination
@router.get("/{school_id}/students", response_model=StandardResponse)
async def get_students(
    school_id: int ,
    klass: Optional[str] = Form(None, description="Class to filter students by (e.g., 10A)"),
    section: Optional[str] = Form(None, description="Section to filter students by (e.g., B)"),
    page: int = Form(1, ge=1, description="Page number to fetch, starts from 1"),
    per_page: int = Form(10, ge=1, le=100, description="Number of students per page, defaults to 10, max 100"),
):
    """
    Retrieve students for a given school, filtered by class/section, with pagination.
    """
    try:
        # Validate query parameters
        query = StudentQuery(school_id=school_id, klass=klass, section=section, page=page, per_page=per_page)

        # Check if school exists
        school = await Schools.get_or_none(school_id=query.school_id)
        if not school:
            return StandardResponse(
                status=False,
                message=f"School with ID {query.school_id} not found",
                data={},
                errors={"detail": f"School with ID {query.school_id} not found"}
            )

        # Get students associated with the school
        school_students = await SchoolStudents.filter(
            school_id=school.school_id, status=True
        ).select_related("student")

        if not school_students:
            return StandardResponse(
                status=True,
                message="No students found for the given school",
                data={"students": [], "total": 0, "page": query.page, "per_page": query.per_page},
                errors={}
            )

        # Collect valid student IDs
        student_ids = []
        for ss in school_students:
            if ss.student:
                student_ids.append(ss.student.student_id)

        if not student_ids:
            return StandardResponse(
                status=True,
                message="No valid student records found for the given school",
                data={"students": [], "total": 0, "page": query.page, "per_page": query.per_page},
                errors={}
            )

        # Build filters for student query
        filters = {"student_id__in": student_ids}
        if query.klass:
            filters["klass"] = query.klass
        if query.section:
            filters["section"] = query.section

        # Get total count
        total_students = await Students.filter(**filters).count()

        # Query students with pagination
        students = await Students.filter(
            **filters
        ).offset((query.page - 1) * query.per_page).limit(query.per_page).prefetch_related("parents")

        # Prepare response
        student_responses = []
        for student in students:
            if not student.student_id or not student.first_name or not student.last_name:
                continue
            student_responses.append(
                StudentResponse(
                    student_id=student.student_id,
                    first_name=student.first_name,
                    middle_name=student.middle_name,
                    last_name=student.last_name,
                    gender=student.gender,
                    dob=student.dob,
                    klass=student.klass,
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
                    pincode=student.pincode,
                    country_code=student.country_code,
                    phone=student.phone,
                    country=student.country,
                    blood_group=student.blood_group,
                    profile_image=student.profile_image,
                    created_at=student.created_at,
                    updated_at=student.updated_at
                )
            )

        return StandardResponse(
            status=True,
            message="Students retrieved successfully",
            data={
                "students": student_responses,
                "total": total_students,
                "page": query.page,
                "per_page": query.per_page,
                "total_pages": (total_students + query.per_page - 1) // query.per_page
            },
            errors={}
        )

    except ValueError as ve:
        return StandardResponse(
            status=False,
            message="Invalid query parameters",
            data={},
            errors={"detail": str(ve)}
        )
    except Exception as e:
        print(f"Error in get_students: {str(e)}")
        return StandardResponse(
            status=False,
            message="An error occurred",
            data={},
            errors={"detail": str(e)}
        )

# Fetch a specific student by ID with pagination
@router.get("/student-by-id/{student_id}", response_model=StandardResponse)
async def get_student_by_id(
    student_id: int,
    page: int = Query(1, ge=1, description="Page number to fetch, starts from 1"),
    per_page: int = Query(20, ge=1, description="Number of students per page, defaults to 20"),
):
    """
    Retrieve a student by their ID, with pagination support.
    """
    try:
        students = await Students.filter(
            student_id=student_id
        ).offset((page - 1) * per_page).limit(per_page).prefetch_related("parents")

        if not students:
            return StandardResponse(
                status=False,
                message=f"Student with ID {student_id} not found",
                data={},
                errors={"detail": f"Student with ID {student_id} not found"}
            )

        student_responses = [
            StudentResponse(
                student_id=student.student_id,
                first_name=student.first_name,
                middle_name=student.middle_name,
                last_name=student.last_name,
                gender=student.gender,
                dob=student.dob,
                klass=student.klass,
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
                pincode=student.pincode,
                country_code=student.country_code,
                phone=student.phone,
                country=student.country,
                blood_group=student.blood_group,
                profile_image=student.profile_image,
                created_at=student.created_at,
                updated_at=student.updated_at
            )
            for student in students
        ]

        return StandardResponse(
            status=True,
            message="Student retrieved successfully",
            data={"students": student_responses, "total": len(student_responses)},
            errors={}
        )

    except Exception as e:
        print(f"Error in get_student_by_id: {str(e)}")
        return StandardResponse(
            status=False,
            message="An error occurred",
            data={},
            errors={"detail": str(e)}
        )
