
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth import AuthorizedUser
from firebase_admin import firestore

router = APIRouter()

class DeleteAccountTradesRequest(BaseModel):
    account_id: str

class DeleteAccountTradesResponse(BaseModel):
    success: bool
    message: str
    deleted_count: int

class DeleteAllTradesResponse(BaseModel):
    success: bool
    message: str
    deleted_count: int

@router.delete("/trades/account")
async def delete_account_trades(request: DeleteAccountTradesRequest, user: AuthorizedUser) -> DeleteAccountTradesResponse:
    """
    Delete all trades for a specific account/evaluation
    """
    try:
        db = firestore.client()
        
        # Query trades for the specific account and user
        trades_query = (
            db.collection("trades")
            .where(filter=firestore.FieldFilter("userId", "==", user.sub))
            .where(filter=firestore.FieldFilter("accountId", "==", request.account_id))
        )
        
        trades_docs = trades_query.get()
        deleted_count = 0
        
        # Delete each trade document
        for trade_doc in trades_docs:
            trade_doc.reference.delete()
            deleted_count += 1
        
        return DeleteAccountTradesResponse(
            success=True,
            message=f"Successfully deleted {deleted_count} trades from account {request.account_id}",
            deleted_count=deleted_count
        )
        
    except Exception as e:
        pass
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete trades for account: {str(e)}"
        )

@router.delete("/trades/all")
async def delete_all_user_trades(user: AuthorizedUser) -> DeleteAllTradesResponse:
    """
    Delete all trades for the authenticated user across all accounts
    """
    try:
        db = firestore.client()
        
        # Query all trades for the user
        trades_query = (
            db.collection("trades")
            .where("userId", "==", user.sub)
        )
        
        trades_docs = trades_query.get()
        deleted_count = 0
        
        # Delete each trade document
        for trade_doc in trades_docs:
            trade_doc.reference.delete()
            deleted_count += 1
        
        return DeleteAllTradesResponse(
            success=True,
            message=f"Successfully deleted all {deleted_count} trades",
            deleted_count=deleted_count
        )
        
    except Exception as e:
        pass
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete all trades: {str(e)}"
        )
