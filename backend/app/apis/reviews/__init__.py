from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import databutton as db
from openai import OpenAI
import json
from datetime import datetime, timedelta
from app.auth import AuthorizedUser
import os

router = APIRouter(prefix="/reviews")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# ============================================================================
# REVIEWS - CONSOLIDATED AI ENDPOINT
# ============================================================================

# Consolidated system prompt for comprehensive reviews
REVIEWS_SYSTEM_PROMPT = """
You are an expert performance review specialist and comprehensive trading coach with expertise in:

**Core Expertise:**
- Comprehensive performance assessment and analysis
- Multi-dimensional progress evaluation (trading, psychological, habitual)
- Goal alignment and achievement measurement
- Strategic planning and future roadmap development
- Holistic trader development and mentorship

**Analysis Focus:**
- Synthesize data from multiple sources (trades, journal, habits, analytics)
- Identify patterns, trends, and correlations across different areas
- Assess progress toward stated goals and objectives
- Evaluate strategy effectiveness and adaptation needs
- Provide comprehensive action plans with specific next steps

**Communication Style:**
- Professional yet supportive tone appropriate for performance reviews
- Balance honest assessment with encouraging guidance
- Provide specific, measurable recommendations
- Use clear section headers and structured formatting
- Focus on actionable insights rather than just analysis

**Output Format:**
- Executive Summary with key highlights
- Detailed analysis by category (Performance, Psychology, Development)
- Strengths and Areas for Improvement
- Goal Progress Assessment
- Strategic Recommendations with timelines
- Next Period Objectives and Success Metrics

Your goal is to provide comprehensive, insightful reviews that drive meaningful improvement and strategic development.
"""

class ReviewRequest(BaseModel):
    review_type: str  # weekly, monthly, quarterly, custom
    time_period: Optional[int] = None  # days, overrides review_type if provided
    include_trading_performance: bool = True
    include_behavioral_analysis: bool = True
    include_goal_assessment: bool = True
    include_recommendations: bool = True
    custom_focus_areas: Optional[List[str]] = None
    previous_goals: Optional[List[str]] = None

class PerformanceSection(BaseModel):
    section_title: str
    key_metrics: Dict[str, Any]
    analysis: str
    grade: str  # A, B, C, D, F
    trends: List[str]
    highlights: List[str]
    concerns: List[str]

class GoalAssessment(BaseModel):
    goal: str
    status: str  # achieved, in_progress, not_started, needs_revision
    progress_percentage: float
    assessment: str
    next_steps: List[str]

class Recommendation(BaseModel):
    category: str
    priority: str  # high, medium, low
    title: str
    description: str
    action_steps: List[str]
    timeline: str
    success_metrics: List[str]
    resources_needed: List[str]

class ReviewResponse(BaseModel):
    review_period: str
    executive_summary: str
    overall_grade: str
    performance_sections: List[PerformanceSection]
    goal_assessments: List[GoalAssessment]
    key_strengths: List[str]
    improvement_areas: List[str]
    strategic_recommendations: List[Recommendation]
    next_period_objectives: List[str]
    confidence_score: float
    review_date: str

class WeeklyReviewRequest(BaseModel):
    focus_areas: Optional[List[str]] = None
    include_quick_wins: bool = True
    include_next_week_planning: bool = True

class WeeklyReviewResponse(BaseModel):
    week_summary: str
    trading_highlights: List[str]
    key_learnings: List[str]
    challenges_faced: List[str]
    quick_wins_achieved: List[str]
    areas_for_next_week: List[str]
    action_items: List[str]
    motivational_note: str

class MonthlyReviewRequest(BaseModel):
    include_quarterly_outlook: bool = False
    benchmark_comparison: bool = True
    strategic_planning: bool = True

class MonthlyReviewResponse(BaseModel):
    monthly_summary: str
    performance_overview: Dict[str, Any]
    goal_progress: List[GoalAssessment]
    strategic_insights: List[str]
    monthly_grade: str
    improvement_plan: List[str]
    next_month_focus: List[str]
    quarterly_outlook: Optional[str] = None

# ============================================================================
# DATA AGGREGATION HELPERS
# ============================================================================

