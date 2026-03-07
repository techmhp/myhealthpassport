from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr, constr, field_serializer, field_validator

from src.models.user_models import ParentRoles


class ParentCreate(BaseModel):
    first_name: constr(
        min_length=1, max_length=50, pattern=r"^[a-zA-Z\s]+$"
    )  # Letters and spaces only, mandatory
    last_name: constr(
        min_length=1, max_length=50, pattern=r"^[a-zA-Z\s]+$"
    )  # Letters and spaces only, mandatory
    mobile: constr(
        min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$"
    )  # Phone number format, mandatory
    middle_name: Optional[
        constr(min_length=0, max_length=50, pattern=r"^[a-zA-Z\s.]*$")
    ] = None  # Allow periods
    email: Optional[EmailStr] = None
    relation: constr(min_length=1, max_length=50)  # e.g., 'Mother', 'Father'
    dob: Optional[date] = None
    gender: Optional[constr(min_length=1, max_length=20)] = None
    address_line_1: Optional[constr(min_length=0, max_length=100)] = None
    address_line_2: Optional[constr(min_length=0, max_length=100)] = None
    landmark: Optional[constr(min_length=0, max_length=100)] = None
    street_name: Optional[constr(min_length=0, max_length=100)] = None
    state: Optional[constr(min_length=0, max_length=100)] = None
    pincode: Optional[constr(min_length=0, max_length=100)] = None
    country_calling_code: Optional[constr(min_length=0, max_length=100)] = None
    country: Optional[constr(min_length=0, max_length=100)] = None
    user_role: ParentRoles = ParentRoles.PARENT
    is_active: bool = True
    is_verified: bool = False
    profile_image: Optional[constr(min_length=0, max_length=255)] = None

    @field_validator("gender")
    def validate_gender(cls, v):
        if v is not None:
            valid_genders = ["MALE", "FEMALE", "OTHER"]
            if v.upper() not in valid_genders:
                raise ValueError(f"Gender must be one of {valid_genders}")
            return v.upper()
        return v

    @field_validator("relation")
    def validate_relation(cls, v):
        valid_relations = ["Mother", "Father", "Guardian", "Other"]
        if v.capitalize() not in valid_relations:
            raise ValueError(f"Relation must be one of {valid_relations}")
        return v.capitalize()  # Capitalize the relation (e.g., "mother" -> "Mother")

    @field_validator("user_role")
    def validate_user_role(cls, v):
        return v  # Enum validation handled by Pydantic


class ParentUpdate(BaseModel):
    first_name: Optional[
        constr(min_length=1, max_length=50, pattern=r"^[a-zA-Z\s]+$")
    ] = None  # Letters and spaces only
    last_name: Optional[
        constr(min_length=1, max_length=50, pattern=r"^[a-zA-Z\s]+$")
    ] = None  # Letters and spaces only
    mobile: Optional[
        constr(min_length=10, max_length=20, pattern=r"^\+?1?\d{10,15}$")
    ] = None  # Phone number format
    middle_name: Optional[
        constr(min_length=0, max_length=50, pattern=r"^[a-zA-Z\s.]*$")
    ] = None
    email: Optional[EmailStr] = None
    relation: Optional[constr(min_length=1, max_length=50)] = None
    dob: Optional[date] = None
    gender: Optional[constr(min_length=1, max_length=20)] = None
    address_line_1: Optional[constr(min_length=0, max_length=100)] = None
    address_line_2: Optional[constr(min_length=0, max_length=100)] = None
    landmark: Optional[constr(min_length=0, max_length=100)] = None
    street_name: Optional[constr(min_length=0, max_length=100)] = None
    state: Optional[constr(min_length=0, max_length=100)] = None
    pincode: Optional[constr(min_length=0, max_length=100)] = None
    country_calling_code: Optional[constr(min_length=0, max_length=100)] = None
    country: Optional[constr(min_length=0, max_length=100)] = None
    user_role: Optional[ParentRoles] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    profile_image: Optional[constr(min_length=0, max_length=255)] = None

    @field_validator("gender")
    def validate_gender(cls, v):
        if v is not None:
            valid_genders = ["MALE", "FEMALE", "OTHER"]
            if v.upper() not in valid_genders:
                raise ValueError(f"Gender must be one of {valid_genders}")
            return v.upper()
        return v

    @field_validator("relation")
    def validate_relation(cls, v):
        if v is not None:
            valid_relations = ["Mother", "Father", "Guardian", "Other"]
            if v.capitalize() not in valid_relations:
                raise ValueError(f"Relation must be one of {valid_relations}")
            return v.capitalize()  # Capitalize the relation (e.g., "mother" -> "Mother")
        return v

    @field_validator("user_role")
    def validate_user_role(cls, v):
        return v  # Enum validation handled by Pydantic

