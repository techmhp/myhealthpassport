import base64
import binascii
import logging
import os
import uuid
import re
from datetime import date
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, EmailStr, Field, constr, field_validator, validator

from src.models.user_models import (AdminTeamRoles, AnalystRoles,
                                    ConsultantRoles, OnGroundTeamRoles,
                                    SchoolRoles, ScreeningTeamRoles)
from src.schemas.parent_schema import ParentResponse


class SignupRequest(BaseModel):
    username: constr(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9]+$")
    email: EmailStr
    password: str
    first_name: constr(min_length=1, max_length=50, pattern=r"^[a-zA-Z\s]+$")
    last_name: constr(min_length=1, max_length=50, pattern=r"^[a-zA-Z\s]+$")
    phone: constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    dob: date
    height: Optional[float] = None
    weight: Optional[float] = None

    @validator("email")
    def validate_email(cls, value: str) -> str:
        if len(value) > 50:
            raise ValueError("Email must not exceed 50 characters")
        if value != value.lower():
            raise ValueError("Email must be lowercase")
        return value

    @validator("password")
    def validate_password(cls, value: str) -> str:
        if not (8 <= len(value) <= 50):
            raise ValueError("Password must be between 8 and 50 characters")
        if not re.search(r"[A-Za-z]", value):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValueError("Password must contain at least one special character")
        return value


class LoginRequest(BaseModel):
    phone: constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    password: constr(min_length=8, max_length=50)

    @validator("password")
    def validate_password(cls, value: str) -> str:
        if not re.search(r"[A-Za-z]", value):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValueError("Password must contain at least one special character")
        return value

from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import date
import re
import base64
import binascii

class Timing(BaseModel):
    time: str
    availability: bool

class DayAvailability(BaseModel):
    day: str
    timings: List[Timing]

