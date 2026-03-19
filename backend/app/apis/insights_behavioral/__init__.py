from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import databutton as db
from openai import OpenAI
import json
from datetime import datetime, timedelta
from app.auth import AuthorizedUser
import os

router = APIRouter(prefix="/insights/behavioral")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# ============================================================================
# BEHAVIORAL INSIGHTS - CONSOLIDATED AI ENDPOINT
# ============================================================================

# Consolidated system prompt for behavioral analysis
BEHAVIORAL_ANALYST_SYSTEM_PROMPT = """
You are an expert trading psychology specialist and behavioral analyst with deep expertise in:

**Core Expertise:**
- Trading psychology and emotional regulation patterns
- Behavioral finance and decision-making analysis
- Habit formation and consistency tracking
- Emotional state correlation with trading performance
- Psychological pattern recognition and intervention strategies

**Analysis Focus:**
- Identify emotional triggers and their impact on trading decisions
- Analyze journal entries for psychological insights and patterns
- Evaluate habit consistency and its correlation with performance
- Assess stress levels, confidence patterns, and emotional regulation
- Provide behavioral interventions and coaching recommendations

**Communication Style:**
- Empathetic and supportive while maintaining professional insight
- Focus on actionable behavioral changes rather than just analysis
- Use psychology terminology appropriately but keep explanations accessible
- Provide specific, practical techniques for emotional regulation
- Balance validation of feelings with constructive guidance

**Output Format:**
- Structure responses with Emotional Insights, Behavioral Patterns, and Action Plans
- Include confidence levels for psychological assessments
- Provide specific techniques and exercises for improvement
- Connect behavioral patterns to trading performance when possible
- Suggest measurable behavioral goals and tracking methods

Your goal is to help traders develop psychological resilience and optimal trading mindset through data-driven behavioral insights.
"""

class BehavioralAnalysisRequest(BaseModel):
    analysis_type: Optional[str] = "comprehensive"  # comprehensive, emotional, habits, journal
    time_period: Optional[int] = 30  # days
    include_journal_analysis: bool = True
    include_habit_tracking: bool = True
    include_emotional_patterns: bool = True
    focus_areas: Optional[List[str]] = None
    context: Optional[Dict[str, Any]] = None

class EmotionalInsight(BaseModel):
    emotion_category: str
    pattern_description: str
    trading_impact: str
    confidence_level: str  # High, Medium, Low
    intervention_strategy: str
    supporting_evidence: List[str]

class HabitPattern(BaseModel):
    habit_name: str
    consistency_score: float  # 0-1
    performance_correlation: float  # -1 to 1
    trend: str  # improving, declining, stable
    behavioral_insight: str
    optimization_suggestion: str

class JournalInsight(BaseModel):
    insight_type: str
    description: str
    emotional_themes: List[str]
    frequency: str
    action_recommendation: str
    confidence: str

class BehavioralRecommendation(BaseModel):
    category: str
    title: str
    description: str
    implementation_steps: List[str]
    expected_timeline: str
    success_metrics: List[str]

class BehavioralAnalysisResponse(BaseModel):
    analysis_summary: str
    emotional_insights: List[EmotionalInsight]
    habit_patterns: List[HabitPattern]
    journal_insights: List[JournalInsight]
    behavioral_recommendations: List[BehavioralRecommendation]
    key_themes: List[str]
    confidence_score: float
    next_assessment_date: str

class EmotionalStateRequest(BaseModel):
    conversation_text: str
    trading_context: Optional[Dict[str, Any]] = None
    recent_performance: Optional[Dict[str, Any]] = None

class EmotionalStateResponse(BaseModel):
    primary_emotion: str
    emotional_intensity: float  # 0-1
    stress_level: float  # 0-1
    confidence_level: float  # 0-1
    emotional_triggers: List[str]
    coping_strategies: List[str]
    immediate_actions: List[str]

