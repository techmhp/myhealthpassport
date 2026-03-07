from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/school", tags=["school"])


from .routes import imports_exports, schools, students, teacher, assign_school, smart_scale, events, staff, student_verification, attendance_status_onground

