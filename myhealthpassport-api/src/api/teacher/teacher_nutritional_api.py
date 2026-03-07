from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from typing import Any
from datetime import datetime
from tortoise.transactions import in_transaction
from tortoise.exceptions import OperationalError
from pydantic import ValidationError
from src.models.school_models import Schools
from src.models.student_models import ParentChildren, Students, SchoolStudents
from src.models.user_models import ConsultantTeam, Parents, SchoolStaff, ScreeningTeam, ScreeningTeamRoles, AnalystTeam, AnalystRoles
from src.models.questionnaire_models import StudentsQuestionBank, ParentAnswers, TeacherAnswers
from src.schemas.screening_schema import QuestionResponse, QuestionListResponse, AnswerRequest, AnswerBatchRequest, AnswerResponse, AnswerListResponse
from src.core.manager import get_current_user
from src.utils.response import StandardResponse
from .nutritional_questions_teachers import NUTRITIONAL_QUESTIONS as TEACHER_NUTRITIONAL
from .emotional_developmental_questions_teachers import EMOTIONAL_DEVELOPMENTAL_QUESTIONS as TEACHER_EMOTIONAL
from . import router
from tortoise.expressions import Q


# ──────────────────────────────────────────────────────────────
#  QUESTION ID RANGES (Updated to Lakhs)
# ──────────────────────────────────────────────────────────────
class ParentQuestionID:
    NUTRITIONAL_HARDCODED_START = 1000000   # 10 lakhs (10,00,000) - Parent Nutritional
    EMOTIONAL_HARDCODED_START   = 2100000   # 21 lakhs (21,00,000) - Parent Emotional

class TeacherQuestionID:
    NUTRITIONAL_HARDCODED_START = 3100000   # 31 lakhs (31,00,000) - Teacher Nutritional
    EMOTIONAL_HARDCODED_START   = 4100000   # 41 lakhs (41,00,000) - Teacher Emotional

  
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
        student_grade_num = (normalize_grade(student_grade))
        return str(student_grade_num) in [normalize_grade(g) for g in grade_level]
    except (ValueError, AttributeError):
        return False

