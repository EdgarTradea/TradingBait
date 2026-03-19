from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from openai import OpenAI
import json
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from datetime import datetime, timedelta
from app.auth import AuthorizedUser
import os

router = APIRouter(prefix="/suggestions")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# ============================================================================
# SUGGESTIONS - CONSOLIDATED AI ENDPOINT
# ============================================================================

# Consolidated system prompt for suggestions
SUGGESTIONS_SYSTEM_PROMPT = """
You are an expert platform optimization and personalization specialist focused on:

**Core Expertise:**
- Platform feature optimization and workflow efficiency
- Personalized user experience recommendations
- Context-aware suggestion generation
- Trading workflow optimization
- Feature discovery and usage optimization
- Performance-based personalization

**Analysis Focus:**
- Analyze user behavior patterns to suggest optimal features
- Recommend workflow improvements and automation opportunities
- Provide context-aware feature suggestions based on current activity
- Suggest personalized learning paths and skill development
- Optimize platform usage for maximum trading performance

**Communication Style:**
- Provide specific, actionable recommendations
- Focus on immediate value and practical implementation
- Explain the reasoning behind each suggestion
- Prioritize suggestions by impact and ease of implementation
- Use clear, non-technical language for platform guidance

**Output Format:**
- Structure suggestions by category (Immediate, Short-term, Long-term)
- Include specific implementation steps for each suggestion
- Provide expected benefits and success metrics
- Rank suggestions by priority and impact level
- Connect suggestions to user's specific context and goals

Your goal is to maximize user success through intelligent, personalized platform optimization recommendations.
"""

class SuggestionRequest(BaseModel):
    context: Optional[str] = "general"  # general, trading, analytics, journal, habits
    current_activity: Optional[str] = None
    user_goals: Optional[List[str]] = None
    time_available: Optional[str] = None  # "5min", "30min", "1hour", etc.
    experience_level: Optional[str] = "intermediate"  # beginner, intermediate, advanced
    focus_areas: Optional[List[str]] = None

class Suggestion(BaseModel):
    id: str
    title: str
    description: str
    category: str  # feature, workflow, optimization, learning
    priority: str  # high, medium, low
    impact_level: str  # high, medium, low
    time_to_implement: str
    implementation_steps: List[str]
    expected_benefits: List[str]
    success_metrics: List[str]
    related_features: List[str]
    context_relevance: float  # 0-1

class PersonalizationInsight(BaseModel):
    insight_type: str
    description: str
    recommendation: str
    confidence_level: str
    supporting_data: Dict[str, Any]

class WorkflowOptimization(BaseModel):
    workflow_name: str
    current_efficiency: float  # 0-1
    optimization_potential: float  # 0-1
    suggested_improvements: List[str]
    automation_opportunities: List[str]
    time_savings_estimate: str

class SuggestionResponse(BaseModel):
    suggestions: List[Suggestion]
    personalization_insights: List[PersonalizationInsight]
    workflow_optimizations: List[WorkflowOptimization]
    quick_wins: List[str]  # 5-minute improvements
    learning_recommendations: List[str]
    next_steps: List[str]
    confidence_score: float

class FeatureRecommendationRequest(BaseModel):
    current_page: str
    user_activity_history: Optional[Dict[str, Any]] = None
    performance_data: Optional[Dict[str, Any]] = None
    usage_patterns: Optional[Dict[str, Any]] = None

class FeatureRecommendationResponse(BaseModel):
    recommended_features: List[str]
    feature_explanations: Dict[str, str]
    usage_tips: Dict[str, List[str]]
    priority_order: List[str]
    onboarding_suggestions: List[str]

class OptimizationRequest(BaseModel):
    optimization_type: str  # performance, workflow, habits, features
    current_metrics: Optional[Dict[str, Any]] = None
    target_improvements: Optional[List[str]] = None
    constraints: Optional[List[str]] = None

class OptimizationResponse(BaseModel):
    optimization_plan: Dict[str, Any]
    priority_actions: List[str]
    quick_improvements: List[str]
    long_term_strategies: List[str]
    measurement_plan: List[str]
    expected_timeline: str

# ============================================================================
# DATA AGGREGATION HELPERS
# ============================================================================

