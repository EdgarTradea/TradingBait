"""
Prompt Data Formatter - Structure data for AI prompt with exact JSON specification

Formats aggregated trader data into the exact structure required by the AI Trading Coach
prompt, ensuring no raw data is sent and all statistics are pre-calculated.
"""

from typing import Dict, List, Any
from datetime import datetime
from app.libs.trading_data_aggregator import TraderDataSummary
from data_sufficiency_analyzer import DataSufficiencyAnalyzer, DataSufficiencyAssessment
from correlation_calculator import CorrelationCalculator, CorrelationResult, format_correlations_for_ai_prompt

class PromptDataFormatter:
    """Formats trader data for AI prompt consumption with exact specification"""
    
    def __init__(self):
        self.sufficiency_analyzer = DataSufficiencyAnalyzer()
        self.correlation_calculator = CorrelationCalculator()
    
    def format_for_ai_prompt(self, data_summary: TraderDataSummary) -> Dict[str, Any]:
        """Format all trader data for AI prompt according to exact specification"""
        
        # 1. Assess data sufficiency
        sufficiency_assessment = self.sufficiency_analyzer.assess_data_sufficiency(data_summary)
        
        # 2. Calculate correlations
        correlations = self.correlation_calculator.calculate_comprehensive_correlations(data_summary)
        
        # 3. Format according to exact specification
        formatted_data = {
            "data_sufficiency": self._format_data_sufficiency(sufficiency_assessment),
            "performance_summary": self._format_performance_summary(data_summary),
            "correlations": format_correlations_for_ai_prompt(correlations),
            "behavioral_data": self._format_behavioral_data(data_summary, sufficiency_assessment),
            "risk_management": self._format_risk_management_data(data_summary),
            "emotional_patterns": self._format_emotional_patterns(data_summary),
            "trading_patterns": self._format_trading_patterns(data_summary),
            "analysis_constraints": self._format_analysis_constraints(sufficiency_assessment)
        }
        
        return formatted_data
    
    def _format_data_sufficiency(self, assessment: DataSufficiencyAssessment) -> Dict[str, Any]:
        """Format data sufficiency assessment for AI prompt"""
        return {
            "scenario": assessment.scenario.value,
            "days_of_data": assessment.days_of_data,
            "journal_entries": assessment.journal_entries,
            "total_trades": assessment.total_trades,
            "habits_tracked": assessment.habits_tracked,
            "classification_reason": assessment.classification_reason,
            "confidence_multiplier": assessment.confidence_multiplier,
            "max_confidence_allowed": self.sufficiency_analyzer.get_max_confidence_score(assessment.scenario),
            "analysis_limitations": assessment.analysis_limitations,
            "focus_areas": self.sufficiency_analyzer.get_analysis_focus(assessment.scenario),
            "should_provide_recommendations": self.sufficiency_analyzer.should_provide_recommendations(assessment.scenario)
        }
    
    def _format_performance_summary(self, data_summary: TraderDataSummary) -> Dict[str, Any]:
        """Format performance summary with exact numerical accuracy"""
        return {
            "total_pnl": data_summary.total_pnl,
            "win_rate": data_summary.win_rate,
            "trade_count": data_summary.total_trades,
            "winning_trades": data_summary.winning_trades,
            "losing_trades": data_summary.losing_trades,
            "avg_trade_size": data_summary.avg_trade_size,
            "data_collection_period_days": data_summary.days_of_data
        }
    
    def _format_behavioral_data(self, data_summary: TraderDataSummary, 
                               assessment: DataSufficiencyAssessment) -> Dict[str, Any]:
        """Format behavioral data including mood and habits"""
        # Extract unique moods and their frequency
        mood_frequency = {}
        for mood in data_summary.mood_entries:
            mood_clean = mood.lower().strip()
            mood_frequency[mood_clean] = mood_frequency.get(mood_clean, 0) + 1
        
        # Calculate habit statistics
        habit_stats = self._calculate_habit_statistics(data_summary)
        
        return {
            "mood_entries": data_summary.mood_entries,
            "mood_frequency": mood_frequency,
            "mood_entries_count": len(data_summary.mood_entries),
            "habit_completion_rate": data_summary.habit_completion_rate,
            "habit_statistics": habit_stats,
            "stop_loss_adherence": data_summary.stop_loss_adherence,
            "journaling_consistency": assessment.journal_entries / assessment.days_of_data if assessment.days_of_data > 0 else 0.0
        }
    
    def _calculate_habit_statistics(self, data_summary: TraderDataSummary) -> Dict[str, Any]:
        """Calculate detailed habit statistics"""
        habit_stats = {
            "total_habits_tracked": len(data_summary.habit_data),
            "individual_completion_rates": {},
            "most_consistent_habit": None,
            "least_consistent_habit": None
        }
        
        if data_summary.habit_data:
            completion_rates = {}
            for habit_name, completions in data_summary.habit_data.items():
                if completions:
                    rate = sum(completions) / len(completions)
                    completion_rates[habit_name] = round(rate, 3)
            
            habit_stats["individual_completion_rates"] = completion_rates
            
            if completion_rates:
                habit_stats["most_consistent_habit"] = max(completion_rates, key=completion_rates.get)
                habit_stats["least_consistent_habit"] = min(completion_rates, key=completion_rates.get)
        
        return habit_stats
    
    def _format_risk_management_data(self, data_summary: TraderDataSummary) -> Dict[str, Any]:
        """Format risk management data from trades"""
        if not data_summary.trades:
            return {
                "average_risk_per_trade": 0.0,
                "max_loss_trade": 0.0,
                "max_win_trade": 0.0,
                "consecutive_losses": 0,
                "risk_reward_ratio": 0.0
            }
        
        losses = [float(trade.get('pnl', 0)) for trade in data_summary.trades if float(trade.get('pnl', 0)) < 0]
        wins = [float(trade.get('pnl', 0)) for trade in data_summary.trades if float(trade.get('pnl', 0)) > 0]
        
        # Calculate consecutive losses
        consecutive_losses = self._calculate_max_consecutive_losses(data_summary.trades)
        
        # Calculate risk-reward ratio
        avg_loss = abs(sum(losses) / len(losses)) if losses else 0.0
        avg_win = sum(wins) / len(wins) if wins else 0.0
        risk_reward_ratio = avg_win / avg_loss if avg_loss > 0 else 0.0
        
        return {
            "average_loss": round(avg_loss, 2),
            "average_win": round(avg_win, 2),
            "max_loss_trade": round(min(losses), 2) if losses else 0.0,
            "max_win_trade": round(max(wins), 2) if wins else 0.0,
            "consecutive_losses_max": consecutive_losses,
            "risk_reward_ratio": round(risk_reward_ratio, 2),
            "total_losing_trades": len(losses),
            "total_winning_trades": len(wins)
        }
    
    def _calculate_max_consecutive_losses(self, trades: List[Dict[str, Any]]) -> int:
        """Calculate maximum consecutive losing trades"""
        if not trades:
            return 0
        
        # Sort trades by close time
        sorted_trades = sorted(trades, key=lambda t: t.get('closeTime', ''))
        
        max_consecutive = 0
        current_consecutive = 0
        
        for trade in sorted_trades:
            pnl = float(trade.get('pnl', 0))
            if pnl < 0:
                current_consecutive += 1
                max_consecutive = max(max_consecutive, current_consecutive)
            else:
                current_consecutive = 0
        
        return max_consecutive
    
    def _format_emotional_patterns(self, data_summary: TraderDataSummary) -> Dict[str, Any]:
        """Format emotional patterns data"""
        # Analyze emotional patterns from mood and journal entries
        emotional_indicators = {
            "anxiety_indicators": [],
            "confidence_indicators": [],
            "discipline_indicators": [],
            "impulsiveness_indicators": []
        }
        
        # Keywords for emotional classification
        emotion_keywords = {
            "anxiety": ["anxious", "stressed", "worried", "nervous", "uncertain"],
            "confidence": ["confident", "sure", "certain", "positive", "optimistic"],
            "discipline": ["disciplined", "focused", "calm", "patient", "controlled"],
            "impulsiveness": ["impulsive", "rushed", "hasty", "emotional", "reactive"]
        }
        
        for entry in data_summary.journal_entries:
            text_content = ""
            if 'mood' in entry:
                text_content += entry['mood'].lower() + " "
            if 'postMarketNotes' in entry:
                text_content += entry['postMarketNotes'].lower() + " "
            
            for emotion_type, keywords in emotion_keywords.items():
                for keyword in keywords:
                    if keyword in text_content:
                        emotional_indicators[f"{emotion_type}_indicators"].append({
                            "date": entry.get('date', ''),
                            "keyword": keyword,
                            "context": text_content[:100]  # First 100 chars for context
                        })
        
        return {
            "emotional_frequency": {
                key: len(indicators) for key, indicators in emotional_indicators.items()
            },
            "emotional_indicators": emotional_indicators,
            "total_emotional_entries": len([e for e in data_summary.journal_entries if e.get('mood')])
        }
    
    def _format_trading_patterns(self, data_summary: TraderDataSummary) -> Dict[str, Any]:
        """Format trading patterns and frequency data"""
        if not data_summary.trades:
            return {
                "trades_per_day_avg": 0.0,
                "most_active_day": None,
                "trading_frequency_pattern": "insufficient_data"
            }
        
        # Calculate daily trading frequency
        daily_trade_counts = {}
        for trade in data_summary.trades:
            if 'closeTime' in trade:
                try:
                    trade_date = datetime.fromisoformat(trade['closeTime'].replace('Z', '+00:00')).date()
                    daily_trade_counts[trade_date] = daily_trade_counts.get(trade_date, 0) + 1
                except ValueError:
                    continue
        
        if daily_trade_counts:
            avg_trades_per_day = sum(daily_trade_counts.values()) / len(daily_trade_counts)
            most_active_day = max(daily_trade_counts, key=daily_trade_counts.get)
            max_trades_in_day = daily_trade_counts[most_active_day]
            
            # Classify trading frequency pattern
            if avg_trades_per_day < 2:
                frequency_pattern = "conservative"
            elif avg_trades_per_day < 5:
                frequency_pattern = "moderate"
            elif avg_trades_per_day < 10:
                frequency_pattern = "active"
            else:
                frequency_pattern = "high_frequency"
        else:
            avg_trades_per_day = 0.0
            most_active_day = None
            max_trades_in_day = 0
            frequency_pattern = "insufficient_data"
        
        return {
            "trades_per_day_avg": round(avg_trades_per_day, 2),
            "most_active_day": most_active_day.isoformat() if most_active_day else None,
            "max_trades_single_day": max_trades_in_day,
            "trading_frequency_pattern": frequency_pattern,
            "trading_days_count": len(daily_trade_counts),
            "total_trading_period_days": data_summary.days_of_data
        }
    
    def _format_analysis_constraints(self, assessment: DataSufficiencyAssessment) -> Dict[str, Any]:
        """Format analysis constraints and guidelines for AI"""
        return {
            "data_limitations": assessment.analysis_limitations,
            "confidence_ceiling": self.sufficiency_analyzer.get_max_confidence_score(assessment.scenario),
            "analysis_focus_areas": self.sufficiency_analyzer.get_analysis_focus(assessment.scenario),
            "data_collection_priorities": assessment.data_collection_priorities,
            "scenario_description": self.sufficiency_analyzer.get_scenario_description(assessment.scenario),
            "anti_hallucination_rules": [
                "Only use provided numerical data - no fabrication",
                "Include confidence scores for all insights",
                "State uncertainty explicitly when data insufficient",
                "Distinguish observations from recommendations",
                "No generic advice unless supported by user data"
            ]
        }

