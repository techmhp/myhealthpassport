from fastapi import Depends, Query, status
from fastapi.responses import JSONResponse
from tortoise.transactions import in_transaction
from datetime import datetime
from tortoise.exceptions import DoesNotExist, IntegrityError
from pydantic import BaseModel
from src.utils.response import StandardResponse
from src.core.manager import get_current_user
from src.models.school_models import Schools, AssignSchool
from src.models.student_models import Students
from src.models.user_models import SchoolStaff,OnGroundTeam, ScreeningTeam, ConsultantTeam, AnalystTeam, AdminTeam
from src.models.user_models import AdminTeamRoles
from fastapi import APIRouter
from ..schema import AssignStaffRequest, AssignStaffResponse
from .. import router
from typing import Optional
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
    build_academic_year_filter,
)
           

# ===================================================================
# MODIFIED: GET ASSIGNED SCHOOLS (with Academic Year Filter)
# ===================================================================
# @router.get("/assigned-schools", response_model=StandardResponse)
# async def get_assigned_schools_by_user(
#     user_id: int = Query(..., description="User ID"),
#     role_type: str = Query(..., description="Team type"),
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     ),
#     current_user=Depends(get_current_user)
# ):
#     try:
#         creator_role = AdminTeamRoles(current_user["user_role"])
#         if creator_role not in [AdminTeamRoles.SUPER_ADMIN, AdminTeamRoles.PROGRAM_COORDINATOR]:
#             resp = StandardResponse(status=False, message="Access denied", data={}, errors={})
#             return JSONResponse(content=resp.__dict__, status_code=403)

#         if role_type not in ["ON_GROUND_TEAM", "SCREENING_TEAM", "CONSULTANT_TEAM", "ANALYST_TEAM", "ADMIN_TEAM"]:
#             resp = StandardResponse(status=False, message="Invalid role_type", data={}, errors={"role_type": "Invalid"})
#             return JSONResponse(content=resp.__dict__, status_code=400)

#         # Determine academic year
#         if academic_year is None:
#             academic_year = get_current_academic_year()

#         try:
#             ay_start, ay_end = parse_academic_year(academic_year)
#         except ValueError as e:
#             resp = StandardResponse(
#                 status=False,
#                 message=str(e),
#                 data={},
#                 errors={"academic_year": str(e)}
#             )
#             return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

#         # Build academic year filter
#         year_filter = build_academic_year_filter(academic_year)

#         # Fetch assignments with academic year filter
#         assignments = await AssignSchool.filter(
#             year_filter,
#             user_id=user_id,
#             team_type=role_type,
#             is_deleted=False
#         ).order_by("date", "from_time")

#         if not assignments:
#             resp = StandardResponse(
#                 status=True,
#                 message="No assignments found",
#                 data={"assignments": []},  # ← Same format as original
#                 errors={}
#             )
#             response = JSONResponse(content=resp.__dict__, status_code=200)
#             response.headers["X-Academic-Year"] = academic_year
#             return response

#         from collections import defaultdict
#         grouped = defaultdict(lambda: {
#             "school_id": None,
#             "school_name": "",
#             "date": "",
#             "from_time": "",
#             "to_time": "",
#             "team_role": "",
#             "classes": []
#         })

#         for a in assignments:
#             key = (a.school, a.date)
#             if not grouped[key]["school_id"]:
#                 school = await Schools.get_or_none(school_id=a.school, is_deleted=False)
#                 grouped[key]["school_id"] = a.school
#                 grouped[key]["school_name"] = school.school_name if school else "Unknown"
#                 grouped[key]["date"] = str(a.date)
#                 grouped[key]["from_time"] = a.from_time
#                 grouped[key]["to_time"] = a.to_time
#                 grouped[key]["team_role"] = a.team_role

#             grouped[key]["classes"].append({
#                 "class_name": a.class_no,
#                 "section": a.section or ""
#             })

#         result = []
#         for data in grouped.values():
#             class_list = "; ".join([
#                 f"Class {c['class_name']}{' ' + c['section'] if c['section'] else ''}".strip()
#                 for c in data["classes"]
#             ]) or "assigned"

#             result.append({
#                 "school_id": data["school_id"],
#                 "school_name": data["school_name"],
#                 "date": data["date"],
#                 "from_time": data["from_time"],
#                 "to_time": data["to_time"],
#                 "team_role": data["team_role"],
#                 "currently_reporting": "assigned" if "assigned" in class_list.lower() or len(data["classes"]) > 5 else class_list
#             })

#         # ✅ SAME FORMAT AS ORIGINAL (no academic_year in data)
#         resp = StandardResponse(
#             status=True,
#             message="Assigned schools fetched successfully",
#             data={"assignments": result},  # ← Same format as original
#             errors={}
#         )
        
#         response = JSONResponse(content=resp.__dict__, status_code=200)
#         response.headers["X-Academic-Year"] = academic_year  # ← Academic year in header
#         return response

#     except Exception as e:
#         resp = StandardResponse(status=False, message="Failed to fetch", data={}, errors={"error": str(e)})
#         return JSONResponse(content=resp.__dict__, status_code=500)

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

            # Validate team_type
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
            model_map = {
                "ON_GROUND_TEAM": OnGroundTeam,
                "SCREENING_TEAM": ScreeningTeam,
                "CONSULTANT_TEAM": ConsultantTeam,
                "ANALYST_TEAM": AnalystTeam,
                "ADMIN_TEAM": AdminTeam,
                "SCHOOL_STAFF": SchoolStaff,
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

            # ✅ MODIFIED: Determine classes to assign with auto-population logic
            classes_to_assign = []

            if request.class_name and request.class_name.strip():
                # Specific classes provided
                class_list = [c.strip().upper() for c in request.class_name.split(",") if c.strip()]
                
                if request.section and request.section.strip():
                    # Both class and section provided
                    sections = [s.strip().upper() for s in request.section.split(",") if s.strip()]
                    for c in class_list:
                        for s in sections:
                            classes_to_assign.append({"class_no": c, "section": s})
                else:
                    # Class provided but no section - get all sections for specified classes
                    for c in class_list:
                        sections_for_class = await Students.filter(
                            school_students__school=request.school_id,
                            class_room=c,
                            is_deleted=False
                        ).distinct().values_list("section", flat=True)
                        
                        if sections_for_class:
                            for section in sections_for_class:
                                classes_to_assign.append({"class_no": c, "section": section or ""})
                        else:
                            # No students found for this class, add with empty section
                            classes_to_assign.append({"class_no": c, "section": ""})
            else:
                # No classes provided - get all classes and sections from Students table
                raw_classes = await Students.filter(
                    school_students__school=request.school_id,
                    is_deleted=False,
                    class_room__not="",
                    class_room__not_isnull=True
                ).distinct().values_list("class_room", "section", flat=False)
                
                seen = set()
                for class_room, section in raw_classes:
                    key = (class_room, section or "")
                    if key not in seen:
                        seen.add(key)
                        classes_to_assign.append({
                            "class_no": class_room,
                            "section": section or ""
                        })
                
                # Prevent 0-class assignments
                if not classes_to_assign:
                    return JSONResponse(
                        content=StandardResponse(
                            status=False, 
                            message="No students found in this school. Please add students first.",
                            data={},
                            errors={"school_id": "No students exist"}
                        ).__dict__,
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
        
