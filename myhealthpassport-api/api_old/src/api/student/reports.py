from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse  
from tortoise.contrib.fastapi import register_tortoise
from tortoise import Tortoise
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from . import router
from src.models.screening_models import (
    NutritionScreening, BehaviouralScreening, DentalScreening, EyeScreening
)
from src.models.student_models import Students

class ScreeningSummary(BaseModel):
    student_id: str
    student_name: str
    behavioural: Optional[dict] = None
    dental: Optional[dict] = None
    eye: Optional[dict] = None
    nutrition: Optional[dict] = None
    physical: Optional[dict] = None

@router.get("/student-report/{student_id}")
async def get_student_report(student_id: int):
    try:
        # Fetch student details
        student = await Students.filter(id=student_id).first()
        if not student:
            return JSONResponse(status_code=404, content={"detail": "Student not found"})

        # Combine full name
        full_name = " ".join(filter(None, [student.first_name, student.middle_name, student.last_name]))

    
        behavioural = await BehaviouralScreening.filter(student_id=student_id).first()
        dental = await DentalScreening.filter(student_id=student_id).first()
        eye = await EyeScreening.filter(student_id=student_id).first()
        nutrition = await NutritionScreening.filter(student_id=student_id).first()


        summary = ScreeningSummary(
        student_id=str(student.id),
        student_name=full_name,
        behavioural={
            "report_summary": behavioural.note if behavioural else "Static summary",
            "status": "Normal"
        },
        dental={
            "report_summary": dental.report_summary if dental else "Static summary",
            "status": "Normal"
        },
        eye={
            "report_summary": eye.report_summary if eye else "Static summary",
            "status": "Normal"
        },
        nutrition={
            "report_summary": nutrition.note if nutrition else "Static summary",
            "status": "Normal"
        },
        physical={
            "report_summary": "Static summary",
            "status": "Normal"
        }
    )


        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "data": summary.dict(exclude_unset=True)
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error fetching report: {str(e)}"}
        )
