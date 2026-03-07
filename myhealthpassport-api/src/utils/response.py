from typing import Any, Dict

from pydantic import BaseModel, Field


# Define the main response model
class StandardResponse(BaseModel):
    status: bool = Field(default=False)
    message: str = Field(default="")
    data: Dict[str, Any] = Field(default_factory=dict)
    errors: Dict[str, Any] = Field(default_factory=dict)  # Or simply use dict
    
    @classmethod
    def success_response(cls, message: str, data: dict = None):
        return cls(
            status=True,  # <-- you must explicitly set True here
            message=message,
            data=data,
            errors={}
        )
