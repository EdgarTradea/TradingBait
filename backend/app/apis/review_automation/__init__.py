from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import databutton as db
from app.auth import AuthorizedUser

router = APIRouter(prefix="/review-automation")

# ============================================================================
# AUTOMATED REVIEW SYSTEM
# ============================================================================

class ReviewScheduler:
    """Manages automated weekly and monthly trading reviews"""
    
    @staticmethod
    def get_review_schedule_key(user_id: str) -> str:
        """Get storage key for user's review schedule"""
        return f"review_schedule_{user_id}"
    
    @staticmethod
    def get_last_review_key(user_id: str, review_type: str) -> str:
        """Get storage key for last review timestamp"""
        return f"last_{review_type}_review_{user_id}"

async def should_trigger_weekly_review(user_id: str) -> bool:
    """Check if weekly review should be triggered"""
    try:
        last_review_key = ReviewScheduler.get_last_review_key(user_id, "weekly")
        last_review = db.storage.json.get(last_review_key, default={})
        
        if not last_review.get('timestamp'):
            return True  # Never had a review
        
        last_review_date = datetime.fromisoformat(last_review['timestamp'])
        days_since_review = (datetime.now() - last_review_date).days
        
        return days_since_review >= 7
    except Exception as e:
        pass
        return False

async def should_trigger_monthly_review(user_id: str) -> bool:
    """Check if monthly review should be triggered"""
    try:
        last_review_key = ReviewScheduler.get_last_review_key(user_id, "monthly")
        last_review = db.storage.json.get(last_review_key, default={})
        
        if not last_review.get('timestamp'):
            return True  # Never had a review
        
        last_review_date = datetime.fromisoformat(last_review['timestamp'])
        days_since_review = (datetime.now() - last_review_date).days
        
        return days_since_review >= 30
    except Exception as e:
        pass
        return False

async def trigger_weekly_review(user_id: str):
    """Trigger automated weekly trading review"""
    try:
        pass
        
        # Import pattern analysis functions
        from app.apis.pattern_analysis import load_user_trades, analyze_trading_patterns, generate_behavioral_alerts, generate_coaching_triggers
        
        # Load and analyze patterns for the last 7 days
        trades = load_user_trades(user_id, 7)
        
        if not trades:
            pass
            return {"status": "no_data", "message": "No trading data available for review"}
        
        # Run pattern analysis
        patterns = analyze_trading_patterns(trades)
        alerts = generate_behavioral_alerts(patterns)
        coaching_triggers = generate_coaching_triggers(patterns, alerts)
        
        # Create analysis result structure
        analysis_result = {
            "patterns_detected": patterns,
            "behavioral_alerts": alerts,
            "coaching_triggers": coaching_triggers,
            "analysis_summary": f"Weekly review analysis of {len(trades)} trades completed",
            "data_quality_score": min(1.0, len(trades) / 20)  # Basic quality score
        }
        
        # Create weekly review coaching conversation using chat API
        coaching_data = None
        if patterns:
            try:
                from app.apis.chat import create_conversation
                
                # Create conversation title and message for weekly review
                conversation_title = f"Weekly Trading Review - {datetime.now().strftime('%B %d, %Y')}"
                
                # Generate comprehensive weekly review message
                initial_message = f"""Hello! I've completed your weekly trading review for the past 7 days. Here's what I found:

📈 **Weekly Performance Summary:**
• Patterns analyzed: {len(patterns)}
• Review period: Last 7 days
• Analysis date: {datetime.now().strftime('%B %d, %Y')}

🔍 **Key Behavioral Patterns Detected:**
{chr(10).join([f'• {p.get("pattern_type", "Unknown").replace("_", " ").title()}: {p.get("description", "No description")}' for p in patterns[:3]])}

🎯 **Focus Areas for This Week:**
• Weekly performance analysis and trend review
• Behavioral pattern monitoring and improvement
• Goal progress assessment
• Strategy refinement opportunities

Let's discuss your trading progress and work on areas for improvement. What would you like to focus on first?"""
                
                # Create the conversation
                conversation_id = await create_conversation(
                    user_id=user_id,
                    title=conversation_title,
                    initial_message=initial_message
                )
                
                coaching_data = {
                    "conversation_id": conversation_id,
                    "title": conversation_title,
                    "patterns_included": len(patterns)
                }
                
                pass
                
            except Exception as e:
                pass
        
        # Record that weekly review was completed
        last_review_key = ReviewScheduler.get_last_review_key(user_id, "weekly")
        db.storage.json.put(last_review_key, {
            "timestamp": datetime.now().isoformat(),
            "patterns_found": len(patterns),
            "coaching_triggered": bool(coaching_data)
        })
        
        pass
        return {
            "status": "completed",
            "patterns_analyzed": len(patterns),
            "coaching_triggered": bool(coaching_data)
        }
        
    except Exception as e:
        pass
        return {"status": "error", "error": str(e)}

