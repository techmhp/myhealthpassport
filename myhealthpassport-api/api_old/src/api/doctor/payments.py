from tortoise import fields
from tortoise.models import Model
from fastapi import APIRouter, Depends, HTTPException, Query, status

from tortoise.transactions import in_transaction
from tortoise.functions import Min
from src.core.manager import get_current_user
from src.models.user_models import ConsultantTeam,ConsultantRoles, AnalystTeam,AdminTeamRoles, ParentRoles
from src.models.student_models import ParentChildren, Students
from src.models.consultation_models import Consultations,SpecialistAppointmentDecision
from src.models.transaction_models import Transactions, TransactionDetails
from src.schemas.consultation_schema import ConsultationCreate
from src.utils.response import StandardResponse
from src.core.file_manager import get_new_url
from src.models.other_models import LabTests, LabTestBookings
from src.schemas.other_schema import LabTestBookingRequest, DummyTransactionRequest
from src.api.doctor import router
import uuid
from datetime import datetime, date, timedelta
import razorpay
from pydantic import BaseModel
from decimal import Decimal 
from typing import List, Optional
from datetime import date, time
from datetime import datetime, timedelta, time
from decimal import Decimal
import pytz
from fastapi_utils.tasks import repeat_every
from fastapi.responses import JSONResponse

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class OrderCreateRequest(BaseModel):
    amount: Decimal

    class Config:
        schema_extra = {
            "example": {
                "amount": 700.00
            }
        }

class ExtendedDummyTransactionRequest(BaseModel):
    transaction_id: str
    order_id: str
    invoice_id: str | None = None
    amount: Decimal
    currency: str = "INR"
    status: str
    mode: str
    amount_refunded: Decimal = 0
    refund_status: str | None = None
    description: str = "Test Transaction"
    email: str | None = None
    contact: str | None = None
    tax: Decimal = 0
    error_description: str | None = None
    error_reason: str | None = None
    # tx_type: str = ""  # Optional, defaults to empty string to match model

    class Config:
        schema_extra = {
            "example": {
                "transaction_id": "pay_RLlGSnoRn2i3PO",
                "order_id": "order_RLlGAhSWFClwu2",
                "invoice_id": None,
                "amount": 500.00,
                "currency": "INR",
                "status": "success",
                "mode": "UPI",
                "amount_refunded": 0,
                "refund_status": None,
                "description": "Test Transaction",
                "email": "shreenivas@gmail.com",
                "contact": "+919876543210",
                "tax": 180.00,
                "error_description": None,
                "error_reason": None,
                # "tx_type": ""
            }
        }

# Updated AppointmentResponse model to reflect slot_time as str
class AppointmentResponse(BaseModel):
    consultation_id: Optional[int] = None
    booking_id: Optional[int] = None
    doctor_id: Optional[int] = None
    doctor_fullname: str
    doctor_email: str
    doctor_role_type: str
    doctor_user_role: str
    slot_date: date
    slot_time: str  # Changed from time to str for HH:MM format
    consult_fee: float
    booking_status: str
    type: str  # "Consultation" or "LabTest"
    test_name: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "consultation_id": 1,
                "booking_id": None,
                "doctor_fullname": "Dr. Jane Smith",
                "doctor_email": "jane.smith@example.com",
                "doctor_role_type": "NUTRITIONIST",
                "doctor_user_role": "CONSULTANT",
                "slot_date": "2025-10-10",
                "slot_time": "10:30",  # Updated to HH:MM format
                "consult_fee": 500.0,
                "booking_status": "confirmed",
                "type": "Consultation",
                "test_name": None
            }
        }

    
KEY_ID = "rzp_test_RBTo1rrLQ9tSY6"
KEY_SECRET = "9um6w2gIh5UC3BeXQd38aCGr"

client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))

@router.post("/payment/do-payment", response_model=StandardResponse)
async def create_dummy_transaction(
    payload: ExtendedDummyTransactionRequest,
    user=Depends(get_current_user)):
    # if user["user_role"] != "PARENT":
    #     raise HTTPException(status_code=403, detail="Only parents can create dummy transactions.")

    allowed_roles = [
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.HEALTH_BUDDY,
        ParentRoles.PARENT
    ]
    creator_role = user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role.value} is not allowed.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)


    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0 INR.")
    
    if payload.currency != "INR":
        raise HTTPException(status_code=400, detail="Only INR currency is supported.")
    
    # Validate payment_status
    allowed_statuses = ["pending", "success", "failed"]
    if payload.status.lower() not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Payment status must be 'pending', 'success', or 'failed'.")
    
    # Map status to boolean for tx_status
    tx_status = payload.status.lower() == "success"

    # Use transaction_id as tx_no, ensuring uniqueness
    tx_no = payload.transaction_id
    if await Transactions.filter(tx_no=tx_no, is_deleted=False).exists():
        raise HTTPException(status_code=400, detail="Transaction ID already exists.")

    # Use tx_no for invoice_no if invoice_id is None
    invoice_no = payload.invoice_id if payload.invoice_id is not None else tx_no
    # Ensure invoice_no is unique
    if await Transactions.filter(invoice_no=invoice_no, is_deleted=False).exists():
        raise HTTPException(status_code=400, detail="Invoice ID already exists.")

    async with in_transaction():
        transaction = await Transactions.create(
            tx_no=tx_no,  # Maps to transaction_id
            invoice_no=invoice_no,  # Maps to invoice_id or tx_no if None
            order_id=payload.order_id,
            tx_mode=payload.mode,  # Maps to mode
            # tx_type=payload.tx_type,  # Optional, defaults to ""
            tx_amnt=payload.amount,  # Maps to amount
            tx_datetime=datetime.utcnow(),
            # tx_status=True,
            # tx_status=tx_status,  # Maps to status (converted to boolean)
            payment_status=payload.status.lower(),
            discount_amnt=0,
            currency=payload.currency,
            amount_refunded=payload.amount_refunded,
            refund_status=payload.refund_status,
            description=payload.description,
            email=payload.email,
            contact=payload.contact,
            error_description=payload.error_description,
            error_reason=payload.error_reason,
            created_by=user.get("user_id"),
            created_user_role=user.get("user_role"),
            created_role_type=user.get("role_type"),
        )

        await TransactionDetails.create(
            item=payload.description,  # Maps to description
            price=payload.amount,  # Maps to amount
            discount_amnt=0,
            quantity=1,
            tax=payload.tax,  # Maps to tax
            sub_total=payload.amount,  # Maps to amount
            tx_id=transaction.tx_id,
            created_by=user.get("user_id"),
            created_user_role=user.get("user_role"),
            created_role_type=user.get("role_type")
        )

    return StandardResponse(
        status=True,
        message="transaction created.",
        data={
            "tx_id": transaction.tx_id,
            "tx_no": tx_no,
            "invoice_id": invoice_no,
            "order_id": payload.order_id,
            "amount": payload.amount,
            "currency": payload.currency,
            # "status": payload.status,
            "status": payload.status.lower(),
            "mode": payload.mode,
            "amount_refunded": payload.amount_refunded,
            "refund_status": payload.refund_status,
            "description": payload.description,
            "email": payload.email,
            "contact": payload.contact,
            "tax": payload.tax,
            "error_description": payload.error_description,
            "error_reason": payload.error_reason
        }
    )
    
