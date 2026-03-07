# src/api/doctor/thyrocare.py
import logging
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field, validator
from tortoise.transactions import in_transaction
from dateutil import parser

from src.core.manager import get_current_user
from src.models.student_models import Students, ParentChildren
from src.models.transaction_models import Transactions
from src.utils.response import StandardResponse
from src.models.thyrocare_models import (
    ThyrocareProduct, ThyrocareOrder, ThyrocareOrderItem, ThyrocarePatient,LabTransactions
)

from . import router

logger = logging.getLogger(__name__)

# ==================== CONFIG ====================
import os
environ = os.environ.get("APP_ENV", "")
    
print("environ is", environ)

if environ == "production":
    # prod
    BASE_URL = "https://api.thyrocare.com"
else:
    # staging
    BASE_URL = "https://api-sandbox.thyrocare.com"
PARTNER_ID = "8639685746"
USERNAME = "8639685746"
PASSWORD = "Sowaka@123"
ENTITY_TYPE = "DSA"

thyrocare_token: Optional[str] = None
token_expiry: Optional[datetime] = None

# In-memory cart
user_carts: Dict[int, List[Dict]] = {}


# ==================== SESSION ====================
def create_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update({"User-Agent": "MyHealthPassport/1.0"})
    return session

session = create_session()


# ==================== AUTH & HEADERS ====================
def get_headers(client_type: str = "web") -> Dict[str, str]:
    return {
        "Partner-Id": PARTNER_ID,
        "Request-Id": str(uuid.uuid4()),
        "API-Version": "v1",
        "Client-Type": client_type,
        "Content-Type": "application/json",
    }


def force_login() -> str:
    global thyrocare_token, token_expiry
    url = f"{BASE_URL}/partners/v1/auth/login"
    headers = get_headers()
    headers["Entity-Type"] = ENTITY_TYPE
    payload = {"username": USERNAME, "password": PASSWORD}

    logger.info(f"LOGIN → {url}")
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


def get_token() -> str:
    global thyrocare_token, token_expiry
    if thyrocare_token and token_expiry and datetime.utcnow() < token_expiry:
        return thyrocare_token
    return force_login()


# ==================== API CALL ====================
def api_call(method: str, endpoint: str, json=None, params=None, client_type: str = "web") -> requests.Response:
    token = get_token()
    headers = get_headers(client_type)
    headers["Authorization"] = f"Bearer {token}"
    url = f"{BASE_URL}{endpoint}"

    logger.info(f"{method} {url}")
    resp = session.request(method, url, json=json, params=params, headers=headers, timeout=30)
    logger.info(f"RESPONSE {resp.status_code}: {resp.text[:500]}")

    if resp.status_code == 401:
        global thyrocare_token
        thyrocare_token = None
        token = get_token()
        headers["Authorization"] = f"Bearer {token}"
        resp = session.request(method, url, json=json, params=params, headers=headers, timeout=30)

    return resp


# ==================== SCHEMAS ====================
class CheckServiceabilityRequest(BaseModel):
    pincode: int = Field(..., ge=100000, le=999999)


class FetchProductsRequest(BaseModel):
    pincode: int = Field(..., ge=100000, le=999999)
    product_type: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=50)


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
    
