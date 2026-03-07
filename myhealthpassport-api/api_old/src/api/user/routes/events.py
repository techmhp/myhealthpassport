from fastapi import Depends, status
from fastapi.responses import JSONResponse
from datetime import datetime
import pytz

from src.models.school_models import AssignSchool, Schools
from src.core.manager import get_current_user
from src.utils.response import StandardResponse

from src.models.user_models import (
    ScreeningTeamRoles,
    OnGroundTeamRoles,
    AnalystRoles,
    SchoolRoles,
    ConsultantRoles,
    ParentRoles,
    AdminTeamRoles
)
from src.models.consultation_models import Consultations
from src.models.other_models import LabTestBookings
from src.models.student_models import Students
from datetime import datetime, date, timedelta, time  # Add time import
import pytz
from .. import router


# @router.get("/events", response_model=StandardResponse)
# async def get_screening_team_events(current_user=Depends(get_current_user)):

#     try:
#         # allow 3 teams to use this api
#         allowed_roles = [
#             ScreeningTeamRoles.PHYSICAL_WELLBEING,
#             ScreeningTeamRoles.DENTIST,
#             ScreeningTeamRoles.EYE_SPECIALIST,
#             ScreeningTeamRoles.NUTRITIONIST,
#             ScreeningTeamRoles.PSYCHOLOGIST,
#             ScreeningTeamRoles.NUTRITIONIST,
#             AnalystRoles.NUTRITIONIST,
#             AnalystRoles.PSYCHOLOGIST,
#             AnalystRoles.MEDICAL_OFFICER,
#             OnGroundTeamRoles.REGISTRATION_TEAM,
#             OnGroundTeamRoles.CAMP_COORDINATOR,
#             ConsultantRoles.PEDIATRICIAN,
#             ConsultantRoles.DENTIST,
#             ConsultantRoles.EYE_SPECIALIST,
#             ConsultantRoles.NUTRITIONIST,
#             ConsultantRoles.PSYCHOLOGIST,
#         ]

#         creator_role = current_user["user_role"]
#         if creator_role not in allowed_roles:
#             resp = StandardResponse(
#                 status=False,
#                 message=f"{creator_role} is not allowed to Fetch records.",
#                 data={},
#                 errors={},
#             )
#             return JSONResponse(
#                 content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN
#             )

#         utc = pytz.UTC
#         today = datetime.now(utc).date()

#         # Get own school details
#         assignments = await AssignSchool.filter(
#             user_id=current_user["user_id"], team_type=current_user["role_type"]
#         ).order_by("date")

#         today_events = []
#         upcoming_events = []

#         for assignment in assignments:
#             assignment_date = assignment.date

#             if assignment_date < today:
#                 continue

#             # Fetch related school
#             school = await Schools.get_or_none(school_id=assignment.school)

#             event_data = {
#                 "assignment_id": assignment.id,
#                 "school_name": school.school_name if school else "",
#                 "school_id": school.school_id if school else None,
#                 "class_name": assignment.class_no,
#                 "section": assignment.section,
#                 "date": assignment.date.strftime("%Y-%m-%d %H:%M:%S"),
#                 "from_time": assignment.from_time,
#                 "to_time": assignment.to_time,
#                 "team_role": assignment.team_role,
#             }

#             if assignment_date == today:
#                 today_events.append(event_data)
#             else:
#                 upcoming_events.append(event_data)

#         user_profile = {
#             "first_name": current_user.get("first_name", ""),
#             "last_name": current_user.get("last_name", ""),
#             "middle_name": current_user.get("middle_name", ""),
#             "gender": current_user.get("gender", ""),
#             "age": current_user.get("age", ""),
#             "role": current_user.get("role_type", ""),
#         }

#         resp = StandardResponse(
#             status=True,
#             message="Screening events fetched successfully",
#             data={
#                 "today_events": today_events,
#                 "upcoming_events": upcoming_events,
#                 "user_profile": user_profile,
#             },
#             errors={},
#         )
#         return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

#     except Exception as e:
#         return JSONResponse(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             content=StandardResponse(
#                 status=False,
#                 message="Failed to fetch events",
#                 data={},
#                 errors={"exception": str(e)},
#             ).__dict__,
#         )

from datetime import datetime, date, timedelta, time
import pytz

