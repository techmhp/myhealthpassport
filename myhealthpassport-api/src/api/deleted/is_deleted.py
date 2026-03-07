from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import datetime
from src.core.manager import get_current_user
from src.models.school_models import Schools
from src.models.student_models import Students, ParentChildren, SchoolStudents
from src.models.user_models import SchoolStaff, Parents
from . import router
 
ALLOWED_DELETE_ROLES = {"SUPER_ADMIN", "PROGRAM_COORDINATOR"}

@router.delete("/delete", tags=["Delete"])
async def delete_entity(
    school_id: int = None,
    student_id: int = None,
    staff_id: int = None,
    parent_id: int = None,
    current_user=Depends(get_current_user),
):
    if current_user["user_role"] not in ALLOWED_DELETE_ROLES:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "You are not authorized to perform this action."}
        )

    deleted_by = current_user["user_id"]
    deleted_user_role = current_user["user_role"]
    deleted_at = datetime.utcnow()

    if school_id:
        school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
        if not school:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "School not found or already deleted."}
            )
        school.is_deleted = True
        school.deleted_by = deleted_by
        school.deleted_user_role = deleted_user_role
        school.deleted_at = deleted_at
        await school.save()
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": True,
                "message": "School soft-deleted successfully.",
                "data": {"school_id": school_id},
                "errors": {}
            }
        )

    if student_id:
        student = await Students.get_or_none(id=student_id, is_deleted=False)
        if not student:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Student not found or already deleted."}
            )
        student.is_deleted = True
        student.deleted_by = deleted_by
        student.deleted_user_role = deleted_user_role
        student.deleted_at = deleted_at
        await student.save()
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": True,
                "message": "Student soft-deleted successfully.",
                "data": {"student_id": student_id},
                "errors": {}
            }
        )

    if staff_id:
        staff = await SchoolStaff.get_or_none(id=staff_id, is_deleted=False)
        if not staff:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "School staff not found or already deleted."}
            )
        staff.is_deleted = True
        staff.deleted_by = deleted_by
        staff.deleted_user_role = deleted_user_role
        staff.deleted_at = deleted_at
        await staff.save()
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": True,
                "message": "School staff soft-deleted successfully.",
                "data": {"staff_id": staff_id},
                "errors": {}
            }
        )

    if parent_id:
        parent = await Parents.get_or_none(id=parent_id, is_deleted=False)
        if not parent:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Parent not found or already deleted."}
            )
        parent.is_deleted = True
        parent.deleted_by = deleted_by
        parent.deleted_user_role = deleted_user_role
        parent.deleted_at = deleted_at
        await parent.save()
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": True,
                "message": "Parent soft-deleted successfully.",
                "data": {"parent_id": parent_id},
                "errors": {}
            }
        )

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": "No valid ID provided for deletion. Please provide one of school_id, student_id, staff_id, or parent_id."}
    )
