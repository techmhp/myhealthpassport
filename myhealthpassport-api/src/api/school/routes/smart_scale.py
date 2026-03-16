from fastapi import Depends, File, UploadFile, Form, status
from fastapi.responses import JSONResponse
from tortoise.exceptions import IntegrityError

from fastapi import Depends, Query, status
import io
import math
import re
import pandas as pd
from datetime import datetime
from typing import Optional
from src.core.manager import get_current_user
from src.models.student_models import Students
from src.models.school_models import Schools
from src.models.student_models import SmartScaleData
from src.utils.response import StandardResponse
from src.core.cache_maanger import ObjectCache
from src.utils.transactions import generate_transaction_number
from src.schemas.student_schema import SmartScaleDataRequest
from src.models.user_models import SchoolRoles, ScreeningTeamRoles
from pydantic import BaseModel, ValidationError
from fastapi import Body, Depends, status, Request
from fastapi.responses import JSONResponse
import json
from .. import router
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)
## CSV column mapping to model fields
EXCEL_COLUMN_MAPPING  = {
    "Height (cm)": "height_cm",
    "Age (years)": "age_years",
    "Weighing time": "weighing_time",
    "Body weight (kg)": "body_weight_kg",
    "Body fat rate (%)": "body_fat_rate_percent",
    "Device MAC": "device_mac",
    "Inorganic salt content (Kg)": "inorganic_salt_content_kg",
    "Obesity (%)": "obesity_percent",
    "Water content (kg)": "water_content_kg",
    "Protein content (kg)": "protein_content_kg",
    "Subcutaneous fat volume (kg)": "subcutaneous_fat_volume_kg",
    "BMI": "bmi",
    "Fat content (kg)": "fat_content_kg",
    "Muscle rate (%)": "muscle_rate_percent",
    "Muscle mass (kg)": "muscle_mass_kg",
    "Visceral fat level": "visceral_fat_level",
    "BMR": "bmr",
    "Body moisture content (%)": "body_moisture_content_percent",
    "Bone mass (kg)": "bone_mass_kg",
    "Internal protein rate (%)": "internal_protein_rate_percent",
    "Skeletal muscle rate (%)": "skeletal_muscle_rate_percent",
    "Lean body mass (kg)": "lean_body_mass_kg",
    "Heart rate (beats/min)": "heart_rate_beats_min",
    "Physical score": "physical_score",
    "Body type": "body_type",
    "Physical age": "physical_age",
    "Subcutaneous fat rate": "subcutaneous_fat_rate",
    "Health level": "health_level",
    "Obesity level": "obesity_level",
    "Fat control quantity": "fat_control_quantity",
    "Weight control quantity": "weight_control_quantity",
    "Muscle control quantity": "muscle_control_quantity",
    "Standard body weight": "standard_body_weight",
    "Ideal Weight": "ideal_weight",
    "Body cell volume (kg)": "body_cell_volume_kg",
    "Extracellular water volume (kg)": "extracellular_water_volume_kg",
    "Intracellular water volume (kg)": "intracellular_water_volume_kg",
    "Left Hand Fat Mass (kg)": "left_hand_fat_mass_kg",
    "Left Foot Fat Mass (kg)": "left_foot_fat_mass_kg",
    "Right Hand Fat Mass (kg)": "right_hand_fat_mass_kg",
    "Right Foot Fat Mass (kg)": "right_foot_fat_mass_kg",
    "Trunk Fat Mass (kg)": "trunk_fat_mass_kg",
    "Left hand fat rate (%)": "left_hand_fat_rate_percent",
    "Left foot fat rate (%)": "left_foot_fat_rate_percent",
    "Right hand fat rate (%)": "right_hand_fat_rate_percent",
    "Right foot fat rate (%)": "right_foot_fat_rate_percent",
    "Trunk fat rate (%)": "trunk_fat_rate_percent",
    "Left hand muscle mass (kg)": "left_hand_muscle_mass_kg",
    "Left foot muscle mass (kg)": "left_foot_muscle_mass_kg",
    "Right hand muscle mass (kg)": "right_hand_muscle_mass_kg",
    "Right foot muscle mass (kg)": "right_foot_muscle_mass_kg",
    "Trunk muscle mass (kg)": "trunk_muscle_mass_kg",
    "Skeletal muscle mass index": "skeletal_muscle_mass_index",
    "WHR": "whr",
    "Left hand muscle rate": "left_hand_muscle_rate",
    "Left leg muscle rate": "left_leg_muscle_rate",
    "Right hand muscle rate": "right_hand_muscle_rate",
    "Right foot muscle rate": "right_foot_muscle_rate",
    "Trunk muscle rate": "trunk_muscle_rate",
    "Skeletal muscle mass (Kg)": "skeletal_muscle_mass_kg"
}

