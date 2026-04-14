from fastapi import Depends
from fastapi.responses import JSONResponse
from fastapi import status  # Ensure this import is present
from src.core.manager import get_current_user
from src.models.screening_models import BehaviouralScreening
from src.models.student_models import Students
from src.models.user_models import ConsultantTeam
from src.utils.response import StandardResponse
from . import router
from datetime import date
from dateutil.relativedelta import relativedelta

from src.models.user_models import ScreeningTeamRoles



# Define the expected checklist structure for validation

BEHAVIOURAL_CHECKLIST = {
    "socialisation": [
        "Seeks out peers for social contact",
        "Participates in group activities",
        "Initiates contact with others",
        "Shows interest in what others are doing",
        "Can share or take turns with others"
    ],
    "communication": [
        "Speaks clearly and appropriately for age",
        "Responds when spoken to",
        "Initiates conversation or expresses needs verbally",
        "Uses gestures, facial expressions, or body language to communicate",
        "Maintains appropriate eye contact during interactions"
    ],
    "play_behaviour": [
        "Engages in play suitable for age",
        "Can play cooperatively with peers",
        "Shows imagination or creativity in play",
        "Plays alone appropriately when needed",
        "Is flexible and not rigid during play"
    ],
    "interaction": [
        "Responds appropriately to social cues",
        "Waits for their turn during interactions",
        "Able to start and end interactions respectfully",
        "Accepts praise, help, or correction",
        "Shows empathy or concern for others"
    ],
    "anxiety_withdrawal": [
        "Avoids eye contact consistently",
        "Withdraws from group or social situations",
        "Appears nervous or self-conscious during interactions",
        "Hesitates to speak or participate",
        "Frequently seeks adult reassurance"
    ],
    "problem_behaviour": [
        "Displays aggression (verbal or physical)",
        "Has difficulty controlling impulses",
        "Interrupts or disrupts others frequently",
        "Engages in repetitive or unusual behaviours",
        "Defiant or non-compliant with adult instructions"
    ]
}

# Add these imports at the top
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ===================================================================
# MODIFIED: GET BEHAVIOURAL SCREENING (with Academic Year Filter)
# ===================================================================
@router.get("/students/{student_id}/behavioural", response_model=StandardResponse)
async def get_behavioural_screening(
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user: dict = Depends(get_current_user)
):
    student = await Students.get_or_none(id=student_id)
    if student is None:
        response_obj = StandardResponse(
            status=False,
            message=f"Student with ID {student_id} not found",
            errors={"detail": "Student not found"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=404)

    valid_classes = [
        # Standard numeric
        "1","2","3","4","5","6","7","8","9","10","11","12",
        # "Class N" format
        "Class 1","Class 2","Class 3","Class 4","Class 5","Class 6",
        "Class 7","Class 8","Class 9","Class 10","Class 11","Class 12",
        # Roman numeral formats
        "Class I","Class II","Class III","Class IV","Class V","Class VI",
        "Class VII","Class VIII","Class IX","Class X","Class XI","Class XII",
        "I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII",
        # Ordinal formats (e.g. from class_values_dict)
        "1st Class","2nd Class","3rd Class","4th Class","5th Class","6th Class",
        "7th Class","8th Class","9th Class","10th Class","11th Class","12th Class",
        # Pre-primary
        "Play group","PP-I","PP-II","Nursery","LKG","UKG","Play school",
    ]
    class_room = student.class_room
    if class_room not in valid_classes:
        response_obj = StandardResponse(
            status=False,
            message=f"Student with ID {student_id} is not in a valid class",
            errors={"detail": f"Class ({class_room}) is not in the allowed class list"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=400)

    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()

    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        response_obj = StandardResponse(
            status=False,
            message=str(e),
            data={},
            errors={"academic_year": str(e)}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=400)

    # Build academic year filter
    year_filter = build_academic_year_filter(academic_year)

    today = date.today()
    age = relativedelta(today, student.dob).years

    # Apply academic year filter to behavioural screening query
    behavioural_screening = await BehaviouralScreening.filter(
        year_filter,
        student_id=student_id
    ).first()

    if behavioural_screening is None:
        behavioural_screening = BehaviouralScreening(
            student=student,
            created_by=current_user.get("id"),
            updated_by=current_user.get("id"),
            doctor=None
        )
        await behavioural_screening.save()

    # Format checklist categories as lists of question-answer pairs
    formatted_behavioural_data = {
        "socialisation": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.socialisation.items()
        ],
        "communication": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.communication.items()
        ],
        "play_behaviour": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.play_behaviour.items()
        ],
        "interaction": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.interaction.items()
        ],
        "anxiety_withdrawal": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.anxiety_withdrawal.items()
        ],
        "problem_behaviour": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.problem_behaviour.items()
        ],
        "summary_concerns": [
            {"category": key, "has_concern": value == "Yes"} for key, value in behavioural_screening.summary_concerns.items()
        ],
        "recommendations": {
            key: value for key, value in behavioural_screening.recommendations.items()
        }
    }

    # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
    data_dict = {
        "status": True,
        "message": "Student Behavioural Screening Details",
        "data": {
            "student_details": {
                "student_id": student.id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "middle_name": student.middle_name,
                "blood_group": student.blood_group,
                "gender": student.gender,
                "age": age
            },
            "behavioural_screening": formatted_behavioural_data,
            "note": behavioural_screening.note,
        },  # ← Same format as original
        "errors": {}
    }

    response_obj = StandardResponse(**data_dict)
    json_response = JSONResponse(content=response_obj.__dict__, status_code=200)
    json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
    return json_response


