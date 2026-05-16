from fastapi import Depends, HTTPException, APIRouter
from fastapi.responses import JSONResponse
from typing import Dict, Set, List
from datetime import datetime
from src.utils.response import StandardResponse
from src.core.manager import get_current_user
from src.models.school_models import Schools, AssignSchool
from src.models.student_models import Students, SchoolStudents, SmartScaleData
from src.models.screening_models import EyeScreening, DentalScreening, NutritionScreening, BehaviouralScreening
from src.models.user_models import SchoolStaff,ScreeningTeam, ScreeningTeamRoles, OnGroundTeam, AnalystTeam, AnalystRoles, OnGroundTeamRoles, AdminTeamRoles, AdminTeam
from fastapi import status
from src.models.other_models import ClinicalRecomendations,ClinicalFindings
from src.models.consultation_models import MedicalScreeningStatus

from . import router

# Map role_type to model (subset relevant to ScreeningTeam)
MODEL_MAP = {
    "SCREENING_TEAM": ScreeningTeam,
    "ON_GROUND_TEAM": OnGroundTeam,
    "ANALYST_TEAM": AnalystTeam,
    "ADMIN_TEAM": AdminTeam,
}

# Map user roles to their specific screening models
ROLE_SCREENING_MAP = {
    ScreeningTeamRoles.PHYSICAL_WELLBEING.value: SmartScaleData,
    ScreeningTeamRoles.PSYCHOLOGIST.value: BehaviouralScreening,
    ScreeningTeamRoles.DENTIST.value: DentalScreening,
    ScreeningTeamRoles.EYE_SPECIALIST.value: EyeScreening,
    ScreeningTeamRoles.NUTRITIONIST.value: NutritionScreening,
    AnalystRoles.NUTRITIONIST.value: NutritionScreening,
    AnalystRoles.PSYCHOLOGIST.value: BehaviouralScreening,
    AnalystRoles.MEDICAL_OFFICER.value: EyeScreening,  # or whatever is relevant

    # OnGround roles
    OnGroundTeamRoles.REGISTRATION_TEAM.value: EyeScreening,  # or SmartScaleData, depending on what they should see
    OnGroundTeamRoles.CAMP_COORDINATOR.value: EyeScreening,  # or another relevant model
}


from tortoise.expressions import Q


# Add these imports at the top
from typing import Optional
from fastapi import Query
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)



# @router.get("/screening-status", response_model=StandardResponse)
# async def get_screening_dashboard(
#     current_user: dict = Depends(get_current_user),
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     )
# ):
#     try:
#         user_id = current_user["user_id"]
#         role_type = current_user["role_type"].upper()

#         model = MODEL_MAP.get(role_type)
#         if not model:
#             return JSONResponse(content=StandardResponse(status=False, message="Invalid role", data={}, errors={}).__dict__, status_code=403)

#         team_member = await model.get_or_none(id=user_id, is_deleted=False)
#         if not team_member:
#             return JSONResponse(content=StandardResponse(status=False, message="User not found", data={}, errors={}).__dict__, status_code=404)

#         # Determine academic year
#         if academic_year is None:
#             academic_year = get_current_academic_year()

#         try:
#             ay_start, ay_end = parse_academic_year(academic_year)
#         except ValueError as e:
#             return JSONResponse(content=StandardResponse(
#                 status=False,
#                 message=str(e),
#                 data={},
#                 errors={"academic_year": str(e)}
#             ).__dict__, status_code=400)

#         # Build academic year filter
#         year_filter = build_academic_year_filter(academic_year)

#         user_role_str = team_member.user_role.value

#         ADMIN_ROLES = ["SUPER_ADMIN", "PROGRAM_COORDINATOR", "HEALTH_BUDDY"]
#         is_admin = user_role_str in ADMIN_ROLES

#         ANALYST_ROLES = ["NUTRITIONIST", "PSYCHOLOGIST", "MEDICAL_OFFICER"]
#         is_analyst = user_role_str in ANALYST_ROLES

#         if is_admin:
#             screening_models = {
#                 "Physical": SmartScaleData,
#                 "Dental": DentalScreening,
#                 "Vision": EyeScreening,
#                 "Nutrition": NutritionScreening,
#                 "Behavioural": BehaviouralScreening,
#             }
#             display_role = {
#                 "SUPER_ADMIN": "Super Admin",
#                 "PROGRAM_COORDINATOR": "Program Coordinator",
#                 "HEALTH_BUDDY": "Health Buddy"
#             }.get(user_role_str, user_role_str.replace("_", " ").title())
#         elif is_analyst:
#             display_role = {
#                 "NUTRITIONIST": "Nutrition Analysis",
#                 "PSYCHOLOGIST": "Behavioural Analysis",
#                 "MEDICAL_OFFICER": "Medical Analysis",
#             }.get(user_role_str, user_role_str.replace("_", " ").title())
#         else:
#             ROLE_SCREENING_MAP = {
#                 "PHYSICAL_WELLBEING": SmartScaleData,
#                 "DENTIST": DentalScreening,
#                 "EYE_SPECIALIST": EyeScreening,
#                 "NUTRITIONIST": NutritionScreening,
#                 "PSYCHOLOGIST": BehaviouralScreening,
#                 "MEDICAL_OFFICER": EyeScreening,
#                 "REGISTRATION_TEAM": SmartScaleData,
#                 "CAMP_COORDINATOR": SmartScaleData,
#             }

