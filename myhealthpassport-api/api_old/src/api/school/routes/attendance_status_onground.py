from fastapi import Depends, Query, status, Body
from fastapi.responses import JSONResponse
from src.core.manager import get_current_user
from src.models.school_models import Schools, AssignSchool
from src.models.student_models import Students, AttendanceStatus
from src.models.user_models import OnGroundTeamRoles, OnGroundTeam
from src.utils.response import StandardResponse
from .. import router
from typing import List, Optional
from datetime import datetime

# @router.get("/{school_id}/attendance-list", response_model=StandardResponse)
# async def get_attendance_list(
#     school_id: int,
#     current_user: dict = Depends(get_current_user),
#     class_name: Optional[str] = Query(None, max_length=50),
#     section: Optional[str] = Query(None, max_length=10),
#     search: Optional[str] = Query(None, max_length=255),
#     page: int = Query(1, ge=1),
#     page_size: int = Query(100, ge=1, le=1000),
# ):
#     allowed_roles = [
#         OnGroundTeamRoles.REGISTRATION_TEAM.value,
#         OnGroundTeamRoles.CAMP_COORDINATOR.value,
#         "SCHOOL_ADMIN",
#         "TEACHER"
#     ]
#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role} is not allowed to view attendance records.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     school = await Schools.get_or_none(school_id=school_id)
#     if not school:
#         resp = StandardResponse(
#             status=False,
#             message="School not found.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Fetch the user's assignments
#     user_id = current_user.get("user_id")
#     assignments = await AssignSchool.filter(user_id=user_id).all()
#     if not assignments:
#         resp = StandardResponse(
#             status=False,
#             message="No assignments found for the user.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Initialize or update attendance records for all assigned schools and classes
#     for assignment in assignments:
#         assignment_school_id = assignment.school
#         user_class_name = class_name or assignment.class_no
#         user_section = section or assignment.section

#         # Check existing attendance records for this school, class, and section
#         existing_attendance = await AttendanceStatus.filter(
#             student__school_students__school_id=assignment_school_id,
#             student__class_room=user_class_name,
#             student__section=user_section
#         ).all()

#         existing_student_ids = {record.student_id for record in existing_attendance}

#         # Fetch all students for this assignment with search filter
#         students_query = Students.filter(school_students__school_id=assignment_school_id)
#         if user_class_name:
#             students_query = students_query.filter(class_room=user_class_name)
#         if user_section:
#             students_query = students_query.filter(section=user_section)
#         if search:
#             first_name_ids = set(await Students.filter(
#                 school_students__school_id=assignment_school_id,
#                 class_room=user_class_name if user_class_name else "",
#                 section=user_section if user_section else "",
#                 first_name__icontains=search
#             ).values_list("id", flat=True))
#             middle_name_ids = set(await Students.filter(
#                 school_students__school_id=assignment_school_id,
#                 class_room=user_class_name if user_class_name else "",
#                 section=user_section if user_section else "",
#                 middle_name__icontains=search
#             ).values_list("id", flat=True))
#             last_name_ids = set(await Students.filter(
#                 school_students__school_id=assignment_school_id,
#                 class_room=user_class_name if user_class_name else "",
#                 section=user_section if user_section else "",
#                 last_name__icontains=search
#             ).values_list("id", flat=True))
#             gender_ids = set(await Students.filter(
#                 school_students__school_id=assignment_school_id,
#                 class_room=user_class_name if user_class_name else "",
#                 section=user_section if user_section else "",
#                 gender__icontains=search
#             ).values_list("id", flat=True))
#             phone_ids = set(await Students.filter(
#                 school_students__school_id=assignment_school_id,
#                 class_room=user_class_name if user_class_name else "",
#                 section=user_section if user_section else "",
#                 phone__icontains=search
#             ).values_list("id", flat=True))
#             matching_student_ids = first_name_ids | middle_name_ids | last_name_ids | gender_ids | phone_ids
#             students_query = students_query.filter(id__in=matching_student_ids)

#         students = await students_query.all()

#         # Create new attendance records for students not already present
#         for student in students:
#             if student.id not in existing_student_ids:
#                 await AttendanceStatus.create(
#                     student=student,
#                     attendance_status=False,
#                     date=datetime.now().strftime("%Y-%m-%d"),
#                     user_id=user_id,
#                     role=assignment.team_role,
#                     role_type="ON_GROUND_TEAM",
#                     school_id=assignment_school_id,
#                     class_name=user_class_name,
#                     section=user_section
#                 )

