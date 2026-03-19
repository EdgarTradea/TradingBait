from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, date
from collections import defaultdict
import uuid
import pandas as pd
import re
from app.auth import AuthorizedUser
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase

router = APIRouter(prefix="/routes")

def _db():
    initialize_firebase()
    return firestore.client()

def _journal_col(user_id: str):
    return _db().collection("users").document(user_id).collection("journal")

def _habits_col(user_id: str):
    return _db().collection("users").document(user_id).collection("habits")

def _moods_col(user_id: str):
    return _db().collection("users").document(user_id).collection("moods")

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def is_valid_date(date_str: str) -> bool:
    """Validate date string format"""
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

# Habit Definition Models
class HabitDefinition(BaseModel):
    id: str
    name: str
    category: str  # "pre-market", "during-trading", "post-market"
    created_at: Optional[str] = None
    is_active: bool = True
    description: Optional[str] = None

# Mood Management Models
class MoodDefinition(BaseModel):
    id: str
    name: str
    category: str  # "positive", "negative", "neutral", "custom"
    is_predefined: bool = True
    color: Optional[str] = None  # Hex color for UI
    icon: Optional[str] = None  # Icon name for UI
    usage_count: int = 0
    created_at: Optional[str] = None
    user_id: Optional[str] = None  # Only for custom moods

class CreateCustomMoodRequest(BaseModel):
    name: str
    category: Optional[str] = "custom"
    color: Optional[str] = None
    icon: Optional[str] = None

class UpdateCustomMoodRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None

class MoodResponse(BaseModel):
    success: bool
    moods: List[MoodDefinition] = []
    message: str = ""

class Habit(BaseModel):
    id: str
    name: str
    category: str
    completed: bool = False
    notes: Optional[str] = None

# Journal Entry Models
class JournalEntry(BaseModel):
    date: str  # ISO date format YYYY-MM-DD
    user_id: str
    mood: Optional[str] = None
    energy_level: Optional[int] = None  # 1-10
    market_outlook: Optional[str] = None
    post_market_outlook: Optional[str] = None  # New field for post-market conditions
    pre_market_notes: Optional[str] = None
    post_market_notes: Optional[str] = None
    post_market_mood: Optional[str] = None  # New field for post-market emotional state
    lessons_learned: Optional[str] = None
    habits: List[Habit] = []
    goals: Optional[str] = None
    daily_intentions: Optional[str] = None
    challenges: Optional[str] = None
    wins: Optional[str] = None
    uploaded_file: Optional[Dict[str, Any]] = None
    file_analysis: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# Streak Models
class StreakInfo(BaseModel):
    streak_type: str  # "journal_entry", "pre_market", "during_trading", "post_market", "habit_specific"
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[str] = None
    total_completions: int
    habit_name: Optional[str] = None  # For habit-specific streaks

class StreakCalendarDay(BaseModel):
    date: str
    has_journal_entry: bool
    pre_market_completion_rate: float
    during_trading_completion_rate: float
    post_market_completion_rate: float
    overall_completion_rate: float
    mood: Optional[str] = None
    streak_status: str  # "complete", "partial", "missed", "recovery"

# Behavioral Insights Models
class BehavioralInsight(BaseModel):
    type: str  # "warning", "alert", "positive", "recommendation"
    title: str
    message: str
    confidence: float  # 0.0 to 1.0
    category: str  # "habits", "mood", "discipline", "patterns"

class PerformanceCorrelation(BaseModel):
    habit_name: str
    completion_rate: float
    performance_correlation: float
    confidence_level: str  # "high", "medium", "low"
    sample_size: int

# Request/Response Models
class CreateJournalEntryRequest(BaseModel):
    date: str
    mood: Optional[str] = None
    energy_level: Optional[int] = None
    market_outlook: Optional[str] = None
    post_market_outlook: Optional[str] = None  # New field for post-market conditions
    pre_market_notes: Optional[str] = None
    post_market_notes: Optional[str] = None
    post_market_mood: Optional[str] = None
    lessons_learned: Optional[str] = None
    habits: List[Habit] = []
    goals: Optional[str] = None
    daily_intentions: Optional[str] = None
    challenges: Optional[str] = None
    wins: Optional[str] = None
    uploaded_file: Optional[Dict[str, Any]] = None

class UpdateJournalEntryRequest(BaseModel):
    mood: Optional[str] = None
    energy_level: Optional[int] = None
    market_outlook: Optional[str] = None
    post_market_outlook: Optional[str] = None
    pre_market_notes: Optional[str] = None
    post_market_notes: Optional[str] = None
    post_market_mood: Optional[str] = None
    lessons_learned: Optional[str] = None
    habits: Optional[List[Habit]] = None
    goals: Optional[str] = None
    daily_intentions: Optional[str] = None
    challenges: Optional[str] = None
    wins: Optional[str] = None

class CreateHabitRequest(BaseModel):
    name: str
    category: str
    description: Optional[str] = None

class UpdateHabitRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None

class JournalResponse(BaseModel):
    success: bool
    entry: Optional[JournalEntry] = None
    message: str = ""

class JournalListResponse(BaseModel):
    success: bool
    entries: List[JournalEntry] = []
    total_count: int = 0
    message: str = ""

class HabitResponse(BaseModel):
    success: bool
    habits: List[HabitDefinition] = []
    message: str = ""

class StreakResponse(BaseModel):
    streaks: List[StreakInfo]
    calendar_data: List[StreakCalendarDay]
    total_journal_days: int
    recovery_mode_active: bool
    recovery_days_remaining: int

class BehavioralInsightsResponse(BaseModel):
    insights: List[BehavioralInsight]
    streak_data: Dict[str, Any]
    consistency_score: int

class AnalyticsResponse(BaseModel):
    total_entries: int
    current_streak: int
    longest_streak: int
    avg_mood_score: float
    avg_energy_level: float
    habit_completion_rates: Dict[str, float]
    most_consistent_habit: Optional[str] = None
    improvement_areas: List[str] = []
    # Trading performance metrics
    trading_performance: Optional[Dict[str, Any]] = None

# ============================================================================
# HABIT UTILITY FUNCTIONS
# ============================================================================

def load_user_habit_definitions(user_id: str) -> List[HabitDefinition]:
    """Load habit definitions for a specific user from Firestore"""
    try:
        docs = _habits_col(user_id).where("is_active", "==", True).stream()
        return [HabitDefinition(**doc.to_dict()) for doc in docs]
    except Exception:
        return []

