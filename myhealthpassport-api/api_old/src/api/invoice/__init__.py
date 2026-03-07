from fastapi import APIRouter


router = APIRouter(prefix="/api/v1/invoice", tags=["invoice"])

from . import invoice