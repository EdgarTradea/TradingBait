from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.auth import AuthorizedUser
from datetime import datetime, timedelta
from firebase_admin import firestore

router = APIRouter()

class FeatureUnlockStatus(BaseModel):
    journal_count: int
    trade_count: int
    feature_unlocks: Dict[str, bool]
    requirements: Dict[str, int]
    
def count_journal_entries(user_id: str) -> int:
    """Count journal entries from Firestore"""
    try:
        db_firestore = firestore.client()
        entries_ref = db_firestore.collection(f"journal_entries/{user_id}/entries")
        return len(list(entries_ref.stream()))
    except Exception as e:
        return 0

def count_imported_trades(user_id: str) -> int:
    """Count imported trades from Firestore evaluations system"""
    total_trades = 0
    
    # Count from new evaluation structure
    try:
        db_firestore = firestore.client()
        
        # Get all evaluations for the user
        evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
        evaluations = evaluations_ref.stream()
        
        # Count trades from all evaluations
        for evaluation_doc in evaluations:
            evaluation_id = evaluation_doc.id
            trades_ref = db_firestore.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades")
            trades_docs = list(trades_ref.stream())
            evaluation_trades_count = len(trades_docs)
            total_trades += evaluation_trades_count
            pass
            
        pass
    except Exception as e:
        pass
    
    return total_trades

@router.get("/feature-unlock-status", response_model=FeatureUnlockStatus)
def get_feature_unlock_status(user: AuthorizedUser) -> FeatureUnlockStatus:
    """Get feature unlock status based on user activity"""
    
    try:
        user_id = user.sub
        pass
        
        # Count journal entries and trades
        journal_count = count_journal_entries(user_id)
        trade_count = count_imported_trades(user_id)
        
        # Define requirements
        requirements = {
            "journal_entries": 5,
            "trades": 5
        }
        
        # Determine feature unlocks
        ai_coach_basic_unlocked = journal_count >= requirements["journal_entries"] and trade_count >= requirements["trades"]
        ai_coach_full_unlocked = journal_count >= requirements["journal_entries"] and trade_count >= requirements["trades"]
        
        feature_unlocks = {
            "ai_coach_basic": ai_coach_basic_unlocked,
            "ai_coach_full": ai_coach_full_unlocked
        }
        
        pass
        
        return FeatureUnlockStatus(
            journal_count=journal_count,
            trade_count=trade_count,
            feature_unlocks=feature_unlocks,
            requirements=requirements
        )
        
    except Exception as e:
        pass
        # Return safe defaults
        return FeatureUnlockStatus(
            journal_count=0,
            trade_count=0,
            feature_unlocks={
                "ai_coach_basic": False,
                "ai_coach_full": False
            },
            requirements={
                "journal_entries": 5,
                "trades": 5
            }
        )