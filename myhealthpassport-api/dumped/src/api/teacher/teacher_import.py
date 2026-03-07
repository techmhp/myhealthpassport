import io
import re
import logging
from datetime import datetime
from typing import Dict, List

import pandas as pd
from fastapi import APIRouter, Depends, File, UploadFile, Form
from passlib.context import CryptContext
from pydantic import ValidationError
from tortoise.exceptions import IntegrityError
from tortoise.transactions import in_transaction

from src.core.manager import get_current_user
from src.models.school_models import Schools
from src.models.user_models import SchoolStaff, SchoolRoles
from src.schemas.user_schema import CreateTeacherSchema

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Password hashing context
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def generate_username(first_name: str, last_name: str = None, existing_usernames: set = None) -> str:
    """Generate a unique username from first_name and last_name."""
    first_name = re.sub(r"[^a-zA-Z0-9]", "", first_name.lower()).strip()
    last_name = re.sub(r"[^a-zA-Z0-9]", "", last_name.lower()).strip() if last_name else ""
    
    base_username = f"{first_name}{last_name}" if last_name else first_name
    if not base_username:
        base_username = "teacher"

    base_username = base_username[:50]
    username = base_username
    suffix = 1
    while existing_usernames and username in existing_usernames:
        username = f"{base_username}{suffix}"
        if len(username) > 50:
            username = f"{base_username[:50-len(str(suffix))]}{suffix}"
        suffix += 1
    return username

def clean_phone_number(phone: str) -> str:
    """Clean phone number to ensure it's in the correct format."""
    if not phone:
        return ""
    try:
        if isinstance(phone, (float, int)) or ("." in str(phone) and str(phone).replace(".", "").isdigit()):
            phone = str(int(float(phone)))
        else:
            phone = str(phone)
    except (ValueError, TypeError):
        pass
    phone = re.sub(r"[^\d+]", "", phone)
    if not phone.startswith("+"):
        phone = "+" + phone
    return phone

def clean_pincode(pincode) -> int:
    """Convert pincode to proper integer format."""
    try:
        if pincode is None or str(pincode).strip() == "":
            return 100000
        if isinstance(pincode, (float, int)) or str(pincode).replace(".", "").isdigit():
            pincode_value = int(float(pincode))
            if not 100000 <= pincode_value <= 999999:
                return 100000
            return pincode_value
        pincode_str = re.sub(r"[^\d]", "", str(pincode))
        return int(pincode_str) if pincode_str and 100000 <= int(pincode_str) <= 999999 else 100000
    except (ValueError, TypeError):
        return 100000

def map_csv_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map CSV columns to the expected format."""
    column_mapping = {
        "teacher_address": "address_line_1",
        "teacher_city": "street",
        "teacher_nationality": "country",
        "teacher_phone_no": "phone",
        "teacher_email": "email",
    }
    for old_col, new_col in column_mapping.items():
        if old_col in df.columns and new_col not in df.columns:
            df[new_col] = df[old_col]
    return df

def format_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and format the DataFrame to meet validation requirements."""
    df = df.where(pd.notna(df), None)

    if "phone" in df.columns:
        df["phone"] = df["phone"].apply(clean_phone_number)
    if "country_calling_code" in df.columns:
        df["country_calling_code"] = df["country_calling_code"].apply(
            lambda x: f"+{int(float(x))}" if x and (isinstance(x, (int, float)) or re.match(r"^\d+\.?\d*$", str(x))) else (x if x else "+1")
        )
    if "pincode" in df.columns:
        df["pincode"] = df["pincode"].apply(clean_pincode)

    default_values = {
        "address_line_1": "Unknown",
        "street": "Unknown",
        "country": "Unknown",
        "country_calling_code": "+1",
        "state": "Unknown",
        "gender": "Unknown",
    }
    for col, default in default_values.items():
        if col in df.columns:
            df[col] = df[col].apply(lambda x: default if x is None or str(x).strip() == "" else x)
    return df

