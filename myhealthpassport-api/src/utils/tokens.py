import uuid


def generate_uuid4_token():
    """
    Generates a unique access token using the UUID version 4 standard.
    """
    token = str(uuid.uuid4())
    return token


import os

from itsdangerous import URLSafeTimedSerializer

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
SECURITY_PASSWORD_SALT = os.getenv("SECURITY_PASSWORD_SALT", "super-salty")


def create_reset_token(email: str) -> str:
    serializer = URLSafeTimedSerializer(SECRET_KEY)
    return serializer.dumps(email, salt=SECURITY_PASSWORD_SALT)


def verify_reset_token(token: str, expiration: int = 3600) -> str | None:
    serializer = URLSafeTimedSerializer(SECRET_KEY)
    try:
        return serializer.loads(token, salt=SECURITY_PASSWORD_SALT, max_age=expiration)
    except Exception:
        return None
