from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from openai import OpenAI
import json
from datetime import datetime, timedelta
from app.auth import AuthorizedUser
import os

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/insights/trading")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# ============================================================================
# TRADING DATA ANALYSIS - CONSOLIDATED AI ENDPOINT
# ============================================================================

# Consolidated system prompt for trading analysis
TRADING_ANALYST_SYSTEM_PROMPT = """
You are an expert quantitative trading analyst and performance coach specializing in:

**Core Expertise:**
- Technical pattern recognition and trading strategy analysis
- Performance metrics evaluation and risk assessment
- Market psychology and behavioral pattern identification
- Strategy optimization and backtesting insights
- Risk management and position sizing analysis

**Analysis Focus:**
- Identify statistically significant patterns in trading data
- Analyze win/loss ratios, profit factors, and drawdown patterns
- Evaluate strategy effectiveness across different market conditions
- Assess risk-adjusted returns and performance consistency
- Provide data-driven recommendations for strategy improvement

**Communication Style:**
- Present findings with statistical backing and confidence levels
- Use clear visualizations and data points to support conclusions
- Provide specific, actionable recommendations based on quantitative analysis
- Explain complex trading concepts in accessible terms
- Focus on objective analysis rather than emotional commentary

**Output Format:**
- Always structure responses with clear sections (Findings, Insights, Recommendations)
- Include specific metrics and percentages when available
- Provide confidence levels for pattern recognition (High/Medium/Low)
- Suggest concrete next steps for strategy improvement

Your goal is to transform raw trading data into actionable intelligence that helps traders optimize their performance.
"""

class TradingAnalysisRequest(BaseModel):
    analysis_type: Optional[str] = "comprehensive"  # comprehensive, performance, patterns, risk
    time_period: Optional[int] = 30  # days
    include_patterns: bool = True
    include_performance: bool = True
    include_risk_analysis: bool = True
    focus_areas: Optional[List[str]] = None  # specific areas to focus on
    context: Optional[Dict[str, Any]] = None

class PatternInsight(BaseModel):
    pattern_type: str
    description: str
    confidence_level: str  # High, Medium, Low
    impact_score: float  # 0-1
    recommendation: str
    supporting_data: Dict[str, Any]

class PerformanceMetric(BaseModel):
    metric_name: str
    current_value: float
    benchmark_value: Optional[float]
    trend: str  # improving, declining, stable
    significance: str  # critical, important, minor
    analysis: str

class RiskAssessment(BaseModel):
    risk_category: str
    risk_level: str  # low, medium, high, critical
    description: str
    mitigation_strategy: str
    priority: int  # 1-5

class TradingInsight(BaseModel):
    insight_type: str
    title: str
    description: str
    actionable_steps: List[str]
    expected_impact: str
    timeframe: str

class TradingAnalysisResponse(BaseModel):
    analysis_summary: str
    key_findings: List[str]
    patterns_identified: List[PatternInsight]
    performance_metrics: List[PerformanceMetric]
    risk_assessment: List[RiskAssessment]
    trading_insights: List[TradingInsight]
    recommendations: List[str]
    confidence_score: float  # Overall analysis confidence
    data_quality_score: float
    next_steps: List[str]

class PatternAnalysisRequest(BaseModel):
    pattern_types: Optional[List[str]] = None  # win_streak, loss_streak, time_patterns, etc.
    minimum_confidence: float = 0.7
    include_behavioral: bool = True
    time_range: Optional[int] = 90

class PatternAnalysisResponse(BaseModel):
    patterns_found: List[PatternInsight]
    behavioral_insights: List[str]
    statistical_summary: Dict[str, Any]
    coaching_recommendations: List[str]

class PerformanceComparisonRequest(BaseModel):
    comparison_type: str  # period_over_period, benchmark, peer_group
    baseline_period: Optional[int] = 30
    comparison_period: Optional[int] = 30
    metrics: Optional[List[str]] = None

class PerformanceComparisonResponse(BaseModel):
    comparison_summary: str
    metric_comparisons: List[PerformanceMetric]
    trend_analysis: List[str]
    improvement_areas: List[str]
    strengths_identified: List[str]

# ============================================================================
# DATA AGGREGATION HELPERS
# ============================================================================

