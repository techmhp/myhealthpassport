from datetime import date

from fastapi import Depends, status
from fastapi.responses import JSONResponse
from src.core.file_manager import get_new_url
from tortoise.expressions import Q

from src.core.manager import get_current_user
from src.models.user_models import ParentRoles, Parents
from src.utils.response import StandardResponse
from src.models.screening_models import DentalScreening,EyeScreening,BehaviouralScreening,NutritionScreening
from src.models.student_models import SchoolStudents, ParentChildren, Students
from . import router


def calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

# Add these imports at the top
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ===================================================================
# MODIFIED: GET PARENT CHILDRENS (with Academic Year Filter)
# ===================================================================
@router.get("/childrens")
async def parent_childrens(
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user: dict = Depends(get_current_user)
):
    """
    Parent dashboard:
    - Get the List of Children associated with the authenticated parent
    """

    creator_role = current_user["user_role"]
    if creator_role not in [ParentRoles.PARENT, ParentRoles.GUARDIAN]:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to view children records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()

    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        resp = StandardResponse(
            status=False,
            message=str(e),
            data={},
            errors={"academic_year": str(e)}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    # Build academic year filter
    year_filter = build_academic_year_filter(academic_year)

    parent = await Parents.get(id=current_user["user_id"]).prefetch_related("parent_children__student")

    # Prepare the list of children
    childrens = []
    for pc in parent.parent_children:
        student = pc.student
        print(student)
        
        # ✅ FIX: Pass Q object as positional arg, NOT with **
        if isinstance(year_filter, Q):
            # If year_filter is a Q object
            behavioural_screening = await BehaviouralScreening.filter(
                year_filter,  # ✅ Q object as positional arg
                student_id=student.id
            ).order_by('-created_at').first()
            
            nutrition_screening = await NutritionScreening.filter(
                year_filter,  # ✅ Q object as positional arg
                student_id=student.id
            ).order_by('-created_at').first()
        else:
            # If year_filter is a dict
            behavioural_screening = await BehaviouralScreening.filter(
                **year_filter,  # ✅ Unpack dict
                student_id=student.id
            ).order_by('-created_at').first()
            
            nutrition_screening = await NutritionScreening.filter(
                **year_filter,  # ✅ Unpack dict
                student_id=student.id
            ).order_by('-created_at').first()

        school_enrollment = await SchoolStudents.filter(
            student_id=student.id,
            status=True,
            is_deleted=False
        ).prefetch_related("school").first()

        school_id = school_enrollment.school.school_id if school_enrollment else None
        school_name = school_enrollment.school.school_name if school_enrollment else "Not Enrolled"

        childrens.append({
            "student_id": student.id,
            "image": await get_new_url(student.profile_image) if student.profile_image else "",
            "first_name": student.first_name,
            "middle_name": student.middle_name or "",
            "last_name": student.last_name,
            "gender": student.gender,
            "blood_group": student.blood_group or "",
            "age": calculate_age(student.dob),
            "dob": student.dob.isoformat(),
            "school_id": school_id,
            "school_name": school_name,
            "behavioural_screening_status": behavioural_screening.screening_status if behavioural_screening else False,
            "nutrition_screening_status": nutrition_screening.screening_status if nutrition_screening else False
        })

    # Construct the response
    data_dict = {
        "status": True,
        "message": "Children's list fetched successfully",
        "data": {
            "academic_year": academic_year,
            "childrens": childrens
        },
        "errors": {}
    }

    response_obj = StandardResponse(**data_dict)
    return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)


# --- TEMPORARY: Link parent to student for testing (remove after testing) ---
@router.post("/temp-link-student")
async def temp_link_parent_student(
    mobile: str,
    student_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    TEMPORARY endpoint: Link a parent (by mobile) to a student (by ID).
    Used for testing PDF download on Live with test account.
    Remove after testing is complete.
    """
    parent = await Parents.filter(primary_mobile=mobile).first()
    if not parent:
        return JSONResponse({"status": False, "message": f"Parent with mobile {mobile} not found"}, status_code=404)

    student = await Students.get_or_none(id=student_id, is_deleted=False)
    if not student:
        return JSONResponse({"status": False, "message": f"Student {student_id} not found"}, status_code=404)

    existing = await ParentChildren.filter(parent_id=parent.id, student_id=student_id).first()
    if existing:
        return JSONResponse({"status": True, "message": f"Link already exists: parent {parent.id} ↔ student {student_id}"})

    await ParentChildren.create(parent_id=parent.id, student_id=student_id)
    return JSONResponse({"status": True, "message": f"Linked parent {parent.id} (mobile: {mobile}) ↔ student {student_id}"})
# --- END TEMPORARY ---


# @router.get("/childrens")
# async def parent_childrens(current_user: dict = Depends(get_current_user)):
#     """
#     Parent dashboard:
#     - Get the List of Children associated with the authenticated parent
#     """

#     creator_role = (current_user["user_role"])
#     if creator_role not in [ParentRoles.PARENT, ParentRoles.GUARDIAN]:
#         resp = StandardResponse(
#             status=False,
#             message="{creator_role} is not allowed to create school records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     parent = await Parents.get(id=current_user["user_id"]).prefetch_related("parent_children__student")

#     # Prepare the list of children
#     childrens = []
#     for pc in parent.parent_children:
#         student = pc.student
#         print(student)
#         behavioural_screening = await BehaviouralScreening.filter(student_id=student.id).order_by('-created_at').first()
#         nutrition_screening = await NutritionScreening.filter(student_id=student.id).order_by('-created_at').first()  

#         school_enrollment = await SchoolStudents.filter(
#             student_id=student.id,
#             status=True,
#             is_deleted=False
#         ).prefetch_related("school").first()

#         school_id = school_enrollment.school.school_id if school_enrollment else None
#         school_name = school_enrollment.school.school_name if school_enrollment else "Not Enrolled"

#         childrens.append({
#             "student_id": student.id,
#             "image": await get_new_url(student.profile_image) if student.profile_image else "",
#             "first_name": student.first_name,
#             "middle_name": student.middle_name or "",
#             "last_name": student.last_name,
#             "gender": student.gender,
#             "blood_group": student.blood_group or "",
#             "age": calculate_age(student.dob),
#             "dob": student.dob.isoformat(),
#             "school_id": school_id,
#             "school_name": school_name,
#             # "behavioural_screening_status": bool(behavioural_screening),
#             # "nutrition_screening_status": bool(nutrition_screening),
#             "behavioural_screening_status": behavioural_screening.screening_status if behavioural_screening else False,
#             "nutrition_screening_status": nutrition_screening.screening_status if nutrition_screening else False
#         })

#     # Construct the response
#     data_dict = {
#         "status": True,
#         "message": "Childrens list fetched successfully",
#         "data": {
#             "childrens": childrens
#         },
#         "errors": {}
#     }

#     response_obj = StandardResponse(**data_dict)
#     return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)

