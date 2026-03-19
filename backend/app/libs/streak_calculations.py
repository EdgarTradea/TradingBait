from typing import List, Dict, Any, Optional, Set, Tuple
from datetime import datetime, date, timedelta
from pydantic import BaseModel
from collections import defaultdict, Counter

# ============================================================================
# STREAK & JOURNAL DATA CONTRACTS
# ============================================================================

class StreakInfo(BaseModel):
    """Standardized streak information"""
    streak_type: str  # 'journal_entry', 'habit_category', 'individual_habit', 'trading_activity'
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[str] = None
    total_completions: int = 0
    streak_details: Dict[str, Any] = {}

class HabitDefinition(BaseModel):
    """Standardized habit definition"""
    name: str
    category: str
    description: Optional[str] = None
    target_frequency: str = "daily"  # 'daily', 'weekly', 'custom'
    is_active: bool = True
    created_date: Optional[str] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'HabitDefinition':
        """Create HabitDefinition from various input formats"""
        return cls(
            name=data.get('name', ''),
            category=data.get('category', 'general'),
            description=data.get('description'),
            target_frequency=data.get('target_frequency', 'daily'),
            is_active=data.get('is_active', True),
            created_date=data.get('created_date')
        )

class JournalEntryData(BaseModel):
    """Standardized journal entry data"""
    date: str
    mood: Optional[str] = None
    energy: Optional[str] = None
    confidence: Optional[str] = None
    notes: Optional[str] = None
    habits: List[Dict[str, Any]] = []
    trading_notes: Optional[str] = None
    lessons_learned: Optional[str] = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'JournalEntryData':
        """Create JournalEntryData from various input formats"""
        return cls(
            date=data.get('date', ''),
            mood=data.get('mood'),
            energy=data.get('energy'),
            confidence=data.get('confidence'),
            notes=data.get('notes'),
            habits=data.get('habits', []),
            trading_notes=data.get('trading_notes'),
            lessons_learned=data.get('lessons_learned')
        )

class CalendarData(BaseModel):
    """Calendar view data for habits and activities"""
    date: str
    journal_entry: bool = False
    habits_completed: int = 0
    habits_total: int = 0
    completion_rate: float = 0.0
    mood_score: Optional[float] = None
    trading_activity: bool = False
    streak_status: Dict[str, bool] = {}

class BehavioralMetrics(BaseModel):
    """Behavioral analysis metrics"""
    journal_consistency: float = 0.0  # 0-100 score
    habit_adherence: float = 0.0  # 0-100 score
    habit_categories_tracked: int = 0
    most_consistent_habit: Optional[str] = None
    least_consistent_habit: Optional[str] = None
    improvement_trends: List[str] = []
    behavioral_insights: List[str] = []

class ComprehensiveStreakData(BaseModel):
    """Complete streak and behavioral data package"""
    journal_streak: StreakInfo
    habit_streaks: List[StreakInfo]
    category_streaks: List[StreakInfo]
    calendar_data: List[CalendarData]
    behavioral_metrics: BehavioralMetrics
    analysis_period: Dict[str, str]
    data_quality_score: float = 0.0

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def parse_date_flexible(date_str: str) -> Optional[date]:
    """Parse date string with multiple format support"""
    if not date_str:
        return None
    
    formats = [
        '%Y-%m-%d',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%S.%f',
        '%Y-%m-%d %H:%M:%S',
        '%m/%d/%Y',
        '%d/%m/%Y'
    ]
    
    # Clean the date string
    clean_date = date_str.split('T')[0]  # Remove time part if present
    
    for fmt in formats:
        try:
            return datetime.strptime(clean_date, fmt).date()
        except ValueError:
            continue
    
    pass
    return None

def get_date_range(start_date: date, end_date: date) -> List[date]:
    """Generate list of dates between start and end (inclusive)"""
    dates = []
    current = start_date
    while current <= end_date:
        dates.append(current)
        current += timedelta(days=1)
    return dates