def validate_row(row, index):
    """Validate a single CSV row for required fields and formats."""
    errors = []
    required_strings = ["first_name", "last_name", "gender", "address_line_1", "street", "state", "country_calling_code", "phone", "country", "email"]
    for field in required_strings:
        value = row.get(field, "")
        if not value or len(str(value).strip()) == 0:
            errors.append(f"{field} is missing or empty")

    dob = row.get("dob")
    if dob:
        try:
            datetime.strptime(dob, "%Y-%m-%d")
        except ValueError:
            errors.append("dob is not a valid date (expected YYYY-MM-DD)")

    try:
        pincode = int(float(row.get("pincode", 100000)))
        if not 100000 <= pincode <= 999999:
            errors.append("pincode must be a 6-digit number")
    except (ValueError, TypeError):
        errors.append("pincode must be a valid integer")

    # Validate id if provided
    if "id" in row:
        try:
            teacher_id = int(float(row.get("id")))
            if teacher_id <= 0:
                errors.append("id must be a positive integer")
        except (ValueError, TypeError):
            errors.append("id must be a valid integer")

    return {"row": index + 2, "error": "; ".join(errors)} if errors else None

# @router.post("/school-admin/import-teachers", response_model=dict)
# async def import_teachers(
#     file: UploadFile = File(...),
#     school_id: int = Form(...),
#     user_data: dict = Depends(get_current_user)
# ):
#     """
#     Import teachers' data from a CSV file.
#     Expected CSV columns:
#     - id (optional)
#     - first_name, last_name, middle_name, gender, dob, email, phone, country_calling_code,
#     - address_line_1, address_line_2, landmark, street, state, pincode, country,
#     - profile_image, username (optional), password (optional)

#     Parameters:
#     - file: CSV file containing teacher data
#     - school_id: ID of the school (form field)

#     Returns:
#     - JSON response with import summary, successful records, failed records, and error summary
#     """
#     # Log the incoming user data for debugging
#     logger.info(f"User data received: {user_data}")

#     # Validate user authentication and permissions
#     user_id = user_data.get("user_id")  # Updated to match the key in user_data
#     current_user = None

#     if user_id:
#         try:
#             user_id = int(user_id)  # Ensure user_id is an integer
#             current_user = await SchoolStaff.filter(id=user_id).first()
#             if not current_user:
#                 logger.warning(f"User with ID {user_id} not found, attempting fallback")
#         except (ValueError, TypeError):
#             logger.warning(f"Invalid user ID format: {user_id}, attempting fallback")

#     # Fallback to username or email if id is not found or invalid
#     if not current_user:
#         username = user_data.get("username")
#         email = user_data.get("email")
        
#         if username:
#             current_user = await SchoolStaff.filter(username=username).first()
#             if current_user:
#                 logger.info(f"User found with username {username}")
#             else:
#                 logger.warning(f"User with username {username} not found")
        
#         if not current_user and email:
#             current_user = await SchoolStaff.filter(email=email).first()
#             if current_user:
#                 logger.info(f"User found with email {email}")
#             else:
#                 logger.warning(f"User with email {email} not found")

#     # If still no user found, use a default user for testing (remove in production)
#     if not current_user:
#         logger.warning("No user found, using default admin user for testing")
#         current_user = await SchoolStaff.filter(user_role=SchoolRoles.SCHOOL_ADMIN).first()
#         if not current_user:
#             return {
#                 "status": "error",
#                 "status_code": 404,
#                 "message": "No admin user found in the system"
#             }

#     # Ensure the user is a school admin
#     if current_user.user_role != SchoolRoles.SCHOOL_ADMIN:
#         return {
#             "status": "error",
#             "status_code": 403,
#             "message": "Only school admins can import teachers"
#         }

#     # Validate school_id using the correct field name (school_id instead of id)
#     school = await Schools.filter(school_id=school_id).first()
#     if not school:
#         return {
#             "status": "error",
#             "status_code": 400,
#             "message": f"School with school_id {school_id} not found"
#         }

#     # Ensure the admin belongs to the provided school
#     if current_user.school_id != school_id:
#         return {
#             "status": "error",
#             "status_code": 403,
#             "message": "You can only import teachers for your own school"
#         }

#     # Validate file format
#     if not file.filename.endswith(".csv"):
#         return {
#             "status": "error",
#             "status_code": 400,
#             "message": "File must be a CSV"
#         }

#     # Read and process CSV
#     contents = await file.read()
#     if not contents:
#         return {
#             "status": "error",
#             "status_code": 400,
#             "message": "Uploaded file is empty"
#         }