#         # Update existing_student_ids to include newly created records
#         existing_attendance = await AttendanceStatus.filter(
#             student__school_students__school_id=assignment_school_id,
#             student__class_room=user_class_name,
#             student__section=user_section
#         ).all()
#         existing_student_ids = {record.student_id for record in existing_attendance}

#     # Filter attendance records for the requested school_id with search filter
#     query = AttendanceStatus.filter(student__school_students__school_id=school_id)
#     if user_class_name:
#         query = query.filter(student__class_room=user_class_name)
#     if user_section:
#         query = query.filter(student__section=user_section)
#     if search:
#         first_name_ids = set(await Students.filter(
#             school_students__school_id=school_id,
#             class_room=user_class_name if user_class_name else "",
#             section=user_section if user_section else "",
#             first_name__icontains=search
#         ).values_list("id", flat=True))
#         middle_name_ids = set(await Students.filter(
#             school_students__school_id=school_id,
#             class_room=user_class_name if user_class_name else "",
#             section=user_section if user_section else "",
#             middle_name__icontains=search
#         ).values_list("id", flat=True))
#         last_name_ids = set(await Students.filter(
#             school_students__school_id=school_id,
#             class_room=user_class_name if user_class_name else "",
#             section=user_section if user_section else "",
#             last_name__icontains=search
#         ).values_list("id", flat=True))
#         gender_ids = set(await Students.filter(
#             school_students__school_id=school_id,
#             class_room=user_class_name if user_class_name else "",
#             section=user_section if user_section else "",
#             gender__icontains=search
#         ).values_list("id",flat=True))
#         phone_ids = set(await Students.filter(
#             school_students__school_id=school_id,
#             class_room=user_class_name if user_class_name else "",
#             section=user_section if user_section else "",
#             phone__icontains=search
#         ).values_list("id", flat=True))
#         matching_student_ids = first_name_ids | middle_name_ids | last_name_ids | gender_ids | phone_ids
#         query = query.filter(student_id__in=matching_student_ids)

#     total_records = await query.count()
#     attendance_records = await query.offset((page - 1) * page_size).limit(page_size).distinct()

#     # Prepare response with only required fields
#     attendance_list = [
#         {
#             "student_id": record.student_id,
#             "attendance_status": record.attendance_status,
#             "attendance_id": record.id,
#         }
#         for record in attendance_records
#     ]

#     resp = StandardResponse(
#         status=True,
#         message="Attendance list retrieved successfully.",
#         data={"attendance_list": attendance_list, "total": total_records, "page": page, "page_size": page_size},
#         errors={}
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