def create_habits_from_definitions(habit_definitions: List[HabitDefinition]) -> List[Habit]:
    """Create habit instances from definitions"""
    habits = []
    for definition in habit_definitions:
        if definition.is_active:
            habit = Habit(
                id=definition.id,
                name=definition.name,
                category=definition.category,
                completed=False,
                notes=None
            )
            habits.append(habit)
    return habits

# ============================================================================
# JOURNAL ENTRY ENDPOINTS
# ============================================================================

@router.get("/health")
async def trading_journal_health_check():
    """Health check for trading journal API"""
    return {"status": "healthy", "service": "trading_journal", "timestamp": datetime.now().isoformat(), "version": "1.1"}

@router.post("/entries", response_model=JournalResponse)
async def create_journal_entry(request: CreateJournalEntryRequest, user: AuthorizedUser):
    """Create a new journal entry"""
    try:
        user_id = user.sub

        if not is_valid_date(request.date):
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        # Check if entry already exists in Firestore
        existing_doc = _journal_col(user_id).document(request.date).get()
        if existing_doc.exists:
            raise HTTPException(status_code=400, detail="Journal entry for this date already exists")
        
        # If no habits provided, use user's habit definitions
        habits = request.habits
        if not habits:
            habit_definitions = load_user_habit_definitions(user_id)
            habits = create_habits_from_definitions(habit_definitions)
        
        # Create journal entry
        journal_entry = JournalEntry(
            date=request.date,
            user_id=user_id,
            mood=request.mood,
            energy_level=request.energy_level,
            market_outlook=request.market_outlook,
            pre_market_notes=request.pre_market_notes,
            post_market_notes=request.post_market_notes,
            post_market_mood=request.post_market_mood,
            lessons_learned=request.lessons_learned,
            habits=habits,
            goals=request.goals,
            daily_intentions=request.daily_intentions,
            challenges=request.challenges,
            wins=request.wins,
            uploaded_file=request.uploaded_file if request.uploaded_file else None,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )

        # Store in Firestore using date as document ID
        _journal_col(user_id).document(request.date).set(journal_entry.dict())
        
        return JournalResponse(
            success=True,
            entry=journal_entry,
            message="Journal entry created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to create journal entry")

