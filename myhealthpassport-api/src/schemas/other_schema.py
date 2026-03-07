from datetime import datetime, time, date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, constr, field_validator
from pydantic import BaseModel, field_validator

from zoneinfo import ZoneInfo

class ContactTranscriptionsCreate(BaseModel):
    student_id: int
    contact_number: int
    parent_id: int
    audio_file: constr(min_length=1, max_length=200)  # URL or path
    transcription_text: Optional[constr(min_length=1, max_length=1000)] = None
    status: bool
    created_by: int
    updated_by: int

    @field_validator("contact_number")
    def validate_contact_number(cls, v):
        if not 1000000000 <= v <= 9999999999:
            raise ValueError("Contact number must be a 10-digit number")
        return v


class ContactTranscriptionsUpdate(BaseModel):
    student_id: Optional[int] = None
    contact_number: Optional[int] = None
    parent_id: Optional[int] = None
    audio_file: Optional[constr(min_length=1, max_length=200)] = None
    transcription_text: Optional[constr(min_length=1, max_length=1000)] = None
    status: Optional[bool] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

    @field_validator("contact_number")
    def validate_contact_number(cls, v):
        if v is not None:
            if not 1000000000 <= v <= 9999999999:
                raise ValueError("Contact number must be a 10-digit number")
        return v


class LabTestsCreate(BaseModel):
    test_name: constr(min_length=1, max_length=400)
    description: Optional[constr(min_length=1, max_length=1000)] = None
    price: Decimal
    status: int

    @field_validator("price")
    def validate_price(cls, v: Decimal):
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        if v > Decimal("99999999.99"):
            raise ValueError("Price exceeds maximum allowed value")
        return v

    @field_validator("status")
    def validate_status(cls, v: int):
        valid_statuses = [0, 1, 2]  # 0=Inactive, 1=Active, 2=Other
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of {valid_statuses}")
        return v


class LabTestsUpdate(BaseModel):
    test_name: Optional[constr(min_length=1, max_length=400)] = None
    description: Optional[constr(min_length=1, max_length=1000)] = None
    price: Optional[Decimal] = None
    status: Optional[int] = None

    @field_validator("price")
    def validate_price(cls, v: Optional[Decimal]):
        if v is not None:
            if v <= 0:
                raise ValueError("Price must be greater than 0")
            if v > Decimal("99999999.99"):
                raise ValueError("Price exceeds maximum allowed value")
        return v

    @field_validator("status")
    def validate_status(cls, v: Optional[int]):
        if v is not None:
            valid_statuses = [0, 1, 2]
            if v not in valid_statuses:
                raise ValueError(f"Status must be one of {valid_statuses}")
        return v

class MobileOtpCreate(BaseModel):
    mobile: constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    otp: int
    expire: int

    @field_validator("otp")
    def validate_otp(cls, v):
        if not 1000 <= v <= 9999:
            raise ValueError("OTP must be a 4-digit number")
        return v

    @field_validator("expire")
    def validate_expire(cls, v):
        if v <= int(datetime.now().timestamp()):
            raise ValueError("Expiration timestamp must be in the future")
        return v


class MobileOtpUpdate(BaseModel):
    mobile: Optional[
        constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    ] = None
    otp: Optional[int] = None
    expire: Optional[int] = None

    @field_validator("otp")
    def validate_otp(cls, v):
        if v is not None:
            if not 1000 <= v <= 9999:
                raise ValueError("OTP must be a 4-digit number")
        return v

    @field_validator("expire")
    def validate_expire(cls, v):
        if v is not None:
            if v <= int(datetime.now().timestamp()):
                raise ValueError("Expiration timestamp must be in the future")
        return v


class QuestionnaireCreate(BaseModel):
    question: constr(min_length=1, max_length=400)
    type: constr(min_length=1, max_length=100)
    sub_type: Optional[constr(min_length=1, max_length=100)] = None
    status: bool


class QuestionnaireUpdate(BaseModel):
    question: Optional[constr(min_length=1, max_length=400)] = None
    type: Optional[constr(min_length=1, max_length=100)] = None
    sub_type: Optional[constr(min_length=1, max_length=100)] = None
    status: Optional[bool] = None


