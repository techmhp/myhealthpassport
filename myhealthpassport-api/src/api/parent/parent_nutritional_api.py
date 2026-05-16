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
from .nutritional_questions_parents import NUTRITIONAL_QUESTIONS as PARENT_NUTRITIONAL
from . import router


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
    """Map 'Class X' to 'X' or return original if not a class format."""
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

# Add these imports at the top
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ===================================================================
# DEBUG VERSION: GET PARENT NUTRITIONAL QUESTIONS
# ===================================================================
@router.get("/parent-nutritional-questions/{student_id}", response_model=StandardResponse)
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
            return JSONResponse(content=StandardResponse(status=False, message=f"Student with ID {student_id} not found").__dict__, status_code=404)

        # Authorization check WITHOUT any filters - exactly like old code
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
        
        # 1. Fetch questions from DATABASE
        db_questions = await StudentsQuestionBank.filter(
            question_type="NUTRITIONAL",
            applicable_to_parent=True,
            is_deleted=False
        ).all()
        
        questions = []
        seen_question_texts = set()
        
        # Add database questions first
        for db_question in db_questions:
            question_grades = [g.strip() for g in db_question.grade_level.split(",")]
            normalized_question_grades = [normalize_grade(g) for g in question_grades]
            
            if is_grade_in_range(class_room, normalized_question_grades):
                questions.append(QuestionResponse(
                    question_id=db_question.question_id,
                    question_text=db_question.question_text,
                    question_type=db_question.question_type,
                    sub_domain=db_question.sub_domain,
                    options=["Yes", "No"],
                    score_type=db_question.score_type,
                    answer=None
                ))
                seen_question_texts.add(db_question.question_text.lower().strip())
        
        # 2. Add hardcoded questions → IDs 10,00,000+ (10 lakhs)
        for idx, q in enumerate(PARENT_NUTRITIONAL):
            if is_grade_in_range(class_room, q["grade_level"]):
                question_text_normalized = q["question_text"].lower().strip()
                
                if question_text_normalized not in seen_question_texts:
                    questions.append(QuestionResponse(
                        question_id=ParentQuestionID.NUTRITIONAL_HARDCODED_START + idx,  # 1000000+
                        question_text=q["question_text"],
                        question_type="NUTRITIONAL",
                        sub_domain=q.get("sub_domain", ""),
                        options=["Yes", "No"],
                        score_type=q["score_type"],
                        answer=None
                    ))
                    seen_question_texts.add(question_text_normalized)

        if not questions:
            return JSONResponse(content=StandardResponse(status=False, message=f"No questions available for class {class_room}").__dict__, status_code=400)

        # Get existing answers WITH academic year filter
        all_question_ids = {q.question_id for q in questions}
        
        # Apply year_filter correctly - use it as first parameter
        existing_answers = await ParentAnswers.filter(
            year_filter,
            student_id=student_id,
            question_id__in=all_question_ids,
            is_deleted=False
        ).order_by('-updated_at').values("question_id", "answer", "notes")

        # Fallback: answers saved today are outside the year filter range
        if not existing_answers:
            existing_answers = await ParentAnswers.filter(
                student_id=student_id,
                question_id__in=all_question_ids,
                is_deleted=False
            ).order_by('-updated_at').values("question_id", "answer", "notes")
        
        answer_map = {answer["question_id"]: answer["answer"] for answer in existing_answers}
        notes = next((a["notes"].replace("NUTRITIONAL:", "").strip() for a in existing_answers if a["notes"] and a["notes"].startswith("NUTRITIONAL:")), None)

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
            message="Parent nutritional questions retrieved successfully",
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


# @router.get("/parent-nutritional-questions/{student_id}", response_model=StandardResponse)
# async def get_nutritional_questions(
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
        
#         # 1. Fetch questions from DATABASE
#         db_questions = await StudentsQuestionBank.filter(
#             question_type="NUTRITIONAL",
#             applicable_to_parent=True,
#             is_deleted=False
#         ).all()
        
#         questions = []
#         seen_question_texts = set()
        
#         # Add database questions first
#         for db_question in db_questions:
#             question_grades = [g.strip() for g in db_question.grade_level.split(",")]
#             normalized_question_grades = [normalize_grade(g) for g in question_grades]
            
#             if is_grade_in_range(class_room, normalized_question_grades):
#                 questions.append(QuestionResponse(
#                     question_id=db_question.question_id,
#                     question_text=db_question.question_text,
#                     question_type=db_question.question_type,
#                     sub_domain=db_question.sub_domain,
#                     options=["Yes", "No"],
#                     score_type=db_question.score_type,
#                     answer=None
#                 ))
#                 seen_question_texts.add(db_question.question_text.lower().strip())
        
#         # 2. Add hardcoded questions → IDs 10,00,000+ (10 lakhs)
#         for idx, q in enumerate(PARENT_NUTRITIONAL):
#             if is_grade_in_range(class_room, q["grade_level"]):
#                 question_text_normalized = q["question_text"].lower().strip()
                
#                 if question_text_normalized not in seen_question_texts:
#                     questions.append(QuestionResponse(
#                         question_id=ParentQuestionID.NUTRITIONAL_HARDCODED_START + idx,  # 1000000+
#                         question_text=q["question_text"],
#                         question_type="NUTRITIONAL",
#                         sub_domain=q.get("sub_domain", ""),
#                         options=["Yes", "No"],
#                         score_type=q["score_type"],
#                         answer=None
#                     ))
#                     seen_question_texts.add(question_text_normalized)

