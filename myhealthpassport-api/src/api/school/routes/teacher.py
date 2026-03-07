from typing import Optional

from fastapi import Depends, Query, status
from fastapi.responses import JSONResponse
from tortoise.expressions import Q
from tortoise.transactions import in_transaction

from src.core.file_manager import save_base64_image, get_new_url
from src.core.manager import get_current_user
from src.core.password_manager import create_password_hash
from src.models.school_models import Schools
from src.models.user_models import SchoolRoles, SchoolStaff, AdminTeamRoles
from src.models.questionnaire_models import TeacherAnswers,ParentAnswers,StudentsQuestionBank
from src.models.student_models import Students
from src.utils.calculator import calculate_age_string
from src.utils.response import StandardResponse
from src.utils.transactions import generate_user_code

from .. import router
from ..schema import TeacherCreate, TeacherListResponse, TeacherResponse, TeacherUpdate

TEACHER_PICS_DIR = "uploads/teachers_profile_pics"


@router.post("/create-school-teacher", response_model=StandardResponse)
async def create_school_teacher(
    teacher_data: TeacherCreate, current_user: dict = Depends(get_current_user)
):
    user_role = current_user["user_role"]
    try:
        # Check if user is SCHOOL_ADMIN or SUPER_ADMIN
        if user_role not in [SchoolRoles.SCHOOL_ADMIN.value, AdminTeamRoles.SUPER_ADMIN.value]:
            try:
                creator_role = SchoolRoles(user_role)
                message = f"{creator_role.value} is not allowed to create teacher records."
            except ValueError:
                message = f"{user_role} is not allowed to create teacher records."
            resp = StandardResponse(
                status=False,
                message=message,
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)
    except Exception:
        resp = StandardResponse(
            status=False,
            message=f"{user_role} is not allowed to create teacher records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # Check if phone already exists
    teacher_exists = await SchoolStaff.get_or_none(phone=teacher_data.phone)
    if teacher_exists:
        resp = StandardResponse(
            status=False,
            message="Mobile number already exists.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    image_path = ""
    if teacher_data.profile_image:
        try:
            image_path = await save_base64_image(
                base64_string=teacher_data.profile_image,
                destination_folder=TEACHER_PICS_DIR,
                user_role=user_role,
                role_type="school_staff",
                return_key_only=True
            )
            if not image_path:
                image_path = ""
        except Exception as e:
            # Log or handle error as needed
            image_path = ""

    # Get school of current user (School Admin)
    school = None
    if user_role == SchoolRoles.SCHOOL_ADMIN.value:
        school_staff = await SchoolStaff.filter(id=current_user["user_id"]).first()
        if school_staff and school_staff.school_id:
            school = await Schools.filter(school_id=school_staff.school_id).first()
    elif user_role == AdminTeamRoles.SUPER_ADMIN.value:
        # Super Admin must provide school_id in teacher_data
        if not teacher_data.school_id:
            resp = StandardResponse(
                status=False,
                message="School ID is required for Super Admin.",
                errors={"school_id": "School ID must be provided."},
                data={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
        school = await Schools.filter(school_id=teacher_data.school_id).first()
        if not school:
            resp = StandardResponse(
                status=False,
                message="Invalid school ID.",
                errors={"school_id": "School not found."},
                data={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    if not school:
        resp = StandardResponse(
            status=False,
            message="School not found or not authorized.",
            errors={"school_id": "Invalid school ID."},
            data={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # Generate username and hashed password
    username = (school.school_code if school else "SCH") + "-" + generate_user_code()
    username = username.upper()
    hashed_password = create_password_hash(username)

    teacher = await SchoolStaff.create(
        first_name=teacher_data.first_name,
        last_name=teacher_data.last_name,
        middle_name=teacher_data.middle_name or "",
        username=username,
        phone=teacher_data.phone,
        email=teacher_data.email or "",
        password=hashed_password,
        dob=teacher_data.dob,
        school_id = teacher_data.school_id,
        gender=teacher_data.gender or "",
        address_line_1=teacher_data.address_line_1 or "",
        address_line_2=teacher_data.address_line_2 or "",
        landmark=teacher_data.landmark or "",
        street=teacher_data.street or "",
        state=teacher_data.state or "",
        location=teacher_data.location or "",
        pincode=teacher_data.pincode or "",
        country_calling_code=teacher_data.country_calling_code or "",
        country=teacher_data.country or "",
        class_room=teacher_data.class_room,
        section=teacher_data.section or "",
        user_role=SchoolRoles.TEACHER,
        role_type="SCHOOL_STAFF",
        school=school,
        is_active=True,
        is_verified=True,
        profile_image=image_path,
        created_by=current_user["user_id"],     
        created_user_role=current_user["user_role"],       
        created_role_type=current_user["role_type"], 
    )

    response_data = {
        "user_id": teacher.id,
        "username": teacher.username,
        "role": teacher.user_role.value,
        "first_name": teacher.first_name,
        "middle_name": teacher.middle_name,
        "last_name": teacher.last_name,
        "profile_image": teacher.profile_image,

    }

    resp = StandardResponse(
        status=True,
        message="Teacher created successfully.",
        data={"teacher": response_data},
        errors={},
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────────────────────
#  IMPORTS & CONSTANTS
# ──────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from typing import Optional, Set
from tortoise.expressions import Q
from src.models.school_models import Schools
from src.models.student_models import Students, SchoolStudents, ParentChildren
from src.models.questionnaire_models import StudentsQuestionBank, ParentAnswers, TeacherAnswers


# ──────────────────────────────────────────────────────────────
#  QUESTION ID CONSTANTS (Teacher side)
# ──────────────────────────────────────────────────────────────
class TeacherQuestionID:
    NUTRITIONAL_HARDCODED_START = 3100000   # 31 lakhs
    EMOTIONAL_HARDCODED_START   = 4100000   # 41 lakhs


# ──────────────────────────────────────────────────────────────
#  HELPER: Grade normalization
# ──────────────────────────────────────────────────────────────
def normalize_grade(grade: str) -> str:
    """Convert 'Class 5', 'class 5', 'Class V' → '5' or 'V'"""
    if not grade or not isinstance(grade, str):
        return ""
    grade = grade.strip().lower()
    return grade.replace("class ", "").replace("class", "")
    

def is_grade_in_range(student_grade: str, grade_level: list) -> bool:
    """Check if normalized student_grade is in the list of allowed grades"""
    if not student_grade or not grade_level:
        return False
    student_norm = normalize_grade(student_grade)
    allowed = [normalize_grade(str(g)) for g in grade_level]
    return student_norm in allowed


# ──────────────────────────────────────────────────────────────
#  TEACHER QUESTION FETCHERS (exact same logic as your student list API)
# ──────────────────────────────────────────────────────────────
async def get_teacher_nutritional_questions_for_grade(class_room: str) -> Set[int]:
    """Return set of ALL nutritional question IDs (DB + hardcoded) applicable to this grade"""
    question_ids: Set[int] = set()
    seen_texts = set()

    # 1. Database questions
    db_questions = await StudentsQuestionBank.filter(
        question_type="NUTRITIONAL",
        applicable_to_teacher=True,
        is_deleted=False
    ).all()

    for q in db_questions:
        grades = [g.strip() for g in q.grade_level.split(",") if g.strip()]
        if is_grade_in_range(class_room, grades):
            question_ids.add(q.question_id)
            seen_texts.add(q.question_text.lower().strip())

    # 2. Hardcoded questions
    try:
        from src.api.teacher.nutritional_questions_teachers import NUTRITIONAL_QUESTIONS as TEACHER_NUT
        for idx, q in enumerate(TEACHER_NUT):
            if q.get("applicable_to_teacher", False) and is_grade_in_range(class_room, q.get("grade_level", [])):
                text = q["question_text"].lower().strip()
                if text not in seen_texts:
                    question_ids.add(TeacherQuestionID.NUTRITIONAL_HARDCODED_START + idx)
                    seen_texts.add(text)
    except (ImportError, KeyError, AttributeError):
        pass

    return question_ids


async def get_teacher_emotional_questions_for_grade(class_room: str) -> Set[int]:
    """Return set of ALL emotional/developmental question IDs (DB + hardcoded) applicable to this grade"""
    question_ids: Set[int] = set()
    seen_texts = set()

    # 1. Database questions
    db_questions = await StudentsQuestionBank.filter(
        question_type="EMOTIONAL_DEVELOPMENTAL",
        applicable_to_teacher=True,
        is_deleted=False
    ).all()

    for q in db_questions:
        grades = [g.strip() for g in q.grade_level.split(",") if g.strip()]
        if is_grade_in_range(class_room, grades):
            question_ids.add(q.question_id)
            seen_texts.add(q.question_text.lower().strip())

    # 2. Hardcoded questions
    try:
        from src.api.teacher.emotional_developmental_questions_teachers import (
            EMOTIONAL_DEVELOPMENTAL_QUESTIONS as TEACHER_EMO
        )
        for idx, q in enumerate(TEACHER_EMO):
            if q.get("applicable_to_teacher", False):
                q_grades = [normalize_grade(str(g)) for g in q.get("grade_level", [])]
                if is_grade_in_range(class_room, q_grades):
                    text = q["question_text"].lower().strip()
                    if text not in seen_texts:
                        question_ids.add(TeacherQuestionID.EMOTIONAL_HARDCODED_START + idx)
                        seen_texts.add(text)
    except (ImportError, KeyError, AttributeError):
        pass

    return question_ids



# @router.get("/teachers-list", response_model=StandardResponse)
# async def teachers_list(
#     search: Optional[str] = Query(None, description="Search by name, username, email, phone, section, class"),
#     school_id: Optional[str] = Query(None, description="Required for Program Coordinator / Super Admin"),
#     current_user: dict = Depends(get_current_user),
# ):
#     user_role = current_user["user_role"]
#     allowed_roles = [
#         SchoolRoles.SCHOOL_ADMIN.value,
#         AdminTeamRoles.PROGRAM_COORDINATOR.value,
#         AdminTeamRoles.SUPER_ADMIN.value,
#     ]

#     if user_role not in allowed_roles:
#         return JSONResponse(
#             content=StandardResponse(
#                 status=False,
#                 message=f"{user_role} is not allowed to fetch teacher records.",
#                 data={},
#                 errors={},
#             ).model_dump(),
#             status_code=status.HTTP_403_FORBIDDEN,
#         )

#     async with in_transaction():
#         # Determine target school
#         if user_role in [AdminTeamRoles.PROGRAM_COORDINATOR.value, AdminTeamRoles.SUPER_ADMIN.value]:
#             if not school_id:
#                 return JSONResponse(
#                     content=StandardResponse(
#                         status=False,
#                         message="School ID is required for Program Coordinator or Super Admin.",
#                         errors={"school_id": ["This field is required."]}
#                     ).model_dump(),
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                 )
#             target_school_id = school_id
#         else:
#             target_school_id = current_user.get("school_id")

#         school = await Schools.filter(school_id=target_school_id).first()
#         if not school:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message="School not found or access denied.",
#                     errors={"school_id": ["Invalid or unauthorized school ID."]}
#                 ).model_dump(),
#                 status_code=status.HTTP_403_FORBIDDEN,
#             )

#         # Base teacher query
#         query = SchoolStaff.filter(
#             school_id=school.school_id,
#             user_role=SchoolRoles.TEACHER.value,
#             is_deleted=False
#         )

#         # Search filter
#         if search := (search or "").strip():
#             if search.isdigit():
#                 class_num = int(search)
#                 query = query.filter(
#                     Q(first_name__icontains=search) |
#                     Q(last_name__icontains=search) |
#                     Q(username__icontains=search) |
#                     Q(email__icontains=search) |
#                     Q(phone__icontains=search) |
#                     Q(section__icontains=search) |
#                     Q(class_room=class_num)
#                 )
#             else:
#                 query = query.filter(
#                     Q(first_name__icontains=search) |
#                     Q(last_name__icontains=search) |
#                     Q(username__icontains=search) |
#                     Q(email__icontains=search) |
#                     Q(phone__icontains=search) |
#                     Q(section__icontains=search)
#                 )

#         teachers = await query.select_related("school").all()
#         teachers_list = []

#         for teacher in teachers:
#             normalized_class = normalize_grade(teacher.class_room)

#             # Get students in this teacher's class + section
#             students = await Students.filter(
#                 school_students__school=school.school_id,
#                 class_room=teacher.class_room,
#                 section=teacher.section,
#                 is_deleted=False
#             ).only("id")

#             total_students = len(students)
#             student_ids = [s.id for s in students]

#             teacher_answer_status = False
#             class_strength = total_students

#             if total_students == 0:
#                 teacher_answer_status = True  # No students → complete
#             else:
#                 # Expected questions for this grade
#                 expected_nutritional = await get_teacher_nutritional_questions_for_grade(normalized_class)
#                 expected_emotional = await get_teacher_emotional_questions_for_grade(normalized_class)

#                 if not expected_nutritional and not expected_emotional:
#                     teacher_answer_status = True  # No questions defined → complete
#                 else:
#                     all_students_complete = True

#                     for student_id in student_ids:
#                         # Answers given by this teacher to this specific student
#                         answered_ids = await TeacherAnswers.filter(
#                             teacher_id=teacher.id,
#                             student_id=student_id,
#                             is_deleted=False
#                         ).values_list("question_id", flat=True)

#                         answered_set = set(answered_ids)

#                         nutritional_ok = not expected_nutritional or expected_nutritional.issubset(answered_set)
#                         emotional_ok = not expected_emotional or expected_emotional.issubset(answered_set)

#                         if not (nutritional_ok and emotional_ok):
#                             all_students_complete = False
#                             break  # One incomplete student → teacher status = False

#                     teacher_answer_status = all_students_complete

#             teachers_list.append({
#                 "id": teacher.id,
#                 "first_name": teacher.first_name or "",
#                 "last_name": teacher.last_name or "",
#                 "middle_name": teacher.middle_name or "",
#                 "username": teacher.username,
#                 "email": teacher.email or "",
#                 "phone": teacher.phone or "",
#                 "country_calling_code": teacher.country_calling_code or "",
#                 "is_active": teacher.is_active,
#                 "profile_image": await get_new_url(teacher.profile_image) if teacher.profile_image else "",
#                 "class_room": teacher.class_room,
#                 "section": teacher.section,
#                 "user_role": teacher.user_role,
#                 "role_type": teacher.role_type,
#                 "location": teacher.location or "",
#                 "dob": str(teacher.dob) if teacher.dob else None,
#                 "gender": teacher.gender or "",
#                 "age": calculate_age_string(teacher.dob) if teacher.dob else "N/A",
#                 "teacher_answer_status": teacher_answer_status,
#                 "class_strength": class_strength,
#             })

#         return StandardResponse(
#             status=True,
#             message="Teachers retrieved successfully.",
#             data={"teachers_list": teachers_list}
#         )

# Add this import at the top
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ──────────────────────────────────────────────────────────────
#  MODIFIED: /teachers-list ENDPOINT (with Academic Year Filter)
# ──────────────────────────────────────────────────────────────
@router.get("/teachers-list", response_model=StandardResponse)
async def teachers_list(
    search: Optional[str] = Query(None, description="Search by name, username, email, phone, section, class"),
    school_id: Optional[str] = Query(None, description="Required for Program Coordinator / Super Admin"),
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user: dict = Depends(get_current_user),
):
    user_role = current_user["user_role"]
    allowed_roles = [
        SchoolRoles.SCHOOL_ADMIN.value,
        AdminTeamRoles.PROGRAM_COORDINATOR.value,
        AdminTeamRoles.SUPER_ADMIN.value,
    ]

    if user_role not in allowed_roles:
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message=f"{user_role} is not allowed to fetch teacher records.",
                data={},
                errors={},
            ).model_dump(),
            status_code=status.HTTP_403_FORBIDDEN,
        )

    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()

    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message=str(e),
                data={},
                errors={"academic_year": str(e)}
            ).model_dump(),
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    async with in_transaction():
        # Determine target school
        if user_role in [AdminTeamRoles.PROGRAM_COORDINATOR.value, AdminTeamRoles.SUPER_ADMIN.value]:
            if not school_id:
                return JSONResponse(
                    content=StandardResponse(
                        status=False,
                        message="School ID is required for Program Coordinator or Super Admin.",
                        errors={"school_id": ["This field is required."]}
                    ).model_dump(),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            target_school_id = school_id
        else:
            target_school_id = current_user.get("school_id")

        school = await Schools.filter(school_id=target_school_id).first()
        if not school:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="School not found or access denied.",
                    errors={"school_id": ["Invalid or unauthorized school ID."]}
                ).model_dump(),
                status_code=status.HTTP_403_FORBIDDEN,
            )

        # Base teacher query (teachers are NOT filtered by academic year)
        query = SchoolStaff.filter(
            school_id=school.school_id,
            user_role=SchoolRoles.TEACHER.value,
            is_deleted=False
        )

        # Search filter
        if search := (search or "").strip():
            if search.isdigit():
                class_num = int(search)
                query = query.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search) |
                    Q(username__icontains=search) |
                    Q(email__icontains=search) |
                    Q(phone__icontains=search) |
                    Q(section__icontains=search) |
                    Q(class_room=class_num)
                )
            else:
                query = query.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search) |
                    Q(username__icontains=search) |
                    Q(email__icontains=search) |
                    Q(phone__icontains=search) |
                    Q(section__icontains=search)
                )

        teachers = await query.select_related("school").all()
        teachers_list = []

        # Build academic year filter for answers
        year_filter = build_academic_year_filter(academic_year)

        for teacher in teachers:
            normalized_class = normalize_grade(teacher.class_room)

            # Get students in this teacher's class + section (students NOT filtered by year)
            students = await Students.filter(
                school_students__school=school.school_id,
                class_room=teacher.class_room,
                section=teacher.section,
                is_deleted=False
            ).only("id")

            total_students = len(students)
            student_ids = [s.id for s in students]

            teacher_answer_status = False
            class_strength = total_students

            if total_students == 0:
                teacher_answer_status = True  # No students → complete
            else:
                # Expected questions for this grade
                expected_nutritional = await get_teacher_nutritional_questions_for_grade(normalized_class)
                expected_emotional = await get_teacher_emotional_questions_for_grade(normalized_class)

                if not expected_nutritional and not expected_emotional:
                    teacher_answer_status = True  # No questions defined → complete
                else:
                    all_students_complete = True

                    for student_id in student_ids:
                        # Answers given by this teacher to this specific student
                        # FILTERED BY ACADEMIC YEAR (created_at OR updated_at)
                        answered_ids = await TeacherAnswers.filter(
                            year_filter,  # Academic year filter
                            teacher_id=teacher.id,
                            student_id=student_id,
                            is_deleted=False
                        ).values_list("question_id", flat=True)

                        answered_set = set(answered_ids)

                        nutritional_ok = not expected_nutritional or expected_nutritional.issubset(answered_set)
                        emotional_ok = not expected_emotional or expected_emotional.issubset(answered_set)

                        if not (nutritional_ok and emotional_ok):
                            all_students_complete = False
                            break  # One incomplete student → teacher status = False

                    teacher_answer_status = all_students_complete

            teachers_list.append({
                "id": teacher.id,
                "first_name": teacher.first_name or "",
                "last_name": teacher.last_name or "",
                "middle_name": teacher.middle_name or "",
                "username": teacher.username,
                "email": teacher.email or "",
                "phone": teacher.phone or "",
                "country_calling_code": teacher.country_calling_code or "",
                "is_active": teacher.is_active,
                "profile_image": await get_new_url(teacher.profile_image) if teacher.profile_image else "",
                "class_room": teacher.class_room,
                "section": teacher.section,
                "user_role": teacher.user_role,
                "role_type": teacher.role_type,
                "location": teacher.location or "",
                "dob": str(teacher.dob) if teacher.dob else None,
                "gender": teacher.gender or "",
                "age": calculate_age_string(teacher.dob) if teacher.dob else "N/A",
                "teacher_answer_status": teacher_answer_status,
                "class_strength": class_strength,
            })

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        resp = StandardResponse(
            status=True,
            message="Teachers retrieved successfully.",
            data={"teachers_list": teachers_list}  # ← Same format as original
        )
        
        response = JSONResponse(
            content=resp.model_dump(),
            status_code=status.HTTP_200_OK
        )
        response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return response


