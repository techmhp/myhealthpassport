from tortoise.expressions import Q
from typing import Optional, Any, List
from datetime import datetime, date
from fastapi import Depends, HTTPException, Form, Query, status, UploadFile, File,Path  
import json
from passlib.context import CryptContext
from fastapi.responses import JSONResponse
from tortoise.exceptions import DoesNotExist
from src.models.consultation_models import Consultations,DentalReport, EyeReport, PsychologistReport,PediatricianReport
from src.core.manager import get_current_user
from src.models.user_models import ConsultantTeam, Parents
from src.models.user_models import AdminTeamRoles,ConsultantRoles, ParentRoles
from src.schemas.doctor_schema import DoctorCreateRequest, DoctorUpdateRequest, DoctorListResponse
from src.api.user.schema import ExpertUserUpdateSchema, ExpertUserCreateSchema
from src.core.file_manager import save_base64_image, save_uploaded_file, get_new_url
from src.api.doctor import router
from src.utils.response import StandardResponse
from src.models.student_models import ParentChildren, Students
from src.models.screening_models import DentalScreening, EyeScreening, BehaviouralScreening
import base64
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
DOCTOR_IMAGES_DIR = "uploads/doctor_images"


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# @router.post("/create-doctors", summary="Add new doctor", response_model=StandardResponse)
# async def create_doctor_json(
#     doctor_payload: ExpertUserCreateSchema,
#     current_user: dict = Depends(get_current_user),
# ):
#     try:
#         user_role_enum = AdminTeamRoles(current_user["user_role"])
#         if user_role_enum != AdminTeamRoles.SUPER_ADMIN:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message="Only SUPER_ADMIN can create doctors",
#                     data={},
#                     errors={},
#                 ).__dict__,
#                 status_code=status.HTTP_403_FORBIDDEN
#             )
#     except ValueError:
#         return JSONResponse(
#             content=StandardResponse(
#                 status=False,
#                 message="Invalid user role",
#                 data={},
#                 errors={},
#             ).__dict__,
#             status_code=status.HTTP_403_FORBIDDEN
#         )

#     # Check for existing phone, email, username
#     if await ConsultantTeam.filter(phone=doctor_payload.phone).exists():
#         return JSONResponse(
#             content=StandardResponse(
#                 status=False,
#                 message="Doctor already exists with this phone number",
#                 data={},
#                 errors={},
#             ).__dict__,
#             status_code=status.HTTP_400_BAD_REQUEST
#         )

#     if await ConsultantTeam.filter(username=doctor_payload.username).exists():
#         return JSONResponse(
#             content=StandardResponse(
#                 status=False,
#                 message="Username already taken",
#                 data={},
#                 errors={},
#             ).__dict__,
#             status_code=status.HTTP_400_BAD_REQUEST
#         )

#     if await ConsultantTeam.filter(email=doctor_payload.email).exists():
#         return JSONResponse(
#             content=StandardResponse(
#                 status=False,
#                 message="Email already in use",
#                 data={},
#                 errors={},
#             ).__dict__,
#             status_code=status.HTTP_400_BAD_REQUEST
#         )

    
#     image_key = ""
#     if doctor_payload.profile_image:
#         try:
#             image_key = await save_base64_image(
#                 base64_string=doctor_payload.profile_image,
#                 destination_folder=DOCTOR_IMAGES_DIR,
#                 user_role=current_user.get("user_role"),
#                 role_type=current_user.get("role_type"),
#                 return_key_only=True,
#             )
#         except Exception:
#             image_key = ""

#     hashed_password = get_password_hash(doctor_payload.password)
#     new_doc = await ConsultantTeam.create(
#         first_name=doctor_payload.first_name,
#         last_name=doctor_payload.last_name,
#         middle_name=doctor_payload.middle_name,
#         user_role=doctor_payload.user_role,
#         role_type= "CONSULTANT_TEAM",
#         clinic_name=doctor_payload.clinic_name,
#         education=doctor_payload.education,
#         specialty=doctor_payload.specialty,
#         experience=doctor_payload.experience,
#         location=doctor_payload.location,
#         state=doctor_payload.state,
#         country=doctor_payload.country,
#         pincode=doctor_payload.pincode,
#         phone=doctor_payload.phone,
#         email=doctor_payload.email,
#         dob=doctor_payload.dob,
#         gender=doctor_payload.gender,
#         address_line_1=doctor_payload.address_line_1,
#         address_line_2=doctor_payload.address_line_2,
#         landmark=doctor_payload.landmark,
#         street_name=doctor_payload.street_name,
#         country_calling_code=doctor_payload.country_calling_code,
#         username=doctor_payload.username,
#         password=hashed_password,
#         availability=doctor_payload.availability,
#         profile_image=image_key,
#         created_by=current_user["user_id"],     
#         created_user_role=current_user["user_role"],       
#         created_role_type=current_user["role_type"], 
#     )

#     response_data = {
#         "doctor_id": new_doc.id,
#         "first_name": new_doc.first_name,
#         "last_name": new_doc.last_name,
#         "middle_name": new_doc.middle_name,
#         "education": new_doc.education,
#         "specialty": new_doc.specialty,
#         "experience": new_doc.experience,
#         "location": new_doc.location,
#         "state": new_doc.state,
#         "clinic_name":new_doc.clinic_name,
#         "country": new_doc.country,
#         "pincode": new_doc.pincode,
#         "user_role": new_doc.user_role,
#         "role_type": new_doc.role_type,
#         "phone": new_doc.phone,
#         "email": new_doc.email,
#         "dob": str(new_doc.dob),
#         "gender": new_doc.gender,
#         "address_line_1": new_doc.address_line_1,
#         "address_line_2": new_doc.address_line_2,
#         "landmark": new_doc.landmark,
#         "street_name": new_doc.street_name,
#         "country_calling_code": new_doc.country_calling_code,
#         "username": new_doc.username,
#         "availability": new_doc.availability,
#         "profile_image_url": image_key,
#         "is_deleted": new_doc.is_deleted,
#         "status": getattr(new_doc, "status", True),
#     }

#     return JSONResponse(
#         content=StandardResponse(
#             status=True,
#             message="Doctor added successfully",
#             data=response_data,
#             errors={},
#         ).__dict__,
#         status_code=status.HTTP_201_CREATED
#     )

# @router.get("/doctors", summary="List doctors by specialty", response_model=StandardResponse)
# async def list_doctors_by_specialty(
#     specialty: Optional[str] = Query(None, description="Filter doctors by specialty"),
#     current_user: dict = Depends(get_current_user),
# ):
#     query = ConsultantTeam.all()
#     if specialty:
#         query = query.filter(specialty=specialty)

#     doctors = await query

#     results = []
#     for doctor in doctors:
#         image_url = await get_new_url(doctor.profile_image) if doctor.profile_image else ""
#         results.append ( {
#         "doctor_id": doctor.id,
#         "first_name": doctor.first_name,
#         "last_name": doctor.last_name,
#         "middle_name": doctor.middle_name,
#         "education": doctor.education,
#         "specialty": doctor.specialty,
#         "experience": doctor.experience,
#         "location": doctor.location,
#         "state": doctor.state,
#         "country": doctor.country,
#         "pincode": doctor.pincode,
#         "user_role": doctor.user_role,
#         "role_type": doctor.role_type,
#         "phone": doctor.phone,
#         "clinic_name": doctor.clinic_name,
#         "email": doctor.email,
#         "dob": str(doctor.dob),
#         "gender": doctor.gender,
#         "address_line_1": doctor.address_line_1,
#         "address_line_2": doctor.address_line_2,
#         "landmark": doctor.landmark,
#         "street_name": doctor.street_name,
#         "country_calling_code": doctor.country_calling_code,
#         "username": doctor.username,
#         "availability": doctor.availability,
#         "profile_image_url": image_url,
#         "is_deleted": doctor.is_deleted,
#         "status": getattr(doctor, "status", True),
#     })