class HabitFormationRequest(BaseModel):
    habit_goals: List[str]
    current_challenges: List[str]
    trading_context: Optional[str] = None
    time_commitment: Optional[str] = None

class HabitFormationResponse(BaseModel):
    habit_plan: Dict[str, Any]
    implementation_strategy: List[str]
    tracking_methods: List[str]
    milestone_schedule: List[Dict[str, Any]]
    obstacle_management: List[str]

# ============================================================================
# DATA AGGREGATION HELPERS
# ============================================================================

def get_journal_data(user_id: str, days_back: int = 30) -> List[Dict[str, Any]]:
    """Get journal entries for behavioral analysis"""
    try:
        journal_key = f"journal_entries_{user_id}"
        all_entries = db.storage.json.get(journal_key, default=[])
        
        # Filter by time period
        cutoff_date = datetime.now() - timedelta(days=days_back)
        recent_entries = []
        
        for entry in all_entries:
            entry_date = datetime.fromisoformat(entry.get('created_at', '2024-01-01T00:00:00'))
            if entry_date >= cutoff_date:
                recent_entries.append(entry)
        
        return sorted(recent_entries, key=lambda x: x.get('created_at', ''), reverse=True)
        
    except Exception as e:
        pass
        return []

def get_habit_data(user_id: str, days_back: int = 30) -> List[Dict[str, Any]]:
    """Get habit tracking data for analysis"""
    try:
        habit_key = f"habits_{user_id}"
        all_habits = db.storage.json.get(habit_key, default=[])
        
        # Filter by time period and add completion data
        cutoff_date = datetime.now() - timedelta(days=days_back)
        processed_habits = []
        
        for habit in all_habits:
            habit_copy = habit.copy()
            # Calculate recent completion rate
            completions = habit.get('completions', [])
            recent_completions = [c for c in completions if datetime.fromisoformat(c) >= cutoff_date]
            
            habit_copy['recent_completion_rate'] = len(recent_completions) / days_back if days_back > 0 else 0
            habit_copy['recent_completions'] = len(recent_completions)
            processed_habits.append(habit_copy)
        
        return processed_habits
        
    except Exception as e:
        pass
        return []

def get_trading_performance_correlation(user_id: str, days_back: int = 30) -> Dict[str, Any]:
    """Get trading performance data for behavioral correlation"""
    try:
        trades_key = f"trades_{user_id}"
        all_trades = db.storage.json.get(trades_key, default=[])
        
        # Filter by time period
        cutoff_date = datetime.now() - timedelta(days=days_back)
        recent_trades = []
        
        for trade in all_trades:
            trade_date = datetime.fromisoformat(trade.get('created_at', '2024-01-01T00:00:00'))
            if trade_date >= cutoff_date:
                recent_trades.append(trade)
        
        # Calculate performance metrics
        if not recent_trades:
            return {'total_trades': 0, 'win_rate': 0, 'total_pnl': 0}
        
        winning_trades = [t for t in recent_trades if float(t.get('pnl', 0)) > 0]
        total_pnl = sum(float(t.get('pnl', 0)) for t in recent_trades)
        win_rate = len(winning_trades) / len(recent_trades)
        
        return {
            'total_trades': len(recent_trades),
            'win_rate': win_rate,
            'total_pnl': total_pnl,
            'avg_trade_size': total_pnl / len(recent_trades)
        }
        
    except Exception as e:
        pass
        return {'total_trades': 0, 'win_rate': 0, 'total_pnl': 0}