@router.post("/payment/{tx_id}/create_order", response_model=StandardResponse)
async def create_razorpay_order(
    tx_id: int,
    payload: OrderCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_role"] != "PARENT":
        raise HTTPException(status_code=403, detail="Only parents can create payment orders.")

    tx = await Transactions.get_or_none(tx_id=tx_id, is_deleted=False)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    # if tx.tx_status:
    #     raise HTTPException(status_code=400, detail="Transaction already completed.")

    if tx.payment_status == "success":  # Check payment_status instead of tx_status
        raise HTTPException(status_code=400, detail="Transaction already completed.")
    
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0 INR.")
    
    tx.tx_amnt = payload.amount  # Store in INR (rupees)
    await tx.save()

    order_data = {
        "amount": int(tx.tx_amnt * 100),  # Convert INR to paise for Razorpay
        "currency": "INR",
        "receipt": tx.tx_no,
        "notes": {"tx_id": str(tx.tx_id), "user_id": str(current_user["user_id"])}
    }

    try:
        order = client.order.create(data=order_data)
        if order.get("currency") != "INR":
            raise HTTPException(status_code=400, detail="Only INR currency is supported.")
        # Convert amount from paise to INR for response
        order["amount_due"] = order.get("amount_due", 0) / 100  # Paise to INR
        order["amount_paid"] = order.get("amount_paid", 0) / 100  # Paise to INR
        order["amount"] = order.get("amount", 0) / 100  # Paise to INR
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

    return StandardResponse.success_response(
        message="Razorpay order created successfully.",
        data=order
    )

@router.post("/payment/verify_payment", response_model=StandardResponse)
async def verify_razorpay_payment(
    payload: PaymentVerification,
    current_user: dict = Depends(get_current_user)
):
    # if current_user["user_role"] != "PARENT":
    #     raise HTTPException(status_code=403, detail="Only parents can verify payments.")

    allowed_roles = [
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.HEALTH_BUDDY,
        ParentRoles.PARENT
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role.value} is not allowed.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)


    verify_data = {
        "razorpay_order_id": payload.razorpay_order_id,
        "razorpay_payment_id": payload.razorpay_payment_id,
        "razorpay_signature": payload.razorpay_signature
    }

    try:
        client.utility.verify_payment_signature(verify_data)
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")

    order = client.order.fetch(payload.razorpay_order_id)
    tx_id = int(order["notes"].get("tx_id"))
    if not tx_id:
        raise HTTPException(status_code=400, detail="Invalid order notes.")

    if order.get("currency") != "INR":
        raise HTTPException(status_code=400, detail="Only INR currency is supported.")

    tx = await Transactions.get_or_none(tx_id=tx_id, is_deleted=False)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    # if tx.tx_status:
    #     raise HTTPException(status_code=400, detail="Transaction already completed.")

    if tx.payment_status == "success":  # Check payment_status
        raise HTTPException(status_code=400, detail="Transaction already completed.")
    
    payment = client.payment.fetch(payload.razorpay_payment_id)
    
    if payment.get("currency") != "INR":
        raise HTTPException(status_code=400, detail="Only INR currency is supported.")

    tx.tx_no = payment.get("id", tx.tx_no)
    tx.invoice_no = payload.razorpay_order_id
    tx.tx_mode = payment.get("method", tx.tx_mode)
    # tx.tx_status = payment.get("status") == "captured"
    tx.payment_status = "success" if payment.get("status") == "captured" else "failed"  # Set payment_status
    tx.discount_amnt = Decimal(str(payment.get("amount_refunded", 0) / 100))  # Paise to INR
    tx.created_at = datetime.fromtimestamp(payment.get("created_at")) if payment.get("created_at") else tx.created_at
    tx.updated_at = datetime.fromtimestamp(payment.get("updated_at")) if payment.get("updated_at") else tx.updated_at
    tx.updated_by = current_user["user_id"]
    tx.updated_user_role = current_user["user_role"]
    tx.updated_role_type = current_user["role_type"]
    await tx.save()

    async with in_transaction():
        await TransactionDetails.create(
            item=payment.get("description", "Test Transaction"),
            price=tx.tx_amnt,  # In INR
            discount_amnt=tx.discount_amnt,  # In INR
            quantity=1,
            tax=Decimal(str(payment.get("tax", 0) / 100)),  # Paise to INR
            sub_total=tx.tx_amnt,  # In INR
            tx_id=tx.tx_id,
            created_by=current_user["user_id"],
            created_user_role=current_user["user_role"],
            created_role_type=current_user["role_type"]
        )

    return StandardResponse.success_response(
        message="Payment verified and transaction updated successfully.",
        data={"tx_id": tx.tx_id, "order_id": payload.razorpay_order_id}
    )

