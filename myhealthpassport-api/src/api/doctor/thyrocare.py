# src/api/doctor/thyrocare.py
import logging
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from fastapi import APIRouter, Depends, HTTPException, Header,Query
from pydantic import BaseModel, Field, validator
from tortoise.transactions import in_transaction
from dateutil import parser

from src.core.manager import get_current_user
from src.models.student_models import Students, ParentChildren
from src.models.user_models import Parents
from src.models.transaction_models import Transactions
from src.utils.response import StandardResponse
from src.models.thyrocare_models import (
    ThyrocareProduct, ThyrocareOrder, ThyrocareOrderItem, ThyrocarePatient,LabTransactions
)

from . import router

logger = logging.getLogger(__name__)

# ==================== CONFIG ====================

from dotenv import load_dotenv
load_dotenv()
import os
environ = os.environ.get("APP_ENV", "development")
BASE_URL_T = os.getenv("BASE_URL_T")
BASE_URL_ST = os.getenv("BASE_URL_ST")
PARTNER_ID = os.getenv("PARTNER_ID")
USERNAME = os.getenv("USERNAME")
PASSWORD = os.getenv("PASSWORD")
ENTITY_TYPE = os.getenv("ENTITY_TYPE")

if environ == "production":
    # prod
    BASE_URL = BASE_URL_T
else:
    # staging
    BASE_URL = BASE_URL_ST
PARTNER_ID = PARTNER_ID
USERNAME = USERNAME
PASSWORD = PASSWORD
ENTITY_TYPE = ENTITY_TYPE

thyrocare_token: Optional[str] = None
token_expiry: Optional[datetime] = None

# In-memory cart
user_carts: Dict[int, List[Dict]] = {}


# ==================== SESSION ====================
# def create_session() -> requests.Session:
#     session = requests.Session()
#     retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
#     adapter = HTTPAdapter(max_retries=retry)
#     session.mount("http://", adapter)
#     session.mount("https://", adapter)
#     session.headers.update({"User-Agent": "MyHealthPassport/1.0"})
#     return session

def create_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=2,  # Reduce from 3
        backoff_factor=1.5,
        status_forcelist=[429, 502, 503, 504],  # ← Removed 500
        raise_on_status=False  # Don't raise exceptions
    )
    adapter = HTTPAdapter(
        max_retries=retry,
        pool_connections=10,
        pool_maxsize=20
    )
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update({"User-Agent": "MyHealthPassport/1.0"})
    return session

session = create_session()


# ==================== AUTH & HEADERS ====================
# def get_headers(client_type: str = "web") -> Dict[str, str]:
#     return {
#         "Partner-Id": PARTNER_ID,
#         "Request-Id": str(uuid.uuid4()),
#         "API-Version": "v1",
#         "Client-Type": client_type,
#         "Content-Type": "application/json",
#     }


# def force_login() -> str:
#     global thyrocare_token, token_expiry
#     url = f"{BASE_URL}/partners/v1/auth/login"
#     headers = get_headers()
#     headers["Entity-Type"] = ENTITY_TYPE
#     payload = {"username": USERNAME, "password": PASSWORD}

#     logger.info(f"LOGIN → {url}")
#     resp = session.post(url, json=payload, headers=headers, timeout=30)
#     logger.info(f"LOGIN: {resp.status_code}")

#     if resp.status_code != 200:
#         raise HTTPException(status_code=502, detail="Thyrocare login failed")

#     token = resp.json().get("token")
#     if not token:
#         raise HTTPException(status_code=502, detail="No token")

#     thyrocare_token = token
#     token_expiry = datetime.utcnow() + timedelta(hours=23)
#     return token

def get_headers(client_type: str = "web") -> Dict[str, str]:
    return {
        "Partner-Id": PARTNER_ID,
        "Request-Id": str(uuid.uuid4()),
        "API-Version": "v1",
        "Client-Type": client_type,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate, br",
    }
    
def force_login() -> str:
    global thyrocare_token, token_expiry
    url = f"{BASE_URL}/partners/v1/auth/login"
    headers = get_headers()
    headers["Entity-Type"] = ENTITY_TYPE
    payload = {"username": USERNAME, "password": PASSWORD}

    logger.info(f"LOGIN → {url}")
    
    session = create_session()  # Fresh session
    try:
        resp = session.post(url, json=payload, headers=headers, timeout=30)
        logger.info(f"LOGIN: {resp.status_code}")

        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Thyrocare login failed")

        token = resp.json().get("token")
        if not token:
            raise HTTPException(status_code=502, detail="No token")

        thyrocare_token = token
        token_expiry = datetime.utcnow() + timedelta(hours=23)
        return token
    finally:
        session.close()


def get_token() -> str:
    global thyrocare_token, token_expiry
    if thyrocare_token and token_expiry and datetime.utcnow() < token_expiry:
        return thyrocare_token
    return force_login()


# ==================== API CALL ====================
# def api_call(method: str, endpoint: str, json=None, params=None, client_type: str = "web") -> requests.Response:
#     token = get_token()
#     headers = get_headers(client_type)
#     headers["Authorization"] = f"Bearer {token}"
#     url = f"{BASE_URL}{endpoint}"

#     logger.info(f"{method} {url}")
#     resp = session.request(method, url, json=json, params=params, headers=headers, timeout=30)
#     logger.info(f"RESPONSE {resp.status_code}: {resp.text[:500]}")

#     if resp.status_code == 401:
#         global thyrocare_token
#         thyrocare_token = None
#         token = get_token()
#         headers["Authorization"] = f"Bearer {token}"
#         resp = session.request(method, url, json=json, params=params, headers=headers, timeout=30)

#     return resp

# Remove the global session
# session = create_session()  ← DELETE THIS LINE

def api_call(method: str, endpoint: str, json=None, params=None, client_type: str = "web") -> requests.Response:
    token = get_token()
    headers = get_headers(client_type)
    headers["Authorization"] = f"Bearer {token}"
    url = f"{BASE_URL}{endpoint}"

    # Create session per request
    session = create_session()
    
    logger.info(f"{method} {url}")
    
    try:
        resp = session.request(method, url, json=json, params=params, headers=headers, timeout=30)
        logger.info(f"RESPONSE {resp.status_code}")
        
        # Handle 500 errors manually (don't rely on retry)
        if resp.status_code >= 500:
            logger.error(f"Server error {resp.status_code}: {resp.text[:200]}")
            raise HTTPException(
                status_code=502,
                detail=f"Thyrocare API error: Server returned {resp.status_code}"
            )
        
        # Handle 401 for token refresh
        if resp.status_code == 401:
            global thyrocare_token
            thyrocare_token = None
            token = get_token()
            headers["Authorization"] = f"Bearer {token}"
            resp = session.request(method, url, json=json, params=params, headers=headers, timeout=30)
        
        return resp
        
    except requests.exceptions.RequestException as e:
        logger.exception(f"Request failed: {method} {url}")
        raise HTTPException(status_code=502, detail=f"Network error: {str(e)}")
    finally:
        session.close()  # Clean up


# ==================== SCHEMAS ====================
class CheckServiceabilityRequest(BaseModel):
    pincode: int = Field(..., ge=100000, le=999999)


class FetchProductsRequest(BaseModel):
    pincode: Optional[int] = None  # ← Make optional
    product_type: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=100)
    page: int = Field(default=1, ge=1)  # ← Add page param

class AddToCartRequest(BaseModel):
    product_code: str


class ReferredBy(BaseModel):
    doctor_id: Optional[str] = ""
    doctor_name: Optional[str] = ""


class CommunicationConfig(BaseModel):
    share_report: Optional[bool] = True
    share_receipt: Optional[bool] = True
    share_modes: Optional[Dict[str, bool]] = {"whatsapp": True, "email": True}


class Config(BaseModel):
    communication: Optional[CommunicationConfig] = CommunicationConfig()


class PatientItemOrigin(BaseModel):
    entered_by: str
    platform: str = "web"


class PatientItem(BaseModel):
    id: str
    type: str
    name: str
    origin: Optional[PatientItemOrigin] = None


class PatientAttributes(BaseModel):
    ulc_unique_code: Optional[str] = None
    patient_address: Optional[str] = None
    external_patient_id: Optional[str] = None


class PatientDocument(BaseModel):
    attributes: Optional[Dict] = {}
    document_path: str
    document_type: str


class PatientDetail(BaseModel):
    name: str = Field(..., min_length=1)
    age: int = Field(..., ge=1, le=120)
    age_type: str = Field("YEAR", pattern="^(YEAR|MONTH|DAY)$")
    gender: str = Field(..., pattern="^(MALE|FEMALE|OTHER)$")
    contact_number: str = Field(..., pattern=r"^\d{10}$")
    email: Optional[str] = ""
    attributes: Optional[PatientAttributes] = None
    items: List[PatientItem]
    documents: Optional[List[PatientDocument]] = []

    @validator("contact_number")
    def format_contact(cls, v):
        return f"+91-{v}"


class CreateOrderFromCartRequest(BaseModel):
    patient: PatientDetail
    appointment_date: str
    address: str
    house_no: str
    street: str
    landmark: Optional[str] = ""
    city: str
    state: str
    pincode: int = Field(..., ge=100000, le=999999)
    contact_number: str = Field(..., pattern=r"^\d{10}$")
    email: Optional[str] = ""
    payment_type: str = Field("POSTPAID", pattern="^(PREPAID|POSTPAID)$")
    collection_type: str = Field("HOME_COLLECTION", pattern="^(HOME_COLLECTION|LAB_VISIT)$")
    is_report_hard_copy_required: bool = False
    address2: Optional[str] = ""  # ← Add this field
    remarks: Optional[str] = None
    ref_order_no: Optional[str] = None
    alert_message: Optional[List[str]] = None
    referred_by: Optional[ReferredBy] = ReferredBy()
    config: Optional[Config] = Config()
    is_pdpc_order: Optional[bool] = False

    @validator("contact_number")
    def format_contact(cls, v):
        return f"+91-{v}"


class RescheduleRequest(BaseModel):
    appointment_date: str


class CancelRequest(BaseModel):
    reason: str


# ==================== ENDPOINTS ====================

@router.post("/thyrocare/auth/login", response_model=StandardResponse)
async def thyrocare_login(user=Depends(get_current_user)):
    try:
        token = get_token()
        return StandardResponse.success_response(
            message="Authenticated",
            data={"token_preview": token[:60] + "...", "expires_at": token_expiry.isoformat()}
        )
    except Exception as e:
        raise HTTPException(502, detail=str(e))


@router.post("/thyrocare/check-serviceability", response_model=StandardResponse)
async def check_serviceability(payload: CheckServiceabilityRequest, user=Depends(get_current_user)):
    try:
        pincode = payload.pincode
        serviceable = 100000 <= pincode <= 999999
        return StandardResponse.success_response(
            message="Valid pincode" if serviceable else "Invalid pincode",
            data={"pincode": pincode, "serviceable": serviceable}
        )
    except Exception as e:
        raise HTTPException(500, detail=str(e))

# Request Schema
class PincodeServiceabilityRequest(BaseModel):
    pincode: int = Field(..., ge=100000, le=999999, description="6-digit Indian pincode")


@router.get("/thyrocare/pincodes/serviceability", response_model=StandardResponse)
async def thyrocare_check_pincode(
    payload: PincodeServiceabilityRequest = Depends(),
    user = Depends(get_current_user)
):
    """
    Check if Thyrocare provides service in a pincode (PATHOLOGY, ECG, etc.)
    → Live from Thyrocare
    """
    resp = api_call("GET", "/partners/v1/serviceability/pincodes")
    
    if resp.status_code != 200:
        raise HTTPException(502, "Thyrocare serviceability temporarily down")

    data = resp.json()
    service_types = data.get("serviceTypes", [])

    # Check if our pincode is serviceable
    is_serviceable = False
    available_services = []

    for st in service_types:
        if payload.pincode in st.get("pincodes", []):
            is_serviceable = True
            available_services.append(st["type"])

    return StandardResponse.success_response(
        message="Pincode checked",
        data={
            "pincode": payload.pincode,
            "is_serviceable": is_serviceable,
            "services": available_services or ["NONE"],
            "all_services": [st["type"] for st in service_types],
            "cached_recommended": True,
            "note": "Cache this for 24 hours"
        }
    )

class SlotPatientItem(BaseModel):
    id: str = Field(..., description="Product code from catalog (e.g. AAROGYAM1.1)")
    type: str = Field(..., description="SSKU, PSKU, OFFER, OSKU")
    name: str = Field(..., description="Full name from catalog")


class SlotPatient(BaseModel):
    name: str
    gender: str = Field(..., pattern="^(MALE|FEMALE|OTHER)$")
    age: int = Field(..., ge=1, le=120)
    ageType: str = Field("YEAR", pattern="^(YEAR|MONTH|DAY)$")
    items: List[SlotPatientItem] = Field(..., min_items=1)


class SearchSlotsRequest(BaseModel):
    appointmentDate: str = Field(..., description="YYYY-MM-DD format, e.g. 2025-12-01")
    pincode: int = Field(..., ge=100000, le=999999)
    patients: List[SlotPatient] = Field(..., min_items=1, max_items=5)


