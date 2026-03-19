from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import firestore
import re
from typing import Dict, Any, Optional, List
import json
import databutton as db
from datetime import datetime
import pandas as pd
import io
import uuid
from app.auth import AuthorizedUser
import os
from app.libs.firebase_init import initialize_firebase
from firebase_admin import storage

router = APIRouter()

class RepairTradesRequest(BaseModel):
    user_id: str
    evaluation_id: Optional[str] = None  # If provided, only repair this evaluation
    dry_run: bool = True  # Default to dry run for safety

class RepairTradesResponse(BaseModel):
    trades_analyzed: int
    trades_repaired: int
    trades_already_ok: int
    trades_no_datetime_found: int
    dry_run: bool
    sample_repairs: list

class ExtractMissingTradeResponse(BaseModel):
    success: bool
    missing_trade_found: bool
    trade_added: bool
    missing_trade_data: Optional[Dict[str, Any]] = None
    message: str

@router.post("/repair-trades")
async def repair_trades_datetime(request: RepairTradesRequest) -> RepairTradesResponse:
    """
    Repair trades that are missing openTime/closeTime by extracting from raw_row_data
    """
    try:
        # Use centralized init
        initialize_firebase()
        
        firestore_db = firestore.client()
        
        stats = {
            "trades_analyzed": 0,
            "trades_repaired": 0,
            "trades_already_ok": 0,
            "trades_no_datetime_found": 0,
            "sample_repairs": []
        }
        
        # Get evaluations to process
        if request.evaluation_id:
            # Process specific evaluation
            evaluation_ids = [request.evaluation_id]
        else:
            # Get all evaluations for user
            evaluations_ref = firestore_db.collection(f'users/{request.user_id}/evaluations')
            evaluations_docs = evaluations_ref.get()
            evaluation_ids = [doc.id for doc in evaluations_docs]
        
        pass
        
        for eval_id in evaluation_ids:
            # Get all trades for this evaluation
            trades_ref = firestore_db.collection(f'users/{request.user_id}/evaluations/{eval_id}/trades')
            trades_docs = trades_ref.get()
            
            pass
            
            for trade_doc in trades_docs:
                stats["trades_analyzed"] += 1
                trade_data = trade_doc.to_dict()
                
                # Check if trade already has datetime fields
                if trade_data.get('openTime') and trade_data.get('closeTime'):
                    stats["trades_already_ok"] += 1
                    continue
                
                # Try to extract datetime from raw_row_data
                raw_data = trade_data.get('raw_row_data', {})
                extracted_datetime = extract_datetime_from_raw_data(raw_data)
                
                if extracted_datetime['openTime'] and extracted_datetime['closeTime']:
                    # Found datetime data to repair
                    stats["trades_repaired"] += 1
                    
                    # Add to sample repairs (first 5)
                    if len(stats["sample_repairs"]) < 5:
                        stats["sample_repairs"].append({
                            "trade_id": trade_doc.id,
                            "symbol": trade_data.get('symbol'),
                            "extracted_openTime": extracted_datetime['openTime'],
                            "extracted_closeTime": extracted_datetime['closeTime']
                        })
                    
                    # Apply repair if not dry run
                    if not request.dry_run:
                        trade_ref = firestore_db.document(f'users/{request.user_id}/evaluations/{eval_id}/trades/{trade_doc.id}')
                        trade_ref.update({
                            'openTime': extracted_datetime['openTime'],
                            'closeTime': extracted_datetime['closeTime'],
                            'repaired_at': datetime.now().isoformat()
                        })
                        pass
                
                else:
                    stats["trades_no_datetime_found"] += 1
        
        return RepairTradesResponse(
            trades_analyzed=stats["trades_analyzed"],
            trades_repaired=stats["trades_repaired"],
            trades_already_ok=stats["trades_already_ok"],
            trades_no_datetime_found=stats["trades_no_datetime_found"],
            dry_run=request.dry_run,
            sample_repairs=stats["sample_repairs"]
        )
        
    except Exception as e:
        pass
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to repair trades: {str(e)}")

