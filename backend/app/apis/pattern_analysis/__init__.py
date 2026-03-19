from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth import AuthorizedUser
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import statistics
from collections import defaultdict, Counter
from openai import OpenAI
import firebase_admin
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from app.libs.trading_calculations import TradeData, parse_datetime_flexible
from app.libs.analytics_calculations import JournalEntry
import os

router = APIRouter(prefix="/pattern-analysis")

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Initialize Firebase and Firestore client
initialize_firebase()
try:
    firestore_db = firestore.client()
except Exception as e:
    pass
    firestore_db = None

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class TradingPattern(BaseModel):
    pattern_type: str  # "revenge_trading", "overtrading", "risk_escalation", "fomo", "timing_issue"
    severity: str  # "low", "medium", "high", "critical"
    confidence_score: float  # 0.0 to 1.0
    description: str
    evidence: List[Dict[str, Any]]
    detected_at: str
    frequency: int  # How many times detected
    impact_on_performance: str
    recommendations: List[str]

class BehavioralAlert(BaseModel):
    alert_type: str  # "pattern_detected", "performance_decline", "risk_spiral", "opportunity"
    priority: str  # "low", "medium", "high", "urgent"
    title: str
    message: str
    pattern_details: Optional[TradingPattern] = None
    trigger_data: Dict[str, Any]
    created_at: str
    requires_attention: bool = True

class CoachingTrigger(BaseModel):
    trigger_type: str  # "weekly_review", "pattern_alert", "goal_check", "learning_opportunity"
    triggered_by: str  # What caused this trigger
    conversation_starter: str
    coaching_focus: List[str]
    data_context: Dict[str, Any]
    priority_score: float
    suggested_timing: str  # "immediate", "next_session", "end_of_week"

class PatternAnalysisRequest(BaseModel):
    analysis_type: str = "comprehensive"  # "post_import", "weekly_review", "monthly_deep_dive"
    days_back: int = 30
    include_journal_data: bool = True
    force_analysis: bool = False

class PatternAnalysisResponse(BaseModel):
    patterns_detected: List[TradingPattern]
    behavioral_alerts: List[BehavioralAlert]
    coaching_triggers: List[CoachingTrigger]
    analysis_summary: str
    performance_correlations: Dict[str, Any]
    recommendations: List[str]
    data_quality_score: float
    analysis_timestamp: str

class PerformanceCorrelation(BaseModel):
    correlation_type: str  # "mood_performance", "time_performance", "habit_performance"
    correlation_strength: float  # -1.0 to 1.0
    confidence_level: float  # 0.0 to 1.0
    description: str
    key_insights: List[str]
    data_points: int
    recommended_actions: List[str]

class EducationalContent(BaseModel):
    content_type: str  # "article", "video", "exercise", "case_study"
    title: str
    description: str
    relevance_score: float  # 0.0 to 1.0
    estimated_read_time: str
    key_topics: List[str]
    difficulty_level: str  # "beginner", "intermediate", "advanced"
    content_url: Optional[str] = None
    content_text: Optional[str] = None

class CoachingSession(BaseModel):
    session_id: str
    session_type: str  # "pattern_alert", "weekly_review", "monthly_deep_dive"
    triggered_by: str
    start_time: str
    conversation_id: Optional[str] = None
    coaching_focus: List[str]
    session_data: Dict[str, Any]
    completion_status: str  # "scheduled", "in_progress", "completed", "cancelled"
    effectiveness_score: Optional[float] = None
    user_feedback: Optional[Dict[str, Any]] = None

class CoachingAnalytics(BaseModel):
    total_sessions: int
    average_effectiveness: float
    pattern_detection_accuracy: float
    user_engagement_score: float
    behavioral_improvement_trends: Dict[str, Any]
    most_effective_coaching_types: List[str]
    areas_needing_improvement: List[str]
    coaching_roi_metrics: Dict[str, Any]

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def load_user_trades(user_id: str, days_back: int = 30) -> List[TradeData]:
    """Load user trades from Firestore using same logic as frontend"""
    if not firestore_db:
        return []
    
    try:
        trades = []
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        pass
        
        # Get all evaluations for user - SAME AS FRONTEND
        evaluations_ref = firestore_db.collection(f"users/{user_id}/evaluations")
        evaluations = evaluations_ref.stream()
        
        total_trades_found = 0
        recent_trades_found = 0
        
        for eval_doc in evaluations:
            # Get trades for this evaluation - SAME AS FRONTEND
            trades_ref = firestore_db.collection(f"users/{user_id}/evaluations/{eval_doc.id}/trades")
            trades_docs = trades_ref.stream()
            
            eval_trades_count = 0
            for trade_doc in trades_docs:
                trade_data = trade_doc.to_dict()
                total_trades_found += 1
                eval_trades_count += 1
                
                try:
                    # Use SAME field names as frontend (openTime, closeTime, not open_time, close_time)
                    open_time_str = trade_data.get('openTime', '') or trade_data.get('open_time', '')
                    close_time_str = trade_data.get('closeTime', '') or trade_data.get('close_time', '')
                    
                    # Convert to TradeData object with proper field mapping
                    trade = TradeData(
                        ticket=trade_data.get('ticket', 0),
                        open_time=open_time_str,
                        trade_type=trade_data.get('type', '') or trade_data.get('trade_type', ''),
                        lots=trade_data.get('lots', 0.0),
                        symbol=trade_data.get('symbol', ''),
                        open_price=trade_data.get('openPrice', 0.0) or trade_data.get('open_price', 0.0),
                        close_time=close_time_str,
                        close_price=trade_data.get('closePrice', 0.0) or trade_data.get('close_price', 0.0),
                        commission=trade_data.get('commission', 0.0),
                        swap=trade_data.get('swap', 0.0),
                        pnl=trade_data.get('pnl', 0.0)
                    )
                    
                    # Filter by date using close_time or open_time - SAME AS FRONTEND
                    time_to_check = close_time_str or open_time_str
                    if time_to_check:
                        trade_time = parse_datetime_flexible(time_to_check)
                        if trade_time and trade_time >= cutoff_date:
                            trades.append(trade)
                            recent_trades_found += 1
                    else:
                        # If no time data, include trade anyway
                        trades.append(trade)
                        recent_trades_found += 1
                        
                except Exception as e:
                    pass
                    continue
            
            pass
        
        pass
        return trades
        
    except Exception as e:
        pass
        return []

