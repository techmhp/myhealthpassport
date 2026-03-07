from typing import Optional, Tuple
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException
from pydantic import BaseModel, ValidationError
from tortoise.transactions import in_transaction
from tortoise.exceptions import IntegrityError
from passlib.context import CryptContext
from src.core.manager import get_current_user
from src.models.user_models import SchoolStaff, SchoolRoles, AdminTeamRoles
from src.models.school_models import Schools
from src.utils.response import StandardResponse
from src.schemas.user_schema import CreateSchoolAdminSchema, SchoolAdminResponse
import os
import uuid
from datetime import datetime

router = APIRouter()

# Password hashing context
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Directory for storing admin profile pictures
ADMIN_PROFILE_PICS_DIR = "uploads/admins_profile_pics"
os.makedirs(ADMIN_PROFILE_PICS_DIR, exist_ok=True)

async def save_profile_picture(file: UploadFile) -> str:
    try:
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_extension}"
        file_path = os.path.join(ADMIN_PROFILE_PICS_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        return os.path.join("admins_profile_pics", unique_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail={"status": False, "message": "Failed to save profile picture", "errors": {"file": str(e)}})

def parse_dob(dob: Optional[str]) -> Optional[str]:
    if not dob:
        return None
    try:
        return datetime.strptime(dob, "%Y-%m-%d").strftime("%Y-%m-%d")
    except ValueError:
        try:
            return datetime.strptime(dob, "%d-%m-%Y").strftime("%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Invalid date format for dob: {dob}. Expected formats: YYYY-MM-DD or DD-MM-YYYY")

@router.post("/create-school-admin", response_model=StandardResponse, status_code=201)
async def create_school_admin(
    first_name: str = Form(...),
    last_name: str = Form(...),
    middle_name: str = Form(default=""),
    username: str = Form(...),
    phone: str = Form(...),
    email: str = Form(default=""),
    password: str = Form(...),
    dob: Optional[str] = Form(default=None),
    gender: str = Form(default=""),
    address_line_1: str = Form(default=""),
    address_line_2: str = Form(default=""),
    landmark: str = Form(default=""),
    street: str = Form(default=""),
    state: str = Form(default=""),
    pincode: str = Form(default=""),
    country: str = Form(default=""),
    country_calling_code: str = Form(default=""),
    school_id: int = Form(...),
    is_active=True,
    is_verified=True,
    class_room: Optional[str] = Form(default=""),  # Optional, defaults to empty string
    section: Optional[str] = Form(default=""),  # Optional, defaults to empty string
    profile_picture: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user) # No type hint to allow StandardResponse or dict
):
    # Check if current_user is a StandardResponse (e.g., authentication error)
    if isinstance(current_user, StandardResponse):
        return current_user

    # Check if the current user is a super admin
    if current_user.get("user_role") != AdminTeamRoles.SUPER_ADMIN:
        return StandardResponse(
            status=False,
            message="Not authorized. Only super admins can create school admins.",
            data={"errors": {"user_role": "User is not a super admin."}}
        )
    
    try:
        # Verify the school exists
        school = await Schools.filter(school_id=school_id).first()
        if not school:
            return StandardResponse(
                status=False,
                message="School not found.",
                data={"errors": {"school_id": "No school found with the provided ID."}}
            )

        # Hash the password
        hashed_password = pwd_context.hash(password)
        
        # Parse date of birth
        dob = parse_dob(dob)

        # Handle profile picture upload
        profile_image_path = ""
        if profile_picture:
            profile_image_path = await save_profile_picture(profile_picture)

        # Validate class_room length
        if class_room and len(class_room) > 10:
            return StandardResponse(
                status=False,
                message="Validation error.",
                data={"errors": {"class_room": "Class room cannot exceed 10 characters."}}
            )

        # Validate section length
        if section and len(section) > 10:
            return StandardResponse(
                status=False,
                message="Validation error.",
                data={"errors": {"section": "Section cannot exceed 10 characters."}}
            )

        # Create the admin
        admin = await SchoolStaff.create(
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            username=username,
            phone=phone,
            email=email,
            password=hashed_password,
            dob=dob,
            gender=gender,
            address_line_1=address_line_1,
            address_line_2=address_line_2,
            landmark=landmark,
            street=street,
            state=state,
            pincode=pincode,
            country=country,
            country_calling_code=country_calling_code,
            user_role=SchoolRoles.SCHOOL_ADMIN,
            role_type="SCHOOL_STAFF",
            school_id=school_id,
            is_active=True,
            is_verified=True,
            profile_image=profile_image_path,
            class_room=class_room,  # Pass as is (empty string if not provided)
            section=section  # Pass as is (empty string if not provided)
        )

        response_data = SchoolAdminResponse(
            id=admin.id,
            username=admin.username,
            first_name=admin.first_name,
            last_name=admin.last_name,
            email=admin.email,
            school_id=admin.school_id,
            profile_image=admin.profile_image,
            class_room=admin.class_room,  # Include in response
            section=admin.section if hasattr(admin, 'section') else "",
            created_by=current_user["user_id"],     
            created_user_role=current_user["user_role"],       
            created_role_type=current_user["role_type"]
        )

        return StandardResponse(
            status=True,
            message="School admin created successfully.",
            data={"admin": response_data.dict()}
        )

    except IntegrityError as ie:
        return StandardResponse(
            status=False,
            message="Duplicate username or phone number.",
            data={"errors": {"username_or_phone": str(ie)}}
        )
    except ValidationError as ve:
        return StandardResponse(
            status=False,
            message="Validation error.",
            data={"errors": ve.errors()}
        )
    except ValueError as ve:
        return StandardResponse(
            status=False,
            message="Invalid date format.",
            data={"errors": {"dob": str(ve)}}
        )
    except Exception as e:
        return StandardResponse(
            status=False,
            message="An unexpected error occurred.",
            data={"errors": {"server": str(e)}}
        )