# class ParentResponse(BaseModel):
#     id: int
#     first_name: str
#     last_name: str
#     middle_name: Optional[str]
#     mobile: str
#     email: Optional[str]
#     profile_image: Optional[str]
#     relation: str
#     role_type: str
#     user_role: str
#     is_active: bool
#     is_verified: bool
#     dob: Optional[date]
#     gender: Optional[str]
#     address_line_1: Optional[str]
#     address_line_2: Optional[str]
#     landmark: Optional[str]
#     street_name: Optional[str]
#     state: Optional[str]
#     pincode: Optional[str]
#     country_calling_code: Optional[str]
#     country: Optional[str]

#     @field_serializer('dob')
#     def serialize_dob(self, dob: Optional[date], _info):
#         return dob.isoformat() if dob else None

#     class Config:
#         from_attributes = True
       
from pydantic import BaseModel, field_serializer, model_validator
from typing import Optional
from datetime import date
import logging

class ParentResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    mobile: str
    email: Optional[str] = None
    profile_image: Optional[str] = None
    relation: str
    role_type: str
    user_role: str
    is_active: bool
    is_verified: bool
    dob: Optional[date] = None
    gender: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    landmark: Optional[str] = None
    street_name: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country_calling_code: Optional[str] = None
    country: Optional[str] = None

    @field_serializer('dob')
    def serialize_dob(self, dob: Optional[date], _info):
        return dob.isoformat() if dob else None

    @model_validator(mode='before')
    @classmethod
    def map_parent_fields(cls, data):
        logging.info(f"Input data type for ParentResponse validation: {type(data)}")
        logging.info(f"Input data for ParentResponse validation: {data}")
        if not isinstance(data, dict):
            # Convert object to dict if it's not already a dict
            data = {key: getattr(data, key, None) for key in dir(data) if not key.startswith('_')}
        mapped_data = {
            'id': data.get('id'),
            'first_name': data.get('primary_first_name') or '',
            'last_name': data.get('primary_last_name') or '',
            'middle_name': data.get('primary_middle_name'),
            'mobile': data.get('primary_mobile') or '',
            'email': data.get('primary_email'),
            'profile_image': data.get('profile_image'),
            'relation': data.get('user_role', 'PARENT'),
            'role_type': data.get('role_type', 'PARENT'),
            'user_role': data.get('user_role', 'PARENT'),
            'is_active': data.get('is_active', True),
            'is_verified': data.get('is_verified', True),
            'dob': data.get('dob'),
            'gender': data.get('gender'),
            'address_line_1': data.get('address_line_1'),
            'address_line_2': data.get('address_line_2'),
            'landmark': data.get('landmark'),
            'street_name': data.get('street_name'),
            'state': data.get('state'),
            'pincode': data.get('pincode'),
            'country_calling_code': data.get('primary_country_calling_code'),
            'country': data.get('country'),
        }
        logging.info(f"Mapped data for ParentResponse: {mapped_data}")
        return mapped_data

    class Config:
        from_attributes = True
          