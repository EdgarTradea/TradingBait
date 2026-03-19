from typing import Dict, Any, List, Optional
from datetime import datetime
from openai import OpenAI
import databutton as db
from app.auth import AuthorizedUser
import os

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def create_tough_love_coaching_prompt(data_summary: Dict[str, Any], user_message: str, session_context: List[Dict[str, Any]]) -> str:
    """
    Create comprehensive tough love coaching prompt with data context
    """
    
    total_trades = data_summary.get("total_trades", 0)
    total_pnl = data_summary.get("total_pnl", 0)
    win_rate = data_summary.get("win_rate", 0)
    journal_entries = data_summary.get("journal_entries_count", 0)
    trading_days = data_summary.get("trading_days_count", 0)
    
    # Analyze recent conversation context
    recent_messages = session_context[-3:] if session_context else []
    context_summary = "\n".join([f"{msg.get('type', 'user')}: {msg.get('message', '')}" for msg in recent_messages])
    
    prompt = f"""
You are a no-nonsense, tough love trading coach with 20+ years of experience. Your job is to give direct, actionable feedback that pushes traders to excellence.

**TRADER'S DATA SUMMARY:**
- Total Trades: {total_trades}
- Win Rate: {win_rate:.1f}%
- Total P&L: ${total_pnl:.2f}
- Journal Entries: {journal_entries}
- Active Trading Days: {trading_days}

**RECENT CONVERSATION:**
{context_summary}

**CURRENT MESSAGE:** {user_message}

**YOUR COACHING STYLE:**
- Be direct and honest about performance patterns
- Reference specific data points from their trading
- Challenge bad habits without being cruel
- Celebrate real progress when earned
- Push them toward disciplined, profitable trading
- Ask tough questions that make them think
- Provide specific, actionable next steps

**RESPONSE GUIDELINES:**
1. Address their message directly
2. Reference their actual trading data when relevant
3. Identify patterns or behaviors to improve
4. Give 1-2 specific actionable steps
5. End with a challenging question or accountability check
6. Keep it under 200 words - be concise and impactful

Remember: You're tough but supportive. Your goal is to make them a better trader through honest feedback and accountability.
"""
    
    return prompt


async def generate_tough_love_response(
    user_message: str,
    session_id: str,
    user_id: str,
    data_summary: Dict[str, Any],
    session_context: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generate a tough love coaching response with comprehensive data context
    """
    
    try:
        # Create comprehensive prompt
        prompt = create_tough_love_coaching_prompt(data_summary, user_message, session_context)
        
        # Call OpenAI with sophisticated system prompt
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a no-nonsense, tough love trading coach with 20+ years of experience. You have access to comprehensive trader data and provide direct, actionable feedback that pushes traders to excellence. You don't sugarcoat failures, but you celebrate real progress. Reference specific data points and patterns when giving advice."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        ai_response = response.choices[0].message.content
        
        # Generate coach insights based on the conversation
        coach_insights = []
        if "risk" in user_message.lower():
            coach_insights.append("Risk management focus")
        if "emotion" in user_message.lower() or "feel" in user_message.lower():
            coach_insights.append("Emotional trading patterns")
        if "strategy" in user_message.lower() or "plan" in user_message.lower():
            coach_insights.append("Strategy development")
        if "loss" in user_message.lower() or "losing" in user_message.lower():
            coach_insights.append("Loss management")
        
        # Generate contextual follow-up questions based on their data
        suggested_questions = []
        
        if data_summary.get("win_rate", 0) < 50:
            suggested_questions.append("What's your plan to improve your win rate above 50%?")
        
        if data_summary.get("total_trades", 0) < 20:
            suggested_questions.append("When will you start taking more consistent trading action?")
        
        if data_summary.get("journal_entries_count", 0) < data_summary.get("total_trades", 0) * 0.5:
            suggested_questions.append("Why aren't you journaling every trade? What's the excuse?")
            
        # Default tough questions if no specific patterns
        if not suggested_questions:
            suggested_questions = [
                "What specific pattern are you struggling with most?",
                "How are you managing risk in your current trades?",
                "What's your biggest emotional challenge in trading?",
                "Tell me about your most recent losing trade - what happened?"
            ]
        
        return {
            "response": ai_response,
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "coach_insights": coach_insights,
            "suggested_next_questions": suggested_questions[:2]  # Limit to 2 suggestions
        }
        
    except Exception as e:
        print(f"Error in tough love coaching response: {e}")
        return {
            "response": "Look, I'm having some technical difficulties right now, but that doesn't excuse sloppy trading. Keep journaling your trades and emotions - we'll get back to serious coaching once I'm back online.",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "coach_insights": ["Technical issues"],
            "suggested_next_questions": ["Continue documenting your trades and emotions while I get back online"]
        }


async def prepare_coaching_data_context(user_id: str) -> Dict[str, Any]:
    """
    Prepare comprehensive data context for coaching session
    """
    
    try:
        # Import the trading data aggregator to get real user data
        from app.libs.trading_data_aggregator import TradingDataAggregator
        
        # Initialize the aggregator for this user
        aggregator = TradingDataAggregator(user_id)
        
        # Get comprehensive 30-day trading data
        comprehensive_data = await aggregator.get_comprehensive_trader_data(30)
        
        # Extract key metrics for coaching context
        trades = comprehensive_data.get('trades', [])
        journal_entries = comprehensive_data.get('journal_entries', [])
        performance_summary = comprehensive_data.get('performance_summary', {})
        
        data_context = {
            "data_summary": {
                "total_trades": len(trades),
                "total_pnl": performance_summary.get('total_pnl', 0.0),
                "win_rate": performance_summary.get('win_rate', 0.0),
                "journal_entries_count": len(journal_entries),
                "trading_days_count": performance_summary.get('trading_days', 0),
                "avg_trade_size": performance_summary.get('avg_trade_size', 0.0),
                "largest_win": performance_summary.get('largest_win', 0.0),
                "largest_loss": performance_summary.get('largest_loss', 0.0),
                "last_updated": datetime.now().isoformat()
            },
            "raw_data": {
                "trades": trades[:10],  # Last 10 trades for context
                "recent_journal_entries": journal_entries[:5],  # Last 5 entries
            },
            "behavioral_patterns": comprehensive_data.get('behavioral_correlations', {}),
            "context_loaded": True,
            "user_id": user_id
        }
        
        print(f"Prepared coaching data context for user: {user_id}")
        print(f"Data loaded: {len(trades)} trades, {len(journal_entries)} journal entries")
        return data_context
        
    except Exception as e:
        print(f"Error preparing coaching data context: {e}")
        return {
            "data_summary": {
                "total_trades": 0,
                "total_pnl": 0.0,
                "win_rate": 0.0,
                "journal_entries_count": 0,
                "trading_days_count": 0
            },
            "context_loaded": False,
            "error": str(e)
        }
