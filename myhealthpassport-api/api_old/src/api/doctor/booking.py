from fastapi import APIRouter, Depends, HTTPException
from tortoise.transactions import in_transaction
from src.core.manager import get_current_user
from src.models.user_models import ConsultantTeam, AnalystTeam
from src.models.student_models import ParentChildren, Students
from src.models.consultation_models import Consultations
from src.models.transaction_models import Transactions, TransactionDetails
from src.schemas.consultation_schema import ConsultationCreate
from src.utils.response import StandardResponse
from src.core.file_manager import get_new_url
from src.models.other_models import LabTests, LabTestBookings
from src.schemas.other_schema import LabTestBookingRequest, DummyTransactionRequest
from src.api.doctor import router
import uuid
from datetime import datetime, date, timedelta

@router.post("/transactions/dummy", response_model=StandardResponse)
async def create_dummy_transaction(
    payload: DummyTransactionRequest,
    user=Depends(get_current_user)):
    if user["user_role"] != "PARENT":
        raise HTTPException(status_code=403, detail="Only parents can create dummy transactions.")

    tx_type = payload.tx_type
    
    if tx_type not in ["Consultation", "LabTest"]:
        raise HTTPException(status_code=400, detail="Invalid transaction type.")
    
    
    prefix = "CONS" if tx_type == "Consultation" else "LabTest"
    tx_no = f"TXN-{uuid.uuid4().hex[:8]}"
    invoice_no = f"INV-{uuid.uuid4().hex[:8]}"
    
    transaction = await Transactions.create(
        tx_no=tx_no,
        invoice_no=invoice_no,
        tx_mode="Online",
        tx_type=tx_type,
        tx_amnt=0,  # Initially zero, update later if needed
        tx_datetime=datetime.utcnow(),
        tx_status=False,  # Payment not confirmed yet
        is_deleted=False,
        created_by=user.get("user_id"),
        created_user_role=user.get("user_role"),
        created_role_type=user.get("role_type"),
    )
    
    return StandardResponse(
        status=True,
        message="Dummy transaction created.",
        data={"tx_id": transaction.tx_id, "tx_no": tx_no, "invoice_no": invoice_no}
    )