#     return StandardResponse(
#         status=True,
#         message=f"Doctors fetched successfully{f' for specialty {specialty}' if specialty else ''}",
#         data={"doctors": results},
#         errors={},
#     )

# @router.put("/doctors/{doctor_id}", summary="Update doctor details", response_model=StandardResponse)
# async def update_doctor(
#     doctor_id: int,
#     doctor_payload: ExpertUserUpdateSchema,
#     current_user: dict = Depends(get_current_user),
# ):
#     try:
#         user_role_enum = AdminTeamRoles(current_user["user_role"])
#         if user_role_enum != AdminTeamRoles.SUPER_ADMIN:
#             return StandardResponse(
#                 status=False,
#                 message="Only SUPER_ADMIN can update doctors",
#                 data={},
#                 errors={},
#                 status_code=status.HTTP_403_FORBIDDEN
#             )
#     except ValueError:
#         return StandardResponse(
#             status=False,
#             message="Invalid user role",
#             data={},
#             errors={},
#             status_code=status.HTTP_403_FORBIDDEN
#         )

#     doctor = await ConsultantTeam.filter(id=doctor_id).first()
#     if not doctor:
#         return StandardResponse(
#             status=False,
#             message="Doctor not found",
#             data={},
#             errors={},
#             status_code=status.HTTP_404_NOT_FOUND
#         )

#     # Check for unique fields if provided and different from current values
#     if doctor_payload.phone and doctor_payload.phone != doctor.phone:
#         if await ConsultantTeam.filter(phone=doctor_payload.phone).exists():
#             return StandardResponse(
#                 status=False,
#                 message="Phone number already in use",
#                 data={},
#                 errors={},
#                 status_code=status.HTTP_400_BAD_REQUEST
#             )

#     if doctor_payload.email and doctor_payload.email != doctor.email:
#         if await ConsultantTeam.filter(email=doctor_payload.email).exists():
#             return StandardResponse(
#                 status=False,
#                 message="Email already in use",
#                 data={},
#                 errors={},
#                 status_code=status.HTTP_400_BAD_REQUEST
#             )

#     # Validate base64 profile image if provided
#     if doctor_payload.profile_image:
#         try:
#             base64.b64decode(doctor_payload.profile_image, validate=True)
#         except Exception as e:
#             return StandardResponse(
#                 status=False,
#                 message=f"Invalid base64 profile image: {str(e)}",
#                 data={},
#                 errors={},
#                 status_code=status.HTTP_400_BAD_REQUEST
#             )

#     # Update fields if provided in the payload, excluding username and password
#     if doctor_payload.first_name is not None:
#         doctor.first_name = doctor_payload.first_name
#     if doctor_payload.last_name is not None:
#         doctor.last_name = doctor_payload.last_name
#     if doctor_payload.middle_name is not None:
#         doctor.middle_name = doctor_payload.middle_name
#     if doctor_payload.education is not None:
#         doctor.education = doctor_payload.education
#     if doctor_payload.specialty is not None:
#         doctor.specialty = doctor_payload.specialty
#     # if doctor_payload.user_role is not None:
#     #     try:
#     #         ConsultantRoles(doctor_payload.user_role)
#     #         doctor.user_role = doctor_payload.user_role
#     #     except ValueError:
#     #         return StandardResponse(
#     #             status=False,
#     #             message="Invalid user role provided",
#     #             data={},
#     #             errors={},
#     #             status_code=status.HTTP_400_BAD_REQUEST
#     #         )
    
#     if doctor_payload.experience is not None:
#         doctor.experience = doctor_payload.experience
#     if doctor_payload.location is not None:
#         doctor.location = doctor_payload.location
#     if doctor_payload.state is not None:
#         doctor.state = doctor_payload.state
#     if doctor_payload.clinic_name is not None:
#         doctor.clinic_name = doctor_payload.clinic_name
#     if doctor_payload.country is not None:
#         doctor.country = doctor_payload.country
#     if doctor_payload.pincode is not None:
#         doctor.pincode = doctor_payload.pincode
#     if doctor_payload.phone is not None:
#         doctor.phone = doctor_payload.phone
#     if doctor_payload.email is not None:
#         doctor.email = doctor_payload.email
#     if doctor_payload.dob is not None:
#         doctor.dob = doctor_payload.dob
#     if doctor_payload.gender is not None:
#         doctor.gender = doctor_payload.gender
#     if doctor_payload.address_line_1 is not None:
#         doctor.address_line_1 = doctor_payload.address_line_1
#     if doctor_payload.address_line_2 is not None:
#         doctor.address_line_2 = doctor_payload.address_line_2
#     if doctor_payload.landmark is not None:
#         doctor.landmark = doctor_payload.landmark
#     if doctor_payload.street_name is not None:
#         doctor.street_name = doctor_payload.street_name
#     if doctor_payload.country_calling_code is not None:
#         doctor.country_calling_code = doctor_payload.country_calling_code
#     if doctor_payload.availability is not None:
#         doctor.availability = doctor_payload.availability

#     # Handle base64 profile image, preserving existing value if none provided
#     profile_image_store_path = doctor.profile_image  # Preserve existing image
#     if doctor_payload.profile_image:
#         try:
#             profile_image_store_path = await save_base64_image(
#                 base64_string=doctor_payload.profile_image,
#                 destination_folder=DOCTOR_IMAGES_DIR,
#                 user_role=current_user.get("user_role"),
#                 role_type=current_user.get("role_type"),
#                 return_key_only=True,
#             )
#             if not profile_image_store_path:
#                 print(f"Warning: Failed to save profile image for {doctor_payload.first_name} {doctor_payload.last_name}")
#                 profile_image_store_path = doctor.profile_image  # Revert to existing image
#         except Exception as upload_err:
#             return StandardResponse(
#                 status=False,
#                 message=f"Failed to process base64 profile image: {str(upload_err)}",
#                 data={},
#                 errors={},
#                 status_code=status.HTTP_400_BAD_REQUEST
#             )
#     doctor.profile_image = profile_image_store_path or ""  # Ensure non-None value

#     # Update audit fields
#     doctor.updated_by = current_user["user_id"]
#     doctor.updated_user_role = current_user["user_role"]
#     doctor.updated_role_type = current_user["role_type"]

#     await doctor.save()

#     # Generate response data
#     image_url = await get_new_url(doctor.profile_image) if doctor.profile_image else ""
#     response_data = {
#         "doctor_id": doctor.id,
#         "first_name": doctor.first_name,
#         "last_name": doctor.last_name,
#         "middle_name": doctor.middle_name,
#         "education": doctor.education,
#         "specialty": doctor.specialty,
#         "experience": doctor.experience,
#         "location": doctor.location,
#         "state": doctor.state,
#         "country": doctor.country,
#         "pincode": doctor.pincode,
#         "user_role": doctor.user_role,
#         "role_type": doctor.role_type,
#         "phone": doctor.phone,
#         "email": doctor.email,
#         "dob": str(doctor.dob) if doctor.dob else None,
#         "gender": doctor.gender,
#         "address_line_1": doctor.address_line_1,
#         "address_line_ personally identifiable information redacted_2": doctor.address_line_2,
#         "landmark": doctor.landmark,
#         "street_name": doctor.street_name,
#         "country_calling_code": doctor.country_calling_code,
#         "username": doctor.username,
#         "availability": doctor.availability,
#         "profile_image_url": image_url,
#         "is_deleted": doctor.is_deleted,
#         "status": getattr(doctor, "status", True),
#     }

#     return StandardResponse(
#         status=True,
#         message="Doctor updated successfully",
#         data=response_data,
#         errors={},
#         status_code=status.HTTP_200_OK
#     )

# @router.get("/screening/{student_id}/case-history", response_model=StandardResponse)
# async def get_student_case_history(
#     student_id: int,
#     current_user=Depends(get_current_user)
# ):
#     try:
#         # Verify student exists
#         student = await Students.get(id=student_id)  # <-- assign to 'student'
        
