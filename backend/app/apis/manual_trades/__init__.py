


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_admin import firestore
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import re

# Import trial management functions
from app.apis.trial_management import check_trial_usage_limit, update_trial_usage
from app.auth import AuthorizedUser

router = APIRouter(prefix="/manual-trades")

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

class ManualTradeRequest(BaseModel):
    # Basic trade details
    symbol: str
    trade_type: str  # "buy" or "sell"
    direction: str   # "long" or "short"
    quantity: float
    
    # Pricing and timing
    entry_price: float
    exit_price: Optional[float] = None
    pnl: Optional[float] = None  # User-provided P&L value
    open_time: str  # ISO datetime string
    close_time: Optional[str] = None  # ISO datetime string
    
    # Optional financial details
    commission: Optional[float] = 0.0
    swap: Optional[float] = 0.0
    
    # Rich metadata
    notes: Optional[str] = None  # Rich text content
    custom_tags: Optional[List[str]] = None
    chart_image_ids: Optional[List[str]] = None  # References to uploaded images
    
    # Evaluation context
    evaluation_id: str
    
    # Additional metadata
    strategy: Optional[str] = None
    market_conditions: Optional[str] = None
    emotions_before: Optional[str] = None
    emotions_after: Optional[str] = None
    lessons_learned: Optional[str] = None

class ManualTradeResponse(BaseModel):
    success: bool
    trade_id: str
    message: str
    trade_data: Optional[Dict[str, Any]] = None

class TagSuggestion(BaseModel):
    tag: str
    usage_count: int

