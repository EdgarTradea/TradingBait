
"""Journal Analytics Utilities for Trading Journal

Provides comprehensive analytics aggregation, improvement area identification, and analytics functions.
"""

from typing import List, Dict, Optional, Any
from datetime import date, datetime
from collections import defaultdict
from dataclasses import dataclass

from app.libs.mood_analysis import (
    calculate_average_mood_score,
    get_mood_statistics,
    analyze_mood_trends
)
from app.libs.habit_analytics import (
    calculate_comprehensive_habit_analytics,
    calculate_category_completion_rates,
    HabitAnalyticsResult
)
from app.libs.streak_calculations import calculate_journal_streak


@dataclass
class ComprehensiveAnalytics:
    """Complete analytics result for journal data"""
    # Basic metrics
    total_entries: int
    date_range_days: int
    
    # Streak data
    current_streak: int
    longest_streak: int
    
    # Mood analytics
    avg_mood_score: float
    mood_statistics: Dict[str, Any]
    mood_trend_analysis: Dict[str, Any]
    
    # Energy analytics
    avg_energy_level: float
    energy_statistics: Dict[str, Any]
    
    # Habit analytics
    habit_analytics: HabitAnalyticsResult
    habit_completion_rates: Dict[str, float]
    category_completion_rates: Dict[str, Dict[str, float]]
    
    # Improvement areas
    improvement_areas: List[str]
    most_consistent_habit: Optional[str]
    
    # Performance indicators
    consistency_score: float
    engagement_score: float


