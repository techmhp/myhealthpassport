from datetime import date
from typing import Any, Dict

from fastapi import APIRouter, Depends
from tortoise.exceptions import DoesNotExist


from src.core.manager import get_current_user
from src.models.screening_models import QuestionariesAndAnswers
from src.models.student_models import SchoolStudents, Students
from src.models.user_models import ConsultantTeam, SchoolStaff
from src.schemas.screening_schema import NutritionalAnswersBatch, QuestionariesAndAnswersResponse
from src.utils.response import StandardResponse

# Define nutritional questions for preschoolers (2–5 years)
NUTRITIONAL_QUESTIONS = [
    "Does the child frequently ask for food before the scheduled break?",
    "Does the child regularly finish all or most of the food in their tiffin box?",
    "Does the child’s tiffin box include a variety of foods like fruits, vegetables, or proteins?",
    "Does the child drink water without needing frequent reminders?",
    "Does the child complain about stomach pain or other physical discomfort during the day?",
    "Does the child fall sick frequently and miss school?",
    "Does the child appear tired or low-energy during the school day?",
    "Does the child regularly share their food with peers during meal times?",
    "Does the child eat independently without needing assistance or prompting?",
    "Does the child prefer specific foods in their tiffin while avoiding others?",
    "Is the child willing to try new foods during activities or events?",
    "Is the child active and enthusiastic during playtime or physical activities?",
    "Does the child enjoy sitting and eating with peers during breaks?",
    "Does the child exhibit any unusual eating behaviors (e.g., playing with food, hoarding food, keeping food in the mouth without swallowing, eating non food items like paper)?",
]

router = APIRouter()

# Function to calculate age
def calculate_age(dob: date) -> int:
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return age

# Authentication dependency for teachers
async def get_current_teacher(user: Any = Depends(get_current_user)):
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
        if user["role_type"].strip().upper() != "SCHOOL_STAFF":
            return StandardResponse(
                status=False,
                message="Only school staff can answer the nutritional questionnaire",
                errors={"detail": f"Invalid role_type: {user['role_type']}"}
            )
        teacher = await SchoolStaff.get_or_none(id=user["user_id"])
        if not teacher:
            return StandardResponse(
                status=False,
                message="Teacher not found",
                errors={"detail": f"No teacher found for user_id: {user['user_id']}"}
            )
        return teacher

    if not isinstance(user, SchoolStaff):
        return StandardResponse(
            status=False,
            message="Invalid user type",
            errors={"detail": f"Expected SchoolStaff instance, got type {type(user)}"}
        )

    if user.role_type.strip().upper() != "SCHOOL_STAFF":
        return StandardResponse(
            status=False,
            message="Only school staff can answer the nutritional questionnaire",
            errors={"detail": f"Invalid role_type: {user.role_type}"}
        )

    return user

# Reused response helpers
def success_response(data: Any) -> StandardResponse:
    return StandardResponse(status=True, message="Success", data=data)

def error_response(message: str, errors: Dict[str, Any] = None) -> StandardResponse:
    return StandardResponse(status=False, message=message, errors=errors or {})

@router.get("/pre-teacher-nutritional-questions/{student_id}")
async def get_nutritional_questions(
    student_id: int,
    current_teacher: Any = Depends(get_current_teacher)
):
    """
    Retrieve nutritional questions for a specific student (ages 2–5) for teachers.
    """
    if isinstance(current_teacher, StandardResponse):
        return current_teacher

    try:
        # Verify the student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            return error_response(f"Student with ID {student_id} not found", {"detail": "Student not found"})

        # Check if the student is associated with the teacher's school
        if not current_teacher.school_id:
            return error_response(
                "Teacher is not associated with any school",
                {"detail": "Teacher has no school_id"}
            )

        # Query SchoolStudents to verify the student is in the teacher's school
        school_student = await SchoolStudents.filter(
            student_id=student_id,
            school_id=current_teacher.school_id,
            status=True
        ).first()
        if not school_student:
            return error_response(
                f"You are not authorized to view questions for student ID {student_id}.",
                {"detail": "Student not in teacher's school"}
            )

        # Calculate student's age
        if not student.dob:
            return error_response("Student's date of birth is not available", {"detail": "DOB missing"})

        age = calculate_age(student.dob)

        # Restrict to preschoolers (ages 2–5)
        if not (2 <= age <= 5):
            return error_response(
                "Nutritional questionnaire is only available for students aged 2–5",
                {"detail": f"Student age {age} not supported"}
            )

        questions = [
            {"index": idx, "question": question, "options": ["Yes", "No"]}
            for idx, question in enumerate(NUTRITIONAL_QUESTIONS)
        ]
        return success_response({"questions": questions})

    except Exception as e:
        return error_response(f"An error occurred: {str(e)}", {"detail": str(e)})

