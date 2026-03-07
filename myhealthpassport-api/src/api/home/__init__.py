from fastapi import APIRouter

router = APIRouter(prefix="", tags=["home"])


from .home import router