import csv
import io
import json
from typing import Optional

from fastapi import Query, Depends
from fastapi.responses import StreamingResponse

from src.core.manager import get_current_user
from src.models.student_models import Students, SmartScaleData
from src.models.screening_models import NutritionScreening
from src.models.other_models import ClinicalRecomendations, ClinicalFindings
from . import router


def _make_student_name(student) -> str:
    parts = [student.first_name, student.middle_name, student.last_name]
    return " ".join(p for p in parts if p and p.strip()).strip()


def _extract_answers(questions_data, question_type: str) -> str:
    """Pull answer list for a given question_type out of a report's questions_data."""
    if not questions_data:
        return ""
    if isinstance(questions_data, str):
        try:
            questions_data = json.loads(questions_data)
        except Exception:
            return ""
    for qd in questions_data:
        if isinstance(qd, dict) and qd.get("question_type") == question_type:
            answers = qd.get("answers", [])
            if isinstance(answers, list):
                return "; ".join(str(a) for a in answers if a)
            return str(answers)
    return ""


async def _get_students(school_id: int, class_name: Optional[str], section: Optional[str]):
    """Return students filtered by school / class / section, ordered for export."""
    filters = {"school_students__school_id": school_id, "is_deleted": False}
    if class_name:
        filters["class_room"] = class_name
    if section:
        filters["section"] = section.upper()
    return await Students.filter(**filters).order_by("class_room", "section", "roll_no")


def _filename_suffix(class_name, section) -> str:
    label = f"Class{class_name}" if class_name else "AllClasses"
    if section:
        label += section.upper()
    return label


# ─────────────────────────────────────────────────────────────────────────────
# 1. Nutrition Screening Checklist
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/export/nutrition-checklist")
async def export_nutrition_checklist(
    school_id: int = Query(..., description="School ID"),
    class_name: Optional[str] = Query(None, description="Class (e.g. 9)"),
    section: Optional[str] = Query(None, description="Section (e.g. A)"),
    current_user: dict = Depends(get_current_user),
):
    students = await _get_students(school_id, class_name, section)
    student_ids = [s.id for s in students]

    screenings = (
        await NutritionScreening.filter(student_id__in=student_ids, is_deleted=False)
        .order_by("-created_at")
        .all()
    )
    # keep only the most-recent entry per student
    seen = set()
    screening_map = {}
    for ns in screenings:
        if ns.student_id not in seen:
            screening_map[ns.student_id] = ns
            seen.add(ns.student_id)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Roll No", "Name", "Gender", "Class", "Section",
        "Eyes", "Hair", "Mouth/Lips", "Skin", "Nails", "Teeth",
        "General Signs", "Bone & Muscle", "Notes", "Saved At",
    ])

    for student in students:
        ns = screening_map.get(student.id)
        writer.writerow([
            student.roll_no,
            _make_student_name(student),
            student.gender,
            student.class_room,
            student.section,
            ns.eyes if ns else "",
            ns.hair if ns else "",
            ns.mouth_lips if ns else "",
            ns.skin if ns else "",
            ns.nails if ns else "",
            ns.teeth if ns else "",
            ns.general_signs if ns else "",
            ns.bone_muscle if ns else "",
            ns.note if ns else "",
            ns.created_at.strftime("%Y-%m-%d %H:%M") if ns else "",
        ])

    filename = f"nutrition-checklist_{_filename_suffix(class_name, section)}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─────────────────────────────────────────────────────────────────────────────
# 2. Nutritional Analyst Report
# ─────────────────────────────────────────────────────────────────────────────
REPORT_TYPES = [
    "Physical Screening Report",
    "Questionnaire Reports",
    "Nutrition Deficiency Report",
    "Lab Reports",
]