async def trigger_monthly_review(user_id: str):
    """Trigger automated monthly trading review"""
    try:
        pass
        
        # Import pattern analysis functions
        from app.apis.pattern_analysis import load_user_trades, analyze_trading_patterns, generate_behavioral_alerts, generate_coaching_triggers
        
        # Load and analyze patterns for the last 30 days
        trades = load_user_trades(user_id, 30)
        
        if not trades:
            pass
            return {"status": "no_data", "message": "No trading data available for review"}
        
        # Run pattern analysis
        patterns = analyze_trading_patterns(trades)
        alerts = generate_behavioral_alerts(patterns)
        coaching_triggers = generate_coaching_triggers(patterns, alerts)
        
        # Calculate performance summary
        total_trades = len(trades)
        winning_trades = sum(1 for t in trades if t.pnl > 0)
        win_rate = winning_trades / total_trades if total_trades > 0 else 0
        total_pnl = sum(t.pnl for t in trades)
        
        performance_summary = {
            "total_trades": total_trades,
            "win_rate": win_rate,
            "total_pnl": total_pnl,
            "winning_trades": winning_trades
        }
        
        # Create analysis result structure
        analysis_result = {
            "patterns_detected": patterns,
            "behavioral_alerts": alerts,
            "coaching_triggers": coaching_triggers,
            "performance_summary": performance_summary,
            "analysis_summary": f"Monthly review analysis of {total_trades} trades completed",
            "data_quality_score": min(1.0, total_trades / 50)  # Basic quality score
        }
        
        # Create monthly review coaching conversation using chat API
        coaching_data = None
        if patterns:
            try:
                from app.apis.chat import create_conversation
                
                # Create conversation title and message for monthly review
                conversation_title = f"Monthly Trading Review - {datetime.now().strftime('%B %Y')}"
                
                # Generate comprehensive monthly review message
                initial_message = f"""Hello! I've completed your comprehensive monthly trading review for the past 30 days. Here's your detailed analysis:

📈 **Monthly Performance Summary:**
• Total patterns analyzed: {len(patterns)}
• Review period: Last 30 days
• Analysis date: {datetime.now().strftime('%B %d, %Y')}

🔍 **Long-Term Behavioral Patterns:**
{chr(10).join([f'• {p.get("pattern_type", "Unknown").replace("_", " ").title()}: {p.get("description", "No description")}' for p in patterns[:5]])}

🏆 **Monthly Focus Areas:**
• Long-term performance trend analysis
• Strategic behavior pattern evaluation
• Goal achievement assessment
• Trading psychology development
• Risk management effectiveness review

This monthly review provides deeper insights into your trading evolution. Let's work together to strengthen your profitable patterns and address areas for improvement. What aspect of your monthly performance would you like to explore first?"""
                
                # Create the conversation
                conversation_id = await create_conversation(
                    user_id=user_id,
                    title=conversation_title,
                    initial_message=initial_message
                )
                
                coaching_data = {
                    "conversation_id": conversation_id,
                    "title": conversation_title,
                    "patterns_included": len(patterns),
                    "performance_summary": performance_summary
                }
                
                pass
                
            except Exception as e:
                pass
        
        # Record that monthly review was completed
        last_review_key = ReviewScheduler.get_last_review_key(user_id, "monthly")
        db.storage.json.put(last_review_key, {
            "timestamp": datetime.now().isoformat(),
            "patterns_found": len(patterns),
            "performance_summary": performance_summary,
            "coaching_triggered": bool(coaching_data)
        })
        
        pass
        return {
            "status": "completed",
            "patterns_analyzed": len(patterns),
            "performance_summary": performance_summary,
            "coaching_triggered": bool(coaching_data)
        }
        
    except Exception as e:
        pass
        return {"status": "error", "error": str(e)}

async def check_and_trigger_reviews(user_id: str) -> Dict[str, Any]:
    """Check if any reviews are due and trigger them"""
    results = {
        "weekly_review": None,
        "monthly_review": None
    }
    
    # Check weekly review
    if await should_trigger_weekly_review(user_id):
        results["weekly_review"] = await trigger_weekly_review(user_id)
    
    # Check monthly review
    if await should_trigger_monthly_review(user_id):
        results["monthly_review"] = await trigger_monthly_review(user_id)
    
    return results

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/health")
async def review_automation_health_check():
    """Health check for review automation API"""
    return {
        "status": "healthy", 
        "service": "review_automation", 
        "timestamp": datetime.now().isoformat(),
        "features": [
            "weekly_review_automation",
            "monthly_review_automation", 
            "pattern_trend_analysis",
            "coaching_conversation_triggers",
            "review_schedule_management"
        ]
    }

@router.post("/check")
async def check_reviews(user: AuthorizedUser):
    """Check if any reviews are due for the user"""
    user_id = user.sub
    
    try:
        weekly_due = await should_trigger_weekly_review(user_id)
        monthly_due = await should_trigger_monthly_review(user_id)
        
        return {
            "weekly_review_due": weekly_due,
            "monthly_review_due": monthly_due,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking reviews: {str(e)}")

@router.post("/trigger")
async def trigger_reviews(user: AuthorizedUser):
    """Manually trigger review checks and automation"""
    user_id = user.sub
    
    try:
        results = await check_and_trigger_reviews(user_id)
        return {
            "status": "completed",
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error triggering reviews: {str(e)}")

@router.post("/trigger/weekly")
async def trigger_weekly_review_endpoint(user: AuthorizedUser):
    """Manually trigger weekly review"""
    user_id = user.sub
    
    try:
        result = await trigger_weekly_review(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error triggering weekly review: {str(e)}")

@router.post("/trigger/monthly")
async def trigger_monthly_review_endpoint(user: AuthorizedUser):
    """Manually trigger monthly review"""
    user_id = user.sub
    
    try:
        result = await trigger_monthly_review(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error triggering monthly review: {str(e)}")

@router.get("/schedule")
async def get_review_schedule(user: AuthorizedUser):
    """Get user's review schedule and history"""
    user_id = user.sub
    
    try:
        weekly_key = ReviewScheduler.get_last_review_key(user_id, "weekly")
        monthly_key = ReviewScheduler.get_last_review_key(user_id, "monthly")
        
        weekly_last = db.storage.json.get(weekly_key, default={})
        monthly_last = db.storage.json.get(monthly_key, default={})
        
        return {
            "last_weekly_review": weekly_last,
            "last_monthly_review": monthly_last,
            "weekly_due": await should_trigger_weekly_review(user_id),
            "monthly_due": await should_trigger_monthly_review(user_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting schedule: {str(e)}")
