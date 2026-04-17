import os
import httpx
from datetime import datetime

# ─────────────────────────────────────────────────────────────
# AiSensy WhatsApp API (Primary)
# ─────────────────────────────────────────────────────────────
AISENSY_API_URL = "https://backend.aisensy.com/campaign/t1/api/v2"
AISENSY_API_KEY = os.getenv(
    "AISENSY_API_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NWNmNmFmNmU1Y2NmMjNkYTM2ODJlNiIsIm5hbWUiOiJERUVQV09SSyBDT05TVUxUQU5DWSBQUklWQVRFIExJTUlURUQiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjk1Y2Y2YWY2ZTVjY2YyM2RhMzY4MmUxIiwiYWN0aXZlUGxhbiI6IkZSRUVfRk9SRVZFUiIsImlhdCI6MTc2NzcwMDE0M30.obz0Jnnc8x6n98-la4FT5vjsaC8XZFXyiMgw_yMMfGM"
)
AISENSY_USER_NAME = "My Health Passport"


def _format_phone(phone: str) -> str:
    """
    Ensure phone is in international format for AiSensy (e.g. 919876543210).
    Strips non-digits, adds '91' prefix for Indian numbers if missing.
    """
    if not phone:
        return ""
    digits = "".join(filter(str.isdigit, str(phone)))
    if len(digits) == 10:
        return "91" + digits
    if len(digits) == 12 and digits.startswith("91"):
        return digits
    if len(digits) == 11 and digits.startswith("0"):
        return "91" + digits[1:]
    return digits


async def send_aisensy_whatsapp(
    phone: str,
    campaign_name: str,
    template_params: list = None,
    media_url: str = None,
    media_filename: str = None,
    buttons: list = None,
    source: str = "MHP-App",
) -> dict:
    """
    Send a WhatsApp template message via AiSensy campaign API.

    Args:
        phone: Recipient phone number (10-digit or international format)
        campaign_name: AiSensy campaign name (must be pre-created in AiSensy dashboard)
        template_params: List of variable values for the template (e.g. ["John", "2026-03-13"])
        media_url: Optional URL of image/document to attach
        media_filename: Optional filename for the media (required for documents)
        buttons: Optional quick-reply or CTA buttons
        source: Source label for analytics

    Returns:
        dict with 'success' bool and 'response' or 'error'
    """
    destination = _format_phone(phone)
    if not destination:
        return {"success": False, "error": "Invalid phone number"}

    payload = {
        "apiKey": AISENSY_API_KEY,
        "campaignName": campaign_name,
        "destination": destination,
        "userName": AISENSY_USER_NAME,
        "source": source,
        "templateParams": template_params or [],
        "buttons": buttons or [],
        "carouselCards": [],
        "location": {},
    }

    # Attach media if provided
    if media_url:
        payload["media"] = {
            "url": media_url,
            "filename": media_filename or "document",
        }
    else:
        payload["media"] = {}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                AISENSY_API_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            if response.status_code in (200, 201):
                print(f"[WhatsApp AiSensy] ✅ Sent '{campaign_name}' to {destination}")
                return {"success": True, "response": response.json()}
            else:
                print(
                    f"[WhatsApp AiSensy] ❌ Failed '{campaign_name}' to {destination}: "
                    f"{response.status_code} - {response.text}"
                )
                return {"success": False, "error": response.text, "status_code": response.status_code}
    except Exception as e:
        print(f"[WhatsApp AiSensy] ❌ Exception sending to {destination}: {str(e)}")
        return {"success": False, "error": str(e)}


# ─────────────────────────────────────────────────────────────
# Pre-built notification helpers
# ─────────────────────────────────────────────────────────────

async def notify_student_registered(
    parent_phone: str,
    student_name: str,
    class_room: str,
    school_name: str,
    roll_no: str,
) -> dict:
    """
    Notify parent on WhatsApp when their child is registered in MHP.
    Campaign: 'mhp_student_registered'
    Template variables: [student_name, class_room, school_name, roll_no]
    """
    return await send_aisensy_whatsapp(
        phone=parent_phone,
        campaign_name="mhp_student_registered",
        template_params=[student_name, class_room, school_name, roll_no],
        source="MHP-BulkImport",
    )


async def notify_screening_completed(
    parent_phone: str,
    student_name: str,
    school_name: str,
    screening_date: str,
) -> dict:
    """
    Notify parent on WhatsApp when student screening is completed.
    Campaign: 'mhp_screening_completed'
    Template variables: [student_name, school_name, screening_date]
    """
    return await send_aisensy_whatsapp(
        phone=parent_phone,
        campaign_name="mhp_screening_completed",
        template_params=[student_name, school_name, screening_date],
        source="MHP-Screening",
    )


async def notify_lab_report_ready(
    parent_phone: str,
    student_name: str,
    report_date: str,
    report_url: str = None,
) -> dict:
    """
    Notify parent on WhatsApp when lab report is ready.
    Campaign: 'mhp_lab_report_ready'
    Template variables: [student_name, report_date]
    Optional media: report PDF URL
    """
    return await send_aisensy_whatsapp(
        phone=parent_phone,
        campaign_name="mhp_lab_report_ready",
        template_params=[student_name, report_date],
        media_url=report_url,
        media_filename=f"{student_name}_Lab_Report.pdf" if report_url else None,
        source="MHP-LabReports",
    )


async def notify_bulk_import_success(
    admin_phone: str,
    school_name: str,
    students_imported: int,
    students_skipped: int = 0,
) -> dict:
    """
    Notify school admin on WhatsApp after bulk import is complete.
    Campaign: 'mhp_bulk_import_success'
    Template variables: [school_name, students_imported, students_skipped]
    """
    return await send_aisensy_whatsapp(
        phone=admin_phone,
        campaign_name="mhp_bulk_import_success",
        template_params=[school_name, str(students_imported), str(students_skipped)],
        source="MHP-BulkImport",
    )


async def notify_otp(phone: str, otp_code: str) -> dict:
    """
    Send OTP via WhatsApp.
    Campaign: 'mhp_otp'
    Template variables: [otp_code]
    """
    return await send_aisensy_whatsapp(
        phone=phone,
        campaign_name="mhp_otp",
        template_params=[otp_code],
        source="MHP-Auth",
    )


# ─────────────────────────────────────────────────────────────
# Legacy Pinbot (kept for reference — not actively used)
# ─────────────────────────────────────────────────────────────

PINBOT_API_URL = "https://partnersv1.pinbot.ai/v3/324937767377144/messages"
PINBOT_API_KEY = os.getenv("PINBOT_API_KEY", "ec561fa7-2c7c-11ef-b1d4-02c8a5e042bd")


async def send_whatsapp_notification(
    phone: str, template_name: str, image_url: str = None, body_params: list = None
):
    """
    Legacy Pinbot function — kept for backward compatibility.
    Prefer send_aisensy_whatsapp() for new integrations.
    """
    headers = {
        "Content-Type": "application/json",
        "apikey": PINBOT_API_KEY,
    }

    components = []
    if image_url:
        components.append({
            "type": "header",
            "parameters": [{"type": "image", "image": {"link": image_url}}],
        })
    if body_params:
        components.append({"type": "body", "parameters": body_params})

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
            "components": components or [{}],
        },
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(PINBOT_API_URL, json=payload, headers=headers)
            if response.status_code in (200, 201):
                print(f"[WhatsApp Pinbot] ✅ Sent '{template_name}' to {phone}")
            else:
                print(f"[WhatsApp Pinbot] ❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[WhatsApp Pinbot] ❌ Exception: {str(e)}")
