"""Habit Analytics Utilities for Trading Journal

Provides habit completion rate calculations, consistency tracking, and habit-related insights.
"""

from typing import List, Dict, Optional, Tuple
from datetime import date, datetime, timedelta
from collections import defaultdict, Counter
from dataclasses import dataclass


@dataclass
class HabitStats:
    """Statistics for a single habit"""
    name: str
    total_occurrences: int
    completed_count: int
    completion_rate: float
    streak_current: int
    streak_longest: int
    category: Optional[str] = None


@dataclass
class HabitAnalyticsResult:
    """Complete habit analytics results"""
    individual_stats: Dict[str, HabitStats]
    overall_completion_rate: float
    most_consistent_habit: Optional[str]
    least_consistent_habit: Optional[str]
    improvement_areas: List[str]
    category_stats: Dict[str, Dict[str, float]]


def calculate_habit_completion_rates(entries: List[Dict[str, any]]) -> Dict[str, float]:
    """Calculate completion rates for all habits
    
    Args:
        entries: List of journal entry dictionaries containing habits
        
    Returns:
        Dictionary mapping habit names to completion rates (0-100)
    """
    habit_stats = defaultdict(lambda: {'completed': 0, 'total': 0})
    
    for entry in entries:
        habits = entry.get('habits', [])
        for habit in habits:
            habit_name = habit.get('name', '')
            if habit_name:
                habit_stats[habit_name]['total'] += 1
                if habit.get('completed', False):
                    habit_stats[habit_name]['completed'] += 1
    
    completion_rates = {}
    for habit_name, stats in habit_stats.items():
        if stats['total'] > 0:
            completion_rates[habit_name] = (stats['completed'] / stats['total']) * 100
    
    return completion_rates


def calculate_habit_streaks(entries: List[Dict[str, any]], habit_name: str) -> Tuple[int, int]:
    """Calculate current and longest streaks for a specific habit
    
    Args:
        entries: List of journal entry dictionaries
        habit_name: Name of the habit to analyze
        
    Returns:
        Tuple of (current_streak, longest_streak)
    """
    # Sort entries by date (most recent first)
    sorted_entries = sorted(
        entries, 
        key=lambda x: x.get('date', ''), 
        reverse=True
    )
    
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    # Calculate current streak (from most recent)
    for entry in sorted_entries:
        habits = entry.get('habits', [])
        habit_completed = any(
            h.get('name') == habit_name and h.get('completed', False) 
            for h in habits
        )
        
        if habit_completed:
            if current_streak == temp_streak:  # Still building current streak
                current_streak += 1
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            if current_streak == temp_streak:  # Current streak broken
                break
            temp_streak = 0
    
    return current_streak, longest_streak


