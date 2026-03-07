from datetime import date

from fastapi import Depends, status
from fastapi.responses import JSONResponse
from src.core.file_manager import get_new_url

from src.core.manager import get_current_user
from src.models.user_models import ParentRoles, Parents
from src.utils.response import StandardResponse
from src.models.screening_models import DentalScreening,EyeScreening,BehaviouralScreening,NutritionScreening
from src.models.student_models import SchoolStudents
from . import router


def calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

@router.get("/childrens")
async def parent_childrens(current_user: dict = Depends(get_current_user)):
    """
    Parent dashboard:
    - Get the List of Children associated with the authenticated parent
    """

    creator_role = (current_user["user_role"])
    if creator_role not in [ParentRoles.PARENT, ParentRoles.GUARDIAN]:
        resp = StandardResponse(
            status=False,
            message="{creator_role} is not allowed to create school records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    parent = await Parents.get(id=current_user["user_id"]).prefetch_related("parent_children__student")

    # Prepare the list of children
    childrens = []
    for pc in parent.parent_children:
        student = pc.student
        print(student)
        behavioural_screening = await BehaviouralScreening.filter(student_id=student.id).order_by('-created_at').first()
        nutrition_screening = await NutritionScreening.filter(student_id=student.id).order_by('-created_at').first()  

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
            # "behavioural_screening_status": bool(behavioural_screening),
            # "nutrition_screening_status": bool(nutrition_screening),
            "behavioural_screening_status": behavioural_screening.screening_status if behavioural_screening else False,
            "nutrition_screening_status": nutrition_screening.screening_status if nutrition_screening else False
        })

    # Construct the response
    data_dict = {
        "status": True,
        "message": "Childrens list fetched successfully",
        "data": {
            "childrens": childrens
        },
        "errors": {}
    }

    response_obj = StandardResponse(**data_dict)
    return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)

