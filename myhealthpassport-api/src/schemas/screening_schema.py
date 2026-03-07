import json
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from pydantic.functional_validators import BeforeValidator
from pydantic.types import StringConstraints
from typing_extensions import Annotated
from typing import List, Dict, Any, Optional, Union


# Schemas
class EyeScreeningCreate(BaseModel):
    vision_left: str = Field(..., description="Left eye vision result")
    vision_right: str = Field(..., description="Right eye vision result")
    vision_results: str = Field(..., description="Overall vision assessment")
    note: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    created_by: int = Field(..., description="ID of the creator")
    updated_by: Optional[int] = None
    status: Optional[str] = Field(None, description="Eye screening status")

    @field_validator("vision_results")
    def validate_vision_results(cls, v):
        if not v or not isinstance(v, str) or len(v.strip()) == 0:
            raise ValueError("Vision results cannot be empty or invalid")
        return v

class EyeScreeningUpdate(EyeScreeningCreate):
    vision_left: Optional[str] = Field(None, description="Left eye vision result (optional for update)")
    vision_right: Optional[str] = Field(None, description="Right eye vision result (optional for update)")
    vision_results: Optional[str] = Field(None, description="Overall vision assessment (optional for update)")
    note: Optional[str] = Field(None, description="Additional notes (optional for update)")
    updated_at: Optional[datetime] = Field(default_factory=datetime.now)
    updated_by: Optional[int] = Field(None, description="ID of the updater")

    model_config = {"extra": "ignore"}

class EyeScreeningResponse(EyeScreeningCreate):
    id: int
    status: Optional[str] = Field(None, description="Eye screening status")
    model_config = {"from_attributes": True}

class ScreeningQuestionCreate(BaseModel):
    student_id: int
    question: str
    options: List[str]
    correct_option: str
    answer: Optional[str] = None
    screening_type: str
    doctor_id: Optional[int] = None

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

class QuestionariesAndAnswersCreate(BaseModel):
    student_id: int
    question: Annotated[str, StringConstraints(min_length=1, max_length=1000)]
    answer: Annotated[str, StringConstraints(min_length=1, max_length=1000)]
    screening_type: Annotated[str, StringConstraints(min_length=1, max_length=50)]
    doctor_id: Optional[int] = None

class QuestionariesAndAnswersUpdate(BaseModel):
    student_id: Optional[int] = None
    question: Optional[Annotated[str, StringConstraints(min_length=1, max_length=1000)]] = None
    answer: Optional[Annotated[str, StringConstraints(min_length=1, max_length=1000)]] = None
    screening_type: Optional[Annotated[str, StringConstraints(min_length=1, max_length=50)]] = None
    doctor_id: Optional[int] = None

class QuestionariesAndAnswersResponse(BaseModel):
    sqa_id: int
    student_id: int
    question: str
    options: List[str]
    correct_option: Optional[str]
    selected_answer: Optional[str]
    screening_type: str
    doctor_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_tortoise_orm(cls, obj):
        student_id = (
            getattr(obj.student, "student_id", obj.student_id)
            if obj.student
            else obj.student_id
        )
        doctor_id = obj.doctor  # Use 'doctor' field as per model

        if student_id is None:
            raise ValueError("Student relationship not properly loaded")

        options = ["Yes", "No"]
        correct_option = None
        selected_answer = obj.answer

        try:
            answer_data = json.loads(obj.answer)
            if answer_data.get("options"):
                options = answer_data["options"]
                correct_option = answer_data.get("correct")
                selected_answer = answer_data.get("selected", "")
        except json.JSONDecodeError:
            pass

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
        )

class NutritionScreeningCreate(BaseModel):
    student_id: int
    eyes: Optional[str] = None
    hair: Optional[str] = None
    mouth_lips: Optional[str] = None
    skin: Optional[str] = None
    nails: Optional[str] = None
    teeth: Optional[str] = None
    general_signs: Optional[str] = None
    bone_muscle: Optional[str] = None
    note: Optional[str] = None
    next_followup: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

class NutritionScreeningUpdate(NutritionScreeningCreate):
    student_id: Optional[int] = None
    doctor_id: Optional[int] = None
    eyes: Optional[str] = None
    hair: Optional[str] = None
    mouth_lips: Optional[str] = None
    skin: Optional[str] = None
    nails: Optional[str] = None
    teeth: Optional[str] = None
    general_signs: Optional[str] = None
    bone_muscle: Optional[str] = None
    note: Optional[str] = None
    next_followup: Optional[datetime] = None
    updated_at: Optional[datetime] = Field(default_factory=datetime.now)
    updated_by: Optional[int] = None

    model_config = {"extra": "ignore"}

