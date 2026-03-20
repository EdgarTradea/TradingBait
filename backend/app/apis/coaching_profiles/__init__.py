from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.auth import AuthorizedUser
import json
from datetime import datetime
from openai import OpenAI
import os

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/coaching-profiles")

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Assessment Models
class TradingExperienceData(BaseModel):
    years_trading: int  # 0-1, 1-3, 3-5, 5-10, 10+
    primary_markets: List[str]  # stocks, forex, crypto, futures, options
    trading_style: str  # scalper, day_trader, swing_trader, position_trader
    avg_trades_per_week: int
    largest_drawdown_percent: Optional[float] = None
    best_month_return_percent: Optional[float] = None

class PsychologicalProfileData(BaseModel):
    risk_tolerance: str  # conservative, moderate, aggressive
    emotional_control: int  # 1-10 scale
    stress_response: str  # calm, adaptive, anxious, overwhelmed
    motivation_drivers: List[str]  # financial_freedom, challenge, competition, security
    learning_style: str  # visual, analytical, hands_on, social
    decision_making: str  # quick_intuitive, analytical_slow, data_driven, emotion_based

class DevelopmentAreasData(BaseModel):
    strengths: List[str]
    improvement_areas: List[str]
    specific_challenges: List[str]
    goals: List[str]
    preferred_coaching_frequency: str  # daily, weekly, bi_weekly, monthly

class CoachingPreferencesData(BaseModel):
    communication_style: str  # supportive, direct, analytical, motivational
    session_intensity: str  # light, moderate, intensive
    feedback_preference: str  # gentle, balanced, harsh_truth
    accountability_level: str  # low, medium, high
    content_depth: str  # surface, moderate, deep_psychological

class TraderAssessmentRequest(BaseModel):
    experience: TradingExperienceData
    psychology: PsychologicalProfileData
    development: DevelopmentAreasData
    preferences: CoachingPreferencesData
    additional_notes: Optional[str] = None

class TraderProfile(BaseModel):
    user_id: str
    profile_id: str
    created_at: str
    updated_at: str
    assessment_data: Dict[str, Any]
    ai_analysis: Dict[str, Any]
    coaching_recommendations: Dict[str, Any]
    development_plan: Dict[str, Any]
    profile_version: int

class UpdateProfileRequest(BaseModel):
    updates: Dict[str, Any]
    reason: Optional[str] = None

class CoachingStyleRequest(BaseModel):
    session_type: str
    user_context: Optional[str] = None
    recent_performance: Optional[Dict[str, Any]] = None

# Assessment and Profile Creation
@router.post("/assess-trader")
async def assess_trader(request: TraderAssessmentRequest, user: AuthorizedUser) -> TraderProfile:
    """Create comprehensive trader assessment and generate personalized coaching profile"""
    try:
        db_firestore = firestore.client()
        profile_id = f"profile_{int(datetime.now().timestamp() * 1000)}"

        assessment_data = {
            "experience": request.experience.dict(),
            "psychology": request.psychology.dict(),
            "development": request.development.dict(),
            "preferences": request.preferences.dict(),
            "additional_notes": request.additional_notes
        }

        ai_analysis = await generate_trader_analysis(assessment_data)
        coaching_recommendations = await generate_coaching_recommendations(assessment_data, ai_analysis)
        development_plan = await generate_development_plan(assessment_data, ai_analysis)

        profile = TraderProfile(
            user_id=user.sub,
            profile_id=profile_id,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            assessment_data=assessment_data,
            ai_analysis=ai_analysis,
            coaching_recommendations=coaching_recommendations,
            development_plan=development_plan,
            profile_version=1
        )

        # Store current profile
        db_firestore.collection(f"users/{user.sub}/trader_profiles").document("current").set(profile.dict())

        # Add to assessment history
        db_firestore.collection(f"users/{user.sub}/assessment_history").document(profile_id).set({
            "profile_id": profile_id,
            "created_at": profile.created_at,
            "version": profile.profile_version
        })

        return profile

    except Exception as e:
        pass
        raise

@router.get("/profile")
async def get_trader_profile(user: AuthorizedUser) -> Optional[TraderProfile]:
    """Get current trader profile for user"""
    try:
        db_firestore = firestore.client()
        doc = db_firestore.collection(f"users/{user.sub}/trader_profiles").document("current").get()
        profile_data = doc.to_dict()

        if profile_data:
            return TraderProfile(**profile_data)
        return None

    except Exception as e:
        pass
        return None

@router.put("/profile")
async def update_trader_profile(request: UpdateProfileRequest, user: AuthorizedUser) -> TraderProfile:
    """Update existing trader profile"""
    try:
        db_firestore = firestore.client()
        doc_ref = db_firestore.collection(f"users/{user.sub}/trader_profiles").document("current")
        doc = doc_ref.get()
        current_profile_data = doc.to_dict()

        if not current_profile_data:
            raise ValueError("No existing profile found")

        current_profile = TraderProfile(**current_profile_data)

        for key, value in request.updates.items():
            if hasattr(current_profile, key):
                setattr(current_profile, key, value)

        current_profile.updated_at = datetime.now().isoformat()
        current_profile.profile_version += 1

        if any(key in ['experience', 'psychology', 'development'] for key in request.updates.keys()):
            current_profile.ai_analysis = await generate_trader_analysis(current_profile.assessment_data)
            current_profile.coaching_recommendations = await generate_coaching_recommendations(
                current_profile.assessment_data, current_profile.ai_analysis
            )

        doc_ref.set(current_profile.dict())

        return current_profile

    except Exception as e:
        pass
        raise