@router.post("/thyrocare/slots/search", response_model=StandardResponse)
async def thyrocare_search_slots(
    payload: SearchSlotsRequest,
    user = Depends(get_current_user)
):
    """
    Search available home collection slots for Thyrocare
    → Live from Thyrocare
    → Supports multi-patient (common slots only)
    """
    # Validate date (not in past, max 7 days ahead)
    try:
        req_date = datetime.strptime(payload.appointmentDate, "%Y-%m-%d").date()
        today = datetime.utcnow().date()
        if req_date < today:
            raise HTTPException(400, "Cannot book past date")
        if (req_date - today).days > 7:
            raise HTTPException(400, "Cannot book more than 7 days ahead")
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")

    thyrocare_payload = {
        "appointmentDate": payload.appointmentDate,
        "pincode": str(payload.pincode),
        "patients": [
            {
                "name": p.name,
                "gender": p.gender,
                "age": p.age,
                "ageType": p.ageType,
                "items": [
                    {"id": item.id, "type": item.type, "name": item.name}
                    for item in p.items
                ]
            }
            for p in payload.patients
        ]
    }

    resp = api_call("POST", "/partners/v1/slots/search", json=thyrocare_payload)

    if resp.status_code != 200:
        raise HTTPException(502, f"Thyrocare slots unavailable: {resp.text[:200]}")

    result = resp.json()

    slots = result.get("slots", [])
    formatted_slots = [
        {
            "slot_id": s["id"],
            "start_time": s["startTime"],
            "end_time": s["endTime"],
            "display": f"{s['startTime']} - {s['endTime']}"
        }
        for s in slots
    ]

    return StandardResponse.success_response(
        message="Slots fetched successfully",
        data={
            "pincode": payload.pincode,
            "date": payload.appointmentDate,
            "time_zone": result.get("timeZone", "+05:30"),
            "total_slots": len(formatted_slots),
            "slots": formatted_slots,
            "note": "All patients will be collected in the same slot"
        }
    )
    
# @router.post("/thyrocare/save-products", response_model=StandardResponse)
# async def save_products(payload: FetchProductsRequest, user=Depends(get_current_user)):
#     """
#     Save Thyrocare products to DB.
#     - Skips packages already in DB (by `code`)
#     - Returns: added, skipped, errors
#     - Uses live API (GET)
#     """
#     if user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
#         raise HTTPException(403, "Unauthorized")

#     try:
#         params = {
#             "pincode": str(payload.pincode),
#             "limit": payload.limit,
#             "offset": 0
#         }
#         if payload.product_type:
#             params["productType"] = payload.product_type.upper()

#         resp = api_call("GET", "/partners/v1/catalog/products", params=params)
#         if resp.status_code != 200:
#             raise HTTPException(502, f"Catalog error: {resp.status_code}")

#         products = resp.json().get("skuList", [])
#         if not products:
#             raise HTTPException(502, "No products returned")

#         added = []
#         skipped = []
#         errors = []

#         async with in_transaction():
#             for pkg in products:
#                 code = pkg.get("id")
#                 if not code:
#                     errors.append("Missing 'id' in package")
#                     continue

#                 try:
#                     existing = await ThyrocareProduct.get_or_none(code=code)
#                     if existing:
#                         skipped.append({"code": code, "name": pkg.get("name", "Unknown")})
#                         continue

#                     # Safe Decimal conversion
#                     def safe_decimal(v):
#                         if v is None: return Decimal("0")
#                         try: return Decimal(str(v))
#                         except: return Decimal("0")

#                     await ThyrocareProduct.create(
#                         code=code,
#                         name=pkg.get("name", "Unknown"),
#                         product_type=pkg.get("type", "SSKU").upper(),
#                         description=pkg.get("description", ""),
#                         mrp=safe_decimal(pkg.get("mrp")),
#                         rate=safe_decimal(pkg.get("rate")),
#                         pay_amt=safe_decimal(pkg.get("payAmount") or pkg.get("sellingPrice")),
#                         parameters_count=pkg.get("noOfTestsIncluded", 0),
#                         sample_type=pkg.get("sampleType", "Blood"),
#                         fasting_required=bool(pkg.get("fastingRequired")),
#                         tat_hours=pkg.get("tat", 24),
#                         is_active=True
#                     )
#                     added.append({"code": code, "name": pkg.get("name")})

#                 except Exception as e:
#                     errors.append(f"{code}: {str(e)}")

#         return StandardResponse.success_response(
#             message=f"Processed {len(products)} products",
#             data={
#                 "added_count": len(added),
#                 "added": added,
#                 "skipped_count": len(skipped),
#                 "skipped": skipped,
#                 "error_count": len(errors),
#                 "errors": errors
#             }
#         )
#     except Exception as e:
#         logger.exception("Save products failed")
#         raise HTTPException(500, detail=str(e))

@router.post("/thyrocare/save-products", response_model=StandardResponse)
async def save_products(payload: FetchProductsRequest, user=Depends(get_current_user)):
    """
    Save Thyrocare products to DB.
    Adapted to new catalog format:
      - rate.listingPrice, rate.sellingPrice
      - flags.isFastingRequired
    Paginates using page/pageSize until empty.
    """
    if user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
        raise HTTPException(403, "Unauthorized")

    try:
        page = 1
        page_size = payload.limit or 50
        added = []
        skipped = []
        errors = []

        def safe_decimal(v):
            if v is None:
                return Decimal("0")
            try:
                return Decimal(str(v))
            except:
                return Decimal("0")

        async with in_transaction():
            while True:
                params = {
                    "page": page,
                    "pageSize": page_size,
                }
                if payload.pincode:
                    params["pincode"] = str(payload.pincode)
                if payload.product_type:
                    params["productType"] = payload.product_type.upper()

                resp = api_call("GET", "/partners/v1/catalog/products", params=params)
                if resp.status_code != 200:
                    raise HTTPException(502, f"Catalog error at page {page}: {resp.status_code}")

                data = resp.json()
                products = data.get("skuList", []) or []
                if not products:
                    break  # no more pages

                for pkg in products:
                    code = pkg.get("id")
                    if not code:
                        errors.append("Missing 'id' in package")
                        continue

                    try:
                        existing = await ThyrocareProduct.get_or_none(code=code)
                        if existing:
                            skipped.append({"code": code, "name": pkg.get("name", "Unknown")})
                            continue

                        rate = pkg.get("rate") or {}
                        flags = pkg.get("flags") or {}

                        await ThyrocareProduct.create(
                            code=code,
                            name=pkg.get("name", "Unknown"),
                            product_type=pkg.get("type", "SSKU").upper(),
                            description=pkg.get("description", ""),
                            mrp=safe_decimal(rate.get("listingPrice")),
                            rate=safe_decimal(rate.get("sellingPrice")),
                            pay_amt=safe_decimal(rate.get("sellingPrice")),
                            parameters_count=pkg.get("noOfTestsIncluded", 0),
                            sample_type="Blood",
                            fasting_required=bool(flags.get("isFastingRequired")),
                            tat_hours=pkg.get("tat", 24),
                            is_active=True
                        )
                        added.append({"code": code, "name": pkg.get("name")})
                    except Exception as e:
                        errors.append(f"{code}: {str(e)}")

                page += 1

        return StandardResponse.success_response(
            message=f"Processed {len(added) + len(skipped)} products",
            data={
                "added_count": len(added),
                "added": added,
                "skipped_count": len(skipped),
                "skipped": skipped,
                "error_count": len(errors),
                "errors": errors,
            }
        )
    except Exception as e:
        logger.exception("Save products failed")
        raise HTTPException(500, detail=str(e))

async def fetch_and_save_product(product_code: str, pincode: int = 110001) -> Optional[ThyrocareProduct]:
    """
    Fetch a single product from Thyrocare catalog (new format) and save to DB.
    Returns ThyrocareProduct or None if not found.
    """
    try:
        page = 1
        page_size = 100

        def safe_decimal(v):
            if v is None:
                return Decimal("0")
            try:
                return Decimal(str(v))
            except:
                return Decimal("0")

        while True:
            params = {
                "page": page,
                "pageSize": page_size,
                "pincode": str(pincode),
            }
            resp = api_call("GET", "/partners/v1/catalog/products", params=params)
            if resp.status_code != 200:
                logger.error(f"fetch_and_save_product: catalog error {resp.status_code} for {product_code}")
                return None

            data = resp.json()
            products = data.get("skuList", []) or []
            if not products:
                break

            for pkg in products:
                if pkg.get("id") == product_code:
                    rate = pkg.get("rate") or {}
                    flags = pkg.get("flags") or {}

                    product = await ThyrocareProduct.create(
                        code=product_code,
                        name=pkg.get("name", "Unknown"),
                        product_type=pkg.get("type", "SSKU").upper(),
                        description=pkg.get("description", ""),
                        mrp=safe_decimal(rate.get("listingPrice")),
                        rate=safe_decimal(rate.get("sellingPrice")),
                        pay_amt=safe_decimal(rate.get("sellingPrice")),
                        parameters_count=pkg.get("noOfTestsIncluded", 0),
                        sample_type="Blood",
                        fasting_required=bool(flags.get("isFastingRequired")),
                        tat_hours=pkg.get("tat", 24),
                        is_active=True
                    )
                    logger.info(f"Auto-saved product {product_code} - {product.name}")
                    return product

            page += 1

        logger.warning(f"Product {product_code} not found in catalog for pincode {pincode}")
        return None
    except Exception as e:
        logger.exception(f"Error in fetch_and_save_product({product_code}): {e}")
        return None

# @router.post("/thyrocare/create-order-from-cart/{student_id}", response_model=StandardResponse)
# async def create_order_from_cart(
#     student_id: int,
#     payload: CreateOrderFromCartRequest,
#     user=Depends(get_current_user),
#     client_type: str = Header("web", alias="Client-Type")
# ):
#     """
#     Create Thyrocare order – uses DB + auto-fetch for missing products (new catalog format).
#     """

#     # ───── 1. Student & permission ─────
#     student = await Students.get_or_none(id=student_id, is_deleted=False)
#     if not student:
#         raise HTTPException(404, f"Student with ID {student_id} not found or has been deleted")

#     is_parent = await ParentChildren.filter(
#         parent_id=user["user_id"],
#         student_id=student_id,
#         status=True
#     ).exists()

#     if not is_parent and user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
#         authorized_students = await ParentChildren.filter(
#             parent_id=user["user_id"],
#             status=True
#         ).values_list("student_id", flat=True)

#         raise HTTPException(
#             status_code=403,
#             detail={
#                 "error": "Access denied",
#                 "message": f"You are not authorized to create orders for student ID {student_id}",
#                 "reason": "You can only create orders for your own children",
#                 "your_user_id": user["user_id"],
#                 "your_role": user["user_role"],
#                 "requested_student_id": student_id,
#                 "your_authorized_student_ids": list(authorized_students),
#             }
#         )

#     # ───── 2. Appointment ─────
#     try:
#         dt = parser.isoparse(payload.appointment_date)
#     except Exception as e:
#         raise HTTPException(
#             400,
#             detail={
#                 "error": "Invalid appointment_date format",
#                 "provided": payload.appointment_date,
#                 "hint": "Use ISO format like 2025-12-18T06:00:00Z",
#                 "original_error": str(e),
#             }
#         )

#     appointment_date = dt.strftime("%Y-%m-%d")
#     appointment_time = dt.strftime("%H:%M")

#     # ───── 3. Client code ─────
#     client_code = payload.ref_order_no or f"TC{student_id}{int(datetime.now().timestamp()) % 100000}"

#     # ───── 4. Resolve products (auto-fetch if missing) ─────
#     total_mrp = Decimal("0")
#     total_pay = Decimal("0")
#     order_items = []
#     auto_fetched = []

#     for item in payload.patient.items:
#         product = await ThyrocareProduct.get_or_none(code=item.id)
#         if not product:
#             # Auto-fetch from Thyrocare
#             product = await fetch_and_save_product(item.id, payload.pincode)
#             if product:
#                 auto_fetched.append({"code": item.id, "name": product.name})
#             else:
#                 raise HTTPException(
#                     status_code=404,
#                     detail={
#                         "error": "Product not found",
#                         "product_code": item.id,
#                         "message": f"Product '{item.id}' not found in Thyrocare catalog for pincode {payload.pincode}",
#                         "suggestion": "Verify product code and type (PSKU/SSKU) against catalog",
#                     }
#                 )

#         total_mrp += product.mrp
#         total_pay += product.pay_amt
#         order_items.append({
#             "product": product,
#             "product_code": item.id,
#             "product_name": item.name,
#             "product_type": item.type,
#             "mrp": product.mrp,
#             "rate": product.rate,
#             "pay_amt": product.pay_amt,
#         })

