import os
import redis.asyncio as redis

environment = os.environ.get("APP_ENV")
if environment == "production":
    redis_db = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
elif environment == "uat":
    redis_db = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
elif environment == "development" or environment is None:
    redis_db = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

