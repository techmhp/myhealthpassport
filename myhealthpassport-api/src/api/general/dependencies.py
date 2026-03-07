from fastapi import Depends, Form

from .schema import GeneralLoginFormSchema


# Dependency function that maps Form fields to the Pydantic model
async def get_login_form_data(
    username: str = Form(...),
    password: str = Form(...),
    role_type: str = Form(...)
) -> GeneralLoginFormSchema:
    # Create and return an instance of the Pydantic model
    return GeneralLoginFormSchema(
        username=username,
        password=password,
        role_type=role_type
    )