#     df_initial = pd.read_csv(io.StringIO(contents.decode("utf-8")))
#     dtype_dict = {col: str for col in df_initial.columns}
#     df = pd.read_csv(io.StringIO(contents.decode("utf-8")), dtype=dtype_dict)
#     df = map_csv_columns(df)

#     # Drop sensitive columns if provided
#     if "password" in df.columns:
#         df.drop("password", axis=1, inplace=True)

#     df = format_dataframe(df)

#     # Validate required columns
#     required_columns = ["first_name", "last_name", "gender", "address_line_1", "street", "state", "pincode", "country_calling_code", "phone", "country", "email"]
#     missing_columns = [col for col in required_columns if col not in df.columns]
#     if missing_columns:
#         return {
#             "status": "error",
#             "status_code": 400,
#             "message": f"Missing required columns: {', '.join(missing_columns)}"
#         }

#     success_records = []
#     failed_records = []
#     existing_usernames = set(await SchoolStaff.filter().values_list("username", flat=True))
#     existing_emails = set(await SchoolStaff.filter().values_list("email", flat=True))
#     existing_phones = set(await SchoolStaff.filter().values_list("phone", flat=True))
#     existing_ids = set(await SchoolStaff.filter().values_list("id", flat=True))

#     # Process each row in the CSV
#     async with in_transaction():
#         for index, row in df.iterrows():
#             try:
#                 row_dict = row.to_dict()
#                 row_error = validate_row(row_dict, index)
#                 if row_error:
#                     failed_records.append(row_error)
#                     continue

#                 # Extract and validate the id if provided
#                 teacher_id = None
#                 if "id" in row_dict and row_dict["id"]:
#                     try:
#                         teacher_id = int(float(row_dict["id"]))
#                         if teacher_id in existing_ids:
#                             failed_records.append({"row": index + 2, "error": f"ID {teacher_id} already exists"})
#                             continue
#                     except (ValueError, TypeError):
#                         failed_records.append({"row": index + 2, "error": "Invalid ID format"})
#                         continue

#                 teacher_data = {
#                     "first_name": row_dict.get("first_name", "").strip() or "Unknown",
#                     "middle_name": row_dict.get("middle_name") or "",
#                     "last_name": row_dict.get("last_name", "").strip() or "Unknown",
#                     "gender": row_dict.get("gender", "").strip().upper(),
#                     "dob": datetime.strptime(row_dict.get("dob"), "%Y-%m-%d").date() if row_dict.get("dob") else None,
#                     "email": row_dict.get("email", "").strip(),
#                     "phone": row_dict.get("phone", "").strip(),
#                     "country_calling_code": row_dict.get("country_calling_code", "").strip() or "+1",
#                     "address_line_1": row_dict.get("address_line_1", "").strip() or "Unknown",
#                     "address_line_2": row_dict.get("address_line_2", None),
#                     "landmark": row_dict.get("landmark", None),
#                     "street": row_dict.get("street", "").strip() or "Unknown",
#                     "state": row_dict.get("state", "").strip() or "Unknown",
#                     "pincode": str(int(float(row_dict.get("pincode", 100000)))),
#                     "country": row_dict.get("country", "").strip() or "Unknown",
#                     "profile_image": row_dict.get("profile_image", None),
#                     "user_role": SchoolRoles.TEACHER,
#                     "role_type": "SCHOOL_STAFF",
#                     "is_active": True,
#                     "is_verified": True,
#                     "school_id": school_id,  # Use the provided school_id
#                 }

#                 # Include the id in teacher_data if provided
#                 if teacher_id is not None:
#                     teacher_data["id"] = teacher_id

#                 # Generate username if not provided
#                 username = row_dict.get("username", "").strip()
#                 if not username:
#                     username = generate_username(teacher_data["first_name"], teacher_data["last_name"], existing_usernames)
#                 teacher_data["username"] = username

#                 # Set default password (hashed)
#                 teacher_data["password"] = pwd_context.hash("default_password")  # Replace with a secure default

#                 # Validate teacher data using Pydantic schema
#                 try:
#                     teacher_validated = CreateTeacherSchema(**teacher_data)
#                 except ValidationError as ve:
#                     failed_records.append({"row": index + 2, "error": f"Pydantic validation error: {str(ve)}"})
#                     continue

