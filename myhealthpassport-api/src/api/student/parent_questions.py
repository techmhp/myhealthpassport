from black.strings import sub_twice
from fastapi import APIRouter, Depends
from typing import Dict, Any
from tortoise.exceptions import DoesNotExist
from src.utils.response import StandardResponse
from src.models.user_models import Parents, ConsultantTeam
from src.models.student_models import Students, ParentChildren
from src.models.screening_models import QuestionariesAndAnswers
from src.core.manager import get_current_user
from src.schemas.screening_schema import QuestionariesAndAnswersResponse,DevelopmentalAnswersBatch
from datetime import date
from typing import Any, List, Optional


from src.core.manager import get_current_user

from fastapi.responses import JSONResponse
from fastapi import status

from src.models.user_models import ParentRoles, SchoolRoles, AdminTeamRoles, ScreeningTeamRoles, AnalystRoles

from . import router

from src.utils.calculator import calculate_age_string

from src.models.other_models import Questionnaire, StudentQuestionnaire

from .schema import DevelopmentalQuestionnaireAnswers

from .schema import StudentQuestionResponseItem

# Define Question Group Constants (consider moving to a constants.py file)
QUESTION_GROUP_PLAY_GROUP = "PLAY_GROUP_QUESTIONS"
QUESTION_GROUP_PP_I = "PP_I_QUESTIONS"
QUESTION_GROUP_PP_II = "PP_II_QUESTIONS"
QUESTION_GROUP_GRADE_I = "GRADE_I_QUESTIONS"
QUESTION_GROUP_GRADE_II = "GRADE_II_QUESTIONS"
QUESTION_GROUP_GRADE_III = "GRADE_III_QUESTIONS"
QUESTION_GROUP_GRADE_IV = "GRADE_IV_QUESTIONS"
QUESTION_GROUP_GRADE_V = "GRADE_V_QUESTIONS"
QUESTION_GROUP_CLASS_6 = "CLASS_6_QUESTIONS"
QUESTION_GROUP_CLASS_7 = "CLASS_7_QUESTIONS"
QUESTION_GROUP_CLASS_8 = "CLASS_8_QUESTIONS"
QUESTION_GROUP_CLASS_9 = "CLASS_9_QUESTIONS"
QUESTION_GROUP_CLASS_10 = "CLASS_10_QUESTIONS"
QUESTION_GROUP_CLASS_11 = "CLASS_11_QUESTIONS"
QUESTION_GROUP_CLASS_12 = "CLASS_12_QUESTIONS"


def get_question_group_for_age(age: int) -> Optional[str]:
    """Determines the question group based on student's age."""
    if 2 <= age < 3:
        return QUESTION_GROUP_PLAY_GROUP
    elif 3 <= age < 4:
        return QUESTION_GROUP_PP_I
    elif 4 <= age < 5:
        return QUESTION_GROUP_PP_II
    elif 5 <= age < 6:
        return QUESTION_GROUP_GRADE_I
    elif 6 <= age < 7:
        return QUESTION_GROUP_GRADE_II
    elif 7 <= age < 8:
        return QUESTION_GROUP_GRADE_III
    elif 8 <= age < 9:
        return QUESTION_GROUP_GRADE_IV
    elif 9 <= age < 10:
        return QUESTION_GROUP_GRADE_V
    # To-Do:  Extra Logic at 10 Years
    elif 11 <= age < 12: # Age 10 is currently unhandled
        return QUESTION_GROUP_CLASS_6
    elif 12 <= age < 13:
        return QUESTION_GROUP_CLASS_7
    elif 13 <= age < 14:
        return QUESTION_GROUP_CLASS_8
    elif 14 <= age < 15:
        return QUESTION_GROUP_CLASS_9
    elif 15 <= age < 16:
        return QUESTION_GROUP_CLASS_10
    elif 16 <= age < 17:
        return QUESTION_GROUP_CLASS_11
    elif 17 <= age < 18: # Or age <= 18 depending on inclusivity
        return QUESTION_GROUP_CLASS_12
    else:
        return None