def get_trading_data(user_id: str, days_back: int = 30) -> Dict[str, Any]:
    """Get comprehensive trading data for analysis from Firestore"""
    try:
        db_firestore = firestore.client()
        cutoff_date = datetime.now() - timedelta(days=days_back)
        recent_trades = []

        for eval_doc in db_firestore.collection(f"users/{user_id}/evaluations").stream():
            for trade_doc in db_firestore.collection(f"users/{user_id}/evaluations/{eval_doc.id}/trades").stream():
                trade = trade_doc.to_dict()
                if not trade:
                    continue
                try:
                    trade_date = datetime.fromisoformat(trade.get('created_at', '2024-01-01T00:00:00'))
                    if trade_date >= cutoff_date:
                        recent_trades.append(trade)
                except Exception:
                    continue
        
        # Calculate basic metrics
        total_trades = len(recent_trades)
        winning_trades = [t for t in recent_trades if float(t.get('pnl', 0)) > 0]
        losing_trades = [t for t in recent_trades if float(t.get('pnl', 0)) < 0]
        
        total_pnl = sum(float(t.get('pnl', 0)) for t in recent_trades)
        win_rate = len(winning_trades) / total_trades if total_trades > 0 else 0
        
        # Average win/loss
        avg_win = sum(float(t.get('pnl', 0)) for t in winning_trades) / len(winning_trades) if winning_trades else 0
        avg_loss = sum(float(t.get('pnl', 0)) for t in losing_trades) / len(losing_trades) if losing_trades else 0
        
        # Profit factor
        total_wins = sum(float(t.get('pnl', 0)) for t in winning_trades)
        total_losses = abs(sum(float(t.get('pnl', 0)) for t in losing_trades))
        profit_factor = total_wins / total_losses if total_losses > 0 else float('inf')
        
        return {
            "trades": recent_trades,
            "summary": {
                "total_trades": total_trades,
                "winning_trades": len(winning_trades),
                "losing_trades": len(losing_trades),
                "total_pnl": total_pnl,
                "win_rate": win_rate,
                "avg_win": avg_win,
                "avg_loss": avg_loss,
                "profit_factor": profit_factor,
                "time_period_days": days_back
            }
        }
        
    except Exception as e:
        pass
        return {
            "trades": [],
            "summary": {
                "total_trades": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "total_pnl": 0.0,
                "win_rate": 0.0,
                "avg_win": 0.0,
                "avg_loss": 0.0,
                "profit_factor": 0.0,
                "time_period_days": days_back
            }
        }

def get_journal_data(user_id: str, days_back: int = 30) -> List[Dict[str, Any]]:
    """Get journal entries for behavioral correlation from Firestore"""
    try:
        db_firestore = firestore.client()
        cutoff_date = datetime.now() - timedelta(days=days_back)
        recent_entries = []

        for doc in db_firestore.collection(f"users/{user_id}/journal_entries").stream():
            entry = doc.to_dict()
            if not entry:
                continue
            try:
                entry_date = datetime.fromisoformat(entry.get('created_at', '2024-01-01T00:00:00'))
                if entry_date >= cutoff_date:
                    recent_entries.append(entry)
            except Exception:
                continue

        return recent_entries

    except Exception as e:
        pass
        return []

def create_analysis_prompt(trading_data: Dict[str, Any], analysis_type: str, focus_areas: List[str] = None) -> str:
    """Create comprehensive analysis prompt for AI"""
    
    summary = trading_data.get("summary", {})
    trades = trading_data.get("trades", [])
    
    base_prompt = f"""
Trading Performance Analysis Request

**Analysis Type:** {analysis_type}
**Time Period:** {summary.get('time_period_days', 30)} days
**Focus Areas:** {', '.join(focus_areas) if focus_areas else 'Comprehensive analysis'}

**Performance Summary:**
- Total Trades: {summary.get('total_trades', 0)}
- Win Rate: {summary.get('win_rate', 0):.2%}
- Total P&L: ${summary.get('total_pnl', 0):,.2f}
- Average Win: ${summary.get('avg_win', 0):,.2f}
- Average Loss: ${summary.get('avg_loss', 0):,.2f}
- Profit Factor: {summary.get('profit_factor', 0):.2f}

**Trade Sample:** {len(trades)} trades analyzed
"""
    
    if analysis_type == "comprehensive":
        return base_prompt + """

Provide a comprehensive trading analysis including:
1. Performance patterns and trends identification
2. Risk assessment and position sizing analysis
3. Strategy effectiveness evaluation
4. Behavioral insights and improvement areas
5. Specific recommendations for optimization

Structure your response with clear sections and actionable insights.
"""
    
    elif analysis_type == "patterns":
        return base_prompt + """

Focus on pattern recognition and analysis:
1. Identify recurring trading patterns (wins/losses, timing, instruments)
2. Analyze streak patterns and consistency
3. Time-based patterns (day of week, time of day)
4. Strategy-specific patterns
5. Behavioral patterns affecting performance

Provide specific pattern insights with confidence levels.
"""
    
    elif analysis_type == "performance":
        return base_prompt + """

Focus on performance metrics analysis:
1. Risk-adjusted returns evaluation
2. Consistency and drawdown analysis
3. Benchmark comparisons
4. Metric trends and improvements
5. Performance optimization opportunities

Provide quantitative insights with improvement recommendations.
"""
    
    elif analysis_type == "risk":
        return base_prompt + """

Focus on risk management analysis:
1. Position sizing effectiveness
2. Risk-reward ratios
3. Maximum drawdown analysis
4. Risk concentration assessment
5. Risk mitigation strategies

Provide risk assessment with specific mitigation recommendations.
"""
    
    return base_prompt

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/health")
async def trading_insights_health_check():
    """Health check for trading insights API"""
    return {
        "status": "healthy",
        "service": "trading_insights",
        "timestamp": datetime.now().isoformat(),
        "features": [
            "comprehensive_trading_analysis",
            "pattern_recognition",
            "performance_evaluation",
            "risk_assessment",
            "strategy_optimization",
            "behavioral_correlation"
        ]
    }

