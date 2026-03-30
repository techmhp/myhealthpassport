import os
from fastapi import Depends
from fastapi.responses import JSONResponse 
from src.core.file_manager import get_new_url
from src.api.general import router
from src.api.general.dependencies import get_login_form_data
from src.api.general.schema import GeneralLoginFormSchema, MobileNumber, VerifyOtp , ForgotPasswordRequest , ResetPasswordRequest
from src.core.cache_maanger import ObjectCache
from src.core.password_manager import verify_password_hash , create_password_hash
from src.models.user_models import (AdminTeam, AnalystTeam, ConsultantTeam,
                                    OnGroundTeam, Parents,
                                    SchoolStaff, ScreeningTeam)
from src.models.school_models import Schools
from src.utils.email import send_reset_email
from src.utils.response import StandardResponse
from src.utils.tokens import generate_uuid4_token
from src.utils.transactions import generate_otp, generate_transaction_number
from jinja2 import Environment, FileSystemLoader, select_autoescape
from fastapi import status


from src.services.sms import send_otp_sms

# Define a mapping for cleaner code
USER_MODELS = {
    "SCHOOL_STAFF": SchoolStaff,
    "ON_GROUND_TEAM": OnGroundTeam,
    "SCREENING_TEAM": ScreeningTeam,
    "ANALYST_TEAM": AnalystTeam,
    "ADMIN_TEAM": AdminTeam,
    "CONSULTANT_TEAM": ConsultantTeam,
    "PARENT": Parents  # Added Parents model
}

templates_env = Environment(
    loader=FileSystemLoader("templates"),
    autoescape=select_autoescape(["html", "xml"])
)

@router.post("/regular-login", response_model=StandardResponse)
async def user_login(form_data: GeneralLoginFormSchema = Depends(get_login_form_data)):
    user_model = USER_MODELS.get(form_data.role_type)
    if not user_model:
        data_dict = {
            "status": False,
            "message": "Please Give Correct Role Type"
        }
        response = StandardResponse(**data_dict)
        return JSONResponse(content=response.__dict__, status_code=200)

    user = await user_model.filter(username=form_data.username).first()
    if not user:
        data_dict = {
            "status": False,
            "message": "User Not Found",
            "errors": {"mobile": "User not registered"},
        }
        response = StandardResponse(**data_dict)
        return JSONResponse(content=response.__dict__, status_code=200)

    if not verify_password_hash(user.password, form_data.password):
        data_dict = {
            "status": False,
            "message": "Invalid credentials.",
            "data": {},
            "errors": {
                "password": "Incorrect password."
            },
        }
        response = StandardResponse(**data_dict)
        return JSONResponse(content=response.__dict__, status_code=200)

    if not user.is_active:
        data_dict = {
            "status": False,
            "message": "User is not active. Please contact your administrator.",
            "data": {},
            "errors": {
                "user": "User is not active."
            },
        }
        response_obj = StandardResponse(**data_dict)
        return response_obj

    if not user.is_verified:
        data_dict = {
            "status": False,
            "message": "User is not verified. Please contact your administrator.",
            "data": {},
            "errors": {"user": "User is not verified."},
        }
        response_obj = StandardResponse(**data_dict)
        return response_obj

    access_token = generate_uuid4_token()
    # Include school_id in the data if the user is a SchoolStaff
    data = {
        "user_id": user.id,
        "username": user.username,
        "user_role": user.user_role,
        "role_type": user.role_type,
        "first_name": user.first_name,
        "middle_name": user.middle_name,
        "last_name": user.last_name,
        "profile_image":await get_new_url(user.profile_image),
    }
    if form_data.role_type == "SCHOOL_STAFF":
        data["school_id"] = user.school_id  # Add school_id for SchoolStaff users
        school = await Schools.filter(school_id=user.school_id).first()
        data["school_name"] = school.school_name if school.school_name else ""
        data["school_logo"] = await get_new_url(school.school_logo) if school.school_logo else ""
        
    if form_data.role_type == "CONSULTANT_TEAM":
        # Assuming these fields exist in the ConsultantTeam model
        data["clinic_name"] = user.clinic_name or ""
        data["specialty"] = user.specialty or ""
        data["education"] = user.education or ""

    try:
        object_cache = ObjectCache(cache_key=access_token)
        await object_cache.set(data, ttl=86400)
    except Exception as e:
        data_dict = {
            "status": False,
            "message": "Login service temporarily unavailable. Please try again in a moment.",
        }
        response = StandardResponse(**data_dict)
        return JSONResponse(content=response.__dict__, status_code=200)

    data_dict = {
        "status": True,
        "message": "Login Successful",
        "data": {"access_token": access_token, **data},
    }

    response_obj = StandardResponse(**data_dict)
    return response_obj

