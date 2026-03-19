from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
import databutton as db
from app.auth import AuthorizedUser
from datetime import datetime, timedelta
import re
from firebase_admin import firestore

router = APIRouter()

class FeatureUnlockStatus(BaseModel):
    journal_count: int
    trade_count: int
    feature_unlocks: Dict[str, bool]
    requirements: Dict[str, int]
    
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def count_journal_entries(user_id: str) -> int:
    """Count journal entries from both journal systems"""
    total_count = 0
    
    # Count from old journal system (journal-entry format)
    try:
        files = db.storage.json.list()
        old_journal_count = len([f for f in files if f.name.startswith("journal_entry_")])
        total_count += old_journal_count
        print(f"Found {old_journal_count} entries in old journal system")
    except Exception as e:
        print(f"Error counting old journal entries: {e}")
    
    # Count from new trading journal system (user-specific)
    try:
        # Try the authenticated user's entries
        journal_key = sanitize_storage_key(f"journal_entries_{user_id}")
        journal_entries = db.storage.json.get(journal_key, default=[])
        new_journal_count = len(journal_entries) if isinstance(journal_entries, list) else 0
        total_count += new_journal_count
        print(f"Found {new_journal_count} entries in new journal system for user {user_id}")
    except Exception as e:
        print(f"Error counting new journal entries: {e}")
    
    # Also check for individual date-based entries in new system
    try:
        date_based_count = 0
        # Check last 90 days for date-based entries
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)
        current_date = start_date
        
        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            entry_key = sanitize_storage_key(f"journal_{user_id}_{date_str}")
            try:
                entry_data = db.storage.json.get(entry_key, default=None)
                if entry_data:
                    date_based_count += 1
            except Exception:
                pass
            current_date += timedelta(days=1)
        
        total_count += date_based_count
        print(f"Found {date_based_count} date-based entries for user {user_id}")
    except Exception as e:
        print(f"Error counting date-based journal entries: {e}")
    
    return total_count

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
            print(f"Found {evaluation_trades_count} trades in evaluation {evaluation_id}")
            
        print(f"Total trades found across all evaluations: {total_trades}")
    except Exception as e:
        print(f"Error counting trades from evaluations: {e}")
    
    return total_trades

@router.get("/feature-unlock-status", response_model=FeatureUnlockStatus)
def get_feature_unlock_status(user: AuthorizedUser) -> FeatureUnlockStatus:
    """Get feature unlock status based on user activity"""
    
    try:
        user_id = user.sub
        print(f"Checking feature unlock status for user: {user_id}")
        
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
        
        print(f"Feature unlock status - Journal: {journal_count}, Trades: {trade_count}, Basic: {ai_coach_basic_unlocked}, Full: {ai_coach_full_unlocked}")
        
        return FeatureUnlockStatus(
            journal_count=journal_count,
            trade_count=trade_count,
            feature_unlocks=feature_unlocks,
            requirements=requirements
        )
        
    except Exception as e:
        print(f"Error getting feature unlock status: {e}")
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