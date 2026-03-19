from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date, timedelta
from pydantic import BaseModel
import statistics
from collections import defaultdict, Counter
from app.libs.trading_calculations import TradeData, parse_datetime_flexible

# ============================================================================
# ADVANCED ANALYTICS DATA CONTRACTS
# ============================================================================

class JournalEntry(BaseModel):
    """Standardized journal entry structure"""
    date: str
    mood: Optional[str] = None
    energy: Optional[str] = None
    confidence: Optional[str] = None
    notes: Optional[str] = None
    habits: List[Dict[str, Any]] = []
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'JournalEntry':
        """Create JournalEntry from various input formats"""
        return cls(
            date=data.get('date', ''),
            mood=data.get('mood'),
            energy=data.get('energy'),
            confidence=data.get('confidence'),
            notes=data.get('notes'),
            habits=data.get('habits', [])
        )

class HabitData(BaseModel):
    """Standardized habit tracking data"""
    name: str
    category: Optional[str] = None
    completed: bool = False
    date: str
    streak: Optional[int] = None

class CorrelationResult(BaseModel):
    """Correlation analysis result"""
    factor_name: str
    correlation_coefficient: float
    confidence_level: float
    sample_size: int
    description: str
    recommendation: Optional[str] = None

class PatternDetection(BaseModel):
    """Trading pattern detection results"""
    pattern_type: str  # 'time_based', 'symbol_based', 'volume_based'
    pattern_name: str
    frequency: int
    success_rate: float
    avg_pnl: float
    description: str
    examples: List[Dict[str, Any]] = []

class BehavioralInsight(BaseModel):
    """Behavioral trading insight"""
    insight_type: str  # 'strength', 'weakness', 'opportunity', 'risk'
    title: str
    description: str
    supporting_data: Dict[str, Any]
    confidence_score: float
    actionable_recommendation: str

class ConsistencyScore(BaseModel):
    """Trading consistency metrics"""
    overall_score: float  # 0-100
    timing_consistency: float
    size_consistency: float
    profit_consistency: float
    habit_adherence: float
    factors: List[str]
    recommendations: List[str]

class AdvancedAnalytics(BaseModel):
    """Complete advanced analytics package"""
    correlations: List[CorrelationResult]
    patterns: List[PatternDetection]
    insights: List[BehavioralInsight]
    consistency: ConsistencyScore
    data_period: Dict[str, str]
    analysis_quality: float

# ============================================================================
# CORRELATION ANALYSIS
# ============================================================================

def calculate_habit_performance_correlation(
    trades: List[TradeData], 
    journal_entries: List[JournalEntry]
) -> List[CorrelationResult]:
    """Calculate correlation between habits and trading performance"""
    
    correlations = []
    
    if not trades or not journal_entries:
        return correlations
    
    # Group trades by date
    daily_performance = defaultdict(list)
    
    for trade in trades:
        close_time = parse_datetime_flexible(trade.close_time)
        if close_time:
            trade_date = close_time.date().isoformat()
            daily_performance[trade_date].append(trade.pnl)
    
    # Calculate daily P&L
    daily_pnl = {}
    for date_str, pnls in daily_performance.items():
        daily_pnl[date_str] = sum(pnls)
    
    # Group habits by category and date
    daily_habits = defaultdict(lambda: defaultdict(list))
    
    for entry in journal_entries:
        entry_date = entry.date
        for habit in entry.habits:
            # Handle both dictionary and object formats for habits
            if isinstance(habit, dict):
                habit_name = habit.get('name') or habit.get('label', '')
                category = habit.get('category', 'general')
                completed = habit.get('completed', False)
            else:
                # Handle object format (from Pydantic models)
                habit_name = getattr(habit, 'name', None) or getattr(habit, 'label', '')
                category = getattr(habit, 'category', 'general')
                completed = getattr(habit, 'completed', False)
            
            if habit_name:
                daily_habits[category][entry_date].append(completed)
    
    # Calculate correlations for each habit category
    for category, date_habits in daily_habits.items():
        if len(date_habits) < 5:  # Need minimum data points
            continue
        
        habit_scores = []
        performance_scores = []
        
        for date_str, completions in date_habits.items():
            if date_str in daily_pnl:
                # Calculate habit completion rate for the day
                completion_rate = sum(completions) / len(completions) if completions else 0
                habit_scores.append(completion_rate)
                performance_scores.append(daily_pnl[date_str])
        
        if len(habit_scores) >= 5:  # Minimum sample size
            correlation = calculate_correlation_coefficient(habit_scores, performance_scores)
            
            correlations.append(CorrelationResult(
                factor_name=f"{category}_habits",
                correlation_coefficient=correlation,
                confidence_level=min(0.95, len(habit_scores) / 30),  # More data = higher confidence
                sample_size=len(habit_scores),
                description=f"Correlation between {category} habit completion and daily P&L",
                recommendation=generate_habit_recommendation(category, correlation)
            ))
    
    return correlations

