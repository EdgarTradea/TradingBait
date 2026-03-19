from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
import databutton as db
from openai import OpenAI
import os

# Import trial management functions
from app.apis.trial_management import check_trial_usage_limit, update_trial_usage
from app.auth import AuthorizedUser

router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class TradeData(BaseModel):
    symbol: str
    openTime: str
    closeTime: str
    pnl: float
    volume: float
    direction: str
    account: Optional[str] = None

class CalculatedMetrics(BaseModel):
    profit_factor: float
    avg_win: float
    avg_loss: float
    biggest_win_streak: int
    biggest_loss_streak: int
    best_day_of_week: str
    best_time_of_day: str
    avg_trade_duration: str
    win_rate: float
    total_trades: int
    total_pnl: float

class AnalyticsInsightsRequest(BaseModel):
    trades: List[TradeData]
    calculated_metrics: CalculatedMetrics
    user_id: str

class InsightCard(BaseModel):
    type: str  # "strength", "pattern", "recommendation"
    title: str
    insight: str
    action: str

class AnalyticsInsightsResponse(BaseModel):
    overview_insights: List[InsightCard]
    risk_insights: List[InsightCard]
    advanced_insights: List[InsightCard]
    generated_at: str

# Simple rate limiting storage (in production, use Redis or database)
_user_insights_cache: Dict[str, Dict] = {}

def check_daily_limit(user_id: str) -> bool:
    """Check if user has already generated insights today"""
    today = datetime.now().date().isoformat()
    
    if user_id in _user_insights_cache:
        last_generated = _user_insights_cache[user_id].get('last_generated_date')
        if last_generated == today:
            return False  # Already generated today
    
    return True  # Can generate

def cache_insights(user_id: str, insights: Dict[str, Any]) -> None:
    """Cache insights for the user"""
    today = datetime.now().date().isoformat()
    _user_insights_cache[user_id] = {
        'insights': insights,
        'last_generated_date': today,
        'generated_at': datetime.now().isoformat()
    }

def get_cached_insights(user_id: str) -> Optional[Dict[str, Any]]:
    """Get cached insights if available and still valid"""
    if user_id in _user_insights_cache:
        return _user_insights_cache[user_id]['insights']
    return None

