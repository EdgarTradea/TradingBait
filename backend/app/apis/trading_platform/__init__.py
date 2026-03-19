from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import uuid
import re
import json
from google.cloud import firestore
import databutton as db
import firebase_admin
from firebase_admin import credentials
from app.libs.firebase_init import initialize_firebase
import os
from datetime import timezone

from app.auth import AuthorizedUser
# Import trial management functions
from app.apis.trial_management import check_trial_usage_limit, update_trial_usage

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/trading-platform")

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class Trade(BaseModel):
    ticket: int
    openTime: str
    type: str
    lots: float
    symbol: str
    openPrice: float
    closeTime: str
    closePrice: str
    commission: float
    swap: float
    pnl: float
    userId: str
    accountId: str
    stopLoss: Optional[float] = None
    takeProfit: Optional[float] = None

class Evaluation(BaseModel):
    id: str
    accountId: str
    platform: str  # "mt4", "ctrader", "manual"
    type: str  # "challenge", "funded", "demo"
    status: str  # "active", "passed", "failed", "completed"
    createdAt: str
    updatedAt: str
    balance: Optional[float] = None
    equity: Optional[float] = None
    drawdown: Optional[float] = None
    profitTarget: Optional[float] = None
    maxDrawdown: Optional[float] = None
    tradingDays: Optional[int] = None
    remainingDays: Optional[int] = None

class ConnectRequest(BaseModel):
    platform: str  # "mt4", "mt5"
    credentials: Dict[str, Any]  # Platform-specific credentials

class EvaluationRequest(BaseModel):
    accountId: str
    platform: str
    type: str = "challenge"
    balance: Optional[float] = None
    profitTarget: Optional[float] = None
    maxDrawdown: Optional[float] = None
    tradingDays: Optional[int] = None

class DeleteResponse(BaseModel):
    success: bool
    deletedCount: int
    message: str

class BulkTradeRequest(BaseModel):
    evaluation_id: str
    trades: List[Dict[str, Any]]

class BulkTradeResponse(BaseModel):
    success: bool
    imported_count: int
    failed_count: int
    message: str
    errors: List[str] = []

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_platform_token_key(user_id: str, platform: str) -> str:
    """Get storage key for platform connection tokens"""
    # Sanitize key to only allow alphanumeric and ._- symbols
    sanitized_key = f"{platform}_token_{user_id}"
    return ''.join(c for c in sanitized_key if c.isalnum() or c in '._-')

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/health")
async def trading_platform_health_check():
    """Health check for trading platform API"""
    return {"status": "healthy", "service": "trading_platform", "timestamp": datetime.now().isoformat()}

# ============================================================================
# PLATFORM CONNECTIONS
# ============================================================================

