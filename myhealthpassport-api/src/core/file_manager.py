import base64
import binascii
import logging
import os, tempfile
import uuid


from typing import Optional
from bs4 import BeautifulSoup
from src.core.cache_maanger import DbCache
import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError, ClientError

# AWS Config from environment variables
AWS_S3_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_USE_PRESIGNED = os.getenv("AWS_USE_PRESIGNED", "false").lower() == "true"

DEFAULT_FOLDER = "uploads/general"

APP_ENV = os.getenv("APP_ENV", "development")

# Only require AWS credentials for production environment
if APP_ENV == "production":
    if not all([AWS_S3_BUCKET_NAME, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY]):
        raise EnvironmentError("Missing AWS credentials or config.")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Initialize S3 client only if AWS credentials are available
if all([AWS_S3_BUCKET_NAME, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY]):
    s3_client = boto3.client(
        "s3",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )
else:
    s3_client = None  # S3 not configured (e.g., UAT environment)

ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"]
ALLOWED_MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}

def generate_s3_url(s3_key: str) -> str:
    """Generate the public S3 URL for the object."""
    return f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"

def generate_presigned_url(s3_key: str, expires_in: int = 3600) -> Optional[str]:
    """Generate a presigned URL to access a private S3 object."""
    if s3_client is None:
        logger.warning("S3 client not initialized (missing credentials). Cannot generate presigned URL.")
        return None
    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": AWS_S3_BUCKET_NAME, "Key": s3_key},
            ExpiresIn=expires_in,
        )
        return url
    except ClientError as e:
        logger.error(f"Presigned URL generation failed for {s3_key}: {e}", exc_info=True)
        return None

async def get_new_url(
    s3_key: Optional[str],
    use_presigned: bool = True,
    full_url: bool = True
) -> Optional[str]:
    """
    Return full presigned URL from S3 key, with Redis caching.
    """
    if not s3_key:
        return None

    if not full_url:
        return s3_key

    try:
        # Check Redis for cached URL
        cache = DbCache()
        cached_url = await cache.get(s3_key)
        if cached_url:
            return cached_url.decode() if isinstance(cached_url, bytes) else cached_url

        # Generate new presigned URL
        presigned = generate_presigned_url(s3_key)
        if presigned:
            await cache.set(s3_key, presigned, ttl=3600)  # 1 hour TTL
            return presigned

        logger.warning(f"Failed to generate presigned URL for {s3_key}, falling back to public URL.")
        return generate_s3_url(s3_key)

    except Exception as e:
        logger.error(f"Error retrieving/generating S3 URL: {e}", exc_info=True)
        return None

def get_s3_key(extension: str, folder: Optional[str] = None) -> str:
    """Generate unique S3 object key with UUID."""
    folder = folder or DEFAULT_FOLDER
    return f"{folder}/{uuid.uuid4()}{extension}"

async def save_base64_image(
    base64_string: Optional[str],
    destination_folder: Optional[str] = None,
    user_role: Optional[str] = None,
    role_type: Optional[str] = None,
    return_key_only: bool = True  # Return only key (default), or full URL if False
) -> Optional[str]:
    """
    Decode a base64-encoded image string and upload it to S3.
    Returns:
    - By default (return_key_only=True), the S3 key (path) string.
    - If return_key_only=False, returns full URL or presigned URL depending on config.
    """
    if not base64_string:
        logger.warning("No base64 string provided.")
        return None

    try:
        # Handle if input is HTML <img> tag, extract src attribute
        if base64_string.strip().startswith("<img"):
            soup = BeautifulSoup(base64_string, "html.parser")
            base64_string = soup.find("img")["src"]

        header, data = "", base64_string
        if "," in base64_string:
            header, data = base64_string.split(",", 1)

        # Detect extension and content type from data URL header
        ext = ".png"
        content_type = "image/png"
        if "jpeg" in header or "jpg" in header:
            ext = ".jpg"
            content_type = "image/jpeg"
        elif "webp" in header:
            ext = ".webp"
            content_type = "image/webp"

        image_bytes = base64.b64decode(data)
        if not image_bytes:
            logger.error("Decoded image is empty.")
            return None

        if s3_client is None:
            logger.error("S3 client is not initialized. Check AWS credentials (AWS_BUCKET_NAME, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).")
            return None

        folder = destination_folder or f"uploads/{user_role or 'unknown'}/{role_type or 'misc'}"
        s3_key = get_s3_key(ext, folder)

        s3_client.put_object(
            Bucket=AWS_S3_BUCKET_NAME,
            Key=s3_key,
            Body=image_bytes,
            ContentType=content_type
        )
        logger.info(f"Uploaded base64 image to S3: {s3_key}")

        if return_key_only:
            return s3_key
        else:
            # Return URL (presigned if enabled) instead of key
            return get_new_url(s3_key)

    except (binascii.Error, ValueError) as e:
        logger.error(f"Invalid base64 image input: {e}", exc_info=True)
        return None
    except Exception as e:
        logger.error(f"Base64 upload error: {e}", exc_info=True)
        return None

async def save_uploaded_file(
    file,
    destination_folder: Optional[str] = None,
    user_role: Optional[str] = None,
    role_type: Optional[str] = None,
) -> Optional[str]:
    """
    Save an uploaded file (FastAPI UploadFile) to S3.
    Returns the S3 key or None on failure.
    """
    try:
        ext = os.path.splitext(file.filename)[-1].lower()

        if ext == ".csv":
            logger.info(f"Skipping CSV file upload: {file.filename}")
            return None  # Or handle locally if needed

        if ext not in ALLOWED_EXTENSIONS:
            logger.warning(f"Unsupported file extension: {ext}")
            return None

        content_type = ALLOWED_MIME_TYPES.get(ext)
        content = await file.read()
        if not content:
            logger.error("Uploaded file is empty.")
            return None

        folder = destination_folder or f"uploads/{user_role or 'unknown'}/{role_type or 'misc'}"
        s3_key = get_s3_key(ext, folder)

        s3_client.put_object(
            Bucket=AWS_S3_BUCKET_NAME,
            Key=s3_key,
            Body=content,
            ContentType=content_type
        )
        logger.info(f"Uploaded file to S3: {s3_key}")
        return s3_key

    except (BotoCoreError, NoCredentialsError, Exception) as e:
        logger.error(f"File upload failed: {e}", exc_info=True)
        return None
