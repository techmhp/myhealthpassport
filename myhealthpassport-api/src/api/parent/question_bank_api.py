from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from pydantic import BaseModel, validator
from typing import List, Optional, Any
from tortoise.transactions import in_transaction
from src.models.student_models import ParentChildren, Students
from src.models.user_models import ConsultantTeam, Parents, SchoolStaff
from src.models.questionnaire_models import StudentsQuestionBank, ParentAnswers, TeacherAnswers
from src.schemas.screening_schema import QuestionResponse, QuestionListResponse, AnswerRequest, AnswerBatchRequest, AnswerResponse, AnswerListResponse
from src.core.manager import get_current_user
from src.utils.response import StandardResponse
from src.api.parent.nutritional_questions_parents import NUTRITIONAL_QUESTIONS as PARENT_NUTRITIONAL
from src.api.teacher.nutritional_questions_teachers import NUTRITIONAL_QUESTIONS as TEACHER_NUTRITIONAL
from src.api.parent.emotional_developmental_questions_parents import EMOTIONAL_DEVELOPMENTAL_QUESTIONS as PARENT_EMOTIONAL
from src.api.teacher.emotional_developmental_questions_teachers import EMOTIONAL_DEVELOPMENTAL_QUESTIONS as TEACHER_EMOTIONAL
from . import router

def normalize_grade(grade: str) -> str:
    """Map 'Class X' to 'X' for consistency."""
    if grade.startswith("Class "):
        return grade.replace("Class ", "")
    return grade

async def get_current_admin(user: Any = Depends(get_current_user)):
    if user is None:
        return StandardResponse(
            status=False,
            message="No user provided",
            errors={"detail": "User is None"}
        )
    if not isinstance(user, dict) or "user_id" not in user or "role_type" not in user:
        return StandardResponse(
            status=False,
            message="Invalid user data format",
            errors={"detail": f"Expected user_id and role_type, got {user}"}
        )
    # if user["role_type"].strip().upper() != "ADMIN":
    #     return StandardResponse(
    #         status=False,
    #         message="Only admins can access this endpoint",
    #         errors={"detail": f"Invalid role_type: {user['role_type']}"}
    #     )
    return user

@router.post("/add-questions")
async def add_questions_to_bank(
    current_admin: Any = Depends(get_current_admin)
):
    if isinstance(current_admin, StandardResponse):
        return JSONResponse(content=current_admin.dict())

    try:
        question_sets = [
            (PARENT_NUTRITIONAL, "NUTRITIONAL", "parent"),
            (PARENT_EMOTIONAL, "EMOTIONAL_DEVELOPMENTAL", "parent"),
            (TEACHER_NUTRITIONAL, "NUTRITIONAL", "teacher"),
            (TEACHER_EMOTIONAL, "EMOTIONAL_DEVELOPMENTAL", "teacher")
        ]

        added_questions = []
        async with in_transaction():
            for questions, question_type, applicable_to in question_sets:
                for q in questions:
                    normalized_grades = [normalize_grade(g) for g in q["grade_level"]]
                    grade_level_str = ", ".join(map(str, normalized_grades))
                    if len(grade_level_str) > 100:
                        raise ValueError(
                            f"grade_level string '{grade_level_str}' exceeds 100 characters (length: {len(grade_level_str)})"
                        )
                    existing = await StudentsQuestionBank.filter(
                        question_text=q["question_text"],
                        question_type=question_type,
                        applicable_to_parent=(applicable_to == "parent"),
                        applicable_to_teacher=(applicable_to == "teacher")
                    ).first()
                    if not existing:
                        db_question = await StudentsQuestionBank.create(
                            question_text=q["question_text"],
                            question_type=question_type,
                            grade_level=grade_level_str,
                            score_type=q["score_type"],
                            applicable_to_parent=(applicable_to == "parent"),
                            applicable_to_teacher=(applicable_to == "teacher"),
                            # created_by=str(current_admin.id),
                            # created_user_role=current_admin.user_role,
                            # created_role_type=current_admin.role_type
                        )
                        added_questions.append({
                            "question_text": q["question_text"],
                            "question_type": question_type,
                            "grade_level": normalized_grades,
                            "score_type": q["score_type"],
                            "applicable_to": applicable_to
                        })

        return JSONResponse(content=StandardResponse(
            status=True,
            message="Questions added to bank successfully",
            data={"added_questions": added_questions}
        ).dict())

    except Exception as e:
        return JSONResponse(content=StandardResponse(
            status=False,
            message=f"An error occurred: {str(e)}",
            errors={"detail": str(e)}
        ).dict())
        
  