class UserUpdateRequest(BaseModel):
    role_type: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    landmark: Optional[str] = None
    street_name: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country_calling_code: Optional[str] = None
    primary_country_calling_code:Optional[str] = None
    country: Optional[str] = None
    profile_image: Optional[str] = None
    education: Optional[str] = None
    specialty: Optional[str] = None
    experience: Optional[str] = None
    availability: Optional[str] = None
    location: Optional[str] = None
    class_room: Optional[str] = None
    section: Optional[str] = None
    primary_first_name: Optional[str] = None
    primary_last_name: Optional[str] = None
    primary_middle_name: Optional[str] = None
    primary_mobile: Optional[str] = None
    primary_email: Optional[EmailStr] = None
    secondary_first_name: Optional[str] = None
    secondary_last_name: Optional[str] = None
    secondary_middle_name: Optional[str] = None
    secondary_mobile: Optional[str] = None
    secondary_email: Optional[EmailStr] = None
    secondary_country_calling_code: Optional[str] = None
    user_role: Optional[str] = None
    blood_group: Optional[str] = None
    spoken_languages: Optional[str] = None
    days_available: Optional[List[DayAvailability]] = None  # Updated to accept list
    employee_id: Optional[str] = None

    @field_validator("email", "primary_email", "secondary_email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v) > 100:
                raise ValueError("Email must not exceed 100 characters")
            if v != v.lower():
                raise ValueError("Email must be lowercase")
        return v

    @field_validator("phone", "primary_mobile", "secondary_mobile")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.startswith("+") and len(v) < 10:
                raise ValueError("Phone number must be valid and include country code if applicable")
        return v

    

    @field_validator("role_type")
    @classmethod
    def validate_role_type(cls, v: str) -> str:
        valid_roles = [
            "ADMIN_TEAM", "SCREENING_TEAM", "ANALYST_TEAM", "ON_GROUND_TEAM",
            "CONSULTANT_TEAM", "SCHOOL_STAFF", "PARENT"
        ]
        if v.upper() not in valid_roles:
            raise ValueError(f"Invalid role_type: {v}. Must be one of {valid_roles}")
        return v.upper()

    @field_validator("blood_group")
    @classmethod
    def validate_blood_group(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v) > 10:
                raise ValueError("Blood group must not exceed 10 characters")
        return v

    @field_validator("employee_id")
    @classmethod
    def validate_employee_id(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v) > 50:
                raise ValueError("Employee ID must not exceed 50 characters")
            if v == "":
                return None  # Convert empty string to None
        return v

class CurrentUserUpdateRequest(UserUpdateRequest):
    role_type: Optional[str] = None  # Override to make role_type optional
    

class PasswordUpdateRequest(BaseModel):
    current_password: constr(min_length=8, max_length=50)
    new_password: str

    @validator("current_password")
    def validate_current_password(cls, value: str) -> str:
        if not re.search(r"[A-Za-z]", value):
            raise ValueError("Current password must contain at least one letter")
        if not re.search(r"\d", value):
            raise ValueError("Current password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValueError("Current password must contain at least one special character")
        return value

    @validator("new_password")
    def validate_new_password(cls, value: str) -> str:
        if not (8 <= len(value) <= 50):
            raise ValueError("New password must be between 8 and 50 characters")
        if not re.search(r"[A-Za-z]", value):
            raise ValueError("New password must contain at least one letter")
        if not re.search(r"\d", value):
            raise ValueError("New password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValueError("New password must contain at least one special character")
        return value


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    status: bool
    message: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]
    status: bool
    message: str



class CreateTeacherSchema(BaseModel):
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    middle_name: str = Field(default="", max_length=50)
    username: str = Field(..., max_length=50)
    phone: str = Field(..., max_length=20)
    email: str = Field(..., max_length=100)
    password: str = Field(..., max_length=255)
    dob: Optional[str] = None
    gender: str = Field(default="", max_length=20)
    address_line_1: str = Field(default="", max_length=100)
    address_line_2: str = Field(default="", max_length=100)
    landmark: str = Field(default="", max_length=100)
    street: str = Field(default="", max_length=100)
    state: str = Field(default="", max_length=100)
    pincode: str = Field(default="", max_length=10)
    country: str = Field(default="", max_length=50)
    country_calling_code: str = Field(default="", max_length=5)
    class_room: int = Field(default=0, ge=0)
    section: str = Field(default="", max_length=2)


class UpdateTeacherSchema(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=50)
    last_name: Optional[str] = Field(default=None, max_length=50)
    middle_name: Optional[str] = Field(default=None, max_length=50)
    username: Optional[str] = Field(default=None, max_length=50)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[str] = Field(default=None, max_length=100)
    password: Optional[str] = Field(default=None, max_length=255)
    dob: Optional[str] = None
    gender: Optional[str] = Field(default=None, max_length=20)
    address_line_1: Optional[str] = Field(default=None, max_length=100)
    address_line_2: Optional[str] = Field(default=None, max_length=100)
    landmark: Optional[str] = Field(default=None, max_length=100)
    street: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    pincode: Optional[str] = Field(default=None, max_length=10)
    country: Optional[str] = Field(default=None, max_length=50)
    country_calling_code: Optional[str] = Field(default=None, max_length=5)
    class_room: Optional[int] = Field(default=None, ge=0)
    section: Optional[str] = Field(default=None, max_length=2)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class TeacherFilterRequest(BaseModel):
    class_room: Optional[int] = None
    section: Optional[str] = None
    search: Optional[str] = None
    role_type: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    page: int = 1
    page_size: int = 100




from datetime import date
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, field_serializer


class TeacherResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    username: str
    phone: str
    email: Optional[str]
    is_active: bool
    is_verified: bool
    profile_image: Optional[str]
    class_room: Optional[str]
    section: Optional[str]
    user_role: str
    role_type: str
    dob: Optional[date]
    gender: Optional[str]
    address_line_1: Optional[str]
    address_line_2: Optional[str]
    landmark: Optional[str]
    street: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    country_calling_code: Optional[str]
    country: Optional[str]

    @field_serializer('dob')
    def serialize_dob(self, dob: Optional[date], _info):
        return dob.isoformat() if dob else None

    @field_validator("class_room", mode="before")
    def convert_class_room_to_string(cls, value: Any) -> Optional[str]:
        if value is None:
            return None
        return str(value)

    class Config:
        from_attributes = True
        
class TeacherListResponse(BaseModel):
    total: int
    teachers: List[TeacherResponse]


class CreateSchoolAdminSchema(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = ""
    username: str
    phone: str
    email: Optional[str] = ""
    password: str
    dob: Optional[str] = None
    gender: Optional[str] = ""
    address_line_1: Optional[str] = ""
    address_line_2: Optional[str] = ""
    landmark: Optional[str] = ""
    street: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    country: Optional[str] = ""
    country_calling_code: Optional[str] = ""
    school_id: int

    class Config:
        from_attributes = True


class SchoolAdminResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    email: Optional[str]
    school_id: int
    profile_image: Optional[str]
    class_room: Optional[str]

    class Config:
        from_attributes = True


from datetime import date
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, field_serializer


class TeacherResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    username: str
    phone: str
    email: Optional[str]
    is_active: bool
    is_verified: bool
    profile_image: Optional[str]
    class_room: Optional[str]
    section: Optional[str]
    user_role: str
    role_type: str
    dob: Optional[date]
    gender: Optional[str]
    address_line_1: Optional[str]
    address_line_2: Optional[str]
    landmark: Optional[str]
    street: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    country_calling_code: Optional[str]
    country: Optional[str]

    @field_serializer('dob')
    def serialize_dob(self, dob: Optional[date], _info):
        return dob.isoformat() if dob else None

    @field_validator("class_room", mode="before")
    def convert_class_room_to_string(cls, value: Any) -> Optional[str]:
        if value is None:
            return None
        return str(value)

    class Config:
        from_attributes = True
        


class ScreeningTeamResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    username: str
    phone: str
    email: Optional[str]
    profile_image: Optional[str]
    user_role: ScreeningTeamRoles
    role_type: str
    dob: Optional[date]
    gender: Optional[str]
    address_line_1: Optional[str]
    address_line_2: Optional[str]
    landmark: Optional[str]
    street_name: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    country_calling_code: Optional[str]
    country: Optional[str]
    is_active: bool
    is_verified: bool
    location: str
    blood_group: Optional[str] = None  # New field
    spoken_languages: Optional[str] = None  # New field
    days_available: Optional[str] = None  # New field
    employee_id: Optional[str] = None  # New field
    
    @field_serializer('dob')
    def serialize_dob(self, dob: Optional[date], _info):
        return dob.isoformat() if dob else None

    class Config:
        from_attributes = True

class AnalystTeamResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    username: str
    phone: str
    email: Optional[str]
    profile_image: Optional[str]
    user_role: AnalystRoles
    role_type: str
    dob: Optional[date]
    gender: Optional[str]
    address_line_1: Optional[str]
    address_line_2: Optional[str]
    landmark: Optional[str]
    street_name: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    country_calling_code: Optional[str]
    country: Optional[str]
    is_active: bool
    is_verified: bool
    location: str
    blood_group: Optional[str] = None  # New field
    spoken_languages: Optional[str] = None  # New field
    days_available: Optional[str] = None  # New field
    employee_id: Optional[str] = None  # New field

    @field_serializer('dob')
    def serialize_dob(self, dob: Optional[date], _info):
        return dob.isoformat() if dob else None

    class Config:
        from_attributes = True

class AdminTeamResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    username: str
    phone: str
    email: Optional[str]
    profile_image: Optional[str]
    user_role: AdminTeamRoles
    role_type: str
    dob: Optional[date]
    gender: Optional[str]
    address_line_1: Optional[str]
    address_line_2: Optional[str]
    landmark: Optional[str]
    street_name: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    country_calling_code: Optional[str]
    country: Optional[str]
    is_active: bool
    is_verified: bool
    location: str
    blood_group: Optional[str] = None  # New field
    spoken_languages: Optional[str] = None  # New field
    days_available: Optional[str] = None  # New field
    employee_id: Optional[str] = None  # New field
    
    @field_serializer('dob')
    def serialize_dob(self, dob: Optional[date], _info):
        return dob.isoformat() if dob else None

    class Config:
        from_attributes = True

class ConsultantTeamResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    education: Optional[str]
    specialty: Optional[str]
    experience: Optional[str]
    availability: Optional[str]
    location: Optional[str]
    phone: str
    email: Optional[str]
    profile_image: Optional[str]
    user_role: ConsultantRoles
    role_type: str
    dob: Optional[date]
    gender: Optional[str]
    address_line_1: Optional[str]
    address_line_2: Optional[str]
    landmark: Optional[str]
    street_name: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    country_calling_code: Optional[str]
    country: Optional[str]

    @field_serializer('dob')
    def serialize_dob(self, dob: Optional[date], _info):
        return dob.isoformat() if dob else None

    class Config:
        from_attributes = True
 
class OnGroundTeamResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    username: str
    phone: str
    email: Optional[str]
    profile_image: Optional[str]
    user_role: OnGroundTeamRoles
    role_type: str
    dob: Optional[date]
    gender: Optional[str]
    address_line_1: Optional[str]
    address_line_2: Optional[str]
    landmark: Optional[str]
    street_name: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    country_calling_code: Optional[str]
    country: Optional[str]
    is_active: bool
    is_verified: bool
    location: str
    blood_group: Optional[str] = None  # New field
    spoken_languages: Optional[str] = None  # New field
    days_available: Optional[str] = None  # New field
    employee_id: Optional[str] = None  # New field
    
    @field_serializer('dob')
    def serialize_dob(self, dob: Optional[date], _info):
        return dob.isoformat() if dob else None

    class Config:
        from_attributes = True
        

class UserFilterRequest(BaseModel):
    role_type: Optional[str] = None
    user_role: Optional[str] = None
    user_id: Optional[int] = None
    search: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    page: int = 1
    page_size: int = 100




class UserListResponse(BaseModel):
    total: int
    users: List[
        Union[
            ParentResponse,
            TeacherResponse,
            OnGroundTeamResponse,
            ScreeningTeamResponse,
            AnalystTeamResponse,
            AdminTeamResponse,
            ConsultantTeamResponse,
        ]
    ]