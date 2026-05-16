"""
MHB (My Health Buddy) Integration — Nutrition Engine for MHP
Calls MHB Partner API to provide AI-powered nutrition scoring,
meal analysis, and wellness insights for screened children.
"""

import os
import httpx
from fastapi import Depends, Query, status
from fastapi.responses import JSONResponse
from typing import Any, Optional
from src.models.student_models import ParentChildren, Students
from src.models.user_models import Parents
from src.core.manager import get_current_user
from src.utils.response import StandardResponse
from . import router

# ── MHB Configuration ────────────────────────────────────────
MHB_API_BASE = os.environ.get("MHB_API_BASE", "https://api.my-healthbuddy.com")
MHB_API_KEY = os.environ.get("MHB_API_KEY", "")


async def get_current_parent(user: Any = Depends(get_current_user)):
    """Validate that the current user is a parent."""
    if user is None or not isinstance(user, dict):
        return JSONResponse(
            content=StandardResponse(status=False, message="Unauthorized").__dict__,
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    if user.get("role_type", "").strip().upper() != "PARENT":
        return JSONResponse(
            content=StandardResponse(status=False, message="Only parents can access nutrition features").__dict__,
            status_code=status.HTTP_403_FORBIDDEN
        )
    parent = await Parents.get_or_none(id=user["user_id"])
    if not parent:
        return JSONResponse(
            content=StandardResponse(status=False, message="Parent not found").__dict__,
            status_code=status.HTTP_404_NOT_FOUND
        )
    return parent


def _external_family_id(parent_id: int) -> str:
    """Generate MHB external family ID from MHP parent ID."""
    return f"mhp_parent_{parent_id}"


def _external_member_id(student_id: int) -> str:
    """Generate MHB external member ID from MHP student ID."""
    return f"mhp_student_{student_id}"


async def _mhb_get(path: str) -> dict:
    """Make authenticated GET request to MHB Partner API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{MHB_API_BASE}/api/v1/partner{path}",
            headers={"X-API-Key": MHB_API_KEY}
        )
        return resp.json()


async def _mhb_post(path: str, data: dict) -> dict:
    """Make authenticated POST request to MHB Partner API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{MHB_API_BASE}/api/v1/partner{path}",
            headers={"X-API-Key": MHB_API_KEY, "Content-Type": "application/json"},
            json=data
        )
        return resp.json()


