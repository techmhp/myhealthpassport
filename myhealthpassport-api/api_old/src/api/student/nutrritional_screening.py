from enum import Enum

from fastapi import Depends
from fastapi.responses import JSONResponse
from fastapi import status  # Ensure this import is present

from src.core.manager import get_current_user
from src.models.screening_models import NutritionScreening
from src.models.student_models import Students
from src.models.user_models import ConsultantTeam, ScreeningTeamRoles

from src.utils.response import StandardResponse


from . import router
from fastapi import Depends
from fastapi import status


# Define the allowed roles for screening team


# Define the nutrition checklist once at the module level for reuse
NUTRITION_CHECKLIST = {
    "eyes": [
        {"name": "Pallor of Conjunctiva"},
        {"name": "Bitot's Spot"},
        {"name": "Xerophthalmia (dry eyes)"},
        {"name": "Night blindness"},
        {"name": "Corneal ulceration or Keratomalacia"},
        {"name": "Normal"}
    ],
    "hair": [
        {"name": "Dull/dry and brittle hair"},
        {"name": "Easily plucked hair"},
        {"name": "Flag sign (banding of hair color)"},
        {"name": "Normal"}
    ],
    "mouth_lips": [
        {"name": "Cheilitis and cracks at the corners of the mouth"},
        {"name": "Angular stomatitis"},
        {"name": "Glossitis (inflamed and swollen tongue)"},
        {"name": "Magenta tongue"},
        {"name": "Fissures on the tongue"},
        {"name": "Normal"}
    ],
    "skin": [
        {"name": "Dry and scaly skin"},
        {"name": "Facial breakouts"},
        {"name": "Phrynoderma (follicular hyperkeratosis)"},
        {"name": "Hyperpigmentation"},
        {"name": "Easy bruising or petechiae"},
        {"name": "Pallor"},
        {"name": "Delayed wound healing"},
        {"name": "Normal"}
    ],
    "nails": [
        {"name": "Koilonychia (spoon-shaped nails)"},
        {"name": "Beau's lines (transverse grooves)"},
        {"name": "Pale nail beds"},
        {"name": "Brittle nails"},
        {"name": "Normal"}
    ],
    "teeth": [
        {"name": "Delayed eruption or loss of teeth"},
        {"name": "Dental caries"},
        {"name": "Hypoplasia of enamel"},
        {"name": "Bleeding gums"},
        {"name": "Normal"}
    ],
    "general_signs": [
        {"name": "Edema"},
        {"name": "Muscle wasting"},
        {"name": "Weakness or fatigue"},
        {"name": "Normal"}
    ],
    "bone_muscle": [
        {"name": "Rickets"},
        {"name": "Bone pain"},
        {"name": "Muscle cramps"},
        {"name": "Normal"}
    ]
}

# Create a mapping of category to item names for validation
NUTRITION_CHECKLIST_ITEMS = {
    category: [item["name"] for item in items]
    for category, items in NUTRITION_CHECKLIST.items()
}


@router.get("/students/{student_id}/nutritional", response_model=StandardResponse)
async def get_nutrition_screening(student_id: int, current_user: dict = Depends(get_current_user)):

    student = await Students.get_or_none(id=student_id)
    if student is None:
        resp = StandardResponse(
            status=False,
            message=f"Student with ID {student_id} not found",
            errors={"detail": "Student not found"}
        )
        return JSONResponse(content=resp.__dict__, status_code=404)

    nutrition_screening = await NutritionScreening.get_or_none(student_id=student_id)
    if nutrition_screening is None:
        nutrition_screening = NutritionScreening(
            student=student,
            eyes="",
            hair="",
            mouth_lips="",
            skin="",
            nails="",
            teeth="",
            general_signs="",
            bone_muscle="",
            note="",
            created_by=current_user.get("id"),
            updated_by=current_user.get("id"),
            doctor=None
        )
        await nutrition_screening.save()

    formatted_nutrition_data = {
        "eyes": [],
        "hair": [],
        "mouth_lips": [],
        "skin": [],
        "nails": [],
        "teeth": [],
        "general_signs": [],
        "bone_muscle": [],
    }

    for category, options in NUTRITION_CHECKLIST.items():
        field_value = getattr(nutrition_screening, category, "")
        selected_items = field_value.split(",") if field_value else []
        for option in options:
            status = option["name"] in selected_items
            formatted_nutrition_data[category].append({
                "name": option["name"],
                "status": status
            })

    data_dict = {
        "status": True,
        "message": "Student Nutrition Screening Details",
        "data": {
            "nutrition_screening": formatted_nutrition_data,
            "student_details": {
                "student_id": student.id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "middle_name": student.middle_name,
                "blood_group": student.blood_group,
                "gender": student.gender
            },
            "note": nutrition_screening.note,
            "next_followup": nutrition_screening.next_followup,
        },
        "errors": {}
    }

    response_obj = StandardResponse(**data_dict)
    return JSONResponse(content=response_obj.__dict__, status_code=200)