@router.post("/thyrocare/save-products", response_model=StandardResponse)
async def save_products(payload: FetchProductsRequest, user=Depends(get_current_user)):
    """
    Save Thyrocare products to DB.
    - Skips packages already in DB (by `code`)
    - Returns: added, skipped, errors
    - Uses live API (GET)
    """
    if user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
        raise HTTPException(403, "Unauthorized")

    try:
        params = {
            "pincode": str(payload.pincode),
            "limit": payload.limit,
            "offset": 0
        }
        if payload.product_type:
            params["productType"] = payload.product_type.upper()

        resp = api_call("GET", "/partners/v1/catalog/products", params=params)
        if resp.status_code != 200:
            raise HTTPException(502, f"Catalog error: {resp.status_code}")

        products = resp.json().get("skuList", [])
        if not products:
            raise HTTPException(502, "No products returned")

        added = []
        skipped = []
        errors = []

        async with in_transaction():
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

                    # Safe Decimal conversion
                    def safe_decimal(v):
                        if v is None: return Decimal("0")
                        try: return Decimal(str(v))
                        except: return Decimal("0")

                    await ThyrocareProduct.create(
                        code=code,
                        name=pkg.get("name", "Unknown"),
                        product_type=pkg.get("type", "SSKU").upper(),
                        description=pkg.get("description", ""),
                        mrp=safe_decimal(pkg.get("mrp")),
                        rate=safe_decimal(pkg.get("rate")),
                        pay_amt=safe_decimal(pkg.get("payAmount") or pkg.get("sellingPrice")),
                        parameters_count=pkg.get("noOfTestsIncluded", 0),
                        sample_type=pkg.get("sampleType", "Blood"),
                        fasting_required=bool(pkg.get("fastingRequired")),
                        tat_hours=pkg.get("tat", 24),
                        is_active=True
                    )
                    added.append({"code": code, "name": pkg.get("name")})

                except Exception as e:
                    errors.append(f"{code}: {str(e)}")

        return StandardResponse.success_response(
            message=f"Processed {len(products)} products",
            data={
                "added_count": len(added),
                "added": added,
                "skipped_count": len(skipped),
                "skipped": skipped,
                "error_count": len(errors),
                "errors": errors
            }
        )
    except Exception as e:
        logger.exception("Save products failed")
        raise HTTPException(500, detail=str(e))

@router.post("/thyrocare/fetch-products", response_model=StandardResponse)
async def fetch_products(payload: FetchProductsRequest, user=Depends(get_current_user)):
    """
    Fetch live products from Thyrocare.
    Returns **all original fields** from the API.
    """
    try:
        params = {
            "pincode": str(payload.pincode),
            "limit": payload.limit,
            "offset": 0
        }
        if payload.product_type:
            params["productType"] = payload.product_type.upper()

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
                "products": products  # ← Full original data (all fields)
            }
        )
    except Exception as e:
        logger.exception("Fetch failed")
        raise HTTPException(502, detail=str(e))
   
@router.get("/thyrocare/products/all")
async def get_all_thyrocare_products(user = Depends(get_current_user)):
    """
    Get ALL available Thyrocare products (no filters)
    → Zero params needed
    """
    resp = api_call("GET", "/partners/v1/catalog/products", params={"limit": 500})
    if resp.status_code != 200:
        raise HTTPException(502, "Failed to fetch products")

    products = resp.json().get("skuList", [])

    return StandardResponse.success_response(
        message=f"All {len(products)} Thyrocare products",
        data={"total": len(products), "products": products}
    )
     

# @router.post("/thyrocare/add-to-cart", response_model=StandardResponse)
# async def add_to_cart(payload: AddToCartRequest, user=Depends(get_current_user)):
#     try:
#         resp = api_call("GET", "/partners/v1/catalog/products", params={"pincode": "400001", "limit": 100})
#         if resp.status_code != 200:
#             raise HTTPException(502, "Failed to fetch products")
#         pkg = next((p for p in resp.json().get("skuList", []) if p["id"] == payload.product_code), None)
#         if not pkg:
#             raise HTTPException(404, "Product not found")

#         user_id = user["user_id"]
#         user_carts.setdefault(user_id, [])
#         if any(p["id"] == payload.product_code for p in user_carts[user_id]):
#             return StandardResponse.success_response(message="Already in cart")
#         user_carts[user_id].append(pkg)
#         return StandardResponse.success_response(message="Added", data={"count": len(user_carts[user_id])})
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(502, detail=str(e))


