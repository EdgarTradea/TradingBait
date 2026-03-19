from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from app.libs.firebase_init import initialize_firebase
import json
import os

router = APIRouter(prefix="/repair-trades-simple")

@router.get("/test")
def test_endpoint():
    return {"status": "ok", "message": "Simple repair endpoint reachable"}

class SimpleRepairResponse(BaseModel):
    success: bool
    message: str
    trades_repaired: int

@router.post("/repair-user-trades")
async def repair_user_trades() -> SimpleRepairResponse:
    """
    Simple repair for the specific user with missing datetime fields
    """
    try:
        # Initialize Firebase
        initialize_firebase()
        
        firestore_db = firestore.client()
        
        # Target the specific user and evaluation with missing datetime
        user_id = "c5tjdjaLvSVY6XDsjVsDtyrwPg43"
        eval_id = "BhhvvMellyJLbzxRuB02"
        
        trades_ref = firestore_db.collection(f'users/{user_id}/evaluations/{eval_id}/trades')
        trades_docs = trades_ref.get()
        
        repaired_count = 0
        
        for trade_doc in trades_docs:
            trade_data = trade_doc.to_dict()
            
            # Skip if already has datetime fields
            if trade_data.get('openTime') and trade_data.get('closeTime'):
                continue
            
            # Extract datetime from raw_row_data
            raw_data = trade_data.get('raw_row_data', {})
            
            open_time = None
            close_time = None
            
            # Look for col_1_* (open time) and col_8_* (close time) patterns
            for key, value in raw_data.items():
                if isinstance(value, str) and '-' in value and ':' in value:
                    if key.startswith('col_1_'):
                        open_time = value
                    elif key.startswith('col_8_'):
                        close_time = value
            
            # Apply repair if both times found
            if open_time and close_time:
                trade_ref = firestore_db.document(f'users/{user_id}/evaluations/{eval_id}/trades/{trade_doc.id}')
                trade_ref.update({
                    'openTime': open_time,
                    'closeTime': close_time,
                    'repaired_at': datetime.now().isoformat()
                })
                repaired_count += 1
                print(f"Repaired trade {trade_doc.id}: {open_time} -> {close_time}")
        
        return SimpleRepairResponse(
            success=True,
            message=f"Successfully repaired {repaired_count} trades",
            trades_repaired=repaired_count
        )
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Repair failed: {str(e)}")