class StudentLabTestReportsCreate(BaseModel):
    test_id: int
    student_id: int
    price: Optional[Decimal] = None
    note: Optional[constr(min_length=1, max_length=1000)] = None
    status: bool

    @field_validator("price")
    def validate_price(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError("Price must be greater than 0")
            if v > 99999999.99:
                raise ValueError("Price exceeds maximum allowed value")
        return v


class StudentLabTestReportsUpdate(BaseModel):
    test_id: Optional[int] = None
    student_id: Optional[int] = None
    price: Optional[Decimal] = None
    note: Optional[constr(min_length=1, max_length=1000)] = None
    status: Optional[bool] = None

    @field_validator("price")
    def validate_price(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError("Price must be greater than 0")
            if v > 99999999.99:
                raise ValueError("Price exceeds maximum allowed value")
        return v


class StudentQuestionnaireCreate(BaseModel):
    question_id: int
    student_id: int
    answer: constr(min_length=1, max_length=1000)
    created_by: Optional[int] = None
    updated_by: Optional[int] = None


class StudentQuestionnaireUpdate(BaseModel):
    question_id: Optional[int] = None
    student_id: Optional[int] = None
    answer: Optional[constr(min_length=1, max_length=1000)] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None


class StudentVaccinationCreate(BaseModel):
    student_id: int
    vaccine_id: int
    status: bool


class StudentVaccinationUpdate(BaseModel):
    student_id: Optional[int] = None
    vaccine_id: Optional[int] = None
    status: Optional[bool] = None


class VaccinationsCreate(BaseModel):
    vaccine_name: constr(min_length=1, max_length=200)
    age: constr(min_length=1, max_length=50)


class VaccinationsUpdate(BaseModel):
    vaccine_name: Optional[constr(min_length=1, max_length=200)] = None
    age: Optional[constr(min_length=1, max_length=50)] = None


class ContactTranscriptionsResponse(BaseModel):
    transcript_id: int
    student_id: int
    contact_number: int
    parent_id: int
    audio_file: str
    transcription_text: Optional[str]
    status: bool
    created_by: int
    updated_by: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]


class LabTestsResponse(BaseModel):
    test_id: int
    test_name: str
    description: Optional[str]
    price: Decimal
    status: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]


class MobileOtpResponse(BaseModel):
    id: int
    mobile: str
    otp: int
    expire: int
    created_at: datetime
    updated_at: datetime


class QuestionnaireResponse(BaseModel):
    question_id: int
    question: str
    type: str
    sub_type: Optional[str]
    status: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]


class StudentLabTestReportsResponse(BaseModel):
    slt_id: int
    test_id: int
    test_name: str
    student_id: int
    file_path: str
    price: Optional[Decimal]
    note: Optional[str]
    status: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]


class StudentQuestionnaireResponse(BaseModel):
    sq_id: int
    question_id: int
    student_id: int
    answer: str
    created_by: Optional[int]
    updated_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]


class StudentVaccinationResponse(BaseModel):
    sv_id: int
    student_id: int
    vaccine_id: int
    status: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]


class VaccinationsResponse(BaseModel):
    vaccine_id: int
    vaccine_name: str
    age: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]

# class LabTestBookingRequest(BaseModel):
#     patient_id: int
#     test_id: int
#     doctor_id: int 
#     slot_date: date
#     slot_time: time
#     consult_fee: Decimal
#     tx_id: int

#     @field_validator("consult_fee")
#     def validate_consult_fee(cls, v):
#         if v <= 0:
#             raise ValueError("Consultation fee must be greater than 0")
#         if v > 99999999.99:
#             raise ValueError("Consultation fee exceeds maximum allowed value")
#         return v

# class LabTestBookingRequest(BaseModel):
#     patient_id: int
#     test_id: int
#     doctor_id: int
#     slot_date: date
#     slot_time: str  # Input as HH:MM string
#     consult_fee: Decimal
#     tx_id: int

#     @field_validator("consult_fee")
#     def validate_consult_fee(cls, v):
#         if v <= 0:
#             raise ValueError("Consultation fee must be greater than 0")
#         if v > 99999999.99:
#             raise ValueError("Consultation fee exceeds maximum allowed value")
#         return v

#     @field_validator("slot_date")
#     def validate_slot_date(cls, v):
#         if v < date.today():
#             raise ValueError("Slot date cannot be in the past")
#         return v

#     @field_validator("slot_time")
#     def parse_slot_time(cls, v):
#         if isinstance(v, str):
#             try:
#                 # Parse string in HH:MM format
#                 parsed_time = datetime.strptime(v, "%H:%M").time()
#                 return parsed_time.replace(tzinfo=ZoneInfo("UTC"))
#             except ValueError:
#                 raise ValueError("slot_time must be in HH:MM format")
#         return v.replace(tzinfo=ZoneInfo("UTC")) if isinstance(v, time) else v
   

class LabTestBookingRequest(BaseModel):
    patient_id: int
    test_id: int
    doctor_id: int
    slot_date: date
    slot_time: str
    consult_fee: Decimal
    tx_id: int

    @field_validator("consult_fee")
    def validate_consult_fee(cls, v):
        if v <= 0:
            raise ValueError("Consultation fee must be greater than 0")
        if v > 99999999.99:
            raise ValueError("Consultation fee exceeds maximum allowed value")
        return v

    @field_validator("slot_date")
    def validate_slot_date(cls, v):
        if v < date.today():
            raise ValueError("Slot date cannot be in the past")
        return v

    @field_validator("slot_time")
    def parse_slot_time(cls, v):
        if isinstance(v, str):
            try:
                parsed_time = datetime.strptime(v, "%H:%M").time()
                return parsed_time.replace(tzinfo=ZoneInfo("UTC"))
            except ValueError:
                raise ValueError("slot_time must be in HH:MM format")
        return v.replace(tzinfo=ZoneInfo("UTC")) if isinstance(v, time) else v
     
class DummyTransactionRequest(BaseModel):
    tx_type: constr(min_length=1, max_length=50)