def load_user_journal_entries(user_id: str, days_back: int = 30) -> List[JournalEntry]:
    """Load user journal entries"""
    try:
        db_firestore = firestore.client()
        docs = db_firestore.collection("journal_entries").document(user_id).collection("entries").stream()

        cutoff_date = datetime.now() - timedelta(days=days_back)
        entries = []

        for doc in docs:
            entry_data = doc.to_dict()
            try:
                entry = JournalEntry.from_dict(entry_data)
                entry_date = datetime.fromisoformat(entry.date.replace('Z', '+00:00')).replace(tzinfo=None)

                if entry_date >= cutoff_date:
                    entries.append(entry)

            except Exception as e:
                pass
                continue

        return entries

    except Exception as e:
        pass
        return []

# ============================================================================
# PATTERN DETECTION ALGORITHMS
# ============================================================================

def detect_revenge_trading(trades: List[TradeData]) -> Optional[TradingPattern]:
    """Detect revenge trading patterns"""
    if len(trades) < 3:
        return None
    
    # Sort trades by close time
    sorted_trades = sorted(trades, key=lambda t: parse_datetime_flexible(t.close_time) or datetime.min)
    
    revenge_sequences = []
    current_sequence = []
    
    for i in range(len(sorted_trades) - 1):
        current_trade = sorted_trades[i]
        next_trade = sorted_trades[i + 1]
        
        # Look for loss followed by increased position size
        if (current_trade.pnl < 0 and 
            next_trade.lots > current_trade.lots * 1.5):  # 50% increase in position size
            
            current_sequence.append((current_trade, next_trade))
        else:
            if len(current_sequence) >= 1:
                revenge_sequences.append(current_sequence)
            current_sequence = []
    
    if len(current_sequence) >= 1:
        revenge_sequences.append(current_sequence)
    
    if revenge_sequences:
        total_sequences = len(revenge_sequences)
        avg_size_increase = statistics.mean([seq[0][1].lots / seq[0][0].lots for seq in revenge_sequences])
        
        severity = "high" if total_sequences >= 3 else "medium" if total_sequences >= 2 else "low"
        confidence = min(0.9, 0.3 + (total_sequences * 0.2))
        
        return TradingPattern(
            pattern_type="revenge_trading",
            severity=severity,
            confidence_score=confidence,
            description=f"Detected {total_sequences} revenge trading sequences with average {avg_size_increase:.1f}x position size increases after losses",
            evidence=[
                {
                    "sequence": i + 1,
                    "loss_trade": {
                        "ticket": seq[0][0].ticket,
                        "pnl": seq[0][0].pnl,
                        "lots": seq[0][0].lots
                    },
                    "revenge_trade": {
                        "ticket": seq[0][1].ticket,
                        "lots": seq[0][1].lots,
                        "size_increase": seq[0][1].lots / seq[0][0].lots
                    }
                }
                for i, seq in enumerate(revenge_sequences)
            ],
            detected_at=datetime.now().isoformat(),
            frequency=total_sequences,
            impact_on_performance="High risk of compounding losses through emotional decision-making",
            recommendations=[
                "Implement a mandatory 15-minute cooling-off period after any losing trade",
                "Set maximum daily position size limits that cannot be exceeded",
                "Use position sizing rules based on account percentage, not emotion",
                "Consider journaling emotions immediately after losses"
            ]
        )
    
    return None

def detect_overtrading(trades: List[TradeData]) -> Optional[TradingPattern]:
    """Detect overtrading patterns"""
    if len(trades) < 5:
        return None
    
    # Group trades by day
    daily_trades = defaultdict(list)
    for trade in trades:
        close_time = parse_datetime_flexible(trade.close_time)
        if close_time:
            date_key = close_time.date().isoformat()
            daily_trades[date_key].append(trade)
    
    # Analyze daily trading frequency
    daily_counts = [len(trades) for trades in daily_trades.values()]
    avg_daily_trades = statistics.mean(daily_counts)
    max_daily_trades = max(daily_counts)
    
    # Look for excessive trading days (more than 10 trades per day)
    excessive_days = [date for date, trades in daily_trades.items() if len(trades) > 10]
    
    # Check win rates on high-frequency days
    high_freq_performance = {}
    for date, day_trades in daily_trades.items():
        if len(day_trades) > 8:  # High frequency threshold
            winning_trades = sum(1 for t in day_trades if t.pnl > 0)
            win_rate = winning_trades / len(day_trades) if day_trades else 0
            total_pnl = sum(t.pnl for t in day_trades)
            high_freq_performance[date] = {
                "trades": len(day_trades),
                "win_rate": win_rate,
                "total_pnl": total_pnl
            }
    
    if excessive_days or avg_daily_trades > 8:
        severity = "high" if len(excessive_days) > 3 else "medium" if avg_daily_trades > 6 else "low"
        confidence = min(0.9, 0.4 + (len(excessive_days) * 0.1))
        
        avg_high_freq_win_rate = statistics.mean([p["win_rate"] for p in high_freq_performance.values()]) if high_freq_performance else 0
        
        return TradingPattern(
            pattern_type="overtrading",
            severity=severity,
            confidence_score=confidence,
            description=f"Detected overtrading with {len(excessive_days)} excessive trading days and {avg_daily_trades:.1f} average daily trades",
            evidence=[
                {
                    "excessive_trading_days": len(excessive_days),
                    "max_daily_trades": max_daily_trades,
                    "avg_daily_trades": round(avg_daily_trades, 1),
                    "high_frequency_win_rate": round(avg_high_freq_win_rate, 3),
                    "sample_excessive_days": excessive_days[:5]  # Show first 5
                }
            ],
            detected_at=datetime.now().isoformat(),
            frequency=len(excessive_days),
            impact_on_performance="Quality deterioration and increased commission costs",
            recommendations=[
                "Set a maximum daily trade limit (e.g., 5-8 trades per day)",
                "Implement trade quality checks before execution",
                "Focus on higher probability setups rather than trade frequency",
                "Track and review your best vs worst performing trading days"
            ]
        )
    
    return None