def calculate_mood_performance_correlation(
    trades: List[TradeData], 
    journal_entries: List[JournalEntry]
) -> List[CorrelationResult]:
    """Calculate correlation between mood/energy and trading performance"""
    
    correlations = []
    
    # Group trades by date
    daily_performance = defaultdict(list)
    for trade in trades:
        close_time = parse_datetime_flexible(trade.close_time)
        if close_time:
            trade_date = close_time.date().isoformat()
            daily_performance[trade_date].append(trade.pnl)
    
    daily_pnl = {date_str: sum(pnls) for date_str, pnls in daily_performance.items()}
    
    # Analyze mood factors
    mood_factors = ['mood', 'energy', 'confidence']
    
    for factor in mood_factors:
        factor_scores = []
        performance_scores = []
        
        for entry in journal_entries:
            entry_date = entry.date
            if entry_date in daily_pnl:
                factor_value = getattr(entry, factor)
                if factor_value:
                    # Convert mood/energy/confidence to numeric score
                    numeric_score = convert_mood_to_numeric(factor_value)
                    if numeric_score is not None:
                        factor_scores.append(numeric_score)
                        performance_scores.append(daily_pnl[entry_date])
        
        if len(factor_scores) >= 5:
            correlation = calculate_correlation_coefficient(factor_scores, performance_scores)
            
            correlations.append(CorrelationResult(
                factor_name=factor,
                correlation_coefficient=correlation,
                confidence_level=min(0.95, len(factor_scores) / 20),
                sample_size=len(factor_scores),
                description=f"Correlation between {factor} levels and daily trading performance",
                recommendation=generate_mood_recommendation(factor, correlation)
            ))
    
    return correlations

def calculate_correlation_coefficient(x_values: List[float], y_values: List[float]) -> float:
    """Calculate Pearson correlation coefficient"""
    if len(x_values) != len(y_values) or len(x_values) < 2:
        return 0.0
    
    n = len(x_values)
    sum_x = sum(x_values)
    sum_y = sum(y_values)
    sum_xy = sum(x * y for x, y in zip(x_values, y_values))
    sum_x2 = sum(x * x for x in x_values)
    sum_y2 = sum(y * y for y in y_values)
    
    numerator = n * sum_xy - sum_x * sum_y
    denominator = ((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)) ** 0.5
    
    if denominator == 0:
        return 0.0
    
    return numerator / denominator

def convert_mood_to_numeric(mood_value: str) -> Optional[float]:
    """Convert mood/energy/confidence strings to numeric values"""
    if mood_value is None:
        return None
        
    mood_lower = mood_value.lower().strip()
    
    # Define mapping for common mood/energy values
    mood_mapping = {
        'very_low': 1, 'very low': 1, 'terrible': 1, 'awful': 1,
        'low': 2, 'bad': 2, 'poor': 2,
        'neutral': 3, 'okay': 3, 'average': 3, 'medium': 3,
        'good': 4, 'high': 4, 'great': 4,
        'very_high': 5, 'very high': 5, 'excellent': 5, 'amazing': 5
    }
    
    return mood_mapping.get(mood_lower)

# ============================================================================
# PATTERN DETECTION
# ============================================================================

def detect_time_based_patterns(trades: List[TradeData]) -> List[PatternDetection]:
    """Detect time-based trading patterns"""
    patterns = []
    
    if not trades:
        return patterns
    
    # Analyze by hour of day
    hourly_performance = defaultdict(list)
    
    for trade in trades:
        open_time = parse_datetime_flexible(trade.open_time)
        if open_time:
            hour = open_time.hour
            hourly_performance[hour].append({
                'pnl': trade.pnl,
                'success': trade.pnl > 0
            })
    
    # Find significant hourly patterns
    for hour, trades_data in hourly_performance.items():
        if len(trades_data) >= 5:  # Minimum sample size
            success_rate = sum(1 for t in trades_data if t['success']) / len(trades_data)
            avg_pnl = statistics.mean([t['pnl'] for t in trades_data])
            
            if success_rate >= 0.7 or success_rate <= 0.3 or abs(avg_pnl) > 50:
                pattern_type = "profitable" if success_rate > 0.6 else "problematic"
                
                patterns.append(PatternDetection(
                    pattern_type="time_based",
                    pattern_name=f"Hour {hour}:00 trading ({pattern_type})",
                    frequency=len(trades_data),
                    success_rate=round(success_rate * 100, 1),
                    avg_pnl=round(avg_pnl, 2),
                    description=f"Trading at {hour}:00 shows {pattern_type} results",
                    examples=[{"hour": hour, "sample_trades": min(3, len(trades_data))}]
                ))
    
    # Analyze by day of week
    daily_performance = defaultdict(list)
    
    for trade in trades:
        open_time = parse_datetime_flexible(trade.open_time)
        if open_time:
            day_name = open_time.strftime('%A')
            daily_performance[day_name].append({
                'pnl': trade.pnl,
                'success': trade.pnl > 0
            })
    
    for day, trades_data in daily_performance.items():
        if len(trades_data) >= 3:
            success_rate = sum(1 for t in trades_data if t['success']) / len(trades_data)
            avg_pnl = statistics.mean([t['pnl'] for t in trades_data])
            
            if success_rate >= 0.7 or success_rate <= 0.3:
                pattern_type = "strong" if success_rate > 0.6 else "weak"
                
                patterns.append(PatternDetection(
                    pattern_type="time_based",
                    pattern_name=f"{day} performance ({pattern_type})",
                    frequency=len(trades_data),
                    success_rate=round(success_rate * 100, 1),
                    avg_pnl=round(avg_pnl, 2),
                    description=f"{day} trading shows {pattern_type} performance patterns",
                    examples=[{"day": day, "sample_trades": min(3, len(trades_data))}]
                ))
    
    return patterns

