from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class IdentityDetails(BaseModel):
    aadhaar_no: str = Field(alias="aadhaar_no")
    mp_uhid: str
    abha_id: str
    class_room: str
    section: str
    roll_no: str = Field(alias="roll_no")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "aadhaar_no": "125000000000",
                    "mp_uhid": "123123",
                    "abha_id": "123000000000",
                    "class_room": 9, # Updated example to use class_room and reflect int type
                    "section": "A",
                    "roll_no": "120-199-20"
                }
            ]
        },
        "populate_by_name": True # Allows population by field name or alias
    }

class FoodPreferences(BaseModel):
    food_preferences: str = Field(alias="food_preferences")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "food_preferences": "VEGETARIAN"
                }
            ]
        },
        "populate_by_name": True
    }

class AddressDetails(BaseModel):
    address_line1: str = Field(alias="address_line1")
    address_line2: str = Field(alias="address_line2")
    landmark: Optional[str] = ""
    street: Optional[str] = ""
    state: str
    country: str
    pincode: str
    country_code: str = Field(alias="country_code")
    phone: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "address_line1": "H-NO-1-2-112",
                    "address_line2": "ABIDS, HYDERABAD",
                    "landmark": "AHUJA ESTATE ",
                    "state": "TELANGANA",
                    "country": "INDIA",
                    "pincode": "505301",
                    "country_code": "91",
                    "phone": "7842838906"
                }
            ]
        },
        "populate_by_name": True
    }

class StudentDetails(BaseModel):
    id: int
    image: Optional[str] = ""
    first_name: str = Field(alias="first_name")
    middle_name: Optional[str] = Field(alias="middle_name", default=None)
    last_name: str = Field(alias="last_name")
    gender: str
    blood_group: str = Field(alias="blood_group")
    dob: date
    identity_details: IdentityDetails = Field(alias="identity_details")
    food: FoodPreferences
    address_details: AddressDetails = Field(alias="address_details")
    profile_image: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "image": "",
                    "first_name": "AKHIL",
                    "middle_name": "-",
                    "last_name": "BOLLA",
                    "gender": "MALE",
                    "blood_group": "O+",
                    "age": "12", # Added age to example
                    "dob": "1992-02-17",
                    "identity_details": IdentityDetails.model_config["json_schema_extra"]["examples"][0],
                    "food": FoodPreferences.model_config["json_schema_extra"]["examples"][0],
                    "address_details": AddressDetails.model_config["json_schema_extra"]["examples"][0]
                }
            ]
        },
        "populate_by_name": True
    }

class ParentDetail(BaseModel):
    id: int = Field(alias="id")
    primary_first_name: str = Field(alias="primary_first_name")
    primary_middle_name: Optional[str] = Field(alias="primary_middle_name", default=None)
    primary_last_name: Optional[str] = Field(alias="primary_last_name", default=None)
    primary_country_calling_code: Optional[str] = Field(alias="primary_country_calling_code", default=None)
    primary_mobile: str
    primary_email: str
    secondary_first_name: str = Field(alias="secondary_first_name")
    secondary_middle_name: Optional[str] = Field(alias="secondary_middle_name", default=None)
    secondary_last_name: Optional[str] = Field(alias="secondary_last_name", default=None)
    secondary_country_calling_code: Optional[str] = Field(alias="secondary_country_calling_code", default=None)
    secondary_mobile: str
    secondary_email: str



class StudentData(BaseModel):
    student_details: StudentDetails = Field(alias="student_details")
    parent_details: ParentDetail = Field(alias="parent_details")


class VaccineStatusUpdateItem(BaseModel):
    sv_id: int = Field(..., description="The ID of the student vaccination record (StudentVaccination.sv_id).")
    status: bool = Field(..., description="The new vaccination status (True for vaccinated, False for not vaccinated).")

class VaccineStatusUpdateRequest(BaseModel):
    vaccine_data: List[VaccineStatusUpdateItem] = Field(..., description="A list of vaccine status updates.")

# Pydantic model for the response data items
class StudentQuestionResponseItem(BaseModel):
    sq_id: int
    answer: str
    question_id: int
    question_text: str
    question_type: str
    question_sub_type: str
    question_group: str

class StudentDevelopmentalQuestionsData(BaseModel):
    questions: List[StudentQuestionResponseItem]


class DevelopmentalAnswerItem(BaseModel):
    """
    Represents a single answer item with a student questionnaire ID and the answer itself.
    """
    sq_id: int = Field(..., description="The unique identifier for the student questionnaire entry.")
    answer: str = Field(..., description="The answer provided by the student/user.")

class DevelopmentalQuestionnaireAnswers(BaseModel):
    """
    Represents a list of answers for a questionnaire.
    """
    answers: List[DevelopmentalAnswerItem] = Field(..., description="A list of answer items.")