OPTIONAL_COLUMNS = {
    "Weighing time",
    "Standard body weight",
    "Body fat rate (%)",
    "Muscle rate (%)",
    "Internal protein rate (%)",
    "Subcutaneous fat rate",
    "Left hand fat rate (%)",
    "Right hand fat rate (%)",
    "Left foot fat rate (%)",
    "Right foot fat rate (%)",
    "Trunk fat rate (%)",
    "Left hand muscle rate",
    "Right hand muscle rate",
    "Left leg muscle rate",
    "Right foot muscle rate",
    "Trunk muscle rate",
    "Extracellular water volume (kg)",
    "Intracellular water volume (kg)",
    "Metabolic & Fitness Control Indicators",
    "Fat control quantity",
    "Weight control quantity",
    "Muscle control quantity"
}


def validate_excel_columns(df_columns):
    """Validate file columns against expected columns. Extra/unknown columns are ignored."""
    expected_columns = set(EXCEL_COLUMN_MAPPING.keys())
    actual_columns = set(df_columns)
    required_columns = expected_columns - OPTIONAL_COLUMNS

    missing_columns = list(required_columns - actual_columns)

    errors = []
    if missing_columns:
        errors.extend([f"Missing column: {col}" for col in missing_columns])

    return errors


def sanitize_value(value):
    """Convert a value to a JSON-serializable type, replacing nan/inf with None."""
    if value is None:
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def _normalize_col(col):
    """Canonical form: remove spaces before '(', lowercase everything."""
    col = col.strip()
    col = re.sub(r'\s*\(', '(', col)
    return col.lower()


def remap_columns(df):
    """
    Remap dataframe columns to EXCEL_COLUMN_MAPPING keys using fuzzy normalization.
    Handles device firmware variations like:
      - 'Body weight(kg)' vs 'Body weight (kg)'  (space before unit)
      - 'Inorganic salt content(kg)' vs 'Inorganic salt content (Kg)'  (case)
      - 'Fat control quantity(kg)' vs 'Fat control quantity'  (extra unit suffix)
    """
    norm_to_key = {}
    for key in EXCEL_COLUMN_MAPPING:
        norm_to_key[_normalize_col(key)] = key
        # Also index the key stripped of its trailing unit so files that add
        # units to unit-less mapping keys (e.g. 'Fat control quantity(kg)')
        # still resolve correctly.
        stripped = re.sub(r'\s*\([^)]+\)\s*$', '', key).strip()
        norm_stripped = _normalize_col(stripped)
        if norm_stripped not in norm_to_key:
            norm_to_key[norm_stripped] = key

    rename_map = {}
    for col in df.columns:
        if col in EXCEL_COLUMN_MAPPING:
            continue  # already an exact match
        norm = _normalize_col(col)
        if norm in norm_to_key:
            rename_map[col] = norm_to_key[norm]
        else:
            # Try stripping trailing unit from the file column name
            stripped = re.sub(r'\s*\([^)]+\)\s*$', '', norm).strip()
            if stripped in norm_to_key:
                rename_map[col] = norm_to_key[stripped]

    return df.rename(columns=rename_map)


def validate_data_types(df):
    """Validate data types for each column"""
    errors = {}

    # Define expected data types for validation
    type_validations = {
        "Height (cm)": "float",
        "Age (years)": "int",
        "Body weight (kg)": "float",
        "BMR": "int",
        "Heart rate (beats/min)": "int",
        "Physical score": "int",
        "Body type": "int",
        "Physical age": "int",
        "Health level": "int",
        "Obesity level": "int"
    }

    for column, expected_type in type_validations.items():
        if column in df.columns:
            try:
                if expected_type == "int":
                    pd.to_numeric(df[column], errors='raise')
                elif expected_type == "float":
                    pd.to_numeric(df[column], errors='raise')
            except:
                if column not in errors:
                    errors[column] = []
                errors[column].append(f"Invalid data type. Expected {expected_type}")

    return errors


def parse_datetime(date_str):
    """Parse datetime string with multiple format support"""
    if pd.isna(date_str) or date_str == "":
        return None

    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y",
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y"
    ]

    for fmt in formats:
        try:
            return datetime.strptime(str(date_str), fmt)
        except ValueError:
            continue

    raise ValueError(f"Unable to parse datetime: {date_str}")


