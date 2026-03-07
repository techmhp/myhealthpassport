from datetime import date
from typing import List, Optional
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator



# class StudentCreate(BaseModel):
#     first_name: Optional[str] = ""
#     middle_name: Optional[str] = ""
#     last_name: Optional[str] = ""
#     gender: Optional[str]
#     dob: date
#     class_room: str
#     section: Optional[str] = ""
#     roll_no: Optional[str] = ""
#     aadhaar_no: Optional[str]
#     abha_id:  Optional[str]
#     mp_uhid:  Optional[str]
#     food_preferences: Optional[str] = ""
#     address_line1: Optional[str] = ""
#     address_line2: Optional[str] = ""
#     landmark: Optional[str] = ""
#     street: Optional[str] = ""
#     state: Optional[str] = ""
#     pincode: Optional[str] = ""
#     country_code:  Optional[str] = ""  # e.g., '+91'
#     phone: Optional[int]  # Phone number format
#     country: Optional[str] = ""
#     blood_group: Optional[str] = ""
#     profile_image: Optional[str]=""


#     @field_validator("blood_group")
#     def validate_blood_group(cls, v):
#         if v is not None and v != "":
#             valid_blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
#             if v.upper() not in valid_blood_groups:
#                 raise ValueError(f"Blood group must be one of {valid_blood_groups}")
#             return v.upper()
#         return v


class StudentCreate(BaseModel):
    first_name: str
    middle_name: Optional[str] = ""
    last_name: Optional[str] = ""
    gender: Optional[str] = ""
    dob: date
    class_room: str
    section: str
    roll_no: Optional[str] = ""
    aadhaar_no: Optional[str] = ""
    abha_id: Optional[str] = ""
    mp_uhid: Optional[str] = ""
    food_preferences: Optional[str] = ""
    address_line1: Optional[str] = ""
    address_line2: Optional[str] = ""
    landmark: Optional[str] = ""
    street: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    country_code: Optional[str] = ""  # e.g., '+91'
    phone: str  # Changed to str to match data processing
    country: Optional[str] = ""
    blood_group: Optional[str] = ""
    profile_image: Optional[str] = ""
    created_by: Optional[str] = ""
    created_user_role: Optional[str] = ""
    created_role_type: Optional[str] = ""

    @field_validator("blood_group")
    def validate_blood_group(cls, v):
        if v is not None and v != "":
            valid_blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
            if v.upper() not in valid_blood_groups:
                raise ValueError(f"Blood group must be one of {valid_blood_groups}")
            return v.upper()
        return v
      

class ParentInputSchema(BaseModel):
    first_name: Optional[str] = ""
    middle_name: Optional[str] = ""
    last_name: Optional[str] = ""
    phone: str = Field(..., min_length=6, max_length=15) # Added min/max length
    email: Optional[EmailStr] = ""


# class IndividualStudentCreateSchema(BaseModel):
#     # Student Personal Details
#     first_name: str
#     middle_name: Optional[str] = None
#     last_name: str
#     gender: str # TODO: Consider using Enum for specific values like MALE, FEMALE, OTHER
#     dob: str # Expected "DD-MM-YYYY" format, will be converted to date object
#     blood_group: Optional[str] = ""

#     # Student Academic Details
#     class_room: str
#     section: str
#     roll_no: str

#     # Student ID Details (all optional strings)
#     aadhaar_no: Optional[str] = ""
#     abha_id: Optional[str] = ""
#     mp_uhid: Optional[str] = ""

#     # Student Other Details
#     food_preferences: Optional[str] = ""

#     # Address Details (all optional strings)
#     address_line1: Optional[str] = ""
#     address_line2: Optional[str] = ""
#     landmark: Optional[str] = ""
#     street: Optional[str] = ""
#     state: Optional[str] = ""
#     pincode: str

#     # Contact and Country Details for the student or general contact
#     # This 'phone' is the primary contact for the student record itself.
#     phone: str
#     country_code: Optional[str]
#     country: Optional[str]