class NutritionScreeningResponse(NutritionScreeningCreate):
    ns_id: int
    model_config = {"from_attributes": True}

class NutritionalAnswer(BaseModel):
    question: str
    answer: Annotated[str, StringConstraints(pattern="^(Yes|No)$")]
    student_id: int
    doctor_id: Optional[int] = None

class NutritionalAnswersBatch(BaseModel):
    answers: List[NutritionalAnswer] = Field(..., min_items=1)

class DevelopmentalAnswer(BaseModel):
    question: str
    answer: Annotated[str, StringConstraints(pattern="^(Yes|No)$")]
    student_id: int
    doctor_id: Optional[int] = None

class DevelopmentalAnswersBatch(BaseModel):
    answers: List[DevelopmentalAnswer] = Field(..., min_items=1)
   
class ScreeningReportsSummaryCreate(BaseModel):
    student_id: int
    screening_type: Optional[str] = "Physical Screening"
    status: Optional[str] = "Completed"
    description: Optional[str] = "Start typing..."
    good_outcomes_type: Optional[str] = "Good Outcomes/Strengths"
    good_outcomes_remarks: Optional[str] = ""
    areas_of_concern_type: Optional[str] = "Areas Of Concern/Needs Attention"
    areas_of_concern_remarks: Optional[str] = ""

class ScreeningReportsSummaryResponse(BaseModel):
    srs_id: int
    student_id: int
    screening_type: str
    status: str
    description: str
    good_outcomes_type: str
    good_outcomes_remarks: str
    areas_of_concern_type: str
    areas_of_concern_remarks: str
    created_by: int
    updated_by: int
    created_at: datetime  # Changed to datetime
    updated_at: datetime  # Changed to datetime

    class Config:
        from_attributes = True
   
   
# dental screening

class ToothSelection(BaseModel):
    tooth_numbers: List[int] = Field(default_factory=list, description="List of tooth numbers selected (e.g., [27, 47])")
    remarks: Optional[str] = Field(default="", description="Remarks for the selected teeth")
    
class DentalPrescriptionRequest(BaseModel):
    student_id: int = Field(..., description="ID of the student")
    consultant_user_id: int = Field(..., description="ID of the consultant user")
    patient_concern: List[str] = Field(default_factory=list, description="Selected patient concerns")
    oral_examination: List[ToothSelection] = Field(default_factory=list, description="Oral examination findings with tooth selection and remarks")
    diagnosis: List[str] = Field(default_factory=list, description="Selected diagnosis options")
    treatment_recommendations: List[str] = Field(default_factory=list, description="Selected treatment recommendations")
    next_followup: Optional[str] = Field(default="", description="Next followup date or note")

class DentalScreeningRequest(BaseModel):
    student_id: int = Field(..., description="ID of the student")
    screening_user_id: int = Field(..., description="ID of the screening user")
    patient_concern: List[str] = Field(default_factory=list, description="Selected patient concerns")
    oral_examination: List[ToothSelection] = Field(default_factory=list, description="Oral examination findings with tooth selection and remarks")
    examination_note: Optional[str] = Field(default="", description="Additional examination notes")
    diagnosis: List[str] = Field(default_factory=list, description="Selected diagnosis options")
    treatment_recommendations: List[str] = Field(default_factory=list, description="Selected treatment recommendations")
    report_summary: Optional[str] = Field(default="", description="Summary of the report")
    next_followup: Optional[str] = Field(default="", description="Next followup date or note")
    treatment_recommendations_note: Optional[str] = Field(default="", description="Additional notes for treatment recommendations")
    status: Optional[str] = Field(default=None, description="Status of the dental screening (e.g., pending, completed)")

class DentalScreeningUpdateRequest(BaseModel):
    patient_concern: List[str] = Field(default_factory=list, description="Selected patient concerns")
    oral_examination: List[ToothSelection] = Field(default_factory=list, description="Oral examination findings with tooth selection and remarks")
    examination_note: Optional[str] = Field(default="", description="Additional examination notes")
    diagnosis: List[str] = Field(default_factory=list, description="Selected diagnosis options")
    treatment_recommendations: List[str] = Field(default_factory=list, description="Selected treatment recommendations")
    report_summary: Optional[str] = Field(default="", description="Summary of the report")
    next_followup: Optional[str] = Field(default="", description="Next followup date or note")
    treatment_recommendations_note: Optional[str] = Field(default="", description="Additional notes for treatment recommendations")
    status: Optional[str] = Field(default=None, description="Status of the dental screening (e.g., pending, completed)")

