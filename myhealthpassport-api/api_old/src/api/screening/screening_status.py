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


# @router.get("/screening-status", response_model=StandardResponse)
# async def get_screening_dashboard(current_user: dict = Depends(get_current_user)):
#     try:
#         # Validate current_user structure
#         if not isinstance(current_user, dict) or "user_id" not in current_user or "role_type" not in current_user:
#             raise ValueError("Invalid user data from authentication")

#         # Extract user details
#         user_id = current_user["user_id"]
#         role_type = current_user["role_type"].upper()

#         # Validate role_type and get model
#         model = MODEL_MAP.get(role_type)
#         if not model or role_type not in MODEL_MAP:
#             return JSONResponse(content=StandardResponse(
#                 status=False,
#                 message=f"Invalid role type: {role_type} or not authorized for screening dashboard",
#                 data={},
#                 errors={}
#             ).__dict__, status_code=status.HTTP_403_FORBIDDEN)

#         # Fetch screening team member
#         screening_team_member = await model.filter(id=user_id).first()
#         if not screening_team_member:
#             return JSONResponse(content=StandardResponse(
#                 status=False,
#                 message=f"Screening team member with ID {user_id} not found.",
#                 data={},
#                 errors={}
#             ).__dict__, status_code=status.HTTP_404_NOT_FOUND)

#         # Get all assignments for the screening user
#         assignments = await AssignSchool.filter(user_id=user_id, team_type=role_type).all()
#         if not assignments:
#             return JSONResponse(content=StandardResponse(
#                 status=False,
#                 message=f"No school assigned to user with ID {user_id}.",
#                 data={},
#                 errors={}
#             ).__dict__, status_code=status.HTTP_404_NOT_FOUND)

#         # Initialize response data
#         school_wise_data = []
#         user_role = getattr(screening_team_member, "user_role", None)
#         screening_model = None
#         if user_role:
#             screening_model = ROLE_SCREENING_MAP.get(user_role.value)

#         if not screening_model:
#             return JSONResponse(content=StandardResponse(
#                 status=False,
#                 message=f"No screening type mapped for role: {user_role}",
#                 data={},
#                 errors={}
#             ).__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#         # Group assignments by school
#         school_ids = set(assignment.school for assignment in assignments)
#         for school_id in school_ids:
#             school = await Schools.get_or_none(school_id=school_id)
#             if not school:
#                 continue  # Skip if school not found

#             # Get all students in the current school
#             all_students = await Students.filter(school_students__school=school_id).prefetch_related(
#                 "eye_screenings", "dental_screenings", "nutrition_screenings", "behavioural_screenings", "student_smarts"
#             )

#             # Calculate completed screenings
#             screened_student_ids: Set[int] = set()
#             if screening_model:
#                 for student in all_students:
#                     if await screening_model.filter(student=student, screening_status=True).exists():
#                         screened_student_ids.add(student.id)


#             total_students = len(all_students)
#             screened_students = len(screened_student_ids)
#             completion_percentage = (screened_students / total_students * 100) if total_students > 0 else 0

#             # Calculate fully completed classes
#             school_assignments = [a for a in assignments if a.school == school_id]
#             total_classes = len(set(a.class_no for a in school_assignments if a.class_no is not None))
#             fully_completed_classes = 0
#             for class_no in set(a.class_no for a in school_assignments if a.class_no is not None):
#                 class_students = await Students.filter(school_students__school=school_id, class_room=class_no).count()
#                 screened_class_students = len([s.id for s in all_students if s.class_room == class_no and s.id in screened_student_ids])
#                 if class_students > 0 and screened_class_students == class_students:
#                     fully_completed_classes += 1

#             # Determine currently reporting class (using the first assignment's class_no for this school)
#             school_assignment = school_assignments[0]
#             currently_reporting_class = f"Class {school_assignment.class_no}{school_assignment.section}" if school_assignment.class_no else "Not assigned"

#             # Prepare screening_types_fetched as a list
#             screening_types_fetched = []
#             if user_role:
#                 screening_types_fetched = [user_role.lower().replace("_", "")]

#             assignment_id = str(school_assignments[0].id) if school_assignments else ""

