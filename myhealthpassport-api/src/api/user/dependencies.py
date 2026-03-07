from datetime import date
from typing import Optional

from fastapi import  Form
from pydantic import EmailStr

from src.models.user_models import AdminTeamRoles

from .schema import (AdminTeamUserCreateSchema, RegularUserCreateSchema,
                     SchoolCreateSchema)


async def get_admin_team_create_form_data(
    first_name: str = Form(...),
    last_name: str = Form(...),
    middle_name: Optional[str] = Form(""),
    phone: str = Form(...),
    email: Optional[str] = Form(""),
    user_role: AdminTeamRoles = Form(...),
    dob: Optional[str] = Form(None),
    gender: Optional[str] = Form(""),
    address_line_1: Optional[str] = Form(""),
    address_line_2: Optional[str] = Form(""),
    landmark: Optional[str] = Form(""),
    street_name: Optional[str] = Form(""),
    state: Optional[str] = Form(""),
    pincode: Optional[str] = Form(""),
    country_calling_code: Optional[str] = Form(""),
    country: Optional[str] = Form(""),
) -> AdminTeamUserCreateSchema:
    # Parse dob string to date if provided
    dob_date = None
    if dob:
        try:
            dob_date = date.fromisoformat(dob)
        except ValueError:
            raise ValueError("Invalid date format for dob, expected YYYY-MM-DD")
    
    return AdminTeamUserCreateSchema(
        first_name=first_name,
        last_name=last_name,
        middle_name=middle_name,
        phone=phone,
        email=email,
        user_role=user_role,
        dob=dob_date,
        gender=gender,
        address_line_1=address_line_1,
        address_line_2=address_line_2,
        landmark=landmark,
        street_name=street_name,
        state=state,
        pincode=pincode,
        country_calling_code=country_calling_code,
        country=country,
    )

async def get_regular_user_create_form_data(
    first_name: str = Form(...),
    last_name: str = Form(...),
    middle_name: Optional[str] = Form(""),
    phone: str = Form(...),
    email: Optional[EmailStr] = Form(""),
    user_role: Optional[str] = Form(""),
    dob: Optional[str] = Form(None),
    gender: Optional[str] = Form(""),
    address_line_1: Optional[str] = Form(""),
    address_line_2: Optional[str] = Form(""),
    landmark: Optional[str] = Form(""),
    street_name: Optional[str] = Form(""),
    state: Optional[str] = Form(""),
    pincode: Optional[str] = Form(""),
    country_calling_code: Optional[str] = Form(""),
    country: Optional[str] = Form(""),
) -> RegularUserCreateSchema:
    # Parse dob string to date if provided
    dob_date = None
    if dob:
        try:
            dob_date = date.fromisoformat(dob)
        except ValueError:
            raise ValueError("Invalid date format for dob, expected YYYY-MM-DD")
    
    return RegularUserCreateSchema(
        first_name=first_name,
        last_name=last_name,
        middle_name=middle_name,
        phone=phone,
        email=email,
        user_role=user_role,
        dob=dob_date,
        gender=gender,
        address_line_1=address_line_1,
        address_line_2=address_line_2,
        landmark=landmark,
        street_name=street_name,
        state=state,
        pincode=pincode,
        country_calling_code=country_calling_code,
        country=country,
    )

async def get_school_create_form_data(
    school_name: str = Form(...),
    school_fullname: str = Form(...),
    school_location_link: str = Form(...),
    school_code: str = Form(...),
    primary_contact_fullname: str = Form(...),
    primary_contact_email: str = Form(...),
    primary_contact_phone: str = Form(...),
    admin_contact_fullname: str = Form(...),
    admin_contact_email: str = Form(...),
    admin_contact_phone: str = Form(...),
    address_line1: str = Form(""),
    address_line2: Optional[str] = Form(""),
    landmark: Optional[str] = Form(""),
    street: Optional[str] = Form(""),
    state: Optional[str] = Form(""),
    pincode: Optional[str] = Form(""),
    phone: Optional[str] = Form(""),
    country: Optional[str] = Form(""),
    country_code: Optional[str] = Form(""),
    registration_no: Optional[str] = Form(""),
    location: Optional[str] = Form(""),
) -> SchoolCreateSchema:
    return SchoolCreateSchema(
        school_name=school_name,
        school_fullname=school_fullname,
        school_location_link=school_location_link,
        school_code=school_code,
        primary_contact_fullname=primary_contact_fullname,
        primary_contact_email=primary_contact_email,
        primary_contact_phone=primary_contact_phone,
        admin_contact_fullname=admin_contact_fullname,
        admin_contact_email=admin_contact_email,
        admin_contact_phone=admin_contact_phone,
        address_line1=address_line1,
        address_line2=address_line2,
        landmark=landmark,
        street=street,
        state=state,
        pincode=pincode,
        phone=phone,
        country=country,
        country_code=country_code,
        registration_no=registration_no,
        location=location,
    )