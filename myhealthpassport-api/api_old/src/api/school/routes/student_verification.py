from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse
from typing import Optional
from pydantic import BaseModel
from src.models.student_models import SchoolStudents
from src.schemas.student_schema import StudentListResponse  
from src.utils.response import StandardResponse 
from .. import router
from datetime import date

@router.get("/students/list", response_model=StandardResponse)
async def get_students_list(
    school_id: int = Query(...),
    class_room: Optional[str] = Query(None),
    section: Optional[str] = Query(None)
):
    try:
        
        school_students = await SchoolStudents.filter(
            school__school_id=school_id
        ).prefetch_related("student")

        result = []

        for ss in school_students:
            student = ss.student

            if class_room and student.class_room != class_room:
                continue
            if section and student.section != section:
                continue

            #combining first,mid,last names
            full_name = " ".join(filter(None, [student.first_name, student.middle_name, student.last_name]))

            #calculating age
            today = date.today()
            dob = student.dob
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

            
            screening_status = "True" if ss.status else "False"

            #Gender mapping
            gender_map = {
                "m": "Male",
                "f": "Female"
            }
            gender = gender_map.get(student.gender.lower(), student.gender)

            
            result.append(StudentListResponse(
                student_id=student.id,
                full_name=full_name,
                class_room=student.class_room,
                section=student.section,
                gender=gender,
                age=age,
                phone=student.phone,
                screening_status=screening_status
                
            ))

        
        result.sort(key=lambda s: s.student_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=StandardResponse(
                status=True,
                message="Student list fetched successfully",
                data={"students": [s.dict() for s in result]},
                errors={}
            ).__dict__,
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=StandardResponse(
                status=False,
                message="Error while fetching Students.",
                data={},
                errors={"exception": str(e)},
            ).__dict__,
        )

class VerifyStudentPayload(BaseModel):
    status: bool


@router.put("/students/verify", response_model=StandardResponse)
async def verify_student(
    student_id: int = Query(..., description="Student ID to verify"),
    school_id: int = Query(..., description="School ID for context"),
    payload: VerifyStudentPayload = None
):
    record = await SchoolStudents.get_or_none(student__id=student_id, school__school_id=school_id)
    if not record:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=StandardResponse(
                status=False,
                message="Student not found for this school",
                data={},
                errors={"exception": str(e)},
            ).__dict__,
        )

    record.status = payload.status
    record.updated_by = str(current_user["user_id"])
    record.updated_user_role = str(current_user["user_role"])
    record.updated_role_type = str(current_user["role_type"])

    await record.save()

    status_text = "verified" if payload.status else "unverified"

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=StandardResponse(
            status=True,
            message=f"Students marked as {status_text}",
            data={
                "student_id": student_id,
                "status": payload.status,
            },
            errors={}
        ).__dict__,
    )