#             school_data = {
#                 "assignment_id": assignment_id,
#                 "school_id": str(school_id),
#                 "school_name": school.school_name if hasattr(school, 'school_name') else "",
#                 "completed": f"{int(completion_percentage)}",
#                 "screened_classes": str(fully_completed_classes),
#                 "total_classes": str(total_classes),
#                 "screened_students": str(screened_students),
#                 "total_students": str(total_students),
#                 "currently_reporting": currently_reporting_class,
#                 "screening_types_fetched": screening_types_fetched
#             }
#             school_wise_data.append(school_data)

#         return JSONResponse(content=StandardResponse(
#             status=True,
#             message="Screening dashboard data fetched successfully",
#             data={"schools": school_wise_data},
#             errors={}
#         ).__dict__, status_code=status.HTTP_200_OK)

#     except KeyError as e:
#         return JSONResponse(content=StandardResponse(
#             status=False,
#             message="Failed to fetch screening dashboard",
#             data={},
#             errors={"detail": f"Missing key in current_user: {str(e)}"}
#         ).__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
#     except Exception as e:
#         return JSONResponse(content=StandardResponse(
#             status=False,
#             message="Failed to fetch screening dashboard",
#             data={},
#             errors={"detail": str(e)}
#         ).__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
from tortoise.expressions import Q