@router.get("/teacher/{teacher_id}", response_model=StandardResponse)
async def get_teacher_details(teacher_id: int, current_user: dict = Depends(get_current_user)):
    user_role = current_user["user_role"]
    try:
       if user_role not in [SchoolRoles.SCHOOL_ADMIN.value, AdminTeamRoles.SUPER_ADMIN.value]:
            try:
                role = SchoolRoles(user_role)
                message = f"{role.value} is not allowed to view teacher records."
            except ValueError:
                message = f"{user_role} is not a valid role."
            resp = StandardResponse(
                status=False,
                message=message,
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)
    except Exception:
        resp = StandardResponse(
            status=False,
            message=f"{user_role} is not a valid role.",
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # For SCHOOL_ADMIN, check their associated school; for SUPER_ADMIN, no school restriction
    if user_role == SchoolRoles.SCHOOL_ADMIN.value:
        admin_profile = await SchoolStaff.get_or_none(id=current_user["user_id"])
        if not admin_profile:
            resp = StandardResponse(status=False, message="Admin profile not found.")
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        teacher = await SchoolStaff.get_or_none(
            id=teacher_id,
            school_id=admin_profile.school_id,
            user_role=SchoolRoles.TEACHER,
        )
    else:  # SUPER_ADMIN
        teacher = await SchoolStaff.get_or_none(
            id=teacher_id,
            user_role=SchoolRoles.TEACHER,
        )

    if not teacher:
        resp = StandardResponse(
            status=False,
            message="Teacher not found.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    teacher_details = {
        "id": teacher.id,
        "first_name": teacher.first_name,
        "last_name": teacher.last_name,
        "middle_name": teacher.middle_name,
        "username": teacher.username,
        "phone": teacher.phone,
        "country_calling_code": teacher.country_calling_code,
        "email": teacher.email,
        "is_active": teacher.is_active,
        "profile_image": await get_new_url(teacher.profile_image) if teacher.profile_image else "",
        "class_room": teacher.class_room,
        "section": teacher.section,
        "user_role": teacher.user_role,
        "role_type": teacher.role_type,
        "dob": str(teacher.dob) if teacher.dob else None,
        "gender": teacher.gender,
        "age": str(calculate_age_string(teacher.dob)) if teacher.dob else "N/A",
        "address_line_1": teacher.address_line_1,
        "address_line_2": teacher.address_line_2,
        "landmark": teacher.landmark,
        "location":teacher.location,
        "street": teacher.street,
        "state": teacher.state,
        "pincode": teacher.pincode,
        "country": teacher.country,
        "created_at": str(teacher.created_at),
    }

    resp = StandardResponse(
        status=True,
        message="Teacher details retrieved successfully.",
        data={"teacher": teacher_details},
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)


@router.put("/teacher/{teacher_id}/update", response_model=StandardResponse)
async def update_teacher_details(
    teacher_id: int, update_data: TeacherUpdate, current_user: dict = Depends(get_current_user)
):
    user_role = current_user.get("user_role")
    if not user_role:
        resp = StandardResponse(
            status=False,
            message="User role not provided.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        # Allow both SCHOOL_ADMIN and SUPER_ADMIN
        if user_role not in [SchoolRoles.SCHOOL_ADMIN.value, AdminTeamRoles.SUPER_ADMIN.value]:
            try:
                role = SchoolRoles(user_role)
                message = f"{role.value} is not allowed to update teacher records."
            except ValueError:
                message = f"{user_role} is not a valid role."
            resp = StandardResponse(
                status=False,
                message=message,
                data={},
                errors={},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)
    except Exception as e:
        resp = StandardResponse(
            status=False,
            message=f"Invalid role: {str(e)}",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    async with in_transaction():
        # For SCHOOL_ADMIN, check their associated school; for SUPER_ADMIN, no school restriction
        if user_role == SchoolRoles.SCHOOL_ADMIN.value:
            admin_profile = await SchoolStaff.get_or_none(id=current_user["user_id"])
            if not admin_profile:
                resp = StandardResponse(status=False, message="Admin profile not found.")
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)
            teacher = await SchoolStaff.get_or_none(id=teacher_id, school_id=admin_profile.school_id)
        else:  # SUPER_ADMIN
            teacher = await SchoolStaff.get_or_none(id=teacher_id)

        if not teacher:
            resp = StandardResponse(status=False, message="Teacher not found.")
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        update_payload = update_data.model_dump(exclude_unset=True)
        if "phone" in update_payload and update_payload["phone"] != teacher.phone:
            existing_user = await SchoolStaff.get_or_none(phone=update_payload["phone"])
            if existing_user:
                resp = StandardResponse(status=False, message="This phone number is already in use.")
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        if "profile_image" in update_payload and update_payload["profile_image"]:
            image_path = await save_base64_image(
                base64_string=update_payload["profile_image"],
                destination_folder=TEACHER_PICS_DIR,
                user_role=user_role,
            )
            if image_path:
                update_payload["profile_image"] = image_path
            else:
                del update_payload["profile_image"]
        
        update_payload["updated_by"] = current_user["user_id"]
        update_payload["updated_user_role"] = current_user["user_role"]
        update_payload["updated_role_type"] = current_user["role_type"]

        for key, value in update_payload.items():
            setattr(teacher, key, value)

        await teacher.save()

        response_data = {
            "id": teacher.id,
            "first_name": teacher.first_name,
            "last_name": teacher.last_name,
            "middle_name": teacher.middle_name,
            "username": teacher.username,
            "phone": teacher.phone,
            "country_calling_code": teacher.country_calling_code,
            "email": teacher.email,
            "is_active": teacher.is_active,
            "profile_image": await get_new_url(teacher.profile_image) if teacher.profile_image else "",
            "class_room": teacher.class_room,
            "section": teacher.section,
            "user_role": teacher.user_role,
            "role_type": teacher.role_type,
            "dob": str(teacher.dob) if teacher.dob else None,
            "gender": teacher.gender,
            "age": str(calculate_age_string(teacher.dob)) if teacher.dob else "N/A",
            "address_line_1": teacher.address_line_1,
            "address_line_2": teacher.address_line_2,
            "landmark": teacher.landmark,
            "location":teacher.location,
            "street": teacher.street,
            "state": teacher.state,
            "pincode": teacher.pincode,
            "country": teacher.country,
            "created_at": str(teacher.created_at),
            "location": teacher.location,
        }

        resp = StandardResponse(
            status=True,
            message="Teacher details updated successfully.",
            data={"teacher": response_data},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
