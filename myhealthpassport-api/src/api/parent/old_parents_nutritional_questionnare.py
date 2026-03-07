from datetime import date
from typing import Any

from fastapi import APIRouter, Depends
from tortoise.exceptions import DoesNotExist
from tortoise.transactions import in_transaction

from dumped.src.api.parent.nutritional_questions_parents import (
    PRESCHOOL_QUESTIONS, PRETEEN_QUESTIONS, SCHOOL_GOING_QUESTIONS,
    TEEN_QUESTIONS)
from src.core.manager import get_current_user
from src.models.screening_models import QuestionariesAndAnswers
from src.models.student_models import ParentChildren, Students
from src.models.user_models import ConsultantTeam, Parents
from src.schemas.screening_schema import (NutritionalAnswersBatch,
                                          QuestionariesAndAnswersResponse)
from src.utils.response import StandardResponse

router = APIRouter()

# Helper Functions
def calculate_age(dob: date) -> int:
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return age

async def get_current_parent(user: Any = Depends(get_current_user)):
    if user is None:
        return StandardResponse(
            status=False,
            message="No user provided",
            errors={"detail": "User is None"}
        )

    if isinstance(user, dict):
        if "user_id" not in user or "role_type" not in user:
            return StandardResponse(
                status=False,
                message="Invalid user data format",
                errors={"detail": f"Expected user_id and role_type, got {user}"}
            )
        if user["role_type"].strip().upper() != "PARENT":
            return StandardResponse(
                status=False,
                message="Only parents can answer the questionnaire",
                errors={"detail": f"Invalid role_type: {user['role_type']}"}
            )
        parent = await Parents.get_or_none(id=user["user_id"])
        if not parent:
            return StandardResponse(
                status=False,
                message="Parent not found",
                errors={"detail": f"No parent found for user_id: {user['user_id']}"}
            )
        return parent

    if not isinstance(user, Parents):
        return StandardResponse(
            status=False,
            message="Invalid user type",
            errors={"detail": f"Expected Parents instance, got type {type(user)}"}
        )

    if user.role_type.strip().upper() != "PARENT":
        return StandardResponse(
            status=False,
            message="Only parents can answer the questionnaire",
            errors={"detail": f"Invalid role_type: {user.role_type}"}
        )

    return user

# APIs
@router.get("/nutritional-questions/{student_id}")
async def get_nutritional_questions(
    student_id: int,
    current_parent: Any = Depends(get_current_parent)
):
    if isinstance(current_parent, StandardResponse):
        return current_parent

    try:
        # Verify the student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            return StandardResponse(
                status=False,
                message=f"Student with ID {student_id} not found",
                errors={"detail": "Student not found"}
            )

        # Check if the student is associated with the parent
        parent_child = await ParentChildren.filter(
            parent_id=current_parent.id,
            student_id=student_id,
            status=True
        ).first()
        if not parent_child:
            valid_students = await ParentChildren.filter(parent_id=current_parent.id, status=True).values_list("student_id", flat=True)
            return StandardResponse(
                status=False,
                message=f"You are not authorized to view questions for student ID {student_id}. Valid student IDs: {valid_students or 'None'}",
                errors={"detail": "Unauthorized access"}
            )

        # Calculate student's age
        if not student.dob:
            return StandardResponse(
                status=False,
                message="Student's date of birth is not available",
                errors={"detail": "DOB missing"}
            )

        age = calculate_age(student.dob)

        # Select questions based on age
        if 2 <= age <= 4:
            questions_list = PRESCHOOL_QUESTIONS
        elif 5 <= age <= 9:
            questions_list = SCHOOL_GOING_QUESTIONS
        elif 10 <= age <= 12:
            questions_list = PRETEEN_QUESTIONS
        else:  # age >= 13
            questions_list = TEEN_QUESTIONS

        questions = [
            {"index": idx, "question": question, "options": ["Yes", "No"]}
            for idx, question in enumerate(questions_list)
        ]
        return StandardResponse(
            status=True,
            message="Success",
            data={"questions": questions}
        )

    except Exception as e:
        return StandardResponse(
            status=False,
            message=f"An error occurred: {str(e)}",
            errors={"detail": str(e)}
        )

