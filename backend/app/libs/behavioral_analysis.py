"""Behavioral Analysis Utilities for Trading Journal

Provides pattern detection algorithms, insight generation logic, and standardized insight classification.
"""

from typing import List, Dict, Optional, Any, Tuple
from datetime import date, datetime, timedelta
from collections import defaultdict, Counter
from dataclasses import dataclass
from enum import Enum

from app.libs.mood_analysis import generate_mood_insights, analyze_mood_trends
from app.libs.habit_analytics import generate_habit_insights, HabitAnalyticsResult


class InsightType(Enum):
    """Types of behavioral insights"""
    POSITIVE = "positive"
    WARNING = "warning"
    ALERT = "alert"
    RECOMMENDATION = "recommendation"
    PATTERN = "pattern"


class InsightCategory(Enum):
    """Categories of insights"""
    HABITS = "habits"
    MOOD = "mood"
    DISCIPLINE = "discipline"
    PATTERNS = "patterns"
    CONSISTENCY = "consistency"
    ENERGY = "energy"
    OVERALL = "overall"


@dataclass
class BehavioralInsight:
    """Standardized behavioral insight structure"""
    type: str  # InsightType value
    title: str
    message: str
    confidence: float  # 0.0 to 1.0
    category: str  # InsightCategory value
    data: Optional[Dict[str, Any]] = None
    priority: int = 1  # 1 (high) to 5 (low)


@dataclass
class BehavioralPattern:
    """Detected behavioral pattern"""
    pattern_type: str
    description: str
    strength: float  # 0.0 to 1.0
    sample_size: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    related_data: Optional[Dict[str, Any]] = None


def analyze_behavioral_patterns(entries: List[Dict[str, Any]], days: int = 30) -> List[BehavioralInsight]:
    """Analyze journal entries to detect behavioral patterns and generate insights
    
    Args:
        entries: List of journal entry dictionaries
        days: Number of days to analyze
        
    Returns:
        List of BehavioralInsight objects
    """
    insights = []
    
    if not entries:
        return insights
    
    # Analyze habit completion patterns
    habit_insights = _analyze_habit_patterns(entries)
    insights.extend(habit_insights)
    
    # Analyze mood patterns
    mood_insights = _analyze_mood_patterns(entries)
    insights.extend(mood_insights)
    
    # Analyze consistency patterns
    consistency_insights = _analyze_consistency_patterns(entries, days)
    insights.extend(consistency_insights)
    
    # Analyze correlation patterns
    correlation_insights = _analyze_correlation_patterns(entries)
    insights.extend(correlation_insights)
    
    # Sort insights by priority and confidence
    insights.sort(key=lambda x: (x.priority, -x.confidence))
    
    return insights


