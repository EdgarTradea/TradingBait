"""Mood Analysis Utilities for Trading Journal

Provides standardized mood scoring, trend analysis, and mood-related insights.
"""

from typing import List, Dict, Optional, Tuple
from datetime import date, datetime
from enum import Enum
from collections import Counter


class MoodCategory(Enum):
    """Standardized mood categories with scoring"""
    VERY_POSITIVE = 5  # excited, confident, optimistic
    POSITIVE = 4       # focused, calm, neutral
    NEUTRAL = 3        # tired, uncertain
    NEGATIVE = 2       # frustrated, anxious
    VERY_NEGATIVE = 1  # overwhelmed, stressed


# Mood mapping dictionary for consistent scoring
MOOD_SCORE_MAPPING = {
    # Very positive moods
    'excited': MoodCategory.VERY_POSITIVE.value,
    'confident': MoodCategory.VERY_POSITIVE.value,
    'optimistic': MoodCategory.VERY_POSITIVE.value,
    'elated': MoodCategory.VERY_POSITIVE.value,
    'euphoric': MoodCategory.VERY_POSITIVE.value,
    
    # Positive moods
    'focused': MoodCategory.POSITIVE.value,
    'calm': MoodCategory.POSITIVE.value,
    'neutral': MoodCategory.POSITIVE.value,
    'balanced': MoodCategory.POSITIVE.value,
    'disciplined': MoodCategory.POSITIVE.value,
    'patient': MoodCategory.POSITIVE.value,
    
    # Neutral moods
    'tired': MoodCategory.NEUTRAL.value,
    'uncertain': MoodCategory.NEUTRAL.value,
    'indifferent': MoodCategory.NEUTRAL.value,
    'contemplative': MoodCategory.NEUTRAL.value,
    
    # Negative moods
    'frustrated': MoodCategory.NEGATIVE.value,
    'anxious': MoodCategory.NEGATIVE.value,
    'worried': MoodCategory.NEGATIVE.value,
    'nervous': MoodCategory.NEGATIVE.value,
    'disappointed': MoodCategory.NEGATIVE.value,
    
    # Very negative moods
    'overwhelmed': MoodCategory.VERY_NEGATIVE.value,
    'stressed': MoodCategory.VERY_NEGATIVE.value,
    'panicked': MoodCategory.VERY_NEGATIVE.value,
    'desperate': MoodCategory.VERY_NEGATIVE.value,
    'defeated': MoodCategory.VERY_NEGATIVE.value,
}


def convert_mood_to_score(mood: str) -> Optional[int]:
    """Convert mood string to numeric score (1-5)
    
    Args:
        mood: Mood string (case insensitive)
        
    Returns:
        Numeric score 1-5, or None if mood not recognized
    """
    if not mood:
        return None
        
    mood_lower = mood.lower().strip()
    
    # Direct mapping first
    if mood_lower in MOOD_SCORE_MAPPING:
        return MOOD_SCORE_MAPPING[mood_lower]
    
    # Partial matching for compound moods
    for mood_key, score in MOOD_SCORE_MAPPING.items():
        if mood_key in mood_lower:
            return score
    
    # Default to neutral if no match
    return MoodCategory.NEUTRAL.value


def calculate_mood_scores(moods: List[str]) -> List[int]:
    """Convert list of mood strings to numeric scores
    
    Args:
        moods: List of mood strings
        
    Returns:
        List of numeric scores (1-5)
    """
    scores = []
    for mood in moods:
        score = convert_mood_to_score(mood)
        if score is not None:
            scores.append(score)
    return scores


def calculate_average_mood_score(moods: List[str]) -> float:
    """Calculate average mood score from list of moods
    
    Args:
        moods: List of mood strings
        
    Returns:
        Average mood score (0.0 if no valid moods)
    """
    scores = calculate_mood_scores(moods)
    return sum(scores) / len(scores) if scores else 0.0