def detect_symbol_patterns(trades: List[TradeData]) -> List[PatternDetection]:
    """Detect symbol-specific trading patterns"""
    patterns = []
    
    symbol_performance = defaultdict(list)
    
    for trade in trades:
        if trade.symbol:
            symbol_performance[trade.symbol].append({
                'pnl': trade.pnl,
                'success': trade.pnl > 0,
                'volume': trade.volume
            })
    
    for symbol, trades_data in symbol_performance.items():
        if len(trades_data) >= 3:
            success_rate = sum(1 for t in trades_data if t['success']) / len(trades_data)
            avg_pnl = statistics.mean([t['pnl'] for t in trades_data])
            
            if success_rate >= 0.8 or success_rate <= 0.2 or abs(avg_pnl) > 100:
                pattern_type = "strong" if success_rate > 0.6 else "problematic"
                
                patterns.append(PatternDetection(
                    pattern_type="symbol_based",
                    pattern_name=f"{symbol} trading ({pattern_type})",
                    frequency=len(trades_data),
                    success_rate=round(success_rate * 100, 1),
                    avg_pnl=round(avg_pnl, 2),
                    description=f"{symbol} shows {pattern_type} trading patterns",
                    examples=[{"symbol": symbol, "trades_count": len(trades_data)}]
                ))
    
    return patterns

# ============================================================================
# BEHAVIORAL INSIGHTS
# ============================================================================

def generate_behavioral_insights(
    trades: List[TradeData], 
    journal_entries: List[JournalEntry],
    correlations: List[CorrelationResult],
    patterns: List[PatternDetection]
) -> List[BehavioralInsight]:
    """Generate actionable behavioral insights"""
    
    insights = []
    
    # Analyze risk management behavior
    risk_insights = analyze_risk_behavior(trades)
    insights.extend(risk_insights)
    
    # Analyze revenge trading patterns
    revenge_insights = detect_revenge_trading(trades)
    insights.extend(revenge_insights)
    
    # Analyze win streak behaviors  
    streak_insights = analyze_win_streak_behavior(trades)
    insights.extend(streak_insights)
    
    # Analyze recovery patterns
    recovery_insights = analyze_recovery_patterns(trades)
    insights.extend(recovery_insights)
    
    # Analyze time-based performance variations
    time_insights = analyze_time_performance_variations(trades)
    insights.extend(time_insights)
    
    # Analyze symbol specialization
    symbol_insights = analyze_symbol_specialization(trades)
    insights.extend(symbol_insights)
    
    # Analyze commission impact
    commission_insights = analyze_commission_impact(trades)
    insights.extend(commission_insights)
    
    return insights

def analyze_risk_behavior(trades: List[TradeData]) -> List[BehavioralInsight]:
    """Analyze risk management behavioral patterns"""
    insights = []
    
    if len(trades) < 10:
        return insights
    
    # Calculate position size variations
    sizes = [abs(trade.quantity * trade.entry_price) if trade.entry_price else 0 for trade in trades]
    sizes = [s for s in sizes if s > 0]  # Filter out zero sizes
    
    if len(sizes) < 5:
        return insights
    
    size_std = statistics.stdev(sizes) if len(sizes) > 1 else 0
    size_mean = statistics.mean(sizes)
    size_cv = size_std / size_mean if size_mean > 0 else 0
    
    # Detect inconsistent position sizing
    if size_cv > 0.5:  # High coefficient of variation
        insights.append(BehavioralInsight(
            insight_type="risk",
            title="Inconsistent Position Sizing Detected",
            description=f"Your position sizes vary significantly (CV: {size_cv:.2f}). This suggests inconsistent risk management.",
            supporting_data={"coefficient_variation": size_cv, "sample_size": len(sizes)},
            confidence_score=min(0.9, len(sizes) / 20),
            actionable_recommendation="Implement a fixed percentage risk model (e.g., 1-2% of account per trade) to improve consistency."
        ))
    
    return insights

