import boto3
import os
from dotenv import load_dotenv

load_dotenv()

bucket_name = os.getenv("AWS_BUCKET_NAME")
aws_region = os.getenv("AWS_REGION")

s3 = boto3.client(
    "s3",
    region_name=aws_region,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

# Print all keys to check structure
response = s3.list_objects_v2(Bucket=bucket_name)

if "Contents" in response:
    print("🔍 Found keys:")
    for obj in response["Contents"]:
        print(obj["Key"])
else:
    print("❌ No objects in bucket.")