def detect_risk_escalation(trades: List[TradeData]) -> Optional[TradingPattern]:
    """Detect escalating position size patterns"""
    if len(trades) < 4:
        return None
    
    # Sort trades chronologically
    sorted_trades = sorted(trades, key=lambda t: parse_datetime_flexible(t.close_time) or datetime.min)
    
    # Analyze position size trends over time
    position_sizes = [trade.lots for trade in sorted_trades]
    
    # Look for escalating patterns
    escalation_sequences = []
    window_size = 4  # Look at 4-trade windows
    
    for i in range(len(position_sizes) - window_size + 1):
        window = position_sizes[i:i + window_size]
        
        # Check if there's a clear upward trend
        increases = 0
        for j in range(1, len(window)):
            if window[j] > window[j-1] * 1.2:  # 20% increase
                increases += 1
        
        if increases >= 2:  # At least 2 increases in the window
            escalation_sequences.append({
                "start_index": i,
                "start_size": window[0],
                "end_size": window[-1],
                "multiplier": window[-1] / window[0],
                "trades": [sorted_trades[i + k].ticket for k in range(window_size)]
            })
    
    if escalation_sequences:
        avg_multiplier = statistics.mean([seq["multiplier"] for seq in escalation_sequences])
        max_multiplier = max([seq["multiplier"] for seq in escalation_sequences])
        
        severity = "critical" if max_multiplier > 3 else "high" if max_multiplier > 2 else "medium"
        confidence = min(0.95, 0.5 + (len(escalation_sequences) * 0.1))
        
        return TradingPattern(
            pattern_type="risk_escalation",
            severity=severity,
            confidence_score=confidence,
            description=f"Detected {len(escalation_sequences)} risk escalation sequences with up to {max_multiplier:.1f}x position size increases",
            evidence=escalation_sequences[:3],  # Show first 3 sequences
            detected_at=datetime.now().isoformat(),
            frequency=len(escalation_sequences),
            impact_on_performance="Exponentially increasing risk exposure",
            recommendations=[
                "Implement strict position sizing rules based on account percentage",
                "Set maximum position size limits that cannot be overridden",
                "Use fixed fractional position sizing (e.g., 1-2% risk per trade)",
                "Create alerts when position sizes exceed normal parameters"
            ]
        )
    
    return None

def detect_timing_patterns(trades: List[TradeData]) -> Optional[TradingPattern]:
    """Detect problematic timing patterns"""
    if len(trades) < 10:
        return None
    
    # Analyze trades by hour of day
    hourly_performance = defaultdict(list)
    
    for trade in trades:
        close_time = parse_datetime_flexible(trade.close_time)
        if close_time:
            hour = close_time.hour
            hourly_performance[hour].append(trade.pnl)
    
    # Find worst performing hours
    hourly_stats = {}
    for hour, pnls in hourly_performance.items():
        if len(pnls) >= 3:  # Need at least 3 trades for statistical relevance
            avg_pnl = statistics.mean(pnls)
            win_rate = sum(1 for pnl in pnls if pnl > 0) / len(pnls)
            hourly_stats[hour] = {
                "avg_pnl": avg_pnl,
                "win_rate": win_rate,
                "trade_count": len(pnls),
                "total_pnl": sum(pnls)
            }
    
    if hourly_stats:
        # Find problematic hours (negative avg PnL and low win rate)
        problematic_hours = [
            hour for hour, stats in hourly_stats.items()
            if stats["avg_pnl"] < 0 and stats["win_rate"] < 0.4 and stats["trade_count"] >= 5
        ]
        
        if problematic_hours:
            total_problematic_trades = sum(hourly_stats[hour]["trade_count"] for hour in problematic_hours)
            total_problematic_loss = sum(hourly_stats[hour]["total_pnl"] for hour in problematic_hours)
            
            severity = "high" if len(problematic_hours) > 3 else "medium"
            confidence = min(0.85, 0.4 + (len(problematic_hours) * 0.1))
            
            return TradingPattern(
                pattern_type="timing_issue",
                severity=severity,
                confidence_score=confidence,
                description=f"Poor performance during {len(problematic_hours)} specific time periods, losing ${abs(total_problematic_loss):.2f} across {total_problematic_trades} trades",
                evidence=[
                    {
                        "problematic_hours": problematic_hours,
                        "hourly_breakdown": {str(hour): stats for hour, stats in hourly_stats.items() if hour in problematic_hours}
                    }
                ],
                detected_at=datetime.now().isoformat(),
                frequency=total_problematic_trades,
                impact_on_performance="Consistent losses during specific trading hours",
                recommendations=[
                    f"Avoid trading during hours: {', '.join([f'{h}:00' for h in problematic_hours])}",
                    "Analyze market conditions and your mental state during these hours",
                    "Consider focusing trading during your most profitable time periods",
                    "Set trading session limits or alerts for problematic timeframes"
                ]
            )
    
    return None

# ============================================================================
# MAIN ANALYSIS FUNCTIONS
# ============================================================================

def analyze_trading_patterns(trades: List[TradeData]) -> List[TradingPattern]:
    """Run comprehensive pattern analysis on trading data"""
    patterns = []
    
    # Run all pattern detection algorithms
    pattern_detectors = [
        detect_revenge_trading,
        detect_overtrading,
        detect_risk_escalation,
        detect_timing_patterns
    ]
    
    for detector in pattern_detectors:
        try:
            pattern = detector(trades)
            if pattern:
                patterns.append(pattern)
        except Exception as e:
            pass
            continue
    
    return patterns

def generate_behavioral_alerts(patterns: List[TradingPattern]) -> List[BehavioralAlert]:
    """Generate behavioral alerts based on detected patterns"""
    alerts = []
    
    for pattern in patterns:
        # Determine alert priority based on pattern severity and type
        if pattern.severity == "critical":
            priority = "urgent"
        elif pattern.severity == "high":
            priority = "high"
        elif pattern.severity == "medium":
            priority = "medium"
        else:
            priority = "low"
        
        # Create alert based on pattern type
        alert_messages = {
            "revenge_trading": f"⚠️ Revenge Trading Detected: {pattern.frequency} instances of increasing position sizes after losses",
            "overtrading": f"📈 Overtrading Alert: Excessive trading frequency detected with potential quality degradation", 
            "risk_escalation": f"🚨 Risk Escalation Warning: Position sizes increasing beyond safe parameters",
            "timing_issue": f"⏰ Timing Pattern Alert: Consistent poor performance during specific trading hours"
        }
        
        alert = BehavioralAlert(
            alert_type="pattern_detected",
            priority=priority,
            title=f"{pattern.pattern_type.replace('_', ' ').title()} Detected",
            message=alert_messages.get(pattern.pattern_type, f"Pattern detected: {pattern.description}"),
            pattern_details=pattern,
            trigger_data={
                "pattern_type": pattern.pattern_type,
                "confidence": pattern.confidence_score,
                "frequency": pattern.frequency
            },
            created_at=datetime.now().isoformat(),
            requires_attention=pattern.severity in ["high", "critical"]
        )
        
        alerts.append(alert)
    
    return alerts

