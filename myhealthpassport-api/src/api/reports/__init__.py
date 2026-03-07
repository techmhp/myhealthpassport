from fastapi import APIRouter


router = APIRouter(prefix="/api/v1/report", tags=["report"])

from . import report