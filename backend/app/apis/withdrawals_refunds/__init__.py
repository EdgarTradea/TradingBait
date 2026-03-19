from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.auth import AuthorizedUser
import uuid
import firebase_admin
from firebase_admin import credentials, firestore
from app.libs.firebase_init import initialize_firebase
import json
import os

router = APIRouter()

# Initialize Firebase
initialize_firebase()

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class WithdrawalRequest(BaseModel):
    evaluationId: str
    amount: float
    reason: Optional[str] = None
    description: Optional[str] = None

class RefundRequest(BaseModel):
    evaluationId: str
    amount: float
    reason: str
    description: Optional[str] = None

class Transaction(BaseModel):
    id: str
    evaluationId: str
    type: str  # "withdrawal", "refund", "deposit"
    amount: float
    reason: Optional[str] = None
    description: Optional[str] = None
    status: str  # "requested", "processed", "completed", "failed"
    requestedAt: str
    processedAt: Optional[str] = None
    completedAt: Optional[str] = None
    userId: str
    accountId: str
    evaluationType: str  # "challenge", "funded"
    firmName: str

class WithdrawalResponse(BaseModel):
    success: bool
    transaction: Transaction
    message: str
    newBalance: Optional[float] = None

class RefundResponse(BaseModel):
    success: bool
    transaction: Transaction
    message: str
    businessImpact: Dict[str, float]  # P&L impact tracking

class FinancialSummary(BaseModel):
    totalWithdrawals: float
    totalRefunds: float
    netBusinessRevenue: float  # Evaluation revenue minus refunds
    totalCashFlow: float  # Net cash flow after withdrawals
    period: str  # "monthly", "quarterly", "yearly"
    startDate: str
    endDate: str

class TransactionHistory(BaseModel):
    transactions: List[Transaction]
    totalCount: int
    summary: Dict[str, float]

# ============================================================================
# WITHDRAWAL ENDPOINTS (FUNDED ACCOUNTS ONLY)
# ============================================================================

