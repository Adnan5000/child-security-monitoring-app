import redis
from app.config import settings
from typing import Optional
import json


class RedisClient:
    _instance: Optional[redis.Redis] = None
    
    @classmethod
    def get_client(cls) -> redis.Redis:
        if cls._instance is None:
            cls._instance = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
        return cls._instance
    
    @classmethod
    def ping(cls) -> bool:
        """Test Redis connection"""
        try:
            client = cls.get_client()
            return client.ping()
        except Exception:
            return False


# Utility functions for common Redis operations
def set_location(child_id: str, location_data: dict, ttl: int = 300) -> bool:
    """Store child's current location in Redis with TTL (default 5 minutes)"""
    try:
        client = RedisClient.get_client()
        key = f"location:{child_id}"
        client.setex(key, ttl, json.dumps(location_data))
        return True
    except Exception as e:
        print(f"Error setting location in Redis: {e}")
        return False


def get_location(child_id: str) -> Optional[dict]:
    """Get child's current location from Redis"""
    try:
        client = RedisClient.get_client()
        key = f"location:{child_id}"
        data = client.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception as e:
        print(f"Error getting location from Redis: {e}")
        return None


def cache_device_status(device_id: str, status_data: dict, ttl: int = 60) -> bool:
    """Cache device status in Redis (short TTL for real-time updates)"""
    try:
        client = RedisClient.get_client()
        key = f"device:{device_id}"
        client.setex(key, ttl, json.dumps(status_data))
        return True
    except Exception as e:
        print(f"Error caching device status: {e}")
        return False


def get_device_status(device_id: str) -> Optional[dict]:
    """Get cached device status from Redis"""
    try:
        client = RedisClient.get_client()
        key = f"device:{device_id}"
        data = client.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception as e:
        print(f"Error getting device status from Redis: {e}")
        return None


def invalidate_location(child_id: str) -> bool:
    """Remove location cache for a child"""
    try:
        client = RedisClient.get_client()
        key = f"location:{child_id}"
        client.delete(key)
        return True
    except Exception as e:
        print(f"Error invalidating location cache: {e}")
        return False