@router.post("/create")
async def create_manual_trade(trade_request: ManualTradeRequest, user: AuthorizedUser) -> ManualTradeResponse:
    """Create a new manual trade entry with rich metadata"""
    try:
        # Check trial usage limits before creating trade
        can_create, remaining = check_trial_usage_limit(user.sub, "trades")
        if not can_create:
            raise HTTPException(
                status_code=403, 
                detail="Trial limit reached. You can create up to 50 trades during your 7-day trial. Please upgrade to continue adding trades."
            )
        
        db_firestore = firestore.client()
        
        # Generate unique trade ID
        trade_id = f"manual_{uuid.uuid4().hex[:12]}"
        
        # Calculate P&L - prioritize user-provided value, fallback to calculation
        pnl = 0.0
        if trade_request.pnl is not None:
            # Use the user-provided P&L value directly
            pnl = trade_request.pnl
        elif trade_request.exit_price is not None:
            # Calculate P&L only if user didn't provide one
            if trade_request.direction.lower() == "long":
                pnl = (trade_request.exit_price - trade_request.entry_price) * trade_request.quantity
            else:  # short
                pnl = (trade_request.entry_price - trade_request.exit_price) * trade_request.quantity
            
            # Subtract commission and swap from calculated P&L
            pnl -= (trade_request.commission or 0.0)
            pnl -= (trade_request.swap or 0.0)
        
        # Prepare trade data structure
        trade_data = {
            "id": trade_id,
            "symbol": trade_request.symbol,
            "type": trade_request.trade_type,
            "direction": trade_request.direction,
            "lots": trade_request.quantity,
            "openPrice": trade_request.entry_price,
            "closePrice": trade_request.exit_price,
            "openTime": trade_request.open_time,
            "closeTime": trade_request.close_time,
            "pnl": pnl,
            "commission": trade_request.commission or 0.0,
            "swap": trade_request.swap or 0.0,
            "accountId": trade_request.evaluation_id,  # Link to evaluation
            "tags": trade_request.custom_tags or [],
            
            # Manual trade specific fields
            "isManualEntry": True,
            "notes": trade_request.notes,
            "chartImageIds": trade_request.chart_image_ids or [],
            "strategy": trade_request.strategy,
            "marketConditions": trade_request.market_conditions,
            "emotionsBefore": trade_request.emotions_before,
            "emotionsAfter": trade_request.emotions_after,
            "lessonsLearned": trade_request.lessons_learned,
            
            # Metadata
            "createdAt": datetime.now().isoformat(),
            "createdBy": user.sub,
            "lastModified": datetime.now().isoformat(),
            "source": "manual_entry"
        }
        
        # Save to Firestore under the evaluation's trades collection
        evaluation_ref = db_firestore.collection(f"users/{user.sub}/evaluations/{trade_request.evaluation_id}/trades")
        trade_ref = evaluation_ref.document(trade_id)
        trade_ref.set(trade_data)
        
        # Update trial usage after successful creation
        update_trial_usage(user.sub, "trades", 1)
        pass
        
        # Update tag usage statistics
        if trade_request.custom_tags:
            await update_tag_usage(user.sub, trade_request.custom_tags)
        
        return ManualTradeResponse(
            success=True,
            trade_id=trade_id,
            message="Manual trade created successfully",
            trade_data=trade_data
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to create manual trade")

@router.get("/tag-suggestions")
async def get_tag_suggestions(user: AuthorizedUser) -> List[TagSuggestion]:
    """Get tag suggestions based on user's previous tag usage"""
    try:
        db_firestore = firestore.client()
        
        # Get tag usage statistics
        tag_stats_ref = db_firestore.collection(f"users/{user.sub}/metadata").document("tag_usage")
        tag_stats_doc = tag_stats_ref.get()
        
        if not tag_stats_doc.exists:
            return []
        
        tag_stats = tag_stats_doc.to_dict() or {}
        
        # Convert to list and sort by usage count
        suggestions = [
            TagSuggestion(tag=tag, usage_count=count)
            for tag, count in tag_stats.items()
        ]
        
        suggestions.sort(key=lambda x: x.usage_count, reverse=True)
        
        # Return top 20 most used tags
        return suggestions[:20]
        
    except Exception as e:
        pass
        return []

async def update_tag_usage(user_id: str, tags: List[str]):
    """Update tag usage statistics for suggestions"""
    try:
        db_firestore = firestore.client()
        tag_stats_ref = db_firestore.collection(f"users/{user_id}/metadata").document("tag_usage")
        
        # Get current stats
        tag_stats_doc = tag_stats_ref.get()
        current_stats = tag_stats_doc.to_dict() if tag_stats_doc.exists else {}
        
        # Update counts
        for tag in tags:
            current_stats[tag] = current_stats.get(tag, 0) + 1
        
        # Save updated stats
        tag_stats_ref.set(current_stats)
        
    except Exception as e:
        pass

@router.put("/update/{trade_id}")
async def update_manual_trade(trade_id: str, trade_request: ManualTradeRequest, user: AuthorizedUser) -> ManualTradeResponse:
    """Update an existing manual trade"""
    try:
        db_firestore = firestore.client()
        
        # Find the trade in the user's evaluations
        evaluation_ref = db_firestore.collection(f"users/{user.sub}/evaluations/{trade_request.evaluation_id}/trades")
        trade_ref = evaluation_ref.document(trade_id)
        trade_doc = trade_ref.get()
        
        if not trade_doc.exists:
            raise HTTPException(status_code=404, detail="Trade not found")
        
        # Verify it's a manual trade and owned by the user
        trade_data = trade_doc.to_dict()
        if not trade_data.get("isManualEntry") or trade_data.get("createdBy") != user.sub:
            raise HTTPException(status_code=403, detail="Cannot update this trade")
        
        # Calculate updated P&L - prioritize user-provided value, fallback to calculation
        pnl = 0.0
        if trade_request.pnl is not None:
            # Use the user-provided P&L value directly
            pnl = trade_request.pnl
        elif trade_request.exit_price is not None:
            # Calculate P&L only if user didn't provide one
            if trade_request.direction.lower() == "long":
                pnl = (trade_request.exit_price - trade_request.entry_price) * trade_request.quantity
            else:  # short
                pnl = (trade_request.entry_price - trade_request.exit_price) * trade_request.quantity
            
            # Subtract commission and swap from calculated P&L
            pnl -= (trade_request.commission or 0.0)
            pnl -= (trade_request.swap or 0.0)
        
        # Prepare updated data
        updated_data = {
            "symbol": trade_request.symbol,
            "type": trade_request.trade_type,
            "direction": trade_request.direction,
            "lots": trade_request.quantity,
            "openPrice": trade_request.entry_price,
            "closePrice": trade_request.exit_price,
            "openTime": trade_request.open_time,
            "closeTime": trade_request.close_time,
            "pnl": pnl,
            "commission": trade_request.commission or 0.0,
            "swap": trade_request.swap or 0.0,
            "tags": trade_request.custom_tags or [],
            "notes": trade_request.notes,
            "chartImageIds": trade_request.chart_image_ids or [],
            "strategy": trade_request.strategy,
            "marketConditions": trade_request.market_conditions,
            "emotionsBefore": trade_request.emotions_before,
            "emotionsAfter": trade_request.emotions_after,
            "lessonsLearned": trade_request.lessons_learned,
            "lastModified": datetime.now().isoformat()
        }
        
        # Update the trade
        trade_ref.update(updated_data)
        
        # Update tag usage if tags changed
        if trade_request.custom_tags:
            await update_tag_usage(user.sub, trade_request.custom_tags)
        
        # Get the updated trade data
        updated_trade_doc = trade_ref.get()
        updated_trade_data = updated_trade_doc.to_dict()
        
        return ManualTradeResponse(
            success=True,
            trade_id=trade_id,
            message="Manual trade updated successfully",
            trade_data=updated_trade_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to update manual trade")

@router.delete("/delete/{trade_id}")
async def delete_manual_trade(trade_id: str, evaluation_id: str, user: AuthorizedUser):
    """Delete a manual trade"""
    try:
        db_firestore = firestore.client()
        
        # Find the trade
        evaluation_ref = db_firestore.collection(f"users/{user.sub}/evaluations/{evaluation_id}/trades")
        trade_ref = evaluation_ref.document(trade_id)
        trade_doc = trade_ref.get()
        
        if not trade_doc.exists:
            raise HTTPException(status_code=404, detail="Trade not found")
        
        # Verify it's a manual trade and owned by the user
        trade_data = trade_doc.to_dict()
        if not trade_data.get("isManualEntry") or trade_data.get("createdBy") != user.sub:
            raise HTTPException(status_code=403, detail="Cannot delete this trade")
        
        # Delete the trade
        trade_ref.delete()
        
        return {
            "success": True,
            "message": "Manual trade deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to delete manual trade")