# @router.get("/students/{student_id}/behavioural", response_model=StandardResponse)
# async def get_behavioural_screening(student_id: int, current_user: dict = Depends(get_current_user)):
#     student = await Students.get_or_none(id=student_id)
#     if student is None:
#         response_obj = StandardResponse(
#             status=False,
#             message=f"Student with ID {student_id} not found",
#             errors={"detail": "Student not found"}
#         )
#         return JSONResponse(content=response_obj.__dict__, status_code=404)

    
#     valid_classes = ["Play group", "PP-I", "PP-II", "Nursery", "LKG", "UKG", "Play school", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12","1","2","3","4","5","6","7","8","9","10","11","12"]
#     class_room=student.class_room
#     if class_room not in valid_classes:
#         response_obj = StandardResponse(
#             status=False,
#             message=f"Student with ID {student_id} is not in a valid class",
#             errors={"detail": f"Class ({class_room}) is not in the allowed class list"}
#         )
#         return JSONResponse(content=response_obj.__dict__, status_code=400)

#     today = date.today()
#     age = relativedelta(today, student.dob).years
#     # if not (2 <= age <= 16):
#     #     response_obj = StandardResponse(
#     #         status=False,
#     #         message=f"Student with ID {student_id} is not within the valid age range (2-16 years)",
#     #         errors={"detail": f"Student age ({age}) is outside the allowed range"}
#     #     )
#     #     return JSONResponse(content=response_obj.__dict__, status_code=400)

#     behavioural_screening = await BehaviouralScreening.get_or_none(student_id=student_id)
#     if behavioural_screening is None:
#         behavioural_screening = BehaviouralScreening(
#             student=student,
#             created_by=current_user.get("id"),
#             updated_by=current_user.get("id"),
#             doctor=None
#         )
#         await behavioural_screening.save()

#     # Format checklist categories as lists of question-answer pairs
#     formatted_behavioural_data = {
#         "socialisation": [
#             {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.socialisation.items()
#         ],
#         "communication": [
#             {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.communication.items()
#         ],
#         "play_behaviour": [
#             {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.play_behaviour.items()
#         ],
#         "interaction": [
#             {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.interaction.items()
#         ],
#         "anxiety_withdrawal": [
#             {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.anxiety_withdrawal.items()
#         ],
#         "problem_behaviour": [
#             {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.problem_behaviour.items()
#         ],
#         # "gross_motor_skills": [],
#         "summary_concerns": [
#             {"category": key, "has_concern": value == "Yes"} for key, value in behavioural_screening.summary_concerns.items()
#         ],
#         "recommendations": {
#             key: value for key, value in behavioural_screening.recommendations.items()
#         }
#     }


#     data_dict = {
#         "status": True,
#         "message": "Student Behavioural Screening Details",
#         "data": {
#             "student_details": {
#                 "student_id": student.id,
#                 "first_name": student.first_name,
#                 "last_name": student.last_name,
#                 "middle_name": student.middle_name,
#                 "blood_group": student.blood_group,
#                 "gender": student.gender,
#                 "age": age
#             },
#             "behavioural_screening": formatted_behavioural_data,
#             "note": behavioural_screening.note,
#         },
#         "errors": {}
#     }

#     response_obj = StandardResponse(**data_dict)
#     return JSONResponse(content=response_obj.__dict__, status_code=200)