#     # ───── 5. Build Thyrocare order payload ─────
#     order_payload = {
#         "address": {
#             "houseNo": payload.house_no,
#             "street": payload.street,
#             "addressLine1": payload.address,
#             "addressLine2": getattr(payload, "address2", "") or "",
#             "landmark": payload.landmark or "",
#             "city": payload.city.upper(),
#             "state": payload.state.upper(),
#             "country": "India",
#             "pincode": payload.pincode,
#         },
#         "email": payload.email or "",
#         "contactNumber": payload.contact_number,
#         "appointment": {
#             "date": appointment_date,
#             "startTime": appointment_time,
#             "timeZone": "IST",
#         },
#         "origin": {
#             "platform": "DSA-PARTNER",
#             "appId": "MHP001",
#             "portalType": "B2C",
#             "enteredBy": str(user["user_id"]),
#             "source": "B2C MIDDLEWARE API",
#         },
#         "referredBy": {
#             "doctorId": payload.referred_by.doctor_id or "",
#             "doctorName": payload.referred_by.doctor_name or "",
#         },
#         "paymentDetails": {
#             "payType": payload.payment_type,
#         },
#         "attributes": {
#             "remarks": payload.remarks or "",
#             "phleboNotes": "",
#             "campId": None,
#             "isReportHardCopyRequired": payload.is_report_hard_copy_required,
#             "refOrderNo": client_code,
#             "collectionType": payload.collection_type,
#             "alertMessage": payload.alert_message or [],
#         },
#         "config": {
#             "communication": {
#                 "shareReport": payload.config.communication.share_report,
#                 "shareReceipt": payload.config.communication.share_receipt,
#                 "shareModes": payload.config.communication.share_modes,
#             }
#         },
#         "patients": [
#             {
#                 "name": payload.patient.name,
#                 "gender": payload.patient.gender.upper(),
#                 "age": payload.patient.age,
#                 "ageType": payload.patient.age_type.upper(),
#                 "contactNumber": payload.patient.contact_number,
#                 "email": payload.patient.email or "",
#                 "attributes": {
#                     "ulcUniqueCode": "",
#                     "patientAddress": f"{payload.address}, {payload.city}",
#                     "externalPatientId": str(student_id),
#                 },
#                 "items": [
#                     {
#                         "id": itm.id,
#                         "type": itm.type,  # make sure you send PSKU for FBS
#                         "name": itm.name,
#                         "origin": {
#                             "enteredBy": itm.origin.entered_by if itm.origin else str(user["user_id"]),
#                             "platform": "DSA-PARTNER",
#                         },
#                     }
#                     for itm in payload.patient.items
#                 ],
#                 "documents": [],
#             }
#         ],
#         "price": {
#             "discounts": [],
#             "incentivePasson": {
#                 "type": "FLAT",
#                 "value": "0",
#             },
#         },
#         "orderOptions": {
#             "isPdpcOrder": payload.is_pdpc_order,
#         },
#     }

#     # ───── 6. Call Thyrocare orders API ─────
#     try:
#         resp = api_call("POST", "/partners/v1/orders", json=order_payload, client_type=client_type)
#         if resp.status_code not in (200, 201):
#             msg = resp.text
#             try:
#                 j = resp.json()
#                 if "errors" in j and j["errors"]:
#                     msg = j["errors"][0].get("message", msg)
#             except Exception:
#                 pass
#             raise HTTPException(502, f"Thyrocare API error: {msg}")

#         data = resp.json()
#         thyrocare_order_id = data.get("orderId") or data.get("orderNo")
#         if not thyrocare_order_id:
#             raise HTTPException(502, "Thyrocare API did not return an order ID")
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.exception("Order creation failed")
#         raise HTTPException(502, f"Failed to create order with Thyrocare: {str(e)}")

#     # ───── 7. Save locally ─────
#     now = datetime.utcnow()
#     try:
#         async with in_transaction():
#             tx = await Transactions.create(
#                 tx_no=f"TYTX{client_code[-10:]}",
#                 invoice_no=client_code,
#                 tx_amnt=total_pay,
#                 payment_status="pending",
#                 tx_mode="online",
#                 tx_datetime=now,
#                 created_by=user["user_id"],
#                 created_user_role=user["user_role"],
#             )

#             order = await ThyrocareOrder.create(
#                 thyrocare_order_id=thyrocare_order_id,
#                 client_code=client_code,
#                 student=student,
#                 transaction=tx,
#                 address=payload.address,
#                 house_no=payload.house_no,
#                 street=payload.street,
#                 landmark=payload.landmark,
#                 city=payload.city,
#                 state=payload.state,
#                 pincode=payload.pincode,
#                 appointment_date=dt,
#                 contact_number=payload.contact_number,
#                 email=payload.email,
#                 payment_status=payload.payment_type,
#                 total_mrp=total_mrp,
#                 total_rate=total_mrp,
#                 total_payable=total_pay,
#                 paid_amount=Decimal("0"),
#                 unpaid_amount=total_pay,
#                 thyrocare_response=data,
#                 created_by=user["user_id"],
#                 created_user_role=user["user_role"],
#             )

#             await ThyrocarePatient.create(
#                 order=order,
#                 name=payload.patient.name,
#                 age=payload.patient.age,
#                 age_type=payload.patient.age_type,
#                 gender=payload.patient.gender,
#                 contact_number=payload.patient.contact_number,
#                 email=payload.patient.email,
#             )

#             for it in order_items:
#                 await ThyrocareOrderItem.create(
#                     order=order,
#                     product=it["product"],
#                     product_code=it["product_code"],
#                     product_name=it["product_name"],
#                     product_type=it["product_type"],
#                     mrp=it["mrp"],
#                     rate=it["rate"],
#                     pay_amt=it["pay_amt"],
#                 )
#     except Exception as e:
#         logger.exception("Failed to save order to database")
#         raise HTTPException(500, f"Order created in Thyrocare but failed to save locally: {str(e)}")

#     return StandardResponse.success_response(
#         message="Order created successfully",
#         data={
#             "order_id": thyrocare_order_id,
#             "client_code": client_code,
#             "student_id": student_id,
#             "total_payable": float(total_pay),
#             "currency": "INR",
#             "appointment_date": appointment_date,
#             "appointment_time": appointment_time,
#             "auto_fetched_products": auto_fetched or [],
#         }
#     )

# ==================== HELPER FUNCTIONS ====================
# Place this AFTER all schema classes (after CancelRequest) and BEFORE endpoints

