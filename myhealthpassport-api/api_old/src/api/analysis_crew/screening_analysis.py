from fastapi import APIRouter, Depends

from src.api.analysis_crew import router
from src.core.manager import get_current_user
from src.models.screening_models import ScreeningReportsSummary
from src.models.user_models import ScreeningTeamRoles
from src.schemas.screening_schema import ScreeningReportsSummaryCreate, ScreeningReportsSummaryResponse
from src.utils.response import StandardResponse


@router.post("/screening-reports-summary", response_model=StandardResponse)
async def create_screening_reports_summary(
    report_data: ScreeningReportsSummaryCreate,
    current_user: dict = Depends(get_current_user)
):
    # RBAC: Only SUPER_ADMIN or PROGRAM_COORDINATOR can create reports
    user_role = current_user["user_role"]
    if user_role not in [ScreeningTeamRoles.PHYSICAL_WELLBEING, ScreeningTeamRoles.DENTIST,ScreeningTeamRoles.EYE_SPECIALIST,ScreeningTeamRoles.NUTRITIONIST,ScreeningTeamRoles.PSYCHOLOGIST]:
        return StandardResponse(
            status=False,
            message="Unauthorized to create screening reports",
            errors={"authorization": "User lacks required permissions"}
        )

    # Prepare data for creation
    report_dict = report_data.dict()
    report_dict["created_by"] = current_user["user_id"]
    report_dict["updated_by"] = current_user["user_id"]
    report_dict["student_id"] = report_data.student_id

    # Create the report
    try:
        report = await ScreeningReportsSummary.create(**report_dict)
    except Exception as e:
        return StandardResponse(
            status=False,
            message=f"Error creating screening report: {str(e)}",
            errors={"database_error": f"Failed to create report: {str(e)}"}
        )

    # Return the created report
    return StandardResponse(
        status=True,
        message="Screening report created successfully",
        data=ScreeningReportsSummaryResponse.model_validate(report).dict()
    )