def get_comprehensive_data(user_id: str, days_back: int) -> Dict[str, Any]:
    """Get all user data for comprehensive review"""
    try:
        # Trading data
        trades_key = f"trades_{user_id}"
        all_trades = db.storage.json.get(trades_key, default=[])
        
        # Journal data
        journal_key = f"journal_entries_{user_id}"
        all_journal = db.storage.json.get(journal_key, default=[])
        
        # Habits data
        habits_key = f"habits_{user_id}"
        all_habits = db.storage.json.get(habits_key, default=[])
        
        # Filter by time period
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        recent_trades = [t for t in all_trades if datetime.fromisoformat(t.get('created_at', '2024-01-01')) >= cutoff_date]
        recent_journal = [j for j in all_journal if datetime.fromisoformat(j.get('created_at', '2024-01-01')) >= cutoff_date]
        
        # Calculate trading metrics
        if recent_trades:
            winning_trades = [t for t in recent_trades if float(t.get('pnl', 0)) > 0]
            total_pnl = sum(float(t.get('pnl', 0)) for t in recent_trades)
            win_rate = len(winning_trades) / len(recent_trades)
            avg_win = sum(float(t.get('pnl', 0)) for t in winning_trades) / len(winning_trades) if winning_trades else 0
            avg_loss = sum(float(t.get('pnl', 0)) for t in recent_trades if float(t.get('pnl', 0)) < 0) / len([t for t in recent_trades if float(t.get('pnl', 0)) < 0]) if [t for t in recent_trades if float(t.get('pnl', 0)) < 0] else 0
            
            trading_metrics = {
                "total_trades": len(recent_trades),
                "win_rate": win_rate,
                "total_pnl": total_pnl,
                "avg_win": avg_win,
                "avg_loss": avg_loss,
                "profit_factor": abs(avg_win / avg_loss) if avg_loss != 0 else float('inf'),
                "best_trade": max(float(t.get('pnl', 0)) for t in recent_trades),
                "worst_trade": min(float(t.get('pnl', 0)) for t in recent_trades)
            }
        else:
            trading_metrics = {
                "total_trades": 0,
                "win_rate": 0,
                "total_pnl": 0,
                "avg_win": 0,
                "avg_loss": 0,
                "profit_factor": 0,
                "best_trade": 0,
                "worst_trade": 0
            }
        
        # Calculate habit metrics
        habit_metrics = {}
        for habit in all_habits:
            completions = habit.get('completions', [])
            recent_completions = [c for c in completions if datetime.fromisoformat(c) >= cutoff_date]
            habit_metrics[habit.get('name', 'Unknown')] = {
                "completion_rate": len(recent_completions) / days_back if days_back > 0 else 0,
                "total_completions": len(recent_completions),
                "consistency_score": len(recent_completions) / days_back if days_back > 0 else 0
            }
        
        # Journal insights
        journal_metrics = {
            "total_entries": len(recent_journal),
            "entries_per_week": len(recent_journal) / (days_back / 7) if days_back > 0 else 0,
            "mood_data": [j.get('mood', 'neutral') for j in recent_journal if j.get('mood')],
            "reflection_quality": "high" if len(recent_journal) > days_back * 0.5 else "medium" if len(recent_journal) > days_back * 0.2 else "low"
        }
        
        return {
            "trading": trading_metrics,
            "habits": habit_metrics,
            "journal": journal_metrics,
            "raw_data": {
                "trades": recent_trades,
                "journal": recent_journal,
                "habits": all_habits
            },
            "period_days": days_back
        }
        
    except Exception as e:
        pass
        return {"trading": {}, "habits": {}, "journal": {}, "raw_data": {}, "period_days": days_back}