def generate_coaching_triggers(patterns: List[TradingPattern], alerts: List[BehavioralAlert]) -> List[CoachingTrigger]:
    """Generate coaching conversation triggers based on patterns and alerts"""
    triggers = []
    
    # High priority patterns trigger immediate coaching
    urgent_patterns = [p for p in patterns if p.severity in ["high", "critical"]]
    
    if urgent_patterns:
        for pattern in urgent_patterns:
            conversation_starters = {
                "revenge_trading": "I've noticed some concerning patterns in your recent trading behavior. Let's talk about what happens after you experience a loss and how we can break this cycle.",
                "overtrading": "Your trading frequency has increased significantly lately. I'd like to explore what's driving this increased activity and how it's affecting your performance.",
                "risk_escalation": "I'm seeing some concerning patterns in your position sizing that we need to address immediately. Your risk exposure has been increasing in ways that could be dangerous.",
                "timing_issue": "I've identified specific time periods where your trading performance consistently suffers. Let's analyze what's happening during these times."
            }
            
            trigger = CoachingTrigger(
                trigger_type="pattern_alert",
                triggered_by=f"{pattern.pattern_type} detected with {pattern.severity} severity",
                conversation_starter=conversation_starters.get(pattern.pattern_type, "I've detected some patterns in your trading that we should discuss."),
                coaching_focus=[
                    "behavioral_patterns",
                    "risk_management", 
                    "emotional_regulation",
                    "strategy_adherence"
                ],
                data_context={
                    "pattern": pattern.model_dump(),
                    "recommendations": pattern.recommendations
                },
                priority_score=0.9 if pattern.severity == "critical" else 0.7,
                suggested_timing="immediate"
            )
            
            triggers.append(trigger)
    
    return triggers

# ============================================================================
# PERFORMANCE CORRELATION ANALYSIS
# ============================================================================

def analyze_mood_performance_correlation(trades: List[TradeData], journal_entries: List[JournalEntry]) -> Optional[PerformanceCorrelation]:
    """Analyze correlation between mood and trading performance"""
    if len(trades) < 10 or len(journal_entries) < 5:
        return None
    
    try:
        # Create daily performance and mood mapping
        daily_performance = defaultdict(list)
        daily_moods = {}
        
        # Group trades by day
        for trade in trades:
            close_time = parse_datetime_flexible(trade.close_time)
            if close_time:
                date_key = close_time.date().isoformat()
                daily_performance[date_key].append(trade.pnl)
        
        # Map journal moods to days
        for entry in journal_entries:
            try:
                entry_date = datetime.fromisoformat(entry.date.replace('Z', '+00:00')).date().isoformat()
                # Average mood score from journal entry
                mood_score = (entry.confidence + entry.focus + entry.discipline + entry.patience) / 4
                daily_moods[entry_date] = mood_score
            except Exception:
                continue
        
        # Find overlapping days
        overlapping_days = set(daily_performance.keys()) & set(daily_moods.keys())
        
        if len(overlapping_days) < 5:
            return None
        
        # Calculate correlation
        performance_scores = []
        mood_scores = []
        
        for date in overlapping_days:
            daily_pnl = sum(daily_performance[date])
            performance_scores.append(daily_pnl)
            mood_scores.append(daily_moods[date])
        
        # Simple correlation calculation
        n = len(performance_scores)
        sum_perf = sum(performance_scores)
        sum_mood = sum(mood_scores)
        sum_perf_sq = sum(x * x for x in performance_scores)
        sum_mood_sq = sum(x * x for x in mood_scores)
        sum_perf_mood = sum(performance_scores[i] * mood_scores[i] for i in range(n))
        
        numerator = n * sum_perf_mood - sum_perf * sum_mood
        denominator = ((n * sum_perf_sq - sum_perf * sum_perf) * (n * sum_mood_sq - sum_mood * sum_mood)) ** 0.5
        
        if denominator == 0:
            return None
        
        correlation = numerator / denominator
        
        # Generate insights based on correlation strength
        insights = []
        actions = []
        
        if abs(correlation) > 0.6:
            if correlation > 0:
                insights.append("Strong positive correlation: Better mood leads to better trading performance")
                actions.append("Focus on mood management and pre-trading routines")
                actions.append("Consider mood tracking as a key performance indicator")
            else:
                insights.append("Strong negative correlation: Higher mood scores associated with worse performance")
                actions.append("Investigate if overconfidence might be affecting judgment")
                actions.append("Consider implementing humility checks during high-confidence periods")
        elif abs(correlation) > 0.3:
            insights.append("Moderate correlation between mood and performance detected")
            actions.append("Continue monitoring mood patterns for deeper insights")
        else:
            insights.append("Weak correlation suggests mood may not be the primary performance driver")
            actions.append("Focus on other factors like strategy adherence and risk management")
        
        return PerformanceCorrelation(
            correlation_type="mood_performance",
            correlation_strength=correlation,
            confidence_level=min(0.9, max(0.3, n / 20)),  # Higher confidence with more data points
            description=f"Mood-performance correlation of {correlation:.3f} based on {n} overlapping trading days",
            key_insights=insights,
            data_points=n,
            recommended_actions=actions
        )
        
    except Exception as e:
        pass
        return None

