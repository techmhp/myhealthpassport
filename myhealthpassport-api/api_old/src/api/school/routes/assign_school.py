from fastapi import Depends, Query, status
from fastapi.responses import JSONResponse
from tortoise.transactions import in_transaction
from datetime import datetime
from tortoise.exceptions import DoesNotExist, IntegrityError
from pydantic import BaseModel
from src.utils.response import StandardResponse
from src.core.manager import get_current_user
from src.models.school_models import Schools, AssignSchool
from src.models.user_models import SchoolStaff,OnGroundTeam, ScreeningTeam, ConsultantTeam, AnalystTeam, AdminTeam
from src.models.user_models import AdminTeamRoles
from fastapi import APIRouter
from ..schema import AssignStaffRequest, AssignStaffResponse
from .. import router

@router.post("/assign-school", response_model=StandardResponse)
async def assign_school_staff(
    request: AssignStaffRequest,
    current_user=Depends(get_current_user)
):
    creator_role = AdminTeamRoles(current_user["user_role"])
    if creator_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
        return JSONResponse(
            content=StandardResponse(status=False, message="Access denied", data={}, errors={}).__dict__,
            status_code=403
        )

    async with in_transaction():
        try:
            # Validate school
            school = await Schools.get_or_none(school_id=request.school_id, is_deleted=False)
            if not school:
                return JSONResponse(
                    content=StandardResponse(status=False, message="School not found", data={}, errors={"school_id": "Invalid"}).__dict__,
                    status_code=404
                )

            # Validate team_type (including SCHOOL_STAFF)
            valid_team_types = [
                "ON_GROUND_TEAM", "SCREENING_TEAM", "CONSULTANT_TEAM",
                "ANALYST_TEAM", "ADMIN_TEAM", "SCHOOL_STAFF"
            ]
            if request.team_type not in valid_team_types:
                return JSONResponse(
                    content=StandardResponse(status=False, message="Invalid team_type", data={}, errors={"team_type": "Invalid"}).__dict__,
                    status_code=400
                )

            # Validate staff exists
            staff = None
            model_map = {
                "ON_GROUND_TEAM": OnGroundTeam,
                "SCREENING_TEAM": ScreeningTeam,
                "CONSULTANT_TEAM": ConsultantTeam,
                "ANALYST_TEAM": AnalystTeam,
                "ADMIN_TEAM": AdminTeam,
                "SCHOOL_STAFF": SchoolStaff,  # This line fixes your issue
            }
            staff_model = model_map[request.team_type]
            staff = await staff_model.get_or_none(id=request.user_id, is_deleted=False)

            if not staff:
                return JSONResponse(
                    content=StandardResponse(status=False, message=f"User {request.user_id} not found in {request.team_type}", data={}, errors={"user_id": "Not found"}).__dict__,
                    status_code=404
                )

            # Parse date
            try:
                assignment_date = datetime.strptime(request.date_time, "%Y-%m-%d %H:%M:%S").date()
            except ValueError:
                return JSONResponse(
                    content=StandardResponse(status=False, message="Invalid date_time format", data={}, errors={"date_time": "Use YYYY-MM-DD HH:MM:SS"}).__dict__,
                    status_code=400
                )

            # Determine classes to assign
            classes_to_assign = []

            if request.class_name and request.class_name.strip():
                class_list = [c.strip().upper() for c in request.class_name.split(",") if c.strip()]
                section = (request.section or "").strip().upper()
                for c in class_list:
                    classes_to_assign.append({"class_no": c, "section": section})
            else:
                # ASSIGN TO ALL CLASSES — FIXED: No .distinct() crash
                raw_classes = await SchoolStaff.filter(
                    school_id=request.school_id,
                    is_deleted=False,
                    class_room__not="",
                    class_room__not_isnull=True
                ).values_list("class_room", "section")

                seen = set()
                for class_room, section in raw_classes:
                    key = (class_room, section or "")
                    if key not in seen:
                        seen.add(key)
                        classes_to_assign.append({
                            "class_no": class_room,
                            "section": section or ""
                        })

                if not classes_to_assign:
                    return JSONResponse(
                        content=StandardResponse(status=False, message="No classes found in this school", data={}, errors={}).__dict__,
                        status_code=400
                    )

            # Create assignments
            created = []
            skipped = 0

            for cls in classes_to_assign:
                try:
                    assignment = await AssignSchool.create(
                        date=assignment_date,
                        from_time=request.from_time.strip(),
                        to_time=request.to_time.strip(),
                        team_type=request.team_type,
                        team_role=request.team_role,
                        user_id=request.user_id,
                        school=request.school_id,
                        class_no=cls["class_no"],
                        section=cls["section"],
                        is_completed=False,
                        created_by=str(current_user["user_id"]),
                        created_user_role=current_user["user_role"],
                        created_role_type=current_user.get("role_type", "")
                    )
                    created.append({
                        "assignment_id": assignment.id,
                        "class_name": assignment.class_no,
                        "section": assignment.section or "",
                        "date": str(assignment.date),
                        "from_time": assignment.from_time,
                        "to_time": assignment.to_time
                    })
                except IntegrityError:
                    skipped += 1

            if not created:
                return JSONResponse(
                    content=StandardResponse(status=False, message="No new assignments created", data={"skipped": skipped}, errors={}).__dict__,
                    status_code=409
                )

            return JSONResponse(
                content=StandardResponse(
                    status=True,
                    message="Staff assigned successfully",
                    data={
                        "assignment_id": created[0]["assignment_id"],
                        "user_id": request.user_id,
                        "team_role": request.team_role,
                        "school_id": request.school_id,
                        "class_name": "",
                        "section": "",
                        "from_time": request.from_time,
                        "to_time": request.to_time,
                        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "is_completed": False,
                        "total_assigned_classes": len(created),
                        "assigned_to_all": len(created) > 1
                    },
                    errors={}
                ).__dict__,
                status_code=201
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return JSONResponse(
                content=StandardResponse(status=False, message="Assignment failed", data={}, errors={"error": str(e)}).__dict__,
                status_code=500
            )
                  
@router.get("/assigned-schools", response_model=StandardResponse)
async def get_assigned_schools_by_user(
    user_id: int = Query(..., description="User ID"),
    role_type: str = Query(..., description="Team type"),
    current_user=Depends(get_current_user)
):
    try:
        creator_role = AdminTeamRoles(current_user["user_role"])
        if creator_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
            resp = StandardResponse(status=False, message="Access denied", data={}, errors={})
            return JSONResponse(content=resp.__dict__, status_code=403)

        if role_type not in ["ON_GROUND_TEAM", "SCREENING_TEAM", "CONSULTANT_TEAM", "ANALYST_TEAM", "ADMIN_TEAM"]:
            resp = StandardResponse(status=False, message="Invalid role_type", data={}, errors={"role_type": "Invalid"})
            return JSONResponse(content=resp.__dict__, status_code=400)

        assignments = await AssignSchool.filter(
            user_id=user_id,
            team_type=role_type,
            is_deleted=False
        ).order_by("date", "from_time")

        if not assignments:
            resp = StandardResponse(status=True, message="No assignments found", data={"assignments": []}, errors={})
            return JSONResponse(content=resp.__dict__, status_code=200)

        from collections import defaultdict
        grouped = defaultdict(lambda: {
            "school_id": None,
            "school_name": "",
            "date": "",
            "from_time": "",
            "to_time": "",
            "team_role": "",
            "classes": []
        })

        for a in assignments:
            key = (a.school, a.date)
            if not grouped[key]["school_id"]:
                school = await Schools.get_or_none(school_id=a.school, is_deleted=False)
                grouped[key]["school_id"] = a.school
                grouped[key]["school_name"] = school.school_name if school else "Unknown"
                grouped[key]["date"] = str(a.date)
                grouped[key]["from_time"] = a.from_time
                grouped[key]["to_time"] = a.to_time
                grouped[key]["team_role"] = a.team_role

            grouped[key]["classes"].append({
                "class_name": a.class_no,
                "section": a.section or ""
            })

        result = []
        for data in grouped.values():
            class_list = "; ".join([
                f"Class {c['class_name']}{' ' + c['section'] if c['section'] else ''}".strip()
                for c in data["classes"]
            ]) or "assigned"

            result.append({
                "school_id": data["school_id"],
                "school_name": data["school_name"],
                "date": data["date"],
                "from_time": data["from_time"],
                "to_time": data["to_time"],
                "team_role": data["team_role"],
                "currently_reporting": "assigned" if "assigned" in class_list.lower() or len(data["classes"]) > 5 else class_list
            })

        resp = StandardResponse(
            status=True,
            message="Assigned schools fetched successfully",
            data={"assignments": result},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=200)

    except Exception as e:
        resp = StandardResponse(status=False, message="Failed to fetch", data={}, errors={"error": str(e)})
        return JSONResponse(content=resp.__dict__, status_code=500)
    
@router.put("/assign-school/{assignment_id}", response_model=StandardResponse)
async def update_school_staff_assignment(
    assignment_id: int,
    request: AssignStaffRequest,
    current_user=Depends(get_current_user)
):
    creator_role = AdminTeamRoles(current_user["user_role"])
    if creator_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
        resp = StandardResponse(status=False, message="Access denied", data={}, errors={})
        return JSONResponse(content=resp.__dict__, status_code=403)

    async with in_transaction():
        try:
            original = await AssignSchool.get_or_none(id=assignment_id, is_deleted=False)
            if not original:
                resp = StandardResponse(status=False, message="Assignment not found", data={}, errors={})
                return JSONResponse(content=resp.__dict__, status_code=404)

            # Parse new date
            try:
                new_date = datetime.strptime(request.date_time, "%Y-%m-%d %H:%M:%S").date()
            except ValueError:
                resp = StandardResponse(status=False, message="Invalid date_time", data={}, errors={"date_time": "Invalid format"})
                return JSONResponse(content=resp.__dict__, status_code=400)

            # If original was part of "all classes" → update all on same date + school
            if not original.class_no or original.class_no.strip() == "":
                assignments = await AssignSchool.filter(
                    user_id=original.user_id,
                    school=original.school,
                    date=original.date,
                    team_type=original.team_type,
                    is_deleted=False
                )
            else:
                assignments = [original]

            # Validate new staff
            staff_model = {
                "ON_GROUND_TEAM": OnGroundTeam, "SCREENING_TEAM": ScreeningTeam,
                "CONSULTANT_TEAM": ConsultantTeam, "ANALYST_TEAM": AnalystTeam, "ADMIN_TEAM": AdminTeam
            }.get(request.team_type)
            if not await staff_model.get_or_none(id=request.user_id, is_deleted=False):
                resp = StandardResponse(status=False, message="Staff not found", data={}, errors={})
                return JSONResponse(content=resp.__dict__, status_code=400)

            updated_ids = []
            for assignment in assignments:
                assignment.date = new_date
                assignment.from_time = request.from_time
                assignment.to_time = request.to_time
                assignment.team_role = request.team_role
                assignment.user_id = request.user_id
                assignment.team_type = request.team_type

                if request.class_name and request.class_name.strip():
                    assignment.class_no = request.class_name.strip().upper()
                if request.section:
                    assignment.section = request.section.strip().upper()
                if request.is_completed is not None:
                    assignment.is_completed = request.is_completed

                assignment.updated_by = str(current_user["user_id"])
                assignment.updated_user_role = current_user["user_role"]
                assignment.updated_role_type = current_user.get("role_type", "")

                await assignment.save()
                updated_ids.append(assignment.id)

            resp = StandardResponse(
                status=True,
                message=f"Updated {len(updated_ids)} assignment(s)",
                data={
                    "assignment_id": original.id,
                    "updated_count": len(updated_ids),
                    "assignment_ids": updated_ids
                },
                errors={}
            )
            return JSONResponse(content=resp.__dict__, status_code=200)

        except Exception as e:
            resp = StandardResponse(status=False, message="Update failed", data={}, errors={"error": str(e)})
            return JSONResponse(content=resp.__dict__, status_code=500)
        
# @router.post("/assign-school", response_model=StandardResponse)
# async def assign_school_staff(request: AssignStaffRequest, current_user=Depends(get_current_user)):
#     """
#     Assign a specific school staff member (provided in request body) to a school with class, section, and time range.
#     The logged-in user (current_user) is used for authentication only.
#     """
#     # 1. Authorization Check
#     creator_role = AdminTeamRoles(current_user["user_role"])
#     if creator_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role} is not allowed to Assign school records.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     async with in_transaction():
#         try:
#             # Validate school existence
#             school = await Schools.get_or_none(school_id=request.school_id)
#             if not school:
#                 resp = StandardResponse(
#                     status=False,
#                     message=f"School with ID {request.school_id} not found",
#                     data={},
#                     errors={"school_id": "School not found"},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#             # Validate staff existence
#             team_types = ["ON_GROUND_TEAM", "SCREENING_TEAM", "CONSULTANT_TEAM", "ANALYST_TEAM", "ADMIN_TEAM"]
#             if request.team_type not in team_types:
#                 resp = StandardResponse(
#                     status=False,
#                     message="Invalid team type",
#                     data={},
#                     errors={},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#             if request.team_type == "ON_GROUND_TEAM":
#                 staff = await OnGroundTeam.get_or_none(id=request.user_id)
#             elif request.team_type == "SCREENING_TEAM":
#                 staff = await ScreeningTeam.get_or_none(id=request.user_id)
#             elif request.team_type == "CONSULTANT_TEAM":
#                 staff = await ConsultantTeam.get_or_none(id=request.user_id)
#             elif request.team_type == "ANALYST_TEAM":
#                 staff = await AnalystTeam.get_or_none(id=request.user_id)
#             elif request.team_type == "ADMIN_TEAM":
#                 staff = await AdminTeam.get_or_none(id=request.user_id)

#             if staff is None:
#                 resp = StandardResponse(
#                     status=False,
#                     message=f"Staff with ID {request.user_id} not found in {request.team_type}",
#                     data={},
#                     errors={},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#             # Parse datetime
#             try:
#                 date = datetime.strptime(request.date_time, "%Y-%m-%d %H:%M:%S")
#             except ValueError:
#                 resp = StandardResponse(
#                     status=False,
#                     message="Invalid datetime format. Use YYYY-MM-DD HH:MM:SS",
#                     data={},
#                     errors={"date_time": "Invalid format"},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#             # # Validate time range against days_available
#             # if request.team_type == "ON_GROUND_TEAM" and staff.days_available:
#             #     days_available = staff.days_available
#             #     requested_day = date.strftime("%A").lower()
#             #     valid_time_slots = []
#             #     for day in days_available:
#             #         if day["day"].lower() == requested_day:
#             #             valid_time_slots = [slot["time"] for slot in day["timings"] if slot["availability"]]
#             #             break
#             #     requested_time_range = f"{request.from_time} - {request.to_time}"
#             #     if not any(requested_time_range in slot for slot in valid_time_slots):
#             #         resp = StandardResponse(
#             #             status=False,
#             #             message=f"Selected time range {requested_time_range} is not available for {requested_day}",
#             #             data={},
#             #             errors={"time_range": "Invalid time range"},
#             #         )
#             #         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#             # Create assignment
#             try:
#                 assignment = await AssignSchool.create(
#                     date=date,
#                     team_type=request.team_type,
#                     team_role=request.team_role,
#                     user_id=request.user_id,
#                     school=school.school_id,
#                     class_no=request.class_name,
#                     section=request.section,
#                     from_time=request.from_time,
#                     to_time=request.to_time,
#                     created_by=str(current_user["user_id"]),
#                     created_user_role=current_user["user_role"],
#                     created_role_type=current_user.get("role_type"),
#                 )
#             except IntegrityError:
#                 resp = StandardResponse(
#                     status=False,
#                     message="Assignment already exists or invalid data",
#                     data={},
#                     errors={"assignment": "Duplicate or invalid data"},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

#             resp = StandardResponse(
#                 status=True,
#                 message="Staff assigned successfully",
#                 data={
#                     "assignment_id": assignment.id,
#                     "user_id": assignment.user_id,
#                     "team_role": assignment.team_role,
#                     "school_id": assignment.school,
#                     "class_name": assignment.class_no,
#                     "section": assignment.section,
#                     "from_time": assignment.from_time,
#                     "to_time": assignment.to_time,
#                     "created_at": assignment.created_at.strftime("%Y-%m-%d %H:%M:%S"),
#                     "is_completed": assignment.is_completed,
#                 },
#                 errors={},
#             )
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_201_CREATED)