@router.get("/events", response_model=StandardResponse)
async def get_screening_team_events(current_user=Depends(get_current_user)):
    try:
        allowed_roles = [
            ScreeningTeamRoles.PHYSICAL_WELLBEING,
            ScreeningTeamRoles.DENTIST,
            SchoolRoles.SCHOOL_ADMIN,
            ScreeningTeamRoles.EYE_SPECIALIST,
            ScreeningTeamRoles.NUTRITIONIST,
            ScreeningTeamRoles.PSYCHOLOGIST,
            AnalystRoles.NUTRITIONIST,
            AnalystRoles.PSYCHOLOGIST,
            AnalystRoles.MEDICAL_OFFICER,
            OnGroundTeamRoles.REGISTRATION_TEAM,
            OnGroundTeamRoles.CAMP_COORDINATOR,
            ConsultantRoles.PEDIATRICIAN,
            ConsultantRoles.DENTIST,
            ConsultantRoles.EYE_SPECIALIST,
            ConsultantRoles.NUTRITIONIST,
            ConsultantRoles.PSYCHOLOGIST,
            ParentRoles.PARENT,
            
            AdminTeamRoles.HEALTH_BUDDY,
        ]

        creator_role = current_user["user_role"]
        if creator_role not in allowed_roles:
            resp = StandardResponse(
                status=False,
                message=f"{creator_role} is not allowed to Fetch records.",
                data={},
                errors={},
            )
            return JSONResponse(
                content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN
            )

        ist = pytz.timezone("Asia/Kolkata")
        today = datetime.now(ist).date()

        # Initialize event lists
        today_events = []
        upcoming_events = []

        # Helper function to get student details
        async def get_student_data(student_id):
            student = await Students.get_or_none(id=student_id, is_deleted=False)
            if student:
                return {
                    "id": student.id,
                    "student_name": " ".join(filter(None, [student.first_name, student.middle_name, student.last_name]))
                }
            return None

        # 1. Fetch screening assignments
        assignments = await AssignSchool.filter(
            user_id=current_user["user_id"], team_type=current_user["role_type"]
        ).order_by("date")

        for assignment in assignments:
            assignment_date = assignment.date
            if assignment_date < today:
                continue

            school = await Schools.get_or_none(school_id=assignment.school)
            # For screening events, include student details only if a single student is targeted
            # Since AssignSchool applies to class/section, we can pick one student or omit student details
            students = await Students.filter(
                class_room=assignment.class_no,
                section=assignment.section,
                is_deleted=False
            ).first()  # Get first student for simplicity
            student_data = await get_student_data(students.id) if students else None

            event_data = {
                "assignment_id": assignment.id,
                "school_name": school.school_name if school else "",
                "school_id": school.school_id if school else None,
                "class_name": assignment.class_no,
                "section": assignment.section,
                "slot_date": assignment.date.strftime("%Y-%m-%d"),
                "slot_time": str(assignment.from_time)[:5],  # Format as HH:MM
                "team_role": assignment.team_role,
                "type": "Screening"
            }
            # Include student details only if available
            if student_data:
                event_data["student_id"] = student_data["id"]
                event_data["student_name"] = student_data["student_name"]

            if assignment_date == today:
                today_events.append(event_data)
            else:
                upcoming_events.append(event_data)

        # 2. Fetch consultations (for parents or doctors)
        consultations = []
        if creator_role == ParentRoles.PARENT:
            children = await ParentChildren.filter(
                parent_id=current_user["user_id"], is_deleted=False
            ).values_list("student_id", flat=True)
            consultations = await Consultations.filter(
                patient_id__in=children,
                is_deleted=False,
                slot_date__gte=today
            ).select_related("doctor").all()
        elif creator_role in [ConsultantRoles.PEDIATRICIAN, ConsultantRoles.DENTIST, 
                             ConsultantRoles.EYE_SPECIALIST, ConsultantRoles.NUTRITIONIST, 
                             ConsultantRoles.PSYCHOLOGIST]:
            consultations = await Consultations.filter(
                doctor_id=current_user["user_id"],
                is_deleted=False,
                slot_date__gte=today
            ).select_related("doctor").all()

        for consultation in consultations:
            student_data = await get_student_data(consultation.patient_id)
            slot_time_str = (
                consultation.slot_time.strftime("%H:%M") 
                if isinstance(consultation.slot_time, time) 
                else str(consultation.slot_time)[:5]
            )
            event_data = {
                "consultation_id": consultation.consult_id,
                "slot_date": consultation.slot_date.strftime("%Y-%m-%d"),
                "slot_time": slot_time_str,
                "consult_fee": float(consultation.consult_fee),
                "booking_status": consultation.booking_status,
                "type": "Consultation"
            }
            if student_data:
                event_data["student_id"] = student_data["id"]
                event_data["student_name"] = student_data["student_name"]

            if consultation.slot_date == today:
                today_events.append(event_data)
            else:
                upcoming_events.append(event_data)

        # 3. Fetch lab test bookings (for parents or doctors)
        lab_test_bookings = []
        if creator_role == ParentRoles.PARENT:
            children = await ParentChildren.filter(
                parent_id=current_user["user_id"], is_deleted=False
            ).values_list("student_id", flat=True)
            lab_test_bookings = await LabTestBookings.filter(
                patient_id__in=children,
                is_deleted=False,
                slot_date__gte=today
            ).select_related("doctor", "test").all()
        elif creator_role in [AnalystRoles.NUTRITIONIST, AnalystRoles.PSYCHOLOGIST, AnalystRoles.MEDICAL_OFFICER]:
            lab_test_bookings = await LabTestBookings.filter(
                doctor_id=current_user["user_id"],
                is_deleted=False,
                slot_date__gte=today
            ).select_related("doctor", "test").all()

        for booking in lab_test_bookings:
            student_data = await get_student_data(booking.patient_id)
            slot_time_str = (
                booking.slot_time.strftime("%H:%M") 
                if isinstance(booking.slot_time, time) 
                else str(booking.slot_time)[:5]
            )
            event_data = {
                "booking_id": booking.booking_id,
                "test_name": booking.test.test_name if booking.test else None,
                "slot_date": booking.slot_date.strftime("%Y-%m-%d"),
                "slot_time": slot_time_str,
                "consult_fee": float(booking.consult_fee),
                "booking_status": booking.booking_status,
                "type": "LabTest"
            }
            if student_data:
                event_data["student_id"] = student_data["id"]
                event_data["student_name"] = student_data["student_name"]

            if booking.slot_date == today:
                today_events.append(event_data)
            else:
                upcoming_events.append(event_data)

        user_profile = {
            "first_name": current_user.get("first_name", ""),
            "last_name": current_user.get("last_name", ""),
            "middle_name": current_user.get("middle_name", ""),
            "gender": current_user.get("gender", ""),
            "age": current_user.get("age", ""),
            "role": current_user.get("role_type", ""),
        }

        resp = StandardResponse(
            status=True,
            message="Events fetched successfully",
            data={
                "today_events": today_events,
                "upcoming_events": upcoming_events,
                "user_profile": user_profile,
            },
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=StandardResponse(
                status=False,
                message="Failed to fetch events",
                data={},
                errors={"exception": str(e)},
            ).__dict__,
        )
        