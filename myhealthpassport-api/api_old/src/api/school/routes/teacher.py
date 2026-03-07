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


# @router.get("/teachers-list", response_model=StandardResponse)
# async def teachers_list(
#     search: Optional[str] = Query(None, description="Search Fields"),
#     school_id: Optional[str] = Query(None, description="School ID for Program Coordinator or Super Admin"),
#     current_user: dict = Depends(get_current_user),
# ):
#     user_role = current_user["user_role"]

#     allowed_roles = [
#         SchoolRoles.SCHOOL_ADMIN.value,
#         AdminTeamRoles.PROGRAM_COORDINATOR.value,
#         AdminTeamRoles.SUPER_ADMIN.value,
#     ]

#     if user_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{user_role} is not allowed to fetch teacher records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     async with in_transaction():
#         target_school_id = None
#         if user_role in [AdminTeamRoles.PROGRAM_COORDINATOR.value, AdminTeamRoles.SUPER_ADMIN.value]:
#             if not school_id:
#                 resp = StandardResponse(
#                     status=False,
#                     message="School ID is required for Program Coordinator or Super Admin.",
#                     errors={"school_id": "School ID must be provided."},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
#             target_school_id = school_id
#         else:
#             target_school_id = current_user.get("school_id")

#         school = await Schools.filter(school_id=target_school_id).first()
#         if not school:
#             resp = StandardResponse(
#                 status=False,
#                 message="School not found or not authorized.",
#                 errors={"school_id": "Invalid school ID."},
#             )
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#         query = SchoolStaff.filter(school_id=school.school_id, user_role=SchoolRoles.TEACHER)

#         if search:
#             search_term = search.strip()
#             if search_term:
#                 class_search = None
#                 if search_term.isdigit():
#                     class_search = int(search_term)

#                 search_query = Q(
#                     Q(first_name__icontains=search_term)
#                     | Q(last_name__icontains=search_term)
#                     | Q(username__icontains=search_term)
#                     | Q(email__icontains=search_term)
#                     | Q(phone__icontains=search_term)
#                     | Q(section__icontains=search_term)
#                 )

#                 if class_search is not None:
#                     search_query = search_query | Q(class_room=class_search)

#                 query = query.filter(search_query)

#         teachers = await query.select_related("school")

#         required_categories = ["Developmental & Emotional", "Nutritional"]


#         teachers_list = []
#         for teacher in teachers:
#             # Calculate teacher answer status
#             teacher_answer_status = False
            
#             # Get all students in the teacher's class and section
#             students_in_class = await Students.filter(
#                 school_students__school=target_school_id,
#                 class_room=teacher.class_room,
#                 section=teacher.section,
#                 is_deleted=False
#             ).all()
            
#             total_students = len(students_in_class)
            
#             if total_students > 0:
#                 student_ids = [student.id for student in students_in_class]
                
#                 # Get all teacher answers for students in this class
#                 teacher_answers = await TeacherAnswers.filter(
#                     Q(teacher_id=teacher.id),
#                     Q(student_id__in=student_ids),
#                     Q(is_deleted=False)
#                 ).all()
                
#                 # Get unique question IDs from answers
#                 question_ids = list(set([answer.question_id for answer in teacher_answers if answer.question_id]))
                
#                 if question_ids:
#                     # Get questions to check their categories
#                     questions = await StudentsQuestionBank.filter(
#                         question_id__in=question_ids,
#                         is_deleted=False
#                     ).all()
                    
#                     # Create a mapping of question_id to question_type
#                     question_type_map = {q.question_id: q.question_type for q in questions}
                    
#                     # Check each student's completion status
#                     students_completed = 0
                    
#                     for student in students_in_class:
#                         # Get this student's answers from this teacher
#                         student_answers = [
#                             answer for answer in teacher_answers 
#                             if answer.student_id == student.id
#                         ]
                        
