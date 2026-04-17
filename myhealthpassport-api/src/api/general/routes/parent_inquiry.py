"""
Public parent inquiry endpoints — no auth required.
Called directly from the marketing website (parents page).

Endpoints:
  POST /api/v1/general/parent-inquiry — Save "Talk to Our Team" or "Book Screening" form
  GET  /api/v1/general/parent-inquiry — List all inquiries (admin/internal use)
"""

from fastapi import status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import date

from src.api.general import router
from src.models.other_models import ParentInquiry
from src.utils.response import StandardResponse


# ─────────────────────────────────────────────────────────────
# Request schema
# ─────────────────────────────────────────────────────────────

class ParentInquiryRequest(BaseModel):
    inquiry_type: str           # "talk_to_team" | "book_screening"
    child_name: str
    parent_name: str
    phone: str

    # Talk-to-team only
    concern_area: Optional[str] = None

    # Book-screening only
    child_dob: Optional[date] = None
    gender: Optional[str] = None
    preferred_date: Optional[date] = None
    preferred_time: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────

@router.post("/parent-inquiry", response_model=StandardResponse)
async def submit_parent_inquiry(payload: ParentInquiryRequest):
    """Save a parent inquiry from the marketing website. No auth required."""
    if payload.inquiry_type not in ("talk_to_team", "book_screening"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"status": False, "message": "Invalid inquiry_type", "data": {}, "errors": []},
        )

    inquiry = await ParentInquiry.create(
        inquiry_type=payload.inquiry_type,
        child_name=payload.child_name,
        parent_name=payload.parent_name,
        phone=payload.phone,
        concern_area=payload.concern_area,
        child_dob=payload.child_dob,
        gender=payload.gender,
        preferred_date=payload.preferred_date,
        preferred_time=payload.preferred_time,
    )

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "status": True,
            "message": "Inquiry submitted successfully",
            "data": {"inquiry_id": inquiry.inquiry_id},
            "errors": [],
        },
    )


@router.get("/parent-inquiry", response_model=StandardResponse)
async def list_parent_inquiries(inquiry_type: Optional[str] = None, status: Optional[str] = None):
    """List all parent inquiries. For internal/admin use."""
    filters = {"is_deleted": False} if hasattr(ParentInquiry, "is_deleted") else {}
    if inquiry_type:
        filters["inquiry_type"] = inquiry_type
    if status:
        filters["status"] = status

    inquiries = await ParentInquiry.filter(**filters).order_by("-created_at").values()

    return JSONResponse(
        status_code=200,
        content={
            "status": True,
            "message": "Inquiries fetched",
            "data": {"inquiries": inquiries, "total": len(inquiries)},
            "errors": [],
        },
    )