def get_user_activity_data(user_id: str, days_back: int = 30) -> Dict[str, Any]:
    """Get user activity and usage patterns"""
    try:
        # This would typically come from analytics/usage tracking
        # For now, simulate based on available data
        
        db_firestore = firestore.client()
        
        # Trades
        trades_data = []
        evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations").stream()
        for eval_doc in evaluations_ref:
            eval_id = eval_doc.id
            trades_ref = db_firestore.collection(f"users/{user_id}/evaluations/{eval_id}/trades").stream()
            trades_data.extend([t.to_dict() for t in trades_ref])
            
        # Journal and Habits
        journal_ref = db_firestore.collection(f"journal_entries/{user_id}/entries").stream()
        journal_data = [j.to_dict() for j in journal_ref]
        habits_data = [j.get('habits') for j in journal_data if j.get('habits')]
        
        # Calculate usage patterns
        recent_cutoff = datetime.now() - timedelta(days=days_back)
        
        recent_trades = [t for t in trades_data if datetime.fromisoformat(t.get('created_at', '2024-01-01')) >= recent_cutoff]
        recent_journal = [j for j in journal_data if datetime.fromisoformat(j.get('created_at', '2024-01-01')) >= recent_cutoff]
        
        return {
            "total_trades": len(trades_data),
            "recent_trades": len(recent_trades),
            "total_journal_entries": len(journal_data),
            "recent_journal_entries": len(recent_journal),
            "total_habits": len(habits_data),
            "active_features": [
                "trading" if trades_data else None,
                "journaling" if journal_data else None,
                "habits" if habits_data else None
            ],
            "engagement_level": "high" if (len(recent_trades) + len(recent_journal)) > 10 else "medium" if (len(recent_trades) + len(recent_journal)) > 3 else "low",
            "primary_usage": "trading" if len(trades_data) > len(journal_data) else "journaling"
        }
        
    except Exception as e:
        pass
        return {
            "total_trades": 0,
            "recent_trades": 0,
            "total_journal_entries": 0,
            "recent_journal_entries": 0,
            "total_habits": 0,
            "active_features": [],
            "engagement_level": "low",
            "primary_usage": "unknown"
        }

def get_performance_context(user_id: str, days_back: int = 30) -> Dict[str, Any]:
    """Get performance context for suggestions"""
    try:
        db_firestore = firestore.client()
        all_trades = []
        evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations").stream()
        for eval_doc in evaluations_ref:
            eval_id = eval_doc.id
            trades_ref = db_firestore.collection(f"users/{user_id}/evaluations/{eval_id}/trades").stream()
            all_trades.extend([t.to_dict() for t in trades_ref])
        
        if not all_trades:
            return {"status": "no_data", "suggestions_focus": "getting_started"}
        
        # Calculate recent performance
        recent_cutoff = datetime.now() - timedelta(days=days_back)
        recent_trades = [t for t in all_trades if datetime.fromisoformat(t.get('created_at', '2024-01-01')) >= recent_cutoff]
        
        if not recent_trades:
            return {"status": "inactive", "suggestions_focus": "re_engagement"}
        
        # Calculate metrics
        total_pnl = sum(float(t.get('pnl', 0)) for t in recent_trades)
        winning_trades = [t for t in recent_trades if float(t.get('pnl', 0)) > 0]
        win_rate = len(winning_trades) / len(recent_trades)
        
        # Determine focus areas
        focus_areas = []
        if win_rate < 0.4:
            focus_areas.append("strategy_improvement")
        if len(recent_trades) < 5:
            focus_areas.append("activity_increase")
        if total_pnl < 0:
            focus_areas.append("risk_management")
        
        return {
            "status": "active",
            "total_trades": len(recent_trades),
            "win_rate": win_rate,
            "total_pnl": total_pnl,
            "performance_level": "good" if win_rate > 0.6 and total_pnl > 0 else "needs_improvement",
            "suggestions_focus": focus_areas[0] if focus_areas else "optimization"
        }
        
    except Exception as e:
        pass
        return {"status": "error", "suggestions_focus": "general"}

