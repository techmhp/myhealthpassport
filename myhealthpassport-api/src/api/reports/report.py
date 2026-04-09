import asyncio
import base64
import time
import json
import uuid
from typing import Optional, Any, Dict, Tuple, List
from pathlib import Path
from datetime import datetime

import anyio
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Query, Depends
from fastapi.responses import HTMLResponse, Response, JSONResponse, FileResponse
from fastapi.templating import Jinja2Templates
from tortoise.expressions import Q
from src.core.manager import get_current_user
from src.core.cache_maanger import ObjectCache

from src.models.other_models import ClinicalFindings, ClinicalRecomendations
from src.models.screening_models import EyeScreening, DentalScreening, BehaviouralScreening
from src.models.student_models import SmartScaleData, Students, SchoolStudents
from src.models.school_models import Schools
from src.core.file_manager import get_new_url, s3_client, AWS_S3_BUCKET_NAME  # ✅ NEW: Import S3 client
from src.utils.academic_year import (
    get_current_academic_year,
    parse_academic_year,
)
from . import router

templates = Jinja2Templates(directory="templates")

# =========================================================
# Async TTL cache for signed URLs
# =========================================================
_url_cache: Dict[str, Tuple[str, float]] = {}
_url_cache_lock = asyncio.Lock()
DEFAULT_URL_CACHE_TTL = 24 * 3600

async def cached_get_new_url(path: str, ttl: int = DEFAULT_URL_CACHE_TTL) -> str:
    """Async-safe TTL cache for get_new_url()."""
    if not path:
        return ""

    now = time.time()
    async with _url_cache_lock:
        entry = _url_cache.get(path)
        if entry and entry[1] > now:
            return entry[0]

    signed = await get_new_url(path)

    async with _url_cache_lock:
        _url_cache[path] = (signed, now + ttl)

    return signed

# =========================================================
# Fetch S3 image as base64 data URI (avoids WeasyPrint making external HTTP calls)
# =========================================================
async def get_s3_image_as_data_uri(s3_key: str) -> Optional[str]:
    """
    Download an image directly from S3 and return it as a base64 data URI.
    When passed to WeasyPrint, this eliminates the need for WeasyPrint to make
    external HTTP requests to fetch presigned S3 URLs during PDF rendering —
    which was the primary cause of PDF generation timeouts.
    """
    if not s3_key or s3_client is None:
        return None
    try:
        def _download():
            resp = s3_client.get_object(Bucket=AWS_S3_BUCKET_NAME, Key=s3_key)
            body = resp["Body"].read()
            content_type = resp.get("ContentType", "image/png")
            b64 = base64.b64encode(body).decode("utf-8")
            return f"data:{content_type};base64,{b64}"

        return await anyio.to_thread.run_sync(_download)
    except Exception as e:
        print(f"⚠️ [PDF] Failed to embed S3 image as base64 (key={s3_key}): {e}")
        return None


# =========================================================
# Safe JSON loader
# =========================================================
def safe_json_load(val: Any, default: Any = None) -> Any:
    """Safely load JSON from string or return default."""
    if val is None:
        return default or {}
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return default or {}
    return default or {}

