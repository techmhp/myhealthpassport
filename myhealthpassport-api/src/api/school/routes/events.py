# from fastapi import APIRouter, Depends, status
# from fastapi.responses import JSONResponse
# from datetime import datetime
# import pytz
# from collections import defaultdict

# from src.models.school_models import AssignSchool, Schools
# from src.models.user_models import (SchoolRoles, SchoolStaff, OnGroundTeam, ScreeningTeam,
#     AnalystTeam, AdminTeam, ConsultantTeam)
# from src.core.manager import get_current_user
# from src.utils.response import StandardResponse

# # Unified user fetcher
# async def get_user_by_user_id_and_role(user_id: int, role_type: str):
#     model_map = {
#         "SCHOOL_STAFF": SchoolStaff,
#         "ON_GROUND_TEAM": OnGroundTeam,
#         "SCREENING_TEAM": ScreeningTeam,
#         "ANALYST_TEAM": AnalystTeam,
#         "ADMIN_TEAM": AdminTeam,
#         "CONSULTANT_TEAM": ConsultantTeam
#     }
#     model = model_map.get(role_type)
#     if not model:
#         return None
#     return await model.get_or_none(id=user_id)


# from .. import router

# # ✅ Helper: Fetch user details by user_id
# async def get_user_by_user_id(user_id: int):
#     user_models = [SchoolStaff, OnGroundTeam, ScreeningTeam, AnalystTeam, AdminTeam, ConsultantTeam]
    
#     for model in user_models:
#         user = await model.get_or_none(id=user_id)
#         if user:
#             return user
#     return None

# @router.get("/events", response_model=StandardResponse)
# async def get_school_admin_events(current_user=Depends(get_current_user)):
#     try:
#         # ✅ Only school admins allowed
#         if current_user["user_role"] != SchoolRoles.SCHOOL_ADMIN:
#             return JSONResponse(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 content=StandardResponse(
#                     status=False,
#                     message="Only school admins can access this endpoint.",
#                     data={},
#                     errors={},
#                 ).__dict__,
#             )

#         utc = pytz.UTC
#         today = datetime.now(utc).date()

#         assigned_school_ids = [current_user["school_id"]] if current_user["school_id"] else []

#         if not assigned_school_ids:
#             return JSONResponse(
#                 status_code=status.HTTP_200_OK,
#                 content=StandardResponse(
#                     status=True,
#                     message="No schools assigned to this admin.",
#                     data={"today_events": [], "upcoming_events": {}},
#                     errors={}
#                 ).__dict__,
#             )

#         # ✅ Fetch all assignments/events for these schools
#         all_assignments = await AssignSchool.filter(
#             school__in=assigned_school_ids
#         ).order_by("from_time")

#         today_events = []
#         upcoming_events = defaultdict(list)

#         for assignment in all_assignments:
#             if assignment.from_time is None:
#                 continue

#             event_date = assignment.from_time.date()
#             school = await Schools.get_or_none(school_id=assignment.school)

#             # ✅ Fetch user details using user_id
#             assigned_user = await get_user_by_user_id(assignment.user_id)

#             event = {
#                 "assignment_id": assignment.id,
#                 "school_id": assignment.school,
#                 "user_id": assignment.user_id,  # Assigned to which user
#                 "school_name": school.school_name if school else "",
#                 "class_name": assignment.class_no,
#                 "section": assignment.section,
#                 "team_type": assignment.team_type,
#                 "team_role": assignment.team_role,
#                 "date_time": assignment.from_time.strftime("%Y-%m-%d %H:%M:%S"),
#                 "assigned_user": {
#                     "user_id": assignment.user_id ,
#                    "full_name": " ".join(filter(None, [
#                         assigned_user.first_name if assigned_user else "",
#                         assigned_user.middle_name if assigned_user else "",
#                         assigned_user.last_name if assigned_user else ""
#                     ])).strip(),

#                     "email": assigned_user.email if assigned_user else "",
#                     "phone": assigned_user.phone if assigned_user else "",
#                     "user_role": assigned_user.user_role if assigned_user else "",
#                 }
#             }

#             if event_date == today:
#                 today_events.append(event)
#             elif event_date > today:
#                 upcoming_events[str(event_date)].append(event)

#         return JSONResponse(
#             status_code=status.HTTP_200_OK,
#             content=StandardResponse(
#                 status=True,
#                 message="Events fetched for assigned schools.",
#                 data={
#                     "today_events": today_events,
#                     "upcoming_events": dict(upcoming_events),
#                 },
#                 errors={}
#             ).__dict__,
#         )

#     except Exception as e:
#         return JSONResponse(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             content=StandardResponse(
#                 status=False,
#                 message="Error while fetching events.",
#                 data={},
#                 errors={"exception": str(e)},
#             ).__dict__,
#         )

from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Optional
import pytz
from collections import defaultdict

from src.models.school_models import AssignSchool, Schools
from src.models.user_models import (SchoolRoles, SchoolStaff, OnGroundTeam, ScreeningTeam,
    AnalystTeam, AdminTeam, ConsultantTeam)