#             screening_model = ROLE_SCREENING_MAP.get(user_role_str)
#             if not screening_model:
#                 return JSONResponse(content=StandardResponse(status=False, message="Role not mapped", data={}, errors={}).__dict__, status_code=400)

#             display_role = {
#                 "CAMP_COORDINATOR": "Camp Coordinator",
#                 "REGISTRATION_TEAM": "Registration Team",
#                 "PHYSICAL_WELLBEING": "Physical Wellbeing",
#                 "DENTIST": "Dental",
#                 "EYE_SPECIALIST": "Vision",
#                 "NUTRITIONIST": "Nutrition",
#                 "PSYCHOLOGIST": "Behavioural",
#             }.get(user_role_str, user_role_str.replace("_", " ").title())

#         # Get assignments
#         if user_role_str == "SUPER_ADMIN":
#             user_assignments = await AssignSchool.filter(
#                 year_filter & Q(user_id=user_id, team_type=role_type, is_deleted=False)
#             ).count()
            
#             if user_assignments > 0:
#                 assignments = await AssignSchool.filter(
#                     year_filter & Q(user_id=user_id, team_type=role_type, is_deleted=False)
#                 ).order_by("date")
#             else:
#                 assignments = await AssignSchool.filter(
#                     year_filter & Q(is_deleted=False)
#                 ).order_by("date")
#         else:
#             assignments = await AssignSchool.filter(
#                 year_filter & Q(user_id=user_id, team_type=role_type, is_deleted=False)
#             ).order_by("date")

#         if not assignments:
#             resp = JSONResponse(content=StandardResponse(
#                 status=True,
#                 message="No assignments found for you",
#                 data={"schools": []},
#                 errors={}
#             ).__dict__, status_code=200)
#             resp.headers["X-Academic-Year"] = academic_year
#             return resp

#         from collections import defaultdict
#         school_groups = defaultdict(list)
#         for a in assignments:
#             school_groups[a.school].append(a)

#         school_wise_data = []

#         for school_id, school_assignments in school_groups.items():
#             school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
#             if not school:
#                 continue

#             # Build assigned class sections
#             assigned_class_sections = set()
            
#             for a in school_assignments:
#                 classes = [c.strip() for c in str(a.class_no or "").split(",") if c.strip()]
#                 sections = [s.strip().upper() for s in str(a.section or "").split(",") if s.strip()]
                
#                 if not classes:
#                     all_classes = await Students.filter(
#                         school_students__school=school_id,
#                         is_deleted=False,
#                         class_room__not="",
#                         class_room__not_isnull=True
#                     ).distinct().values_list("class_room", "section", flat=False)
                    
#                     for classroom, section in all_classes:
#                         assigned_class_sections.add((str(classroom), str(section or "")))
#                 else:
#                     for c in classes:
#                         if not sections:
#                             class_sections = await Students.filter(
#                                 school_students__school=school_id,
#                                 class_room=c,
#                                 is_deleted=False
#                             ).distinct().values_list("section", flat=True)
                            
#                             if class_sections:
#                                 for sect in class_sections:
#                                     assigned_class_sections.add((c, str(sect or "")))
#                             else:
#                                 assigned_class_sections.add((c, ""))
#                         else:
#                             for s in sections:
#                                 assigned_class_sections.add((c, s))
            
#             total_classes = len(assigned_class_sections)

#             # ✅ FIX: Calculate total students and collect assigned student IDs
#             total_students = 0
#             assigned_student_ids = []
#             for class_no, section in assigned_class_sections:
#                 section_value = section if section else ""
#                 students = await Students.filter(
#                     school_students__school=school_id,
#                     class_room=class_no,
#                     section=section_value,
#                     is_deleted=False
#                 ).only("id")
#                 student_ids_list = [s.id for s in students]
#                 assigned_student_ids.extend(student_ids_list)
#                 total_students += len(student_ids_list)
            
#             # ✅ FIX: Calculate screened students using DISTINCT student IDs from assigned_student_ids
#             screened_students = 0
            
