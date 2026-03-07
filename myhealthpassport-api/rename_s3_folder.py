import boto3
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Read values from environment
bucket_name = os.getenv("AWS_BUCKET_NAME")
aws_region = os.getenv("AWS_REGION")

# Initialize boto3 client using loaded env vars
s3 = boto3.client(
    "s3",
    region_name=aws_region,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

# Define the old and new prefixes
old_prefix = "uploads/prfile_images/"
new_prefix = "uploads/profile_images/"

# List all objects with old prefix
response = s3.list_objects_v2(Bucket=bucket_name, Prefix=old_prefix)

if "Contents" in response:
    for obj in response["Contents"]:
        old_key = obj["Key"]
        new_key = old_key.replace(old_prefix, new_prefix, 1)

        # Copy object to new key
        s3.copy_object(
            Bucket=bucket_name,
            CopySource={"Bucket": bucket_name, "Key": old_key},
            Key=new_key
        )

        # Delete old object
        s3.delete_object(Bucket=bucket_name, Key=old_key)

    print("✅ Folder renamed successfully.")
else:
    print("⚠️ No objects found with prefix:", old_prefix)
