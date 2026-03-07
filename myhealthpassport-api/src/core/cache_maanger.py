import json

from src.db import redis_db  # Assuming this is already the async redis client


class DbCache:
    """
    A class to handle simple key-value caching using Redis.
    """
    def __init__(self):
        self._conn = redis_db

    async def set(self, key, value, ttl):
        return await self._conn.set(key, value, ex=ttl)

    async def get(self, key):
        return await self._conn.get(key)


class ObjectCache:
    """
    A class to handle object caching (with JSON serialization) using Redis.
    """
    def __init__(self, cache_key):
        self._conn = redis_db
        self.cache_string = cache_key

    async def set(self, data, ttl):
        data = json.dumps(data)
        return await self._conn.set(self.cache_string, data, ex=ttl)

    async def get(self):
        result = await self._conn.get(self.cache_string)
        if result:
            if isinstance(result, str):
                return json.loads(result)
            else:
                return json.loads(result.decode())
        return None

    async def delete(self):
        return await self._conn.delete(self.cache_string)