# =========================================================
# Build report context (optimized & fixed validation)
# =========================================================
async def build_report_context(
    request: Request,
    student_id: int,
    required_sections: List[str] = None,
    academic_year: Optional[str] = None,
    strict: bool = True
) -> dict:
    """
    Builds a complete report context asynchronously.

    :param required_sections: List of section keys (e.g. ['emotional', 'dental']).
                              If provided, only these sections are validated for existence.
                              If None, ALL sections must be present (strict full report).
    :param academic_year: Academic year in format 'YYYY-YYYY'. Defaults to current year.
    :param strict: If False, missing sections are logged as warnings but don't raise errors.
                   PDF will be generated with whatever data is available.
    """
    
    # Determine academic year
    if academic_year is None:
        academic_year = get_current_academic_year()

    try:
        ay_start, ay_end = parse_academic_year(academic_year)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Build academic year filter - use created_at only
    year_filter = Q(created_at__gte=ay_start, created_at__lte=ay_end)

    # Batch async queries with academic year filter
    tasks = [
        Students.get_or_none(id=student_id, is_deleted=False),
        SchoolStudents.filter(student_id=student_id, is_deleted=False)
        .prefetch_related("school")
        .get_or_none(),
        SmartScaleData.filter(year_filter, student_id=student_id, is_deleted=False)
        .order_by("-created_at")
        .first(),
        ClinicalRecomendations.filter(
            year_filter,
            student_id=student_id,
            is_deleted=False,
            report_type="Physical Screening Report",
        )
        .order_by("-created_at")
        .first(),
        ClinicalRecomendations.filter(
            year_filter,
            student_id=student_id,
            is_deleted=False,
            report_type="Questionnaire Reports",
        )
        .order_by("-created_at")
        .first(),
        ClinicalRecomendations.filter(
            year_filter,
            student_id=student_id,
            is_deleted=False,
            report_type="Nutrition Deficiency Report",
        )
        .order_by("-created_at")
        .first(),
        ClinicalFindings.filter(year_filter, student_id=student_id, is_deleted=False)
        .order_by("-created_at")
        .first(),
        DentalScreening.filter(year_filter, student_id=student_id, is_deleted=False)
        .order_by("-created_at")
        .first(),
        EyeScreening.filter(year_filter, student_id=student_id, is_deleted=False)
        .order_by("-created_at")
        .first(),
        ClinicalRecomendations.filter(
            year_filter,
            student_id=student_id, 
            is_deleted=False, 
            report_type="Lab Reports"
        )
        .order_by("-created_at")
        .first(),
        BehaviouralScreening.filter(year_filter, student_id=student_id, is_deleted=False)
        .order_by("-created_at")
        .first(),
    ]

    (
        student,
        school_student,
        smart_data,
        pysch_data,
        nutritional_questionaire,
        screening_analysis,
        emo_data,
        dental_data,
        eye_screening,
        lab_data,
        behavioural_screening,
    ) = await asyncio.gather(*tasks)

    # Core validations
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    school = school_student.school if school_student else None
    school_logo_url: Optional[str] = None

    if school and getattr(school, "school_logo", None):
        if school.school_logo.startswith("data:"):
            school_logo_url = school.school_logo
        else:
            # Embed as base64 so WeasyPrint doesn't make an external HTTP request to S3
            school_logo_url = await get_s3_image_as_data_uri(school.school_logo)

    # -------------------------------------------------------------------------
    # FIXED DATA INTEGRITY CHECK (Dynamic Validation)
    # -------------------------------------------------------------------------
    
    # Map the string keys used in frontend to the database objects
    data_map = {
        "physical": smart_data,
        "nutrition": nutritional_questionaire,
        "emotional": emo_data,
        "dental": dental_data,
        "eye": eye_screening,
        "lab": lab_data,
    }

    missing_sections = []

    if required_sections:
        # SELECTIVE MODE: Check only what was requested
        for section in required_sections:
            key = section.strip().lower()
            if key in data_map and not data_map[key]:
                missing_sections.append(key)
    else:
        # STRICT MODE (Full Report): Check everything
        required_strict = {
            "SmartScaleData": smart_data,
            "PsychData": pysch_data,
            "NutritionalQuestionnaire": nutritional_questionaire,
            "ScreeningAnalysis": screening_analysis,
            "EmotionalData": emo_data,
            "LabData": lab_data,
            "DentalScreening": dental_data,
            "EyeScreening": eye_screening,
            "BehaviouralScreening": behavioural_screening,
        }
        missing_sections = [key for key, value in required_strict.items() if not value]

    if missing_sections:
        if strict:
            raise HTTPException(
                status_code=404,
                detail=f"Report not completed for academic year {academic_year}: missing data for {', '.join(missing_sections)}"
            )
        else:
            print(f"⚠️ [PDF Debug] Partial data — missing sections (non-strict mode): {missing_sections}. Generating PDF with available data.")

    # -------------------------------------------------------------------------
    # Parsing Logic (Unchanged)
    # -------------------------------------------------------------------------

    # Psychological data parsing
    pstrengths, pneed_attention = [], []
    for entry in getattr(pysch_data, "questions_data", []) or []:
        if isinstance(entry, dict):
            etype = entry.get("question_type")
            answers = entry.get("answers", []) or []
            if etype == "Good Outcomes":
                pstrengths.extend(answers)
            elif etype == "Areas of Concern":
                pneed_attention.extend(answers)

    pysch_status = pysch_data
    behavioural_status = behavioural_screening.screening_status if behavioural_screening else False

    # Nutrition questionnaire
    nqa = {"strengths": [], "needs_attention": [], "recommendations": []}
    if nutritional_questionaire:
        qd = nutritional_questionaire.questions_data
        raw_report_data = (qd.get("report_data", []) if isinstance(qd, dict) else qd) or []

        for entry in raw_report_data:
            if not isinstance(entry, dict):
                continue
            qtype = entry.get("question_type")
            for ans in entry.get("answers", []):
                if qtype == "Good Outcomes":
                    nqa["strengths"].append({"remarks": "Strength", "findings": ans})
                elif qtype == "Areas of Concern":
                    nqa["needs_attention"].append({"remarks": "Concern", "findings": ans})

    # Screening analysis
    nsa = {"strengths": [], "needs_attention": []}
    if screening_analysis:
        qa = screening_analysis.questions_data
        raw_analysis_data = (qa.get("report_data", []) if isinstance(qa, dict) else qa) or []

        for entry in raw_analysis_data:
            if not isinstance(entry, dict):
                continue
            qtype = entry.get("question_type")
            for ans in entry.get("answers", []):
                if qtype == "Good Outcomes":
                    nsa["strengths"].append({"remarks": "Strength", "findings": ans})
                elif qtype == "Areas of Concern":
                    nsa["needs_attention"].append({"remarks": "Concern", "findings": ans})

    # Dental data
    oral_exam, highlight_teeth, treatment_recommendations = [], [], []
    dental_concerns, diagnoses = [], []

    if dental_data:
        oral_exam = safe_json_load(dental_data.oral_examination, [])
        raw_recs = safe_json_load(dental_data.treatment_recommendations, [])
        if isinstance(raw_recs, list):
            for rec in raw_recs:
                if isinstance(rec, str):
                    if ":" in rec:
                        title, description = rec.split(":", 1)
                        treatment_recommendations.append(
                            {"title": title.strip(), "description": description.strip()}
                        )
                    else:
                        treatment_recommendations.append(
                            {"title": "Recommendation", "description": rec.strip()}
                        )
                elif isinstance(rec, dict):
                    treatment_recommendations.append(rec)

        dental_concerns = safe_json_load(dental_data.patient_concern, [])
        diagnoses = safe_json_load(dental_data.diagnosis, [])

        for item in oral_exam or []:
            highlight_teeth.extend([str(t) for t in item.get("tooth_numbers", [])])

    # Eye screening
    eye_report = None
    eye_concerns = []
    if eye_screening:
        left_res = safe_json_load(eye_screening.vision_lefteye_res, {})
        right_res = safe_json_load(eye_screening.vision_righteye_res, {})
        eye_concerns = safe_json_load(eye_screening.patient_concern, [])
        raw_recommendations = safe_json_load(eye_screening.recommendations, [])

        recommendations = (
            raw_recommendations
            if isinstance(raw_recommendations, list)
            else [p.strip() for p in str(raw_recommendations).split(".") if p.strip()]
        )

        prescriptions = []
        if right_res or left_res:
            prescriptions.append(
                f"Right Eye: OD {right_res.get('sph','')} SPH, {right_res.get('cyl','')} CYL, {right_res.get('axis','')}° Axis"
            )
            prescriptions.append(
                f"Left Eye: OS {left_res.get('sph','')} SPH, {left_res.get('cyl','')} CYL, {left_res.get('axis','')}° Axis"
            )

        eye_report = {
            "status": eye_screening.status or "",
            "report_summary": eye_screening.report_summary or "",
            "left": left_res,
            "right": right_res,
            "additional_find": eye_screening.additional_find or "",
            "recommendations": recommendations,
            "next_followup": (
                eye_screening.next_followup.isoformat()
                if isinstance(eye_screening.next_followup, datetime)
                else (eye_screening.next_followup or "")
            ),
            "prescriptions": prescriptions,
        }

    # Lab data
    lstrengths, lneed_attention = [], []
    if lab_data:
        for entry in getattr(lab_data, "questions_data", []) or []:
            if entry.get("question_type") == "Good Outcomes":
                lstrengths.extend(entry.get("answers", []))
            elif entry.get("question_type") == "Areas of Concern":
                lneed_attention.extend(entry.get("answers", []))

    # Image URLs — use base64 data URIs to avoid WeasyPrint making external HTTP requests
    profile_url: Optional[str] = None
    if getattr(student, "profile_image", None):
        if student.profile_image.startswith("data:"):
            profile_url = student.profile_image
        else:
            profile_url = await get_s3_image_as_data_uri(student.profile_image)

    REPORTS_DIR = Path(__file__).resolve().parent
    # Profile fallback: use local file:// to avoid an HTTP request from WeasyPrint
    profile_fallback = f"file://{REPORTS_DIR / 'Profile_icon1.png'}"
    left_logo_url = f"file://{REPORTS_DIR / 'logo-left.png'}"
    right_logo_url = school_logo_url
    gauge_url = f"file://{REPORTS_DIR / 'gauge.png'}"
    eye_url = f"file://{REPORTS_DIR / 'eye.png'}"
    profile = f"file://{REPORTS_DIR / 'Profile_icon1.png'}"
    need_attention = f"file://{REPORTS_DIR / 'needattention.png'}"
    all_good = f"file://{REPORTS_DIR / 'allgood.png'}"
    need_icon = f"file://{REPORTS_DIR / 'need_icon.png'}"
    key_findings = f"file://{REPORTS_DIR / 'key_findings.png'}"
    lab_main = f"file://{REPORTS_DIR / 'lab_main.png'}"
    need_bullet = f"file://{REPORTS_DIR / 'need_bullet.png'}"
    strength_icon= f"file://{REPORTS_DIR / 'strength_icon.png'}"

    eyee=f"file://{REPORTS_DIR / 'eyeeee.png'}"
    dental=f"file://{REPORTS_DIR / 'denal.png'}"
    emotional=f"file://{REPORTS_DIR / 'developmental.png'}"
    physical=f"file://{REPORTS_DIR / 'physical.png'}"
    nutrition=f"file://{REPORTS_DIR / 'nutritional.png'}"

    sidebar_icons = {
        "physical_icon": f"file://{REPORTS_DIR / 'Icon.png'}",
        "nutrition_icon": f"file://{REPORTS_DIR / 'Icon-1.png'}",
        "dental_icon": f"file://{REPORTS_DIR / 'Icon-3.png'}",
        "emotional_icon": f"file://{REPORTS_DIR / 'Icon-2.png'}",
        "eye_icon": f"file://{REPORTS_DIR / 'Icon-4.png'}",
        "labreports_icon": f"file://{REPORTS_DIR / 'Icon-5.png'}",
    }

    teeth = {
        num: f"file://{REPORTS_DIR / f'teeth-{num}.svg'}"
        for num in [
            11, 12, 13, 14, 15, 16, 17, 18,
            21, 22, 23, 24, 25, 26, 27, 28,
            31, 32, 33, 34, 35, 36, 37, 38,
            41, 42, 43, 44, 45, 46, 47, 48,
        ]
    }

    return {
        "request": request,
        "academic_year": academic_year,
        "student": student,
        "smart": smart_data,
        "school": school,
        "profile_url": profile_url or profile_fallback,
        "left_logo": left_logo_url,
        "right_logo": right_logo_url,
        "gauge": gauge_url,
        "eye2": eye_url,
        "eye": eye_report,
        "pysch": pysch_data,
        "pstatus": pysch_status,
        "pstrength": pstrengths,
        "pneedattention": pneed_attention,
        "behavioural_status": behavioural_status,
        "nqa": nqa,
        "nsa": nsa,
        "status": screening_analysis,
        "emo": emo_data,
        "dental": dental_data,
        "oral_examination": oral_exam,
        "highlight_teeth": highlight_teeth,
        "dental_concerns": dental_concerns,
        "diagnoses": diagnoses,
        "eye_concerns": eye_concerns,
        "treatment_recommendations": treatment_recommendations,
        "lab": lab_data,
        "ongoing_year": datetime.now().year,
        "lstrength": lstrengths,
        "profile": profile,
        "all_good": all_good,
        "ee":eyee,
        "dd":dental,
        "em":emotional,
        "ph":physical,
        "nu":nutrition,
        "need_attention": need_attention,
        "lconcern": lneed_attention,
        "ni": need_icon,
        "kf": key_findings,
        "li": lab_main,
        "nb": need_bullet,
        "si": strength_icon,
        **{f"teeth{num}": path for num, path in teeth.items()},
        **sidebar_icons,
    }

