import json
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.templating import Jinja2Templates
from tortoise.transactions import in_transaction

from src.api.auth import get_current_user
from src.models.other_models import Questionnaire, StudentQuestionnaire
from src.models.screening_models import QuestionariesAndAnswers
from src.models.user_models import ConsultantTeam
from src.schemas.question_schema import (
    QuestionCreate,
    QuestionResponse,
    StudentAnswerCreate,
    StudentAnswerResponse,
)

# API router with /api/v1 prefix
api_router = APIRouter(prefix="/api/v1", tags=["Questions"])
# Root router for non-prefixed routes
root_router = APIRouter()


@api_router.post("/questions", response_model=QuestionResponse)
async def create_question(
    question_data: QuestionCreate, current_user: ConsultantTeam = Depends(get_current_user)
):
    try:
        answer_data = {
            "options": question_data.options,
            "correct": question_data.correct_option,
            "selected": "",
        }
        async with in_transaction():
            question = await QuestionariesAndAnswers.create(
                student_id=question_data.student_id,
                question=question_data.question,
                answer=json.dumps(answer_data),
                screening_type=question_data.screening_type,  # Use provided screening_type
                doctor_id=current_user.doctor_id,
            )
            # Prefetch related fields
            await question.fetch_related("student", "doctor")
        logging.info(f"Question created: {question_data.question}")
        return QuestionResponse.from_tortoise_orm(question)
    except Exception as e:
        logging.error(f"Failed to create question: {str(e)}")
        raise HTTPException(
            status_code=400, detail=f"Failed to create question: {str(e)}"
        )


@api_router.get("/questions", response_model=List[QuestionResponse])
async def get_all_questions():
    try:
        questions = (
            await QuestionariesAndAnswers.filter(deleted_at=None)
            .prefetch_related("student", "doctor")
            .all()
        )
        if not questions:
            return []
        responses = [QuestionResponse.from_tortoise_orm(q) for q in questions]
        logging.info(f"Fetched {len(questions)} questions")
        return responses
    except Exception as e:
        logging.error(f"Error fetching questions: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get(
    "/questions/answers/{student_id}", response_model=List[StudentAnswerResponse]
)
async def get_student_answers(student_id: int):
    try:
        answers = (
            await StudentQuestionnaire.filter(student_id=student_id, deleted_at=None)
            .prefetch_related("question", "student")
            .all()
        )
        if not answers:
            logging.warning(f"No answers found for student_id={student_id}")
            return []
        responses = [StudentAnswerResponse.from_tortoise_orm(a) for a in answers]
        logging.info(f"Fetched {len(answers)} answers for student_id={student_id}")
        return responses
    except Exception as e:
        logging.error(f"Error fetching student answers: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/questions/answers", response_model=StudentAnswerResponse)
async def submit_student_answer(
    answer_data: StudentAnswerCreate, current_user: ConsultantTeam = Depends(get_current_user)
):
    try:
        async with in_transaction():
            # Fetch the question
            question = await Questionnaire.filter(
                question_id=answer_data.question_id
            ).first()
            if not question:
                logging.error(f"Question with ID {answer_data.question_id} not found")
                raise HTTPException(status_code=404, detail="Question not found")

            # Create the student answer
            answer = await StudentQuestionnaire.create(
                student_id=answer_data.student_id,
                question_id=answer_data.question_id,
                answer=answer_data.answer,
                created_by=answer_data.created_by,
                updated_by=answer_data.updated_by,
            )
        # Prefetch the question relationship
        await answer.fetch_related("question")
        logging.info(
            f"Answer submitted for student_id={answer_data.student_id}, question_id={answer_data.question_id}"
        )
        return StudentAnswerResponse.from_tortoise_orm(answer)
    except Exception as e:
        logging.error(f"Failed to submit answer: {str(e)}")
        raise HTTPException(
            status_code=400, detail=f"Failed to submit answer: {str(e)}"
        )