@router.get("/pre-teacher-nutritional-answers/{student_id}")
async def get_nutritional_answers(
    student_id: int,
    current_teacher: Any = Depends(get_current_teacher)
):
    """
    Retrieve all nutritional questionnaire answers for a specific student.
    """
    if isinstance(current_teacher, StandardResponse):
        return current_teacher

    try:
        # Verify the student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            return error_response(f"Student with ID {student_id} not found", {"detail": "Student not found"})

        # Check if the student is associated with the teacher's school
        if not current_teacher.school_id:
            return error_response(
                "Teacher is not associated with any school",
                {"detail": "Teacher has no school_id"}
            )

        # Query SchoolStudents to verify the student is in the teacher's school
        school_student = await SchoolStudents.filter(
            student_id=student_id,
            school_id=current_teacher.school_id,
            status=True
        ).first()
        if not school_student:
            return error_response(
                f"You are not authorized to view answers for student ID {student_id}.",
                {"detail": "Student not in teacher's school"}
            )

        # Fetch all nutritional answers for the student
        answers = await QuestionariesAndAnswers.filter(
            student_id=student_id,
            screening_type="NUTRITIONAL"
        ).prefetch_related("student")

        response = [QuestionariesAndAnswersResponse.from_tortoise_orm(answer).dict() for answer in answers]
        return success_response({"answers": response})

    except Exception as e:
        return error_response(f"An error occurred: {str(e)}", {"detail": str(e)})

@router.post("/pre-teacher-submit-nutritional-batch-answers")
async def submit_nutritional_batch_answers(
    batch_answer: NutritionalAnswersBatch,
    current_teacher: Any = Depends(get_current_teacher)
):
    """
    Submit multiple nutritional questionnaire answers for a specific student in a single request.
    """
    if isinstance(current_teacher, StandardResponse):
        return current_teacher

    try:
        if not batch_answer.answers:
            return error_response("No answers provided", {"detail": "Empty answers list"})

        # Verify that all answers are for the same student
        student_ids = {answer.student_id for answer in batch_answer.answers}
        if len(student_ids) > 1:
            return error_response("All answers must be for the same student", {"detail": "Multiple student IDs provided"})

        student_id = student_ids.pop()

        # Verify the student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            return error_response(f"Student with ID {student_id} not found", {"detail": "Student not found"})

        # Check if the student is associated with the teacher's school
        if not current_teacher.school_id:
            return error_response(
                "Teacher is not associated with any school",
                {"detail": "Teacher has no school_id"}
            )

        # Query SchoolStudents to verify the student is in the teacher's school
        school_student = await SchoolStudents.filter(
            student_id=student_id,
            school_id=current_teacher.school_id,
            status=True
        ).first()
        if not school_student:
            return error_response(
                f"You are not authorized to answer for student ID {student_id}.",
                {"detail": "Student not in teacher's school"}
            )

        # Validate doctor_id consistency (allow None)
        doctor_ids = {answer.doctor_id for answer in batch_answer.answers if answer.doctor_id is not None}
        if len(doctor_ids) > 1:
            return error_response(
                "All answers must be associated with the same doctor if provided",
                {"detail": "Multiple doctor IDs provided"}
            )

        doctor_id = doctor_ids.pop() if doctor_ids else None
        # Only validate doctor if doctor_id is provided
        if doctor_id is not None:
            doctor = await ConsultantTeam.get_or_none(id=doctor_id)
            if not doctor:
                return error_response(f"Doctor with ID {doctor_id} not found", {"detail": "Doctor not found"})

        # Calculate student's age
        if not student.dob:
            return error_response("Student's date of birth is not available", {"detail": "DOB missing"})

        age = calculate_age(student.dob)

        # Restrict to preschoolers (ages 2–5)
        if not (2 <= age <= 5):
            return error_response(
                "Nutritional questionnaire is only available for students aged 2–5",
                {"detail": f"Student age {age} not supported"}
            )

        # Normalize valid questions
        def normalize_question(question: str) -> str:
            return question.lower().strip()

        normalized_valid_questions = [normalize_question(q) for q in NUTRITIONAL_QUESTIONS]

        # Validate and save each answer
        saved_answers = []
        invalid_questions = []

        for answer in batch_answer.answers:
            normalized_submitted_question = normalize_question(answer.question)

            # Verify the question is valid
            if normalized_submitted_question not in normalized_valid_questions:
                invalid_questions.append(answer.question)
                continue

            # Save the answer to the database
            questionnaire_answer = await QuestionariesAndAnswers.create(
                student_id=answer.student_id,
                question=answer.question,
                answer=answer.answer,
                screening_type="NUTRITIONAL",
                doctor=answer.doctor_id,
                created_by=current_teacher.user_id,
                created_user_role=current_teacher.user_role,
                created_role_type=current_teacher.role_type
            )
            saved_answers.append(QuestionariesAndAnswersResponse.from_tortoise_orm(questionnaire_answer).dict())

        if invalid_questions:
            return error_response(
                "Some questions are invalid for the nutritional questionnaire",
                {"detail": f"Invalid questions: {invalid_questions}"}
            )

        return success_response({"saved_answers": saved_answers})

    except DoesNotExist:
        return error_response("Internal database error", {"detail": "Database error"})
    except Exception as e:
        return error_response(f"An unexpected error occurred: {str(e)}", {"detail": str(e)})
    