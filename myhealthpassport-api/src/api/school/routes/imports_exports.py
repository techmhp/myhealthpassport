import io
from datetime import datetime

import pandas as pd
from fastapi import Depends, File, UploadFile, status
from fastapi.responses import JSONResponse

from src.core.cache_maanger import ObjectCache
from src.core.manager import get_current_user
from src.models.student_models import ParentChildren, SchoolStudents, Students
from src.models.user_models import Parents, SchoolRoles, SchoolStaff,AdminTeamRoles,AdminTeam
from src.utils.response import StandardResponse
from src.models.school_models import Schools
from src.utils.transactions import (generate_transaction_number,
                                    generate_user_code)

from .. import router
from ..dependencies import (ParentChildrenCreateSchema,
                            SchoolImportConfirmSchema)
from ..schema import StudentCreate, TeacherImportData
from src.core.password_manager import create_password_hash



def clean_phone(phone):
    """Safely clean phone numbers from CSV float corruption"""
    if pd.isna(phone) or phone in [None, '', 'nan']:
        return ""
    phone_str = str(phone).strip()
    # Remove trailing '.0' from float conversion
    if phone_str.endswith('.0'):
        phone_str = phone_str[:-2]
    # Remove any whitespace or unwanted chars (optional)
    phone_str = phone_str.replace(" ", "").replace("-", "")
    return phone_str

def csv_columns_list():
    # Minimal required columns
    required_columns = [
        "student_first_name", "student_last_name", "student_gender", "student_dob",
        "student_class", "student_section", "student_roll_no", "phone"
    ]
    # Optional columns that are accepted if present
    optional_columns = [
        "student_middle_name", "student_blood_group",
        "student_aadhar_no", "student_abha_id", "student_mp_uhid",
        "student_food_preferences",
        "address_line_1", "address_line_2", "landmark", "street_name", "state", "pincode",
        "country_code", "country",
        "primary_first_name", "primary_middle_name", "primary_last_name", "primary_phone", "primary_email",
        "secondary_first_name", "secondary_middle_name", "secondary_last_name", "secondary_phone", "secondary_email",
        "parent_pincode",
    ]
    return required_columns + optional_columns