#             if assigned_student_ids:
#                 if is_admin:
#                     # For admin: student must complete ALL 5 screenings
#                     ss_ids = set(
#                         await SmartScaleData.filter(
#                             year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
#                         ).distinct().values_list("student_id", flat=True)
#                     )
#                     d_ids = set(
#                         await DentalScreening.filter(
#                             year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
#                         ).distinct().values_list("student_id", flat=True)
#                     )
#                     e_ids = set(
#                         await EyeScreening.filter(
#                             year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
#                         ).distinct().values_list("student_id", flat=True)
#                     )
#                     n_ids = set(
#                         await NutritionScreening.filter(
#                             year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
#                         ).distinct().values_list("student_id", flat=True)
#                     )
#                     b_ids = set(
#                         await BehaviouralScreening.filter(
#                             year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
#                         ).distinct().values_list("student_id", flat=True)
#                     )

#                     completed_ids = ss_ids & d_ids & e_ids & n_ids & b_ids
#                     screened_students = len(completed_ids)

#                 elif is_analyst:
#                     if user_role_str == "NUTRITIONIST":
#                         nutrition_ids = set(
#                             await ClinicalRecomendations.filter(
#                                 year_filter & Q(student_id__in=assigned_student_ids, analysis_status=True)
#                             ).distinct().values_list("student_id", flat=True)
#                         )
#                         screened_students = len(nutrition_ids)
                            
#                     elif user_role_str == "PSYCHOLOGIST":
#                         psych_ids = set(
#                             await ClinicalFindings.filter(
#                                 year_filter & Q(student_id__in=assigned_student_ids, analysis_status=True)
#                             ).distinct().values_list("student_id", flat=True)
#                         )
#                         screened_students = len(psych_ids)
                            
#                     elif user_role_str == "MEDICAL_OFFICER":
#                         required_statuses = {
#                             "physical_screening_status",
#                             "lab_report_status",
#                             "dental_screening_status",
#                             "vision_screening_status",
#                             "psychological_report_status",
#                             "nutritional_report_status"
#                         }
                        
#                         med_statuses = await MedicalScreeningStatus.filter(
#                             year_filter & Q(student_id__in=assigned_student_ids, is_deleted=False)
#                         ).all()
                        
#                         med_by_student = {}
#                         for ms in med_statuses:
#                             med_by_student.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = ms.status
                        
#                         completed_ids = set()
#                         for sid in assigned_student_ids:
#                             student_statuses = med_by_student.get(sid, {})
#                             if required_statuses.issubset(student_statuses.keys()) and all(
#                                 student_statuses[status_type] == "verified" for status_type in required_statuses
#                             ):
#                                 completed_ids.add(sid)
                        
#                         screened_students = len(completed_ids)
#                 else:
#                     # Non-admin, non-analyst roles
#                     screened_ids = set(
#                         await screening_model.filter(
#                             year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
#                         ).distinct().values_list("student_id", flat=True)
#                     )
#                     screened_students = len(screened_ids)

#             completion = round((screened_students / total_students * 100), 1) if total_students > 0 else 0.0

#             # Update assignment completion status
#             is_task_complete = (completion == 100.0)
#             assignment_ids = [a.id for a in school_assignments]

#             if assignment_ids:
#                 await AssignSchool.filter(id__in=assignment_ids).update(is_completed=is_task_complete)

#             # Build currently_reporting
#             parts = []
#             temp = defaultdict(set)

#             for c, s in assigned_class_sections:
#                 temp[c].add(s or "")

#             for c in sorted(temp.keys(), key=lambda x: (len(x), x)):
#                 secs = sorted([x for x in temp[c] if x])
#                 if secs:
#                     parts.append(f"Class {c} {', '.join(secs)}")
#                 else:
#                     parts.append(f"Class {c}")

#             currently_reporting = "; ".join(parts) if parts else "Assigned"

#             # Fetch all students in school for screened_classes calculation
#             all_students = await Students.filter(school_students__school=school_id).only("id", "class_room", "section")
#             all_student_ids = [s.id for s in all_students]

#             class_section_students = defaultdict(list)
#             for s in all_students:
#                 key = (str(s.class_room), str(s.section or ""))
#                 class_section_students[key].append(s.id)

#             # Calculate screened_classes
#             screened_classes = 0

#             if is_analyst:
#                 if user_role_str == "NUTRITIONIST":
#                     nutrition_completed = await ClinicalRecomendations.filter(
#                         year_filter & Q(student_id__in=all_student_ids, analysis_status=True)
#                     ).distinct().values_list("student_id", flat=True)
#                     completed_set = set(nutrition_completed)
                    
#                 elif user_role_str == "PSYCHOLOGIST":
#                     psych_completed = await ClinicalFindings.filter(
#                         year_filter & Q(student_id__in=all_student_ids, analysis_status=True)
#                     ).distinct().values_list("student_id", flat=True)
#                     completed_set = set(psych_completed)
                    
