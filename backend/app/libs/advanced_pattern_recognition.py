from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import statistics
import pandas as pd
from collections import defaultdict, Counter
import numpy as np
from openai import OpenAI
import json
import os

# Import existing calculation libraries
from app.libs.trading_calculations import TradeData, calculate_basic_metrics
from app.libs.analytics_calculations import (
    JournalEntry,
    calculate_habit_performance_correlation,
    calculate_mood_performance_correlation,
    detect_time_based_patterns,
    detect_symbol_patterns
)

@dataclass
class PatternRecognitionResult:
    """Comprehensive pattern recognition result"""
    pattern_type: str  # "behavioral", "market_condition", "entry_exit", "risk_management", "performance_correlation"
    pattern_name: str
    description: str
    confidence_score: float  # 0.0 to 1.0
    impact_score: float  # -1.0 to 1.0 (negative = harmful, positive = beneficial)
    supporting_data: Dict[str, Any]
    actionable_insights: List[str]
    occurrence_frequency: str  # "rare", "occasional", "frequent", "consistent"
    trend_direction: str  # "improving", "declining", "stable", "volatile"

@dataclass
class AdvancedInsight:
    """Advanced AI-powered insight with integrated pattern data"""
    insight_id: str
    title: str
    insight_type: str  # "strength", "weakness", "opportunity", "risk", "recommendation"
    description: str
    confidence_level: float
    priority: str  # "critical", "high", "medium", "low"
    category: str  # "emotional_regulation", "discipline", "timing", "risk_management", "market_adaptation"
    patterns_involved: List[PatternRecognitionResult]
    ai_narrative: str  # Natural language explanation
    recommended_actions: List[str]
    success_metrics: List[str]  # How to measure improvement
    estimated_impact: str  # "transformational", "significant", "moderate", "minor"

