from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, constr, field_validator


class StudentCreate(BaseModel):
    first_name: constr(
        min_length=1, max_length=50, pattern=r"^[a-zA-Z\s]+$"
    )  # Letters and spaces only
    middle_name: Optional[
        constr(min_length=0, max_length=50, pattern=r"^[a-zA-Z\s.]*$")
    ] = None  # Allow periods
    last_name: constr(
        min_length=1, max_length=50, pattern=r"^[a-zA-Z\s]+$"
    )  # Letters and spaces only
    gender: constr(min_length=1, max_length=10)  # e.g., 'MALE', 'FEMALE', 'OTHER'
    dob: date
    klass: int
    section: constr(min_length=1, max_length=10)  # e.g., 'A', 'B'
    roll_no: constr(min_length=1, max_length=20)
    aadhaar_no: constr(
        min_length=12, max_length=12, pattern=r"^\d{12}$"
    )  # 12-digit number
    abha_id: constr(min_length=1, max_length=20)
    mp_uhid: Optional[constr(min_length=0, max_length=50)] = None
    food_preferences: Optional[constr(min_length=0, max_length=200)] = None
    address_line1: constr(min_length=1, max_length=200)
    address_line2: Optional[constr(min_length=0, max_length=200)] = None
    landmark: Optional[constr(min_length=0, max_length=100)] = None
    street: constr(min_length=1, max_length=100)
    state: constr(min_length=1, max_length=100)
    pincode: int
    country_code: constr(min_length=1, max_length=10)  # e.g., '+91'
    phone: constr(
        min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$"
    )  # Phone number format
    country: constr(min_length=1, max_length=100)
    blood_group: Optional[constr(min_length=0, max_length=10)] = (
        None  # e.g., 'A+', 'O-'
    )
    profile_image: Optional[constr(min_length=0, max_length=200)] = None  # URL or path

    @field_validator("gender")
    def validate_gender(cls, v):
        valid_genders = ["MALE", "FEMALE", "OTHER"]
        if v.upper() not in valid_genders:
            raise ValueError(f"Gender must be one of {valid_genders}")
        return v.upper()

    @field_validator("klass")
    def validate_klass(cls, v):
        if not 1 <= v <= 12:
            raise ValueError("Class must be between 1 and 12")
        return v

    @field_validator("pincode")
    def validate_pincode(cls, v):
        if not 100000 <= v <= 999999:
            raise ValueError("Pincode must be a 6-digit number")
        return v

    @field_validator("blood_group")
    def validate_blood_group(cls, v):
        if v is not None and v != "":
            valid_blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
            if v.upper() not in valid_blood_groups:
                raise ValueError(f"Blood group must be one of {valid_blood_groups}")
            return v.upper()
        return v


class StudentUpdate(BaseModel):
    first_name: Optional[
        constr(min_length=1, max_length=50, pattern=r"^[a-zA-Z\s]+$")
    ] = None
    middle_name: Optional[
        constr(min_length=0, max_length=50, pattern=r"^[a-zA-Z\s.]*$")
    ] = None  # Allow periods
    last_name: Optional[
        constr(min_length=1, max_length=50, pattern=r"^[a-zA-Z\s]+$")
    ] = None
    gender: Optional[constr(min_length=1, max_length=10)] = None
    dob: Optional[date] = None
    klass: Optional[int] = None
    section: Optional[constr(min_length=1, max_length=10)] = None
    roll_no: Optional[constr(min_length=1, max_length=20)] = None
    aadhaar_no: Optional[constr(min_length=12, max_length=12, pattern=r"^\d{12}$")] = (
        None
    )
    abha_id: Optional[constr(min_length=1, max_length=20)] = None
    mp_uhid: Optional[constr(min_length=0, max_length=50)] = None
    food_preferences: Optional[constr(min_length=0, max_length=200)] = None
    address_line1: Optional[constr(min_length=1, max_length=200)] = None
    address_line2: Optional[constr(min_length=0, max_length=200)] = None
    landmark: Optional[constr(min_length=0, max_length=100)] = None
    street: Optional[constr(min_length=1, max_length=100)] = None
    state: Optional[constr(min_length=1, max_length=100)] = None
    pincode: Optional[int] = None
    country_code: Optional[constr(min_length=1, max_length=10)] = None
    phone: Optional[
        constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    ] = None
    country: Optional[constr(min_length=1, max_length=100)] = None
    blood_group: Optional[constr(min_length=0, max_length=10)] = None
    profile_image: Optional[constr(min_length=0, max_length=200)] = None

    @field_validator("gender")
    def validate_gender(cls, v):
        if v is not None:
            valid_genders = ["MALE", "FEMALE", "OTHER"]
            if v.upper() not in valid_genders:
                raise ValueError(f"Gender must be one of {valid_genders}")
            return v.upper()
        return v

    @field_validator("klass")
    def validate_klass(cls, v):
        if v is not None:
            if not 1 <= v <= 12:
                raise ValueError("Class must be between 1 and 12")
        return v

    @field_validator("pincode")
    def validate_pincode(cls, v):
        if v is not None:
            if not 100000 <= v <= 999999:
                raise ValueError("Pincode must be a 6-digit number")
        return v

    @field_validator("blood_group")
    def validate_blood_group(cls, v):
        if v is not None and v != "":
            valid_blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
            if v.upper() not in valid_blood_groups:
                raise ValueError(f"Blood group must be one of {valid_blood_groups}")
            return v.upper()
        return v