# @router.get("/student/{student_id}/developmental-questions", response_model=StandardResponse)
# async def get_student_developmental_questions(student_id: int, current_user: Any = Depends(get_current_user)):
#     """
#     # Retrieve developmental questions for a specific student based on their age.
#     """

#     creator_role = (current_user["user_role"])
#     allowed_roles = [
#         ParentRoles.PARENT, ParentRoles.GUARDIAN, AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,
#         SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER,
#         ScreeningTeamRoles.PHYSICAL_WELLBEING, ScreeningTeamRoles.DENTIST,
#         ScreeningTeamRoles.EYE_SPECIALIST, ScreeningTeamRoles.NUTRITIONIST,
#         ScreeningTeamRoles.PSYCHOLOGIST,
#         AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER
#     ]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message="{creator_role} is not allowed to create school records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#         # Verify the student exists
#     student = await Students.get_or_none(id=student_id)
#     if not student:
#         resp = StandardResponse(
#             status=False,
#             message="Student not found",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)


#     # Calculate student's age
#     if not student.dob:
#         resp = StandardResponse(
#             status=False,
#             message="Something Went Wrong. Please Update Student Date of Birth",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     age = int(calculate_age_string(student.dob))
#     age = 8  # currently it is static  ,  need class based filter
#     selected_question_group = get_question_group_for_age(age)




#     # Filter Qyestions List and Group Based On Age
#     questions_list = await Questionnaire.filter(group=selected_question_group).all()
#     for question in questions_list:
#         # Check Question ALready Exist in Student Records
#         student_question = await StudentQuestionnaire.filter(student=student, question=question.question_id).first()

#         if student_question:
#             pass
#         else:
#             print("question inserted")
#             create_question = StudentQuestionnaire()
#             create_question.student=student
#             create_question.question=question
#             await create_question.save()

#     questions_list_ids = [q.question_id for q in questions_list]
#     student_questions_data = await StudentQuestionnaire.filter(
#         student=student, question__group=selected_question_group).select_related('question').values(
#         'sq_id',
#         'answer',
#         question_id='question__question_id',
#         question_text='question__question',
#         question_type='question__type',
#         question_sub_type='question__sub_type',
#         question_group='question__group'
#     )


#     # Prepare data for the Pydantic response model

#     development_questions = {}
#     for question in student_questions_data:
#         if question["question_sub_type"] in development_questions.keys():
#             development_questions[question["question_sub_type"]].append(question)
#         else:
#             development_questions[question["question_sub_type"]] = [question]

#     all_questions = []
#     for key, value in development_questions.items():
#         all_questions.append({
#             "category": key,
#             "data": value
#         })

#     resp = StandardResponse(
#         status=True,
#         message="List of Questions",
#         data={
#             "questions": all_questions,
#             "student": {
#                 "id": student.id,
#                 "image": student.profile_image,
#                 "first_name": student.first_name,
#                 "middle_name": student.middle_name,
#                 "last_name": student.last_name,
#                 "gender": student.gender,
#                 "blood_group": student.blood_group,
#                 "age": calculate_age_string(student.dob),
#                 "dob": str(student.dob)
#             }
#         },
#         errors={},
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)


@router.put("/student/{student_id}/developmental-questions",
            response_model=StandardResponse,
            summary="Update answers for a student's developmental questions")