#                 elif user_role_str == "MEDICAL_OFFICER":
#                     required_statuses = {
#                         "physical_screening_status",
#                         "lab_report_status",
#                         "dental_screening_status",
#                         "vision_screening_status",
#                         "psychological_report_status",
#                         "nutritional_report_status"
#                     }
                    
#                     med_statuses = await MedicalScreeningStatus.filter(
#                         year_filter & Q(student_id__in=all_student_ids, is_deleted=False)
#                     ).all()
                    
#                     med_by_student = {}
#                     for ms in med_statuses:
#                         med_by_student.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = ms.status
                    
#                     completed_set = set()
#                     for sid in all_student_ids:
#                         student_statuses = med_by_student.get(sid, {})
#                         if required_statuses.issubset(student_statuses.keys()) and all(
#                             student_statuses[status_type] == "verified" for status_type in required_statuses
#                         ):
#                             completed_set.add(sid)
                
#                 for class_no, section in assigned_class_sections:
#                     student_ids_in_cs = class_section_students.get((class_no, section), [])
#                     if not student_ids_in_cs:
#                         continue
                    
#                     if all(sid in completed_set for sid in student_ids_in_cs):
#                         screened_classes += 1
#             else:
#                 ss = await SmartScaleData.filter(year_filter & Q(student_id__in=all_student_ids)).only("student_id", "screening_status")
#                 d = await DentalScreening.filter(year_filter & Q(student_id__in=all_student_ids)).only("student_id", "screening_status")
#                 e = await EyeScreening.filter(year_filter & Q(student_id__in=all_student_ids)).only("student_id", "screening_status")
#                 n = await NutritionScreening.filter(year_filter & Q(student_id__in=all_student_ids)).only("student_id", "screening_status")
#                 b = await BehaviouralScreening.filter(year_filter & Q(student_id__in=all_student_ids)).only("student_id", "screening_status")

#                 ss_lookup = {x.student_id: x.screening_status for x in ss}
#                 d_lookup = {x.student_id: x.screening_status for x in d}
#                 e_lookup = {x.student_id: x.screening_status for x in e}
#                 n_lookup = {x.student_id: x.screening_status for x in n}
#                 b_lookup = {x.student_id: x.screening_status for x in b}

#                 for class_no, section in assigned_class_sections:
#                     student_ids_in_cs = class_section_students.get((class_no, section), [])
#                     if not student_ids_in_cs:
#                         continue

#                     all_done = True
#                     for sid in student_ids_in_cs:
#                         if not (
#                             ss_lookup.get(sid, False) and
#                             d_lookup.get(sid, False) and
#                             e_lookup.get(sid, False) and
#                             n_lookup.get(sid, False) and
#                             b_lookup.get(sid, False)
#                         ):
#                             all_done = False
#                             break
#                     if all_done:
#                         screened_classes += 1

#             if is_admin:
#                 screening_types_fetched = ["Physical", "Dental", "Vision", "Nutrition", "Behavioural"]
#             else:
#                 screening_types_fetched = [display_role]

#             school_data = {
#                 "assignment_id": str(school_assignments[0].id),
#                 "school_id": str(school_id),
#                 "school_name": school.school_name or "Unknown School",
#                 "completed": int(completion),
#                 "screened_classes": screened_classes,
#                 "total_classes": total_classes,
#                 "screened_students": screened_students,
#                 "total_students": total_students,
#                 "currently_reporting": currently_reporting,
#                 "screening_types_fetched": screening_types_fetched
#             }
#             school_wise_data.append(school_data)

#         school_wise_data.sort(key=lambda x: x["school_name"].upper())

#         resp = JSONResponse(content=StandardResponse(
#             status=True,
#             message="Screening dashboard data fetched successfully",
#             data={"schools": school_wise_data},
#             errors={}
#         ).__dict__, status_code=200)
#         resp.headers["X-Academic-Year"] = academic_year
#         return resp

#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         return JSONResponse(content=StandardResponse(
#             status=False,
#             message="Failed to fetch screening dashboard",
#             data={},
#             errors={"detail": str(e)}
#         ).__dict__, status_code=500)