@router.post("/payment/labtests-book", response_model=StandardResponse)
async def book_lab_test(
    payload: LabTestBookingRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Confirm lab test booking after payment or temporarily hold slot for 5 minutes.
    Behaves like consultations booking.
    """

    allowed_roles = [
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.HEALTH_BUDDY,
        ParentRoles.PARENT
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message=f"{creator_role.value} is not allowed.",
                data={},
                errors={}
            ).__dict__,
            status_code=status.HTTP_403_FORBIDDEN
        )

    parent_id = current_user["user_id"]

    # 1️⃣ Validate doctor (analyst)
    doctor = await AnalystTeam.get_or_none(
        id=payload.doctor_id,
        is_active=True,
        is_verified=True,
        is_deleted=False
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    # 2️⃣ Validate parent-child relationship
    is_child = await ParentChildren.filter(
        parent_id=parent_id,
        student_id=payload.patient_id,
        is_deleted=False
    ).exists()
    if not is_child:
        raise HTTPException(status_code=403, detail="You can only book lab tests for your child.")

    # 3️⃣ Validate lab test
    lab_test = await LabTests.get_or_none(test_id=payload.test_id, is_deleted=False)
    if not lab_test:
        raise HTTPException(status_code=404, detail="Lab Test not found.")

    # 4️⃣ Validate transaction
    tx = await Transactions.get_or_none(tx_id=payload.tx_id, is_deleted=False)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    if await LabTestBookings.filter(tx_id=payload.tx_id, is_deleted=False).exists():
        raise HTTPException(status_code=400, detail="Transaction already used for another lab test booking.")

    # Normalize slot time
    slot_time_tz = payload.slot_time.replace(tzinfo=pytz.UTC) if isinstance(payload.slot_time, time) else payload.slot_time
    now = datetime.utcnow().replace(tzinfo=pytz.UTC)

    # 5️⃣ Check existing booking for this slot
    existing_booking = await LabTestBookings.filter(
        doctor_id=payload.doctor_id,
        slot_date=payload.slot_date,
        slot_time=slot_time_tz,
        is_deleted=False
    ).first()

    if existing_booking:
        if existing_booking.booking_status == "confirmed":
            raise HTTPException(status_code=400, detail="This slot is already booked.")
        elif existing_booking.booking_status == "pending" and existing_booking.hold_expiry and existing_booking.hold_expiry > now:
            raise HTTPException(status_code=400, detail="This slot is temporarily held by another user.")
        else:
            # Expired pending → delete
            await existing_booking.delete()

    # 6️⃣ Payment not completed → create pending slot
    if tx.payment_status != "success":
        hold_expiry = now + timedelta(minutes=5)
        lab_booking = await LabTestBookings.create(
            doctor_id=payload.doctor_id,
            patient_id=payload.patient_id,
            test_id=payload.test_id,
            slot_date=payload.slot_date,
            slot_time=slot_time_tz,
            consult_fee=payload.consult_fee,
            booking_status="pending",
            tx_id=payload.tx_id,
            hold_expiry=hold_expiry,
            created_by=parent_id,
            created_user_role=current_user.get("user_role"),
            created_role_type=current_user.get("role_type", "")
        )

        return StandardResponse.success_response(
            message="Slot temporarily reserved for 5 minutes. Complete payment to confirm booking.",
            data={
                "booking_id": lab_booking.booking_id,
                "hold_expires_at": hold_expiry.isoformat()
            }
        )

    # 7️⃣ Payment completed → confirm slot
    if tx.tx_amnt != payload.consult_fee:
        raise HTTPException(status_code=400, detail="Transaction amount does not match lab test fee.")

    async with in_transaction():
        # Create transaction details if missing
        if not await TransactionDetails.filter(tx_id=payload.tx_id, is_deleted=False).exists():
            await TransactionDetails.create(
                item=lab_test.test_name,
                price=payload.consult_fee,
                discount_amnt=0,
                quantity=1,
                tax=0,
                sub_total=payload.consult_fee,
                tx_id=payload.tx_id,
                created_by=parent_id,
                created_user_role=current_user.get("user_role"),
                created_role_type=current_user.get("role_type", "")
            )

        # Update transaction datetime
        slot_start = datetime.combine(payload.slot_date, payload.slot_time)
        tx.tx_datetime = slot_start
        await tx.save()

        # Convert pending → confirmed or create new confirmed booking
        existing_pending = await LabTestBookings.filter(
            doctor_id=payload.doctor_id,
            patient_id=payload.patient_id,
            slot_date=payload.slot_date,
            slot_time=slot_time_tz,
            booking_status="pending",
            is_deleted=False
        ).first()

        if existing_pending:
            existing_pending.booking_status = "confirmed"
            existing_pending.hold_expiry = None
            existing_pending.tx_id = payload.tx_id
            await existing_pending.save()
            lab_booking = existing_pending
        else:
            lab_booking = await LabTestBookings.create(
                doctor_id=payload.doctor_id,
                patient_id=payload.patient_id,
                test_id=payload.test_id,
                slot_date=payload.slot_date,
                slot_time=slot_time_tz,
                consult_fee=payload.consult_fee,
                booking_status="confirmed",
                tx_id=payload.tx_id,
                created_by=parent_id,
                created_user_role=current_user.get("user_role"),
                created_role_type=current_user.get("role_type", "")
            )

    # 8️⃣ Fetch student info
    student = await Students.get_or_none(id=payload.patient_id, is_deleted=False)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    student_data = {
        "id": student.id,
        "first_name": student.first_name,
        "middle_name": student.middle_name,
        "last_name": student.last_name,
        "dob": student.dob.isoformat() if student.dob else None,
        "gender": student.gender,
        "profile_image": await get_new_url(student.profile_image) if student.profile_image else "",
        "class_room": student.class_room,
        "section": student.section,
        "roll_no": student.roll_no,
        "aadhaar_no": student.aadhaar_no,
        "phone": student.phone,
    }

    slot_time_str = payload.slot_time.strftime("%H:%M") if isinstance(payload.slot_time, time) else str(payload.slot_time)

    return StandardResponse.success_response(
        message="Lab Test booked successfully.",
        data={
            "test_id": lab_test.test_id,
            "test_name": lab_test.test_name,
            "slot_date": payload.slot_date.isoformat(),
            "slot_time": slot_time_str,
            "student": student_data,
            "booking_id": lab_booking.booking_id
        }
    )

    
@router.post("/payment/consultations-book", response_model=StandardResponse)
async def book_consultation(
    payload: ConsultationCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Confirm consultation booking after successful payment.
    Converts a pending slot into confirmed.
    """
    allowed_roles = [
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.HEALTH_BUDDY,
        ParentRoles.PARENT
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message=f"{creator_role} is not allowed.",
                data={},
                errors={}
            ).__dict__,
            status_code=status.HTTP_403_FORBIDDEN
        )

    parent_id = current_user["user_id"]

    # 1️⃣ Validate Doctor
    doctor = await ConsultantTeam.get_or_none(id=payload.doctor_id, is_deleted=False)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    # 2️⃣ Validate Parent-Child Relationship
    is_child = await ParentChildren.filter(
        parent_id=parent_id,
        student_id=payload.patient_id,
        is_deleted=False
    ).exists()
    # if not is_child:
    #     raise HTTPException(status_code=403, detail="You can only book consultations for your child.")

    # 3️⃣ Validate Transaction
    tx = await Transactions.get_or_none(tx_id=payload.tx_id, is_deleted=False)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    if tx.payment_status != "success":
        raise HTTPException(status_code=400, detail="Payment not completed successfully.")

    if tx.tx_amnt != payload.consult_fee:
        raise HTTPException(status_code=400, detail="Transaction amount does not match consultation fee.")

    # 4️⃣ Convert Pending Slot → Confirmed
    now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    slot_time_tz = (
        payload.slot_time.replace(tzinfo=pytz.UTC)
        if isinstance(payload.slot_time, time)
        else payload.slot_time
    )

    async with in_transaction():
        pending_slot = await Consultations.filter(
            doctor_id=payload.doctor_id,
            patient_id=payload.patient_id,
            slot_date=payload.slot_date,
            slot_time=payload.slot_time,
            booking_status="pending",
            is_deleted=False
        ).first()

        if pending_slot:
            # ✅ Confirm existing pending slot
            pending_slot.booking_status = "confirmed"
            pending_slot.hold_expiry = None
            pending_slot.tx_id = payload.tx_id
            await pending_slot.save()
            consultation = pending_slot
        else:
            # ✅ Fallback: Create new confirmed booking (if pending missing)
            consultation = await Consultations.create(
                doctor_id=payload.doctor_id,
                patient_id=payload.patient_id,
                slot_date=payload.slot_date,
                slot_time=payload.slot_time,
                consult_fee=payload.consult_fee,
                booking_status="confirmed",
                tx_id=payload.tx_id,
                created_by=parent_id,
                created_user_role=current_user.get("user_role"),
                created_role_type=current_user.get("role_type", "")
            )

    # 5️⃣ Fetch Student Info
    student = await Students.get_or_none(id=payload.patient_id, is_deleted=False)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    full_name = " ".join(filter(None, [student.first_name, student.middle_name, student.last_name]))
    student_data = {
        "id": student.id,
        "student": full_name,
        "dob": student.dob.isoformat() if student.dob else None,
        "gender": student.gender,
        "class_room": student.class_room,
        "profile_image": await get_new_url(student.profile_image) if student.profile_image else "",
        "section": student.section,
        "roll_no": student.roll_no,
        "aadhaar_no": student.aadhaar_no,
        "phone": student.phone,
    }

    slot_time_str = payload.slot_time.strftime("%H:%M") if isinstance(payload.slot_time, time) else payload.slot_time[:5]

    return StandardResponse.success_response(
        message="Consultation booked successfully.",
        data={
            "consultation_id": consultation.consult_id,
            "student": student_data,
            "slot_date": payload.slot_date.isoformat(),
            "slot_time": slot_time_str,
            "booking_status": consultation.booking_status,
        }
    )


