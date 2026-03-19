from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# Admin cache for performance
admin_user_cache = {
    "last_updated": None,
    "users": [],
    "cache_duration": 300  # 5 minutes
}

def get_cached_users():
    """Get cached users if available and not expired"""
    now = datetime.now(timezone.utc)
    last_updated = admin_user_cache.get("last_updated")
    
    if last_updated and (now - last_updated).total_seconds() < admin_user_cache["cache_duration"]:
        return admin_user_cache["users"]
    return None

def update_user_cache(users):
    """Update the user cache"""
    admin_user_cache["last_updated"] = datetime.now(timezone.utc)
    admin_user_cache["users"] = users

def clear_user_cache():
    """Clear the user cache"""
    admin_user_cache["last_updated"] = None
    admin_user_cache["users"] = []