@router.post("/connect")
async def connect_platform(request: ConnectRequest, user: AuthorizedUser):
    """Connect to a trading platform (MT4, MT5)"""
    try:
        user_id = user.sub
        platform = request.platform.lower()
        
        if platform in ["mt4", "mt5"]:
            api_key = request.credentials.get("apiKey")
            if not api_key:
                raise HTTPException(status_code=400, detail="apiKey required for MetaTrader")
            return await connect_metatrader(api_key, user_id, platform)
        else:
            raise HTTPException(status_code=400, detail="Unsupported platform")
            
    except Exception as e:
        print(f"Error connecting to platform: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def connect_metatrader(api_key: str, user_id: str, platform: str):
    """Connect to MetaTrader platform"""
    # Store MetaTrader API key/secret
    token_key = get_platform_token_key(user_id, platform)
    db.storage.json.put(token_key, {
        "api_key": api_key,
        "connected_at": datetime.now().isoformat(),
        "platform": platform
    })
    
    return {
        "status": "success",
        "message": f"{platform.upper()} connected successfully",
        "platform": platform
    }

@router.get("/connection/{platform}")
async def get_platform_connection(platform: str, user: AuthorizedUser):
    """Get platform connection status"""
    try:
        user_id = user.sub
        token_key = get_platform_token_key(user_id, platform.lower())
        
        try:
            connection_data = db.storage.json.get(token_key)
            return {
                "connected": True,
                "platform": platform,
                "connectedAt": connection_data.get("connected_at")
            }
        except FileNotFoundError:
            return {
                "connected": False,
                "platform": platform
            }
            
    except Exception as e:
        print(f"Error getting platform connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/connection/{platform}")
async def disconnect_platform(platform: str, user: AuthorizedUser):
    """Disconnect from a trading platform"""
    try:
        user_id = user.sub
        token_key = get_platform_token_key(user_id, platform.lower())
        
        # Clear connection data
        db.storage.json.put(token_key, {})
        
        return {
            "status": "success",
            "message": f"{platform} disconnected successfully",
            "platform": platform
        }
        
    except Exception as e:
        print(f"Error disconnecting platform: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# TRADE SYNC FROM PLATFORMS
# ============================================================================

@router.post("/sync/{platform}")
async def sync_platform_trades(platform: str, user: AuthorizedUser):
    """Sync trades from connected platform"""
    try:
        user_id = user.sub
        platform = platform.lower()
        
        # For now, only MetaTrader platforms are supported
        if platform in ["mt4", "mt5"]:
            # TODO: Implement MetaTrader sync
            raise HTTPException(status_code=501, detail="MetaTrader sync not yet implemented")
        else:
            raise HTTPException(status_code=400, detail="Platform sync not implemented")
            
    except Exception as e:
        print(f"Error syncing trades: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# EVALUATION MANAGEMENT
# ============================================================================

@router.post("/evaluations", response_model=Evaluation)
async def create_evaluation(request: EvaluationRequest, user: AuthorizedUser):
    """Create a new trading evaluation"""
    try:
        user_id = user.sub
        
        # Check trial usage limits before creating evaluation
        can_create, remaining = check_trial_usage_limit(user_id, "evaluations")
        if not can_create:
            raise HTTPException(
                status_code=403, 
                detail="Trial limit reached. You can create up to 2 evaluations during your 7-day trial. Please upgrade to continue creating evaluations."
            )
        
        db_firestore = firestore.client()
        
        evaluation_data = {
            "accountId": request.accountId,
            "platform": request.platform,
            "type": request.type,
            "status": "active",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
            "balance": request.balance,
            "profitTarget": request.profitTarget,
            "maxDrawdown": request.maxDrawdown,
            "tradingDays": request.tradingDays,
            "remainingDays": request.tradingDays
        }
        
        evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
        evaluation_ref = evaluations_ref.document()
        evaluation_ref.set(evaluation_data)
        
        # Update trial usage after successful creation
        update_trial_usage(user_id, "evaluations", 1)
        print(f"Updated trial usage: evaluations +1 for user {user_id}")
        
        evaluation_data["id"] = evaluation_ref.id
        return Evaluation(**evaluation_data)
        
    except Exception as e:
        print(f"Error creating evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evaluations", response_model=List[Evaluation])
async def get_evaluations(user: AuthorizedUser):
    """Get all evaluations for user"""
    try:
        user_id = user.sub
        db_firestore = firestore.client()
        
        evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
        evaluations = evaluations_ref.stream()
        
        result = []
        for doc in evaluations:
            data = doc.to_dict()
            data["id"] = doc.id
            
            # Provide default values for missing fields to maintain backward compatibility
            if "platform" not in data:
                data["platform"] = "manual"  # Default for older entries
            if "type" not in data:
                data["type"] = "demo"  # Default for older entries
            if "createdAt" not in data:
                data["createdAt"] = datetime.now().isoformat()  # Default timestamp
            if "updatedAt" not in data:
                data["updatedAt"] = datetime.now().isoformat()  # Default timestamp
            if "balance" not in data:
                data["balance"] = None  # Optional field
                
            result.append(Evaluation(**data))
        
        return result
        
    except Exception as e:
        print(f"Error getting evaluations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/evaluations/{evaluation_id}", response_model=DeleteResponse)
async def delete_evaluation(evaluation_id: str, user: AuthorizedUser):
    """Delete an evaluation and all its trades"""
    try:
        user_id = user.sub
        
        # Use Firebase Admin SDK client which bypasses security rules
        from firebase_admin import firestore as admin_firestore
        db_firestore = admin_firestore.client()
        
        evaluation_ref = db_firestore.collection(f"users/{user_id}/evaluations").document(evaluation_id)
        
        if not evaluation_ref.get().exists:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        # Delete all trades in this evaluation
        trades_collection = db_firestore.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades")
        trades = trades_collection.stream()
        
        batch = db_firestore.batch()
        deleted_count = 0
        
        for trade_doc in trades:
            batch.delete(trade_doc.reference)
            deleted_count += 1
        
        # Delete the evaluation itself
        batch.delete(evaluation_ref)
        batch.commit()
        
        return DeleteResponse(
            success=True,
            deletedCount=deleted_count,
            message=f"Deleted evaluation and {deleted_count} trades"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-import-trades", response_model=BulkTradeResponse)
async def bulk_import_trades(request: BulkTradeRequest, user: AuthorizedUser):
    """Import multiple trades from AI parser into a specific evaluation"""
    try:
        user_id = user.sub
        db_firestore = firestore.client()
        
        # Verify evaluation exists and belongs to user
        evaluation_ref = db_firestore.collection(f"users/{user_id}/evaluations").document(request.evaluation_id)
        if not evaluation_ref.get().exists:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        # Prepare batch write
        batch = db_firestore.batch()
        imported_count = 0
        failed_count = 0
        errors = []
        
        print(f"\n=== BULK IMPORT DEBUG ===")
        print(f"Processing {len(request.trades)} trades for evaluation {request.evaluation_id}")
        print(f"User: {user.sub}")
        
        for trade_data in request.trades:
            print(f"\n--- Processing Trade ---")
            print(f"Raw trade_data: {trade_data}")
            
            # Check the critical fields
            print(f"Key field analysis:")
            print(f"  symbol: {trade_data.get('symbol', 'MISSING')}")
            print(f"  gross_pnl: {trade_data.get('gross_pnl')} (type: {type(trade_data.get('gross_pnl'))})")
            print(f"  commission: {trade_data.get('commission')} (type: {type(trade_data.get('commission'))})")
            print(f"  swap: {trade_data.get('swap')} (type: {type(trade_data.get('swap'))})")
            
            try:
                # Generate trade ID
                trade_id = str(uuid.uuid4())
                
                # Convert AI parsed trade to Firestore format
                trade_doc = {
                    "id": trade_id,
                    "symbol": trade_data.get("symbol", ""),
                    "openTime": trade_data.get("openTime", ""),
                    "closeTime": trade_data.get("closeTime", ""),
                    "openPrice": float(trade_data.get("openPrice", 0)),
                    "closePrice": float(trade_data.get("closePrice", 0)),
                    "lots": float(trade_data.get("lots", 0)),
                    "type": trade_data.get("type", "buy").lower(),
                    "pnl": float(trade_data.get("pnl", 0)) if trade_data.get("pnl") is not None else 0,
                    "commission": float(trade_data.get("commission", 0)) if trade_data.get("commission") is not None else 0,
                    "swap": float(trade_data.get("swap", 0)) if trade_data.get("swap") is not None else 0,
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                    "tags": [],
                    "notes": "Imported via AI Trade Parser",
                    "source": "ai_parser",
                    "evaluationId": request.evaluation_id  # CRITICAL: Link trade to evaluation for filtering
                }
                
                print(f"Final trade_doc to be saved:")
                print(f"  pnl: {trade_doc['pnl']} (type: {type(trade_doc['pnl'])})")
                print(f"  commission: {trade_doc['commission']} (type: {type(trade_doc['commission'])})")
                print(f"  swap: {trade_doc['swap']} (type: {type(trade_doc['swap'])})")
                
                # Add to batch
                trade_ref = db_firestore.collection(f"users/{user_id}/evaluations/{request.evaluation_id}/trades").document(trade_id)
                batch.set(trade_ref, trade_doc)
                imported_count += 1
                
            except Exception as e:
                failed_count += 1
                errors.append(f"Trade {failed_count}: {str(e)}")
        
        # Execute batch write
        if imported_count > 0:
            batch.commit()
            print(f"Successfully imported {imported_count} trades for user {user_id}")
        
        return BulkTradeResponse(
            success=True,
            imported_count=imported_count,
            failed_count=failed_count,
            message=f"Successfully imported {imported_count} trades. {failed_count} failed.",
            errors=errors[:10]  # Limit error messages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error bulk importing trades: {e}")
        raise HTTPException(status_code=500, detail=str(e))
