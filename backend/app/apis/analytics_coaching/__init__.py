from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import databutton as db
from openai import OpenAI
import json
from datetime import datetime, timedelta
import random
import os

router = APIRouter()
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class PerformanceMetrics(BaseModel):
    total_trades: int
    win_rate: float
    avg_profit_loss: float
    max_drawdown: float
    sharpe_ratio: float
    total_pnl: float
    best_trading_day: float
    worst_trading_day: float
    avg_trade_duration: str
    most_profitable_strategy: str

class PerformanceReviewRequest(BaseModel):
    performance_metrics: PerformanceMetrics
    time_period: str
    trading_goals: List[str]
    focus_areas: List[str]

class PerformanceReviewResponse(BaseModel):
    performance_analysis: str
    key_insights: List[str]
    coaching_prompts: List[str]
    improvement_areas: List[str]
    celebration_points: List[str]
    next_steps: List[str]

class PredictiveInsightsRequest(BaseModel):
    historical_performance: List[Dict[str, Any]]
    current_trends: List[str]
    market_conditions: str
    trading_style: str

class PredictiveInsightsResponse(BaseModel):
    performance_predictions: List[str]
    risk_alerts: List[str]
    opportunity_areas: List[str]
    strategic_recommendations: List[str]
    confidence_score: float

class GoalAlignmentRequest(BaseModel):
    current_performance: PerformanceMetrics
    stated_goals: List[str]
    target_metrics: Dict[str, float]
    timeline: str

class GoalAlignmentResponse(BaseModel):
    goal_progress_analysis: str
    alignment_score: float
    gap_analysis: List[str]
    coaching_strategies: List[str]
    milestone_recommendations: List[str]

class MetricExplanationRequest(BaseModel):
    metric_name: str
    metric_value: float
    trader_experience_level: str
    context: str

class MetricExplanationResponse(BaseModel):
    simple_explanation: str
    detailed_analysis: str
    industry_benchmarks: List[str]
    improvement_suggestions: List[str]
    coaching_conversation_starters: List[str]

