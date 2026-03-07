from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/users", tags=["users"])


from .routes import accounts
from .routes import school
from .routes import profiles
from .routes import settings
from .routes import events

# router.include_router(user_profile_router)
# router.include_router(update_profiles_router)