@router.post("/coaching-style")
async def get_personalized_coaching_style(request: CoachingStyleRequest, user: AuthorizedUser) -> Dict[str, Any]:
    """Generate personalized coaching style and content for session"""
    try:
        db_firestore = firestore.client()
        doc = db_firestore.collection(f"users/{user.sub}/trader_profiles").document("current").get()
        profile_data = doc.to_dict()

        if not profile_data:
            return {
                "communication_style": "supportive",
                "session_intensity": "moderate",
                "content_depth": "moderate",
                "personalization_notes": "Using default coaching approach - consider completing trader assessment for personalized experience"
            }

        profile = TraderProfile(**profile_data)
        coaching_style = await generate_personalized_coaching_approach(
            profile, request.session_type, request.user_context, request.recent_performance
        )
        return coaching_style

    except Exception as e:
        pass
        raise

@router.get("/development-areas")
async def get_development_areas(user: AuthorizedUser) -> Dict[str, Any]:
    """Get prioritized development areas and progress tracking"""
    try:
        db_firestore = firestore.client()
        doc = db_firestore.collection(f"users/{user.sub}/trader_profiles").document("current").get()
        profile_data = doc.to_dict()

        if not profile_data:
            return {
                "areas": [],
                "recommendations": "Complete trader assessment to identify development areas"
            }

        profile = TraderProfile(**profile_data)
        development_areas = profile.development_plan.get("priority_areas", [])

        return {
            "areas": development_areas,
            "current_focus": profile.development_plan.get("current_focus"),
            "progress_metrics": profile.development_plan.get("progress_metrics", {})
        }

    except Exception as e:
        pass
        raise

# AI Analysis Functions
async def generate_trader_analysis(assessment_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate comprehensive AI analysis of trader profile"""
    try:
        analysis_prompt = f"""
As an expert trading psychology coach, analyze this trader's profile and provide comprehensive insights:

Trader Assessment Data:
{json.dumps(assessment_data, indent=2)}

Please provide analysis in the following JSON format:
{{
  "trader_type": "Brief classification (e.g., 'Analytical Swing Trader', 'Emotional Day Trader')",
  "psychological_profile": {{
    "strengths": ["List key psychological strengths"],
    "vulnerabilities": ["List potential psychological risks"],
    "stress_patterns": "Description of how they handle stress"
  }},
  "trading_profile": {{
    "experience_level": "Assessment of actual vs stated experience",
    "style_alignment": "How well their style matches their psychology",
    "risk_assessment": "Evaluation of their risk management approach"
  }},
  "development_insights": {{
    "immediate_priorities": ["Top 3 areas needing attention"],
    "growth_potential": "Assessment of improvement capacity",
    "warning_signs": ["Potential red flags to monitor"]
  }},
  "coaching_notes": "Key insights for coaching approach"
}}

Provide detailed, actionable analysis based on trading psychology principles.
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert trading psychology coach with deep knowledge of trader behavior patterns, cognitive biases, and performance optimization. Provide thorough, professional analysis."},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.7
        )

        analysis_text = response.choices[0].message.content

        try:
            analysis = json.loads(analysis_text)
        except json.JSONDecodeError:
            analysis = {
                "trader_type": "Analysis Pending",
                "psychological_profile": {"strengths": [], "vulnerabilities": [], "stress_patterns": ""},
                "trading_profile": {"experience_level": "", "style_alignment": "", "risk_assessment": ""},
                "development_insights": {"immediate_priorities": [], "growth_potential": "", "warning_signs": []},
                "coaching_notes": analysis_text
            }

        return analysis

    except Exception as e:
        pass
        return {"error": str(e)}