async def update_student_developmental_questions(
        student_id: int,
        payload: DevelopmentalQuestionnaireAnswers,  # Using the schema from Canvas
        current_user: dict = Depends(get_current_user)
):
    """
    # Update answers for a student's developmental questions.
    Allows parents or guardians to submit answers.
    """
    creator_role = current_user.get("user_role")
    user_id = current_user.get("id")  # Assuming 'id' key exists for user's ID

    allowed_roles = [
        ParentRoles.PARENT,
        ParentRoles.GUARDIAN
    ]

    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=True,
            message=f"{creator_role} is not allowed to update these records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # Verify the student exists
    student = await Students.get_or_none(id=student_id)
    if not student:
        resp = StandardResponse(
            status=True,
            message="Student not found",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)


    updated_count = 0
    errors_list = []

    if not payload.answers:
        resp = StandardResponse(
            status=False,
            message="No answers provided in the payload.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)


    for answer_item in payload.answers:
        # Find the specific StudentQuestionnaire entry for this student and question ID
        student_question_entry = await StudentQuestionnaire.get_or_none(
            sq_id=answer_item.sq_id,
            student_id=student_id  # Ensure the sq_id belongs to the specified student
        )

        if student_question_entry:
            student_question_entry.answer = answer_item.answer
            student_question_entry.updated_by = user_id
            student_question_entry.updated_user_role = creator_role
            student_question_entry.updated_role_type = current_user.get("role_type")
            await student_question_entry.save()
            updated_count += 1
        else:
            # Log or collect information about sq_ids that were not found or didn't match the student
            errors_list.append({
                "sq_id": answer_item.sq_id,
                "error": f"Questionnaire entry not found for this student or sq_id is invalid."
            })

    if len(errors_list) == 0:  # Partial success
        resp = StandardResponse(
            status=True,  # Still considered a success as some might have updated
            message=f"Successfully updated {updated_count} answer(s). Some items had issues.",
            data={"updated_count": updated_count},
            errors={"details": errors_list}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_202_ACCEPTED)

    if errors_list and updated_count == 0:
        resp = StandardResponse(
            status=True,
            message="Failed to update any answers. See errors for details.",
            data={"updated_count": updated_count},
            errors={"details": errors_list}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_202_ACCEPTED)




# @router.get("/student/{student_id}/nutritional-questions", response_model=StandardResponse)
# async def get_student_nutritional_questions(student_id: int, current_user: Any = Depends(get_current_user)):
#     """
#     # Retrieve developmental questions for a specific student based on their age.
#     """

#     creator_role = (current_user["user_role"])
#     allowed_roles = [
#         ParentRoles.PARENT, ParentRoles.GUARDIAN, AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,
#         SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER,
#         ScreeningTeamRoles.PHYSICAL_WELLBEING, ScreeningTeamRoles.DENTIST,
#         ScreeningTeamRoles.EYE_SPECIALIST, ScreeningTeamRoles.NUTRITIONIST,
#         ScreeningTeamRoles.PSYCHOLOGIST,
#         AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER
#     ]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message="{creator_role} is not allowed to create school records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#         # Verify the student exists
#     student = await Students.get_or_none(id=student_id)
#     if not student:
#         resp = StandardResponse(
#             status=False,
#             message="Student not found",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)


#     # Calculate student's age
#     if not student.dob:
#         resp = StandardResponse(
#             status=False,
#             message="Something Went Wrong. Please Update Student Date of Birth",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)



#     # Filter Qyestions List and Group Based On Age
#     questions_list = await Questionnaire.filter(type="nutritional").all()
#     for question in questions_list:
#         # Check Question ALready Exist in Student Records
#         student_question = await StudentQuestionnaire.filter(student=student, question=question.question_id).first()
#         if student_question:
#             pass
#         else:
#             create_question = StudentQuestionnaire()
#             create_question.student=student
#             create_question.question=question
#             await create_question.save()

#     student_questions_data = await StudentQuestionnaire.filter(student=student, question__type="nutritional").select_related('question').values(
#         'sq_id',
#         'answer',
#         question_id='question__question_id',
#         question_text='question__question',
#         question_type='question__type',
#         question_sub_type='question__sub_type',
#         question_group='question__group'
#     )

#     resp = StandardResponse(
#         status=True,
#         message="List of Questions",
#         data={
#             "questions": student_questions_data,
#             "student": {
#                 "id": student.id,
#                 "image": student.profile_image,
#                 "first_name": student.first_name,
#                 "middle_name": student.middle_name,
#                 "last_name": student.last_name,
#                 "gender": student.gender,
#                 "blood_group": student.blood_group,
#                 "age": calculate_age_string(student.dob),
#                 "dob": str(student.dob)
#             }
#         },
#         errors={},
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)



@router.put("/student/{student_id}/nutritional-questions",
            response_model=StandardResponse,
            summary="Update answers for a student's developmental questions")
