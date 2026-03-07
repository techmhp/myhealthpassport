from fastapi import  Depends, HTTPException, Query
from typing import Optional
from datetime import date, datetime
from fastapi.responses import JSONResponse
from src.models.user_models import ConsultantTeam, AnalystTeam
from src.models.other_models import LabTests, LabTestBookings
from src.models.consultation_models import Consultations
from src.core.manager import get_current_user
from src.core.file_manager import get_new_url
from src.utils.response import StandardResponse
from src.api.doctor import router
from tortoise.queryset import Q

# Add these imports
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)


# ===================================================================
# MODIFIED: GET DOCTOR CONSULTATION DASHBOARD (with Academic Year Filter)
# ===================================================================
@router.get("/expert/consultation-dashboard")
async def get_doctor_dashboard(
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user_data: dict = Depends(get_current_user)
):
    if current_user_data.get("role_type", "").upper() != "CONSULTANT_TEAM":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint.")

    # Fetch Consultant ORM object using user_id from token payload
    current_user = await ConsultantTeam.get_or_none(id=current_user_data["user_id"])
    if not current_user:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")
    
    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()

    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Build academic year filter
    year_filter = build_academic_year_filter(academic_year)
    
    today = date.today()

    # FETCH consultations from DB with academic year filter
    consultations_qs = await Consultations.filter(
        year_filter,
        doctor_id=current_user.id,
        slot_date=today,
        is_deleted=False
    ).prefetch_related('patient').order_by('-slot_date', '-slot_time').all()

    consultations = []
    for consult in consultations_qs:
        student = consult.patient  # Correct FK to Student
        student_name = f"{student.first_name} {student.last_name}".strip() if student else "Unknown Student"

        consultations.append({
            "consult_id": consult.consult_id,
            "slot_date": consult.slot_date.isoformat(),
            "slot_time": consult.slot_time.strftime("%H:%M:%S"),
            "student_name": student_name,
            "booking_status": consult.booking_status,
            "consult_fee": float(consult.consult_fee),
        })

    # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
    response = StandardResponse.success_response(
        message="Doctor dashboard fetched successfully.",
        data={
            "date": today.isoformat(),
            "doctor_name": f"{current_user.first_name} {current_user.middle_name or ''} {current_user.last_name}".strip(),
            "doctor_specialty": current_user.user_role.value,
            "consultations": consultations,
        }
    )
    
    # Add academic year to response headers
    json_response = JSONResponse(content=response.dict(), status_code=200)
    json_response.headers["X-Academic-Year"] = academic_year
    return json_response

# ===================================================================
# MODIFIED: GET ALL DOCTOR CONSULTATIONS (with Academic Year Filter)
# ===================================================================
@router.get("/expert/patient-list")
async def get_all_doctor_consultations(
    search: Optional[str] = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(1000, ge=1, le=1000),
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user_data: dict = Depends(get_current_user)
):
    if current_user_data.get("role_type", "").upper() != "CONSULTANT_TEAM":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint.")

    # Fetch Consultant ORM object using user_id from token payload
    current_user = await ConsultantTeam.get_or_none(id=current_user_data["user_id"])
    if not current_user:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()

    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Build academic year filter
    year_filter = build_academic_year_filter(academic_year)

    # Build query for consultations with academic year filter
    query = Consultations.filter(
        year_filter,
        doctor_id=current_user.id,
        is_deleted=False
    ).prefetch_related('patient')
    
    if search:
        query = query.filter(
            Q(patient__first_name__icontains=search) |
            Q(patient__last_name__icontains=search) |
            Q(patient__phone__icontains=search) |
            Q(slot_date__icontains=search)
        )

    # Get total count for pagination
    total_consultations = await query.count()
    
    # Apply pagination
    consultations_qs = await query.offset((page - 1) * page_size).limit(page_size).order_by('slot_date', 'slot_time').all()
    
    consultations = []
    unique_consultations = {}
    serial_no = 1
    today = date.today()
    gender_map = {"M": "Male", "F": "Female"}
    
    for consult in consultations_qs:
        student = consult.patient
        if student and student.id not in unique_consultations:
            # Calculate Age
            dob = student.dob
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day)) if dob else None
            
            gender_full = gender_map.get(student.gender.upper(), student.gender)

            unique_consultations[student.id] = {
                "id": student.id,
                "first_name": student.first_name,
                "middle_name": student.middle_name,
                "last_name": student.last_name,
                "class_room": student.class_room,
                "section": student.section,
                "roll_no": student.roll_no,
                "country_code": student.country_code,

                "serial_no": serial_no,
                "phone": student.phone,
                "profile_image": await get_new_url(student.profile_image) if student.profile_image else "",
                "gender": gender_full,
                "age": str(age) if age is not None else "Unknown",
                "slot_date": consult.slot_date.isoformat() if consult.slot_date else None
            }
            serial_no += 1
    
    consultations = list(unique_consultations.values())
    
    # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
    response = StandardResponse.success_response(
        message="All consultations fetched successfully.",
        data={
            "doctor_name": f"{current_user.first_name} {current_user.middle_name or ''} {current_user.last_name}".strip(),
            "doctor_specialty": current_user.user_role.value,
            "consultations": consultations,
            "total": total_consultations,
            "page": page,
            "page_size": page_size
        }
    )
    
    # Add academic year to response headers
    json_response = JSONResponse(content=response.dict(), status_code=200)
    json_response.headers["X-Academic-Year"] = academic_year
    return json_response


