from fastapi import APIRouter, Depends, Query, Form  # ✅ Added Form
from fastapi.responses import JSONResponse
from passlib.context import CryptContext

from src.api.auth import get_current_user
from src.models.user_models import ConsultantTeam
from src.schemas.doctor_schema import DoctorListResponse

router = APIRouter()

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


@router.post("/doctors", summary="Add new doctor")
async def create_doctor(
    first_name: str = Form(...),
    last_name: str = Form(...),
    phone: str = Form(...),
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    specialty: str = Form(...),
    ):
    existing = await ConsultantTeam.filter(phone=phone).first()
    if existing:
        return JSONResponse(
            status_code=200,  # Keeping original status code
            content={
                "status": False,
                "message": "Doctor already exists with this phone number",
            },
        )

    hashed_password = get_password_hash(password)

    new_doc = await ConsultantTeam.create(
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        username=username,
        email=email,
        password=hashed_password,
        specialty=specialty,
        availability="Available",
        status=True,
    )

    return {
        "status": True,
        "message": "Doctor added successfully",
        "doctor_id": new_doc.doctor_id,
    }


@router.get(
     "/fetch/doctors",
     response_model=DoctorListResponse,
     summary="Fetch doctors by specialty",
 )
async def fetch_doctors_by_specialty(
     specialty: str = Query(..., description="Doctor's specialty"),
     current_user=Depends(get_current_user),
 ):
     doctors = await users_consultant.filter(specialty=specialty).all()

     if not doctors:
         return JSONResponse(
             status_code=404,
             content={
                 "status": False,
                 "message": "No doctors found with the specified specialty",
             },
         )

     return {"doctors": doctors}

@router.get(
    "/fetch/doctors",
    response_model=DoctorListResponse,
    summary="Fetch doctors by specialty",
)
async def fetch_doctors_by_specialty(
    specialty: str = Query(..., description="Doctor's specialty"),
    current_user=Depends(get_current_user),
):
    doctors = await ConsultantTeam.filter(specialty=specialty, availability="Available").all()

    if not doctors:
        return JSONResponse(
            status_code=404,
            content={
                "status": False,
                "message": "No doctors found with the specified specialty",
            },
        )

    return {"doctors": doctors}