class AdvancedPatternRecognition:
    """Advanced AI-powered pattern recognition system"""
    
    def __init__(self):
        self.openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    def analyze_behavioral_patterns(self, trades: List[TradeData], journals: List[JournalEntry]) -> List[PatternRecognitionResult]:
        """Detect complex behavioral patterns"""
        patterns = []
        
        # Revenge trading pattern
        revenge_pattern = self._detect_revenge_trading(trades)
        if revenge_pattern:
            patterns.append(revenge_pattern)
        
        # FOMO trading pattern
        fomo_pattern = self._detect_fomo_trading(trades, journals)
        if fomo_pattern:
            patterns.append(fomo_pattern)
        
        # Overconfidence pattern
        overconfidence_pattern = self._detect_overconfidence(trades, journals)
        if overconfidence_pattern:
            patterns.append(overconfidence_pattern)
        
        # Discipline breakdown pattern
        discipline_pattern = self._detect_discipline_issues(trades, journals)
        if discipline_pattern:
            patterns.append(discipline_pattern)
        
        # Emotional state correlation
        emotional_pattern = self._analyze_emotional_correlations(trades, journals)
        if emotional_pattern:
            patterns.append(emotional_pattern)
            
        return patterns
    
    def analyze_market_condition_patterns(self, trades: List[TradeData]) -> List[PatternRecognitionResult]:
        """Detect market condition adaptation patterns"""
        patterns = []
        
        # Trending vs ranging market performance
        trend_pattern = self._analyze_trend_adaptation(trades)
        if trend_pattern:
            patterns.append(trend_pattern)
        
        # Volatility adaptation
        volatility_pattern = self._analyze_volatility_adaptation(trades)
        if volatility_pattern:
            patterns.append(volatility_pattern)
        
        # Time-based performance patterns
        time_patterns = self._analyze_advanced_time_patterns(trades)
        patterns.extend(time_patterns)
        
        return patterns
    
    def analyze_entry_exit_patterns(self, trades: List[TradeData]) -> List[PatternRecognitionResult]:
        """Analyze entry and exit execution patterns"""
        patterns = []
        
        # Entry timing consistency
        entry_pattern = self._analyze_entry_timing(trades)
        if entry_pattern:
            patterns.append(entry_pattern)
        
        # Exit strategy effectiveness
        exit_pattern = self._analyze_exit_strategy(trades)
        if exit_pattern:
            patterns.append(exit_pattern)
        
        # Setup recognition accuracy
        setup_pattern = self._analyze_setup_recognition(trades)
        if setup_pattern:
            patterns.append(setup_pattern)
        
        return patterns
    
    def analyze_risk_management_patterns(self, trades: List[TradeData]) -> List[PatternRecognitionResult]:
        """Analyze risk management discipline and patterns"""
        patterns = []
        
        # Position sizing discipline
        sizing_pattern = self._analyze_position_sizing(trades)
        if sizing_pattern:
            patterns.append(sizing_pattern)
        
        # Stop loss adherence
        stop_loss_pattern = self._analyze_stop_loss_discipline(trades)
        if stop_loss_pattern:
            patterns.append(stop_loss_pattern)
        
        # Risk-reward execution
        risk_reward_pattern = self._analyze_risk_reward_execution(trades)
        if risk_reward_pattern:
            patterns.append(risk_reward_pattern)
        
        return patterns
    
    def generate_integrated_insights(self, trades: List[TradeData], journals: List[JournalEntry], 
                                   minimum_confidence: float = 0.7) -> List[AdvancedInsight]:
        """Generate comprehensive insights by integrating all pattern analysis"""
        # Collect all patterns
        behavioral_patterns = self.analyze_behavioral_patterns(trades, journals)
        market_patterns = self.analyze_market_condition_patterns(trades)
        entry_exit_patterns = self.analyze_entry_exit_patterns(trades)
        risk_patterns = self.analyze_risk_management_patterns(trades)
        
        all_patterns = behavioral_patterns + market_patterns + entry_exit_patterns + risk_patterns
        
        # Filter by confidence
        high_confidence_patterns = [p for p in all_patterns if p.confidence_score >= minimum_confidence]
        
        # Group patterns by category and generate insights
        insights = []
        
        # Generate AI-powered insights using OpenAI
        insights.extend(self._generate_ai_insights_from_patterns(high_confidence_patterns, trades, journals))
        
        return insights
    
    def _detect_revenge_trading(self, trades: List[TradeData]) -> Optional[PatternRecognitionResult]:
        """Detect revenge trading patterns"""
        if len(trades) < 10:
            return None
        
        # Sort trades by time
        sorted_trades = sorted(trades, key=lambda t: t.close_time)
        
        revenge_sequences = 0
        total_sequences = 0
        revenge_pnl_impact = 0.0
        
        for i in range(1, len(sorted_trades)):
            prev_trade = sorted_trades[i-1]
            current_trade = sorted_trades[i]
            
            # Check if trades are close in time (within 2 hours)
            time_diff = (current_trade.close_time - prev_trade.close_time).total_seconds() / 3600
            
            if time_diff <= 2 and prev_trade.pnl < 0:
                total_sequences += 1
                # Potential revenge trade - larger position or opposite direction immediately after loss
                if (abs(current_trade.quantity) > abs(prev_trade.quantity) * 1.5 or 
                    current_trade.pnl < prev_trade.pnl):
                    revenge_sequences += 1
                    revenge_pnl_impact += current_trade.pnl
        
        if total_sequences < 3:
            return None
        
        revenge_rate = revenge_sequences / total_sequences
        
        if revenge_rate > 0.3:  # 30% or more potential revenge trades
            return PatternRecognitionResult(
                pattern_type="behavioral",
                pattern_name="Revenge Trading",
                description=f"Detected {revenge_sequences} potential revenge trades out of {total_sequences} post-loss sequences",
                confidence_score=min(0.9, revenge_rate * 1.5),
                impact_score=-revenge_rate,  # Negative impact
                supporting_data={
                    "revenge_sequences": revenge_sequences,
                    "total_sequences": total_sequences,
                    "revenge_rate": revenge_rate,
                    "total_revenge_pnl": revenge_pnl_impact
                },
                actionable_insights=[
                    "Implement a cooling-off period after losses",
                    "Set maximum trade frequency limits",
                    "Use smaller position sizes after consecutive losses",
                    "Practice emotional regulation techniques"
                ],
                occurrence_frequency="frequent" if revenge_rate > 0.5 else "occasional",
                trend_direction="stable"  # Would need historical comparison
            )
        
        return None
    
    def _detect_fomo_trading(self, trades: List[TradeData], journals: List[JournalEntry]) -> Optional[PatternRecognitionResult]:
        """Detect FOMO (Fear of Missing Out) trading patterns"""
        if len(trades) < 10:
            return None
        
        # Look for trades with FOMO-related tags or notes
        fomo_indicators = ['fomo', 'fear of missing out', 'breakout chase', 'momentum chase', 'late entry']
        fomo_trades = []
        
        for trade in trades:
            trade_text = ' '.join(trade.tags).lower() + ' ' + (trade.notes or '').lower()
            if any(indicator in trade_text for indicator in fomo_indicators):
                fomo_trades.append(trade)
        
        if len(fomo_trades) < 3:
            return None
        
        fomo_rate = len(fomo_trades) / len(trades)
        fomo_performance = statistics.mean([t.pnl for t in fomo_trades])
        overall_performance = statistics.mean([t.pnl for t in trades])
        
        performance_impact = (fomo_performance - overall_performance) / abs(overall_performance) if overall_performance != 0 else 0
        
        if fomo_rate > 0.1:  # 10% or more FOMO trades
            return PatternRecognitionResult(
                pattern_type="behavioral",
                pattern_name="FOMO Trading",
                description=f"Identified {len(fomo_trades)} FOMO trades with {performance_impact:.1%} performance impact",
                confidence_score=min(0.9, fomo_rate * 3),
                impact_score=performance_impact,
                supporting_data={
                    "fomo_trades": len(fomo_trades),
                    "fomo_rate": fomo_rate,
                    "fomo_avg_pnl": fomo_performance,
                    "overall_avg_pnl": overall_performance,
                    "performance_impact": performance_impact
                },
                actionable_insights=[
                    "Wait for proper setup confirmation before entering",
                    "Set clear entry criteria and stick to them",
                    "Practice patience and avoid chasing breakouts",
                    "Focus on quality setups rather than quantity"
                ],
                occurrence_frequency="frequent" if fomo_rate > 0.2 else "occasional",
                trend_direction="stable"
            )
        
        return None
    
    def _detect_overconfidence(self, trades: List[TradeData], journals: List[JournalEntry]) -> Optional[PatternRecognitionResult]:
        """Detect overconfidence patterns after winning streaks"""
        if len(trades) < 20:
            return None
        
        sorted_trades = sorted(trades, key=lambda t: t.close_time)
        overconfident_periods = 0
        total_periods = 0
        
        # Look for periods where position size increases after wins
        win_streak = 0
        base_position_sizes = []
        post_win_position_sizes = []
        
        for i, trade in enumerate(sorted_trades):
            if trade.pnl > 0:
                win_streak += 1
            else:
                if win_streak >= 3:  # After 3+ wins
                    total_periods += 1
                    # Check if next trades have larger position sizes
                    if i + 1 < len(sorted_trades):
                        avg_base_size = statistics.mean([abs(t.quantity) for t in sorted_trades[max(0, i-win_streak-2):i-win_streak+1]])
                        next_trade_size = abs(sorted_trades[i+1].quantity)
                        
                        if next_trade_size > avg_base_size * 1.3:  # 30% larger position
                            overconfident_periods += 1
                            base_position_sizes.append(avg_base_size)
                            post_win_position_sizes.append(next_trade_size)
                
                win_streak = 0
        
        if total_periods < 3:
            return None
        
        overconfidence_rate = overconfident_periods / total_periods
        
        if overconfidence_rate > 0.4:  # 40% or more periods show overconfidence
            avg_size_increase = statistics.mean([post/base for post, base in zip(post_win_position_sizes, base_position_sizes)]) if base_position_sizes else 1.0
            
            return PatternRecognitionResult(
                pattern_type="behavioral",
                pattern_name="Post-Win Overconfidence",
                description=f"Position sizes increase by {(avg_size_increase-1)*100:.1f}% after winning streaks in {overconfident_periods}/{total_periods} periods",
                confidence_score=min(0.85, overconfidence_rate * 1.5),
                impact_score=-overconfidence_rate * 0.5,  # Generally negative
                supporting_data={
                    "overconfident_periods": overconfident_periods,
                    "total_periods": total_periods,
                    "overconfidence_rate": overconfidence_rate,
                    "avg_size_increase": avg_size_increase
                },
                actionable_insights=[
                    "Maintain consistent position sizing regardless of recent wins",
                    "Set position size rules and follow them strictly",
                    "Be aware of emotional state after winning streaks",
                    "Take breaks after significant wins to reset mentally"
                ],
                occurrence_frequency="occasional" if overconfidence_rate < 0.6 else "frequent",
                trend_direction="stable"
            )
        
        return None
    
    def _detect_discipline_issues(self, trades: List[TradeData], journals: List[JournalEntry]) -> Optional[PatternRecognitionResult]:
        """Detect trading discipline breakdown patterns"""
        if len(trades) < 15:
            return None
        
        discipline_indicators = {
            'plan_deviation': 0,
            'emotional_trades': 0,
            'rule_breaks': 0,
            'impulsive_trades': 0
        }
        
        discipline_keywords = {
            'plan_deviation': ['off plan', 'no plan', 'deviated', 'changed mind'],
            'emotional_trades': ['emotional', 'angry', 'frustrated', 'scared'],
            'rule_breaks': ['broke rule', 'violated', 'ignored rule', 'exception'],
            'impulsive_trades': ['impulsive', 'quick decision', 'no analysis', 'gut feeling']
        }
        
        total_documented_trades = 0
        
        for trade in trades:
            trade_text = ' '.join(trade.tags).lower() + ' ' + (trade.notes or '').lower()
            
            if trade_text.strip():  # Only count trades with documentation
                total_documented_trades += 1
                
                for indicator, keywords in discipline_keywords.items():
                    if any(keyword in trade_text for keyword in keywords):
                        discipline_indicators[indicator] += 1
        
        if total_documented_trades < 10:
            return None
        
        total_discipline_issues = sum(discipline_indicators.values())
        discipline_issue_rate = total_discipline_issues / total_documented_trades
        
        if discipline_issue_rate > 0.15:  # 15% or more trades show discipline issues
            return PatternRecognitionResult(
                pattern_type="behavioral",
                pattern_name="Trading Discipline Issues",
                description=f"Discipline issues detected in {total_discipline_issues}/{total_documented_trades} documented trades ({discipline_issue_rate:.1%})",
                confidence_score=min(0.9, discipline_issue_rate * 2),
                impact_score=-discipline_issue_rate,
                supporting_data={
                    "discipline_indicators": discipline_indicators,
                    "total_issues": total_discipline_issues,
                    "documented_trades": total_documented_trades,
                    "issue_rate": discipline_issue_rate
                },
                actionable_insights=[
                    "Develop and document clear trading rules",
                    "Use checklists before entering trades",
                    "Practice mindfulness and emotional awareness",
                    "Set up accountability systems or trading buddy",
                    "Review and strengthen trading plan regularly"
                ],
                occurrence_frequency="frequent" if discipline_issue_rate > 0.25 else "occasional",
                trend_direction="stable"
            )
        
        return None
    
    def _analyze_emotional_correlations(self, trades: List[TradeData], journals: List[JournalEntry]) -> Optional[PatternRecognitionResult]:
        """Analyze correlation between emotional states and trading performance"""
        if len(trades) < 10 or len(journals) < 5:
            return None
        
        try:
            # Use existing library function
            correlations = calculate_mood_performance_correlation(trades, journals)
            
            if not correlations:
                return None
            
            # Find the strongest correlation
            strongest_correlation = max(correlations, key=lambda x: abs(x.correlation_coefficient))
            
            if abs(strongest_correlation.correlation_coefficient) > 0.3:  # Moderate correlation
                return PatternRecognitionResult(
                    pattern_type="behavioral",
                    pattern_name="Emotional State Impact",
                    description=f"Strong correlation ({strongest_correlation.correlation_coefficient:.2f}) between {strongest_correlation.factor_name} and performance",
                    confidence_score=min(0.9, abs(strongest_correlation.correlation_coefficient)),
                    impact_score=strongest_correlation.correlation_coefficient,
                    supporting_data={
                        "correlation_coefficient": strongest_correlation.correlation_coefficient,
                        "confidence_level": strongest_correlation.confidence_level,
                        "sample_size": strongest_correlation.sample_size,
                        "factor_name": strongest_correlation.factor_name
                    },
                    actionable_insights=[
                        f"Monitor {strongest_correlation.factor_name} before trading",
                        "Develop emotional regulation strategies",
                        "Consider trading size adjustments based on emotional state",
                        "Track emotional patterns in trading journal"
                    ],
                    occurrence_frequency="consistent",
                    trend_direction="stable"
                )
        except Exception as e:
            pass
        
        return None
    
    def _analyze_trend_adaptation(self, trades: List[TradeData]) -> Optional[PatternRecognitionResult]:
        """Analyze performance in different market conditions"""
        # This would require market condition data
        # For now, we'll analyze based on trade tags and notes
        if len(trades) < 20:
            return None
        
        trend_trades = {'trending': [], 'ranging': [], 'volatile': []}
        
        for trade in trades:
            trade_text = ' '.join(trade.tags).lower() + ' ' + (trade.notes or '').lower()
            
            if any(word in trade_text for word in ['trend', 'momentum', 'breakout']):
                trend_trades['trending'].append(trade)
            elif any(word in trade_text for word in ['range', 'sideways', 'consolidation']):
                trend_trades['ranging'].append(trade)
            elif any(word in trade_text for word in ['volatile', 'choppy', 'news']):
                trend_trades['volatile'].append(trade)
        
        # Analyze performance in each condition
        condition_performance = {}
        for condition, condition_trades in trend_trades.items():
            if len(condition_trades) >= 5:
                avg_pnl = statistics.mean([t.pnl for t in condition_trades])
                win_rate = len([t for t in condition_trades if t.pnl > 0]) / len(condition_trades)
                condition_performance[condition] = {'avg_pnl': avg_pnl, 'win_rate': win_rate, 'count': len(condition_trades)}
        
        if len(condition_performance) >= 2:
            # Find best and worst performing conditions
            best_condition = max(condition_performance.keys(), key=lambda k: condition_performance[k]['avg_pnl'])
            worst_condition = min(condition_performance.keys(), key=lambda k: condition_performance[k]['avg_pnl'])
            
            performance_gap = condition_performance[best_condition]['avg_pnl'] - condition_performance[worst_condition]['avg_pnl']
            
            if abs(performance_gap) > 10:  # Significant difference
                return PatternRecognitionResult(
                    pattern_type="market_condition",
                    pattern_name="Market Condition Adaptation",
                    description=f"Performance varies significantly across market conditions. Best in {best_condition} markets",
                    confidence_score=0.8,
                    impact_score=0.3 if performance_gap > 0 else -0.3,
                    supporting_data=condition_performance,
                    actionable_insights=[
                        f"Focus on {best_condition} market setups",
                        f"Reduce exposure during {worst_condition} conditions",
                        "Develop specific strategies for different market types",
                        "Track market condition in trading notes"
                    ],
                    occurrence_frequency="consistent",
                    trend_direction="stable"
                )
        
        return None
    
    def _analyze_volatility_adaptation(self, trades: List[TradeData]) -> Optional[PatternRecognitionResult]:
        """Analyze performance during different volatility periods"""
        # Similar to trend analysis but focused on volatility
        # Implementation would be similar to _analyze_trend_adaptation
        return None
    
    def _analyze_advanced_time_patterns(self, trades: List[TradeData]) -> List[PatternRecognitionResult]:
        """Analyze advanced time-based patterns"""
        patterns = []
        
        try:
            # Use existing library function
            time_patterns = detect_time_based_patterns(trades)
            
            for pattern in time_patterns:
                if abs(pattern.correlation_coefficient) > 0.3:
                    patterns.append(PatternRecognitionResult(
                        pattern_type="market_condition",
                        pattern_name=f"Time-based Pattern: {pattern.factor_name}",
                        description=f"Performance correlation of {pattern.correlation_coefficient:.2f} during {pattern.factor_name}",
                        confidence_score=min(0.9, abs(pattern.correlation_coefficient)),
                        impact_score=pattern.correlation_coefficient * 0.5,
                        supporting_data={
                            "correlation": pattern.correlation_coefficient,
                            "confidence": pattern.confidence_level,
                            "sample_size": pattern.sample_size
                        },
                        actionable_insights=[
                            f"Optimize trading schedule for {pattern.factor_name}",
                            "Track time-based performance patterns",
                            "Adjust position sizes based on optimal times"
                        ],
                        occurrence_frequency="consistent",
                        trend_direction="stable"
                    ))
        except Exception as e:
            pass
        
        return patterns
    
    def _analyze_entry_timing(self, trades: List[TradeData]) -> Optional[PatternRecognitionResult]:
        """Analyze entry timing consistency and effectiveness"""
        # Implementation for entry timing analysis
        return None
    
    def _analyze_exit_strategy(self, trades: List[TradeData]) -> Optional[PatternRecognitionResult]:
        """Analyze exit strategy effectiveness"""
        # Implementation for exit strategy analysis
        return None
    
    def _analyze_setup_recognition(self, trades: List[TradeData]) -> Optional[PatternRecognitionResult]:
        """Analyze setup recognition accuracy"""
        # Implementation for setup recognition analysis
        return None
    
    def _analyze_position_sizing(self, trades: List[TradeData]) -> Optional[PatternRecognitionResult]:
        """Analyze position sizing discipline"""
        if len(trades) < 15:
            return None
        
        position_sizes = [abs(trade.quantity) for trade in trades]
        
        # Check for consistency
        cv = statistics.stdev(position_sizes) / statistics.mean(position_sizes) if statistics.mean(position_sizes) > 0 else 0
        
        # Check for correlation with recent performance
        sorted_trades = sorted(trades, key=lambda t: t.close_time)
        size_changes = []
        
        for i in range(1, len(sorted_trades)):
            prev_pnl = sorted_trades[i-1].pnl
            size_change = abs(sorted_trades[i].quantity) / abs(sorted_trades[i-1].quantity) if sorted_trades[i-1].quantity != 0 else 1
            size_changes.append((prev_pnl, size_change))
        
        # Correlation between previous trade result and position size change
        if len(size_changes) > 10:
            prev_results = [x[0] for x in size_changes]
            size_adjustments = [x[1] for x in size_changes]
            
            correlation = np.corrcoef(prev_results, size_adjustments)[0, 1] if not np.isnan(np.corrcoef(prev_results, size_adjustments)[0, 1]) else 0
            
            if abs(correlation) > 0.3 or cv > 0.5:  # High variability or correlation
                return PatternRecognitionResult(
                    pattern_type="risk_management",
                    pattern_name="Position Sizing Discipline",
                    description=f"Position sizing shows {cv:.1%} variability with {correlation:.2f} correlation to previous results",
                    confidence_score=0.8,
                    impact_score=-abs(correlation) * 0.5 if abs(correlation) > 0.3 else -cv,
                    supporting_data={
                        "coefficient_variation": cv,
                        "result_correlation": correlation,
                        "avg_position_size": statistics.mean(position_sizes)
                    },
                    actionable_insights=[
                        "Establish fixed position sizing rules",
                        "Avoid emotional position size adjustments",
                        "Use risk-based position sizing models",
                        "Track position size rationale in notes"
                    ],
                    occurrence_frequency="consistent",
                    trend_direction="stable"
                )
        
        return None
    
    def _analyze_stop_loss_discipline(self, trades: List[TradeData]) -> Optional[PatternRecognitionResult]:
        """Analyze stop loss adherence"""
        # Implementation for stop loss discipline analysis
        # Would need stop loss data from trades
        return None
    
    def _analyze_risk_reward_execution(self, trades: List[TradeData]) -> Optional[PatternRecognitionResult]:
        """Analyze risk-reward execution"""
        # Implementation for risk-reward analysis
        # Would need target and stop loss data
        return None
    
    def _generate_ai_insights_from_patterns(self, patterns: List[PatternRecognitionResult], 
                                          trades: List[TradeData], journals: List[JournalEntry]) -> List[AdvancedInsight]:
        """Generate AI-powered insights from detected patterns"""
        if not patterns:
            return []
        
        # Create prompt for OpenAI
        patterns_summary = self._create_patterns_summary(patterns, trades, journals)
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an elite trading psychology coach and behavioral analyst. Generate actionable insights from trading pattern analysis. Focus on transformational improvements and specific behavioral modifications."
                    },
                    {
                        "role": "user",
                        "content": f"Analyze these trading patterns and generate insights:\n{patterns_summary}"
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            ai_analysis = response.choices[0].message.content
            
            # Convert AI analysis to structured insights
            insights = self._parse_ai_insights(ai_analysis, patterns)
            return insights
            
        except Exception as e:
            pass
            # Fallback to pattern-based insights
            return self._generate_fallback_insights(patterns)
    
    def _create_patterns_summary(self, patterns: List[PatternRecognitionResult], 
                                trades: List[TradeData], journals: List[JournalEntry]) -> str:
        """Create a summary of detected patterns for AI analysis"""
        summary = f"Trading Analysis Summary:\n"
        summary += f"- Total Trades: {len(trades)}\n"
        summary += f"- Journal Entries: {len(journals)}\n"
        summary += f"- Patterns Detected: {len(patterns)}\n\n"
        
        for i, pattern in enumerate(patterns, 1):
            summary += f"Pattern {i}: {pattern.pattern_name}\n"
            summary += f"- Type: {pattern.pattern_type}\n"
            summary += f"- Confidence: {pattern.confidence_score:.2f}\n"
            summary += f"- Impact: {pattern.impact_score:.2f}\n"
            summary += f"- Description: {pattern.description}\n"
            summary += f"- Frequency: {pattern.occurrence_frequency}\n\n"
        
        return summary
    
    def _parse_ai_insights(self, ai_analysis: str, patterns: List[PatternRecognitionResult]) -> List[AdvancedInsight]:
        """Parse AI analysis into structured insights"""
        # Simplified parsing - in production would use more sophisticated NLP
        insights = []
        
        # Create insights based on pattern categories
        pattern_groups = defaultdict(list)
        for pattern in patterns:
            pattern_groups[pattern.pattern_type].append(pattern)
        
        insight_id = 1
        for pattern_type, type_patterns in pattern_groups.items():
            if type_patterns:
                strongest_pattern = max(type_patterns, key=lambda p: p.confidence_score)
                
                insight = AdvancedInsight(
                    insight_id=f"insight_{insight_id}",
                    title=f"{strongest_pattern.pattern_name} Analysis",
                    insight_type="warning" if strongest_pattern.impact_score < 0 else "strength",
                    description=strongest_pattern.description,
                    confidence_level=strongest_pattern.confidence_score,
                    priority="high" if abs(strongest_pattern.impact_score) > 0.5 else "medium",
                    category=pattern_type.replace("_", " ").title(),
                    patterns_involved=type_patterns,
                    ai_narrative=ai_analysis[:200] + "...",  # Truncated for demo
                    recommended_actions=strongest_pattern.actionable_insights,
                    success_metrics=["Track improvement over 2 weeks", "Measure pattern frequency reduction"],
                    estimated_impact="significant" if abs(strongest_pattern.impact_score) > 0.5 else "moderate"
                )
                insights.append(insight)
                insight_id += 1
        
        return insights
    
    def _generate_fallback_insights(self, patterns: List[PatternRecognitionResult]) -> List[AdvancedInsight]:
        """Generate fallback insights when AI analysis fails"""
        insights = []
        
        for i, pattern in enumerate(patterns[:3], 1):  # Top 3 patterns
            insight = AdvancedInsight(
                insight_id=f"pattern_insight_{i}",
                title=pattern.pattern_name,
                insight_type="warning" if pattern.impact_score < 0 else "opportunity",
                description=pattern.description,
                confidence_level=pattern.confidence_score,
                priority="high" if abs(pattern.impact_score) > 0.5 else "medium",
                category=pattern.pattern_type.replace("_", " ").title(),
                patterns_involved=[pattern],
                ai_narrative="Advanced pattern recognition detected this behavioral pattern in your trading data.",
                recommended_actions=pattern.actionable_insights,
                success_metrics=["Monitor pattern frequency", "Track performance improvement"],
                estimated_impact="significant" if abs(pattern.impact_score) > 0.5 else "moderate"
            )
            insights.append(insight)
        
        return insights