def _analyze_habit_patterns(entries: List[Dict[str, Any]]) -> List[BehavioralInsight]:
    """Analyze habit completion patterns"""
    insights = []
    
    # Track habit completion by habit name
    habit_completion = defaultdict(list)
    
    for entry in entries:
        habits = entry.get('habits', [])
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
                    type=InsightType.POSITIVE.value,
                    title="Perfect Consistency",
                    message=f"🎯 Outstanding! You've maintained 100% completion on '{habit_name}' for {len(completions)} consecutive days.",
                    confidence=0.9,
                    category=InsightCategory.HABITS.value,
                    data={'habit_name': habit_name, 'completion_rate': completion_rate, 'days': len(completions)},
                    priority=1
                ))
            
            # Low completion rate warnings
            elif completion_rate < 0.4:
                insights.append(BehavioralInsight(
                    type=InsightType.WARNING.value,
                    title="Habit Consistency Alert",
                    message=f"⚠️ {habit_name} completion is at {int(completion_rate*100)}% over the last {len(completions)} days.",
                    confidence=0.75,
                    category=InsightCategory.HABITS.value,
                    data={'habit_name': habit_name, 'completion_rate': completion_rate, 'days': len(completions)},
                    priority=2
                ))
            
            # Declining trend detection
            elif len(completions) >= 6:
                recent_half = completions[-len(completions)//2:]
                earlier_half = completions[:len(completions)//2]
                
                recent_rate = sum(recent_half) / len(recent_half)
                earlier_rate = sum(earlier_half) / len(earlier_half)
                
                if recent_rate < earlier_rate - 0.3:  # Significant decline
                    insights.append(BehavioralInsight(
                        type=InsightType.PATTERN.value,
                        title="Declining Habit Trend",
                        message=f"📊 {habit_name} completion has declined from {int(earlier_rate*100)}% to {int(recent_rate*100)}% recently.",
                        confidence=0.7,
                        category=InsightCategory.PATTERNS.value,
                        data={
                            'habit_name': habit_name, 
                            'earlier_rate': earlier_rate, 
                            'recent_rate': recent_rate
                        },
                        priority=2
                    ))
    
    return insights


def _analyze_mood_patterns(entries: List[Dict[str, Any]]) -> List[BehavioralInsight]:
    """Analyze mood patterns and trends"""
    insights = []
    
    # Extract mood trends
    mood_trends = []
    for entry in entries:
        date_str = entry.get('date')
        mood = entry.get('mood', '').lower()
        if date_str and mood:
            mood_trends.append((date_str, mood))
    
    if len(mood_trends) >= 3:
        recent_moods = [mood for _, mood in mood_trends[-3:]]
        negative_moods = ['frustrated', 'anxious', 'overwhelmed', 'stressed']
        positive_moods = ['excited', 'confident', 'optimistic', 'focused', 'calm']
        
        # Consecutive negative mood alert
        if all(mood in negative_moods for mood in recent_moods):
            insights.append(BehavioralInsight(
                type=InsightType.ALERT.value,
                title="Mood Pattern Alert",
                message=f"Pattern detected: 3 consecutive days of challenging moods. Consider reviewing your trading approach.",
                confidence=0.85,
                category=InsightCategory.MOOD.value,
                data={'consecutive_negative_days': 3, 'recent_moods': recent_moods},
                priority=1
            ))
        
        # Positive mood streak
        elif all(mood in positive_moods for mood in recent_moods):
            insights.append(BehavioralInsight(
                type=InsightType.POSITIVE.value,
                title="Positive Mood Streak",
                message=f"🌟 Excellent! 3 consecutive days of positive moods. Your mindset is strong.",
                confidence=0.8,
                category=InsightCategory.MOOD.value,
                data={'consecutive_positive_days': 3, 'recent_moods': recent_moods},
                priority=1
            ))
    
    # Mood volatility analysis
    if len(mood_trends) >= 7:
        mood_scores = []
        mood_mapping = {
            'excited': 5, 'confident': 5, 'optimistic': 5,
            'focused': 4, 'calm': 4, 'neutral': 3,
            'tired': 2, 'uncertain': 2,
            'frustrated': 1, 'anxious': 1, 'overwhelmed': 1, 'stressed': 1
        }
        
        for _, mood in mood_trends[-7:]:
            score = mood_mapping.get(mood, 3)
            mood_scores.append(score)
        
        # Calculate mood volatility (standard deviation)
        mean_score = sum(mood_scores) / len(mood_scores)
        variance = sum((score - mean_score) ** 2 for score in mood_scores) / len(mood_scores)
        std_dev = variance ** 0.5
        
        if std_dev > 1.5:  # High volatility
            insights.append(BehavioralInsight(
                type=InsightType.RECOMMENDATION.value,
                title="Mood Volatility Detected",
                message="🌊 Your mood has been quite variable lately. Consider implementing stress management techniques.",
                confidence=0.7,
                category=InsightCategory.MOOD.value,
                data={'volatility': round(std_dev, 2), 'average_score': round(mean_score, 2)},
                priority=3
            ))
    
    return insights


def _analyze_consistency_patterns(entries: List[Dict[str, Any]], days: int) -> List[BehavioralInsight]:
    """Analyze consistency patterns in journaling"""
    insights = []
    
    # Calculate journaling consistency
    entry_count = len(entries)
    consistency_rate = (entry_count / days) * 100 if days > 0 else 0
    
    if consistency_rate >= 90:
        insights.append(BehavioralInsight(
            type=InsightType.POSITIVE.value,
            title="Exceptional Consistency",
            message=f"🏆 Outstanding! {consistency_rate:.1f}% journaling consistency over {days} days.",
            confidence=0.95,
            category=InsightCategory.CONSISTENCY.value,
            data={'consistency_rate': consistency_rate, 'days': days},
            priority=1
        ))
    elif consistency_rate < 50:
        insights.append(BehavioralInsight(
            type=InsightType.RECOMMENDATION.value,
            title="Improve Consistency",
            message=f"🎯 Consider setting daily reminders to improve journaling consistency. Current rate: {consistency_rate:.1f}%.",
            confidence=0.7,
            category=InsightCategory.CONSISTENCY.value,
            data={'consistency_rate': consistency_rate, 'days': days},
            priority=2
        ))
    
    # Analyze entry completeness patterns
    complete_entries = 0
    for entry in entries:
        completeness_score = 0
        total_fields = 7  # mood, energy, notes, lessons, etc.
        
        if entry.get('mood'): completeness_score += 1
        if entry.get('energy_level'): completeness_score += 1
        if entry.get('pre_market_notes'): completeness_score += 1
        if entry.get('post_market_notes'): completeness_score += 1
        if entry.get('lessons_learned'): completeness_score += 1
        if entry.get('goals'): completeness_score += 1
        if entry.get('habits'): completeness_score += 1
        
        if completeness_score >= total_fields * 0.7:  # 70% complete
            complete_entries += 1
    
    completion_rate = (complete_entries / entry_count) * 100 if entry_count > 0 else 0
    
    if completion_rate >= 80:
        insights.append(BehavioralInsight(
            type=InsightType.POSITIVE.value,
            title="Detailed Journaling",
            message=f"📝 Excellent! {completion_rate:.1f}% of your entries are detailed and complete.",
            confidence=0.85,
            category=InsightCategory.CONSISTENCY.value,
            data={'completion_rate': completion_rate},
            priority=2
        ))
    elif completion_rate < 40:
        insights.append(BehavioralInsight(
            type=InsightType.RECOMMENDATION.value,
            title="Enhance Entry Detail",
            message=f"📝 Consider adding more detail to your entries. Current completeness: {completion_rate:.1f}%.",
            confidence=0.6,
            category=InsightCategory.CONSISTENCY.value,
            data={'completion_rate': completion_rate},
            priority=3
        ))
    
    return insights


def _analyze_correlation_patterns(entries: List[Dict[str, Any]]) -> List[BehavioralInsight]:
    """Analyze correlations between different behavioral factors"""
    insights = []
    
    if len(entries) < 5:  # Need minimum data for correlation analysis
        return insights
    
    # Analyze mood-habit correlations
    mood_habit_data = []
    
    for entry in entries:
        mood = entry.get('mood', '').lower()
        habits = entry.get('habits', [])
        
        if mood and habits:
            # Simple mood scoring
            mood_score = 3  # default neutral
            if mood in ['excited', 'confident', 'optimistic']: mood_score = 5
            elif mood in ['focused', 'calm']: mood_score = 4
            elif mood in ['frustrated', 'anxious']: mood_score = 2
            elif mood in ['overwhelmed', 'stressed']: mood_score = 1
            
            # Calculate habit completion rate for this day
            completed_habits = sum(1 for h in habits if h.get('completed', False))
            total_habits = len(habits)
            habit_rate = (completed_habits / total_habits) if total_habits > 0 else 0
            
            mood_habit_data.append((mood_score, habit_rate))
    
    # Simple correlation calculation
    if len(mood_habit_data) >= 5:
        mood_scores = [d[0] for d in mood_habit_data]
        habit_rates = [d[1] for d in mood_habit_data]
        
        # Calculate correlation coefficient
        n = len(mood_scores)
        mean_mood = sum(mood_scores) / n
        mean_habit = sum(habit_rates) / n
        
        numerator = sum((m - mean_mood) * (h - mean_habit) for m, h in zip(mood_scores, habit_rates))
        mood_var = sum((m - mean_mood) ** 2 for m in mood_scores)
        habit_var = sum((h - mean_habit) ** 2 for h in habit_rates)
        
        if mood_var > 0 and habit_var > 0:
            correlation = numerator / (mood_var * habit_var) ** 0.5
            
            if correlation > 0.6:  # Strong positive correlation
                insights.append(BehavioralInsight(
                    type=InsightType.PATTERN.value,
                    title="Mood-Habit Connection",
                    message=f"🔗 Strong correlation detected: Better moods align with higher habit completion ({correlation:.2f}).",
                    confidence=0.8,
                    category=InsightCategory.PATTERNS.value,
                    data={'correlation': correlation, 'sample_size': n},
                    priority=2
                ))
            elif correlation < -0.6:  # Strong negative correlation
                insights.append(BehavioralInsight(
                    type=InsightType.ALERT.value,
                    title="Concerning Pattern",
                    message=f"⚠️ Pattern detected: Lower moods correlate with poor habit completion ({correlation:.2f}).",
                    confidence=0.75,
                    category=InsightCategory.PATTERNS.value,
                    data={'correlation': correlation, 'sample_size': n},
                    priority=1
                ))
    
    return insights


def generate_comprehensive_behavioral_insights(entries: List[Dict[str, Any]], 
                                              habit_analytics: Optional[HabitAnalyticsResult] = None,
                                              days: int = 30) -> List[Dict[str, Any]]:
    """Generate comprehensive behavioral insights combining all analysis methods
    
    Args:
        entries: List of journal entry dictionaries
        habit_analytics: Optional habit analytics results
        days: Number of days for analysis
        
    Returns:
        List of insight dictionaries compatible with API response format
    """
    # Get behavioral pattern insights
    pattern_insights = analyze_behavioral_patterns(entries, days)
    
    # Get mood-specific insights
    mood_entries_with_dates = [
        (entry.get('date', ''), entry.get('mood', '')) 
        for entry in entries 
        if entry.get('mood') and entry.get('date')
    ]
    mood_insights = generate_mood_insights(mood_entries_with_dates, days)
    
    # Get habit-specific insights if analytics provided
    habit_insights = []
    if habit_analytics:
        habit_insights = generate_habit_insights(habit_analytics, days)
    
    # Combine all insights
    all_insights = []
    
    # Convert BehavioralInsight objects to dictionaries
    for insight in pattern_insights:
        all_insights.append({
            'type': insight.type,
            'title': insight.title,
            'message': insight.message,
            'confidence': insight.confidence,
            'category': insight.category
        })
    
    # Add mood and habit insights
    all_insights.extend(mood_insights)
    all_insights.extend(habit_insights)
    
    # Remove duplicates and sort by confidence
    seen_messages = set()
    unique_insights = []
    
    for insight in all_insights:
        if insight['message'] not in seen_messages:
            seen_messages.add(insight['message'])
            unique_insights.append(insight)
    
    # Sort by confidence (highest first)
    unique_insights.sort(key=lambda x: x['confidence'], reverse=True)
    
    return unique_insights[:10]  # Limit to top 10 insights


def detect_behavioral_patterns(entries: List[Dict[str, Any]], 
                              lookback_days: int = 14) -> List[BehavioralPattern]:
    """Detect specific behavioral patterns in journal data
    
    Args:
        entries: List of journal entry dictionaries
        lookback_days: Number of days to look back for pattern detection
        
    Returns:
        List of detected BehavioralPattern objects
    """
    patterns = []
    
    if len(entries) < 3:
        return patterns
    
    # Pattern 1: Consistent morning routine
    morning_habits = []
    for entry in entries:
        habits = entry.get('habits', [])
        morning_count = sum(
            1 for h in habits 
            if h.get('category') == 'pre-market' and h.get('completed', False)
        )
        morning_habits.append(morning_count)
    
    if len(morning_habits) >= 7:
        avg_morning = sum(morning_habits[-7:]) / 7
        if avg_morning >= 2:  # At least 2 morning habits on average
            patterns.append(BehavioralPattern(
                pattern_type="consistent_morning_routine",
                description="Strong morning routine pattern detected",
                strength=min(avg_morning / 3.0, 1.0),  # Normalize to 0-1
                sample_size=7,
                related_data={'average_morning_habits': avg_morning}
            ))
    
    # Pattern 2: Mood stability
    mood_scores = []
    mood_mapping = {
        'excited': 5, 'confident': 5, 'optimistic': 5,
        'focused': 4, 'calm': 4, 'neutral': 3,
        'tired': 2, 'uncertain': 2,
        'frustrated': 1, 'anxious': 1, 'overwhelmed': 1, 'stressed': 1
    }
    
    for entry in entries[-lookback_days:]:
        mood = entry.get('mood', '').lower()
        if mood in mood_mapping:
            mood_scores.append(mood_mapping[mood])
    
    if len(mood_scores) >= 5:
        mean_mood = sum(mood_scores) / len(mood_scores)
        variance = sum((score - mean_mood) ** 2 for score in mood_scores) / len(mood_scores)
        stability = 1.0 - min(variance / 4.0, 1.0)  # Normalize inverse variance
        
        if stability >= 0.7:
            patterns.append(BehavioralPattern(
                pattern_type="mood_stability",
                description="High emotional stability pattern",
                strength=stability,
                sample_size=len(mood_scores),
                related_data={'average_mood': mean_mood, 'stability_score': stability}
            ))
    
    return patterns

