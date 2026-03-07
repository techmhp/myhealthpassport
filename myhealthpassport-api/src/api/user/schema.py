from datetime import date, datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, EmailStr, Field, constr, field_validator, HttpUrl
import base64
import binascii
import re

from src.models.user_models import AdminTeamRoles, SchoolRoles, OnGroundTeamRoles, ScreeningTeamRoles, AnalystRoles, ParentRoles, ConsultantRoles

class SchoolCreateSchema(BaseModel):
    school_name: str
    school_fullname: str = Field(max_length=100)
    school_code: str = Field(max_length=20)
    primary_contact_fullname: str = Field(max_length=100)
    primary_contact_email: str = Field(max_length=100)
    primary_contact_phone: str = Field(max_length=20)
    admin_contact_fullname: str = Field(max_length=50)
    admin_contact_email: str = Field(max_length=100)
    admin_contact_phone: str = Field(max_length=20)
    address_line1: str = Field(default="", max_length=100)
    address_line2: Optional[str] = Field(default="", max_length=100)
    landmark: Optional[str] = Field(default="", max_length=50)
    street: Optional[str] = Field(default="", max_length=100)
    state: Optional[str] = Field(default="", max_length=50)
    pincode: Optional[str] = Field(default="", max_length=20)
    phone: Optional[str] = Field(default="", max_length=20)
    country: Optional[str] = Field(default="", max_length=50)
    country_code: Optional[str] = Field(default="", max_length=50)
    registration_no: Optional[str] = Field(default="", max_length=50)
    location: Optional[str] = Field(default="", max_length=255)
    school_location_link: Optional[constr(min_length=1, max_length=500)] = None
    school_logo: Optional[str] = Field(default=None, description="Base64 encoded string for the school logo.")





# Schema Definitions
class Timing(BaseModel):
    time: str
    availability: bool

class TimeSlot(BaseModel):
    start: constr(pattern=r"^(08:00|12:00|16:00)$")  # Only 08:00, 12:00, 16:00
    end: constr(pattern=r"^(12:00|16:00|20:00)$") 
    
class DayAvailabilities(BaseModel):
    day: constr(pattern=r"^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$")
    slots: List[TimeSlot] = Field(
        ...,
        example=[
            {"start": "08:00", "end": "12:00"},
            {"start": "12:00", "end": "16:00"},
            {"start": "16:00", "end": "20:00"}
        ]
    )
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "day": "Monday",
                "slots": [
                    {"start": "08:00", "end": "12:00"},
                    {"start": "12:00", "end": "16:00"}
                ]
            }
        }
    
class DayAvailability(BaseModel):
    day: str
    timings: List[Timing]