def detect_revenge_trading(trades: List[TradeData]) -> List[BehavioralInsight]:
    """Detect revenge trading patterns after losses"""
    insights = []
    
    if len(trades) < 20:
        return insights
    
    # Sort trades chronologically
    sorted_trades = sorted(trades, key=lambda t: parse_datetime_flexible(t.close_time) or datetime.min)
    
    revenge_instances = 0
    total_opportunities = 0
    size_increases = []
    
    for i in range(1, len(sorted_trades)):
        prev_trade = sorted_trades[i-1]
        current_trade = sorted_trades[i]
        
        # Check if previous trade was a loss
        if prev_trade.pnl < 0:
            total_opportunities += 1
            
            # Calculate position size change
            prev_size = abs(prev_trade.quantity * (prev_trade.entry_price or 1))
            current_size = abs(current_trade.quantity * (current_trade.entry_price or 1))
            
            if prev_size > 0 and current_size > 0:
                size_ratio = current_size / prev_size
                size_increases.append(size_ratio)
                
                # Detect significant size increase after loss (potential revenge trading)
                if size_ratio > 1.3:  # 30% or more increase
                    revenge_instances += 1
    
    if total_opportunities >= 10:  # Need sufficient data
        revenge_rate = revenge_instances / total_opportunities
        avg_size_increase = statistics.mean(size_increases) if size_increases else 1.0
        
        if revenge_rate > 0.2:  # More than 20% of losses followed by size increases
            insight_type = "warning" if revenge_rate > 0.4 else "risk"
            confidence = min(0.95, total_opportunities / 30)
            
            insights.append(BehavioralInsight(
                insight_type=insight_type,
                title="Revenge Trading Pattern Detected",
                description=f"After {revenge_rate:.1%} of losing trades, you increase position size by {(avg_size_increase-1)*100:.1f}% on average. This revenge trading pattern increases risk.",
                supporting_data={
                    "revenge_rate": revenge_rate,
                    "avg_size_increase": avg_size_increase,
                    "sample_size": total_opportunities
                },
                confidence_score=confidence,
                actionable_recommendation="Implement a cooling-off period after losses. Consider reducing position size or taking a break after 2+ consecutive losses."
            ))
    
    return insights

def analyze_win_streak_behavior(trades: List[TradeData]) -> List[BehavioralInsight]:
    """Analyze behavior during winning streaks"""
    insights = []
    
    if len(trades) < 20:
        return insights
    
    # Sort trades chronologically
    sorted_trades = sorted(trades, key=lambda t: parse_datetime_flexible(t.close_time) or datetime.min)
    
    # Track streaks and position sizes
    current_streak = 0
    streak_sizes = []
    normal_sizes = []
    
    for trade in sorted_trades:
        trade_size = abs(trade.quantity * (trade.entry_price or 1))
        
        if trade.pnl > 0:
            current_streak += 1
            if current_streak >= 3:  # In a winning streak
                streak_sizes.append(trade_size)
        else:
            if current_streak >= 3:  # End of winning streak
                pass  # Already captured the streak trades
            current_streak = 0
            if trade_size > 0:
                normal_sizes.append(trade_size)
    
    if len(streak_sizes) >= 5 and len(normal_sizes) >= 5:
        avg_streak_size = statistics.mean(streak_sizes)
        avg_normal_size = statistics.mean(normal_sizes)
        size_ratio = avg_streak_size / avg_normal_size if avg_normal_size > 0 else 1.0
        
        if size_ratio > 1.4:  # 40% larger during streaks
            insights.append(BehavioralInsight(
                insight_type="warning",
                title="Win Streak Overtrading Detected",
                description=f"During winning streaks, your average position size increases by {(size_ratio-1)*100:.1f}%. This overconfidence pattern can lead to larger losses.",
                supporting_data={
                    "size_ratio": size_ratio,
                    "streak_trades": len(streak_sizes),
                    "normal_trades": len(normal_sizes)
                },
                confidence_score=min(0.9, (len(streak_sizes) + len(normal_sizes)) / 30),
                actionable_recommendation="Maintain consistent position sizing regardless of recent performance. Success doesn't predict future success."
            ))
    
    return insights