# =========================================================
# PDF background generation + status tracking
# =========================================================
TEMP_DIR = Path("/tmp/reports")
TEMP_DIR.mkdir(parents=True, exist_ok=True)
pdf_status: Dict[str, Dict[str, Any]] = {}
pdf_status_lock = asyncio.Lock()
PDF_TTL_SECONDS = 24 * 3600  # 24 hours

def is_pdf_fresh(path: Path) -> bool:
    """Check if existing PDF is still within TTL window."""
    return path.exists() and (time.time() - path.stat().st_mtime) < PDF_TTL_SECONDS

async def generate_pdf(student_id: int, request: Request, academic_year: Optional[str] = None):
    """Background PDF generation with status updates (Full Report)."""
    if academic_year is None:
        academic_year = get_current_academic_year()
    
    key = f"{student_id}_{academic_year}"
    async with pdf_status_lock:
        pdf_status[key] = {"ready": False, "status": "generating", "path": ""}

    try:
        print(f"🚀 Generating Full PDF for student {student_id}, academic year {academic_year}")
        context = await build_report_context(request, student_id, academic_year=academic_year)
        html_content = templates.get_template("reports.html").render(context)

        def render_pdf():
            import weasyprint
            return weasyprint.HTML(string=html_content, base_url=str(request.base_url)).write_pdf()

        pdf_bytes = await anyio.to_thread.run_sync(render_pdf)
        pdf_path = TEMP_DIR / f"report_{student_id}_{academic_year}.pdf"
        pdf_path.write_bytes(pdf_bytes)

        async with pdf_status_lock:
            pdf_status[key] = {"ready": True, "status": "ready", "path": str(pdf_path)}

        print(f"✅ PDF ready for student {student_id}, {academic_year}: {pdf_path}")

    except Exception as e:
        print(f"❌ Error generating PDF for {student_id}, {academic_year}: {e}")
        async with pdf_status_lock:
            pdf_status[key] = {"ready": False, "status": "error", "error": str(e)}

# =========================================================
# Regular endpoints (sync rendering)
# =========================================================
@router.get("/{student_id}", response_class=HTMLResponse)
async def get_report(
    request: Request, 
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    )
):
    """Render HTML report preview."""
    try:
        context = await build_report_context(request, student_id, academic_year=academic_year)
        return templates.TemplateResponse("reports.html", context)
    except HTTPException:
        raise

@router.get("/{student_id}/download", response_class=FileResponse)
async def download_report_pdf(
    request: Request, 
    student_id: int,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    )
):
    """Serve cached PDF instantly if available (Full Report)."""
    if academic_year is None:
        academic_year = get_current_academic_year()
    
    pdf_path = TEMP_DIR / f"report_{student_id}_{academic_year}.pdf"

    if is_pdf_fresh(pdf_path):
        return FileResponse(pdf_path, media_type="application/pdf", filename=f"report_{student_id}_{academic_year}.pdf")

    context = await build_report_context(request, student_id, academic_year=academic_year)
    html_content = templates.get_template("reports.html").render(context)

    def render_pdf():
        import weasyprint
        return weasyprint.HTML(string=html_content, base_url=str(request.base_url)).write_pdf()

    pdf_bytes = await anyio.to_thread.run_sync(render_pdf)
    pdf_path.write_bytes(pdf_bytes)

    key = f"{student_id}_{academic_year}"
    async with pdf_status_lock:
        pdf_status[key] = {"ready": True, "status": "ready", "path": str(pdf_path)}

    return FileResponse(pdf_path, media_type="application/pdf", filename=f"report_{student_id}_{academic_year}.pdf")

@router.delete("/delete-all-pdfs")
async def delete_all_pdfs():
    """Delete all generated report PDFs from /tmp/reports."""
    deleted = 0
    for pdf in TEMP_DIR.glob("*.pdf"):
        try:
            pdf.unlink()
            deleted += 1
        except Exception as e:
            print(f"Failed to delete {pdf}: {e}")

    async with pdf_status_lock:
        pdf_status.clear()
    return JSONResponse({"status": True, "message": f"Deleted {deleted} PDFs."})