def create_suggestion_prompt(activity_data: Dict, performance_data: Dict, request: SuggestionRequest) -> str:
    """Create contextual suggestion prompt"""
    
    base_prompt = f"""
Personalized Suggestion Request

**Context:** {request.context}
**Current Activity:** {request.current_activity or 'General platform usage'}
**User Goals:** {', '.join(request.user_goals) if request.user_goals else 'Not specified'}
**Time Available:** {request.time_available or 'Flexible'}
**Experience Level:** {request.experience_level}
**Focus Areas:** {', '.join(request.focus_areas) if request.focus_areas else 'General improvement'}

**User Activity Summary:**
- Total Trades: {activity_data.get('total_trades', 0)}
- Recent Trades: {activity_data.get('recent_trades', 0)}
- Journal Entries: {activity_data.get('total_journal_entries', 0)}
- Engagement Level: {activity_data.get('engagement_level', 'unknown')}
- Primary Usage: {activity_data.get('primary_usage', 'unknown')}

**Performance Context:**
- Status: {performance_data.get('status', 'unknown')}
- Performance Level: {performance_data.get('performance_level', 'unknown')}
- Win Rate: {performance_data.get('win_rate', 0):.1%}
- Focus Area: {performance_data.get('suggestions_focus', 'general')}
"""
    
    if request.context == "trading":
        return base_prompt + """

Provide trading-focused suggestions including:
1. Feature recommendations to improve trading workflow
2. Analysis tools and performance tracking suggestions
3. Risk management and position sizing optimizations
4. Trading psychology and discipline improvements
5. Automation and efficiency enhancements

Prioritize by immediate impact and ease of implementation.
"""
    
    elif request.context == "analytics":
        return base_prompt + """

Provide analytics-focused suggestions including:
1. Data analysis features and reporting optimizations
2. Performance metric tracking improvements
3. Visualization and insight generation tools
4. Correlation analysis and pattern recognition
5. Benchmarking and goal-setting features

Focus on data-driven decision making improvements.
"""
    
    elif request.context == "journal":
        return base_prompt + """

Provide journaling-focused suggestions including:
1. Journal entry optimization and consistency
2. Reflection techniques and prompts
3. Emotional tracking and analysis features
4. Integration with trading performance data
5. Habit formation and tracking improvements

Focus on self-awareness and psychological development.
"""
    
    else:  # general
        return base_prompt + """

Provide comprehensive platform optimization suggestions including:
1. Feature discovery and usage optimization
2. Workflow efficiency improvements
3. Personalization and customization opportunities
4. Learning and skill development recommendations
5. Integration and automation possibilities

Balance immediate wins with long-term optimization strategies.
"""

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/health")
async def suggestions_health_check():
    """Health check for suggestions API"""
    return {
        "status": "healthy",
        "service": "suggestions",
        "timestamp": datetime.now().isoformat(),
        "features": [
            "context_aware_recommendations",
            "workflow_optimization",
            "feature_discovery",
            "personalization_insights",
            "quick_wins_identification",
            "learning_path_suggestions"
        ]
    }

