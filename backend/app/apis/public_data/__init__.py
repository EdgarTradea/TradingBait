from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import databutton as db
from app.auth import AuthorizedUser

router = APIRouter(prefix="/public-data")

class PublicTradesResponse(BaseModel):
    trades: List[dict]

class PublicEvaluationsResponse(BaseModel):
    evaluations: List[dict]

class PublicJournalResponse(BaseModel):
    entries: List[dict]

@router.get("/trades/{user_id}")
async def get_user_trades(user_id: str) -> PublicTradesResponse:
    """Get user's trades for public dashboard (no auth required)"""
    
    try:
        # Get user's trades from storage
        trades_data = db.storage.json.get(f"trades_{user_id}", default=[])
        
        return PublicTradesResponse(trades=trades_data)
        
    except Exception as e:
        print(f"Error getting user trades: {e}")
        return PublicTradesResponse(trades=[])

@router.get("/evaluations/{user_id}")
async def get_user_evaluations(user_id: str) -> PublicEvaluationsResponse:
    """Get user's evaluations for public dashboard (no auth required)"""
    
    try:
        # Get user's evaluations from storage
        evaluations_data = db.storage.json.get(f"evaluations_{user_id}", default=[])
        
        return PublicEvaluationsResponse(evaluations=evaluations_data)
        
    except Exception as e:
        print(f"Error getting user evaluations: {e}")
        return PublicEvaluationsResponse(evaluations=[])

@router.get("/journal/{user_id}")
async def get_user_journal_entries(user_id: str) -> PublicJournalResponse:
    """Get user's journal entries for public dashboard (no auth required)"""
    
    try:
        # Get user's journal entries from storage
        journal_data = db.storage.json.get(f"journal_entries_{user_id}", default=[])
        
        return PublicJournalResponse(entries=journal_data)
        
    except Exception as e:
        print(f"Error getting user journal entries: {e}")
        return PublicJournalResponse(entries=[])
