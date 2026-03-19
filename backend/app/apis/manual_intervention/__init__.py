


"""Manual Intervention API endpoints for trade editing, bulk operations, and manual entry"""

import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import re
import uuid

from app.auth import AuthorizedUser
from app.libs.trade_grouping_engine import TradeGroupingEngine
from app.libs.fifo_calculator import FifoCalculator
from app.apis.data_quality import (
    TradeEditRequest, BulkEditRequest, ManualTradeEntry, 
    AuditLogEntry, sanitize_storage_key
)

router = APIRouter(prefix="/manual-intervention")

class TradeEditResponse(BaseModel):
    success: bool
    trade_id: str
    changes_applied: Dict[str, Any]
    validation_warnings: List[str] = Field(default_factory=list)
    recalculated_metrics: Dict[str, Any] = Field(default_factory=dict)
    audit_log_id: str

class BulkEditResponse(BaseModel):
    success: bool
    total_trades: int
    successful_edits: int
    failed_edits: List[Dict[str, str]] = Field(default_factory=list)
    validation_warnings: List[str] = Field(default_factory=list)
    recalculated_metrics: Dict[str, Any] = Field(default_factory=dict)
    audit_log_id: str

class ManualTradeResponse(BaseModel):
    success: bool
    trade_id: str
    trade_data: Dict[str, Any]
    validation_warnings: List[str] = Field(default_factory=list)
    calculated_pnl: float
    audit_log_id: str

class TradeDeleteRequest(BaseModel):
    trade_ids: List[str]
    reason: str
    user_notes: Optional[str] = None

class TradeMergeRequest(BaseModel):
    trade_ids: List[str]
    merge_strategy: str  # "combine_positions", "average_prices", "sum_quantities"
    reason: str
    user_notes: Optional[str] = None

class TradeSplitRequest(BaseModel):
    trade_id: str
    split_ratios: List[float]  # Must sum to 1.0
    reason: str
    user_notes: Optional[str] = None

class ConflictResolutionRequest(BaseModel):
    conflict_id: str
    resolution_action: str  # "use_broker", "use_parsed", "use_custom"
    custom_value: Optional[Any] = None
    apply_to_similar: bool = False
    reason: str

class ImportReviewData(BaseModel):
    preview_trades: List[Dict[str, Any]]
    import_summary: Dict[str, Any]
    detected_issues: List[Dict[str, Any]]
    recommendations: List[str]

class ImportApprovalRequest(BaseModel):
    approved_trades: List[str]  # Trade IDs to import
    rejected_trades: List[str]  # Trade IDs to skip
    modifications: Dict[str, Dict[str, Any]]  # trade_id -> field changes
    reason: str

def calculate_trade_pnl(trade_data: Dict[str, Any]) -> float:
    """Calculate P&L for a trade based on its data"""
    try:
        quantity = float(trade_data.get('quantity', 0))
        open_price = float(trade_data.get('open_price', 0))
        close_price = float(trade_data.get('close_price', 0))
        trade_type = trade_data.get('trade_type', 'buy').lower()
        commission = float(trade_data.get('commission', 0))
        swap = float(trade_data.get('swap', 0))
        
        if trade_type == 'buy':
            gross_pnl = (close_price - open_price) * quantity
        else:  # sell
            gross_pnl = (open_price - close_price) * quantity
        
        net_pnl = gross_pnl - commission - swap
        return round(net_pnl, 2)
    except (ValueError, TypeError):
        return 0.0

def validate_trade_data(trade_data: Dict[str, Any]) -> List[str]:
    """Validate trade data and return list of warnings"""
    warnings = []
    
    # Required fields
    required_fields = ['symbol', 'quantity', 'open_price', 'close_price', 'open_time', 'close_time']
    for field in required_fields:
        if not trade_data.get(field):
            warnings.append(f"Missing required field: {field}")
    
    # Validate numeric fields
    numeric_fields = ['quantity', 'open_price', 'close_price', 'commission', 'swap']
    for field in numeric_fields:
        value = trade_data.get(field)
        if value is not None:
            try:
                float(value)
                if field in ['quantity', 'open_price', 'close_price'] and float(value) <= 0:
                    warnings.append(f"{field} must be positive")
            except (ValueError, TypeError):
                warnings.append(f"{field} must be a valid number")
    
    # Validate timestamps
    try:
        open_time = pd.to_datetime(trade_data.get('open_time'))
        close_time = pd.to_datetime(trade_data.get('close_time'))
        if close_time <= open_time:
            warnings.append("Close time must be after open time")
    except Exception:
        warnings.append("Invalid timestamp format")
    
    return warnings