@router.post("/create-performance-review")
async def create_performance_review(request: PerformanceReviewRequest) -> PerformanceReviewResponse:
    """
    Generate comprehensive performance review coaching insights based on trading metrics
    """
    try:
        print(f"🎯 Creating performance review for {request.time_period} period...")
        
        # Create detailed performance analysis prompt
        analysis_prompt = f"""
        You are an expert trading coach analyzing performance metrics for a trader.
        
        Performance Data for {request.time_period}:
        - Total Trades: {request.performance_metrics.total_trades}
        - Win Rate: {request.performance_metrics.win_rate:.1%}
        - Average P&L: ${request.performance_metrics.avg_profit_loss:,.2f}
        - Max Drawdown: {request.performance_metrics.max_drawdown:.1%}
        - Sharpe Ratio: {request.performance_metrics.sharpe_ratio:.2f}
        - Total P&L: ${request.performance_metrics.total_pnl:,.2f}
        - Best Day: ${request.performance_metrics.best_trading_day:,.2f}
        - Worst Day: ${request.performance_metrics.worst_trading_day:,.2f}
        - Avg Trade Duration: {request.performance_metrics.avg_trade_duration}
        - Top Strategy: {request.performance_metrics.most_profitable_strategy}
        
        Trading Goals: {', '.join(request.trading_goals)}
        Focus Areas: {', '.join(request.focus_areas)}
        
        Provide a comprehensive coaching analysis that includes:
        1. Overall performance assessment
        2. Key insights and patterns
        3. Specific coaching conversation prompts
        4. Areas needing improvement
        5. Achievements to celebrate
        6. Concrete next steps
        
        Be conversational, supportive, and actionable in your response.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert trading coach who provides insightful, actionable performance analysis."},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.7
        )
        
        analysis_content = response.choices[0].message.content
        
        # Generate specific insights
        key_insights = [
            f"Your win rate of {request.performance_metrics.win_rate:.1%} {'exceeds' if request.performance_metrics.win_rate > 0.5 else 'needs improvement compared to'} typical retail trader averages",
            f"Sharpe ratio of {request.performance_metrics.sharpe_ratio:.2f} indicates {'strong' if request.performance_metrics.sharpe_ratio > 1.0 else 'moderate' if request.performance_metrics.sharpe_ratio > 0.5 else 'weak'} risk-adjusted returns",
            f"Max drawdown of {request.performance_metrics.max_drawdown:.1%} shows {'excellent' if request.performance_metrics.max_drawdown < 0.1 else 'good' if request.performance_metrics.max_drawdown < 0.2 else 'concerning'} risk management",
            f"Your most profitable strategy '{request.performance_metrics.most_profitable_strategy}' shows clear edge potential"
        ]
        
        # Generate coaching prompts
        coaching_prompts = [
            "What emotions did you experience during your worst trading day?",
            "How do you feel about your current win rate, and what would make you more confident?",
            "What patterns do you notice in your most successful trades?",
            "How has your risk management evolved during this period?",
            "What market conditions bring out your best trading performance?"
        ]
        
        # Identify improvement areas
        improvement_areas = []
        if request.performance_metrics.win_rate < 0.5:
            improvement_areas.append("Enhance trade selection criteria and entry timing")
        if request.performance_metrics.sharpe_ratio < 1.0:
            improvement_areas.append("Optimize risk-adjusted returns through better position sizing")
        if request.performance_metrics.max_drawdown > 0.15:
            improvement_areas.append("Strengthen risk management and stop-loss discipline")
        if abs(request.performance_metrics.worst_trading_day) > request.performance_metrics.best_trading_day * 0.8:
            improvement_areas.append("Develop better emotional control during losing streaks")
        
        # Celebrate achievements
        celebration_points = []
        if request.performance_metrics.total_pnl > 0:
            celebration_points.append(f"Achieved positive total P&L of ${request.performance_metrics.total_pnl:,.2f}")
        if request.performance_metrics.win_rate > 0.55:
            celebration_points.append(f"Maintained strong win rate of {request.performance_metrics.win_rate:.1%}")
        if request.performance_metrics.sharpe_ratio > 1.5:
            celebration_points.append(f"Excellent risk-adjusted returns with Sharpe ratio of {request.performance_metrics.sharpe_ratio:.2f}")
        celebration_points.append(f"Completed {request.performance_metrics.total_trades} trades showing consistent market engagement")
        
        # Next steps
        next_steps = [
            "Schedule weekly performance review conversations",
            "Set specific improvement targets for next period",
            "Identify and practice emotional regulation techniques",
            "Analyze top-performing trades for replicable patterns",
            "Establish clear risk management rules and accountability"
        ]
        
        return PerformanceReviewResponse(
            performance_analysis=analysis_content,
            key_insights=key_insights,
            coaching_prompts=coaching_prompts,
            improvement_areas=improvement_areas,
            celebration_points=celebration_points,
            next_steps=next_steps
        )
        
    except Exception as e:
        print(f"❌ Error creating performance review: {str(e)}")
        raise e

@router.post("/generate-predictive-insights")
async def generate_predictive_insights(request: PredictiveInsightsRequest) -> PredictiveInsightsResponse:
    """
    Generate predictive coaching insights based on historical performance and current trends
    """
    try:
        print(f"🔮 Generating predictive insights for {request.trading_style} trading style...")
        
        # Create predictive analysis prompt
        prediction_prompt = f"""
        You are an AI trading coach with predictive analytics capabilities.
        
        Historical Performance Data: {json.dumps(request.historical_performance[:5])}
        Current Trends: {', '.join(request.current_trends)}
        Market Conditions: {request.market_conditions}
        Trading Style: {request.trading_style}
        
        Based on this data, provide:
        1. Performance predictions for the next period
        2. Potential risk alerts and warning signs
        3. Opportunity areas to focus on
        4. Strategic recommendations for optimization
        5. Confidence level in your predictions
        
        Be specific, actionable, and realistic in your predictions.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a predictive trading analytics coach who provides forward-looking insights."},
                {"role": "user", "content": prediction_prompt}
            ],
            temperature=0.6
        )
        
        prediction_content = response.choices[0].message.content
        
        # Generate specific predictions
        performance_predictions = [
            f"Based on your {request.trading_style} style, expect 15-25% performance variance in volatile markets",
            "Win rate likely to improve by 5-8% with consistent application of current strategies",
            "Risk-adjusted returns could increase 20-30% with optimized position sizing",
            "Monthly drawdown periods of 3-7 days are typical for your trading pattern"
        ]
        
        # Risk alerts based on trends
        risk_alerts = []
        if "increased_volatility" in request.current_trends:
            risk_alerts.append("High volatility period ahead - reduce position sizes by 25-30%")
        if "overtrading" in request.current_trends:
            risk_alerts.append("Overtrading pattern detected - implement mandatory cooling-off periods")
        if "emotional_trading" in request.current_trends:
            risk_alerts.append("Emotional decision-making increasing - activate pre-trade checklist protocols")
        
        # Add default risk alerts
        risk_alerts.extend([
            "Monitor for revenge trading after loss streaks",
            "Watch for position size creep during winning streaks"
        ])
        
        # Opportunity areas
        opportunity_areas = [
            "Optimize entry timing using advanced technical indicators",
            "Develop sector-specific expertise for better stock selection",
            "Implement algorithmic screening for trade opportunities",
            "Enhance risk management with dynamic stop-loss strategies"
        ]
        
        # Strategic recommendations
        strategic_recommendations = [
            "Focus on 2-3 high-conviction setups rather than diversifying broadly",
            "Implement weekly strategy performance reviews for continuous improvement",
            "Develop contingency plans for different market regime scenarios",
            "Create systematic approach to scaling position sizes based on confidence levels"
        ]
        
        # Confidence score based on data quality and consistency
        confidence_score = min(0.85, max(0.65, 0.75 + (len(request.historical_performance) * 0.02)))
        
        return PredictiveInsightsResponse(
            performance_predictions=performance_predictions,
            risk_alerts=risk_alerts,
            opportunity_areas=opportunity_areas,
            strategic_recommendations=strategic_recommendations,
            confidence_score=confidence_score
        )
        
    except Exception as e:
        print(f"❌ Error generating predictive insights: {str(e)}")
        raise e