@router.post("/recommend")
async def get_personalized_suggestions(request: SuggestionRequest, user: AuthorizedUser) -> SuggestionResponse:
    """Get personalized suggestions based on context and user data"""
    user_id = user.sub
    
    try:
        pass
        
        # Get user data
        activity_data = get_user_activity_data(user_id, 30)
        performance_data = get_performance_context(user_id, 30)
        
        # Create suggestion prompt
        suggestion_prompt = create_suggestion_prompt(activity_data, performance_data, request)
        
        # Get AI suggestions
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SUGGESTIONS_SYSTEM_PROMPT},
                {"role": "user", "content": suggestion_prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        ai_suggestions = response.choices[0].message.content
        
        # Generate structured suggestions based on context
        suggestions = []
        
        # Context-specific suggestions
        if activity_data.get('recent_trades', 0) < 5:
            suggestions.append(Suggestion(
                id="increase_activity",
                title="Increase Trading Activity",
                description="Your recent trading activity is low. Consider implementing a more consistent trading schedule.",
                category="workflow",
                priority="high",
                impact_level="high",
                time_to_implement="1-2 days",
                implementation_steps=[
                    "Set daily trading time blocks",
                    "Create a pre-market preparation routine",
                    "Use trade alerts for opportunities"
                ],
                expected_benefits=["More trading opportunities", "Better market feel", "Improved consistency"],
                success_metrics=["5+ trades per week", "Daily market engagement"],
                related_features=["Trade alerts", "Market calendar", "Trading journal"],
                context_relevance=0.9
            ))
        
        if activity_data.get('recent_journal_entries', 0) < 3:
            suggestions.append(Suggestion(
                id="improve_journaling",
                title="Enhance Trading Journal Usage",
                description="Regular journaling can significantly improve your trading psychology and performance.",
                category="feature",
                priority="medium",
                impact_level="high",
                time_to_implement="5 minutes daily",
                implementation_steps=[
                    "Write brief daily market observations",
                    "Record emotional state before trading",
                    "Reflect on trade decisions after sessions"
                ],
                expected_benefits=["Better self-awareness", "Improved decision making", "Emotional regulation"],
                success_metrics=["Daily journal entries", "Enhanced trading discipline"],
                related_features=["Trading journal", "Mood tracking", "Performance analysis"],
                context_relevance=0.8
            ))
        
        if performance_data.get('win_rate', 0) < 0.5:
            suggestions.append(Suggestion(
                id="strategy_analysis",
                title="Analyze and Optimize Trading Strategy",
                description="Your win rate suggests room for strategy improvement. Use analytics tools to identify patterns.",
                category="optimization",
                priority="high",
                impact_level="high",
                time_to_implement="30 minutes",
                implementation_steps=[
                    "Review recent trade performance in Analytics",
                    "Identify losing trade patterns",
                    "Adjust strategy based on data insights"
                ],
                expected_benefits=["Higher win rate", "Better risk management", "Improved profitability"],
                success_metrics=["Win rate > 50%", "Reduced average loss"],
                related_features=["Analytics dashboard", "Pattern analysis", "Performance metrics"],
                context_relevance=0.9
            ))
        
        # Personalization insights
        personalization_insights = [
            PersonalizationInsight(
                insight_type="Usage Pattern",
                description=f"You primarily use the platform for {activity_data.get('primary_usage', 'general')} activities",
                recommendation="Focus on optimizing features related to your primary use case",
                confidence_level="High",
                supporting_data=activity_data
            )
        ]
        
        # Workflow optimizations
        workflow_optimizations = [
            WorkflowOptimization(
                workflow_name="Daily Trading Routine",
                current_efficiency=0.6 if activity_data.get('engagement_level') == 'high' else 0.3,
                optimization_potential=0.8,
                suggested_improvements=[
                    "Standardize pre-market preparation",
                    "Use automated trade alerts",
                    "Implement post-trade review process"
                ],
                automation_opportunities=[
                    "Automated trade logging",
                    "Performance report generation",
                    "Risk monitoring alerts"
                ],
                time_savings_estimate="15-30 minutes daily"
            )
        ]
        
        # Quick wins
        quick_wins = [
            "Enable trade notifications for better opportunity awareness",
            "Set up daily performance summary dashboard",
            "Create trading checklist for consistency"
        ]
        
        # Learning recommendations
        learning_recommendations = [
            "Review analytics features for better performance insights",
            "Explore habit tracking for trading discipline",
            "Use journal prompts for deeper self-reflection"
        ]
        
        confidence_score = 0.8 if len(suggestions) > 2 else 0.6
        
        pass
        
        return SuggestionResponse(
            suggestions=suggestions,
            personalization_insights=personalization_insights,
            workflow_optimizations=workflow_optimizations,
            quick_wins=quick_wins,
            learning_recommendations=learning_recommendations,
            next_steps=[
                "Implement highest priority suggestion first",
                "Track results and adjust based on outcomes",
                "Review suggestions weekly for updates"
            ],
            confidence_score=confidence_score
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Error generating suggestions: {str(e)}")

@router.post("/features")
async def recommend_features(request: FeatureRecommendationRequest, user: AuthorizedUser) -> FeatureRecommendationResponse:
    """Recommend specific features based on current context"""
    user_id = user.sub
    
    try:
        pass
        
        # Get user activity data
        activity_data = get_user_activity_data(user_id, 30)
        
        # Page-specific feature recommendations
        page_features = {
            "dashboard": ["Performance widgets", "Quick trade entry", "Market overview", "Daily goals tracker"],
            "trades": ["Trade grouping", "Bulk operations", "Advanced filters", "Export tools"],
            "analytics": ["Custom reports", "Correlation analysis", "Benchmark comparisons", "Trend analysis"],
            "journal": ["Mood tracking", "Trade correlation", "Reflection prompts", "Progress tracking"],
            "habits": ["Streak tracking", "Performance correlation", "Reminder system", "Goal setting"]
        }
        
        current_page = request.current_page.lower()
        recommended_features = page_features.get(current_page, ["Data export", "Customization", "Analytics"])
        
        # Create explanations
        feature_explanations = {
            feature: f"This feature helps optimize your {current_page} experience and improves efficiency"
            for feature in recommended_features
        }
        
        # Usage tips
        usage_tips = {
            feature: [f"Start with basic {feature.lower()} functionality", f"Customize {feature.lower()} to your workflow", f"Review {feature.lower()} effectiveness weekly"]
            for feature in recommended_features
        }
        
        # Priority based on user activity
        priority_order = recommended_features.copy()
        if activity_data.get('primary_usage') == 'trading':
            priority_order = [f for f in priority_order if 'trade' in f.lower()] + [f for f in priority_order if 'trade' not in f.lower()]
        
        return FeatureRecommendationResponse(
            recommended_features=recommended_features,
            feature_explanations=feature_explanations,
            usage_tips=usage_tips,
            priority_order=priority_order,
            onboarding_suggestions=[
                f"Start with the most relevant {current_page} features",
                "Gradually explore advanced functionality",
                "Track which features provide the most value"
            ]
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Error recommending features: {str(e)}")

@router.post("/optimize")
async def get_optimization_suggestions(request: OptimizationRequest, user: AuthorizedUser) -> OptimizationResponse:
    """Get specific optimization recommendations"""
    user_id = user.sub
    
    try:
        pass
        
        # Get relevant data
        activity_data = get_user_activity_data(user_id, 30)
        performance_data = get_performance_context(user_id, 30)
        
        # Create optimization plan based on type
        if request.optimization_type == "performance":
            optimization_plan = {
                "focus": "Trading performance improvement",
                "approach": "Data-driven strategy optimization",
                "timeline": "2-4 weeks",
                "key_metrics": ["Win rate", "Profit factor", "Risk-reward ratio"]
            }
            priority_actions = [
                "Analyze losing trades for patterns",
                "Implement stricter risk management",
                "Optimize entry and exit criteria"
            ]
            
        elif request.optimization_type == "workflow":
            optimization_plan = {
                "focus": "Platform usage efficiency",
                "approach": "Workflow automation and standardization",
                "timeline": "1-2 weeks",
                "key_metrics": ["Time saved", "Error reduction", "Consistency score"]
            }
            priority_actions = [
                "Standardize daily trading routine",
                "Set up automated alerts and notifications",
                "Create trading checklists and templates"
            ]
            
        else:  # general optimization
            optimization_plan = {
                "focus": "Overall platform optimization",
                "approach": "Holistic improvement strategy",
                "timeline": "3-6 weeks",
                "key_metrics": ["Overall satisfaction", "Feature utilization", "Goal achievement"]
            }
            priority_actions = [
                "Complete feature utilization audit",
                "Optimize most-used workflows",
                "Implement tracking and measurement systems"
            ]
        
        quick_improvements = [
            "Enable all relevant notifications",
            "Customize dashboard for your workflow",
            "Set up basic performance tracking"
        ]
        
        long_term_strategies = [
            "Develop comprehensive trading system",
            "Build consistent data analysis habits",
            "Create performance review routine"
        ]
        
        measurement_plan = [
            "Track key metrics weekly",
            "Review optimization progress monthly",
            "Adjust strategies based on results"
        ]
        
        return OptimizationResponse(
            optimization_plan=optimization_plan,
            priority_actions=priority_actions,
            quick_improvements=quick_improvements,
            long_term_strategies=long_term_strategies,
            measurement_plan=measurement_plan,
            expected_timeline=optimization_plan["timeline"]
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Error creating optimization plan: {str(e)}")

pass