#         full_name = " ".join(filter(None, [student.first_name, student.middle_name, student.last_name]))
        
#         # Role → ScreeningType mapping
#         role_to_config = {
#             ConsultantRoles.DENTIST: {
#                 "model": DentalScreening,
#                 "label": "dental",
#                 "pk_field": "ds_id",
#                 "field_map": {
#                     "report_summary": "report_summary",
#                     "next_followup": "next_followup",
#                     "status": "status"
                    
#                 }
#             },
#             ConsultantRoles.EYE_SPECIALIST: {
#                 "model": EyeScreening,
#                 "label": "eye",
#                 "pk_field": "es_id",
#                 "field_map": {
                    
#                     "report_summary": "report_summary",
#                     "next_followup": "next_followup",
#                     "status": "status"
#                 }
#             },
#             ConsultantRoles.PSYCHOLOGIST: {
#                 "model": BehaviouralScreening,
#                 "label": "behavorial",
#                 "pk_field": "bs_id",
#                 "field_map": {
                    
#                     "report_summary": "note",   # behavioral special case
#                     "next_followup": "next_followup",
#                     "status": "screening_status"
#                 }
#             }
#         }

#         user_role = current_user["user_role"]

#         case_history = {}

#         # 🔹 Super Admin → fetch all screenings
#         if user_role == AdminTeamRoles.SUPER_ADMIN:
#             for role, config in role_to_config.items():
#                 reports = await config["model"].filter(student_id=student_id).order_by("-created_at")
#                 history = []
#                 for rpt in reports:
#                     history.append({
#                         "date": str(rpt.created_at.date()),
#                         "student_id": student.id,
#                         "student_name": full_name,
#                         "aadhaar_number": student.aadhaar_no,
#                         "report_summary": getattr(rpt, config["field_map"]["report_summary"]),
#                         "next_followup": getattr(rpt, config["field_map"]["next_followup"]),
#                         "status": getattr(rpt, config["field_map"]["status"]),
#                     })
#                 case_history[config["label"]] = history

#         # 🔹 Normal Consultant → fetch only their own screening
#         elif user_role in role_to_config:
#             config = role_to_config[user_role]
#             reports = await config["model"].filter(student_id=student_id).order_by("-created_at")
#             history = []
#             for rpt in reports:
#                 history.append({
#                     "report_id": getattr(rpt, config["pk_field"]),
#                     "date": str(rpt.created_at.date()),
#                     "student_id": student.id,
#                     "student_name": full_name,
#                     "aadhaar_number": student.aadhaar_no,
#                     "report_summary": getattr(rpt, config["field_map"]["report_summary"]),
#                     "next_followup": getattr(rpt, config["field_map"]["next_followup"]),
#                     "status": getattr(rpt, config["field_map"]["status"]),
#                 })
#             case_history[config["label"]] = history

#         else:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message=f"{user_role} is not allowed to view case history",
#                     data={},
#                     errors={}
#                 ).dict(),
#                 status_code=status.HTTP_403_FORBIDDEN
#             )

#         response = StandardResponse(
#             status=True,
#             message="Case history retrieved successfully",
#             data={
#                 "student_id": student.id,
#                 "student_name": full_name,
#                 "aadhaar_number": student.aadhaar_no,
#                 "case_history": case_history
#             }
#         )
#         return JSONResponse(content=response.dict(), status_code=status.HTTP_200_OK)