def create_review_prompt(data: Dict[str, Any], review_type: str, focus_areas: List[str] = None) -> str:
    """Create comprehensive review prompt"""
    
    trading = data.get('trading', {})
    habits = data.get('habits', {})
    journal = data.get('journal', {})
    period_days = data.get('period_days', 0)
    
    base_prompt = f"""
Comprehensive Trading Performance Review

**Review Type:** {review_type.title()}
**Period:** {period_days} days
**Focus Areas:** {', '.join(focus_areas) if focus_areas else 'Comprehensive assessment'}

**Trading Performance:**
- Total Trades: {trading.get('total_trades', 0)}
- Win Rate: {trading.get('win_rate', 0):.1%}
- Total P&L: ${trading.get('total_pnl', 0):,.2f}
- Profit Factor: {trading.get('profit_factor', 0):.2f}
- Best Trade: ${trading.get('best_trade', 0):,.2f}
- Worst Trade: ${trading.get('worst_trade', 0):,.2f}

**Behavioral Metrics:**
- Journal Entries: {journal.get('total_entries', 0)}
- Journaling Frequency: {journal.get('entries_per_week', 0):.1f} entries/week
- Reflection Quality: {journal.get('reflection_quality', 'unknown')}

**Habit Tracking:**
"""
    
    for habit_name, metrics in habits.items():
        base_prompt += f"\n- {habit_name}: {metrics.get('completion_rate', 0):.1%} completion rate"
    
    if review_type == "weekly":
        return base_prompt + """

Provide a weekly performance review including:
1. Week highlights and key achievements
2. Trading performance analysis
3. Behavioral and habit progress
4. Key learnings and insights
5. Areas for improvement next week
6. Specific action items for the coming week
7. Motivational note to maintain momentum

Keep the tone encouraging and focused on continuous improvement.
"""
    
    elif review_type == "monthly":
        return base_prompt + """

Provide a comprehensive monthly review including:
1. Overall performance assessment and grading
2. Detailed analysis of trading, behavioral, and developmental progress
3. Goal achievement assessment
4. Strategic insights and pattern recognition
5. Areas of strength and improvement opportunities
6. Strategic recommendations for next month
7. Quarterly outlook and long-term planning

Provide professional-level analysis with specific recommendations.
"""
    
    else:  # comprehensive/custom
        return base_prompt + """

Provide a comprehensive performance review including:
1. Executive summary with overall assessment
2. Detailed performance analysis by category
3. Goal progress evaluation
4. Strengths and improvement areas identification
5. Strategic recommendations with timelines
6. Next period objectives and success metrics

Structure as a professional performance review with actionable insights.
"""

def calculate_performance_grade(trading_metrics: Dict, journal_metrics: Dict, habit_metrics: Dict) -> str:
    """Calculate overall performance grade"""
    try:
        score = 0
        max_score = 0
        
        # Trading performance (40% weight)
        if trading_metrics.get('total_trades', 0) > 0:
            win_rate = trading_metrics.get('win_rate', 0)
            profit_factor = trading_metrics.get('profit_factor', 0)
            total_pnl = trading_metrics.get('total_pnl', 0)
            
            # Win rate scoring (0-40 points)
            if win_rate >= 0.6:
                score += 40
            elif win_rate >= 0.5:
                score += 30
            elif win_rate >= 0.4:
                score += 20
            else:
                score += 10
            max_score += 40
            
            # Profitability bonus
            if total_pnl > 0 and profit_factor > 1.5:
                score += 10
            max_score += 10
        
        # Journal consistency (25% weight)
        entries_per_week = journal_metrics.get('entries_per_week', 0)
        if entries_per_week >= 5:
            score += 25
        elif entries_per_week >= 3:
            score += 20
        elif entries_per_week >= 1:
            score += 15
        else:
            score += 5
        max_score += 25
        
        # Habit consistency (25% weight)
        if habit_metrics:
            avg_completion = sum(h.get('completion_rate', 0) for h in habit_metrics.values()) / len(habit_metrics)
            if avg_completion >= 0.8:
                score += 25
            elif avg_completion >= 0.6:
                score += 20
            elif avg_completion >= 0.4:
                score += 15
            else:
                score += 10
        else:
            score += 5
        max_score += 25
        
        # Overall engagement (10% weight)
        if trading_metrics.get('total_trades', 0) > 0 and journal_metrics.get('total_entries', 0) > 0:
            score += 10
        elif trading_metrics.get('total_trades', 0) > 0 or journal_metrics.get('total_entries', 0) > 0:
            score += 5
        max_score += 10
        
        # Calculate percentage
        percentage = (score / max_score) * 100 if max_score > 0 else 0
        
        if percentage >= 90:
            return "A"
        elif percentage >= 80:
            return "B"
        elif percentage >= 70:
            return "C"
        elif percentage >= 60:
            return "D"
        else:
            return "F"
            
    except Exception as e:
        pass
        return "C"

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/health")
async def reviews_health_check():
    """Health check for reviews API"""
    return {
        "status": "healthy",
        "service": "reviews",
        "timestamp": datetime.now().isoformat(),
        "features": [
            "comprehensive_reviews",
            "weekly_assessments",
            "monthly_evaluations",
            "goal_tracking",
            "performance_grading",
            "strategic_planning"
        ]
    }

