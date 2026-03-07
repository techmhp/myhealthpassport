from pydantic import BaseModel, EmailStr, Field, constr


class MobileNumber(BaseModel):
    mobile: constr(pattern=r"^\+?\d{10,15}$")
    model_config = {"json_schema_extra": {"example": {"mobile": "+911234567890"}}}


class VerifyOtp(BaseModel):
    transaction_id: constr(min_length=14, max_length=20)
    otp: constr(min_length=4, max_length=6)

    model_config = {
        "json_schema_extra": {
            "example": {"transaction_id": "2151211234567890", "otp": "123456"}
        }
    }



# Define the schema containing all expected form fields
class GeneralLoginFormSchema(BaseModel):
    username: str
    password: str
    role_type: str



class GeneralLogin(BaseModel):
    username: constr(max_length=50)
    password: constr(max_length=50)
    role_type: constr(max_length=50)

    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "IIT-96-0001",
                "password": "access100",
                "role_type": "ADMIN_TEAM"
            }
        }
    }


class EmailRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    username: str
    role_type: str  

class ResetPasswordRequest(BaseModel):
    transaction_id: str
    otp: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=6)
