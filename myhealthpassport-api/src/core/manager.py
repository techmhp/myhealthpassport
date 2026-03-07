import json
from typing import Optional

import redis.asyncio as redis
from fastapi import Depends, Header, HTTPException

from src.db import redis_db

redis_db = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)


async def get_user_from_token(token: str) -> Optional[dict]:
    """
    Fetch the user session from Redis using the token.
    """
    user_data = await redis_db.get(token)  # Await the Redis get operation
    if user_data:
        return json.loads(user_data)
    return None


async def get_current_user(authorization: str = Header(...)):
    """
    Extract token from Authorization header and validate from Redis.
    """
    token = authorization.replace("Bearer ", "")
    user_data = await get_user_from_token(token)  # Await the async function

    if not user_data:
        raise HTTPException(status_code=401, detail="Unauthorized: Session not found")

    return user_data
