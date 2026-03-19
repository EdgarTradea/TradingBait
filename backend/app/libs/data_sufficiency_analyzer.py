"""
Data Sufficiency Analyzer - Exact scenario classification logic

Implements the exact data sufficiency scenarios (A/B/C) as specified:
- Scenario A (1-7 days): ≤7 days, <10 trades - Focus on data collection guidance
- Scenario B (8-21 days): 8-21 days, 10-50 trades - Emerging patterns with low confidence
- Scenario C (22+ days): ≥22 days, >50 trades - Meaningful analysis with high confidence
"""

from typing import Dict, Any, Tuple
from enum import Enum
from dataclasses import dataclass
from app.libs.trading_data_aggregator import TraderDataSummary

class DataSufficiencyScenario(Enum):
    """Data sufficiency scenarios as per exact specification"""
    SCENARIO_A = "A"  # 1-7 days, <10 trades
    SCENARIO_B = "B"  # 8-21 days, 10-50 trades 
    SCENARIO_C = "C"  # 22+ days, >50 trades

@dataclass
class DataSufficiencyAssessment:
    """Assessment of data sufficiency for AI analysis"""
    scenario: DataSufficiencyScenario
    days_of_data: int
    total_trades: int
    journal_entries: int
    habits_tracked: int
    classification_reason: str
    confidence_multiplier: float  # 0.3 for A, 0.6 for B, 1.0 for C
    analysis_limitations: list[str]
    data_collection_priorities: list[str]