from datetime import datetime, timedelta
import pytz
from fastapi import HTTPException

@router.post("/appointments/reschedule", response_model=StandardResponse)
async def reschedule_appointment(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    allowed_roles = [
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.HEALTH_BUDDY,
        ParentRoles.PARENT
    ]
    if current_user["user_role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Extract payload
    patient_id = payload.get("patient_id")
    consultation_id = payload.get("consultation_id")
    labtest_booking_id = payload.get("booking_id")
    new_slot_date_str = payload.get("new_slot_date")
    new_slot_time_str = payload.get("new_slot_time")

    # Validate required fields
    if not all([patient_id, new_slot_date_str, new_slot_time_str]):
        raise HTTPException(status_code=400, detail="Missing required fields")

    if not (consultation_id or labtest_booking_id):
        raise HTTPException(status_code=400, detail="Either consultation_id or booking_id is required")

    if consultation_id and labtest_booking_id:
        raise HTTPException(status_code=400, detail="Provide only one: consultation_id or booking_id")

    # Parse date & time
    try:
        new_slot_date = datetime.strptime(new_slot_date_str, "%Y-%m-%d").date()
        new_slot_time = datetime.strptime(new_slot_time_str, "%H:%M").time()
        new_slot_datetime = datetime.combine(new_slot_date, new_slot_time).replace(tzinfo=pytz.UTC)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid format. Use YYYY-MM-DD and HH:MM")

    now = datetime.utcnow().replace(tzinfo=pytz.UTC)

    async with in_transaction():
        booking = None
        Model = None
        booking_type = None
        doctor_id = None
        current_booking_id = None

        # === Find Booking (with patient_id check) ===
        if consultation_id:
            booking = await Consultations.get_or_none(
                consult_id=consultation_id,
                patient_id=patient_id,
                is_deleted=False,
                booking_status="confirmed"
            )
            if booking:
                booking_type = "consultation"
                Model = Consultations
                doctor_id = booking.doctor_id
                current_booking_id = booking.consult_id

                if new_slot_datetime < now + timedelta(hours=2):
                    raise HTTPException(status_code=400, detail="Cannot reschedule within 2 hours")

        if not booking and labtest_booking_id:
            booking = await LabTestBookings.get_or_none(
                booking_id=labtest_booking_id,
                patient_id=patient_id,
                is_deleted=False,
                booking_status="confirmed"
            )
            if booking:
                booking_type = "labtest"
                Model = LabTestBookings
                doctor_id = booking.doctor_id
                current_booking_id = labtest_booking_id

                if new_slot_datetime < now + timedelta(hours=24):
                    raise HTTPException(status_code=400, detail="Lab test requires 24 hours notice")

        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found or access denied")

        # === Check Conflict: Exclude current booking ===
        base_query = Model.filter(
            doctor_id=doctor_id,
            slot_date=new_slot_date,
            slot_time=new_slot_datetime,
            booking_status="confirmed",
            is_deleted=False
        )

        if booking_type == "consultation":
            conflict_exists = await base_query.exclude(consult_id=current_booking_id).exists()
        else:
            conflict_exists = await base_query.exclude(booking_id=current_booking_id).exists()

        if conflict_exists:
            raise HTTPException(status_code=400, detail="This slot is already booked by someone else")

        # === Optional: Check temporary hold ===
        hold_exists = await Model.filter(
            doctor_id=doctor_id,
            slot_date=new_slot_date,
            slot_time=new_slot_datetime,
            booking_status="pending",
            hold_expiry__gt=now,
            is_deleted=False
        ).exists()

        if hold_exists:
            raise HTTPException(status_code=400, detail="This slot is temporarily reserved")

        # === Reschedule ===
        old_slot = f"{booking.slot_date} {booking.slot_time.strftime('%H:%M')}"

        booking.slot_date = new_slot_date
        booking.slot_time = new_slot_datetime
        booking.updated_at = datetime.utcnow()
        booking.updated_by = current_user["user_id"]
        booking.updated_user_role = current_user["user_role"]
        await booking.save()

    new_slot_str = f"{new_slot_date} {new_slot_time.strftime('%H:%M')}"

    return StandardResponse.success_response(
        message=f"{booking_type.capitalize()} rescheduled successfully",
        data={
            "booking_id": current_booking_id,
            "booking_type": booking_type,
            "patient_id": patient_id,
            "old_slot": old_slot,
            "new_slot": new_slot_str,
            "status": "rescheduled"
        }
    )
      
@router.get("/appointments-bystudent/{student_id}", response_model=StandardResponse)
async def get_appointments_by_student(
    student_id: int,
    current_user: dict = Depends(get_current_user)
):
    allowed_roles = [
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.HEALTH_BUDDY,
        ParentRoles.PARENT
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    parent_id = current_user["user_id"]

    # Verify the student is a child of the parent
    is_child = await ParentChildren.filter(
        parent_id=parent_id,
        student_id=student_id,
        is_deleted=False
    ).exists()

    # Fetch student details
    student = await Students.get_or_none(id=student_id, is_deleted=False)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Fetch consultations
    consultations = await Consultations.filter(
        patient_id=student_id,
        is_deleted=False,
        slot_date__gte=date.today()
    ).select_related("doctor").all()

    # Fetch lab test bookings
    lab_test_bookings = await LabTestBookings.filter(
        patient_id=student_id,
        is_deleted=False,
        slot_date__gte=date.today()
    ).select_related("doctor", "test").all()

    # Combine and format response
    appointments: List[AppointmentResponse] = []

    # Process consultations
    for consultation in consultations:
        doctor_name = " ".join(filter(None, [
            consultation.doctor.first_name,
            consultation.doctor.middle_name,
            consultation.doctor.last_name
        ]))
        doctor_fullname = f"Dr. {doctor_name}" if doctor_name else "Dr. Unknown"

        # Format slot_time as HH:MM
        slot_time_str = consultation.slot_time.strftime("%H:%M") if isinstance(consultation.slot_time, time) else str(consultation.slot_time)

        # Get doctor's user role (assuming ConsultantTeam has a user_role field)
        doctor_user_role = consultation.doctor.user_role if consultation.doctor.user_role else ""
        
        appointments.append(AppointmentResponse(
            consultation_id=consultation.consult_id,
            booking_id=None,
            doctor_id=consultation.doctor.id,
            doctor_fullname=doctor_fullname,
            doctor_email=consultation.doctor.email,
            doctor_role_type=consultation.doctor.role_type,
            doctor_user_role=doctor_user_role,
            slot_date=consultation.slot_date,
            slot_time=slot_time_str,  # Updated to HH:MM format
            consult_fee=float(consultation.consult_fee),
            booking_status=consultation.booking_status,
            type="Consultation",
            test_name=None
        ))

    # Process lab test bookings
    for booking in lab_test_bookings:
        doctor_name = " ".join(filter(None, [
            booking.doctor.first_name,
            booking.doctor.middle_name,
            booking.doctor.last_name
        ]))
        doctor_fullname = f"Dr. {doctor_name}" if doctor_name else "Dr. Unknown"

        # Format slot_time as HH:MM
        slot_time_str = booking.slot_time.strftime("%H:%M") if isinstance(booking.slot_time, time) else str(booking.slot_time)

        # Get doctor's user role (assuming AnalystTeam has a user_role field)
        doctor_user_role = booking.doctor.user_role if booking.doctor.user_role else ""
        
        appointments.append(AppointmentResponse(
            consultation_id=None,
            booking_id=booking.booking_id,
            doctor_fullname=doctor_fullname,
            doctor_email=booking.doctor.email,
            doctor_role_type=booking.doctor.role_type,
            doctor_user_role=doctor_user_role,
            slot_date=booking.slot_date,
            slot_time=slot_time_str,  # Updated to HH:MM format
            consult_fee=float(booking.consult_fee),
            booking_status=booking.booking_status,
            type="LabTest",
            test_name=booking.test.test_name if booking.test else None
        ))

    # Sort appointments by slot_date and slot_time
    appointments.sort(key=lambda x: (x.slot_date, x.slot_time))

    # Prepare student data
    student_data = {
        "id": student.id,
        " complete_name": " ".join(filter(None, [student.first_name, student.middle_name, student.last_name])),
        "dob": student.dob.isoformat() if student.dob else None,
        "gender": student.gender,
        "class_room": student.class_room,
        "section": student.section,
        "roll_no": student.roll_no,
        "aadhaar_no": student.aadhaar_no,
        "phone": student.phone,
        "profile_image": await get_new_url(student.profile_image) if student.profile_image else ""
    }

    return StandardResponse.success_response(
        message="Appointments retrieved successfully.",
        data={
            "student": student_data,
            "appointments": [appointment.dict() for appointment in appointments]  # Serialize to dicts
        }
    )



class SpecialistDecisionCreate(BaseModel):
    student_id: int
    appointment_status: str
    specialist_role: ConsultantRoles  # Updated to use ConsultantRoles
    notes: Optional[str] = ""

@router.post("/appointment-decision", response_model=StandardResponse)
async def create_specialist_decision(
    payload: SpecialistDecisionCreate,
    current_user: dict = Depends(get_current_user)
):
    student = await Students.get_or_none(id=payload.student_id, is_deleted=False)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing_appointment = await SpecialistAppointmentDecision.filter(student_id=payload.student_id, specialist_role=payload.specialist_role, is_deleted=False)
    
    # if existing_appointment:
    #     raise HTTPException(status_code=400, 
    #             detail=f"specialist decision for {payload.specialist_role} is already exists for this student {payload.student_id}")
    async with in_transaction():
        if existing_appointment:
            await SpecialistAppointmentDecision.filter(student_id=payload.student_id, specialist_role=payload.specialist_role, is_deleted=False).update(
                appointment_status= payload.appointment_status,
                notes= payload.notes,
                updated_by= current_user.get("user_id"),
                updated_role_type= current_user.get("role_type"),
                updated_at=datetime.now(),
                updated_user_role= current_user.get("user_role")
            )
            return StandardResponse.success_response(
                message="Specialist decision updated successfully.",
                data={"id": existing_appointment[0].id}
            )
        else:
            decision = await SpecialistAppointmentDecision.create(
                student_id=payload.student_id,
                appointment_status=payload.appointment_status,
                specialist_role=payload.specialist_role,
                notes=payload.notes,
                created_by=current_user.get("user_id"),
                created_user_role=current_user.get("user_role"),
                created_role_type=current_user.get("role_type")
            )

            return StandardResponse.success_response(
                message="Specialist decision created successfully.",
                data={"id": decision.id}
            )
    
@router.get("/appointment-decision/{student_id}", response_model=StandardResponse)
async def get_specialist_decisions(
    student_id: int,
    current_user: dict = Depends(get_current_user)
):
    allowed_roles = [
        AdminTeamRoles.PROGRAM_COORDINATOR,
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.HEALTH_BUDDY,
        ParentRoles.PARENT
    ]
    creator_role = current_user["user_role"]
    if creator_role not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message=f"{creator_role} is not allowed.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.dict(), status_code=status.HTTP_403_FORBIDDEN)

    parent_id = current_user["user_id"]

    # Verify the student is a child of the parent
    is_child = await ParentChildren.filter(
        parent_id=parent_id,
        student_id=student_id,
        is_deleted=False
    ).exists()

    # Fetch student details
    student = await Students.get_or_none(id=student_id, is_deleted=False)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Fetch specialist decisions
    decisions = await SpecialistAppointmentDecision.filter(
        student_id=student_id,
        is_deleted=False
    ).all()

    # Format response data
    decision_data = []
    for decision in decisions:
        decision_data.append({
            "id": decision.id,
            "appointment_status": decision.appointment_status,
            "notes": decision.notes,
            "specialist_role": decision.specialist_role.value  # Access enum value
        })

    # Prepare student data
    student_data = {
        "id": student.id,
        "complete_name": " ".join(filter(None, [student.first_name, student.middle_name, student.last_name])),
        "dob": student.dob.isoformat() if student.dob else None,
        "gender": student.gender,
        "class_room": student.class_room,
        "section": student.section,
        "roll_no": student.roll_no,
        "aadhaar_no": student.aadhaar_no,
        "phone": student.phone,
        "profile_image": ""  # Adjust if you need get_new_url
    }

    return StandardResponse.success_response(
        message="Specialist decisions retrieved successfully.",
        data={
            "student": student_data,
            "decisions": decision_data
        }
    )



@router.on_event("startup")
@repeat_every(seconds=60)  # every minute
async def clear_expired_pending_slots() -> None:
    """
    Deletes all pending bookings where hold_expiry has passed.
    Confirmed bookings remain untouched.
    """
    now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    await Consultations.filter(
        booking_status="pending",
        hold_expiry__lte=now,
        is_deleted=False
    ).delete()


# -----------------------------
# Endpoint: select a consultation slot
# -----------------------------
@router.post("/consultations-select-slot", response_model=StandardResponse)
async def select_consultation_slot(payload: dict, current_user: dict = Depends(get_current_user)):
    """
    Allows a parent to temporarily reserve a consultation slot for 5 minutes before payment.
    Pending slots automatically expire after 5 minutes and get deleted.
    consult_id is auto-incremented by the database.
    """

    # if current_user["user_role"] != "PARENT":
    #     raise HTTPException(status_code=403, detail="Only parents can select consultation slots.")

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
        
    parent_id = current_user["user_id"]

    # Validate doctor
    doctor = await ConsultantTeam.get_or_none(id=payload["doctor_id"], is_deleted=False)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    # Validate child
    is_child = await ParentChildren.filter(
        parent_id=parent_id,
        student_id=payload["patient_id"],
        is_deleted=False
    ).exists()
    # if not is_child:
    #     raise HTTPException(status_code=403, detail="You can only select slots for your child.")

    # -----------------------------
    # Normalize slot_time safely
    # -----------------------------
    now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    slot_time = payload["slot_time"]

    if isinstance(slot_time, str):
        try:
            slot_time_obj = datetime.strptime(slot_time, "%H:%M:%S").time()
        except ValueError:
            try:
                slot_time_obj = datetime.strptime(slot_time, "%H:%M").time()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid slot_time format. Use HH:MM or HH:MM:SS.")
    elif isinstance(slot_time, datetime):
        slot_time_obj = slot_time.time()
    elif isinstance(slot_time, time):
        slot_time_obj = slot_time
    else:
        raise HTTPException(status_code=400, detail="Invalid slot_time type.")

    # Combine date + time into timezone-aware datetime
    slot_date_obj = (
        datetime.strptime(payload["slot_date"], "%Y-%m-%d").date()
        if isinstance(payload["slot_date"], str)
        else payload["slot_date"]
    )
    slot_datetime_utc = datetime.combine(slot_date_obj, slot_time_obj).replace(tzinfo=pytz.UTC)

    # -----------------------------
    # Step 1: Delete expired pending slots automatically
    # -----------------------------
    await Consultations.filter(
        booking_status="pending",
        hold_expiry__lte=now,
        is_deleted=False
    ).delete()

    # -----------------------------
    # Step 2: Check for existing booking for this slot
    # -----------------------------
    existing_booking = await Consultations.filter(
        doctor_id=payload["doctor_id"],
        slot_date=slot_date_obj,
        slot_time=slot_datetime_utc,
        is_deleted=False
    ).first()

    if existing_booking:
        if existing_booking.booking_status == "confirmed":
            raise HTTPException(status_code=400, detail="This slot is already booked.")
        elif existing_booking.booking_status == "pending" and existing_booking.hold_expiry and existing_booking.hold_expiry > now:
            raise HTTPException(status_code=400, detail="This slot is temporarily selected by another user.")
        else:
            # Expired pending → delete
            await existing_booking.delete()

    # -----------------------------
    # Step 3: Create pending booking (5-minute hold)
    # -----------------------------
    hold_expiry = now + timedelta(minutes=5)
    consultation = await Consultations.create(
        doctor_id=payload["doctor_id"],
        patient_id=payload["patient_id"],
        slot_date=slot_date_obj,
        slot_time=slot_datetime_utc,
        consult_fee=payload["consult_fee"],
        booking_status="pending",
        hold_expiry=hold_expiry,
        created_by=parent_id,
        created_user_role=current_user.get("user_role"),
        created_role_type=current_user.get("role_type", "")
    )

    return StandardResponse.success_response(
        message="Slot temporarily reserved for 5 minutes. Complete payment to confirm.",
        data={
            "consultation_id": consultation.consult_id,
            "hold_expires_at": hold_expiry.isoformat()
        }
    )


import pytz
from datetime import datetime, timedelta, date

IST = pytz.timezone("Asia/Kolkata")

@router.get("/consultations/{doctor_id}/available-slots", response_model=StandardResponse)
async def get_consultation_slots(
    doctor_id: int,
    slot_date: date = Query(..., description="Date to check available slots (YYYY-MM-DD)")
):
    doctor = await ConsultantTeam.get_or_none(id=doctor_id, is_deleted=False)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    if not doctor.available_time_slots:
        raise HTTPException(status_code=400, detail="Doctor availability not configured")

    day_name = slot_date.strftime("%A")
    day_availability = next(
        (d for d in doctor.available_time_slots if d["day"].lower() == day_name.lower()),
        None
    )

    if not day_availability or not day_availability.get("slots"):
        return StandardResponse.success_response(
            message="Doctor is not available on this day.",
            data={"doctor_id": doctor_id, "slot_date": slot_date.isoformat(), "slots": []}
        )

    # ✅ Use local time instead of UTC
    now = datetime.now(IST)

    existing_bookings = await Consultations.filter(
        doctor_id=doctor_id,
        slot_date=slot_date,
        is_deleted=False
    ).values("slot_time", "booking_status", "hold_expiry")

    booked_map = {}
    for b in existing_bookings:
        slot_time_str = b["slot_time"].strftime("%H:%M")
        status = "available"

        if b["booking_status"] == "confirmed":
            status = "booked"
        elif b["booking_status"] == "pending":
            if b.get("hold_expiry") and b["hold_expiry"] > now.astimezone(pytz.UTC):
                status = "pending"
            else:
                status = "available"

        booked_map[slot_time_str] = status

    duration = doctor.consultation_duration or 30
    slots = []

    for interval in day_availability["slots"]:
        start = datetime.combine(slot_date, datetime.strptime(interval["start"], "%H:%M").time())
        end = datetime.combine(slot_date, datetime.strptime(interval["end"], "%H:%M").time())

        # Localize times for comparison
        start = IST.localize(start)
        end = IST.localize(end)

        while start < end:
            slot_time_str = start.strftime("%H:%M")
            slot_status = booked_map.get(slot_time_str, "available")

            # ✅ Disable past slots including current hour (IST-based)
            if slot_date == now.date() and start <= now:
                slot_status = "not_available"

            slots.append({"time": slot_time_str, "status": slot_status})
            start += timedelta(minutes=duration)

    slots.sort(key=lambda x: datetime.strptime(x["time"], "%H:%M"))

    return StandardResponse.success_response(
        message="Consultation slots fetched successfully.",
        data={
            "doctor_id": doctor_id,
            "slot_date": slot_date.isoformat(),
            "slots": slots
        }
    )


from pydantic import BaseModel
from datetime import datetime

# ──────────────────────────────────────────────────────────────
#  REQUEST SCHEMA
# ──────────────────────────────────────────────────────────────
class UpdatePaymentStatusRequest(BaseModel):
    student_id: int
    payment_status: bool = True
    
    class Config:
        schema_extra = {
            "example": {
                "student_id": 123,
                "payment_status": True
            }
        }


# ──────────────────────────────────────────────────────────────
#  UPDATE PAYMENT STATUS API
# ──────────────────────────────────────────────────────────────
# payment status of consultant booking
@router.put("/payment/update-payment-status", response_model=StandardResponse)
async def update_payment_status(
    payload: UpdatePaymentStatusRequest,
    current_user: dict = Depends(get_current_user)
):
    
    # Authorization check
    allowed_roles = [
        "SUPER_ADMIN",
        "PROGRAM_COORDINATOR",
        "HEALTH_BUDDY",
        "PARENT",
        "SCHOOL_ADMIN"
    ]
    
    creator_role = current_user.get("user_role")
    if creator_role not in allowed_roles:
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message=f"{creator_role} is not allowed to update payment status.",
                data={},
                errors={}
            ).__dict__,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Import models
        from src.models.consultation_models import Consultations
        from src.models.student_models import Students, ParentChildren
        
        # Check if student exists
        student = await Students.get_or_none(id=payload.student_id, is_deleted=False)
        if not student:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message=f"Student with ID {payload.student_id} not found.",
                    data={},
                    errors={}
                ).__dict__,
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # If user is parent, verify they own this student
        if creator_role == "PARENT":
            is_child = await ParentChildren.filter(
                parent_id=current_user.get("user_id"),
                student_id=payload.student_id,
                is_deleted=False
            ).exists()
            
            if not is_child:
                return JSONResponse(
                    content=StandardResponse(
                        status=False,
                        message="You can only update payment status for your own child.",
                        data={},
                        errors={}
                    ).__dict__,
                    status_code=status.HTTP_403_FORBIDDEN
                )
        
        # Get the latest consultation with transaction for this student
        consultation = await Consultations.filter(
            patient_id=payload.student_id,
            is_deleted=False
        ).exclude(
            tx_id=None  # Exclude consultations without transaction
        ).prefetch_related('tx').order_by('-created_at').first()
        
        if not consultation:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message=f"No consultation with transaction found for student ID {payload.student_id}.",
                    data={},
                    errors={}
                ).__dict__,
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        if not consultation.tx:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="Consultation does not have an associated transaction.",
                    data={},
                    errors={}
                ).__dict__,
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Store old status for response
        old_tx_status = consultation.tx.tx_status
        
        # Update ONLY tx_status (boolean field)
        transaction = consultation.tx
        transaction.tx_status = payload.payment_status
        transaction.updated_by = current_user.get("user_id")
        transaction.updated_user_role = current_user.get("user_role")
        transaction.updated_role_type = current_user.get("role_type")
        transaction.updated_at = datetime.utcnow()
        
        await transaction.save()
        
        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Payment status (tx_status) updated successfully.",
                data={
                    "student_id": payload.student_id,
                    "student_name": f"{student.first_name} {student.last_name}",
                    "transaction_id": transaction.tx_id,
                    "tx_no": transaction.tx_no,
                    "old_tx_status": old_tx_status,
                    "new_tx_status": payload.payment_status,
                    "tx_amount": float(transaction.tx_amnt),
                    "updated_at": transaction.updated_at.isoformat() if transaction.updated_at else None
                },
                errors={}
            ).__dict__,
            status_code=status.HTTP_200_OK
        )
        
    except Exception as e:
        import traceback
        return JSONResponse(
            content=StandardResponse(
                status=False,
                message="Error updating payment status.",
                data={},
                errors={
                    "detail": str(e),
                    "trace": traceback.format_exc()
                }
            ).__dict__,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

