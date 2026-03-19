
from fastapi import APIRouter, HTTPException
from firebase_admin import firestore
from pydantic import BaseModel
from app.auth import AuthorizedUser

router = APIRouter()

class DeleteResponse(BaseModel):
    success: bool
    deletedCount: int
    message: str

@router.delete("/all-trades", response_model=DeleteResponse)
async def delete_all_trades(user: AuthorizedUser):
    """Delete ALL trades for the user - both within evaluations and orphaned trades"""
    try:
        user_id = user.sub
        db_firestore = firestore.client()
        
        print(f"🗑️ Deleting ALL trades for user: {user_id}")
        
        total_deleted_trades = 0
        
        # 1. Delete trades within all evaluations (keep evaluations)
        evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
        evaluations = evaluations_ref.stream()
        
        evaluations_processed = 0
        for evaluation_doc in evaluations:
            evaluation_id = evaluation_doc.id
            print(f"🗑️ Deleting trades in evaluation {evaluation_id}")
            
            # Delete all trades in this evaluation
            trades_collection = db_firestore.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades")
            trades = trades_collection.stream()
            
            batch = db_firestore.batch()
            trades_deleted_in_evaluation = 0
            
            for trade_doc in trades:
                batch.delete(trade_doc.reference)
                trades_deleted_in_evaluation += 1
            
            if trades_deleted_in_evaluation > 0:
                batch.commit()
            
            total_deleted_trades += trades_deleted_in_evaluation
            evaluations_processed += 1
            print(f"✅ Deleted {trades_deleted_in_evaluation} trades from evaluation {evaluation_id}")
        
        # 2. Delete orphaned trades at the user level (if any exist)
        user_trades_ref = db_firestore.collection(f"users/{user_id}/trades")
        user_trades = user_trades_ref.stream()
        
        batch = db_firestore.batch()
        orphaned_trades_deleted = 0
        
        for trade_doc in user_trades:
            batch.delete(trade_doc.reference)
            orphaned_trades_deleted += 1
        
        if orphaned_trades_deleted > 0:
            batch.commit()
            print(f"✅ Deleted {orphaned_trades_deleted} orphaned trades at user level")
        
        total_deleted_trades += orphaned_trades_deleted
        
        return DeleteResponse(
            success=True,
            deletedCount=total_deleted_trades,
            message=f"Deleted {total_deleted_trades} trades total ({total_deleted_trades - orphaned_trades_deleted} from {evaluations_processed} evaluations, {orphaned_trades_deleted} orphaned trades)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting all trades: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/trades-by-account/{account_id}", response_model=DeleteResponse)
async def delete_trades_by_account(account_id: str, user: AuthorizedUser):
    """Delete all trades for a specific account ID WITHOUT deleting the evaluations"""
    try:
        user_id = user.sub
        db_firestore = firestore.client()
        
        print(f"🗑️ Deleting trades for account ID: {account_id} (user: {user_id})")
        
        # Find all evaluations for this account ID
        evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
        evaluations = evaluations_ref.where(filter=firestore.FieldFilter("accountId", "==", account_id)).stream()
        
        total_deleted_trades = 0
        evaluations_processed = 0
        
        # Delete ONLY trades in each evaluation, keep the evaluations
        for evaluation_doc in evaluations:
            evaluation_id = evaluation_doc.id
            print(f"🗑️ Deleting trades in evaluation {evaluation_id} for account {account_id}")
            
            # Delete all trades in this evaluation
            trades_collection = db_firestore.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades")
            trades = trades_collection.stream()
            
            batch = db_firestore.batch()
            trades_deleted_in_evaluation = 0
            
            for trade_doc in trades:
                batch.delete(trade_doc.reference)
                trades_deleted_in_evaluation += 1
            
            # IMPORTANT: Do NOT delete the evaluation itself - only commit trade deletions
            if trades_deleted_in_evaluation > 0:
                batch.commit()
            
            total_deleted_trades += trades_deleted_in_evaluation
            evaluations_processed += 1
            print(f"✅ Deleted {trades_deleted_in_evaluation} trades from evaluation {evaluation_id}")
        
        if evaluations_processed == 0:
            return DeleteResponse(
                success=False,
                deletedCount=0,
                message=f"No evaluations found for account ID {account_id}"
            )
        
        return DeleteResponse(
            success=True,
            deletedCount=total_deleted_trades,
            message=f"Deleted {total_deleted_trades} trades from {evaluations_processed} evaluations for account {account_id} (evaluations preserved)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting trades by account: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/trades-by-evaluation/{evaluation_id}", response_model=DeleteResponse)
async def delete_trades_by_evaluation(evaluation_id: str, user: AuthorizedUser):
    """Delete all trades for a specific evaluation WITHOUT deleting the evaluation itself"""
    try:
        user_id = user.sub
        db_firestore = firestore.client()
        
        print(f"🗑️ Deleting trades for evaluation ID: {evaluation_id} (user: {user_id})")
        
        # Check if evaluation exists
        evaluation_ref = db_firestore.collection(f"users/{user_id}/evaluations").document(evaluation_id)
        evaluation_doc = evaluation_ref.get()
        
        if not evaluation_doc.exists:
            return DeleteResponse(
                success=False,
                deletedCount=0,
                message=f"Evaluation {evaluation_id} not found"
            )
        
        # Delete all trades in this evaluation
        trades_collection = db_firestore.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades")
        trades = trades_collection.stream()
        
        batch = db_firestore.batch()
        trades_deleted = 0
        
        for trade_doc in trades:
            batch.delete(trade_doc.reference)
            trades_deleted += 1
        
        # Only commit if there are trades to delete
        if trades_deleted > 0:
            batch.commit()
            print(f"✅ Deleted {trades_deleted} trades from evaluation {evaluation_id}")
        else:
            print(f"ℹ️ No trades found in evaluation {evaluation_id}")
        
        return DeleteResponse(
            success=True,
            deletedCount=trades_deleted,
            message=f"Deleted {trades_deleted} trades from evaluation {evaluation_id} (evaluation preserved)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting trades by evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
