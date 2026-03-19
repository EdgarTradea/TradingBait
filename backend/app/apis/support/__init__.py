from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import re
from datetime import datetime
import uuid
import databutton as db
from app.libs.email_support import create_support_ticket, get_ticket_by_id, list_recent_tickets

router = APIRouter(prefix="/support")

# Request/Response Models
class SupportCategory(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    color: str

class SupportQuestion(BaseModel):
    id: str
    category_id: str
    question: str
    answer: str
    keywords: List[str]
    helpful_count: int = 0
    view_count: int = 0

class SearchRequest(BaseModel):
    query: str
    category_id: Optional[str] = None
    limit: int = 10

class SearchResponse(BaseModel):
    results: List[SupportQuestion]
    total_count: int
    query: str

class CategoryResponse(BaseModel):
    categories: List[SupportCategory]

class CategoryQuestionsResponse(BaseModel):
    category: SupportCategory
    questions: List[SupportQuestion]

class HelpfulVoteRequest(BaseModel):
    question_id: str
    helpful: bool

# Support Ticket Models
class SupportTicketRequest(BaseModel):
    user_email: str
    subject: str
    message: str
    category: str
    priority: str = "medium"
    user_context: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[Dict[str, Any]]] = None

class SupportTicketResponse(BaseModel):
    success: bool
    ticket_id: Optional[str] = None
    message: str
    error: Optional[str] = None

# Comprehensive Knowledge Base Data
SUPPORT_CATEGORIES = [
    {
        "id": "trading_platform",
        "name": "Trading Platform Issues",
        "description": "Import trades, connection problems, and data sync issues",
        "icon": "TrendingUp",
        "color": "emerald"
    },
    {
        "id": "app_navigation",
        "name": "App Navigation",
        "description": "How to use dashboard, journal, analytics, and other features",
        "icon": "Navigation",
        "color": "blue"
    },
    {
        "id": "account_billing",
        "name": "Account & Billing",
        "description": "Subscription management, payments, and account settings",
        "icon": "CreditCard",
        "color": "purple"
    },
    {
        "id": "trading_education",
        "name": "Trading Education",
        "description": "Learn about trading concepts, risk management, and best practices",
        "icon": "BookOpen",
        "color": "amber"
    },
    {
        "id": "technical_issues",
        "name": "Technical Issues",
        "description": "Login problems, performance issues, and troubleshooting",
        "icon": "Settings",
        "color": "red"
    }
]

