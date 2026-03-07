from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, constr, field_validator


class TransactionCreate(BaseModel):
    tx_no: constr(
        min_length=1, max_length=30, pattern=r"^[a-zA-Z0-9_-]+$"
    )  # Alphanumeric, underscores, hyphens
    invoice_no: constr(min_length=1, max_length=100)
    tx_mode: constr(min_length=1, max_length=50)  # e.g., 'CASH', 'CARD', 'ONLINE'
    tx_type: Optional[constr(min_length=1, max_length=50)] = None
    tx_amnt: Decimal
    tx_datetime: datetime
    tx_status: constr(
        min_length=1, max_length=50
    )  # e.g., 'PENDING', 'COMPLETED', 'FAILED'
    discount_amnt: Optional[Decimal] = None

    @field_validator("tx_amnt")
    def validate_tx_amnt(cls, v):
        if v <= 0:
            raise ValueError("Transaction amount must be greater than 0")
        if v > 99999999.99:
            raise ValueError("Transaction amount exceeds maximum allowed value")
        return v

    @field_validator("discount_amnt")
    def validate_discount_amnt(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError("Discount amount cannot be negative")
            if v > 99999999.99:
                raise ValueError("Discount amount exceeds maximum allowed value")
        return v

    @field_validator("tx_mode")
    def validate_tx_mode(cls, v):
        valid_modes = ["CASH", "CARD", "ONLINE", "CHECK", "UPI"]
        if v.upper() not in valid_modes:
            raise ValueError(f"Transaction mode must be one of {valid_modes}")
        return v.upper()

    @field_validator("tx_status")
    def validate_tx_status(cls, v):
        valid_statuses = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"]
        if v.upper() not in valid_statuses:
            raise ValueError(f"Transaction status must be one of {valid_statuses}")
        return v.upper()


class TransactionUpdate(BaseModel):
    tx_no: Optional[
        constr(min_length=1, max_length=30, pattern=r"^[a-zA-Z0-9_-]+$")
    ] = None
    invoice_no: Optional[constr(min_length=1, max_length=100)] = None
    tx_mode: Optional[constr(min_length=1, max_length=50)] = None
    tx_type: Optional[constr(min_length=1, max_length=50)] = None
    tx_amnt: Optional[Decimal] = None
    tx_datetime: Optional[datetime] = None
    tx_status: Optional[constr(min_length=1, max_length=50)] = None
    discount_amnt: Optional[Decimal] = None

    @field_validator("tx_amnt")
    def validate_tx_amnt(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError("Transaction amount must be greater than 0")
            if v > 99999999.99:
                raise ValueError("Transaction amount exceeds maximum allowed value")
        return v

    @field_validator("discount_amnt")
    def validate_discount_amnt(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError("Discount amount cannot be negative")
            if v > 99999999.99:
                raise ValueError("Discount amount exceeds maximum allowed value")
        return v

    @field_validator("tx_mode")
    def validate_tx_mode(cls, v):
        if v is not None:
            valid_modes = ["CASH", "CARD", "ONLINE", "CHECK", "UPI"]
            if v.upper() not in valid_modes:
                raise ValueError(f"Transaction mode must be one of {valid_modes}")
            return v.upper()
        return v

    @field_validator("tx_status")
    def validate_tx_status(cls, v):
        if v is not None:
            valid_statuses = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"]
            if v.upper() not in valid_statuses:
                raise ValueError(f"Transaction status must be one of {valid_statuses}")
            return v.upper()
        return v


class TransactionDetailCreate(BaseModel):
    item: constr(min_length=1, max_length=200)
    price: Decimal
    discount_amnt: Optional[Decimal] = None
    quantity: int
    tax: Optional[Decimal] = None
    sub_total: Decimal

    @field_validator("price")
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        if v > 99999999.99:
            raise ValueError("Price exceeds maximum allowed value")
        return v

    @field_validator("discount_amnt")
    def validate_discount_amnt(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError("Discount amount cannot be negative")
            if v > 99999999.99:
                raise ValueError("Discount amount exceeds maximum allowed value")
        return v

    @field_validator("quantity")
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        return v

    @field_validator("tax")
    def validate_tax(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError("Tax cannot be negative")
            if v > 99999999.99:
                raise ValueError("Tax exceeds maximum allowed value")
        return v

    @field_validator("sub_total")
    def validate_sub_total(cls, v):
        if v <= 0:
            raise ValueError("Sub-total must be greater than 0")
        if v > 99999999.99:
            raise ValueError("Sub-total exceeds maximum allowed value")
        return v


class TransactionDetailUpdate(BaseModel):
    item: Optional[constr(min_length=1, max_length=200)] = None
    price: Optional[Decimal] = None
    discount_amnt: Optional[Decimal] = None
    quantity: Optional[int] = None
    tax: Optional[Decimal] = None
    sub_total: Optional[Decimal] = None

    @field_validator("price")
    def validate_price(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError("Price must be greater than 0")
            if v > 99999999.99:
                raise ValueError("Price exceeds maximum allowed value")
        return v

    @field_validator("discount_amnt")
    def validate_discount_amnt(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError("Discount amount cannot be negative")
            if v > 99999999.99:
                raise ValueError("Discount amount exceeds maximum allowed value")
        return v

    @field_validator("quantity")
    def validate_quantity(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError("Quantity must be greater than 0")
        return v

    @field_validator("tax")
    def validate_tax(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError("Tax cannot be negative")
            if v > 99999999.99:
                raise ValueError("Tax exceeds maximum allowed value")
        return v

    @field_validator("sub_total")
    def validate_sub_total(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError("Sub-total must be greater than 0")
            if v > 99999999.99:
                raise ValueError("Sub-total exceeds maximum allowed value")
        return v


class TransactionResponse(BaseModel):
    tx_id: int
    tx_no: str
    invoice_no: str
    tx_mode: str
    tx_type: Optional[str]
    tx_amnt: Decimal
    tx_datetime: datetime
    tx_status: str
    discount_amnt: Optional[Decimal]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]


class TransactionDetailResponse(BaseModel):
    tx_detail_id: int
    tx_id: int
    item: str
    price: Decimal
    discount_amnt: Optional[Decimal]
    quantity: int
    tax: Optional[Decimal]
    sub_total: Decimal
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