def generate_ai_insights(trades: List[TradeData], metrics: CalculatedMetrics) -> Dict[str, List[InsightCard]]:
    """Generate AI insights from trade data and calculated metrics"""
    
    # Prepare trade summary for AI
    trade_summary = f"""
    Trading Data Analysis:
    - Total Trades: {metrics.total_trades}
    - Total P&L: ${metrics.total_pnl:.2f}
    - Win Rate: {metrics.win_rate:.1f}%
    - Profit Factor: {metrics.profit_factor:.2f}
    - Average Win: ${metrics.avg_win:.2f}
    - Average Loss: ${metrics.avg_loss:.2f}
    - Biggest Win Streak: {metrics.biggest_win_streak} trades
    - Biggest Loss Streak: {metrics.biggest_loss_streak} trades
    - Best Day of Week: {metrics.best_day_of_week}
    - Best Time of Day: {metrics.best_time_of_day}
    - Average Trade Duration: {metrics.avg_trade_duration}
    
    Raw Trade Data Sample (first 10 trades):
    """
    
    # Add sample of raw trades
    for i, trade in enumerate(trades[:10]):
        trade_summary += f"\n    Trade {i+1}: {trade.symbol} {trade.direction} P&L: ${trade.pnl:.2f} Duration: {trade.openTime} to {trade.closeTime}"
    
    if len(trades) > 10:
        trade_summary += f"\n    ... and {len(trades) - 10} more trades"
    
    # AI prompt for generating insights
    prompt = f"""
    You are a professional trading coach analyzing a trader's performance data. Your goal is to provide balanced insights that:
    1. Recognize strengths and wins (build confidence)
    2. Identify meaningful patterns (provide evidence)
    3. Offer specific, actionable recommendations (drive improvement)
    
    {trade_summary}
    
    Generate exactly 6 insights following this format for each:
    - Type: "strength" (celebrating wins), "pattern" (data observation), or "recommendation" (specific action)
    - Title: Short, compelling headline
    - Insight: Evidence-based observation with specific data
    - Action: Clear, specific next step or guidance
    
    REQUIREMENTS:
    - Use actual numbers from the data
    - Balance positive recognition with improvement opportunities
    - Make each insight unique and non-obvious
    - Provide evidence before recommendations
    - Be encouraging but professional
    
    Distribute insights as:
    - 3 for Overview tab (1 strength, 1 pattern, 1 recommendation)
    - 2 for Risk tab (1 strength, 1 recommendation) 
    - 1 for Advanced Analytics tab (1 pattern)
    
    Return as JSON with this exact structure:
    {{
        "overview": [
            {{"type": "strength", "title": "...", "insight": "...", "action": "..."}},
            {{"type": "pattern", "title": "...", "insight": "...", "action": "..."}},
            {{"type": "recommendation", "title": "...", "insight": "...", "action": "..."}}
        ],
        "risk": [
            {{"type": "strength", "title": "...", "insight": "...", "action": "..."}},
            {{"type": "recommendation", "title": "...", "insight": "...", "action": "..."}}
        ],
        "advanced": [
            {{"type": "pattern", "title": "...", "insight": "...", "action": "..."}}
        ]
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional trading coach who provides balanced, evidence-based insights. Always include specific data points and actionable recommendations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        # Parse AI response
        import json
        ai_response = response.choices[0].message.content
        
        # Extract JSON from response (handle potential markdown formatting)
        if "```json" in ai_response:
            ai_response = ai_response.split("```json")[1].split("```")[0]
        elif "```" in ai_response:
            ai_response = ai_response.split("```")[1].split("```")[0]
        
        insights_data = json.loads(ai_response.strip())
        
        # Convert to InsightCard objects
        result = {
            "overview_insights": [InsightCard(**card) for card in insights_data["overview"]],
            "risk_insights": [InsightCard(**card) for card in insights_data["risk"]],
            "advanced_insights": [InsightCard(**card) for card in insights_data["advanced"]]
        }
        
        return result
        
    except Exception as e:
        pass
        # Return fallback insights
        return {
            "overview_insights": [
                InsightCard(
                    type="pattern",
                    title="Analysis Available",
                    insight=f"Based on {metrics.total_trades} trades with {metrics.win_rate:.1f}% win rate",
                    action="Continue tracking your performance for deeper insights"
                )
            ],
            "risk_insights": [],
            "advanced_insights": []
        }

@router.post("/analytics-insights")
async def generate_analytics_insights(request: AnalyticsInsightsRequest) -> AnalyticsInsightsResponse:
    """Generate AI-powered analytics insights from trade data"""
    
    user_id = request.user_id
    
    pass
    
    # Check trial usage limits before generating insights
    can_generate, remaining = check_trial_usage_limit(user_id, "analytics_insights")
    if not can_generate:
        raise HTTPException(
            status_code=403, 
            detail="Trial limit reached. You can generate up to 10 analytics insights during your 7-day trial. Please upgrade to continue generating insights."
        )
    
    # Check daily rate limit
    if not check_daily_limit(user_id):
        # Return cached insights
        cached = get_cached_insights(user_id)
        if cached:
            return AnalyticsInsightsResponse(**cached)
        else:
            # No cached insights available, but rate limited
            return AnalyticsInsightsResponse(
                performance_insights=[],
                risk_insights=[],
                advanced_insights=[]
            )
    
    pass
    
    # Generate AI insights
    insights = generate_ai_insights(request.trades, request.calculated_metrics)
    
    # Update trial usage after successful generation
    update_trial_usage(user_id, "analytics_insights", 1)
    pass
    
    # Prepare response
    response_data = {
        **insights,
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'expires_at': (datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)).isoformat()
    }
    
    # Cache the insights
    cache_insights(user_id, response_data)
    
    return AnalyticsInsightsResponse(**response_data)

@router.get("/analytics-insights/status/{user_id}")
async def get_insights_status(user_id: str):
    """Check if user can generate new insights and get last generated time"""
    can_generate = check_daily_limit(user_id)
    cached_data = _user_insights_cache.get(user_id, {})
    
    return {
        "can_generate_today": can_generate,
        "last_generated": cached_data.get('generated_at'),
        "has_cached_insights": user_id in _user_insights_cache
    }
