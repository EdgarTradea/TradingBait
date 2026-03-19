"""Weekly Intentions API for Trading Journal

Handles weekly goal setting with automatic Sunday reset logic
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from app.auth import AuthorizedUser
import databutton as db
import re

router = APIRouter(prefix="/weekly-intentions")

# Data Models
class WeeklyIntentions(BaseModel):
    week_start_date: str  # ISO date format (YYYY-MM-DD)
    trading_goals: str
    personal_goals: str
    created_at: str
    updated_at: str
    is_archived: bool = False

class CreateWeeklyIntentionsRequest(BaseModel):
    trading_goals: str
    personal_goals: str

class UpdateWeeklyIntentionsRequest(BaseModel):
    trading_goals: Optional[str] = None
    personal_goals: Optional[str] = None

class WeeklyIntentionsResponse(BaseModel):
    success: bool
    intentions: Optional[WeeklyIntentions] = None
    message: str
    is_editable: bool = False
    days_until_sunday: int = 0

class WeeklyIntentionsListResponse(BaseModel):
    success: bool
    current_week: Optional[WeeklyIntentions] = None
    archived_weeks: List[WeeklyIntentions] = []
    message: str
    is_editable: bool = False
    days_until_sunday: int = 0

# Utility Functions
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def get_week_start_date(target_date: datetime = None) -> datetime:
    """Get the start date (Sunday) of the week for the given date"""
    if target_date is None:
        target_date = datetime.now()
    
    # Calculate days back to Sunday (weekday() returns 0=Monday, 6=Sunday)
    days_back = (target_date.weekday() + 1) % 7
    week_start = target_date - timedelta(days=days_back)
    
    # Return start of day for consistent date handling
    return week_start.replace(hour=0, minute=0, second=0, microsecond=0)

def get_user_weekly_intentions_key(user_id: str) -> str:
    """Get storage key for user's weekly intentions"""
    return sanitize_storage_key(f"weekly_intentions_{user_id}")

def is_sunday() -> bool:
    """Check if today is Sunday"""
    return datetime.now().weekday() == 6  # Sunday = 6

def days_until_sunday() -> int:
    """Calculate days until next Sunday"""
    today = datetime.now().weekday()
    if today == 6:  # Today is Sunday
        return 0
    else:
        return (6 - today) % 7

def is_editable_time() -> bool:
    """Check if weekly intentions can be edited (only on Sunday)"""
    return is_sunday()

def load_user_weekly_intentions(user_id: str) -> List[Dict[str, Any]]:
    """Load all weekly intentions for a user"""
    try:
        intentions_key = get_user_weekly_intentions_key(user_id)
        intentions_data = db.storage.json.get(intentions_key, default=[])
        
        # Ensure it's a list
        if not isinstance(intentions_data, list):
            return []
        
        return intentions_data
    except Exception as e:
        print(f"Error loading weekly intentions for user {user_id}: {e}")
        return []

def save_user_weekly_intentions(user_id: str, intentions_list: List[Dict[str, Any]]) -> bool:
    """Save weekly intentions list for a user"""
    try:
        intentions_key = get_user_weekly_intentions_key(user_id)
        db.storage.json.put(intentions_key, intentions_list)
        return True
    except Exception as e:
        print(f"Error saving weekly intentions for user {user_id}: {e}")
        return False

def archive_previous_weeks(user_id: str, current_week_start: str) -> bool:
    """Archive any previous weeks that are not archived yet"""
    try:
        intentions_list = load_user_weekly_intentions(user_id)
        updated = False
        
        for intention in intentions_list:
            # Archive any week that's not the current week and not already archived
            if intention.get('week_start_date') != current_week_start and not intention.get('is_archived', False):
                intention['is_archived'] = True
                updated = True
        
        if updated:
            save_user_weekly_intentions(user_id, intentions_list)
        
        return True
    except Exception as e:
        print(f"Error archiving previous weeks for user {user_id}: {e}")
        return False

def get_current_week_intentions(user_id: str) -> Optional[Dict[str, Any]]:
    """Get intentions for the current week"""
    try:
        current_week_start = get_week_start_date().strftime('%Y-%m-%d')
        intentions_list = load_user_weekly_intentions(user_id)
        
        # Archive previous weeks first
        archive_previous_weeks(user_id, current_week_start)
        
        # Find current week's intentions
        for intention in intentions_list:
            if intention.get('week_start_date') == current_week_start and not intention.get('is_archived', False):
                return intention
        
        return None
    except Exception as e:
        print(f"Error getting current week intentions for user {user_id}: {e}")
        return None

# API Endpoints
@router.get("/current", response_model=WeeklyIntentionsResponse)
async def get_current_weekly_intentions(user: AuthorizedUser):
    """Get current week's intentions"""
    try:
        user_id = user.sub
        current_intentions = get_current_week_intentions(user_id)
        
        if current_intentions:
            intentions_obj = WeeklyIntentions(**current_intentions)
            return WeeklyIntentionsResponse(
                success=True,
                intentions=intentions_obj,
                message="Current week intentions retrieved successfully",
                is_editable=is_editable_time(),
                days_until_sunday=days_until_sunday()
            )
        else:
            return WeeklyIntentionsResponse(
                success=True,
                intentions=None,
                message="No intentions set for current week",
                is_editable=is_editable_time(),
                days_until_sunday=days_until_sunday()
            )
    
    except Exception as e:
        print(f"Error getting current weekly intentions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get current weekly intentions")

