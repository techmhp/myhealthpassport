import json
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, constr, field_validator


class QuestionCreate(BaseModel):
    student_id: int
    question: constr(min_length=1, max_length=1000)
    options: List[str]
    correct_option: str
    screening_type: str = "General"

    @field_validator("options")
    def validate_options(cls, v):
        if len(v) < 2:
            raise ValueError("At least two options are required")
        return v

    @field_validator("correct_option")
    def validate_correct_option(cls, v, values):
        if "options" in values.data and v not in values.data["options"]:
            raise ValueError("Correct option must be one of the provided options")
        return v


class QuestionResponse(BaseModel):
    sqa_id: int
    student_id: int
    question: str
    options: List[str]
    correct_option: Optional[str]
    selected_answer: Optional[str]
    screening_type: str
    doctor_id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]

    class Config:
        from_attributes = True

    @classmethod
    def from_tortoise_orm(cls, obj):
        # Extract student_id and doctor_id from related fields
        student_id = (
            getattr(obj.student, "student_id", obj.student_id)
            if obj.student
            else obj.student_id
        )
        doctor_id = (
            getattr(obj.doctor, "doctor_id", obj.doctor_id)
            if obj.doctor
            else obj.doctor_id
        )
        if student_id is None or doctor_id is None:
            raise ValueError("Student or doctor relationship not properly loaded")

        # Default options and answer fields
        options = ["Yes", "No"]
        correct_option = None
        selected_answer = None

        # add here example schema in ach scehma
        # seee example

        # Parse JSON answer field
        try:
            answer_data = json.loads(obj.answer)
            if answer_data.get("options"):
                options = answer_data["options"]
                correct_option = answer_data.get("correct")
                selected_answer = answer_data.get("selected", "")
        except json.JSONDecodeError:
            logging.error(f"Invalid JSON in answer field for sqa_id={obj.sqa_id}")

        return cls(
            sqa_id=obj.sqa_id,
            student_id=student_id,
            question=obj.question,
            options=options,
            correct_option=correct_option,
            selected_answer=selected_answer,
            screening_type=obj.screening_type,
            doctor_id=doctor_id,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
            deleted_at=obj.deleted_at,
        )


class StudentAnswerCreate(BaseModel):
    student_id: int
    question_id: int
    answer: constr(min_length=1, max_length=1000)
    created_by: int
    updated_by: int


class StudentAnswerResponse(BaseModel):
    sq_id: int
    student_id: int
    question_id: int
    question_text: str
    answer: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]

    class Config:
        from_attributes = True

    @classmethod
    def from_tortoise_orm(cls, obj):
        return cls(
            sq_id=obj.sq_id,
            student_id=obj.student_id,
            question_id=obj.question.question_id,
            question_text=obj.question.question,
            answer=obj.answer,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
            deleted_at=obj.deleted_at,
        )