@router.get("/screening-status", response_model=StandardResponse)
async def get_screening_dashboard(
    current_user: dict = Depends(get_current_user),
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    )
):
    try:
        user_id = current_user["user_id"]
        role_type = current_user["role_type"].upper()

        model = MODEL_MAP.get(role_type)
        if not model:
            return JSONResponse(content=StandardResponse(status=False, message="Invalid role", data={}, errors={}).__dict__, status_code=403)

        team_member = await model.get_or_none(id=user_id, is_deleted=False)
        if not team_member:
            return JSONResponse(content=StandardResponse(status=False, message="User not found", data={}, errors={}).__dict__, status_code=404)

        # Determine academic year
        if academic_year is None:
            academic_year = get_current_academic_year()

        try:
            ay_start, ay_end = parse_academic_year(academic_year)
        except ValueError as e:
            return JSONResponse(content=StandardResponse(
                status=False,
                message=str(e),
                data={},
                errors={"academic_year": str(e)}
            ).__dict__, status_code=400)

        # Build academic year filter (for screening records - uses created_at/updated_at)
        year_filter = build_academic_year_filter(academic_year)
        # Separate filter for AssignSchool (uses the assignment's scheduled date field)
        assign_year_filter = build_academic_year_filter(academic_year, created_field="date", updated_field="date")

        user_role_str = team_member.user_role.value

        ADMIN_ROLES = ["SUPER_ADMIN", "PROGRAM_COORDINATOR", "HEALTH_BUDDY"]
        is_admin = user_role_str in ADMIN_ROLES

        # ✅ FIX: Separate screening team and analyst roles
        SCREENING_TEAM_ROLES = ["NUTRITIONIST", "PSYCHOLOGIST", "DENTIST", "EYE_SPECIALIST", "PHYSICAL_WELLBEING"]
        ANALYST_ROLES = ["NUTRITIONIST", "PSYCHOLOGIST", "MEDICAL_OFFICER"]
        
        is_screening_team = (role_type == "SCREENING_TEAM" and user_role_str in SCREENING_TEAM_ROLES)
        is_analyst = (role_type == "ANALYST_TEAM" and user_role_str in ANALYST_ROLES)

        if is_admin:
            screening_models = {
                "Physical": SmartScaleData,
                "Dental": DentalScreening,
                "Vision": EyeScreening,
                "Nutrition": NutritionScreening,
                "Behavioural": BehaviouralScreening,
            }
            display_role = {
                "SUPER_ADMIN": "Super Admin",
                "PROGRAM_COORDINATOR": "Program Coordinator",
                "HEALTH_BUDDY": "Health Buddy"
            }.get(user_role_str, user_role_str.replace("_", " ").title())
        elif is_analyst:
            display_role = {
                "NUTRITIONIST": "Nutrition Analysis",
                "PSYCHOLOGIST": "Behavioural Analysis",
                "MEDICAL_OFFICER": "Medical Analysis",
            }.get(user_role_str, user_role_str.replace("_", " ").title())
        else:
            ROLE_SCREENING_MAP = {
                "PHYSICAL_WELLBEING": SmartScaleData,
                "DENTIST": DentalScreening,
                "EYE_SPECIALIST": EyeScreening,
                "NUTRITIONIST": NutritionScreening,
                "PSYCHOLOGIST": BehaviouralScreening,
                "REGISTRATION_TEAM": SmartScaleData,
                "CAMP_COORDINATOR": SmartScaleData,
            }

            screening_model = ROLE_SCREENING_MAP.get(user_role_str)
            if not screening_model:
                return JSONResponse(content=StandardResponse(status=False, message="Role not mapped", data={}, errors={}).__dict__, status_code=400)

            display_role = {
                "CAMP_COORDINATOR": "Camp Coordinator",
                "REGISTRATION_TEAM": "Registration Team",
                "PHYSICAL_WELLBEING": "Physical Wellbeing",
                "DENTIST": "Dental",
                "EYE_SPECIALIST": "Vision",
                "NUTRITIONIST": "Nutrition",
                "PSYCHOLOGIST": "Behavioural",
            }.get(user_role_str, user_role_str.replace("_", " ").title())

        # Get assignments
        if user_role_str == "SUPER_ADMIN":
            user_assignments = await AssignSchool.filter(
                assign_year_filter & Q(user_id=user_id, team_type=role_type, is_deleted=False)
            ).count()

            if user_assignments > 0:
                assignments = await AssignSchool.filter(
                    assign_year_filter & Q(user_id=user_id, team_type=role_type, is_deleted=False)
                ).order_by("date")
            else:
                assignments = await AssignSchool.filter(
                    assign_year_filter & Q(is_deleted=False)
                ).order_by("date")

                if not assignments:
                    # Academic year just rolled over — fall back to all assignments
                    assignments = await AssignSchool.filter(
                        Q(is_deleted=False)
                    ).order_by("-date")
        else:
            assignments = await AssignSchool.filter(
                assign_year_filter & Q(user_id=user_id, team_type=role_type, is_deleted=False)
            ).order_by("date")

            if not assignments:
                # Fall back to all assignments for this user when current year has no data yet
                assignments = await AssignSchool.filter(
                    Q(user_id=user_id, team_type=role_type, is_deleted=False)
                ).order_by("-date")

        if not assignments:
            resp = JSONResponse(content=StandardResponse(
                status=True,
                message="No assignments found for you",
                data={"schools": []},
                errors={}
            ).__dict__, status_code=200)
            resp.headers["X-Academic-Year"] = academic_year
            return resp

        from collections import defaultdict
        school_groups = defaultdict(list)
        for a in assignments:
            school_groups[a.school].append(a)

        school_wise_data = []

        for school_id, school_assignments in school_groups.items():
            school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
            if not school:
                continue

            # Build assigned class sections
            assigned_class_sections = set()
            
            for a in school_assignments:
                classes = [c.strip() for c in str(a.class_no or "").split(",") if c.strip()]
                sections = [s.strip().upper() for s in str(a.section or "").split(",") if s.strip()]
                
                if not classes:
                    all_classes = await Students.filter(
                        school_students__school=school_id,
                        is_deleted=False,
                        class_room__not="",
                        class_room__not_isnull=True
                    ).distinct().values_list("class_room", "section", flat=False)
                    
                    for classroom, section in all_classes:
                        assigned_class_sections.add((str(classroom), str(section or "")))
                else:
                    for c in classes:
                        if not sections:
                            class_sections = await Students.filter(
                                school_students__school=school_id,
                                class_room=c,
                                is_deleted=False
                            ).distinct().values_list("section", flat=True)
                            
                            if class_sections:
                                for sect in class_sections:
                                    assigned_class_sections.add((c, str(sect or "")))
                            else:
                                assigned_class_sections.add((c, ""))
                        else:
                            for s in sections:
                                assigned_class_sections.add((c, s))
            
            total_classes = len(assigned_class_sections)

            # Calculate total students and collect assigned student IDs
            total_students = 0
            assigned_student_ids = []
            for class_no, section in assigned_class_sections:
                section_value = section if section else ""
                students = await Students.filter(
                    school_students__school=school_id,
                    class_room=class_no,
                    section=section_value,
                    is_deleted=False
                ).only("id")
                student_ids_list = [s.id for s in students]
                assigned_student_ids.extend(student_ids_list)
                total_students += len(student_ids_list)
            
            # ✅ FIX: Calculate screened students based on role type
            screened_students = 0
            
            if assigned_student_ids:
                if is_admin:
                    # For admin: student must complete ALL 5 screenings
                    ss_ids = set(
                        await SmartScaleData.filter(
                            year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
                        ).distinct().values_list("student_id", flat=True)
                    )
                    d_ids = set(
                        await DentalScreening.filter(
                            year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
                        ).distinct().values_list("student_id", flat=True)
                    )
                    e_ids = set(
                        await EyeScreening.filter(
                            year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
                        ).distinct().values_list("student_id", flat=True)
                    )
                    n_ids = set(
                        await NutritionScreening.filter(
                            year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
                        ).distinct().values_list("student_id", flat=True)
                    )
                    b_ids = set(
                        await BehaviouralScreening.filter(
                            year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
                        ).distinct().values_list("student_id", flat=True)
                    )

                    completed_ids = ss_ids & d_ids & e_ids & n_ids & b_ids
                    screened_students = len(completed_ids)

                elif is_analyst:
                    # ✅ FIX: For ANALYST_TEAM, check analysis_status
                    if user_role_str == "NUTRITIONIST":
                        nutrition_ids = set(
                            await ClinicalRecomendations.filter(
                                year_filter & Q(student_id__in=assigned_student_ids, analysis_status=True)
                            ).distinct().values_list("student_id", flat=True)
                        )
                        screened_students = len(nutrition_ids)
                            
                    elif user_role_str == "PSYCHOLOGIST":
                        psych_ids = set(
                            await ClinicalFindings.filter(
                                year_filter & Q(student_id__in=assigned_student_ids, analysis_status=True)
                            ).distinct().values_list("student_id", flat=True)
                        )
                        screened_students = len(psych_ids)
                            
                    elif user_role_str == "MEDICAL_OFFICER":
                        required_statuses = {
                            "physical_screening_status",
                            "lab_report_status",
                            "dental_screening_status",
                            "vision_screening_status",
                            "psychological_report_status",
                            "nutritional_report_status"
                        }
                        
                        med_statuses = await MedicalScreeningStatus.filter(
                            year_filter & Q(student_id__in=assigned_student_ids, is_deleted=False)
                        ).all()
                        
                        med_by_student = {}
                        for ms in med_statuses:
                            med_by_student.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = ms.status
                        
                        completed_ids = set()
                        for sid in assigned_student_ids:
                            student_statuses = med_by_student.get(sid, {})
                            if required_statuses.issubset(student_statuses.keys()) and all(
                                student_statuses[status_type] == "verified" for status_type in required_statuses
                            ):
                                completed_ids.add(sid)
                        
                        screened_students = len(completed_ids)
                        
                elif is_screening_team:
                    # ✅ FIX: For SCREENING_TEAM, check screening_status in respective screening table
                    if user_role_str == "NUTRITIONIST":
                        screened_ids = set(
                            await NutritionScreening.filter(
                                year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
                            ).distinct().values_list("student_id", flat=True)
                        )
                        screened_students = len(screened_ids)
                        
                    elif user_role_str == "PSYCHOLOGIST":
                        screened_ids = set(
                            await BehaviouralScreening.filter(
                                year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
                            ).distinct().values_list("student_id", flat=True)
                        )
                        screened_students = len(screened_ids)
                        
                    elif user_role_str == "DENTIST":
                        screened_ids = set(
                            await DentalScreening.filter(
                                year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
                            ).distinct().values_list("student_id", flat=True)
                        )
                        screened_students = len(screened_ids)
                        
                    elif user_role_str == "EYE_SPECIALIST":
                        screened_ids = set(
                            await EyeScreening.filter(
                                year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
                            ).distinct().values_list("student_id", flat=True)
                        )
                        screened_students = len(screened_ids)
                        
                    elif user_role_str == "PHYSICAL_WELLBEING":
                        screened_ids = set(
                            await SmartScaleData.filter(
                                year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
                            ).distinct().values_list("student_id", flat=True)
                        )
                        screened_students = len(screened_ids)
                else:
                    # Other roles (REGISTRATION_TEAM, CAMP_COORDINATOR, etc.)
                    screened_ids = set(
                        await screening_model.filter(
                            year_filter & Q(student_id__in=assigned_student_ids, screening_status=True)
                        ).distinct().values_list("student_id", flat=True)
                    )
                    screened_students = len(screened_ids)

            completion = round((screened_students / total_students * 100), 1) if total_students > 0 else 0.0

            # Update assignment completion status
            is_task_complete = (completion == 100.0)
            assignment_ids = [a.id for a in school_assignments]

            if assignment_ids:
                await AssignSchool.filter(id__in=assignment_ids).update(is_completed=is_task_complete)

            # Build currently_reporting
            parts = []
            temp = defaultdict(set)

            for c, s in assigned_class_sections:
                temp[c].add(s or "")

            # for c in sorted(temp.keys(), key=lambda x: (len(x), x)):
            #     secs = sorted([x for x in temp[c] if x])
            #     if secs:
            #         parts.append(f"Class {c} {', '.join(secs)}")
            #     else:
            #         parts.append(f"Class {c}")
            
            for c in sorted(temp.keys(), key=lambda x: (len(x), x)):
                secs = sorted([x for x in temp[c] if x])
                if secs:
                    parts.append(f"{c} {', '.join(secs)}")
                else:
                    parts.append(f"{c}")

            # Join the parts first, then add "Class" prefix
            currently_reporting = f"Class {'; '.join(parts)}" if parts else "Assigned"


            # currently_reporting = "; ".join(parts) if parts else "Assigned"

            # Fetch all students in school for screened_classes calculation
            all_students = await Students.filter(school_students__school=school_id).only("id", "class_room", "section")
            all_student_ids = [s.id for s in all_students]

            class_section_students = defaultdict(list)
            for s in all_students:
                key = (str(s.class_room), str(s.section or ""))
                class_section_students[key].append(s.id)

            # Calculate screened_classes
            screened_classes = 0

            if is_analyst:
                if user_role_str == "NUTRITIONIST":
                    nutrition_completed = await ClinicalRecomendations.filter(
                        year_filter & Q(student_id__in=all_student_ids, analysis_status=True)
                    ).distinct().values_list("student_id", flat=True)
                    completed_set = set(nutrition_completed)
                    
                elif user_role_str == "PSYCHOLOGIST":
                    psych_completed = await ClinicalFindings.filter(
                        year_filter & Q(student_id__in=all_student_ids, analysis_status=True)
                    ).distinct().values_list("student_id", flat=True)
                    completed_set = set(psych_completed)
                    
                elif user_role_str == "MEDICAL_OFFICER":
                    required_statuses = {
                        "physical_screening_status",
                        "lab_report_status",
                        "dental_screening_status",
                        "vision_screening_status",
                        "psychological_report_status",
                        "nutritional_report_status"
                    }
                    
                    med_statuses = await MedicalScreeningStatus.filter(
                        year_filter & Q(student_id__in=all_student_ids, is_deleted=False)
                    ).all()
                    
                    med_by_student = {}
                    for ms in med_statuses:
                        med_by_student.setdefault(ms.student_id, {})[ms.medical_officer_status_type] = ms.status
                    
                    completed_set = set()
                    for sid in all_student_ids:
                        student_statuses = med_by_student.get(sid, {})
                        if required_statuses.issubset(student_statuses.keys()) and all(
                            student_statuses[status_type] == "verified" for status_type in required_statuses
                        ):
                            completed_set.add(sid)
                
                for class_no, section in assigned_class_sections:
                    student_ids_in_cs = class_section_students.get((class_no, section), [])
                    if not student_ids_in_cs:
                        continue
                    
                    if all(sid in completed_set for sid in student_ids_in_cs):
                        screened_classes += 1
                        
            elif is_screening_team:
                # ✅ FIX: For screening team, check only their specific screening type
                if user_role_str == "NUTRITIONIST":
                    screening_data = await NutritionScreening.filter(
                        year_filter & Q(student_id__in=all_student_ids)
                    ).only("student_id", "screening_status")
                elif user_role_str == "PSYCHOLOGIST":
                    screening_data = await BehaviouralScreening.filter(
                        year_filter & Q(student_id__in=all_student_ids)
                    ).only("student_id", "screening_status")
                elif user_role_str == "DENTIST":
                    screening_data = await DentalScreening.filter(
                        year_filter & Q(student_id__in=all_student_ids)
                    ).only("student_id", "screening_status")
                elif user_role_str == "EYE_SPECIALIST":
                    screening_data = await EyeScreening.filter(
                        year_filter & Q(student_id__in=all_student_ids)
                    ).only("student_id", "screening_status")
                elif user_role_str == "PHYSICAL_WELLBEING":
                    screening_data = await SmartScaleData.filter(
                        year_filter & Q(student_id__in=all_student_ids)
                    ).only("student_id", "screening_status")
                else:
                    screening_data = []
                
                screening_lookup = {x.student_id: x.screening_status for x in screening_data}
                
                for class_no, section in assigned_class_sections:
                    student_ids_in_cs = class_section_students.get((class_no, section), [])
                    if not student_ids_in_cs:
                        continue
                    
                    if all(screening_lookup.get(sid, False) for sid in student_ids_in_cs):
                        screened_classes += 1
            else:
                ss = await SmartScaleData.filter(year_filter & Q(student_id__in=all_student_ids)).only("student_id", "screening_status")
                d = await DentalScreening.filter(year_filter & Q(student_id__in=all_student_ids)).only("student_id", "screening_status")
                e = await EyeScreening.filter(year_filter & Q(student_id__in=all_student_ids)).only("student_id", "screening_status")
                n = await NutritionScreening.filter(year_filter & Q(student_id__in=all_student_ids)).only("student_id", "screening_status")
                b = await BehaviouralScreening.filter(year_filter & Q(student_id__in=all_student_ids)).only("student_id", "screening_status")

                ss_lookup = {x.student_id: x.screening_status for x in ss}
                d_lookup = {x.student_id: x.screening_status for x in d}
                e_lookup = {x.student_id: x.screening_status for x in e}
                n_lookup = {x.student_id: x.screening_status for x in n}
                b_lookup = {x.student_id: x.screening_status for x in b}

                for class_no, section in assigned_class_sections:
                    student_ids_in_cs = class_section_students.get((class_no, section), [])
                    if not student_ids_in_cs:
                        continue

                    all_done = True
                    for sid in student_ids_in_cs:
                        if not (
                            ss_lookup.get(sid, False) and
                            d_lookup.get(sid, False) and
                            e_lookup.get(sid, False) and
                            n_lookup.get(sid, False) and
                            b_lookup.get(sid, False)
                        ):
                            all_done = False
                            break
                    if all_done:
                        screened_classes += 1

            if is_admin:
                screening_types_fetched = ["Physical", "Dental", "Vision", "Nutrition", "Behavioural"]
            else:
                screening_types_fetched = [display_role]
            name_of_school = school.school_name or "Unknown School"
            school_class_currently_reporting = f"{name_of_school} : {currently_reporting}"

            school_data = {
                "assignment_id": str(school_assignments[0].id),
                "school_id": str(school_id),
                "school_name": school.school_name or "Unknown School",
                "completed": int(completion),
                "screened_classes": screened_classes,
                "total_classes": total_classes,
                "screened_students": screened_students,
                "total_students": total_students,
                # "currently_reporting": currently_reporting,
                "currently_reporting": school_class_currently_reporting,
                "screening_types_fetched": screening_types_fetched
            }
            school_wise_data.append(school_data)

        school_wise_data.sort(key=lambda x: x["school_name"].upper())

        resp = JSONResponse(content=StandardResponse(
            status=True,
            message="Screening dashboard data fetched successfully",
            data={"schools": school_wise_data},
            errors={}
        ).__dict__, status_code=200)
        resp.headers["X-Academic-Year"] = academic_year
        return resp

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(content=StandardResponse(
            status=False,
            message="Failed to fetch screening dashboard",
            data={},
            errors={"detail": str(e)}
        ).__dict__, status_code=500)

