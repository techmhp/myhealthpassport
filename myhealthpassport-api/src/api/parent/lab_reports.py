from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Path
from src.models.other_models import StudentLabTestReports, LabTests
from src.models.student_models import Students
from src.core.manager import get_current_user
from src.core.file_manager import save_uploaded_file
from tortoise.exceptions import DoesNotExist
from src.schemas.other_schema import StudentLabTestReportsResponse
from . import router

@router.post("/lab-reports/upload")
async def upload_lab_test_report(
    student_id: int = Form(...),
    test_id: int = Form(...),
    price: float = Form(...),
    note: str = Form(""),
    status: bool = Form(True),
    pdf_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    
    student = await Students.get_or_none(id=student_id)
    test = await LabTests.get_or_none(test_id=test_id)

    if not student or not test:
        raise HTTPException(status_code=404, detail="Student or Lab Test not found")

    file_path = await save_uploaded_file(pdf_file, folder="lab_reports")

    report = await StudentLabTestReports.create(
        student=student,
        test=test,
        file_path=file_path,
        price=price,
        note=note,
        status=status,
        created_by=current_user["user_id"],
        created_user_role=current_user["user_role"],
        created_role_type=current_user["role_type"],
    )

    return {"message": "Lab report uploaded", "report_id": report.slt_id}

@router.get("/lab-reports/student/{student_id}", response_model=list[StudentLabTestReportsResponse])
async def get_student_lab_reports(
    student_id: int = Path(...),
    current_user: dict = Depends(get_current_user)
):
    reports = await StudentLabTestReports.filter(
        student_id=student_id,
        is_deleted=False
    ).prefetch_related("test")

    if not reports:
        raise HTTPException(status_code=404, detail="No lab reports found for this student")

    return [
        StudentLabTestReportOut(
            slt_id=r.slt_id,
            student_id=r.student_id,
            test_id=r.test.test_id,
            test_name=r.test.test_name,
            file_path=r.file_path,
            price=r.price,
            note=r.note,
            status=r.status,
            created_at=r.created_at
        )
        for r in reports
    ]