"""
WhatsApp notification endpoints via AiSensy.

Endpoints:
  POST /api/v1/general/whatsapp/send          — Generic campaign message
  POST /api/v1/general/whatsapp/notify-parent — Parent notification helpers
  GET  /api/v1/general/whatsapp/test          — Quick connectivity test
"""

from fastapi import Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List

from src.api.general import router
from src.core.manager import get_current_user
from src.models.user_models import AdminTeamRoles, SchoolRoles
from src.utils.response import StandardResponse
from src.whatsapp import (
    send_aisensy_whatsapp,
    notify_student_registered,
    notify_screening_completed,
    notify_lab_report_ready,
    notify_bulk_import_success,
    notify_otp,
    _format_phone,
)


# ─────────────────────────────────────────────────────────────
# Request schemas
# ─────────────────────────────────────────────────────────────

class SendWhatsappRequest(BaseModel):
    phone: str
    campaign_name: str
    template_params: Optional[List[str]] = []
    media_url: Optional[str] = None
    media_filename: Optional[str] = None
    source: Optional[str] = "MHP-API"


class ParentNotifyRequest(BaseModel):
    parent_phone: str
    notification_type: str          # "student_registered" | "screening_completed" | "lab_report_ready"
    student_name: str
    class_room: Optional[str] = ""
    school_name: Optional[str] = "My Health Passport School"
    roll_no: Optional[str] = ""
    screening_date: Optional[str] = ""
    report_date: Optional[str] = ""
    report_url: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────

@router.get("/whatsapp/test", response_model=dict)
async def whatsapp_test(current_user: dict = Depends(get_current_user)):
    """
    Test AiSensy connectivity — returns the formatted API config (no message sent).
    """
    from src.whatsapp import AISENSY_API_URL, AISENSY_USER_NAME, AISENSY_API_KEY
    resp = StandardResponse(
        status=True,
        message="AiSensy WhatsApp integration is configured",
        data={
            "api_url": AISENSY_API_URL,
            "user_name": AISENSY_USER_NAME,
            "api_key_preview": AISENSY_API_KEY[:30] + "...",
        },
        errors={},
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)


@router.post("/whatsapp/send", response_model=dict)
async def send_whatsapp_message(
    request: SendWhatsappRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Send any AiSensy campaign message by name.

    The campaign must be pre-created and approved in your AiSensy dashboard.
    template_params must match the number of variables in the campaign template.

    Example:
      {
        "phone": "9876543210",
        "campaign_name": "mhp_student_registered",
        "template_params": ["Arjun Sharma", "Class 5", "Green Valley School", "42"]
      }
    """
    allowed_roles = [
        AdminTeamRoles.SUPER_ADMIN,
        AdminTeamRoles.PROGRAM_COORDINATOR,
        SchoolRoles.SCHOOL_ADMIN,
    ]
    if current_user["user_role"] not in allowed_roles:
        resp = StandardResponse(
            status=False,
            message="Not authorized to send WhatsApp notifications.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    result = await send_aisensy_whatsapp(
        phone=request.phone,
        campaign_name=request.campaign_name,
        template_params=request.template_params,
        media_url=request.media_url,
        media_filename=request.media_filename,
        source=request.source,
    )

    resp = StandardResponse(
        status=result.get("success", False),
        message="WhatsApp message sent successfully" if result.get("success") else "Failed to send WhatsApp message",
        data={
            "phone": _format_phone(request.phone),
            "campaign_name": request.campaign_name,
            "aisensy_response": result.get("response", {}),
        },
        errors={"details": result.get("error", "")} if not result.get("success") else {},
    )
    return JSONResponse(
        content=resp.__dict__,
        status_code=status.HTTP_200_OK if result.get("success") else status.HTTP_502_BAD_GATEWAY,
    )


@router.post("/whatsapp/notify-parent", response_model=dict)
async def notify_parent(
    request: ParentNotifyRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Send a pre-built WhatsApp notification to a parent.

    notification_type options:
      - "student_registered"   → campaign: mhp_student_registered
                                  params: [student_name, class_room, school_name, roll_no]
      - "screening_completed"  → campaign: mhp_screening_completed
                                  params: [student_name, school_name, screening_date]
      - "lab_report_ready"     → campaign: mhp_lab_report_ready
                                  params: [student_name, report_date]
                                  + optional media_url for PDF
    """
    result = {}
    notification_type = request.notification_type.lower()

    if notification_type == "student_registered":
        result = await notify_student_registered(
            parent_phone=request.parent_phone,
            student_name=request.student_name,
            class_room=request.class_room,
            school_name=request.school_name,
            roll_no=request.roll_no,
        )
    elif notification_type == "screening_completed":
        result = await notify_screening_completed(
            parent_phone=request.parent_phone,
            student_name=request.student_name,
            school_name=request.school_name,
            screening_date=request.screening_date or "today",
        )
    elif notification_type == "lab_report_ready":
        result = await notify_lab_report_ready(
            parent_phone=request.parent_phone,
            student_name=request.student_name,
            report_date=request.report_date or "today",
            report_url=request.report_url,
        )
    else:
        resp = StandardResponse(
            status=False,
            message=f"Unknown notification_type: '{notification_type}'. "
                    f"Valid options: student_registered, screening_completed, lab_report_ready",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    resp = StandardResponse(
        status=result.get("success", False),
        message="Notification sent" if result.get("success") else "Notification failed",
        data={
            "phone": _format_phone(request.parent_phone),
            "notification_type": notification_type,
            "aisensy_response": result.get("response", {}),
        },
        errors={"details": result.get("error", "")} if not result.get("success") else {},
    )
    return JSONResponse(
        content=resp.__dict__,
        status_code=status.HTTP_200_OK if result.get("success") else status.HTTP_502_BAD_GATEWAY,
    )
