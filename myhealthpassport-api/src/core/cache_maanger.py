import json
import logging

from src.db import redis_db  # Assuming this is already the async redis client

logger = logging.getLogger(__name__)


class DbCache:
    """
    A class to handle simple key-value caching using Redis.
    """
    def __init__(self):
        self._conn = redis_db

    async def set(self, key, value, ttl):
        try:
            return await self._conn.set(key, value, ex=ttl)
        except Exception as e:
            logger.error(f"Redis set error for key '{key}': {e}")
            raise

    async def get(self, key):
        try:
            return await self._conn.get(key)
        except Exception as e:
            logger.error(f"Redis get error for key '{key}': {e}")
            return None


class ObjectCache:
    """
    A class to handle object caching (with JSON serialization) using Redis.
    """
    def __init__(self, cache_key):
        self._conn = redis_db
        self.cache_string = cache_key

    async def set(self, data, ttl):
        try:
            data = json.dumps(data)
            return await self._conn.set(self.cache_string, data, ex=ttl)
        except Exception as e:
            logger.error(f"Redis set error for key '{self.cache_string}': {e}")
            raise

    async def get(self):
        try:
            result = await self._conn.get(self.cache_string)
            if result:
                if isinstance(result, str):
                    return json.loads(result)
                else:
                    return json.loads(result.decode())
            return None
        except Exception as e:
            logger.error(f"Redis get error for key '{self.cache_string}': {e}")
            return None

    async def delete(self):
        try:
            return await self._conn.delete(self.cache_string)
        except Exception as e:
            logger.error(f"Redis delete error for key '{self.cache_string}': {e}")
            return None