def analyze_recovery_patterns(trades: List[TradeData]) -> List[BehavioralInsight]:
    """Analyze recovery patterns after drawdowns"""
    insights = []
    
    if len(trades) < 30:
        return insights
    
    # Sort trades chronologically
    sorted_trades = sorted(trades, key=lambda t: parse_datetime_flexible(t.close_time) or datetime.min)
    
    # Calculate running P&L to identify drawdown periods
    running_pnl = 0
    running_equity = []
    
    for trade in sorted_trades:
        running_pnl += trade.pnl
        running_equity.append(running_pnl)
    
    # Find drawdown periods (decline from peak)
    peaks = []
    drawdowns = []
    current_peak = running_equity[0]
    
    for i, equity in enumerate(running_equity):
        if equity > current_peak:
            current_peak = equity
            peaks.append((i, equity))
        else:
            drawdown = (current_peak - equity) / abs(current_peak) if current_peak != 0 else 0
            drawdowns.append((i, drawdown))
    
    # Analyze recovery times and patterns
    significant_drawdowns = [(i, dd) for i, dd in drawdowns if dd > 0.1]  # 10%+ drawdowns
    
    if len(significant_drawdowns) >= 3:
        recovery_times = []
        recovery_methods = {"slow_steady": 0, "aggressive": 0, "mixed": 0}
        
        for dd_start, dd_size in significant_drawdowns:
            # Find recovery period
            recovery_start_equity = running_equity[dd_start]
            recovery_trades = 0
            aggressive_recoveries = 0
            
            for i in range(dd_start + 1, min(dd_start + 20, len(running_equity))):
                recovery_trades += 1
                if running_equity[i] >= recovery_start_equity:
                    # Recovered! Analyze how
                    recent_trades = sorted_trades[max(0, dd_start):i+1]
                    large_wins = sum(1 for t in recent_trades if t.pnl > statistics.mean([t.pnl for t in recent_trades]) * 2)
                    
                    if large_wins >= 2:
                        recovery_methods["aggressive"] += 1
                    elif recovery_trades <= 5:
                        recovery_methods["aggressive"] += 1  
                    else:
                        recovery_methods["slow_steady"] += 1
                    
                    recovery_times.append(recovery_trades)
                    break
        
        if recovery_times:
            avg_recovery_time = statistics.mean(recovery_times)
            dominant_method = max(recovery_methods, key=recovery_methods.get)
            
            insights.append(BehavioralInsight(
                insight_type="strength" if dominant_method == "slow_steady" else "risk",
                title=f"Drawdown Recovery Pattern: {dominant_method.replace('_', ' ').title()}",
                description=f"You typically recover from drawdowns in {avg_recovery_time:.1f} trades using {dominant_method.replace('_', ' ')} approach.",
                supporting_data={
                    "avg_recovery_time": avg_recovery_time,
                    "recovery_method": dominant_method,
                    "sample_size": len(recovery_times)
                },
                confidence_score=min(0.9, len(recovery_times) / 5),
                actionable_recommendation="Slow, steady recovery with consistent sizing typically leads to more sustainable results than aggressive comeback attempts."
            ))
    
    return insights

def analyze_time_performance_variations(trades: List[TradeData]) -> List[BehavioralInsight]:
    """Analyze performance variations by time of day and day of week"""
    insights = []
    
    if len(trades) < 30:
        return insights
    
    # Group by hour of day
    hourly_performance = defaultdict(list)
    daily_performance = defaultdict(list)
    
    for trade in trades:
        trade_time = parse_datetime_flexible(trade.open_time)
        if trade_time:
            hour = trade_time.hour
            day_name = trade_time.strftime('%A')
            
            hourly_performance[hour].append(trade.pnl)
            daily_performance[day_name].append(trade.pnl)
    
    # Find best and worst hours
    hourly_averages = {}
    for hour, pnls in hourly_performance.items():
        if len(pnls) >= 3:  # Minimum sample size
            avg_pnl = statistics.mean(pnls)
            win_rate = sum(1 for p in pnls if p > 0) / len(pnls)
            hourly_averages[hour] = {"avg_pnl": avg_pnl, "win_rate": win_rate, "count": len(pnls)}
    
    if len(hourly_averages) >= 3:
        # Find significant time patterns
        best_hour = max(hourly_averages.items(), key=lambda x: x[1]["avg_pnl"])
        worst_hour = min(hourly_averages.items(), key=lambda x: x[1]["avg_pnl"])
        
        performance_gap = best_hour[1]["avg_pnl"] - worst_hour[1]["avg_pnl"]
        
        if performance_gap > 50:  # Significant difference
            insights.append(BehavioralInsight(
                insight_type="opportunity",
                title="Significant Time-of-Day Performance Variation",
                description=f"You perform best at {best_hour[0]:02d}:00 (avg: ${best_hour[1]['avg_pnl']:.2f}) and worst at {worst_hour[0]:02d}:00 (avg: ${worst_hour[1]['avg_pnl']:.2f}).",
                supporting_data={
                    "best_hour": best_hour[0],
                    "worst_hour": worst_hour[0],
                    "performance_gap": performance_gap,
                    "sample_size": sum(h["count"] for h in hourly_averages.values())
                },
                confidence_score=min(0.9, sum(h["count"] for h in hourly_averages.values()) / 50),
                actionable_recommendation=f"Consider concentrating trading activities around {best_hour[0]:02d}:00 and avoiding {worst_hour[0]:02d}:00 when possible."
            ))
    
    # Analyze day-of-week patterns
    daily_averages = {}
    for day, pnls in daily_performance.items():
        if len(pnls) >= 3:
            avg_pnl = statistics.mean(pnls)
            win_rate = sum(1 for p in pnls if p > 0) / len(pnls)
            daily_averages[day] = {"avg_pnl": avg_pnl, "win_rate": win_rate, "count": len(pnls)}
    
    if len(daily_averages) >= 3:
        best_day = max(daily_averages.items(), key=lambda x: x[1]["avg_pnl"])
        worst_day = min(daily_averages.items(), key=lambda x: x[1]["avg_pnl"])
        
        day_performance_gap = best_day[1]["avg_pnl"] - worst_day[1]["avg_pnl"]
        
        if day_performance_gap > 30:  # Significant difference
            insights.append(BehavioralInsight(
                insight_type="opportunity",
                title="Day-of-Week Performance Pattern",
                description=f"Your {best_day[0]} trading (avg: ${best_day[1]['avg_pnl']:.2f}) significantly outperforms {worst_day[0]} (avg: ${worst_day[1]['avg_pnl']:.2f}).",
                supporting_data={
                    "best_day": best_day[0],
                    "worst_day": worst_day[0],
                    "performance_gap": day_performance_gap,
                    "sample_size": sum(d["count"] for d in daily_averages.values())
                },
                confidence_score=min(0.9, sum(d["count"] for d in daily_averages.values()) / 30),
                actionable_recommendation=f"Consider reducing trading activity on {worst_day[0]}s or implementing more conservative strategies on that day."
            ))
    
    return insights