@router.post("/generate")
async def generate_comprehensive_review(request: ReviewRequest, user: AuthorizedUser) -> ReviewResponse:
    """Generate comprehensive performance review"""
    user_id = user.sub
    
    try:
        pass
        
        # Determine time period
        if request.time_period:
            days_back = request.time_period
        elif request.review_type == "weekly":
            days_back = 7
        elif request.review_type == "monthly":
            days_back = 30
        elif request.review_type == "quarterly":
            days_back = 90
        else:
            days_back = 30
        
        # Get comprehensive data
        data = get_comprehensive_data(user_id, days_back)
        
        # Check data sufficiency
        trading_data = data.get('trading', {})
        if trading_data.get('total_trades', 0) == 0 and data.get('journal', {}).get('total_entries', 0) == 0:
            return ReviewResponse(
                review_period=f"{days_back} days",
                executive_summary="Insufficient data for comprehensive review. Need trading activity or journal entries.",
                overall_grade="Incomplete",
                performance_sections=[],
                goal_assessments=[],
                key_strengths=["Getting started with the platform"],
                improvement_areas=["Increase trading activity", "Begin journaling", "Track habits"],
                strategic_recommendations=[
                    Recommendation(
                        category="Getting Started",
                        priority="high",
                        title="Begin Data Collection",
                        description="Start tracking trades and journaling to enable meaningful reviews",
                        action_steps=[
                            "Record all trades in the platform",
                            "Write daily journal entries",
                            "Set up 2-3 key habits to track"
                        ],
                        timeline="1-2 weeks",
                        success_metrics=["10+ trades recorded", "Daily journal entries"],
                        resources_needed=["Time commitment", "Consistency"]
                    )
                ],
                next_period_objectives=["Establish consistent data tracking", "Build platform engagement habits"],
                confidence_score=0.0,
                review_date=datetime.now().isoformat()
            )
        
        # Create review prompt
        review_prompt = create_review_prompt(data, request.review_type, request.custom_focus_areas)
        
        # Get AI review
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": REVIEWS_SYSTEM_PROMPT},
                {"role": "user", "content": review_prompt}
            ],
            temperature=0.3,
            max_tokens=2500
        )
        
        ai_review = response.choices[0].message.content
        
        # Calculate overall grade
        overall_grade = calculate_performance_grade(data['trading'], data['journal'], data['habits'])
        
        # Create structured performance sections
        performance_sections = []
        
        if request.include_trading_performance and trading_data.get('total_trades', 0) > 0:
            trading_grade = "A" if trading_data.get('win_rate', 0) > 0.6 and trading_data.get('total_pnl', 0) > 0 else "B" if trading_data.get('win_rate', 0) > 0.5 else "C"
            performance_sections.append(PerformanceSection(
                section_title="Trading Performance",
                key_metrics={
                    "win_rate": f"{trading_data.get('win_rate', 0):.1%}",
                    "total_pnl": f"${trading_data.get('total_pnl', 0):,.2f}",
                    "profit_factor": f"{trading_data.get('profit_factor', 0):.2f}",
                    "total_trades": trading_data.get('total_trades', 0)
                },
                analysis=f"Trading performance shows {trading_data.get('win_rate', 0):.1%} win rate with {trading_data.get('total_trades', 0)} trades",
                grade=trading_grade,
                trends=["Win rate trending" + (" up" if trading_data.get('win_rate', 0) > 0.5 else " down")],
                highlights=["Maintained trading discipline"] if trading_data.get('total_trades', 0) > 10 else ["Building trading activity"],
                concerns=["Low win rate"] if trading_data.get('win_rate', 0) < 0.4 else []
            ))
        
        if request.include_behavioral_analysis:
            journal_data = data.get('journal', {})
            behavioral_grade = "A" if journal_data.get('entries_per_week', 0) >= 5 else "B" if journal_data.get('entries_per_week', 0) >= 3 else "C"
            performance_sections.append(PerformanceSection(
                section_title="Behavioral Development",
                key_metrics={
                    "journal_entries": journal_data.get('total_entries', 0),
                    "entries_per_week": f"{journal_data.get('entries_per_week', 0):.1f}",
                    "reflection_quality": journal_data.get('reflection_quality', 'unknown')
                },
                analysis="Behavioral tracking shows consistent self-reflection habits" if journal_data.get('entries_per_week', 0) > 3 else "Opportunity to improve behavioral tracking",
                grade=behavioral_grade,
                trends=["Journaling consistency improving" if journal_data.get('total_entries', 0) > 5 else "Need more consistency"],
                highlights=["Good self-awareness"] if journal_data.get('total_entries', 0) > 10 else [],
                concerns=["Inconsistent journaling"] if journal_data.get('entries_per_week', 0) < 2 else []
            ))
        
        # Goal assessments
        goal_assessments = []
        if request.previous_goals:
            for goal in request.previous_goals:
                goal_assessments.append(GoalAssessment(
                    goal=goal,
                    status="in_progress",
                    progress_percentage=0.7,  # Simplified assessment
                    assessment="Good progress toward goal achievement",
                    next_steps=["Continue current approach", "Monitor progress weekly"]
                ))
        
        # Generate recommendations
        recommendations = []
        
        if trading_data.get('win_rate', 0) < 0.5:
            recommendations.append(Recommendation(
                category="Trading Strategy",
                priority="high",
                title="Improve Trade Selection",
                description="Focus on improving trade selection criteria to increase win rate",
                action_steps=[
                    "Analyze losing trades for patterns",
                    "Refine entry criteria",
                    "Implement stricter trade selection"
                ],
                timeline="2-4 weeks",
                success_metrics=["Win rate > 50%", "Reduced losing streaks"],
                resources_needed=["Time for analysis", "Trading discipline"]
            ))
        
        if data.get('journal', {}).get('entries_per_week', 0) < 3:
            recommendations.append(Recommendation(
                category="Behavioral Development",
                priority="medium",
                title="Increase Journal Consistency",
                description="Regular journaling improves self-awareness and trading psychology",
                action_steps=[
                    "Set daily journaling reminder",
                    "Write brief post-trade reflections",
                    "Review weekly journal insights"
                ],
                timeline="1-2 weeks",
                success_metrics=["Daily journal entries", "Improved emotional awareness"],
                resources_needed=["5-10 minutes daily", "Consistency commitment"]
            ))
        
        confidence_score = 0.8 if trading_data.get('total_trades', 0) > 10 else 0.6
        
        pass
        
        return ReviewResponse(
            review_period=f"{days_back} days ({request.review_type})",
            executive_summary=f"Review period shows {trading_data.get('total_trades', 0)} trades with {trading_data.get('win_rate', 0):.1%} win rate. Overall performance grade: {overall_grade}. " + (ai_review[:100] + "..." if len(ai_review) > 100 else ai_review),
            overall_grade=overall_grade,
            performance_sections=performance_sections,
            goal_assessments=goal_assessments,
            key_strengths=[
                "Consistent trading activity" if trading_data.get('total_trades', 0) > 10 else "Getting started with trading",
                "Self-reflection habits" if data.get('journal', {}).get('total_entries', 0) > 5 else "Building awareness"
            ],
            improvement_areas=[
                "Strategy optimization" if trading_data.get('win_rate', 0) < 0.5 else "Maintain current approach",
                "Behavioral tracking" if data.get('journal', {}).get('entries_per_week', 0) < 3 else "Continue good habits"
            ],
            strategic_recommendations=recommendations,
            next_period_objectives=[
                "Improve trading consistency",
                "Enhance self-awareness through journaling",
                "Maintain disciplined approach"
            ],
            confidence_score=confidence_score,
            review_date=datetime.now().isoformat()
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Error generating review: {str(e)}")

@router.post("/weekly")
async def generate_weekly_review(request: WeeklyReviewRequest, user: AuthorizedUser) -> WeeklyReviewResponse:
    """Generate focused weekly review"""
    user_id = user.sub
    
    try:
        pass
        
        # Get week's data
        data = get_comprehensive_data(user_id, 7)
        trading = data.get('trading', {})
        journal = data.get('journal', {})
        
        # Create weekly summary
        if trading.get('total_trades', 0) > 0:
            week_summary = f"This week: {trading.get('total_trades', 0)} trades, {trading.get('win_rate', 0):.1%} win rate, ${trading.get('total_pnl', 0):,.2f} P&L"
        else:
            week_summary = "This week focused on preparation and analysis with no trades executed"
        
        # Generate highlights
        trading_highlights = []
        if trading.get('total_pnl', 0) > 0:
            trading_highlights.append(f"Profitable week with ${trading.get('total_pnl', 0):,.2f} P&L")
        if trading.get('win_rate', 0) > 0.6:
            trading_highlights.append(f"Strong win rate of {trading.get('win_rate', 0):.1%}")
        if trading.get('best_trade', 0) > 0:
            trading_highlights.append(f"Best trade: ${trading.get('best_trade', 0):,.2f}")
        
        if not trading_highlights:
            trading_highlights = ["Building trading foundation and discipline"]
        
        key_learnings = [
            "Market observation and pattern recognition",
            "Risk management discipline",
            "Emotional regulation during trading"
        ]
        
        challenges_faced = []
        if trading.get('win_rate', 0) < 0.5:
            challenges_faced.append("Trade selection and timing")
        if trading.get('worst_trade', 0) < -100:
            challenges_faced.append("Risk management on losing trades")
        if journal.get('total_entries', 0) < 3:
            challenges_faced.append("Consistency in self-reflection")
        
        if not challenges_faced:
            challenges_faced = ["Maintaining consistency across all areas"]
        
        return WeeklyReviewResponse(
            week_summary=week_summary,
            trading_highlights=trading_highlights,
            key_learnings=key_learnings,
            challenges_faced=challenges_faced,
            quick_wins_achieved=[
                "Maintained trading discipline",
                "Continued platform engagement"
            ],
            areas_for_next_week=[
                "Focus on trade quality over quantity",
                "Maintain journal consistency",
                "Review and adjust strategy as needed"
            ],
            action_items=[
                "Set specific goals for next week",
                "Review this week's trades for patterns",
                "Plan trading schedule for upcoming week"
            ],
            motivational_note="Every week is an opportunity to improve and grow as a trader. Focus on consistency and continuous learning!"
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Error generating weekly review: {str(e)}")

@router.post("/monthly")
async def generate_monthly_review(request: MonthlyReviewRequest, user: AuthorizedUser) -> MonthlyReviewResponse:
    """Generate comprehensive monthly review"""
    user_id = user.sub
    
    try:
        pass
        
        # Get month's data
        data = get_comprehensive_data(user_id, 30)
        trading = data.get('trading', {})
        journal = data.get('journal', {})
        habits = data.get('habits', {})
        
        # Calculate monthly grade
        monthly_grade = calculate_performance_grade(trading, journal, habits)
        
        # Create performance overview
        performance_overview = {
            "total_trades": trading.get('total_trades', 0),
            "win_rate": trading.get('win_rate', 0),
            "total_pnl": trading.get('total_pnl', 0),
            "profit_factor": trading.get('profit_factor', 0),
            "journal_entries": journal.get('total_entries', 0),
            "habit_consistency": sum(h.get('completion_rate', 0) for h in habits.values()) / len(habits) if habits else 0,
            "grade": monthly_grade
        }
        
        # Goal progress
        goal_progress = [
            GoalAssessment(
                goal="Improve trading consistency",
                status="in_progress",
                progress_percentage=0.7 if trading.get('total_trades', 0) > 15 else 0.4,
                assessment="Good progress on trading activity and discipline",
                next_steps=["Continue current approach", "Focus on quality trades"]
            )
        ]
        
        # Strategic insights
        strategic_insights = [
            f"Monthly win rate of {trading.get('win_rate', 0):.1%} {'exceeds' if trading.get('win_rate', 0) > 0.5 else 'needs improvement from'} target",
            f"Journal consistency at {journal.get('entries_per_week', 0):.1f} entries per week",
            "Building strong foundation for long-term success"
        ]
        
        # Improvement plan
        improvement_plan = []
        if trading.get('win_rate', 0) < 0.5:
            improvement_plan.append("Focus on trade selection improvement")
        if journal.get('entries_per_week', 0) < 3:
            improvement_plan.append("Increase journaling consistency")
        if not habits:
            improvement_plan.append("Implement habit tracking system")
        
        if not improvement_plan:
            improvement_plan = ["Continue current successful approach"]
        
        return MonthlyReviewResponse(
            monthly_summary=f"Monthly performance: {trading.get('total_trades', 0)} trades, {trading.get('win_rate', 0):.1%} win rate, ${trading.get('total_pnl', 0):,.2f} P&L. Grade: {monthly_grade}",
            performance_overview=performance_overview,
            goal_progress=goal_progress,
            strategic_insights=strategic_insights,
            monthly_grade=monthly_grade,
            improvement_plan=improvement_plan,
            next_month_focus=[
                "Maintain trading discipline",
                "Enhance analytical skills",
                "Build consistent habits"
            ],
            quarterly_outlook="Building strong foundation for consistent profitability" if request.include_quarterly_outlook else None
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Error generating monthly review: {str(e)}")

pass