@router.post("/analyze")
async def analyze_trading_performance(request: TradingAnalysisRequest, user: AuthorizedUser) -> TradingAnalysisResponse:
    """Comprehensive trading performance analysis"""
    user_id = user.sub
    
    try:
        pass
        
        # Get trading data
        trading_data = get_trading_data(user_id, request.time_period)
        
        # Check data sufficiency
        total_trades = trading_data["summary"]["total_trades"]
        if total_trades < 5:
            return TradingAnalysisResponse(
                analysis_summary="Insufficient trading data for comprehensive analysis. Need at least 5 trades.",
                key_findings=["Not enough trading data available"],
                patterns_identified=[],
                performance_metrics=[],
                risk_assessment=[],
                trading_insights=[],
                recommendations=["Execute more trades to enable meaningful analysis"],
                confidence_score=0.0,
                data_quality_score=0.2,
                next_steps=["Continue trading", "Record more trades", "Return when you have 10+ trades"]
            )
        
        # Create analysis prompt
        analysis_prompt = create_analysis_prompt(trading_data, request.analysis_type, request.focus_areas)
        
        # Get AI analysis
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": TRADING_ANALYST_SYSTEM_PROMPT},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        ai_analysis = response.choices[0].message.content
        
        # Parse AI response and structure it
        # For now, provide structured dummy response based on actual data
        
        # Calculate confidence score based on data quality
        confidence_score = min(1.0, total_trades / 20)  # Full confidence at 20+ trades
        data_quality_score = min(1.0, total_trades / 30)  # Full quality at 30+ trades
        
        # Create structured response
        patterns = []
        if request.include_patterns and total_trades >= 10:
            patterns.append(PatternInsight(
                pattern_type="Win Rate Pattern",
                description=f"Current win rate of {trading_data['summary']['win_rate']:.1%} indicates {'strong' if trading_data['summary']['win_rate'] > 0.6 else 'moderate' if trading_data['summary']['win_rate'] > 0.4 else 'weak'} strategy execution",
                confidence_level="High" if total_trades > 20 else "Medium",
                impact_score=0.8,
                recommendation="Focus on improving trade selection criteria" if trading_data['summary']['win_rate'] < 0.5 else "Maintain current strategy discipline",
                supporting_data={"win_rate": trading_data['summary']['win_rate'], "sample_size": total_trades}
            ))
        
        performance_metrics = []
        if request.include_performance:
            performance_metrics.extend([
                PerformanceMetric(
                    metric_name="Profit Factor",
                    current_value=trading_data['summary']['profit_factor'],
                    benchmark_value=1.5,
                    trend="improving" if trading_data['summary']['profit_factor'] > 1.3 else "stable",
                    significance="critical",
                    analysis=f"Profit factor of {trading_data['summary']['profit_factor']:.2f} {'exceeds' if trading_data['summary']['profit_factor'] > 1.5 else 'meets' if trading_data['summary']['profit_factor'] > 1.0 else 'falls below'} industry standards"
                ),
                PerformanceMetric(
                    metric_name="Total P&L",
                    current_value=trading_data['summary']['total_pnl'],
                    trend="improving" if trading_data['summary']['total_pnl'] > 0 else "declining",
                    significance="important",
                    analysis=f"${trading_data['summary']['total_pnl']:,.2f} total P&L over {request.time_period} days"
                )
            ])
        
        risk_assessments = []
        if request.include_risk_analysis:
            # Calculate risk metrics
            avg_risk_per_trade = abs(trading_data['summary']['avg_loss']) if trading_data['summary']['avg_loss'] != 0 else 0
            
            risk_level = "low" if avg_risk_per_trade < 100 else "medium" if avg_risk_per_trade < 500 else "high"
            
            risk_assessments.append(RiskAssessment(
                risk_category="Position Sizing",
                risk_level=risk_level,
                description=f"Average loss per trade: ${avg_risk_per_trade:.2f}",
                mitigation_strategy="Implement consistent position sizing rules" if risk_level == "high" else "Current risk management appears appropriate",
                priority=3 if risk_level == "high" else 1
            ))
        
        insights = [
            TradingInsight(
                insight_type="Performance Optimization",
                title="Strategy Consistency",
                description=ai_analysis[:200] + "..." if len(ai_analysis) > 200 else ai_analysis,
                actionable_steps=[
                    "Review trade selection criteria",
                    "Analyze winning trade characteristics",
                    "Implement consistent position sizing"
                ],
                expected_impact="Medium",
                timeframe="2-4 weeks"
            )
        ]
        
        pass
        
        return TradingAnalysisResponse(
            analysis_summary=f"Analysis of {total_trades} trades over {request.time_period} days shows {trading_data['summary']['win_rate']:.1%} win rate with ${trading_data['summary']['total_pnl']:,.2f} total P&L",
            key_findings=[
                f"Win rate: {trading_data['summary']['win_rate']:.1%}",
                f"Profit factor: {trading_data['summary']['profit_factor']:.2f}",
                f"Average win: ${trading_data['summary']['avg_win']:,.2f}",
                f"Average loss: ${trading_data['summary']['avg_loss']:,.2f}"
            ],
            patterns_identified=patterns,
            performance_metrics=performance_metrics,
            risk_assessment=risk_assessments,
            trading_insights=insights,
            recommendations=[
                "Focus on maintaining discipline in trade execution",
                "Consider reducing position size if losses are significant",
                "Analyze your best performing trades for patterns"
            ],
            confidence_score=confidence_score,
            data_quality_score=data_quality_score,
            next_steps=[
                "Continue tracking all trades",
                "Implement recommended changes gradually",
                "Review performance weekly"
            ]
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Error analyzing trading performance: {str(e)}")

@router.post("/patterns")
async def analyze_trading_patterns(request: PatternAnalysisRequest, user: AuthorizedUser) -> PatternAnalysisResponse:
    """Focused pattern recognition analysis"""
    user_id = user.sub
    
    try:
        pass
        
        # Get trading data
        trading_data = get_trading_data(user_id, request.time_range or 90)
        total_trades = trading_data["summary"]["total_trades"]
        
        if total_trades < 10:
            return PatternAnalysisResponse(
                patterns_found=[],
                behavioral_insights=["Need at least 10 trades for meaningful pattern analysis"],
                statistical_summary={"total_trades": total_trades, "status": "insufficient_data"},
                coaching_recommendations=["Continue trading to build pattern recognition dataset"]
            )
        
        # Create pattern analysis prompt
        pattern_prompt = f"""
Pattern Recognition Analysis

Trading Data Summary:
- Total Trades: {total_trades}
- Win Rate: {trading_data['summary']['win_rate']:.2%}
- Profit Factor: {trading_data['summary']['profit_factor']:.2f}
- Analysis Period: {request.time_range or 90} days

Identify and analyze trading patterns with confidence levels. Focus on:
1. Win/loss streaks and clustering
2. Time-based patterns (day of week, time of day)
3. Performance consistency patterns
4. Risk management patterns
5. Strategy execution patterns

Provide specific pattern insights with statistical backing.
"""
        
        # Get AI pattern analysis
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": TRADING_ANALYST_SYSTEM_PROMPT},
                {"role": "user", "content": pattern_prompt}
            ],
            temperature=0.2,
            max_tokens=1500
        )
        
        ai_analysis = response.choices[0].message.content
        
        # Create pattern insights based on data
        patterns_found = [
            PatternInsight(
                pattern_type="Win Rate Consistency",
                description=f"Win rate of {trading_data['summary']['win_rate']:.1%} across {total_trades} trades",
                confidence_level="High" if total_trades > 30 else "Medium",
                impact_score=0.7,
                recommendation="Maintain current approach" if trading_data['summary']['win_rate'] > 0.5 else "Review trade selection criteria",
                supporting_data={"win_rate": trading_data['summary']['win_rate'], "sample_size": total_trades}
            )
        ]
        
        return PatternAnalysisResponse(
            patterns_found=patterns_found,
            behavioral_insights=[
                ai_analysis[:150] + "..." if len(ai_analysis) > 150 else ai_analysis,
                "Pattern analysis shows areas for potential optimization"
            ],
            statistical_summary={
                "total_trades": total_trades,
                "patterns_identified": len(patterns_found),
                "confidence_level": "High" if total_trades > 30 else "Medium",
                "analysis_period_days": request.time_range or 90
            },
            coaching_recommendations=[
                "Focus on replicating successful trade patterns",
                "Identify and eliminate negative pattern triggers",
                "Maintain consistent trade execution discipline"
            ]
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Error analyzing patterns: {str(e)}")

pass