@router.post("/current", response_model=WeeklyIntentionsResponse)
async def create_or_update_current_weekly_intentions(
    request: CreateWeeklyIntentionsRequest,
    user: AuthorizedUser
):
    """Create or update current week's intentions (only allowed on Sunday)"""
    try:
        user_id = user.sub
        
        # Check if editing is allowed (only on Sunday)
        if not is_editable_time():
            return WeeklyIntentionsResponse(
                success=False,
                intentions=None,
                message=f"Weekly intentions can only be edited on Sunday. {days_until_sunday()} days until next Sunday.",
                is_editable=False,
                days_until_sunday=days_until_sunday()
            )
        
        current_week_start = get_week_start_date().strftime('%Y-%m-%d')
        now = datetime.now().isoformat()
        
        # Load existing intentions
        intentions_list = load_user_weekly_intentions(user_id)
        
        # Archive previous weeks
        archive_previous_weeks(user_id, current_week_start)
        
        # Check if current week already exists
        current_intentions = None
        for i, intention in enumerate(intentions_list):
            if intention.get('week_start_date') == current_week_start and not intention.get('is_archived', False):
                current_intentions = intention
                break
        
        if current_intentions:
            # Update existing intentions
            current_intentions['trading_goals'] = request.trading_goals
            current_intentions['personal_goals'] = request.personal_goals
            current_intentions['updated_at'] = now
        else:
            # Create new intentions for current week
            new_intentions = {
                'week_start_date': current_week_start,
                'trading_goals': request.trading_goals,
                'personal_goals': request.personal_goals,
                'created_at': now,
                'updated_at': now,
                'is_archived': False
            }
            intentions_list.append(new_intentions)
            current_intentions = new_intentions
        
        # Save updated list
        if save_user_weekly_intentions(user_id, intentions_list):
            intentions_obj = WeeklyIntentions(**current_intentions)
            return WeeklyIntentionsResponse(
                success=True,
                intentions=intentions_obj,
                message="Weekly intentions saved successfully",
                is_editable=True,
                days_until_sunday=0
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to save weekly intentions")
    
    except Exception as e:
        print(f"Error creating/updating weekly intentions: {e}")
        raise HTTPException(status_code=500, detail="Failed to save weekly intentions")

@router.get("/history", response_model=WeeklyIntentionsListResponse)
async def get_weekly_intentions_history(user: AuthorizedUser):
    """Get all weekly intentions (current and archived)"""
    try:
        user_id = user.sub
        intentions_list = load_user_weekly_intentions(user_id)
        
        current_week_start = get_week_start_date().strftime('%Y-%m-%d')
        
        # Archive previous weeks
        archive_previous_weeks(user_id, current_week_start)
        
        # Separate current and archived
        current_week = None
        archived_weeks = []
        
        for intention in intentions_list:
            if intention.get('week_start_date') == current_week_start and not intention.get('is_archived', False):
                current_week = WeeklyIntentions(**intention)
            elif intention.get('is_archived', False):
                archived_weeks.append(WeeklyIntentions(**intention))
        
        # Sort archived weeks by date (most recent first)
        archived_weeks.sort(key=lambda x: x.week_start_date, reverse=True)
        
        return WeeklyIntentionsListResponse(
            success=True,
            current_week=current_week,
            archived_weeks=archived_weeks,
            message=f"Retrieved intentions history: {len(archived_weeks)} archived weeks",
            is_editable=is_editable_time(),
            days_until_sunday=days_until_sunday()
        )
    
    except Exception as e:
        print(f"Error getting weekly intentions history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get weekly intentions history")

@router.post("/sunday-reset")
async def trigger_sunday_reset(user: AuthorizedUser):
    """Manually trigger Sunday reset (archives previous weeks)"""
    try:
        user_id = user.sub
        current_week_start = get_week_start_date().strftime('%Y-%m-%d')
        
        # Archive previous weeks
        success = archive_previous_weeks(user_id, current_week_start)
        
        if success:
            return {
                "success": True,
                "message": "Sunday reset completed successfully",
                "current_week_start": current_week_start,
                "is_editable": is_editable_time(),
                "days_until_sunday": days_until_sunday()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to complete Sunday reset")
    
    except Exception as e:
        print(f"Error during Sunday reset: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete Sunday reset")

@router.get("/health")
async def weekly_intentions_health_check():
    """Health check for weekly intentions API"""
    current_week_start = get_week_start_date().strftime('%Y-%m-%d')
    
    return {
        "status": "healthy",
        "service": "weekly-intentions",
        "timestamp": datetime.now().isoformat(),
        "current_week_start": current_week_start,
        "is_sunday": is_sunday(),
        "is_editable_time": is_editable_time(),
        "days_until_sunday": days_until_sunday(),
        "features": [
            "weekly_goal_setting",
            "sunday_reset_logic",
            "automatic_archival",
            "read_only_weekdays",
            "editable_sundays"
        ]
    }