def calculate_completion_rate(completed: int, total: int) -> float:
    """Calculate completion rate as percentage"""
    if total == 0:
        return 0.0
    return round((completed / total) * 100, 1)

# ============================================================================
# JOURNAL STREAK CALCULATIONS
# ============================================================================

def calculate_journal_streak(entries: List[Dict[str, Any]], today: Optional[date] = None) -> StreakInfo:
    """Calculate journal entry streak - only counting meaningful entries with content"""
    if today is None:
        today = date.today()
    
    if not entries:
        return StreakInfo(
            streak_type="journal_entry",
            current_streak=0,
            longest_streak=0,
            total_completions=0
        )
    
    # Filter to only meaningful journal entries (with content or completed habits)
    meaningful_entries = []
    for entry in entries:
        has_mood = entry.get('mood') and str(entry.get('mood')).strip() != ''
        has_notes = (
            (entry.get('pre_market_notes') and str(entry.get('pre_market_notes')).strip() != '') or
            (entry.get('post_market_notes') and str(entry.get('post_market_notes')).strip() != '') or
            (entry.get('lessons_learned') and str(entry.get('lessons_learned')).strip() != '')
        )
        has_completed_habits = any(
            habit.get('completed', False) for habit in entry.get('habits', [])
        )
        
        # Only count entries with meaningful content
        if has_mood or has_notes or has_completed_habits:
            meaningful_entries.append(entry)
    
    # Parse and collect dates from meaningful entries only
    entry_dates = set()
    for entry in meaningful_entries:
        entry_date = parse_date_flexible(entry.get('date', ''))
        if entry_date:
            entry_dates.add(entry_date)
    
    if not entry_dates:
        return StreakInfo(
            streak_type="journal_entry",
            current_streak=0,
            longest_streak=0,
            total_completions=0
        )
    
    # Calculate current streak (working backwards from today)
    current_streak = 0
    check_date = today
    
    while check_date in entry_dates:
        current_streak += 1
        check_date -= timedelta(days=1)
    
    # Calculate longest streak
    longest_streak = calculate_longest_streak(sorted(entry_dates))
    
    # Get last activity date
    last_activity = max(entry_dates).isoformat() if entry_dates else None
    
    return StreakInfo(
        streak_type="journal_entry",
        current_streak=current_streak,
        longest_streak=longest_streak,
        last_activity_date=last_activity,
        total_completions=len(entry_dates),
        streak_details={
            "total_entries": len(entries),
            "meaningful_entries": len(meaningful_entries),
            "unique_days": len(entry_dates),
            "consistency_rate": calculate_completion_rate(len(entry_dates), len(entries))
        }
    )

def calculate_longest_streak(sorted_dates: List[date]) -> int:
    """Calculate longest consecutive streak from sorted dates"""
    if not sorted_dates:
        return 0
    
    longest_streak = 1
    current_streak = 1
    
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
            current_streak += 1
            longest_streak = max(longest_streak, current_streak)
        else:
            current_streak = 1
    
    return longest_streak

# ============================================================================
# HABIT STREAK CALCULATIONS
# ============================================================================