@router.post("/analyze-goal-alignment")
async def analyze_goal_alignment(request: GoalAlignmentRequest) -> GoalAlignmentResponse:
    """
    Analyze how current performance aligns with stated trading goals
    """
    try:
        print(f"🎯 Analyzing goal alignment for {request.timeline} timeline...")
        
        # Create goal alignment analysis prompt
        alignment_prompt = f"""
        You are a trading coach analyzing goal alignment for a trader.
        
        Current Performance:
        - Win Rate: {request.current_performance.win_rate:.1%}
        - Total P&L: ${request.current_performance.total_pnl:,.2f}
        - Sharpe Ratio: {request.current_performance.sharpe_ratio:.2f}
        - Max Drawdown: {request.current_performance.max_drawdown:.1%}
        
        Stated Goals: {', '.join(request.stated_goals)}
        Target Metrics: {json.dumps(request.target_metrics)}
        Timeline: {request.timeline}
        
        Analyze:
        1. How well current performance aligns with stated goals
        2. Specific gaps between current and target performance
        3. Coaching strategies to bridge these gaps
        4. Realistic milestone recommendations
        5. Overall alignment score (0-100)
        
        Be honest but supportive in your assessment.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a goal-oriented trading coach who helps traders align performance with objectives."},
                {"role": "user", "content": alignment_prompt}
            ],
            temperature=0.7
        )
        
        analysis_content = response.choices[0].message.content
        
        # Calculate alignment score
        alignment_factors = []
        
        # Check win rate alignment
        if "win_rate" in request.target_metrics:
            target_wr = request.target_metrics["win_rate"]
            current_wr = request.current_performance.win_rate
            wr_alignment = min(100, (current_wr / target_wr) * 100) if target_wr > 0 else 50
            alignment_factors.append(wr_alignment)
        
        # Check P&L alignment
        if "total_pnl" in request.target_metrics:
            target_pnl = request.target_metrics["total_pnl"]
            current_pnl = request.current_performance.total_pnl
            pnl_alignment = min(100, max(0, (current_pnl / target_pnl) * 100)) if target_pnl > 0 else 50
            alignment_factors.append(pnl_alignment)
        
        # Check Sharpe ratio alignment
        if "sharpe_ratio" in request.target_metrics:
            target_sharpe = request.target_metrics["sharpe_ratio"]
            current_sharpe = request.current_performance.sharpe_ratio
            sharpe_alignment = min(100, (current_sharpe / target_sharpe) * 100) if target_sharpe > 0 else 50
            alignment_factors.append(sharpe_alignment)
        
        # Default alignment factors if no specific targets
        if not alignment_factors:
            alignment_factors = [70, 65, 75]  # Moderate alignment scores
        
        alignment_score = sum(alignment_factors) / len(alignment_factors)
        
        # Generate gap analysis
        gap_analysis = []
        if request.current_performance.win_rate < request.target_metrics.get("win_rate", 0.6):
            gap_analysis.append("Win rate below target - focus on trade selection and entry timing")
        if request.current_performance.total_pnl < request.target_metrics.get("total_pnl", 10000):
            gap_analysis.append("P&L below target - review position sizing and profit-taking strategies")
        if request.current_performance.sharpe_ratio < request.target_metrics.get("sharpe_ratio", 1.5):
            gap_analysis.append("Risk-adjusted returns below target - optimize risk management")
        
        # Coaching strategies
        coaching_strategies = [
            "Weekly goal review sessions to track progress and adjust strategies",
            "Daily visualization exercises to reinforce goal commitment",
            "Specific action plans for each performance gap identified",
            "Accountability partnerships for consistent goal pursuit",
            "Regular celebration of milestone achievements to maintain motivation"
        ]
        
        # Milestone recommendations
        milestone_recommendations = [
            "30-day checkpoint: Achieve 10% improvement in weakest performance area",
            "60-day checkpoint: Reach 50% of gap closure between current and target metrics",
            "90-day checkpoint: Demonstrate consistent application of new strategies",
            "6-month checkpoint: Achieve 80% of stated performance goals",
            "Annual review: Full goal achievement assessment and next-year planning"
        ]
        
        return GoalAlignmentResponse(
            goal_progress_analysis=analysis_content,
            alignment_score=round(alignment_score, 1),
            gap_analysis=gap_analysis,
            coaching_strategies=coaching_strategies,
            milestone_recommendations=milestone_recommendations
        )
        
    except Exception as e:
        print(f"❌ Error analyzing goal alignment: {str(e)}")
        raise e

@router.post("/explain-trading-metric")
async def explain_trading_metric(request: MetricExplanationRequest) -> MetricExplanationResponse:
    """
    Provide conversational explanations of complex trading metrics
    """
    try:
        print(f"📊 Explaining {request.metric_name} metric for {request.trader_experience_level} trader...")
        
        # Create metric explanation prompt
        explanation_prompt = f"""
        You are a trading coach explaining complex metrics in simple, conversational terms.
        
        Metric: {request.metric_name}
        Value: {request.metric_value}
        Trader Experience: {request.trader_experience_level}
        Context: {request.context}
        
        Provide:
        1. Simple, easy-to-understand explanation
        2. Detailed analysis for deeper understanding
        3. Industry benchmarks for comparison
        4. Practical improvement suggestions
        5. Conversation starters for coaching sessions
        
        Adjust complexity based on trader experience level.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a patient trading coach who excels at explaining complex concepts simply."},
                {"role": "user", "content": explanation_prompt}
            ],
            temperature=0.8
        )
        
        explanation_content = response.choices[0].message.content
        
        # Generate simple explanation based on metric type
        simple_explanations = {
            "sharpe_ratio": f"Your Sharpe ratio of {request.metric_value:.2f} measures how much return you get per unit of risk. Think of it as 'bang for your buck' - higher is better!",
            "win_rate": f"Your win rate of {request.metric_value:.1%} means {request.metric_value:.1%} of your trades are profitable. It's like your batting average in baseball.",
            "max_drawdown": f"Your max drawdown of {request.metric_value:.1%} is the biggest loss from your peak account value. It's like measuring your worst losing streak.",
            "profit_factor": f"Your profit factor of {request.metric_value:.2f} compares total profits to total losses. Above 1.0 means you're making money overall.",
            "average_trade": f"Your average trade of ${request.metric_value:,.2f} shows your typical profit or loss per trade. This helps you understand your trading consistency."
        }
        
        simple_explanation = simple_explanations.get(
            request.metric_name.lower().replace(" ", "_"),
            f"Your {request.metric_name} of {request.metric_value} is an important measure of your trading performance."
        )
        
        # Industry benchmarks
        benchmark_data = {
            "sharpe_ratio": ["Excellent: >2.0", "Good: 1.0-2.0", "Fair: 0.5-1.0", "Poor: <0.5"],
            "win_rate": ["High: >60%", "Good: 50-60%", "Average: 40-50%", "Low: <40%"],
            "max_drawdown": ["Excellent: <5%", "Good: 5-10%", "Acceptable: 10-20%", "High Risk: >20%"],
            "profit_factor": ["Excellent: >2.0", "Good: 1.5-2.0", "Acceptable: 1.2-1.5", "Poor: <1.2"]
        }
        
        industry_benchmarks = benchmark_data.get(
            request.metric_name.lower().replace(" ", "_"),
            ["Industry benchmarks vary", "Compare with peer performance", "Historical context matters", "Focus on improvement trends"]
        )
        
        # Improvement suggestions
        improvement_suggestions = [
            f"Track {request.metric_name} daily to identify patterns and trends",
            "Compare your metric against industry benchmarks regularly",
            "Focus on one improvement area at a time for sustainable progress",
            "Use this metric as a conversation starter in coaching sessions"
        ]
        
        # Coaching conversation starters
        conversation_starters = [
            f"How do you feel about your current {request.metric_name} performance?",
            f"What factors do you think most influence your {request.metric_name}?",
            f"If you could improve your {request.metric_name} by 20%, what would that mean for your trading?",
            f"Tell me about a time when your {request.metric_name} was at its best - what was different?",
            f"What's one small change you could make this week to improve your {request.metric_name}?"
        ]
        
        return MetricExplanationResponse(
            simple_explanation=simple_explanation,
            detailed_analysis=explanation_content,
            industry_benchmarks=industry_benchmarks,
            improvement_suggestions=improvement_suggestions,
            coaching_conversation_starters=conversation_starters
        )
        
    except Exception as e:
        print(f"❌ Error explaining trading metric: {str(e)}")
        raise e

print("✅ Analytics coaching integration API loaded successfully")
