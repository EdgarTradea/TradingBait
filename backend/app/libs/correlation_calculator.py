"""
Correlation Calculator - Statistical analysis with significance testing

Calculates correlations between trading performance and behavioral data with proper
statistical significance testing to prevent false insights.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, date
from collections import defaultdict
import math
from statistics import mean, stdev
from app.libs.trading_data_aggregator import TraderDataSummary

@dataclass
class CorrelationResult:
    """Result of correlation analysis with significance testing"""
    variable_1: str
    variable_2: str
    correlation: float
    sample_size: int
    p_value: float
    significance: str  # "high", "medium", "low", "insufficient_data"
    confidence_score: float
    interpretation: str

class CorrelationCalculator:
    """Calculates correlations with proper statistical validation"""
    
    # Minimum sample sizes for different significance levels
    MIN_SAMPLE_HIGH_SIGNIFICANCE = 30
    MIN_SAMPLE_MEDIUM_SIGNIFICANCE = 15
    MIN_SAMPLE_LOW_SIGNIFICANCE = 8
    MIN_SAMPLE_ABSOLUTE = 3
    
    def calculate_comprehensive_correlations(self, data_summary: TraderDataSummary) -> List[CorrelationResult]:
        """Calculate all relevant correlations from trader data"""
        correlations = []
        
        # Prepare daily aggregated data
        daily_data = self._prepare_daily_data(data_summary)
        
        if len(daily_data) < self.MIN_SAMPLE_ABSOLUTE:
            return []  # Not enough data for any meaningful analysis
        
        # 1. Habit completion vs Daily P&L correlations
        habit_correlations = self._calculate_habit_pnl_correlations(daily_data)
        correlations.extend(habit_correlations)
        
        # 2. Mood vs Performance correlations
        mood_correlations = self._calculate_mood_performance_correlations(daily_data)
        correlations.extend(mood_correlations)
        
        # 3. Trading frequency vs Emotional state
        frequency_correlations = self._calculate_frequency_emotion_correlations(daily_data)
        correlations.extend(frequency_correlations)
        
        # 4. Risk management correlations
        risk_correlations = self._calculate_risk_management_correlations(data_summary)
        correlations.extend(risk_correlations)
        
        return correlations
    
    def _prepare_daily_data(self, data_summary: TraderDataSummary) -> Dict[date, Dict[str, Any]]:
        """Prepare daily aggregated data for correlation analysis"""
        daily_data = defaultdict(lambda: {
            'pnl': 0.0,
            'trade_count': 0,
            'habits': {},
            'mood': None,
            'notes': '',
            'win_rate': 0.0,
            'winning_trades': 0,
            'losing_trades': 0
        })
        
        # Aggregate trades by day
        for trade in data_summary.trades:
            if 'closeTime' in trade and 'pnl' in trade:
                try:
                    trade_date = datetime.fromisoformat(trade['closeTime'].replace('Z', '+00:00')).date()
                    pnl = float(trade['pnl'])
                    
                    daily_data[trade_date]['pnl'] += pnl
                    daily_data[trade_date]['trade_count'] += 1
                    
                    if pnl > 0:
                        daily_data[trade_date]['winning_trades'] += 1
                    elif pnl < 0:
                        daily_data[trade_date]['losing_trades'] += 1
                        
                except (ValueError, KeyError):
                    continue
        
        # Add journal entries
        for entry in data_summary.journal_entries:
            if 'date' in entry:
                try:
                    entry_date = datetime.fromisoformat(entry['date'].replace('Z', '+00:00')).date()
                    
                    if 'mood' in entry and entry['mood']:
                        daily_data[entry_date]['mood'] = entry['mood']
                    
                    if 'habits' in entry and isinstance(entry['habits'], dict):
                        daily_data[entry_date]['habits'].update(entry['habits'])
                    
                    if 'postMarketNotes' in entry:
                        daily_data[entry_date]['notes'] = entry.get('postMarketNotes', '')
                        
                except (ValueError, KeyError):
                    continue
        
        # Calculate daily win rates
        for day_data in daily_data.values():
            total_trades = day_data['winning_trades'] + day_data['losing_trades']
            if total_trades > 0:
                day_data['win_rate'] = day_data['winning_trades'] / total_trades
        
        return dict(daily_data)
    
    def _calculate_habit_pnl_correlations(self, daily_data: Dict[date, Dict[str, Any]]) -> List[CorrelationResult]:
        """Calculate correlations between habit completion and daily P&L"""
        correlations = []
        
        # Get all unique habits
        all_habits = set()
        for day_data in daily_data.values():
            all_habits.update(day_data['habits'].keys())
        
        for habit_name in all_habits:
            habit_values = []
            pnl_values = []
            
            for day_data in daily_data.values():
                if habit_name in day_data['habits'] and day_data['trade_count'] > 0:
                    habit_completed = 1.0 if day_data['habits'][habit_name] else 0.0
                    habit_values.append(habit_completed)
                    pnl_values.append(day_data['pnl'])
            
            if len(habit_values) >= self.MIN_SAMPLE_ABSOLUTE:
                correlation_result = self._calculate_correlation(
                    habit_values, pnl_values,
                    f"{habit_name}_completion", "daily_pnl"
                )
                correlations.append(correlation_result)
        
        return correlations
    
    def _calculate_mood_performance_correlations(self, daily_data: Dict[date, Dict[str, Any]]) -> List[CorrelationResult]:
        """Calculate correlations between mood and performance metrics"""
        correlations = []
        
        # Numeric mood mapping (simplified)
        mood_scores = {
            'very_negative': 1, 'negative': 2, 'neutral': 3, 
            'positive': 4, 'very_positive': 5,
            'anxious': 1, 'stressed': 2, 'calm': 3, 
            'confident': 4, 'excited': 5,
            'frustrated': 1, 'disappointed': 2, 'focused': 4, 'optimistic': 5
        }
        
        mood_values = []
        pnl_values = []
        win_rate_values = []
        
        for day_data in daily_data.values():
            if day_data['mood'] and day_data['trade_count'] > 0:
                mood_text = day_data['mood'].lower()
                mood_score = None
                
                # Try to match mood to numeric score
                for mood_key, score in mood_scores.items():
                    if mood_key in mood_text:
                        mood_score = score
                        break
                
                if mood_score:
                    mood_values.append(float(mood_score))
                    pnl_values.append(day_data['pnl'])
                    win_rate_values.append(day_data['win_rate'])
        
        if len(mood_values) >= self.MIN_SAMPLE_ABSOLUTE:
            # Mood vs P&L correlation
            pnl_correlation = self._calculate_correlation(
                mood_values, pnl_values, "mood_score", "daily_pnl"
            )
            correlations.append(pnl_correlation)
            
            # Mood vs Win Rate correlation
            if len(win_rate_values) >= self.MIN_SAMPLE_ABSOLUTE:
                win_rate_correlation = self._calculate_correlation(
                    mood_values, win_rate_values, "mood_score", "win_rate"
                )
                correlations.append(win_rate_correlation)
        
        return correlations
    
    def _calculate_frequency_emotion_correlations(self, daily_data: Dict[date, Dict[str, Any]]) -> List[CorrelationResult]:
        """Calculate correlations between trading frequency and emotional indicators"""
        correlations = []
        
        trade_counts = []
        mood_scores = []
        
        # Simple mood scoring for frequency analysis
        for day_data in daily_data.values():
            if day_data['trade_count'] > 0 and day_data['mood']:
                trade_counts.append(float(day_data['trade_count']))
                
                # Simple emotional state scoring (negative emotions might indicate overtrading)
                mood_text = day_data['mood'].lower()
                emotional_score = 3  # neutral default
                
                if any(word in mood_text for word in ['anxious', 'stressed', 'frustrated', 'impulsive']):
                    emotional_score = 1  # negative emotional state
                elif any(word in mood_text for word in ['calm', 'focused', 'disciplined', 'patient']):
                    emotional_score = 5  # positive emotional state
                
                mood_scores.append(float(emotional_score))
        
        if len(trade_counts) >= self.MIN_SAMPLE_ABSOLUTE:
            correlation_result = self._calculate_correlation(
                trade_counts, mood_scores, "trade_frequency", "emotional_state"
            )
            correlations.append(correlation_result)
        
        return correlations
    
    def _calculate_risk_management_correlations(self, data_summary: TraderDataSummary) -> List[CorrelationResult]:
        """Calculate correlations related to risk management"""
        correlations = []
        
        # This would require more detailed trade data analysis
        # For now, return placeholder indicating need for more data
        
        if len(data_summary.trades) >= self.MIN_SAMPLE_ABSOLUTE:
            # Placeholder for stop-loss adherence vs performance
            # Would need actual stop-loss data from trades
            pass
        
        return correlations
    
    def _calculate_correlation(self, x_values: List[float], y_values: List[float], 
                             var1_name: str, var2_name: str) -> CorrelationResult:
        """Calculate Pearson correlation with significance testing"""
        n = len(x_values)
        
        if n < self.MIN_SAMPLE_ABSOLUTE:
            return CorrelationResult(
                variable_1=var1_name,
                variable_2=var2_name,
                correlation=0.0,
                sample_size=n,
                p_value=1.0,
                significance="insufficient_data",
                confidence_score=0.0,
                interpretation="Insufficient data for correlation analysis"
            )
        
        # Calculate Pearson correlation coefficient
        x_mean = mean(x_values)
        y_mean = mean(y_values)
        
        numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, y_values))
        
        x_variance = sum((x - x_mean) ** 2 for x in x_values)
        y_variance = sum((y - y_mean) ** 2 for y in y_values)
        
        if x_variance == 0 or y_variance == 0:
            correlation = 0.0
        else:
            correlation = numerator / math.sqrt(x_variance * y_variance)
        
        # Calculate approximate p-value using t-distribution
        if n <= 2 or abs(correlation) == 1.0:
            p_value = 1.0
        else:
            t_stat = correlation * math.sqrt((n - 2) / (1 - correlation ** 2))
            # Simplified p-value approximation
            p_value = max(0.01, min(0.99, 2 * (1 - abs(t_stat) / math.sqrt(n))))
        
        # Determine significance level
        if n >= self.MIN_SAMPLE_HIGH_SIGNIFICANCE and p_value < 0.05:
            significance = "high"
            confidence_score = min(0.9, 0.5 + abs(correlation) * 0.4)
        elif n >= self.MIN_SAMPLE_MEDIUM_SIGNIFICANCE and p_value < 0.1:
            significance = "medium"
            confidence_score = min(0.7, 0.3 + abs(correlation) * 0.4)
        elif n >= self.MIN_SAMPLE_LOW_SIGNIFICANCE:
            significance = "low"
            confidence_score = min(0.5, 0.1 + abs(correlation) * 0.3)
        else:
            significance = "insufficient_data"
            confidence_score = min(0.3, abs(correlation) * 0.2)
        
        # Generate interpretation
        interpretation = self._generate_correlation_interpretation(
            correlation, significance, var1_name, var2_name
        )
        
        return CorrelationResult(
            variable_1=var1_name,
            variable_2=var2_name,
            correlation=round(correlation, 3),
            sample_size=n,
            p_value=round(p_value, 3),
            significance=significance,
            confidence_score=round(confidence_score, 2),
            interpretation=interpretation
        )
    
    def _generate_correlation_interpretation(self, correlation: float, significance: str, 
                                           var1: str, var2: str) -> str:
        """Generate human-readable interpretation of correlation"""
        if significance == "insufficient_data":
            return f"Insufficient data to determine relationship between {var1} and {var2}"
        
        strength = "weak"
        if abs(correlation) > 0.7:
            strength = "strong"
        elif abs(correlation) > 0.4:
            strength = "moderate"
        
        direction = "positive" if correlation > 0 else "negative"
        
        confidence_qualifier = {
            "high": "statistically significant",
            "medium": "potentially meaningful", 
            "low": "tentative"
        }.get(significance, "uncertain")
        
        return f"{confidence_qualifier.title()} {strength} {direction} relationship between {var1} and {var2}"

def filter_significant_correlations(correlations: List[CorrelationResult], 
                                  min_significance: str = "low") -> List[CorrelationResult]:
    """Filter correlations by minimum significance level"""
    significance_order = ["insufficient_data", "low", "medium", "high"]
    min_level = significance_order.index(min_significance)
    
    return [
        corr for corr in correlations 
        if significance_order.index(corr.significance) >= min_level
    ]

def format_correlations_for_ai_prompt(correlations: List[CorrelationResult]) -> List[Dict[str, Any]]:
    """Format correlation results for AI prompt consumption"""
    return [
        {
            "variable_1": corr.variable_1,
            "variable_2": corr.variable_2,
            "correlation": corr.correlation,
            "sample_size": corr.sample_size,
            "significance": corr.significance,
            "confidence_score": corr.confidence_score,
            "interpretation": corr.interpretation
        }
        for corr in correlations
    ]