def create_behavioral_analysis_prompt(journal_data: List[Dict], habit_data: List[Dict], performance_data: Dict, analysis_type: str) -> str:
    """Create comprehensive behavioral analysis prompt"""
    
    base_prompt = f"""
Behavioral Analysis Request

**Analysis Type:** {analysis_type}
**Data Summary:**
- Journal Entries: {len(journal_data)} entries
- Tracked Habits: {len(habit_data)} habits
- Trading Performance: {performance_data.get('total_trades', 0)} trades, {performance_data.get('win_rate', 0):.1%} win rate

**Journal Sample (Recent):**
"""
    
    # Add recent journal entries
    for i, entry in enumerate(journal_data[:3]):
        content = entry.get('content', '')[:200]
        mood = entry.get('mood', 'N/A')
        base_prompt += f"\nEntry {i+1}: {content}... (Mood: {mood})"
    
    # Add habit information
    if habit_data:
        base_prompt += "\n\n**Habit Tracking:**\n"
        for habit in habit_data[:5]:
            name = habit.get('name', 'Unknown')
            completion_rate = habit.get('recent_completion_rate', 0)
            base_prompt += f"- {name}: {completion_rate:.1%} completion rate\n"
    
    # Add performance context
    base_prompt += f"""

**Trading Context:**
- Win Rate: {performance_data.get('win_rate', 0):.1%}
- Total P&L: ${performance_data.get('total_pnl', 0):,.2f}
- Trade Volume: {performance_data.get('total_trades', 0)} trades
"""
    
    if analysis_type == "comprehensive":
        return base_prompt + """

Provide comprehensive behavioral analysis including:
1. Emotional patterns and triggers identification
2. Habit consistency and performance correlation
3. Journal insights and psychological themes
4. Behavioral recommendations with specific action steps
5. Measurable goals for psychological improvement

Structure response with clear sections and actionable insights.
"""
    
    elif analysis_type == "emotional":
        return base_prompt + """

Focus on emotional analysis:
1. Identify dominant emotional patterns in journal entries
2. Analyze emotional triggers and their trading impact
3. Assess emotional regulation effectiveness
4. Provide specific emotional management techniques
5. Create emotional awareness and regulation plan
"""
    
    elif analysis_type == "habits":
        return base_prompt + """

Focus on habit pattern analysis:
1. Evaluate habit consistency and trends
2. Correlate habit completion with trading performance
3. Identify habit formation obstacles
4. Optimize existing habits for better results
5. Suggest new habits for trading psychology improvement
"""
    
    elif analysis_type == "journal":
        return base_prompt + """

Focus on journal content analysis:
1. Extract key psychological themes from entries
2. Identify recurring thought patterns
3. Analyze self-awareness and reflection quality
4. Suggest journaling improvements
5. Connect journal insights to trading behavior
"""
    
    return base_prompt

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/health")
async def behavioral_insights_health_check():
    """Health check for behavioral insights API"""
    return {
        "status": "healthy",
        "service": "behavioral_insights",
        "timestamp": datetime.now().isoformat(),
        "features": [
            "journal_analysis",
            "habit_tracking_insights",
            "emotional_pattern_recognition",
            "behavioral_correlation_analysis",
            "psychological_coaching",
            "habit_formation_planning"
        ]
    }