## bulk questions add      
# from pydantic import BaseModel
# from typing import List, Optional

# class QuestionData(BaseModel):
#     question_text: str
#     question_type: str
#     sub_domain: Optional[str] = ""
#     score_type: str
#     grade_level: List[str]
#     applicable_to_parent: bool = False
#     applicable_to_teacher: bool = False
#     notes: Optional[str] = ""

# class QuestionsRequest(BaseModel):
#     questions_data: List[QuestionData]

# @router.post("/add-questions-bulk")
# async def add_questions_bulk(
#     request: QuestionsRequest, 
#     current_admin: Any = Depends(get_current_admin)
# ):
#     if isinstance(current_admin, StandardResponse):
#         return JSONResponse(content=current_admin.dict())

#     try:
#         added_questions = []
#         skipped_questions = []
        
#         async with in_transaction():
#             for question_data in request.questions_data:
#                 # Convert Pydantic model to dict for processing
#                 question_dict = question_data.dict()
                
#                 # Normalize grade levels
#                 grade_levels = question_dict["grade_level"]
#                 normalized_grades = [normalize_grade(g) for g in grade_levels]
#                 grade_level_str = ", ".join(map(str, normalized_grades))
                
#                 if len(grade_level_str) > 100:
#                     skipped_questions.append({
#                         "question_text": question_dict["question_text"],
#                         "reason": f"Grade level string too long: {len(grade_level_str)} characters"
#                     })
#                     continue

#                 # Check if question already exists
#                 existing = await StudentsQuestionBank.filter(
#                     question_text=question_dict["question_text"],
#                     question_type=question_dict["question_type"],
#                     applicable_to_parent=question_dict.get("applicable_to_parent", False),
#                     applicable_to_teacher=question_dict.get("applicable_to_teacher", False)
#                 ).first()

#                 if existing:
#                     skipped_questions.append({
#                         "question_text": question_dict["question_text"],
#                         "reason": "Question already exists"
#                     })
#                     continue

#                 # Create new question
#                 db_question = await StudentsQuestionBank.create(
#                     question_text=question_dict["question_text"],
#                     question_type=question_dict["question_type"],
#                     sub_domain=question_dict.get("sub_domain", ""),
#                     score_type=question_dict["score_type"],
#                     grade_level=grade_level_str,
#                     applicable_to_parent=question_dict.get("applicable_to_parent", False),
#                     applicable_to_teacher=question_dict.get("applicable_to_teacher", False),
#                     notes=question_dict.get("notes", ""),
#                     created_by=getattr(current_admin, 'id', None),
#                     created_user_role=getattr(current_admin, 'user_role', ""),
#                     created_role_type=getattr(current_admin, 'role_type', "")
#                 )

#                 added_questions.append({
#                     "question_id": db_question.question_id,
#                     "question_text": question_dict["question_text"],
#                     "question_type": question_dict["question_type"],
#                     "sub_domain": question_dict.get("sub_domain", ""),
#                     "score_type": question_dict["score_type"],
#                     "grade_level": normalized_grades,
#                     "applicable_to_parent": question_dict.get("applicable_to_parent", False),
#                     "applicable_to_teacher": question_dict.get("applicable_to_teacher", False)
#                 })

