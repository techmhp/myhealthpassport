import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, constr, field_validator


class SchoolCreate(BaseModel):
    school_name: constr(min_length=1, max_length=400)
    registration_no: constr(min_length=1, max_length=400)
    country_code: constr(
        min_length=1, max_length=10, pattern=r"^\+[1-9]\d{0,3}$"
    )  # e.g., +91
    phone: constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    username: constr(
        min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$"
    )  # Alphanumeric, underscore, hyphen
    password: constr(min_length=8, max_length=50)
    location: Optional[constr(min_length=1, max_length=200)] = None
    primary_contact_fullname: Optional[
        constr(min_length=1, max_length=100, pattern=r"^[a-zA-Z\s]+$")
    ] = None
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: constr(
        min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$"
    )
    admin_contact_fullname: Optional[
        constr(min_length=1, max_length=100, pattern=r"^[a-zA-Z\s]+$")
    ] = None
    admin_contact_email: Optional[EmailStr] = None
    admin_contact_phone: str
    address_line1: Optional[constr(min_length=1, max_length=200)] = None
    address_line2: Optional[constr(min_length=1, max_length=200)] = None
    landmark: Optional[constr(min_length=1, max_length=100)] = None
    street: Optional[constr(min_length=1, max_length=100)] = None
    state: Optional[constr(min_length=1, max_length=100)] = None
    pincode: int
    country: Optional[constr(min_length=1, max_length=100)] = None
    status: Optional[bool] = None
    school_logo: Optional[constr(min_length=1, max_length=200)] = None  # URL or path
    school_location_link: Optional[constr(min_length=1, max_length=500)] = None

    @field_validator("password")
    def validate_password(cls, v):
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("pincode")
    def validate_pincode(cls, v):
        if not 100000 <= v <= 999999:
            raise ValueError("Pincode must be a 6-digit number")
        return v

    @field_validator("primary_contact_email", "admin_contact_email")
    def validate_email(cls, v):
        if v is not None:
            if len(v) > 100:
                raise ValueError("Email must not exceed 100 characters")
            if v != v.lower():
                raise ValueError("Email must be lowercase")
        return v


class SchoolUpdate(BaseModel):
    school_name: Optional[constr(min_length=1, max_length=400)] = None
    registration_no: Optional[constr(min_length=1, max_length=400)] = None
    country_code: Optional[
        constr(min_length=1, max_length=10, pattern=r"^\+[1-9]\d{0,3}$")
    ] = None
    phone: Optional[
        constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    ] = None
    username: Optional[
        constr(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    ] = None
    password: Optional[constr(min_length=8, max_length=50)] = None
    location: Optional[constr(min_length=1, max_length=200)] = None
    primary_contact_fullname: Optional[
        constr(min_length=1, max_length=100, pattern=r"^[a-zA-Z\s]+$")
    ] = None
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: Optional[
        constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    ] = None
    admin_contact_fullname: Optional[
        constr(min_length=1, max_length=100, pattern=r"^[a-zA-Z\s]+$")
    ] = None
    admin_contact_email: Optional[EmailStr] = None
    admin_contact_phone: Optional[
        constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    ] = None
    address_line1: Optional[constr(min_length=1, max_length=200)] = None
    address_line2: Optional[constr(min_length=1, max_length=200)] = None
    landmark: Optional[constr(min_length=1, max_length=100)] = None
    street: Optional[constr(min_length=1, max_length=100)] = None
    state: Optional[constr(min_length=1, max_length=100)] = None
    pincode: Optional[int] = None
    country: Optional[constr(min_length=1, max_length=100)] = None
    status: Optional[bool] = None
    school_logo: Optional[constr(min_length=1, max_length=200)] = None
    school_location_link: Optional[constr(min_length=1, max_length=500)] = None


    @field_validator("password")
    def validate_password(cls, v):
        if v is not None:
            if not re.search(r"[A-Za-z]", v):
                raise ValueError("Password must contain at least one letter")
            if not re.search(r"\d", v):
                raise ValueError("Password must contain at least one number")
            if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
                raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("pincode")
    def validate_pincode(cls, v):
        if v is not None:
            if not 100000 <= v <= 999999:
                raise ValueError("Pincode must be a 6-digit number")
        return v

    @field_validator("primary_contact_email", "admin_contact_email")
    def validate_email(cls, v):
        if v is not None:
            if len(v) > 100:
                raise ValueError("Email must not exceed 100 characters")
            if v != v.lower():
                raise ValueError("Email must be lowercase")
        return v


class SchoolResponse(BaseModel):
    school_id: int
    school_name: str
    registration_no: str
    country_code: str
    phone: str
    username: str
    location: Optional[str]
    primary_contact_fullname: Optional[str]
    primary_contact_email: Optional[str]
    primary_contact_phone: str
    admin_contact_fullname: Optional[str]
    admin_contact_email: Optional[str]
    admin_contact_phone: str
    address_line1: Optional[str]
    address_line2: Optional[str]
    landmark: Optional[str]
    street: Optional[str]
    state: Optional[str]
    pincode: int
    country: Optional[str]
    status: Optional[bool]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    school_location_link: Optional[str]
    school_logo: Optional[str]
