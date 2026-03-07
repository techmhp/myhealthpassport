# src/api/doctor/healthians_lab_booking.py
import hashlib
import hmac
import json
import logging
import uuid
from datetime import datetime, date, time
from decimal import Decimal
from typing import List, Optional, Dict, Any

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, validator
from requests.auth import HTTPBasicAuth
from tortoise.transactions import in_transaction
from tortoise.exceptions import DoesNotExist, ConfigurationError

from src.core.manager import get_current_user
from src.models.student_models import Students, ParentChildren
from src.models.transaction_models import Transactions
from src.utils.response import StandardResponse
from src.models.helthians_booking import (
    HealthiansTest,
    HealthiansPackage,
    HealthiansBooking,
    HealthiansBookingTest,
)

from . import router

# ==================== CONFIG ====================
import os
environ = os.environ.get("APP_ENV", "")
    
print("environ is", environ)

if environ == "production":
    BASE_URL = "https://hbridge.healthians.com/api"
    PARTNER_NAME = "sowaka"
    API_KEY = "qUv1br4jeD4KmBHZJu59q5ipxnBABeqFBLWXLZGZCep0CAHwkZXeQVoJeW9HWJIh"
    SECRET_KEY = "BItTheZfTd2sRfgCiTNaDDRyn444lM38"
    CHECKSUM_KEY = "6BOxW2eN9c0ijvnnL5PJLXrJ"
else:
    BASE_URL = "https://t25crm.healthians.co.in/api"
    PARTNER_NAME = "sowaka"
    API_KEY = "IDuPMfnMfuJJi5FQHJoycFr13hG6jgC62nuUCWVGLoOhaExGNvBlJLrZSEZmvsQ3"
    SECRET_KEY = "yro3JCsfay8V0lhlcbMQKOisYkiVHy8z"
    CHECKSUM_KEY = "8PGrhmbmuJjfP9UisUScNpMp"

# Global session
healthians_session = requests.Session()
healthians_session.headers.update({
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
})

logger = logging.getLogger(__name__)

# ==================== TOKEN HANDLING ====================
def _refresh_token() -> str:
    """Fetch fresh access token from Healthians API."""
    url = f"{BASE_URL}/{PARTNER_NAME}/getAccessToken"
    try:
        resp = healthians_session.get(url, auth=HTTPBasicAuth(API_KEY, SECRET_KEY), timeout=30)
        logger.info(f"Token request → {resp.status_code}")
        resp.raise_for_status()
        data = resp.json()
        
        if not data.get("success"):
            raise ValueError(f"Token request failed: {data}")
        
        access_token = data.get("access_token")
        if not access_token:
            raise ValueError(f"Missing access_token: {data}")
        
        return access_token
    except Exception as e:
        logger.error(f"Token fetch failed: {str(e)}")
        raise

def get_auth_headers() -> Dict[str, str]:
    """Get or refresh bearer token."""
    if not getattr(healthians_session, "access_token", None):
        healthians_session.access_token = _refresh_token()
    return {"Authorization": f"Bearer {healthians_session.access_token}"}

def _request_with_token_refresh(method: str, url: str, **kwargs) -> requests.Response:
    """Make HTTP request with automatic token refresh on 401."""
    headers = kwargs.pop("headers", {})
    auth_headers = get_auth_headers()
    headers.update(auth_headers)
    kwargs["headers"] = headers
    
    resp = healthians_session.request(method, url, **kwargs)
    
    # Retry once on 401
    if resp.status_code == 401:
        logger.warning("Token expired – refreshing")
        healthians_session.access_token = _refresh_token()
        headers["Authorization"] = f"Bearer {healthians_session.access_token}"
        resp = healthians_session.request(method, url, **kwargs)
    
    if resp.status_code >= 400:
        logger.error(f"Healthians API Error: {method} {url} → {resp.status_code}")
        logger.error(f"Response: {resp.text[:1000]}")
    
    return resp