#                         # Get categories answered for this student
#                         student_categories = set()
#                         for answer in student_answers:
#                             if answer.question_id in question_type_map:
#                                 student_categories.add(question_type_map[answer.question_id])
                        
#                         # Check if student has answered at least one question from each required category
#                         if all(category in student_categories for category in required_categories):
#                             students_completed += 1
                    
#                     # Status is True if ALL students have answered at least one question from each category
#                     teacher_answer_status = (students_completed == total_students)

#             teachers_list.append(
#                 {
#                     "id": teacher.id,
#                     "first_name": teacher.first_name,
#                     "last_name": teacher.last_name,
#                     "middle_name": teacher.middle_name,
#                     "username": teacher.username,
#                     "phone": teacher.phone,
#                     "country_calling_code": teacher.country_calling_code,
#                     "email": teacher.email,
#                     "is_active": teacher.is_active,
#                     "profile_image": await get_new_url(teacher.profile_image) if teacher.profile_image else "",
#                     "class_room": teacher.class_room,
#                     "section": teacher.section,
#                     "user_role": teacher.user_role,
#                     "role_type": teacher.role_type,
#                     "location": teacher.location,
#                     "dob": str(teacher.dob) if teacher.dob else None,
#                     "gender": teacher.gender,
#                     "age": str(calculate_age_string(teacher.dob)) if teacher.dob else "N/A",
#                     "teacher_answer_status" : teacher_answer_status,
#                     "class_strength": total_students,
#                 }
#             )

#         resp = StandardResponse(
#             status=True,
#             message="Teachers retrieved successfully.",
#             data={"teachers_list": teachers_list},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

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


