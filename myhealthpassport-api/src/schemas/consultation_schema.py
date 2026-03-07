from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional
from pydantic_core.core_schema import ValidationInfo

from pydantic import BaseModel, constr, field_validator

from zoneinfo import ZoneInfo

class ConsultationCreate(BaseModel):
    doctor_id: int
    patient_id: int
    slot_date: date
    slot_time: time
    consult_fee: Decimal
    booking_status: str = "pending"
    tx_id: int

    @field_validator("consult_fee")
    def validate_consult_fee(cls, v):
        if v <= 0:
            raise ValueError("Consultation fee must be greater than 0")
        if v > 99999999.99:
            raise ValueError("Consultation fee exceeds maximum allowed value")
        return v

    @field_validator("booking_status")
    def validate_booking_status(cls, v):
        valid_statuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]
        if v.upper() not in valid_statuses:
            raise ValueError(f"Booking status must be one of {valid_statuses}")
        return v.upper()

    @field_validator("slot_date")
    def validate_slot_date(cls, v):
        if v < date.today():
            raise ValueError("Slot date cannot be in the past")
        return v
    
    # @field_validator("slot_time")
    # def parse_slot_time(cls, v):
    #     if isinstance(v, str):
    #         try:
    #             return time.fromisoformat(v)
    #         except ValueError:
    #             raise ValueError("slot_time must be in HH:MM format")
    #     return v
    
    @field_validator("slot_time")
    def parse_slot_time(cls, v):
        if isinstance(v, str):
            try:
                parsed_time = time.fromisoformat(v)
                return parsed_time.replace(tzinfo=ZoneInfo("UTC"))  # Attach UTC timezone
            except ValueError:
                raise ValueError("slot_time must be in HH:MM format")
        return v.replace(tzinfo=ZoneInfo("UTC")) if isinstance(v, time) else v

class ConsultationUpdate(BaseModel):
    doctor_id: Optional[int] = None
    patient_id: Optional[int] = None
    slot_date: Optional[date] = None
    slot_time: Optional[time] = None
    consult_fee: Optional[Decimal] = None
    booking_status: Optional[constr(min_length=1, max_length=50)] = None
    tx_id: Optional[int] = None

    @field_validator("consult_fee")
    def validate_consult_fee(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError("Consultation fee must be greater than 0")
            if v > 99999999.99:
                raise ValueError("Consultation fee exceeds maximum allowed value")
        return v

    @field_validator("booking_status")
    def validate_booking_status(cls, v):
        if v is not None:
            valid_statuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]
            if v.upper() not in valid_statuses:
                raise ValueError(f"Booking status must be one of {valid_statuses}")
            return v.upper()
        return v

    @field_validator("slot_date")
    def validate_slot_date(cls, v):
        if v is not None:
            if v < date.today():
                raise ValueError("Slot date cannot be in the past")
        return v
    
    # @field_validator("slot_time")
    # def validate_slot_time(cls, v, values):
    #     slot_date = values.get("slot_date")
    #     if v is not None and slot_date == date.today():
    #         current_time = datetime.now().time()
    #         if v <= current_time:
    #             raise ValueError("Slot time must be in the future for today")
    #     return v
    @field_validator("slot_time")
    def validate_slot_time(cls, v, values):
        if v is not None:
            # Attach UTC timezone to slot_time
            v = v.replace(tzinfo=ZoneInfo("UTC")) if isinstance(v, time) else v
            slot_date = values.get("slot_date")
            if slot_date == date.today():
                current_time = datetime.now(ZoneInfo("UTC")).time()
                if v <= current_time:
                    raise ValueError("Slot time must be in the future for today")
        return v


class ConsultationResponse(BaseModel):
    consult_id: int
    doctor_id: int
    patient_id: int
    slot_date: date
    slot_time: time
    consult_fee: Decimal
    booking_status: str
    tx_id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
