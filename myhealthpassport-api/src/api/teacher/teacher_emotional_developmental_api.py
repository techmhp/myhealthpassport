from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from typing import Any
from datetime import datetime
from tortoise.transactions import in_transaction
from tortoise.exceptions import OperationalError
from pydantic import ValidationError
from src.models.student_models import ParentChildren, Students, SchoolStudents
from src.models.user_models import ConsultantTeam, Parents, SchoolStaff, ScreeningTeam, ScreeningTeamRoles, AnalystTeam, AnalystRoles
from src.models.questionnaire_models import StudentsQuestionBank, ParentAnswers, TeacherAnswers
from src.schemas.screening_schema import QuestionResponse, QuestionListResponse, AnswerRequest, AnswerBatchRequest, AnswerResponse, AnswerListResponse
from src.core.manager import get_current_user
from src.utils.response import StandardResponse
from .nutritional_questions_teachers import NUTRITIONAL_QUESTIONS as TEACHER_NUTRITIONAL
from .emotional_developmental_questions_teachers import EMOTIONAL_DEVELOPMENTAL_QUESTIONS as TEACHER_EMOTIONAL
from . import router

# ──────────────────────────────────────────────────────────────
#  TEACHER QUESTION ID RANGES (Global & Fixed)
# ──────────────────────────────────────────────────────────────
# class TeacherQuestionID:
#     EMOTIONAL_HARDCODED_START   = 100000   # Emotional & Developmental
#     NUTRITIONAL_HARDCODED_START = 200000   # Nutritional
    
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

# @router.get("/teacher-emotional-questions/{student_id}", response_model=StandardResponse)
# async def get_emotional_questions(
#     student_id: int,
#     current_user: Any = Depends(get_current_authorized_user)
# ):
#     if isinstance(current_user, JSONResponse):
#         return current_user

#     try:
#         student = await Students.get_or_none(id=student_id, is_deleted=False)
#         if not student:
#             return JSONResponse(content=StandardResponse(status=False, message="Student not found").__dict__, status_code=404)

#         # Authorization
#         if isinstance(current_user, SchoolStaff):
#             if not await SchoolStudents.filter(student_id=student_id, school_id=current_user.school_id, status=True).exists():
#                 return JSONResponse(content=StandardResponse(status=False, message="Unauthorized").__dict__, status_code=403)

#         class_room = normalize_grade(student.class_room)
#         questions = []
#         seen_texts = set()

#         # 1. Database Questions (IDs: 1–999,999)
#         db_qs = await StudentsQuestionBank.filter(
#             question_type="EMOTIONAL_DEVELOPMENTAL",
#             applicable_to_teacher=True,
#             is_deleted=False
#         ).all()

#         for dbq in db_qs:
#             grades = [g.strip() for g in dbq.grade_level.split(",") if g.strip()]
#             if is_grade_in_range(class_room, [normalize_grade(g) for g in grades]):
#                 questions.append(QuestionResponse(
#                     question_id=dbq.question_id,
#                     question_text=dbq.question_text,
#                     question_type="EMOTIONAL_DEVELOPMENTAL",
#                     sub_domain=dbq.sub_domain or "",
#                     options=["1", "2", "3"],
#                     score_type=dbq.score_type,
#                     answer=None
#                 ))
#                 seen_texts.add(dbq.question_text.lower().strip())

#         # 2. Hardcoded Questions → IDs 41,00,000+ (41 lakhs)
#         for idx, q in enumerate(TEACHER_EMOTIONAL):
#             q_grades = [normalize_grade(g) for g in q["grade_level"]]
#             if (is_grade_in_range(class_room, q_grades) and q.get("applicable_to_teacher", False)):
#                 txt = q["question_text"].lower().strip()
#                 if txt not in seen_texts:
#                     qid = TeacherQuestionID.EMOTIONAL_HARDCODED_START + idx  # 4100000+
#                     questions.append(QuestionResponse(
#                         question_id=qid,
#                         question_text=q["question_text"],
#                         question_type="EMOTIONAL_DEVELOPMENTAL",
#                         sub_domain=q.get("sub_domain", ""),
#                         options=["1", "2", "3"],
#                         score_type=q["score_type"],
#                         answer=None
#                     ))
#                     seen_texts.add(txt)

#         if not questions:
#             return JSONResponse(content=StandardResponse(status=False, message="No questions for this grade").__dict__, status_code=400)

#         # Load saved answers
#         saved_answers = await TeacherAnswers.filter(
#             student_id=student_id,
#             question_id__in=[q.question_id for q in questions],
#             is_deleted=False
#         ).values("question_id", "answer", "notes")

#         answer_map = {a["question_id"]: a["answer"] for a in saved_answers}
#         notes = next(
#             (a["notes"].replace("EMOTIONAL_DEVELOPMENTAL:", "").strip()
#              for a in saved_answers if a["notes"] and "EMOTIONAL_DEVELOPMENTAL:" in a["notes"]),
#             None
#         )