# @router.post("/login-mobile", response_model=StandardResponse)
# async def user_login(payload: MobileNumber):
#     # Check for all user models that have a phone/mobile field
#     user = await Parents.filter(primary_mobile=payload.mobile).first()

#     if not user:
#         data_dict = {
#             "status": False,
#             "message": "User Not Found",
#             "errors": {"mobile": "Mobile number not registered"},
#         }
#         response_obj = StandardResponse(**data_dict)
#         return response_obj

#     if not user.is_active:
#         data_dict = {
#             "status": False,
#             "message": "User is not active.",
#             "data": {},
#             "errors": {"user": "User is not active."},
#         }
#         response_obj = StandardResponse(**data_dict)
#         return response_obj

#     if not user.is_verified:
#         data_dict = {
#             "status": False,
#             "message": "User is not verified.",
#             "data": {},
#             "errors": {"user": "User is not verified."},
#         }
#         response_obj = StandardResponse(**data_dict)
#         return response_obj

#     transaction_id = generate_transaction_number()

#     environ = os.environ.get("APP_ENV", "")
    
#     print("environ is", environ)
    
#     if environ == "production":
#         otp = generate_otp()

#         response = send_otp_sms(payload.mobile, otp)
#         print(response)
#         if response:
#             cache_key = f"otp-{transaction_id}:{otp}"
#             data = {
#                 "user_id": user.id,
#                 "username": user.primary_mobile,  # Use mobile for Parents, phone for others
#                 "user_role": user.user_role,
#                 "role_type": user.role_type
#             }

#             object_cache = ObjectCache(cache_key=cache_key)
#             await object_cache.set(data, ttl=180)

#             data_dict = {
#                 "status": True,
#                 "message": "Please Verify OTP",
#                 "data": {"trasnaction_id": transaction_id},
#             }
#             response_obj = StandardResponse(**data_dict)
#             return response_obj
#         else:
#             data_dict = {
#                 "status": False,
#                 "message": "Something went wrong ourside. please try again later",
#             }
#             response_obj = StandardResponse(**data_dict)
#             return response_obj
            
#     else:
#         otp = "123456"
#         cache_key = f"otp-{transaction_id}:{otp}"
#         data = {
#             "user_id": user.id,
#             "username": user.primary_mobile,  # Use mobile for Parents, phone for others
#             "user_role": user.user_role,
#             "role_type": user.role_type
#         }

#         object_cache = ObjectCache(cache_key=cache_key)
#         await object_cache.set(data, ttl=180)  # otp valid 180 seconds only

#         data_dict = {
#             "status": True,
#             "message": "Please Verify OTP",
#             "data": {"trasnaction_id": transaction_id},
#         }
#         response_obj = StandardResponse(**data_dict)
#         return response_obj


# @router.post("/verify-otp", response_model=StandardResponse)
# async def login_verify_otp(payload: VerifyOtp):
#     cache_key = f"otp-{payload.transaction_id}:{payload.otp}"

#     object_cache = ObjectCache(cache_key=cache_key)
#     result = await object_cache.get()
#     if result is None:
#         data_dict = {"status": False, "message": "OTP not Verified", "data": {}}
#         response_obj = StandardResponse(**data_dict)
#         return response_obj

#     access_token = generate_uuid4_token()

#     parent = await Parents.filter(id=result["user_id"]).first()
#     data = {
#         "user_id": result["user_id"],
#         "username": result["username"],
#         "user_role": result["user_role"],
#         "role_type": result["role_type"],
#         "first_name": parent.primary_first_name,
#         "middle_name": parent.primary_middle_name,
#         "last_name": parent.primary_last_name,
#         "primary_mobile": parent.primary_mobile,
#         "primary_email": parent.primary_email,
#     }


#     object_cache = ObjectCache(cache_key=access_token)
#     await object_cache.set(data, ttl=86400)

#     data_dict = {
#         "status": True,
#         "message": "Login Successful",
#         "data": {"access_token": access_token, **data},
#     }
#     response_obj = StandardResponse(**data_dict)
#     return response_obj