def create_audit_log(action_type: str, user_id: str, affected_trades: List[str], 
                    changes: Dict[str, Any], reason: str, notes: Optional[str] = None) -> str:
    """Create audit log entry and return audit ID"""
    audit_id = str(uuid.uuid4())

    audit_entry = AuditLogEntry(
        action_id=audit_id,
        action_type=action_type,
        user_id=user_id,
        affected_trades=affected_trades,
        changes_made=changes,
        timestamp=datetime.now().isoformat(),
        reason=reason,
        user_notes=notes
    )

    try:
        from firebase_admin import firestore
        db_firestore = firestore.client()
        db_firestore.collection("users").document(user_id).collection("audit_log").document(audit_id).set(audit_entry.dict())
    except Exception:
        pass

    return audit_id

@router.post("/edit-trade", response_model=TradeEditResponse)
async def edit_trade(request: TradeEditRequest, user: AuthorizedUser):
    """Edit a single trade with validation and audit trail"""
    try:
        from firebase_admin import firestore
        db_firestore = firestore.client()
        user_id = user.sub
        
        # Find the trade across all evaluations
        trade_ref = None
        evaluation_id = None
        
        evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
        evaluations = evaluations_ref.stream()
        
        for eval_doc in evaluations:
            eval_id = eval_doc.id
            trade_doc_ref = db_firestore.document(f"users/{user_id}/evaluations/{eval_id}/trades/{request.trade_id}")
            trade_doc = trade_doc_ref.get()
            
            if trade_doc.exists:
                trade_ref = trade_doc_ref
                evaluation_id = eval_id
                break
        
        if not trade_ref:
            raise HTTPException(status_code=404, detail="Trade not found")
        
        # Get current trade data
        current_trade = trade_ref.get().to_dict()
        
        # Validate the updates
        updated_trade = {**current_trade, **request.field_updates}
        warnings = validate_trade_data(updated_trade)
        
        # Calculate new P&L if price/quantity fields changed
        recalculated_metrics = {}
        if any(field in request.field_updates for field in ['open_price', 'close_price', 'quantity', 'commission', 'swap']):
            new_pnl = calculate_trade_pnl(updated_trade)
            request.field_updates['pnl'] = new_pnl
            recalculated_metrics['recalculated_pnl'] = new_pnl
            recalculated_metrics['original_pnl'] = current_trade.get('pnl', 0)
        
        # Update the trade
        trade_ref.update(request.field_updates)
        
        # Create audit log
        audit_id = create_audit_log(
            action_type="edit",
            user_id=user_id,
            affected_trades=[request.trade_id],
            changes=request.field_updates,
            reason=request.reason,
            notes=request.user_notes
        )
        
        return TradeEditResponse(
            success=True,
            trade_id=request.trade_id,
            changes_applied=request.field_updates,
            validation_warnings=warnings,
            recalculated_metrics=recalculated_metrics,
            audit_log_id=audit_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to edit trade: {str(e)}")

@router.post("/bulk-edit", response_model=BulkEditResponse)
async def bulk_edit_trades(request: BulkEditRequest, user: AuthorizedUser):
    """Edit multiple trades with the same changes"""
    try:
        from firebase_admin import firestore
        db_firestore = firestore.client()
        user_id = user.sub
        
        successful_edits = 0
        failed_edits = []
        all_warnings = []
        recalculated_metrics = {'trades_recalculated': []}
        
        # Process each trade
        for trade_id in request.trade_ids:
            try:
                # Find the trade
                trade_ref = None
                evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
                evaluations = evaluations_ref.stream()
                
                for eval_doc in evaluations:
                    eval_id = eval_doc.id
                    trade_doc_ref = db_firestore.document(f"users/{user_id}/evaluations/{eval_id}/trades/{trade_id}")
                    trade_doc = trade_doc_ref.get()
                    
                    if trade_doc.exists:
                        trade_ref = trade_doc_ref
                        break
                
                if not trade_ref:
                    failed_edits.append({"trade_id": trade_id, "error": "Trade not found"})
                    continue
                
                # Get current trade data and validate updates
                current_trade = trade_ref.get().to_dict()
                updated_trade = {**current_trade, **request.field_updates}
                warnings = validate_trade_data(updated_trade)
                all_warnings.extend([f"Trade {trade_id}: {w}" for w in warnings])
                
                # Calculate new P&L if needed
                updates = request.field_updates.copy()
                if any(field in updates for field in ['open_price', 'close_price', 'quantity', 'commission', 'swap']):
                    new_pnl = calculate_trade_pnl(updated_trade)
                    updates['pnl'] = new_pnl
                    recalculated_metrics['trades_recalculated'].append({
                        'trade_id': trade_id,
                        'original_pnl': current_trade.get('pnl', 0),
                        'new_pnl': new_pnl
                    })
                
                # Update the trade
                trade_ref.update(updates)
                successful_edits += 1
                
            except Exception as e:
                failed_edits.append({"trade_id": trade_id, "error": str(e)})
        
        # Create audit log
        audit_id = create_audit_log(
            action_type="bulk_edit",
            user_id=user_id,
            affected_trades=request.trade_ids,
            changes=request.field_updates,
            reason=request.reason,
            notes=request.user_notes
        )
        
        return BulkEditResponse(
            success=successful_edits > 0,
            total_trades=len(request.trade_ids),
            successful_edits=successful_edits,
            failed_edits=failed_edits,
            validation_warnings=all_warnings,
            recalculated_metrics=recalculated_metrics,
            audit_log_id=audit_id
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to bulk edit trades: {str(e)}")

@router.post("/add-trade", response_model=ManualTradeResponse)
async def add_manual_trade(request: ManualTradeEntry, user: AuthorizedUser):
    """Manually add a new trade"""
    try:
        from firebase_admin import firestore
        db_firestore = firestore.client()
        user_id = user.sub
        
        # Validate the trade data
        trade_data = request.dict()
        warnings = validate_trade_data(trade_data)
        
        # Calculate P&L
        calculated_pnl = calculate_trade_pnl(trade_data)
        trade_data['pnl'] = calculated_pnl
        
        # Add metadata
        trade_data['created_manually'] = True
        trade_data['created_at'] = datetime.now().isoformat()
        trade_data['created_by'] = user_id
        
        # Determine which evaluation to add to
        evaluation_id = request.account_id
        if not evaluation_id:
            # Find the first active evaluation or create one
            evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
            evaluations = evaluations_ref.where(filter=firestore.FieldFilter("status", "==", "active")).limit(1).stream()
            
            eval_docs = list(evaluations)
            if eval_docs:
                evaluation_id = eval_docs[0].id
            else:
                # Create a new evaluation for manual trades
                new_eval_ref = evaluations_ref.document()
                new_eval_ref.set({
                    "accountId": "manual-trades",
                    "firm": "Manual Entry",
                    "status": "active",
                    "balance": 0,
                    "created_at": datetime.now().isoformat()
                })
                evaluation_id = new_eval_ref.id
        
        # CRITICAL FIX: Set evaluationId field to link trade to its evaluation
        # This ensures proper filtering of manual trades
        trade_data['evaluationId'] = evaluation_id
        
        # Add the trade
        trade_ref = db_firestore.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades").document()
        trade_ref.set(trade_data)
        trade_id = trade_ref.id
        
        # Create audit log
        audit_id = create_audit_log(
            action_type="add",
            user_id=user_id,
            affected_trades=[trade_id],
            changes=trade_data,
            reason="Manual trade entry",
            notes=request.comment
        )
        
        return ManualTradeResponse(
            success=True,
            trade_id=trade_id,
            trade_data=trade_data,
            validation_warnings=warnings,
            calculated_pnl=calculated_pnl,
            audit_log_id=audit_id
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to add trade: {str(e)}")

@router.post("/delete-trades")
async def delete_trades(request: TradeDeleteRequest, user: AuthorizedUser):
    """Delete multiple trades"""
    try:
        from firebase_admin import firestore
        db_firestore = firestore.client()
        user_id = user.sub
        
        deleted_count = 0
        failed_deletions = []
        
        for trade_id in request.trade_ids:
            try:
                # Find and delete the trade
                evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
                evaluations = evaluations_ref.stream()
                
                trade_deleted = False
                for eval_doc in evaluations:
                    eval_id = eval_doc.id
                    trade_doc_ref = db_firestore.document(f"users/{user_id}/evaluations/{eval_id}/trades/{trade_id}")
                    trade_doc = trade_doc_ref.get()
                    
                    if trade_doc.exists:
                        trade_doc_ref.delete()
                        deleted_count += 1
                        trade_deleted = True
                        break
                
                if not trade_deleted:
                    failed_deletions.append({"trade_id": trade_id, "error": "Trade not found"})
                    
            except Exception as e:
                failed_deletions.append({"trade_id": trade_id, "error": str(e)})
        
        # Create audit log
        audit_id = create_audit_log(
            action_type="delete",
            user_id=user_id,
            affected_trades=request.trade_ids,
            changes={"deleted": True},
            reason=request.reason,
            notes=request.user_notes
        )
        
        return {
            "success": deleted_count > 0,
            "deleted_count": deleted_count,
            "failed_deletions": failed_deletions,
            "audit_log_id": audit_id
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to delete trades: {str(e)}")

@router.post("/resolve-conflict")
async def resolve_conflict(request: ConflictResolutionRequest, user: AuthorizedUser):
    """Resolve a data conflict"""
    try:
        # This would implement conflict resolution logic
        # For now, return a placeholder response
        
        audit_id = create_audit_log(
            action_type="resolve_conflict",
            user_id=user.sub,
            affected_trades=[request.conflict_id],
            changes={"resolution": request.resolution_action, "value": request.custom_value},
            reason=request.reason
        )
        
        return {
            "success": True,
            "conflict_id": request.conflict_id,
            "resolution_applied": request.resolution_action,
            "audit_log_id": audit_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit-log")
async def get_audit_log(user: AuthorizedUser, limit: int = 50):
    """Get audit log for user's manual interventions"""
    try:
        from firebase_admin import firestore
        user_id = user.sub

        docs = firestore.client().collection("users").document(user_id).collection("audit_log").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit).stream()
        audit_logs = [doc.to_dict() for doc in docs]

        return {
            "audit_logs": audit_logs,
            "total_entries": len(audit_logs)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get audit log: {str(e)}")

@router.post("/backfill-evaluation-ids")
async def backfill_evaluation_ids(user: AuthorizedUser):
    """Backfill evaluationId for existing manual trades that don't have this field"""
    try:
        user_id = user.sub
        from firebase_admin import firestore
        db_firestore = firestore.client()
        
        # Get all evaluations for the user
        evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
        evaluations = evaluations_ref.stream()
        
        total_updated = 0
        evaluation_count = 0
        
        for evaluation_doc in evaluations:
            evaluation_id = evaluation_doc.id
            evaluation_count += 1
            
            # Get all trades in this evaluation
            trades_ref = db_firestore.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades")
            all_trades = trades_ref.stream()
            
            batch = db_firestore.batch()
            batch_count = 0
            
            for trade_doc in all_trades:
                trade_data = trade_doc.to_dict()
                
                # Check if evaluationId is missing or None
                if "evaluationId" not in trade_data or trade_data.get("evaluationId") is None:
                    # Update the trade with the evaluationId
                    trade_ref = trades_ref.document(trade_doc.id)
                    batch.update(trade_ref, {
                        "evaluationId": evaluation_id,
                        "backfilled_at": datetime.now().isoformat()
                    })
                    batch_count += 1
                    
                    # Commit batch every 400 updates (Firestore limit is 500)
                    if batch_count >= 400:
                        batch.commit()
                        total_updated += batch_count
                        batch = db_firestore.batch()
                        batch_count = 0
            
            # Commit remaining updates for this evaluation
            if batch_count > 0:
                batch.commit()
                total_updated += batch_count
        
        return {
            "success": True,
            "message": f"Successfully backfilled evaluationId for {total_updated} trades across {evaluation_count} evaluations",
            "trades_updated": total_updated,
            "evaluations_processed": evaluation_count
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to backfill evaluation IDs: {str(e)}")