class ParentChildrenCreate(BaseModel):
    parent_id: int
    student_id: int
    primary_phone_no: constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    secondary_phone_no: constr(
        min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$"
    )
    status: bool

    @field_validator("primary_phone_no", "secondary_phone_no")
    def validate_phone_numbers(cls, v):
        return v


class ParentChildrenUpdate(BaseModel):
    parent_id: Optional[int] = None
    student_id: Optional[int] = None
    primary_phone_no: Optional[
        constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    ] = None
    secondary_phone_no: Optional[
        constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    ] = None
    status: Optional[bool] = None

    @field_validator("primary_phone_no", "secondary_phone_no")
    def validate_phone_numbers(cls, v):
        return v


class SchoolStudentsCreate(BaseModel):
    school_id: int
    student_id: int
    status: bool


class SchoolStudentsUpdate(BaseModel):
    school_id: Optional[int] = None
    student_id: Optional[int] = None
    status: Optional[bool] = None


class StudentResponse(BaseModel):
    student_id: int
    first_name: str
    middle_name: Optional[str]
    last_name: str
    gender: str
    dob: date
    klass: int
    section: str
    roll_no: str
    aadhaar_no: str
    abha_id: str
    mp_uhid: Optional[str]
    food_preferences: Optional[str]
    address_line1: str
    address_line2: Optional[str]
    landmark: Optional[str]
    street: str
    state: str
    pincode: int
    country_code: str
    phone: str
    country: str
    blood_group: Optional[str]
    profile_image: Optional[str]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]


class ParentChildrenResponse(BaseModel):
    pc_id: int
    parent_id: int
    student_id: int
    primary_phone_no: str
    secondary_phone_no: str
    status: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]


class SchoolStudentsResponse(BaseModel):
    ss_id: int
    school_id: int
    student_id: int
    status: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]

class StudentData(BaseModel):
    first_name: str
    middle_name: Optional[str]
    last_name: str
    class_: str = Field(..., alias="class")  # Use class_ to avoid Python keyword
    section: str
    roll_no: str
    age: str

    class Config:
        validate_by_name  = True
        json_encoders = {str: lambda v: str(v)}
        alias_generator = lambda field_name: "class" if field_name == "class_" else field_name

class ClassSectionData(BaseModel):
    class_: str = Field(..., alias="class")  # Use class_ to avoid Python keyword
    section: str
    studnets_count: int  # Match typo in desired response
    students: List[StudentData]

    class Config:
        validate_by_name  = True
        json_encoders = {str: lambda v: str(v)}
        alias_generator = lambda field_name: "class" if field_name == "class_" else field_name

class ClassGroupData(BaseModel):
    class_name: str
    class_data: List[ClassSectionData]

class SchoolDataResponse(BaseModel):
    school_data: List[ClassGroupData]



class SmartScaleDataRequest(BaseModel):
    transaction_id: str
    save_data: bool

class StudentListResponse(BaseModel):
    student_id: int
    full_name: str
    class_room: str
    section: str
    gender: str
    age: int
    phone: str
    screening_status: str
    
    