# =========================================================
# SELECTED SECTION REPORT GENERATION
# =========================================================

# @router.post("/{student_id}/start-download-selected")
# async def start_download_selected(
#     student_id: int,
#     request: Request,
#     payload: Dict[str, Any],
#     background_tasks: BackgroundTasks,
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     )
# ):
#     """Start background PDF generation for selected sections."""
#     if academic_year is None:
#         academic_year = get_current_academic_year()
    
#     selected = [r.strip().lower() for r in payload.get("reports", []) if isinstance(r, str) and r.strip()]
#     if not selected:
#         raise HTTPException(status_code=400, detail="No sections selected")

#     selected_key = "_".join(sorted(selected))
#     cache_key = f"{student_id}_{academic_year}_{selected_key}"
#     pdf_path = TEMP_DIR / f"report_{cache_key}.pdf"
#     base_url = str(request.base_url).rstrip("/")

#     print(f"\n🟢 [PDF Debug] === Selected PDF Generation Start ===")
#     print(f"👤 Student ID: {student_id}")
#     print(f"📅 Academic Year: {academic_year}")
#     print(f"📦 Sections: {selected}")
#     print(f"🔑 Cache Key: {cache_key}")

#     # ✅ Use cached PDF if fresh
#     if is_pdf_fresh(pdf_path):
#         async with pdf_status_lock:
#             pdf_status[cache_key] = {"ready": True, "status": "ready", "path": str(pdf_path)}
#         print(f"📂 [PDF Debug] Fresh cached PDF found for {cache_key}")
#         return {
#             "status": True,
#             "message": "Cached PDF ready",
#             "download": f"{base_url}/api/v1/report/{student_id}/download-selected-ready?key={selected_key}&academic_year={academic_year}"
#         }

#     # ✅ Validate report data (ONLY for selected sections)
#     try:
#         print(f"🔍 [PDF Debug] Validating report context for {student_id} ({selected_key}, {academic_year})...")
#         await build_report_context(request, student_id, required_sections=selected, academic_year=academic_year)
#         print(f"✅ [PDF Debug] Validation passed for {cache_key}")
#     except HTTPException as e:
#         print(f"❌ [PDF Debug] Validation failed for {cache_key}: {e.detail}")
#         async with pdf_status_lock:
#             pdf_status[cache_key] = {"ready": False, "status": "error", "error": e.detail}
#         return {"status": "error", "message": e.detail}

#     async with pdf_status_lock:
#         pdf_status[cache_key] = {"ready": False, "status": "generating", "path": ""}
#     print(f"🚀 [PDF Debug] Background generation scheduled for {cache_key}")

#     # ✅ Background PDF generator
#     async def generate_selected_pdf():
#         try:
#             print(f"🧠 [PDF Debug] Building context for {cache_key}...")
#             context = await build_report_context(request, student_id, required_sections=selected, academic_year=academic_year)
            
#             context.update({
#                 "show_profile": True,
#                 "show_physical": "physical" in selected,
#                 "show_nutrition": "nutrition" in selected,
#                 "show_emotional": "emotional" in selected,
#                 "show_dental": "dental" in selected,
#                 "show_eye": "eye" in selected,
#                 "show_lab": "lab" in selected,
#             })
#             print(f"✅ [PDF Debug] Context ready for {selected_key}, {academic_year}")

#             html_content = templates.get_template("reports.html").render(context)
#             print(f"🖨️ [PDF Debug] Converting HTML → PDF...")

#             def render_pdf():
#                 import weasyprint
#                 return weasyprint.HTML(string=html_content, base_url=str(request.base_url)).write_pdf()

#             pdf_bytes = await anyio.to_thread.run_sync(render_pdf)
#             pdf_path.write_bytes(pdf_bytes)
#             print(f"💾 [PDF Debug] PDF written successfully → {pdf_path}")

#             async with pdf_status_lock:
#                 pdf_status[cache_key] = {"ready": True, "status": "ready", "path": str(pdf_path)}
#             print(f"✅ [PDF Debug] PDF generation completed for {cache_key}")

#         except Exception as e:
#             print(f"❌ [PDF Debug] Error generating PDF for {cache_key}: {e}")
#             async with pdf_status_lock:
#                 pdf_status[cache_key] = {"ready": False, "status": "error", "error": str(e)}

#     background_tasks.add_task(generate_selected_pdf)
#     print(f"⏳ [PDF Debug] Background task launched for {cache_key}\n")

#     return {
#         "status": False,
#         "message": f"PDF generation started for sections: {selected_key}, academic year: {academic_year}",
#         "check_status": f"{base_url}/api/v1/report/{student_id}/status-selected?key={selected_key}&academic_year={academic_year}"
#     }

# @router.get("/{student_id}/status-selected")
# async def check_selected_status(
#     request: Request, 
#     student_id: int, 
#     key: str,
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     )
# ):
#     """Check generation status of selected-section PDF."""
#     if academic_year is None:
#         academic_year = get_current_academic_year()
    
#     cache_key = f"{student_id}_{academic_year}_{key}"
#     pdf_path = TEMP_DIR / f"report_{cache_key}.pdf"
#     base_url = str(request.base_url).rstrip("/")

#     print(f"🔍 [PDF Debug] Checking status for {cache_key}...")
#     async with pdf_status_lock:
#         status = pdf_status.get(cache_key)
#     print(f"📊 [PDF Debug] Current in-memory status: {status}")

#     if status and status.get("ready") and is_pdf_fresh(Path(status.get("path", ""))):
#         print(f"✅ [PDF Debug] PDF ready for {cache_key}")
#         return {
#             "status": True,
#             "message": "PDF ready",
#             "download": f"{base_url}/api/v1/report/{student_id}/download-selected-ready?key={key}&academic_year={academic_year}"
#         }

#     if status and status.get("status") == "generating":
#         print(f"⚙️ [PDF Debug] Still generating for {cache_key}")
#         return {
#             "status": False,
#             "message": "PDF generation in progress"
#         }

#     if is_pdf_fresh(pdf_path):
#         print(f"📁 [PDF Debug] Fresh PDF found on disk for {cache_key}, restoring status cache...")
#         async with pdf_status_lock:
#             pdf_status[cache_key] = {"ready": True, "status": "ready", "path": str(pdf_path)}
#         return {
#             "status": True,
#             "message": "PDF ready",
#             "download": f"{base_url}/api/v1/report/{student_id}/download-selected-ready?key={key}&academic_year={academic_year}"
#         }

#     if status and status.get("status") == "error":
#         return {"status": "error", "message": status.get("error", "Unknown error during generation")}

#     print(f"❌ [PDF Debug] No report found for {cache_key}")
#     return {"status": "error", "message": "Report not yet generated"}