@router.put("/students/{student_id}/behavioural", response_model=StandardResponse)
async def update_behavioural_screening(student_id: int, payload: dict, current_user: dict = Depends(get_current_user)):
    student = await Students.get_or_none(id=student_id)
    if student is None:
        response_obj = StandardResponse(
            status=False,
            message=f"Student with ID {student_id} not found",
            errors={"detail": "Student not found"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=404)

    
    today = date.today()
    age = relativedelta(today, student.dob).years
    
    valid_classes = [
        # Standard numeric
        "1","2","3","4","5","6","7","8","9","10","11","12",
        # "Class N" format
        "Class 1","Class 2","Class 3","Class 4","Class 5","Class 6",
        "Class 7","Class 8","Class 9","Class 10","Class 11","Class 12",
        # Roman numeral formats
        "Class I","Class II","Class III","Class IV","Class V","Class VI",
        "Class VII","Class VIII","Class IX","Class X","Class XI","Class XII",
        "I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII",
        # Ordinal formats (e.g. from class_values_dict)
        "1st Class","2nd Class","3rd Class","4th Class","5th Class","6th Class",
        "7th Class","8th Class","9th Class","10th Class","11th Class","12th Class",
        # Pre-primary
        "Play group","PP-I","PP-II","Nursery","LKG","UKG","Play school",
    ]
    class_room=student.class_room
    if class_room not in valid_classes:
        response_obj = StandardResponse(
            status=False,
            message=f"Student with ID {student_id} is not in a valid class",
            errors={"detail": f"Class ({class_room}) is not in the allowed class list"}
        )
        return JSONResponse(content=response_obj.__dict__, status_code=400)

    behavioural_screening = await BehaviouralScreening.get_or_none(student_id=student_id)

    doctor_id = payload.get("doctor_id")
    doctor = None
    if doctor_id is not None:
        doctor = await ConsultantTeam.get_or_none(id=doctor_id)

    if behavioural_screening is None:
        behavioural_screening = BehaviouralScreening(
            student=student,
            doctor=doctor,
            created_by=current_user.get("id"),
            updated_by=current_user.get("id"),
            created_user_role=current_user.get("user_role"),
            created_role_type=current_user.get("role_type"),
            updated_user_role=current_user.get("user_role"),
            updated_role_type=current_user.get("role_type")
        )
        await behavioural_screening.save()

    # Extract behavioural_screening data
    behavioural_data = payload.get("behavioural_screening", {})

    # Update checklist categories
    for category in ["socialisation", "communication", "play_behaviour", "interaction", "anxiety_withdrawal", "problem_behaviour"]:
        if category in behavioural_data:
            items = behavioural_data[category]
            if not isinstance(items, list):
                response_obj = StandardResponse(
                    status=False,
                    message=f"Invalid format for {category}",
                    errors={"detail": f"{category} must be a list of question-answer pairs"}
                )
                return JSONResponse(content=response_obj.__dict__, status_code=400)

            items_dict = {}
            for item in items:
                if not isinstance(item, dict) or "question" not in item or "anwser" not in item:
                    response_obj = StandardResponse(
                        status=False,
                        message=f"Invalid item format in {category}",
                        errors={"detail": "Each item must have 'question' and 'anwser' keys"}
                    )
                    return JSONResponse(content=response_obj.__dict__, status_code=400)
                question = item["question"]
                anwser = item["anwser"]
                if not isinstance(anwser, bool):
                    response_obj = StandardResponse(
                        status=False,
                        message=f"Invalid answer value for {question} in {category}: {anwser}",
                        errors={"detail": "Answer must be a boolean"}
                    )
                    return JSONResponse(content=response_obj.__dict__, status_code=400)
                items_dict[question] = "Yes" if anwser else "No"

            expected_keys = set(BEHAVIOURAL_CHECKLIST[category])
            provided_keys = set(items_dict.keys())
            invalid_keys = provided_keys - expected_keys
            if invalid_keys:
                response_obj = StandardResponse(
                    status=False,
                    message=f"Invalid keys provided for {category}: {invalid_keys}",
                    errors={"detail": f"Invalid checklist items for {category}"}
                )
                return JSONResponse(content=response_obj.__dict__, status_code=400)

            setattr(behavioural_screening, category, items_dict)

    # Update summary of concerns
    if "summary_concerns" in behavioural_data:
        summary = behavioural_data["summary_concerns"]
        if not isinstance(summary, list):
            response_obj = StandardResponse(
                status=False,
                message="Invalid format for summary_concerns",
                errors={"detail": "summary_concerns must be a list of category-concern pairs"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=400)

        summary_dict = {}
        expected_keys = {"socialisation", "communication", "play_behaviour", "interaction", "anxiety_withdrawal", "problem_behaviour"}
        for item in summary:
            if not isinstance(item, dict) or "category" not in item or "has_concern" not in item:
                response_obj = StandardResponse(
                    status=False,
                    message="Invalid item format in summary_concerns",
                    errors={"detail": "Each item must have 'category' and 'has_concern' keys"}
                )
                return JSONResponse(content=response_obj.__dict__, status_code=400)
            category = item["category"]
            has_concern = item["has_concern"]
            if not isinstance(has_concern, bool):
                response_obj = StandardResponse(
                    status=False,
                    message=f"Invalid has_concern value for {category} in summary_concerns: {has_concern}",
                    errors={"detail": "has_concern must be a boolean"}
                )
                return JSONResponse(content=response_obj.__dict__, status_code=400)
            summary_dict[category] = "Yes" if has_concern else "No"

        provided_keys = set(summary_dict.keys())
        invalid_keys = provided_keys - expected_keys
        if invalid_keys:
            response_obj = StandardResponse(
                status=False,
                message=f"Invalid keys in summary_concerns: {invalid_keys}",
                errors={"detail": "Invalid summary keys"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=400)

        behavioural_screening.summary_concerns = summary_dict

    # Update recommendations
    if "recommendations" in behavioural_data:
        recommendations = behavioural_data["recommendations"]
        if not isinstance(recommendations, dict):
            response_obj = StandardResponse(
                status=False,
                message="Invalid format for recommendations",
                errors={"detail": "recommendations must be a dictionary with boolean values"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=400)

        recommendations_dict = {}
        expected_keys = {
            "no_immediate_concern", "continue_observation", "discuss_with_teacher",
            "schedule_parent_meeting", "refer_for_counselling", "recommend_evaluation"
        }
        for key, value in recommendations.items():
            if key not in expected_keys:
                response_obj = StandardResponse(
                    status=False,
                    message=f"Invalid key in recommendations: {key}",
                    errors={"detail": "Invalid recommendation key"}
                )
                return JSONResponse(content=response_obj.__dict__, status_code=400)
            if not isinstance(value, bool):
                response_obj = StandardResponse(
                    status=False,
                    message=f"Invalid value for {key} in recommendations: {value}",
                    errors={"detail": "Recommendation values must be boolean"}
                )
                return JSONResponse(content=response_obj.__dict__, status_code=400)
            recommendations_dict[key] = value  # Store as boolean

        provided_keys = set(recommendations_dict.keys())
        invalid_keys = provided_keys - expected_keys
        if invalid_keys:
            response_obj = StandardResponse(
                status=False,
                message=f"Invalid keys in recommendations: {invalid_keys}",
                errors={"detail": "Invalid recommendation keys"}
            )
            return JSONResponse(content=response_obj.__dict__, status_code=400)

        behavioural_screening.recommendations = recommendations_dict

    
    # Update note and next_followup if provided
    if "note" in payload:
        behavioural_screening.note = payload["note"]
    if "next_followup" in payload:
        behavioural_screening.next_followup = payload["next_followup"]

    behavioural_screening.updated_by = current_user.get("id")
    behavioural_screening.updated_user_role = current_user.get("user_role")
    behavioural_screening.updated_role_type = current_user.get("role_type")

    if doctor_id is not None:
        behavioural_screening.doctor = doctor
    behavioural_screening.screening_status = True
    await behavioural_screening.save()

    # Prepare formatted response
    formatted_behavioural_data = {
        "socialisation": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.socialisation.items()
        ],
        "communication": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.communication.items()
        ],
        "play_behaviour": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.play_behaviour.items()
        ],
        "interaction": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.interaction.items()
        ],
        "anxiety_withdrawal": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.anxiety_withdrawal.items()
        ],
        "problem_behaviour": [
            {"question": key, "anwser": value == "Yes"} for key, value in behavioural_screening.problem_behaviour.items()
        ],
        # "gross_motor_skills": [],
        "summary_concerns": [
            {"category": key, "has_concern": value == "Yes"} for key, value in behavioural_screening.summary_concerns.items()
        ],
        "recommendations": {
            key: value for key, value in behavioural_screening.recommendations.items()
        }
    }


    data_dict = {
        "status": True,
        "message": "Student Behavioural Screening Updated",
        "data": {
            "student_details": {
                "student_id": student.id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "middle_name": student.middle_name,
                "blood_group": student.blood_group,
                "gender": student.gender,
                "age": age
            },
            "behavioural_screening": formatted_behavioural_data,
            "note": behavioural_screening.note,
            "next_followup": behavioural_screening.next_followup,
            "doctor_id": doctor_id
        },
        "errors": {}
    }

    response_obj = StandardResponse(**data_dict)
    return JSONResponse(content=response_obj.__dict__, status_code=200)