async def generate_coaching_recommendations(assessment_data: Dict[str, Any], ai_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Generate personalized coaching recommendations"""
    try:
        recommendations_prompt = f"""
Based on this trader assessment and AI analysis, create personalized coaching recommendations:

Assessment Data:
{json.dumps(assessment_data, indent=2)}

AI Analysis:
{json.dumps(ai_analysis, indent=2)}

Provide recommendations in this JSON format:
{{
  "communication_approach": {{
    "style": "Primary communication style (supportive/direct/analytical/motivational)",
    "tone": "Recommended tone and language",
    "feedback_method": "How to deliver feedback effectively"
  }},
  "session_structure": {{
    "optimal_frequency": "Recommended session frequency",
    "session_length": "Ideal session duration",
    "preferred_timing": "Best times for coaching sessions"
  }},
  "content_personalization": {{
    "focus_areas": ["Key areas to emphasize in coaching"],
    "avoid_topics": ["Topics to handle carefully or avoid"],
    "learning_adaptations": "How to adapt content to their learning style"
  }},
  "motivation_strategies": {{
    "primary_motivators": ["What drives this trader"],
    "accountability_approach": "How to maintain accountability",
    "reward_systems": "Effective recognition and reward methods"
  }},
  "special_considerations": ["Important notes for coaching this trader"]
}}

Focus on practical, actionable coaching strategies.
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert coaching strategist specializing in trader development. Create specific, actionable coaching recommendations."},
                {"role": "user", "content": recommendations_prompt}
            ],
            temperature=0.7
        )

        recommendations_text = response.choices[0].message.content

        try:
            recommendations = json.loads(recommendations_text)
        except json.JSONDecodeError:
            recommendations = {"error": "Failed to parse recommendations", "raw_response": recommendations_text}

        return recommendations

    except Exception as e:
        pass
        return {"error": str(e)}

async def generate_development_plan(assessment_data: Dict[str, Any], ai_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Generate structured development plan"""
    try:
        plan_prompt = f"""
Create a structured development plan for this trader:

Assessment Data:
{json.dumps(assessment_data, indent=2)}

AI Analysis:
{json.dumps(ai_analysis, indent=2)}

Provide a development plan in this JSON format:
{{
  "current_focus": "Primary development area to focus on now",
  "priority_areas": [
    {{
      "area": "Development area name",
      "priority": "high/medium/low",
      "timeline": "Expected timeframe for improvement",
      "specific_goals": ["Specific, measurable goals"],
      "action_steps": ["Concrete steps to take"],
      "success_metrics": ["How to measure progress"]
    }}
  ],
  "skill_building_path": {{
    "phase_1": "Foundation building (first 30 days)",
    "phase_2": "Skill development (days 31-90)",
    "phase_3": "Mastery and refinement (90+ days)"
  }},
  "progress_metrics": {{
    "behavioral_indicators": ["Observable behavior changes"],
    "performance_metrics": ["Trading performance indicators"],
    "psychological_markers": ["Mental/emotional progress signs"]
  }},
  "milestone_schedule": [
    {{
      "milestone": "Achievement description",
      "target_date": "Relative timeframe (e.g., '2 weeks', '1 month')",
      "validation_method": "How to confirm achievement"
    }}
  ]
}}

Create a realistic, achievable development plan.
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert performance coach specializing in trader development. Create structured, achievable development plans."},
                {"role": "user", "content": plan_prompt}
            ],
            temperature=0.7
        )

        plan_text = response.choices[0].message.content

        try:
            plan = json.loads(plan_text)
        except json.JSONDecodeError:
            plan = {"error": "Failed to parse development plan", "raw_response": plan_text}

        return plan

    except Exception as e:
        pass
        return {"error": str(e)}

async def generate_personalized_coaching_approach(profile: TraderProfile, session_type: str, user_context: Optional[str], recent_performance: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate personalized coaching approach for specific session"""
    try:
        approach_prompt = f"""
Generate a personalized coaching approach for this session:

Trader Profile:
- Type: {profile.ai_analysis.get('trader_type', 'Unknown')}
- Preferences: {profile.assessment_data.get('preferences', {})}
- Coaching Recommendations: {profile.coaching_recommendations}

Session Details:
- Type: {session_type}
- Context: {user_context or 'Standard session'}
- Recent Performance: {recent_performance or 'No recent data'}

Provide approach in this JSON format:
{{
  "communication_style": "Specific style for this session",
  "session_intensity": "light/moderate/intensive",
  "content_depth": "surface/moderate/deep_psychological",
  "opening_approach": "How to start the session",
  "key_focus_areas": ["What to emphasize in this session"],
  "interaction_style": "How to interact with this trader",
  "potential_challenges": ["What to watch out for"],
  "success_indicators": ["How to know the session is effective"],
  "personalization_notes": "Specific notes for this trader and session"
}}

Tailor the approach to this specific trader and session type.
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert coaching strategist. Personalize coaching approaches for individual traders and session types."},
                {"role": "user", "content": approach_prompt}
            ],
            temperature=0.7
        )

        approach_text = response.choices[0].message.content

        try:
            approach = json.loads(approach_text)
        except json.JSONDecodeError:
            approach = {
                "communication_style": profile.assessment_data.get('preferences', {}).get('communication_style', 'supportive'),
                "session_intensity": profile.assessment_data.get('preferences', {}).get('session_intensity', 'moderate'),
                "content_depth": profile.assessment_data.get('preferences', {}).get('content_depth', 'moderate'),
                "personalization_notes": "Using profile preferences - AI approach generation failed"
            }

        return approach

    except Exception as e:
        pass
        return {"error": str(e)}

@router.get("/health")
async def coaching_profiles_health_check():
    """Health check for coaching profiles system"""
    return {
        "status": "healthy",
        "service": "coaching_profiles",
        "features": [
            "trader_assessment",
            "personalized_profiles",
            "coaching_recommendations",
            "development_planning",
            "adaptive_coaching_style"
        ]
    }