def calculate_habit_streaks(
    entries: List[Dict[str, Any]], 
    habit_definitions: List[Dict[str, Any]],
    today: Optional[date] = None
) -> List[StreakInfo]:
    """Calculate streaks for individual habits"""
    if today is None:
        today = date.today()
    
    habit_streaks = []
    
    # Group habit completions by habit name
    habit_completions = defaultdict(set)
    
    for entry in entries:
        entry_date = parse_date_flexible(entry.get('date', ''))
        if entry_date:
            habits = entry.get('habits', [])
            for habit in habits:
                habit_name = habit.get('name') or habit.get('label', '')
                completed = habit.get('completed', False)
                
                if habit_name and completed:
                    habit_completions[habit_name].add(entry_date)
    
    # Calculate streaks for each habit
    for habit_def in habit_definitions:
        habit_name = habit_def.get('name', '')
        if not habit_name:
            continue
        
        completion_dates = habit_completions.get(habit_name, set())
        
        # Calculate current streak
        current_streak = 0
        check_date = today
        
        while check_date in completion_dates:
            current_streak += 1
            check_date -= timedelta(days=1)
        
        # Calculate longest streak
        longest_streak = calculate_longest_streak(sorted(completion_dates)) if completion_dates else 0
        
        # Get last activity
        last_activity = max(completion_dates).isoformat() if completion_dates else None
        
        habit_streaks.append(StreakInfo(
            streak_type="individual_habit",
            current_streak=current_streak,
            longest_streak=longest_streak,
            last_activity_date=last_activity,
            total_completions=len(completion_dates),
            streak_details={
                "habit_name": habit_name,
                "category": habit_def.get('category', 'general'),
                "target_frequency": habit_def.get('target_frequency', 'daily')
            }
        ))
    
    return habit_streaks

def calculate_category_streaks(
    entries: List[Dict[str, Any]], 
    today: Optional[date] = None
) -> List[StreakInfo]:
    """Calculate streaks for habit categories"""
    if today is None:
        today = date.today()
    
    category_streaks = []
    
    # Group habits by category and date
    daily_category_completion = defaultdict(lambda: defaultdict(list))
    
    for entry in entries:
        entry_date = parse_date_flexible(entry.get('date', ''))
        if entry_date:
            habits = entry.get('habits', [])
            for habit in habits:
                category = habit.get('category', 'general')
                completed = habit.get('completed', False)
                daily_category_completion[category][entry_date].append(completed)
    
    # Calculate streaks for each category
    for category, date_completions in daily_category_completion.items():
        completion_dates = set()
        
        # A category is "completed" if all habits in that category are completed for the day
        for date_str, completions in date_completions.items():
            if completions and all(completions):  # All habits completed
                completion_dates.add(date_str)
        
        # Calculate current streak
        current_streak = 0
        check_date = today
        
        while check_date in completion_dates:
            current_streak += 1
            check_date -= timedelta(days=1)
        
        # Calculate longest streak
        longest_streak = calculate_longest_streak(sorted(completion_dates)) if completion_dates else 0
        
        # Get last activity
        last_activity = max(completion_dates).isoformat() if completion_dates else None
        
        category_streaks.append(StreakInfo(
            streak_type="habit_category",
            current_streak=current_streak,
            longest_streak=longest_streak,
            last_activity_date=last_activity,
            total_completions=len(completion_dates),
            streak_details={
                "category_name": category,
                "total_habit_days": len(date_completions),
                "completion_rate": calculate_completion_rate(len(completion_dates), len(date_completions))
            }
        ))
    
    return category_streaks

# ============================================================================
# CALENDAR DATA GENERATION
# ============================================================================

def generate_calendar_data(
    entries: List[Dict[str, Any]], 
    start_date: date, 
    end_date: date
) -> List[CalendarData]:
    """Generate calendar view data for the specified date range"""
    calendar_data = []
    
    # Create lookup for journal entries by date
    entries_by_date = {}
    for entry in entries:
        entry_date = parse_date_flexible(entry.get('date', ''))
        if entry_date:
            entries_by_date[entry_date] = entry
    
    # Generate data for each day in range
    for current_date in get_date_range(start_date, end_date):
        entry = entries_by_date.get(current_date)
        
        if entry:
            habits = entry.get('habits', [])
            habits_completed = sum(1 for h in habits if h.get('completed', False))
            habits_total = len(habits)
            completion_rate = calculate_completion_rate(habits_completed, habits_total)
            
            # Convert mood to numeric score if available
            mood_score = None
            mood = entry.get('mood')
            if mood:
                mood_score = convert_mood_to_score(mood)
            
            calendar_data.append(CalendarData(
                date=current_date.isoformat(),
                journal_entry=True,
                habits_completed=habits_completed,
                habits_total=habits_total,
                completion_rate=completion_rate,
                mood_score=mood_score,
                trading_activity=bool(entry.get('trading_notes')),
                streak_status={
                    "has_entry": True,
                    "habits_complete": completion_rate == 100.0
                }
            ))
        else:
            calendar_data.append(CalendarData(
                date=current_date.isoformat(),
                journal_entry=False,
                habits_completed=0,
                habits_total=0,
                completion_rate=0.0,
                trading_activity=False,
                streak_status={
                    "has_entry": False,
                    "habits_complete": False
                }
            ))
    
    return calendar_data