def analyze_symbol_specialization(trades: List[TradeData]) -> List[BehavioralInsight]:
    """Analyze currency pair/symbol specialization patterns"""
    insights = []
    
    if len(trades) < 20:
        return insights
    
    # Group by symbol
    symbol_performance = defaultdict(list)
    
    for trade in trades:
        if trade.symbol:
            symbol_performance[trade.symbol].append(trade.pnl)
    
    # Analyze each symbol with sufficient data
    symbol_stats = {}
    for symbol, pnls in symbol_performance.items():
        if len(pnls) >= 5:  # Minimum trades per symbol
            avg_pnl = statistics.mean(pnls)
            win_rate = sum(1 for p in pnls if p > 0) / len(pnls)
            max_win = max(pnls)
            max_loss = min(pnls)
            total_pnl = sum(pnls)
            
            symbol_stats[symbol] = {
                "avg_pnl": avg_pnl,
                "win_rate": win_rate,
                "count": len(pnls),
                "total_pnl": total_pnl,
                "max_win": max_win,
                "max_loss": max_loss
            }
    
    if len(symbol_stats) >= 3:
        # Find best and worst performing symbols
        best_symbol = max(symbol_stats.items(), key=lambda x: x[1]["total_pnl"])
        worst_symbol = min(symbol_stats.items(), key=lambda x: x[1]["total_pnl"])
        
        # Find symbol with highest win rate
        highest_wr_symbol = max(symbol_stats.items(), key=lambda x: x[1]["win_rate"])
        
        total_trades_analyzed = sum(s["count"] for s in symbol_stats.values())
        
        if best_symbol[1]["total_pnl"] > 0 and worst_symbol[1]["total_pnl"] < -50:
            insights.append(BehavioralInsight(
                insight_type="opportunity",
                title="Currency Pair Specialization Opportunity",
                description=f"You show strong performance with {best_symbol[0]} (${best_symbol[1]['total_pnl']:.2f} total, {best_symbol[1]['win_rate']:.1%} WR) vs weak performance with {worst_symbol[0]} (${worst_symbol[1]['total_pnl']:.2f} total).",
                supporting_data={
                    "best_symbol": best_symbol[0],
                    "worst_symbol": worst_symbol[0],
                    "best_performance": best_symbol[1],
                    "worst_performance": worst_symbol[1],
                    "sample_size": total_trades_analyzed
                },
                confidence_score=min(0.9, total_trades_analyzed / 40),
                actionable_recommendation=f"Consider specializing in {best_symbol[0]} and limiting exposure to {worst_symbol[0]} until you identify why performance differs."
            ))
    
    return insights