#                 # Check for duplicates
#                 if teacher_data["email"] in existing_emails:
#                     failed_records.append({"row": index + 2, "error": f"Email {teacher_data['email']} already exists"})
#                     continue
#                 if teacher_data["phone"] in existing_phones:
#                     failed_records.append({"row": index + 2, "error": f"Phone {teacher_data['phone']} already exists"})
#                     continue
#                 if teacher_data["username"] in existing_usernames:
#                     failed_records.append({"row": index + 2, "error": f"Username {teacher_data['username']} already exists"})
#                     continue

#                 # Create teacher record
#                 try:
#                     teacher = await SchoolStaff.create(**teacher_validated.dict(exclude_unset=True))
#                     existing_usernames.add(teacher.username)
#                     existing_emails.add(teacher.email)
#                     existing_phones.add(teacher.phone)
#                     existing_ids.add(teacher.id)
#                 except IntegrityError as e:
#                     failed_records.append({"row": index + 2, "error": f"Failed to create teacher: {str(e)}"})
#                     continue

#                 success_records.append({
#                     "row": index + 2,
#                     "teacher": {
#                         "id": teacher.id,
#                         "full_name": f"{teacher.first_name} {teacher.last_name}",
#                         "username": teacher.username,
#                         "email": teacher.email,
#                         "phone": teacher.phone,
#                     },
#                     "school": {"name": school.school_name},
#                 })

#             except Exception as e:
#                 failed_records.append({"row": index + 2, "error": f"Unexpected error: {str(e)}"})
#                 continue

#     # Summarize errors
#     error_summary = {}
#     for record in failed_records:
#         error_msg = record.get("error", "Unexpected error")
#         if error_msg in error_summary:
#             error_summary[error_msg].append(record["row"])
#         else:
#             error_summary[error_msg] = [record["row"]]

#     # Log the result
#     logger.info(f"Import completed: {len(success_records)} successful, {len(failed_records)} failed")

#     # Return JSON response
#     return {
#         "status": "success",
#         "message": f"Import completed: {len(success_records)} records successful, {len(failed_records)} records failed",
#         "summary": {
#             "total_processed": len(success_records) + len(failed_records),
#             "successful": len(success_records),
#             "failed": len(failed_records),
#         },
#         "successful_records": success_records,
#         "failed_records": failed_records,
#         "error_summary": error_summary,
#     }