#         except DoesNotExist:
#             resp = StandardResponse(
#                 status=False,
#                 message="Resource not found",
#                 data={},
#                 errors={"general": "Resource not found"},
#             )
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             resp = StandardResponse(
#                 status=False,
#                 message=str(e),
#                 data={},
#                 errors={"general": str(e)},
#             )
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

# @router.get("/assigned-schools", response_model=StandardResponse)
# async def get_assigned_schools_by_user(
#     user_id: int = Query(..., description="User ID to filter assignments"),
#     role_type: str = Query(..., description="Role Type to filter assignments"),
#     current_user=Depends(get_current_user)
# ):
#     try:
#         creator_role = AdminTeamRoles(current_user["user_role"])
#         if creator_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
#             return JSONResponse(content=StandardResponse(
#                 status=False,
#                 message=f"{creator_role} is not allowed to view school assignments.",
#                 data={},
#                 errors={}
#             ).__dict__, status_code=403)

#         if role_type not in ["ON_GROUND_TEAM", "SCREENING_TEAM", "CONSULTANT_TEAM", "ANALYST_TEAM"]:
#             return JSONResponse(content=StandardResponse(
#                 status=False,
#                 message="Invalid role type provided",
#                 data={},
#                 errors={"role_type": "Invalid role type"}
#             ).__dict__, status_code=400)

#         assignments = await AssignSchool.filter(
#             user_id=user_id,
#             team_type=role_type,
#             is_completed=False  # 👈 Only fetch active (not completed) assignments
#         ).order_by("date")


#         if not assignments:
#             return JSONResponse(content=StandardResponse(
#                 status=True,
#                 message=f"No schools assigned to user with ID {user_id}",
#                 data={"assignments": []},
#                 errors={}
#             ).__dict__, status_code=200)

#         assignment_data = []
#         for assignment in assignments:
#             school = await Schools.get_or_none(school_id=assignment.school)

#             assignment_data.append({
#                 "assignment_id": assignment.id,
#                 "user_id": assignment.user_id,
#                 "team_type": assignment.team_type,
#                 "team_role": assignment.team_role,
#                 "school_id": assignment.school,
#                 "school_name": school.school_name if school else "",
#                 "class_name": assignment.class_no,
#                 "section": assignment.section,
#                 "date": str(assignment.date),
#                 "from_time": assignment.from_time,
#                 "to_time": assignment.to_time,
#                 "created_at": str(assignment.created_at),
#             })

#         return JSONResponse(content=StandardResponse(
#             status=True,
#             message="Assigned schools fetched successfully",
#             data={"assignments": assignment_data},
#             errors={}
#         ).__dict__, status_code=200)

#     except Exception as e:
#         return JSONResponse(content=StandardResponse(
#             status=False,
#             message="Failed to fetch assigned schools",
#             data={},
#             errors={"general": str(e)}
#         ).__dict__, status_code=500)

# @router.put("/assign-school/{assignment_id}", response_model=StandardResponse)
# async def update_school_staff_assignment(
#     assignment_id: int,
#     request: AssignStaffRequest,
#     current_user=Depends(get_current_user)
# ):
#     """
#     Update an existing school staff assignment with new details provided in the request body.
#     The logged-in user (current_user) is used for authentication only.
#     """
#     # 1. Authorization Check
#     creator_role = AdminTeamRoles(current_user["user_role"])
#     if creator_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role} is not allowed to update school assignments.",
#             data={},
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     async with in_transaction():
#         try:
#             # Validate assignment existence
#             assignment = await AssignSchool.get_or_none(id=assignment_id)
#             if not assignment:
#                 resp = StandardResponse(
#                     status=False,
#                     message=f"Assignment with ID {assignment_id} not found",
#                     data={},
#                     errors={"assignment_id": "Assignment not found"},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#             # Validate school existence
#             school = await Schools.get_or_none(school_id=request.school_id)
#             if not school:
#                 resp = StandardResponse(
#                     status=False,
#                     message=f"School with ID {request.school_id} not found",
#                     data={},
#                     errors={"school_id": "School not found"},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#             # Validate staff existence
#             team_types = ["ON_GROUND_TEAM", "SCREENING_TEAM", "CONSULTANT_TEAM", "ANALYST_TEAM", "ADMIN_TEAM"]
#             if request.team_type not in team_types:
#                 resp = StandardResponse(
#                     status=False,
#                     message="Invalid team type",
#                     data={},
#                     errors={},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#             if request.team_type == "ON_GROUND_TEAM":
#                 staff = await OnGroundTeam.get_or_none(id=request.user_id)
#             elif request.team_type == "SCREENING_TEAM":
#                 staff = await ScreeningTeam.get_or_none(id=request.user_id)
#             elif request.team_type == "CONSULTANT_TEAM":
#                 staff = await ConsultantTeam.get_or_none(id=request.user_id)
#             elif request.team_type == "ANALYST_TEAM":
#                 staff = await AnalystTeam.get_or_none(id=request.user_id)
#             elif request.team_type == "ADMIN_TEAM":
#                 staff = await AdminTeam.get_or_none(id=request.user_id)

#             if staff is None:
#                 resp = StandardResponse(
#                     status=False,
#                     message=f"Staff with ID {request.user_id} not found in {request.team_type}",
#                     data={},
#                     errors={},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#             # Parse datetime
#             try:
#                 date = datetime.strptime(request.date_time, "%Y-%m-%d %H:%M:%S")
#             except ValueError:
#                 resp = StandardResponse(
#                     status=False,
#                     message="Invalid datetime format. Use YYYY-MM-DD HH:MM:SS",
#                     data={},
#                     errors={"date_time": "Invalid format"},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#             # Validate time range against days_available
#             if request.team_type == "ON_GROUND_TEAM" and staff.days_available:
#                 days_available = staff.days_available
#                 requested_day = date.strftime("%A").lower()
#                 valid_time_slots = []
#                 for day in days_available:
#                     if day["day"].lower() == requested_day:
#                         valid_time_slots = [slot["time"] for slot in day["timings"] if slot["availability"]]
#                         break
#                 requested_time_range = f"{request.from_time} - {request.to_time}"
#                 if not any(requested_time_range in slot for slot in valid_time_slots):
#                     resp = StandardResponse(
#                         status=False,
#                         message=f"Selected time range {requested_time_range} is not available for {requested_day}",
#                         data={},
#                         errors={"time_range": "Invalid time range"},
#                     )
#                     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#             # Update assignment
#             try:
#                 assignment.date = date
#                 assignment.team_type = request.team_type
#                 assignment.team_role = request.team_role
#                 assignment.user_id = request.user_id
#                 assignment.school = school.school_id
#                 assignment.class_no = request.class_name
#                 assignment.section = request.section
#                 assignment.from_time = request.from_time
#                 assignment.to_time = request.to_time
                
#                 if request.is_completed is not None:
#                     assignment.is_completed = request.is_completed
                    
#                 assignment.updated_by = str(current_user["user_id"])
#                 assignment.updated_user_role = current_user["user_role"]
#                 assignment.updated_role_type = current_user.get("role_type")
                    
#                 await assignment.save()
#             except IntegrityError:
#                 resp = StandardResponse(
#                     status=False,
#                     message="Assignment update failed due to duplicate or invalid data",
#                     data={},
#                     errors={"assignment": "Duplicate or invalid data"},
#                 )
#                 return JSONResponse(content=resp.__dict__, status_code=status.HTTP_409_CONFLICT)

#             resp = StandardResponse(
#                 status=True,
#                 message="Staff assignment updated successfully",
#                 data={
#                     "assignment_id": assignment.id,
#                     "user_id": assignment.user_id,
#                     "team_role": assignment.team_role,
#                     "school_id": assignment.school,
#                     "class_name": assignment.class_no,
#                     "section": assignment.section,
#                     "from_time": assignment.from_time,
#                     "to_time": assignment.to_time,
#                     "created_at": assignment.created_at.strftime("%Y-%m-%d %H:%M:%S"),
#                     "is_completed": assignment.is_completed,
#                 },
#                 errors={},
#             )
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

#         except DoesNotExist:
#             resp = StandardResponse(
#                 status=False,
#                 message="Resource not found",
#                 data={},
#                 errors={"general": "Resource not found"},
#             )
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             resp = StandardResponse(
#                 status=False,
#                 message=str(e),
#                 data={},
#                 errors={"general": str(e)},
#             )
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        