#         for q in questions:
#             saved = answer_map.get(q.question_id)
#             if saved in ["1", "2", "3"]:
#                 q.answer = saved

#         total_score = sum(int(q.answer) for q in questions if q.answer in ["1", "2", "3"])

#         student_info = {
#             "id": student.id,
#             "first_name": student.first_name or "",
#             "last_name": student.last_name or "",
#             "class_room": student.class_room or ""
#         }

#         return JSONResponse(
#             content=StandardResponse(
#                 status=True,
#                 message="Emotional questions loaded",
#                 data=QuestionListResponse(
#                     questions=questions,
#                     student=student_info,
#                     notes=notes,
#                     health_score_count=total_score
#                 ).dict()
#             ).__dict__,
#             status_code=200
#         )

#     except Exception as e:
#         import traceback
#         return JSONResponse(
#             content=StandardResponse(
#                 status=False,
#                 message="Error loading questions",
#                 errors={"detail": str(e), "trace": traceback.format_exc()}
#             ).__dict__,
#             status_code=500
#         )

# Add these imports at the top
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

@router.get("/teacher-emotional-questions/{student_id}", response_model=StandardResponse)
async def get_emotional_questions(
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
        student = await Students.get_or_none(id=student_id, is_deleted=False)
        if not student:
            return JSONResponse(content=StandardResponse(status=False, message="Student not found").__dict__, status_code=404)

        # Authorization - WITHOUT academic year filter
        if isinstance(current_user, SchoolStaff):
            if not await SchoolStudents.filter(student_id=student_id, school_id=current_user.school_id, status=True).exists():
                return JSONResponse(content=StandardResponse(status=False, message="Unauthorized").__dict__, status_code=403)

        # NOW determine academic year (AFTER authorization)
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
        db_qs = await StudentsQuestionBank.filter(
            question_type="EMOTIONAL_DEVELOPMENTAL",
            applicable_to_teacher=True,
            is_deleted=False
        ).all()

        for dbq in db_qs:
            grades = [g.strip() for g in dbq.grade_level.split(",") if g.strip()]
            if is_grade_in_range(class_room, [normalize_grade(g) for g in grades]):
                questions.append(QuestionResponse(
                    question_id=dbq.question_id,
                    question_text=dbq.question_text,
                    question_type="EMOTIONAL_DEVELOPMENTAL",
                    sub_domain=dbq.sub_domain or "",
                    options=["1", "2", "3"],
                    score_type=dbq.score_type,
                    answer=None
                ))
                seen_texts.add(dbq.question_text.lower().strip())

        # 2. Hardcoded Questions → IDs 41,00,000+ (41 lakhs)
        for idx, q in enumerate(TEACHER_EMOTIONAL):
            q_grades = [normalize_grade(g) for g in q["grade_level"]]
            if (is_grade_in_range(class_room, q_grades) and q.get("applicable_to_teacher", False)):
                txt = q["question_text"].lower().strip()
                if txt not in seen_texts:
                    qid = TeacherQuestionID.EMOTIONAL_HARDCODED_START + idx  # 4100000+
                    questions.append(QuestionResponse(
                        question_id=qid,
                        question_text=q["question_text"],
                        question_type="EMOTIONAL_DEVELOPMENTAL",
                        sub_domain=q.get("sub_domain", ""),
                        options=["1", "2", "3"],
                        score_type=q["score_type"],
                        answer=None
                    ))
                    seen_texts.add(txt)

        if not questions:
            return JSONResponse(content=StandardResponse(status=False, message="No questions for this grade").__dict__, status_code=400)

        # Load saved answers with academic year filter
        saved_answers = await TeacherAnswers.filter(
            year_filter,
            student_id=student_id,
            question_id__in=[q.question_id for q in questions],
            is_deleted=False
        ).values("question_id", "answer", "notes")

        # Fallback: answers saved today are outside the year filter range
        if not saved_answers:
            saved_answers = await TeacherAnswers.filter(
                student_id=student_id,
                question_id__in=[q.question_id for q in questions],
                is_deleted=False
            ).values("question_id", "answer", "notes")

        answer_map = {a["question_id"]: a["answer"] for a in saved_answers}
        notes = next(
            (a["notes"].replace("EMOTIONAL_DEVELOPMENTAL:", "").strip()
             for a in saved_answers if a["notes"] and "EMOTIONAL_DEVELOPMENTAL:" in a["notes"]),
            None
        )

        for q in questions:
            saved = answer_map.get(q.question_id)
            if saved in ["1", "2", "3"]:
                q.answer = saved

        total_score = sum(int(q.answer) for q in questions if q.answer in ["1", "2", "3"])

        student_info = {
            "id": student.id,
            "first_name": student.first_name or "",
            "last_name": student.last_name or "",
            "class_room": student.class_room or ""
        }

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        response = StandardResponse(
            status=True,
            message="Emotional questions loaded",
            data=QuestionListResponse(
                questions=questions,
                student=student_info,
                notes=notes,
                health_score_count=total_score
            ).dict()
        )
        
        json_response = JSONResponse(content=response.__dict__, status_code=200)
        json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return json_response

    except Exception as e:
        import traceback
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message="Error loading questions",
                errors={"detail": str(e), "trace": traceback.format_exc()}
            ).__dict__,
            status_code=500
        )

