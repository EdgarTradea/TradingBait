"""Admin cache utilities for performance optimization"""

import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

# Simple in-memory cache
_admin_cache: Dict[str, Dict[str, Any]] = {}

def get_cached_users(cache_key: str = "admin_users") -> Optional[List[Dict[str, Any]]]:
    """Get cached user data if available and not expired"""
    if cache_key not in _admin_cache:
        return None
    
    cache_entry = _admin_cache[cache_key]
    
    # Check if cache is expired (5 minutes)
    if datetime.now() > cache_entry["expires_at"]:
        del _admin_cache[cache_key]
        return None
    
    return cache_entry["data"]

def set_cached_users(users_data: List[Dict[str, Any]], cache_key: str = "admin_users") -> None:
    """Cache user data with expiration"""
    _admin_cache[cache_key] = {
        "data": users_data,
        "expires_at": datetime.now() + timedelta(minutes=5),
        "cached_at": datetime.now()
    }

def clear_cache(cache_key: Optional[str] = None) -> None:
    """Clear cache - all or specific key"""
    if cache_key:
        _admin_cache.pop(cache_key, None)
    else:
        _admin_cache.clear()

def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics"""
    stats = {
        "total_entries": len(_admin_cache),
        "entries": []
    }
    
    for key, entry in _admin_cache.items():
        stats["entries"].append({
            "key": key,
            "cached_at": entry["cached_at"].isoformat(),
            "expires_at": entry["expires_at"].isoformat(),
            "data_size": len(entry["data"]) if isinstance(entry["data"], list) else "unknown"
        })
    
    return stats