async def get_current_teacher(user: Any = Depends(get_current_user)):
    if user is None:
        response_obj = StandardResponse(
            status=False,
            message="No user provided",
            errors={"detail": "User is None"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_401_UNAUTHORIZED)

    if not isinstance(user, dict) or "user_id" not in user or "user_role" not in user:
        response_obj = StandardResponse(
            status=False,
            message="Invalid user data format",
            errors={"detail": f"Expected user_id and user_role, got {user}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    if user["user_role"].strip().upper() != "TEACHER":
        response_obj = StandardResponse(
            status=False,
            message="Only teachers can access this endpoint",
            errors={"detail": f"Invalid user_role: {user['user_role']}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    teacher = await SchoolStaff.get_or_none(id=user["user_id"])
    if not teacher:
        response_obj = StandardResponse(
            status=False,
            message="Teacher not found",
            errors={"detail": f"No teacher found for user_id: {user['user_id']}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    return teacher


async def get_current_authorized_user(user: Any = Depends(get_current_user)):
    if user is None:
        response_obj = StandardResponse(
            status=False,
            message="No user provided",
            errors={"detail": "User is None"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_401_UNAUTHORIZED)

    if not isinstance(user, dict) or "user_id" not in user or "user_role" not in user:
        response_obj = StandardResponse(
            status=False,
            message="Invalid user data format",
            errors={"detail": f"Expected user_id and user_role, got {user}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    user_role = user["user_role"].strip().upper()
    
    # Define allowed roles: TEACHER and all roles from ScreeningTeamRoles and AnalystRoles
    allowed_roles = ["TEACHER"] + [role.value for role in ScreeningTeamRoles] + [role.value for role in AnalystRoles]
    
    if user_role not in allowed_roles:
        response_obj = StandardResponse(
            status=False,
            message="User role not authorized for this endpoint",
            errors={"detail": f"Invalid user_role: {user_role}. Allowed roles: {allowed_roles}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    if user_role == "TEACHER":
        teacher = await SchoolStaff.get_or_none(id=user["user_id"])
        if not teacher:
            response_obj = StandardResponse(
                status=False,
                message="Teacher not found",
                errors={"detail": f"No teacher found for user_id: {user['user_id']}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return teacher

    elif user_role in [role.value for role in ScreeningTeamRoles]:
        screening_team = await ScreeningTeam.get_or_none(id=user["user_id"], user_role__iexact=user_role)
        if not screening_team:
            # Check AnalystTeam for overlapping roles (e.g., PSYCHOLOGIST, NUTRITIONIST)
            analyst_team = await AnalystTeam.get_or_none(id=user["user_id"], user_role__iexact=user_role)
            if analyst_team:
                return analyst_team
            existing_roles = await ScreeningTeam.filter(id=user["user_id"]).values_list("user_role", flat=True)
            response_obj = StandardResponse(
                status=False,
                message="Screening team member not found",
                errors={"detail": f"No screening team member found for user_id: {user['user_id']} with user_role: {user_role}. Existing roles: {existing_roles or 'None'}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return screening_team

    elif user_role in [role.value for role in AnalystRoles]:
        analyst_team = await AnalystTeam.get_or_none(id=user["user_id"], user_role__iexact=user_role)
        if not analyst_team:
            existing_roles = await AnalystTeam.filter(id=user["user_id"]).values_list("user_role", flat=True)
            response_obj = StandardResponse(
                status=False,
                message="Analyst team member not found",
                errors={"detail": f"No analyst team member found for user_id: {user['user_id']} with user_role: {user_role}. Existing roles: {existing_roles or 'None'}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return analyst_team

    response_obj = StandardResponse(
        status=False,
        message="User not found",
        errors={"detail": "User not found"}
    )
    return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

  
# @router.get("/teacher-answers-status", response_model=StandardResponse)
# async def get_teacher_answers_dashboard(current_user: dict = Depends(get_current_user)):
#     try:
#         # Validate current_user structure
#         if not isinstance(current_user, dict) or "user_id" not in current_user or "role_type" not in current_user or "user_role" not in current_user:
#             raise ValueError("Invalid user data from authentication")

#         # Extract user details
#         user_id = current_user["user_id"]
#         role_type = current_user["role_type"].upper()
#         user_role = current_user["user_role"]

#         # Validate role_type (assuming teacher role is expected)
#         if user_role != "TEACHER":
#             return JSONResponse(content=StandardResponse(
#                 status=False,
#                 message=f"Invalid role type: {role_type} or not authorized for teacher answers dashboard",
#                 data={},
#                 errors={}
#             ).__dict__, status_code=status.HTTP_403_FORBIDDEN)

#         # Fetch teacher using primary key
#         teacher = await SchoolStaff.get_or_none(pk=user_id)
#         if not teacher:
#             return JSONResponse(content=StandardResponse(
#                 status=False,
#                 message=f"Teacher with ID {user_id} not found.",
#                 data={},
#                 errors={}
#             ).__dict__, status_code=status.HTTP_404_NOT_FOUND)

#         # Get school from teacher's profile
#         school_id = teacher.school_id
#         school = await Schools.get_or_none(school_id=school_id)
#         if not school:
#             return JSONResponse(content=StandardResponse(
#                 status=False,
#                 message=f"No school assigned to teacher with ID {user_id}.",
#                 data={},
#                 errors={}
#             ).__dict__, status_code=status.HTTP_404_NOT_FOUND)

#         # Get all students in the teacher's class and section
#         all_students = await Students.filter(
#             school_students__school=school_id,
#             class_room=teacher.class_room,
#             section=teacher.section
#         ).all()
#         total_students = len(all_students)

#         # Check if students exist
#         if total_students == 0:
#             school_data = {
#                 "school_id": str(school_id),
#                 "school_name": school.school_name if hasattr(school, 'school_name') else "",
#                 "completed": "0",
#                 "answered_students": "0",
#                 "total_students": str(total_students),
#                 "class": teacher.class_room if teacher.class_room else "",
#                 "section": teacher.section if teacher.section else ""
#             }
#             return JSONResponse(content=StandardResponse(
#                 status=True,
#                 message="No students found for the teacher's class and section",
#                 data=school_data,
#                 errors={}
#             ).__dict__, status_code=status.HTTP_200_OK)

#         # Get answers for "EMOTIONAL_DEVELOPMENTAL" and "Nutritional" questions directly from TeacherAnswers
#         answers = await TeacherAnswers.filter(
#             Q(teacher_id=user_id),
#             Q(student__school_students__school=school_id),
#             Q(student__class_room=teacher.class_room),
#             Q(student__section=teacher.section),
#             Q(is_deleted=False)
#         ).all()

#         # Extract unique student IDs
#         answered_student_ids = {answer.student_id for answer in answers}
#         total_answers_submitted = len(answered_student_ids)

#         # Debug: Check specific answers for student_id=769
#         debug_answers = await TeacherAnswers.filter(
#             student_id=769,
#             question_id__in=[18, 19],
#             is_deleted=False
#         ).values("teacher_answer_id", "student_id", "question_id", "teacher_id", "is_deleted")

#         # If no answers found, include debug info
#         if total_answers_submitted == 0:
#             school_data = {
#                 "school_id": str(school_id),
#                 "school_name": school.school_name if hasattr(school, 'school_name') else "",
#                 "completed": "0",
#                 "answered_students": "0",
#                 "total_students": str(total_students),
#                 "class": teacher.class_room if teacher.class_room else "",
#                 "section": teacher.section if teacher.section else ""
#             }
#             error_message = {
#                 "debug_answers": debug_answers
#             }
#             return JSONResponse(content=StandardResponse(
#                 status=True,
#                 message="No answers found for the specified criteria",
#                 data=school_data,
#                 errors={"detail": error_message}
#             ).__dict__, status_code=status.HTTP_200_OK)

#         # Calculate completion percentage
#         completion_percentage = (total_answers_submitted / total_students * 100) if total_students > 0 else 0
#         if completion_percentage > 100:
#             completion_percentage = 100  # Cap percentage at 100

#         school_data = {
#             "school_id": str(school_id),
#             "school_name": school.school_name if hasattr(school, 'school_name') else "",
#             "completed": f"{int(completion_percentage)}",
#             "answered_students": str(total_answers_submitted),
#             "total_students": str(total_students),
#             "class": teacher.class_room if teacher.class_room else "",
#             "section": teacher.section if teacher.section else ""
#         }
#         return JSONResponse(content=StandardResponse(
#             status=True,
#             message="Teacher answers dashboard data fetched successfully",
#             data=school_data,
#             errors={}
#         ).__dict__, status_code=status.HTTP_200_OK)

#     except KeyError as e:
#         return JSONResponse(content=StandardResponse(
#             status=False,
#             message="Failed to fetch teacher answers dashboard",
#             data={},
#             errors={"detail": f"Missing key in current_user: {str(e)}"}
#         ).__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
#     except Exception as e:
#         return JSONResponse(content=StandardResponse(
#             status=False,
#             message="Failed to fetch teacher answers dashboard",
#             data={},
#             errors={"detail": str(e)}
#         ).__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


async def get_valid_nutritional_questions(class_room: str):
    """Fetch valid nutritional questions from both StudentsQuestionBank and TEACHER_NUTRITIONAL."""
    normalized_grade = normalize_grade(class_room)
    valid_questions = {}
    seen_question_texts = set()

    # Fetch questions from StudentsQuestionBank
    db_questions = await StudentsQuestionBank.filter(
        question_type="NUTRITIONAL",
        applicable_to_teacher=True,
        is_deleted=False
    ).all()

    # Add database questions
    for db_question in db_questions:
        question_grades = [g.strip() for g in db_question.grade_level.split(",") if g.strip()]
        normalized_question_grades = [normalize_grade(g) for g in question_grades]
        if is_grade_in_range(class_room, normalized_question_grades):
            valid_questions[db_question.question_id] = {
                "question_id": db_question.question_id,
                "question_text": db_question.question_text,
                "question_type": db_question.question_type,
                "sub_domain": db_question.sub_domain,
                "score_type": db_question.score_type,
                "grade_level": normalized_question_grades,
                "applicable_to_teacher": db_question.applicable_to_teacher
            }
            seen_question_texts.add(db_question.question_text.lower().strip())

    # Add TEACHER_NUTRITIONAL questions with offset IDs
    max_db_id = max([q.question_id for q in db_questions], default=-1)
    max_emotional_id = len(TEACHER_EMOTIONAL) - 1  # e.g., 17 for 18 questions
    base_nutritional_id = max(max_db_id, max_emotional_id) + 1  # Start after max of DB and emotional IDs
    
    for idx, q in enumerate(TEACHER_NUTRITIONAL):
        if is_grade_in_range(class_room, q["grade_level"]) and q.get("applicable_to_teacher", False):
            question_text_normalized = q["question_text"].lower().strip()
            if question_text_normalized not in seen_question_texts:
                question_id = base_nutritional_id + idx  # e.g., 18, 19, ..., 31
                valid_questions[question_id] = {
                    "question_id": question_id,
                    "question_text": q["question_text"],
                    "question_type": "NUTRITIONAL",
                    "sub_domain": q.get("sub_domain", ""),
                    "score_type": q["score_type"],
                    "grade_level": q["grade_level"],
                    "applicable_to_teacher": q.get("applicable_to_teacher", False)
                }
                seen_question_texts.add(question_text_normalized)

    return valid_questions

# @router.get("/teacher-nutritional-questions/{student_id}", response_model=StandardResponse)
# async def get_nutritional_questions(
#     student_id: int,
#     current_user: Any = Depends(get_current_authorized_user)
# ):
#     if isinstance(current_user, JSONResponse):
#         return current_user

#     try:
#         student = await Students.get_or_none(id=student_id)
#         if not student:
#             return JSONResponse(content=StandardResponse(status=False, message="Student not found").__dict__, status_code=404)

#         if isinstance(current_user, SchoolStaff):
#             if not await SchoolStudents.filter(student_id=student_id, school_id=current_user.school_id, status=True).exists():
#                 return JSONResponse(content=StandardResponse(status=False, message="Unauthorized access").__dict__, status_code=403)

#         class_room = normalize_grade(student.class_room)
#         questions = []
#         seen_texts = set()

#         # 1. Database Questions (IDs: 1–999,999)
#         db_questions = await StudentsQuestionBank.filter(
#             question_type="NUTRITIONAL",
#             applicable_to_teacher=True,
#             is_deleted=False
#         ).all()

#         for dbq in db_questions:
#             grades = [g.strip() for g in dbq.grade_level.split(",") if g.strip()]
#             if is_grade_in_range(class_room, [normalize_grade(g) for g in grades]):
#                 questions.append(QuestionResponse(
#                     question_id=dbq.question_id,
#                     question_text=dbq.question_text,
#                     question_type="NUTRITIONAL",
#                     sub_domain=dbq.sub_domain,
#                     options=["Yes", "No"],
#                     score_type=dbq.score_type,
#                     answer=None
#                 ))
#                 seen_texts.add(dbq.question_text.lower().strip())

#         # 2. Hardcoded Questions → IDs 31,00,000+ (31 lakhs)
#         for idx, q in enumerate(TEACHER_NUTRITIONAL):
#             if (is_grade_in_range(class_room, q["grade_level"]) and q.get("applicable_to_teacher", False)):
#                 txt = q["question_text"].lower().strip()
#                 if txt not in seen_texts:
#                     question_id = TeacherQuestionID.NUTRITIONAL_HARDCODED_START + idx  # 3100000+
#                     questions.append(QuestionResponse(
#                         question_id=question_id,
#                         question_text=q["question_text"],
#                         question_type="NUTRITIONAL",
#                         sub_domain=q.get("sub_domain", ""),
#                         options=["Yes", "No"],
#                         score_type=q["score_type"],
#                         answer=None
#                     ))
#                     seen_texts.add(txt)

#         if not questions:
#             return JSONResponse(content=StandardResponse(status=False, message=f"No nutritional questions for class {class_room}").__dict__, status_code=400)

#         # Load existing answers
#         existing = await TeacherAnswers.filter(
#             student_id=student_id,
#             question_id__in=[q.question_id for q in questions],
#             is_deleted=False
#         ).order_by('-updated_at').values("question_id", "answer", "notes")

#         answer_map = {a["question_id"]: a["answer"] for a in existing}
#         notes = next((a["notes"].replace("NUTRITIONAL:", "").strip() for a in existing if a["notes"] and a["notes"].startswith("NUTRITIONAL:")), None)

#         for q in questions:
#             ans = answer_map.get(q.question_id)
#             q.answer = int(ans) if ans and ans.isdigit() else ans

#         health_score_count = sum(q.answer for q in questions if isinstance(q.answer, int))

#         student_info = {
#             "id": student.id,
#             "first_name": student.first_name or "",
#             "last_name": student.last_name or "",
#             "class_room": student.class_room or ""
#         }

#         return JSONResponse(content=StandardResponse(
#             status=True,
#             message="Nutritional questions loaded successfully",
#             data=QuestionListResponse(
#                 questions=questions,
#                 student=student_info,
#                 notes=notes,
#                 health_score_count=health_score_count
#             ).dict()
#         ).__dict__, status_code=200)

#     except Exception as e:
#         return JSONResponse(content=StandardResponse(status=False, message=str(e), errors={"detail": str(e)}).__dict__, status_code=500)

@router.post("/submit-teacher-nutritional-answers")
async def submit_nutritional_answers(
    batch: AnswerBatchRequest,
    current_teacher: Any = Depends(get_current_teacher)
):
    if isinstance(current_teacher, JSONResponse):
        return current_teacher

    try:
        student_ids = {a.student_id for a in batch.answers}
        if len(student_ids) != 1:
            return JSONResponse(content=StandardResponse(status=False, message="Multiple students").__dict__, status_code=400)

        student_id = student_ids.pop()
        student = await Students.get_or_none(id=student_id)
        if not student:
            return JSONResponse(content=StandardResponse(status=False, message="Student not found").__dict__, status_code=404)

        if not await SchoolStudents.filter(student_id=student_id, school_id=current_teacher.school_id, status=True).exists():
            return JSONResponse(content=StandardResponse(status=False, message="Unauthorized").__dict__, status_code=403)

        class_room = normalize_grade(student.class_room)
        valid_questions = {}
        seen_texts = set()

        # DB Questions
        db_qs = await StudentsQuestionBank.filter(
            question_type="NUTRITIONAL",
            applicable_to_teacher=True,
            is_deleted=False
        ).all()

        for dbq in db_qs:
            db_grades = [g.strip() for g in dbq.grade_level.split(",") if g.strip()]
            if is_grade_in_range(class_room, [normalize_grade(g) for g in db_grades]):
                valid_questions[dbq.question_id] = {"text": dbq.question_text, "score_type": dbq.score_type}
                seen_texts.add(dbq.question_text.lower().strip())

        # Hardcoded Questions – IDs 3100000+ (31 lakhs)
        for idx, q in enumerate(TEACHER_NUTRITIONAL):
            q_grades = [normalize_grade(g) for g in q["grade_level"]]
            if (is_grade_in_range(class_room, q_grades) and q.get("applicable_to_teacher", False)):
                txt = q["question_text"].lower().strip()
                if txt not in seen_texts:
                    qid = TeacherQuestionID.NUTRITIONAL_HARDCODED_START + idx  # 3100000+
                    valid_questions[qid] = {"text": q["question_text"], "score_type": q["score_type"]}
                    seen_texts.add(txt)

        invalid = [a.question_id for a in batch.answers if a.question_id not in valid_questions]
        if invalid:
            return JSONResponse(content=StandardResponse(
                status=False,
                message="Invalid question IDs",
                errors={"invalid_ids": invalid, "valid_sample": list(valid_questions.keys())[:10]}
            ).__dict__, status_code=400)

        prefixed_notes = f"NUTRITIONAL: {batch.notes or ''}".strip()
        saved = []
        
        async with in_transaction():
            for a in batch.answers:
                q = valid_questions[a.question_id]
                ans = a.answer.strip().title()

                existing = await TeacherAnswers.filter(student_id=student_id, question_id=a.question_id, is_deleted=False).first()
                if existing:
                    existing.answer = ans
                    existing.notes = prefixed_notes
                    existing.status = True
                    existing.updated_at = datetime.utcnow()
                    existing.updated_by = current_teacher.id
                    existing.updated_user_role = current_teacher.user_role
                    existing.updated_role_type = current_teacher.role_type
                    await existing.save()
                    db_ans = existing
                else:
                    db_ans = await TeacherAnswers.create(
                        question_id=a.question_id, student=student, teacher=current_teacher,
                        answer=ans, notes=prefixed_notes, score_type=q["score_type"], status=True,
                        created_by=current_teacher.id, created_user_role=current_teacher.user_role,
                        created_role_type=current_teacher.role_type,
                        updated_by=current_teacher.id, updated_user_role=current_teacher.user_role,
                        updated_role_type=current_teacher.role_type
                    )

                saved.append(AnswerResponse(
                    student_id=student_id, question_id=a.question_id, question_text=q["text"],
                    answer=ans, score_type=q["score_type"],
                    created_at=db_ans.created_at.isoformat() + "Z",
                    updated_at=db_ans.updated_at.isoformat() + "Z"
                ))

        return JSONResponse(content=StandardResponse(
            status=True, message="Saved successfully",
            data=AnswerListResponse(answers=saved, notes=batch.notes or "").dict()
        ).__dict__, status_code=200)

    except Exception as e:
        return JSONResponse(content=StandardResponse(status=False, message=str(e)).__dict__, status_code=500)

# Add these imports at the top
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ===================================================================
# MODIFIED: GET TEACHER ANSWERS DASHBOARD (with Academic Year Filter)
# ===================================================================
@router.get("/teacher-answers-status", response_model=StandardResponse)
async def get_teacher_answers_dashboard(
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Validate current_user structure
        if not isinstance(current_user, dict) or "user_id" not in current_user or "role_type" not in current_user or "user_role" not in current_user:
            raise ValueError("Invalid user data from authentication")

        # Extract user details
        user_id = current_user["user_id"]
        role_type = current_user["role_type"].upper()
        user_role = current_user["user_role"]

        # Validate role_type (assuming teacher role is expected)
        if user_role != "TEACHER":
            return JSONResponse(content=StandardResponse(
                status=False,
                message=f"Invalid role type: {role_type} or not authorized for teacher answers dashboard",
                data={},
                errors={}
            ).__dict__, status_code=status.HTTP_403_FORBIDDEN)

        # Fetch teacher using primary key
        teacher = await SchoolStaff.get_or_none(pk=user_id)
        if not teacher:
            return JSONResponse(content=StandardResponse(
                status=False,
                message=f"Teacher with ID {user_id} not found.",
                data={},
                errors={}
            ).__dict__, status_code=status.HTTP_404_NOT_FOUND)

        # Get school from teacher's profile
        school_id = teacher.school_id
        school = await Schools.get_or_none(school_id=school_id)
        if not school:
            return JSONResponse(content=StandardResponse(
                status=False,
                message=f"No school assigned to teacher with ID {user_id}.",
                data={},
                errors={}
            ).__dict__, status_code=status.HTTP_404_NOT_FOUND)

        # Determine academic year
        if academic_year is None:
            academic_year = get_current_academic_year()

        try:
            ay_start, ay_end = parse_academic_year(academic_year)
        except ValueError as e:
            return JSONResponse(content=StandardResponse(
                status=False,
                message=str(e),
                data={},
                errors={"academic_year": str(e)}
            ).__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Build academic year filter
        year_filter = build_academic_year_filter(academic_year)

        # Get all students in the teacher's class and section
        all_students = await Students.filter(
            school_students__school=school_id,
            class_room=teacher.class_room,
            section=teacher.section
        ).all()
        total_students = len(all_students)

        # Check if students exist
        if total_students == 0:
            school_data = {
                "school_id": str(school_id),
                "school_name": school.school_name if hasattr(school, 'school_name') else "",
                "completed": "0",
                "answered_students": "0",
                "total_students": str(total_students),
                "class": teacher.class_room if teacher.class_room else "",
                "section": teacher.section if teacher.section else ""
            }
            json_response = JSONResponse(content=StandardResponse(
                status=True,
                message="No students found for the teacher's class and section",
                data=school_data,
                errors={}
            ).__dict__, status_code=status.HTTP_200_OK)
            json_response.headers["X-Academic-Year"] = academic_year
            return json_response

        # Get answers with academic year filter
        answers = await TeacherAnswers.filter(
            year_filter,
            Q(teacher_id=user_id),
            Q(student__school_students__school=school_id),
            Q(student__class_room=teacher.class_room),
            Q(student__section=teacher.section),
            Q(is_deleted=False)
        ).all()

        # Extract unique student IDs
        answered_student_ids = {answer.student_id for answer in answers}
        total_answers_submitted = len(answered_student_ids)

        # Debug: Check specific answers for student_id=769 (with year filter)
        debug_answers = await TeacherAnswers.filter(
            year_filter,
            student_id=769,
            question_id__in=[18, 19],
            is_deleted=False
        ).values("teacher_answer_id", "student_id", "question_id", "teacher_id", "is_deleted")

        # If no answers found, include debug info
        if total_answers_submitted == 0:
            school_data = {
                "school_id": str(school_id),
                "school_name": school.school_name if hasattr(school, 'school_name') else "",
                "completed": "0",
                "answered_students": "0",
                "total_students": str(total_students),
                "class": teacher.class_room if teacher.class_room else "",
                "section": teacher.section if teacher.section else ""
            }
            error_message = {
                "debug_answers": debug_answers
            }
            json_response = JSONResponse(content=StandardResponse(
                status=True,
                message="No answers found for the specified criteria",
                data=school_data,
                errors={"detail": error_message}
            ).__dict__, status_code=status.HTTP_200_OK)
            json_response.headers["X-Academic-Year"] = academic_year
            return json_response

        # Calculate completion percentage
        completion_percentage = (total_answers_submitted / total_students * 100) if total_students > 0 else 0
        if completion_percentage > 100:
            completion_percentage = 100  # Cap percentage at 100

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        school_data = {
            "school_id": str(school_id),
            "school_name": school.school_name if hasattr(school, 'school_name') else "",
            "completed": f"{int(completion_percentage)}",
            "answered_students": str(total_answers_submitted),
            "total_students": str(total_students),
            "class": teacher.class_room if teacher.class_room else "",
            "section": teacher.section if teacher.section else ""
        }
        
        json_response = JSONResponse(content=StandardResponse(
            status=True,
            message="Teacher answers dashboard data fetched successfully",
            data=school_data,
            errors={}
        ).__dict__, status_code=status.HTTP_200_OK)
        json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return json_response

    except KeyError as e:
        return JSONResponse(content=StandardResponse(
            status=False,
            message="Failed to fetch teacher answers dashboard",
            data={},
            errors={"detail": f"Missing key in current_user: {str(e)}"}
        ).__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return JSONResponse(content=StandardResponse(
            status=False,
            message="Failed to fetch teacher answers dashboard",
            data={},
            errors={"detail": str(e)}
        ).__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ===================================================================
# MODIFIED: GET NUTRITIONAL QUESTIONS (with Academic Year Filter)
# ===================================================================
@router.get("/teacher-nutritional-questions/{student_id}", response_model=StandardResponse)
async def get_nutritional_questions(
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user: Any = Depends(get_current_authorized_user)
):
    if isinstance(current_user, JSONResponse):
        return current_user

    try:
        student = await Students.get_or_none(id=student_id)
        if not student:
            return JSONResponse(content=StandardResponse(status=False, message="Student not found").__dict__, status_code=404)

        # Authorization check WITHOUT academic year filter
        if isinstance(current_user, SchoolStaff):
            if not await SchoolStudents.filter(student_id=student_id, school_id=current_user.school_id, status=True).exists():
                return JSONResponse(content=StandardResponse(status=False, message="Unauthorized access").__dict__, status_code=403)

        # Determine academic year (AFTER authorization)
        if academic_year is None:
            academic_year = get_current_academic_year()

        try:
            ay_start, ay_end = parse_academic_year(academic_year)
        except ValueError as e:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message=str(e),
                    errors={"academic_year": str(e)}
                ).__dict__,
                status_code=400
            )

        # Build academic year filter
        year_filter = build_academic_year_filter(academic_year)

        class_room = normalize_grade(student.class_room)
        questions = []
        seen_texts = set()

        # 1. Database Questions (IDs: 1–999,999)
        db_questions = await StudentsQuestionBank.filter(
            question_type="NUTRITIONAL",
            applicable_to_teacher=True,
            is_deleted=False
        ).all()

        for dbq in db_questions:
            grades = [g.strip() for g in dbq.grade_level.split(",") if g.strip()]
            if is_grade_in_range(class_room, [normalize_grade(g) for g in grades]):
                questions.append(QuestionResponse(
                    question_id=dbq.question_id,
                    question_text=dbq.question_text,
                    question_type="NUTRITIONAL",
                    sub_domain=dbq.sub_domain,
                    options=["Yes", "No"],
                    score_type=dbq.score_type,
                    answer=None
                ))
                seen_texts.add(dbq.question_text.lower().strip())

        # 2. Hardcoded Questions → IDs 31,00,000+ (31 lakhs)
        for idx, q in enumerate(TEACHER_NUTRITIONAL):
            if (is_grade_in_range(class_room, q["grade_level"]) and q.get("applicable_to_teacher", False)):
                txt = q["question_text"].lower().strip()
                if txt not in seen_texts:
                    question_id = TeacherQuestionID.NUTRITIONAL_HARDCODED_START + idx  # 3100000+
                    questions.append(QuestionResponse(
                        question_id=question_id,
                        question_text=q["question_text"],
                        question_type="NUTRITIONAL",
                        sub_domain=q.get("sub_domain", ""),
                        options=["Yes", "No"],
                        score_type=q["score_type"],
                        answer=None
                    ))
                    seen_texts.add(txt)

        if not questions:
            return JSONResponse(content=StandardResponse(status=False, message=f"No nutritional questions for class {class_room}").__dict__, status_code=400)

        # Load existing answers with academic year filter
        existing = await TeacherAnswers.filter(
            year_filter,
            student_id=student_id,
            question_id__in=[q.question_id for q in questions],
            is_deleted=False
        ).order_by('-updated_at').values("question_id", "answer", "notes")

        answer_map = {a["question_id"]: a["answer"] for a in existing}
        notes = next((a["notes"].replace("NUTRITIONAL:", "").strip() for a in existing if a["notes"] and a["notes"].startswith("NUTRITIONAL:")), None)

        for q in questions:
            ans = answer_map.get(q.question_id)
            q.answer = int(ans) if ans and ans.isdigit() else ans

        health_score_count = sum(q.answer for q in questions if isinstance(q.answer, int))

        student_info = {
            "id": student.id,
            "first_name": student.first_name or "",
            "last_name": student.last_name or "",
            "class_room": student.class_room or ""
        }

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        response = StandardResponse(
            status=True,
            message="Nutritional questions loaded successfully",
            data=QuestionListResponse(
                questions=questions,
                student=student_info,
                notes=notes,
                health_score_count=health_score_count
            ).dict()
        )
        
        json_response = JSONResponse(content=response.__dict__, status_code=200)
        json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return json_response

    except Exception as e:
        return JSONResponse(content=StandardResponse(status=False, message=str(e), errors={"detail": str(e)}).__dict__, status_code=500)
