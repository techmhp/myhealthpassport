from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from tortoise.transactions import in_transaction

from src.core.manager import get_current_user
from src.models.school_models import Schools
from src.models.student_models import SchoolStudents, Students
from src.utils.response import StandardResponse
from src.schemas.student_schema import StudentData,ClassSectionData,ClassGroupData,SchoolDataResponse

router = APIRouter()

# Helper function to calculate age from date of birth
def calculate_age(dob: date) -> int:
    today = date.today()
    age = today.year - dob.year
    if today.month < dob.month or (today.month == dob.month and today.day < dob.day):
        age -= 1
    return max(age, 0)  # Ensure age is non-negative

# Helper function to fetch the school associated with the current user
async def get_user_school(current_user: dict) -> Optional[Schools]:
    school_id = current_user.get("school_id")
    if not school_id:
        return None
    return await Schools.filter(school_id=school_id).first()


@router.get(
    "/school-students",
    response_model=StandardResponse,
    status_code=200,
)
async def get_school_students(
    current_user: dict = Depends(get_current_user),
    klass: Optional[int] = Query(None, ge=1, le=12),
    section: Optional[str] = Query(None, max_length=10),
    search: Optional[str] = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=100),
):
    """
    Fetch all students for the school associated with the current user,
    grouped by class and section, with optional filtering and pagination.
    """
    async with in_transaction():
        try:
            # Fetch the school associated with the current user
            school = await get_user_school(current_user)
            if not school:
                return StandardResponse(
                    status=False,
                    message="school data",
                    data={"school_data": []},
                    error={"school": "User is not linked to any school."}
                )

            # Build query for SchoolStudents
            query = SchoolStudents.filter(school=school, status=True)
            if klass is not None:
                query = query.filter(student__class_room=klass)
            if section is not None:
                query = query.filter(student__section=section)
            if search:
                search = search.strip()
                query = query.filter(
                    student__first_name__icontains=search
                ) | query.filter(
                    student__last_name__icontains=search
                ) | query.filter(
                    student__roll_no__icontains=search
                )

            # Apply pagination
            offset = (page - 1) * page_size
            school_students = (
                await query.offset(offset).limit(page_size)
                .select_related("student")
                .prefetch_related("student")
            )

            # Organize students by class and section
            class_dict = {}
            for school_student in school_students:
                student = school_student.student
                if not student:
                    continue

                # Validate class_room
                klass_num = student.class_room
                if not isinstance(klass_num, int) or klass_num < 1 or klass_num > 12:
                    continue

                # Validate section
                if not student.section:
                    continue

                # Create class key (e.g., "10th class", "9th class")
                class_name = f"{klass_num}th class"
                if class_name not in class_dict:
                    class_dict[class_name] = {}

                # Create section key (e.g., "10_A", "10_B")
                section_key = f"{klass_num}_{student.section}"
                if section_key not in class_dict[class_name]:
                    class_dict[class_name][section_key] = {
                        "class": str(klass_num),  # Use 'class' to match alias
                        "section": student.section,
                        "students": []
                    }

                # Add student data
                try:
                    student_dict = {
                        "first_name": student.first_name,
                        "middle_name": student.middle_name,
                        "last_name": student.last_name,
                        "class": str(klass_num),  # Use 'class' to match alias
                        "section": student.section,
                        "roll_no": student.roll_no,
                        "age": str(calculate_age(student.dob))
                    }
                    student_data = StudentData(**student_dict)
                    class_dict[class_name][section_key]["students"].append(student_data)
                except Exception:
                    continue

            # Format response data
            school_data = []
            for class_name in sorted(class_dict.keys(), key=lambda x: int(x.split("th")[0]), reverse=True):
                class_data = []
                for section_key in sorted(class_dict[class_name].keys()):
                    section_data = class_dict[class_name][section_key]
                    try:
                        section_dict = {
                            "class": section_data["class"],  # Use alias 'class'
                            "section": section_data["section"],
                            "studnets_count": len(section_data["students"]),
                            "students": section_data["students"]
                        }
                        class_section = ClassSectionData(**section_dict)
                        class_data.append(class_section)
                    except Exception:
                        continue
                if class_data:  # Only include classes with valid sections
                    school_data.append(ClassGroupData(
                        class_name=class_name,
                        class_data=class_data
                    ))

            return StandardResponse(
                status=True,
                message="school data",
                data={"school_data": school_data},
                error={}
            )

        except Exception as e:
            return StandardResponse(
                status=False,
                message="school data",
                data={"school_data": []},
                error={"server": str(e)}
            )