def convert_mood_to_score(mood: str) -> Optional[float]:
    """Convert mood string to numeric score (1-5 scale)"""
    mood_lower = mood.lower().strip()
    
    mood_mapping = {
        'very_low': 1.0, 'very low': 1.0, 'terrible': 1.0, 'awful': 1.0,
        'low': 2.0, 'bad': 2.0, 'poor': 2.0,
        'neutral': 3.0, 'okay': 3.0, 'average': 3.0, 'medium': 3.0,
        'good': 4.0, 'high': 4.0, 'great': 4.0,
        'very_high': 5.0, 'very high': 5.0, 'excellent': 5.0, 'amazing': 5.0
    }
    
    return mood_mapping.get(mood_lower)

# ============================================================================
# BEHAVIORAL METRICS CALCULATION
# ============================================================================

def calculate_behavioral_metrics(
    entries: List[Dict[str, Any]], 
    habit_definitions: List[Dict[str, Any]],
    streak_data: List[StreakInfo]
) -> BehavioralMetrics:
    """Calculate behavioral analysis metrics"""
    
    # Calculate journal consistency
    journal_consistency = calculate_journal_consistency(entries)
    
    # Calculate habit adherence
    habit_adherence = calculate_overall_habit_adherence(entries, habit_definitions)
    
    # Get habit categories tracked
    categories = set()
    for habit_def in habit_definitions:
        if habit_def.get('is_active', True):
            categories.add(habit_def.get('category', 'general'))
    
    # Find most and least consistent habits
    most_consistent, least_consistent = find_habit_consistency_extremes(streak_data)
    
    # Generate improvement trends
    improvement_trends = analyze_improvement_trends(entries)
    
    # Generate behavioral insights
    behavioral_insights = generate_behavioral_insights_summary(entries, streak_data)
    
    return BehavioralMetrics(
        journal_consistency=journal_consistency,
        habit_adherence=habit_adherence,
        habit_categories_tracked=len(categories),
        most_consistent_habit=most_consistent,
        least_consistent_habit=least_consistent,
        improvement_trends=improvement_trends,
        behavioral_insights=behavioral_insights
    )

def calculate_journal_consistency(entries: List[Dict[str, Any]], days_back: int = 30) -> float:
    """Calculate journal consistency score over the last N days"""
    if not entries:
        return 0.0
    
    today = date.today()
    start_date = today - timedelta(days=days_back)
    
    # Count journal entries in the period
    entries_in_period = 0
    for entry in entries:
        entry_date = parse_date_flexible(entry.get('date', ''))
        if entry_date and start_date <= entry_date <= today:
            entries_in_period += 1
    
    # Calculate consistency percentage
    expected_entries = days_back + 1  # Including today
    consistency = (entries_in_period / expected_entries) * 100
    
    return min(100.0, consistency)

def calculate_overall_habit_adherence(entries: List[Dict[str, Any]], habit_definitions: List[Dict[str, Any]]) -> float:
    """Calculate overall habit adherence score"""
    if not entries or not habit_definitions:
        return 0.0
    
    total_expected_completions = 0
    total_actual_completions = 0
    
    # Get active habits
    active_habits = [h for h in habit_definitions if h.get('is_active', True)]
    
    for entry in entries:
        entry_habits = entry.get('habits', [])
        
        # Count expected vs actual completions for this day
        expected_for_day = len(active_habits)
        actual_for_day = sum(1 for h in entry_habits if h.get('completed', False))
        
        total_expected_completions += expected_for_day
        total_actual_completions += actual_for_day
    
    if total_expected_completions == 0:
        return 0.0
    
    adherence = (total_actual_completions / total_expected_completions) * 100
    return min(100.0, adherence)

