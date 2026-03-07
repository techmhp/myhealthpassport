from fastapi import APIRouter, HTTPException, Depends
from tortoise.transactions import in_transaction
from src.models.other_models import LabTests
from src.schemas.other_schema import LabTestsCreate, LabTestBookingRequest
from src.utils.response import StandardResponse
from src.core.manager import get_current_user
from src.api.doctor import router


@router.post("/labtests/create", response_model=StandardResponse)
async def create_lab_test(
    payload: LabTestsCreate,
    current_user: dict = Depends(get_current_user)
):
    # Only allow Admins to create lab tests (optional, remove if not needed)
    if current_user["role_type"] != "ADMIN_TEAM":
        raise HTTPException(status_code=403, detail="Only Admins can create lab tests.")

    # Check if LabTest with same name already exists (case insensitive)
    existing_test = await LabTests.get_or_none(test_name__iexact=payload.test_name, is_deleted=False)
    if existing_test:
        raise HTTPException(status_code=400, detail="Lab Test with this name already exists.")

    # Create Lab Test
    async with in_transaction():
        new_test = await LabTests.create(
            test_name=payload.test_name.strip(),
            description=payload.description.strip() if payload.description else None,
            price=payload.price,
            status=payload.status,
            created_by=current_user["user_id"],
            created_user_role=current_user.get("user_role"),
            created_role_type=current_user.get("role_type")
        )

    return StandardResponse.success_response(
        message="Lab Test created successfully.",
        data={
            "test_id": new_test.test_id,
            "test_name": new_test.test_name,
            "description": new_test.description,
            "price": float(new_test.price),
            "status": new_test.status
        }
    )

@router.get("/labtests/list", response_model=StandardResponse)
async def list_all_lab_tests():
    lab_tests = await LabTests.all()  # Fetch all without any filters

    lab_tests_list = []
    for test in lab_tests:
        lab_tests_list.append({
            "test_id": test.test_id,
            "test_name": test.test_name,
            "description": test.description,
            "price": float(test.price),
            "status": test.status,
            "is_deleted": test.is_deleted,
        })

    return StandardResponse.success_response(
        message="All lab tests fetched successfully.",
        data={"lab_tests": lab_tests_list}
    )