def analyze_time_performance_correlation(trades: List[TradeData]) -> Optional[PerformanceCorrelation]:
    """Analyze correlation between trading times and performance"""
    if len(trades) < 20:
        return None
    
    try:
        # Group performance by hour
        hourly_performance = defaultdict(list)
        
        for trade in trades:
            close_time = parse_datetime_flexible(trade.close_time)
            if close_time:
                hour = close_time.hour
                hourly_performance[hour].append(trade.pnl)
        
        # Calculate hourly averages
        hourly_averages = {}
        for hour, pnls in hourly_performance.items():
            if len(pnls) >= 3:  # Need at least 3 trades
                hourly_averages[hour] = statistics.mean(pnls)
        
        if len(hourly_averages) < 3:
            return None
        
        # Find best and worst performing hours
        best_hours = sorted(hourly_averages.items(), key=lambda x: x[1], reverse=True)[:3]
        worst_hours = sorted(hourly_averages.items(), key=lambda x: x[1])[:3]
        
        # Calculate performance variance
        all_averages = list(hourly_averages.values())
        performance_range = max(all_averages) - min(all_averages)
        
        insights = []
        actions = []
        
        if performance_range > 50:  # Significant difference
            insights.append(f"Significant time-based performance variation detected (${performance_range:.2f} range)")
            insights.append(f"Best performing hours: {', '.join([f'{h}:00' for h, _ in best_hours])}")
            insights.append(f"Worst performing hours: {', '.join([f'{h}:00' for h, _ in worst_hours])}")
            
            actions.append("Focus trading during high-performance time periods")
            actions.append("Limit or avoid trading during consistently poor-performing hours")
            actions.append("Analyze market conditions and personal state during different times")
        else:
            insights.append("Consistent performance across different trading hours")
            actions.append("Time-based optimization may not be a priority focus area")
        
        # Simple correlation strength based on variance
        correlation_strength = min(0.8, performance_range / 100)
        
        return PerformanceCorrelation(
            correlation_type="time_performance",
            correlation_strength=correlation_strength,
            confidence_level=min(0.9, len(hourly_averages) / 15),
            description=f"Time-performance analysis across {len(hourly_averages)} active trading hours",
            key_insights=insights,
            data_points=len(trades),
            recommended_actions=actions
        )
        
    except Exception as e:
        pass
        return None

# ============================================================================
# EDUCATIONAL CONTENT INTEGRATION
# ============================================================================

def generate_educational_content(patterns: List[TradingPattern]) -> List[EducationalContent]:
    """Generate relevant educational content based on detected patterns"""
    content_library = {
        "revenge_trading": [
            {
                "title": "Breaking the Revenge Trading Cycle",
                "description": "Learn proven techniques to interrupt emotional trading patterns and maintain discipline after losses",
                "topics": ["emotional_regulation", "loss_psychology", "trading_discipline"],
                "difficulty": "intermediate",
                "read_time": "8 minutes",
                "content": """Revenge trading is one of the most destructive patterns in trading psychology. When we experience a loss, our brain's emotional centers can override rational decision-making, leading to increasingly risky trades. 
                
Key strategies to break this cycle:
1. Implement mandatory cooling-off periods after losses
2. Use position sizing rules that cannot be emotionally overridden
3. Practice acceptance meditation techniques
4. Keep a loss analysis journal to understand triggers"""
            },
            {
                "title": "The Psychology of Loss Aversion",
                "description": "Understanding why losses hurt more than gains feel good, and how this affects trading decisions",
                "topics": ["behavioral_finance", "cognitive_biases", "risk_psychology"],
                "difficulty": "beginner",
                "read_time": "6 minutes",
                "content": """Loss aversion is a fundamental cognitive bias where losses feel twice as painful as equivalent gains feel good. This asymmetry can drive revenge trading behaviors.
                
Practical applications:
1. Accept that losses are part of trading
2. Focus on process over individual outcomes
3. Use predetermined stop-loss levels
4. Celebrate good process even when trades lose"""
            }
        ],
        "overtrading": [
            {
                "title": "Quality Over Quantity: Selective Trading",
                "description": "Master the art of patience and selectivity to improve trading performance through fewer, higher-quality trades",
                "topics": ["trade_selection", "patience", "opportunity_cost"],
                "difficulty": "intermediate",
                "read_time": "10 minutes",
                "content": """Overtrading destroys more accounts than market crashes. The key is developing patience and selectivity.
                
Signs of overtrading:
1. Trading because you're bored
2. Forcing trades in choppy markets
3. Multiple trades per day without clear setups
4. Declining win rate with increased frequency
                
Solutions:
1. Set maximum daily trade limits
2. Require written justification for each trade
3. Focus on higher timeframe analysis
4. Track and compare your best vs worst trading days"""
            }
        ],
        "risk_escalation": [
            {
                "title": "Position Sizing: The Foundation of Risk Management",
                "description": "Learn systematic approaches to position sizing that prevent emotional risk escalation",
                "topics": ["risk_management", "position_sizing", "capital_preservation"],
                "difficulty": "beginner",
                "read_time": "12 minutes",
                "content": """Proper position sizing is the difference between long-term success and account destruction. Never let emotions drive your position size decisions.
                
Key principles:
1. Risk a fixed percentage per trade (1-2% recommended)
2. Position size based on stop-loss distance
3. Never increase size to 'make back' losses
4. Use position sizing calculators
                
Formula: Position Size = (Account Risk %) / (Entry Price - Stop Loss Price)"""
            }
        ],
        "timing_issue": [
            {
                "title": "Optimizing Your Trading Schedule",
                "description": "Identify your peak performance hours and align trading activity with optimal market conditions",
                "topics": ["session_management", "market_timing", "personal_optimization"],
                "difficulty": "intermediate",
                "read_time": "7 minutes",
                "content": """Not all trading hours are created equal. Your performance can vary dramatically based on time of day, market session, and personal energy levels.
                
Optimization strategies:
1. Track performance by hour/session
2. Identify your mental peak hours
3. Align trading with high-volume market periods
4. Avoid trading when tired or distracted
                
Remember: It's better to trade less during optimal times than more during suboptimal times."""
            }
        ]
    }
    
    educational_content = []
    
    for pattern in patterns:
        pattern_content = content_library.get(pattern.pattern_type, [])
        
        for content_data in pattern_content:
            # Calculate relevance score based on pattern severity
            relevance_score = 0.6
            if pattern.severity == "critical":
                relevance_score = 0.95
            elif pattern.severity == "high":
                relevance_score = 0.85
            elif pattern.severity == "medium":
                relevance_score = 0.7
            
            content = EducationalContent(
                content_type="article",
                title=content_data["title"],
                description=content_data["description"],
                relevance_score=relevance_score,
                estimated_read_time=content_data["read_time"],
                key_topics=content_data["topics"],
                difficulty_level=content_data["difficulty"],
                content_text=content_data["content"]
            )
            
            educational_content.append(content)
    
    # Remove duplicates and sort by relevance
    seen_titles = set()
    unique_content = []
    for content in educational_content:
        if content.title not in seen_titles:
            unique_content.append(content)
            seen_titles.add(content.title)
    
    # Sort by relevance score
    unique_content.sort(key=lambda x: x.relevance_score, reverse=True)
    
    return unique_content[:5]  # Return top 5 most relevant pieces