# you are checking for this api /consultations-book
@router.post("/consultations/book", response_model=StandardResponse)
async def book_consultation(
    payload: ConsultationCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_role"] != "PARENT":
        raise HTTPException(status_code=403, detail="Only parents can book consultations.")

    parent_id = current_user["user_id"]

    # Validate doctor exists and is active
    doctor = await ConsultantTeam.get_or_none(id=payload.doctor_id, is_deleted=False)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    # Validate patient belongs to parent's children
    is_child = await ParentChildren.filter(
        parent_id=parent_id,
        student_id=payload.patient_id,
        is_deleted=False
    ).exists()

    if not is_child:
        raise HTTPException(status_code=403, detail="You can only book consultations for your child.")

    # Validate transaction exists
    tx = await Transactions.get_or_none(tx_id=payload.tx_id, is_deleted=False)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    # Check if transaction already linked to another consultation (cannot reuse)
    tx_already_used = await Consultations.filter(tx_id=payload.tx_id).exists()
    if tx_already_used:
        raise HTTPException(status_code=400, detail="Transaction already used for another consultation.")


    # Check if slot is already booked
    existing_booking = await Consultations.filter(
        doctor_id=payload.doctor_id,
        slot_date=payload.slot_date,
        slot_time=payload.slot_time,
        booking_status="confirmed"
    ).exists()

    if existing_booking:
        raise HTTPException(status_code=400, detail="This slot is already booked.")

    # Create consultation booking inside transaction
    async with in_transaction():
        consultation = await Consultations.create(
            doctor_id=payload.doctor_id,
            patient_id=payload.patient_id,
            slot_date=payload.slot_date,
            slot_time=payload.slot_time,
            consult_fee=payload.consult_fee,
            booking_status="confirmed",
            tx_id=payload.tx_id
        )

        # Optional: Update transaction status to True (paid/confirmed)
        tx.tx_status = True
        tx.tx_amnt = payload.consult_fee
        await tx.save()

    # Validate Transaction Type
    if tx.tx_type != "Consultation":
        raise HTTPException(status_code=400, detail="Invalid transaction type for consultation booking.")


    # Fetch student details for response
    student = await Students.get_or_none(id=payload.patient_id, is_deleted=False)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    full_name = " ".join(filter(None, [student.first_name, student.middle_name, student.last_name]))
    student_data = {
        "id": student.id,
        "stduent": full_name,
        "dob": student.dob.isoformat() if student.dob else None,
        "gender": student.gender,
        "class_room": student.class_room,
        "profile_image": await get_new_url(student.profile_image) if student.profile_image else "",
        "section": student.section,
        "roll_no": student.roll_no,
        "aadhaar_no": student.aadhaar_no,
        "phone": student.phone,
    }

    return StandardResponse.success_response(
        message="Consultation booked successfully.",
        data={
            "consultation_id": consultation.consult_id,
            "student": student_data,
        }
    )
    


# @router.post("/labtests/book", response_model=StandardResponse)
# async def book_lab_test(
#     payload: LabTestBookingRequest,
#     current_user: dict = Depends(get_current_user)
# ):
#     if current_user["user_role"] != "PARENT":
#         raise HTTPException(status_code=403, detail="Only parents can book lab tests.")

#     parent_id = current_user["user_id"]

#     # Validate Doctor exists in AnalystTeam
#     doctor = await AnalystTeam.get_or_none(
#         id=payload.doctor_id,
#         is_active=True,
#         is_verified=True,
#         is_deleted=False
#     )
#     if not doctor:
#         raise HTTPException(status_code=404, detail="Doctor not found.")

#     # Validate Parent-Child Link
#     is_child = await ParentChildren.filter(
#         parent_id=parent_id,
#         student_id=payload.patient_id,
#         is_deleted=False
#     ).exists()
#     if not is_child:
#         raise HTTPException(status_code=403, detail="You can only book lab tests for your child.")

#     # Validate Lab Test exists
#     lab_test = await LabTests.get_or_none(test_id=payload.test_id, is_deleted=False)
#     if not lab_test:
#         raise HTTPException(status_code=404, detail="Lab Test not found.")

#     # Validate Transaction
#     tx = await Transactions.get_or_none(tx_id=payload.tx_id, is_deleted=False)
#     if not tx:
#         raise HTTPException(status_code=404, detail="Transaction not found.")

#     # Ensure Transaction is of type LabTest
#     if tx.tx_type != "LabTest":
#         raise HTTPException(status_code=400, detail="Invalid transaction type for lab test booking.")

#     # Calculate slot datetime range to check for existing booking
#     slot_start = datetime.combine(payload.slot_date, payload.slot_time)
#     slot_end = slot_start + timedelta(minutes=30)  # Adjust slot duration if needed

#     # Check Slot Booking Conflict in TransactionDetails
#     existing_booking = await TransactionDetails.filter(
#         created_by=parent_id,
#         item=lab_test.test_name,
#         tx_id=payload.tx_id,
#         tx__is_deleted=False,
#         tx__tx_type="LabTest",
#         tx__tx_datetime__gte=slot_start,
#         tx__tx_datetime__lt=slot_end,
#     ).exists()
#     if existing_booking:
#         raise HTTPException(status_code=400, detail="You have already booked this lab test for the selected slot.")

#     # Proceed with Booking (TransactionDetails + LabTestBookings)
#     async with in_transaction():
#         # Add TransactionDetails
#         await TransactionDetails.create(
#             item=lab_test.test_name,
#             price=payload.consult_fee,
#             discount_amnt=0,
#             quantity=1,
#             tax=0,
#             sub_total=payload.consult_fee,
#             tx_id=payload.tx_id,
#             created_by=parent_id,
#             created_user_role=current_user.get("user_role"),
#             created_role_type=current_user.get("role_type")
#         )

#         # Update Transaction
#         tx.tx_status = True
#         tx.tx_amnt = payload.consult_fee
#         tx.tx_datetime = slot_start
#         await tx.save()

#         # Save LabTestBookings (New Entry)
#         await LabTestBookings.create(
#             doctor_id=payload.doctor_id,
#             patient_id=payload.patient_id,
#             test_id=payload.test_id,
#             slot_date=payload.slot_date,
#             slot_time=payload.slot_time,
#             consult_fee=payload.consult_fee,
#             booking_status="confirmed",
#             created_by=parent_id,
#             created_user_role=current_user.get("user_role"),
#             created_role_type=current_user.get("role_type")
#         )

#     # Fetch Student Info
#     student = await Students.get_or_none(id=payload.patient_id, is_deleted=False)
#     if not student:
#         raise HTTPException(status_code=404, detail="Student not found.")

#     student_data = {
#         "id": student.id,
#         "first_name": student.first_name,
#         "middle_name": student.middle_name,
#         "last_name": student.last_name,
#         "dob": student.dob.isoformat() if student.dob else None,
#         "gender": student.gender,
#         "profile_image": await get_new_url(student.profile_image) if student.profile_image else "",
#         "class_room": student.class_room,
#         "section": student.section,
#         "roll_no": student.roll_no,
#         "aadhaar_no": student.aadhaar_no,
#         "phone": student.phone,
#     }
    
#     return StandardResponse.success_response(
#         message="Lab Test booked successfully.",
#         data={
#             "test_id": lab_test.test_id,
#             "test_name": lab_test.test_name,
#             "slot_date": payload.slot_date,
#             "slot_time": payload.slot_time,
#             "student": student_data
#         }
#     )