@router.get("/{student_id}/status-selected")
async def check_selected_status(
    request: Request, 
    student_id: int, 
    key: str,
    academic_year: Optional[str] = None
):
    """Check generation status of selected-section PDF."""
    cache_key = f"{student_id}_{key}_{academic_year or 'default'}"
    pdf_path = TEMP_DIR / f"report_{cache_key}.pdf"
    base_url = str(request.base_url).rstrip("/")

    print(f"🔍 [PDF Debug] Checking status for {cache_key}...")
    async with pdf_status_lock:
        status = pdf_status.get(cache_key)
    print(f"📊 [PDF Debug] Current in-memory status: {status}")

    if status and status.get("ready") and is_pdf_fresh(Path(status.get("path", ""))):
        print(f"✅ [PDF Debug] PDF ready for {cache_key}")
        return JSONResponse({
            "status": True,
            "message": "PDF ready",
            "academic_year": academic_year,
            "download": f"{base_url}/api/v1/report/{student_id}/download-selected?key={key}&academic_year={academic_year}&direct=true"  # ✅ CHANGED: Added &direct=true
        })

    if status and status.get("status") == "generating":
        print(f"⚙️ [PDF Debug] Still generating for {cache_key}")
        return JSONResponse({
            "status": False,
            "message": "PDF generation in progress",
            "academic_year": academic_year
        })

    if is_pdf_fresh(pdf_path):
        print(f"📁 [PDF Debug] Fresh PDF found on disk for {cache_key}, restoring status cache...")
        async with pdf_status_lock:
            pdf_status[cache_key] = {"ready": True, "status": "ready", "path": str(pdf_path)}
        return JSONResponse({
            "status": True,
            "message": "PDF ready",
            "academic_year": academic_year,
            "download": f"{base_url}/api/v1/report/{student_id}/download-selected?key={key}&academic_year={academic_year}&direct=true"  # ✅ CHANGED: Added &direct=true
        })

    if status and status.get("status") == "error":
         return JSONResponse({
             "status": "error", 
             "message": status.get("error", "Unknown error during generation"),
             "academic_year": academic_year
         })

    print(f"❌ [PDF Debug] No report found for {cache_key}")
    return JSONResponse({
        "status": "error", 
        "message": "Report not yet generated",
        "academic_year": academic_year
    })


# @router.get("/{student_id}/download-selected")
# async def download_selected_report(
#     request: Request, 
#     student_id: int, 
#     key: str,
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     )
# ):
#     """Check PDF availability and return URL to download-ready endpoint."""
#     if academic_year is None:
#         academic_year = get_current_academic_year()
    
#     cache_key = f"{student_id}_{academic_year}_{key}"
#     pdf_path = TEMP_DIR / f"report_{cache_key}.pdf"
#     base_url = str(request.base_url).rstrip("/")

#     print(f"⬇️ [PDF Debug] Download request received for {cache_key}")

#     if not pdf_path.exists():
#         return {
#             "status": False,
#             "message": "Report not found. Please regenerate."
#         }

#     if not is_pdf_fresh(pdf_path):
#         try:
#             pdf_path.unlink()
#         except Exception:
#             pass
#         async with pdf_status_lock:
#             pdf_status.pop(cache_key, None)
#         return {
#             "status": False,
#             "message": "Report expired. Please regenerate."
#         }

#     full_pdf_url = f"{base_url}/api/v1/report/{student_id}/download-selected-ready?key={key}&academic_year={academic_year}"
#     return {
#         "status": True,
#         "message": "PDF ready for download",
#         "pdf_url": full_pdf_url
#     }

# =========================================================
# MODIFIED: Add academic year filter to these 2 APIs only
# =========================================================

# @router.post("/{student_id}/start-download-selected")
# async def start_download_selected(
#     student_id: int,
#     request: Request,
#     payload: Dict[str, Any],
#     background_tasks: BackgroundTasks,
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     )
# ):
#     """Start background PDF generation for selected sections - Filtered by Academic Year."""
    
#     # Determine academic year
#     if academic_year is None:
#         academic_year = get_current_academic_year()
    
#     # Validate academic year format
#     try:
#         ay_start, ay_end = parse_academic_year(academic_year)
#     except ValueError as e:
#         return JSONResponse(
#             content={
#                 "status": False,
#                 "message": str(e),
#                 "errors": {"academic_year": str(e)}
#             },
#             status_code=400
#         )
    
#     selected = [r.strip().lower() for r in payload.get("reports", []) if isinstance(r, str) and r.strip()]
#     if not selected:
#         raise HTTPException(status_code=400, detail="No sections selected")

#     selected_key = "_".join(sorted(selected))
#     cache_key = f"{student_id}_{academic_year}_{selected_key}"
#     pdf_path = TEMP_DIR / f"report_{cache_key}.pdf"
#     base_url = str(request.base_url).rstrip("/")

#     print(f"\n🟢 [PDF Debug] === Selected PDF Generation Start ===")
#     print(f"👤 Student ID: {student_id}")
#     print(f"📅 Academic Year: {academic_year}")
#     print(f"📦 Sections: {selected}")
#     print(f"🔑 Cache Key: {cache_key}")

#     # ✅ Use cached PDF if fresh
#     if is_pdf_fresh(pdf_path):
#         async with pdf_status_lock:
#             pdf_status[cache_key] = {"ready": True, "status": "ready", "path": str(pdf_path)}
#         print(f"📂 [PDF Debug] Fresh cached PDF found for {cache_key}")
#         return JSONResponse(
#             content={
#                 "status": True,
#                 "message": "Cached PDF ready",
#                 "academic_year": academic_year,
#                 "download": f"{base_url}/api/v1/report/{student_id}/download-selected?key={selected_key}&academic_year={academic_year}"
#             },
#             headers={"X-Academic-Year": academic_year}
#         )

#     # ✅ Validate report data (ONLY for selected sections with academic year filter)
#     try:
#         print(f"🔍 [PDF Debug] Validating report context for {student_id} ({selected_key}, {academic_year})...")
#         await build_report_context(request, student_id, required_sections=selected, academic_year=academic_year)
#         print(f"✅ [PDF Debug] Validation passed for {cache_key}")
#     except HTTPException as e:
#         print(f"❌ [PDF Debug] Validation failed for {cache_key}: {e.detail}")
#         async with pdf_status_lock:
#             pdf_status[cache_key] = {"ready": False, "status": "error", "error": e.detail}
#         return JSONResponse(
#             content={
#                 "status": "error",
#                 "message": e.detail,
#                 "academic_year": academic_year
#             },
#             status_code=e.status_code
#         )

#     async with pdf_status_lock:
#         pdf_status[cache_key] = {"ready": False, "status": "generating", "path": ""}
#     print(f"🚀 [PDF Debug] Background generation scheduled for {cache_key}")

#     # ✅ Background PDF generator with academic year filter
#     async def generate_selected_pdf():
#         try:
#             print(f"🧠 [PDF Debug] Building context for {cache_key}...")
#             context = await build_report_context(request, student_id, required_sections=selected, academic_year=academic_year)
            