@router.post("/import-teachers", response_model=dict)
async def import_teachers(
    file: UploadFile = File(...),
    school_id: int = Form(...),
    user_data: dict = Depends(get_current_user)
):
    """
    Import teachers' data from a CSV file.
    Expected CSV columns:
    - id (optional)
    - first_name, last_name, middle_name, gender, dob, email, phone, country_calling_code,
    - address_line_1, address_line_2, landmark, street, state, pincode, country,
    - profile_image, username (optional), password (optional)

    Parameters:
    - file: CSV file containing teacher data
    - school_id: ID of the school (form field)

    Returns:
    - JSON response with import summary, successful records, failed records, and error summary
    """
    # Log the incoming user data for debugging
    logger.info(f"User data received: {user_data}")

    # Validate user authentication and permissions
    user_id = user_data.get("user_id")
    current_user = None

    if user_id:
        try:
            user_id = int(user_id)
            current_user = await SchoolStaff.filter(id=user_id).first()
            if not current_user:
                logger.warning(f"User with ID {user_id} not found, attempting fallback")
        except (ValueError, TypeError):
            logger.warning(f"Invalid user ID format: {user_id}, attempting fallback")

    # Fallback to username or email if id is not found or invalid
    if not current_user:
        username = user_data.get("username")
        email = user_data.get("email")
        
        if username:
            current_user = await SchoolStaff.filter(username=username).first()
            if current_user:
                logger.info(f"User found with username {username}")
            else:
                logger.warning(f"User with username {username} not found")
        
        if not current_user and email:
            current_user = await SchoolStaff.filter(email=email).first()
            if current_user:
                logger.info(f"User found with email {email}")
            else:
                logger.warning(f"User with email {email} not found")

    # If still no user found, use a default user for testing (remove in production)
    if not current_user:
        logger.warning("No user found, using default admin user for testing")
        current_user = await SchoolStaff.filter(user_role=SchoolRoles.SCHOOL_ADMIN).first()
        if not current_user:
            return {
                "status": "error",
                "status_code": 404,
                "message": "No admin user found in the system"
            }

    # Ensure the user is a school admin
    if current_user.user_role != SchoolRoles.SCHOOL_ADMIN:
        return {
            "status": "error",
            "status_code": 403,
            "message": "Only school admins can import teachers"
        }

    # Validate school_id
    school = await Schools.filter(school_id=school_id).first()
    if not school:
        return {
            "status": "error",
            "status_code": 400,
            "message": f"School with school_id {school_id} not found"
        }

    # Ensure the admin belongs to the provided school
    if current_user.school_id != school_id:
        return {
            "status": "error",
            "status_code": 403,
            "message": "You can only import teachers for your own school"
        }

    # Validate file format
    if not file.filename.endswith(".csv"):
        return {
            "status": "error",
            "status_code": 400,
            "message": "File must be a CSV"
        }

    # Read and process CSV
    contents = await file.read()
    if not contents:
        return {
            "status": "error",
            "status_code": 400,
            "message": "Uploaded file is empty"
        }

    df_initial = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    dtype_dict = {col: str for col in df_initial.columns}
    df = pd.read_csv(io.StringIO(contents.decode("utf-8")), dtype=dtype_dict)
    df = map_csv_columns(df)

    # Drop sensitive columns if provided
    if "password" in df.columns:
        df.drop("password", axis=1, inplace=True)

    df = format_dataframe(df)

    # Validate required columns
    required_columns = ["first_name", "last_name", "gender", "address_line_1", "street", "state", "pincode", "country_calling_code", "phone", "country", "email"]
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        return {
            "status": "error",
            "status_code": 400,
            "message": f"Missing required columns: {', '.join(missing_columns)}"
        }

    success_records = []
    failed_records = []
    existing_usernames = set(await SchoolStaff.filter().values_list("username", flat=True))
    existing_emails = set(await SchoolStaff.filter().values_list("email", flat=True))
    existing_phones = set(await SchoolStaff.filter().values_list("phone", flat=True))
    existing_ids = set(await SchoolStaff.filter().values_list("id", flat=True))

    # Process each row in the CSV
    async with in_transaction():
        for index, row in df.iterrows():
            try:
                row_dict = row.to_dict()
                row_error = validate_row(row_dict, index)
                if row_error:
                    failed_records.append(row_error)
                    continue

                # Extract and validate the id if provided
                teacher_id = None
                if "id" in row_dict and row_dict["id"]:
                    try:
                        teacher_id = int(float(row_dict["id"]))
                        if teacher_id in existing_ids:
                            failed_records.append({"row": index + 2, "error": f"ID {teacher_id} already exists"})
                            continue
                    except (ValueError, TypeError):
                        failed_records.append({"row": index + 2, "error": "Invalid ID format"})
                        continue

                teacher_data = {
                    "first_name": row_dict.get("first_name", "").strip() or "Unknown",
                    "middle_name": row_dict.get("middle_name") or "",
                    "last_name": row_dict.get("last_name", "").strip() or "Unknown",
                    "gender": row_dict.get("gender", "").strip().upper(),
                    "dob": row_dict.get("dob") if row_dict.get("dob") else None,  # Keep dob as string
                    "email": row_dict.get("email", "").strip(),
                    "phone": row_dict.get("phone", "").strip(),
                    "country_calling_code": row_dict.get("country_calling_code", "").strip() or "+1",
                    "address_line_1": row_dict.get("address_line_1", "").strip() or "Unknown",
                    "address_line_2": row_dict.get("address_line_2", None),
                    "landmark": row_dict.get("landmark", None),
                    "street": row_dict.get("street", "").strip() or "Unknown",
                    "state": row_dict.get("state", "").strip() or "Unknown",
                    "pincode": str(int(float(row_dict.get("pincode", 100000)))),
                    "country": row_dict.get("country", "").strip() or "Unknown",
                    "profile_image": row_dict.get("profile_image", None),
                    "user_role": SchoolRoles.TEACHER,
                    "role_type": "SCHOOL_STAFF",
                    "is_active": True,
                    "is_verified": True,
                    "school_id": school_id,
                }

                # Include the id in teacher_data if provided
                if teacher_id is not None:
                    teacher_data["id"] = teacher_id

                # Generate username if not provided
                username = row_dict.get("username", "").strip()
                if not username:
                    username = generate_username(teacher_data["first_name"], teacher_data["last_name"], existing_usernames)
                teacher_data["username"] = username

                # Set default password (hashed)
                teacher_data["password"] = pwd_context.hash("default_password")  # Replace with a secure default

                # Validate teacher data using Pydantic schema
                try:
                    teacher_validated = CreateTeacherSchema(**teacher_data)
                except ValidationError as ve:
                    failed_records.append({"row": index + 2, "error": f"Pydantic validation error: {str(ve)}"})
                    continue

                # Check for duplicates
                if teacher_data["email"] in existing_emails:
                    failed_records.append({"row": index + 2, "error": f"Email {teacher_data['email']} already exists"})
                    continue
                if teacher_data["phone"] in existing_phones:
                    failed_records.append({"row": index + 2, "error": f"Phone {teacher_data['phone']} already exists"})
                    continue
                if teacher_data["username"] in existing_usernames:
                    failed_records.append({"row": index + 2, "error": f"Username {teacher_data['username']} already exists"})
                    continue

                # Create teacher record
                try:
                    teacher = await SchoolStaff.create(**teacher_validated.dict(exclude_unset=True))
                    existing_usernames.add(teacher.username)
                    existing_emails.add(teacher.email)
                    existing_phones.add(teacher.phone)
                    existing_ids.add(teacher.id)
                except IntegrityError as e:
                    failed_records.append({"row": index + 2, "error": f"Failed to create teacher: {str(e)}"})
                    continue

                success_records.append({
                    "row": index + 2,
                    "teacher": {
                        "id": teacher.id,
                        "full_name": f"{teacher.first_name} {teacher.last_name}",
                        "username": teacher.username,
                        "email": teacher.email,
                        "phone": teacher.phone,
                    },
                    "school": {"name": school.school_name},
                })

            except Exception as e:
                failed_records.append({"row": index + 2, "error": f"Unexpected error: {str(e)}"})
                continue

    # Summarize errors
    error_summary = {}
    for record in failed_records:
        error_msg = record.get("error", "Unexpected error")
        if error_msg in error_summary:
            error_summary[error_msg].append(record["row"])
        else:
            error_summary[error_msg] = [record["row"]]

    # Log the result
    logger.info(f"Import completed: {len(success_records)} successful, {len(failed_records)} failed")

    # Return JSON response
    return {
        "status": "success",
        "message": f"Import completed: {len(success_records)} records successful, {len(failed_records)} records failed",
        "summary": {
            "total_processed": len(success_records) + len(failed_records),
            "successful": len(success_records),
            "failed": len(failed_records),
        },
        "successful_records": success_records,
        "failed_records": failed_records,
        "error_summary": error_summary,
    }