# ============================================================================
# COACHING SESSION MANAGEMENT
# ============================================================================

async def create_coaching_session(user_id: str, session_type: str, triggered_by: str, coaching_focus: List[str], session_data: Dict[str, Any]) -> CoachingSession:
    """Create a new coaching session"""
    session_id = f"coaching_{user_id}_{int(datetime.now().timestamp())}"
    
    session = CoachingSession(
        session_id=session_id,
        session_type=session_type,
        triggered_by=triggered_by,
        start_time=datetime.now().isoformat(),
        coaching_focus=coaching_focus,
        session_data=session_data,
        completion_status="scheduled"
    )
    
    # Store session data
    try:
        db_firestore = firestore.client()
        db_firestore.collection("users").document(user_id).collection("coaching_sessions").document(session.session_id).set(session.model_dump())

        pass
        return session

    except Exception as e:
        pass
        raise

async def update_coaching_session(user_id: str, session_id: str, updates: Dict[str, Any]) -> bool:
    """Update coaching session status and data"""
    try:
        db_firestore = firestore.client()
        doc_ref = db_firestore.collection("users").document(user_id).collection("coaching_sessions").document(session_id)
        if doc_ref.get().exists:
            doc_ref.update(updates)
            return True
        return False

    except Exception as e:
        pass
        return False

async def get_coaching_analytics(user_id: str) -> CoachingAnalytics:
    """Generate coaching effectiveness analytics"""
    try:
        db_firestore = firestore.client()
        docs = db_firestore.collection("users").document(user_id).collection("coaching_sessions").stream()
        sessions = [doc.to_dict() for doc in docs]
        
        if not sessions:
            return CoachingAnalytics(
                total_sessions=0,
                average_effectiveness=0.0,
                pattern_detection_accuracy=0.0,
                user_engagement_score=0.0,
                behavioral_improvement_trends={},
                most_effective_coaching_types=[],
                areas_needing_improvement=[],
                coaching_roi_metrics={}
            )
        
        # Calculate metrics
        total_sessions = len(sessions)
        completed_sessions = [s for s in sessions if s.get("completion_status") == "completed"]
        
        # Average effectiveness (from user feedback)
        effectiveness_scores = [s.get("effectiveness_score", 0) for s in completed_sessions if s.get("effectiveness_score")]
        avg_effectiveness = statistics.mean(effectiveness_scores) if effectiveness_scores else 0.0
        
        # Session type effectiveness
        session_types = defaultdict(list)
        for session in completed_sessions:
            if session.get("effectiveness_score"):
                session_types[session.get("session_type", "unknown")].append(session["effectiveness_score"])
        
        most_effective_types = sorted(
            [(stype, statistics.mean(scores)) for stype, scores in session_types.items()],
            key=lambda x: x[1], reverse=True
        )
        
        return CoachingAnalytics(
            total_sessions=total_sessions,
            average_effectiveness=avg_effectiveness,
            pattern_detection_accuracy=0.8,  # Placeholder - would need more sophisticated tracking
            user_engagement_score=len(completed_sessions) / total_sessions if total_sessions > 0 else 0,
            behavioral_improvement_trends={
                "sessions_completed": len(completed_sessions),
                "average_session_effectiveness": avg_effectiveness
            },
            most_effective_coaching_types=[mtype for mtype, _ in most_effective_types[:3]],
            areas_needing_improvement=[
                "pattern_detection_accuracy" if avg_effectiveness < 0.7 else "user_engagement"
            ],
            coaching_roi_metrics={
                "sessions_per_month": total_sessions,
                "completion_rate": len(completed_sessions) / total_sessions if total_sessions > 0 else 0
            }
        )
        
    except Exception as e:
        pass
        return CoachingAnalytics(
            total_sessions=0,
            average_effectiveness=0.0,
            pattern_detection_accuracy=0.0,
            user_engagement_score=0.0,
            behavioral_improvement_trends={},
            most_effective_coaching_types=[],
            areas_needing_improvement=[],
            coaching_roi_metrics={}
        )

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/health")
async def pattern_analysis_health_check():
    """Health check for pattern analysis API"""
    return {
        "status": "healthy", 
        "service": "pattern_analysis", 
        "timestamp": datetime.now().isoformat(),
        "features": [
            "revenge_trading_detection",
            "overtrading_analysis", 
            "risk_escalation_monitoring",
            "timing_pattern_recognition",
            "behavioral_alert_system",
            "coaching_trigger_generation"
        ]
    }

