from typing import List, Optional
from datetime import date
from pydantic import BaseModel


class DoctorCreateRequest(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = ""
    education: Optional[str] = ""
    specialty: str
    experience: Optional[str] = ""
    location: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = ""
    pincode: Optional[str] = ""
    user_role:Optional[str] = ""
    phone: str
    email: str
    dob: Optional[date] = None
    gender: Optional[str] = ""
    address_line_1: Optional[str] = ""
    address_line_2: Optional[str] = ""
    landmark: Optional[str] = ""
    street_name: Optional[str] = ""
    country_calling_code: Optional[str] = ""
    username: str
    password: str
    availability: Optional[str] = ""
    profile_image: Optional[str] = None
    class Config:
        from_attributes  = True

class DoctorUpdateRequest(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = ""
    education: Optional[str] = ""
    specialty: str
    experience: Optional[str] = ""
    location: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = ""
    pincode: Optional[str] = ""
    phone: str
    email: str
    dob: Optional[date] = None
    gender: Optional[str] = ""
    address_line_1: Optional[str] = ""
    address_line_2: Optional[str] = ""
    landmark: Optional[str] = ""
    street_name: Optional[str] = ""
    country_calling_code: Optional[str] = ""
    username: str
    availability: Optional[str] = ""
    profile_image: Optional[str] = None
    class Config:
        from_attributes  = True

class DoctorResponse(BaseModel):
    doctor_id: int
    username: str
    first_name: str
    last_name: str
    phone: str
    username: str
    email: str
    specialty: str
    availability: Optional[str] = None
    profile_image: Optional[str] = None

    class Config:
        from_attributes  = True


class DoctorListResponse(BaseModel):
    doctors: List[DoctorResponse]