#     except DoesNotExist:
#         response = StandardResponse(
#             status=False,
#             message="Student not found",
#             errors={"not_found": f"Student with ID {student_id} does not exist"}
#         )
#         return JSONResponse(content=response.dict(), status_code=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         response = StandardResponse(
#             status=False,
#             message=f"Failed to fetch case history",
#             errors={"detail": str(e)}
#         )
#         return JSONResponse(content=response.dict(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.get("/screening/{student_id}/case-history", response_model=StandardResponse)
async def get_student_case_history(
    student_id: int,
    current_user=Depends(get_current_user)
):
    try:
        # Verify student exists
        student = await Students.get(id=student_id)
        full_name = " ".join(filter(None, [student.first_name, student.middle_name, student.last_name]))

        # Role → Model mapping
        role_to_config = {
            ConsultantRoles.DENTIST: {
                "model": DentalReport,
                "label": "dental",
                "pk_field": "dr_id",
                "field_map": {
                    "report_summary": "diagnosis",
                    "next_followup": "next_followup",
                    "status": None
                }
            },
            ConsultantRoles.EYE_SPECIALIST: {
                "model": EyeReport,
                "label": "eye",
                "pk_field": "er_id",
                "field_map": {
                    "report_summary": "additional_findings",
                    "next_followup": "next_followup",
                    "status": None
                }
            },
            ConsultantRoles.PSYCHOLOGIST: {
                "model": PsychologistReport,
                "label": "behavioral",
                "pk_field": "pr_id",
                "field_map": {
                    "report_summary": "findings",
                    "next_followup": "next_followup",
                    "status": None
                }
            },
            ConsultantRoles.PEDIATRICIAN: {
                "model": PediatricianReport,
                "label": "pediatric",
                "pk_field": "pdr_id",
                "field_map": {
                    "report_summary": "findings",
                    "next_followup": "next_followup",
                    "status": None
                }
            }
        }

        user_role = current_user["user_role"]
        case_history = {}

        def build_history_entry(rpt, config, student_id, full_name, student_aadhaar):
            """Helper to build consistent history entry with JSON parsing"""
            report_summary_field = config["field_map"].get("report_summary")
            report_summary = getattr(rpt, report_summary_field, None) if report_summary_field else None
            if isinstance(report_summary, str):
                try:
                    report_summary = json.loads(report_summary)
                except json.JSONDecodeError:
                    pass

            next_followup_field = config["field_map"].get("next_followup")
            next_followup = getattr(rpt, next_followup_field, None) if next_followup_field else None
            if isinstance(next_followup, str):
                try:
                    next_followup = json.loads(next_followup)
                except json.JSONDecodeError:
                    pass
            elif next_followup and hasattr(next_followup, 'isoformat'):
                next_followup = str(next_followup)

            status_field = config["field_map"].get("status")
            status = getattr(rpt, status_field, None) if status_field else None

            return {
                "report_id": getattr(rpt, config["pk_field"], None),
                "date": str(rpt.created_at.date()),
                "student_id": student_id,
                "student_name": full_name,
                "aadhaar_number": student_aadhaar,
                "report_summary": report_summary,
                "next_followup": next_followup,
                "status": status,
                "role": getattr(rpt, "created_user_role", None)
            }

        # 🔹 Super Admin → fetch all screenings and include all labels
        if user_role == AdminTeamRoles.SUPER_ADMIN:
            for _, config in role_to_config.items():
                reports = await config["model"].filter(
                    student_id=student_id,
                    is_deleted=False
                ).order_by("-created_at")
                print(f"DEBUG: {config['model'].__name__} records fetched: {len(reports)}")
                history = [build_history_entry(rpt, config, student.id, full_name, student.aadhaar_no) for rpt in reports]
                case_history[config["label"]] = history  # Include all labels (dental, eye, etc.)

        # 🔹 Normal Consultant → fetch only their own screening, no label key
        elif user_role in role_to_config:
            config = role_to_config[user_role]
            reports = await config["model"].filter(
                student_id=student_id,
                is_deleted=False
            ).order_by("-created_at")
            print(f"DEBUG: {config['model'].__name__} records fetched: {len(reports)}")
            case_history = [build_history_entry(rpt, config, student.id, full_name, student.aadhaar_no) for rpt in reports]  # Direct list, no label

        else:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message=f"{user_role} is not allowed to view case history",
                    data={},
                    errors={}
                ).dict(),
                status_code=status.HTTP_403_FORBIDDEN
            )

        # Check if case_history is empty
        if not case_history:
            response = StandardResponse(
                status=False,
                message="No case history found for this student",
                data={
                    "student_id": student.id,
                    "student_name": full_name,
                    "aadhaar_number": student.aadhaar_no,
                    "case_history": case_history
                },
                errors={}
            )
            return JSONResponse(content=response.dict(), status_code=status.HTTP_200_OK)

        response = StandardResponse(
            status=True,
            message="Case history retrieved successfully",
            data={
                "student_id": student.id,
                "student_name": full_name,
                "aadhaar_number": student.aadhaar_no,
                "case_history": case_history
            }
        )
        return JSONResponse(content=response.dict(), status_code=status.HTTP_200_OK)

    except DoesNotExist:
        response = StandardResponse(
            status=False,
            message="Student not found",
            errors={"not_found": f"Student with ID {student_id} does not exist"}
        )
        return JSONResponse(content=response.dict(), status_code=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to fetch case history",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@router.get("/screening/{student_id}/case-history", response_model=StandardResponse)
async def get_student_case_history(
    student_id: int,
    current_user=Depends(get_current_user)
):
    try:
        # Verify student exists
        student = await Students.get(id=student_id)
        full_name = " ".join(filter(None, [student.first_name, student.middle_name, student.last_name]))

        # Role → Model mapping
        role_to_config = {
            ConsultantRoles.DENTIST: {
                "model": DentalReport,
                "label": "dental",
                "pk_field": "dr_id",
                "field_map": {
                    "report_summary": "diagnosis",
                    "next_followup": "next_followup",
                    "status": None
                }
            },
            ConsultantRoles.EYE_SPECIALIST: {
                "model": EyeReport,
                "label": "eye",
                "pk_field": "er_id",
                "field_map": {
                    "report_summary": "additional_findings",
                    "next_followup": "next_followup",
                    "status": None
                }
            },
            ConsultantRoles.PSYCHOLOGIST: {
                "model": PsychologistReport,
                "label": "behavioral",
                "pk_field": "pr_id",
                "field_map": {
                    "report_summary": "findings",
                    "next_followup": "next_followup",
                    "status": None
                }
            },
            ConsultantRoles.PEDIATRICIAN: {
                "model": PediatricianReport,
                "label": "pediatric",
                "pk_field": "pdr_id",
                "field_map": {
                    "report_summary": "findings",
                    "next_followup": "next_followup",
                    "status": None
                }
            }
        }

        user_role = current_user["user_role"]
        case_history = {}

        def build_history_entry(rpt, config, student_id, full_name, student_aadhaar):
            """Helper to build consistent history entry with JSON parsing"""
            report_summary_field = config["field_map"].get("report_summary")
            report_summary = getattr(rpt, report_summary_field, None) if report_summary_field else None
            if isinstance(report_summary, str):
                try:
                    report_summary = json.loads(report_summary)
                except json.JSONDecodeError:
                    pass

            next_followup_field = config["field_map"].get("next_followup")
            next_followup = getattr(rpt, next_followup_field, None) if next_followup_field else None
            if isinstance(next_followup, str):
                try:
                    next_followup = json.loads(next_followup)
                except json.JSONDecodeError:
                    pass
            elif next_followup and hasattr(next_followup, 'isoformat'):
                next_followup = str(next_followup)

            status_field = config["field_map"].get("status")
            status = getattr(rpt, status_field, None) if status_field else None

            return {
                "report_id": getattr(rpt, config["pk_field"], None),
                "date": str(rpt.created_at.date()),
                "student_id": student_id,
                "student_name": full_name,
                "aadhaar_number": student_aadhaar,
                "report_summary": report_summary,
                "next_followup": next_followup,
                "status": status,
                "role": getattr(rpt, "created_user_role", None)
            }

        # 🔹 Super Admin → fetch all screenings and include all labels
        if user_role == AdminTeamRoles.SUPER_ADMIN:
            for _, config in role_to_config.items():
                reports = await config["model"].filter(
                    student_id=student_id,
                    is_deleted=False
                ).order_by("-created_at")
                print(f"DEBUG: {config['model'].__name__} records fetched: {len(reports)}")
                history = [build_history_entry(rpt, config, student.id, full_name, student.aadhaar_no) for rpt in reports]
                case_history[config["label"]] = history  # Include all labels, even if empty

        # 🔹 Normal Consultant → fetch only their own screening, include only their label
        elif user_role in role_to_config:
            config = role_to_config[user_role]
            reports = await config["model"].filter(
                student_id=student_id,
                is_deleted=False
            ).order_by("-created_at")
            print(f"DEBUG: {config['model'].__name__} records fetched: {len(reports)}")
            history = [build_history_entry(rpt, config, student.id, full_name, student.aadhaar_no) for rpt in reports]
            case_history[config["label"]] = history  # Include only the consultant's label

        else:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message=f"{user_role} is not allowed to view case history",
                    data={},
                    errors={}
                ).dict(),
                status_code=status.HTTP_403_FORBIDDEN
            )

        # Check if case_history is empty
        if not case_history or all(not history for history in case_history.values()):
            response = StandardResponse(
                status=False,
                message="No case history found for this student",
                data={
                    "student_id": student.id,
                    "student_name": full_name,
                    "aadhaar_number": student.aadhaar_no,
                    "case_history": case_history
                },
                errors={}
            )
            return JSONResponse(content=response.dict(), status_code=status.HTTP_200_OK)

        response = StandardResponse(
            status=True,
            message="Case history retrieved successfully",
            data={
                "student_id": student.id,
                "student_name": full_name,
                "aadhaar_number": student.aadhaar_no,
                "case_history": case_history
            }
        )
        return JSONResponse(content=response.dict(), status_code=status.HTTP_200_OK)

    except DoesNotExist:
        response = StandardResponse(
            status=False,
            message="Student not found",
            errors={"not_found": f"Student with ID {student_id} does not exist"}
        )
        return JSONResponse(content=response.dict(), status_code=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to fetch case history",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict(), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
@router.get("/screening/{student_id}/detailed-report", response_model=StandardResponse)
async def get_student_detailed_report(
    student_id: int,
    report_id: Optional[int] = Query(None, description="Specific report ID (ds_id / es_id / bs_id)"),
    current_user=Depends(get_current_user)
):
    try:
        # Verify student exists
        await Students.get(id=student_id)

        user_role = current_user["user_role"]

        # Role → ScreeningType mapping
        role_to_config = {
            ConsultantRoles.DENTIST: {
                "model": DentalScreening,
                "label": "dental",
                "pk_field": "ds_id",   # 👈 use correct PK
                "fields": lambda rpt: {
                    "student_id": rpt.student_id,
                    "screening_user_id": rpt.screening_user_id,
                    "patient_concern": json.loads(rpt.patient_concern),
                    "oral_examination": json.loads(rpt.oral_examination),
                    "examination_note": rpt.examination_note,
                    "diagnosis": json.loads(rpt.diagnosis),
                    "treatment_recommendations": json.loads(rpt.treatment_recommendations),
                    "treatment_recommendations_note": rpt.treatment_recommendations_note,
                    "report_summary": rpt.report_summary,
                    "next_followup": rpt.next_followup,
                    "status": rpt.status,
                    "created_at": str(rpt.created_at),
                    "updated_at": str(rpt.updated_at),
                }
            },
            ConsultantRoles.EYE_SPECIALIST: {
                "model": EyeScreening,
                "label": "eye",
                "pk_field": "es_id",   # 👈 use correct PK
                "fields": lambda rpt: {
                    "student_id": rpt.student_id,
                    "screening_user_id": rpt.screening_user_id,
                    "patient_concern": json.loads(rpt.patient_concern),
                    "report_summary": rpt.report_summary,
                    "next_followup": rpt.next_followup,
                    "status": rpt.status,
                    "created_at": str(rpt.created_at),
                    "updated_at": str(rpt.updated_at),
                }
            },
            ConsultantRoles.PSYCHOLOGIST: {
                "model": BehaviouralScreening,
                "label": "behavorial",
                "pk_field": "bs_id",   # 👈 use correct PK
                "fields": lambda rpt: {
                    "student_id": rpt.student_id,
                    "next_followup": rpt.next_followup,
                    "status": rpt.screening_status,
                    "created_at": str(rpt.created_at),
                    "updated_at": str(rpt.updated_at),
                }
            },
        }

        detailed_reports = {}

        # 🔹 Super Admin → fetch all (latest or specific report if report_id is provided)
        if user_role == AdminTeamRoles.SUPER_ADMIN:
            for role, config in role_to_config.items():
                query = config["model"].filter(student_id=student_id)
                if report_id:
                    query = query.filter(**{config["pk_field"]: report_id})
                rpt = await query.order_by("-created_at").first()
                if rpt:
                    detailed_reports[config["label"]] = config["fields"](rpt)

        # 🔹 Normal Consultant → fetch only their own screening type
        elif user_role in role_to_config:
            config = role_to_config[user_role]
            query = config["model"].filter(student_id=student_id)
            if report_id:
                query = query.filter(**{config["pk_field"]: report_id})
            rpt = await query.order_by("-created_at").first()
            if not rpt:
                return JSONResponse(
                    content=StandardResponse(
                        status=False,
                        message=f"No {config['label']} screening found for this student",
                        errors={"not_found": f"Student ID {student_id} has no {config['label']} screenings"}
                    ).dict(),
                    status_code=404
                )
            detailed_reports[config["label"]] = config["fields"](rpt)

        else:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message=f"{user_role} is not allowed to view detailed reports",
                    data={},
                    errors={}
                ).dict(),
                status_code=403
            )

        response = StandardResponse(
            status=True,
            message="Detailed report(s) retrieved successfully",
            data={"detailed_reports": detailed_reports}
        )
        return JSONResponse(content=response.dict(), status_code=200)

    except DoesNotExist:
        response = StandardResponse(
            status=False,
            message="Student not found",
            errors={"not_found": f"Student with ID {student_id} does not exist"}
        )
        return JSONResponse(content=response.dict(), status_code=404)
    except Exception as e:
        response = StandardResponse(
            status=False,
            message="Failed to fetch detailed report",
            errors={"detail": str(e)}
        )
        return JSONResponse(content=response.dict(), status_code=500)