@router.post("/login-mobile", response_model=StandardResponse)
async def user_login(payload: MobileNumber):
    user = await Parents.filter(primary_mobile=payload.mobile).first()

    if not user:
        data_dict = {
            "status": False,
            "message": "User Not Found",
            "errors": {"mobile": "Mobile number not registered"},
        }
        response_obj = StandardResponse(**data_dict)
        return response_obj

    if not user.is_active:
        data_dict = {
            "status": False,
            "message": "User is not active.",
            "data": {},
            "errors": {"user": "User is not active."},
        }
        response_obj = StandardResponse(**data_dict)
        return response_obj

    if not user.is_verified:
        data_dict = {
            "status": False,
            "message": "User is not verified.",
            "data": {},
            "errors": {"user": "User is not verified."},
        }
        response_obj = StandardResponse(**data_dict)
        return response_obj

    transaction_id = generate_transaction_number()
    environ = os.environ.get("APP_ENV", "")
    
    print(f"Environment: {environ}")  # DEBUG

    if environ == "production":
        otp = generate_otp()
        print(f"Generated OTP: {otp}")  # DEBUG
        response = send_otp_sms(payload.mobile, otp)
        print(f"SMS Response: {response}")  # DEBUG
        if not response:
            data_dict = {
                "status": False,
                "message": "Something went wrong. Please try again later",
            }
            response_obj = StandardResponse(**data_dict)
            return response_obj
    else:
        otp = "123456"
        print(f"Non-prod OTP: {otp}")  # DEBUG

    cache_key = f"otp-{transaction_id}:{otp}"
    print(f"Cache key created: {cache_key}")  # DEBUG

    data = {
        "user_id": user.id,
        "username": user.primary_mobile,
        "user_role": user.user_role,
        "role_type": user.role_type
    }

    object_cache = ObjectCache(cache_key=cache_key)
    await object_cache.set(data, ttl=180)

    response_data = {"transaction_id": transaction_id}
    if environ != "production":
        response_data["test_otp"] = otp

    data_dict = {
        "status": True,
        "message": "Please Verify OTP",
        "data": response_data,
    }
    response_obj = StandardResponse(**data_dict)
    return response_obj


@router.post("/verify-otp", response_model=StandardResponse)
async def login_verify_otp(payload: VerifyOtp):
    cache_key = f"otp-{payload.transaction_id}:{payload.otp}"
    print(f"Verifying cache key: {cache_key}")  # DEBUG

    object_cache = ObjectCache(cache_key=cache_key)
    result = await object_cache.get()
    
    print(f"Cache lookup result: {result}")  # DEBUG
    
    if result is None:
        data_dict = {"status": False, "message": "OTP not Verified", "data": {}}
        response_obj = StandardResponse(**data_dict)
        return response_obj

    access_token = generate_uuid4_token()

    parent = await Parents.filter(id=result["user_id"]).first()
    data = {
        "user_id": result["user_id"],
        "username": result["username"],
        "user_role": result["user_role"],
        "role_type": result["role_type"],
        "first_name": parent.primary_first_name,
        "middle_name": parent.primary_middle_name,
        "last_name": parent.primary_last_name,
        "primary_mobile": parent.primary_mobile,
        "primary_email": parent.primary_email,
    }

    object_cache = ObjectCache(cache_key=access_token)
    await object_cache.set(data, ttl=86400)

    data_dict = {
        "status": True,
        "message": "Login Successful",
        "data": {"access_token": access_token, **data},
    }
    response_obj = StandardResponse(**data_dict)
    return response_obj


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    user_model = USER_MODELS.get(payload.role_type)
    if not user_model:
        resp = StandardResponse(
            status=False,
            message="Please Select Valid User Type.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    user = await user_model.get_or_none(username=payload.username)
    if not user:
        resp = StandardResponse(
            status=False,
            message="User Not Found.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)

    if not user.is_active:
        resp = StandardResponse(
            status=False,
            message="User is Not Active. Please Contact your Administrator.",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    transaction_id = generate_transaction_number()
    otp = generate_otp()  # dynamic OTP
    # otp = 123456

    cache_key = f"reset-{otp}-{transaction_id}"



    data = {
        "email": user.email,
        "role_type": user.role_type,
        "username": user.username,
        "transaction_id": transaction_id
    }
    object_cache = ObjectCache(cache_key=cache_key)
    await object_cache.set(data, ttl=180)

    
    template = templates_env.get_template("reset_password_template.html")
    html_body = template.render(name=user.first_name or user.username, otp=otp)

    
    subject = "Password Reset OTP - My Health Passport"
    await send_reset_email(subject, user.email, html_body)

    resp = StandardResponse(
        status=True,
        message="OTP sent to your registered email address.",
        data={"transaction_id": transaction_id},
        errors={},
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    cache_key = f"reset-{payload.otp}-{payload.transaction_id}"
    object_cache = ObjectCache(cache_key=cache_key)
    user_data = await object_cache.get()

    if not user_data:
        resp = StandardResponse(
            status=False,
            message="Invalid OTP",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_400_BAD_REQUEST)


    user_model = USER_MODELS.get(user_data["role_type"])
    user = await user_model.get_or_none(username=user_data["username"])

    if not user:
        resp = StandardResponse(
            status=False,
            message="User Not Found",
            data={},
            errors={},
        )
        return JSONResponse(content=resp.__dict__, status_code=status.HTTP_403_FORBIDDEN)

    user.password = create_password_hash(payload.new_password)
    await user.save()

    resp = StandardResponse(
        status=True,
        message="Password reset successfully",
        data={},
        errors={},
    )
    return JSONResponse(content=resp.__dict__, status_code=status.HTTP_200_OK)