async def validate_thyrocare_slot(
    appointment_datetime: datetime, 
    pincode: int, 
    patient_items: List[PatientItem]
) -> bool:
    """
    Validate if the given appointment slot is available in Thyrocare
    Returns True if valid, raises HTTPException if not
    """
    import pytz
    
    # Extract date and time
    ist = pytz.timezone('Asia/Kolkata')
    dt_ist = appointment_datetime.astimezone(ist)
    
    date_str = dt_ist.strftime("%Y-%m-%d")
    time_str = dt_ist.strftime("%H:%M")
    
    # Build slots search payload
    thyrocare_payload = {
        "appointmentDate": date_str,
        "pincode": str(pincode),
        "patients": [
            {
                "name": "Validation Patient",
                "gender": "MALE",
                "age": 30,
                "ageType": "YEAR",
                "items": [
                    {"id": item.id, "type": item.type, "name": item.name}
                    for item in patient_items
                ]
            }
        ]
    }
    
    # Call Thyrocare slots API
    try:
        logger.info(f"Validating slot for {date_str} {time_str} at pincode {pincode}")
        resp = api_call("POST", "/partners/v1/slots/search", json=thyrocare_payload)
        
        logger.info(f"Slots API response status: {resp.status_code}")
        
        if resp.status_code != 200:
            # If slots API fails, log warning but don't block order
            logger.warning(f"Slots API returned {resp.status_code}, proceeding without validation")
            return True  # Allow order to proceed
        
        result = resp.json()
        slots = result.get("slots", [])
        
        logger.info(f"Available slots count: {len(slots)}")
        
        # If no slots returned, log warning but don't block
        if not slots:
            logger.warning(f"No slots returned for {date_str} at pincode {pincode}, proceeding without validation")
            return True  # Allow order to proceed
        
        # Check if the requested time matches any available slot
        for slot in slots:
            slot_start = slot.get("startTime", "")
            if slot_start == time_str:
                logger.info(f"✅ Slot {time_str} is valid")
                return True
        
        # If no match found, return available slots in error
        available_times = [s.get("startTime") for s in slots]
        logger.warning(f"Requested slot {time_str} not in available slots: {available_times}")
        
        raise HTTPException(
            400,
            detail={
                "error": "Slot not available",
                "message": f"The time slot {time_str} is not available for {date_str}",
                "requested_time": time_str,
                "requested_date": date_str,
                "available_slots": available_times,
                "hint": "Please use /thyrocare/slots/search API to get available slots first"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Slot validation failed: {e}")
        # Don't block order if validation fails due to technical error
        logger.warning("Proceeding with order creation despite slot validation error")
        return True


@router.post("/thyrocare/create-order-from-cart/{student_id}", response_model=StandardResponse)
async def create_order_from_cart(
    student_id: int,
    payload: CreateOrderFromCartRequest,
    user=Depends(get_current_user),
    client_type: str = Header("web", alias="Client-Type")
):
    """
    Create Thyrocare order – uses DB + auto-fetch for missing products (new catalog format).
    Treats all input times as IST (ignores Z or timezone offsets).
    Validates address length (25-175 characters total).
    """
    # ───── 1. Student & permission ─────
    student = await Students.get_or_none(id=student_id, is_deleted=False)
    if not student:
        raise HTTPException(404, f"Student with ID {student_id} not found or has been deleted")
    
    is_parent = await ParentChildren.filter(
        parent_id=user["user_id"],
        student_id=student_id,
        status=True
    ).exists()
    
    if not is_parent and user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
        authorized_students = await ParentChildren.filter(
            parent_id=user["user_id"],
            status=True
        ).values_list("student_id", flat=True)
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Access denied",
                "message": f"You are not authorized to create orders for student ID {student_id}",
                "reason": "You can only create orders for your own children",
                "your_user_id": user["user_id"],
                "your_role": user["user_role"],
                "requested_student_id": student_id,
                "your_authorized_student_ids": list(authorized_students),
            }
        )
    
    # ───── 2. Appointment Date - TREAT AS IST (IGNORE TIMEZONE) ─────
    import pytz
    
    try:
        dt_string = payload.appointment_date
        logger.info(f"Input appointment_date: {dt_string}")
        
        # Step 1: Parse to get the date and time components
        dt_temp = parser.isoparse(dt_string)
        
        # Step 2: Remove any timezone info (treat time as IST regardless of Z or +05:30)
        dt_naive = dt_temp.replace(tzinfo=None)
        logger.info(f"Timezone stripped, naive datetime: {dt_naive}")
        
        # Step 3: Localize as IST (treat the time as IST time)
        ist = pytz.timezone('Asia/Kolkata')
        dt = ist.localize(dt_naive)
        
        logger.info(f"Localized to IST: {dt}")
        
    except Exception as e:
        raise HTTPException(
            400,
            detail={
                "error": "Invalid appointment_date format",
                "provided": payload.appointment_date,
                "hint": "Use ISO format like 2026-01-12T09:30:00+05:30 or 2026-01-12T06:30:00.000Z",
                "original_error": str(e),
            }
        )
    
    appointment_date = dt.strftime("%Y-%m-%d")
    appointment_time = dt.strftime("%H:%M")
    
    logger.info(f"Final appointment: {appointment_date} at {appointment_time} IST")
    
    # VALIDATE SLOT AVAILABILITY (with graceful fallback)
    try:
        await validate_thyrocare_slot(dt, payload.pincode, payload.patient.items)
        logger.info(f"✅ Slot validation passed for {appointment_date} {appointment_time}")
    except HTTPException as e:
        logger.warning(f"⚠️ Slot validation failed: {e.detail}")
        logger.warning("Proceeding with order creation anyway...")
        # Uncomment to strictly enforce slot validation:
        # raise
    
    # ───── 3. Client code ─────
    client_code = payload.ref_order_no or f"TC{student_id}{int(datetime.now().timestamp()) % 100000}"
    
    # ───── 4. Resolve products (auto-fetch if missing) ─────
    total_mrp = Decimal("0")
    total_pay = Decimal("0")
    order_items = []
    auto_fetched = []
    
    for item in payload.patient.items:
        product = await ThyrocareProduct.get_or_none(code=item.id)
        if not product:
            # Auto-fetch from Thyrocare
            product = await fetch_and_save_product(item.id, payload.pincode)
            if product:
                auto_fetched.append({"code": item.id, "name": product.name})
            else:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "error": "Product not found",
                        "product_code": item.id,
                        "message": f"Product '{item.id}' not found in Thyrocare catalog for pincode {payload.pincode}",
                        "suggestion": "Verify product code and type (PSKU/SSKU) against catalog",
                    }
                )
        
        total_mrp += product.mrp
        total_pay += product.pay_amt
        order_items.append({
            "product": product,
            "product_code": item.id,
            "product_name": item.name,
            "product_type": item.type,
            "mrp": product.mrp,
            "rate": product.rate,
            "pay_amt": product.pay_amt,
        })
    
    # ───── 5. Build Thyrocare order payload with ADDRESS VALIDATION ─────
    
    # Prepare address components
    house_no = payload.house_no or ""
    street = payload.street or ""
    address_line1 = payload.address or ""  # Use payload.address for addressLine1
    address_line2 = payload.state or ""     # Use state for addressLine2
    landmark = payload.landmark or ""
    city = payload.city or ""
    state = payload.state or ""
    country = "India"
    pincode_str = str(payload.pincode)
    
    # Calculate total address length
    # Total = houseNo + street + addressLine1 + addressLine2 + landmark + city + state + country + pincode
    total_length = (
        len(house_no) + 
        len(street) + 
        len(address_line1) + 
        len(address_line2) + 
        len(landmark) + 
        len(city) + 
        len(state) + 
        len(country) + 
        len(pincode_str)
    )
    
    logger.info(f"Address length breakdown:")
    logger.info(f"  houseNo: {len(house_no)}")
    logger.info(f"  street: {len(street)}")
    logger.info(f"  addressLine1: {len(address_line1)}")
    logger.info(f"  addressLine2 (state): {len(address_line2)}")
    logger.info(f"  landmark: {len(landmark)}")
    logger.info(f"  city: {len(city)}")
    logger.info(f"  state: {len(state)}")
    logger.info(f"  country: {len(country)}")
    logger.info(f"  pincode: {len(pincode_str)}")
    logger.info(f"  Total: {total_length} characters")
    
    # Validate address length (must be between 25 and 175 characters)
    if total_length < 25:
        raise HTTPException(
            400,
            detail={
                "error": "Address too short",
                "message": f"Total address length must be at least 25 characters. Current: {total_length}",
                "hint": "Please provide more complete address information",
                "breakdown": {
                    "houseNo": len(house_no),
                    "street": len(street),
                    "addressLine1": len(address_line1),
                    "addressLine2": len(address_line2),
                    "landmark": len(landmark),
                    "city": len(city),
                    "state": len(state),
                    "country": len(country),
                    "pincode": len(pincode_str),
                    "total": total_length
                }
            }
        )
    
    if total_length > 175:
        # Trim fields to fit within 175 characters
        excess = total_length - 175
        
        # First try trimming street
        if len(street) > 10 and excess > 0:
            trim_amount = min(len(street) - 10, excess)
            street = street[:len(street) - trim_amount]
            excess -= trim_amount
            logger.warning(f"Trimmed street by {trim_amount} characters")
        
        # Then trim addressLine1 if needed
        if len(address_line1) > 10 and excess > 0:
            trim_amount = min(len(address_line1) - 10, excess)
            address_line1 = address_line1[:len(address_line1) - trim_amount]
            excess -= trim_amount
            logger.warning(f"Trimmed addressLine1 by {trim_amount} characters")
        
        # Finally trim landmark if needed
        if len(landmark) > 5 and excess > 0:
            trim_amount = min(len(landmark) - 5, excess)
            landmark = landmark[:len(landmark) - trim_amount]
            excess -= trim_amount
            logger.warning(f"Trimmed landmark by {trim_amount} characters")
        
        # Recalculate
        total_length = (
            len(house_no) + len(street) + len(address_line1) + 
            len(address_line2) + len(landmark) + len(city) + 
            len(state) + len(country) + len(pincode_str)
        )
        
        # Final check
        if total_length > 175:
            raise HTTPException(
                400,
                detail={
                    "error": "Address too long",
                    "message": f"Total address length must not exceed 175 characters. Current: {total_length}",
                    "hint": "Please shorten house number, street, address, or landmark",
                    "breakdown": {
                        "houseNo": len(house_no),
                        "street": len(street),
                        "addressLine1": len(address_line1),
                        "addressLine2": len(address_line2),
                        "landmark": len(landmark),
                        "city": len(city),
                        "state": len(state),
                        "country": len(country),
                        "pincode": len(pincode_str),
                        "total": total_length
                    }
                }
            )
    
    logger.info(f"✅ Address validation passed: {total_length} characters (min: 25, max: 175)")
    
    order_payload = {
        "address": {
            "houseNo": house_no,
            "street": street,
            "addressLine1": address_line1,  # Has value from payload.address
            "addressLine2": address_line2,  # State value
            "landmark": landmark,
            "city": city.upper(),
            "state": state.upper(),
            "country": country,
            "pincode": payload.pincode,
        },
        "email": payload.email or "",
        "contactNumber": payload.contact_number,
        "appointment": {
            "date": appointment_date,
            "startTime": appointment_time,
            "timeZone": "IST",
        },
        "origin": {
            "platform": "DSA-PARTNER",
            "appId": "MHP001",
            "portalType": "B2C",
            "enteredBy": str(user["user_id"]),
            "source": "B2C MIDDLEWARE API",
        },
        "referredBy": {
            "doctorId": payload.referred_by.doctor_id or "",
            "doctorName": payload.referred_by.doctor_name or "",
        },
        "paymentDetails": {
            "payType": payload.payment_type,
        },
        "attributes": {
            "remarks": payload.remarks or "",
            "phleboNotes": "",
            "campId": None,
            "isReportHardCopyRequired": payload.is_report_hard_copy_required,
            "refOrderNo": client_code,
            "collectionType": payload.collection_type,
            "alertMessage": payload.alert_message or [],
        },
        "config": {
            "communication": {
                "shareReport": payload.config.communication.share_report,
                "shareReceipt": payload.config.communication.share_receipt,
                "shareModes": payload.config.communication.share_modes,
            }
        },
        "patients": [
            {
                "name": payload.patient.name,
                "gender": payload.patient.gender.upper(),
                "age": payload.patient.age,
                "ageType": payload.patient.age_type.upper(),
                "contactNumber": payload.patient.contact_number,
                "email": payload.patient.email or "",
                "attributes": {
                    "ulcUniqueCode": "",
                    "patientAddress": f"{address_line1}, {city}",
                    "externalPatientId": str(student_id),
                },
                "items": [
                    {
                        "id": itm.id,
                        "type": itm.type,
                        "name": itm.name,
                        "origin": {
                            "enteredBy": itm.origin.entered_by if itm.origin else str(user["user_id"]),
                            "platform": "DSA-PARTNER",
                        },
                    }
                    for itm in payload.patient.items
                ],
                "documents": [],
            }
        ],
        "price": {
            "discounts": [],
            "incentivePasson": {
                "type": "FLAT",
                "value": "0",
            },
        },
        "orderOptions": {
            "isPdpcOrder": payload.is_pdpc_order,
        },
    }
    
    logger.info(f"Sending order to Thyrocare with appointment: {appointment_date} {appointment_time} IST")
    
    # ───── 6. Call Thyrocare orders API ─────
    try:
        resp = api_call("POST", "/partners/v1/orders", json=order_payload, client_type=client_type)
        if resp.status_code not in (200, 201):
            msg = resp.text
            try:
                j = resp.json()
                if "errors" in j and j["errors"]:
                    msg = j["errors"][0].get("message", msg)
            except Exception:
                pass
            raise HTTPException(502, f"Thyrocare API error: {msg}")
        
        data = resp.json()
        thyrocare_order_id = data.get("orderId") or data.get("orderNo")
        if not thyrocare_order_id:
            raise HTTPException(502, "Thyrocare API did not return an order ID")
        
        logger.info(f"✅ Order created successfully: {thyrocare_order_id}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Order creation failed")
        raise HTTPException(502, f"Failed to create order with Thyrocare: {str(e)}")
    
    # ───── 7. Save locally ─────
    now = datetime.utcnow()
    try:
        async with in_transaction():
            tx = await Transactions.create(
                tx_no=f"TYTX{client_code[-10:]}",
                invoice_no=client_code,
                tx_amnt=total_pay,
                payment_status="pending",
                tx_mode="online",
                tx_datetime=now,
                created_by=user["user_id"],
                created_user_role=user["user_role"],
            )
            
            order = await ThyrocareOrder.create(
                thyrocare_order_id=thyrocare_order_id,
                client_code=client_code,
                student=student,
                transaction=tx,
                address=payload.address,
                house_no=payload.house_no,
                street=payload.street,
                landmark=payload.landmark,
                city=payload.city,
                state=payload.state,
                pincode=payload.pincode,
                appointment_date=dt,
                contact_number=payload.contact_number,
                email=payload.email,
                payment_status=payload.payment_type,
                total_mrp=total_mrp,
                total_rate=total_mrp,
                total_payable=total_pay,
                paid_amount=Decimal("0"),
                unpaid_amount=total_pay,
                thyrocare_response=data,
                created_by=user["user_id"],
                created_user_role=user["user_role"],
            )
            
            await ThyrocarePatient.create(
                order=order,
                name=payload.patient.name,
                age=payload.patient.age,
                age_type=payload.patient.age_type,
                gender=payload.patient.gender,
                contact_number=payload.patient.contact_number,
                email=payload.patient.email,
            )
            
            for it in order_items:
                await ThyrocareOrderItem.create(
                    order=order,
                    product=it["product"],
                    product_code=it["product_code"],
                    product_name=it["product_name"],
                    product_type=it["product_type"],
                    mrp=it["mrp"],
                    rate=it["rate"],
                    pay_amt=it["pay_amt"],
                )
        
        logger.info(f"✅ Order saved to database successfully")
    
    except Exception as e:
        logger.exception("Failed to save order to database")
        raise HTTPException(500, f"Order created in Thyrocare but failed to save locally: {str(e)}")
    
    return StandardResponse.success_response(
        message="Order created successfully",
        data={
            "order_id": thyrocare_order_id,
            "client_code": client_code,
            "student_id": student_id,
            "total_payable": float(total_pay),
            "currency": "INR",
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
            "timezone": "IST",
            "auto_fetched_products": auto_fetched or [],
        }
    )

# @router.post("/thyrocare/create-order-from-cart/{student_id}", response_model=StandardResponse)
# async def create_order_from_cart(
#     student_id: int,
#     payload: CreateOrderFromCartRequest,
#     user=Depends(get_current_user),
#     client_type: str = Header("web", alias="Client-Type")
# ):
#     """
#     Create Thyrocare order – uses DB + auto-fetch for missing products (new catalog format).
#     Treats all input times as IST (ignores Z or timezone offsets).
#     """
#     # ───── 1. Student & permission ─────
#     student = await Students.get_or_none(id=student_id, is_deleted=False)
#     if not student:
#         raise HTTPException(404, f"Student with ID {student_id} not found or has been deleted")
    
#     is_parent = await ParentChildren.filter(
#         parent_id=user["user_id"],
#         student_id=student_id,
#         status=True
#     ).exists()
    
#     if not is_parent and user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
#         authorized_students = await ParentChildren.filter(
#             parent_id=user["user_id"],
#             status=True
#         ).values_list("student_id", flat=True)
#         raise HTTPException(
#             status_code=403,
#             detail={
#                 "error": "Access denied",
#                 "message": f"You are not authorized to create orders for student ID {student_id}",
#                 "reason": "You can only create orders for your own children",
#                 "your_user_id": user["user_id"],
#                 "your_role": user["user_role"],
#                 "requested_student_id": student_id,
#                 "your_authorized_student_ids": list(authorized_students),
#             }
#         )
    
#     # ───── 2. Appointment Date - TREAT AS IST (IGNORE TIMEZONE) ─────
#     import pytz
    
#     try:
#         dt_string = payload.appointment_date
#         logger.info(f"Input appointment_date: {dt_string}")
        
#         # Step 1: Parse to get the date and time components
#         dt_temp = parser.isoparse(dt_string)
        
#         # Step 2: Remove any timezone info (treat time as IST regardless of Z or +05:30)
#         dt_naive = dt_temp.replace(tzinfo=None)
#         logger.info(f"Timezone stripped, naive datetime: {dt_naive}")
        
#         # Step 3: Localize as IST (treat the time as IST time)
#         ist = pytz.timezone('Asia/Kolkata')
#         dt = ist.localize(dt_naive)
        
#         logger.info(f"Localized to IST: {dt}")
        
#     except Exception as e:
#         raise HTTPException(
#             400,
#             detail={
#                 "error": "Invalid appointment_date format",
#                 "provided": payload.appointment_date,
#                 "hint": "Use ISO format like 2026-01-12T09:30:00+05:30 or 2026-01-12T06:30:00.000Z",
#                 "original_error": str(e),
#             }
#         )
    
#     appointment_date = dt.strftime("%Y-%m-%d")
#     appointment_time = dt.strftime("%H:%M")
    
#     logger.info(f"Final appointment: {appointment_date} at {appointment_time} IST")
    
#     # VALIDATE SLOT AVAILABILITY (with graceful fallback)
#     try:
#         await validate_thyrocare_slot(dt, payload.pincode, payload.patient.items)
#         logger.info(f"✅ Slot validation passed for {appointment_date} {appointment_time}")
#     except HTTPException as e:
#         logger.warning(f"⚠️ Slot validation failed: {e.detail}")
#         logger.warning("Proceeding with order creation anyway...")
#         # Uncomment to strictly enforce slot validation:
#         # raise
    
#     # ───── 3. Client code ─────
#     client_code = payload.ref_order_no or f"TC{student_id}{int(datetime.now().timestamp()) % 100000}"
    
#     # ───── 4. Resolve products (auto-fetch if missing) ─────
#     total_mrp = Decimal("0")
#     total_pay = Decimal("0")
#     order_items = []
#     auto_fetched = []
    
#     for item in payload.patient.items:
#         product = await ThyrocareProduct.get_or_none(code=item.id)
#         if not product:
#             # Auto-fetch from Thyrocare
#             product = await fetch_and_save_product(item.id, payload.pincode)
#             if product:
#                 auto_fetched.append({"code": item.id, "name": product.name})
#             else:
#                 raise HTTPException(
#                     status_code=404,
#                     detail={
#                         "error": "Product not found",
#                         "product_code": item.id,
#                         "message": f"Product '{item.id}' not found in Thyrocare catalog for pincode {payload.pincode}",
#                         "suggestion": "Verify product code and type (PSKU/SSKU) against catalog",
#                     }
#                 )
        
