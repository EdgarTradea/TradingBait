from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from app.auth import AuthorizedUser

router = APIRouter(prefix="/public-data")

# Initialize Firebase
initialize_firebase()

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
        # Get user's trades from Firestore
        db_firestore = firestore.client()
        all_trades = []
        evals = db_firestore.collection(f"users/{user_id}/evaluations").stream()
        for eval_doc in evals:
            trade_docs = db_firestore.collection(f"users/{user_id}/evaluations/{eval_doc.id}/trades").stream()
            for trade_doc in trade_docs:
                all_trades.append(trade_doc.to_dict())
        trades_data = all_trades
        
        return PublicTradesResponse(trades=trades_data)
        
    except Exception as e:
        pass
        return PublicTradesResponse(trades=[])

@router.get("/evaluations/{user_id}")
async def get_user_evaluations(user_id: str) -> PublicEvaluationsResponse:
    """Get user's evaluations for public dashboard (no auth required)"""
    
    try:
        # Get user's evaluations from Firestore
        db_firestore = firestore.client()
        eval_docs = db_firestore.collection(f"users/{user_id}/evaluations").stream()
        evaluations_data = [doc.to_dict() for doc in eval_docs]
        
        return PublicEvaluationsResponse(evaluations=evaluations_data)
        
    except Exception as e:
        pass
        return PublicEvaluationsResponse(evaluations=[])

@router.get("/journal/{user_id}")
async def get_user_journal_entries(user_id: str) -> PublicJournalResponse:
    """Get user's journal entries for public dashboard (no auth required)"""
    
    try:
        # Get user's journal entries from Firestore
        db_firestore = firestore.client()
        journal_docs = db_firestore.collection("journal_entries").document(user_id).collection("entries").stream()
        journal_data = [doc.to_dict() for doc in journal_docs]
        
        return PublicJournalResponse(entries=journal_data)
        
    except Exception as e:
        pass
        return PublicJournalResponse(entries=[])