class AdminTeamUserCreateSchema(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = ""
    phone: str
    email: Optional[str] = None
    user_role: str
    dob: date
    gender: str
    address_line_1: str
    address_line_2: Optional[str] = ""
    landmark: Optional[str] = ""
    street_name: Optional[str] = ""
    state: str
    pincode: str
    country_calling_code: str
    country: str
    profile_image: Optional[str] = None
    blood_group: Optional[str] = None
    spoken_languages: Optional[str] = None
    days_available: Optional[List[DayAvailability]] = None
    employee_id: Optional[str] = None
    
class ExpertUserCreateSchema(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = ""
    phone: str
    email: Optional[str] = None
    user_role: str
    dob: date
    education: str
    location: str
    gender: str
    clinic_name:str
    address_line_1: str
    address_line_2: Optional[str] = ""
    landmark: Optional[str] = ""
    street_name: Optional[str] = ""
    state: str
    pincode: str
    experience: str
    specialty: str
    country_calling_code: str
    country: str
    profile_image: Optional[str] = None
    blood_group: Optional[str] = None
    employee_id: Optional[str] = None
    location_link: Optional[constr(min_length=1, max_length=500)]=None
    #new fields
    available_time_slots: List[DayAvailabilities] = Field(..., example=[
            {
                "day": "Monday",
                "slots": [
                    {"start": "08:00", "end": "12:00"},
                    {"start": "12:00", "end": "16:00"},
                    {"start": "16:00", "end": "20:00"}
                ]
            }
        ]
    )

    consultation_duration: int  # default 30 mins
    max_consultations_per_day: Optional[int]= None
    consultation_charges: float   # or commission
    brief_bio: str 
    license_number: str 
    languages_spoken: List[str]
    
class ExpertUserUpdateSchema(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    user_role: Optional[str] = None
    dob: Optional[date] = None
    education: Optional[str] = None
    location: Optional[str] = None
    gender: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    clinic_name:Optional[str]=None
    landmark: Optional[str] = None
    street_name: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    experience: Optional[str] = None
    specialty: Optional[str] = None
    country_calling_code: Optional[str] = None
    country: Optional[str] = None
    profile_image: Optional[str] = None
    blood_group: Optional[str] = None
    employee_id: Optional[str] = None
    location_link: Optional[constr(min_length=1, max_length=500)] = None

    available_time_slots: Optional[List[DayAvailabilities]] = None
    consultation_duration: Optional[int] = None
    max_consultations_per_day: Optional[int] = None
    consultation_charges: Optional[float] = None
    brief_bio: Optional[str] = None
    license_number: Optional[str] = None
    languages_spoken: Optional[List[str]] = None

class RegularUserCreateSchema(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = ""
    phone: str
    email: Optional[str] = None
    user_role: str
    dob: date
    gender: str
    address_line_1: str
    address_line_2: Optional[str] = ""
    landmark: Optional[str] = ""
    street_name: Optional[str] = ""
    state: str
    pincode: str
    country_calling_code: str
    country: str
    profile_image: Optional[str] = None
    blood_group: Optional[str] = None
    spoken_languages: Optional[str] = None
    days_available: Optional[List[DayAvailability]] = None
    employee_id: Optional[str] = None


def convert_days_to_string(days_available: Optional[List[DayAvailability]]) -> Optional[str]:
    if not days_available:
        return None
    days_available_str = ""
    for day_entry in days_available:
        day = day_entry.day.capitalize()
        timings = day_entry.timings
        if timings:
            day_timings = []
            for timing in timings:
                if timing.availability:
                    day_timings.append(timing.time)
            if day_timings:
                days_available_str += f"{day} {' '.join(day_timings)}, "
    return days_available_str.rstrip(", ") if days_available_str else None

def parse_days_available(days_str: Optional[str]) -> List[dict]:
    if not days_str:
        return []
    days_list = []
    for day_block in days_str.split(", "):
        if not day_block:
            continue
        parts = day_block.split(" ", 1)
        if len(parts) != 2:
            continue
        day = parts[0].lower()
        time_blocks = parts[1].split()
        timings = []
        time_range = []
        for time_block in time_blocks:
            time_range.append(time_block)
            if len(time_range) == 5:  # e.g., ["8:00", "AM", "-", "12:00", "PM"]
                timings.append({"time": " ".join(time_range), "availability": True})
                time_range = []
            elif len(time_range) == 10:  # e.g., two ranges like "8:00 AM - 12:00 PM 12:00 AM - 4:00 PM"
                timings.append({"time": " ".join(time_range[:5]), "availability": True})
                timings.append({"time": " ".join(time_range[5:]), "availability": True})
                break
        if time_range:  # Handle any remaining partial range
            timings.append({"time": " ".join(time_range), "availability": True})
        days_list.append({"day": day, "timings": timings})
    return days_list

class ProjectWideUserCreate(BaseModel):
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    middle_name: Optional[str] = Field(default="", max_length=50)
    phone: constr(max_length=50)
    email: Optional[EmailStr] = None
    password: constr(min_length=6, max_length=128)
    user_role: SchoolRoles
    school_name: Optional[str] = Field(default=None, max_length=400)
    dob: Optional[date] = Field(default=None, description="User's date of birth")
    gender: Optional[str] = Field(default="", max_length=20, description="User's gender")
    address_line_1: Optional[str] = Field(default="", max_length=100, description="Primary address line")
    address_line_2: Optional[str] = Field(default="", max_length=100, description="Secondary address line")
    landmark: Optional[str] = Field(default="", max_length=100, description="Nearby landmark")
    street_name: Optional[str] = Field(default="", max_length=100, description="Street name")
    state: Optional[str] = Field(default="", max_length=50, description="State or region")
    pincode: Optional[str] = Field(default="", max_length=10, description="Postal code")
    country_calling_code: Optional[str] = Field(default="", max_length=5, description="Country calling code (e.g., +91)")
    country: Optional[str] = Field(default="", max_length=50, description="Country name")
    profile_image: Optional[str] = Field(default=None, description="Base64-encoded profile image")
    class_room: Optional[str] = Field(default="", max_length=10, description="Classroom for teachers")
    section: Optional[str] = Field(default="", max_length=2, description="Section for teachers")

    @field_validator("profile_image")
    def validate_profile_image(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value:
            try:
                if ',' in value:
                    header, data = value.split(",", 1)
                    if not re.match(r"data:image/(png|jpg|jpeg);base64", header):
                        raise ValueError("Invalid image format. Only PNG, JPG, or JPEG allowed.")
                else:
                    data = value
                base64.b64decode(data)
            except (binascii.Error, ValueError) as e:
                raise ValueError(f"Invalid base64 image string: {str(e)}")
        return value

    model_config = {
        "arbitrary_types_allowed": True,
        "json_schema_extra": {
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "middle_name": "A",
                "phone": "911234567890",
                "email": "john@example.com",
                "password": "securePass123",
                "user_role": "SCHOOL_ADMIN",
                "school_name": "Sunrise Academy",
                "dob": "1980-01-01",
                "gender": "Male",
                "address_line_1": "123 Main St",
                "address_line_2": "Apt 4B",
                "landmark": "Near City Park",
                "street_name": "Main Street",
                "state": "California",
                "pincode": "12345",
                "country_calling_code": "+1",
                "country": "USA",
                "profile_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
                "class_room": "5A",
                "section": "B"
            }
        }
    }

class UsersListSchema(BaseModel):
    id: int = Field(..., description="The unique identifier for the user.")
    first_name: str = Field(..., description="User's first name.")
    last_name: str = Field(..., description="User's last name.")
    middle_name: Optional[str] = Field(None, description="User's middle name (if available).")
    username: str = Field(..., description="The unique username for the user.")
    phone: str = Field(..., description="User's registered phone number.")
    email: Optional[EmailStr] = Field(None, description="User's registered email address (if available).")
    user_role: str = Field(..., description="The assigned role of the user.")
    role_type: str = Field(..., description="The assigned role type of the user")
    is_active: bool = Field(..., description="Indicates if the user account is currently active.")
    is_verified: bool = Field(..., description="Indicates if the user account has been verified.")
    profile_image: Optional[str] = Field(default="", description="URL path to the user's profile image.")
    dob: Optional[date] = Field(default=None, description="User's date of birth")
    gender: Optional[str] = Field(default=None, max_length=20, description="User's gender")
    address_line_1: Optional[str] = Field(default=None, max_length=100, description="Primary address line")
    address_line_2: Optional[str] = Field(default=None, max_length=100, description="Secondary address line")
    landmark: Optional[str] = Field(default=None, max_length=100, description="Nearby landmark")
    street_name: Optional[str] = Field(default=None, max_length=100, description="Street name")
    state: Optional[str] = Field(default=None, max_length=50, description="State or region")
    pincode: Optional[str] = Field(default=None, max_length=10, description="Postal code")
    country_calling_code: Optional[str] = Field(default=None, max_length=5, description="Country calling code (e.g., +91)")
    country: Optional[str] = Field(default=None, max_length=50, description="Country name")
    location: Optional[str] = Field(default=None, max_length=50, description="Location")
    blood_group: Optional[str] = Field(default=None, max_length=10, description="Blood group")
    spoken_languages: Optional[str] = Field(default=None, description="Spoken languages")
    days_available: Optional[str] = Field(default=None, description="Availability schedule")
    employee_id: Optional[str] = Field(default=None, max_length=50, description="Unique employee ID")

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    role_type: constr(max_length=50)
    first_name: Optional[constr(min_length=1, max_length=50)] = None
    last_name: Optional[constr(min_length=1, max_length=50)] = None
    middle_name: Optional[constr(max_length=50)] = None
    email: Optional[EmailStr] = None
    phone: Optional[constr(min_length=10, max_length=20)] = None
    dob: Optional[date] = None
    gender: Optional[constr(max_length=20)] = None
    address_line_1: Optional[constr(max_length=100)] = None
    address_line_2: Optional[constr(max_length=100)] = None
    landmark: Optional[constr(max_length=100)] = None
    street_name: Optional[constr(max_length=100)] = None
    state: Optional[constr(max_length=50)] = None
    pincode: Optional[constr(max_length=10)] = None
    country_calling_code: Optional[constr(max_length=5)] = None
    country: Optional[constr(max_length=50)] = None
    profile_image: Optional[str] = None
    education: Optional[constr(max_length=50)] = None
    specialty: Optional[constr(max_length=50)] = None
    experience: Optional[constr(max_length=50)] = None
    availability: Optional[constr(max_length=50)] = None
    location: Optional[constr(max_length=50)] = None
    class_room: Optional[constr(max_length=10)] = None
    section: Optional[constr(max_length=2)] = None
    primary_first_name: Optional[constr(min_length=1, max_length=50)] = None
    primary_last_name: Optional[constr(min_length=1, max_length=50)] = None
    primary_middle_name: Optional[constr(max_length=50)] = None
    primary_mobile: Optional[constr(min_length=10, max_length=20)] = None
    primary_email: Optional[EmailStr] = None
    secondary_first_name: Optional[constr(min_length=1, max_length=50)] = None
    secondary_last_name: Optional[constr(min_length=1, max_length=50)] = None
    secondary_middle_name: Optional[constr(max_length=50)] = None
    secondary_mobile: Optional[constr(min_length=10, max_length=20)] = None
    secondary_email: Optional[EmailStr] = None
    secondary_country_calling_code: Optional[constr(max_length=5)] = None
    user_role: Optional[str] = None
    blood_group: Optional[constr(max_length=10)] = None
    spoken_languages: Optional[str] = None
    days_available: Optional[str] = None
    employee_id: Optional[constr(max_length=50)] = None

    @field_validator("email", "primary_email", "secondary_email")
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            if len(value) > 100:
                raise ValueError("Email must not exceed 100 characters")
            if value != value.lower():
                raise ValueError("Email must be lowercase")
        return value

    @field_validator("phone", "primary_mobile", "secondary_mobile")
    def validate_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            if not value.startswith("+") and len(value) < 10:
                raise ValueError("Phone number must be valid and include country code if applicable")
        return value

    @field_validator("profile_image")
    def validate_profile_image(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value:
            try:
                if ',' in value:
                    header, data = value.split(",", 1)
                    if not re.match(r"data:image/(png|jpg|jpeg);base64", header):
                        raise ValueError("Invalid image format. Only PNG, JPG, or JPEG allowed.")
                else:
                    data = value
                base64.b64decode(data)
            except (binascii.Error, ValueError) as e:
                raise ValueError(f"Invalid base64 image string: {str(e)}")
        return value

    @field_validator("role_type")
    def validate_role_type(cls, value: str) -> str:
        valid_roles = [
            "ADMIN_TEAM", "SCREENING_TEAM", "ANALYST_TEAM", "ON_GROUND_TEAM",
            "CONSULTANT_TEAM", "SCHOOL_STAFF", "PARENT"
        ]
        if value.upper() not in valid_roles:
            raise ValueError(f"Invalid role_type: {value}. Must be one of {valid_roles}")
        return value.upper()

class ChangePasswordSchema(BaseModel):
    old_password: str = Field(..., max_length=50)
    new_password: str = Field(..., max_length=50)

# Response Schemas
class AdminTeamResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    username: str
    phone: str
    age: Optional[int] = None
    email: Optional[EmailStr]
    user_role: AdminTeamRoles
    role_type: str
    is_active: bool
    is_verified: bool
    profile_image: Optional[str]
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
    location: Optional[str]
    blood_group: Optional[str]
    spoken_languages: Optional[str]
    days_available: Optional[str]
    employee_id: Optional[str]

    class Config:
        from_attributes = True

class ScreeningTeamResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    age: Optional[int] = None
    middle_name: Optional[str]
    username: str
    phone: str
    email: Optional[EmailStr]
    user_role: ScreeningTeamRoles
    role_type: str
    is_active: bool
    is_verified: bool
    profile_image: Optional[str]
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
    location: Optional[str]
    blood_group: Optional[str]
    spoken_languages: Optional[str]
    days_available: Optional[str]
    employee_id: Optional[str]

    class Config:
        from_attributes = True

class AnalystTeamResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    username: str
    phone: str
    age: Optional[int] = None
    email: Optional[EmailStr]
    user_role: AnalystRoles
    role_type: str
    is_active: bool
    is_verified: bool
    profile_image: Optional[str]
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
    location: Optional[str]
    blood_group: Optional[str]
    spoken_languages: Optional[str]
    days_available: Optional[str]
    employee_id: Optional[str]

    class Config:
        from_attributes = True

class OnGroundTeamResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    age: Optional[int] = None
    middle_name: Optional[str]
    username: str
    phone: str
    email: Optional[EmailStr]
    user_role: OnGroundTeamRoles
    role_type: str
    is_active: bool
    is_verified: bool
    profile_image: Optional[str]
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
    location: Optional[str]
    blood_group: Optional[str]
    spoken_languages: Optional[str]
    days_available: Optional[str]
    employee_id: Optional[str]

    class Config:
        from_attributes = True

class ConsultantTeamResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    phone: str
    age: Optional[int] = None
    email: Optional[EmailStr]
    user_role: ConsultantRoles
    role_type: str
    education: Optional[str]
    specialty: Optional[str]
    experience: Optional[str]
    availability: Optional[str]
    profile_image: Optional[str]
    dob: Optional[date]
    gender: Optional[str]
    address_line_1: Optional[str]
    address_line_2: Optional[str]
    landmark: Optional[str]
    street_name: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    blood_group: Optional[str]
    country_calling_code: Optional[str]
    country: Optional[str]
    location: Optional[str]

    class Config:
        from_attributes = True

class TeacherResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    username: str
    phone: str
    email: Optional[EmailStr]
    user_role: SchoolRoles
    role_type: str
    age: Optional[int] = None
    is_active: bool
    is_verified: bool
    profile_image: Optional[str]
    class_room: Optional[str]
    section: Optional[str]
    dob: Optional[date]
    gender: Optional[str]
    blood_group: Optional[str]
    address_line_1: Optional[str]
    address_line_2: Optional[str]
    landmark: Optional[str]
    street_name: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    country_calling_code: Optional[str]
    country: Optional[str]
    location: Optional[str]

    class Config:
        from_attributes = True

class ParentResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str]
    mobile: str
    email: Optional[EmailStr]
    user_role: ParentRoles
    role_type: str
    age: Optional[int] = None
    is_active: bool
    is_verified: bool
    profile_image: Optional[str]
    dob: Optional[date]
    gender: Optional[str]
    address_line_1: Optional[str]
    address_line_2: Optional[str]
    landmark: Optional[str]
    street_name: Optional[str]
    state: Optional[str]
    blood_group: Optional[str]
    pincode: Optional[str]
    country_calling_code: Optional[str]
    country: Optional[str]
    location: Optional[str]
    

    class Config:
        from_attributes = True

class CurrentUserUpdateRequest(BaseModel):
    first_name: Optional[constr(min_length=1, max_length=50)] = None
    last_name: Optional[constr(min_length=1, max_length=50)] = None
    middle_name: Optional[constr(max_length=50)] = None
    email: Optional[EmailStr] = None
    phone: Optional[constr(min_length=10, max_length=20)] = None
    dob: Optional[date] = None
    gender: Optional[constr(max_length=20)] = None
    address_line_1: Optional[constr(max_length=100)] = None
    address_line_2: Optional[constr(max_length=100)] = None
    landmark: Optional[constr(max_length=100)] = None
    street_name: Optional[constr(max_length=100)] = None
    state: Optional[constr(max_length=50)] = None
    pincode: Optional[constr(max_length=10)] = None
    country_calling_code: Optional[constr(max_length=5)] = None
    country: Optional[constr(max_length=50)] = None
    profile_image: Optional[str] = None
    education: Optional[constr(max_length=50)] = None
    specialty: Optional[constr(max_length=50)] = None
    experience: Optional[constr(max_length=50)] = None
    availability: Optional[constr(max_length=50)] = None
    location: Optional[constr(max_length=50)] = None
    class_room: Optional[constr(max_length=10)] = None
    section: Optional[constr(max_length=2)] = None
    primary_first_name: Optional[constr(min_length=1, max_length=50)] = None
    primary_last_name: Optional[constr(min_length=1, max_length=50)] = None
    primary_middle_name: Optional[constr(max_length=50)] = None
    primary_mobile: Optional[constr(min_length=10, max_length=20)] = None
    primary_email: Optional[EmailStr] = None
    secondary_first_name: Optional[constr(min_length=1, max_length=50)] = None
    secondary_last_name: Optional[constr(min_length=1, max_length=50)] = None
    secondary_middle_name: Optional[constr(max_length=50)] = None
    secondary_mobile: Optional[constr(min_length=10, max_length=20)] = None
    secondary_email: Optional[EmailStr] = None
    secondary_country_calling_code: Optional[constr(max_length=5)] = None
    blood_group: Optional[constr(max_length=10)] = None
    spoken_languages: Optional[str] = None
    days_available: Optional[str] = None
    employee_id: Optional[constr(max_length=50)] = None

    @field_validator("email", "primary_email", "secondary_email")
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            if len(value) > 100:
                raise ValueError("Email must not exceed 100 characters")
            if value != value.lower():
                raise ValueError("Email must be lowercase")
        return value

    @field_validator("phone", "primary_mobile", "secondary_mobile")
    def validate_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            if not value.startswith("+") and len(value) < 10:
                raise ValueError("Phone number must be valid and include country code if applicable")
        return value

    @field_validator("profile_image")
    def validate_profile_image(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value:
            try:
                if ',' in value:
                    header, data = value.split(",", 1)
                    if not re.match(r"data:image/(png|jpg|jpeg);base64", header):
                        raise ValueError("Invalid image format. Only PNG, JPG, or JPEG allowed.")
                else:
                    data = value
                base64.b64decode(data)
            except (binascii.Error, ValueError) as e:
                raise ValueError(f"Invalid base64 image string: {str(e)}")
        return value
    