#         if not questions:
#             return JSONResponse(content=StandardResponse(status=False, message=f"No questions available for class {class_room}").__dict__, status_code=400)

#         # Get existing answers
#         all_question_ids = {q.question_id for q in questions}
#         existing_answers = await ParentAnswers.filter(
#             student_id=student_id,
#             question_id__in=all_question_ids,
#             is_deleted=False
#         ).order_by('-updated_at').values("question_id", "answer", "notes")
        
#         answer_map = {answer["question_id"]: answer["answer"] for answer in existing_answers}
#         notes = next((a["notes"].replace("NUTRITIONAL:", "").strip() for a in existing_answers if a["notes"] and a["notes"].startswith("NUTRITIONAL:")), None)

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
#             message="Parent nutritional questions retrieved successfully",
#             data=QuestionListResponse(
#                 questions=questions,
#                 student=student_info,
#                 notes=notes,
#                 health_score_count=health_score_count
#             ).dict()
#         ).__dict__, status_code=200)

#     except Exception as e:
#         return JSONResponse(content=StandardResponse(status=False, message=f"An error occurred: {str(e)}").__dict__, status_code=500)

@router.post("/submit-parent-nutritional-answers", response_model=StandardResponse)
async def submit_nutritional_answers(
    batch: AnswerBatchRequest,
    current_parent: Any = Depends(get_current_parent)
):
    if isinstance(current_parent, JSONResponse):
        return current_parent

    try:
        student_ids = {answer.student_id for answer in batch.answers}
        if len(student_ids) > 1:
            return StandardResponse(status=False, message="All answers must belong to the same student")

        student_id = student_ids.pop()
        student = await Students.get_or_none(id=student_id)
        if not student:
            return StandardResponse(status=False, message=f"Student {student_id} not found")

        parent_child = await ParentChildren.filter(parent_id=current_parent.id, student_id=student_id, status=True).first()
        if not parent_child:
            return StandardResponse(status=False, message=f"Unauthorized for student {student_id}")

        class_room = normalize_grade(student.class_room)

        # Build valid questions list
        valid_questions = []
        db_questions = await StudentsQuestionBank.filter(
            question_type="NUTRITIONAL",
            applicable_to_parent=True,
            is_deleted=False
        ).all()

        # DB questions
        for db_question in db_questions:
            question_grades = [g.strip() for g in db_question.grade_level.split(",")]
            normalized_grades = [normalize_grade(g) for g in question_grades]
            if is_grade_in_range(class_room, normalized_grades):
                valid_questions.append({
                    "question_id": db_question.question_id,
                    "question_text": db_question.question_text,
                    "score_type": db_question.score_type
                })

        # Hardcoded questions → IDs 1000000+ (10 lakhs)
        for idx, q in enumerate(PARENT_NUTRITIONAL):
            if is_grade_in_range(class_room, q["grade_level"]):
                hardcoded_id = ParentQuestionID.NUTRITIONAL_HARDCODED_START + idx  # 1000000+
                question_text = q["question_text"].lower().strip()
                if not any(qq["question_text"].lower().strip() == question_text for qq in valid_questions):
                    valid_questions.append({
                        "question_id": hardcoded_id,
                        "question_text": q["question_text"],
                        "score_type": q["score_type"]
                    })

        valid_question_ids = {q["question_id"] for q in valid_questions}
        invalid_ids = [a.question_id for a in batch.answers if a.question_id not in valid_question_ids]

        if invalid_ids:
            return StandardResponse(
                status=False,
                message="Invalid question IDs for this student's grade",
                errors={"invalid_question_ids": invalid_ids}
            )

        prefixed_notes = f"NUTRITIONAL: {batch.notes or ''}".strip()
        saved_answers = []
        
        async with in_transaction():
            for answer in batch.answers:
                question = next((q for q in valid_questions if q["question_id"] == answer.question_id), None)
                if not question:
                    continue

                existing = await ParentAnswers.filter(student_id=student_id, question_id=answer.question_id).first()

                if existing:
                    existing.answer = answer.answer
                    existing.notes = prefixed_notes
                    existing.updated_by = str(current_parent.id)
                    existing.updated_user_role = current_parent.user_role
                    existing.updated_role_type = "PARENT"
                    existing.status = True
                    await existing.save()
                    db_answer = existing
                else:
                    db_answer = await ParentAnswers.create(
                        student_id=student_id,
                        question_id=answer.question_id,
                        answer=answer.answer,
                        notes=prefixed_notes,
                        score_type=question["score_type"],
                        status=True,
                        parent_id=current_parent.id,
                        created_by=str(current_parent.id),
                        created_user_role=current_parent.user_role,
                        created_role_type="PARENT"
                    )

                saved_answers.append(AnswerResponse(
                    student_id=student_id,
                    question_id=answer.question_id,
                    question_text=question["question_text"],
                    answer=answer.answer,
                    score_type=question["score_type"],
                    created_at=db_answer.created_at.isoformat() + "Z",
                    updated_at=db_answer.updated_at.isoformat() + "Z" if db_answer.updated_at else datetime.utcnow().isoformat() + "Z"
                ))

        return StandardResponse(
            status=True,
            message="Nutritional answers submitted successfully",
            data=AnswerListResponse(answers=saved_answers, notes=batch.notes).dict()
        )

    except Exception as e:
        return StandardResponse(status=False, message=str(e), errors={"detail": str(e)})