@router.get("/screening-status", response_model=StandardResponse)
async def get_screening_dashboard(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["user_id"]
        role_type = current_user["role_type"].upper()

        model = MODEL_MAP.get(role_type)
        if not model:
            return JSONResponse(content=StandardResponse(status=False, message="Invalid role", data={}, errors={}).__dict__, status_code=403)

        team_member = await model.get_or_none(id=user_id, is_deleted=False)
        if not team_member:
            return JSONResponse(content=StandardResponse(status=False, message="User not found", data={}, errors={}).__dict__, status_code=404)

        user_role_str = team_member.user_role.value

        ROLE_SCREENING_MAP = {
            "PHYSICAL_WELLBEING": SmartScaleData,
            "DENTIST": DentalScreening,
            "EYE_SPECIALIST": EyeScreening,
            "NUTRITIONIST": NutritionScreening,
            "PSYCHOLOGIST": BehaviouralScreening,
            "MEDICAL_OFFICER": EyeScreening,
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

        assignments = await AssignSchool.filter(
            user_id=user_id,
            team_type=role_type,
            is_deleted=False
        ).order_by("date")

        if not assignments:
            return JSONResponse(content=StandardResponse(
                status=True,
                message="No assignments",
                data={"schools": []},
                errors={}
            ).__dict__, status_code=200)

        from collections import defaultdict
        school_groups = defaultdict(list)
        for a in assignments:
            school_groups[a.school].append(a)

        school_wise_data = []

        for school_id, school_assignments in school_groups.items():
            school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
            if not school:
                continue

            total_students = await Students.filter(school_students__school=school_id).count()
            screened_students = await screening_model.filter(
                student__school_students__school=school_id,
                screening_status=True
            ).count()

            completion = round((screened_students / total_students * 100), 1) if total_students > 0 else 0

            # ============================================================
            # NEW LOGIC: Update AssignSchool based on completion
            # ============================================================
            
            # Determine if task is complete (True if 100%, False otherwise)
            # This logic also handles the case where data changes and it drops below 100%
            is_task_complete = (completion == 100.0)

            # Get IDs of the assignments for this specific loop iteration
            assignment_ids = [a.id for a in school_assignments]

            # Perform Bulk Update
            if assignment_ids:
                await AssignSchool.filter(id__in=assignment_ids).update(is_completed=is_task_complete)
            
            # ============================================================
            # END NEW LOGIC
            # ============================================================

            # === Build list of assigned (class, section) pairs ===
            assigned_class_sections = set()
            for a in school_assignments:
                classes = [c.strip() for c in str(a.class_no or "").split(",") if c.strip()]
                sections = [s.strip().upper() for s in str(a.section or "").split(",") if s.strip()] or [""]
                for c in classes:
                    for s in sections:
                        assigned_class_sections.add((c, s))

            # ... [Rest of your existing code for reporting string and screened classes] ...
            
            # (Keeping the rest of your logic intact below for context)
            actual_class_sections = await SchoolStaff.filter(
                school_id=school_id,
                is_deleted=False,
                class_room__not="",
                class_room__not_isnull=True
            ).values_list("class_room", "section", flat=False)

            real_cs = {(c, s or "") for c, s in actual_class_sections}
            is_all_assigned = len(real_cs) > 0 and real_cs.issubset(assigned_class_sections)

            if is_all_assigned:
                currently_reporting = "Assigned"
            else:
                parts = []
                temp = defaultdict(set)
                for c, s in assigned_class_sections:
                    temp[c].add(s or "")
                for c in sorted(temp.keys(), key=lambda x: (len(x), x)):
                    secs = sorted([x for x in temp[c] if x])
                    if secs:
                        parts.append(f"Class {c} {', '.join(secs)}")
                    else:
                        parts.append(f"Class {c}")
                currently_reporting = "; ".join(parts) if parts else "Assigned"

            total_classes = len(assigned_class_sections)

            # === Logic for screened_classes count ===
            all_students = await Students.filter(school_students__school=school_id).only("id", "class_room", "section")
            student_ids = [s.id for s in all_students]

            ss = await SmartScaleData.filter(student_id__in=student_ids).only("student_id", "screening_status")
            d = await DentalScreening.filter(student_id__in=student_ids).only("student_id", "screening_status")
            e = await EyeScreening.filter(student_id__in=student_ids).only("student_id", "screening_status")
            n = await NutritionScreening.filter(student_id__in=student_ids).only("student_id", "screening_status")
            b = await BehaviouralScreening.filter(student_id__in=student_ids).only("student_id", "screening_status")

            ss_lookup = {x.student_id: x.screening_status for x in ss}
            d_lookup = {x.student_id: x.screening_status for x in d}
            e_lookup = {x.student_id: x.screening_status for x in e}
            n_lookup = {x.student_id: x.screening_status for x in n}
            b_lookup = {x.student_id: x.screening_status for x in b}

            class_section_students = defaultdict(list)
            for s in all_students:
                key = (s.class_room, s.section or "")
                class_section_students[key].append(s.id)

            screened_classes = 0
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

            school_data = {
                "assignment_id": str(school_assignments[0].id),
                "school_id": str(school_id),
                "school_name": school.school_name or "Unknown School",
                "completed": int(completion),
                "screened_classes": screened_classes,
                "total_classes": total_classes,
                "screened_students": screened_students,
                "total_students": total_students,
                "currently_reporting": currently_reporting,
                "screening_types_fetched": [display_role]
            }
            school_wise_data.append(school_data)

        school_wise_data.sort(key=lambda x: x["school_name"].upper())

        return JSONResponse(content=StandardResponse(
            status=True,
            message="Screening dashboard data fetched successfully",
            data={"schools": school_wise_data},
            errors={}
        ).__dict__, status_code=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(content=StandardResponse(
            status=False,
            message="Failed to fetch screening dashboard",
            data={},
            errors={"detail": str(e)}
        ).__dict__, status_code=500)                     
# @router.get("/screening-status", response_model=StandardResponse)
# async def get_screening_dashboard(current_user: dict = Depends(get_current_user)):
#     try:
#         user_id = current_user["user_id"]
#         role_type = current_user["role_type"].upper()

#         model = MODEL_MAP.get(role_type)
#         if not model:
#             return JSONResponse(content=StandardResponse(status=False, message="Invalid role", data={}, errors={}).__dict__, status_code=403)

#         team_member = await model.get_or_none(id=user_id)
#         if not team_member:
#             return JSONResponse(content=StandardResponse(status=False, message="User not found", data={}, errors={}).__dict__, status_code=404)

#         user_role_str = team_member.user_role.value

#         ROLE_SCREENING_MAP = {
#             "PHYSICAL_WELLBEING": SmartScaleData,
#             "DENTIST": DentalScreening,
#             "EYE_SPECIALIST": EyeScreening,
#             "NUTRITIONIST": NutritionScreening,
#             "PSYCHOLOGIST": BehaviouralScreening,
#             "MEDICAL_OFFICER": EyeScreening,
#             "REGISTRATION_TEAM": SmartScaleData,
#             "CAMP_COORDINATOR": SmartScaleData,
#         }

#         screening_model = ROLE_SCREENING_MAP.get(user_role_str)
#         if not screening_model:
#             return JSONResponse(content=StandardResponse(status=False, message="Role not mapped", data={}, errors={}).__dict__, status_code=400)

#         display_role = {
#             "CAMP_COORDINATOR": "Camp Coordinator",
#             "REGISTRATION_TEAM": "Registration Team",
#             "PHYSICAL_WELLBEING": "Physical Wellbeing",
#             "DENTIST": "Dental",
#             "EYE_SPECIALIST": "Vision",
#             "NUTRITIONIST": "Nutrition",
#             "PSYCHOLOGIST": "Behavioural",
#         }.get(user_role_str, user_role_str.replace("_", " ").title())

#         assignments = await AssignSchool.filter(user_id=user_id, team_type=role_type, is_deleted=False).all()
#         if not assignments:
#             return JSONResponse(content=StandardResponse(status=False, message="No assignments", data={}, errors={}).__dict__, status_code=404)

#         from collections import defaultdict
#         school_groups = defaultdict(list)
#         for a in assignments:
#             school_groups[a.school].append(a)

#         school_wise_data = []

#         for school_id, school_assignments in school_groups.items():
#             school = await Schools.get_or_none(school_id=school_id)
#             if not school:
#                 continue

#             # Total & screened students
#             total_students = await Students.filter(school_students__school=school_id).count()
#             screened_students = await screening_model.filter(
#                 student__school_students__school=school_id,
#                 screening_status=True
#             ).count()

#             completion = round((screened_students / total_students * 100), 1) if total_students > 0 else 0

#             # Smart class grouping – handles "1,2" in class_no and "A,B,C" in section
#             class_groups = defaultdict(set)  # {"1": {"A","B"}, "2": {"A"} }

#             for a in school_assignments:
#                 if not a.class_no:
#                     continue
#                 class_numbers = [c.strip() for c in str(a.class_no).split(",") if c.strip()]
#                 sections = [s.strip().upper() for s in str(a.section or "").split(",") if s.strip()]

#                 for cn in class_numbers:
#                     if sections:
#                         class_groups[cn].update(sections)
#                     else:
#                         class_groups[cn].add("")  # no section

#             # Build clean display string
#             display_parts = []
#             for class_no in sorted(class_groups.keys(), key=lambda x: (len(x), x)):
#                 secs = sorted([s for s in class_groups[class_no] if s])
#                 if not secs:
#                     display_parts.append(f"Class {class_no}")
#                 else:
#                     sec_str = ", ".join(secs)
#                     display_parts.append(f"Class {class_no} {sec_str}")

#             currently_reporting = "; ".join(display_parts) if display_parts else "assigned"
#             total_classes = len(class_groups)

#             # Count fully completed classes – SAFE FILTERING
#             fully_completed = 0
#             for class_no, sections in class_groups.items():
#                 for sec in (sections or [""]):
#                     # Build filter safely using Q
#                     student_filter = Q(school_students__school=school_id, class_room=class_no)
#                     if sec:
#                         student_filter &= Q(section=sec)
#                     else:
#                         student_filter &= (Q(section="") | Q(section__isnull=True))

#                     total_in_class = await Students.filter(student_filter).count()

#                     screening_filter = Q(student__school_students__school=school_id,
#                                          student__class_room=class_no,
#                                          screening_status=True)
#                     if sec:
#                         screening_filter &= Q(student__section=sec)
#                     else:
#                         screening_filter &= (Q(student__section="") | Q(student__section__isnull=True))

#                     screened_in_class = await screening_model.filter(screening_filter).count()

#                     if total_in_class > 0 and screened_in_class == total_in_class:
#                         fully_completed += 1

#             school_data = {
#                 "assignment_id": str(school_assignments[0].id),
#                 "school_id": str(school_id),
#                 "school_name": school.school_name or "Unknown School",
#                 "completed": int(completion),
#                 "screened_classes": fully_completed,
#                 "total_classes": total_classes,
#                 "screened_students": screened_students,
#                 "total_students": total_students,
#                 "currently_reporting": currently_reporting,
#                 "screening_types_fetched": [display_role]
#             }
#             school_wise_data.append(school_data)

#         school_wise_data.sort(key=lambda x: x["school_name"].upper())

#         return JSONResponse(content=StandardResponse(
#             status=True,
#             message="Screening dashboard data fetched successfully",
#             data={"schools": school_wise_data},
#             errors={}
#         ).__dict__, status_code=200)

#     except Exception as e:
#         return JSONResponse(content=StandardResponse(
#             status=False,
#             message="Failed to fetch screening dashboard",
#             data={},
#             errors={"detail": str(e)}
#         ).__dict__, status_code=500)
        