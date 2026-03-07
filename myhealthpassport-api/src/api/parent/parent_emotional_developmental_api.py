from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from typing import Any
from datetime import datetime
from tortoise.transactions import in_transaction
from src.models.student_models import ParentChildren, Students
from src.models.user_models import ConsultantTeam, Parents, SchoolStaff, ScreeningTeam, ScreeningTeamRoles, AnalystTeam, AnalystRoles
from src.models.questionnaire_models import StudentsQuestionBank, ParentAnswers, TeacherAnswers
from src.schemas.screening_schema import QuestionResponse, QuestionListResponse, AnswerRequest, AnswerBatchRequest, AnswerResponse, AnswerListResponse
from src.core.manager import get_current_user
from src.utils.response import StandardResponse
from .emotional_developmental_questions_parents import EMOTIONAL_DEVELOPMENTAL_QUESTIONS as PARENT_EMOTIONAL
from . import router

# class ParentQuestionID:
#     NUTRITIONAL_START = 10000
#     EMOTIONAL_START   = 20000

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

async def get_current_parent(user: Any = Depends(get_current_user)):
    if user is None:
        response_obj = StandardResponse(
            status=False,
            message="No user provided",
            errors={"detail": "User is None"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_401_UNAUTHORIZED)

    if not isinstance(user, dict) or "user_id" not in user or "role_type" not in user:
        response_obj = StandardResponse(
            status=False,
            message="Invalid user data format",
            errors={"detail": f"Expected user_id and role_type, got {user}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    if user["role_type"].strip().upper() != "PARENT":
        response_obj = StandardResponse(
            status=False,
            message="Only parents can access this endpoint",
            errors={"detail": f"Invalid role_type: {user['role_type']}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    parent = await Parents.get_or_none(id=user["user_id"])
    if not parent:
        response_obj = StandardResponse(
            status=False,
            message="Parent not found",
            errors={"detail": f"No parent found for user_id: {user['user_id']}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    return parent

async def get_current_authorized_user(user: Any = Depends(get_current_user)):
    if user is None:
        response_obj = StandardResponse(
            status=False,
            message="No user provided",
            errors={"detail": "User is None"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_401_UNAUTHORIZED)

    if not isinstance(user, dict) or "user_id" not in user or "user_role" not in user or "role_type" not in user:
        response_obj = StandardResponse(
            status=False,
            message="Invalid user data format",
            errors={"detail": f"Expected user_id, user_role, and role_type, got {user}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    role_type = user["role_type"].strip().upper()
    role_to_check = user["user_role"].strip().upper()
    
    # Include SCREENING_TEAM in allowed_roles
    allowed_roles = ["PARENT", "ANALYST_TEAM", "SCREENING_TEAM"]
    
    if role_type not in allowed_roles:
        response_obj = StandardResponse(
            status=False,
            message="User role not authorized for this endpoint",
            errors={"detail": f"Invalid role_type: {role_type}. Allowed roles: {allowed_roles}"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    if role_type == "PARENT":
        parent = await Parents.get_or_none(id=user["user_id"])
        if not parent:
            response_obj = StandardResponse(
                status=False,
                message="Parent not found",
                errors={"detail": f"No parent found for user_id: {user['user_id']}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return parent

    elif role_type == "SCREENING_TEAM":
        if role_to_check not in [role.value for role in ScreeningTeamRoles]:
            response_obj = StandardResponse(
                status=False,
                message="Invalid screening team role",
                errors={"detail": f"Invalid user_role: {role_to_check}. Allowed roles: {[role.value for role in ScreeningTeamRoles]}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)
        
        screening_team = await ScreeningTeam.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
        if not screening_team:
            # Check AnalystTeam for overlapping roles (e.g., PSYCHOLOGIST, NUTRITIONIST)
            analyst_team = await AnalystTeam.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
            if analyst_team:
                return analyst_team
            existing_roles = await ScreeningTeam.filter(id=user["user_id"]).values_list("user_role", flat=True)
            response_obj = StandardResponse(
                status=False,
                message="Screening team member not found",
                errors={"detail": f"No screening team member found for user_id: {user['user_id']} with user_role: {role_to_check}. Existing roles: {existing_roles or 'None'}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return screening_team

    elif role_type == "ANALYST_TEAM":
        if role_to_check not in [role.value for role in AnalystRoles]:
            response_obj = StandardResponse(
                status=False,
                message="Invalid analyst team role",
                errors={"detail": f"Invalid user_role: {role_to_check}. Allowed roles: {[role.value for role in AnalystRoles]}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_403_FORBIDDEN)
        
        analyst_team = await AnalystTeam.get_or_none(id=user["user_id"], user_role__iexact=role_to_check)
        if not analyst_team:
            existing_roles = await AnalystTeam.filter(id=user["user_id"]).values_list("user_role", flat=True)
            response_obj = StandardResponse(
                status=False,
                message="Analyst team member not found",
                errors={"detail": f"No analyst team member found for user_id: {user['user_id']} with user_role: {role_to_check}. Existing roles: {existing_roles or 'None'}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)
        return analyst_team

    response_obj = StandardResponse(
        status=False,
        message="User not found",
        errors={"detail": "User not found"}
    )
    return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)

# @router.get("/parent-emotional-questions/{student_id}", response_model=StandardResponse)
# async def get_emotional_questions(
#     student_id: int,
#     current_user: Any = Depends(get_current_authorized_user)
# ):
#     if isinstance(current_user, JSONResponse):
#         return current_user

#     try:
#         student = await Students.get_or_none(id=student_id)
#         if not student:
#             return JSONResponse(content=StandardResponse(status=False, message=f"Student with ID {student_id} not found").__dict__, status_code=404)

#         if isinstance(current_user, Parents):
#             parent_child = await ParentChildren.filter(parent_id=current_user.id, student_id=student_id, status=True).first()
#             if not parent_child:
#                 return JSONResponse(content=StandardResponse(status=False, message="Unauthorized access").__dict__, status_code=403)

#         class_room = normalize_grade(student.class_room)
        
#         # Generate questions with IDs 21,00,000+ (21 lakhs)
#         questions = []
#         for idx, q in enumerate(PARENT_EMOTIONAL):
#             if q.get("applicable_to_parent", False) and is_grade_in_range(class_room, q["grade_level"]):
#                 questions.append(QuestionResponse(
#                     question_id=ParentQuestionID.EMOTIONAL_HARDCODED_START + idx,  # 2100000+
#                     question_text=q["question_text"],
#                     question_type="EMOTIONAL_DEVELOPMENTAL",
#                     sub_domain=q.get("sub_domain") or None,
#                     options=["Yes", "No"],
#                     score_type=q["score_type"],
#                     answer=None
#                 ))

#         valid_question_ids = {q.question_id for q in questions}
#         existing_answers = await ParentAnswers.filter(
#             student_id=student_id,
#             question_id__in=valid_question_ids
#         ).order_by('-updated_at').values("question_id", "answer", "notes")
        
#         answer_map = {answer["question_id"]: answer["answer"] for answer in existing_answers}
#         notes = next((a["notes"].replace("Developmental & Emotional:", "").strip() for a in existing_answers if a["notes"] and a["notes"].startswith("Developmental & Emotional:")), None)

#         for question in questions:
#             string_answer = answer_map.get(question.question_id)
#             if string_answer is not None and string_answer.isdigit():
#                 question.answer = int(string_answer)
#             else:
#                 question.answer = string_answer
        
#         health_score_count = sum(question.answer for question in questions if isinstance(question.answer, int))
        
#         for question in questions:
#             question.answer = answer_map.get(question.question_id)
        
#         student_info = {
#             "id": student.id,
#             "first_name": student.first_name or "",
#             "last_name": student.last_name or "",
#             "class_room": student.class_room or ""
#         }

#         return JSONResponse(content=StandardResponse(
#             status=True,
#             message="Emotional and developmental questions retrieved successfully",
#             data=QuestionListResponse(
#                 questions=questions,
#                 student=student_info,
#                 notes=notes,
#                 health_score_count=health_score_count
#             ).dict()
#         ).__dict__, status_code=200)

#     except Exception as e:
#         return JSONResponse(content=StandardResponse(status=False, message=f"An error occurred: {str(e)}").__dict__, status_code=500)

# Add these imports at the top
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ===================================================================
# MODIFIED: GET PARENT EMOTIONAL QUESTIONS (with Academic Year Filter)
# ===================================================================
@router.get("/parent-emotional-questions/{student_id}", response_model=StandardResponse)
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
        student = await Students.get_or_none(id=student_id)
        if not student:
            return JSONResponse(content=StandardResponse(status=False, message=f"Student with ID {student_id} not found").__dict__, status_code=404)

        # Authorization check WITHOUT academic year filter - exactly like old code
        if isinstance(current_user, Parents):
            parent_child = await ParentChildren.filter(parent_id=current_user.id, student_id=student_id, status=True).first()
            if not parent_child:
                return JSONResponse(content=StandardResponse(status=False, message="Unauthorized access").__dict__, status_code=403)

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
        
        # Generate questions with IDs 21,00,000+ (21 lakhs)
        questions = []
        for idx, q in enumerate(PARENT_EMOTIONAL):
            if q.get("applicable_to_parent", False) and is_grade_in_range(class_room, q["grade_level"]):
                questions.append(QuestionResponse(
                    question_id=ParentQuestionID.EMOTIONAL_HARDCODED_START + idx,  # 2100000+
                    question_text=q["question_text"],
                    question_type="EMOTIONAL_DEVELOPMENTAL",
                    sub_domain=q.get("sub_domain") or None,
                    options=["Yes", "No"],
                    score_type=q["score_type"],
                    answer=None
                ))

        valid_question_ids = {q.question_id for q in questions}
        
        # Apply academic year filter to ParentAnswers query ONLY
        existing_answers = await ParentAnswers.filter(
            year_filter,
            student_id=student_id,
            question_id__in=valid_question_ids
        ).order_by('-updated_at').values("question_id", "answer", "notes")
        
        answer_map = {answer["question_id"]: answer["answer"] for answer in existing_answers}
        notes = next((a["notes"].replace("Developmental & Emotional:", "").strip() for a in existing_answers if a["notes"] and a["notes"].startswith("Developmental & Emotional:")), None)

        for question in questions:
            string_answer = answer_map.get(question.question_id)
            if string_answer is not None and string_answer.isdigit():
                question.answer = int(string_answer)
            else:
                question.answer = string_answer
        
        health_score_count = sum(question.answer for question in questions if isinstance(question.answer, int))
        
        for question in questions:
            question.answer = answer_map.get(question.question_id)
        
        student_info = {
            "id": student.id,
            "first_name": student.first_name or "",
            "last_name": student.last_name or "",
            "class_room": student.class_room or ""
        }

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        response = StandardResponse(
            status=True,
            message="Emotional and developmental questions retrieved successfully",
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
        return JSONResponse(content=StandardResponse(status=False, message=f"An error occurred: {str(e)}").__dict__, status_code=500)


# POST endpoint remains unchanged - no academic year filter needed
@router.post("/submit-parent-emotional-answers", response_model=StandardResponse)
async def submit_emotional_answers(
    batch: AnswerBatchRequest,
    current_parent: Any = Depends(get_current_parent)
):
    if isinstance(current_parent, JSONResponse):
        return current_parent

    try:
        student_ids = {answer.student_id for answer in batch.answers}
        if len(student_ids) > 1:
            return JSONResponse(content=StandardResponse(status=False, message="All answers must belong to the same student").__dict__, status_code=400)

        student_id = student_ids.pop()
        student = await Students.get_or_none(id=student_id)
        if not student:
            return JSONResponse(content=StandardResponse(status=False, message=f"Student with ID {student_id} not found").__dict__, status_code=404)

        parent_child = await ParentChildren.filter(parent_id=current_parent.id, student_id=student_id, status=True).first()
        if not parent_child:
            return JSONResponse(content=StandardResponse(status=False, message="Unauthorized access").__dict__, status_code=403)

        class_room = normalize_grade(student.class_room)
        
        # Valid questions with IDs 2100000+ (21 lakhs)
        valid_questions = {
            ParentQuestionID.EMOTIONAL_HARDCODED_START + idx: q
            for idx, q in enumerate(PARENT_EMOTIONAL)
            if is_grade_in_range(class_room, q["grade_level"]) and q.get("applicable_to_parent", False)
        }

        invalid_question_ids = [a.question_id for a in batch.answers if a.question_id not in valid_questions]
        if invalid_question_ids:
            return JSONResponse(content=StandardResponse(
                status=False,
                message="Invalid question IDs for the student's class",
                errors={"detail": f"Invalid question IDs: {invalid_question_ids}"}
            ).__dict__, status_code=400)

        prefixed_notes = f"Developmental & Emotional: {batch.notes or ''}".strip()
        saved_answers = []
        
        async with in_transaction():
            for answer in batch.answers:
                question = valid_questions.get(answer.question_id)
                if not question:
                    continue

                existing_answer = await ParentAnswers.filter(student_id=answer.student_id, question_id=answer.question_id).first()

                if existing_answer:
                    existing_answer.answer = answer.answer
                    existing_answer.notes = prefixed_notes
                    existing_answer.updated_at = datetime.utcnow()
                    existing_answer.updated_by = current_parent.id
                    existing_answer.status = True
                    existing_answer.updated_user_role = current_parent.user_role
                    existing_answer.updated_role_type = "PARENT"
                    await existing_answer.save()
                    db_answer = existing_answer
                else:
                    db_answer = await ParentAnswers.create(
                        question_id=answer.question_id,
                        student=student,
                        parent=current_parent,
                        answer=answer.answer,
                        status=True,
                        notes=prefixed_notes,
                        score_type=question["score_type"],
                        created_at=datetime.utcnow(),
                        created_by=current_parent.id,
                        created_user_role=current_parent.user_role,
                        created_role_type="PARENT"
                    )

                saved_answers.append(AnswerResponse(
                    student_id=answer.student_id,
                    question_id=answer.question_id,
                    question_text=question["question_text"],
                    answer=answer.answer,
                    score_type=question["score_type"],
                    created_at=db_answer.created_at.isoformat() + "Z",
                    updated_at=db_answer.updated_at.isoformat() + "Z"
                ))

        return JSONResponse(content=StandardResponse(
            status=True,
            message="Emotional and developmental answers submitted successfully",
            data=AnswerListResponse(answers=saved_answers, notes=batch.notes).dict()
        ).__dict__, status_code=200)

    except Exception as e:
        return JSONResponse(content=StandardResponse(status=False, message=f"An error occurred: {str(e)}").__dict__, status_code=500)


@router.post("/submit-parent-emotional-answers", response_model=StandardResponse)
async def submit_emotional_answers(
    batch: AnswerBatchRequest,
    current_parent: Any = Depends(get_current_parent)
):
    if isinstance(current_parent, JSONResponse):
        return current_parent

    try:
        student_ids = {answer.student_id for answer in batch.answers}
        if len(student_ids) > 1:
            return JSONResponse(content=StandardResponse(status=False, message="All answers must belong to the same student").__dict__, status_code=400)

        student_id = student_ids.pop()
        student = await Students.get_or_none(id=student_id)
        if not student:
            return JSONResponse(content=StandardResponse(status=False, message=f"Student with ID {student_id} not found").__dict__, status_code=404)

        parent_child = await ParentChildren.filter(parent_id=current_parent.id, student_id=student_id, status=True).first()
        if not parent_child:
            return JSONResponse(content=StandardResponse(status=False, message="Unauthorized access").__dict__, status_code=403)

        class_room = normalize_grade(student.class_room)
        
        # Valid questions with IDs 2100000+ (21 lakhs)
        valid_questions = {
            ParentQuestionID.EMOTIONAL_HARDCODED_START + idx: q
            for idx, q in enumerate(PARENT_EMOTIONAL)
            if is_grade_in_range(class_room, q["grade_level"]) and q.get("applicable_to_parent", False)
        }

        invalid_question_ids = [a.question_id for a in batch.answers if a.question_id not in valid_questions]
        if invalid_question_ids:
            return JSONResponse(content=StandardResponse(
                status=False,
                message="Invalid question IDs for the student's class",
                errors={"detail": f"Invalid question IDs: {invalid_question_ids}"}
            ).__dict__, status_code=400)

        prefixed_notes = f"Developmental & Emotional: {batch.notes or ''}".strip()
        saved_answers = []
        
        async with in_transaction():
            for answer in batch.answers:
                question = valid_questions.get(answer.question_id)
                if not question:
                    continue

                existing_answer = await ParentAnswers.filter(student_id=answer.student_id, question_id=answer.question_id).first()

                if existing_answer:
                    existing_answer.answer = answer.answer
                    existing_answer.notes = prefixed_notes
                    existing_answer.updated_at = datetime.utcnow()
                    existing_answer.updated_by = current_parent.id
                    existing_answer.status = True
                    existing_answer.updated_user_role = current_parent.user_role
                    existing_answer.updated_role_type = "PARENT"
                    await existing_answer.save()
                    db_answer = existing_answer
                else:
                    db_answer = await ParentAnswers.create(
                        question_id=answer.question_id,
                        student=student,
                        parent=current_parent,
                        answer=answer.answer,
                        status=True,
                        notes=prefixed_notes,
                        score_type=question["score_type"],
                        created_at=datetime.utcnow(),
                        created_by=current_parent.id,
                        created_user_role=current_parent.user_role,
                        created_role_type="PARENT"
                    )

                saved_answers.append(AnswerResponse(
                    student_id=answer.student_id,
                    question_id=answer.question_id,
                    question_text=question["question_text"],
                    answer=answer.answer,
                    score_type=question["score_type"],
                    created_at=db_answer.created_at.isoformat() + "Z",
                    updated_at=db_answer.updated_at.isoformat() + "Z"
                ))

        return JSONResponse(content=StandardResponse(
            status=True,
            message="Emotional and developmental answers submitted successfully",
            data=AnswerListResponse(answers=saved_answers, notes=batch.notes).dict()
        ).__dict__, status_code=200)

    except Exception as e:
        return JSONResponse(content=StandardResponse(status=False, message=f"An error occurred: {str(e)}").__dict__, status_code=500)