#             context.update({
#                 "show_profile": True,
#                 "show_physical": "physical" in selected,
#                 "show_nutrition": "nutrition" in selected,
#                 "show_emotional": "emotional" in selected,
#                 "show_dental": "dental" in selected,
#                 "show_eye": "eye" in selected,
#                 "show_lab": "lab" in selected,
#             })
#             print(f"✅ [PDF Debug] Context ready for {selected_key}, {academic_year}")

#             html_content = templates.get_template("reports.html").render(context)
#             print(f"🖨️ [PDF Debug] Converting HTML → PDF...")

#             def render_pdf():
#                 import weasyprint
#                 return weasyprint.HTML(string=html_content, base_url=str(request.base_url)).write_pdf()

#             pdf_bytes = await anyio.to_thread.run_sync(render_pdf)
#             pdf_path.write_bytes(pdf_bytes)
#             print(f"💾 [PDF Debug] PDF written successfully → {pdf_path}")

#             async with pdf_status_lock:
#                 pdf_status[cache_key] = {"ready": True, "status": "ready", "path": str(pdf_path)}
#             print(f"✅ [PDF Debug] PDF generation completed for {cache_key}")

#         except Exception as e:
#             print(f"❌ [PDF Debug] Error generating PDF for {cache_key}: {e}")
#             async with pdf_status_lock:
#                 pdf_status[cache_key] = {"ready": False, "status": "error", "error": str(e)}

#     background_tasks.add_task(generate_selected_pdf)
#     print(f"⏳ [PDF Debug] Background task launched for {cache_key}\n")

#     return JSONResponse(
#         content={
#             "status": False,
#             "message": f"PDF generation started for sections: {', '.join(selected)}, academic year: {academic_year}",
#             "academic_year": academic_year,
#             "check_status": f"{base_url}/api/v1/report/{student_id}/status-selected?key={selected_key}&academic_year={academic_year}"
#         },
#         headers={"X-Academic-Year": academic_year}
#     )

# @router.post("/{student_id}/start-download-selected")
# async def start_download_selected(
#     student_id: int,
#     request: Request,
#     payload: Dict[str, Any],
#     background_tasks: BackgroundTasks,
#     academic_year: Optional[str] = None  # ✅ NEW: Add academic year query param
# ):
#     """
#     Start background PDF generation for selected sections.
#     """
#     selected = [r.strip().lower() for r in payload.get("reports", []) if isinstance(r, str) and r.strip()]
#     if not selected:
#         raise HTTPException(status_code=400, detail="No sections selected")

#     selected_key = "_".join(sorted(selected))
#     # ✅ CHANGED: Include academic_year in cache key
#     cache_key = f"{student_id}_{selected_key}_{academic_year or 'default'}"
#     pdf_path = TEMP_DIR / f"report_{cache_key}.pdf"
#     base_url = str(request.base_url).rstrip("/")

#     print(f"\n🟢 [PDF Debug] === Selected PDF Generation Start ===")
#     print(f"👤 Student ID: {student_id}")
#     print(f"📦 Sections: {selected}")
#     print(f"📅 Academic Year: {academic_year}")  # ✅ NEW
#     print(f"🔑 Cache Key: {cache_key}")

#     # ✅ Use cached PDF if fresh
#     if is_pdf_fresh(pdf_path):
#         async with pdf_status_lock:
#             pdf_status[cache_key] = {"ready": True, "status": "ready", "path": str(pdf_path)}
#         print(f"📂 [PDF Debug] Fresh cached PDF found for {cache_key}")
#         return JSONResponse({
#             "status": True,
#             "message": "Cached PDF ready",
#             "academic_year": academic_year,  # ✅ NEW
#             "download": f"{base_url}/api/v1/report/{student_id}/download-selected?key={selected_key}&academic_year={academic_year}"
#         })

#     # Validation
#     try:
#         print(f"🔍 [PDF Debug] Validating report context for {student_id} ({selected_key})...")
#         await build_report_context(request, student_id, required_sections=selected)
#         print(f"✅ [PDF Debug] Validation passed for {cache_key}")
#     except HTTPException as e:
#         print(f"❌ [PDF Debug] Validation failed for {cache_key}: {e.detail}")
#         async with pdf_status_lock:
#             pdf_status[cache_key] = {"ready": False, "status": "error", "error": e.detail}
#         return JSONResponse({"status": "error", "message": e.detail})

#     async with pdf_status_lock:
#         pdf_status[cache_key] = {"ready": False, "status": "generating", "path": ""}
#     print(f"🚀 [PDF Debug] Background generation scheduled for {cache_key}")

#     # Background PDF generator
#     async def generate_selected_pdf():
#         try:
#             print(f"🧠 [PDF Debug] Building context for {cache_key}...")
#             context = await build_report_context(request, student_id, required_sections=selected)
            
#             context.update({
#                 "show_profile": True,
#                 "show_physical": "physical" in selected,
#                 "show_nutrition": "nutrition" in selected,
#                 "show_emotional": "emotional" in selected,
#                 "show_dental": "dental" in selected,
#                 "show_eye": "eye" in selected,
#                 "show_lab": "lab" in selected,
#             })
#             print(f"✅ [PDF Debug] Context ready for {selected_key}")

#             html_content = templates.get_template("reports.html").render(context)
#             print(f"🖨️ [PDF Debug] Converting HTML → PDF...")

#             def render_pdf():
#                 import weasyprint
#                 return weasyprint.HTML(string=html_content, base_url=str(request.base_url)).write_pdf()

#             pdf_bytes = await anyio.to_thread.run_sync(render_pdf)
#             pdf_path.write_bytes(pdf_bytes)
#             print(f"💾 [PDF Debug] PDF written successfully → {pdf_path}")

#             async with pdf_status_lock:
#                 pdf_status[cache_key] = {"ready": True, "status": "ready", "path": str(pdf_path)}
#             print(f"✅ [PDF Debug] PDF generation completed for {cache_key}")

#         except Exception as e:
#             print(f"❌ [PDF Debug] Error generating PDF for {cache_key}: {e}")
#             async with pdf_status_lock:
#                 pdf_status[cache_key] = {"ready": False, "status": "error", "error": str(e)}

#     background_tasks.add_task(generate_selected_pdf)
#     print(f"⏳ [PDF Debug] Background task launched for {cache_key}\n")

#     # ✅ CHANGED: Include academic_year in response
#     return JSONResponse({
#         "status": False,
#         "message": f"PDF generation started for sections: {', '.join(selected)}, academic year: {academic_year or 'default'}",
#         "academic_year": academic_year,  # ✅ NEW
#         "check_status": f"{base_url}/api/v1/report/{student_id}/status-selected?key={selected_key}&academic_year={academic_year}"
#     })