# ──────────────────────────────────────────────────────────────
#  FINAL /teachers-list ENDPOINT (100% working)
# ──────────────────────────────────────────────────────────────
@router.get("/teachers-list", response_model=StandardResponse)
async def teachers_list(
    search: Optional[str] = Query(None, description="Search by name, username, email, phone, section, class"),
    school_id: Optional[str] = Query(None, description="Required for Program Coordinator / Super Admin"),
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

        # Base teacher query
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

        for teacher in teachers:
            normalized_class = normalize_grade(teacher.class_room)

            # Get students in this teacher's class + section
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
                        answered_ids = await TeacherAnswers.filter(
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

        return StandardResponse(
            status=True,
            message="Teachers retrieved successfully.",
            data={"teachers_list": teachers_list}
        )

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

""""
from typing import Any, Dict, Optional, Tuple,List
from fastapi import APIRouter, Depends,Query, Request, UploadFile, File, Form,Body
from pydantic import ValidationError, BaseModel, Field
from tortoise.transactions import in_transaction
from tortoise.exceptions import IntegrityError
from passlib.context import CryptContext
from src.core.manager import get_current_user
from src.models.user_models import SchoolStaff, SchoolRoles
from src.models.school_models import Schools
from src.utils.response import StandardResponse
from src.schemas.user_schema import CreateTeacherSchema, UpdateTeacherSchema,TeacherResponse,TeacherListResponse,TeacherFilterRequest
from tortoise.expressions import Q

import os
import uuid
from datetime import datetime

router = APIRouter()

# Password hashing context
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
# Directory for storing teacher profile pictures
PROFILE_PICS_DIR = "uploads/teachers_profile_pics"
os.makedirs(PROFILE_PICS_DIR, exist_ok=True)





async def get_teacher_by_username(username: str) -> Optional[SchoolStaff]:
    return await SchoolStaff.filter(username=username).first()

async def get_user_school(current_user: dict) -> Optional[Schools]:
    school_id = current_user.get("school_id")
    if not school_id:
        return None
    return await Schools.filter(school_id=school_id).first()

async def save_profile_picture(file: UploadFile) -> str:
    try:
        # Generate a unique filename using UUID and timestamp
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_extension}"
        file_path = os.path.join(PROFILE_PICS_DIR, unique_filename)

        # Save the file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Return the relative path to store in the database
        return os.path.join("teachers_profile_pics", unique_filename)
    except Exception as e:
        raise Exception(f"Failed to save profile picture: {str(e)}")

def parse_dob(dob: Optional[str]) -> Optional[str]:
    if not dob:
        return None
    try:
        # First try parsing as YYYY-MM-DD
        parsed_date = datetime.strptime(dob, "%Y-%m-%d")
        return parsed_date.strftime("%Y-%m-%d")
    except ValueError:
        try:
            # If that fails, try parsing as DD-MM-YYYY
            parsed_date = datetime.strptime(dob, "%d-%m-%Y")
            return parsed_date.strftime("%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Invalid date format for dob: {dob}. Expected formats: YYYY-MM-DD (e.g., 2009-02-14) or DD-MM-YYYY (e.g., 14-02-2009)")

async def create_teacher(
    teacher_data: CreateTeacherSchema,
    school_id: int,
    profile_picture: Optional[UploadFile] = None
) -> Tuple[Optional[SchoolStaff], Optional[StandardResponse]]:
    try:
        # Hash the password
        hashed_password = pwd_context.hash(teacher_data.password)

        # Parse the dob field
        dob = parse_dob(teacher_data.dob)

        # Handle profile picture upload if provided
        profile_image_path = ""
        if profile_picture:
            profile_image_path = await save_profile_picture(profile_picture)

        teacher = SchoolStaff(
            first_name=teacher_data.first_name,
            last_name=teacher_data.last_name,
            middle_name=teacher_data.middle_name or "",
            username=teacher_data.username,
            phone=teacher_data.phone,
            email=teacher_data.email or "",
            password=hashed_password,
            dob=dob,
            gender=teacher_data.gender or "",
            address_line_1=teacher_data.address_line_1 or "",
            address_line_2=teacher_data.address_line_2 or "",
            landmark=teacher_data.landmark or "",
            street=teacher_data.street or "",
            state=teacher_data.state or "",
            pincode=teacher_data.pincode or "",
            country_calling_code=teacher_data.country_calling_code or "",
            country=teacher_data.country or "",
            class_room=teacher_data.class_room,
            section=teacher_data.section or "",
            user_role=SchoolRoles.TEACHER,
            role_type="SCHOOL_STAFF",
            school_id=school_id,
            is_active=True,
            is_verified=False,
            profile_image=profile_image_path if profile_picture else ""
        )
        await teacher.save()
        return teacher, None
    except IntegrityError:
        return None, StandardResponse(
            status=False,
            message="Teacher with this username or phone already exists.",
            errors={"username_or_phone": "Duplicate username or phone number."},
            status_code=400
        )

@router.post("/create-teacher", response_model=StandardResponse, status_code=201)
async def create_teacher_endpoint(
    first_name: str = Form(...),
    last_name: str = Form(...),
    middle_name: str = Form(default=""),
    username: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    dob: Optional[str] = Form(default=None),
    gender: str = Form(default=""),
    address_line_1: str = Form(default=""),
    address_line_2: str = Form(default=""),
    landmark: str = Form(default=""),
    street: str = Form(default=""),
    state: str = Form(default=""),
    pincode: str = Form(default=""),
    country: str = Form(default=""),
    country_calling_code: str = Form(default=""),
    class_room: int = Form(default=0),
    section: str = Form(default=""),
    profile_picture: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    async with in_transaction():
        try:
            # Verify the current user is a school admin
            if current_user.get("user_role") != SchoolRoles.SCHOOL_ADMIN:
                return StandardResponse(
                    status=False,
                    message="Not authorized.",
                    errors={"user_role": "User is not a school admin."},
                    status_code=403
                )

            # Fetch the school associated with the current user
            school = await get_user_school(current_user)
            if not school:
                return StandardResponse(
                    status=False,
                    message="No school associated with the current user.",
                    errors={"school": "User is not linked to any school."},
                    status_code=400
                )

            # Check if teacher exists
            teacher = await get_teacher_by_username(username)
            if teacher:
                return StandardResponse(
                    status=False,
                    message="Teacher with this username already exists.",
                    errors={"username": "This username is already taken."},
                    status_code=400
                )

            # Create teacher data object
            teacher_data = CreateTeacherSchema(
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_name,
                username=username,
                phone=phone,
                email=email,
                password=password,
                dob=dob,
                gender=gender,
                address_line_1=address_line_1,
                address_line_2=address_line_2,
                landmark=landmark,
                street=street,
                state=state,
                pincode=pincode,
                country=country,
                country_calling_code=country_calling_code,
                class_room=class_room,
                section=section
            )

            # Create teacher with profile picture
            teacher, error_response = await create_teacher(teacher_data, school.school_id, profile_picture)
            if error_response:
                return error_response
            if not teacher:
                return StandardResponse(
                    status=False,
                    message="Failed to create teacher.",
                    errors={"server": "Teacher creation returned no teacher object."},
                    status_code=500
                )

            # Prepare response
            response_data = {
                "id": teacher.id,
                "username": teacher.username,
                "first_name": teacher.first_name,
                "last_name": teacher.last_name,
                "email": teacher.email,
                "school_id": teacher.school_id,
                "class_room": teacher.class_room,
                "section": teacher.section,
                "profile_image": teacher.profile_image
            }

            return StandardResponse(
                status=True,
                message="Teacher created successfully.",
                data={"teacher": response_data},
                status_code=201
            )

        except ValidationError as ve:
            return StandardResponse(
                status=False,
                message="Validation error.",
                errors=ve.errors(),
                status_code=400
            )
        except IntegrityError as ie:
            return StandardResponse(
                status=False,
                message="Duplicate entry for unique field (e.g., username, phone).",
                errors={"database": str(ie)},
                status_code=400
            )
        except ValueError as ve:
            return StandardResponse(
                status=False,
                message="Invalid date format for dob.",
                errors={"dob": str(ve)},
                status_code=400
            )
        except Exception as e:
            return StandardResponse(
                status=False,
                message="An unexpected error occurred.",
                errors={"server": str(e)},
                status_code=500
            )

@router.put("/update-teacher/{teacher_id}", response_model=StandardResponse, status_code=200)
async def update_teacher(
    teacher_id: int,
    first_name: Optional[str] = Form(default=None),
    last_name: Optional[str] = Form(default=None),
    middle_name: Optional[str] = Form(default=None),
    username: Optional[str] = Form(default=None),
    phone: Optional[str] = Form(default=None),
    email: Optional[str] = Form(default=None),
    password: Optional[str] = Form(default=None),
    dob: Optional[str] = Form(default=None),
    gender: Optional[str] = Form(default=None),
    address_line_1: Optional[str] = Form(default=None),
    address_line_2: Optional[str] = Form(default=None),
    landmark: Optional[str] = Form(default=None),
    street: Optional[str] = Form(default=None),
    state: Optional[str] = Form(default=None),
    pincode: Optional[str] = Form(default=None),
    country: Optional[str] = Form(default=None),
    country_calling_code: Optional[str] = Form(default=None),
    class_room: Optional[int] = Form(default=None),
    section: Optional[str] = Form(default=None),
    is_active: Optional[bool] = Form(default=None),
    is_verified: Optional[bool] = Form(default=None),
    profile_picture: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    async with in_transaction():
        try:
            # Verify the current user is a school admin
            if current_user.get("user_role") != SchoolRoles.SCHOOL_ADMIN:
                return StandardResponse(
                    status=False,
                    message="Not authorized.",
                    errors={"user_role": "User is not a school admin."},
                    status_code=403
                )

            # Fetch the school associated with the current user
            school = await get_user_school(current_user)
            if not school:
                return StandardResponse(
                    status=False,
                    message="No school associated with the current user.",
                    errors={"school": "User is not linked to any school."},
                    status_code=400
                )

            # Fetch existing teacher
            teacher = await SchoolStaff.filter(id=teacher_id, user_role=SchoolRoles.TEACHER).first()
            if not teacher:
                return StandardResponse(
                    status=False,
                    message="Teacher not found.",
                    errors={"teacher_id": "Invalid teacher ID."},
                    status_code=404
                )

            # Verify teacher belongs to the admin's school
            if teacher.school_id != school.school_id:
                return StandardResponse(
                    status=False,
                    message="Not authorized to update this teacher.",
                    errors={"school_id": "Teacher does not belong to the user's school."},
                    status_code=403
                )

            # Create teacher data object from form data
            teacher_data = UpdateTeacherSchema(
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_name,
                username=username,
                phone=phone,
                email=email,
                password=password,
                dob=dob,
                gender=gender,
                address_line_1=address_line_1,
                address_line_2=address_line_2,
                landmark=landmark,
                street=street,
                state=state,
                pincode=pincode,
                country=country,
                country_calling_code=country_calling_code,
                class_room=class_room,
                section=section,
                is_active=is_active,
                is_verified=is_verified
            )

            # Parse the dob field
            if teacher_data.dob:
                teacher_data.dob = parse_dob(teacher_data.dob)

            # Update data
            update_data = teacher_data.dict(exclude_unset=True)

            # Check for unique constraints
            if "username" in update_data and update_data["username"] != teacher.username:
                existing_teacher = await SchoolStaff.filter(username=update_data["username"]).exclude(id=teacher_id).first()
                if existing_teacher:
                    return StandardResponse(
                        status=False,
                        message="Username already exists.",
                        errors={"username": "This username is already taken."},
                        status_code=400
                    )
            if "phone" in update_data and update_data["phone"] != teacher.phone:
                existing_teacher = await SchoolStaff.filter(phone=update_data["phone"]).exclude(id=teacher_id).first()
                if existing_teacher:
                    return StandardResponse(
                        status=False,
                        message="Phone number already exists.",
                        errors={"phone": "This phone number is already taken."},
                        status_code=400
                    )

            # Handle profile picture update if provided
            if profile_picture:
                # Delete old profile picture if it exists
                if teacher.profile_image and os.path.exists(os.path.join("static", teacher.profile_image)):
                    os.remove(os.path.join("static", teacher.profile_image))
                # Save new profile picture
                profile_image_path = await save_profile_picture(profile_picture)
                update_data["profile_image"] = profile_image_path

            # Update teacher fields
            for field, value in update_data.items():
                if field == "password" and value is not None:
                    value = pwd_context.hash(value)  # Hash password if provided
                if value is not None:
                    setattr(teacher, field, value)

            await teacher.save()

            # Prepare response with updated class_room and section
            response_data = {
                "id": teacher.id,
                "username": teacher.username,
                "first_name": teacher.first_name,
                "last_name": teacher.last_name,
                "email": teacher.email,
                "school_id": teacher.school_id,
                "class_room": teacher.class_room,
                "section": teacher.section,
                "profile_image": teacher.profile_image
            }

            return StandardResponse(
                status=True,
                message="Teacher updated successfully.",
                data={"teacher": response_data},
                status_code=200
            )

        except ValidationError as ve:
            return StandardResponse(
                status=False,
                message="Validation error.",
                errors=ve.errors(),
                status_code=400
            )
        except IntegrityError as ie:
            return StandardResponse(
                status=False,
                message="Duplicate entry for unique field (e.g., username, phone).",
                errors={"database": str(ie)},
                status_code=400
            )
        except ValueError as ve:
            return StandardResponse(
                status=False,
                message="Invalid date format for dob.",
                errors={"dob": str(ve)},
                status_code=400
            )
        except Exception as e:
            return StandardResponse(
                status=False,
                message="An unexpected error occurred.",
                errors={"server": str(e)},
                status_code=500
            )
            

"""