@router.post("/analyze", response_model=PatternAnalysisResponse)
async def analyze_trading_patterns_endpoint(
    request: PatternAnalysisRequest,
    user: AuthorizedUser
) -> PatternAnalysisResponse:
    """Perform comprehensive pattern analysis on user's trading data"""
    try:
        user_id = user.sub
        
        # Load trading data
        trades = load_user_trades(user_id, request.days_back)
        
        if not trades:
            return PatternAnalysisResponse(
                patterns_detected=[],
                behavioral_alerts=[],
                coaching_triggers=[],
                analysis_summary="No trading data available for analysis",
                performance_correlations={},
                recommendations=["Import trading data to enable pattern analysis"],
                data_quality_score=0.0,
                analysis_timestamp=datetime.now().isoformat()
            )
        
        # Run pattern analysis
        patterns = analyze_trading_patterns(trades)
        
        # Generate alerts and triggers
        alerts = generate_behavioral_alerts(patterns)
        triggers = generate_coaching_triggers(patterns, alerts)
        
        # Load journal data for correlations if requested
        journal_entries = []
        if request.include_journal_data:
            journal_entries = load_user_journal_entries(user_id, request.days_back)
        
        # Calculate basic performance metrics for context
        total_trades = len(trades)
        winning_trades = sum(1 for t in trades if t.pnl > 0)
        win_rate = winning_trades / total_trades if total_trades > 0 else 0
        total_pnl = sum(t.pnl for t in trades)
        
        performance_correlations = {
            "total_trades": total_trades,
            "win_rate": win_rate,
            "total_pnl": total_pnl,
            "journal_entries": len(journal_entries),
            "analysis_period_days": request.days_back
        }
        
        # Generate AI summary
        analysis_summary = await generate_analysis_summary(patterns, performance_correlations)
        
        # Generate recommendations
        recommendations = []
        for pattern in patterns:
            recommendations.extend(pattern.recommendations)
        
        # Remove duplicates
        recommendations = list(dict.fromkeys(recommendations))
        
        # Calculate data quality score
        data_quality_score = min(1.0, (total_trades / 50) + (len(journal_entries) / 30))
        
        return PatternAnalysisResponse(
            patterns_detected=patterns,
            behavioral_alerts=alerts,
            coaching_triggers=triggers,
            analysis_summary=analysis_summary,
            performance_correlations=performance_correlations,
            recommendations=recommendations[:5],  # Top 5 recommendations
            data_quality_score=data_quality_score,
            analysis_timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to analyze trading patterns")

async def generate_analysis_summary(patterns: List[TradingPattern], performance_data: Dict[str, Any]) -> str:
    """Generate AI-powered analysis summary"""
    if not patterns:
        return f"Analysis of {performance_data['total_trades']} trades shows disciplined trading behavior with no concerning patterns detected. Continue maintaining your current approach while monitoring for any emerging patterns."
    
    pattern_summary = ", ".join([f"{p.pattern_type.replace('_', ' ')} ({p.severity} severity)" for p in patterns])
    
    prompt = f"""
Analyze this trading behavior summary and provide a concise coaching insight:

Trading Period: {performance_data['analysis_period_days']} days
Total Trades: {performance_data['total_trades']}
Win Rate: {performance_data['win_rate']:.1%}
Total P&L: ${performance_data['total_pnl']:.2f}

Patterns Detected: {pattern_summary}

Provide a 2-3 sentence professional coaching summary focusing on the most critical behavioral insights and immediate priorities.
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert trading psychology coach. Provide concise, actionable behavioral insights."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.3
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        pass
        return f"Pattern analysis complete. Detected {len(patterns)} behavioral patterns requiring attention across {performance_data['total_trades']} trades."

@router.post("/triggers/coaching")
async def trigger_coaching_session(
    user: AuthorizedUser,
    trigger_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Trigger a coaching conversation based on pattern analysis"""
    try:
        user_id = user.sub
        
        # Create a new conversation with coaching context
        conversation_title = f"AI Coach Alert - {trigger_data.get('pattern_type', 'Pattern').replace('_', ' ').title()}"
        
        # Generate initial coaching message based on pattern
        initial_message = generate_coaching_conversation_starter(trigger_data)
        
        # Create conversation through internal API call
        conversation_data = {
            "title": conversation_title,
            "initial_message": initial_message
        }
        
        # Store the coaching context for the AI to use
        coaching_context = {
            "trigger_type": "pattern_analysis",
            "pattern_data": trigger_data,
            "coaching_focus": [
                "behavioral_patterns",
                "risk_management",
                "emotional_regulation",
                "strategy_adherence"
            ],
            "session_type": "proactive_intervention",
            "created_at": datetime.now().isoformat()
        }
        
        # For now, return the coaching data that frontend can use to create conversation
        return {
            "success": True,
            "message": "Coaching session triggered",
            "conversation_data": conversation_data,
            "coaching_context": coaching_context,
            "trigger_data": trigger_data,
            "timestamp": datetime.now().isoformat(),
            "requires_immediate_attention": trigger_data.get('severity') in ['high', 'critical']
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to trigger coaching session") from e

def generate_coaching_conversation_starter(trigger_data: Dict[str, Any]) -> str:
    """Generate initial coaching message based on pattern"""
    pattern_type = trigger_data.get('pattern_type', 'Pattern')
    severity = trigger_data.get('severity', 'unknown')
    description = trigger_data.get('description', 'No description available')
    
    return f"""
    Hi there! I've detected a {pattern_type.replace('_', ' ').title()} pattern in your trading behavior with {severity} severity. Here's a brief summary:

    {description}

    Let's discuss this further and explore how we can address this together.
    """

# ============================================================================
# ENHANCED API ENDPOINTS
# ============================================================================

@router.post("/analyze/comprehensive", response_model=PatternAnalysisResponse)
async def comprehensive_pattern_analysis(
    request: PatternAnalysisRequest,
    user: AuthorizedUser
) -> PatternAnalysisResponse:
    """Enhanced pattern analysis with correlations and educational content"""
    try:
        user_id = user.sub
        
        # Load trading data
        trades = load_user_trades(user_id, request.days_back)
        
        if not trades:
            return PatternAnalysisResponse(
                patterns_detected=[],
                behavioral_alerts=[],
                coaching_triggers=[],
                analysis_summary="No trading data available for analysis",
                performance_correlations={},
                recommendations=["Import trading data to enable pattern analysis"],
                data_quality_score=0.0,
                analysis_timestamp=datetime.now().isoformat()
            )
        
        # Run pattern analysis
        patterns = analyze_trading_patterns(trades)
        
        # Generate alerts and triggers
        alerts = generate_behavioral_alerts(patterns)
        triggers = generate_coaching_triggers(patterns, alerts)
        
        # Load journal data for correlations
        journal_entries = []
        if request.include_journal_data:
            journal_entries = load_user_journal_entries(user_id, request.days_back)
        
        # Enhanced performance correlations
        performance_correlations = {
            "basic_metrics": {
                "total_trades": len(trades),
                "win_rate": sum(1 for t in trades if t.pnl > 0) / len(trades) if trades else 0,
                "total_pnl": sum(t.pnl for t in trades),
                "journal_entries": len(journal_entries),
                "analysis_period_days": request.days_back
            },
            "correlations": []
        }
        
        # Add correlation analyses
        if journal_entries:
            mood_correlation = analyze_mood_performance_correlation(trades, journal_entries)
            if mood_correlation:
                performance_correlations["correlations"].append(mood_correlation.model_dump())
        
        time_correlation = analyze_time_performance_correlation(trades)
        if time_correlation:
            performance_correlations["correlations"].append(time_correlation.model_dump())
        
        # Generate educational content
        educational_content = generate_educational_content(patterns)
        
        # Enhanced AI summary with correlations
        analysis_summary = await generate_enhanced_analysis_summary(
            patterns, performance_correlations, educational_content
        )
        
        # Comprehensive recommendations
        recommendations = []
        for pattern in patterns:
            recommendations.extend(pattern.recommendations)
        
        # Add correlation-based recommendations
        for correlation_data in performance_correlations.get("correlations", []):
            recommendations.extend(correlation_data.get("recommended_actions", []))
        
        # Remove duplicates and prioritize
        recommendations = list(dict.fromkeys(recommendations))[:8]
        
        # Calculate enhanced data quality score
        data_quality_score = min(1.0, 
            (len(trades) / 50) * 0.4 + 
            (len(journal_entries) / 30) * 0.3 + 
            (len(performance_correlations.get("correlations", [])) / 3) * 0.3
        )
        
        response = PatternAnalysisResponse(
            patterns_detected=patterns,
            behavioral_alerts=alerts,
            coaching_triggers=triggers,
            analysis_summary=analysis_summary,
            performance_correlations=performance_correlations,
            recommendations=recommendations,
            data_quality_score=data_quality_score,
            analysis_timestamp=datetime.now().isoformat()
        )
        
        # Store educational content separately
        if educational_content:
            db_firestore = firestore.client()
            db_firestore.collection("users").document(user_id).collection("educational_content").document("latest").set(
                {"content": [content.model_dump() for content in educational_content]}
            )
        
        return response
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to perform comprehensive analysis")

@router.get("/educational-content")
async def get_educational_content(user: AuthorizedUser) -> Dict[str, Any]:
    """Get personalized educational content based on detected patterns"""
    try:
        user_id = user.sub
        
        # Get stored educational content
        db_firestore = firestore.client()
        doc = db_firestore.collection("users").document(user_id).collection("educational_content").document("latest").get()
        content_data = doc.to_dict().get("content", []) if doc.exists else []
        
        return {
            "content": content_data,
            "last_updated": datetime.now().isoformat(),
            "total_items": len(content_data)
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to retrieve educational content")

@router.post("/sessions/create")
async def create_coaching_session_endpoint(
    session_data: Dict[str, Any],
    user: AuthorizedUser
) -> Dict[str, Any]:
    """Create a new coaching session"""
    try:
        user_id = user.sub
        
        session = await create_coaching_session(
            user_id=user_id,
            session_type=session_data.get("session_type", "pattern_alert"),
            triggered_by=session_data.get("triggered_by", "manual"),
            coaching_focus=session_data.get("coaching_focus", []),
            session_data=session_data
        )
        
        return {
            "success": True,
            "session": session.model_dump(),
            "message": "Coaching session created successfully"
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to create coaching session")

@router.put("/sessions/{session_id}")
async def update_coaching_session_endpoint(
    session_id: str,
    updates: Dict[str, Any],
    user: AuthorizedUser
) -> Dict[str, Any]:
    """Update coaching session status and data"""
    try:
        user_id = user.sub
        
        success = await update_coaching_session(user_id, session_id, updates)
        
        return {
            "success": success,
            "message": "Session updated successfully" if success else "Session not found"
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to update coaching session")

@router.get("/analytics", response_model=CoachingAnalytics)
async def get_coaching_analytics_endpoint(user: AuthorizedUser) -> CoachingAnalytics:
    """Get coaching effectiveness analytics"""
    try:
        user_id = user.sub
        return await get_coaching_analytics(user_id)
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to retrieve coaching analytics")

@router.get("/correlations")
async def get_performance_correlations(user: AuthorizedUser, days_back: int = 30) -> Dict[str, Any]:
    """Get detailed performance correlation analysis"""
    try:
        user_id = user.sub
        
        # Load data
        trades = load_user_trades(user_id, days_back)
        journal_entries = load_user_journal_entries(user_id, days_back)
        
        correlations = []
        
        # Mood correlation
        if journal_entries:
            mood_correlation = analyze_mood_performance_correlation(trades, journal_entries)
            if mood_correlation:
                correlations.append(mood_correlation.model_dump())
        
        # Time correlation
        time_correlation = analyze_time_performance_correlation(trades)
        if time_correlation:
            correlations.append(time_correlation.model_dump())
        
        return {
            "correlations": correlations,
            "analysis_period": days_back,
            "data_points": {
                "trades": len(trades),
                "journal_entries": len(journal_entries)
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to retrieve correlations")

async def generate_enhanced_analysis_summary(
    patterns: List[TradingPattern], 
    performance_data: Dict[str, Any], 
    educational_content: List[EducationalContent]
) -> str:
    """Generate enhanced AI-powered analysis summary with correlations"""
    if not patterns and not performance_data.get("correlations"):
        return f"Analysis of {performance_data['basic_metrics']['total_trades']} trades shows disciplined trading behavior with no concerning patterns or significant correlations detected."
    
    pattern_summary = ", ".join([f"{p.pattern_type.replace('_', ' ')} ({p.severity})" for p in patterns])
    correlation_summary = ", ".join([
        f"{corr['correlation_type'].replace('_', ' ')} (strength: {corr['correlation_strength']:.2f})"
        for corr in performance_data.get("correlations", [])
    ])
    
    prompt = f"""
Generate a comprehensive trading psychology coaching summary:

TRADING PERFORMANCE:
- Period: {performance_data['basic_metrics']['analysis_period_days']} days
- Total Trades: {performance_data['basic_metrics']['total_trades']}
- Win Rate: {performance_data['basic_metrics']['win_rate']:.1%}
- Total P&L: ${performance_data['basic_metrics']['total_pnl']:.2f}
- Journal Entries: {performance_data['basic_metrics']['journal_entries']}

BEHAVIORAL PATTERNS: {pattern_summary or 'None detected'}

PERFORMANCE CORRELATIONS: {correlation_summary or 'None detected'}

EDUCATIONAL CONTENT: {len(educational_content)} personalized articles available

Provide a 3-4 sentence professional coaching summary focusing on the most critical insights and immediate action priorities.
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert trading psychology coach providing comprehensive behavioral analysis."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.3
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        pass
        base_summary = f"Comprehensive analysis of {performance_data['basic_metrics']['total_trades']} trades"
        if patterns:
            base_summary += f" detected {len(patterns)} behavioral patterns requiring attention"
        if performance_data.get("correlations"):
            base_summary += f" and {len(performance_data['correlations'])} significant performance correlations"
        return base_summary + "."
