import os
import ssl as ssl_module

environment = os.environ.get("APP_ENV")

# Supabase connection via asyncpg with SSL (cert verification disabled for pooler self-signed chain)
# Credentials are read from DB_* env vars — set these in the .env file for each environment.
def _build_supabase_connection():
    ctx = ssl_module.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl_module.CERT_NONE
    return {
        "engine": "tortoise.backends.asyncpg",
        "credentials": {
            "host": os.environ.get("DB_HOST", "aws-1-ap-south-1.pooler.supabase.com"),
            "port": int(os.environ.get("DB_PORT", "5432")),
            "user": os.environ.get("DB_USER", ""),
            "password": os.environ.get("DB_PASSWORD", ""),
            "database": os.environ.get("DB_NAME", "postgres"),
            "ssl": ctx,
        }
    }

_model_list = [
    "src.models.user_models",
    "src.models.consultation_models",
    "src.models.other_models",
    "src.models.school_models",
    "src.models.screening_models",
    "src.models.transaction_models",
    "src.models.student_models",
    "src.models.questionnaire_models",
    "src.models.helthians_booking",
    "src.models.thyrocare_models",
]

_apps = {
    "models": {
        "models": _model_list,
        "default_connection": "default",
    },
    "aerich": {
        "models": ["aerich.models"],
        "default_connection": "default",
    },
}

DATABASE_URL = os.environ.get("DATABASE_URL")
_dev_db = DATABASE_URL or "postgres://secretadmin:Access100@localhost:5432/myhealth_passport_dev"

if environment in ("uat", "production"):
    # Both UAT and PROD connect to their respective Supabase instances via SSL.
    # Credentials must be provided through DB_HOST / DB_USER / DB_PASSWORD / DB_NAME env vars.
    TORTOISE_ORM = {
        "connections": {"default": _build_supabase_connection()},
        "apps": _apps,
        "use_tz": False,
        "timezone": "UTC"
    }

elif environment == "development" or environment is None:
    TORTOISE_ORM = {
        "connections": {"default": _dev_db},
        "apps": _apps,
        "use_tz": False,
        "timezone": "UTC"
    }