def calculate_energy_statistics(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate energy level statistics from journal entries
    
    Args:
        entries: List of journal entry dictionaries
        
    Returns:
        Dictionary with energy statistics
    """
    energy_levels = [entry.get('energy_level') for entry in entries if entry.get('energy_level')]
    
    if not energy_levels:
        return {
            'total_energy_entries': 0,
            'average_energy': 0.0,
            'min_energy': 0,
            'max_energy': 0,
            'energy_distribution': {},
            'low_energy_days': 0,
            'high_energy_days': 0
        }
    
    avg_energy = sum(energy_levels) / len(energy_levels)
    min_energy = min(energy_levels)
    max_energy = max(energy_levels)
    
    # Energy distribution
    energy_counts = defaultdict(int)
    for energy in energy_levels:
        energy_counts[energy] += 1
    
    # Low/high energy day counts
    low_energy_days = sum(1 for e in energy_levels if e <= 4)
    high_energy_days = sum(1 for e in energy_levels if e >= 8)
    
    return {
        'total_energy_entries': len(energy_levels),
        'average_energy': round(avg_energy, 2),
        'min_energy': min_energy,
        'max_energy': max_energy,
        'energy_distribution': dict(energy_counts),
        'low_energy_days': low_energy_days,
        'high_energy_days': high_energy_days
    }


def identify_improvement_areas(habit_analytics: HabitAnalyticsResult, 
                             mood_statistics: Dict[str, Any],
                             energy_statistics: Dict[str, Any],
                             consistency_score: float) -> List[str]:
    """Identify areas that need improvement based on analytics
    
    Args:
        habit_analytics: Habit analytics results
        mood_statistics: Mood statistics
        energy_statistics: Energy statistics
        consistency_score: Overall consistency score
        
    Returns:
        List of improvement area descriptions
    """
    improvement_areas = []
    
    # Habit-based improvements
    if habit_analytics.improvement_areas:
        improvement_areas.extend(habit_analytics.improvement_areas)
    
    # Mood-based improvements
    if mood_statistics.get('average_score', 0) < 3.0:
        improvement_areas.append("Mood management and emotional regulation")
    
    # Energy-based improvements
    if energy_statistics.get('average_energy', 0) < 5.0:
        improvement_areas.append("Energy management and wellness routines")
    
    # Consistency improvements
    if consistency_score < 60:
        improvement_areas.append("Journal consistency and daily tracking")
    
    # Overall completion rate
    if habit_analytics.overall_completion_rate < 70:
        improvement_areas.append("Overall habit discipline and follow-through")
    
    return improvement_areas


def calculate_consistency_score(entries: List[Dict[str, Any]], days: int) -> float:
    """Calculate consistency score based on journal entry frequency
    
    Args:
        entries: List of journal entry dictionaries
        days: Number of days in the analysis period
        
    Returns:
        Consistency score (0-100)
    """
    if days <= 0:
        return 0.0
    
    entry_count = len(entries)
    consistency_score = min(100, (entry_count / days) * 100)
    
    return round(consistency_score, 2)


def calculate_engagement_score(entries: List[Dict[str, Any]]) -> float:
    """Calculate engagement score based on entry completeness
    
    Args:
        entries: List of journal entry dictionaries
        
    Returns:
        Engagement score (0-100)
    """
    if not entries:
        return 0.0
    
    total_fields = 0
    completed_fields = 0
    
    # Fields to check for completeness
    tracked_fields = [
        'mood', 'energy_level', 'market_outlook', 
        'pre_market_notes', 'post_market_notes', 
        'lessons_learned', 'goals', 'challenges', 'wins'
    ]
    
    for entry in entries:
        for field in tracked_fields:
            total_fields += 1
            if entry.get(field):
                completed_fields += 1
        
        # Also check for habits
        habits = entry.get('habits', [])
        if habits:
            total_fields += 1
            completed_fields += 1
    
    if total_fields == 0:
        return 0.0
    
    engagement_score = (completed_fields / total_fields) * 100
    return round(engagement_score, 2)


def calculate_comprehensive_journal_analytics(entries: List[Dict[str, Any]], 
                                            days: int = 30) -> ComprehensiveAnalytics:
    """Calculate comprehensive analytics for journal entries
    
    Args:
        entries: List of journal entry dictionaries
        days: Number of days for the analysis period
        
    Returns:
        ComprehensiveAnalytics object with all calculated metrics
    """
    if not entries:
        return ComprehensiveAnalytics(
            total_entries=0,
            date_range_days=days,
            current_streak=0,
            longest_streak=0,
            avg_mood_score=0.0,
            mood_statistics={},
            mood_trend_analysis={},
            avg_energy_level=0.0,
            energy_statistics={},
            habit_analytics=HabitAnalyticsResult(
                individual_stats={},
                overall_completion_rate=0.0,
                most_consistent_habit=None,
                least_consistent_habit=None,
                improvement_areas=[],
                category_stats={}
            ),
            habit_completion_rates={},
            category_completion_rates={},
            improvement_areas=[],
            most_consistent_habit=None,
            consistency_score=0.0,
            engagement_score=0.0
        )
    
    # Basic metrics
    total_entries = len(entries)
    
    # Streak calculations
    today = datetime.now().date()
    journal_streak = calculate_journal_streak(entries, today)
    current_streak = journal_streak.current_streak
    longest_streak = journal_streak.longest_streak
    
    # Mood analytics
    moods = [entry.get('mood') for entry in entries if entry.get('mood')]
    avg_mood_score = calculate_average_mood_score(moods)
    mood_statistics = get_mood_statistics(entries)
    
    # Mood trend analysis
    mood_entries_with_dates = [
        (entry.get('date', ''), entry.get('mood', '')) 
        for entry in entries 
        if entry.get('mood') and entry.get('date')
    ]
    mood_trend_analysis = analyze_mood_trends(mood_entries_with_dates, days)
    
    # Energy analytics
    energy_levels = [entry.get('energy_level') for entry in entries if entry.get('energy_level')]
    avg_energy_level = sum(energy_levels) / len(energy_levels) if energy_levels else 0.0
    energy_statistics = calculate_energy_statistics(entries)
    
    # Habit analytics
    habit_analytics = calculate_comprehensive_habit_analytics(entries)
    habit_completion_rates = {}
    
    # Convert habit stats to simple completion rates dict
    for habit_name, stats in habit_analytics.individual_stats.items():
        habit_completion_rates[habit_name] = stats.completion_rate
    
    # Category completion rates
    category_completion_rates = calculate_category_completion_rates(entries)
    
    # Performance scores
    consistency_score = calculate_consistency_score(entries, days)
    engagement_score = calculate_engagement_score(entries)
    
    # Improvement areas
    improvement_areas = identify_improvement_areas(
        habit_analytics, 
        mood_statistics, 
        energy_statistics, 
        consistency_score
    )
    
    return ComprehensiveAnalytics(
        total_entries=total_entries,
        date_range_days=days,
        current_streak=current_streak,
        longest_streak=longest_streak,
        avg_mood_score=round(avg_mood_score, 2),
        mood_statistics=mood_statistics,
        mood_trend_analysis=mood_trend_analysis,
        avg_energy_level=round(avg_energy_level, 2),
        energy_statistics=energy_statistics,
        habit_analytics=habit_analytics,
        habit_completion_rates=habit_completion_rates,
        category_completion_rates=category_completion_rates,
        improvement_areas=improvement_areas,
        most_consistent_habit=habit_analytics.most_consistent_habit,
        consistency_score=consistency_score,
        engagement_score=engagement_score
    )


def generate_analytics_summary(analytics: ComprehensiveAnalytics) -> Dict[str, Any]:
    """Generate a summary of analytics for API responses
    
    Args:
        analytics: ComprehensiveAnalytics object
        
    Returns:
        Dictionary suitable for API response
    """
    return {
        'total_entries': analytics.total_entries,
        'current_streak': analytics.current_streak,
        'longest_streak': analytics.longest_streak,
        'avg_mood_score': analytics.avg_mood_score,
        'avg_energy_level': analytics.avg_energy_level,
        'habit_completion_rates': analytics.habit_completion_rates,
        'most_consistent_habit': analytics.most_consistent_habit,
        'improvement_areas': analytics.improvement_areas,
        'consistency_score': analytics.consistency_score,
        'engagement_score': analytics.engagement_score,
        'mood_trend': analytics.mood_trend_analysis.get('trend_direction', 'stable'),
        'category_stats': analytics.category_completion_rates
    }


def get_analytics_insights(analytics: ComprehensiveAnalytics) -> List[Dict[str, Any]]:
    """Generate insights based on comprehensive analytics
    
    Args:
        analytics: ComprehensiveAnalytics object
        
    Returns:
        List of insight dictionaries
    """
    insights = []
    
    # High engagement recognition
    if analytics.engagement_score >= 80:
        insights.append({
            'type': 'positive',
            'title': 'Excellent Engagement',
            'message': f"📝 Outstanding! Your journal engagement score is {analytics.engagement_score}% - you're capturing detailed insights.",
            'confidence': 0.9,
            'category': 'engagement'
        })
    
    # Consistency achievements
    if analytics.consistency_score >= 90:
        insights.append({
            'type': 'positive',
            'title': 'Perfect Consistency',
            'message': f"🏆 Amazing consistency! You've maintained {analytics.consistency_score}% journal completion.",
            'confidence': 0.95,
            'category': 'consistency'
        })
    elif analytics.consistency_score < 50:
        insights.append({
            'type': 'recommendation',
            'title': 'Improve Consistency',
            'message': f"🎯 Consider setting daily reminders to improve journal consistency. Current rate: {analytics.consistency_score}%.",
            'confidence': 0.7,
            'category': 'consistency'
        })
    
    # Overall performance insights
    if (analytics.avg_mood_score >= 4.0 and 
        analytics.habit_analytics.overall_completion_rate >= 80 and 
        analytics.consistency_score >= 75):
        insights.append({
            'type': 'positive',
            'title': 'Excellent Overall Performance',
            'message': "🎆 You're excelling across all areas: mood, habits, and consistency. Keep up the great work!",
            'confidence': 0.9,
            'category': 'overall'
        })
    
    # Energy management insights
    if analytics.avg_energy_level >= 8.0:
        insights.append({
            'type': 'positive',
            'title': 'High Energy Levels',
            'message': f"⚡ Your average energy level is {analytics.avg_energy_level}/10 - excellent energy management!",
            'confidence': 0.8,
            'category': 'energy'
        })
    elif analytics.avg_energy_level < 5.0:
        insights.append({
            'type': 'recommendation',
            'title': 'Energy Management',
            'message': f"🔋 Consider reviewing your sleep, nutrition, and exercise habits. Average energy: {analytics.avg_energy_level}/10.",
            'confidence': 0.75,
            'category': 'energy'
        })
    
    return insights