@router.get("/{school_id}/attendance-list", response_model=StandardResponse)
async def get_attendance_list(
    school_id: int,
    current_user: dict = Depends(get_current_user),
    class_name: Optional[str] = Query(None, max_length=50),
    section: Optional[str] = Query(None, max_length=10),
    search: Optional[str] = Query(None, max_length=255),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
):
    allowed_roles = [
        OnGroundTeamRoles.REGISTRATION_TEAM.value,
        OnGroundTeamRoles.CAMP_COORDINATOR.value,
        "SCHOOL_ADMIN",
        "TEACHER"
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to view attendance records.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    school = await Schools.get_or_none(school_id=school_id)
    if not school:
        resp = StandardResponse(
            status=False,
            message="School not found.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    user_id = current_user.get("user_id")
    # Fetch the user's assignments
    assignments = await AssignSchool.filter(user_id=user_id, school=school_id).all()
    if not assignments:
        resp = StandardResponse(
            status=False,
            message="No assignments found for the user at this school.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Get today's date for filtering
    today = datetime.now().strftime("%Y-%m-%d")

    # Initialize or update attendance records for all assigned schools and classes
    for assignment in assignments:
        assignment_school_id = assignment.school
        user_class_name = class_name or assignment.class_no
        user_section = section or assignment.section

        # Fetch all students for this assignment with search filter
        students_query = Students.filter(school_students__school_id=assignment_school_id)
        if user_class_name:
            students_query = students_query.filter(class_room=user_class_name)
        if user_section:
            students_query = students_query.filter(section=user_section)
        if search:
            first_name_ids = set(await Students.filter(
                school_students__school_id=assignment_school_id,
                class_room=user_class_name if user_class_name else "",
                section=user_section if user_section else "",
                first_name__icontains=search
            ).values_list("id", flat=True))
            middle_name_ids = set(await Students.filter(
                school_students__school_id=assignment_school_id,
                class_room=user_class_name if user_class_name else "",
                section=user_section if user_section else "",
                middle_name__icontains=search
            ).values_list("id", flat=True))
            last_name_ids = set(await Students.filter(
                school_students__school_id=assignment_school_id,
                class_room=user_class_name if user_class_name else "",
                section=user_section if user_section else "",
                last_name__icontains=search
            ).values_list("id", flat=True))
            gender_ids = set(await Students.filter(
                school_students__school_id=assignment_school_id,
                class_room=user_class_name if user_class_name else "",
                section=user_section if user_section else "",
                gender__icontains=search
            ).values_list("id", flat=True))
            phone_ids = set(await Students.filter(
                school_students__school_id=assignment_school_id,
                class_room=user_class_name if user_class_name else "",
                section=user_section if user_section else "",
                phone__icontains=search
            ).values_list("id", flat=True))
            matching_student_ids = first_name_ids | middle_name_ids | last_name_ids | gender_ids | phone_ids
            students_query = students_query.filter(id__in=matching_student_ids)

        students = await students_query.all()

        # Check existing attendance records for today
        existing_attendance = await AttendanceStatus.filter(
            student__school_students__school_id=assignment_school_id,
            student__class_room=user_class_name,
            student__section=user_section,
            date=today
        ).all()
        existing_student_ids = {record.student_id for record in existing_attendance}

        # Create new attendance records for students not already present
        for student in students:
            if student.id not in existing_student_ids:
                await AttendanceStatus.create(
                    student=student,
                    attendance_status=False,
                    date=today,
                    user_id=user_id,
                    role=assignment.team_role,
                    role_type="ON_GROUND_TEAM",
                    school_id=assignment_school_id,
                    class_name=user_class_name,
                    section=user_section
                )

    # Fetch attendance records for the requested school_id with filters
    query = AttendanceStatus.filter(
        student__school_students__school_id=school_id,
        date__lte=today
    )
    if class_name:
        query = query.filter(student__class_room=class_name)
    if section:
        query = query.filter(student__section=section)
    if search:
        first_name_ids = set(await Students.filter(
            school_students__school_id=school_id,
            class_room=class_name if class_name else "",
            section=section if section else "",
            first_name__icontains=search
        ).values_list("id", flat=True))
        middle_name_ids = set(await Students.filter(
            school_students__school_id=school_id,
            class_room=class_name if class_name else "",
            section=section if section else "",
            middle_name__icontains=search
        ).values_list("id", flat=True))
        last_name_ids = set(await Students.filter(
            school_students__school_id=school_id,
            class_room=class_name if class_name else "",
            section=section if section else "",
            last_name__icontains=search
        ).values_list("id", flat=True))
        gender_ids = set(await Students.filter(
            school_students__school_id=school_id,
            class_room=class_name if class_name else "",
            section=section if section else "",
            gender__icontains=search
        ).values_list("id", flat=True))
        phone_ids = set(await Students.filter(
            school_students__school_id=school_id,
            class_room=class_name if class_name else "",
            section=section if section else "",
            phone__icontains=search
        ).values_list("id", flat=True))
        matching_student_ids = first_name_ids | middle_name_ids | last_name_ids | gender_ids | phone_ids
        query = query.filter(student_id__in=matching_student_ids)

    total_records = await query.count()
    attendance_records = await query.offset((page - 1) * page_size).limit(page_size).distinct()

    # Prepare response with only required fields
    attendance_list = [
        {
            "student_id": record.student_id,
            "attendance_status": record.attendance_status,
            "attendance_id": record.id,
            "date": record.date.strftime("%Y-%m-%d")
        }
        for record in attendance_records
    ]

    resp = StandardResponse(
        status=True,
        message="Attendance list retrieved successfully.",
        data={"attendance_list": attendance_list, "total": total_records, "page": page, "page_size": page_size},
        errors={}
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

            
# @router.put("/{school_id}/attendance/{attendance_id}", response_model=StandardResponse)
# async def update_attendance_status(
#     school_id: int,
#     attendance_id: int,
#     current_user: dict = Depends(get_current_user),
#     attendance_data: dict = Body(..., example={"attendance_status": True}),
# ):
#     allowed_roles = [
#         OnGroundTeamRoles.REGISTRATION_TEAM.value,
#         OnGroundTeamRoles.CAMP_COORDINATOR.value,
#         "SCHOOL_ADMIN",
#         "TEACHER"
#     ]
#     creator_role = current_user["user_role"]
#     if creator_role not in allowed_roles:
#         resp = StandardResponse(
#             status=False,
#             message=f"{creator_role} is not allowed to update attendance records.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

#     school = await Schools.get_or_none(school_id=school_id)
#     if not school:
#         resp = StandardResponse(
#             status=False,
#             message="School not found.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     attendance_record = await AttendanceStatus.get_or_none(id=attendance_id, student__school_students__school_id=school_id)
#     if not attendance_record:
#         resp = StandardResponse(
#             status=False,
#             message="Attendance record not found.",
#             data={},
#             errors={}
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

#     # Update the attendance_status directly and save
#     attendance_record.attendance_status = attendance_data.get("attendance_status")
#     attendance_record.updated_by = current_user["user_id"]
#     attendance_record.updated_role = current_user["user_role"]
#     attendance_record.updated_role_type = current_user["role_type"]
#     await attendance_record.save()

#     updated_record = await AttendanceStatus.get(id=attendance_id)
#     response_data = {
#         "id": updated_record.id,
#         "student_id": updated_record.student_id,
#         "attendance_status": updated_record.attendance_status,
#     }

#     resp = StandardResponse(
#         status=True,
#         message="Attendance status updated successfully.",
#         data=response_data,
#         errors={}
#     )
#     return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

@router.put("/{school_id}/attendance/{student_id}", response_model=StandardResponse)
async def update_attendance_status(
    school_id: int,
    student_id: int,
    current_user: dict = Depends(get_current_user),
    attendance_data: dict = Body(..., example={"attendance_status": True}),
):
    allowed_roles = [
        OnGroundTeamRoles.REGISTRATION_TEAM.value,
        OnGroundTeamRoles.CAMP_COORDINATOR.value,
        "SCHOOL_ADMIN",
        "TEACHER"
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed to update attendance records.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    school = await Schools.get_or_none(school_id=school_id)
    if not school:
        resp = StandardResponse(
            status=False,
            message="School not found.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Verify student exists and is associated with the school
    student = await Students.get_or_none(
        id=student_id,
        school_students__school_id=school_id
    )
    if not student:
        resp = StandardResponse(
            status=False,
            message="Student not found or not associated with the specified school.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    # Check for existing attendance record for today
    today = datetime.now().strftime("%Y-%m-%d")
    attendance_record = await AttendanceStatus.get_or_none(
        student_id=student_id,
        school_id=school_id,
        date=today
    )

    user_id = current_user.get("user_id")
    # Fetch user assignment to get class and section
    assignment = await AssignSchool.filter(
        user_id=user_id,
        school=school_id
    ).first()

    if not assignment:
        resp = StandardResponse(
            status=False,
            message="No assignment found for the user at this school.",
            data={},
            errors={}
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_404_NOT_FOUND)

    if attendance_record:
        # Update existing record
        attendance_record.attendance_status = attendance_data.get("attendance_status")
        attendance_record.updated_by = user_id
        attendance_record.updated_role = current_user["user_role"]
        attendance_record.updated_role_type = current_user["role_type"]
        await attendance_record.save()
    else:
        # Create new attendance record
        attendance_record = await AttendanceStatus.create(
            student=student,
            attendance_status=attendance_data.get("attendance_status"),
            date=today,
            user_id=user_id,
            role=assignment.team_role,
            role_type="ON_GROUND_TEAM",
            school_id=school_id,
            class_name=assignment.class_no,
            section=assignment.section
        )

    response_data = {
        "id": attendance_record.id,
        "student_id": attendance_record.student_id,
        "attendance_status": attendance_record.attendance_status,
    }

    resp = StandardResponse(
        status=True,
        message="Attendance status updated successfully.",
        data=response_data,
        errors={}
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)