#         total_mrp += product.mrp
#         total_pay += product.pay_amt
#         order_items.append({
#             "product": product,
#             "product_code": item.id,
#             "product_name": item.name,
#             "product_type": item.type,
#             "mrp": product.mrp,
#             "rate": product.rate,
#             "pay_amt": product.pay_amt,
#         })
    
#     # ───── 5. Build Thyrocare order payload ─────
#     order_payload = {
#         "address": {
#             "houseNo": payload.house_no,
#             "street": payload.street,
#             "addressLine1": payload.address,
#             "addressLine2": getattr(payload, "address2", "") or "",
#             "landmark": payload.landmark or "",
#             "city": payload.city.upper(),
#             "state": payload.state.upper(),
#             "country": "India",
#             "pincode": payload.pincode,
#         },
#         "email": payload.email or "",
#         "contactNumber": payload.contact_number,
#         "appointment": {
#             "date": appointment_date,
#             "startTime": appointment_time,
#             "timeZone": "IST",
#         },
#         "origin": {
#             "platform": "DSA-PARTNER",
#             "appId": "MHP001",
#             "portalType": "B2C",
#             "enteredBy": str(user["user_id"]),
#             "source": "B2C MIDDLEWARE API",
#         },
#         "referredBy": {
#             "doctorId": payload.referred_by.doctor_id or "",
#             "doctorName": payload.referred_by.doctor_name or "",
#         },
#         "paymentDetails": {
#             "payType": payload.payment_type,
#         },
#         "attributes": {
#             "remarks": payload.remarks or "",
#             "phleboNotes": "",
#             "campId": None,
#             "isReportHardCopyRequired": payload.is_report_hard_copy_required,
#             "refOrderNo": client_code,
#             "collectionType": payload.collection_type,
#             "alertMessage": payload.alert_message or [],
#         },
#         "config": {
#             "communication": {
#                 "shareReport": payload.config.communication.share_report,
#                 "shareReceipt": payload.config.communication.share_receipt,
#                 "shareModes": payload.config.communication.share_modes,
#             }
#         },
#         "patients": [
#             {
#                 "name": payload.patient.name,
#                 "gender": payload.patient.gender.upper(),
#                 "age": payload.patient.age,
#                 "ageType": payload.patient.age_type.upper(),
#                 "contactNumber": payload.patient.contact_number,
#                 "email": payload.patient.email or "",
#                 "attributes": {
#                     "ulcUniqueCode": "",
#                     "patientAddress": f"{payload.address}, {payload.city}",
#                     "externalPatientId": str(student_id),
#                 },
#                 "items": [
#                     {
#                         "id": itm.id,
#                         "type": itm.type,
#                         "name": itm.name,
#                         "origin": {
#                             "enteredBy": itm.origin.entered_by if itm.origin else str(user["user_id"]),
#                             "platform": "DSA-PARTNER",
#                         },
#                     }
#                     for itm in payload.patient.items
#                 ],
#                 "documents": [],
#             }
#         ],
#         "price": {
#             "discounts": [],
#             "incentivePasson": {
#                 "type": "FLAT",
#                 "value": "0",
#             },
#         },
#         "orderOptions": {
#             "isPdpcOrder": payload.is_pdpc_order,
#         },
#     }
    
#     logger.info(f"Sending order to Thyrocare with appointment: {appointment_date} {appointment_time} IST")
    
#     # ───── 6. Call Thyrocare orders API ─────
#     try:
#         resp = api_call("POST", "/partners/v1/orders", json=order_payload, client_type=client_type)
#         if resp.status_code not in (200, 201):
#             msg = resp.text
#             try:
#                 j = resp.json()
#                 if "errors" in j and j["errors"]:
#                     msg = j["errors"][0].get("message", msg)
#             except Exception:
#                 pass
#             raise HTTPException(502, f"Thyrocare API error: {msg}")
        
#         data = resp.json()
#         thyrocare_order_id = data.get("orderId") or data.get("orderNo")
#         if not thyrocare_order_id:
#             raise HTTPException(502, "Thyrocare API did not return an order ID")
        
#         logger.info(f"✅ Order created successfully: {thyrocare_order_id}")
    
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.exception("Order creation failed")
#         raise HTTPException(502, f"Failed to create order with Thyrocare: {str(e)}")
    
#     # ───── 7. Save locally ─────
#     now = datetime.utcnow()
#     try:
#         async with in_transaction():
#             tx = await Transactions.create(
#                 tx_no=f"TYTX{client_code[-10:]}",
#                 invoice_no=client_code,
#                 tx_amnt=total_pay,
#                 payment_status="pending",
#                 tx_mode="online",
#                 tx_datetime=now,
#                 created_by=user["user_id"],
#                 created_user_role=user["user_role"],
#             )
            
#             order = await ThyrocareOrder.create(
#                 thyrocare_order_id=thyrocare_order_id,
#                 client_code=client_code,
#                 student=student,
#                 transaction=tx,
#                 address=payload.address,
#                 house_no=payload.house_no,
#                 street=payload.street,
#                 landmark=payload.landmark,
#                 city=payload.city,
#                 state=payload.state,
#                 pincode=payload.pincode,
#                 appointment_date=dt,
#                 contact_number=payload.contact_number,
#                 email=payload.email,
#                 payment_status=payload.payment_type,
#                 total_mrp=total_mrp,
#                 total_rate=total_mrp,
#                 total_payable=total_pay,
#                 paid_amount=Decimal("0"),
#                 unpaid_amount=total_pay,
#                 thyrocare_response=data,
#                 created_by=user["user_id"],
#                 created_user_role=user["user_role"],
#             )
            
#             await ThyrocarePatient.create(
#                 order=order,
#                 name=payload.patient.name,
#                 age=payload.patient.age,
#                 age_type=payload.patient.age_type,
#                 gender=payload.patient.gender,
#                 contact_number=payload.patient.contact_number,
#                 email=payload.patient.email,
#             )
            
#             for it in order_items:
#                 await ThyrocareOrderItem.create(
#                     order=order,
#                     product=it["product"],
#                     product_code=it["product_code"],
#                     product_name=it["product_name"],
#                     product_type=it["product_type"],
#                     mrp=it["mrp"],
#                     rate=it["rate"],
#                     pay_amt=it["pay_amt"],
#                 )
        
#         logger.info(f"✅ Order saved to database successfully")
    
#     except Exception as e:
#         logger.exception("Failed to save order to database")
#         raise HTTPException(500, f"Order created in Thyrocare but failed to save locally: {str(e)}")
    
#     return StandardResponse.success_response(
#         message="Order created successfully",
#         data={
#             "order_id": thyrocare_order_id,
#             "client_code": client_code,
#             "student_id": student_id,
#             "total_payable": float(total_pay),
#             "currency": "INR",
#             "appointment_date": appointment_date,
#             "appointment_time": appointment_time,
#             "timezone": "IST",
#             "auto_fetched_products": auto_fetched or [],
#         }
#     )

# @router.post("/thyrocare/fetch-products", response_model=StandardResponse)
# async def fetch_products(payload: FetchProductsRequest, user=Depends(get_current_user)):
#     """
#     Fetch live products from Thyrocare.
#     Returns **all original fields** from the API.
#     """
#     try:
#         params = {
#             "pincode": str(payload.pincode),
#             "limit": payload.limit,
#             "offset": 0
#         }
#         if payload.product_type:
#             params["productType"] = payload.product_type.upper()

#         resp = api_call("GET", "/partners/v1/catalog/products", params=params)
#         if resp.status_code != 200:
#             raise HTTPException(502, f"Catalog error: {resp.status_code}")

#         data = resp.json()
#         products = data.get("skuList", [])

#         return StandardResponse.success_response(
#             message=f"Fetched {len(products)} products",
#             data={
#                 "total": len(products),
#                 "is_last_page": data.get("isLastPage", True),
#                 "next_page": data.get("nextPage"),
#                 "products": products  # ← Full original data (all fields)
#             }
#         )
#     except Exception as e:
#         logger.exception("Fetch failed")
#         raise HTTPException(502, detail=str(e))
   