@router.post("/upload-smart-scale-data/{student_id}", response_model=StandardResponse, tags=["SmartScale"])
async def upload_smart_scale_data(
        student_id: int,
        school_id: int = Form(...),
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_user)
):
    """
    Upload smart scale Excel data for a student.

    Args:
        student_id: ID of the student (path parameter)
        school_id: ID of the school (form field)
        file: Excel file containing smart scale data
        current_user: Current authenticated user

    Returns:
        StandardResponse with success/error status
    """

    creator_role = current_user["user_role"]
    if creator_role not in [SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER, ScreeningTeamRoles.PHYSICAL_WELLBEING]:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to create student records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        # Validate file type
        filename_lower = file.filename.lower() if file.filename else ""
        if not (filename_lower.endswith(".xlsx") or filename_lower.endswith(".xls") or filename_lower.endswith(".csv")):
            resp = StandardResponse(
                status=False,
                message="Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.",
                data={},
                errors={"file_type": "Only Excel (.xlsx, .xls) and CSV (.csv) files are supported"},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Check if student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            resp = StandardResponse(
                status=False,
                message="Student not found.",
                data={},
                errors={"student_id": "Student with this ID does not exist"},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        # Check if school exists
        school = await Schools.get_or_none(school_id=school_id)
        if not school:
            resp = StandardResponse(
                status=False,
                message="School not found.",
                data={},
                errors={"school_id": "School with this ID does not exist"},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

        # Read and parse file (Excel or CSV)
        contents = await file.read()
        try:
            if filename_lower.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(contents))
            else:
                df = pd.read_excel(io.BytesIO(contents))
            df = remap_columns(df)  # normalize column names to mapping keys
        except Exception as e:
            resp = StandardResponse(
                status=False,
                message=f"Error parsing file: {str(e)}",
                data={},
                errors={"file_parsing": str(e)},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Check if CSV is empty
        if df.empty:
            resp = StandardResponse(
                status=False,
                message="Excel file is empty.",
                data={},
                errors={"excel_data": "No data found in Excel file"},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Validate CSV columns
        column_errors = validate_excel_columns(df.columns.tolist())
        if column_errors:
            resp = StandardResponse(
                status=False,
                message="Excel column validation failed.",
                data={},
                errors=column_errors,
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Validate data types
        type_errors = validate_data_types(df)
        if type_errors:
            resp = StandardResponse(
                status=False,
                message="Data type validation failed.",
                data={},
                errors=type_errors,
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        # Process each row in the CSV
        inserted_records = 0
        preview_data = []
        processing_errors = []

        for index, row in df.iterrows():
            try:
                # Prepare data for insertion
                smart_scale_data = {}

                for excel_column, model_field in EXCEL_COLUMN_MAPPING.items():
                    if excel_column in row:
                        value = row[excel_column]

                        # Handle empty/null values
                        if pd.isna(value) or (isinstance(value, str) and value.strip() == ""):
                            smart_scale_data[model_field] = None
                        else:
                            try:
                                if model_field == "weighing_time":
                                    parsed_time = parse_datetime(value)
                                    smart_scale_data[model_field] = parsed_time.isoformat() if parsed_time else None
                                elif model_field in ["age_years", "bmr", "heart_rate_beats_min",
                                                     "physical_score", "body_type", "physical_age",
                                                     "health_level", "obesity_level"]:
                                    parsed_int = int(float(value))
                                    smart_scale_data[model_field] = sanitize_value(parsed_int)
                                elif model_field == "device_mac":
                                    smart_scale_data[model_field] = str(value).strip()
                                else:
                                    parsed_float = float(value)
                                    smart_scale_data[model_field] = sanitize_value(parsed_float)
                            except ValueError as e:
                                processing_errors.append({
                                    "row": index + 1,
                                    "field": excel_column,
                                    "error": str(e)
                                })
                                continue
                            
                # # Add student and school references
                smart_scale_data["student_id"] = student_id
                smart_scale_data["school_id"] = school_id
                smart_scale_data["created_by"] = current_user["user_id"]
                smart_scale_data["created_user_role"] = current_user["user_role"]
                smart_scale_data["created_role_type"] = current_user.get("role_type")
                preview_data.append(smart_scale_data)

                # # Create the record
                # smart_scale = await SmartScaleData.get_or_none(student_id=student_id).first()
                # if smart_scale:
                #     # Update existing record
                #     await smart_scale.update_from_dict(smart_scale_data).save()
                #     print("updated")
                # else:
                #     # Create new record
                #     smart_scale_data["created_at"] = datetime.now()
                #     smart_scale_data["updated_at"] = datetime.now()
                #     await SmartScaleData.create(**smart_scale_data)
                #     print(print("inserted"))

                # inserted_records += 1

            except Exception as e:
                processing_errors.append({
                    "row": index + 1,
                    "error": str(e)
                })

        # Prepare response
        if processing_errors:
            resp = StandardResponse(
                status=False,
                message=f"Partial success. {inserted_records} records inserted, {len(processing_errors)} failed.",
                data={"inserted_records": inserted_records},
                errors={"processing_errors": processing_errors},
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_207_MULTI_STATUS)
        
        transaction_id = generate_transaction_number()
        cache_key = f"preview-{transaction_id}"
        object_cache = ObjectCache(cache_key=cache_key)
        await object_cache.set({
            "preview_data": preview_data,
            "student_id": student_id,
            "school_id": school_id
        }, ttl=1800)

        resp = StandardResponse(
            status=True,
            message="Excel data preview generated successfully.",
            data={
                "transaction_id": transaction_id,
                "preview_data": preview_data[0],
                "expiry": 1800
            },
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
    except Exception as e:
        error_detail = f"{type(e).__name__}: {str(e)}"
        resp = StandardResponse(
            status=False,
            message=f"An unexpected error occurred: {error_detail}",
            data={},
            errors={"unexpected": error_detail},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.post("/confirm-smart-scale-data", response_model=StandardResponse, tags=["SmartScale"])
async def confirm_smart_scale_data(
        request: Request,
        body: SmartScaleDataRequest = Body(...),  # Primary: Accept JSON input with Pydantic validation
        current_user: dict = Depends(get_current_user)
):
    """
    Confirm or discard smart scale data upload based on transaction ID.

    Args:
        request: FastAPI Request object to access raw body
        body: JSON object containing transaction_id and save_data (bool)
        current_user: Current authenticated user

    Returns:
        StandardResponse with success/error status
    """
    # Handle case where body might be a string due to client error
    body_dict = None
    try:
        # If Pydantic validation succeeds, use the validated body
        body_dict = body.dict()
    except ValidationError:
        # If Pydantic fails, try to parse the raw body
        try:
            raw_body = await request.body()
            raw_body_str = raw_body.decode("utf-8")
            # If the body is a string representation of JSON, parse it
            body_dict = json.loads(raw_body_str)
            # Validate with Pydantic after parsing
            body_dict = SmartScaleDataRequest(**body_dict).dict()
        except (json.JSONDecodeError, ValidationError, TypeError):
            resp = StandardResponse(
                status=False,
                message="Invalid JSON format or structure.",
                data={},
                errors={"body": "Must be a valid JSON object with transaction_id (str) and save_data (bool)"},  # Now a dict
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    transaction_id = body_dict["transaction_id"]
    save_data = body_dict["save_data"]

    creator_role = current_user["user_role"]
    if creator_role not in [SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER, ScreeningTeamRoles.PHYSICAL_WELLBEING]:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to create student records.",
            data={},
            errors={},  # Now a dict
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    try:
        if not transaction_id or not isinstance(transaction_id, str):
            resp = StandardResponse(
                status=False,
                message="Invalid transaction ID.",
                data={},
                errors={"transaction_id": "Must be a non-empty string"},  # Now a dict
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        if not isinstance(save_data, bool):
            resp = StandardResponse(
                status=False,
                message="Invalid save option.",
                data={},
                errors={"save_data": "Must be a boolean (true/false)"},  # Now a dict
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        cache_key = f"preview-{transaction_id}"
        object_cache = ObjectCache(cache_key=cache_key)
        cached_data = await object_cache.get()

        if not cached_data:
            resp = StandardResponse(
                status=False,
                message="Invalid or expired transaction ID.",
                data={},
                errors={"transaction_id": "No preview data found for this transaction ID"},  # Now a dict
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

        if not save_data:
            await object_cache.delete()
            resp = StandardResponse(
                status=True,
                message="Data upload declined. Preview data discarded.",
                data={},
                errors={},  # Now a dict
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

        # Save data to database
        inserted_records = 0
        processing_errors = {}

        for idx, data in enumerate(cached_data["preview_data"]):
            try:
                # Convert weighing_time back to datetime if present
                if data.get("weighing_time"):
                    try:
                        data["weighing_time"] = datetime.fromisoformat(data["weighing_time"])
                    except Exception:
                        data["weighing_time"] = None
                for key, value in data.items():
                    if isinstance(value, str):
                        if value.strip() == "":
                            data[key] = None

                smart_scale = await SmartScaleData.get_or_none(student_id=data["student_id"])
                if smart_scale:
                    data["screening_status"] = True
                    await smart_scale.update_from_dict(data).save()
                else:
                    data["created_at"] = datetime.now()
                    data["updated_at"] = datetime.now()
                    data["screening_status"] = True
                    data["created_by"] = current_user["user_id"]
                    data["created_user_role"] = current_user["user_role"]
                    data["created_role_type"] = current_user["role_type"]
                    await SmartScaleData.create(**data)

                inserted_records += 1

            except Exception as e:
                processing_errors[f"record_{idx}"] = f"Error processing record: {str(e)}"

        # Clean up cache
        await object_cache.delete()

        if processing_errors:
            resp = StandardResponse(
                status=False,
                message=f"Partial success. {inserted_records} records inserted, {len(processing_errors)} failed.",
                data={"inserted_records": inserted_records},
                errors=processing_errors,  # Already a dict
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_207_MULTI_STATUS)
        else:
            resp = StandardResponse(
                status=True,
                message=f"Smart scale data saved successfully. {inserted_records} records inserted.",
                data={
                    "inserted_records": inserted_records,
                    "student_id": cached_data["student_id"],
                    "school_id": cached_data["school_id"]
                },
                errors={},  # Now a dict
            )
            return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

    except IntegrityError as e:
        resp = StandardResponse(
            status=False,
            message="Database integrity error occurred.",
            data={},
            errors={"database": str(e)},  # Now a dict
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        resp = StandardResponse(
            status=False,
            message="An unexpected error occurred.",
            data={},
            errors={"unexpected": str(e)},  # Now a dict
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# Add this import at the top
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ===================================================================
# MODIFIED: GET SMART SCALE DATA (with Academic Year Filter)
# ===================================================================
@router.get("/get-smart-scale-data/{student_id}", response_model=StandardResponse, tags=["SmartScale"])
async def get_smart_scale_data(
        student_id: int,
        school_id: Optional[int] = None,
        academic_year: Optional[str] = Query(
            None,
            description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
            regex=r"^\d{4}-\d{4}$"
        ),
        current_user: dict = Depends(get_current_user)
):
    """
    Get smart scale data for a specific student filtered by academic year.

    Args:
        student_id: ID of the student (path parameter)
        school_id: ID of the school (optional query parameter)
        academic_year: Academic year filter (optional, defaults to current year)
        current_user: Current authenticated user

    Returns:
        StandardResponse with smart scale data or error status
    """
    try:
        # Determine academic year
        if academic_year is None:
            academic_year = get_current_academic_year()

        try:
            ay_start, ay_end = parse_academic_year(academic_year)
        except ValueError as e:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message=str(e),
                    data={},
                    errors={"academic_year": str(e)}
                ).__dict__,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Check if student exists
        student = await Students.get_or_none(id=student_id)
        if not student:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="Student not found.",
                    data={},
                    errors={"student_id": "Student with this ID does not exist"}
                ).__dict__,
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Build query filters
        filters = {"student": student}

        # If school_id is provided, add it to filters
        if school_id:
            school = await Schools.get_or_none(school_id=school_id)
            if not school:
                return JSONResponse(
                    content=StandardResponse(
                        status=False,
                        message="School not found.",
                        data={},
                        errors={"school_id": "School with this ID does not exist"}
                    ).__dict__,
                    status_code=status.HTTP_404_NOT_FOUND
                )
            filters["school"] = school

        # Build academic year filter (created_at OR updated_at)
        year_filter = build_academic_year_filter(academic_year)

        # Get smart scale data with academic year filter
        smart_scale_data = await SmartScaleData.filter(
            year_filter,
            **filters
        ).select_related("student", "school").first()

        if not smart_scale_data:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="No smart scale data found for this student.",
                    data={},
                    errors={"smart_scale_data": "No data available for the specified student"}
                ).__dict__,
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Convert the record to dictionary for response
        data_dict = {
            "id": smart_scale_data.id,
            "student_id": smart_scale_data.student.id,
            "school_id": smart_scale_data.school.school_id,
            "height_cm": smart_scale_data.height_cm,
            "age_years": smart_scale_data.age_years,
            "weighing_time": smart_scale_data.weighing_time.isoformat() if smart_scale_data.weighing_time else None,
            "body_weight_kg": smart_scale_data.body_weight_kg,
            "body_fat_rate_percent": smart_scale_data.body_fat_rate_percent,
            "device_mac": smart_scale_data.device_mac,
            "inorganic_salt_content_kg": smart_scale_data.inorganic_salt_content_kg,
            "obesity_percent": smart_scale_data.obesity_percent,
            "water_content_kg": smart_scale_data.water_content_kg,
            "protein_content_kg": smart_scale_data.protein_content_kg,
            "subcutaneous_fat_volume_kg": smart_scale_data.subcutaneous_fat_volume_kg,
            "bmi": smart_scale_data.bmi,
            "fat_content_kg": smart_scale_data.fat_content_kg,
            "muscle_rate_percent": smart_scale_data.muscle_rate_percent,
            "muscle_mass_kg": smart_scale_data.muscle_mass_kg,
            "visceral_fat_level": smart_scale_data.visceral_fat_level,
            "bmr": smart_scale_data.bmr,
            "body_moisture_content_percent": smart_scale_data.body_moisture_content_percent,
            "bone_mass_kg": smart_scale_data.bone_mass_kg,
            "internal_protein_rate_percent": smart_scale_data.internal_protein_rate_percent,
            "skeletal_muscle_rate_percent": smart_scale_data.skeletal_muscle_rate_percent,
            "lean_body_mass_kg": smart_scale_data.lean_body_mass_kg,
            "heart_rate_beats_min": smart_scale_data.heart_rate_beats_min,
            "physical_score": smart_scale_data.physical_score,
            "body_type": smart_scale_data.body_type,
            "physical_age": smart_scale_data.physical_age,
            "subcutaneous_fat_rate": smart_scale_data.subcutaneous_fat_rate,
            "health_level": smart_scale_data.health_level,
            "obesity_level": smart_scale_data.obesity_level,
            "fat_control_quantity": smart_scale_data.fat_control_quantity,
            "weight_control_quantity": smart_scale_data.weight_control_quantity,
            "muscle_control_quantity": smart_scale_data.muscle_control_quantity,
            "standard_body_weight": smart_scale_data.standard_body_weight,
            "ideal_weight": smart_scale_data.ideal_weight,
            "body_cell_volume_kg": smart_scale_data.body_cell_volume_kg,
            "extracellular_water_volume_kg": smart_scale_data.extracellular_water_volume_kg,
            "intracellular_water_volume_kg": smart_scale_data.intracellular_water_volume_kg,
            "left_hand_fat_mass_kg": smart_scale_data.left_hand_fat_mass_kg,
            "left_foot_fat_mass_kg": smart_scale_data.left_foot_fat_mass_kg,
            "right_hand_fat_mass_kg": smart_scale_data.right_hand_fat_mass_kg,
            "right_foot_fat_mass_kg": smart_scale_data.right_foot_fat_mass_kg,
            "trunk_fat_mass_kg": smart_scale_data.trunk_fat_mass_kg,
            "left_hand_fat_rate_percent": smart_scale_data.left_hand_fat_rate_percent,
            "left_foot_fat_rate_percent": smart_scale_data.left_foot_fat_rate_percent,
            "right_hand_fat_rate_percent": smart_scale_data.right_hand_fat_rate_percent,
            "right_foot_fat_rate_percent": smart_scale_data.right_foot_fat_rate_percent,
            "trunk_fat_rate_percent": smart_scale_data.trunk_fat_rate_percent,
            "left_hand_muscle_mass_kg": smart_scale_data.left_hand_muscle_mass_kg,
            "left_foot_muscle_mass_kg": smart_scale_data.left_foot_muscle_mass_kg,
            "right_hand_muscle_mass_kg": smart_scale_data.right_hand_muscle_mass_kg,
            "right_foot_muscle_mass_kg": smart_scale_data.right_foot_muscle_mass_kg,
            "trunk_muscle_mass_kg": smart_scale_data.trunk_muscle_mass_kg,
            "skeletal_muscle_mass_index": smart_scale_data.skeletal_muscle_mass_index,
            "whr": smart_scale_data.whr,
            "left_hand_muscle_rate": smart_scale_data.left_hand_muscle_rate,
            "left_leg_muscle_rate": smart_scale_data.left_leg_muscle_rate,
            "right_hand_muscle_rate": smart_scale_data.right_hand_muscle_rate,
            "right_foot_muscle_rate": smart_scale_data.right_foot_muscle_rate,
            "trunk_muscle_rate": smart_scale_data.trunk_muscle_rate,
            "skeletal_muscle_mass_kg": smart_scale_data.skeletal_muscle_mass_kg,
            "created_at": smart_scale_data.created_at.isoformat() if smart_scale_data.created_at else None,
            "updated_at": smart_scale_data.updated_at.isoformat() if smart_scale_data.updated_at else None,
            # Add static Health Score
            "health_score": smart_scale_data.physical_score,
            # Add static Physical Screening Analysis
            "physical_screening_analysis": [
                "Calcium Intake: Daily consumption of calcium-rich foods like milk or paneer supports bone health, critical during teenage growth spurts.",
                "Hydration: Drinking 6-8 glasses of water daily ensures proper hydration and supports metabolic and cognitive functions.",
                "Physical Activity: Regular physical activity (3-4 times a week) is excellent for maintaining fitness, improving mood, and building strength.",
                "Family Meals: Eating meals with the family encourages a positive relationship with food and provides a structured eating routine.",
                "Screen-Free Eating: Avoiding distractions like TV or mobile during meals promotes mindful eating.",
                "Portion Control: Practicing portion control helps prevent overeating and supports healthy digestion."
            ]
        }

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
        response = JSONResponse(
            content=StandardResponse(
                status=True,
                message="Smart scale data retrieved successfully.",
                data={
                    "smart_scale_data": data_dict,
                    "student_info": {}
                },  # ← Same format as original
                errors={}
            ).__dict__,
            status_code=status.HTTP_200_OK
        )
        response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return response

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message="An unexpected error occurred while retrieving data.",
                data={},
                errors={"unexpected": str(e)}
            ).__dict__,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# @router.get("/get-smart-scale-data/{student_id}", response_model=StandardResponse, tags=["SmartScale"])
# async def get_smart_scale_data(
#         student_id: int,
#         school_id: Optional[int] = None,
#         current_user: dict = Depends(get_current_user)
# ):
#     """
#     Get smart scale data for a specific student.

#     Args:
#         student_id: ID of the student (path parameter)
#         school_id: ID of the school (optional query parameter)
#         current_user: Current authenticated user

#     Returns:
#         StandardResponse with smart scale data or error status
#     """
#     try:
#         # Check if student exists
#         student = await Students.get_or_none(id=student_id)
#         if not student:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message="Student not found.",
#                     data={},
#                     errors={"student_id": "Student with this ID does not exist"}
#                 ).__dict__,
#                 status_code=status.HTTP_404_NOT_FOUND
#             )

#         # Build query filters
#         filters = {"student": student}

#         # If school_id is provided, add it to filters
#         if school_id:
#             school = await Schools.get_or_none(school_id=school_id)
#             if not school:
#                 return JSONResponse(
#                     content=StandardResponse(
#                         status=False,
#                         message="School not found.",
#                         data={},
#                         errors={"school_id": "School with this ID does not exist"}
#                     ).__dict__,
#                     status_code=status.HTTP_404_NOT_FOUND
#                 )
#             filters["school"] = school

#         # Get smart scale data
#         smart_scale_data = await SmartScaleData.filter(**filters).select_related("student", "school").first()

#         if not smart_scale_data:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message="No smart scale data found for this student.",
#                     data={},
#                     errors={"smart_scale_data": "No data available for the specified student"}
#                 ).__dict__,
#                 status_code=status.HTTP_404_NOT_FOUND
#             )

#         # Convert the record to dictionary for response
#         data_dict = {
#             "id": smart_scale_data.id,
#             "student_id": smart_scale_data.student.id,
#             "school_id": smart_scale_data.school.school_id,
#             "height_cm": smart_scale_data.height_cm,
#             "age_years": smart_scale_data.age_years,
#             "weighing_time": smart_scale_data.weighing_time.isoformat() if smart_scale_data.weighing_time else None,
#             "body_weight_kg": smart_scale_data.body_weight_kg,
#             "body_fat_rate_percent": smart_scale_data.body_fat_rate_percent,
#             "device_mac": smart_scale_data.device_mac,
#             "inorganic_salt_content_kg": smart_scale_data.inorganic_salt_content_kg,
#             "obesity_percent": smart_scale_data.obesity_percent,
#             "water_content_kg": smart_scale_data.water_content_kg,
#             "protein_content_kg": smart_scale_data.protein_content_kg,
#             "subcutaneous_fat_volume_kg": smart_scale_data.subcutaneous_fat_volume_kg,
#             "bmi": smart_scale_data.bmi,
#             "fat_content_kg": smart_scale_data.fat_content_kg,
#             "muscle_rate_percent": smart_scale_data.muscle_rate_percent,
#             "muscle_mass_kg": smart_scale_data.muscle_mass_kg,
#             "visceral_fat_level": smart_scale_data.visceral_fat_level,
#             "bmr": smart_scale_data.bmr,
#             "body_moisture_content_percent": smart_scale_data.body_moisture_content_percent,
#             "bone_mass_kg": smart_scale_data.bone_mass_kg,
#             "internal_protein_rate_percent": smart_scale_data.internal_protein_rate_percent,
#             "skeletal_muscle_rate_percent": smart_scale_data.skeletal_muscle_rate_percent,
#             "lean_body_mass_kg": smart_scale_data.lean_body_mass_kg,
#             "heart_rate_beats_min": smart_scale_data.heart_rate_beats_min,
#             "physical_score": smart_scale_data.physical_score,
#             "body_type": smart_scale_data.body_type,
#             "physical_age": smart_scale_data.physical_age,
#             "subcutaneous_fat_rate": smart_scale_data.subcutaneous_fat_rate,
#             "health_level": smart_scale_data.health_level,
#             "obesity_level": smart_scale_data.obesity_level,
#             "fat_control_quantity": smart_scale_data.fat_control_quantity,
#             "weight_control_quantity": smart_scale_data.weight_control_quantity,
#             "muscle_control_quantity": smart_scale_data.muscle_control_quantity,
#             "standard_body_weight": smart_scale_data.standard_body_weight,
#             "ideal_weight": smart_scale_data.ideal_weight,
#             "body_cell_volume_kg": smart_scale_data.body_cell_volume_kg,
#             "extracellular_water_volume_kg": smart_scale_data.extracellular_water_volume_kg,
#             "intracellular_water_volume_kg": smart_scale_data.intracellular_water_volume_kg,
#             "left_hand_fat_mass_kg": smart_scale_data.left_hand_fat_mass_kg,
#             "left_foot_fat_mass_kg": smart_scale_data.left_foot_fat_mass_kg,
#             "right_hand_fat_mass_kg": smart_scale_data.right_hand_fat_mass_kg,
#             "right_foot_fat_mass_kg": smart_scale_data.right_foot_fat_mass_kg,
#             "trunk_fat_mass_kg": smart_scale_data.trunk_fat_mass_kg,
#             "left_hand_fat_rate_percent": smart_scale_data.left_hand_fat_rate_percent,
#             "left_foot_fat_rate_percent": smart_scale_data.left_foot_fat_rate_percent,
#             "right_hand_fat_rate_percent": smart_scale_data.right_hand_fat_rate_percent,
#             "right_foot_fat_rate_percent": smart_scale_data.right_foot_fat_rate_percent,
#             "trunk_fat_rate_percent": smart_scale_data.trunk_fat_rate_percent,
#             "left_hand_muscle_mass_kg": smart_scale_data.left_hand_muscle_mass_kg,
#             "left_foot_muscle_mass_kg": smart_scale_data.left_foot_muscle_mass_kg,
#             "right_hand_muscle_mass_kg": smart_scale_data.right_hand_muscle_mass_kg,
#             "right_foot_muscle_mass_kg": smart_scale_data.right_foot_muscle_mass_kg,
#             "trunk_muscle_mass_kg": smart_scale_data.trunk_muscle_mass_kg,
#             "skeletal_muscle_mass_index": smart_scale_data.skeletal_muscle_mass_index,
#             "whr": smart_scale_data.whr,
#             "left_hand_muscle_rate": smart_scale_data.left_hand_muscle_rate,
#             "left_leg_muscle_rate": smart_scale_data.left_leg_muscle_rate,
#             "right_hand_muscle_rate": smart_scale_data.right_hand_muscle_rate,
#             "right_foot_muscle_rate": smart_scale_data.right_foot_muscle_rate,
#             "trunk_muscle_rate": smart_scale_data.trunk_muscle_rate,
#             "skeletal_muscle_mass_kg": smart_scale_data.skeletal_muscle_mass_kg,
#             "created_at": smart_scale_data.created_at.isoformat() if smart_scale_data.created_at else None,
#             "updated_at": smart_scale_data.updated_at.isoformat() if smart_scale_data.updated_at else None,
#             # Add static Health Score
#             "health_score": smart_scale_data.physical_score,
#             # Add static Physical Screening Analysis
#             "physical_screening_analysis": [
#                 "Calcium Intake: Daily consumption of calcium-rich foods like milk or paneer supports bone health, critical during teenage growth spurts.",
#                 "Hydration: Drinking 6-8 glasses of water daily ensures proper hydration and supports metabolic and cognitive functions.",
#                 "Physical Activity: Regular physical activity (3-4 times a week) is excellent for maintaining fitness, improving mood, and building strength.",
#                 "Family Meals: Eating meals with the family encourages a positive relationship with food and provides a structured eating routine.",
#                 "Screen-Free Eating: Avoiding distractions like TV or mobile during meals promotes mindful eating.",
#                 "Portion Control: Practicing portion control helps prevent overeating and supports healthy digestion."
#             ]
#         }

#         return JSONResponse(
#             content=StandardResponse(
#                 status=True,
#                 message="Smart scale data retrieved successfully.",
#                 data={
#                     "smart_scale_data": data_dict,
#                     "student_info": {

#                     }
#                 },
#                 errors={}
#             ).__dict__,
#             status_code=status.HTTP_200_OK
#         )

#     except Exception as e:
#         return JSONResponse(
#             content=StandardResponse(
#                 status=False,
#                 message="An unexpected error occurred while retrieving data.",
#                 data={},
#                 errors={"unexpected": str(e)}
#             ).__dict__,
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
        