@router.post("/{student_id}/start-download-selected")
async def start_download_selected(
    student_id: int,
    request: Request,
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks,
    academic_year: Optional[str] = None
):
    """
    Start background PDF generation for selected sections.
    """
    selected = [r.strip().lower() for r in payload.get("reports", []) if isinstance(r, str) and r.strip()]
    if not selected:
        raise HTTPException(status_code=400, detail="No sections selected")

    selected_key = "_".join(sorted(selected))
    cache_key = f"{student_id}_{selected_key}_{academic_year or 'default'}"
    pdf_path = TEMP_DIR / f"report_{cache_key}.pdf"
    base_url = str(request.base_url).rstrip("/")

    print(f"\n🟢 [PDF Debug] === Selected PDF Generation Start ===")
    print(f"👤 Student ID: {student_id}")
    print(f"📦 Sections: {selected}")
    print(f"📅 Academic Year: {academic_year}")
    print(f"🔑 Cache Key: {cache_key}")

    # ✅ Use cached PDF if fresh
    if is_pdf_fresh(pdf_path):
        async with pdf_status_lock:
            pdf_status[cache_key] = {"ready": True, "status": "ready", "path": str(pdf_path)}
        print(f"📂 [PDF Debug] Fresh cached PDF found for {cache_key}")
        return JSONResponse({
            "status": True,
            "message": "Cached PDF ready",
            "academic_year": academic_year,
            "download": f"{base_url}/api/v1/report/{student_id}/download-selected?key={selected_key}&academic_year={academic_year}&direct=true"  # ✅ CHANGED: Added &direct=true
        })

    async with pdf_status_lock:
        pdf_status[cache_key] = {"ready": False, "status": "generating", "path": ""}
    print(f"🚀 [PDF Debug] Background generation scheduled for {cache_key}")

    # Background PDF generator
    async def generate_selected_pdf():
        try:
            print(f"🧠 [PDF Debug] Building context for {cache_key}...")
            context = await build_report_context(request, student_id, required_sections=selected, strict=False)
            
            context.update({
                "show_profile": True,
                "show_physical": "physical" in selected,
                "show_nutrition": "nutrition" in selected,
                "show_emotional": "emotional" in selected,
                "show_dental": "dental" in selected,
                "show_eye": "eye" in selected,
                "show_lab": "lab" in selected,
            })
            print(f"✅ [PDF Debug] Context ready for {selected_key}")

            html_content = templates.get_template("reports.html").render(context)
            print(f"🖨️ [PDF Debug] Converting HTML → PDF...")

            def render_pdf():
                import weasyprint
                return weasyprint.HTML(string=html_content, base_url=str(request.base_url)).write_pdf()

            pdf_bytes = await anyio.to_thread.run_sync(render_pdf)
            pdf_path.write_bytes(pdf_bytes)
            print(f"💾 [PDF Debug] PDF written successfully → {pdf_path}")

            async with pdf_status_lock:
                pdf_status[cache_key] = {"ready": True, "status": "ready", "path": str(pdf_path)}
            print(f"✅ [PDF Debug] PDF generation completed for {cache_key}")

        except Exception as e:
            print(f"❌ [PDF Debug] Error generating PDF for {cache_key}: {e}")
            async with pdf_status_lock:
                pdf_status[cache_key] = {"ready": False, "status": "error", "error": str(e)}

    background_tasks.add_task(generate_selected_pdf)
    print(f"⏳ [PDF Debug] Background task launched for {cache_key}\n")

    return JSONResponse({
        "status": False,
        "message": f"PDF generation started for sections: {', '.join(selected)}, academic year: {academic_year or 'default'}",
        "academic_year": academic_year,
        "check_status": f"{base_url}/api/v1/report/{student_id}/status-selected?key={selected_key}&academic_year={academic_year}"
    })

# @router.get("/{student_id}/download-selected", response_class=JSONResponse)
# async def download_selected_report(
#     request: Request, 
#     student_id: int, 
#     key: str,
#     academic_year: Optional[str] = None  # ✅ NEW: Add academic year query param
# ):
#     """Check PDF availability and return S3 URL for download."""
#     cache_key = f"{student_id}_{key}_{academic_year or 'default'}"  # ✅ CHANGED
#     pdf_path = TEMP_DIR / f"report_{cache_key}.pdf"

#     print(f"⬇️ [PDF Debug] Download request received for {cache_key}")

#     # Not found
#     if not pdf_path.exists():
#         return JSONResponse({
#             "status": False,
#             "message": "Report not found. Please regenerate."
#         })

#     # Expired
#     if not is_pdf_fresh(pdf_path):
#         try:
#             pdf_path.unlink()
#         except Exception:
#             pass
#         async with pdf_status_lock:
#             pdf_status.pop(cache_key, None)
#         return JSONResponse({
#             "status": False,
#             "message": "Report expired. Please regenerate."
#         })

#     # ✅ CHANGED: Upload PDF to S3 and return presigned URL
#     try:
#         # Generate S3 key
#         folder = f"reports/{academic_year or 'default'}/{student_id}"
#         s3_key = f"{folder}/report_{cache_key}.pdf"
        
#         # Upload to S3
#         with open(pdf_path, 'rb') as pdf_file:
#             s3_client.put_object(
#                 Bucket=AWS_S3_BUCKET_NAME,
#                 Key=s3_key,
#                 Body=pdf_file,
#                 ContentType='application/pdf'
#             )
        
#         # Generate presigned URL (valid for 1 hour)
#         s3_url = await get_new_url(s3_key, use_presigned=True, full_url=True)
        
#         print(f"✅ [PDF Debug] S3 URL generated: {s3_url}")
        
#         return JSONResponse({
#             "status": True,
#             "message": "PDF ready for download",
#             "academic_year": academic_year,  # ✅ NEW
#             "pdf_url": s3_url  # ✅ CHANGED: Return S3 presigned URL
#         })
        
#     except Exception as e:
#         print(f"❌ [PDF Debug] Error uploading to S3: {e}")
#         return JSONResponse({
#             "status": False,
#             "message": f"Error generating download link: {str(e)}"
#         })