async def update_student_nutritional_questions(
        student_id: int,
        payload: DevelopmentalQuestionnaireAnswers,  # Using the schema from Canvas
        current_user: dict = Depends(get_current_user)
):
    """
    # Update answers for a student's developmental questions.
    Allows parents or guardians to submit answers.
    """
    creator_role = current_user.get("user_role")
    user_id = current_user.get("id")  # Assuming 'id' key exists for user's ID

    allowed_roles = [
        ParentRoles.PARENT,
        ParentRoles.GUARDIAN
    ]

    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=True,
            message=f"{creator_role} is not allowed to update these records.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    # Verify the student exists
    student = await Students.get_or_none(id=student_id)
    if not student:
        resp = StandardResponse(
            status=True,
            message="Student not found",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)


    updated_count = 0
    errors_list = []

    if not payload.answers:
        resp = StandardResponse(
            status=False,
            message="No answers provided in the payload.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)


    for answer_item in payload.answers:
        # Find the specific StudentQuestionnaire entry for this student and question ID
        student_question_entry = await StudentQuestionnaire.get_or_none(
            sq_id=answer_item.sq_id,
            student_id=student_id  # Ensure the sq_id belongs to the specified student
        )

        if student_question_entry:
            student_question_entry.answer = answer_item.answer
            student_question_entry.updated_by = user_id
            student_question_entry.updated_user_role = creator_role
            student_question_entry.updated_role_type = current_user.get("role_type")
            await student_question_entry.save()
            updated_count += 1
        else:
            # Log or collect information about sq_ids that were not found or didn't match the student
            errors_list.append({
                "sq_id": answer_item.sq_id,
                "error": f"Questionnaire entry not found for this student or sq_id is invalid."
            })

    if len(errors_list) == 0:  # Partial success
        resp = StandardResponse(
            status=True,  # Still considered a success as some might have updated
            message=f"Successfully updated {updated_count} answer(s). Some items had issues.",
            data={"updated_count": updated_count},
            errors={"details": errors_list}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_202_ACCEPTED)

    if errors_list and updated_count == 0:
        resp = StandardResponse(
            status=True,
            message="Failed to update any answers. See errors for details.",
            data={"updated_count": updated_count},
            errors={"details": errors_list}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_202_ACCEPTED)


# Add these imports at the top
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# ===================================================================
# MODIFIED: GET DEVELOPMENTAL QUESTIONS (with Academic Year Filter)
# ===================================================================
@router.get("/student/{student_id}/developmental-questions", response_model=StandardResponse)
async def get_student_developmental_questions(
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user: Any = Depends(get_current_user)
):
    """
    # Retrieve developmental questions for a specific student based on their age.
    """

    creator_role = (current_user["user_role"])
    allowed_roles = [
        ParentRoles.PARENT, ParentRoles.GUARDIAN, AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,
        SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER,
        ScreeningTeamRoles.PHYSICAL_WELLBEING, ScreeningTeamRoles.DENTIST,
        ScreeningTeamRoles.EYE_SPECIALIST, ScreeningTeamRoles.NUTRITIONIST,
        ScreeningTeamRoles.PSYCHOLOGIST,
        AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER
    ]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message="{creator_role} is not allowed to create school records.",
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

    # Verify the student exists
    student = await Students.get_or_none(id=student_id)
    if not student:
        resp = StandardResponse(
            status=False,
            message="Student not found",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Calculate student's age
    if not student.dob:
        resp = StandardResponse(
            status=False,
            message="Something Went Wrong. Please Update Student Date of Birth",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    age = int(calculate_age_string(student.dob))
    age = 8  # currently it is static, need class based filter
    selected_question_group = get_question_group_for_age(age)

    # Filter Questions List and Group Based On Age
    questions_list = await Questionnaire.filter(group=selected_question_group).all()
    for question in questions_list:
        # Check Question Already Exist in Student Records (with academic year filter)
        student_question = await StudentQuestionnaire.filter(
            year_filter,
            student=student,
            question=question.question_id
        ).first()

        if student_question:
            pass
        else:
            print("question inserted")
            create_question = StudentQuestionnaire()
            create_question.student = student
            create_question.question = question
            await create_question.save()

    questions_list_ids = [q.question_id for q in questions_list]
    
    # Apply academic year filter to student questions query
    student_questions_data = await StudentQuestionnaire.filter(
        year_filter,
        student=student,
        question__group=selected_question_group
    ).select_related('question').values(
        'sq_id',
        'answer',
        question_id='question__question_id',
        question_text='question__question',
        question_type='question__type',
        question_sub_type='question__sub_type',
        question_group='question__group'
    )

    # Prepare data for the Pydantic response model
    development_questions = {}
    for question in student_questions_data:
        if question["question_sub_type"] in development_questions.keys():
            development_questions[question["question_sub_type"]].append(question)
        else:
            development_questions[question["question_sub_type"]] = [question]

    all_questions = []
    for key, value in development_questions.items():
        all_questions.append({
            "category": key,
            "data": value
        })

    # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
    resp = StandardResponse(
        status=True,
        message="List of Questions",
        data={
            "questions": all_questions,
            "student": {
                "id": student.id,
                "image": student.profile_image,
                "first_name": student.first_name,
                "middle_name": student.middle_name,
                "last_name": student.last_name,
                "gender": student.gender,
                "blood_group": student.blood_group,
                "age": calculate_age_string(student.dob),
                "dob": str(student.dob)
            }
        },  # ← Same format as original
        errors={},
    )
    
    json_response = JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
    json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
    return json_response


# ===================================================================
# MODIFIED: GET NUTRITIONAL QUESTIONS (with Academic Year Filter)
# ===================================================================
@router.get("/student/{student_id}/nutritional-questions", response_model=StandardResponse)
async def get_student_nutritional_questions(
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user: Any = Depends(get_current_user)
):
    """
    # Retrieve nutritional questions for a specific student.
    """

    creator_role = (current_user["user_role"])
    allowed_roles = [
        ParentRoles.PARENT, ParentRoles.GUARDIAN, AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR,
        SchoolRoles.SCHOOL_ADMIN, SchoolRoles.TEACHER,
        ScreeningTeamRoles.PHYSICAL_WELLBEING, ScreeningTeamRoles.DENTIST,
        ScreeningTeamRoles.EYE_SPECIALIST, ScreeningTeamRoles.NUTRITIONIST,
        ScreeningTeamRoles.PSYCHOLOGIST,
        AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER
    ]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message="{creator_role} is not allowed to create school records.",
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

    # Verify the student exists
    student = await Students.get_or_none(id=student_id)
    if not student:
        resp = StandardResponse(
            status=False,
            message="Student not found",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Calculate student's age
    if not student.dob:
        resp = StandardResponse(
            status=False,
            message="Something Went Wrong. Please Update Student Date of Birth",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Filter Questions List and Group Based On Age
    questions_list = await Questionnaire.filter(type="nutritional").all()
    for question in questions_list:
        # Check Question Already Exist in Student Records (with academic year filter)
        student_question = await StudentQuestionnaire.filter(
            year_filter,
            student=student,
            question=question.question_id
        ).first()
        
        if student_question:
            pass
        else:
            create_question = StudentQuestionnaire()
            create_question.student = student
            create_question.question = question
            await create_question.save()

    # Apply academic year filter to student questions query
    student_questions_data = await StudentQuestionnaire.filter(
        year_filter,
        student=student,
        question__type="nutritional"
    ).select_related('question').values(
        'sq_id',
        'answer',
        question_id='question__question_id',
        question_text='question__question',
        question_type='question__type',
        question_sub_type='question__sub_type',
        question_group='question__group'
    )

    # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
    resp = StandardResponse(
        status=True,
        message="List of Questions",
        data={
            "questions": student_questions_data,
            "student": {
                "id": student.id,
                "image": student.profile_image,
                "first_name": student.first_name,
                "middle_name": student.middle_name,
                "last_name": student.last_name,
                "gender": student.gender,
                "blood_group": student.blood_group,
                "age": calculate_age_string(student.dob),
                "dob": str(student.dob)
            }
        },  # ← Same format as original
        errors={},
    )
    
    json_response = JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
    json_response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
    return json_response