@router.get("/expert/labtest-dashboard")
async def get_doctor_labtest_dashboard(
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user_data: dict = Depends(get_current_user)
):
    if current_user_data.get("role_type", "").upper() != "ANALYST_TEAM":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint.")

    current_user = await AnalystTeam.get_or_none(id=current_user_data["user_id"])
    if not current_user:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()

    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Build academic year filter - LabTestBookings only has created_at
    year_filter = Q(created_at__gte=ay_start, created_at__lte=ay_end)

    today = date.today()

    # Apply academic year filter to lab test bookings
    labtest_qs = await LabTestBookings.filter(
        year_filter,
        doctor_id=current_user.id,
        slot_date=today,
        is_deleted=False
    ).prefetch_related('patient', 'test').order_by('-slot_date', '-slot_time').all()

    labtests = []
    for booking in labtest_qs:
        student = booking.patient
        lab_test = booking.test

        student_name = f"{student.first_name} {student.middle_name or ''} {student.last_name}".strip()
        gender_map = {"M": "Male", "F": "Female"}
        gender = gender_map.get(student.gender.upper(), student.gender)

        labtests.append({
            "booking_id": booking.booking_id,
            "test_name": lab_test.test_name,
            "slot_date": booking.slot_date.isoformat(),
            "slot_time": booking.slot_time.strftime("%H:%M:%S"),
            "student_name": student_name,
            "profile_image": await get_new_url(student.profile_image) if student.profile_image else "",
            "phone_number": student.phone,
            "gender": gender,
            "price": float(booking.consult_fee),
            "booking_status": booking.booking_status,
        })

    return StandardResponse.success_response(
        message="Doctor lab test dashboard fetched successfully.",
        data={
            "academic_year": academic_year,
            "date": today.isoformat(),
            "doctor_name": f"{current_user.first_name} {current_user.middle_name or ''} {current_user.last_name}".strip(),
            "doctor_specialty": current_user.user_role.value,
            "lab_tests": labtests,
        }
    )


@router.get("/expert/labtestsappointment-list")
async def get_all_doctor_labtests(
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user_data: dict = Depends(get_current_user)
):
    if current_user_data.get("role_type", "").upper() != "ANALYST_TEAM":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint.")

    # Fetch Analyst ORM object using user_id from token payload
    current_user = await AnalystTeam.get_or_none(id=current_user_data["user_id"])
    if not current_user:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()

    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Build academic year filter - LabTestBookings only has created_at
    year_filter = Q(created_at__gte=ay_start, created_at__lte=ay_end)

    # FETCH ALL Lab Test Bookings with academic year filter
    labtest_qs = await LabTestBookings.filter(
        year_filter,
        doctor_id=current_user.id,
        booking_status__in=["confirmed", "completed"],
        is_deleted=False
    ).prefetch_related('patient', 'test').order_by('slot_date', 'slot_time').all()

    labtests = []
    serial_no = 1
    today = date.today()
    gender_map = {"M": "Male", "F": "Female"}

    for booking in labtest_qs:
        student = booking.patient
        lab_test = booking.test

        if student and lab_test:
            # Calculate Age
            dob = student.dob
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day)) if dob else None

            gender_full = gender_map.get(student.gender.upper(), student.gender)

            labtests.append({
                "serial_no": serial_no,
                "test_name": lab_test.test_name,
                "student_name": f"{student.first_name} {student.middle_name or ''} {student.last_name}".strip(),
                "phone_number": student.phone,
                "profile_image": await get_new_url(student.profile_image) if student.profile_image else "",
                "gender": gender_full,
                "age": age if age is not None else "Unknown",
                "slot_date": booking.slot_date.isoformat(),
                "slot_time": booking.slot_time.strftime("%H:%M:%S"),
                "price": float(booking.consult_fee),
                "booking_status": booking.booking_status,
            })
            serial_no += 1

    return StandardResponse.success_response(
        message="All lab test appointments fetched successfully.",
        data={
            "academic_year": academic_year,
            "doctor_name": f"{current_user.first_name} {current_user.middle_name or ''} {current_user.last_name}".strip(),
            "doctor_specialty": current_user.user_role.value,
            "lab_tests": labtests,
        }
    )