@router.get("/entries", response_model=JournalListResponse)
async def get_journal_entries(user: AuthorizedUser, limit: int = 30, offset: int = 0):
    """Get journal entries for user with pagination"""
    try:
        user_id = user.sub
        
        # Use the secure function to get all journal entries
        all_entries = load_user_journal_entries_secure(user_id)
        
        if not all_entries:
            return JournalListResponse(
                success=True,
                entries=[],
                total_count=0,
                message="No journal entries found"
            )
        
        # Sort entries by date in descending order
        sorted_entries = sorted(all_entries, key=lambda x: x.get('date', ''), reverse=True)
        
        # Apply pagination
        paginated_entries = sorted_entries[offset:offset + limit]
        
        # Convert to JournalEntry objects
        entries = []
        for entry_data in paginated_entries:
            try:
                entry = JournalEntry(**entry_data)
                entries.append(entry)
            except Exception as e:
                pass
                continue
        
        return JournalListResponse(
            success=True,
            entries=entries,
            total_count=len(all_entries),
            message=f"Retrieved {len(entries)} journal entries"
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get journal entries")

@router.get("/entries/{entry_date}", response_model=JournalResponse)
async def get_journal_entry_by_date(entry_date: str, user: AuthorizedUser):
    """Get a specific journal entry by date"""
    try:
        user_id = user.sub

        if not is_valid_date(entry_date):
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        doc = _journal_col(user_id).document(entry_date).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Journal entry not found")

        entry_data = doc.to_dict()
        if entry_data.get('user_id') != user_id:
            raise HTTPException(status_code=404, detail="Journal entry not found")

        entry = JournalEntry(**entry_data)
        return JournalResponse(
            success=True,
            entry=entry,
            message="Journal entry retrieved successfully"
        )
                
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get journal entry")

@router.put("/entries/{entry_date}", response_model=JournalResponse)
async def update_journal_entry(entry_date: str, request: UpdateJournalEntryRequest, user: AuthorizedUser):
    """Update an existing journal entry"""
    try:
        user_id = user.sub

        if not is_valid_date(entry_date):
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        doc_ref = _journal_col(user_id).document(entry_date)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Journal entry not found")

        entry_data = doc.to_dict()
        if entry_data.get('user_id') != user_id:
            raise HTTPException(status_code=404, detail="Journal entry not found")

        # Update only provided fields
        updates = {"updated_at": datetime.now().isoformat()}
        if request.mood is not None: updates["mood"] = request.mood
        if request.energy_level is not None: updates["energy_level"] = request.energy_level
        if request.market_outlook is not None: updates["market_outlook"] = request.market_outlook
        if request.pre_market_notes is not None: updates["pre_market_notes"] = request.pre_market_notes
        if request.post_market_notes is not None: updates["post_market_notes"] = request.post_market_notes
        if request.post_market_mood is not None: updates["post_market_mood"] = request.post_market_mood
        if request.lessons_learned is not None: updates["lessons_learned"] = request.lessons_learned
        if request.goals is not None: updates["goals"] = request.goals
        if request.daily_intentions is not None: updates["daily_intentions"] = request.daily_intentions
        if request.challenges is not None: updates["challenges"] = request.challenges
        if request.wins is not None: updates["wins"] = request.wins
        if request.habits is not None: updates["habits"] = [h.dict() for h in request.habits]

        doc_ref.update(updates)
        entry_data.update(updates)
        updated_entry = JournalEntry(**entry_data)
        
        return JournalResponse(
            success=True,
            entry=updated_entry,
            message="Journal entry updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to update journal entry")

@router.delete("/entries/{entry_date}")
async def delete_journal_entry(entry_date: str, user: AuthorizedUser):
    """Delete a journal entry"""
    try:
        user_id = user.sub

        if not is_valid_date(entry_date):
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        doc_ref = _journal_col(user_id).document(entry_date)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Journal entry not found")

        if doc.to_dict().get('user_id') != user_id:
            raise HTTPException(status_code=404, detail="Journal entry not found")

        doc_ref.delete()
        return {"success": True, "message": "Journal entry deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to delete journal entry")

# ============================================================================
# HABIT MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/habits", response_model=HabitResponse)
async def get_habit_definitions(user: AuthorizedUser):
    """Get all habit definitions for the user"""
    try:
        user_id = user.sub
        habit_definitions = load_user_habit_definitions(user_id)
        
        return HabitResponse(
            success=True,
            habits=habit_definitions,
            message=f"Retrieved {len(habit_definitions)} habit definitions"
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get habit definitions")

@router.post("/habits", response_model=HabitResponse)
async def create_habit_definition(request: CreateHabitRequest, user: AuthorizedUser):
    """Create a new habit definition"""
    try:
        user_id = user.sub

        if not request.name.strip():
            raise HTTPException(status_code=400, detail="Habit name cannot be empty")

        if request.category not in ["pre-market", "during-trading", "post-market"]:
            raise HTTPException(status_code=400, detail="Invalid category")

        # Check for duplicates in Firestore
        existing = _habits_col(user_id).where("name", "==", request.name.strip()).where("category", "==", request.category).where("is_active", "==", True).limit(1).get()
        if existing:
            raise HTTPException(status_code=400, detail="Habit with this name and category already exists")

        new_habit = HabitDefinition(
            id=str(uuid.uuid4()),
            name=request.name.strip(),
            category=request.category,
            description=request.description,
            created_at=datetime.now().isoformat(),
            is_active=True
        )

        _habits_col(user_id).document(new_habit.id).set(new_habit.dict())
        
        return HabitResponse(
            success=True,
            habits=[new_habit],
            message="Habit definition created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to create habit definition")

@router.put("/habits/{habit_id}", response_model=HabitResponse)
async def update_habit_definition(habit_id: str, request: UpdateHabitRequest, user: AuthorizedUser):
    """Update an existing habit definition"""
    try:
        user_id = user.sub

        doc_ref = _habits_col(user_id).document(habit_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Habit definition not found")

        updates = {}
        if request.name is not None: updates["name"] = request.name.strip()
        if request.category is not None:
            if request.category not in ["pre-market", "during-trading", "post-market"]:
                raise HTTPException(status_code=400, detail="Invalid category")
            updates["category"] = request.category
        if request.description is not None: updates["description"] = request.description
        if request.is_active is not None: updates["is_active"] = request.is_active

        doc_ref.update(updates)
        updated_habit = HabitDefinition(**{**doc.to_dict(), **updates})
        
        return HabitResponse(
            success=True,
            habits=[updated_habit],
            message="Habit definition updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to update habit definition")

@router.delete("/habits/{habit_id}")
async def delete_habit_definition(habit_id: str, user: AuthorizedUser):
    """Soft delete a habit definition (mark as inactive)"""
    try:
        user_id = user.sub

        doc_ref = _habits_col(user_id).document(habit_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Habit definition not found")

        doc_ref.update({"is_active": False})
        
        return {"success": True, "message": "Habit definition deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to delete habit definition")

# ============================================================================
# MOOD MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/moods", response_model=MoodResponse)
async def get_mood_definitions(user: AuthorizedUser):
    """Get all mood definitions for the user"""
    try:
        user_id = user.sub
        docs = _moods_col(user_id).stream()
        moods = [MoodDefinition(**doc.to_dict()) for doc in docs]
        return MoodResponse(success=True, moods=moods, message=f"Retrieved {len(moods)} mood definitions")
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to get mood definitions")

@router.post("/moods", response_model=MoodResponse)
async def create_mood_definition(request: CreateCustomMoodRequest, user: AuthorizedUser):
    """Create a new mood definition"""
    try:
        user_id = user.sub

        if not request.name.strip():
            raise HTTPException(status_code=400, detail="Mood name cannot be empty")
        if request.category not in ["positive", "negative", "neutral", "custom"]:
            raise HTTPException(status_code=400, detail="Invalid category")

        # Check for duplicates
        existing = _moods_col(user_id).where("name", "==", request.name.strip()).where("category", "==", request.category).limit(1).get()
        if existing:
            raise HTTPException(status_code=400, detail="Mood with this name and category already exists")

        new_mood = MoodDefinition(
            id=str(uuid.uuid4()),
            name=request.name.strip(),
            category=request.category,
            is_predefined=False,
            color=request.color,
            icon=request.icon,
            created_at=datetime.now().isoformat(),
            user_id=user_id
        )
        _moods_col(user_id).document(new_mood.id).set(new_mood.dict())
        return MoodResponse(success=True, moods=[new_mood], message="Mood definition created successfully")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create mood definition")

@router.put("/moods/{mood_id}", response_model=MoodResponse)
async def update_mood_definition(mood_id: str, request: UpdateCustomMoodRequest, user: AuthorizedUser):
    """Update an existing mood definition"""
    try:
        user_id = user.sub

        doc_ref = _moods_col(user_id).document(mood_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Mood definition not found")

        updates = {}
        if request.name is not None: updates["name"] = request.name.strip()
        if request.category is not None:
            if request.category not in ["positive", "negative", "neutral", "custom"]:
                raise HTTPException(status_code=400, detail="Invalid category")
            updates["category"] = request.category
        if request.color is not None: updates["color"] = request.color
        if request.icon is not None: updates["icon"] = request.icon
        if request.is_active is not None: updates["is_active"] = request.is_active

        doc_ref.update(updates)
        updated_mood = MoodDefinition(**{**doc.to_dict(), **updates})
        return MoodResponse(success=True, moods=[updated_mood], message="Mood definition updated successfully")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update mood definition")

@router.delete("/moods/{mood_id}")
async def delete_mood_definition(mood_id: str, user: AuthorizedUser):
    """Soft delete a mood definition (mark as inactive)"""
    try:
        user_id = user.sub
        doc_ref = _moods_col(user_id).document(mood_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Mood definition not found")
        doc_ref.update({"is_active": False})
        return {"success": True, "message": "Mood definition deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to delete mood definition")

# ============================================================================
# STREAK TRACKING ENDPOINTS
# ============================================================================

def calculate_journal_streak(entries: List[Dict], today: date) -> StreakInfo:
    """Calculate journal entry streak"""
    if not entries:
        return StreakInfo(
            streak_type="journal_entry",
            current_streak=0,
            longest_streak=0,
            total_completions=0
        )
    
    # Get all dates with journal entries
    entry_dates = set()
    for entry in entries:
        try:
            entry_date = datetime.fromisoformat(entry['date']).date()
            entry_dates.add(entry_date)
        except (ValueError, KeyError):
            continue
    
    # Calculate current streak (working backwards from today)
    current_streak = 0
    check_date = today
    
    while check_date in entry_dates:
        current_streak += 1
        check_date -= timedelta(days=1)
    
    # Calculate longest streak
    longest_streak = 0
    temp_streak = 0
    all_dates = sorted(entry_dates)
    
    for i, entry_date in enumerate(all_dates):
        if i == 0:
            temp_streak = 1
        else:
            prev_date = all_dates[i - 1]
            if (entry_date - prev_date).days == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
    
    longest_streak = max(longest_streak, temp_streak)
    last_activity = max(entry_dates).isoformat() if entry_dates else None
    
    return StreakInfo(
        streak_type="journal_entry",
        current_streak=current_streak,
        longest_streak=longest_streak,
        last_activity_date=last_activity,
        total_completions=len(entry_dates)
    )

def calculate_habit_category_streak(entries: List[Dict], category: str, today: date) -> StreakInfo:
    """Calculate streak for a specific habit category"""
    completion_dates = set()
    total_completions = 0
    
    for entry in entries:
        try:
            entry_date = datetime.fromisoformat(entry['date']).date()
            habits = entry.get('habits', [])
            
            # Check if all habits in this category are completed
            category_habits = [h for h in habits if h.get('category') == category]
            if category_habits:
                all_completed = all(h.get('completed', False) for h in category_habits)
                if all_completed:
                    completion_dates.add(entry_date)
                    total_completions += 1
        except (ValueError, KeyError):
            continue
    
    # Calculate current streak
    current_streak = 0
    check_date = today
    
    while check_date in completion_dates:
        current_streak += 1
        check_date -= timedelta(days=1)
    
    # Calculate longest streak
    longest_streak = 0
    temp_streak = 0
    all_dates = sorted(completion_dates)
    
    for i, completion_date in enumerate(all_dates):
        if i == 0:
            temp_streak = 1
        else:
            prev_date = all_dates[i - 1]
            if (completion_date - prev_date).days == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
    
    longest_streak = max(longest_streak, temp_streak)
    last_activity = max(completion_dates).isoformat() if completion_dates else None
    
    return StreakInfo(
        streak_type=category.replace('-', '_'),
        current_streak=current_streak,
        longest_streak=longest_streak,
        last_activity_date=last_activity,
        total_completions=total_completions
    )

def load_user_journal_entries_secure(user_id: str) -> List[Dict]:
    """Load all journal entries for a user from Firestore"""
    try:
        docs = _journal_col(user_id).order_by("date", direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]
    except Exception:
        return []

@router.get("/streaks", response_model=StreakResponse)
async def get_streak_data(user: AuthorizedUser, days: int = 90):
    """Get comprehensive streak data including streaks and calendar"""
    try:
        user_id = user.sub
        
        # Load journal entries using secure function
        journal_entries = load_user_journal_entries_secure(user_id)
        
        # Calculate streaks
        today = datetime.now().date()
        streaks = []
        
        # Journal entry streak
        journal_streak = calculate_journal_streak(journal_entries, today)
        streaks.append(journal_streak)
        
        # Habit category streaks
        for category in ["pre-market", "during-trading", "post-market"]:
            habit_streak = calculate_habit_category_streak(journal_entries, category, today)
            streaks.append(habit_streak)
        
        # Generate calendar data for complete months instead of rolling days
        calendar_data = []
        
        # Calculate the date range to cover the specified number of days
        # but extend to complete months
        end_date = today
        temp_start_date = end_date - timedelta(days=days)
        
        # Extend to cover complete months:
        # Start from the 1st day of the month containing temp_start_date
        start_date = temp_start_date.replace(day=1)
        
        # End on the last day of the month containing end_date
        if end_date.month == 12:
            next_month = end_date.replace(year=end_date.year + 1, month=1, day=1)
        else:
            next_month = end_date.replace(month=end_date.month + 1, day=1)
        actual_end_date = next_month - timedelta(days=1)
        
        current_date = start_date
        while current_date <= actual_end_date:
            date_str = current_date.isoformat()
            
            # Check if there's a journal entry for this date
            has_journal = any(e.get('date') == date_str for e in journal_entries)
            
            calendar_data.append(StreakCalendarDay(
                date=date_str,
                has_journal_entry=has_journal,
                pre_market_completion_rate=0.0,  # TODO: Calculate from habits
                during_trading_completion_rate=0.0,
                post_market_completion_rate=0.0,
                overall_completion_rate=1.0 if has_journal else 0.0,
                streak_status="complete" if has_journal else "missed"
            ))
            
            current_date += timedelta(days=1)
        
        # Recovery mode logic
        recovery_mode_active = False
        recovery_days_remaining = 0
        
        return StreakResponse(
            streaks=streaks,
            calendar_data=calendar_data,
            total_journal_days=len(journal_entries),
            recovery_mode_active=recovery_mode_active,
            recovery_days_remaining=recovery_days_remaining
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get streak data")

# ============================================================================
# BEHAVIORAL INSIGHTS ENDPOINTS
# ============================================================================

def analyze_behavioral_patterns(entries: List[Dict], days: int) -> List[BehavioralInsight]:
    """Analyze journal entries to detect behavioral patterns"""
    insights = []
    
    if not entries:
        return insights
    
    # Analyze habit completion patterns
    habit_completion = defaultdict(list)
    mood_trends = []
    
    for entry in entries:
        date = entry.get('date')
        mood = entry.get('mood', '').lower()
        habits = entry.get('habits', [])
        
        if mood:
            mood_trends.append((date, mood))
        
        # Track habit completion
        for habit in habits:
            habit_name = habit.get('name', '')
            completed = habit.get('completed', False)
            if habit_name:
                habit_completion[habit_name].append(completed)
    
    # Generate insights based on patterns
    for habit_name, completions in habit_completion.items():
        if len(completions) >= 3:
            completion_rate = sum(completions) / len(completions)
            
            # Perfect completion recognition
            if completion_rate == 1.0 and len(completions) >= 3:
                insights.append(BehavioralInsight(
                    type="positive",
                    title="Perfect Consistency",
                    message=f"🎯 Outstanding! You've maintained 100% completion on '{habit_name}' for {len(completions)} consecutive days.",
                    confidence=0.9,
                    category="habits"
                ))
            
            # Low completion rate warnings
            elif completion_rate < 0.4:
                insights.append(BehavioralInsight(
                    type="warning",
                    title="Habit Consistency Alert",
                    message=f"⚠️ {habit_name} completion is at {int(completion_rate*100)}% over the last {len(completions)} days.",
                    confidence=0.75,
                    category="habits"
                ))
    
    # Mood pattern analysis
    if len(mood_trends) >= 3:
        recent_moods = [mood for _, mood in mood_trends[-3:]]
        negative_moods = ['frustrated', 'anxious', 'overwhelmed', 'stressed']
        
        if all(mood in negative_moods for mood in recent_moods):
            insights.append(BehavioralInsight(
                type="alert",
                title="Mood Pattern Alert",
                message=f"Pattern detected: 3 consecutive days of challenging moods. Consider reviewing your trading approach.",
                confidence=0.85,
                category="mood"
            ))
    
    return insights

@router.get("/insights", response_model=BehavioralInsightsResponse)
async def get_behavioral_insights(user: AuthorizedUser, days: int = 30):
    """Get behavioral insights based on journal entries"""
    try:
        user_id = user.sub

        # Get current active habit definitions
        habit_definitions_response = await get_habit_definitions(user)
        active_habit_names = set()
        if habit_definitions_response.success:
            active_habit_names = {habit.name for habit in habit_definitions_response.habits if habit.is_active}
        
        pass

        # Load recent journal entries
        recent_entries = []
        journal_entries = load_user_journal_entries_secure(user_id)
        
        # Filter journal entries to only include active habits
        for entry in journal_entries:
            filtered_entry = entry.copy()
            if 'habits' in filtered_entry:
                # Only include habits that are currently active
                filtered_habits = [
                    habit for habit in filtered_entry['habits'] 
                    if habit.get('name') in active_habit_names
                ]
                filtered_entry['habits'] = filtered_habits
            recent_entries.append(filtered_entry)
        
        pass

        # Load habit analytics for comprehensive insights
        habit_analytics = calculate_comprehensive_habit_analytics(recent_entries)
        
        # Generate comprehensive insights using new library
        insights = generate_comprehensive_behavioral_insights(
            recent_entries, 
            habit_analytics, 
            days
        )
        
        # Calculate basic streak data using unified library
        today = datetime.now().date()
        journal_streak = unified_journal_streak(recent_entries, today)
        
        streak_data = {
            "current_streak": journal_streak.current_streak,
            "longest_streak": journal_streak.longest_streak,
            "total_entries": len(recent_entries)
        }
        
        # Calculate consistency score
        consistency_score = min(100, int((len(recent_entries) / days) * 100))
        
        return BehavioralInsightsResponse(
            insights=insights,
            streak_data=streak_data,
            consistency_score=consistency_score
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get behavioral insights")

# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_journal_analytics(user: AuthorizedUser, days: int = 30):
    """Get comprehensive journal analytics including trading performance"""
    try:
        user_id = user.sub
        
        # Load journal entries
        journal_entries = load_user_journal_entries_secure(user_id)
        
        # Filter to last N days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        recent_entries = []
        total_pnl = 0.0
        trading_days = 0
        file_analysis_data = []
        
        for entry in journal_entries:
            try:
                entry_date = datetime.fromisoformat(entry.get('date', ''))
                if start_date <= entry_date <= end_date:
                    recent_entries.append(entry)
                    
                    # Extract P&L data from file analysis if available
                    file_analysis = entry.get('file_analysis')
                    if file_analysis and file_analysis.get('file_processed') and file_analysis.get('total_pnl') is not None:
                        pnl = file_analysis.get('total_pnl', 0)
                        total_pnl += pnl
                        trading_days += 1
                        file_analysis_data.append({
                            'date': entry.get('date'),
                            'pnl': pnl,
                            'calculation_method': file_analysis.get('calculation_method', 'unknown'),
                            'details': file_analysis.get('details', {})
                        })
                        
            except Exception:
                continue

        # Calculate analytics
        total_entries = len(recent_entries)
        
        # Streak calculations
        today = datetime.now().date()
        journal_streak = calculate_journal_streak(recent_entries, today)
        current_streak = journal_streak.current_streak
        longest_streak = journal_streak.longest_streak
        
        # Mood analysis
        moods = [entry.get('mood') for entry in recent_entries if entry.get('mood')]
        mood_scores = []
        for mood in moods:
            # Simple mood scoring
            if mood in ['excited', 'confident', 'optimistic']:
                mood_scores.append(5)
            elif mood in ['focused', 'calm', 'neutral']:
                mood_scores.append(4)
            elif mood in ['tired', 'uncertain']:
                mood_scores.append(3)
            elif mood in ['frustrated', 'anxious']:
                mood_scores.append(2)
            elif mood in ['overwhelmed', 'stressed']:
                mood_scores.append(1)
        
        avg_mood_score = sum(mood_scores) / len(mood_scores) if mood_scores else 0
        
        # Energy level analysis
        energy_levels = [entry.get('energy_level') for entry in recent_entries if entry.get('energy_level')]
        avg_energy_level = sum(energy_levels) / len(energy_levels) if energy_levels else 0
        
        # Habit completion rates
        habit_completion_rates = {}
        habit_stats = defaultdict(lambda: {'completed': 0, 'total': 0})
        
        for entry in recent_entries:
            habits = entry.get('habits', [])
            for habit in habits:
                habit_name = habit.get('name', '')
                if habit_name:
                    habit_stats[habit_name]['total'] += 1
                    if habit.get('completed', False):
                        habit_stats[habit_name]['completed'] += 1
        
        for habit_name, stats in habit_stats.items():
            if stats['total'] > 0:
                habit_completion_rates[habit_name] = (stats['completed'] / stats['total']) * 100
        
        # Find most consistent habit
        most_consistent_habit = None
        if habit_completion_rates:
            most_consistent_habit = max(habit_completion_rates.items(), key=lambda x: x[1])[0]
        
        # Identify improvement areas
        improvement_areas = []
        for habit_name, rate in habit_completion_rates.items():
            if rate < 70:  # Less than 70% completion
                improvement_areas.append(habit_name)
        
        # Build trading performance metrics
        trading_performance = None
        if file_analysis_data:
            profitable_days = len([data for data in file_analysis_data if data['pnl'] > 0])
            losing_days = len([data for data in file_analysis_data if data['pnl'] < 0])
            
            trading_performance = {
                'total_pnl': round(total_pnl, 2),
                'trading_days': trading_days,
                'avg_daily_pnl': round(total_pnl / trading_days, 2) if trading_days > 0 else 0,
                'profitable_days': profitable_days,
                'losing_days': losing_days,
                'win_rate': round((profitable_days / trading_days * 100), 2) if trading_days > 0 else 0,
                'best_day': max([data['pnl']for data in file_analysis_data], default=0),
                'worst_day': min([data['pnl'] for data in file_analysis_data], default=0),
                'calculation_method': 'Round-trip matching (FIFO) for futures contracts'
            }
        
        return AnalyticsResponse(
            total_entries=total_entries,
            current_streak=current_streak,
            longest_streak=longest_streak,
            avg_mood_score=round(avg_mood_score, 2),
            avg_energy_level=round(avg_energy_level, 2),
            habit_completion_rates=habit_completion_rates,
            most_consistent_habit=most_consistent_habit,
            improvement_areas=improvement_areas,
            trading_performance=trading_performance
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get journal analytics")

# ============================================================================
# MIGRATION ENDPOINTS
# ============================================================================

@router.post("/migrate-habits")
async def migrate_habits_from_journals(user: AuthorizedUser):
    """One-time migration to extract habit definitions from existing journal entries"""
    try:
        user_id = user.sub

        # Check if habits already exist in Firestore
        existing = list(_habits_col(user_id).limit(1).stream())
        if existing:
            return {"success": True, "message": "Habits already migrated"}

        journal_entries = load_user_journal_entries_secure(user_id)
        unique_habits = set()
        for entry in journal_entries:
            for habit in entry.get('habits', []):
                name = habit.get('name', '')
                category = habit.get('category', 'pre-market')
                if name and category:
                    unique_habits.add((name, category))

        batch = _db().batch()
        count = 0
        for habit_name, habit_category in unique_habits:
            habit_def = HabitDefinition(
                id=str(uuid.uuid4()),
                name=habit_name,
                category=habit_category,
                created_at="migrated_from_journals",
                is_active=True
            )
            doc_ref = _habits_col(user_id).document(habit_def.id)
            batch.set(doc_ref, habit_def.dict())
            count += 1

        if count:
            batch.commit()

        return {"success": True, "message": f"Migrated {count} habits from journal entries"}
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to migrate habits")

# ============================================================================
# FUTURES TRADE ANALYSIS FUNCTIONS
# ============================================================================

def calculate_futures_pnl_netting(df: pd.DataFrame, prop_firm: str = "custom") -> Dict[str, Any]:
    """Calculate P&L for futures trades using proper NETTING logic (not hedging/FIFO)
    
    Futures prop firms use netting, where all buys and sells accumulate into a net position.
    P&L is calculated based on the weighted average entry price and only realized when
    the position size is reduced (not when individual orders are matched).
    
    This is fundamentally different from CFD hedging logic and matches how
    real futures prop firms calculate P&L.
    
    Args:
        df: DataFrame with trade data
        prop_firm: Prop firm identifier for commission calculation
    """
    from app.libs.prop_firm_commissions import PropFirmCommissions
    
    filled_orders = df[df['Status'].str.strip() == 'Filled'].copy()
    
    if filled_orders.empty:
        return {
            "total_pnl": 0.0, 
            "gross_pnl": 0.0, 
            "total_commissions": 0.0, 
            "details": {}, 
            "open_positions": {},
            "calculation_method": "Netting Logic",
            "prop_firm": prop_firm
        }
    
    filled_orders['timestamp'] = pd.to_datetime(filled_orders['Fill Time'])
    
    symbol_results = {}
    total_gross_pnl = 0.0
    total_commissions = 0.0
    open_positions = {}
    
    # Process each symbol separately using netting logic
    for symbol, symbol_orders in filled_orders.groupby('Product'):  # Changed from 'Instrument' to 'Product'
        symbol_orders = symbol_orders.sort_values('timestamp')
        
        # Get contract specifications - use default multiplier since futures_parser was removed
        multiplier = 1.0  # Default multiplier, can be enhanced later if needed
        
        # Netting state variables
        net_position = 0.0  # Current net position (+ = long, - = short)
        weighted_avg_price = 0.0  # Weighted average entry price
        total_cost_basis = 0.0  # Total cost basis of position
        realized_pnl = 0.0
        symbol_commissions = 0.0
        trades = []
        
        # Process orders chronologically to update net position
        for _, order in symbol_orders.iterrows():
            side = order['B/S'].strip()  # Changed from 'Side' to 'B/S'
            qty = order['filledQty']
            price = order['avgPrice']
            timestamp = order['timestamp']
            
            # Calculate commission for this order
            order_commission = PropFirmCommissions.calculate_commission_cost(prop_firm, symbol, qty)
            symbol_commissions += order_commission
            
            # Convert to signed quantity (+ = buy, - = sell)
            signed_qty = qty if side == 'Buy' else -qty
            
            # Calculate position before this trade
            old_position = net_position
            old_avg_price = weighted_avg_price
            
            # Calculate new position after this trade
            new_position = old_position + signed_qty
            
            # Determine if this trade closes some of the position (realizes P&L)
            if old_position != 0 and (
                (old_position > 0 and signed_qty < 0) or  # Long position, selling
                (old_position < 0 and signed_qty > 0)     # Short position, buying
            ):
                # This trade closes part or all of the position
                close_qty = min(abs(signed_qty), abs(old_position))
                
                if old_position > 0:  # Closing long position
                    pnl_per_contract = price - old_avg_price
                else:  # Closing short position
                    pnl_per_contract = old_avg_price - price
                
                # Calculate realized P&L for the closed portion (multiply by contract multiplier)
                trade_pnl = pnl_per_contract * close_qty * multiplier
                realized_pnl += trade_pnl
                
                trades.append({
                    'timestamp': timestamp,
                    'type': 'position_close',
                    'quantity_closed': close_qty,
                    'avg_entry_price': old_avg_price,
                    'exit_price': price,
                    'pnl_per_contract': pnl_per_contract,
                    'realized_pnl': trade_pnl,
                    'remaining_position': new_position
                })
            
            # Update weighted average price for remaining/new position
            if new_position == 0:
                # Position fully closed
                weighted_avg_price = 0.0
                total_cost_basis = 0.0
            elif (old_position >= 0 and new_position > 0) or (old_position <= 0 and new_position < 0):
                # Adding to existing position or opening new position in same direction
                if old_position == 0:
                    # Opening new position
                    weighted_avg_price = price
                    total_cost_basis = abs(new_position) * price
                else:
                    # Adding to existing position - calculate new weighted average
                    old_cost_basis = abs(old_position) * old_avg_price
                    new_cost = abs(signed_qty) * price
                    total_cost_basis = old_cost_basis + new_cost
                    weighted_avg_price = total_cost_basis / abs(new_position)
            else:
                # Position changed direction after partial close
                if abs(new_position) > 0:
                    weighted_avg_price = price
                    total_cost_basis = abs(new_position) * price
            
            # Update net position
            net_position = new_position
        
        # Store symbol results
        symbol_results[symbol] = {
            'contract_name': f'{symbol} Futures',
            'multiplier': multiplier,
            'realized_pnl': realized_pnl,
            'symbol_commissions': symbol_commissions,
            'net_pnl': realized_pnl - symbol_commissions,
            'open_position': net_position,
            'weighted_avg_price': weighted_avg_price,
            'trades_count': len(trades),
            'total_orders': len(symbol_orders),
            'commission_rate': PropFirmCommissions.get_commission_rate(prop_firm, symbol)
        }
        
        total_gross_pnl += realized_pnl
        total_commissions += symbol_commissions
        
        # Track open positions
        if net_position != 0:
            open_positions[symbol] = {
                'position': net_position,
                'avg_price': weighted_avg_price,
                'market_value': abs(net_position) * weighted_avg_price
            }
    
    # Get prop firm name for display
    prop_firm_info = PropFirmCommissions.get_prop_firm_info(prop_firm)
    prop_firm_name = prop_firm_info["name"] if prop_firm_info else "Custom"
    
    return {
        'total_pnl': total_gross_pnl - total_commissions,  # Net P&L
        'gross_pnl': total_gross_pnl,
        'total_commissions': total_commissions,
        'details': symbol_results,
        'open_positions': open_positions,
        'calculation_method': f'Netting Logic with {prop_firm_name} commissions',
        'prop_firm': prop_firm
    }

# ============================================================================
# UNIFIED UPSERT ENDPOINT - SOLVES CREATE VS UPDATE CONFUSION
# ============================================================================

@router.post("/save-entry", response_model=JournalResponse)
async def save_journal_entry(request: CreateJournalEntryRequest, user: AuthorizedUser):
    """Unified save endpoint - creates new entry or updates existing one (upsert pattern)"""
    try:
        user_id = user.sub

        if not is_valid_date(request.date):
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        doc_ref = _journal_col(user_id).document(request.date)
        existing_doc = doc_ref.get()
        current_time = datetime.now().isoformat()
        existing_entry = existing_doc.to_dict() if existing_doc.exists else None

        if existing_entry:
            # UPDATE MODE: Merge with existing data
            pass
            
            # Ensure user_id matches for security
            if existing_entry.get('user_id') != user_id:
                raise HTTPException(status_code=403, detail="Access denied")
            
            # Preserve created_at from existing entry
            created_at = existing_entry.get('created_at', current_time)
            
            # Update only provided fields, keep existing data for None values
            entry_data = {
                'date': request.date,
                'user_id': user_id,
                'mood': request.mood if request.mood is not None else existing_entry.get('mood'),
                'energy_level': request.energy_level if request.energy_level is not None else existing_entry.get('energy_level'),
                'market_outlook': request.market_outlook if request.market_outlook is not None else existing_entry.get('market_outlook'),
                'post_market_outlook': getattr(request, 'post_market_outlook', None)if getattr(request, 'post_market_outlook', None) is not None else existing_entry.get('post_market_outlook'),
                'pre_market_notes': request.pre_market_notes if request.pre_market_notes is not None else existing_entry.get('pre_market_notes'),
                'post_market_notes': request.post_market_notes if request.post_market_notes is not None else existing_entry.get('post_market_notes'),
                'post_market_mood': request.post_market_mood if request.post_market_mood is not None else existing_entry.get('post_market_mood'),
                'lessons_learned': request.lessons_learned if request.lessons_learned is not None else existing_entry.get('lessons_learned'),
                'goals': request.goals if request.goals is not None else existing_entry.get('goals'),
                'daily_intentions': request.daily_intentions if request.daily_intentions is not None else existing_entry.get('daily_intentions'),
                'challenges': request.challenges if request.challenges is not None else existing_entry.get('challenges'),
                'wins': request.wins if request.wins is not None else existing_entry.get('wins'),
                'uploaded_file': request.uploaded_file if request.uploaded_file is not None else existing_entry.get('uploaded_file'),
                'file_analysis': existing_entry.get('file_analysis'),  # Preserve file analysis
                'created_at': created_at,
                'updated_at': current_time
            }
            
            # Handle habits: merge new habits with existing ones
            if request.habits:
                # Use provided habits
                entry_data['habits'] = [habit.dict() for habit in request.habits]
            else:
                # Keep existing habits or use user's habit definitions
                existing_habits = existing_entry.get('habits', [])
                if existing_habits:
                    entry_data['habits'] = existing_habits
                else:
                    # Load user's habit definitions and create default habits
                    habit_definitions = load_user_habit_definitions(user_id)
                    default_habits = create_habits_from_definitions(habit_definitions)
                    entry_data['habits'] = [habit.dict() for habit in default_habits]
            
            operation = "updated"
            
        else:
            # CREATE MODE: Create new entry
            pass
            
            # If no habits provided, use user's habit definitions
            habits = request.habits
            if not habits:
                habit_definitions = load_user_habit_definitions(user_id)
                habits = create_habits_from_definitions(habit_definitions)
            
            # Create new journal entry
            entry_data = {
                'date': request.date,
                'user_id': user_id,
                'mood': request.mood,
                'energy_level': request.energy_level,
                'market_outlook': request.market_outlook,
                'post_market_outlook': request.post_market_outlook,
                'pre_market_notes': request.pre_market_notes,
                'post_market_notes': request.post_market_notes,
                'post_market_mood': request.post_market_mood,
                'lessons_learned': request.lessons_learned,
                'habits': [habit.dict() for habit in habits],
                'goals': request.goals,
                'daily_intentions': request.daily_intentions,
                'challenges': request.challenges,
                'wins': request.wins,
                'uploaded_file': request.uploaded_file,
                'file_analysis': None,
                'created_at': current_time,
                'updated_at': current_time
            }
            
            operation = "created"
        
        # Upsert to Firestore
        doc_ref.set(entry_data)

        journal_entry = JournalEntry(**entry_data)
        
        return JournalResponse(
            success=True,
            entry=journal_entry,
            message=f"Journal entry {operation} successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to save journal entry")

# ============================================================================
# FUTURES TRADE ANALYSIS FUNCTIONS
# ============================================================================

def calculate_futures_pnl_netting(df: pd.DataFrame, prop_firm: str = "custom") -> Dict[str, Any]:
    """Calculate P&L for futures trades using proper NETTING logic (not hedging/FIFO)
    
    Futures prop firms use netting, where all buys and sells accumulate into a net position.
    P&L is calculated based on the weighted average entry price and only realized when
    the position size is reduced (not when individual orders are matched).
    
    This is fundamentally different from CFD hedging logic and matches how
    real futures prop firms calculate P&L.
    
    Args:
        df: DataFrame with trade data
        prop_firm: Prop firm identifier for commission calculation
    """
    from app.libs.prop_firm_commissions import PropFirmCommissions
    
    filled_orders = df[df['Status'].str.strip() == 'Filled'].copy()
    
    if filled_orders.empty:
        return {
            "total_pnl": 0.0, 
            "gross_pnl": 0.0, 
            "total_commissions": 0.0, 
            "details": {}, 
            "open_positions": {},
            "calculation_method": "Netting Logic",
            "prop_firm": prop_firm
        }
    
    filled_orders['timestamp'] = pd.to_datetime(filled_orders['Fill Time'])
    
    symbol_results = {}
    total_gross_pnl = 0.0
    total_commissions = 0.0
    open_positions = {}
    
    # Process each symbol separately using netting logic
    for symbol, symbol_orders in filled_orders.groupby('Product'):  # Changed from 'Instrument' to 'Product'
        symbol_orders = symbol_orders.sort_values('timestamp')
        
        # Get contract specifications - use default multiplier since futures_parser was removed
        multiplier = 1.0  # Default multiplier, can be enhanced later if needed
        
        # Netting state variables
        net_position = 0.0  # Current net position (+ = long, - = short)
        weighted_avg_price = 0.0  # Weighted average entry price
        total_cost_basis = 0.0  # Total cost basis of position
        realized_pnl = 0.0
        symbol_commissions = 0.0
        trades = []
        
        # Process orders chronologically to update net position
        for _, order in symbol_orders.iterrows():
            side = order['B/S'].strip()  # Changed from 'Side' to 'B/S'
            qty = order['filledQty']
            price = order['avgPrice']
            timestamp = order['timestamp']
            
            # Calculate commission for this order
            order_commission = PropFirmCommissions.calculate_commission_cost(prop_firm, symbol, qty)
            symbol_commissions += order_commission
            
            # Convert to signed quantity (+ = buy, - = sell)
            signed_qty = qty if side == 'Buy' else -qty
            
            # Calculate position before this trade
            old_position = net_position
            old_avg_price = weighted_avg_price
            
            # Calculate new position after this trade
            new_position = old_position + signed_qty
            
            # Determine if this trade closes some of the position (realizes P&L)
            if old_position != 0 and (
                (old_position > 0 and signed_qty < 0) or  # Long position, selling
                (old_position < 0 and signed_qty > 0)     # Short position, buying
            ):
                # This trade closes part or all of the position
                close_qty = min(abs(signed_qty), abs(old_position))
                
                if old_position > 0:  # Closing long position
                    pnl_per_contract = price - old_avg_price
                else:  # Closing short position
                    pnl_per_contract = old_avg_price - price
                
                # Calculate realized P&L for the closed portion (multiply by contract multiplier)
                trade_pnl = pnl_per_contract * close_qty * multiplier
                realized_pnl += trade_pnl
                
                trades.append({
                    'timestamp': timestamp,
                    'type': 'position_close',
                    'quantity_closed': close_qty,
                    'avg_entry_price': old_avg_price,
                    'exit_price': price,
                    'pnl_per_contract': pnl_per_contract,
                    'realized_pnl': trade_pnl,
                    'remaining_position': new_position
                })
            
            # Update weighted average price for remaining/new position
            if new_position == 0:
                # Position fully closed
                weighted_avg_price = 0.0
                total_cost_basis = 0.0
            elif (old_position >= 0 and new_position > 0) or (old_position <= 0 and new_position < 0):
                # Adding to existing position or opening new position in same direction
                if old_position == 0:
                    # Opening new position
                    weighted_avg_price = price
                    total_cost_basis = abs(new_position) * price
                else:
                    # Adding to existing position - calculate new weighted average
                    old_cost_basis = abs(old_position) * old_avg_price
                    new_cost = abs(signed_qty) * price
                    total_cost_basis = old_cost_basis + new_cost
                    weighted_avg_price = total_cost_basis / abs(new_position)
            else:
                # Position changed direction after partial close
                if abs(new_position) > 0:
                    weighted_avg_price = price
                    total_cost_basis = abs(new_position) * price
            
            # Update net position
            net_position = new_position
        
        # Store symbol results
        symbol_results[symbol] = {
            'contract_name': f'{symbol} Futures',
            'multiplier': multiplier,
            'realized_pnl': realized_pnl,
            'symbol_commissions': symbol_commissions,
            'net_pnl': realized_pnl - symbol_commissions,
            'open_position': net_position,
            'weighted_avg_price': weighted_avg_price,
            'trades_count': len(trades),
            'total_orders': len(symbol_orders),
            'commission_rate': PropFirmCommissions.get_commission_rate(prop_firm, symbol)
        }
        
        total_gross_pnl += realized_pnl
        total_commissions += symbol_commissions
        
        # Track open positions
        if net_position != 0:
            open_positions[symbol] = {
                'position': net_position,
                'avg_price': weighted_avg_price,
                'market_value': abs(net_position) * weighted_avg_price
            }
    
    # Get prop firm name for display
    prop_firm_info = PropFirmCommissions.get_prop_firm_info(prop_firm)
    prop_firm_name = prop_firm_info["name"] if prop_firm_info else "Custom"
    
    return {
        'total_pnl': total_gross_pnl - total_commissions,  # Net P&L
        'gross_pnl': total_gross_pnl,
        'total_commissions': total_commissions,
        'details': symbol_results,
        'open_positions': open_positions,
        'calculation_method': f'Netting Logic with {prop_firm_name} commissions',
        'prop_firm': prop_firm
    }