@router.post("/withdrawals", response_model=WithdrawalResponse)
async def create_withdrawal(request: WithdrawalRequest, user: AuthorizedUser):
    """
    Create a withdrawal request for funded accounts.
    Immediate processing - no approval workflow.
    """
    try:
        user_id = user.sub
        db_firestore = firebase_admin.firestore.client()
        
        # Validate evaluation exists and is funded
        evaluation_ref = db_firestore.document(f"users/{user_id}/evaluations/{request.evaluationId}")
        evaluation_doc = evaluation_ref.get()
        
        if not evaluation_doc.exists:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        evaluation_data = evaluation_doc.to_dict()
        
        # Check if evaluation is funded account
        if evaluation_data.get("accountType") != "funded":
            raise HTTPException(
                status_code=400, 
                detail="Withdrawals are only available for funded accounts"
            )
        
        # Validate withdrawal amount
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")
        
        # Calculate current balance from initialBalance + transactions
        initial_balance = evaluation_data.get("initialBalance", 0)
        existing_transactions = evaluation_data.get("transactions", [])
        
        # Calculate balance from transactions
        transaction_balance = 0
        for trans in existing_transactions:
            if trans.get("type") == "deposit":
                transaction_balance += trans.get("amount", 0)
            elif trans.get("type") == "withdrawal":
                transaction_balance -= trans.get("amount", 0)
        
        current_balance = initial_balance + transaction_balance
        
        if request.amount > current_balance:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient funds. Available balance: ${current_balance:,.2f}"
            )
        
        # Create transaction record
        transaction_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        transaction = Transaction(
            id=transaction_id,
            evaluationId=request.evaluationId,
            type="withdrawal",
            amount=request.amount,
            reason=request.reason,
            description=request.description,
            status="processed",  # Immediate processing
            requestedAt=now,
            processedAt=now,
            completedAt=now,  # Immediate completion for manual processing
            userId=user_id,
            accountId=evaluation_data.get("accountId", ""),
            evaluationType="funded",
            firmName=evaluation_data.get("firm", "Unknown")
        )
        
        # Save transaction to Firestore
        transaction_ref = db_firestore.collection(f"users/{user_id}/transactions").document(transaction_id)
        transaction_ref.set(transaction.dict())
        
        # Update evaluation balance and add to transactions array
        new_balance = current_balance - request.amount
        
        # Get existing transactions array
        existing_transactions = evaluation_data.get("transactions", [])
        
        # Add new withdrawal transaction
        withdrawal_transaction = {
            "type": "withdrawal",
            "amount": request.amount,
            "date": now,
            "description": request.description or f"Withdrawal: ${request.amount:,.2f}"
        }
        existing_transactions.append(withdrawal_transaction)
        
        # Update evaluation
        evaluation_ref.update({
            "balance": new_balance,
            "transactions": existing_transactions,
            "updatedAt": now
        })
        
        return WithdrawalResponse(
            success=True,
            transaction=transaction,
            message=f"Withdrawal of ${request.amount:,.2f} processed successfully",
            newBalance=new_balance
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to process withdrawal")

@router.delete("/withdrawals/{transaction_id}")
async def delete_withdrawal(transaction_id: str, user: AuthorizedUser):
    """
    Delete a withdrawal transaction and restore the amount to evaluation balance.
    Only allows deletion of recent transactions (within 48 hours).
    """
    try:
        user_id = user.sub
        db_firestore = firebase_admin.firestore.client()
        
        # Get the transaction
        transaction_ref = db_firestore.document(f"users/{user_id}/transactions/{transaction_id}")
        transaction_doc = transaction_ref.get()
        
        if not transaction_doc.exists:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        transaction_data = transaction_doc.to_dict()
        
        # Validate transaction type
        if transaction_data.get("type") != "withdrawal":
            raise HTTPException(status_code=400, detail="Transaction is not a withdrawal")
        
        # Validate ownership
        if transaction_data.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized to delete this transaction")
        
        # Check if transaction is recent (within 48 hours)
        requested_at = transaction_data.get("requestedAt")
        if requested_at:
            requested_time = datetime.fromisoformat(requested_at.replace('Z', '+00:00'))
            time_diff = datetime.now().replace(tzinfo=requested_time.tzinfo) - requested_time
            if time_diff.total_seconds() > 48 * 3600:  # 48 hours in seconds
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot delete withdrawals older than 48 hours"
                )
        
        # Get evaluation to update balance
        evaluation_id = transaction_data.get("evaluationId")
        evaluation_ref = db_firestore.document(f"users/{user_id}/evaluations/{evaluation_id}")
        evaluation_doc = evaluation_ref.get()
        
        if not evaluation_doc.exists:
            raise HTTPException(status_code=404, detail="Associated evaluation not found")
        
        evaluation_data = evaluation_doc.to_dict()
        withdrawal_amount = transaction_data.get("amount", 0)
        
        # Restore balance
        current_balance = evaluation_data.get("balance", 0)
        new_balance = current_balance + withdrawal_amount
        
        # Remove withdrawal from transactions array
        existing_transactions = evaluation_data.get("transactions", [])
        updated_transactions = [
            trans for trans in existing_transactions 
            if not (trans.get("type") == "withdrawal" and 
                   trans.get("amount") == withdrawal_amount and
                   trans.get("date") == requested_at)
        ]
        
        # Update evaluation
        evaluation_ref.update({
            "balance": new_balance,
            "transactions": updated_transactions,
            "updatedAt": datetime.now().isoformat()
        })
        
        # Delete the transaction record
        transaction_ref.delete()
        
        return {
            "success": True,
            "message": f"Withdrawal of ${withdrawal_amount:,.2f} deleted successfully",
            "restoredAmount": withdrawal_amount,
            "newBalance": new_balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to delete withdrawal")

# ============================================================================
# REFUND ENDPOINTS (EVALUATION COSTS)
# ============================================================================

@router.post("/refunds", response_model=RefundResponse)
async def create_refund(request: RefundRequest, user: AuthorizedUser):
    """
    Create a refund for evaluation costs.
    Immediate processing - no approval workflow.
    Impacts business P&L as cost mitigation.
    """
    try:
        user_id = user.sub
        db_firestore = firebase_admin.firestore.client()
        
        # Validate evaluation exists
        evaluation_ref = db_firestore.document(f"users/{user_id}/evaluations/{request.evaluationId}")
        evaluation_doc = evaluation_ref.get()
        
        if not evaluation_doc.exists:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        evaluation_data = evaluation_doc.to_dict()
        
        # Validate refund amount doesn't exceed evaluation cost
        evaluation_cost = evaluation_data.get("cost", 0)
        if request.amount > evaluation_cost:
            raise HTTPException(
                status_code=400, 
                detail=f"Refund amount cannot exceed evaluation cost of ${evaluation_cost:,.2f}"
            )
        
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Refund amount must be positive")
        
        # Create transaction record
        transaction_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        transaction = Transaction(
            id=transaction_id,
            evaluationId=request.evaluationId,
            type="refund",
            amount=request.amount,
            reason=request.reason,
            description=request.description,
            status="processed",  # Immediate processing
            requestedAt=now,
            processedAt=now,
            completedAt=now,  # Immediate completion for manual processing
            userId=user_id,
            accountId=evaluation_data.get("accountId", ""),
            evaluationType=evaluation_data.get("type", "challenge"),
            firmName=evaluation_data.get("firm", "Unknown")
        )
        
        # Save transaction to Firestore
        transaction_ref = db_firestore.collection(f"users/{user_id}/transactions").document(transaction_id)
        transaction_ref.set(transaction.dict())
        
        # Update evaluation transactions array
        existing_transactions = evaluation_data.get("transactions", [])
        
        # Add new refund transaction
        refund_transaction = {
            "type": "refund",
            "amount": request.amount,
            "date": now,
            "description": request.description or f"Refund: ${request.amount:,.2f} - {request.reason}"
        }
        existing_transactions.append(refund_transaction)
        
        # Update evaluation
        evaluation_ref.update({
            "transactions": existing_transactions,
            "updatedAt": now
        })
        
        # Calculate business impact
        business_impact = {
            "refund_amount": request.amount,
            "revenue_impact": -request.amount,  # Negative impact on revenue
            "evaluation_cost": evaluation_cost,
            "net_revenue_from_evaluation": evaluation_cost - request.amount
        }
        
        return RefundResponse(
            success=True,
            transaction=transaction,
            message=f"Refund of ${request.amount:,.2f} processed successfully",
            businessImpact=business_impact
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to process refund")

@router.delete("/refunds/{transaction_id}")
async def delete_refund(transaction_id: str, user: AuthorizedUser):
    """
    Delete a refund transaction and remove it from evaluation transactions.
    Only allows deletion of recent transactions (within 48 hours).
    """
    try:
        user_id = user.sub
        db_firestore = firebase_admin.firestore.client()
        
        # Get the transaction
        transaction_ref = db_firestore.document(f"users/{user_id}/transactions/{transaction_id}")
        transaction_doc = transaction_ref.get()
        
        if not transaction_doc.exists:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        transaction_data = transaction_doc.to_dict()
        
        # Validate transaction type
        if transaction_data.get("type") != "refund":
            raise HTTPException(status_code=400, detail="Transaction is not a refund")
        
        # Validate ownership
        if transaction_data.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized to delete this transaction")
        
        # Check if transaction is recent (within 48 hours)
        requested_at = transaction_data.get("requestedAt")
        if requested_at:
            requested_time = datetime.fromisoformat(requested_at.replace('Z', '+00:00'))
            time_diff = datetime.now().replace(tzinfo=requested_time.tzinfo) - requested_time
            if time_diff.total_seconds() > 48 * 3600:  # 48 hours in seconds
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot delete refunds older than 48 hours"
                )
        
        # Get evaluation to update transactions
        evaluation_id = transaction_data.get("evaluationId")
        evaluation_ref = db_firestore.document(f"users/{user_id}/evaluations/{evaluation_id}")
        evaluation_doc = evaluation_ref.get()
        
        if not evaluation_doc.exists:
            raise HTTPException(status_code=404, detail="Associated evaluation not found")
        
        evaluation_data = evaluation_doc.to_dict()
        refund_amount = transaction_data.get("amount", 0)
        
        # Remove refund from transactions array
        existing_transactions = evaluation_data.get("transactions", [])
        updated_transactions = [
            trans for trans in existing_transactions 
            if not (trans.get("type") == "refund" and 
                   trans.get("amount") == refund_amount and
                   trans.get("date") == requested_at)
        ]
        
        # Update evaluation
        evaluation_ref.update({
            "transactions": updated_transactions,
            "updatedAt": datetime.now().isoformat()
        })
        
        # Delete the transaction record
        transaction_ref.delete()
        
        return {
            "success": True,
            "message": f"Refund of ${refund_amount:,.2f} deleted successfully",
            "deletedAmount": refund_amount,
            "businessImpact": {
                "refund_removed": refund_amount,
                "revenue_impact": refund_amount  # Positive impact on revenue
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to delete refund")

# ============================================================================
# TRANSACTION HISTORY AND TRACKING
# ============================================================================

@router.get("/transactions", response_model=TransactionHistory)
async def get_transaction_history(user: AuthorizedUser, transaction_type: Optional[str] = None):
    """
    Get transaction history for user.
    Optional filtering by transaction type (withdrawal, refund, deposit).
    """
    try:
        user_id = user.sub
        db_firestore = firebase_admin.firestore.client()
        
        # Get all transactions for user
        transactions_ref = db_firestore.collection(f"users/{user_id}/transactions")
        
        # Apply filter if specified
        if transaction_type:
            transactions_query = transactions_ref.where("type", "==", transaction_type)
        else:
            transactions_query = transactions_ref
        
        # Order by requestedAt descending
        transactions_query = transactions_query.order_by("requestedAt", direction=firestore.Query.DESCENDING)
        
        # Get transactions
        transactions_docs = transactions_query.stream()
        
        transactions = []
        total_withdrawals = 0
        total_refunds = 0
        total_deposits = 0
        
        for doc in transactions_docs:
            transaction_data = doc.to_dict()
            transaction = Transaction(**transaction_data)
            transactions.append(transaction)
            
            # Calculate totals
            if transaction.type == "withdrawal":
                total_withdrawals += transaction.amount
            elif transaction.type == "refund":
                total_refunds += transaction.amount
            elif transaction.type == "deposit":
                total_deposits += transaction.amount
        
        summary = {
            "total_withdrawals": total_withdrawals,
            "total_refunds": total_refunds,
            "total_deposits": total_deposits,
            "net_cash_flow": total_deposits - total_withdrawals - total_refunds
        }
        
        return TransactionHistory(
            transactions=transactions,
            totalCount=len(transactions),
            summary=summary
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get transaction history")

@router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str, user: AuthorizedUser):
    """Get specific transaction details."""
    try:
        user_id = user.sub
        db_firestore = firebase_admin.firestore.client()
        
        transaction_ref = db_firestore.document(f"users/{user_id}/transactions/{transaction_id}")
        transaction_doc = transaction_ref.get()
        
        if not transaction_doc.exists:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        transaction_data = transaction_doc.to_dict()
        return Transaction(**transaction_data)
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get transaction")

# ============================================================================
# FINANCIAL ANALYTICS AND BUSINESS IMPACT
# ============================================================================

@router.get("/financial-summary", response_model=FinancialSummary)
async def get_financial_summary(
    user: AuthorizedUser, 
    period: str = "monthly",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get financial summary showing business impact of withdrawals and refunds.
    """
    try:
        user_id = user.sub
        db_firestore = firebase_admin.firestore.client()
        
        # Set date range based on period if not provided
        if not start_date or not end_date:
            now = datetime.now()
            if period == "monthly":
                start_date = now.replace(day=1).isoformat()
                end_date = now.isoformat()
            elif period == "quarterly":
                # Simple quarterly calculation
                month = now.month
                quarter_start_month = ((month - 1) // 3) * 3 + 1
                start_date = now.replace(month=quarter_start_month, day=1).isoformat()
                end_date = now.isoformat()
            elif period == "yearly":
                start_date = now.replace(month=1, day=1).isoformat()
                end_date = now.isoformat()
        
        # Get transactions in date range
        transactions_ref = db_firestore.collection(f"users/{user_id}/transactions")
        transactions_query = transactions_ref.where("requestedAt", ">=", start_date).where("requestedAt", "<=", end_date)
        transactions_docs = transactions_query.stream()
        
        total_withdrawals = 0
        total_refunds = 0
        
        for doc in transactions_docs:
            transaction_data = doc.to_dict()
            if transaction_data.get("type") == "withdrawal":
                total_withdrawals += transaction_data.get("amount", 0)
            elif transaction_data.get("type") == "refund":
                total_refunds += transaction_data.get("amount", 0)
        
        # Get total evaluation revenue (cost of all evaluations in period)
        evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
        evaluations_query = evaluations_ref.where("createdAt", ">=", start_date).where("createdAt", "<=", end_date)
        evaluations_docs = evaluations_query.stream()
        
        total_evaluation_revenue = 0
        for doc in evaluations_docs:
            evaluation_data = doc.to_dict()
            total_evaluation_revenue += evaluation_data.get("cost", 0)
        
        # Calculate business metrics
        net_business_revenue = total_evaluation_revenue - total_refunds
        total_cash_flow = net_business_revenue - total_withdrawals
        
        return FinancialSummary(
            totalWithdrawals=total_withdrawals,
            totalRefunds=total_refunds,
            netBusinessRevenue=net_business_revenue,
            totalCashFlow=total_cash_flow,
            period=period,
            startDate=start_date,
            endDate=end_date
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get financial summary")

# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def withdrawals_refunds_health_check():
    """Health check for withdrawals and refunds system."""
    return {
        "status": "healthy",
        "service": "withdrawals_refunds",
        "features": {
            "withdrawals": "Available for funded accounts",
            "refunds": "Available for evaluation costs",
            "immediate_processing": True,
            "approval_workflow": False,
            "audit_logging": True
        }
    }
