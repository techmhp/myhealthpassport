from fastapi.responses import JSONResponse

from src.api.general import router
from src.utils.constants import all_class_names, roles_details
from src.utils.response import StandardResponse


@router.get("/constants", response_model=StandardResponse)  # Endpoint to fetch constants
async def user_login():

    data_dict = {
        "status": True,
        "message": "Constants Details",
        "data": {
            "roles_details": roles_details,
            "all_class_names": all_class_names,
        }
    }
    response = StandardResponse(**data_dict)
    return JSONResponse(content=response.__dict__, status_code=200)