class DataSufficiencyAnalyzer:
    """Analyzes data sufficiency and classifies scenarios exactly as specified"""
    
    # Exact thresholds as per specification
    SCENARIO_A_MAX_DAYS = 7
    SCENARIO_A_MAX_TRADES = 9  # <10 trades
    
    SCENARIO_B_MIN_DAYS = 8
    SCENARIO_B_MAX_DAYS = 21
    SCENARIO_B_MIN_TRADES = 10
    SCENARIO_B_MAX_TRADES = 50
    
    SCENARIO_C_MIN_DAYS = 22
    SCENARIO_C_MIN_TRADES = 51  # >50 trades
    
    def assess_data_sufficiency(self, data_summary: TraderDataSummary) -> DataSufficiencyAssessment:
        """Assess data sufficiency using exact specification criteria"""
        
        days = data_summary.days_of_data
        trades = data_summary.total_trades
        journal_entries = data_summary.journal_entries_count
        habits = data_summary.habits_tracked
        
        # Apply exact classification logic
        scenario, reason = self._classify_scenario(days, trades)
        
        # Set confidence multiplier based on scenario
        confidence_multiplier = {
            DataSufficiencyScenario.SCENARIO_A: 0.3,
            DataSufficiencyScenario.SCENARIO_B: 0.6,
            DataSufficiencyScenario.SCENARIO_C: 1.0
        }[scenario]
        
        # Determine analysis limitations
        limitations = self._get_analysis_limitations(scenario, days, trades, journal_entries, habits)
        
        # Get data collection priorities
        priorities = self._get_data_collection_priorities(scenario, days, trades, journal_entries, habits)
        
        return DataSufficiencyAssessment(
            scenario=scenario,
            days_of_data=days,
            total_trades=trades,
            journal_entries=journal_entries,
            habits_tracked=habits,
            classification_reason=reason,
            confidence_multiplier=confidence_multiplier,
            analysis_limitations=limitations,
            data_collection_priorities=priorities
        )
    
    def _classify_scenario(self, days: int, trades: int) -> Tuple[DataSufficiencyScenario, str]:
        """Classify scenario using exact specification thresholds"""
        
        # Scenario A: ≤7 days OR <10 trades
        if days <= self.SCENARIO_A_MAX_DAYS or trades <= self.SCENARIO_A_MAX_TRADES:
            if days <= self.SCENARIO_A_MAX_DAYS and trades <= self.SCENARIO_A_MAX_TRADES:
                reason = f"Only {days} days of data with {trades} trades, insufficient for pattern analysis"
            elif days <= self.SCENARIO_A_MAX_DAYS:
                reason = f"Only {days} days of data, limiting pattern analysis despite {trades} trades"
            else:
                reason = f"Only {trades} trades available, insufficient for reliable analysis"
            
            return DataSufficiencyScenario.SCENARIO_A, reason
        
        # Scenario C: ≥22 days AND >50 trades
        elif days >= self.SCENARIO_C_MIN_DAYS and trades >= self.SCENARIO_C_MIN_TRADES:
            reason = f"{days} days of data with {trades} trades enables comprehensive analysis"
            return DataSufficiencyScenario.SCENARIO_C, reason
        
        # Scenario B: Everything else (8-21 days, 10-50 trades)
        else:
            reason = f"{days} days of data with {trades} trades shows emerging patterns with limited confidence"
            return DataSufficiencyScenario.SCENARIO_B, reason
    
    def _get_analysis_limitations(self, scenario: DataSufficiencyScenario, 
                                days: int, trades: int, 
                                journal_entries: int, habits: int) -> list[str]:
        """Get specific analysis limitations for each scenario"""
        limitations = []
        
        if scenario == DataSufficiencyScenario.SCENARIO_A:
            limitations.extend([
                "Insufficient data for meaningful pattern detection",
                "Cannot establish reliable correlations",
                "Limited emotional pattern analysis",
                "No historical trend analysis possible"
            ])
            
            if trades < 5:
                limitations.append("Extremely limited trade sample size")
            if journal_entries < 3:
                limitations.append("Minimal behavioral data available")
            if habits == 0:
                limitations.append("No habit tracking data for correlation analysis")
        
        elif scenario == DataSufficiencyScenario.SCENARIO_B:
            limitations.extend([
                "Emerging patterns require cautious interpretation",
                "Limited statistical significance for correlations",
                "Insufficient data for robust trend analysis"
            ])
            
            if journal_entries < days * 0.5:
                limitations.append("Inconsistent journaling limits behavioral insights")
            if habits < 3:
                limitations.append("Limited habit data for comprehensive analysis")
        
        else:  # Scenario C
            if journal_entries < days * 0.3:
                limitations.append("Inconsistent journaling may limit behavioral insights")
            if habits < 3:
                limitations.append("Additional habit tracking would enhance analysis")
        
        return limitations
    
    def _get_data_collection_priorities(self, scenario: DataSufficiencyScenario,
                                      days: int, trades: int,
                                      journal_entries: int, habits: int) -> list[str]:
        """Get data collection priorities based on scenario and current data gaps"""
        priorities = []
        
        if scenario == DataSufficiencyScenario.SCENARIO_A:
            priorities.extend([
                "Continue daily journaling for at least 2-3 weeks",
                "Log mood and market conditions consistently",
                "Track at least 3-5 daily habits (pre/during/post market)",
                "Record pre-market preparation and post-market reflection",
                "Document trade rationale and emotional state"
            ])
            
            if trades < 5:
                priorities.insert(0, "Focus on consistent trading to build sample size")
            
        elif scenario == DataSufficiencyScenario.SCENARIO_B:
            if journal_entries < days * 0.7:
                priorities.append("Improve journaling consistency to 70%+ of trading days")
            
            priorities.extend([
                "Continue current data collection for 1-2 more weeks",
                "Focus on mood-performance correlation tracking",
                "Document specific market conditions and your response",
                "Track stop-loss and risk management adherence"
            ])
            
            if habits < 4:
                priorities.append("Add 1-2 more habit categories for comprehensive analysis")
        
        else:  # Scenario C
            priorities.extend([
                "Maintain current data collection consistency",
                "Consider adding advanced metrics (market volatility response)",
                "Document strategy-specific performance patterns"
            ])
            
            if journal_entries < days * 0.5:
                priorities.insert(0, "Increase journaling frequency for better insights")
        
        return priorities
    
    def get_scenario_description(self, scenario: DataSufficiencyScenario) -> str:
        """Get human-readable scenario description"""
        descriptions = {
            DataSufficiencyScenario.SCENARIO_A: "Scenario A: Insufficient data for meaningful patterns",
            DataSufficiencyScenario.SCENARIO_B: "Scenario B: Emerging patterns with limited confidence", 
            DataSufficiencyScenario.SCENARIO_C: "Scenario C: Sufficient data for comprehensive analysis"
        }
        return descriptions[scenario]
    
    def get_max_confidence_score(self, scenario: DataSufficiencyScenario) -> float:
        """Get maximum confidence score allowed for this scenario"""
        max_confidence = {
            DataSufficiencyScenario.SCENARIO_A: 0.4,  # Very low confidence
            DataSufficiencyScenario.SCENARIO_B: 0.7,  # Medium confidence
            DataSufficiencyScenario.SCENARIO_C: 0.95  # High confidence
        }
        return max_confidence[scenario]
    
    def should_provide_recommendations(self, scenario: DataSufficiencyScenario) -> bool:
        """Determine if actionable recommendations should be provided"""
        # Scenario A focuses on data collection guidance
        # Scenarios B and C can provide trading recommendations
        return scenario in [DataSufficiencyScenario.SCENARIO_B, DataSufficiencyScenario.SCENARIO_C]
    
    def get_analysis_focus(self, scenario: DataSufficiencyScenario) -> list[str]:
        """Get analysis areas to focus on for each scenario"""
        focus_areas = {
            DataSufficiencyScenario.SCENARIO_A: [
                "Basic performance metrics",
                "Data collection guidance",
                "Simple observations only"
            ],
            DataSufficiencyScenario.SCENARIO_B: [
                "Emerging emotional patterns",
                "Basic habit correlations", 
                "Risk management trends",
                "Performance consistency"
            ],
            DataSufficiencyScenario.SCENARIO_C: [
                "Comprehensive emotional patterns",
                "Statistical correlations",
                "Performance under pressure analysis",
                "Strategy optimization",
                "Behavioral consistency tracking",
                "External influence analysis"
            ]
        }
        return focus_areas[scenario]

def format_sufficiency_for_ai_prompt(assessment: DataSufficiencyAssessment) -> Dict[str, Any]:
    """Format data sufficiency assessment for AI prompt"""
    return {
        "scenario": assessment.scenario.value,
        "days_of_data": assessment.days_of_data,
        "journal_entries": assessment.journal_entries,
        "total_trades": assessment.total_trades,
        "habits_tracked": assessment.habits_tracked,
        "classification_reason": assessment.classification_reason,
        "confidence_multiplier": assessment.confidence_multiplier,
        "max_confidence_allowed": DataSufficiencyAnalyzer().get_max_confidence_score(assessment.scenario),
        "analysis_limitations": assessment.analysis_limitations,
        "focus_areas": DataSufficiencyAnalyzer().get_analysis_focus(assessment.scenario)
    }