# get-experts / list-experts
@router.get("/experts", summary="List all experts", response_model=StandardResponse)
async def list_all_experts(
    current_user: dict = Depends(get_current_user),
):
    allowed_roles = [
        AdminTeamRoles.SUPER_ADMIN,
        ParentRoles.PARENT,
        AdminTeamRoles.HEALTH_BUDDY
    ]

    if current_user["user_role"] not in allowed_roles:
        return StandardResponse(
            status=False,
            message="You are not authorized to access this resource",
            data={},
            errors={"detail": "Unauthorized"}
        )

    # Fetch all experts
    experts = await ConsultantTeam.all()

    results = []
    for expert in experts:
        image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""
        results.append({
            "expert_id": expert.id,
            "first_name": expert.first_name,
            "last_name": expert.last_name,
            "middle_name": expert.middle_name,
            "clinic_name":expert.clinic_name,
            "education": expert.education,
            "specialty": expert.specialty,
            "experience": expert.experience,
            "location": expert.location,
            "state": expert.state,
            "country": expert.country,
            "pincode": expert.pincode,
            "user_role": expert.user_role,
            "role_type": expert.role_type,
            "phone": expert.phone,
            "email": expert.email,
            "dob": str(expert.dob) if expert.dob else None,
            "gender": expert.gender,
            "address_line_1": expert.address_line_1,
            "address_line_2": expert.address_line_2,
            "landmark": expert.landmark,
            "street_name": expert.street_name,
            "country_calling_code": expert.country_calling_code,
            "username": expert.username,
            "availability": expert.availability,
            "profile_image_url": image_url,
            "is_deleted": expert.is_deleted,
            "status": getattr(expert, "status", True),
        })

    return StandardResponse(
        status=True,
        message="Experts fetched successfully",
        data={"experts": results},
        errors={},
    )
    
# @router.get(
#     "/experts/{expert_id}",
#     summary="Fetch a particular expert's details",
#     response_model=StandardResponse
# )
# async def get_expert_details(
#     expert_id: int = Path(..., description="ID of the expert to fetch"),
#     current_user: dict = Depends(get_current_user),
# ) -> Any:
#     """
#     Return full details for a single expert by ID.
#     """

#     allowed_roles = [
#         AdminTeamRoles.SUPER_ADMIN,
#         ParentRoles.PARENT
#     ]

#     if current_user["user_role"] not in allowed_roles:
#         return StandardResponse(
#             status=False,
#             message="You are not authorized to access this resource",
#             data={},
#             errors={"detail": "Unauthorized"},
#         )

#     # Fetch the expert
#     expert = await ConsultantTeam.get_or_none(id=expert_id)
#     if not expert:
#         raise HTTPException(status_code=404, detail="Expert not found")

#     # Generate signed URL for profile image if present
#     image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""

#     expert_data = {
#         "expert_id": expert.id,
#         "first_name": expert.first_name,
#         "last_name": expert.last_name,
#         "middle_name": expert.middle_name,
#         "clinic_name": expert.clinic_name,
#         "education": expert.education,
#         "specialty": expert.specialty,
#         "experience": expert.experience,
#         "location": expert.location,
#         "state": expert.state,
#         "country": expert.country,
#         "pincode": expert.pincode,
#         "user_role": expert.user_role,
#         "role_type": expert.role_type,
#         "phone": expert.phone,
#         "email": expert.email,
#         "dob": str(expert.dob) if expert.dob else None,
#         "gender": expert.gender,
#         "address_line_1": expert.address_line_1,
#         "address_line_2": expert.address_line_2,
#         "landmark": expert.landmark,
#         "street_name": expert.street_name,
#         "country_calling_code": expert.country_calling_code,
#         "username": expert.username,
#         "availability": expert.availability,
#         "profile_image_url": image_url,
#         "is_deleted": expert.is_deleted,
#         "status": getattr(expert, "status", True),
#     }

#     return StandardResponse(
#         status=True,
#         message="Expert fetched successfully",
#         data={"expert": expert_data},
#         errors={},
#     )
    
# @router.put("/update-expert/{expert_id}")
# async def update_expert(
#     expert_id: int,
#     data: ExpertUserUpdateSchema,
#     current_user=Depends(get_current_user)
# ):
#     allowed_roles = [
#         AdminTeamRoles.SUPER_ADMIN,
#     ]
#     if current_user["user_role"] not in allowed_roles:
#         raise HTTPException(status_code=403, detail="Not authorized to update experts")

#     try:
#         expert = await ConsultantTeam.get(id=expert_id)
#     except DoesNotExist:
#         raise HTTPException(status_code=404, detail="Expert not found")

#     update_data = data.dict(exclude_unset=True)

#     # handle available_time_slots separately
#     if "available_time_slots" in update_data:
#         available_time_slots = [
#             {
#                 "day": slot["day"],
#                 "slots": [
#                     {"start": s["start"], "end": s["end"]}
#                     for s in slot["slots"]
#                 ]
#             }
#             for slot in update_data["available_time_slots"]
#         ]
#         update_data["available_time_slots"] = available_time_slots

#     # Update fields
#     for field, value in update_data.items():
#         setattr(expert, field, value)

#     await expert.save()

#     return StandardResponse(
#         status=True,
#         message="Expert updated successfully",
#         data={"expert_id": expert.id}
#     )