# from fastapi import  Depends, HTTPException, Query
# from typing import Optional
# from datetime import date, datetime

# from src.models.user_models import ConsultantTeam, AnalystTeam
# from src.models.other_models import LabTests, LabTestBookings
# from src.models.consultation_models import Consultations
# from src.core.manager import get_current_user
# from src.core.file_manager import get_new_url
# from src.utils.response import StandardResponse
# from src.api.doctor import router
# from tortoise.queryset import Q

# @router.get("/expert/consultation-dashboard")
# async def get_doctor_dashboard(current_user_data: dict = Depends(get_current_user)):
#     if current_user_data.get("role_type", "").upper() != "CONSULTANT_TEAM":
#         raise HTTPException(status_code=403, detail="Only doctors can access this endpoint.")

#     # Fetch Consultant ORM object using user_id from token payload
#     current_user = await ConsultantTeam.get_or_none(id=current_user_data["user_id"])
#     if not current_user:
#         raise HTTPException(status_code=404, detail="Doctor profile not found.")
    
#     today = date.today()

#     # FETCH consultations from DB
#     consultations_qs = await Consultations.filter(
#         doctor_id=current_user.id,
#         slot_date=today,
#         is_deleted=False
#     ).prefetch_related('patient').order_by('-slot_date', '-slot_time').all()

#     consultations = []
#     for consult in consultations_qs:
#         student = consult.patient  # Correct FK to Student
#         student_name = f"{student.first_name} {student.last_name}".strip() if student else "Unknown Student"

#         consultations.append({
#             "consult_id": consult.consult_id,
#             "slot_date": consult.slot_date.isoformat(),
#             "slot_time": consult.slot_time.strftime("%H:%M:%S"),
#             "student_name": student_name,
#             "booking_status": consult.booking_status,
#             "consult_fee": float(consult.consult_fee),
#         })

#     return StandardResponse.success_response(
#         message="Doctor dashboard fetched successfully.",
#         data={
#             "date": today.isoformat(),
#             "doctor_name": f"{current_user.first_name} {current_user.middle_name or ''} {current_user.last_name}".strip(),
#             "doctor_specialty": current_user.user_role.value,
#             "consultations": consultations,
#         }
#     )



# @router.get("/expert/patient-list")
# async def get_all_doctor_consultations(current_user_data: dict = Depends(get_current_user),
#     search: Optional[str] = Query(None, max_length=100),
#     page: int = Query(1, ge=1),
#     page_size: int = Query(1000, ge=1, le=1000),):
#     if current_user_data.get("role_type", "").upper() != "CONSULTANT_TEAM":
#         raise HTTPException(status_code=403, detail="Only doctors can access this endpoint.")

#     # Fetch Consultant ORM object using user_id from token payload
#     current_user = await ConsultantTeam.get_or_none(id=current_user_data["user_id"])
#     if not current_user:
#         raise HTTPException(status_code=404, detail="Doctor profile not found.")

#     # Build query for consultations
#     query = Consultations.filter(
#         doctor_id=current_user.id,
#         is_deleted=False
#     ).prefetch_related('patient')
    
#     if search:
#         query = query.filter(
#             Q(patient__first_name__icontains=search) |
#             Q(patient__last_name__icontains=search) |
#             Q(patient__phone__icontains=search) |
#             Q(slot_date__icontains=search)
#         )

#     # Get total count for pagination
#     total_consultations = await query.count()
    
#     # Apply pagination
#     consultations_qs = await query.offset((page - 1) * page_size).limit(page_size).order_by('slot_date', 'slot_time').all()
    
#     consultations = []
#     unique_consultations = {}
#     serial_no = 1
#     today = date.today()
#     gender_map = {"M": "Male", "F": "Female"}
#     for consult in consultations_qs:
#         student = consult.patient
#         if student and student.id not in unique_consultations:
#             # Calculate Age
#             dob = student.dob
#             age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day)) if dob else None
            
#             gender_full = gender_map.get(student.gender.upper(), student.gender)

#             unique_consultations[student.id] = {
#                 "id": student.id,
#                 "first_name": student.first_name,
#                 "middle_name": student.middle_name,
#                 "last_name": student.last_name,
#                 "class_room": student.class_room,
#                 "section": student.section,
#                 "roll_no": student.roll_no,
#                 "country_code": student.country_code,