def calculate_comprehensive_habit_analytics(entries: List[Dict[str, any]]) -> HabitAnalyticsResult:
    """Calculate comprehensive habit analytics
    
    Args:
        entries: List of journal entry dictionaries
        
    Returns:
        HabitAnalyticsResult with complete analytics
    """
    if not entries:
        return HabitAnalyticsResult(
            individual_stats={},
            overall_completion_rate=0.0,
            most_consistent_habit=None,
            least_consistent_habit=None,
            improvement_areas=[],
            category_stats={}
        )
    
    # Calculate basic completion rates
    completion_rates = calculate_habit_completion_rates(entries)
    
    # Calculate detailed stats for each habit
    individual_stats = {}
    category_completions = defaultdict(list)
    
    for habit_name, completion_rate in completion_rates.items():
        # Calculate streaks
        current_streak, longest_streak = calculate_habit_streaks(entries, habit_name)
        
        # Count occurrences
        total_occurrences = 0
        completed_count = 0
        habit_category = None
        
        for entry in entries:
            habits = entry.get('habits', [])
            for habit in habits:
                if habit.get('name') == habit_name:
                    total_occurrences += 1
                    if habit.get('completed', False):
                        completed_count += 1
                    if not habit_category:
                        habit_category = habit.get('category')
        
        # Create habit stats
        individual_stats[habit_name] = HabitStats(
            name=habit_name,
            total_occurrences=total_occurrences,
            completed_count=completed_count,
            completion_rate=completion_rate,
            streak_current=current_streak,
            streak_longest=longest_streak,
            category=habit_category
        )
        
        # Group by category for category stats
        if habit_category:
            category_completions[habit_category].append(completion_rate)
    
    # Calculate overall metrics
    if completion_rates:
        overall_completion_rate = sum(completion_rates.values()) / len(completion_rates)
        most_consistent_habit = max(completion_rates.items(), key=lambda x: x[1])[0]
        least_consistent_habit = min(completion_rates.items(), key=lambda x: x[1])[0]
    else:
        overall_completion_rate = 0.0
        most_consistent_habit = None
        least_consistent_habit = None
    
    # Identify improvement areas (habits with <70% completion)
    improvement_areas = [
        habit_name for habit_name, rate in completion_rates.items() 
        if rate < 70
    ]
    
    # Calculate category statistics
    category_stats = {}
    for category, rates in category_completions.items():
        if rates:
            category_stats[category] = {
                'average_completion_rate': sum(rates) / len(rates),
                'habit_count': len(rates),
                'best_habit_rate': max(rates),
                'worst_habit_rate': min(rates)
            }
    
    return HabitAnalyticsResult(
        individual_stats=individual_stats,
        overall_completion_rate=round(overall_completion_rate, 2),
        most_consistent_habit=most_consistent_habit,
        least_consistent_habit=least_consistent_habit,
        improvement_areas=improvement_areas,
        category_stats=category_stats
    )


def calculate_category_completion_rates(entries: List[Dict[str, any]]) -> Dict[str, Dict[str, float]]:
    """Calculate completion rates by habit category
    
    Args:
        entries: List of journal entry dictionaries
        
    Returns:
        Dictionary mapping categories to their statistics
    """
    category_stats = defaultdict(lambda: {
        'pre_market': {'completed': 0, 'total': 0},
        'during_trading': {'completed': 0, 'total': 0}, 
        'post_market': {'completed': 0, 'total': 0}
    })
    
    for entry in entries:
        habits = entry.get('habits', [])
        
        # Initialize category tracking for this entry
        entry_categories = {
            'pre_market': {'completed': 0, 'total': 0},
            'during_trading': {'completed': 0, 'total': 0},
            'post_market': {'completed': 0, 'total': 0}
        }
        
        # Process habits by category
        for habit in habits:
            category = habit.get('category', 'unknown')
            if category in entry_categories:
                entry_categories[category]['total'] += 1
                if habit.get('completed', False):
                    entry_categories[category]['completed'] += 1
        
        # Add to overall stats
        for category, stats in entry_categories.items():
            category_stats['overall'][category]['total'] += stats['total']
            category_stats['overall'][category]['completed'] += stats['completed']
    
    # Calculate completion rates
    result = {}
    for category, stats in category_stats['overall'].items():
        if stats['total'] > 0:
            completion_rate = (stats['completed'] / stats['total']) * 100
            result[category] = {
                'completion_rate': round(completion_rate, 2),
                'total_habits': stats['total'],
                'completed_habits': stats['completed']
            }
        else:
            result[category] = {
                'completion_rate': 0.0,
                'total_habits': 0,
                'completed_habits': 0
            }
    
    return result