# ==================== CHECKSUM HELPERS ====================
def generate_checksum_for_booking(payload: dict) -> str:
    """
    Generate HMAC-SHA256 checksum for Healthians API.
    Must use exact JSON formatting: no spaces, preserve order.
    """
    def default(obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
    
    # Critical: separators=(',',':') with NO spaces
    json_str = json.dumps(payload, separators=(',', ':'), ensure_ascii=False, default=default)
    checksum = hmac.new(CHECKSUM_KEY.encode('utf-8'), json_str.encode('utf-8'), hashlib.sha256).hexdigest()
    
    logger.debug(f"Checksum JSON: {json_str}")
    logger.debug(f"Generated checksum: {checksum}")
    
    return checksum

# ==================== REQUEST SCHEMAS ====================
class LocationCheckRequest(BaseModel):
    lat: str = Field(..., description="Latitude")
    long: str = Field(..., description="Longitude")
    zipcode: str = Field(..., description="6-digit PIN code")

class SlotRequest(BaseModel):
    slot_date: str
    zone_id: str
    lat: str
    long: str
    zipcode: Optional[str] = None
    get_ppmc_slots: int = 0
    has_female_patient: int = 0

class FreezeSlotRequest(BaseModel):
    slot_id: str
    vendor_billing_user_id: str

class PackageItem(BaseModel):
    deal_id: List[str] = Field(..., min_items=1)

class CustomerItem(BaseModel):
    customer_name: str
    relation: str = Field(..., description="self, father, mother, etc.")
    age: int
    dob: str
    gender: str = Field(..., pattern="^(M|F)$")
    contact_number: str
    email: Optional[str] = ""
    
    @validator("dob")
    def check_dob(cls, v):
        try:
            datetime.strptime(v, "%d/%m/%Y")
        except ValueError:
            raise ValueError("DOB must be DD/MM/YYYY")
        return v
    
    @validator("contact_number")
    def check_phone(cls, v):
        if not v.isdigit() or len(v) != 10:
            raise ValueError("Phone must be 10 digits")
        return v

class CreateBookingRequest(BaseModel):
    customer: List[CustomerItem] = Field(..., max_items=1)
    package: List[PackageItem]
    slot: Dict[str, str] = Field(..., description="Must contain 'slot_id'")
    zone_id: int
    latitude: str
    longitude: str
    address: str
    zipcode: str
    landmark: Optional[str] = ""
    customer_calling_number: str
    billing_cust_name: str
    gender: str
    mobile: str
    email: str
    state: int
    cityId: int
    sub_locality: str
    hard_copy: int = 0
    payment_option: str = "prepaid"
    discounted_price: Decimal
    
    @validator("slot")
    def check_slot_id(cls, v):
        if "slot_id" not in v:
            raise ValueError("slot must contain 'slot_id'")
        return v

class FetchProductsRequest(BaseModel):
    zipcode: str = Field(..., min_length=6, max_length=6)
    product_type: str = Field(default="profile", description="profile, package, or parameter")
    product_type_id: Optional[str] = ""
    start: int = Field(default=0, ge=0)
    limit: int = Field(default=40, ge=1, le=100)
    test_type: str = Field(default="pathology")
    client_id: Optional[str] = ""
    
# ==================== ENDPOINTS ====================
@router.post("/check-serviceability", response_model=StandardResponse)
async def check_serviceability(payload: LocationCheckRequest, user=Depends(get_current_user)):
    """Check if Healthians services are available at given location."""
    url = f"{BASE_URL}/{PARTNER_NAME}/checkServiceabilityByLocation_v2"
    try:
        resp = _request_with_token_refresh("POST", url, json=payload.dict(), timeout=30)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Healthians error: {resp.text[:200]}")
        
        data = resp.json()
        if data.get("status") and (zone_id := data.get("data", {}).get("zone_id")):
            return StandardResponse.success_response(
                message="Serviceable",
                data={"zone_id": zone_id, "city": data.get("data", {}).get("city")}
            )
        else:
            raise HTTPException(status_code=400, detail=data.get("message", "Not serviceable"))
    except Exception as e:
        logger.exception("check_serviceability failed")
        raise HTTPException(status_code=502, detail=f"Healthians error: {str(e)}")

@router.post("/get-slots", response_model=StandardResponse)
async def get_slots(payload: SlotRequest, user=Depends(get_current_user)):
    """Fetch available time slots for sample collection."""
    url = f"{BASE_URL}/{PARTNER_NAME}/getSlotsByLocation"
    try:
        resp = _request_with_token_refresh("POST", url, json=payload.dict(), timeout=30)
        resp.raise_for_status()
        result = resp.json()
        
        if not result.get("status"):
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        slots = [
            {
                "stm_id": s["stm_id"],
                "slot_time": s["slot_time"],
                "end_time": s["end_time"],
                "slot_date": s["slot_date"],
                "is_peak_hours": s["is_peak_hours"] == "1",
                "city": s["city"],
            }
            for s in result.get("data", [])
        ]
        return StandardResponse.success_response(message="Slots fetched", data={"slots": slots})
    except Exception as e:
        logger.exception("get_slots failed")
        raise HTTPException(status_code=502, detail=str(e))

@router.post("/freeze-slot", response_model=StandardResponse)
async def freeze_slot(payload: FreezeSlotRequest, user=Depends(get_current_user)):
    """Temporarily reserve a time slot."""
    url = f"{BASE_URL}/{PARTNER_NAME}/freezeSlot_v1"
    try:
        resp = _request_with_token_refresh("POST", url, json=payload.dict(), timeout=30)
        resp.raise_for_status()
        data = resp.json()
        
        if data.get("status"):
            return StandardResponse.success_response(
                message="Slot frozen",
                data={
                    "slot_id": data["data"]["slot_id"],
                    "freeze_time": data["data"]["freeze_time"]
                },
            )
        raise HTTPException(status_code=400, detail=data.get("message", "Freeze failed"))
    except Exception as e:
        logger.exception("freeze_slot failed")
        raise HTTPException(status_code=502, detail=str(e))

    
# API 1: fetch from Healthians (does NOT save to DB)
@router.post("/fetch-healthians-products", response_model=StandardResponse)
async def fetch_healthians_products(
    payload: FetchProductsRequest,
    user=Depends(get_current_user)
):
    url = f"{BASE_URL}/{PARTNER_NAME}/getPartnerProducts"
    try:
        resp = _request_with_token_refresh("POST", url, json=payload.dict(), timeout=30)
        resp.raise_for_status()
        result = resp.json()
        if not result.get("status"):
            raise HTTPException(status_code=400, detail=result.get("message", "Failed to fetch products from Healthians"))
        products = result.get("data", [])
        return StandardResponse.success_response(
            message=f"Fetched {len(products)} products from Healthians",
            data={"products": products}
        )
    except Exception as e:
        logger.exception("Error fetching Healthians products")
        raise HTTPException(status_code=502, detail=f"Healthians API error: {str(e)}")


# API 2: fetch and save to DB (skip duplicates)
@router.post("/fetch-and-save-healthians-packages", response_model=StandardResponse)
async def fetch_and_save_healthians_packages(
    payload: FetchProductsRequest,
    user=Depends(get_current_user)
):
    """
    Fetches packages from Healthians API using correct keys,
    saves new packages to DB, skips existing, returns summary.
    """
    url = f"{BASE_URL}/{PARTNER_NAME}/getPartnerProducts"
    try:
        resp = _request_with_token_refresh("POST", url, json=payload.dict(), timeout=30)
        resp.raise_for_status()
        result = resp.json()
        
        if not result.get("status"):
            raise HTTPException(
                status_code=400, 
                detail=result.get("message", "Failed to fetch products from Healthians")
            )
        
        products_data = result.get("data", [])
        saved_packages = []
        skipped_packages = []
        errors = []

        for product in products_data:
            try:
                code = product.get("deal_id")
                name = product.get("test_name")  # Use test_name as product name
                product_type = product.get("product_type", "").lower()
                
                if not code or not name:
                    errors.append(f"Missing code or name: {product}")
                    continue
                
                # Save only packages or profiles
                if product_type not in ["profile", "package"]:
                    skipped_packages.append({"code": code, "name": name, "reason": "Not a package/profile"})
                    continue
                
                exists = await HealthiansPackage.get_or_none(code=code)
                if exists:
                    skipped_packages.append({"code": code, "name": name, "reason": "Already exists"})
                    continue

                mrp = Decimal(product.get("mrp", "0"))
                b2b_price = Decimal(product.get("price", "0")) or mrp  # Use price key for B2B'ish price
                
                test_codes = product.get("test_codes", []) or []
                
                await HealthiansPackage.create(
                    code=code,
                    name=name,
                    mrp=mrp,
                    discounted_price=b2b_price,
                    test_codes=test_codes,
                    is_active=True
                )
                saved_packages.append({"code": code, "name": name})
            except Exception as e:
                error_msg = f"Error saving {product.get('deal_id', 'UNKNOWN')}: {str(e)}"
                errors.append(error_msg)
                continue

        return StandardResponse.success_response(
            message=f"{len(saved_packages)} packages saved, {len(skipped_packages)} skipped",
            data={
                "saved_count": len(saved_packages),
                "saved_packages": saved_packages,
                "skipped_count": len(skipped_packages),
                "skipped_packages": skipped_packages,
                "errors": errors
            }
        )
    
    except Exception as e:
        logger.exception("Fetch & save Healthians packages failed")
        raise HTTPException(status_code=502, detail=f"Healthians API or DB error: {str(e)}")


# API 3: display local DB products (query only)
@router.get("/get-healthians-products-db", response_model=StandardResponse)
async def get_products(
    search: Optional[str] = None,
    product_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user=Depends(get_current_user)
):
    try:
        tests = []
        packages = []
        if not product_type or product_type == "test":
            query = HealthiansTest.filter(is_active=True)
            if search:
                query = query.filter(name__icontains=search)
            tests = await query.offset(offset).limit(limit).all()
        if not product_type or product_type == "package":
            query = HealthiansPackage.filter(is_active=True)
            if search:
                query = query.filter(name__icontains=search)
            packages = await query.offset(offset).limit(limit).all()
        data = {
            "tests": [
                {
                    "code": t.code, "name": t.name, "mrp": float(t.mrp),
                    "discounted_price": float(t.discounted_price)
                } for t in tests
            ],
            "packages": [
                {
                    "code": p.code, "name": p.name, "mrp": float(p.mrp),
                    "discounted_price": float(p.discounted_price), "test_codes": p.test_codes
                } for p in packages
            ]
        }
        return StandardResponse.success_response(
            message="Products fetched from local database",
            data=data
        )
    except Exception as e:
        logger.exception("Fetching products from DB failed")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/create-booking/{student_id}", response_model=StandardResponse)
async def create_booking(
    student_id: int,
    payload: CreateBookingRequest,
    user=Depends(get_current_user)
):
    """Create lab test booking with Healthians."""
    # ------------------- AUTH & STUDENT CHECK -------------------
    student = await Students.get_or_none(id=student_id, is_deleted=False)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    is_child = await ParentChildren.filter(
        parent_id=user["user_id"],
        student_id=student_id
    ).exists()
    
    if not is_child and user["user_role"] not in ["SUPER_ADMIN", "PROGRAM_COORDINATOR"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # ------------------- ENSURE PHONE CONSISTENCY -------------------
    primary_phone = payload.customer[0].contact_number
    slot_id = payload.slot["slot_id"]
    
    # ------------------- CHECK FOR EXISTING CUSTOMER -------------------
    try:
        existing_booking = await HealthiansBooking.filter(
            customer_mobile=primary_phone
        ).order_by("-created_at").first()
        
        if existing_booking and existing_booking.healthians_response:
            prev_response = existing_booking.healthians_response
            stored_customer_id = None
            
            if isinstance(prev_response, dict):
                stored_customer_id = (
                    prev_response.get("customer_id") or 
                    prev_response.get("data", {}).get("customer_id") if isinstance(prev_response.get("data"), dict) else None
                )
                
                if not stored_customer_id:
                    tat_detail = prev_response.get("tatDetail", {})
                    if isinstance(tat_detail, dict):
                        cust_wise = tat_detail.get("custWiseDetails", [])
                        if cust_wise and isinstance(cust_wise, list) and len(cust_wise) > 0:
                            stored_customer_id = cust_wise[0].get("vendor_customer_id")
            
            if stored_customer_id:
                customer_id = stored_customer_id
                logger.info(f"Reusing customer_id: {customer_id}")
            else:
                customer_id = f"CU{uuid.uuid4().hex[:12].upper()}"
                logger.info(f"Generated new customer_id: {customer_id}")
        else:
            customer_id = f"CU{uuid.uuid4().hex[:12].upper()}"
            logger.info(f"First booking for {primary_phone}, customer_id: {customer_id}")
    except ConfigurationError:
        # Database not configured yet, use new customer_id
        customer_id = f"CU{uuid.uuid4().hex[:12].upper()}"
        logger.warning(f"Database not configured, using new customer_id: {customer_id}")
    
    # ------------------- GENERATE UNIQUE IDs -------------------
    timestamp = int(datetime.now().timestamp())
    vendor_booking_id = f"VB{timestamp}{student_id}"
    application_number = f"APNO{student_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # ------------------- BUILD PAYLOAD (EXACT FIELD ORDER) -------------------
    api_payload = {
        "customer": [{
            "customer_id": customer_id,
            "customer_name": payload.customer[0].customer_name,
            "relation": payload.customer[0].relation,
            "age": payload.customer[0].age,
            "dob": payload.customer[0].dob,
            "gender": payload.customer[0].gender,
            "contact_number": primary_phone,
            "email": payload.customer[0].email or "",
            "application_number": application_number
        }],
        "slot": {"slot_id": slot_id},
        "package": [{"deal_id": pkg.deal_id} for pkg in payload.package],
        "customer_calling_number": primary_phone,
        "billing_cust_name": payload.billing_cust_name,
        "gender": payload.gender,
        "mobile": primary_phone,
        "email": payload.email,
        "state": payload.state,
        "cityId": payload.cityId,
        "sub_locality": payload.sub_locality,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "address": payload.address,
        "zipcode": payload.zipcode,
        "landmark": payload.landmark or "",
        "altmobile": payload.mobile if payload.mobile != primary_phone else "",
        "altemail": payload.email if payload.email != payload.customer[0].email else "",
        "hard_copy": payload.hard_copy,
        "vendor_booking_id": vendor_booking_id,
        "vendor_billing_user_id": customer_id,
        "payment_option": payload.payment_option,
        "discounted_price": int(payload.discounted_price),
        "zone_id": payload.zone_id,
        "client_id": ""
    }
    
    # ------------------- GENERATE CHECKSUM -------------------
    checksum = generate_checksum_for_booking(api_payload)
    logger.info(f"Booking for student {student_id} | customer_id: {customer_id}")
    logger.info(f"Checksum: {checksum}")
    
    # ------------------- CALL HEALTHIANS API -------------------
    url = f"{BASE_URL}/{PARTNER_NAME}/createBooking_v3"
    headers = {
        "X-Checksum": checksum,
        "Content-Type": "application/json"
    }
    
    try:
        resp = _request_with_token_refresh("POST", url, json=api_payload, headers=headers, timeout=30)
        logger.info(f"Healthians HTTP: {resp.status_code}")
        logger.info(f"Healthians response: {resp.text[:500]}")
        
        resp.raise_for_status()
        healthians_resp = resp.json()
        
        if not healthians_resp.get("status"):
            error_msg = healthians_resp.get("message", "Booking failed")
            error_code = healthians_resp.get("code", "UNKNOWN")
            logger.error(f"Healthians error: {error_code} - {error_msg}")
            raise HTTPException(status_code=400, detail=f"Healthians API error: {error_msg}")
            
    except HTTPException:
        raise
    except requests.exceptions.HTTPError as e:
        logger.exception("Healthians HTTP error")
        raise HTTPException(status_code=502, detail=f"Healthians service error: {e.response.text[:200]}")
    except Exception as e:
        logger.exception("Unexpected error calling Healthians")
        raise HTTPException(status_code=502, detail=f"Unexpected error: {str(e)}")
    
    # ------------------- SAVE TO DATABASE -------------------
    try:
        async with in_transaction() as conn:
            tx = await Transactions.create(
                tx_no=f"TXH{vendor_booking_id[-12:]}",
                invoice_no=vendor_booking_id,
                tx_amnt=payload.discounted_price,
                tx_datetime=datetime.utcnow(),
                payment_status="pending",
                tx_mode="online",
                created_by=user["user_id"],
                created_user_role=user["user_role"],
                created_role_type=user.get("role_type", ""),
            )
            
            logger.info(f"Transaction created: {tx.tx_id}")
            
            try:
                slot_date_obj = datetime.strptime(
                    payload.slot.get("slot_date", datetime.now().strftime("%Y-%m-%d")),
                    "%Y-%m-%d"
                ).date()
            except:
                slot_date_obj = date.today()
            
            try:
                slot_time_obj = datetime.strptime(
                    payload.slot.get("slot_time", "09:00"),
                    "%H:%M"
                ).time()
            except:
                slot_time_obj = time(9, 0)
            
            # FIXED: Pass student object, not student_id
            booking = await HealthiansBooking.create(
                vendor_booking_id=vendor_booking_id,
                student=student,  # ← Changed from student_id=student_id
                transaction=tx,   # ← Already correct
                vendor_billing_user_id=customer_id,                    # This is the one we send in payload
                vendor_customer_id=customer_id,
                zone_id=str(payload.zone_id),
                latitude=payload.latitude,
                longitude=payload.longitude,
                zipcode=payload.zipcode,
                address=payload.address,
                landmark=payload.landmark,
                slot_id=slot_id,
                slot_date=slot_date_obj,
                slot_time=slot_time_obj,
                customer_name=payload.customer[0].customer_name,
                customer_mobile=primary_phone,
                customer_email=payload.customer[0].email or "",
                customer_gender=payload.customer[0].gender,
                customer_age=payload.customer[0].age,
                customer_dob=payload.customer[0].dob,
                total_mrp=Decimal("0"),
                total_discounted=payload.discounted_price,
                payment_status="pending",
                booking_status="confirmed",
                healthians_response=healthians_resp,
                healthians_booking_id=healthians_resp.get("booking_id"),
                created_by=user["user_id"],
                created_user_role=user["user_role"],
            )
            
            logger.info(f"Booking created: {booking.booking_id}")
            
            mrp_total = disc_total = Decimal("0")
            for pkg in payload.package:
                for code in pkg.deal_id:
                    test = await HealthiansTest.get_or_none(code=code)
                    package = await HealthiansPackage.get_or_none(code=code)
                    
                    price_mrp = Decimal("0")
                    price_disc = Decimal("0")
                    
                    if test:
                        price_mrp = test.mrp or Decimal("0")
                        price_disc = test.discounted_price or test.mrp or Decimal("0")
                    elif package:
                        price_mrp = package.mrp or Decimal("0")
                        price_disc = package.discounted_price or package.mrp or Decimal("0")
                    
                    await HealthiansBookingTest.create(
                        booking=booking,
                        test=test,
                        package=package,
                        code=code,
                        price_mrp=price_mrp,
                        price_discounted=price_disc,
                    )
                    
                    mrp_total += price_mrp
                    disc_total += price_disc
            
            booking.total_mrp = mrp_total
            booking.total_discounted = disc_total
            await booking.save()
            
            logger.info(f"Booking saved: MRP={mrp_total}, Discounted={disc_total}")



    except ConfigurationError as e:
        logger.error(f"Database configuration error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database not configured. Add 'src.models.helthians_booking' to Tortoise ORM config."
        )
    except Exception as e:
        logger.exception("Database save failed")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return StandardResponse.success_response(
        message="Booking created successfully",
        data={
            "vendor_booking_id": vendor_booking_id,
            "customer_id": customer_id,
            "transaction_id": tx.tx_id,
            "amount": int(payload.discounted_price),
            "payment_status": "pending",
            "healthians_booking_id": healthians_resp.get("booking_id"),
        },
    )

@router.get("/booking-status/{vendor_booking_id}", response_model=StandardResponse)
async def get_booking_status(vendor_booking_id: str, user=Depends(get_current_user)):
    """Retrieve booking details and status."""
    booking = await HealthiansBooking.get_or_none(vendor_booking_id=vendor_booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    tests = await HealthiansBookingTest.filter(booking=booking).prefetch_related("test", "package")
    test_list = [
        {
            "code": t.code,
            "name": t.test.name if t.test else t.package.name if t.package else "Unknown",
            "mrp": float(t.price_mrp),
            "discounted": float(t.price_discounted),
        }
        for t in tests
    ]
    
    return StandardResponse.success_response(
        message="Booking details",
        data={
            "vendor_booking_id": booking.vendor_booking_id,
            "healthians_booking_id": booking.healthians_booking_id,
            "booking_status": booking.booking_status,
            "payment_status": booking.payment_status,
            "total_mrp": float(booking.total_mrp),
            "total_payable": float(booking.total_discounted),
            "slot_date": booking.slot_date.isoformat() if booking.slot_date else None,
            "customer_name": booking.customer_name,
            "tests": test_list,
        },
    )


from src.models.helthians_booking import SchoolHealthiansPackage
from src.models.school_models import Schools  # Assuming Schools is in student_models, adjust if needed

# src/api/doctor/healthians_lab_booking.py

from fastapi import Depends, HTTPException
from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, Field


# ==================== SCHEMAS ====================
class PackageItem(BaseModel):
    package_id: int
    custom_name: Optional[str] = None
    custom_price: Optional[Decimal] = None

class BulkPackageRequest(BaseModel):
    school_ids: List[int] = Field(..., min_items=1, max_items=100, description="Max 100 schools")
    packages: List[PackageItem] = Field(..., min_items=1, description="At least one package")


# ==================== ENDPOINTS ====================

@router.get("/healthians-packages", response_model=StandardResponse)
async def get_healthians_packages(user=Depends(get_current_user)):
    packages = await HealthiansPackage.filter(is_active=True).all()
    result = [
        {
            "package_id": p.package_id,
            "code": p.code,
            "name": p.name,
            "mrp": float(p.mrp),
            "discounted_price": float(p.discounted_price),
            "vendor": "Healthians"
        }
        for p in packages
    ]
    return StandardResponse.success_response(
        message="All Healthians packages",
        data={"packages": result}
    )


@router.get("/school/{school_id}/packages", response_model=StandardResponse)
async def get_school_packages(school_id: int, user=Depends(get_current_user)):
    school = await Schools.get_or_none(school_id=school_id, is_deleted=False)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    # Fetch selected packages with related HealthiansPackage
    selections = await SchoolHealthiansPackage.filter(
        school=school,
        is_active=True
    ).prefetch_related("package").order_by("id")

    packages = []
    for s in selections:
        pkg = s.package
        packages.append({
            "package_id": pkg.package_id,
            "code": pkg.code,

            # Original values from Healthians
            "original_name": pkg.name,
            "original_price": float(pkg.discounted_price),

            # Display values (custom if set, else original)
            "display_name": s.custom_name or pkg.name,
            "display_price": float(s.custom_price) if s.custom_price is not None else float(pkg.discounted_price),

            # Extra helpful flags
            "is_custom_name": s.custom_name is not None,
            "is_custom_price": s.custom_price is not None,

            "vendor": "Healthians"
        })

    return StandardResponse.success_response(
        message="Healthians packages for this school",
        data={
            "school_id": school_id,
            "total_packages": len(packages),
            "packages": packages
        }
    )
    

@router.get("/schools", response_model=StandardResponse)
async def get_schools(user=Depends(get_current_user)):
    schools = await Schools.filter(is_deleted=False).values("school_id", "school_name")
    return StandardResponse.success_response(
        message="Schools fetched",
        data={"schools": list(schools)}
    )


# ==================== BULK ASSIGN & UPDATE ====================

async def _handle_bulk_assignment(payload: BulkPackageRequest, user: dict, action: str):
    # 1. Validate schools
    schools = await Schools.filter(
        school_id__in=payload.school_ids,
        is_deleted=False
    ).only("school_id")

    found_ids = {s.school_id for s in schools}
    missing = set(payload.school_ids) - found_ids
    if missing:
        raise HTTPException(status_code=404, detail=f"Schools not found: {sorted(missing)}")

    # 2. Delete existing assignments
    await SchoolHealthiansPackage.filter(school_id__in=payload.school_ids).delete()

    # 3. Validate packages
    package_ids = [item.package_id for item in payload.packages]
    valid_packages = await HealthiansPackage.filter(
        package_id__in=package_ids,
        is_active=True
    ).all()
    pkg_map = {p.package_id: p for p in valid_packages}

    # 4. Build records
    records = []
    total_assignments = 0

    for school in schools:
        for item in payload.packages:
            pkg = pkg_map.get(item.package_id)
            if not pkg:
                continue
            records.append(
                SchoolHealthiansPackage(
                    school=school,
                    package=pkg,
                    custom_name=item.custom_name or None,
                    custom_price=item.custom_price,
                    created_by=user["user_id"],
                    is_active=True
                )
            )
            total_assignments += 1

    # 5. Bulk insert
    if records:
        await SchoolHealthiansPackage.bulk_create(records, batch_size=100)

    return StandardResponse.success_response(
        message=f"Packages {action} for {len(schools)} school(s)",
        data={
            "school_count": len(schools),
            "package_count": len(payload.packages),
            "total_assignments": total_assignments,
            "school_ids": payload.school_ids
        }
    )


@router.post("/select-packages", response_model=StandardResponse)
async def bulk_assign_packages(
    payload: BulkPackageRequest,
    user = Depends(get_current_user)
):
    """Fresh assign packages to multiple schools"""
    return await _handle_bulk_assignment(payload, user, action="assigned")


@router.put("/modify-packages", response_model=StandardResponse)
async def bulk_update_packages(
    payload: BulkPackageRequest,
    user = Depends(get_current_user)
):
    """Update (replace) packages for multiple schools"""
    return await _handle_bulk_assignment(payload, user, action="updated")

# ADD THIS IMPORT at the top of your file (with other imports)
from tortoise.expressions import Q

# ────────────────────── GLOBAL CUSTOM PACKAGES API ──────────────────────
@router.get("/healthians-custom-packages", response_model=StandardResponse)
async def get_all_custom_packages(user=Depends(get_current_user)):
    """
    Get ALL Healthians packages that have been customized (name or price)
    and show exactly which schools they are applied to.
    """
    # Fetch only assignments where custom_name OR custom_price is set
    custom_assignments = await SchoolHealthiansPackage.filter(
        is_active=True
    ).filter(
        Q(custom_name__not_isnull=True) | Q(custom_price__not_isnull=True)
    ).prefetch_related("package", "school").order_by("package__code")

    if not custom_assignments:
        return StandardResponse.success_response(
            message="No customized packages found",
            data={"total_custom_packages": 0, "packages": []}
        )

    # Group by package
    package_map = {}
    for assignment in custom_assignments:
        pkg = assignment.package
        key = pkg.package_id

        if key not in package_map:
            package_map[key] = {
                "package_id": pkg.package_id,
                "code": pkg.code,
                "original_name": pkg.name,
                "original_price": float(pkg.discounted_price),
                "custom_names": set(),
                "custom_prices": set(),
                "schools": []
            }

        data = package_map[key]

        if assignment.custom_name:
            data["custom_names"].add(assignment.custom_name)
        if assignment.custom_price is not None:
            data["custom_prices"].add(float(assignment.custom_price))

        data["schools"].append({
            "school_id": assignment.school.school_id,
            "school_name": assignment.school.school_name,
            "custom_name": assignment.custom_name or pkg.name,
            "custom_price": float(assignment.custom_price) if assignment.custom_price is not None else float(pkg.discounted_price),
            "applied_at": assignment.created_at.strftime("%Y-%m-%d %H:%M")
        })

    # Build final result
    result = []
    for pkg_data in package_map.values():
        result.append({
            "package_id": pkg_data["package_id"],
            "code": pkg_data["code"],
            "original_name": pkg_data["original_name"],
            "original_price": pkg_data["original_price"],
            "vendor": "Healthians",

            "total_schools": len(pkg_data["schools"]),
            "unique_custom_names": len(pkg_data["custom_names"]),
            "unique_custom_prices": len(pkg_data["custom_prices"]),
            "custom_names_used": list(pkg_data["custom_names"]),
            "custom_prices_used": sorted(pkg_data["custom_prices"]),

            "applied_to_schools": sorted(
                pkg_data["schools"],
                key=lambda x: x["school_name"]
            )
        })

    # Sort by most used first
    result.sort(key=lambda x: x["total_schools"], reverse=True)

    return StandardResponse.success_response(
        message=f"Found {len(result)} customized Healthians packages",
        data={
            "total_custom_packages": len(result),
            "packages": result
        }
    )
    
# get report api auto doiwnload
from fastapi.responses import StreamingResponse
import aiohttp
from datetime import datetime

class HealthiansReportDownloadRequest(BaseModel):
    student_id: int = Field(..., description="Student ID")
    vendor_booking_id: Optional[str] = None
    allow_partial_report: int = Field(1, ge=0, le=1)


@router.post("/healthians/student-report-download")
async def download_healthians_report(
    payload: HealthiansReportDownloadRequest,
    user = Depends(get_current_user)
):
    """
    Auto-download latest Healthians report as PDF
    → Just send student_id → file downloads instantly
    → No storage, no DB update, no expired links
    """
    # 1. Auth + Student
    student = await Students.get_or_none(id=payload.student_id, is_deleted=False)
    if not student:
        raise HTTPException(404, "Student not found")

    is_child = await ParentChildren.filter(parent_id=user["user_id"], student_id=payload.student_id).exists()
    if not (is_child or user["user_role"] in ["SUPER_ADMIN", "PROGRAM_COORDINATOR", "DOCTOR", "ADMIN"]):
        raise HTTPException(403, "Unauthorized")

    # 2. Find latest booking
    query = HealthiansBooking.filter(student=student)
    if payload.vendor_booking_id:
        query = query.filter(vendor_booking_id=payload.vendor_booking_id)

    booking = await query.order_by("-created_at").first()
    if not booking or not booking.healthians_booking_id:
        raise HTTPException(404, "No Healthians booking found")

    if not booking.vendor_billing_user_id:
        raise HTTPException(500, "Booking data incomplete")

    # 3. Call Healthians API
    api_payload = {
        "booking_id": booking.healthians_booking_id,
        "vendor_billing_user_id": str(booking.vendor_billing_user_id),
        "vendor_customer_id": str(booking.vendor_customer_id or booking.customer_mobile[-10:]),
        "allow_partial_report": payload.allow_partial_report
    }

    resp = _request_with_token_refresh("POST", f"{BASE_URL}/{PARTNER_NAME}/getCustomerReport_v2", json=api_payload)
    if resp.status_code != 200 or not resp.json().get("status"):
        msg = resp.json().get("message", "Report not ready")
        raise HTTPException(404, msg)

    signed_url = resp.json().get("data", {}).get("report_url")
    if not signed_url:
        raise HTTPException(404, "Report not generated yet")

    # 4. Stream PDF directly to user
    async with aiohttp.ClientSession() as session:
        async with session.get(signed_url) as pdf_resp:
            if pdf_resp.status != 200:
                raise HTTPException(502, "Failed to download report")

            filename = f"Healthians_Report_{student.name.replace(' ', '_')}_{booking.vendor_booking_id}.pdf"

            return StreamingResponse(
                pdf_resp.content.iter_chunked(1024*1024),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                    "Cache-Control": "no-cache",
                }
            )
            
# get report api view only
# ==================== REQUEST BODY (Only student_id needed) ====================
class StudentReportRequest(BaseModel):
    student_id: int = Field(..., description="Your internal student ID")
    vendor_booking_id: Optional[str] = None  # Optional: to pick specific booking if multiple exist
    allow_partial_report: int = Field(1, ge=0, le=1, description="1 = allow partial report, 0 = wait for full")


# ==================== FINAL STUDENT REPORT API ====================
@router.post("/healthians/student-report", response_model=StandardResponse)
async def get_student_healthians_report(
    payload: StudentReportRequest,
    user = Depends(get_current_user)
):
    """
    Fetch Healthians Lab Report using only student_id
    → Automatically finds booking + required IDs from DB
    → Returns signed PDF URL (works even for partial reports)
    """
    # 1. Validate student & authorization
    student = await Students.get_or_none(id=payload.student_id, is_deleted=False)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    is_child = await ParentChildren.filter(parent_id=user["user_id"], student_id=payload.student_id).exists()
    if not (is_child or user["user_role"] in ["SUPER_ADMIN", "PROGRAM_COORDINATOR", "DOCTOR", "ADMIN"]):
        raise HTTPException(status_code=403, detail="Unauthorized to access this report")

    # 2. Find the correct Healthians booking
    booking_query = HealthiansBooking.filter(student=student)

    if payload.vendor_booking_id:
        booking_query = booking_query.filter(vendor_booking_id=payload.vendor_booking_id)

    booking: HealthiansBooking = await booking_query.order_by("-created_at").first()
    if not booking:
        raise HTTPException(status_code=404, detail="No Healthians booking found for this student")

    if not booking.healthians_booking_id:
        raise HTTPException(status_code=500, detail="Booking exists but Healthians ID is missing")

    # 3. Get required IDs (now saved reliably!)
    vendor_billing_user_id = booking.vendor_billing_user_id
    vendor_customer_id = booking.vendor_customer_id or booking.customer_mobile[-10:]  # fallback

    if not vendor_billing_user_id:
        raise HTTPException(status_code=500, detail="Missing vendor_billing_user_id. Contact admin.")

    # 4. Call Healthians getCustomerReport_v2
    url = f"{BASE_URL}/{PARTNER_NAME}/getCustomerReport_v2"
    api_payload = {
        "booking_id": booking.healthians_booking_id,
        "vendor_billing_user_id": str(vendor_billing_user_id),
        "vendor_customer_id": str(vendor_customer_id),
        "allow_partial_report": payload.allow_partial_report
    }

    try:
        resp = _request_with_token_refresh(
            "POST",
            url,
            json=api_payload,
            headers={"Content-Type": "application/json"},
            timeout=45
        )

        logger.info(f"Healthians Report → Student:{payload.student_id} | Booking:{booking.vendor_booking_id} | Status:{resp.status_code}")

        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Healthians report service down")

        result = resp.json()

        if not result.get("status"):
            msg = result.get("message", "Report not ready")
            if any(x in msg.lower() for x in ["not ready", "processing", "partial", "verified"]):
                raise HTTPException(status_code=425, detail=msg)  # 425 = Too Early (perfect for polling)
            raise HTTPException(status_code=400, detail=msg)

        report_data = result.get("data", {})
        report_url = report_data.get("report_url")

        if not report_url:
            raise HTTPException(status_code=404, detail="Report not generated yet. Please try again later.")

        # 5. Update booking record (so next time it's instant)
        if not booking.report_url or "expired" in str(booking.report_url).lower():
            booking.report_url = report_url
            booking.booking_status = "reported_full" if report_data.get("full_report") == 1 else "reported_partial"
            await booking.save(update_fields=["report_url", "booking_status"])

        # 6. Success response
        return StandardResponse.success_response(
            message="Lab report fetched successfully",
            data={
                "student_id": payload.student_id,
                "student_name": student.name,
                "vendor_booking_id": booking.vendor_booking_id,
                "healthians_booking_id": booking.healthians_booking_id,
                "report_url": report_url,
                "is_full_report": report_data.get("full_report") == 1,
                "verified_at": report_data.get("verified_at"),
                "tests_included": report_data.get("includeTest", []),
                "mobile_number": report_data.get("mobile_number"),
                "allow_partial_report": payload.allow_partial_report,
                "fetched_at": datetime.utcnow().isoformat() + "Z"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Report fetch failed for student {payload.student_id}")
        raise HTTPException(status_code=502, detail="Failed to connect to Healthians report service")
    