#                 "serial_no": serial_no,
#                 # "student_name": f"{student.first_name} {student.last_name}".strip(),
#                 "phone": student.phone,
#                 "profile_image": await get_new_url(student.profile_image) if student.profile_image else "",
#                 "gender": gender_full,
#                 "age": str(age) if age is not None else "Unknown",
#                 "slot_date": consult.slot_date.isoformat() if consult.slot_date else None
#             }
#             serial_no += 1
#     consultations = list(unique_consultations.values())
#     return StandardResponse.success_response(
#         message="All consultations fetched successfully.",
#         data={
#             "doctor_name": f"{current_user.first_name} {current_user.middle_name or ''} {current_user.last_name}".strip(),
#             "doctor_specialty": current_user.user_role.value,
#             "consultations": consultations,
#             "total": total_consultations,
#             "page": page,
#             "page_size": page_size
#         }
#     )
    
    
# @router.get("/expert/labtest-dashboard")
# async def get_doctor_labtest_dashboard(current_user_data: dict = Depends(get_current_user)):
#     if current_user_data.get("role_type", "").upper() != "ANALYST_TEAM":
#         raise HTTPException(status_code=403, detail="Only doctors can access this endpoint.")

#     current_user = await AnalystTeam.get_or_none(id=current_user_data["user_id"])
#     if not current_user:
#         raise HTTPException(status_code=404, detail="Doctor profile not found.")

#     today = date.today()

#     labtest_qs = await LabTestBookings.filter(
#         doctor_id=current_user.id,
#         slot_date=today,
#         is_deleted=False
#     ).prefetch_related('patient', 'test').order_by('-slot_date', '-slot_time').all()

#     labtests = []
#     for booking in labtest_qs:
#         student = booking.patient
#         lab_test = booking.test

#         student_name = f"{student.first_name} {student.middle_name or ''} {student.last_name}".strip()
#         gender_map = {"M": "Male", "F": "Female"}
#         gender = gender_map.get(student.gender.upper(), student.gender)

#         labtests.append({
#             "booking_id": booking.booking_id,
#             "test_name": lab_test.test_name,
#             "slot_date": booking.slot_date.isoformat(),
#             "slot_time": booking.slot_time.strftime("%H:%M:%S"),
#             "student_name": student_name,
#             "profile_image": await get_new_url(student.profile_image) if student.profile_image else "",
#             "phone_number": student.phone,
#             "gender": gender,
#             "price": float(booking.consult_fee),
#             "booking_status": booking.booking_status,
#         })

#     return StandardResponse.success_response(
#         message="Doctor lab test dashboard fetched successfully.",
#         data={
#             "date": today.isoformat(),
#             "doctor_name": f"{current_user.first_name} {current_user.middle_name or ''} {current_user.last_name}".strip(),
#             "doctor_specialty": current_user.user_role.value,
#             "lab_tests": labtests,
#         }
#     )

# @router.get("/expert/labtestsappointment-list")
# async def get_all_doctor_labtests(current_user_data: dict = Depends(get_current_user)):
#     if current_user_data.get("role_type", "").upper() != "ANALYST_TEAM":
#         raise HTTPException(status_code=403, detail="Only doctors can access this endpoint.")

#     # Fetch Analyst ORM object using user_id from token payload
#     current_user = await AnalystTeam.get_or_none(id=current_user_data["user_id"])
#     if not current_user:
#         raise HTTPException(status_code=404, detail="Doctor profile not found.")

#     # FETCH ALL Lab Test Bookings where status is confirmed or completed (all dates)
#     labtest_qs = await LabTestBookings.filter(
#         doctor_id=current_user.id,
#         booking_status__in=["confirmed", "completed"],
#         is_deleted=False
#     ).prefetch_related('patient', 'test').order_by('slot_date', 'slot_time').all()

#     labtests = []
#     serial_no = 1
#     today = date.today()
#     gender_map = {"M": "Male", "F": "Female"}

#     for booking in labtest_qs:
#         student = booking.patient
#         lab_test = booking.test

#         if student and lab_test:
#             # Calculate Age
#             dob = student.dob
#             age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day)) if dob else None

#             gender_full = gender_map.get(student.gender.upper(), student.gender)

#             labtests.append({
#                 "serial_no": serial_no,
#                 "test_name": lab_test.test_name,
#                 "student_name": f"{student.first_name} {student.middle_name or ''} {student.last_name}".strip(),
#                 "phone_number": student.phone,
#                 "profile_image": await get_new_url(student.profile_image) if student.profile_image else "",
#                 "gender": gender_full,
#                 "age": age if age is not None else "Unknown",
#                 "slot_date": booking.slot_date.isoformat(),
#                 "slot_time": booking.slot_time.strftime("%H:%M:%S"),
#                 "price": float(booking.consult_fee),
#                 "booking_status": booking.booking_status,
#             })
#             serial_no += 1

#     return StandardResponse.success_response(
#         message="All lab test appointments fetched successfully.",
#         data={
#             "doctor_name": f"{current_user.first_name} {current_user.middle_name or ''} {current_user.last_name}".strip(),
#             "doctor_specialty": current_user.user_role.value,
#             "lab_tests": labtests,
#         }
#     )