@router.post("/submit-nutritional-answers")
async def submit_nutritional_answers(
    batch: NutritionalAnswersBatch,
    current_parent: Any = Depends(get_current_parent)
):
    if isinstance(current_parent, StandardResponse):
        return current_parent

    try:
        # Validate that all answers belong to the same student
        student_ids = {answer.student_id for answer in batch.answers}
        if len(student_ids) > 1:
            return StandardResponse(
                status=False,
                message="All answers must belong to the same student",
                errors={"detail": "Multiple student IDs provided"}
            )

        student_id = student_ids.pop()

        # Verify the student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            return StandardResponse(
                status=False,
                message=f"Student with ID {student_id} not found",
                errors={"detail": "Student not found"}
            )

        # Fetch all valid student IDs for the parent
        valid_students = await ParentChildren.filter(parent_id=current_parent.id, status=True).values_list("student_id", flat=True)

        # Check if the student is associated with the parent
        parent_child = await ParentChildren.filter(
            parent_id=current_parent.id,
            student_id=student_id,
            status=True
        ).first()

        if not parent_child:
            return StandardResponse(
                status=False,
                message=f"You are not authorized to answer for student ID {student_id}. Valid student IDs: {valid_students or 'None'}",
                errors={"detail": "Unauthorized access"}
            )

        # Validate doctor_id consistency (allow None)
        doctor_ids = {answer.doctor_id for answer in batch.answers if answer.doctor_id is not None}
        if len(doctor_ids) > 1:
            return StandardResponse(
                status=False,
                message="All answers must be associated with the same doctor if provided",
                errors={"detail": "Multiple doctor IDs provided"}
            )

        doctor_id = doctor_ids.pop() if doctor_ids else None
        # Only validate doctor if doctor_id is provided
        if doctor_id is not None:
            doctor = await ConsultantTeam.get_or_none(id=doctor_id)
            if not doctor:
                return StandardResponse(
                    status=False,
                    message=f"Doctor with ID {doctor_id} not found",
                    errors={"detail": "Doctor not found"}
                )

        # Calculate student's age
        if not student.dob:
            return StandardResponse(
                status=False,
                message="Student's date of birth is not available",
                errors={"detail": "DOB missing"}
            )

        age = calculate_age(student.dob)

        # Select valid questions based on age
        if 2 <= age <= 4:
            valid_questions = PRESCHOOL_QUESTIONS
        elif 5 <= age <= 9:
            valid_questions = SCHOOL_GOING_QUESTIONS
        elif 10 <= age <= 12:
            valid_questions = PRETEEN_QUESTIONS
        else:  # age >= 13
            valid_questions = TEEN_QUESTIONS

        # Normalize the valid questions
        def normalize_question(question: str) -> str:
            return question.lower().replace("2-3", "2–3").strip()

        normalized_valid_questions = [normalize_question(q) for q in valid_questions]

        # Validate all questions
        invalid_questions = []
        for answer in batch.answers:
            normalized_submitted_question = normalize_question(answer.question)
            if normalized_submitted_question not in normalized_valid_questions:
                invalid_questions.append(answer.question)

        if invalid_questions:
            return StandardResponse(
                status=False,
                message="One or more questions are invalid for the student's age group",
                errors={"detail": f"Invalid questions: {invalid_questions}"}
            )

        # Save all answers in a transaction
        saved_answers = []
        async with in_transaction():
            for answer in batch.answers:
                questionnaire_answer = await QuestionariesAndAnswers.create(
                    student_id=answer.student_id,
                    question=answer.question,
                    answer=answer.answer,
                    screening_type="NUTRITIONAL",
                    doctor=answer.doctor_id,# Use 'doctor' field as per model
                    created_by=current_parent["user_id"],
                    created_user_role=current_parent["user_role"],
                    created_role_type=current_parent["role_type"]
                )
                response = QuestionariesAndAnswersResponse.from_tortoise_orm(questionnaire_answer)
                saved_answers.append(response.dict())

        return StandardResponse(
            status=True,
            message="Success",
            data={"answers": saved_answers}
        )

    except DoesNotExist:
        return StandardResponse(
            status=False,
            message="Internal database error",
            errors={"detail": "Database error"}
        )
    except Exception as e:
        return StandardResponse(
            status=False,
            message=f"An unexpected error occurred: {str(e)}",
            errors={"detail": str(e)}
        )

@router.get("/nutritional-answers-result/{student_id}")
async def get_nutritional_answers(
    student_id: int,
    current_parent: Any = Depends(get_current_parent)
):
    if isinstance(current_parent, StandardResponse):
        return current_parent

    try:
        # Verify the student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            return StandardResponse(
                status=False,
                message=f"Student with ID {student_id} not found",
                errors={"detail": "Student not found"}
            )

        # Fetch all valid student IDs for the parent
        valid_students = await ParentChildren.filter(parent_id=current_parent.id, status=True).values_list("student_id", flat=True)

        # Check if the student is associated with the parent
        parent_child = await ParentChildren.filter(
            parent_id=current_parent.id,
            student_id=student_id,
            status=True
        ).first()
        if not parent_child:
            return StandardResponse(
                status=False,
                message=f"You are not authorized to view answers for student ID {student_id}. Valid student IDs: {valid_students or 'None'}",
                errors={"detail": "Unauthorized access"}
            )

        # Fetch all nutritional answers for the student
        answers = await QuestionariesAndAnswers.filter(
            student_id=student_id,
            screening_type="NUTRITIONAL"
        ).prefetch_related("student")

        response = [QuestionariesAndAnswersResponse.from_tortoise_orm(answer).dict() for answer in answers]
        return StandardResponse(
            status=True,
            message="Success",
            data={"answers": response}
        )

    except Exception as e:
        return StandardResponse(
            status=False,
            message=f"An error occurred: {str(e)}",
            errors={"detail": str(e)}
        )