SUPPORT_QUESTIONS = [
    # Trading Platform Issues
    {
        "id": "tp_001",
        "category_id": "trading_platform",
        "question": "How do I import trades from cTrader?",
        "answer": "To import trades from cTrader:\n\n1. **Connect Your Account**: Go to Settings > Trading Platforms and click 'Connect cTrader'\n2. **Enter Credentials**: Use your cTrader Client ID and Secret (found in cTrader Automate)\n3. **Authorize Access**: Complete the OAuth flow to grant TradingBait access\n4. **Auto-Sync**: Your trades will automatically sync every 15 minutes\n\n**Troubleshooting**: If connection fails, verify your credentials and ensure your cTrader account has API access enabled.",
        "keywords": ["import", "ctrader", "trades", "connect", "sync", "oauth", "credentials"]
    },
    {
        "id": "tp_002",
        "category_id": "trading_platform",
        "question": "Why aren't my trades syncing automatically?",
        "answer": "If your trades aren't syncing, try these steps:\n\n1. **Check Connection Status**: Go to Settings > Trading Platforms and verify your connection is 'Active'\n2. **Re-authorize**: Click 'Reconnect' to refresh your authorization\n3. **Manual Sync**: Use the 'Sync Now' button to force an immediate update\n4. **Check Timeframe**: Sync occurs every 15 minutes, so recent trades may take time to appear\n\n**Still having issues?** Contact support with your connection status and any error messages.",
        "keywords": ["sync", "automatic", "connection", "refresh", "manual", "timeframe"]
    },
    {
        "id": "an_001",
        "category_id": "app_navigation",
        "question": "How do I use the trading dashboard?",
        "answer": "The trading dashboard is your main overview:\n\n**Key Sections:**\n- **Performance Cards**: Total P&L, win rate, profit factor at the top\n- **Equity Curve**: Visual representation of your account growth\n- **Recent Trades**: Latest trading activity\n- **Daily Habits**: Track your trading routine completion\n\n**Navigation Tips:**\n- Use the sidebar menu to switch between sections\n- Date filters at the top let you analyze different time periods\n- Click on any metric for detailed breakdowns\n- Mobile users can swipe between cards\n\n**Customization**: You can rearrange dashboard widgets in Settings > Dashboard.",
        "keywords": ["dashboard", "overview", "performance", "equity", "habits", "navigation", "customize"]
    },
    {
        "id": "ab_001",
        "category_id": "account_billing",
        "question": "How do I manage my subscription?",
        "answer": "Managing your TradingBait subscription:\n\n**Current Plan:**\n- View your plan details in Settings > Subscription\n- See usage limits and renewal date\n- Check remaining features (trade imports, journal entries, etc.)\n\n**Upgrading/Downgrading:**\n- Click 'Change Plan' to see available options\n- Changes take effect immediately with prorated billing\n- Downgrades apply at next billing cycle\n\n**Billing:**\n- Access invoices and payment history\n- Update payment methods\n- Download receipts for expense tracking\n\n**Cancellation:**\n- Cancel anytime with immediate effect\n- Data remains accessible for 30 days\n- Easy reactivation within grace period",
        "keywords": ["subscription", "plan", "upgrade", "downgrade", "billing", "cancel", "invoices", "payment"]
    },
    {
        "id": "te_001",
        "category_id": "trading_education",
        "question": "How are P&L calculations determined?",
        "answer": "Understanding P&L calculations in TradingBait:\n\n**Basic Formula:**\nNet P&L = (Exit Price - Entry Price) × Position Size × Direction + Commissions + Swaps\n\n**Components:**\n- **Gross P&L**: Pure price movement profit/loss\n- **Commissions**: Broker fees (usually per lot or percentage)\n- **Swaps**: Overnight financing charges\n- **Slippage**: Difference between expected and actual fills\n\n**Currency Conversion:**\n- Profits converted to account currency using live rates\n- Historical rates used for closed positions\n- Cross-currency pairs require additional calculations\n\n**Position Sizing:**\n- Forex: Calculated per 100,000 units (standard lot)\n- Stocks: Direct share count\n- CFDs: Contract specifications vary by broker\n\n**Accuracy**: TradingBait uses the same calculations as your broker, but minor differences may occur due to timing or rounding.",
        "keywords": ["pnl", "profit", "loss", "calculation", "commission", "swap", "currency", "position", "sizing", "forex"]
    },
    {
        "id": "ti_001",
        "category_id": "technical_issues",
        "question": "I can't log in to my account",
        "answer": "Troubleshooting login issues:\n\n**Common Solutions:**\n1. **Check Credentials**: Ensure email and password are correct\n2. **Reset Password**: Use 'Forgot Password' if you're unsure\n3. **Clear Browser Data**: Clear cookies and cache for TradingBait\n4. **Try Incognito Mode**: Test if browser extensions are interfering\n5. **Different Browser**: Chrome, Firefox, Safari all supported\n\n**Account Issues:**\n- **Suspended Account**: Check email for payment or policy violations\n- **Email Verification**: Look for verification email in spam folder\n- **Two-Factor Authentication**: Ensure your authenticator app is synced\n\n**Technical Issues:**\n- **Firewall/VPN**: Some corporate networks block trading platforms\n- **Ad Blockers**: Disable for TradingBait if login fails\n- **Browser Updates**: Ensure you're using a current browser version\n\nIf problems persist, contact support with your email and browser details.",
        "keywords": ["login", "password", "reset", "browser", "cookies", "cache", "incognito", "suspended", "verification", "2fa"]
    }
]

# In-memory storage for demo (in production, use a database)
knowledge_base = {
    "categories": SUPPORT_CATEGORIES,
    "questions": SUPPORT_QUESTIONS,
    "analytics": {
        "popular_questions": {},
        "search_queries": {},
        "helpful_votes": {}
    }
}

# Knowledge Base Endpoints
@router.get("/categories", response_model=CategoryResponse)
async def get_support_categories():
    """Get all support categories"""
    return CategoryResponse(categories=[SupportCategory(**cat) for cat in knowledge_base["categories"]])