@router.get("/export/nutrition-analysis")
async def export_nutrition_analysis(
    school_id: int = Query(...),
    class_name: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    students = await _get_students(school_id, class_name, section)
    student_ids = [s.id for s in students]

    recs = await ClinicalRecomendations.filter(
        student_id__in=student_ids, is_deleted=False
    ).all()

    # Group: student_id → {report_type → record}
    recs_by_student: dict = {}
    for r in recs:
        recs_by_student.setdefault(r.student_id, {})[r.report_type] = r

    output = io.StringIO()
    writer = csv.writer(output)

    headers = ["Roll No", "Name", "Gender", "Class", "Section"]
    for rt in REPORT_TYPES:
        short = rt.replace(" Report", "").replace(" Reports", "")
        headers += [
            f"{short} - Good Outcomes",
            f"{short} - Areas of Concern",
            f"{short} - Summary",
            f"{short} - Status",
        ]
    headers += ["Common Status", "Common Summary", "Clinical Notes", "Analysis Status", "Last Updated"]
    writer.writerow(headers)

    for student in students:
        student_recs = recs_by_student.get(student.id, {})
        any_rec = next(iter(student_recs.values()), None)

        row = [
            student.roll_no,
            _make_student_name(student),
            student.gender,
            student.class_room,
            student.section,
        ]

        for rt in REPORT_TYPES:
            rec = student_recs.get(rt)
            qdata = rec.questions_data if rec else None
            row += [
                _extract_answers(qdata, "Good Outcomes"),
                _extract_answers(qdata, "Areas of Concern"),
                rec.summary or "" if rec else "",
                rec.status or "" if rec else "",
            ]

        row += [
            any_rec.common_status or "" if any_rec else "",
            any_rec.common_summary or "" if any_rec else "",
            any_rec.clinical_notes or "" if any_rec else "",
            "Complete" if (any_rec and any_rec.analysis_status) else "Incomplete",
            any_rec.updated_at.strftime("%Y-%m-%d %H:%M") if any_rec else "",
        ]
        writer.writerow(row)

    filename = f"nutrition-analysis_{_filename_suffix(class_name, section)}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─────────────────────────────────────────────────────────────────────────────
# 3. Psychology Analysis
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/export/psychology-analysis")
async def export_psychology_analysis(
    school_id: int = Query(...),
    class_name: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    students = await _get_students(school_id, class_name, section)
    student_ids = [s.id for s in students]

    findings_qs = await ClinicalFindings.filter(
        student_id__in=student_ids, is_deleted=False
    ).all()
    # keep most recent per student
    seen = set()
    findings_map = {}
    for cf in findings_qs:
        if cf.student_id not in seen:
            findings_map[cf.student_id] = cf
            seen.add(cf.student_id)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Roll No", "Name", "Gender", "Class", "Section",
        "Good Strengths - Findings", "Good Strengths - Remarks",
        "Need Attention - Findings", "Need Attention - Remarks",
        "Status", "Summary", "Clinical Notes & Recommendations",
        "Analysis Status", "Last Updated",
    ])

    def _flatten_findings(data_list) -> tuple[str, str]:
        """Return (findings_str, remarks_str) from a list of {findings, remarks} dicts."""
        if not data_list:
            return ("", "")
        try:
            if isinstance(data_list, str):
                data_list = json.loads(data_list)
        except Exception:
            return ("", "")
        findings = "; ".join(item.get("findings", "") for item in data_list if item.get("findings"))
        remarks = "; ".join(item.get("remarks", "") for item in data_list if item.get("remarks"))
        return (findings, remarks)

    for student in students:
        cf = findings_map.get(student.id)
        good_findings, good_remarks = _flatten_findings(cf.findings_data if cf else None)
        need_findings, need_remarks = _flatten_findings(cf.need_attention_data if cf else None)

        writer.writerow([
            student.roll_no,
            _make_student_name(student),
            student.gender,
            student.class_room,
            student.section,
            good_findings,
            good_remarks,
            need_findings,
            need_remarks,
            cf.status or "" if cf else "",
            cf.summary or "" if cf else "",
            cf.clinical_notes_recommendations or "" if cf else "",
            "Complete" if (cf and cf.analysis_status) else "Incomplete",
            cf.updated_at.strftime("%Y-%m-%d %H:%M") if cf else "",
        ])

    filename = f"psychology-analysis_{_filename_suffix(class_name, section)}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─────────────────────────────────────────────────────────────────────────────