from src.core.manager import get_current_user
from src.utils.response import StandardResponse
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)

# Unified user fetcher
async def get_user_by_user_id_and_role(user_id: int, role_type: str):
    model_map = {
        "SCHOOL_STAFF": SchoolStaff,
        "ON_GROUND_TEAM": OnGroundTeam,
        "SCREENING_TEAM": ScreeningTeam,
        "ANALYST_TEAM": AnalystTeam,
        "ADMIN_TEAM": AdminTeam,
        "CONSULTANT_TEAM": ConsultantTeam
    }
    model = model_map.get(role_type)
    if not model:
        return None
    return await model.get_or_none(id=user_id)


from .. import router


# Helper: Fetch user details by user_id
async def get_user_by_user_id(user_id: int):
    user_models = [SchoolStaff, OnGroundTeam, ScreeningTeam, AnalystTeam, AdminTeam, ConsultantTeam]
    
    for model in user_models:
        user = await model.get_or_none(id=user_id)
        if user:
            return user
    return None


@router.get("/events", response_model=StandardResponse)
async def get_school_admin_events(
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    ),
    current_user=Depends(get_current_user)
):
    try:
        # ✅ Only school admins allowed
        if current_user["user_role"] != SchoolRoles.SCHOOL_ADMIN:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content=StandardResponse(
                    status=False,
                    message="Only school admins can access this endpoint.",
                    data={},
                    errors={},
                ).__dict__,
            )

        # Determine academic year
        if academic_year is None:
            academic_year = get_current_academic_year()

        try:
            ay_start, ay_end = parse_academic_year(academic_year)
        except ValueError as e:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=StandardResponse(
                    status=False,
                    message=str(e),
                    data={},
                    errors={"academic_year": str(e)}
                ).__dict__,
            )

        utc = pytz.UTC
        today = datetime.now(utc).date()

        assigned_school_ids = [current_user["school_id"]] if current_user["school_id"] else []

        if not assigned_school_ids:
            response = JSONResponse(
                status_code=status.HTTP_200_OK,
                content=StandardResponse(
                    status=True,
                    message="No schools assigned to this admin.",
                    data={"today_events": [], "upcoming_events": {}},  # ← Same format as original
                    errors={}
                ).__dict__,
            )
            response.headers["X-Academic-Year"] = academic_year
            return response

        # Build academic year filter
        year_filter = build_academic_year_filter(academic_year)

        # ✅ Fetch all assignments/events for these schools with academic year filter
        all_assignments = await AssignSchool.filter(
            year_filter,
            school__in=assigned_school_ids
        ).order_by("from_time")

        today_events = []
        upcoming_events = defaultdict(list)

        for assignment in all_assignments:
            if assignment.from_time is None:
                continue

            # Handle both datetime and string formats
            try:
                if isinstance(assignment.from_time, str):
                    # Parse string to datetime
                    from_time_dt = datetime.fromisoformat(assignment.from_time.replace('Z', '+00:00'))
                    event_date = from_time_dt.date()
                    date_time_str = from_time_dt.strftime("%Y-%m-%d %H:%M:%S")
                elif isinstance(assignment.from_time, datetime):
                    event_date = assignment.from_time.date()
                    date_time_str = assignment.from_time.strftime("%Y-%m-%d %H:%M:%S")
                else:
                    continue
            except (ValueError, AttributeError):
                continue

            school = await Schools.get_or_none(school_id=assignment.school)

            # ✅ Fetch user details using user_id
            assigned_user = await get_user_by_user_id(assignment.user_id)

            event = {
                "assignment_id": assignment.id,
                "school_id": assignment.school,
                "user_id": assignment.user_id,  # Assigned to which user
                "school_name": school.school_name if school else "",
                "class_name": assignment.class_no,
                "section": assignment.section,
                "team_type": assignment.team_type,
                "team_role": assignment.team_role,
                "date_time": date_time_str,
                "assigned_user": {
                    "user_id": assignment.user_id,
                    "full_name": " ".join(filter(None, [
                        assigned_user.first_name if assigned_user else "",
                        assigned_user.middle_name if assigned_user else "",
                        assigned_user.last_name if assigned_user else ""
                    ])).strip(),
                    "email": assigned_user.email if assigned_user else "",
                    "phone": assigned_user.phone if assigned_user else "",
                    "user_role": assigned_user.user_role if assigned_user else "",
                }
            }

            if event_date == today:
                today_events.append(event)
            elif event_date > today:
                upcoming_events[str(event_date)].append(event)

        # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data, no user_profile)
        response = JSONResponse(
            status_code=status.HTTP_200_OK,
            content=StandardResponse(
                status=True,
                message="Events fetched for assigned schools.",
                data={
                    "today_events": today_events,
                    "upcoming_events": dict(upcoming_events),
                },  # ← Same format as original
                errors={}
            ).__dict__,
        )
        response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
        return response

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=StandardResponse(
                status=False,
                message="Error while fetching events.",
                data={},
                errors={"exception": str(e)},
            ).__dict__,
        )