def analyze_commission_impact(trades: List[TradeData]) -> List[BehavioralInsight]:
    """Analyze the impact of commissions on profitability"""
    insights = []
    
    if len(trades) < 20:
        return insights
    
    # Calculate commission impact
    trades_with_commission = [t for t in trades if hasattr(t, 'commission') and t.commission and t.commission != 0]
    
    if len(trades_with_commission) >= 10:
        total_commission = sum(abs(t.commission) for t in trades_with_commission)
        total_gross_pnl = sum(t.pnl + abs(t.commission) for t in trades_with_commission)  # Add back commission
        
        commission_drag = total_commission / abs(total_gross_pnl) if total_gross_pnl != 0 else 0
        avg_commission_per_trade = total_commission / len(trades_with_commission)
        
        # Analyze break-even rate needed to overcome commissions
        profitable_trades = [t for t in trades_with_commission if t.pnl > 0]
        if profitable_trades:
            avg_win_size = statistics.mean([t.pnl for t in profitable_trades])
            breakeven_rate = avg_commission_per_trade / avg_win_size if avg_win_size > 0 else 0
            
            if commission_drag > 0.1:  # More than 10% drag
                insights.append(BehavioralInsight(
                    insight_type="risk",
                    title="High Commission Drag Detected",
                    description=f"Commissions reduce your profits by {commission_drag:.1%} (${total_commission:.2f} total). Each trade needs {breakeven_rate:.1%} profit just to break even.",
                    supporting_data={
                        "commission_drag": commission_drag,
                        "total_commission": total_commission,
                        "avg_commission": avg_commission_per_trade,
                        "breakeven_rate": breakeven_rate,
                        "sample_size": len(trades_with_commission)
                    },
                    confidence_score=min(0.9, len(trades_with_commission) / 30),
                    actionable_recommendation="Consider reducing trade frequency, increasing position sizes, or finding a broker with lower commissions to improve net profitability."
                ))
    
    return insights

# ============================================================================
# CONSISTENCY SCORING
# ============================================================================

def calculate_consistency_score(
    trades: List[TradeData], 
    journal_entries: List[JournalEntry]
) -> ConsistencyScore:
    """Calculate overall trading consistency score"""
    
    timing_score = calculate_timing_consistency(trades)
    size_score = calculate_size_consistency(trades)
    profit_score = calculate_profit_consistency(trades)
    habit_score = calculate_habit_adherence(journal_entries)
    
    # Weight the scores
    overall_score = (
        timing_score * 0.2 + 
        size_score * 0.3 + 
        profit_score * 0.3 + 
        habit_score * 0.2
    )
    
    # Generate factors and recommendations
    factors = []
    recommendations = []
    
    if timing_score < 60:
        factors.append("Irregular trading schedule")
        recommendations.append("Establish a consistent trading schedule")
    
    if size_score < 60:
        factors.append("Inconsistent position sizing")
        recommendations.append("Use systematic position sizing rules")
    
    if profit_score < 60:
        factors.append("Volatile profit patterns")
        recommendations.append("Focus on risk management and consistent strategy execution")
    
    if habit_score < 60:
        factors.append("Inconsistent habit tracking")
        recommendations.append("Maintain daily trading journal and habit tracking")
    
    return ConsistencyScore(
        overall_score=round(overall_score, 1),
        timing_consistency=round(timing_score, 1),
        size_consistency=round(size_score, 1),
        profit_consistency=round(profit_score, 1),
        habit_adherence=round(habit_score, 1),
        factors=factors,
        recommendations=recommendations
    )

def calculate_timing_consistency(trades: List[TradeData]) -> float:
    """Calculate timing consistency score"""
    if len(trades) < 5:
        return 50.0  # Neutral score for insufficient data
    
    # Analyze trading frequency consistency
    trading_dates = []
    for trade in trades:
        open_time = parse_datetime_flexible(trade.open_time)
        if open_time:
            trading_dates.append(open_time.date())
    
    if not trading_dates:
        return 0.0
    
    # Calculate gaps between trading days
    unique_dates = sorted(set(trading_dates))
    gaps = []
    
    for i in range(1, len(unique_dates)):
        gap = (unique_dates[i] - unique_dates[i-1]).days
        gaps.append(gap)
    
    if gaps:
        gap_std = statistics.stdev(gaps) if len(gaps) > 1 else 0
        gap_mean = statistics.mean(gaps)
        
        # Lower coefficient of variation = higher consistency
        cv = gap_std / gap_mean if gap_mean > 0 else 0
        consistency = max(0, 100 - (cv * 50))  # Convert to 0-100 scale
        return min(100, consistency)
    
    return 50.0

def calculate_size_consistency(trades: List[TradeData]) -> float:
    """Calculate position size consistency score"""
    volumes = [t.volume for t in trades if t.volume > 0]
    
    if len(volumes) < 3:
        return 50.0
    
    volume_std = statistics.stdev(volumes) if len(volumes) > 1 else 0
    volume_mean = statistics.mean(volumes)
    
    cv = volume_std / volume_mean if volume_mean > 0 else 0
    consistency = max(0, 100 - (cv * 100))  # Lower CV = higher consistency
    
    return min(100, consistency)

