from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.auth import AuthorizedUser
from app.libs.advanced_pattern_recognition import (
    AdvancedPatternRecognition, 
    PatternRecognitionResult, 
    AdvancedInsight
)
from app.libs.trading_calculations import TradeData
from app.libs.analytics_calculations import JournalEntry
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from datetime import datetime
import os

# Initialize Firebase
initialize_firebase()

router = APIRouter()

# Request/Response Models
class PatternAnalysisRequest(BaseModel):
    user_id: str
    trades_data: List[Dict[str, Any]]
    minimum_confidence: float = 0.7
    context_filter: Optional[str] = None

class PatternResult(BaseModel):
    pattern_type: str
    pattern_name: str
    description: str
    confidence_score: float
    impact_score: float
    supporting_data: Dict[str, Any]
    actionable_insights: List[str]
    occurrence_frequency: str
    trend_direction: str

class InsightResult(BaseModel):
    insight_id: str
    title: str
    insight_type: str
    description: str
    confidence_level: float
    priority: str
    category: str
    ai_narrative: str
    recommended_actions: List[str]
    success_metrics: List[str]
    estimated_impact: str

class ComprehensivePatternResponse(BaseModel):
    insights: List[InsightResult]
    patterns_detected: List[PatternResult]
    analysis_summary: Dict[str, Any]
    success: bool
    message: str

def convert_trade_dict_to_tradedata(trade_dict: Dict[str, Any]) -> TradeData:
    """Convert trade dictionary to TradeData object"""
    try:
        return TradeData(
            symbol=trade_dict.get('symbol', ''),
            open_time=datetime.fromisoformat(trade_dict.get('openTime', '').replace('Z', '+00:00')) if trade_dict.get('openTime') else datetime.now(),
            close_time=datetime.fromisoformat(trade_dict.get('closeTime', '').replace('Z', '+00:00')) if trade_dict.get('closeTime') else datetime.now(),
            quantity=float(trade_dict.get('quantity', 0)),
            pnl=float(trade_dict.get('pnl', 0)),
            tags=trade_dict.get('tags', []),
            notes=trade_dict.get('notes', ''),
            ticket=trade_dict.get('ticket'),
            account_id=trade_dict.get('accountId'),
            commission=float(trade_dict.get('commission', 0)),
            swap=float(trade_dict.get('swap', 0))
        )
    except Exception as e:
        pass
        # Return a minimal trade object
        return TradeData(
            symbol=trade_dict.get('symbol', 'UNKNOWN'),
            open_time=datetime.now(),
            close_time=datetime.now(),
            quantity=0,
            pnl=0,
            tags=[],
            notes=''
        )