def extract_datetime_from_raw_data(raw_data: Dict[str, Any]) -> Dict[str, Optional[str]]:
    """
    Extract openTime and closeTime from raw_row_data based on patterns observed
    """
    result = {
        "openTime": None,
        "closeTime": None
    }
    
    # Datetime patterns to look for
    datetime_pattern = re.compile(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}')
    
    # Look for column keys that contain datetime headers and extract values
    open_time_candidates = []
    close_time_candidates = []
    
    for key, value in raw_data.items():
        if not isinstance(value, str):
            continue
            
        # Check if value matches datetime pattern
        if datetime_pattern.match(value):
            # Based on the pattern analysis:
            # col_1_* usually contains open time
            # col_8_* usually contains close time
            if key.startswith('col_1_'):
                open_time_candidates.append(value)
            elif key.startswith('col_8_'):
                close_time_candidates.append(value)
            # Also check for time-related keywords in key names
            elif any(word in key.lower() for word in ['open', 'start', 'entry']):
                open_time_candidates.append(value)
            elif any(word in key.lower() for word in ['close', 'end', 'exit']):
                close_time_candidates.append(value)
    
    # Take the first valid candidate for each
    if open_time_candidates:
        result["openTime"] = open_time_candidates[0]
    if close_time_candidates:
        result["closeTime"] = close_time_candidates[0]
    
    return result