@router.post("/import-students-data", response_model=dict)
async def import_students_data(file: UploadFile = File(...), school_id: str | None = None, current_user: dict = Depends(get_current_user)):
    # Only these columns MUST be present as headers in the CSV
    original_required_strings = [
        "student_first_name", "student_last_name", "student_gender", "student_dob",
        "student_class", "student_section", "student_roll_no", "phone",
    ]

    # These columns must also be non-empty for each row
    strictly_required_non_empty_columns = [
        "student_first_name", "student_last_name", "student_gender", "student_dob",
        "student_class", "student_section", "student_roll_no", "phone",
    ]

    allowed_roles = [SchoolRoles.SCHOOL_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, AdminTeamRoles.SUPER_ADMIN]
    creator_role = current_user["user_role"]

    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role.value} is not allowed to create school students records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    if current_user["user_role"] in [AdminTeamRoles.PROGRAM_COORDINATOR, AdminTeamRoles.SUPER_ADMIN] and school_id is None:
        resp = StandardResponse(
            status=False,
            message="SUPER_ADMIN must provide a valid school_id.",
            data={},
            errors={"details": "school_id is required for SUPER_ADMIN."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    if file.content_type != 'text/csv' or not file.filename.endswith('.csv'):
        resp = StandardResponse(
            status=False,
            message="Unsupported file type. Please upload a CSV file.",
            data={},
            errors={"details": "Unsupported file type. Please upload a CSV file."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)

    try:
        contents = await file.read()
        column_errors = []
        df_initial = pd.read_csv(io.StringIO(contents.decode("utf-8-sig")))
        for col in df_initial.columns:
            if col not in csv_columns_list():
                column_errors.append(col)

        missing_expected_columns = [col for col in original_required_strings if col not in df_initial.columns]
        if missing_expected_columns:
            resp = StandardResponse(
                status=False,
                message=f"Missing required columns in CSV: {', '.join(missing_expected_columns)}.",
                data={},
                errors={"details": f"Missing columns: {', '.join(missing_expected_columns)}."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        df_processed = df_initial.fillna('')
        
        df_processed = df_processed[
            df_processed.apply(
                lambda row: any(str(val).strip() for val in row), 
                axis=1
            )
        ]

        # Check for duplicate rows based on roll_no, class, and section
        duplicate_errors = []
        duplicate_mask = df_processed.duplicated(subset=['student_roll_no', 'student_class', 'student_section'], keep=False)
        if duplicate_mask.any():
            # Group by roll_no, class, and section to find all duplicates
            grouped_duplicates = df_processed[duplicate_mask].groupby(['student_roll_no', 'student_class', 'student_section']).groups
            for (roll_no, class_room, section), indices in grouped_duplicates.items():
                row_numbers = [str(idx + 1) for idx in indices]  # 1-based indexing + header
                row_numbers_str = " and ".join(row_numbers)
                duplicate_errors.append(f"Duplicate entry for roll number {roll_no} in class {class_room}, section {section} at rows {row_numbers_str}.")

        # Keep only the first occurrence of each unique combination
        df_processed = df_processed.drop_duplicates(subset=['student_roll_no', 'student_class', 'student_section'], keep='first')

        row_errors = []
        for index, row in df_processed.iterrows():
            empty_required_fields_in_row = []
            for col in strictly_required_non_empty_columns:
                if col in row and str(row[col]).strip() == '':
                    empty_required_fields_in_row.append(col)

            if empty_required_fields_in_row:
                row_errors.append({
                    "row_number": index + 2,
                    "missing_fields": empty_required_fields_in_row,
                    "message": f"Row {index + 2}: The following fields cannot be empty: {', '.join(empty_required_fields_in_row)}."
                })

        if row_errors:
            resp = StandardResponse(
                status=False,
                message="Validation Error: Some required fields are empty. Please check the highlighted rows and fields.",
                data={"row_errors": row_errors},
                errors={"details": "Required fields are missing in some rows."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        # Fill in optional columns with empty string if not present in uploaded CSV
        optional_columns = [
            "student_middle_name", "student_blood_group",
            "student_aadhar_no", "student_abha_id", "student_mp_uhid", "student_food_preferences",
            "address_line_1", "address_line_2", "landmark", "street_name", "state", "pincode",
            "country_code", "country",
            "primary_first_name", "primary_middle_name", "primary_last_name", "primary_phone", "primary_email",
            "secondary_first_name", "secondary_middle_name", "secondary_last_name", "secondary_phone", "secondary_email",
            "parent_pincode",
        ]
        for col in optional_columns:
            if col not in df_processed.columns:
                df_processed[col] = ''

        df_processed["student_class"] = df_processed['student_class'].astype(str)
        df_processed['student_aadhar_no'] = df_processed['student_aadhar_no'].astype(str)
        df_processed['student_abha_id'] = df_processed['student_abha_id'].astype(str)
        df_processed['student_mp_uhid'] = df_processed['student_mp_uhid'].astype(str)
        df_processed['student_roll_no'] = df_processed['student_roll_no'].astype(str)
        df_processed['phone'] = df_processed['phone'].apply(clean_phone)
        df_processed['primary_phone'] = df_processed['primary_phone'].apply(clean_phone)
        df_processed['secondary_phone'] = df_processed['secondary_phone'].apply(clean_phone)
        df_processed['country_code'] = df_processed['country_code'].astype(str)
        df_processed['pincode'] = df_processed['pincode'].astype(str)

        df_processed['student_first_name'] = df_processed['student_first_name'].astype(str)
        df_processed['student_middle_name'] = df_processed['student_middle_name'].astype(str)
        df_processed['student_last_name'] = df_processed['student_last_name'].astype(str)
        df_processed['student_dob'] = df_processed['student_dob'].astype(str)
        df_processed['student_blood_group'] = df_processed['student_blood_group'].astype(str)
        df_processed['student_section'] = df_processed['student_section'].astype(str)
        df_processed['student_food_preferences'] = df_processed['student_food_preferences'].astype(str)

        df_processed['address_line_1'] = df_processed['address_line_1'].astype(str)
        df_processed['address_line_2'] = df_processed['address_line_2'].astype(str)
        df_processed['landmark'] = df_processed['landmark'].astype(str)
        df_processed['state'] = df_processed['state'].astype(str)

        df_processed['primary_first_name'] = df_processed['primary_first_name'].astype(str)
        df_processed['primary_middle_name'] = df_processed['primary_middle_name'].astype(str)
        df_processed['primary_last_name'] = df_processed['primary_last_name'].astype(str)
        df_processed['primary_email'] = df_processed['primary_email'].astype(str)
        df_processed['secondary_first_name'] = df_processed['secondary_first_name'].astype(str)
        df_processed['secondary_middle_name'] = df_processed['secondary_middle_name'].astype(str)
        df_processed['secondary_last_name'] = df_processed['secondary_last_name'].astype(str)
        df_processed['secondary_email'] = df_processed['secondary_email'].astype(str)

        df_processed["created_by"] = current_user.get("user_id", "")
        df_processed["created_user_role"] = current_user.get("user_role", "")
        df_processed["created_role_type"] = current_user.get("role_type", "")

        list_of_students = df_processed.to_dict(orient='records')

    except pd.errors.ParserError:
        resp = StandardResponse(
            status=False,
            message="Invalid CSV file format. Please ensure the file is correctly formatted.",
            data={},
            errors={"details": "Invalid CSV file format. Please ensure the file is correctly formatted."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)
    except UnicodeDecodeError:
        resp = StandardResponse(
            status=False,
            message="Could not decode file content. Please ensure the file is UTF-8 encoded.",
            data={},
            errors={"details": "Could not decode file content. Please ensure the file is UTF-8 encoded."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)
    except Exception as e:
        resp = StandardResponse(
            status=False,
            message=f"An unexpected error occurred while processing the file: {str(e)}",
            data={},
            errors={"details": "Could not decode file content. Please ensure the file is UTF-8 encoded."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        await file.close()

    if school_id is None:
        resp = StandardResponse(
            status=False,
            message="School ID is required for this operation.",
            data={},
            errors={"details": "School ID cannot be None."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    students_exist = []
    for student in list_of_students:
        student_exist = await SchoolStudents.filter(
            student__roll_no=student.get("student_roll_no", "").upper(),
            school_id=int(school_id)
        ).select_related('student').first()
        if student_exist:
            students_exist.append(f"student {student.get('student_roll_no')} exists in this school")

    if len(students_exist) > 0:
        resp = StandardResponse(
            status=False,
            message="\n, ".join(students_exist),
            data={
                "students_data": students_exist,
            },
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

    transaction_no = generate_transaction_number()
    cache_key = f"import_students_data-{transaction_no}"
    cache = ObjectCache(cache_key=cache_key)
    await cache.set(data=list_of_students, ttl=3600)

    message = f"Uploaded Data Preview {file.filename}"
    if duplicate_errors:
        message += " (Warning: Duplicate entries detected in the uploaded file)"

    resp = StandardResponse(
        status=True,
        message=message,
        data={
            "students_data": list_of_students,
            "transaction_no": transaction_no
        },
        errors={"details": "; ".join(duplicate_errors)} if duplicate_errors else {},
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

@router.post("/import-students-data-confirm", response_model=StandardResponse)
async def confirm_students_data(request_data: SchoolImportConfirmSchema, school_id: str | None = None, current_user: dict = Depends(get_current_user)):
    transaction_no = str(request_data.transaction_no)
    cache_key = f"import_students_data-{transaction_no}"
    cache = ObjectCache(cache_key=cache_key)

    data = await cache.get()
    if not data:
        resp = StandardResponse(
            status=False,
            message="Invalid Transaction Id",
            data={
                "transaction_no": transaction_no
            },
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    if not request_data.confirm:
        await cache.delete()
        resp = StandardResponse(
            status=True,
            message="Your Request has been cancelled",
            data={
                "transaction_no": transaction_no
            },
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

    allowed_roles = [SchoolRoles.SCHOOL_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR, AdminTeamRoles.SUPER_ADMIN]
    creator_role = current_user["user_role"]

    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role.value} is not allowed to create school students records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    if current_user["user_role"] in [ AdminTeamRoles.PROGRAM_COORDINATOR, AdminTeamRoles.SUPER_ADMIN] and school_id is None:
        resp = StandardResponse(
            status=False,
            message="SUPER_ADMIN must provide a valid school_id.",
            data={},
            errors={"details": "school_id is required for SUPER_ADMIN."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    if current_user["user_role"] == "SCHOOL_ADMIN":
        school_staff = await SchoolStaff.get(id=current_user.get("user_id")).prefetch_related('school')
        if not school_staff.school:
            resp = StandardResponse(
                status=False,
                message="School not found for the current user.",
                data={},
                errors={"details": f"No school associated with SchoolStaff ID {current_user.get('user_id')}."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
        else:
            school_id = school_staff.school.school_id

    school_id = int(school_id)
    school = await Schools.get_or_none(school_id=school_id)
    if not school:
        resp = StandardResponse(
            status=False,
            message=f"Invalid school_id: {school_id}.",
            data={},
            errors={"details": f"School with ID {school_id} does not exist."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    students_list = []
    errors = []

    if request_data.confirm:
        students_data = await cache.get()
        print(f"Retrieved {len(students_data)} students from cache")

        for student in students_data:
            student_details = {}
            student["created_by"] = str(current_user.get("user_id", ""))
            student["created_user_role"] = str(current_user.get("user_role", ""))
            student["created_role_type"] = str(current_user.get("role_type", ""))

            dob = None
            dob_str = student.get("student_dob", "").strip()
            if dob_str:
                for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
                    try:
                        dob = datetime.strptime(dob_str, fmt).date()
                        break
                    except ValueError:
                        continue
                if dob is None:
                    errors.append(f"Invalid date format for student_dob: {dob_str}. Expected mm/dd/yyyy, dd/mm/yyyy, dd-mm-yyyy, or yyyy-mm-dd.")
                    continue

            student_data = {
                "first_name": student.get("student_first_name", "").upper(),
                "middle_name": student.get("student_middle_name", "").upper(),
                "last_name": student.get("student_last_name", "").upper(),
                "gender": student.get("student_gender", "").upper(),
                "dob": dob,
                "class_room": student.get("student_class", ""),
                "section": student.get("student_section", "").upper(),
                "roll_no": student.get("student_roll_no", "").upper(),
                "aadhaar_no": str(student.get("student_aadhar_no", "")).strip(),
                "abha_id": str(student.get("student_abha_id", "")).strip(),
                "mp_uhid": str(student.get("student_mp_uhid", "")).strip(),
                "food_preferences": student.get("student_food_preferences", "").upper(),
                "address_line1": student.get("address_line_1", "").upper(),
                "address_line2": student.get("address_line_2", "").upper(),
                "landmark": student.get("landmark", "").upper(),
                "street": student.get("street_name", "").upper(),
                "state": student.get("state", "").upper(),
                "pincode": str(student.get("pincode", "")).strip(),
                "country_code": str(student.get("country_code", "")).strip(),
                "phone": str(student.get("phone", "")).strip(),
                "country": student.get("country", "").upper(),
                "blood_group": student.get("student_blood_group", "").upper(),
                "created_by": student.get("created_by"),
                "created_user_role": student.get("created_user_role"),
                "created_role_type": student.get("created_role_type"),
            }

            try:
                roll_no = student_data["roll_no"]
                class_room = student_data["class_room"]
                section = student_data["section"]

                # Use the correct relationship name: school_students
                existing_student = await Students.filter(
                    roll_no=roll_no,
                    class_room=class_room,
                    section=section
                ).filter(
                    school_students__school_id=school_id
                ).first()

                if existing_student:
                    errors.append(
                        f"Roll number {roll_no} already exists for class {class_room}, section {section} in school ID {school_id}."
                    )
                    continue
                student_validated = StudentCreate(**student_data)
                student_record = await Students.create(**student_validated.dict(exclude_unset=True))

                student_details_personal = student_data
                student_details_personal["id"] = student_record.id
                del student_details_personal["dob"]
                student_details["student"] = student_details_personal

                parent_details = []

                phone = str(student.get("phone", "")).strip()
                primary_mobile = str(student.get("primary_phone", "")).strip() if student.get("primary_phone", "") else phone

                if primary_mobile:
                    parent = await Parents.filter(primary_mobile=primary_mobile).first()
                    
                    parent_pincode = str(student.get("parent_pincode", "")).strip()
                    if not parent_pincode:
                        parent_pincode = str(student.get("pincode", "")).strip()
    
                    parent_data = {
                        "primary_first_name": student.get("primary_first_name", "").upper(),
                        "primary_middle_name": student.get("primary_middle_name", "").upper(),
                        "primary_last_name": student.get("primary_last_name", "").upper(),
                        "primary_mobile": primary_mobile,
                        "primary_email": student.get("primary_email", "").lower(),
                        "secondary_first_name": student.get("secondary_first_name", "").upper(),
                        "secondary_middle_name": student.get("secondary_middle_name", "").upper(),
                        "secondary_last_name": student.get("secondary_last_name", "").upper(),
                        "secondary_mobile": str(student.get("secondary_phone", "")).strip(),
                        "secondary_email": student.get("secondary_email", "").lower(),
                        "profile_image": "",
                        "pincode": parent_pincode,
                        "is_active": True,
                        "is_verified": True,
                        "created_by": str(current_user.get("user_id", "")),
                        "created_user_role": str(current_user.get("user_role", "")),
                        "created_role_type": str(current_user.get("role_type", "")),
                    }
                    if not parent:
                        parent = await Parents.create(**parent_data)
                    else:
                        parent.primary_first_name = parent_data["primary_first_name"]
                        parent.primary_middle_name = parent_data["primary_middle_name"]
                        parent.primary_last_name = parent_data["primary_last_name"]
                        parent.primary_mobile = parent_data["primary_mobile"]
                        parent.primary_email = parent_data["primary_email"]
                        parent.secondary_first_name = parent_data["secondary_first_name"]
                        parent.secondary_middle_name = parent_data["secondary_middle_name"]
                        parent.secondary_last_name = parent_data["secondary_last_name"]
                        parent.secondary_mobile = parent_data["secondary_mobile"]
                        parent.secondary_email = parent_data["secondary_email"]
                        parent.pincode = parent_pincode
                        parent.is_active = parent_data["is_active"]
                        parent.is_verified = parent_data["is_verified"]
                        parent.updated_by = str(current_user.get("user_id", ""))
                        parent.updated_user_role = str(current_user.get("user_role", ""))
                        parent.updated_role_type = str(current_user.get("role_type", ""))
                        await parent.save()

                    parent_details_primary = {
                        "id": parent.id,
                        "primary_first_name": parent.primary_first_name,
                        "primary_middle_name": parent.primary_middle_name,
                        "primary_last_name": parent.primary_last_name,
                        "primary_mobile": parent.primary_mobile,
                        "primary_email": parent.primary_email,
                    }
                    parent_details.append(parent_details_primary)

                    parent_child = await ParentChildren.filter(parent_id=parent.id, student_id=student_record.id).first()
                    if not parent_child:
                        parent_child_data = {
                            "parent_id": parent.id,
                            "student_id": student_record.id,
                            "primary_phone_no": parent.primary_mobile,
                            "secondary_phone_no": parent.secondary_mobile,
                            "status": True,
                            "created_by": str(current_user.get("user_id", "")),
                            "created_user_role": str(current_user.get("user_role", "")),
                            "created_role_type": str(current_user.get("role_type", "")),
                        }
                        parent_child_validated = ParentChildrenCreateSchema(**parent_child_data)
                        await ParentChildren.create(**parent_child_validated.dict())
                    else:
                        parent_child.primary_phone_no = parent.primary_mobile
                        parent_child.secondary_phone_no = parent.secondary_mobile
                        parent_child.updated_by = str(current_user.get("user_id", ""))
                        parent_child.updated_user_role = str(current_user.get("user_role", ""))
                        parent_child.updated_role_type = str(current_user.get("role_type", ""))
                        await parent_child.save()

                    student_details["parents"] = parent_details

                    school_student_data = {
                        "school_id": school.school_id,
                        "student_id": student_record.id,
                        "status": True,
                        "created_by": str(current_user.get("user_id", "")),
                        "created_user_role": str(current_user.get("user_role", "")),
                        "created_role_type": str(current_user.get("role_type", "")),
                    }
                    await SchoolStudents.create(**school_student_data)

                    school_details = school_student_data
                    student_details["school"] = school_details

                    students_list.append(student_details)
            except Exception as e:
                errors.append(f"Failed to process student {student.get('student_first_name', '')}: {str(e)}")

        await cache.delete()

        resp = StandardResponse(
            status=len(students_list) > 0,
            message="Students Data Imported" if students_list else "No students were imported",
            data={
                "students_list": students_list,
                "failed_students": errors
            },
            errors={"details": errors} if errors else {},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
    
## below are for teachers 
async def is_phone_existing(phone: str) -> bool:
    """Mock check if phone already exists in the database."""
    existing_staff = await SchoolStaff.filter(phone=phone)
    return bool(existing_staff)

async def is_email_existing(email: str) -> bool:
    """Mock check if email already exists in the database."""
    existing_staff = await SchoolStaff.filter(email=email)
    return bool(existing_staff)

EXPECTED_CSV_COLUMNS = [
    'first_name', 'middle_name', 'last_name', 'phone',
    'country_calling_code', 'email', 'class_room', 'section', 'dob', 'gender',
    'address_line_1', 'address_line_2', 'landmark', 'street_name', 'state', 'pincode', 'country'
]

def parse_dob(dob_value: str) -> tuple[str | None, str | None]:
    """
    Parse DOB in DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY, YYYY/MM/DD, or MM/DD/YYYY format, return standardized YYYY-MM-DD or error message.
    Returns: (parsed_dob, error_message)
    """
    if not dob_value or dob_value.strip() == "":
        return None, None
    for date_format in ['%d-%m-%Y', '%Y-%m-%d', '%d/%m/%Y', '%Y/%m/%d', '%m/%d/%Y']:
        try:
            parsed_date = datetime.strptime(dob_value, date_format)
            return parsed_date.strftime('%Y-%m-%d'), None
        except ValueError:
            continue
    return None, "DOB must be in DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY, YYYY/MM/DD, or MM/DD/YYYY format."

@router.post("/import-teachers-data", response_model=dict)
async def import_teachers_data(
    file: UploadFile = File(...),
    school_id: str | None = None,
    current_user: dict = Depends(get_current_user)
):
    # Check user role
    user_role = current_user.get("user_role")
    is_school_admin = user_role == SchoolRoles.SCHOOL_ADMIN
    is_super_admin = user_role == AdminTeamRoles.SUPER_ADMIN

    if not (is_school_admin or is_super_admin):
        resp = StandardResponse(
            status=False,
            message=f"{user_role} is not allowed to create school records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # If SUPER_ADMIN, school_id must be provided
    if is_super_admin and not school_id:
        resp = StandardResponse(
            status=False,
            message="SUPER_ADMIN must provide a valid school_id.",
            data={},
            errors={"details": "school_id is required for SUPER_ADMIN."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # Validate school_id if provided
    if school_id:
        try:
            school = await Schools.get(school_id=school_id)
        except Exception:
            resp = StandardResponse(
                status=False,
                message=f"Invalid school_id: {school_id}.",
                data={},
                errors={"details": f"School with ID {school_id} does not exist."},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
    else:
        # For SCHOOL_ADMIN, get school_id from SchoolStaff
        try:
            school_staff = await SchoolStaff.get(id=current_user.get("user_id")).prefetch_related('school')
            if not school_staff.school:
                resp = StandardResponse(
                    status=False,
                    message="School not found for the current user.",
                    data={},
                    errors={"details": f"No school associated with SchoolStaff ID {current_user.get('user_id')}."},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
            school_id = school_staff.school.school_id
        except Exception as e:
            resp = StandardResponse(
                status=False,
                message="Invalid school data for the current user.",
                data={},
                errors={"details": f"Error retrieving school data: {str(e)}"},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if not file.filename.endswith(".csv"):
        resp = StandardResponse(
            status=False,
            message="Invalid file type. Please upload a CSV file.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    except Exception as e:
        resp = StandardResponse(
            status=False,
            message=f"Error parsing CSV file: {str(e)}",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    errors = {"columns": []}
    duplicate_errors = []
    valid_rows_data = []

    # Validate Columns
    missing_columns = [col for col in EXPECTED_CSV_COLUMNS if col not in df.columns]
    if missing_columns:
        errors["columns"] = [{
            "row_index": "N/A - File Level",
            "error_type": "Missing Columns",
            "message": f"The following columns are missing in the CSV: {', '.join(missing_columns)}",
            "expected_columns": EXPECTED_CSV_COLUMNS,
            "found_columns": df.columns.tolist()
        }]
        resp = StandardResponse(
            status=False,
            message="Validation failed due to missing columns.",
            data={},
            errors={"columns": [], "message": f"The following columns are missing in the CSV: {', '.join(missing_columns)}"},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    df = df.fillna('')
    df['dob'] = df['dob'].apply(lambda x: None if pd.isna(x) or x == '' else x)
    df['country_calling_code'] = df['country_calling_code'].astype(str)
    # df['phone'] = df['phone'].astype(str)
    df['phone'] = df['phone'].apply(clean_phone)
    df['class_room'] = df['class_room'].astype(str)
    df['address_line_1'] = df['address_line_1'].astype(str)
    df['address_line_2'] = df['address_line_2'].astype(str)
    df['landmark'] = df['landmark'].astype(str)
    df['street_name'] = df['street_name'].astype(str)
    df['state'] = df['state'].astype(str)
    df['pincode'] = df['pincode'].astype(str)
    df['country'] = df['country'].astype(str)

    # Check for duplicate phone numbers within the CSV
    duplicate_mask = df.duplicated(subset=['phone'], keep=False)
    if duplicate_mask.any():
        grouped_duplicates = df[duplicate_mask].groupby('phone').groups
        for phone, indices in grouped_duplicates.items():
            row_numbers = [str(idx + 2) for idx in indices]  # 1-based indexing + header
            row_numbers_str = " and ".join(row_numbers)
            duplicate_errors.append(f"Duplicate entry for phone number {phone} at rows {row_numbers_str}.")

    # Keep only the first occurrence of each phone number
    df = df.drop_duplicates(subset=['phone'], keep='first')

    for index, row in df.iterrows():
        row_errors = []
        row_data = row.to_dict()

        try:
            teacher_data_obj = TeacherImportData(**row_data)
        except ValueError as ve:
            for err in ve.errors():
                row_errors.append({
                    "field": err["loc"][0] if err["loc"] else "unknown_field",
                    "message": err["msg"],
                    "value": row_data.get(err["loc"][0]) if err["loc"] and err["loc"][0] in row_data else "N/A"
                })
            errors["columns"].append({"row_index": index + 2, "details": row_errors})
            continue

        dob_value = row_data.get('dob')
        if dob_value and dob_value != "":
            parsed_dob, dob_error = parse_dob(dob_value)
            if dob_error:
                row_errors.append({
                    "field": "dob",
                    "message": dob_error,
                    "value": str(dob_value)
                })
            else:
                row_data['dob'] = parsed_dob  # Update row_data with standardized YYYY-MM-DD format

        if await is_phone_existing(teacher_data_obj.phone):
            row_errors.append({
                "field": "phone",
                "message": f"Phone number '{teacher_data_obj.phone}' already exists in the database.",
                "value": teacher_data_obj.phone
            })

        if await is_email_existing(teacher_data_obj.email):
            row_errors.append({
                "field": "email",
                "message": f"Email '{teacher_data_obj.email}' already exists in the database.",
                "value": teacher_data_obj.email
            })

        if row_errors:
            errors["columns"].append({"row_index": index + 2, "details": row_errors})
            continue

        if not teacher_data_obj.username:
            try:
                school = await Schools.get(school_id=school_id)
                teacher_data_obj.username = school.school_code + "-" + generate_user_code()
            except Exception:
                errors["columns"].append({
                    "row_index": index + 2,
                    "details": [{
                        "field": "username",
                        "message": f"Could not generate username: Invalid school_id {school_id}.",
                        "value": "N/A"
                    }]
                })
                continue

        valid_rows_data.append({
            "row_index": index + 2,  # Store CSV row index (1-based, including header)
            "first_name": teacher_data_obj.first_name,
            "last_name": teacher_data_obj.last_name,
            "middle_name": teacher_data_obj.middle_name,
            "country_calling_code": teacher_data_obj.country_calling_code,
            "phone": teacher_data_obj.phone,
            "email": teacher_data_obj.email,
            "class_room": teacher_data_obj.class_room,
            "section": teacher_data_obj.section,
            "dob": row_data['dob'],  # Use standardized YYYY-MM-DD format
            "gender": teacher_data_obj.gender,
            "address_line_1": teacher_data_obj.address_line_1,
            "address_line_2": teacher_data_obj.address_line_2,
            "landmark": teacher_data_obj.landmark,
            "street_name": teacher_data_obj.street_name,
            "state": teacher_data_obj.state,
            "pincode": teacher_data_obj.pincode,
            "country": teacher_data_obj.country,
            "username": teacher_data_obj.username,
            "created_by": str(current_user["user_id"]),
            "created_user_role": current_user["user_role"],
            "created_role_type": current_user["role_type"],
        })

    # If any errors exist (CSV duplicates or validation errors), return error response
    if errors["columns"] or duplicate_errors:
        # Prioritize error message: email > phone > DOB > generic validation
        error_message = "Validation failed."
        for error in errors["columns"]:
            for detail in error["details"]:
                if detail["field"] == "email":
                    error_message = detail["message"]
                    break
                elif detail["field"] == "phone" and error_message == "Validation failed.":
                    error_message = detail["message"]
                elif detail["field"] == "dob" and error_message == "Validation failed.":
                    error_message = f"Invalid DOB format in row {error['row_index']}."
                elif error_message == "Validation failed.":
                    error_message = f"Validation error in row {error['row_index']}: {detail['message']}."
            if error_message != "Validation failed.":
                break

        resp = StandardResponse(
            status=False,
            message=error_message,
            data={},
            errors={"columns": [], "message": "; ".join(duplicate_errors) if duplicate_errors else ""},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    transaction_no = str(generate_transaction_number())
    cache_key = f"import_teachers_data-{transaction_no}"
    cache = ObjectCache(cache_key=cache_key)
    await cache.set(data={"teachers": valid_rows_data, "school_id": school_id}, ttl=3600)

    message = f"Uploaded Data Preview {file.filename}"
    if duplicate_errors:
        message += " (Warning: Duplicate entries detected in the uploaded file)"

    resp = StandardResponse(
        status=True,
        message=message,
        data={
            "teachers_list": valid_rows_data,
            "transaction_no": transaction_no,
            "school_id": school_id
        },
        errors={"columns": [], "message": ""},
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)


# @router.post("/import-teachers-data", response_model=dict)
# async def import_teachers_data(
#     file: UploadFile = File(...),
#     school_id: str | None = None,
#     current_user: dict = Depends(get_current_user)
# ):
#     EXPECTED_CSV_COLUMNS = [
#         'first_name', 'middle_name', 'last_name', 'phone',
#         'country_calling_code', 'email', 'class_room', 'section', 'dob', 'gender',
#         'address_line_1', 'address_line_2', 'landmark', 'street_name', 'state', 'pincode', 'country'
#     ]

#     errors_list = []

#     # Check user role
#     user_role = current_user.get("user_role")
#     is_school_admin = user_role == SchoolRoles.SCHOOL_ADMIN
#     is_super_admin = user_role == AdminTeamRoles.SUPER_ADMIN

#     if not (is_school_admin or is_super_admin):
#         resp = StandardResponse(
#             status=False,
#             message=f"{user_role} is not allowed to create school records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     # If SUPER_ADMIN, school_id must be provided
#     if is_super_admin and not school_id:
#         resp = StandardResponse(
#             status=False,
#             message="SUPER_ADMIN must provide a valid school_id.",
#             data={},
#             errors={"details": "school_id is required for SUPER_ADMIN."},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     # Validate school_id if provided
#     if school_id:
#         try:
#             school = await Schools.get(school_id=school_id)
#         except Exception:
#             resp = StandardResponse(
#                 status=False,
#                 message=f"Invalid school_id: {school_id}.",
#                 data={},
#                 errors={"details": f"School with ID {school_id} does not exist."},
#             )
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
#     else:
#         # For SCHOOL_ADMIN, get school_id from SchoolStaff
#         try:
#             school_staff = await SchoolStaff.get(id=current_user.get("user_id")).prefetch_related('school')
#             if not school_staff.school:
#                 resp = StandardResponse(
#                     status=False,
#                     message="School not found for the current user.",
#                     data={},
#                     errors={"details": f"No school associated with SchoolStaff ID {current_user.get('user_id')}."},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
#             school_id = school_staff.school.school_id
#         except Exception as e:
#             resp = StandardResponse(
#                 status=False,
#                 message="Invalid school data for the current user.",
#                 data={},
#                 errors={"details": f"Error retrieving school data: {str(e)}"},
#             )
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     if not file.filename.endswith(".csv"):
#         resp = StandardResponse(
#             status=False,
#             message="Invalid file type. Please upload a CSV file.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     contents = await file.read()

#     try:
#         df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
#     except Exception as e:
#         resp = StandardResponse(
#             status=False,
#             message=f"Error parsing CSV file: {str(e)}",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     errors = {"columns": []}
#     valid_rows_data = []

#     # Validate Columns
#     missing_columns = [col for col in EXPECTED_CSV_COLUMNS if col not in df.columns]
#     if missing_columns:
#         errors["columns"] = [{
#             "row_index": "N/A - File Level",
#             "error_type": "Missing Columns",
#             "message": f"The following columns are missing in the CSV: {', '.join(missing_columns)}",
#             "expected_columns": EXPECTED_CSV_COLUMNS,
#             "found_columns": df.columns.tolist()
#         }]
#         resp = StandardResponse(
#             status=False,
#             message="Validation failed",
#             data={},
#             errors=errors,
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     df = df.drop_duplicates()
#     df = df.fillna('')
#     df['dob'] = df['dob'].apply(lambda x: None if pd.isna(x) or x == '' else x)
#     df['country_calling_code'] = df['country_calling_code'].astype(str)
#     df['phone'] = df['phone'].astype(str)
#     df['class_room'] = df['class_room'].astype(str)
#     df['address_line_1'] = df['address_line_1'].astype(str)
#     df['address_line_2'] = df['address_line_2'].astype(str)
#     df['landmark'] = df['landmark'].astype(str)
#     df['street_name'] = df['street_name'].astype(str)
#     df['state'] = df['state'].astype(str)
#     df['pincode'] = df['pincode'].astype(str)
#     df['country'] = df['country'].astype(str)

#     for index, row in df.iterrows():
#         row_errors = []
#         row_data = row.to_dict()

#         try:
#             teacher_data_obj = TeacherImportData(**row_data)
#         except ValueError as ve:
#             for err in ve.errors():
#                 row_errors.append({
#                     "field": err["loc"][0] if err["loc"] else "unknown_field",
#                     "message": err["msg"],
#                     "value": row_data.get(err["loc"][0]) if err["loc"] and err["loc"][0] in row_data else "N/A"
#                 })
#             errors["columns"].append({"row_index": index + 2, "details": row_errors})
#             continue

#         dob_value = row_data.get('dob')
#         if dob_value and dob_value != "":
#             try:
#                 datetime.strptime(str(dob_value), '%Y-%m-%d')
#             except ValueError:
#                 row_errors.append({
#                     "field": "dob",
#                     "message": "DOB must be in YYYY-MM-DD format.",
#                     "value": str(dob_value)
#                 })

#         if await is_phone_existing(teacher_data_obj.phone):
#             errors_list.append(f"Phone number '{teacher_data_obj.phone}' already exists.")

#         if await is_email_existing(teacher_data_obj.email):
#             errors_list.append(f"Email '{teacher_data_obj.email}' already exists.")

#         if row_errors:
#             errors["columns"].append({"row_index": index + 2, "details": row_errors})
#         else:
#             if not teacher_data_obj.username:
#                 try:
#                     school = await Schools.get(school_id=school_id)
#                     teacher_data_obj.username = school.school_code + "-" + generate_user_code()
#                 except Exception:
#                     errors_list.append(f"Could not generate username: Invalid school_id {school_id}.")
#                     continue

#             valid_rows_data.append({
#                 "first_name": teacher_data_obj.first_name,
#                 "last_name": teacher_data_obj.last_name,
#                 "middle_name": teacher_data_obj.middle_name,
#                 "country_calling_code": teacher_data_obj.country_calling_code,
#                 "phone": teacher_data_obj.phone,
#                 "email": teacher_data_obj.email,
#                 "class_room": teacher_data_obj.class_room,
#                 "section": teacher_data_obj.section,
#                 "dob": str(teacher_data_obj.dob) if teacher_data_obj.dob else None,
#                 "gender": teacher_data_obj.gender,
#                 "address_line_1": teacher_data_obj.address_line_1,
#                 "address_line_2": teacher_data_obj.address_line_2,
#                 "landmark": teacher_data_obj.landmark,
#                 "street_name": teacher_data_obj.street_name,
#                 "state": teacher_data_obj.state,
#                 "pincode": teacher_data_obj.pincode,
#                 "country": teacher_data_obj.country,
#                 "username": teacher_data_obj.username,
#                 "created_by": str(current_user["user_id"]),
#                 "created_user_role": current_user["user_role"],
#                 "created_role_type": current_user["role_type"],
#             })

#     if len(errors_list) > 0:
#         resp = StandardResponse(
#             status=False,
#             message=', '.join(errors_list),
#             data={},
#             errors=errors,
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     if not valid_rows_data:
#         resp = StandardResponse(
#             status=False,
#             message="No valid data found in the CSV to import.",
#             data={},
#             errors=errors,
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     transaction_no = str(generate_transaction_number())
#     cache_key = f"import_teachers_data-{transaction_no}"
#     cache = ObjectCache(cache_key=cache_key)
#     await cache.set(data={"teachers": valid_rows_data, "school_id": school_id}, ttl=3600)

#     preview_list = valid_rows_data

#     resp = StandardResponse(
#         status=True,
#         message="Data validated successfully. Ready for import.",
#         data={
#             "teachers_list": preview_list,
#             "transaction_no": transaction_no,
#             "school_id": school_id
#         },
#         errors=errors,
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)


# @router.post("/import-teachers-data-confirm", response_model=StandardResponse)
# async def confirm_teachers_data(
#     request_data: SchoolImportConfirmSchema,
#     current_user: dict = Depends(get_current_user)
# ):
#     transaction_no = str(request_data.transaction_no)
#     cache_key = f"import_teachers_data-{transaction_no}"
#     cache = ObjectCache(cache_key=cache_key)

#     cached_data = await cache.get()
#     if not cached_data:
#         resp = StandardResponse(
#             status=False,
#             message="Invalid Transaction Id",
#             data={"transaction_no": transaction_no},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     teachers_data = cached_data.get("teachers", [])
#     school_id = cached_data.get("school_id")

#     # Check user role
#     user_role = current_user.get("user_role")
#     is_school_admin = user_role == SchoolRoles.SCHOOL_ADMIN
#     is_super_admin = user_role == AdminTeamRoles.SUPER_ADMIN

#     if not (is_school_admin or is_super_admin):
#         resp = StandardResponse(
#             status=False,
#             message=f"{user_role} is not allowed to create school records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     # Validate school_id
#     if not school_id and is_school_admin:
#         try:
#             school_staff = await SchoolStaff.get(id=current_user.get("user_id")).prefetch_related('school')
#             if not school_staff.school:
#                 resp = StandardResponse(
#                     status=False,
#                     message="School not found for the current user.",
#                     data={},
#                     errors={"details": f"No school associated with SchoolStaff ID {current_user.get('user_id')}."},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
#             school_id = school_staff.school.school_id
#         except Exception as e:
#             resp = StandardResponse(
#                 status=False,
#                 message="Invalid school data for the current user.",
#                 data={},
#                 errors={"details": f"Error retrieving school data: {str(e)}"},
#             )
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
#     elif not school_id:
#         resp = StandardResponse(
#             status=False,
#             message="No school_id provided or found.",
#             data={},
#             errors={"details": "school_id is required."},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     # Verify school_id exists
#     try:
#         school = await Schools.get(school_id=school_id)
#     except Exception:
#         resp = StandardResponse(
#             status=False,
#             message=f"Invalid school_id: {school_id}.",
#             data={},
#             errors={"details": f"School with ID {school_id} does not exist."},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#     if not request_data.confirm:
#         await cache.delete()
#         resp = StandardResponse(
#             status=True,
#             message="Your Request has been cancelled",
#             data={"transaction_no": transaction_no},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

#     teachers_list = []
#     if request_data.confirm:
#         for teacher in teachers_data:
#             staff = SchoolStaff()
#             staff.first_name = teacher["first_name"]
#             staff.last_name = teacher["last_name"]
#             staff.middle_name = teacher["middle_name"]
#             staff.country_calling_code = teacher["country_calling_code"]
#             staff.phone = teacher["phone"]
#             staff.email = teacher["email"]
#             staff.class_room = teacher["class_room"]
#             staff.section = teacher["section"]
#             staff.dob = teacher["dob"] if teacher["dob"] else None
#             staff.gender = teacher["gender"]
#             staff.address_line1 = teacher["address_line_1"]
#             staff.address_line2 = teacher["address_line_2"]
#             staff.landmark = teacher["landmark"]
#             staff.street = teacher["street_name"]
#             staff.state = teacher["state"]
#             staff.pincode = teacher["pincode"]
#             staff.country = teacher["country"]
#             staff.username = teacher["username"]
#             staff.password = create_password_hash(teacher["username"])
#             staff.school = school
#             result = await staff.save()
#             staff.created_by = current_user.get("user_id")
#             staff.created_user_role = current_user.get("user_role")
#             staff.created_role_type = current_user.get("role_type")
            
#             result = await staff.save()

#             try:
#                 teachers_list.append({
#                     "id": result.id,
#                     "first_name": result.first_name,
#                     "last_name": result.last_name,
#                     "middle_name": result.middle_name,
#                     "country_calling_code": result.country_calling_code,
#                     "phone": result.phone,
#                     "email": result.email,
#                     "class_room": result.class_room,
#                     "section": result.section,
#                     "dob": str(result.dob) if result.dob else None,
#                     "gender": result.gender,
#                     "address_line_1": result.address_line1,
#                     "address_line_2": result.address_line2,
#                     "landmark": result.landmark,
#                     "street_name": result.street,
#                     "state": result.state,
#                     "pincode": result.pincode,
#                     "country": result.country,
#                     "username": result.username
#                 })
#             except:
#                 pass

#     resp = StandardResponse(
#         status=True,
#         message="Success, Teachers Data Imported",
#         data={"teachers_list": teachers_list},
#         errors={},
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

from fastapi import Depends, status
from fastapi.responses import JSONResponse
from tortoise.exceptions import IntegrityError, ValidationError

from src.core.cache_maanger import ObjectCache
from src.core.manager import get_current_user
from src.models.user_models import SchoolRoles, SchoolStaff, AdminTeamRoles
from src.models.school_models import Schools
from src.utils.response import StandardResponse
from src.utils.transactions import generate_transaction_number
from src.core.password_manager import create_password_hash

from .. import router
from ..dependencies import SchoolImportConfirmSchema

@router.post("/import-teachers-data-confirm", response_model=StandardResponse)
async def confirm_teachers_data(
    request_data: SchoolImportConfirmSchema,
    current_user: dict = Depends(get_current_user)
):
    transaction_no = str(request_data.transaction_no)
    cache_key = f"import_teachers_data-{transaction_no}"
    cache = ObjectCache(cache_key=cache_key)

    cached_data = await cache.get()
    if not cached_data:
        resp = StandardResponse(
            status=False,
            message="Invalid Transaction Id",
            data={},
            errors={"columns": [], "message": ""},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    teachers_data = cached_data.get("teachers", [])
    school_id = cached_data.get("school_id")

    # Check user role
    user_role = current_user.get("user_role")
    is_school_admin = user_role == SchoolRoles.SCHOOL_ADMIN
    is_super_admin = user_role == AdminTeamRoles.SUPER_ADMIN

    if not (is_school_admin or is_super_admin):
        resp = StandardResponse(
            status=False,
            message=f"{user_role} is not allowed to create school records.",
            data={},
            errors={"columns": [], "message": ""},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # Validate school_id
    if not school_id and is_school_admin:
        try:
            school_staff = await SchoolStaff.get(id=current_user.get("user_id")).prefetch_related('school')
            if not school_staff.school:
                resp = StandardResponse(
                    status=False,
                    message="School not found for the current user.",
                    data={},
                    errors={"columns": [], "message": f"No school associated with SchoolStaff ID {current_user.get('user_id')}."},
                )
                return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)
            school_id = school_staff.school.school_id
        except Exception as e:
            resp = StandardResponse(
                status=False,
                message="Invalid school data for the current user.",
                data={},
                errors={"columns": [], "message": f"Error retrieving school data: {str(e)}"},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    elif not school_id:
        resp = StandardResponse(
            status=False,
            message="No school_id provided or found.",
            data={},
            errors={"columns": [], "message": "school_id is required."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # Verify school_id exists
    try:
        school = await Schools.get(school_id=school_id)
    except Exception:
        resp = StandardResponse(
            status=False,
            message=f"Invalid school_id: {school_id}.",
            data={},
            errors={"columns": [], "message": f"School with ID {school_id} does not exist."},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    if not request_data.confirm:
        await cache.delete()
        resp = StandardResponse(
            status=True,
            message="Your Request has been cancelled",
            data={"transaction_no": transaction_no},
            errors={"columns": [], "message": ""},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

    teachers_list = []
    errors = []

    if request_data.confirm:
        for teacher in teachers_data:
            row_index = teacher.get("row_index", "unknown")
            try:
                # Check for existing phone number in the database
                if await SchoolStaff.filter(phone=teacher["phone"]).exists():
                    errors.append(f"Phone number '{teacher['phone']}' already exists in the database for teacher {teacher['first_name']} {teacher['last_name']} in row {row_index}.")
                    continue

                # Check for existing username in the database
                if await SchoolStaff.filter(username=teacher["username"]).exists():
                    errors.append(f"Username '{teacher['username']}' already exists in the database for teacher {teacher['first_name']} {teacher['last_name']} in row {row_index}.")
                    continue

                # Validate required fields
                required_fields = {
                    "school": school,
                    "created_by": current_user.get("user_id"),
                    "created_user_role": current_user.get("user_role"),
                    "created_role_type": current_user.get("role_type")
                }
                for field_name, value in required_fields.items():
                    if not value:
                        raise ValueError(f"Missing required field '{field_name}' for teacher {teacher['first_name']} {teacher['last_name']} in row {row_index}.")

                staff = SchoolStaff()
                staff.first_name = teacher["first_name"]
                staff.last_name = teacher["last_name"]
                staff.middle_name = teacher["middle_name"]
                staff.country_calling_code = teacher["country_calling_code"]
                staff.phone = teacher["phone"]
                staff.email = teacher["email"]
                staff.class_room = teacher["class_room"]
                staff.section = teacher["section"]
                staff.dob = teacher["dob"] if teacher["dob"] else None  # Use YYYY-MM-DD string or None
                staff.gender = teacher["gender"]
                staff.address_line1 = teacher["address_line_1"]
                staff.address_line2 = teacher["address_line_2"]
                staff.landmark = teacher["landmark"]
                staff.street = teacher["street_name"]
                staff.state = teacher["state"]
                staff.pincode = teacher["pincode"]
                staff.country = teacher["country"]
                staff.username = teacher["username"]
                staff.password = create_password_hash(teacher["username"])
                staff.school = school
                staff.created_by = current_user.get("user_id")
                staff.created_user_role = current_user.get("user_role")
                staff.created_role_type = current_user.get("role_type")

                await staff.save()

                if not staff.id:
                    raise ValueError(f"Save operation failed to assign an ID for teacher {teacher['first_name']} {teacher['last_name']} in row {row_index}, possibly due to database constraints.")

                teachers_list.append({
                    "id": staff.id,
                    "first_name": staff.first_name,
                    "last_name": staff.last_name,
                    "middle_name": staff.middle_name,
                    "country_calling_code": staff.country_calling_code,
                    "phone": staff.phone,
                    "email": staff.email,
                    "class_room": staff.class_room,
                    "section": staff.section,
                    "dob": str(staff.dob) if staff.dob else None,
                    "gender": staff.gender,
                    "address_line_1": staff.address_line1,
                    "address_line_2": staff.address_line2,
                    "landmark": staff.landmark,
                    "street_name": staff.street,
                    "state": staff.state,
                    "pincode": staff.pincode,
                    "country": staff.country,
                    "username": staff.username
                })
            except IntegrityError as e:
                errors.append(f"Failed to save teacher {teacher['first_name']} {teacher['last_name']} in row {row_index}: Database integrity error - {str(e)}")
            except ValidationError as e:
                errors.append(f"Failed to save teacher {teacher['first_name']} {teacher['last_name']} in row {row_index}: Validation error - {str(e)}")
            except ValueError as e:
                errors.append(f"Failed to save teacher {teacher['first_name']} {teacher['last_name']} in row {row_index}: {str(e)}")
            except Exception as e:
                errors.append(f"Failed to save teacher {teacher['first_name']} {teacher['last_name']} in row {row_index}: Unexpected error - {str(e)}")

    await cache.delete()

    if errors:
        # Prioritize error message: phone > username > validation > integrity > generic
        error_message = "Validation failed."
        error_row = "unknown"
        for error in errors:
            if "Phone number" in error:
                error_message = error
                error_row = error.split(" in row ")[-1] if " in row " in error else "unknown"
                break
            elif "Username" in error and error_message == "Validation failed.":
                error_message = error
                error_row = error.split(" in row ")[-1] if " in row " in error else "unknown"
                break
            elif "Validation error" in error and error_message == "Validation failed.":
                error_message = f"Validation error in row {error.split(' in row ')[-1].split(':')[0]}."
                error_row = error.split(" in row ")[-1].split(":")[0]
            elif "Database integrity error" in error and error_message == "Validation failed.":
                error_message = f"Database error saving teacher in row {error.split(' in row ')[-1].split(':')[0]}."
                error_row = error.split(" in row ")[-1].split(":")[0]
            elif "Failed to save teacher" in error and error_message == "Validation failed.":
                error_message = f"Database error saving teacher in row {error.split(' in row ')[-1].split(':')[0]}."
                error_row = error.split(" in row ")[-1].split(":")[0]

        resp = StandardResponse(
            status=False,
            message=error_message if error_message != "Validation failed." else f"Database error saving teacher in row {error_row}.",
            data={},
            errors={"columns": [], "message": "; ".join(errors)},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    resp = StandardResponse(
        status=len(teachers_list) > 0,
        message="Success, Teachers Data Imported" if teachers_list else "No teachers were imported",
        data={"teachers_list": teachers_list},
        errors={"columns": [], "message": ""},
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