#     primary_first_name: Optional[str] = ""
#     primary_middle_name: Optional[str] = ""
#     primary_last_name: Optional[str] = ""
#     primary_phone: Optional[str] = ""
#     primary_email: str
#     secondary_first_name: Optional[str] = ""
#     secondary_middle_name: Optional[str] = ""
#     secondary_last_name: Optional[str] = ""
#     secondary_phone: Optional[str] = ""
#     secondary_email: str

#     profile_image: Optional[str] = None

class IndividualStudentCreateSchema(BaseModel):
    # Student Personal Details
    first_name: str
    middle_name: Optional[str] = ""
    last_name: Optional[str] = ""
    gender: Optional[str] = ""
    dob: str  # Expected in formats like "DD-MM-YYYY", "MM/DD/YYYY", "YYYY-MM-DD"
    blood_group: Optional[str] = ""

    # Student Academic Details
    class_room: str
    section: str
    roll_no: str

    # Student ID Details
    aadhaar_no: Optional[str] = ""
    abha_id: Optional[str] = ""
    mp_uhid: Optional[str] = ""

    # Student Other Details
    food_preferences: Optional[str] = ""

    # Address Details
    address_line1: Optional[str] = ""
    address_line2: Optional[str] = ""
    landmark: Optional[str] = ""
    street: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    country: Optional[str] = ""
    country_code: Optional[str] = ""  # e.g., '+91'
    phone: str

    # Parent Details
    primary_first_name: Optional[str] = ""
    primary_middle_name: Optional[str] = ""
    primary_last_name: Optional[str] = ""
    primary_email: Optional[str] = ""
    primary_mobile: Optional[str] = ""
    primary_phone: Optional[str] = ""
    secondary_first_name: Optional[str] = ""
    secondary_middle_name: Optional[str] = ""
    secondary_last_name: Optional[str] = ""
    secondary_phone: Optional[str] = ""
    secondary_email: Optional[str] = ""

    profile_image: Optional[str] = ""

    @field_validator("blood_group")
    def validate_blood_group(cls, v):
        if v and v.strip():
            valid_blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
            if v.upper() not in valid_blood_groups:
                raise ValueError(f"Blood group must be one of {valid_blood_groups}")
            return v.upper()
        return v

    @field_validator("dob")
    def validate_dob(cls, v):
        if not v:
            raise ValueError("DOB is required")
        for fmt in ("%d-%m-%Y", "%m/%d/%Y", "%Y-%m-%d", "%d/%m/%Y"):
            try:
                datetime.strptime(v, fmt)
                return v
            except ValueError:
                continue
        raise ValueError("Invalid date format for dob. Expected DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD, or DD/MM/YYYY")



class StudentListSchema(BaseModel):
    school_id: Optional[int] = None
    school_name: Optional[str] = ""
    school_full_name: Optional[str] = ""
    school_logo: Optional[str] = ""
    school_code: Optional[str] = ""
    registration_no: Optional[str] = ""
    country_code: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""


    address_line1: Optional[str] = ""
    address_line2: Optional[str] = ""
    landmark: Optional[str] = ""
    street: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    country: Optional[str] = ""

    status: Optional[bool] = True


    total_staff: Optional[int] = 0
    total_students: Optional[int] = 0



class SchoolUpdateSchema(BaseModel):
    school_name: Optional[str] = ""
    school_full_name: Optional[str] = ""
    school_logo: Optional[str] = ""
    school_code: Optional[str] = ""
    registration_no: Optional[str] = ""
    country_code: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    address_line1: Optional[str] = ""
    address_line2: Optional[str] = ""
    landmark: Optional[str] = ""
    street: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    country: Optional[str] = ""
    primary_contact_fullname: Optional[str] = ""
    primary_contact_email: Optional[EmailStr] = ""
    primary_contact_phone:Optional[str]=""
    admin_contact_fullname: Optional[str] = ""
    admin_contact_email: Optional[EmailStr] = ""
    admin_contact_phone: Optional[str] = ""
    status: Optional[bool] = True

    class Config:
        json_schema_extra = {
            "example": {
                "school_name": "Updated Central School",
                "school_full_name": "Updated Central Model School",
                "school_logo": "", # Example: send empty to clear, or new base64
                "school_code": "UCSM",
                "registration_no": "REG12345UPDATE",
                "country_code": "91",
                "phone": "9876543210",
                "location": "New Delhi",
                "address_line1": "123 Education Lane",
                "address_line2": "Knowledge Park",
                "landmark": "Near City Library",
                "street": "Main Street",
                "state": "Delhi",
                "pincode": "110001",
                "country": "India",
                "primary_contact_fullname": "Jane Doe",
                "primary_contact_email": "jane.doe@example.com",
                "admin_contact_fullname": "John Admin",
                "admin_contact_email": "john.admin@example.com",
                "admin_contact_phone": "9000000001",
                "status": True
            }
        }