@router.post("/thyrocare/fetch-products", response_model=StandardResponse)
async def fetch_products(payload: FetchProductsRequest, user=Depends(get_current_user)):
    """
    Fetch live products from Thyrocare.
    Uses page/pageSize pagination (matching Postman).
    """
    try:
        # Use Postman's exact params
        params = {
            "page": 1,
            "pageSize": payload.limit or 50
        }
        # Remove pincode and productType - they cause 500 errors
        
        resp = api_call("GET", "/partners/v1/catalog/products", params=params)
        if resp.status_code != 200:
            raise HTTPException(502, f"Catalog error: {resp.status_code}")

        data = resp.json()
        products = data.get("skuList", [])

        return StandardResponse.success_response(
            message=f"Fetched {len(products)} products",
            data={
                "total": len(products),
                "is_last_page": data.get("isLastPage", True),
                "next_page": data.get("nextPage"),
                "products": products
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Fetch failed")
        raise HTTPException(502, detail=str(e))


# @router.get("/thyrocare/products/all")
# async def get_all_thyrocare_products(user = Depends(get_current_user)):
#     """
#     Get ALL available Thyrocare products (no filters)
#     → Zero params needed
#     """
#     resp = api_call("GET", "/partners/v1/catalog/products", params={"limit": 500})
#     if resp.status_code != 200:
#         raise HTTPException(502, "Failed to fetch products")

#     products = resp.json().get("skuList", [])

#     return StandardResponse.success_response(
#         message=f"All {len(products)} Thyrocare products",
#         data={"total": len(products), "products": products}
#     )
   
@router.get("/thyrocare/products/all", response_model=StandardResponse)
# async def get_all_thyrocare_products(user = Depends(get_current_user)):
#     """
#     Get ALL available Thyrocare products (no filters)
#     Uses Thyrocare pagination: ?page=N&pageSize=50
#     """
#     all_products = []
#     page = 1
#     page_size = 50

#     while True:
#         params = {
#             "page": page,
#             "pageSize": page_size
#         }
#         resp = api_call("GET", "/partners/v1/catalog/products", params=params)
#         if resp.status_code != 200:
#             raise HTTPException(502, f"Failed to fetch products at page {page}")

#         data = resp.json()
#         products = data.get("skuList", []) or []

#         if not products:
#             # No more products
#             break

#         all_products.extend(products)
#         page += 1

#     return StandardResponse.success_response(
#         message=f"All {len(all_products)} Thyrocare products",
#         data={"total": len(all_products), "products": all_products}
#     )
  
@router.get("/thyrocare/products/all", response_model=StandardResponse)
async def get_all_thyrocare_products(user = Depends(get_current_user)):
    """
    Get ALL available Thyrocare products (no filters)
    Uses Thyrocare pagination: ?page=N&pageSize=50
    """
    all_products = []
    page = 1
    page_size = 50

    while True:
        params = {
            "page": page,
            "pageSize": page_size
        }
        # No pincode or productType params
        
        try:
            resp = api_call("GET", "/partners/v1/catalog/products", params=params)
            if resp.status_code != 200:
                raise HTTPException(502, f"Failed at page {page}")

            data = resp.json()
            products = data.get("skuList", []) or []

            if not products:
                break

            all_products.extend(products)
            page += 1
            
        except HTTPException:
            if page == 1:
                raise  # Fail if first page fails
            else:
                break  # Stop if later pages fail

    return StandardResponse.success_response(
        message=f"All {len(all_products)} Thyrocare products",
        data={"total": len(all_products), "products": all_products}
    )

# ==================== IN-MEMORY CART (keep this at top) ====================
user_carts: Dict[int, List[Dict]] = {}  # user_id → list of full product dicts


# ==================== BULK ADD TO CART – ADD MULTIPLE AT ONCE ====================
class BulkAddToCartRequest(BaseModel):
    product_codes: List[str] = Field(..., min_items=1, max_items=50, description="List of Thyrocare product codes")


@router.post("/thyrocare/add-to-cart", response_model=StandardResponse)
async def bulk_add_to_cart(
    payload: BulkAddToCartRequest,
    user = Depends(get_current_user)
):
    """
    Add 2 or more products to cart in ONE single request
    Example:
    {
      "product_codes": ["P180", "AAROGYAM1.3", "AAROGYAM1.7"]
    }
    """
    user_id = user["user_id"]
    user_carts.setdefault(user_id, [])

    # Get full live catalog once
    resp = api_call("GET", "/partners/v1/catalog/products", params={"limit": 500})
    if resp.status_code != 200:
        raise HTTPException(502, "Thyrocare catalog temporarily down")

    catalog = {p["id"]: p for p in resp.json().get("skuList", [])}

    added = []
    skipped = []        # already in cart
    not_found = []

    for code in payload.product_codes:
        if code in not_found or code in added or code in skipped:
            continue  # avoid duplicates in same request

        product = catalog.get(code)
        if not product:
            not_found.append(code)
            continue

        if any(item["id"] == code for item in user_carts[user_id]):
            skipped.append(code)
        else:
            user_carts[user_id].append(product)
            added.append(code)

    total_items = len(user_carts[user_id])
    total_amount = sum(
        Decimal(str(p.get("payAmount") or p.get("sellingPrice") or 0))
        for p in user_carts[user_id]
    )

    return StandardResponse.success_response(
        message="Bulk add to cart completed",
        data={
            "added_count": len(added),
            "added_products": added,
            "already_in_cart": skipped,
            "not_found": not_found,
            "total_items_in_cart": total_items,
            "total_payable": float(total_amount),
            "currency": "INR"
        }
    )

# ==================== VIEW CART (Already Good – Just Improve Response) ====================
@router.get("/thyrocare/view-cart", response_model=StandardResponse)
async def view_cart(user=Depends(get_current_user)):
    cart = user_carts.get(user["user_id"], [])
    
    if not cart:
        return StandardResponse.success_response(
            message="Cart is empty",
            data={"items": [], "total_items": 0, "total_payable": 0.0}
        )

    items = [
        {
            "code": p["id"],
            "name": p["name"],
            "mrp": float(p.get("mrp", 0)),
            "pay_amt": float(p.get("payAmount") or p.get("sellingPrice") or 0),
            "sample_type": p.get("sampleType"),
            "fasting_required": bool(p.get("fastingRequired"))
        }
        for p in cart
    ]

    total_payable = sum(Decimal(str(p.get("payAmount") or p.get("sellingPrice") or 0)) for p in cart)

    return StandardResponse.success_response(
        message=f"{len(cart)} item(s) in cart",
        data={
            "total_items": len(cart),
            "items": items,
            "total_payable": float(total_payable),
            "currency": "INR"
        }
    )
    
@router.delete("/thyrocare/clear-cart", response_model=StandardResponse)
async def clear_cart(user=Depends(get_current_user)):
    user_carts[user["user_id"]] = []
    return StandardResponse.success_response(message="Cart cleared")


@router.get("/thyrocare/order-status/{order_id}", response_model=StandardResponse)
async def order_status(order_id: str, user=Depends(get_current_user)):
    """
    Get Thyrocare order status + tracking + items + price
    """
    try:
        resp = api_call("GET", f"/partners/v1/orders/{order_id}", params={"include": "tracking,items,price"})
        if resp.status_code != 200:
            raise HTTPException(502, f"Thyrocare error: {resp.text}")

        data = resp.json()

        # Update local order status
        order = await ThyrocareOrder.get_or_none(thyrocare_order_id=order_id)
        if order:
            order.status = data.get("status")
            order.thyrocare_response = data
            await order.save()

        return StandardResponse.success_response(
            message="Order status fetched",
            data=data  # ← Full original response
        )
    except Exception as e:
        raise HTTPException(502, detail=str(e))
    
class CancelOrderRequest(BaseModel):
    order_id: str
    reason_key: str = Field("OTHER", pattern="^(OTHER|...)$")  # e.g., "OTHER"
    reason_text: str = Field(..., min_length=10)  # Free text reason

@router.post("/thyrocare/cancel-order", response_model=StandardResponse)
async def cancel_order(payload: CancelOrderRequest, user=Depends(get_current_user)):
    """
    Cancel Thyrocare order (DELETE method).
    Uses DELETE /partners/v1/orders/{id}/cancel with reasonKey/reasonText.
    """
    try:
        resp = api_call("DELETE", f"/partners/v1/orders/{payload.order_id}/cancel", json={
            "reasonKey": payload.reason_key,
            "reasonText": payload.reason_text
        })
        if resp.status_code not in (200, 204):
            raise HTTPException(502, f"Cancel failed: {resp.text}")

        data = resp.json() if resp.text else {}

        order = await ThyrocareOrder.get_or_none(thyrocare_order_id=payload.order_id)
        if order:
            order.status = "CANCELLED"
            order.booking_status = "cancelled"
            await order.save()

        return StandardResponse.success_response(message="Order cancelled", data=data)
    except Exception as e:
        raise HTTPException(502, detail=str(e))
    
class RescheduleOrderRequest(BaseModel):
    order_id: str
    appointment_date: str  # ISO format: 2025-11-18T10:00:00Z
    reason: Optional[str] = "Customer request"

@router.post("/thyrocare/reschedule-order", response_model=StandardResponse)
async def reschedule_order(payload: RescheduleOrderRequest, user=Depends(get_current_user)):
    """
    Reschedule Thyrocare order
    """
    try:
        dt = parser.isoparse(payload.appointment_date)
        reschedule_payload = {
            "appointment": {
                "date": dt.strftime("%Y-%m-%d"),
                "startTime": dt.strftime("%H:%M"),
                "timeZone": "IST"
            },
            "reason": payload.reason
        }

        resp = api_call("POST", f"/partners/v1/orders/{payload.order_id}/reschedule", json=reschedule_payload)
        if resp.status_code not in (200, 201):
            raise HTTPException(502, f"Reschedule failed: {resp.text}")

        data = resp.json()

        order = await ThyrocareOrder.get_or_none(thyrocare_order_id=payload.order_id)
        if order:
            order.appointment_date = dt
            order.status = "RESCHEDULED"
            await order.save()

        return StandardResponse.success_response(message="Order rescheduled", data=data)
    except Exception as e:
        raise HTTPException(502, detail=str(e))
    
    
# src/api/doctor/thyrocare_lab_booking.py
# Note: Assuming a separate file for Thyrocare, similar to healthians_lab_booking.py
# If it needs to be in the same file, merge accordingly. But for clarity, treating as separate.
# Imports are similar; adjust paths as needed.


from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, Field
from tortoise.expressions import Q
from datetime import datetime

from src.core.manager import get_current_user
from src.utils.response import StandardResponse
from src.models.school_models import Schools
from src.models.thyrocare_models import ThyrocareProduct, SchoolThyrocareProduct


# ==================== SCHEMAS ====================
# src/api/doctor/thyrocare_lab_booking.py or thyrocare.py

class ThyrocareProductItem(BaseModel):
    product: str = Field(..., description="Thyrocare product code (e.g. P175, AAROGYAM1.3)")
    custom_name: Optional[str] = None
    custom_price: Optional[Decimal] = None


class BulkThyrocareProductRequest(BaseModel):
    school_ids: List[int] = Field(..., min_items=1, max_items=200, description="List of school IDs")
    products: List[ThyrocareProductItem] = Field(..., min_items=1, description="Products to assign/modify")


@router.post("/thyrocare/select-products", response_model=StandardResponse)
async def select_thyrocare_products(
    payload: BulkThyrocareProductRequest,
    user = Depends(get_current_user)
):
    """Add a new package of products to schools (without removing existing ones)"""
    if user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
        raise HTTPException(403, "Unauthorized")

    async with in_transaction():
        schools = await Schools.filter(school_id__in=payload.school_ids, is_deleted=False)
        if len(schools) != len(payload.school_ids):
            raise HTTPException(404, "Some schools not found")

        # Do NOT delete existing records!

        records = []
        for school in schools:
            for item in payload.products:
                # Optional: Check for duplicates to avoid exact duplicates
                existing = await SchoolThyrocareProduct.filter(
                    school=school,
                    product=item.product
                ).first()

                if existing:
                    # Option 1: Skip if same product already exists
                    continue
                    # Option 2: Update custom name/price if different (uncomment below)
                    # existing.custom_name = item.custom_name
                    # existing.custom_price = item.custom_price
                    # existing.is_active = True
                    # existing.updated_by = user["user_id"]
                    # existing.updated_at = datetime.utcnow()
                    # await existing.save()
                else:
                    # Add new record
                    records.append(
                        SchoolThyrocareProduct(
                            school=school,
                            product=item.product,
                            custom_name=item.custom_name or None,
                            custom_price=item.custom_price,
                            is_active=True,
                            created_by=user["user_id"]
                        )
                    )

        if records:
            await SchoolThyrocareProduct.bulk_create(records, batch_size=100)

    return StandardResponse.success_response(
        message="New Thyrocare product package added successfully",
        data={
            "schools": len(schools),
            "products_in_package": len(payload.products),
            "new_assignments_created": len(records)
        }
    )
    
@router.put("/thyrocare/modify-products", response_model=StandardResponse)
async def modify_thyrocare_products(
    payload: BulkThyrocareProductRequest,
    user = Depends(get_current_user)
):
    """
    MODIFY = Full Replace
    - Deletes ALL existing customizations for these schools
    - Inserts exactly what you send
    - Use this when updating pricing/name
    """
    if user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
        raise HTTPException(403, "Only admins can modify products")

    async with in_transaction():
        schools = await Schools.filter(school_id__in=payload.school_ids, is_deleted=False)
        if len(schools) != len(payload.school_ids):
            raise HTTPException(404, "One or more schools not found")

        # Get current count before delete
        previous = await SchoolThyrocareProduct.filter(school_id__in=payload.school_ids).count()

        # Delete all old
        await SchoolThyrocareProduct.filter(school_id__in=payload.school_ids).delete()

        # Insert new
        records = []
        for school in schools:
            for item in payload.products:
                records.append(
                    SchoolThyrocareProduct(
                        school=school,
                        product=item.product,
                        custom_name=item.custom_name or None,
                        custom_price=item.custom_price,
                        is_active=True,
                        created_by=user["user_id"]
                    )
                )

        if records:
            await SchoolThyrocareProduct.bulk_create(records, batch_size=100)

    return StandardResponse.success_response(
        message="Products modified successfully",
        data={
            "action": "modified",
            "schools": len(schools),
            "products_added": len(payload.products),
            "previous_count": previous,
            "total_assignments": len(schools) * len(payload.products)
        }
    )
    

@router.get("/thyrocare/products", response_model=StandardResponse)
async def get_thyrocare_products(user=Depends(get_current_user)):
    products = await ThyrocareProduct.filter(is_active=True).all()
    result = [
        {
            "product_id": p.product_id,
            "code": p.code,
            "name": p.name,
            "mrp": float(p.mrp),
            "rate": float(p.rate),
            "pay_amt": float(p.pay_amt),
            "vendor": "Thyrocare"
        }
        for p in products
    ]
    return StandardResponse.success_response(
        message="All Thyrocare products",
        data={"products": result}
    )


from typing import List
from fastapi import Query

# 1. Get ALL customized Thyrocare products across all schools
@router.get("/thyrocare/thyrocare-custom-products", response_model=StandardResponse)
async def get_all_custom_thyrocare_products(
    user = Depends(get_current_user)
):
    """Shows every Thyrocare product that has custom name/price in any school"""
    if user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
        raise HTTPException(403, "Unauthorized")

    customs = await SchoolThyrocareProduct.filter(
        is_active=True
    ).filter(
        Q(custom_name__not_isnull=True) | Q(custom_price__not_isnull=True)
    ).prefetch_related("school").values(
        "product", "custom_name", "custom_price", 
        "school__school_id", "school__school_name"
    )

    # Group by product code
    grouped = {}
    for c in customs:
        code = c["product"]
        if code not in grouped:
            grouped[code] = {
                "product_code": code,
                "schools": [],
                "custom_names": set(),
                "custom_prices": set()
            }
        item = grouped[code]
        item["schools"].append({
            "school_id": c["school__school_id"],
            "school_name": c["school__school_name"],
            "custom_name": c["custom_name"],
            "custom_price": float(c["custom_price"]) if c["custom_price"] else None
        })
        if c["custom_name"]:
            item["custom_names"].add(c["custom_name"])
        if c["custom_price"]:
            item["custom_prices"].add(float(c["custom_price"]))

    result = []
    for code, data in grouped.items():
        result.append({
            "product_code": code,
            "total_schools": len(data["schools"]),
            "unique_custom_names": len(data["custom_names"]),
            "unique_custom_prices": len(data["custom_prices"]),
            "custom_names": list(data["custom_names"]),
            "custom_prices": sorted(data["custom_prices"]),
            "schools": data["schools"]
        })

    result.sort(key=lambda x: x["total_schools"], reverse=True)

    return StandardResponse.success_response(
        message=f"{len(result)} customized Thyrocare products",
        data={"total": len(result), "products": result}
    )

   
@router.get("/thyrocare/school/{school_id}/products")
async def get_school_thyrocare_products_with_tests(
    school_id: int,
    user = Depends(get_current_user)
):
    """
    GET /school/{school_id}/products
    → Returns all Thyrocare products assigned to the school
    → Includes full list of tests (live from Thyrocare via /thyrocare/products/all)
    → No DB changes, no caching, uses your existing code
    """
    # 1. Fetch school's selected products (from your table)
    school_products = await SchoolThyrocareProduct.filter(
        school_id=school_id,
        is_active=True
    ).all()

    if not school_products:
        return StandardResponse.success_response(
            message="No Thyrocare products assigned to this school",
            data={
                "school_id": school_id,
                "total_products": 0,
                "products": []
            }
        )

    # 2. Fetch ALL live Thyrocare products (your existing endpoint logic)
    resp = api_call("GET", "/partners/v1/catalog/products", params={"limit": 500})
    if resp.status_code != 200:
        raise HTTPException(502, "Thyrocare catalog temporarily unavailable")

    thyrocare_products = resp.json().get("skuList", [])
    # Build lookup: product_code → full product data
    product_map = {p["id"]: p for p in thyrocare_products}

    # 3. Build final response
    result = []

    for sp in school_products:
        vendor_product = product_map.get(sp.product)  # sp.product = "P175"

        # Default fallback if product no longer exists
        if not vendor_product:
            result.append({
                "internal_id": sp.id,
                "vendor_product_code": sp.product,
                "display_name": sp.custom_name or "Product Removed / Not Available",
                "price": float(sp.custom_price) if sp.custom_price else None,
                "mrp": None,
                "no_of_tests": 0,
                "tests": [],
                "warning": "This product is no longer in Thyrocare catalog"
            })
            continue

        # Extract tests
        tests_included = vendor_product.get("testsIncluded", [])
        tests_list = [
            {
                "name": test["name"],
                "group": test.get("groupName", "General")
            }
            for test in tests_included
        ]

        result.append({
            "internal_id": sp.id,
            "vendor_product_code": vendor_product["id"],
            "name": vendor_product["name"],
            "display_name": sp.custom_name or vendor_product["name"],  # school override
            "price": float(sp.custom_price) if sp.custom_price else float(vendor_product.get("payAmount") or vendor_product.get("sellingPrice") or 0),
            "mrp": float(vendor_product.get("mrp") or 0),
            "no_of_tests": vendor_product.get("noOfTestsIncluded", len(tests_list)),
            "is_fasting_required": bool(vendor_product.get("fastingRequired", False)),
            "sample_type": vendor_product.get("sampleType", "Blood"),
            "tests": tests_list  # ← Full test list included!
        })

    return StandardResponse.success_response(
        message="Thyrocare products with full test details",
        data={
            "school_id": school_id,
            "total_products": len(result),
            "products": result
        }
    )
    
# Reuse the existing /schools endpoint if available, or add if needed
@router.get("/thyrocare/schools", response_model=StandardResponse)
async def get_schools(user=Depends(get_current_user)):
    schools = await Schools.filter(is_deleted=False).values("school_id", "school_name")
    return StandardResponse.success_response(
        message="Schools fetched",
        data={"schools": list(schools)}
    )

## Transactions apis for thyrocare and healthias 

# class LabPaymentRequest(BaseModel):
#     amount: Decimal = Field(..., gt=0)
#     vendor: str = Field(..., pattern="^(healthians|thyrocare)$")
#     vendor_booking_id: str
#     student_id: int
#     description: str = "Lab Test Payment"
#     invoice_id: str
#     order_id: str = None
#     email: str = None
#     contact: str = None
#     currency: str = "INR"
#     status: str = Field("success", pattern="^(pending|success|failed)$")

# @router.post("/do-labtest-payment", response_model=StandardResponse)
# async def create_lab_payment(
#     payload: LabPaymentRequest,
#     user = Depends(get_current_user)
# ):
#     allowed_roles = ["PARENT", "PROGRAM_COORDINATOR", "SUPER_ADMIN", "HEALTH_BUDDY"]
#     if user["user_role"] not in allowed_roles:
#         raise HTTPException(status_code=403, detail="Not authorized")

#     # Prevent duplicates
#     if await LabTransactions.filter(invoice_no=payload.invoice_id).exists():
#         raise HTTPException(status_code=400, detail="Invoice already exists")
#     if await LabTransactions.filter(vendor_booking_id=payload.vendor_booking_id, vendor=payload.vendor).exists():
#         raise HTTPException(status_code=400, detail="Payment already recorded for this booking")

#     tx_no = f"LAB{datetime.now().strftime('%Y%m%d%H%M%S')}{payload.student_id}"

#     async with in_transaction():
#         tx = await LabTransactions.create(
#             lab_tx_no=tx_no,
#             invoice_no=payload.invoice_id,
#             vendor=payload.vendor,
#             vendor_booking_id=payload.vendor_booking_id,
#             amount=payload.amount,
#             currency=payload.currency,
#             payment_mode="online",
#             payment_status=payload.status,
#             description=payload.description,
#             order_id=payload.order_id or tx_no,
#             email=payload.email,
#             contact=payload.contact,
#             student_id=payload.student_id,
#             created_by=user["user_id"],
#             created_user_role=user["user_role"],
#         )

#     return StandardResponse.success_response(
#         message="Lab payment recorded",
#         data={
#             "lab_tx_id": tx.lab_tx_id,
#             "lab_tx_no": tx.lab_tx_no,
#             "invoice_no": tx.invoice_no,
#             "vendor": tx.vendor,
#             "vendor_booking_id": tx.vendor_booking_id,
#             "amount": float(tx.amount),
#             "status": tx.payment_status
#         }
#     )
  
class LabPaymentRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    vendor: str = Field(..., pattern="^(healthians|thyrocare)$")
    vendor_booking_id: str
    student_id: int
    description: str = "Lab Test Payment"
    invoice_id: Optional[str] = None  # Make optional by adding Optional and default None
    order_id: Optional[str] = None
    email: Optional[str] = None
    contact: Optional[str] = None
    currency: str = "INR"
    status: str = Field("success", pattern="^(pending|success|failed)$")
    
@router.post("/do-labtest-payment", response_model=StandardResponse)
async def create_lab_payment(
    payload: LabPaymentRequest,
    user = Depends(get_current_user)
):
    allowed_roles = ["PARENT", "PROGRAM_COORDINATOR", "SUPER_ADMIN", "HEALTH_BUDDY"]
    if user["user_role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check invoice_no duplicate only if provided
    if payload.invoice_id and await LabTransactions.filter(invoice_no=payload.invoice_id).exists():
        raise HTTPException(status_code=400, detail="Invoice already exists")
    
    # Check vendor booking duplicate only if provided
    if payload.vendor_booking_id and await LabTransactions.filter(
        vendor_booking_id=payload.vendor_booking_id, 
        vendor=payload.vendor
    ).exists():
        raise HTTPException(status_code=400, detail="Payment already recorded for this booking")

    tx_no = f"LAB{datetime.now().strftime('%Y%m%d%H%M%S')}{payload.student_id}"
    
    # Generate invoice_no if not provided
    invoice_no = payload.invoice_id or tx_no

    async with in_transaction():
        tx = await LabTransactions.create(
            lab_tx_no=tx_no,
            invoice_no=invoice_no,  # Use generated or provided value
            vendor=payload.vendor,
            vendor_booking_id=payload.vendor_booking_id,
            amount=payload.amount,
            currency=payload.currency,
            payment_mode="online",
            payment_status=payload.status,
            description=payload.description,
            order_id=payload.order_id or tx_no,
            email=payload.email,
            contact=payload.contact,
            student_id=payload.student_id,
            created_by=user["user_id"],
            created_user_role=user["user_role"],
        )

    return StandardResponse.success_response(
        message="Lab payment recorded",
        data={
            "lab_tx_id": tx.lab_tx_id,
            "lab_tx_no": tx.lab_tx_no,
            "invoice_no": tx.invoice_no,
            "vendor": tx.vendor,
            "vendor_booking_id": tx.vendor_booking_id,
            "amount": float(tx.amount),
            "status": tx.payment_status
        }
    )
  
# File: src/api/doctor/thyrocare.py

class LiveThyrocareProductsRequest(BaseModel):
    pincode: int = Field(..., ge=100000, le=999999)
    limit: int = Field(100, ge=10, le=500)



@router.get("/thyrocare/live-products", response_model=StandardResponse)
async def get_live_thyrocare_products(
    pincode: Optional[int] = None,           # ← Optional now
    limit: int = 200,                        # ← Default high
    user = Depends(get_current_user)
):
    """
    LIVE Thyrocare products + School Custom Name/Price
    → pincode is OPTIONAL → if not given → returns ALL products (no location filter)
    → If parent → shows school's custom name & price
    → 100% real-time, no DB sync needed
    """
    # 1. Find school (only for parents)
    school_id = None
    if user["user_role"] == "PARENT":
        child = await ParentChildren.filter(parent_id=user["user_id"]).first()
        if child:
            student = await Students.get_or_none(id=child.student_id)
            if student and student.school_id:
                school_id = student.school_id

    # 2. Build params for Thyrocare API
    params = {
        "limit": min(limit, 500),   # Max 500 allowed by Thyrocare
        "offset": 0
    }
    if pincode:
        params["pincode"] = str(pincode)

    # 3. Fetch LIVE from Thyrocare
    resp = api_call("GET", "/partners/v1/catalog/products", params=params)
    if resp.status_code != 200:
        raise HTTPException(502, "Thyrocare catalog unavailable")

    raw_products = resp.json().get("skuList", [])

    # 4. Load custom overrides (if school found)
    custom_map = {}
    if school_id:
        customs = await SchoolThyrocareProduct.filter(
            school_id=school_id,
            is_active=True
        ).values("product_code", "custom_name", "custom_price")

        for c in customs:
            custom_map[c["product_code"]] = {
                "custom_name": c["custom_name"],
                "custom_price": c["custom_price"]
            }

    # 5. Merge live + custom
    final_products = []
    customized_count = 0

    for item in raw_products:
        code = item.get("id")
        if not code:
            continue

        custom = custom_map.get(code, {})
        original_price = float(item.get("payAmount") or item.get("sellingPrice") or 0)
        display_price = float(custom.get("custom_price") or original_price) if custom.get("custom_price") is not None else original_price

        if custom:
            customized_count += 1

        final_products.append({
            "code": code,
            "name": custom.get("custom_name") or item.get("name", "Unknown"),
            "original_name": item.get("name"),
            "price": display_price,
            "original_price": original_price,
            "mrp": float(item.get("mrp") or 0),
            "parameters_count": item.get("noOfTestsIncluded", 0),
            "sample_type": item.get("sampleType"),
            "fasting_required": bool(item.get("fastingRequired", False)),
            "tat_hours": int(item.get("tat", 24)),
            "is_customized": bool(custom),
            "vendor": "Thyrocare"
        })

    return StandardResponse.success_response(
        message="Live Thyrocare products fetched",
        data={
            "pincode": pincode,
            "school_id": school_id,
            "total": len(final_products),
            "customized_count": customized_count,
            "products": final_products
        }
    )
        
# get report
from fastapi import Response, HTTPException
from fastapi.responses import StreamingResponse
import aiohttp
from datetime import datetime

# ==================== REQUEST ====================
class ThyrocareReportDownloadRequest(BaseModel):
    student_id: int = Field(..., description="Student ID")
    client_code: Optional[str] = None
    thyrocare_order_id: Optional[str] = None


# ==================== AUTO-DOWNLOAD REPORT ====================
# @router.post("/thyrocare/student-report-download")
# async def download_thyrocare_report(
#     payload: ThyrocareReportDownloadRequest,
#     user = Depends(get_current_user)
# ):
#     """
#     Auto-download latest Thyrocare PDF report using only student_id
#     → Streams directly to browser/mobile → instant download
#     → No file saved on server
#     """
#     # 1. Auth check
#     student = await Students.get_or_none(id=payload.student_id, is_deleted=False)
#     if not student:
#         raise HTTPException(404, "Student not found")

#     is_child = await ParentChildren.filter(parent_id=user["user_id"], student_id=payload.student_id).exists()
#     if not (is_child or user["user_role"] in ["SUPER_ADMIN","PARENT", "PROGRAM_COORDINATOR", "DOCTOR", "ADMIN", "MEDICAL_OFFICER","PSYCHOLOGIST","NUTRITIONIST"]):
#         raise HTTPException(403, "Unauthorized")

#     # 2. Find latest order
#     query = ThyrocareOrder.filter(student=student)
#     if payload.client_code:
#         query = query.filter(client_code=payload.client_code)
#     if payload.thyrocare_order_id:
#         query = query.filter(thyrocare_order_id=payload.thyrocare_order_id)

#     order: ThyrocareOrder = await query.order_by("-created_at").first()
#     if not order or not order.thyrocare_order_id:
#         raise HTTPException(404, "No Thyrocare order found")

#     # 3. Get patient lead ID (SPxxxx)
#     patient = await ThyrocarePatient.filter(order=order).first()
#     if not patient or not patient.patient_code:
#         raise HTTPException(404, "Report not ready yet (patient lead ID missing)")

#     order_id = order.thyrocare_order_id   # VLxxxx
#     lead_id = patient.patient_code        # SPxxxx

#     # 4. Get signed URL from Thyrocare
#     resp = api_call(
#         "GET",
#         f"/partners/v1/{order_id}/reports/{lead_id}",
#         params={"type": "pdf"}
#     )

#     if resp.status_code != 200:
#         raise HTTPException(404, "Report not generated yet or unavailable")

#     data = resp.json()
#     signed_url = data.get("reportUrl")
#     if not signed_url:
#         raise HTTPException(500, "Thyrocare returned no report URL")

#     # 5. Stream PDF directly to user (auto download)
#     async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
#         async with session.get(signed_url) as pdf_resp:
#             if pdf_resp.status != 200:
#                 raise HTTPException(502, "Failed to download report from Thyrocare storage")

#             # Generate clean filename
#             filename = f"Thyrocare_Report_{student.name.replace(' ', '_')}_{order_id}_{lead_id}.pdf"

#             return StreamingResponse(
#                 pdf_resp.content.iter_chunked(1024 * 1024),  # 1MB chunks
#                 media_type="application/pdf",
#                 headers={
#                     "Content-Disposition": f'attachment; filename="{filename}"',
#                     "Cache-Control": "no-cache",
#                     "X-Report-Source": "Thyrocare",
#                     "X-Order-ID": order_id,
#                     "X-Lead-ID": lead_id,
#                     "X-Generated-At": datetime.utcnow().isoformat() + "Z"
#                 }
#             )
            

class ThyrocareReportDownloadRequest(BaseModel):
    student_id: int
    thyrocare_order_id: Optional[str] = None  # ← For OLD reports
    client_code: Optional[str] = None         # Alternative filter
        
        
# @router.get("/thyrocare/student-orders", response_model=StandardResponse)
# async def list_thyrocare_orders(
#     student_id: int = Query(..., description="Student ID"),
#     page: int = Query(1, ge=1),
#     page_size: int = Query(50, ge=1, le=100),
#     user = Depends(get_current_user)
# ):
#     """
#     List Thyrocare orders with download fields + test types (PREFETCHED)
#     """
#     # 1. Auth + Student
#     student = await Students.get_or_none(id=student_id, is_deleted=False)
#     if not student:
#         raise HTTPException(404, "Student not found")
    
#     is_child = await ParentChildren.filter(
#         parent_id=user["user_id"], student_id=student_id
#     ).exists()
    
#     allowed_roles = [
#         "SUPER_ADMIN", "PARENT", "PROGRAM_COORDINATOR", "DOCTOR", 
#         "ADMIN", "MEDICAL_OFFICER", "PSYCHOLOGIST", "NUTRITIONIST"
#     ]
#     if not (is_child or user["user_role"] in allowed_roles):
#         raise HTTPException(403, "Unauthorized")
    
#     # 2. Query with FULL prefetch
#     query = ThyrocareOrder.filter(student=student)
#     total = await query.count()
#     orders = await query.prefetch_related(
#         "patients", 
#         "order_items"
#     ).order_by("-created_at").offset((page - 1) * page_size).limit(page_size)
    
#     # 3. Transform → USE PREFETCHED DATA (NO EXTRA QUERIES!)
#     order_list = []
#     for order in orders:
#         # ✅ PREFETCHED tests
#         tests = []
#         for item in order.order_items:
#             tests.append({
#                 "product_code": item.product_code,
#                 "product_name": item.product_name,
#                 "product_type": item.product_type,
#                 "mrp": float(item.mrp)
#             })
        
#         # ✅ PREFETCHED patients
#         patients = []
#         for patient in order.patients:
#             patients.append({
#                 "patient_code": patient.patient_code,
#                 "name": patient.name,
#                 "report_available": patient.report_available
#             })
        
#         order_list.append({
#             "order_id": order.order_id,
#             "thyrocare_order_id": order.thyrocare_order_id,  # ✅ DOWNLOAD KEY
#             "client_code": order.client_code,
#             "tests": tests,
#             "total_tests": len(tests),
#             "patients": patients,
#             "payment_status": order.payment_status,
#             "status": order.status,
#             "can_download": any(p.report_available for p in order.patients),
#             "created_at": order.created_at.isoformat()
#         })
    
#     return StandardResponse(
#         status=True,
#         message=f"Found {len(order_list)} Thyrocare orders",
#         data={
#             "student_id": student_id,
#             "total": total,
#             "page": page,
#             "page_size": page_size,
#             "orders": order_list
#         },
#         errors={}
#     )

@router.get("/thyrocare/student-orders", response_model=StandardResponse)
async def list_thyrocare_orders(
    student_id: int = Query(..., description="Student ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    user=Depends(get_current_user)
):
    """
    List Thyrocare orders with LIVE status from Thyrocare
    → No DB dependency → Always fresh patient_code
    → Accurate can_download status
    """
    
    # 1. AUTH CHECK
    student = await Students.get_or_none(id=student_id, is_deleted=False)
    if not student:
        raise HTTPException(404, "Student not found")
    
    is_child = await ParentChildren.filter(
        parent_id=user["user_id"], student_id=student_id
    ).exists()
    
    allowed_roles = ["SUPER_ADMIN", "PARENT", "PROGRAM_COORDINATOR", "DOCTOR", 
                    "ADMIN", "MEDICAL_OFFICER", "PSYCHOLOGIST", "NUTRITIONIST"]
    if not (is_child or user["user_role"] in allowed_roles):
        raise HTTPException(403, "Unauthorized")

    # 2. GET ORDERS FROM DB (for pagination)
    query = ThyrocareOrder.filter(student=student)
    total = await query.count()
    orders = await query.prefetch_related('order_items') \
                        .order_by('-created_at') \
                        .offset((page - 1) * page_size) \
                        .limit(page_size)

    # 3. FETCH LIVE STATUS FROM THYROCARE FOR EACH ORDER
    order_list = []
    for order in orders:
        try:
            # LIVE FETCH from Thyrocare
            resp = api_call(
                "GET",
                f"/partners/v1/orders/{order.thyrocare_order_id}",
                params={"include": "tracking,items,price,patients"}
            )
            
            live_data = {}
            patient_code = None
            status = "YET TO ASSIGN"
            
            if resp.status_code == 200:
                live_data = resp.json()
                patients_data = live_data.get("patients", [])
                patient_code = patients_data[0].get("patientCode") if patients_data else None
                status = live_data.get("status", "YET TO ASSIGN")
            
            # Build tests from DB
            tests = []
            for item in order.order_items:
                tests.append({
                    "product_code": item.product_code,
                    "product_name": item.product_name,
                    "product_type": item.product_type,
                    "mrp": float(item.mrp)
                })
            
            # Patient info from LIVE data
            patients = []
            if patient_code:
                patients.append({
                    "patient_code": patient_code,  # 🔥 LIVE!
                    "name": live_data.get("patients", [{}])[0].get("name", "Unknown"),
                    "report_available": True
                })
            else:
                patients.append({
                    "patient_code": None,
                    "name": "Unknown",
                    "report_available": False
                })
            
            order_list.append({
                "order_id": order.order_id,
                "thyrocare_order_id": order.thyrocare_order_id,
                "client_code": order.client_code,
                "tests": tests,
                "total_tests": len(tests),
                "patients": patients,
                "payment_status": order.payment_status,
                "status": status,  # 🔥 LIVE!
                "can_download": bool(patient_code),  # 🔥 LIVE!
                "created_at": order.created_at.isoformat()
            })
            
        except Exception as e:
            logger.warning(f"Failed to fetch live status for {order.thyrocare_order_id}: {str(e)}")
            # Fallback to DB data
            order_list.append({
                "order_id": order.order_id,
                "thyrocare_order_id": order.thyrocare_order_id,
                "client_code": order.client_code,
                "tests": [],
                "total_tests": 0,
                "patients": [{"patient_code": None, "name": "Unknown", "report_available": False}],
                "payment_status": order.payment_status,
                "status": order.status or "ERROR",
                "can_download": False,
                "created_at": order.created_at.isoformat()
            })

    return StandardResponse(
        status=True,
        message=f"Found {len(order_list)} Thyrocare orders (LIVE status)",
        data={
            "student_id": student_id,
            "total": total,
            "page": page,
            "page_size": page_size,
            "orders": order_list
        },
        errors={}
    )

@router.get("/thyrocare/student-orders", response_model=StandardResponse)
async def list_thyrocare_orders(
    student_id: int = Query(..., description="Student ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    user=Depends(get_current_user)
):
    """
    List Thyrocare orders → DB names + LIVE status
    """
    # 1. AUTH (unchanged)
    student = await Students.get_or_none(id=student_id, is_deleted=False)
    if not student:
        raise HTTPException(404, "Student not found")
    
    is_child = await ParentChildren.filter(parent_id=user["user_id"], student_id=student_id).exists()
    allowed_roles = ["SUPER_ADMIN", "PARENT", "PROGRAM_COORDINATOR", "DOCTOR", "ADMIN", "MEDICAL_OFFICER", "PSYCHOLOGIST", "NUTRITIONIST"]
    if not (is_child or user["user_role"] in allowed_roles):
        raise HTTPException(403, "Unauthorized")

    # 2. QUERY WITH FULL PREFETCH
    query = ThyrocareOrder.filter(student=student).prefetch_related('patients', 'order_items')
    total = await query.count()
    orders = await query.order_by('-created_at').offset((page - 1) * page_size).limit(page_size)

    order_list = []
    for order in orders:
        # DB patient name (always exists)
        patient = await ThyrocarePatient.filter(order=order).first()
        patient_name = patient.name if patient else "Unknown Patient"
        
        # LIVE status (non-blocking)
        patient_code = None
        live_status = order.status or "YET TO ASSIGN"
        
        try:
            resp = api_call(
                "GET",
                f"/partners/v1/orders/{order.thyrocare_order_id}",
                params={"include": "tracking,items,price,patients"}
            )
            
            if resp.status_code == 200:
                live_data = resp.json()
                patients_data = live_data.get("patients", [])
                patient_code = patients_data[0].get("patientCode") if patients_data else None
                live_status = live_data.get("status", live_status)
                
        except Exception as e:
            logger.warning(f"Live status failed {order.thyrocare_order_id}: {str(e)}")
            # Continue with DB fallback ✅ NO ERROR
        
        # Tests
        tests = []
        for item in order.order_items:
            tests.append({
                "product_code": item.product_code,
                "product_name": item.product_name,
                "product_type": item.product_type,
                "mrp": float(item.mrp)
            })
        
        order_list.append({
            "order_id": order.order_id,
            "thyrocare_order_id": order.thyrocare_order_id,
            "client_code": order.client_code,
            "tests": tests,
            "total_tests": len(tests),
            "patients": [{
                "patient_code": patient_code,
                "name": patient_name,  # ✅ DB name
                "report_available": bool(patient_code)
            }],
            "payment_status": order.payment_status,
            "status": live_status,
            "can_download": bool(patient_code),
            "created_at": order.created_at.isoformat()
        })

    return StandardResponse(
        status=True,
        message=f"Found {len(order_list)} Thyrocare orders",
        data={
            "student_id": student_id,
            "total": total,
            "page": page,
            "page_size": page_size,
            "orders": order_list
        },
        errors={}
    )

@router.post("/thyrocare/student-report-download")
async def download_thyrocare_report(
    payload: ThyrocareReportDownloadRequest,
    user=Depends(get_current_user)
):
    # 1. AUTH + ORDER (unchanged)
    student = await Students.get_or_none(id=payload.student_id, is_deleted=False)
    if not student:
        raise HTTPException(404, "Student not found")

    is_child = await ParentChildren.filter(parent_id=user["user_id"], student_id=payload.student_id).exists()
    allowed_roles = ["SUPER_ADMIN", "PARENT", "PROGRAM_COORDINATOR", "DOCTOR", "ADMIN", "MEDICAL_OFFICER", "PSYCHOLOGIST", "NUTRITIONIST"]
    if not (is_child or user["user_role"] in allowed_roles):
        raise HTTPException(403, "Unauthorized")

    query = ThyrocareOrder.filter(student=student)
    if payload.client_code:
        query = query.filter(client_code=payload.client_code)
    if payload.thyrocare_order_id:
        query = query.filter(thyrocare_order_id=payload.thyrocare_order_id)

    order = await query.order_by("-created_at").first()
    if not order or not order.thyrocare_order_id:
        raise HTTPException(404, "No Thyrocare order found")

    order_id = order.thyrocare_order_id  # VLD5FC8F

    # 🔥 2. TRY order status FIRST (simpler endpoint)
    lead_id = None
    try:
        # Try BASIC order status first (no include params)
        status_resp = api_call("GET", f"/partners/v1/orders/{order_id}")
        
        if status_resp.status_code == 200:
            status_data = status_resp.json()
            order_status = status_data.get("status", "YET TO ASSIGN")
            
            # Only fetch patients if order is progressed
            if order_status not in ["YET TO ASSIGN", "CANCELLED"]:
                patient_resp = api_call(
                    "GET",
                    f"/partners/v1/orders/{order_id}",
                    params={"include": "patients"}
                )
                if patient_resp.status_code == 200:
                    patients_data = patient_resp.json().get("patients", [])
                    lead_id = patients_data[0].get("patientCode") if patients_data else None
        
        # HTTP 400 = normal for early orders
        elif status_resp.status_code == 400:
            raise HTTPException(409, "Order still processing - phlebotomist not assigned yet")
            
    except HTTPException:
        raise

    # FALLBACK: Try direct report access (sometimes works early)
    if not lead_id:
        try:
            # Direct report attempt without patient_code lookup
            report_resp = api_call(
                "GET",
                f"/partners/v1/{order_id}/reports",
                params={"type": "pdf"}
            )
            if report_resp.status_code == 200:
                report_data = report_resp.json()
                lead_id = report_data.get("leadId")  # Some responses include it
        except:
            pass

    if not lead_id:
        raise HTTPException(404, "Report not ready yet - waiting for sample collection")

    # 3. DOWNLOAD REPORT with confirmed lead_id
    resp = api_call(
        "GET",
        f"/partners/v1/{order_id}/reports/{lead_id}",
        params={"type": "pdf"}
    )

    if resp.status_code != 200:
        raise HTTPException(404, f"Report not generated (HTTP {resp.status_code})")

    data = resp.json()
    signed_url = data.get("reportUrl")
    if not signed_url:
        raise HTTPException(500, "No report URL returned by Thyrocare")

    # 4. STREAM PDF
    filename = f"Thyrocare_Report_{student.name.replace(' ', '_')}_{order_id}_{lead_id}.pdf"

    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
        async with session.get(signed_url) as pdf_resp:
            if pdf_resp.status != 200:
                raise HTTPException(502, f"PDF download failed (HTTP {pdf_resp.status})")

            return StreamingResponse(
                pdf_resp.content.iter_chunked(1024 * 1024),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                    "Cache-Control": "no-cache",
                    "X-Report-Source": "Thyrocare",
                    "X-Order-ID": order_id,
                    "X-Lead-ID": lead_id,
                    "X-Status": "AVAILABLE"
                }
            )