def analyze_mood_trends(mood_entries: List[Tuple[str, str]], lookback_days: int = 7) -> Dict[str, any]:
    """Analyze mood trends over time
    
    Args:
        mood_entries: List of (date_str, mood) tuples
        lookback_days: Number of recent days to analyze
        
    Returns:
        Dictionary with trend analysis results
    """
    if not mood_entries:
        return {
            'trend_direction': 'stable',
            'recent_average': 0.0,
            'mood_distribution': {},
            'consecutive_negative_days': 0,
            'improvement_needed': False
        }
    
    # Sort by date (most recent first)
    sorted_entries = sorted(mood_entries, key=lambda x: x[0], reverse=True)
    recent_entries = sorted_entries[:lookback_days]
    
    # Calculate scores for recent moods
    recent_moods = [mood for _, mood in recent_entries]
    recent_scores = calculate_mood_scores(recent_moods)
    
    # Calculate trend direction
    trend_direction = 'stable'
    if len(recent_scores) >= 3:
        first_half = recent_scores[:len(recent_scores)//2]
        second_half = recent_scores[len(recent_scores)//2:]
        
        if sum(second_half) > sum(first_half):
            trend_direction = 'improving'
        elif sum(second_half) < sum(first_half):
            trend_direction = 'declining'
    
    # Mood distribution
    mood_counter = Counter(recent_moods)
    mood_distribution = dict(mood_counter)
    
    # Check for consecutive negative days
    negative_moods = ['frustrated', 'anxious', 'overwhelmed', 'stressed']
    consecutive_negative_days = 0
    
    for _, mood in recent_entries:
        if mood and mood.lower() in negative_moods:
            consecutive_negative_days += 1
        else:
            break
    
    recent_average = sum(recent_scores) / len(recent_scores) if recent_scores else 0.0
    
    return {
        'trend_direction': trend_direction,
        'recent_average': round(recent_average, 2),
        'mood_distribution': mood_distribution,
        'consecutive_negative_days': consecutive_negative_days,
        'improvement_needed': consecutive_negative_days >= 3 or recent_average < 2.5
    }


def generate_mood_insights(mood_entries: List[Tuple[str, str]], days: int = 30) -> List[Dict[str, any]]:
    """Generate insights based on mood patterns
    
    Args:
        mood_entries: List of (date_str, mood) tuples
        days: Number of days to analyze
        
    Returns:
        List of insight dictionaries
    """
    insights = []
    
    if not mood_entries:
        return insights
    
    # Analyze trends
    trend_analysis = analyze_mood_trends(mood_entries, days)
    
    # Alert for consecutive negative days
    if trend_analysis['consecutive_negative_days'] >= 3:
        insights.append({
            'type': 'alert',
            'title': 'Mood Pattern Alert',
            'message': f"Pattern detected: {trend_analysis['consecutive_negative_days']} consecutive days of challenging moods. Consider reviewing your trading approach.",
            'confidence': 0.85,
            'category': 'mood'
        })
    
    # Positive trend recognition
    if trend_analysis['trend_direction'] == 'improving' and trend_analysis['recent_average'] >= 4.0:
        insights.append({
            'type': 'positive',
            'title': 'Mood Improvement',
            'message': f"🎯 Great progress! Your mood trend is improving with an average score of {trend_analysis['recent_average']}/5.",
            'confidence': 0.8,
            'category': 'mood'
        })
    
    # Warning for declining trend
    elif trend_analysis['trend_direction'] == 'declining' and trend_analysis['recent_average'] < 3.0:
        insights.append({
            'type': 'warning',
            'title': 'Mood Decline Detected',
            'message': f"⚠️ Your mood trend is declining (avg: {trend_analysis['recent_average']}/5). Consider stress management techniques.",
            'confidence': 0.75,
            'category': 'mood'
        })
    
    return insights


def get_mood_statistics(entries: List[Dict[str, any]]) -> Dict[str, any]:
    """Calculate comprehensive mood statistics from journal entries
    
    Args:
        entries: List of journal entry dictionaries
        
    Returns:
        Dictionary with mood statistics
    """
    moods = [entry.get('mood') for entry in entries if entry.get('mood')]
    
    if not moods:
        return {
            'total_mood_entries': 0,
            'average_score': 0.0,
            'most_common_mood': None,
            'mood_distribution': {},
            'score_distribution': {},
            'positive_mood_percentage': 0.0
        }
    
    # Calculate scores
    scores = calculate_mood_scores(moods)
    average_score = sum(scores) / len(scores) if scores else 0.0
    
    # Mood distribution
    mood_counter = Counter(moods)
    most_common_mood = mood_counter.most_common(1)[0][0] if mood_counter else None
    
    # Score distribution
    score_counter = Counter(scores)
    score_distribution = dict(score_counter)
    
    # Positive mood percentage (scores 4-5)
    positive_scores = [s for s in scores if s >= 4]
    positive_percentage = (len(positive_scores) / len(scores)) * 100 if scores else 0.0
    
    return {
        'total_mood_entries': len(moods),
        'average_score': round(average_score, 2),
        'most_common_mood': most_common_mood,
        'mood_distribution': dict(mood_counter),
        'score_distribution': score_distribution,
        'positive_mood_percentage': round(positive_percentage, 1)
    }