def find_habit_consistency_extremes(streak_data: List[StreakInfo]) -> Tuple[Optional[str], Optional[str]]:
    """Find most and least consistent habits based on streak data"""
    habit_streaks = [s for s in streak_data if s.streak_type == "individual_habit"]
    
    if not habit_streaks:
        return None, None
    
    # Sort by longest streak to find most consistent
    most_consistent_streak = max(habit_streaks, key=lambda x: x.longest_streak)
    most_consistent = most_consistent_streak.streak_details.get('habit_name')
    
    # Sort by current streak to find least consistent (lowest current streak)
    least_consistent_streak = min(habit_streaks, key=lambda x: x.current_streak)
    least_consistent = least_consistent_streak.streak_details.get('habit_name')
    
    return most_consistent, least_consistent

def analyze_improvement_trends(entries: List[Dict[str, Any]], weeks_back: int = 4) -> List[str]:
    """Analyze improvement trends over recent weeks"""
    trends = []
    
    if len(entries) < 7:  # Need at least a week of data
        return trends
    
    # Group entries by week
    weekly_completion_rates = []
    today = date.today()
    
    for week_offset in range(weeks_back):
        week_start = today - timedelta(days=(week_offset + 1) * 7)
        week_end = today - timedelta(days=week_offset * 7)
        
        week_entries = []
        for entry in entries:
            entry_date = parse_date_flexible(entry.get('date', ''))
            if entry_date and week_start <= entry_date < week_end:
                week_entries.append(entry)
        
        if week_entries:
            total_habits = sum(len(entry.get('habits', [])) for entry in week_entries)
            completed_habits = sum(
                sum(1 for h in entry.get('habits', []) if h.get('completed', False))
                for entry in week_entries
            )
            
            completion_rate = (completed_habits / total_habits * 100) if total_habits > 0 else 0
            weekly_completion_rates.append(completion_rate)
    
    # Analyze trends
    if len(weekly_completion_rates) >= 2:
        recent_avg = sum(weekly_completion_rates[:2]) / 2  # Last 2 weeks
        older_avg = sum(weekly_completion_rates[2:]) / len(weekly_completion_rates[2:]) if len(weekly_completion_rates) > 2 else recent_avg
        
        if recent_avg > older_avg + 10:
            trends.append("Improving habit consistency over recent weeks")
        elif recent_avg < older_avg - 10:
            trends.append("Declining habit consistency in recent weeks")
        else:
            trends.append("Stable habit consistency maintained")
    
    return trends

def generate_behavioral_insights_summary(entries: List[Dict[str, Any]], streak_data: List[StreakInfo]) -> List[str]:
    """Generate summary behavioral insights"""
    insights = []
    
    # Journal insights
    if len(entries) >= 7:
        insights.append(f"Maintained journal tracking for {len(entries)} days")
    
    # Streak insights
    current_streaks = [s.current_streak for s in streak_data if s.current_streak > 0]
    if current_streaks:
        max_current_streak = max(current_streaks)
        if max_current_streak >= 7:
            insights.append(f"Strong momentum with {max_current_streak}-day streak")
        elif max_current_streak >= 3:
            insights.append(f"Building consistency with {max_current_streak}-day streak")
    
    # Habit variety insights
    all_habits = set()
    for entry in entries:
        for habit in entry.get('habits', []):
            habit_name = habit.get('name') or habit.get('label', '')
            if habit_name:
                all_habits.add(habit_name)
    
    if len(all_habits) >= 5:
        insights.append("Tracking diverse range of habits for comprehensive improvement")
    elif len(all_habits) >= 2:
        insights.append("Focused habit tracking approach")
    
    return insights