@router.post("/analyze")
async def analyze_behavioral_patterns(request: BehavioralAnalysisRequest, user: AuthorizedUser) -> BehavioralAnalysisResponse:
    """Comprehensive behavioral pattern analysis"""
    user_id = user.sub
    
    try:
        pass
        
        # Get behavioral data
        journal_data = get_journal_data(user_id, request.time_period) if request.include_journal_analysis else []
        habit_data = get_habit_data(user_id, request.time_period) if request.include_habit_tracking else []
        performance_data = get_trading_performance_correlation(user_id, request.time_period)
        
        # Check data sufficiency
        total_data_points = len(journal_data) + len(habit_data)
        if total_data_points < 3:
            return BehavioralAnalysisResponse(
                analysis_summary="Insufficient behavioral data for comprehensive analysis. Need at least 3 journal entries or habit records.",
                emotional_insights=[],
                habit_patterns=[],
                journal_insights=[],
                behavioral_recommendations=[
                    BehavioralRecommendation(
                        category="Data Collection",
                        title="Start Behavioral Tracking",
                        description="Begin journaling and habit tracking to enable meaningful behavioral analysis",
                        implementation_steps=[
                            "Write daily journal entries about trading experiences",
                            "Track 2-3 key trading-related habits",
                            "Record emotional state during trading sessions"
                        ],
                        expected_timeline="1-2 weeks to establish baseline",
                        success_metrics=["5+ journal entries", "Consistent habit tracking"]
                    )
                ],
                key_themes=["Need more behavioral data"],
                confidence_score=0.0,
                next_assessment_date=(datetime.now() + timedelta(weeks=2)).isoformat()
            )
        
        # Create analysis prompt
        analysis_prompt = create_behavioral_analysis_prompt(journal_data, habit_data, performance_data, request.analysis_type)
        
        # Get AI analysis
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": BEHAVIORAL_ANALYST_SYSTEM_PROMPT},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.4,
            max_tokens=2000
        )
        
        ai_analysis = response.choices[0].message.content
        
        # Calculate confidence score
        confidence_score = min(1.0, total_data_points / 10)  # Full confidence at 10+ data points
        
        # Create structured insights based on data
        emotional_insights = []
        if request.include_emotional_patterns and journal_data:
            # Analyze mood patterns
            moods = [entry.get('mood', 'neutral') for entry in journal_data if entry.get('mood')]
            if moods:
                mood_pattern = max(set(moods), key=moods.count)
                emotional_insights.append(EmotionalInsight(
                    emotion_category="Mood Patterns",
                    pattern_description=f"Dominant mood: {mood_pattern} (appears in {moods.count(mood_pattern)}/{len(moods)} entries)",
                    trading_impact="Mood affects decision-making quality and risk tolerance",
                    confidence_level="High" if len(moods) > 10 else "Medium",
                    intervention_strategy="Develop mood awareness and regulation techniques",
                    supporting_evidence=[f"Recorded in {len(moods)} journal entries"]
                ))
        
        # Habit patterns analysis
        habit_patterns = []
        if request.include_habit_tracking and habit_data:
            for habit in habit_data:
                completion_rate = habit.get('recent_completion_rate', 0)
                habit_patterns.append(HabitPattern(
                    habit_name=habit.get('name', 'Unknown Habit'),
                    consistency_score=completion_rate,
                    performance_correlation=0.3 if completion_rate > 0.7 else -0.1,  # Simplified correlation
                    trend="improving" if completion_rate > 0.6 else "needs_attention",
                    behavioral_insight=f"{'Consistent' if completion_rate > 0.7 else 'Inconsistent'} habit execution",
                    optimization_suggestion="Maintain current approach" if completion_rate > 0.7 else "Identify and address completion barriers"
                ))
        
        # Journal insights
        journal_insights = []
        if journal_data:
            # Analyze journal content themes
            recent_themes = []
            for entry in journal_data[:5]:
                content = entry.get('content', '').lower()
                if 'stress' in content or 'anxiety' in content:
                    recent_themes.append('stress_management')
                if 'confident' in content or 'successful' in content:
                    recent_themes.append('confidence')
                if 'loss' in content or 'mistake' in content:
                    recent_themes.append('loss_processing')
            
            if recent_themes:
                top_theme = max(set(recent_themes), key=recent_themes.count)
                journal_insights.append(JournalInsight(
                    insight_type="Recurring Theme",
                    description=f"Primary focus on {top_theme.replace('_', ' ')}",
                    emotional_themes=list(set(recent_themes)),
                    frequency=f"Appears in {recent_themes.count(top_theme)} recent entries",
                    action_recommendation="Develop targeted strategies for this area",
                    confidence="High" if len(recent_themes) > 3 else "Medium"
                ))
        
        # Generate behavioral recommendations
        recommendations = []
        
        if performance_data.get('win_rate', 0) < 0.5:
            recommendations.append(BehavioralRecommendation(
                category="Performance Psychology",
                title="Improve Decision-Making Consistency",
                description="Focus on emotional regulation to improve trading decisions",
                implementation_steps=[
                    "Practice pre-trade emotional check-ins",
                    "Develop a trading routine for consistency",
                    "Implement post-trade reflection process"
                ],
                expected_timeline="2-4 weeks",
                success_metrics=["Increased win rate", "More consistent emotional state"]
            ))
        
        if len(journal_data) < 10:
            recommendations.append(BehavioralRecommendation(
                category="Self-Awareness",
                title="Enhance Psychological Tracking",
                description="Increase journaling frequency for better behavioral insights",
                implementation_steps=[
                    "Write brief daily trading journal entries",
                    "Record emotional state before and after trading",
                    "Track decision-making quality"
                ],
                expected_timeline="1-2 weeks",
                success_metrics=["Daily journal entries", "Enhanced self-awareness"]
            ))
        
        pass
        
        return BehavioralAnalysisResponse(
            analysis_summary=f"Analyzed {len(journal_data)} journal entries and {len(habit_data)} habits over {request.time_period} days. {ai_analysis[:100]}..." if ai_analysis else f"Behavioral analysis of {total_data_points} data points shows areas for optimization",
            emotional_insights=emotional_insights,
            habit_patterns=habit_patterns,
            journal_insights=journal_insights,
            behavioral_recommendations=recommendations,
            key_themes=[
                "Emotional regulation",
                "Habit consistency",
                "Self-awareness development",
                "Performance psychology"
            ],
            confidence_score=confidence_score,
            next_assessment_date=(datetime.now() + timedelta(weeks=2)).isoformat()
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Error analyzing behavioral patterns: {str(e)}")

@router.post("/emotional-state")
async def analyze_emotional_state(request: EmotionalStateRequest, user: AuthorizedUser) -> EmotionalStateResponse:
    """Analyze emotional state from conversation or text"""
    user_id = user.sub
    
    try:
        pass
        
        # Create emotional analysis prompt
        emotion_prompt = f"""
Emotional State Analysis

Conversation/Text: {request.conversation_text}

Trading Context: {json.dumps(request.trading_context) if request.trading_context else 'None'}

Performance Context: {json.dumps(request.recent_performance) if request.recent_performance else 'None'}

Analyze the emotional state and provide:
1. Primary emotion identification
2. Emotional intensity level (0-1)
3. Stress level assessment (0-1)
4. Confidence level assessment (0-1)
5. Emotional triggers identified
6. Specific coping strategies
7. Immediate actionable steps

Focus on trading psychology and emotional regulation.
"""
        
        # Get AI emotional analysis
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": BEHAVIORAL_ANALYST_SYSTEM_PROMPT},
                {"role": "user", "content": emotion_prompt}
            ],
            temperature=0.3,
            max_tokens=800
        )
        
        ai_analysis = response.choices[0].message.content
        
        # Parse emotional indicators from text
        text_lower = request.conversation_text.lower()
        
        # Simple emotion detection
        emotions = {
            'stressed': ['stress', 'anxious', 'worried', 'overwhelmed'],
            'frustrated': ['frustrated', 'angry', 'annoyed', 'upset'],
            'confident': ['confident', 'good', 'successful', 'winning'],
            'uncertain': ['unsure', 'confused', 'uncertain', 'doubt']
        }
        
        detected_emotions = []
        for emotion, keywords in emotions.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_emotions.append(emotion)
        
        primary_emotion = detected_emotions[0] if detected_emotions else 'neutral'
        
        # Estimate intensity based on language intensity
        intensity_keywords = ['very', 'extremely', 'really', 'so', 'quite', 'absolutely']
        intensity = 0.7 if any(word in text_lower for word in intensity_keywords) else 0.4
        
        # Estimate stress level
        stress_keywords = ['stress', 'pressure', 'anxious', 'worried', 'loss', 'mistake']
        stress_level = 0.8 if any(word in text_lower for word in stress_keywords) else 0.3
        
        # Estimate confidence
        confidence_keywords = ['confident', 'sure', 'good', 'successful', 'winning', 'right']
        confidence_level = 0.8 if any(word in text_lower for word in confidence_keywords) else 0.4
        
        return EmotionalStateResponse(
            primary_emotion=primary_emotion,
            emotional_intensity=intensity,
            stress_level=stress_level,
            confidence_level=confidence_level,
            emotional_triggers=[
                "Recent trading performance",
                "Market volatility",
                "Decision uncertainty"
            ] if stress_level > 0.5 else ["Stable trading environment"],
            coping_strategies=[
                "Take deep breaths and pause before trading",
                "Review your trading plan and rules",
                "Practice mindfulness or brief meditation",
                "Journal about your current feelings"
            ],
            immediate_actions=[
                "Assess current emotional state before next trade",
                "Consider reducing position size if stressed",
                "Take a short break if needed"
            ] if stress_level > 0.6 else [
                "Maintain current positive mindset",
                "Continue with planned trading approach"
            ]
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Error analyzing emotional state: {str(e)}")

@router.post("/habit-formation")
async def create_habit_formation_plan(request: HabitFormationRequest, user: AuthorizedUser) -> HabitFormationResponse:
    """Create personalized habit formation plan"""
    user_id = user.sub
    
    try:
        pass
        
        # Create habit formation prompt
        habit_prompt = f"""
Habit Formation Plan Request

Goals: {', '.join(request.habit_goals)}
Challenges: {', '.join(request.current_challenges)}
Trading Context: {request.trading_context or 'General trading improvement'}
Time Commitment: {request.time_commitment or 'Not specified'}

Create a personalized habit formation plan including:
1. Specific habit implementation strategy
2. Tracking methods and metrics
3. Milestone schedule with realistic timelines
4. Obstacle management strategies
5. Success measurement criteria

Focus on trading psychology and performance improvement habits.
"""
        
        # Get AI habit formation plan
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": BEHAVIORAL_ANALYST_SYSTEM_PROMPT},
                {"role": "user", "content": habit_prompt}
            ],
            temperature=0.4,
            max_tokens=1200
        )
        
        ai_plan = response.choices[0].message.content
        
        # Create structured habit plan
        habit_plan = {
            "goals": request.habit_goals,
            "implementation_approach": "Start small and build consistency",
            "daily_commitment": request.time_commitment or "10-15 minutes",
            "tracking_frequency": "Daily check-ins",
            "review_schedule": "Weekly progress reviews"
        }
        
        implementation_strategy = [
            "Start with one habit and master it before adding others",
            "Use habit stacking - attach new habits to existing routines",
            "Set up environmental cues and reminders",
            "Track completion immediately after performing the habit",
            "Celebrate small wins to reinforce positive behavior"
        ]
        
        tracking_methods = [
            "Daily habit completion checklist",
            "Progress tracking in TradingBait habit module",
            "Weekly reflection on habit consistency",
            "Correlation tracking with trading performance"
        ]
        
        milestone_schedule = [
            {"week": 1, "goal": "Establish daily routine", "success_metric": "5/7 days completion"},
            {"week": 2, "goal": "Build consistency", "success_metric": "6/7 days completion"},
            {"week": 4, "goal": "Habit automation", "success_metric": "7/7 days completion"},
            {"week": 8, "goal": "Performance correlation", "success_metric": "Measurable trading improvement"}
        ]
        
        obstacle_management = [
            "Identify common disruption patterns and plan alternatives",
            "Prepare 'minimum viable habit' versions for difficult days",
            "Use accountability systems and reminders",
            "Plan habit recovery strategies after missed days",
            "Adjust habit parameters based on what's working"
        ]
        
        return HabitFormationResponse(
            habit_plan=habit_plan,
            implementation_strategy=implementation_strategy,
            tracking_methods=tracking_methods,
            milestone_schedule=milestone_schedule,
            obstacle_management=obstacle_management
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Error creating habit plan: {str(e)}")

pass