#         return JSONResponse(content=StandardResponse(
#             status=True,
#             message=f"Successfully added {len(added_questions)} questions. Skipped {len(skipped_questions)} questions.",
#             data={
#                 "added_questions": added_questions,
#                 "skipped_questions": skipped_questions,
#                 "summary": {
#                     "total_requested": len(request.questions_data),
#                     "successfully_added": len(added_questions),
#                     "skipped": len(skipped_questions)
#                 }
#             }
#         ).dict())

#     except Exception as e:
#         return JSONResponse(content=StandardResponse(
#             status=False,
#             message=f"An error occurred: {str(e)}",
#             errors={"detail": str(e)}
#         ).dict())

## single question add
class QuestionData(BaseModel):
    question_text: str
    question_type: str
    sub_domain: Optional[str] = ""
    score_type: str
    grade_level: List[str]
    applicable_to_parent: bool = False
    applicable_to_teacher: bool = False
    notes: Optional[str] = ""
    
    @validator('question_text')
    def validate_question_text(cls, v):
        if not v or not v.strip():
            raise ValueError('Question text cannot be empty')
        return v.strip()
    
    @validator('grade_level')
    def validate_grade_level(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one grade level must be specified')
        return v


@router.post("/add-dynamic-questions")
async def add_question(
    question_data: QuestionData,
    current_admin: Any = Depends(get_current_admin)
):
    if isinstance(current_admin, StandardResponse):
        return JSONResponse(content=current_admin.dict())

    try:
        # Convert Pydantic model to dict for processing
        question_dict = question_data.dict()
        
        # Normalize grade levels
        grade_levels = question_dict["grade_level"]
        normalized_grades = [normalize_grade(g) for g in grade_levels]
        grade_level_str = ", ".join(map(str, normalized_grades))
        
        # Check grade level string length
        if len(grade_level_str) > 100:
            return JSONResponse(content=StandardResponse(
                status=False,
                message=f"Grade level string too long: {len(grade_level_str)} characters (max 100)",
                errors={"detail": "Grade level combination exceeds maximum length"}
            ).dict())

        # Check if question already exists
        existing = await StudentsQuestionBank.filter(
            question_text=question_dict["question_text"],
            question_type=question_dict["question_type"],
            applicable_to_parent=question_dict.get("applicable_to_parent", False),
            applicable_to_teacher=question_dict.get("applicable_to_teacher", False)
        ).first()

        if existing:
            return JSONResponse(content=StandardResponse(
                status=False,
                message="Question already exists with same parameters",
                errors={"detail": "Duplicate question found"}
            ).dict())

        # Create new question
        db_question = await StudentsQuestionBank.create(
            question_text=question_dict["question_text"],
            question_type=question_dict["question_type"],
            sub_domain=question_dict.get("sub_domain", ""),
            score_type=question_dict["score_type"],
            grade_level=grade_level_str,
            applicable_to_parent=question_dict.get("applicable_to_parent", False),
            applicable_to_teacher=question_dict.get("applicable_to_teacher", False),
            notes=question_dict.get("notes", ""),
            created_by=getattr(current_admin, 'id', None),
            created_user_role=getattr(current_admin, 'user_role', ""),
            created_role_type=getattr(current_admin, 'role_type', "")
        )

        return JSONResponse(content=StandardResponse(
            status=True,
            message="Question added successfully",
            data={
                "question_id": db_question.question_id,
                "question_text": question_dict["question_text"],
                "question_type": question_dict["question_type"],
                "sub_domain": question_dict.get("sub_domain", ""),
                "score_type": question_dict["score_type"],
                "grade_level": normalized_grades,
                "applicable_to_parent": question_dict.get("applicable_to_parent", False),
                "applicable_to_teacher": question_dict.get("applicable_to_teacher", False),
                "notes": question_dict.get("notes", "")
            }
        ).dict())

    except Exception as e:
        return JSONResponse(content=StandardResponse(
            status=False,
            message=f"An error occurred: {str(e)}",
            errors={"detail": str(e)}
        ).dict())