# ============================================================================
# MAIN CALCULATION FUNCTION
# ============================================================================

def calculate_comprehensive_streak_data(
    journal_entries: List[Dict[str, Any]], 
    habit_definitions: List[Dict[str, Any]],
    days_back: int = 30,
    today: Optional[date] = None
) -> ComprehensiveStreakData:
    """Calculate comprehensive streak and behavioral data"""
    
    if today is None:
        today = date.today()
    
    start_date = today - timedelta(days=days_back)
    
    # Filter entries to the analysis period
    filtered_entries = []
    for entry in journal_entries:
        entry_date = parse_date_flexible(entry.get('date', ''))
        if entry_date and start_date <= entry_date <= today:
            filtered_entries.append(entry)
    
    # Calculate all streak types
    journal_streak = calculate_journal_streak(filtered_entries, today)
    habit_streaks = calculate_habit_streaks(filtered_entries, habit_definitions, today)
    category_streaks = calculate_category_streaks(filtered_entries, today)
    
    # Generate calendar data
    calendar_data = generate_calendar_data(filtered_entries, start_date, today)
    
    # Calculate behavioral metrics
    all_streaks = [journal_streak] + habit_streaks + category_streaks
    behavioral_metrics = calculate_behavioral_metrics(filtered_entries, habit_definitions, all_streaks)
    
    # Calculate data quality score
    data_quality = calculate_streak_data_quality(filtered_entries, habit_definitions, days_back)
    
    return ComprehensiveStreakData(
        journal_streak=journal_streak,
        habit_streaks=habit_streaks,
        category_streaks=category_streaks,
        calendar_data=calendar_data,
        behavioral_metrics=behavioral_metrics,
        analysis_period={
            "start_date": start_date.isoformat(),
            "end_date": today.isoformat(),
            "days_analyzed": str(days_back)
        },
        data_quality_score=data_quality
    )

def calculate_streak_data_quality(
    entries: List[Dict[str, Any]], 
    habit_definitions: List[Dict[str, Any]], 
    days_back: int
) -> float:
    """Calculate data quality score for streak analysis"""
    
    # Base score components
    entry_completeness = (len(entries) / days_back) * 40  # Max 40 points
    habit_definition_score = min(20, len(habit_definitions) * 4)  # Max 20 points
    
    # Habit tracking completeness
    habit_tracking_score = 0
    if entries:
        total_possible_habits = len(entries) * len(habit_definitions)
        total_tracked_habits = sum(len(entry.get('habits', [])) for entry in entries)
        
        if total_possible_habits > 0:
            habit_tracking_score = (total_tracked_habits / total_possible_habits) * 40  # Max 40 points
    
    total_score = entry_completeness + habit_definition_score + habit_tracking_score
    return min(100.0, total_score)

# ============================================================================
# LEGACY COMPATIBILITY FUNCTIONS
# ============================================================================

def calculate_legacy_streak_info(entries: List[Dict[str, Any]], category: Optional[str] = None) -> Dict[str, Any]:
    """Calculate streak info in legacy format for backward compatibility"""
    
    if category:
        # Calculate category-specific streak
        category_streaks = calculate_category_streaks(entries)
        matching_streak = next(
            (s for s in category_streaks if s.streak_details.get('category_name') == category),
            None
        )
        
        if matching_streak:
            return {
                "streak_type": matching_streak.streak_type,
                "current_streak": matching_streak.current_streak,
                "longest_streak": matching_streak.longest_streak,
                "last_activity_date": matching_streak.last_activity_date,
                "total_completions": matching_streak.total_completions
            }
    
    # Default to journal streak
    journal_streak = calculate_journal_streak(entries)
    
    return {
        "streak_type": journal_streak.streak_type,
        "current_streak": journal_streak.current_streak,
        "longest_streak": journal_streak.longest_streak,
        "last_activity_date": journal_streak.last_activity_date,
        "total_completions": journal_streak.total_completions
    }