@router.put("/students/{student_id}/nutritional", response_model=StandardResponse)
async def update_nutrition_screening(student_id: int, payload: dict, current_user: dict = Depends(get_current_user)):

    creator_role = current_user["user_role"]
    if creator_role not in [ScreeningTeamRoles.NUTRITIONIST, ScreeningTeamRoles.PHYSICAL_WELLBEING, ScreeningTeamRoles.PSYCHOLOGIST]:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to create school records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)  # Use status correctly

    student = await Students.get_or_none(id=student_id)
    if student is None:
        response_obj = StandardResponse(
            status=False,
            message=f"Student with ID {student_id} not found",
            errors={"detail": "Student not found"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_404_NOT_FOUND)  # Fix status here too

    nutrition_screening = await NutritionScreening.get_or_none(student_id=student_id)

    doctor_id = payload.get("doctor_id")
    doctor = None
    if doctor_id is not None:
        doctor = await ConsultantTeam.get_or_none(id=doctor_id)
        
    user_id = current_user.get("user_id") or current_user.get("id")
    user_role = current_user.get("user_role")
    role_type = current_user.get("role_type")

    if nutrition_screening is None:
        nutrition_screening = NutritionScreening(
            student=student,
            doctor=doctor,
            created_by=user_id,
            created_user_role=user_role,
            created_role_type=role_type,
            updated_by=user_id,
            updated_role=user_role,
            updated_role_type=role_type,
        )
        await nutrition_screening.save()
    else:
        # Update existing nutrition screening record
        nutrition_screening.updated_by = user_id
        nutrition_screening.updated_role = user_role
        nutrition_screening.updated_role_type = role_type
        if doctor_id is not None:
            nutrition_screening.doctor = doctor

    # Process each nutrition category
    for nutrition_type in NUTRITION_CHECKLIST.keys():
        items = payload.get(nutrition_type, [])
        if not items:
            response_obj = StandardResponse(
                status=False,
                message=f"No items provided for {nutrition_type}",
                errors={"detail": f"{nutrition_type} items list is empty"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)  # Fix status here

        possible_items = NUTRITION_CHECKLIST_ITEMS.get(nutrition_type, [])
        
       
        provided_item_names = {item["name"] for item in items}  #  this is dict correct ?yes
        
        invalid_items = provided_item_names - set(possible_items)
        if invalid_items:
            response_obj = StandardResponse(
                status=False,
                message=f"Invalid items provided for {nutrition_type}: {invalid_items}",
                errors={"detail": f"Invalid checklist items for {nutrition_type}"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_400_BAD_REQUEST)  # Fix status here

        updated_items = [item["name"] for item in items if item.get("status", False)]
        setattr(nutrition_screening, nutrition_type, ",".join(updated_items))

    # Update note and next_followup if provided
    if "note" in payload:
        nutrition_screening.note = payload["note"]
    if "next_followup" in payload:
        nutrition_screening.next_followup = payload["next_followup"]
    
    nutrition_screening.updated_by = current_user.get("id")
    if doctor_id is not None:
        nutrition_screening.doctor = doctor
    nutrition_screening.screening_status = True
    await nutrition_screening.save()

    # Format updated nutrition screening data
    formatted_nutrition_data = {
        "eyes": [],
        "hair": [],
        "mouth_lips": [],
        "skin": [],
        "nails": [],
        "teeth": [],
        "general_signs": [],
        "bone_muscle": [],
    }

    for category, options in NUTRITION_CHECKLIST.items():
        field_value = getattr(nutrition_screening, category, "")
        selected_items = field_value.split(",") if field_value else []
        for option in options:
            status_flag = option["name"] in selected_items
            formatted_nutrition_data[category].append({
                "name": option["name"],
                "status": status_flag
            })
            
            
    data_dict = {
        "status": True,
        "message": "Student Nutrition Screening Updated",
        "data": {
            "nutrition_screening": formatted_nutrition_data,
            "student_details": {
                "student_id": student.id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "middle_name": student.middle_name,
                "blood_group": student.blood_group,
                "gender": student.gender
            },
            "note": nutrition_screening.note,
            "next_followup": nutrition_screening.next_followup,
            "doctor_id": doctor_id
        },
        "errors": {}
    }

    response_obj = StandardResponse(**data_dict)
    return JSONResponse(content=response_obj.__dict__, status_code=status.HTTP_200_OK)  # Fix status here