class TeacherCreate(BaseModel):
    """Base schema for a Teacher, containing all common fields."""
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    middle_name: str = Field(default="", max_length=50)
    email: str = Field(default="", max_length=100)

    country_calling_code: str = Field(default="", max_length=5)
    phone: str = Field(..., max_length=20)

    # These non-string fields remain Optional as they cannot be ""
    dob: Optional[date] = Field(default=None)
    gender: Optional[str] = Field(default="")

    profile_image: str = Field(default="")
    address_line_1: str = Field(default="", max_length=100)
    address_line_2: str = Field(default="", max_length=100)
    landmark: str = Field(default="", max_length=100)
    location: str = Field(default="", max_length=50)
    street: str = Field(default="", max_length=100)
    state: str = Field(default="", max_length=100)
    pincode: str = Field(default="", max_length=10)
    country: str = Field(default="", max_length=50)
    school_id: Optional[str] = Field(default=None, max_length=50)
    # Role-specific fields changed to default to ""
    class_room: str = Field(default="", max_length=10)
    section: str = Field(default="", max_length=2)







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
    location: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    country_calling_code: Optional[str]
    country: Optional[str]


class TeacherListResponse(BaseModel):
    total: int
    teachers: List[TeacherResponse]






class TeacherUpdate(BaseModel):
    first_name: str  = None
    last_name: str  = None
    middle_name: Optional[str]  = None
    username: str  = None
    phone: str = None
    email: Optional[str]  = None
    profile_image: Optional[str]  = None
    class_room: Optional[str]  = None
    section: Optional[str]  = None
    user_role: str  = None
    role_type: str  = None
    dob: Optional[date]  = None
    gender: Optional[str]  = None
    address_line_1: Optional[str]  = None
    address_line_2: Optional[str]  = None
    landmark: Optional[str]  = None
    location: Optional[str]  = None 
    street: Optional[str]  = None
    state: Optional[str]  = None
    pincode: Optional[str]  = None
    country_calling_code: Optional[str]  = None
    country: Optional[str]  = None


# class TeacherImportData(BaseModel):
#     first_name: str
#     last_name: str
#     middle_name: Optional[str] = ""
#     phone: str
#     country_calling_code: Optional[str] = "+91"  # Assuming default if not provided
#     email: EmailStr
#     class_room: Optional[str] = ""
#     section: Optional[str] = ""
#     dob: Optional[str] = None  # Will be validated for YYYY-MM-DD
#     gender: Optional[str] = ""

#     username: Optional[str] = ""

class TeacherImportData(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = ""
    phone: str
    country_calling_code: Optional[str] = "+91"  # Assuming default if not provided
    email: EmailStr
    class_room: Optional[str] = ""
    section: Optional[str] = ""
    dob: Optional[str] = None  # Will be validated for YYYY-MM-DD
    gender: Optional[str] = ""
    address_line_1: Optional[str] = ""
    address_line_2: Optional[str] = ""
    landmark: Optional[str] = ""
    street_name: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    country: Optional[str] = ""
    username: Optional[str] = ""
    
class AssignStaffRequest(BaseModel):
    date_time: str  # Expected format: "2025-06-10 15:30:00"
    user_id: int
    team_type: str
    team_role: str
    school_id: int
    class_name: Optional[str] = None
    section: Optional[str] = None
    from_time: str  # e.g., "8:00 AM"
    to_time: str    # e.g., "12:00 PM"
    is_completed: Optional[bool] = None 

class AssignStaffResponse(BaseModel):
    assignment_id: int
    user_id: int
    team_role: str
    school_id: int
    class_name: str
    section: str
    created_at: datetime
    from_time: str
    to_time: str