@router.post("/submit-teacher-emotional-answers", response_model=StandardResponse)
async def submit_emotional_answers(
    batch: AnswerBatchRequest,
    current_teacher: Any = Depends(get_current_teacher)
):
    if isinstance(current_teacher, JSONResponse):
        return current_teacher

    try:
        student_ids = {a.student_id for a in batch.answers}
        if len(student_ids) != 1:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="All answers must belong to the same student"
                ).__dict__,
                status_code=400
            )

        student_id = student_ids.pop()
        student = await Students.get_or_none(id=student_id, is_deleted=False)
        if not student:
            return JSONResponse(content=StandardResponse(status=False, message="Student not found").__dict__, status_code=404)

        if not await SchoolStudents.filter(student_id=student_id, school_id=current_teacher.school_id, status=True, is_deleted=False).exists():
            return JSONResponse(content=StandardResponse(status=False, message="Unauthorized").__dict__, status_code=403)

        class_room = normalize_grade(student.class_room)
        valid_questions = {}
        seen_texts = set()

        # 1. DB questions
        db_qs = await StudentsQuestionBank.filter(
            question_type="EMOTIONAL_DEVELOPMENTAL",
            applicable_to_teacher=True,
            is_deleted=False
        ).all()

        for dbq in db_qs:
            grades = [g.strip() for g in dbq.grade_level.split(",") if g.strip()]
            if is_grade_in_range(class_room, [normalize_grade(g) for g in grades]):
                valid_questions[dbq.question_id] = {
                    "text": dbq.question_text,
                    "score_type": dbq.score_type
                }
                seen_texts.add(dbq.question_text.lower().strip())

        # 2. Hardcoded questions – IDs 4100000+ (41 lakhs)
        for idx, q in enumerate(TEACHER_EMOTIONAL):
            q_grades = [normalize_grade(g) for g in q["grade_level"]]
            if (is_grade_in_range(class_room, q_grades) and q.get("applicable_to_teacher", False)):
                txt = q["question_text"].lower().strip()
                if txt not in seen_texts:
                    stable_id = TeacherQuestionID.EMOTIONAL_HARDCODED_START + idx  # 4100000+
                    valid_questions[stable_id] = {
                        "text": q["question_text"],
                        "score_type": q["score_type"]
                    }
                    seen_texts.add(txt)

        invalid_ids = [a.question_id for a in batch.answers if a.question_id not in valid_questions]
        if invalid_ids:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="Invalid question IDs",
                    errors={"invalid_ids": invalid_ids, "valid_sample": list(valid_questions.keys())[:15]}
                ).__dict__,
                status_code=400
            )

        prefixed_notes = f"EMOTIONAL_DEVELOPMENTAL: {batch.notes or ''}".strip()
        saved_answers = []

        async with in_transaction():
            for item in batch.answers:
                q = valid_questions[item.question_id]
                answer_val = item.answer.strip().title()

                existing = await TeacherAnswers.filter(
                    student_id=student_id,
                    question_id=item.question_id,
                    is_deleted=False
                ).first()

                if existing:
                    existing.answer = answer_val
                    existing.notes = prefixed_notes
                    existing.status = True
                    existing.updated_by = current_teacher.id
                    existing.updated_user_role = current_teacher.user_role
                    existing.updated_role_type = current_teacher.role_type
                    await existing.save()
                    record = existing
                else:
                    record = await TeacherAnswers.create(
                        question_id=item.question_id,
                        student=student,
                        teacher=current_teacher,
                        answer=answer_val,
                        notes=prefixed_notes,
                        score_type=q["score_type"],
                        status=True,
                        created_by=current_teacher.id,
                        created_user_role=current_teacher.user_role,
                        created_role_type=current_teacher.role_type,
                        updated_by=current_teacher.id,
                        updated_user_role=current_teacher.user_role,
                        updated_role_type=current_teacher.role_type
                    )

                saved_answers.append(AnswerResponse(
                    student_id=student_id,
                    question_id=item.question_id,
                    question_text=q["text"],
                    answer=answer_val,
                    score_type=q["score_type"],
                    created_at=record.created_at.isoformat() + "Z",
                    updated_at=record.updated_at.isoformat() + "Z"
                ))

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Teacher emotional answers submitted successfully",
                data=AnswerListResponse(answers=saved_answers, notes=batch.notes or "").dict()
            ).__dict__,
            status_code=200
        )

    except Exception as e:
        import traceback
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message="Server error",
                errors={"detail": str(e), "traceback": traceback.format_exc()}
            ).__dict__,
            status_code=500
        )