@router.post("/extract-missing-first-trade")
async def extract_missing_first_trade(user: AuthorizedUser) -> ExtractMissingTradeResponse:
    """Extract the first trade that AI used for column mapping but didn't import"""
    
    try:
        user_id = user.sub
        
        # Try to get the most recent uploaded file
        initialize_firebase()
        bucket = storage.bucket()
        
        file_content = None
        file_keys = [f"uploads/{user_id}/recent", f"trade_imports/{user_id}/recent_upload"]
        
        for key in file_keys:
            try:
                blob = bucket.blob(key)
                if blob.exists():
                    file_content = blob.download_as_bytes()
                    break
            except Exception:
                continue
                
        if not file_content:
            return ExtractMissingTradeResponse(
                success=False,
                missing_trade_found=False,
                trade_added=False,
                message="Original file not found. Cannot extract missing first trade."
            )
        
        # Parse the CSV content
        file_text = file_content.decode('utf-8')
        lines = file_text.split('\n')
        non_empty_lines = [line.strip() for line in lines if line.strip()]
        
        pass
        
        if len(non_empty_lines) < 2:
            return ExtractMissingTradeResponse(
                success=False,
                missing_trade_found=False,
                trade_added=False,
                message="File doesn't have enough data lines."
            )
        
        # Parse with pandas to get the first row
        df = pd.read_csv(io.StringIO(file_text))
        
        pass
        pass
        
        if len(df) == 0:
            return ExtractMissingTradeResponse(
                success=False,
                missing_trade_found=False,
                trade_added=False,
                message="No data rows found in file."
            )
        
        # Get the first row (the potentially missing trade)
        first_row = df.iloc[0]
        
        # Extract trade data from first row using the same logic as the AI parser
        missing_trade = _extract_trade_from_row(first_row, list(df.columns))
        
        if not missing_trade:
            return ExtractMissingTradeResponse(
                success=False,
                missing_trade_found=False,
                trade_added=False,
                message="Could not extract valid trade data from first row."
            )
        
        pass
        
        # Check if this trade already exists in Firestore
        firestore_db = firestore.client()
        
        # Get all evaluations for the user
        evaluations_ref = firestore_db.collection(f"users/{user_id}/evaluations")
        evaluations = evaluations_ref.stream()
        
        trade_exists = False
        for evaluation_doc in evaluations:
            evaluation_id = evaluation_doc.id
            trades_ref = firestore_db.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades")
            
            # Check if a trade with similar characteristics already exists
            existing_trades = trades_ref.where("openTime", "==", missing_trade.get("openTime")).stream()
            
            for existing_trade in existing_trades:
                existing_data = existing_trade.to_dict()
                # If symbol and open time match, consider it a duplicate
                if (existing_data.get("symbol") == missing_trade.get("symbol") and 
                    existing_data.get("openTime") == missing_trade.get("openTime")):
                    trade_exists = True
                    pass
                    break
            
            if trade_exists:
                break
        
        if trade_exists:
            return ExtractMissingTradeResponse(
                success=True,
                missing_trade_found=True,
                trade_added=False,
                missing_trade_data=missing_trade,
                message="Missing trade found but already exists in Firestore. No action needed."
            )
        
        # Add the missing trade to the most recent evaluation
        # Get the most recent evaluation
        evaluations_list = list(firestore_db.collection(f"users/{user_id}/evaluations").stream())
        
        if not evaluations_list:
            return ExtractMissingTradeResponse(
                success=False,
                missing_trade_found=True,
                trade_added=False,
                missing_trade_data=missing_trade,
                message="Missing trade found but no evaluation exists to add it to."
            )
        
        # Use the first evaluation (or you could add logic to pick the right one)
        target_evaluation = evaluations_list[0]
        evaluation_id = target_evaluation.id
        
        # Add metadata
        missing_trade["importedAt"] = datetime.now().isoformat()
        missing_trade["source"] = "manual_repair"
        missing_trade["repair_note"] = "Recovered missing first trade from original file"
        
        # Generate unique trade ID
        trade_id = str(uuid.uuid4())
        
        # Save to Firestore
        trade_ref = firestore_db.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades").document(trade_id)
        trade_ref.set(missing_trade)
        
        pass
        
        return ExtractMissingTradeResponse(
            success=True,
            missing_trade_found=True,
            trade_added=True,
            missing_trade_data=missing_trade,
            message=f"Successfully recovered and added missing first trade to evaluation {evaluation_id}."
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Repair failed: {str(e)}")


def _extract_trade_from_row(row: pd.Series, columns: List[str]) -> Optional[Dict[str, Any]]:
    """Extract trade data from a pandas row using heuristic field detection"""
    
    trade_data = {}
    
    # Convert row to dict for easier processing
    row_data = row.to_dict()
    
    # Common patterns for different fields
    symbol_patterns = ['symbol', 'instrument', 'pair', 'asset']
    open_time_patterns = ['open_time', 'opentime', 'open time', 'time_open', 'date_open', 'open_date']
    close_time_patterns = ['close_time', 'closetime', 'close time', 'time_close', 'date_close', 'close_date']
    open_price_patterns = ['open_price', 'openprice', 'open price', 'entry_price', 'price_open']
    close_price_patterns = ['close_price', 'closeprice', 'close price', 'exit_price', 'price_close']
    volume_patterns = ['lots', 'volume', 'size', 'amount', 'quantity']
    type_patterns = ['type', 'side', 'direction', 'action', 'cmd']
    pnl_patterns = ['pnl', 'profit', 'p&l', 'pl', 'net_pnl', 'profit_loss']
    commission_patterns = ['commission', 'commissions', 'fee', 'fees']
    swap_patterns = ['swap', 'rollover', 'overnight']
    
    # Helper function to find matching field
    def find_field(patterns, row_data, columns):
        for col in columns:
            col_lower = col.lower().replace('_', '').replace(' ', '')
            for pattern in patterns:
                pattern_clean = pattern.lower().replace('_', '').replace(' ', '')
                if pattern_clean in col_lower or col_lower in pattern_clean:
                    return row_data.get(col)
        return None
    
    # Extract fields using pattern matching
    trade_data['symbol'] = find_field(symbol_patterns, row_data, columns)
    trade_data['openTime'] = find_field(open_time_patterns, row_data, columns)
    trade_data['closeTime'] = find_field(close_time_patterns, row_data, columns)
    trade_data['openPrice'] = find_field(open_price_patterns, row_data, columns)
    trade_data['closePrice'] = find_field(close_price_patterns, row_data, columns)
    trade_data['lots'] = find_field(volume_patterns, row_data, columns)
    trade_data['type'] = find_field(type_patterns, row_data, columns)
    trade_data['pnl'] = find_field(pnl_patterns, row_data, columns)
    trade_data['commission'] = find_field(commission_patterns, row_data, columns)
    trade_data['swap'] = find_field(swap_patterns, row_data, columns)
    
    # Clean up the data
    for key, value in trade_data.items():
        if pd.isna(value) or value == '':
            trade_data[key] = None
        elif key in ['openPrice', 'closePrice', 'lots', 'pnl', 'commission', 'swap']:
            # Convert numeric fields
            try:
                if value is not None:
                    trade_data[key] = float(value)
            except (ValueError, TypeError):
                trade_data[key] = None
        elif key in ['openTime', 'closeTime']:
            # Convert datetime fields
            try:
                if value is not None:
                    # Handle various datetime formats
                    if isinstance(value, str):
                        # Common datetime patterns
                        for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%m/%d/%Y %H:%M:%S', '%m/%d/%Y']:
                            try:
                                dt = datetime.strptime(value, fmt)
                                trade_data[key] = dt.isoformat()
                                break
                            except ValueError:
                                continue
                        else:
                            # If no format matches, keep as string
                            trade_data[key] = str(value)
                    else:
                        trade_data[key] = str(value)
            except Exception:
                trade_data[key] = None
    
    # Only return if we have essential fields
    if trade_data.get('symbol') and (trade_data.get('openTime') or trade_data.get('closeTime')):
        return trade_data
    else:
        return None