def create_ai_prompt_with_data(formatted_data: Dict[str, Any]) -> str:
    """Create the complete AI prompt with structured data"""
    
    scenario = formatted_data['data_sufficiency']['scenario']
    max_confidence = formatted_data['analysis_constraints']['confidence_ceiling']
    
    prompt = f"""
You are an expert AI Trading Coach analyzing trader performance data. You must provide insights based ONLY on the provided data with strict anti-hallucination measures.

**CRITICAL INSTRUCTIONS:**
1. Use ONLY the numerical data provided - never fabricate statistics
2. Include confidence scores (0.0-1.0) for every insight, maximum allowed: {max_confidence}
3. Respond in exact JSON format specified below
4. For Scenario {scenario}: {formatted_data['data_sufficiency']['classification_reason']}

**DATA SUFFICIENCY ANALYSIS:**
Scenario: {scenario}
Days of data: {formatted_data['data_sufficiency']['days_of_data']}
Trades: {formatted_data['performance_summary']['trade_count']}
Journal entries: {formatted_data['data_sufficiency']['journal_entries']}
Habits tracked: {formatted_data['data_sufficiency']['habits_tracked']}

**PERFORMANCE SUMMARY:**
Total P&L: ${formatted_data['performance_summary']['total_pnl']}
Win Rate: {formatted_data['performance_summary']['win_rate']:.1%}
Winning Trades: {formatted_data['performance_summary']['winning_trades']}
Losing Trades: {formatted_data['performance_summary']['losing_trades']}

**BEHAVIORAL DATA:**
Mood entries: {formatted_data['behavioral_data']['mood_entries_count']}
Habit completion rate: {formatted_data['behavioral_data']['habit_completion_rate']:.1%}
Journaling consistency: {formatted_data['behavioral_data']['journaling_consistency']:.1%}

**CORRELATIONS:**
{format_correlations_for_prompt(formatted_data['correlations'])}

**ANALYSIS CONSTRAINTS:**
- Focus areas: {', '.join(formatted_data['analysis_constraints']['analysis_focus_areas'])}
- Data limitations: {', '.join(formatted_data['analysis_constraints']['data_limitations'])}

**REQUIRED JSON RESPONSE FORMAT:**
{{
  "data_sufficiency": "Scenario {scenario}: [explanation]",
  "observations": [
    {{
      "insight": "Specific observation from provided data",
      "confidence": 0.0-{max_confidence}
    }}
  ],
  "recommendations": [
    {{
      "recommendation": "Actionable suggestion",
      "priority": "high|medium|low"
    }}
  ],
  "data_collection_guidance": [
    "Specific suggestions for improving data collection"
  ]
}}

**ANTI-HALLUCINATION VERIFICATION:**
Before responding, verify that:
1. All numbers match the provided data exactly
2. All insights have confidence scores ≤ {max_confidence}
3. All observations reference specific provided data
4. Response follows exact JSON format

Analyze the provided data and respond in the exact JSON format above.
"""
    
    return prompt

def format_correlations_for_prompt(correlations: List[Dict[str, Any]]) -> str:
    """Format correlations for inclusion in prompt"""
    if not correlations:
        return "No significant correlations detected with current data."
    
    correlation_text = ""
    for corr in correlations:
        correlation_text += f"- {corr['variable_1']} vs {corr['variable_2']}: {corr['correlation']:.3f} ({corr['significance']} significance, n={corr['sample_size']})\n"
    
    return correlation_text.strip()