@router.get("/categories/{category_id}/questions", response_model=CategoryQuestionsResponse)
async def get_category_questions(category_id: str):
    """Get all questions for a specific category"""
    # Find category
    category = next((cat for cat in knowledge_base["categories"] if cat["id"] == category_id), None)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Get questions for this category
    questions = [q for q in knowledge_base["questions"] if q["category_id"] == category_id]
    
    return CategoryQuestionsResponse(
        category=SupportCategory(**category),
        questions=[SupportQuestion(**q) for q in questions]
    )

@router.post("/search", response_model=SearchResponse)
async def search_knowledge_base(request: SearchRequest):
    """Search the knowledge base"""
    query = request.query.lower().strip()
    category_filter = request.category_id
    
    if not query:
        return SearchResponse(results=[], total_count=0, query=request.query)
    
    # Track search query for analytics
    if query not in knowledge_base["analytics"]["search_queries"]:
        knowledge_base["analytics"]["search_queries"][query] = 0
    knowledge_base["analytics"]["search_queries"][query] += 1
    
    results = []
    
    for q in knowledge_base["questions"]:
        # Apply category filter if specified
        if category_filter and q["category_id"] != category_filter:
            continue
            
        score = 0
        
        # Check question title (highest weight)
        if query in q["question"].lower():
            score += 10
        
        # Check answer content (medium weight)
        if query in q["answer"].lower():
            score += 5
        
        # Check keywords (high weight)
        for keyword in q["keywords"]:
            if query in keyword.lower() or keyword.lower() in query:
                score += 8
        
        # Word matching in question
        query_words = query.split()
        question_words = q["question"].lower().split()
        matching_words = len(set(query_words) & set(question_words))
        score += matching_words * 3
        
        if score > 0:
            question_obj = SupportQuestion(**q)
            question_obj.view_count += 1  # Track views
            results.append((score, question_obj))
    
    # Sort by score (descending) and limit results
    results.sort(key=lambda x: x[0], reverse=True)
    limited_results = [item[1] for item in results[:request.limit]]
    
    return SearchResponse(
        results=limited_results,
        total_count=len(results),
        query=request.query
    )

@router.post("/questions/{question_id}/helpful")
async def vote_helpful(question_id: str, request: HelpfulVoteRequest):
    """Vote on whether a question was helpful"""
    question = next((q for q in knowledge_base["questions"] if q["id"] == question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Update helpful count
    if request.helpful:
        question["helpful_count"] += 1
    
    # Track vote for analytics
    vote_key = f"{question_id}_{request.helpful}"
    if vote_key not in knowledge_base["analytics"]["helpful_votes"]:
        knowledge_base["analytics"]["helpful_votes"][vote_key] = 0
    knowledge_base["analytics"]["helpful_votes"][vote_key] += 1
    
    return {"message": "Vote recorded", "helpful_count": question["helpful_count"]}

# Support Ticket Endpoints
@router.post("/tickets", response_model=SupportTicketResponse)
async def create_ticket(request: SupportTicketRequest):
    """Create a new support ticket and send emails"""
    try:
        # Use library function instead of inline implementation
        result = create_support_ticket(
            user_email=request.user_email,
            subject=request.subject,
            message=request.message,
            category=request.category,
            priority=request.priority,
            user_context=request.user_context,
            conversation_history=request.conversation_history
        )
        
        return SupportTicketResponse(
            success=result["success"],
            ticket_id=result.get("ticket_id"),
            message=result["message"],
            error=result.get("error")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create ticket: {str(e)}")

@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    """Get ticket details by ID"""
    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.get("/tickets")
async def list_tickets(limit: int = 20):
    """List recent support tickets"""
    tickets = list_recent_tickets(limit)
    return {"tickets": tickets, "count": len(tickets)}

@router.get("/ticket-categories")
async def get_ticket_categories():
    """Get available ticket categories"""
    return {
        "categories": [
            {"id": "trading_platform", "name": "Trading Platform Issues", "description": "Import trades, connection problems, and data sync issues"},
            {"id": "app_navigation", "name": "App Navigation", "description": "How to use dashboard, journal, analytics, and other features"},
            {"id": "account_billing", "name": "Account & Billing", "description": "Subscription management, payments, and account settings"},
            {"id": "trading_education", "name": "Trading Education", "description": "Learn about trading concepts, risk management, and best practices"},
            {"id": "technical_issues", "name": "Technical Issues", "description": "Login problems, performance issues, and troubleshooting"},
            {"id": "general", "name": "General Inquiry", "description": "Other questions or feedback"}
        ]
    }