def validate_row(row, index):
    """Validate a single CSV row for required fields and formats."""
    errors = []
    required_strings = ["first_name", "last_name", "gender", "address_line_1", "street", "state", "country_calling_code", "phone", "country", "email"]
    for field in required_strings:
        value = row.get(field, "")
        if not value or len(str(value).strip()) == 0:
            errors.append(f"{field} is missing or empty")

    dob = row.get("dob")
    if dob:
        try:
            # Validate that dob is a string in YYYY-MM-DD format
            if not isinstance(dob, str) or not re.match(r"^\d{4}-\d{2}-\d{2}$", dob):
                errors.append("dob must be a string in YYYY-MM-DD format")
            else:
                datetime.strptime(dob, "%Y-%m-%d")  # Ensure it’s a valid date
        except ValueError:
            errors.append("dob is not a valid date (expected YYYY-MM-DD)")

    try:
        pincode = int(float(row.get("pincode", 100000)))
        if not 100000 <= pincode <= 999999:
            errors.append("pincode must be a 6-digit number")
    except (ValueError, TypeError):
        errors.append("pincode must be a valid integer")

    # Validate id if provided
    if "id" in row:
        try:
            teacher_id = int(float(row.get("id")))
            if teacher_id <= 0:
                errors.append("id must be a positive integer")
        except (ValueError, TypeError):
            errors.append("id must be a valid integer")

    return {"row": index + 2, "error": "; ".join(errors)} if errors else None