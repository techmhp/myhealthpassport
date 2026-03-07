from pydantic import BaseModel


class SchoolImportConfirmSchema(BaseModel):
    transaction_no: str
    confirm: bool

    
class ParentChildrenCreateSchema(BaseModel):
    parent_id: int
    student_id: int
    primary_phone_no: str  # Changed from int to str
    secondary_phone_no: str  # Changed from int to str
    status: bool = True