class DentalScreeningResponse(BaseModel):
    ds_id: int
    student_id: int
    screening_user_id: int
    patient_concern: str  # JSON string
    oral_examination: str  # JSON string
    examination_note: str
    diagnosis: str  # JSON string
    treatment_recommendations: str  # JSON string
    report_summary: str
    next_followup: str
    treatment_recommendations_note: str
    status: Optional[str]
    created_at: datetime
    updated_at: datetime
       
class VisionResult(BaseModel):
    sph: str
    cyl: str
    axis: str
    vision_acuity: Optional[str] = ""

class EyeScreeningRequest(BaseModel):
    student_id: int = Field(..., description="ID of the student")
    screening_user_id: int = Field(..., description="ID of the screening user")
    patient_concern: List[str] = Field(default_factory=list, description="List of patient concerns")
    vision_lefteye_res: VisionResult = Field(..., description="Result of vision test for left eye")
    vision_righteye_res: VisionResult = Field(..., description="Result of vision test for right eye")
    additional_find: Optional[str] = Field(default="", description="Any additional findings")
    report_summary: Optional[str] = Field(default="", description="Report summary")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations based on screening")
    next_followup: Optional[str] = Field(default="", description="Suggested date or note for follow-up")
    status: Optional[str] = Field(default=None, description="Status of the eye screening (e.g., pending, completed)")

class EyeScreeningResponse(BaseModel):
    es_id: int
    student_id: int
    screening_user_id: int
    patient_concern: List[str]
    vision_lefteye_res: VisionResult
    vision_righteye_res: VisionResult
    additional_find: str
    report_summary: str
    recommendations: List[str]
    next_followup: str
    status: Optional[str]
    created_at: str
    updated_at: str

class CreateEyePresciption(BaseModel):
    student_id: int = Field(..., description="ID of the student")
    consultant_user_id: int = Field(..., description="ID of the consultant user")
    patient_concern: List[str] = Field(default_factory=list, description="Selected patient concerns")
    vision_lefteye_res: VisionResult = Field(..., description="Result of vision test for left eye")
    vision_righteye_res: VisionResult = Field(..., description="Result of vision test for right eye")
    additional_findings: List[str] = Field(default_factory=list, description="Selected finding options")
    treatment_recommendations: List[str] = Field(default_factory=list, description="Selected treatment recommendations")
    next_followup: Optional[str] = Field(default="", description="Next followup date or note")

class CreatePsychologistPresciption(BaseModel):
    student_id: int = Field(..., description="ID of the student")
    consultant_user_id: int = Field(..., description="ID of the consultant user")
    patient_concern: List[str] = Field(default_factory=list, description="Selected patient concerns")
    findings: List[str] = Field(default_factory=list, description="Selected finding options")
    treatment_recommendations: List[str] = Field(default_factory=list, description="Selected treatment recommendations")
    next_followup: Optional[str] = Field(default="", description="Next followup date or note")

class CreatePediatricianPresciption(BaseModel):
    student_id: int = Field(..., description="ID of the student")
    consultant_user_id: int = Field(..., description="ID of the consultant user")
    patient_concern: List[str] = Field(default_factory=list, description="Selected patient concerns")
    findings: List[str] = Field(default_factory=list, description="Selected finding options")
    treatment_recommendations: List[str] = Field(default_factory=list, description="Selected treatment recommendations")
    next_followup: Optional[str] = Field(default="", description="Next followup date or note")

# nutritional , emotional and  developmental screening
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class StudentInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    class_room: str

class QuestionResponse(BaseModel):
    question_id: int
    question_text: str
    question_type: str
    sub_domain: Optional[str]
    # options: List[str]
    score_type: str
    answer: Optional[Union[int, str]] = None
    

class QuestionListResponse(BaseModel):
    notes: Optional[str] = None
    questions: List[QuestionResponse]
    student: StudentInfo
    health_score_count: int
    academic_year: Optional[str] = None

class AnswerRequest(BaseModel):
    student_id: int
    question_id: int
    answer: str

class AnswerBatchRequest(BaseModel):
    notes: Optional[str] = None
    answers: List[AnswerRequest]

class AnswerResponse(BaseModel):
    student_id: int
    question_id: int
    question_text: str
    answer: str
    score_type: str
    created_at: str  # ISO 8601 string
    updated_at: str  # ISO 8601 string

    class Config:
        from_attributes  = True

class AnswerListResponse(BaseModel):
    notes: Optional[str] = None
    answers: List[AnswerResponse]
    