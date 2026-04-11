from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/general", tags=["General"])

from .routes import constants, home, whatsapp, parent_inquiry