async def _mhb_put(path: str, data: dict) -> dict:
    """Make authenticated PUT request to MHB Partner API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.put(
            f"{MHB_API_BASE}/api/v1/partner{path}",
            headers={"X-API-Key": MHB_API_KEY, "Content-Type": "application/json"},
            json=data
        )
        return resp.json()


# ═══════════════════════════════════════════════════════════════
#  1. REGISTER / SYNC FAMILY WITH MHB
# ═══════════════════════════════════════════════════════════════
@router.post("/register-family", response_model=StandardResponse)
async def register_family_with_mhb(
    current_parent: Any = Depends(get_current_parent)
):
    """
    Register the parent's family in MHB nutrition engine.
    Called once — idempotent (safe to call again).
    """
    if isinstance(current_parent, JSONResponse):
        return current_parent

    try:
        # Get all children for this parent
        parent_children = await ParentChildren.filter(
            parent_id=current_parent.id, status=True
        ).all()

        if not parent_children:
            return JSONResponse(
                content=StandardResponse(status=False, message="No children found for this parent").__dict__,
                status_code=400
            )

        # Build member list from students
        members = []
        for pc in parent_children:
            student = await Students.get_or_none(id=pc.student_id)
            if student:
                # Calculate age from DOB
                from datetime import date
                age = None
                if student.dob:
                    today = date.today()
                    age = today.year - student.dob.year - ((today.month, today.day) < (student.dob.month, student.dob.day))

                members.append({
                    "external_member_id": _external_member_id(student.id),
                    "name": f"{student.first_name} {student.last_name}".strip(),
                    "role": "child",
                    "age": age,
                    "gender": student.gender.lower() if student.gender else None,
                    "conditions": [],  # Will be updated after screening
                    "dietary_preferences": [student.food_preferences] if student.food_preferences else []
                })

        # Also add parent as a member
        members.insert(0, {
            "external_member_id": f"mhp_parent_{current_parent.id}",
            "name": current_parent.name if hasattr(current_parent, 'name') else "Parent",
            "role": "parent",
            "conditions": [],
            "dietary_preferences": []
        })

        # Call MHB Partner API
        result = await _mhb_post("/families", {
            "external_family_id": _external_family_id(current_parent.id),
            "family_name": f"{members[1]['name'] if len(members) > 1 else 'Family'}'s Family",
            "members": members
        })

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Family registered with MHB nutrition engine",
                data=result
            ).__dict__,
            status_code=200
        )

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(status=False, message=f"MHB integration error: {str(e)}").__dict__,
            status_code=500
        )


# ═══════════════════════════════════════════════════════════════
#  2. GET WELLNESS SCORE (for nutrition pillar)
# ═══════════════════════════════════════════════════════════════
@router.get("/wellness-score/{student_id}", response_model=StandardResponse)
async def get_wellness_score(
    student_id: int,
    current_parent: Any = Depends(get_current_parent)
):
    """
    Get MHB nutrition wellness score for a child.
    Returns: score (0-100), traffic_light (green/amber/red/gray), confidence level.
    This is what displays in MHP's nutrition pillar.
    """
    if isinstance(current_parent, JSONResponse):
        return current_parent

    try:
        # Verify parent owns this student
        parent_child = await ParentChildren.filter(
            parent_id=current_parent.id, student_id=student_id, status=True
        ).first()
        if not parent_child:
            return JSONResponse(
                content=StandardResponse(status=False, message="Unauthorized access to this student").__dict__,
                status_code=403
            )

        ext_family_id = _external_family_id(current_parent.id)
        result = await _mhb_get(f"/analytics/wellness-score?external_family_id={ext_family_id}")

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Wellness score retrieved",
                data=result
            ).__dict__,
            status_code=200
        )

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(status=False, message=f"MHB integration error: {str(e)}").__dict__,
            status_code=500
        )


# ═══════════════════════════════════════════════════════════════
#  3. GET WEEKLY ANALYTICS
# ════���══════════════════════════════════════════════════════════
@router.get("/weekly-analytics/{student_id}", response_model=StandardResponse)
async def get_weekly_analytics(
    student_id: int,
    current_parent: Any = Depends(get_current_parent)
):
    """
    Get MHB weekly nutrition analytics — meals logged, average score, trends.
    """
    if isinstance(current_parent, JSONResponse):
        return current_parent

    try:
        parent_child = await ParentChildren.filter(
            parent_id=current_parent.id, student_id=student_id, status=True
        ).first()
        if not parent_child:
            return JSONResponse(
                content=StandardResponse(status=False, message="Unauthorized").__dict__,
                status_code=403
            )

        ext_family_id = _external_family_id(current_parent.id)
        result = await _mhb_get(f"/analytics/weekly?external_family_id={ext_family_id}")

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Weekly analytics retrieved",
                data=result
            ).__dict__,
            status_code=200
        )

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(status=False, message=f"MHB integration error: {str(e)}").__dict__,
            status_code=500
        )


# ═══════════════════════════════════════════════════════════════
#  4. LOG A MEAL
# ═══════════════════════════════════════════════════════════════
@router.post("/log-meal/{student_id}", response_model=StandardResponse)
async def log_meal(
    student_id: int,
    meal_data: dict,
    current_parent: Any = Depends(get_current_parent)
):
    """
    Log a meal for a child via MHB. Accepts meal_name, meal_type, dishes, macros.
    """
    if isinstance(current_parent, JSONResponse):
        return current_parent

    try:
        parent_child = await ParentChildren.filter(
            parent_id=current_parent.id, student_id=student_id, status=True
        ).first()
        if not parent_child:
            return JSONResponse(
                content=StandardResponse(status=False, message="Unauthorized").__dict__,
                status_code=403
            )

        ext_family_id = _external_family_id(current_parent.id)
        payload = {
            "external_family_id": ext_family_id,
            **meal_data
        }
        result = await _mhb_post("/meals", payload)

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Meal logged successfully via MHB",
                data=result
            ).__dict__,
            status_code=200
        )

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(status=False, message=f"MHB integration error: {str(e)}").__dict__,
            status_code=500
        )


# ═══════════════════════════════════════════════════════════════
#  4b. ANALYSE A MEAL (LLM — returns dishes, macros, scores, swaps)
# ═══════════════════════════════════════════════════════════════
@router.post("/analyse-meal/{student_id}", response_model=StandardResponse)
async def analyse_meal(
    student_id: int,
    meal_data: dict,
    current_parent: Any = Depends(get_current_parent)
):
    """
    Analyse a meal via MHB's AI engine. Returns identified dishes, macros,
    health score, traffic light, and food swap suggestions. Does NOT save.
    Expected input: { meal_description: str, meal_type?: str, photo_base64?: str }
    """
    if isinstance(current_parent, JSONResponse):
        return current_parent

    try:
        parent_child = await ParentChildren.filter(
            parent_id=current_parent.id, student_id=student_id, status=True
        ).first()
        if not parent_child:
            return JSONResponse(
                content=StandardResponse(status=False, message="Unauthorized").__dict__,
                status_code=403
            )

        ext_family_id = _external_family_id(current_parent.id)
        ext_member_id = _external_member_id(student_id)
        payload = {
            "external_family_id": ext_family_id,
            "external_member_id": ext_member_id,
            **meal_data
        }
        result = await _mhb_post("/meals/analyse", payload)

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Meal analysed by MHB",
                data=result
            ).__dict__,
            status_code=200
        )

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(status=False, message=f"MHB integration error: {str(e)}").__dict__,
            status_code=500
        )


# ═══════════════════════════════════════════════════════════════
#  4c. CONFIRM + SAVE A MEAL (after analysis)
# ═══════════════════════════════════════════════════════════════
@router.post("/confirm-meal/{student_id}", response_model=StandardResponse)
async def confirm_meal(
    student_id: int,
    meal_data: dict,
    current_parent: Any = Depends(get_current_parent)
):
    """
    Save a confirmed meal to MHB. Call this AFTER /analyse-meal returns a result
    and the parent taps "Confirm & Save". Expected input: the analysis result
    plus meal_type.
    """
    if isinstance(current_parent, JSONResponse):
        return current_parent

    try:
        parent_child = await ParentChildren.filter(
            parent_id=current_parent.id, student_id=student_id, status=True
        ).first()
        if not parent_child:
            return JSONResponse(
                content=StandardResponse(status=False, message="Unauthorized").__dict__,
                status_code=403
            )

        ext_family_id = _external_family_id(current_parent.id)
        ext_member_id = _external_member_id(student_id)
        payload = {
            "external_family_id": ext_family_id,
            "external_member_id": ext_member_id,
            **meal_data
        }
        result = await _mhb_post("/meals", payload)

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Meal saved to MHB",
                data=result
            ).__dict__,
            status_code=200
        )

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(status=False, message=f"MHB integration error: {str(e)}").__dict__,
            status_code=500
        )


# ═══════════════════════════════════════════════════════════════
#  4d. START PRIYA VOICE SESSION (VAPI Web SDK config)
# ═══════════════════════════════════════════════════════════════
@router.post("/priya-session/{student_id}", response_model=StandardResponse)
async def start_priya_session(
    student_id: int,
    current_parent: Any = Depends(get_current_parent)
):
    """
    Start a Priya voice session for a specific child. Returns VAPI publicKey
    + assistant config which the MHP frontend passes directly to the VAPI
    Web SDK — no audio routes through MHP. Priya gets full family context
    server-side on MHB.
    """
    if isinstance(current_parent, JSONResponse):
        return current_parent

    try:
        parent_child = await ParentChildren.filter(
            parent_id=current_parent.id, student_id=student_id, status=True
        ).first()
        if not parent_child:
            return JSONResponse(
                content=StandardResponse(status=False, message="Unauthorized").__dict__,
                status_code=403
            )

        student = await Students.get_or_none(id=student_id)
        speaker_name = None
        if student:
            speaker_name = f"{student.first_name} {student.last_name}".strip() or None

        payload = {
            "external_family_id": _external_family_id(current_parent.id),
            "external_member_id": _external_member_id(student_id),
        }
        if speaker_name:
            # Pass the parent's name so Priya greets the parent, not the child
            parent_name = current_parent.name if hasattr(current_parent, 'name') and current_parent.name else None
            if parent_name:
                payload["speaker_name"] = parent_name

        result = await _mhb_post("/voice/session", payload)

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Priya voice session ready",
                data=result
            ).__dict__,
            status_code=200
        )

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(status=False, message=f"MHB integration error: {str(e)}").__dict__,
            status_code=500
        )


# ═══════════════════════════════════════════════════════════════
#  5. GET FAMILY STATUS (check if registered in MHB)
# ═══════════════════════════════════════════════════════════════
@router.get("/family-status", response_model=StandardResponse)
async def get_family_status(
    current_parent: Any = Depends(get_current_parent)
):
    """
    Check if this parent's family is registered in MHB and get meal count.
    """
    if isinstance(current_parent, JSONResponse):
        return current_parent

    try:
        ext_family_id = _external_family_id(current_parent.id)
        result = await _mhb_get(f"/families/{ext_family_id}")

        return JSONResponse(
            content=StandardResponse(
                status=True,
                message="Family status retrieved",
                data=result
            ).__dict__,
            status_code=200
        )

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return JSONResponse(
                content=StandardResponse(
                    status=False,
                    message="Family not yet registered with MHB nutrition engine",
                    data={"registered": False}
                ).__dict__,
                status_code=200
            )
        raise

    except Exception as e:
        return JSONResponse(
            content=StandardResponse(status=False, message=f"MHB integration error: {str(e)}").__dict__,
            status_code=500
        )