def generate_habit_insights(analytics: HabitAnalyticsResult, days: int = 30) -> List[Dict[str, any]]:
    """Generate insights based on habit analytics
    
    Args:
        analytics: HabitAnalyticsResult from comprehensive analysis
        days: Number of days the analysis covers
        
    Returns:
        List of insight dictionaries
    """
    insights = []
    
    if not analytics.individual_stats:
        return insights
    
    # Perfect completion recognition
    for habit_name, stats in analytics.individual_stats.items():
        if stats.completion_rate == 100.0 and stats.total_occurrences >= 3:
            insights.append({
                'type': 'positive',
                'title': 'Perfect Consistency',
                'message': f"🎯 Outstanding! You've maintained 100% completion on '{habit_name}' for {stats.total_occurrences} consecutive days.",
                'confidence': 0.9,
                'category': 'habits'
            })
    
    # Low completion rate warnings
    for habit_name in analytics.improvement_areas:
        stats = analytics.individual_stats[habit_name]
        if stats.completion_rate < 40:
            insights.append({
                'type': 'warning',
                'title': 'Habit Consistency Alert',
                'message': f"⚠️ {habit_name} completion is at {int(stats.completion_rate)}% over the last {stats.total_occurrences} days.",
                'confidence': 0.75,
                'category': 'habits'
            })
    
    # Most consistent habit recognition
    if analytics.most_consistent_habit:
        best_stats = analytics.individual_stats[analytics.most_consistent_habit]
        if best_stats.completion_rate >= 80:
            insights.append({
                'type': 'positive',
                'title': 'Top Performing Habit',
                'message': f"🏆 '{analytics.most_consistent_habit}' is your most consistent habit at {int(best_stats.completion_rate)}% completion.",
                'confidence': 0.8,
                'category': 'habits'
            })
    
    # Overall completion rate insights
    if analytics.overall_completion_rate >= 85:
        insights.append({
            'type': 'positive',
            'title': 'Excellent Habit Discipline',
            'message': f"💪 Your overall habit completion rate is {analytics.overall_completion_rate}% - excellent discipline!",
            'confidence': 0.85,
            'category': 'habits'
        })
    elif analytics.overall_completion_rate < 50:
        insights.append({
            'type': 'recommendation',
            'title': 'Focus on Habit Building',
            'message': f"🎯 Consider focusing on fewer habits to build consistency. Current overall rate: {analytics.overall_completion_rate}%.",
            'confidence': 0.7,
            'category': 'habits'
        })
    
    return insights


def calculate_habit_performance_correlations(entries: List[Dict[str, any]], performance_data: List[Dict[str, any]]) -> List[Dict[str, any]]:
    """Calculate correlations between habit completion and trading performance
    
    Args:
        entries: List of journal entry dictionaries
        performance_data: List of trading performance data by date
        
    Returns:
        List of correlation results
    """
    correlations = []
    
    if not entries or not performance_data:
        return correlations
    
    # Group data by date
    habits_by_date = {}
    performance_by_date = {entry['date']: entry for entry in performance_data}
    
    for entry in entries:
        entry_date = entry.get('date')
        if entry_date:
            habits_by_date[entry_date] = entry.get('habits', [])
    
    # Get all unique habit names
    all_habits = set()
    for habits in habits_by_date.values():
        for habit in habits:
            habit_name = habit.get('name')
            if habit_name:
                all_habits.add(habit_name)
    
    # Calculate correlations for each habit
    for habit_name in all_habits:
        habit_days = []
        performance_days = []
        
        for date_str in habits_by_date.keys():
            if date_str in performance_by_date:
                # Check if habit was completed
                habits = habits_by_date[date_str]
                habit_completed = any(
                    h.get('name') == habit_name and h.get('completed', False)
                    for h in habits
                )
                
                habit_days.append(1 if habit_completed else 0)
                performance_days.append(performance_by_date[date_str].get('pnl', 0))
        
        if len(habit_days) >= 5:  # Minimum sample size
            # Simple correlation calculation
            n = len(habit_days)
            if n > 1:
                mean_habit = sum(habit_days) / n
                mean_perf = sum(performance_days) / n
                
                numerator = sum((h - mean_habit) * (p - mean_perf) 
                              for h, p in zip(habit_days, performance_days))
                
                hab_var = sum((h - mean_habit) ** 2 for h in habit_days)
                perf_var = sum((p - mean_perf) ** 2 for p in performance_days)
                
                if hab_var > 0 and perf_var > 0:
                    correlation = numerator / (hab_var * perf_var) ** 0.5
                    
                    correlations.append({
                        'habit_name': habit_name,
                        'completion_rate': (sum(habit_days) / len(habit_days)) * 100,
                        'performance_correlation': round(correlation, 3),
                        'confidence_level': 'high' if n >= 20 else 'medium' if n >= 10 else 'low',
                        'sample_size': n
                    })
    
    # Sort by correlation strength
    correlations.sort(key=lambda x: abs(x['performance_correlation']), reverse=True)
    
    return correlations