@router.put("/update-expert/{expert_id}", summary="Update expert details", response_model=StandardResponse)
async def update_expert(
    expert_id: int,
    expert_payload: ExpertUserUpdateSchema,
    current_user: dict = Depends(get_current_user),
):
    """
    Update an expert's profile.
    Only SUPER_ADMIN can update.
    Accepts optional fields; unchanged fields remain as-is.
    Profile image may be a large base64 string with or without the
    'data:image/...;base64,' prefix.
    """
    try:
        # --- Role check -----------------------------------------------------
        try:
            user_role_enum = AdminTeamRoles(current_user["user_role"])
            if user_role_enum != AdminTeamRoles.SUPER_ADMIN:
                return StandardResponse(
                    status=False,
                    message="Only SUPER_ADMIN can update experts",
                    data={},
                    errors={},
                    status_code=status.HTTP_403_FORBIDDEN
                )
        except ValueError:
            return StandardResponse(
                status=False,
                message="Invalid user role",
                data={},
                errors={},
                status_code=status.HTTP_403_FORBIDDEN
            )
        # --- Fetch current expert -------------------------------------------
        expert = await ConsultantTeam.filter(id=expert_id, is_deleted=False).first()
        if not expert:
            return StandardResponse(
                status=False,
                message="Expert not found",
                data={},
                errors={},
                status_code=status.HTTP_404_NOT_FOUND
            )
        # --- Unique phone/email checks --------------------------------------
        if expert_payload.phone and expert_payload.phone != expert.phone:
            if await ConsultantTeam.filter(phone=expert_payload.phone).exclude(id=expert_id).exists():
                return StandardResponse(
                    status=False,
                    message="Phone number already in use",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        if expert_payload.email and expert_payload.email != expert.email:
            if await ConsultantTeam.filter(email=expert_payload.email).exclude(id=expert_id).exists():
                return StandardResponse(
                    status=False,
                    message="Email already in use",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        # --- Profile image (large base64) -----------------------------------
        profile_image_store_path = expert.profile_image  # default: keep old
        if expert_payload.profile_image:
            try:
                image_data = expert_payload.profile_image
                # Strip the "data:image/png;base64," prefix if present
                if image_data.startswith("data:image"):
                    image_data = image_data.split(",", 1)[1]
                # Validate the base64 string (this can be very large)
                base64.b64decode(image_data, validate=True)
                # Save file to disk/cloud and get the key/path
                profile_image_store_path = await save_base64_image(
                    base64_string=image_data,
                    destination_folder="uploads/profile_images/consultant_team/",
                    user_role=current_user.get("user_role"),
                    role_type=current_user.get("role_type"),
                    return_key_only=True,
                )
                if not profile_image_store_path:
                    profile_image_store_path = expert.profile_image
            except Exception as e:
                return StandardResponse(
                    status=False,
                    message=f"Invalid base64 profile image: {str(e)}",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        # --- Update simple fields -------------------------------------------
        # Iterate over schema fields dynamically to avoid repetition
        for field, value in expert_payload.model_dump(exclude_unset=True).items():
            if field == "profile_image":  # handled separately
                continue
            setattr(expert, field, value)
        # Update audit info
        expert.profile_image = profile_image_store_path or ""
        expert.updated_by = current_user["user_id"]
        expert.updated_user_role = current_user["user_role"]
        expert.updated_role_type = current_user["role_type"]
        expert.updated_at = datetime.utcnow()
        
        if expert_payload.available_time_slots:
            sorted_slots = []
            for day_entry in expert_payload.available_time_slots:
                # Convert Pydantic object (DayAvailabilities) to dict if necessary
                if hasattr(day_entry, "dict"):
                    day_entry = day_entry.dict()
                # Sort the slots by start time
                if "slots" in day_entry:
                    day_entry["slots"] = sorted(
                        day_entry["slots"],
                        key=lambda x: datetime.strptime(x["start"], "%H:%M")
                    )
                sorted_slots.append(day_entry)
            expert.available_time_slots = sorted_slots

        await expert.save()
        # --- Prepare response ------------------------------------------------
        image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""
        response_data = {
            "expert_id": expert.id,
            "first_name": expert.first_name,
            "last_name": expert.last_name,
            "middle_name": expert.middle_name,
            "education": expert.education,
            "specialty": expert.specialty,
            "experience": expert.experience,
            "location": expert.location,
            "state": expert.state,
            "country": expert.country,
            "pincode": expert.pincode,
            "phone": expert.phone,
            "email": expert.email,
            "dob": str(expert.dob) if expert.dob else None,
            "gender": expert.gender,
            "address_line_1": expert.address_line_1,
            "address_line_2": expert.address_line_2,
            "landmark": expert.landmark,
            "street_name": expert.street_name,
            "country_calling_code": expert.country_calling_code,
            "username": expert.username,
            "role_type": expert.role_type,
            "available_time_slots": expert.available_time_slots,
            "consultation_duration": expert.consultation_duration,
            "max_consultations_per_day": expert.max_consultations_per_day,
            "consultation_charges": expert.consultation_charges,
            "brief_bio": expert.brief_bio,
            "license_number": expert.license_number,
            "languages_spoken": expert.languages_spoken,
            "profile_image_url": image_url,
            "is_deleted": expert.is_deleted,
            "status": getattr(expert, "status", True),
        }
        return StandardResponse(
            status=True,
            message="Expert updated successfully",
            data=response_data,
            errors={},
            status_code=status.HTTP_200_OK
        )
    except Exception as e:
        # Catch any unexpected server error
        return StandardResponse(
            status=False,
            message=f"An unexpected error occurred: {str(e)}",
            data={},
            errors={"server": "Internal server error"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.get("/expert-profile/{expert_id}", summary="Get expert profile by ID", response_model=StandardResponse)
async def get_expert_profile(
    expert_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Fetch expert (consultant) profile by expert ID with all fields
    """
    try:
        # Check if expert exists and is not deleted
        expert = await ConsultantTeam.filter(id=expert_id, is_deleted=False).first()
        if not expert:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="Expert not found",
                    data={},
                    errors={},
                ).__dict__,
                status_code=status.HTTP_404_NOT_FOUND,
            )

        # Get profile image URL
        profile_image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""

        # Prepare complete expert profile data
        expert_data = {
            "expert_id": expert.id,
            "first_name": expert.first_name,
            "last_name": expert.last_name,
            "middle_name": expert.middle_name,
            "education": expert.education,
            "specialty": expert.specialty,
            "experience": expert.experience,
            "location": expert.location,
            "state": expert.state,
            "country": expert.country,
            "clinic_name": expert.clinic_name,
            "pincode": expert.pincode,
            "user_role": expert.user_role,
            "role_type": expert.role_type,
            "phone": expert.phone,
            "email": expert.email,
            "dob": str(expert.dob) if expert.dob else None,
            "gender": expert.gender,
            "address_line_1": expert.address_line_1,
            "address_line_2": expert.address_line_2,
            "landmark": expert.landmark,
            "street_name": expert.street_name,
            "country_calling_code": expert.country_calling_code,
            "username": expert.username,
            "availability": expert.availability,
            "profile_image_url": profile_image_url,
            "is_active": expert.is_active,
            "is_verified": expert.is_verified,
            "is_deleted": expert.is_deleted,
            # Additional consultant-specific fields
            "available_time_slots": expert.available_time_slots,
            "consultation_duration": expert.consultation_duration,
            "max_consultations_per_day": expert.max_consultations_per_day,
            "consultation_charges": expert.consultation_charges,
            "brief_bio": expert.brief_bio,
            "license_number": expert.license_number,
            "languages_spoken": expert.languages_spoken,
            "location_link": expert.location_link,
            # Audit fields
            "created_at": str(expert.created_at),
            "created_by": expert.created_by,
            "created_user_role": expert.created_user_role,
            "created_role_type": expert.created_role_type,
            "updated_at": str(expert.updated_at),
            "updated_by": expert.updated_by,
            "updated_user_role": expert.updated_user_role,
            "updated_role_type": expert.updated_role_type,
        }

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Expert profile fetched successfully",
                data=expert_data,
                errors={},
            ).__dict__,
            status_code=status.HTTP_200_OK,
        )

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message=f"Error fetching expert profile: {str(e)}",
                data={},
                errors={},
            ).__dict__,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


        # --- Fetch current expert -------------------------------------------
        expert = await ConsultantTeam.filter(id=expert_id, is_deleted=False).first()
        if not expert:
            return StandardResponse(
                status=False,
                message="Expert not found",
                data={},
                errors={},
                status_code=status.HTTP_404_NOT_FOUND
            )

        # --- Unique phone/email checks --------------------------------------
        if expert_payload.phone and expert_payload.phone != expert.phone:
            if await ConsultantTeam.filter(phone=expert_payload.phone).exclude(id=expert_id).exists():
                return StandardResponse(
                    status=False,
                    message="Phone number already in use",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        if expert_payload.email and expert_payload.email != expert.email:
            if await ConsultantTeam.filter(email=expert_payload.email).exclude(id=expert_id).exists():
                return StandardResponse(
                    status=False,
                    message="Email already in use",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        # --- Profile image (large base64) -----------------------------------
        profile_image_store_path = expert.profile_image  # default: keep old
        if expert_payload.profile_image:
            try:
                image_data = expert_payload.profile_image
                # Strip the "data:image/png;base64," prefix if present
                if image_data.startswith("data:image"):
                    image_data = image_data.split(",", 1)[1]

                # Validate the base64 string (this can be very large)
                base64.b64decode(image_data, validate=True)

                # Save file to disk/cloud and get the key/path
                profile_image_store_path = await save_base64_image(
                    base64_string=image_data,
                    destination_folder="uploads/profile_images/consultant_team/",
                    user_role=current_user.get("user_role"),
                    role_type=current_user.get("role_type"),
                    return_key_only=True,
                )
                if not profile_image_store_path:
                    profile_image_store_path = expert.profile_image
            except Exception as e:
                return StandardResponse(
                    status=False,
                    message=f"Invalid base64 profile image: {str(e)}",
                    data={},
                    errors={},
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        # --- Update simple fields -------------------------------------------
        # Iterate over schema fields dynamically to avoid repetition
        for field, value in expert_payload.model_dump(exclude_unset=True).items():
            if field == "profile_image":  # handled separately
                continue
            setattr(expert, field, value)

        # Update audit info
        expert.profile_image = profile_image_store_path or ""
        expert.updated_by = current_user["user_id"]
        expert.updated_user_role = current_user["user_role"]
        expert.updated_role_type = current_user["role_type"]
        expert.updated_at = datetime.utcnow()

        await expert.save()

        # --- Prepare response ------------------------------------------------
        image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""
        response_data = {
            "expert_id": expert.id,
            "first_name": expert.first_name,
            "last_name": expert.last_name,
            "middle_name": expert.middle_name,
            "education": expert.education,
            "specialty": expert.specialty,
            "experience": expert.experience,
            "location": expert.location,
            "state": expert.state,
            "country": expert.country,
            "pincode": expert.pincode,
            "phone": expert.phone,
            "email": expert.email,
            "dob": str(expert.dob) if expert.dob else None,
            "gender": expert.gender,
            "address_line_1": expert.address_line_1,
            "address_line_2": expert.address_line_2,
            "landmark": expert.landmark,
            "street_name": expert.street_name,
            "country_calling_code": expert.country_calling_code,
            "username": expert.username,
            "role_type": expert.role_type,
            "available_time_slots": expert.available_time_slots,
            "consultation_duration": expert.consultation_duration,
            "max_consultations_per_day": expert.max_consultations_per_day,
            "consultation_charges": expert.consultation_charges,
            "brief_bio": expert.brief_bio,
            "license_number": expert.license_number,
            "languages_spoken": expert.languages_spoken,
            "profile_image_url": image_url,
            "is_deleted": expert.is_deleted,
            "status": getattr(expert, "status", True),
        }

        return StandardResponse(
            status=True,
            message="Expert updated successfully",
            data=response_data,
            errors={},
            status_code=status.HTTP_200_OK
        )

    except Exception as e:
        # Catch any unexpected server error
        return StandardResponse(
            status=False,
            message=f"An unexpected error occurred: {str(e)}",
            data={},
            errors={"server": "Internal server error"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# @router.get(
#     "/preferred-experts/{student_id}",
#     summary="Get preferred doctors for a given student",
#     response_model=StandardResponse,
# )
# async def get_preferred_doctors_for_student(
#     student_id: int,
#     current_user: dict = Depends(get_current_user),
# ):
#     """
#     Return a list of unique doctors that the given student
#     has previously consulted (i.e., completed or active consultations).
#     Only parents (or allowed roles) should call this.
#     """
#     try:
#         # ✅ Authorize parent (adjust roles if you have more)
#         allowed_roles = ["PARENT"]
#         if current_user.get("user_role") not in allowed_roles:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=False,
#                     message="You are not authorized to access this resource",
#                     data={},
#                     errors={},
#                 ).__dict__,
#                 status_code=status.HTTP_403_FORBIDDEN,
#             )

#         # ✅ Find all doctor IDs from non-deleted consultations for this student
#         doctor_ids = await Consultations.filter(
#             Q(patient_id=student_id) &
#             Q(is_deleted=False) &
#             ~Q(booking_status__in=["cancelled", "rejected"])   # adjust statuses if needed
#         ).distinct().values_list("doctor_id", flat=True)

#         if not doctor_ids:
#             return JSONResponse(
#                 content=StandardResponse(
#                     status=True,
#                     message="No preferred Experts found for this student",
#                     data={"preferred_doctors": []},
#                     errors={},
#                 ).__dict__,
#                 status_code=status.HTTP_200_OK,
#             )

#         # ✅ Fetch doctor details
#         doctors = await ConsultantTeam.filter(
#             id__in=doctor_ids,
#             is_deleted=False,
#             is_active=True
#         )

#         # ✅ Prepare response list
#         preferred_list: List[dict] = []
#         for doc in doctors:
#             profile_image_url = await get_new_url(doc.profile_image) if doc.profile_image else ""

#             preferred_list.append({
#                 "doctor_id": doc.id,
#                 "first_name": doc.first_name,
#                 "last_name": doc.last_name,
#                 "specialty": doc.specialty,
#                 "experience": doc.experience,
#                 "location": doc.location,
#                 "state": doc.state,
#                 "country": doc.country,
#                 "clinic_name": doc.clinic_name,
#                 "pincode": doc.pincode,
#                 "phone": doc.phone,
#                 "email": doc.email,
#                 "profile_image_url": profile_image_url,
#                 "consultation_charges": doc.consultation_charges,
#                 "brief_bio": doc.brief_bio,
#                 "languages_spoken": doc.languages_spoken,
#                 "available_time_slots": doc.available_time_slots,
#                 "consultation_duration": doc.consultation_duration,
#                 "max_consultations_per_day": doc.max_consultations_per_day,
#                 "license_number": doc.license_number,
#                 "created_at": str(doc.created_at),
#                 "updated_at": str(doc.updated_at),
#                 "is_active": doc.is_active,
#                 "is_verified": doc.is_verified,
#             })

#         return JSONResponse(
#             content=StandardResponse(
#                 status=True,
#                 message="Preferred doctors fetched successfully",
#                 data={"preferred_doctors": preferred_list},
#                 errors={},
#             ).__dict__,
#             status_code=status.HTTP_200_OK,
#         )

#     except Exception as e:
#         return JSONResponse(
#             content=StandardResponse(
#                 status=False,
#                 message=f"Error fetching preferred doctors: {str(e)}",
#                 data={},
#                 errors={},
#             ).__dict__,
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#         )

@router.get("/prefered-experts",
            summary="get experts based on parents childern consultations",
            response_model=StandardResponse)
async def get_prefered_experts(
    current_user: dict = Depends(get_current_user),
):
    try:
        allowed_roles = ["PARENT"]
        if current_user.get("user_role") not in allowed_roles:
            return JSONResponse(
                content=StandardResponse(
                status=False,
                message="you are not authorized to access this resource",
                data={},
                errors={},
            ).__dict__,
            status_code=status.HTTP_403_FORBIDDEN)
        parent_id = current_user["user_id"]
        
        parent = await Parents.filter(
            id=parent_id,
            is_deleted=False,
            is_active=True
        ).prefetch_related("students").first()
        
        if not parent:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="Parent profile not found",
                    data={},
                    errors={},
                ).__dict__,
                status_code=status.HTTP_404_NOT_FOUND
            )
        # student_ids = [student.id for student in parent.students]
        
        student_ids = await ParentChildren.filter(
                parent_id=parent_id,
                is_deleted=False
            ).values_list("student_id", flat=True)
        
        if not student_ids:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="No childern found for this parent",
                    data={},
                    errors={},
                ).__dict__,
                status_code=status.HTTP_200_OK
            )
        
        expert_ids = await Consultations.filter(
            Q(patient_id__in=student_ids) &
            Q(is_deleted = False) &
            ~Q(booking_status__in=["cancelled","rejected"])
        ).distinct().values_list("doctor_id", flat=True)
        
        if not expert_ids:
            return JSONResponse(
                content= StandardResponse(
                    status=True,
                    message="No prefered experts found for your childern",
                    data={"prefered_experts":[]},
                    errors={},
                ).__dict__,
                status_code="HTTP_200_OK"
            )
            
        experts = await ConsultantTeam.filter(
            id__in=expert_ids,
            is_deleted=False,
            is_active=True
        )
        
        
        prefered_list: List[dict] = []
        for expert in experts:
            profile_image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""

            prefered_list.append({
                "expert_id": expert.id,
                "first_name": expert.first_name,
                  "last_name": expert.last_name,
                  "middle_name": expert.middle_name,
                  "specialty": expert.specialty,
                  "experience": expert.experience,
                  "location": expert.location,
                  "state": expert.state,
                  "country": expert.country,
                  "clinic_name": expert.clinic_name,
                  "pincode": expert.pincode,
                  "phone": expert.phone,
                  "email": expert.email,
                  "profile_image_url": profile_image_url,
                    "consultation_charges": expert.consultation_charges,
                    "brief_bio": expert.brief_bio,
                    "languages_spoken": expert.languages_spoken,
                    "available_time_slots": expert.available_time_slots,
                    "consultation_duration": expert.consultation_duration,
                    "max_consultations_per_day": expert.max_consultations_per_day,
                    "license_number": expert.license_number,
                    "user_role": expert.user_role.value,  # ConsultantRoles enum value
                    "role_type": expert.role_type,
                    "created_at": str(expert.created_at),
                    "updated_at": str(expert.updated_at),
                    "is_active": expert.is_active,
                    "is_verified": expert.is_verified,
                })
        return JSONResponse(
                  content=StandardResponse(
                      status=True,
                      message="prefered experts fetched successfully",
                      data={
                          "prefered_experts": prefered_list,
                        #   "total_experts": len(prefered_list),
                        #   "total_childern": len(student_ids)
                      },
                      errors={},
                  ).__dict__,
                  status_code=status.HTTP_200_OK
              )
    
    except Exception as e:
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message=f"Error fetching prefered experts: {str(e)}",
                data={},
                errors={"server":str(e)},
            ).__dict__,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
            
        
        
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from typing import List, Dict, Any

@router.get(
    "/nearest-by-location-experts",
    summary="Fetch experts with matching or nearby pincodes to the logged-in parent's pincode",
    response_model=StandardResponse,
)
async def get_doctors_by_parent_location(
    current_user: dict = Depends(get_current_user),
):
    """
    Returns all active, verified experts whose pincode matches the logged-in parent's pincode
    with different levels of proximity:
    - Exact match (all 6 digits)
    - Very close (first 5 digits match - same delivery area)
    - Close (first 4 digits match - same sub-district)
    - Nearby (first 3 digits match - same sorting district)
    """
    try:
        # 1️⃣ Get parent profile
        parent = await Parents.filter(
            id=current_user["user_id"],
            is_deleted=False,
            is_active=True
        ).first()
        
        if not parent or not parent.pincode or parent.pincode.strip() == "":
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=StandardResponse(
                    status=False,
                    message="Parent pincode not found or invalid",
                    data={},
                    errors={},
                ).__dict__,
            )

        parent_pincode = parent.pincode.strip()
        
        # Validate pincode has 6 digits
        if len(parent_pincode) != 6 or not parent_pincode.isdigit():
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=StandardResponse(
                    status=False,
                    message="Invalid parent pincode format. Must be 6 digits.",
                    data={},
                    errors={},
                ).__dict__,
            )

        # 2️⃣ Find experts with valid pincodes
        experts = await ConsultantTeam.filter(
            is_active=True,
            is_verified=True,
            is_deleted=False,
        ).exclude(
            pincode__isnull=True
        ).exclude(
            pincode=""
        )

        # 3️⃣ Categorize experts by proximity level
        exact_matches: List[Dict[str, Any]] = []        # All 6 digits match
        very_close_matches: List[Dict[str, Any]] = []   # First 5 digits match
        close_matches: List[Dict[str, Any]] = []        # First 4 digits match
        nearby_matches: List[Dict[str, Any]] = []       # First 3 digits match

        for expert in experts:
            # Skip invalid pincodes
            if not expert.pincode or expert.pincode.strip() == "":
                continue

            expert_pincode = expert.pincode.strip()
            
            # Skip if not 6 digits
            if len(expert_pincode) != 6 or not expert_pincode.isdigit():
                continue
                
            profile_image_url = await get_new_url(expert.profile_image) if expert.profile_image else ""
            
            # Determine proximity level
            proximity_level = "none"
            if expert_pincode == parent_pincode:
                proximity_level = "exact"
            elif expert_pincode[:5] == parent_pincode[:5]:
                proximity_level = "very_close"
            elif expert_pincode[:4] == parent_pincode[:4]:
                proximity_level = "close"
            elif expert_pincode[:3] == parent_pincode[:3]:
                proximity_level = "nearby"
            else:
                # Skip experts that don't match even first 3 digits
                continue
            
            expert_data = {
                "expert_id": expert.id,
                "first_name": expert.first_name,
                "last_name": expert.last_name,
                "user_role": expert.user_role,
                "role_type": expert.role_type,
                "specialty": expert.specialty,
                "experience": expert.experience,
                "location": expert.location,
                "clinic_name": expert.clinic_name,
                "pincode": expert.pincode,
                "phone": expert.phone,
                "email": expert.email,
                "profile_image_url": profile_image_url,
                "consultation_charges": expert.consultation_charges,
                "brief_bio": expert.brief_bio,
                "languages_spoken": expert.languages_spoken,
                "available_time_slots": expert.available_time_slots,
                "consultation_duration": expert.consultation_duration,
                "max_consultations_per_day": expert.max_consultations_per_day,
                "license_number": expert.license_number,
                "created_at": str(expert.created_at),
                "updated_at": str(expert.updated_at),
                "is_active": expert.is_active,
                "is_verified": expert.is_verified,
                "pincode_match": proximity_level
            }

            # Add to appropriate list
            if proximity_level == "exact":
                exact_matches.append(expert_data)
            elif proximity_level == "very_close":
                very_close_matches.append(expert_data)
            elif proximity_level == "close":
                close_matches.append(expert_data)
            elif proximity_level == "nearby":
                nearby_matches.append(expert_data)

        # 4️⃣ Combine all matches in order of proximity (closest first)
        expert_list = exact_matches + very_close_matches + close_matches + nearby_matches

        if not expert_list:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=StandardResponse(
                    status=False,
                    message="No experts found with matching or nearby pincodes",
                    data={},
                    errors={},
                ).__dict__,
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=StandardResponse(
                status=True,
                message="Experts fetched by matching or nearby pincode",
                data={
                    "experts": expert_list,
                    "total_count": len(expert_list),
                    "exact_matches": len(exact_matches),
                    "very_close_matches": len(very_close_matches),
                    "close_matches": len(close_matches),
                    "nearby_matches": len(nearby_matches)
                },
                errors={},
            ).__dict__,
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=StandardResponse(
                status=False,
                message=f"Error fetching Experts: {str(e)}",
                data={},
                errors={"server": str(e)},
            ).__dict__,
        )