@router.post("/{student_id}/create-download-token")
async def create_pdf_download_token(
    student_id: int,
    key: str,
    academic_year: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Issue a short-lived (60s) one-time download token for direct browser download."""
    token = str(uuid.uuid4())
    cache = ObjectCache(cache_key=f"pdf-dl-token:{token}")
    await cache.set({"student_id": student_id, "key": key, "academic_year": academic_year}, ttl=60)
    return JSONResponse({"status": True, "token": token})


@router.get("/{student_id}/download-selected")
async def download_selected_report(
    request: Request,
    student_id: int,
    key: str,
    academic_year: Optional[str] = None,
    direct: bool = False,
    download_token: Optional[str] = None,  # one-time token for direct browser download
):
    """Check PDF availability and return download URL, or serve file directly if direct=true."""
    # Validate one-time download token (used for direct browser downloads)
    if download_token:
        token_cache = ObjectCache(cache_key=f"pdf-dl-token:{download_token}")
        token_data = await token_cache.get()
        if not token_data:
            return JSONResponse(
                {"status": False, "message": "Download link expired or invalid. Please try again."},
                status_code=401
            )
        # Consume the token (delete it so it can't be reused)
        await token_cache.delete()

    # ✅ Try with academic_year first, then fallback to 'default'
    cache_key_with_year = f"{student_id}_{key}_{academic_year}" if academic_year else None
    cache_key_default = f"{student_id}_{key}_default"
    
    # Try both possible cache keys
    pdf_path = None
    final_cache_key = None
    final_academic_year = academic_year or "default"
    
    if cache_key_with_year:
        pdf_path_with_year = TEMP_DIR / f"report_{cache_key_with_year}.pdf"
        if pdf_path_with_year.exists():
            pdf_path = pdf_path_with_year
            final_cache_key = cache_key_with_year
            final_academic_year = academic_year
    
    if not pdf_path:
        pdf_path_default = TEMP_DIR / f"report_{cache_key_default}.pdf"
        if pdf_path_default.exists():
            pdf_path = pdf_path_default
            final_cache_key = cache_key_default
            final_academic_year = "default"

    print(f"⬇️ [PDF Debug] Download request received for {final_cache_key or cache_key_with_year or cache_key_default}, direct={direct}")

    # Check in-memory status for errors (background task may have failed)
    possible_cache_keys = [k for k in [cache_key_with_year, cache_key_default] if k]
    async with pdf_status_lock:
        status_info = None
        for ck in possible_cache_keys:
            if ck in pdf_status:
                status_info = pdf_status[ck]
                break
    if status_info and status_info.get("status") == "error":
        print(f"❌ [PDF Debug] Error status detected for {possible_cache_keys}: {status_info.get('error')}")
        return JSONResponse({
            "status": "error",
            "message": status_info.get("error", "PDF generation failed. Please try again.")
        })

    # Not found
    if not pdf_path or not pdf_path.exists():
        return JSONResponse({
            "status": False,
            "message": "Report not found. Please regenerate."
        })

    # Expired
    if not is_pdf_fresh(pdf_path):
        try:
            pdf_path.unlink()
        except Exception:
            pass
        async with pdf_status_lock:
            if final_cache_key:
                pdf_status.pop(final_cache_key, None)
        return JSONResponse({
            "status": False,
            "message": "Report expired. Please regenerate."
        })

    # ✅ If direct=true, serve the PDF file
    if direct:
        print(f"📄 [PDF Debug] Serving PDF file directly: {final_cache_key}")
        # Build a friendly filename: "First Last - Class 5A.pdf"
        try:
            student_obj = await Students.get_or_none(id=student_id)
            if student_obj:
                student_name = f"{student_obj.first_name or ''} {student_obj.last_name or ''}".strip()
                school_student = await SchoolStudents.get_or_none(student_id=student_id)
                if school_student and school_student.class_room:
                    class_section = f"Class {school_student.class_room}{school_student.section or ''}".strip()
                    pdf_filename = f"{student_name} - {class_section}.pdf"
                else:
                    pdf_filename = f"{student_name}.pdf" if student_name else f"report_{student_id}.pdf"
            else:
                pdf_filename = f"report_{student_id}_{final_academic_year}.pdf"
        except Exception:
            pdf_filename = f"report_{student_id}_{final_academic_year}.pdf"
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=pdf_filename,
            headers={"Content-Disposition": f'attachment; filename="{pdf_filename}"'}
        )

    # ✅ Otherwise, return JSON with download URL (add &direct=true)
    base_url = str(request.base_url).rstrip("/")
    download_url = f"{base_url}/api/v1/report/{student_id}/download-selected?key={key}&academic_year={final_academic_year}&direct=true"
    
    print(f"✅ [PDF Debug] Returning download URL: {download_url}")
    
    return JSONResponse({
        "status": True,
        "message": "Cached PDF ready",
        "academic_year": final_academic_year,
        "download": download_url
    })


# @router.get("/{student_id}/download-selected")
# async def download_selected_report(
#     request: Request, 
#     student_id: int, 
#     key: str,
#     academic_year: Optional[str] = Query(
#         None,
#         description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
#         regex=r"^\d{4}-\d{4}$"
#     )
# ):
#     """Download PDF directly for selected sections filtered by academic year."""
    
#     # Determine academic year
#     if academic_year is None:
#         academic_year = get_current_academic_year()
    
#     # Validate academic year format
#     try:
#         ay_start, ay_end = parse_academic_year(academic_year)
#     except ValueError as e:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Invalid academic year format: {str(e)}"
#         )
    
#     cache_key = f"{student_id}_{academic_year}_{key}"
#     pdf_path = TEMP_DIR / f"report_{cache_key}.pdf"

#     print(f"⬇️ [PDF Debug] Download request received for {cache_key} (academic year: {academic_year})")

#     # Check if PDF exists
#     if not pdf_path.exists():
#         raise HTTPException(
#             status_code=404,
#             detail=f"Report not found for student {student_id}, academic year {academic_year}. Please generate the report first."
#         )

#     # Check if PDF is fresh
#     if not is_pdf_fresh(pdf_path):
#         try:
#             pdf_path.unlink()
#         except Exception:
#             pass
#         async with pdf_status_lock:
#             pdf_status.pop(cache_key, None)
#         raise HTTPException(
#             status_code=410,
#             detail=f"Report expired for academic year {academic_year}. Please regenerate."
#         )

#     # Return file for direct download
#     print(f"📄 [PDF Debug] Serving PDF file for {cache_key}")
#     response = FileResponse(
#         path=pdf_path,
#         media_type="application/pdf",
#         filename=f"report_{student_id}_{academic_year}_selected.pdf",
#         headers={
#             "Content-Disposition": f'attachment; filename="report_{student_id}_{academic_year}_selected.pdf"',
#             "X-Academic-Year": academic_year
#         }
#     )
#     return response


@router.get("/{student_id}/download-selected-ready")
async def download_selected_ready(
    request: Request, 
    student_id: int, 
    key: str,
    academic_year: Optional[str] = Query(
        None,
        description="Academic year in format 'YYYY-YYYY' (e.g., '2024-2025'). Defaults to current year.",
        regex=r"^\d{4}-\d{4}$"
    )
):
    """If cached selected-section PDF exists → download it directly, else return status JSON."""
    if academic_year is None:
        academic_year = get_current_academic_year()
    
    cache_key = f"{student_id}_{academic_year}_{key}"
    pdf_path = TEMP_DIR / f"report_{cache_key}.pdf"

    print(f"🔍 [PDF Debug] Checking ready status for {cache_key}...")

    if pdf_path.exists() and is_pdf_fresh(pdf_path):
        print(f"📄 [PDF Debug] Sending FileResponse for {cache_key}")
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"report_{cache_key}.pdf",
            headers={"Content-Disposition": f'attachment; filename="report_{cache_key}.pdf"'}
        )

    print(f"❌ [PDF Debug] No recent PDF for {cache_key}. Generation required.")
    base_url = str(request.base_url).rstrip("/")
    next_url = f"{base_url}/api/v1/report/{student_id}/start-download-selected?academic_year={academic_year}"

    async with pdf_status_lock:
        pdf_status[cache_key] = {"ready": False, "status": "not_ready", "path": ""}

    return {
        "status": False,
        "message": "No recent PDF found. Please start generation.",
        "next": next_url
    }