# @router.get("/thyrocare/view-cart", response_model=StandardResponse)
# async def view_cart(user=Depends(get_current_user)):
#     cart = user_carts.get(user["user_id"], [])
#     total_mrp = sum(Decimal(str(p.get("mrp", 0))) for p in cart)
#     total_pay = sum(Decimal(str(p.get("payAmount") or p.get("sellingPrice", 0))) for p in cart)
#     items = [{"code": p["id"], "name": p["name"], "mrp": float(p.get("mrp", 0)), "pay_amt": float(p.get("payAmount") or p.get("sellingPrice", 0))} for p in cart]
#     return StandardResponse.success_response(
#         message=f"{len(cart)} items",
#         data={"items": items, "total_mrp": float(total_mrp), "total_payable": float(total_pay), "discount": float(total_mrp - total_pay)}
#     )

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


@router.post("/thyrocare/create-order-from-cart/{student_id}", response_model=StandardResponse)
async def create_order_from_cart(
    student_id: int,
    payload: CreateOrderFromCartRequest,
    user=Depends(get_current_user),
    client_type: str = Header("web", alias="Client-Type")
):
    """
    Create Thyrocare order – 100% compliant with API spec.
    Fixes:
      • tx_datetime not null
      • addressLine2 from payload.address2 (optional)
      • collectionType inside attributes
    """
    # ────── 1. Student & permission ──────
    student = await Students.get_or_none(id=student_id, is_deleted=False)
    if not student:
        raise HTTPException(404, "Student not found")

    is_parent = await ParentChildren.filter(parent_id=user["user_id"], student_id=student_id).exists()
    if not is_parent and user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
        raise HTTPException(403, "Unauthorized")

    # ────── 2. Appointment date ──────
    dt = parser.isoparse(payload.appointment_date)
    appointment_date = dt.strftime("%Y-%m-%d")
    appointment_time = dt.strftime("%H:%M")

    # ────── 3. Client code ──────
    client_code = payload.ref_order_no or f"TC{student_id}{int(datetime.now().timestamp()) % 100000}"

    # ────── 4. Resolve products & totals ──────
    total_mrp = Decimal("0")
    total_pay = Decimal("0")
    order_items = []

    for item in payload.patient.items:
        product = await ThyrocareProduct.get_or_none(code=item.id)
        if not product:
            raise HTTPException(404, f"Product {item.id} not in DB – run /save-products first")
        total_mrp += product.mrp
        total_pay += product.pay_amt
        order_items.append({
            "product": product,
            "product_code": item.id,
            "product_name": item.name,
            "product_type": item.type,
            "mrp": product.mrp,
            "rate": product.mrp,
            "pay_amt": product.pay_amt,
        })

    # ────── 5. Build Thyrocare payload (exact spec) ──────
    order_payload = {
        "address": {
            "houseNo": payload.house_no,
            "street": payload.street,
            "addressLine1": payload.address,
            "addressLine2": getattr(payload, "address2", "") or "",   # ← Use payload.address2 or empty
            "landmark": payload.landmark or "",
            "city": payload.city.upper(),
            "state": payload.state.upper(),
            "country": "India",
            "pincode": payload.pincode
        },
        "email": payload.email or "",
        "contactNumber": payload.contact_number,
        "appointment": {
            "date": appointment_date,
            "startTime": appointment_time,
            "timeZone": "IST"
        },
        "origin": {
            "platform": client_type.upper(),
            "appId": "MHP001",
            "portalType": "B2C",
            "enteredBy": str(user["user_id"]),
            "source": "My Health Passport"
        },
        "referredBy": {
            "doctorId": payload.referred_by.doctor_id or "",
            "doctorName": payload.referred_by.doctor_name or ""
        },
        "paymentDetails": {
            "payType": payload.payment_type
        },
        "attributes": {
            "remarks": payload.remarks or "",
            "phleboNotes": "",
            "campId": None,
            "isReportHardCopyRequired": payload.is_report_hard_copy_required,
            "refOrderNo": client_code,
            "collectionType": payload.collection_type,
            "alertMessage": payload.alert_message or []
        },
        "config": {
            "communication": {
                "shareReport": payload.config.communication.share_report,
                "shareReceipt": payload.config.communication.share_receipt,
                "shareModes": payload.config.communication.share_modes
            }
        },
        "patients": [
            {
                "name": payload.patient.name,
                "gender": payload.patient.gender,
                "age": payload.patient.age,
                "ageType": payload.patient.age_type,
                "contactNumber": payload.patient.contact_number,
                "email": payload.patient.email or "",
                "attributes": {
                    "ulcUniqueCode": "",
                    "patientAddress": f"{payload.address}, {payload.city}, {payload.state} - {payload.pincode}",
                    "externalPatientId": ""
                },
                "items": [
                    {
                        "id": itm.id,
                        "type": itm.type,
                        "name": itm.name,
                        "origin": {
                            "enteredBy": itm.origin.entered_by if itm.origin else str(user["user_id"]),
                            "platform": itm.origin.platform if itm.origin else client_type
                        }
                    }
                    for itm in payload.patient.items
                ],
                "documents": []
            }
        ],
        "price": {
            "discounts": [],
            "incentivePasson": None
        },
        "orderOptions": {
            "isPdpcOrder": payload.is_pdpc_order
        }
    }

    # ────── 6. Call Thyrocare ──────
    try:
        resp = api_call("POST", "/partners/v1/orders", json=order_payload, client_type=client_type)
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail=f"Thyrocare error: {resp.text}")
        data = resp.json()
        thyrocare_order_id = data.get("orderId")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Order creation failed")
        raise HTTPException(502, detail=str(e))

    # ────── 7. Save locally (FIXED: tx_datetime) ──────
    now = datetime.utcnow()
    async with in_transaction():
        tx = await Transactions.create(
            tx_no=f"TYTX{client_code[-10:]}",
            invoice_no=client_code,
            tx_amnt=total_pay,
            payment_status="pending",
            tx_mode="online",
            tx_datetime=now,  # ← FIXED: was missing
            created_by=user["user_id"],
            created_user_role=user["user_role"]
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
            created_user_role=user["user_role"]
        )

        await ThyrocarePatient.create(
            order=order,
            name=payload.patient.name,
            age=payload.patient.age,
            age_type=payload.patient.age_type,
            gender=payload.patient.gender,
            contact_number=payload.patient.contact_number,
            email=payload.patient.email
        )

        for item in order_items:
            await ThyrocareOrderItem.create(
                order=order,
                product=item["product"],
                product_code=item["product_code"],
                product_name=item["product_name"],
                product_type=item["product_type"],
                mrp=item["mrp"],
                rate=item["rate"],
                pay_amt=item["pay_amt"]
            )

    return StandardResponse.success_response(
        message="Order created successfully",
        data={"order_id": thyrocare_order_id, "client_code": client_code}
    )


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
    """Fresh assign products to schools"""
    if user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
        raise HTTPException(403, "Unauthorized")

    async with in_transaction():
        schools = await Schools.filter(school_id__in=payload.school_ids, is_deleted=False)
        if len(schools) != len(payload.school_ids):
            raise HTTPException(404, "Some schools not found")

        await SchoolThyrocareProduct.filter(school_id__in=payload.school_ids).delete()

        records = [
            SchoolThyrocareProduct(
                school=school,
                product=item.product,           # ← string code
                custom_name=item.custom_name,
                custom_price=item.custom_price,
                is_active=True,
                created_by=user["user_id"]
            )
            for school in schools
            for item in payload.products
        ]
        if records:
            await SchoolThyrocareProduct.bulk_create(records)

    return StandardResponse.success_response(
        message="Thyrocare products assigned",
        data={"schools": len(schools), "products": len(payload.products)}
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


# 2. Get custom products for ONE school
# @router.get("/thyrocare/school/{school_id}/products", response_model=StandardResponse)
# async def get_school_thyrocare_products(
#     school_id: int,
#     user = Depends(get_current_user)
# ):
#     """Get all Thyrocare customizations for a specific school"""
#     if user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR", "DOCTOR"]:
#         # Optional: allow parents/doctors to see their own school
#         raise HTTPException(403, "Unauthorized")

#     school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
#     if not school:
#         raise HTTPException(404, "School not found")

#     customs = await SchoolThyrocareProduct.filter(
#         school_id=school_id, is_active=True
#     ).values("product", "custom_name", "custom_price")

#     products = []
#     for c in customs:
#         products.append({
#             "product_code": c["product"],
#             "custom_name": c["custom_name"],
#             "custom_price": float(c["custom_price"]) if c["custom_price"] else None,
#             "has_custom_name": bool(c["custom_name"]),
#             "has_custom_price": c["custom_price"] is not None
#         })

#     return StandardResponse.success_response(
#         message=f"Thyrocare products for school {school_id}",
#         data={
#             "school_id": school_id,
#             "school_name": school.school_name,
#             "total_custom": len(products),
#             "products": products
#         }
#     )
    
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

class LabPaymentRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    vendor: str = Field(..., pattern="^(healthians|thyrocare)$")
    vendor_booking_id: str
    student_id: int
    description: str = "Lab Test Payment"
    invoice_id: str
    order_id: str = None
    email: str = None
    contact: str = None
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

    # Prevent duplicates
    if await LabTransactions.filter(invoice_no=payload.invoice_id).exists():
        raise HTTPException(status_code=400, detail="Invoice already exists")
    if await LabTransactions.filter(vendor_booking_id=payload.vendor_booking_id, vendor=payload.vendor).exists():
        raise HTTPException(status_code=400, detail="Payment already recorded for this booking")

    tx_no = f"LAB{datetime.now().strftime('%Y%m%d%H%M%S')}{payload.student_id}"

    async with in_transaction():
        tx = await LabTransactions.create(
            lab_tx_no=tx_no,
            invoice_no=payload.invoice_id,
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


# @router.get("/thyrocare/live-products", response_model=StandardResponse)
# async def get_live_thyrocare_products(
#     payload: LiveThyrocareProductsRequest = Depends(),
#     user = Depends(get_current_user)
# ):
#     """
#     Fetch Thyrocare products LIVE from vendor
#     → Applies school-specific custom name/price if exists
#     → Always fresh prices & availability
#     """
#     # 1. Get school context (if user is parent → find their child's school)
#     school = None
#     if user["user_role"] == "PARENT":
#         child = await ParentChildren.filter(parent_id=user["user_id"]).first()
#         if child:
#             student = await Students.get_or_none(id=child.student_id)
#             if student:
#                 school = await Schools.get_or_none(school_id=student.school_id)

#     school_id = school.school_id if school else None

#     # 2. Fetch LIVE from Thyrocare
#     resp = api_call(
#         "GET",
#         "/partners/v1/catalog/products",
#         params={"pincode": str(payload.pincode), "limit": payload.limit, "offset": 0}
#     )
#     if resp.status_code != 200:
#         raise HTTPException(502, "Thyrocare catalog temporarily unavailable")

#     raw_products = resp.json().get("skuList", [])

#     # 3. Fetch custom overrides for this school (if any)
#     custom_map = {}
#     if school_id:
#         customs = await SchoolThyrocareProduct.filter(
#             school_id=school_id,
#             is_active=True
#         ).prefetch_related("product")
        
#         for c in customs:
#             custom_map[c.product.code] = {
#                 "custom_name": c.custom_name,
#                 "custom_price": c.custom_price
#             }

#     # 4. Merge live data + custom overrides
#     final_products = []
#     for item in raw_products:
#         code = item.get("id")
#         if not code:
#             continue

#         custom = custom_map.get(code, {})

#         final_products.append({
#             "product_id": item.get("id"),
#             "code": code,
#             "name": custom.get("custom_name") or item.get("name"),
#             "original_name": item.get("name"),
#             "price": float(custom.get("custom_price") or item.get("payAmount") or item.get("sellingPrice") or 0),
#             "original_price": float(item.get("payAmount") or item.get("sellingPrice") or 0),
#             "mrp": float(item.get("mrp") or 0),
#             "parameters_count": item.get("noOfTestsIncluded", 0),
#             "sample_type": item.get("sampleType"),
#             "fasting_required": item.get("fastingRequired", False),
#             "tat_hours": item.get("tat", 24),
#             "is_customized": bool(custom),
#             "vendor": "Thyrocare"
#         })

#     return StandardResponse.success_response(
#         message="Live Thyrocare products with custom overrides",
#         data={
#             "pincode": payload.pincode,
#             "total": len(final_products),
#             "school_id": school_id,
#             "customized_count": len(custom_map),
#             "products": final_products
#         }
#     )

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
@router.post("/thyrocare/student-report-download")
async def download_thyrocare_report(
    payload: ThyrocareReportDownloadRequest,
    user = Depends(get_current_user)
):
    """
    Auto-download latest Thyrocare PDF report using only student_id
    → Streams directly to browser/mobile → instant download
    → No file saved on server
    """
    # 1. Auth check
    student = await Students.get_or_none(id=payload.student_id, is_deleted=False)
    if not student:
        raise HTTPException(404, "Student not found")

    is_child = await ParentChildren.filter(parent_id=user["user_id"], student_id=payload.student_id).exists()
    if not (is_child or user["user_role"] in ["SUPER_ADMIN", "PROGRAM_COORDINATOR", "DOCTOR", "ADMIN"]):
        raise HTTPException(403, "Unauthorized")

    # 2. Find latest order
    query = ThyrocareOrder.filter(student=student)
    if payload.client_code:
        query = query.filter(client_code=payload.client_code)
    if payload.thyrocare_order_id:
        query = query.filter(thyrocare_order_id=payload.thyrocare_order_id)

    order: ThyrocareOrder = await query.order_by("-created_at").first()
    if not order or not order.thyrocare_order_id:
        raise HTTPException(404, "No Thyrocare order found")

    # 3. Get patient lead ID (SPxxxx)
    patient = await ThyrocarePatient.filter(order=order).first()
    if not patient or not patient.patient_code:
        raise HTTPException(404, "Report not ready yet (patient lead ID missing)")

    order_id = order.thyrocare_order_id   # VLxxxx
    lead_id = patient.patient_code        # SPxxxx

    # 4. Get signed URL from Thyrocare
    resp = api_call(
        "GET",
        f"/partners/v1/{order_id}/reports/{lead_id}",
        params={"type": "pdf"}
    )

    if resp.status_code != 200:
        raise HTTPException(404, "Report not generated yet or unavailable")

    data = resp.json()
    signed_url = data.get("reportUrl")
    if not signed_url:
        raise HTTPException(500, "Thyrocare returned no report URL")

    # 5. Stream PDF directly to user (auto download)
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
        async with session.get(signed_url) as pdf_resp:
            if pdf_resp.status != 200:
                raise HTTPException(502, "Failed to download report from Thyrocare storage")

            # Generate clean filename
            filename = f"Thyrocare_Report_{student.name.replace(' ', '_')}_{order_id}_{lead_id}.pdf"

            return StreamingResponse(
                pdf_resp.content.iter_chunked(1024 * 1024),  # 1MB chunks
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                    "Cache-Control": "no-cache",
                    "X-Report-Source": "Thyrocare",
                    "X-Order-ID": order_id,
                    "X-Lead-ID": lead_id,
                    "X-Generated-At": datetime.utcnow().isoformat() + "Z"
                }
            )
            