# 4. Smart Scale Data
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/export/smart-scale")
async def export_smart_scale(
    school_id: int = Query(...),
    class_name: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    students = await _get_students(school_id, class_name, section)
    student_ids = [s.id for s in students]

    smart_data = (
        await SmartScaleData.filter(student_id__in=student_ids)
        .order_by("student_id", "-weighing_time")
        .all()
    )
    # latest entry per student
    seen = set()
    smart_map = {}
    for sd in smart_data:
        if sd.student_id not in seen:
            smart_map[sd.student_id] = sd
            seen.add(sd.student_id)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Roll No", "Name", "Gender", "Class", "Section",
        "Height (cm)", "Age (years)", "Weighing Time", "Body Weight (kg)", "BMI",
        "Body Fat Rate (%)", "Fat Content (kg)", "Lean Body Mass (kg)",
        "Muscle Mass (kg)", "Muscle Rate (%)", "Skeletal Muscle Mass (kg)",
        "Skeletal Muscle Mass Index", "Bone Mass (kg)", "Protein Content (kg)",
        "Internal Protein Rate (%)", "Visceral Fat Level", "Subcutaneous Fat Volume (kg)",
        "Subcutaneous Fat Rate (%)", "Water Content (kg)", "Body Moisture (%)",
        "Standard Body Weight (kg)", "Ideal Weight (kg)", "Physical Score",
        "Physical Age", "Body Type", "Heart Rate (bpm)", "Health Level",
        "Left Hand Fat Mass (kg)", "Right Hand Fat Mass (kg)",
        "Left Foot Fat Mass (kg)", "Right Foot Fat Mass (kg)", "Trunk Fat Mass (kg)",
        "Left Hand Muscle Mass (kg)", "Right Hand Muscle Mass (kg)",
        "Left Foot Muscle Mass (kg)", "Right Foot Muscle Mass (kg)", "Trunk Muscle Mass (kg)",
        "Saved At",
    ])

    for student in students:
        sd = smart_map.get(student.id)
        writer.writerow([
            student.roll_no,
            _make_student_name(student),
            student.gender,
            student.class_room,
            student.section,
            sd.height_cm if sd else "",
            sd.age_years if sd else "",
            sd.weighing_time.strftime("%Y-%m-%d %H:%M") if (sd and sd.weighing_time) else "",
            sd.body_weight_kg if sd else "",
            sd.bmi if sd else "",
            sd.body_fat_rate_percent if sd else "",
            sd.fat_content_kg if sd else "",
            sd.lean_body_mass_kg if sd else "",
            sd.muscle_mass_kg if sd else "",
            sd.muscle_rate_percent if sd else "",
            sd.skeletal_muscle_mass_kg if sd else "",
            sd.skeletal_muscle_mass_index if sd else "",
            sd.bone_mass_kg if sd else "",
            sd.protein_content_kg if sd else "",
            sd.internal_protein_rate_percent if sd else "",
            sd.visceral_fat_level if sd else "",
            sd.subcutaneous_fat_volume_kg if sd else "",
            sd.subcutaneous_fat_rate if sd else "",
            sd.water_content_kg if sd else "",
            sd.body_moisture_content_percent if sd else "",
            sd.standard_body_weight if sd else "",
            sd.ideal_weight if sd else "",
            sd.physical_score if sd else "",
            sd.physical_age if sd else "",
            sd.body_type if sd else "",
            sd.heart_rate_beats_min if sd else "",
            sd.health_level if sd else "",
            sd.left_hand_fat_mass_kg if sd else "",
            sd.right_hand_fat_mass_kg if sd else "",
            sd.left_foot_fat_mass_kg if sd else "",
            sd.right_foot_fat_mass_kg if sd else "",
            sd.trunk_fat_mass_kg if sd else "",
            sd.left_hand_muscle_mass_kg if sd else "",
            sd.right_hand_muscle_mass_kg if sd else "",
            sd.left_foot_muscle_mass_kg if sd else "",
            sd.right_foot_muscle_mass_kg if sd else "",
            sd.trunk_muscle_mass_kg if sd else "",
            sd.weighing_time.strftime("%Y-%m-%d %H:%M") if (sd and sd.weighing_time) else "",
        ])

    filename = f"smart-scale_{_filename_suffix(class_name, section)}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