@router.post("/comprehensive-pattern-analysis")
async def comprehensive_pattern_analysis_standalone(request: PatternAnalysisRequest, user: AuthorizedUser) -> ComprehensivePatternResponse:
    """Perform comprehensive pattern analysis using advanced AI recognition"""
    
    try:
        # Validate user authorization
        if user.sub != request.user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to user data")
        
        # Convert trade dictionaries to TradeData objects
        trades = [convert_trade_dict_to_tradedata(trade) for trade in request.trades_data]
        
        if len(trades) < 5:
            return ComprehensivePatternResponse(
                insights=[],
                patterns_detected=[],
                analysis_summary={
                    "total_trades": len(trades),
                    "message": "Insufficient trades for pattern analysis (minimum 5 required)"
                },
                success=True,
                message="Need more trades for comprehensive analysis"
            )
        
        # Get journal entries (if available)
        journal_entries = []
        try:
            db_firestore = firestore.client()
            for doc in db_firestore.collection(f"users/{request.user_id}/journal_entries").stream():
                entry = doc.to_dict()
                if not entry:
                    continue
                journal_entries.append(JournalEntry(
                    user_id=entry.get('userId', request.user_id),
                    date=datetime.fromisoformat(entry.get('date', '').replace('Z', '+00:00')) if entry.get('date') else datetime.now(),
                    mood=entry.get('mood', 'neutral'),
                    energy_level=entry.get('energyLevel', 5),
                    confidence_level=entry.get('confidenceLevel', 5),
                    market_outlook=entry.get('marketOutlook', 'neutral'),
                    notes=entry.get('notes', ''),
                    habits_followed=entry.get('habitsFollowed', []),
                    lessons_learned=entry.get('lessonsLearned', ''),
                    tomorrow_focus=entry.get('tomorrowFocus', '')
                ))
        except Exception as e:
            pass
            journal_entries = []
        
        # Initialize pattern recognition engine
        pattern_engine = AdvancedPatternRecognition()
        
        # Generate comprehensive insights
        insights = pattern_engine.generate_integrated_insights(
            trades=trades,
            journals=journal_entries,
            minimum_confidence=request.minimum_confidence
        )
        
        # Get individual patterns for detailed analysis
        behavioral_patterns = pattern_engine.analyze_behavioral_patterns(trades, journal_entries)
        market_patterns = pattern_engine.analyze_market_condition_patterns(trades)
        entry_exit_patterns = pattern_engine.analyze_entry_exit_patterns(trades)
        risk_patterns = pattern_engine.analyze_risk_management_patterns(trades)
        
        all_patterns = behavioral_patterns + market_patterns + entry_exit_patterns + risk_patterns
        
        # Filter patterns by confidence
        high_confidence_patterns = [p for p in all_patterns if p.confidence_score >= request.minimum_confidence]
        
        # Apply context filter if specified
        if request.context_filter:
            context_keywords = {
                'overview': ['performance', 'discipline', 'emotional'],
                'risk': ['risk', 'position', 'management'],
                'advanced': ['behavioral', 'market', 'timing'],
                'heatmaps': ['timing', 'emotional', 'market']
            }
            
            filter_keywords = context_keywords.get(request.context_filter, [])
            if filter_keywords:
                high_confidence_patterns = [
                    p for p in high_confidence_patterns 
                    if any(keyword in p.pattern_type.lower() or keyword in p.pattern_name.lower() 
                          for keyword in filter_keywords)
                ]
                insights = [
                    i for i in insights
                    if any(keyword in i.category.lower() or keyword in i.title.lower()
                          for keyword in filter_keywords)
                ]
        
        # Convert to response format
        insight_results = [
            InsightResult(
                insight_id=insight.insight_id,
                title=insight.title,
                insight_type=insight.insight_type,
                description=insight.description,
                confidence_level=insight.confidence_level,
                priority=insight.priority,
                category=insight.category,
                ai_narrative=insight.ai_narrative,
                recommended_actions=insight.recommended_actions,
                success_metrics=insight.success_metrics,
                estimated_impact=insight.estimated_impact
            )
            for insight in insights[:5]  # Limit to top 5 insights
        ]
        
        pattern_results = [
            PatternResult(
                pattern_type=pattern.pattern_type,
                pattern_name=pattern.pattern_name,
                description=pattern.description,
                confidence_score=pattern.confidence_score,
                impact_score=pattern.impact_score,
                supporting_data=pattern.supporting_data,
                actionable_insights=pattern.actionable_insights,
                occurrence_frequency=pattern.occurrence_frequency,
                trend_direction=pattern.trend_direction
            )
            for pattern in high_confidence_patterns[:10]  # Limit to top 10 patterns
        ]
        
        # Create analysis summary
        analysis_summary = {
            "total_trades_analyzed": len(trades),
            "journal_entries_used": len(journal_entries),
            "patterns_detected": len(high_confidence_patterns),
            "insights_generated": len(insights),
            "confidence_threshold": request.minimum_confidence,
            "context_filter": request.context_filter,
            "analysis_timestamp": datetime.now().isoformat()
        }
        
        return ComprehensivePatternResponse(
            insights=insight_results,
            patterns_detected=pattern_results,
            analysis_summary=analysis_summary,
            success=True,
            message=f"Analysis complete. Found {len(insight_results)} insights and {len(pattern_results)} patterns."
        )
        
    except Exception as e:
        pass
        return ComprehensivePatternResponse(
            insights=[],
            patterns_detected=[],
            analysis_summary={
                "error": str(e),
                "total_trades": len(request.trades_data) if request.trades_data else 0
            },
            success=False,
            message=f"Analysis failed: {str(e)}"
        )

@router.get("/pattern-recognition-health")
async def pattern_recognition_health():
    """Health check for pattern recognition system"""
    try:
        # Test OpenAI connection
        from openai import OpenAI
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        # Simple test call
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        
        return {
            "status": "healthy",
            "openai_connection": "active",
            "pattern_engine": "ready",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