def calculate_profit_consistency(trades: List[TradeData]) -> float:
    """Calculate profit consistency score"""
    if len(trades) < 5:
        return 50.0
    
    pnls = [t.pnl for t in trades]
    
    # Calculate rolling average performance
    window_size = min(5, len(pnls) // 2)
    rolling_performance = []
    
    for i in range(window_size, len(pnls)):
        window_pnl = sum(pnls[i-window_size:i])
        rolling_performance.append(window_pnl)
    
    if len(rolling_performance) > 1:
        perf_std = statistics.stdev(rolling_performance)
        perf_mean = abs(statistics.mean(rolling_performance))
        
        if perf_mean > 0:
            cv = perf_std / perf_mean
            consistency = max(0, 100 - (cv * 50))
            return min(100, consistency)
    
    return 50.0

def calculate_habit_adherence(journal_entries: List[JournalEntry]) -> float:
    """Calculate habit adherence consistency score"""
    if len(journal_entries) < 7:
        return 30.0  # Low score for insufficient tracking
    
    # Calculate daily completion rates
    daily_completion_rates = []
    
    for entry in journal_entries:
        habits = entry.habits
        if habits:
            completed = sum(1 for h in habits if h.get('completed', False))
            total = len(habits)
            completion_rate = completed / total if total > 0 else 0
            daily_completion_rates.append(completion_rate)
    
    if not daily_completion_rates:
        return 20.0
    
    # Calculate consistency of completion rates
    avg_completion = statistics.mean(daily_completion_rates)
    
    if len(daily_completion_rates) > 1:
        completion_std = statistics.stdev(daily_completion_rates)
        cv = completion_std / avg_completion if avg_completion > 0 else 1
        
        # Base score on average completion and consistency
        base_score = avg_completion * 70  # Up to 70 points for completion rate
        consistency_bonus = max(0, 30 - (cv * 30))  # Up to 30 points for consistency
        
        return min(100, base_score + consistency_bonus)
    
    return avg_completion * 80  # Single data point

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def generate_habit_recommendation(category: str, correlation: float) -> str:
    """Generate habit-specific recommendations"""
    if correlation > 0.3:
        return f"Strong positive correlation detected. Prioritize {category} habits for better trading performance."
    elif correlation < -0.3:
        return f"Negative correlation detected. Review your {category} habits as they may be impacting performance."
    else:
        return f"Weak correlation detected. Continue tracking {category} habits to gather more data."

def generate_mood_recommendation(factor: str, correlation: float) -> str:
    """Generate mood-specific recommendations"""
    if correlation > 0.3:
        return f"Higher {factor} levels correlate with better performance. Focus on maintaining good {factor}."
    elif correlation < -0.3:
        return f"Higher {factor} levels correlate with worse performance. Consider trading strategies for different {factor} states."
    else:
        return f"No strong {factor} correlation detected. Continue monitoring for patterns."

# ============================================================================
# MAIN ANALYTICS FUNCTION
# ============================================================================

def calculate_advanced_analytics(
    trade_data: List[Dict[str, Any]], 
    journal_data: List[Dict[str, Any]],
    days_back: int = 30
) -> AdvancedAnalytics:
    """Calculate comprehensive advanced analytics"""
    
    # Convert to standardized formats
    trades = [TradeData.from_dict(t) for t in trade_data]
    journal_entries = [JournalEntry.from_dict(j) for j in journal_data]
    
    # Calculate correlations
    habit_correlations = calculate_habit_performance_correlation(trades, journal_entries)
    mood_correlations = calculate_mood_performance_correlation(trades, journal_entries)
    all_correlations = habit_correlations + mood_correlations
    
    # Detect patterns
    time_patterns = detect_time_based_patterns(trades)
    symbol_patterns = detect_symbol_patterns(trades)
    all_patterns = time_patterns + symbol_patterns
    
    # Generate insights
    insights = generate_behavioral_insights(trades, journal_entries, all_correlations, all_patterns)
    
    # Calculate consistency
    consistency = calculate_consistency_score(trades, journal_entries)
    
    # Calculate analysis quality
    analysis_quality = min(100, (
        len(trades) / 20 * 30 +  # Trade data quality (max 30 points)
        len(journal_entries) / 14 * 30 +  # Journal data quality (max 30 points)
        len(all_correlations) / 5 * 20 +  # Correlation analysis (max 20 points)
        len(all_patterns) / 3 * 20  # Pattern detection (max 20 points)
    ))
    
    return AdvancedAnalytics(
        correlations=all_correlations,
        patterns=all_patterns,
        insights=insights,
        consistency=consistency,
        data_period={
            "days_analyzed": str(days_back),
            "analysis_date": datetime.now().isoformat()
        },
        analysis_quality=round(analysis_quality, 1)
    )


