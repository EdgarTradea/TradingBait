from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
from app.auth import AuthorizedUser
import pandas as pd
import io
import json
from datetime import datetime
from firebase_admin import firestore
import uuid
import pytz
from app.libs.cme_contracts import calculate_futures_pnl, is_futures_symbol
from io import StringIO

router = APIRouter()

class FileAnalysisResponse(BaseModel):
    success: bool
    analysis: Optional[Dict] = None
    error: Optional[str] = None
    filename: str
    file_size: int

class ProcessedTradeData(BaseModel):
    symbol: Optional[str] = None
    openTime: Optional[str] = None
    closeTime: Optional[str] = None
    openPrice: Optional[float] = None
    closePrice: Optional[float] = None
    lots: Optional[float] = None
    type: Optional[str] = None
    pnl: Optional[float] = None
    commission: Optional[float] = None
    swap: Optional[float] = None
    raw_row_data: Dict[str, Any] = {}  # Original data for debugging

class FileProcessingResponse(BaseModel):
    success: bool
    trades: List[ProcessedTradeData] = []
    analysis: Optional[Dict] = None
    error: Optional[str] = None
    filename: str
    total_trades: int = 0
    parsing_confidence: str = "unknown"

class ProcessFileResponse(BaseModel):
    success: bool
    message: str
    trades_processed: int
    evaluation_info: Optional[Dict[str, Any]] = None

@router.post("/analyze-structure")
async def analyze_file_structure(file: UploadFile, user: AuthorizedUser) -> FileAnalysisResponse:
    """Analyze the structure of an uploaded trading file using OpenAI"""
    
    try:
        pass
        pass
        pass
        
        # Read file content
        file_content = await file.read()
        
        # Use OpenAI to analyze the file structure
        analysis_result = await _analyze_with_openai(file_content, file.filename or "unknown")
        
        return FileAnalysisResponse(
            success=True,
            analysis=analysis_result,
            filename=file.filename or "unknown",
            file_size=len(file_content)
        )
        
    except Exception as e:
        pass
        raise HTTPException(
            status_code=500, 
            detail=f"Analysis failed: {str(e)}"
        ) from e


@router.post("/process-file", response_model=ProcessFileResponse)
async def process_file(
    file: UploadFile,
    analysis: str,
    evaluation_id: str,  # Now required
    broker_timezone: str, # Added timezone
    user: AuthorizedUser
):
    """Process uploaded file and save trades to specified evaluation"""
    
    try:
        # Correctly parse the analysis JSON string
        analysis_data = json.loads(analysis)
        user_id = user.sub
        db_firestore = firestore.client()
        evaluation_ref = db_firestore.collection(f"users/{user_id}/evaluations").document(evaluation_id)

        # Process the file based on analysis
        try:
            processed_trades = await _process_csv_with_ai_mapping(file, analysis_data, broker_timezone)
            
            # NEW: Smart routing based on file type - only apply FIFO to futures
            if processed_trades:
                # Check file type from analysis to decide processing method
                file_type = analysis_data.get('file_type', 'unknown').lower()
                
                # Apply FIFO aggregation only for futures platforms that use individual fills
                if any(keyword in file_type for keyword in ['futures', 'cme', 'ninja', 'amp', 'continuum']):
                    pass
                    processed_trades = simple_fifo_aggregation(processed_trades)
                    pass
                else:
                    # For CFDs, Forex, Stocks - keep individual fills as complete trades
                    pass
            
            # Save FIFO-calculated roundtrip trades to Firestore
            trades_saved = 0
            failed_trades = 0
            skipped_duplicates = 0
            
            for trade in processed_trades:
                try:
                    # FIFO engine returns dictionaries, not Pydantic models
                    if isinstance(trade, dict):
                        trade_data = trade.copy()
                    else:
                        # Fallback for Pydantic models
                        trade_data = trade.dict(exclude_unset=True)
                    
                    trade_data["importedAt"] = datetime.now().isoformat()
                    trade_data["source"] = "ai_import"
                    trade_data["evaluationId"] = evaluation_id  # CRITICAL: Link trade to evaluation for filtering
                    
                    # Check for identical duplicates before saving
                    duplicate_exists = await _check_for_identical_trade(db_firestore, user_id, evaluation_id, trade_data)
                    
                    if duplicate_exists:
                        pass
                        skipped_duplicates += 1
                        continue
                    
                    # Generate unique trade ID
                    trade_id = str(uuid.uuid4())
                    
                    # Save to Firestore
                    trade_ref = db_firestore.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades").document(trade_id)
                    trade_ref.set(trade_data)
                    trades_saved += 1
                    
                except Exception as e:
                    pass
                    failed_trades += 1
            
            # Get evaluation info for response
            evaluation_doc = evaluation_ref.get()
            evaluation_data = evaluation_doc.to_dict()
            
            return ProcessFileResponse(
                success=True,
                message=f"Successfully imported {trades_saved} trades to evaluation" + (f", skipped {skipped_duplicates} duplicates" if skipped_duplicates > 0 else ""),
                trades_processed=trades_saved,
                evaluation_info={
                    "evaluation_id": evaluation_id,
                    "account_id": evaluation_data.get("accountId"),
                    "platform": evaluation_data.get("platform"),
                    "type": evaluation_data.get("type")
                }
            )
        except Exception as e:
            pass
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error: {str(e)}"
            ) from e
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid analysis JSON: {str(e)}"
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"File processing error: {str(e)}"
        ) from e
    except Exception as e:
        pass
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        ) from e

async def _analyze_with_openai(file_content: bytes, filename: str) -> Dict:
    """Use OpenAI to analyze the file structure - STRUCTURE ONLY, NOT DATA"""
    
    try:
        from openai import OpenAI
        import databutton as db
        import os
        
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        # CRITICAL FIX: Handle Excel files properly before AI analysis
        file_ext = filename.lower().split('.')[-1] if filename else 'csv'
        
        if file_ext in ['xlsx', 'xls']:
            # For Excel files, extract readable content first
            try:
                # First try MT5-specific extraction for structured reports
                mt5_data = extract_mt5_positions_from_xlsx(file_content)
                if mt5_data is not None:
                    pass
                    # Convert DataFrame to readable text format for AI
                    sample_lines = []
                    
                    # Add header row
                    headers = list(mt5_data.columns)
                    sample_lines.append(f"Row 0: {','.join(headers)}")
                    
                    # Add data rows (up to 15 rows for analysis)
                    for idx, row in mt5_data.head(15).iterrows():
                        row_values = [str(val) if pd.notna(val) else '' for val in row]
                        sample_lines.append(f"Row {idx+1}: {','.join(row_values)}")
                    
                    sample_content = '\n'.join(sample_lines)
                    total_lines = len(mt5_data)
                    
                else:
                    # Fallback: Standard Excel parsing
                    pass
                    df = pd.read_excel(io.BytesIO(file_content), nrows=20)  # Read first 20 rows
                    
                    sample_lines = []
                    # Add header row
                    headers = [str(col) for col in df.columns]
                    sample_lines.append(f"Row 0: {','.join(headers)}")
                    
                    # Add data rows
                    for idx, row in df.iterrows():
                        row_values = [str(val) if pd.notna(val) else '' for val in row]
                        sample_lines.append(f"Row {idx+1}: {','.join(row_values)}")
                    
                    sample_content = '\n'.join(sample_lines)
                    total_lines = len(df)
                    
            except Exception as excel_error:
                pass
                return _get_fallback_analysis(file_content, filename)
                
        else:
            # CSV/Text files - existing logic
            file_text = file_content.decode('utf-8', errors='ignore')
            lines = file_text.split('\n')
            total_lines = len(lines)
            
            # Smart sample extraction: get headers + meaningful data rows
            sample_lines = []
            data_started = False
            data_rows_collected = 0
            
            for i, line in enumerate(lines[:100]):  # Look at first 100 lines max
                line = line.strip()
                if not line:  # Skip empty lines
                    continue
                    
                sample_lines.append(f"Row {i}: {line}")
                
                # Try to detect when data starts (rows with comma-separated values)
                if ',' in line and not data_started:
                    # Check if this looks like a data row (multiple commas, some numbers)
                    parts = line.split(',')
                    if len(parts) >= 3:  # At least 3 columns
                        data_started = True
                        
                # Collect more data rows once we find them
                if data_started:
                    data_rows_collected += 1
                    if data_rows_collected >= 15:  # Get 15 data rows for pattern analysis
                        break
                        
                # Stop if we have enough sample (30 lines total)
                if len(sample_lines) >= 30:
                    break
            
            sample_content = '\n'.join(sample_lines)[:3000]  # Increased to 3000 chars
        
        pass
        pass
        
        # Count total lines to inform user about file size
        # total_lines = len(file_text.split('\n'))  # Removed duplicate line
        
        pass
        
        # Enhanced prompt with futures detection and FIFO-priority mapping
        prompt = f"""
You are a trading file structure analyzer. You must analyze BOTH column headers AND data patterns to correctly map fields.

FILE: {filename}
SAMPLE (ENHANCED WITH {len(sample_lines)} LINES):
{sample_content}

STEP 1: IDENTIFY THE HEADER ROW
Find which row contains column headers (field names like: orderId, Account, B/S, Contract, avgPrice, filledQty, Fill Time, etc.)

STEP 2: DETECT FILE TYPE BY ANALYZING DATA PATTERNS
- FUTURES: Contains _tickSize field, Contract field, futures symbols (MNQU5, MGCQ5, ESZ3, MESU5), and futures-style data
- CFD: Contains CFD symbols (US30, GER30, etc.) OR has separate entry/exit time and price columns
- STOCKS: Contains stock symbols (AAPL, TSLA, etc.)
- FOREX: Contains currency pairs (EURUSD, GBPUSD, etc.)

STEP 3: ANALYZE DATA PATTERNS TO IDENTIFY CORRECT COLUMNS
Look at the actual data values in each column to understand what they represent:

FOR QUANTITY COLUMNS - Look for:
- Small positive numbers (1, 2, 5, 10, etc.) representing trading lots
- Numbers that make sense as trade sizes
- Avoid columns with large numbers (prices, IDs, timestamps)

FOR PRICE COLUMNS - Look for:
- Numbers that look like market prices (23316.75, 6367.25, etc.)
- Decimal values representing currency amounts
- Numbers in realistic price ranges for the instrument

FOR COMMISSION/FEE COLUMNS - Look for:
- Small monetary amounts (0.50, 2.85, 5.00, 12.25, etc.)
- Typically much smaller than price data
- Often consistent values or proportional to trade size
- May have 2-4 decimal places for precision
- Range usually $0.01 to $50 per trade

FOR P&L/PROFIT COLUMNS - Look for:
- Can be positive or negative numbers
- Range similar to price differences (could be $5 to $500+ per trade)
- Often larger absolute values than commissions
- May show clear profit/loss patterns

FOR DIRECTION COLUMNS - Look for:
- Text values like "Buy", "Sell", "B", "S"
- Pattern that alternates between buy/sell

FOR TIMESTAMP COLUMNS - Look for:
- Date/time patterns
- Large numbers (Unix timestamps)
- Date formats (YYYY-MM-DD, etc.)

STEP 4: APPLY PRIORITY HIERARCHY BASED ON FILE TYPE

=== FOR FUTURES FILES ===
CRITICAL: Map each field type to EXACTLY ONE column. When multiple columns could work, choose the BEST one based on priority:

**Contract/Symbol** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'Contract' or exact 'Symbol' 
- Priority 2: Any column with futures symbols (MNQU5, MGCQ5, etc)
- Priority 3: 'Instrument' or similar

**Direction** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'B/S' (Buy/Sell format)
- Priority 2: 'Side' 
- Priority 3: 'Type' or 'Direction'

**Quantity** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'filledQty' or 'Filled Qty' (if data shows small trade sizes)
- Priority 2: 'Filled, Qty' (if data shows small trade sizes)
- Priority 3: 'Quantity' or 'Volume' (if data shows small trade sizes)
- VALIDATE: Column should contain small positive numbers (1-50 range typical)

**Price** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'Avg Fill Price' or 'avgPrice' (if data shows price-like values)
- Priority 2: 'Fill Price' (if data shows price-like values)
- Priority 3: 'Price' (if data shows price-like values)
- VALIDATE: Column should contain numbers that look like market prices

**Timestamp** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'Fill Time'
- Priority 2: 'Timestamp' or 'Time'
- Priority 3: 'Date'

**Unique ID** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'orderId' or 'Order ID'
- Priority 2: 'ID' or 'TradeId'
- Priority 3: Any unique identifier

**Optional Fields (CHOOSE ONE EACH IF AVAILABLE)**:
- 'Account': Account number/ID
- 'Status': Order status (filter for 'filled'/'executed')
- '_tickSize': Futures tick size
- 'Product': Product description

=== FOR CFD/STOCKS/FOREX FILES ===
CRITICAL: Map each field type to EXACTLY ONE column for roundtrip trades:

**Symbol** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'Symbol' or 'Instrument'
- Priority 2: 'Asset' or 'Product' 
- Priority 3: Any column with CFD/Forex symbols

**Direction** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'Action' or 'Side'
- Priority 2: 'Type' or 'Direction'
- Priority 3: 'Buy/Sell' format

**Quantity** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'Volume' or 'Size'
- Priority 2: 'Lots' or 'Units'
- Priority 3: 'Quantity'
- VALIDATE: Column should contain position sizes

**Entry Price** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'Entry Price' or 'Open Price'
- Priority 2: 'Opening Price'
- Priority 3: 'Price' (if only one price column)
- VALIDATE: Column should contain entry price values

**Exit Price** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'Exit Price' or 'Close Price' 
- Priority 2: 'Closing Price'
- Priority 3: Second price column if entry price is mapped
- VALIDATE: Column should contain exit price values

**Entry Time** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'Open Time' or 'Entry Time'
- Priority 2: 'Opening Time' or 'Start Time'
- Priority 3: 'Date' or 'Time' (if only one time column)

**Exit Time** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'Close Time' or 'Exit Time'
- Priority 2: 'Closing Time' or 'End Time' 
- Priority 3: Second time column if entry time is mapped

**P&L** (REQUIRED - CHOOSE ONLY ONE):
- Priority 1: 'P&L' or 'PnL'
- Priority 2: 'Profit' or 'Net P&L'
- Priority 3: 'Realized P&L' or 'Net Profit'
- VALIDATE: Column should contain calculated profit/loss

**Optional Fields (CHOOSE ONE EACH IF AVAILABLE)**:
- 'Commission': Trading fees
- 'Swap': Overnight fees  
- 'ID': Trade identifier

STEP 5: CREATE ONE-TO-ONE MAPPING
- Select the SINGLE BEST column for each field type
- Never map multiple columns to the same field type
- Never map one column to multiple field types
- If a column doesn't clearly fit any category, mark it as "unknown"
- Prioritize required fields over optional fields

IMPORTANT: You MUST map to these EXACT standardized field names (not the original column headers):

For FUTURES files:
- "symbol" (for any Contract/Instrument/Symbol column)
- "direction" (for any B/S/Side/Type column)
- "quantity" (for any filledQty/Quantity/Volume column)
- "price" (for any avgPrice/Price/Fill Price column)
- "timestamp" (for any Fill Time/Timestamp/Date column)
- "unique_id" (for any orderId/ID/TradeId column)
- "account" (for any Account column)
- "status" (for any Status column)
- "tick_size" (for any _tickSize column)
- "product" (for any Product column)
- "unknown" (for columns that don't match any field type)

For CFD/STOCKS/FOREX files:
- "symbol" (for any Symbol/Instrument/Asset column)
- "direction" (for any Action/Side/Type column)
- "quantity" (for any Volume/Size/Lots column)
- "entry_price" (for any Entry Price/Open Price column)
- "exit_price" (for any Exit Price/Close Price column)
- "entry_time" (for any Open Time/Entry Time column)
- "exit_time" (for any Close Time/Exit Time column)
- "pnl" (for any P&L/Profit column)
- "commission" (for any Commission/Fee column)
- "swap" (for any Swap/Overnight fee column)
- "unique_id" (for any ID/TradeId column)
- "unknown" (for columns that don't match any field type)

Return ONLY this JSON format:
{{
  "file_type": "futures|cfd|stocks|forex",
  "data_start_row": <row_number_where_actual_data_begins>,
  "column_mapping": {{
    "column_0": "<STANDARDIZED_field_name>",
    "column_1": "<STANDARDIZED_field_name>",
    "column_2": "<STANDARDIZED_field_name>"
    // ... continue for all columns found
  }},
  "confidence": "high|medium|low",
  "total_columns_detected": <number>,
  "required_fields_found": ["symbol", "direction", "quantity", "price", "timestamp", "unique_id"], // for futures OR ["symbol", "direction", "quantity", "entry_price", "exit_price", "entry_time", "exit_time", "pnl"], // for CFD
  "mapping_strategy": "one_to_one_priority_based",
  "futures_specific_fields": ["tick_size", "account", "status"], // only if file_type is futures
  "cfd_specific_fields": ["entry_price", "exit_price", "entry_time", "exit_time", "pnl", "commission", "swap"] // only if file_type is cfd/stocks/forex
}}

CRITICAL RULES:
- Analyze BOTH header names AND data patterns
- Map each field type to EXACTLY ONE column (one-to-one mapping)
- Map each column to EXACTLY ONE field type (no duplicates)
- Use STANDARDIZED field names in output
- When multiple columns could work, choose the highest priority one
- If row 0 contains headers, set data_start_row = 1
- If row 0 contains data, set data_start_row = 0
"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a trading file structure analyzer specialized in futures, CFD, stocks, and forex file formats. You detect file types and map columns using FIFO calculation priorities. Always respond with valid JSON only."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Low temperature for consistency
            max_tokens=800,   # Increased for enhanced response
            presence_penalty=0.1
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Validate response size to ensure it's just structure mapping
        if len(response_text) > 2000:
            pass
            return _get_fallback_analysis(file_content, filename)
        
        # Parse the JSON response with validation
        try:
            analysis_result = json.loads(response_text)
            
            # Validate the response structure
            required_fields = ['data_start_row', 'column_mapping', 'confidence', 'file_type']
            if not all(field in analysis_result for field in required_fields):
                pass
                return _get_fallback_analysis(file_content, filename)
                
            # CRITICAL FIX: Check if AI mapped everything as 'unknown'
            column_mapping = analysis_result.get('column_mapping', {})
            unknown_count = sum(1 for field in column_mapping.values() if field == 'unknown')
            total_columns = len(column_mapping)
            
            if total_columns > 0 and unknown_count == total_columns:
                pass
                return _get_header_based_fallback(file_content, filename)
            elif unknown_count > total_columns * 0.8:  # More than 80% unknown
                pass
                return _enhance_with_header_analysis(analysis_result, file_content, filename)
                
            # Validate data_start_row is reasonable
            if analysis_result.get('data_start_row', 0) > 50:
                pass
                return _get_fallback_analysis(file_content, filename)
                
            pass
            pass
            return analysis_result
            
        except json.JSONDecodeError:
            # If JSON parsing fails, try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    analysis_result = json.loads(json_match.group())
                    return analysis_result
                except json.JSONDecodeError:
                    pass
            
            pass
            return _get_fallback_analysis(file_content, filename)
                
    except Exception as e:
        pass
        return _get_fallback_analysis(file_content, filename)


def _get_fallback_analysis(file_content: bytes, filename: str) -> Dict:
    """Provide a safe fallback when AI analysis fails"""
    return {
        "data_start_row": 0,
        "column_mapping": {
            "column_0": "unknown",
            "column_1": "unknown",
            "column_2": "unknown"
        },
        "confidence": "low",
        "total_columns_detected": 3,
        "fallback_used": True
    }


def extract_mt5_positions_from_xlsx(file_content: bytes) -> Optional[pd.DataFrame]:
    """
    Extract only the Positions section from MT5 XLSX reports.
    Returns None if this doesn't appear to be an MT5 report.
    """
    try:
        # Read the entire Excel file to analyze structure
        df_full = pd.read_excel(io.BytesIO(file_content), header=None)
        
        # Convert all cells to strings for text analysis
        df_str = df_full.astype(str)
        
        # Look for "Positions" section header
        positions_row = None
        for idx, row in df_str.iterrows():
            if any('Positions' in str(cell) for cell in row if pd.notna(cell)):
                positions_row = idx
                break
        
        if positions_row is None:
            pass
            return None
            
        # Look for the header row after Positions (should contain Time, Symbol, etc.)
        header_row = None
        for idx in range(positions_row + 1, min(positions_row + 5, len(df_full))):
            row_values = [str(cell).lower() for cell in df_full.iloc[idx] if pd.notna(cell)]
            # Check if this row contains typical trading headers
            if any(header in ' '.join(row_values) for header in ['time', 'symbol', 'type', 'volume', 'price']):
                header_row = idx
                break
                
        if header_row is None:
            pass
            return None
            
        # Find the end of positions data (look for next section or summary)
        data_end_row = len(df_full)
        for idx in range(header_row + 1, len(df_full)):
            row_values = [str(cell) for cell in df_full.iloc[idx] if pd.notna(cell)]
            row_text = ' '.join(row_values).lower()
            
            # Stop if we hit Orders section, summary statistics, or mostly empty rows
            if ('orders' in row_text or 
                'total' in row_text or 
                'profit' in row_text or
                'balance' in row_text or
                len([cell for cell in row_values if cell.strip() and cell != 'nan']) < 3):
                data_end_row = idx
                break
                
        # Extract just the positions data (header + data rows)
        positions_df = df_full.iloc[header_row:data_end_row].copy()
        
        # Reset index and create generic column names
        positions_df.reset_index(drop=True, inplace=True)
        positions_df.columns = [f'column_{i}' for i in range(len(positions_df.columns))]
        
        pass
        return positions_df
        
    except Exception as e:
        pass
        return None


async def _process_csv_with_ai_mapping(file: UploadFile, analysis: Dict, broker_timezone: str) -> List[ProcessedTradeData]:
    """Convert file data to standardized trade format using analysis results with deterministic code"""
    
    try:
        # Read file content once
        file_content = await file.read()
        
        # Determine file type and read accordingly
        file_ext = file.filename.lower().split('.')[-1] if file.filename else 'csv'
        
        # Get where data starts from analysis
        data_start_row = analysis.get('data_start_row', 0)
        column_mappings = analysis.get('column_mapping', {})
        
        pass
        pass
        
        # Handle file reading based on type
        if file_ext == 'csv':
            # Parse file into lines first to handle complex structures
            file_text = file_content.decode('utf-8')
            lines = file_text.split('\n')
            
            # CRITICAL FIX: When data_start_row is 0, there are NO headers - all rows are trade data
            # When data_start_row is > 0, skip that many header rows
            if data_start_row == 0:
                # No headers - use all data rows, create generic column names
                pass
                # Don't skip any lines - use all data
                clean_lines = [line for line in lines if line.strip()]  # Remove only empty lines
                clean_csv_content = '\n'.join(clean_lines)
                
                # Parse without header
                df = pd.read_csv(io.StringIO(clean_csv_content), header=None)
                # Create generic column names that match our mapping
                df.columns = [f'column_{i}' for i in range(len(df.columns))]
                
            else:
                # Headers exist - skip header lines and use remaining data
                pass
                clean_lines = lines[data_start_row:]
                clean_csv_content = '\n'.join(clean_lines)
                
                # Parse CSV without headers since we already skipped them
                df = pd.read_csv(io.StringIO(clean_csv_content), header=None)
                # Create generic column names that match our mapping
                df.columns = [f'column_{i}' for i in range(len(df.columns))]
            
        elif file_ext in ['xlsx', 'xls']:
            # First try MT5-specific extraction
            mt5_data = extract_mt5_positions_from_xlsx(file_content)
            if mt5_data is not None:
                df = mt5_data
                pass
            else:
                # Fallback to standard Excel parsing
                if data_start_row == 0:
                    # No headers - use generic names
                    df = pd.read_excel(io.BytesIO(file_content), header=None)
                    df.columns = [f'column_{i}' for i in range(len(df.columns))]
                    pass
                else:
                    # Headers exist - preserve them for AI semantic analysis
                    df = pd.read_excel(io.BytesIO(file_content), skiprows=data_start_row-1, header=0)
                    pass
                pass
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        pass
        pass
        
        # Process each row with deterministic code
        trades = []
        skipped_rows = []
        for idx, row in df.iterrows():
            try:
                trade_data = _convert_row_to_trade(row, df.columns, column_mappings, idx, broker_timezone)
                if trade_data:  # Only add valid trades
                    trades.append(trade_data)
                else:
                    # Log details about skipped row
                    symbol_col = None
                    for col_idx, field_name in column_mappings.items():
                        if field_name.lower() == 'symbol':
                            col_num = int(col_idx.replace('column_', ''))
                            if col_num < len(df.columns):
                                symbol_col = df.columns[col_num]
                                break
                    
                    symbol_value = row[symbol_col] if symbol_col and symbol_col in row else "NO_SYMBOL_COLUMN"
                    skipped_info = {
                        "row_index": idx,
                        "symbol_value": symbol_value,
                        "row_data": dict(row.head(5))  # First 5 columns for debugging
                    }
                    skipped_rows.append(skipped_info)
                    pass
            except Exception as e:
                pass
                skipped_rows.append({"row_index": idx, "error": str(e)})
                continue  # Skip invalid rows but continue processing
        
        pass
        if skipped_rows:
            pass
        return trades
        
    except Exception as e:
        pass
        raise ValueError(f"Failed to process file data: {str(e)}") from e


def _convert_row_to_trade(row: pd.Series, columns: List[str], column_mapping: Dict[str, str], row_index: int, broker_timezone: str) -> ProcessedTradeData | None:
    """Convert a single row to a trade using deterministic FIFO-priority logic"""
    
    trade_data = ProcessedTradeData()
    raw_data = {}
    
    # Get timezone object
    try:
        trade_timezone = pytz.timezone(broker_timezone)
    except pytz.UnknownTimeZoneError:
        # Fallback to UTC if timezone is invalid
        pass
        trade_timezone = pytz.utc

    # Extract file type and required fields from analysis
    file_type = column_mapping.get('file_type', 'unknown')
    
    # Create single-column mappings to prevent duplicates
    field_to_column = {}
    
    # First pass: identify best column for each field type using FIFO priorities
    for col_idx, field_name in column_mapping.items():
        if col_idx.startswith('file_type') or col_idx in ['confidence', 'total_columns_detected', 'required_fields_found', 'futures_specific_fields', 'mapping_strategy']:
            continue  # Skip metadata fields
            
        if field_name == 'unknown':
            continue  # Skip unknown fields
            
        # If this field type isn't mapped yet, or this column has higher priority, use it
        if field_name not in field_to_column:
            field_to_column[field_name] = col_idx
        # TODO: Add priority logic here if we get multiple mappings
    
    # Time processing logic
    def process_time(time_str):
        if not time_str or pd.isna(time_str):
            return None
        try:
            # First, try standard datetime formats
            naive_dt = pd.to_datetime(time_str).to_pydatetime()
        except (ValueError, TypeError):
            # Fallback for non-standard formats if needed
            try:
                # Example custom format: '2023.05.10 08:30:00'
                naive_dt = datetime.strptime(str(time_str), '%Y.%m.%d %H:%M:%S')
            except (ValueError, TypeError):
                pass
                return None
        
        # Localize to broker timezone, then convert to UTC and format as ISO string
        localized_dt = trade_timezone.localize(naive_dt, is_dst=None) # is_dst=None handles ambiguous times
        utc_dt = localized_dt.astimezone(pytz.utc)
        return utc_dt.isoformat()

    # Second pass: map data using the unified column mapping
    for field_name, col_idx in field_to_column.items():
        try:
            col_num = int(col_idx.replace('column_', ''))
            
            if col_num >= len(columns):
                continue
                
            col_name = columns[col_num]
            value = row[col_name] if col_name in row else None
            
            # Store raw data for debugging
            raw_data[f"col_{col_num}_{col_name}"] = value
            
            # Skip empty fields
            if value is None or (isinstance(value, str) and not value.strip()):
                continue
            
            # Handle time fields with timezone conversion
            if 'time' in field_name.lower():
                time_val = process_time(value)
                if not time_val:
                    pass
                    return None # Skip row if time is invalid
                
                if field_name == 'entry_time' or field_name == 'timestamp':
                    trade_data.openTime = time_val
                elif field_name == 'exit_time':
                    trade_data.closeTime = time_val
            
            # Handle numeric fields
            elif field_name in ['quantity', 'entry_price', 'exit_price', 'price', 'pnl', 'commission', 'swap']:
                numeric_value = pd.to_numeric(value, errors='coerce')
                if pd.isna(numeric_value):
                    pass
                    return None # Skip row if critical numeric value is invalid
                
                if field_name == 'quantity':
                    trade_data.lots = numeric_value
                elif field_name == 'entry_price' or field_name == 'price':
                    trade_data.openPrice = numeric_value
                elif field_name == 'exit_price':
                    trade_data.closePrice = numeric_value
                elif field_name == 'pnl':
                    trade_data.pnl = numeric_value
                elif field_name == 'commission':
                    trade_data.commission = numeric_value
                elif field_name == 'swap':
                    trade_data.swap = numeric_value
            
            # Handle string fields
            elif field_name == 'symbol':
                trade_data.symbol = str(value)
            elif field_name == 'direction':
                trade_data.type = str(value)
            
            # Store all original data for debugging
            raw_data[field_name] = value

        except Exception as e:
            pass
            return None # Skip row on error

    trade_data.raw_row_data = raw_data

    # Final validation for CFD/Forex trades
    if file_type != 'futures':
        if not all([trade_data.openTime, trade_data.closeTime, trade_data.openPrice, trade_data.closePrice, trade_data.symbol, trade_data.type]):
            pass
            return None

    return trade_data

@router.get("/health", response_model=Dict[str, str])
def discount_health_check():
    return {"status": "healthy", "service": "file_analysis"}

def simple_fifo_aggregation(fills: List[ProcessedTradeData]) -> List[ProcessedTradeData]:
    """Convert individual fills into aggregated round-trip trades using FIFO matching
    
    This function groups partial fills into complete round-trip trades instead of 
    creating separate trade entries for each partial close.
    """
    # Group by symbol
    symbol_groups = {}
    for fill in fills:
        symbol = fill.symbol
        if symbol not in symbol_groups:
            symbol_groups[symbol] = []
        symbol_groups[symbol].append(fill)
    
    round_trips = []
    
    for symbol, fills_for_symbol in symbol_groups.items():
        # Sort by time for FIFO
        fills_for_symbol.sort(key=lambda x: x.openTime)
        
        # Track open positions and partial fills
        open_positions = []  # List of open position entries
        aggregated_trades = {}  # Track trades being built from partial fills
        
        # Process fills chronologically
        for fill in fills_for_symbol:
            if fill.type.lower() in ['buy', 'b']:
                # This is a buy - either opens long or closes short
                remaining_qty = fill.lots
                
                # First, try to close existing short positions
                for pos in open_positions[:]:
                    if pos['direction'] == 'short' and remaining_qty > 0:
                        close_qty = min(remaining_qty, pos['remaining_qty'])
                        
                        # Get or create aggregated trade for this position
                        pos_key = f"short_{pos['entry_time']}_{pos['entry_price']}"
                        
                        if pos_key not in aggregated_trades:
                            aggregated_trades[pos_key] = {
                                'symbol': symbol,
                                'direction': 'short',
                                'entry_time': pos['entry_time'],
                                'entry_price': pos['entry_price'],
                                'entry_qty': pos['original_qty'],
                                'exit_fills': [],
                                'total_closed_qty': 0,
                                'entry_fill': pos['entry_fill']
                            }
                        
                        # Add this partial close to the aggregated trade
                        aggregated_trades[pos_key]['exit_fills'].append({
                            'time': fill.openTime,
                            'price': fill.openPrice,
                            'qty': close_qty,
                            'fill': fill
                        })
                        aggregated_trades[pos_key]['total_closed_qty'] += close_qty
                        
                        # Update quantities
                        remaining_qty -= close_qty
                        pos['remaining_qty'] -= close_qty
                        
                        # If position fully closed, finalize the trade
                        if pos['remaining_qty'] <= 0:
                            open_positions.remove(pos)
                            # Will be converted to ProcessedTradeData later
                
                # If there's remaining quantity, open new long position
                if remaining_qty > 0:
                    open_positions.append({
                        'direction': 'long',
                        'entry_time': fill.openTime,
                        'entry_price': fill.openPrice,
                        'remaining_qty': remaining_qty,
                        'original_qty': remaining_qty,
                        'entry_fill': fill
                    })
                    
            elif fill.type.lower() in ['sell', 's']:
                # This is a sell - either opens short or closes long
                remaining_qty = fill.lots
                
                # First, try to close existing long positions
                for pos in open_positions[:]:
                    if pos['direction'] == 'long' and remaining_qty > 0:
                        close_qty = min(remaining_qty, pos['remaining_qty'])
                        
                        # Get or create aggregated trade for this position
                        pos_key = f"long_{pos['entry_time']}_{pos['entry_price']}"
                        
                        if pos_key not in aggregated_trades:
                            aggregated_trades[pos_key] = {
                                'symbol': symbol,
                                'direction': 'long',
                                'entry_time': pos['entry_time'],
                                'entry_price': pos['entry_price'],
                                'entry_qty': pos['original_qty'],
                                'exit_fills': [],
                                'total_closed_qty': 0,
                                'entry_fill': pos['entry_fill']
                            }
                        
                        # Add this partial close to the aggregated trade
                        aggregated_trades[pos_key]['exit_fills'].append({
                            'time': fill.openTime,
                            'price': fill.openPrice,
                            'qty': close_qty,
                            'fill': fill
                        })
                        aggregated_trades[pos_key]['total_closed_qty'] += close_qty
                        
                        # Update quantities
                        remaining_qty -= close_qty
                        pos['remaining_qty'] -= close_qty
                        
                        # If position fully closed, finalize the trade
                        if pos['remaining_qty'] <= 0:
                            open_positions.remove(pos)
                
                # If there's remaining quantity, open new short position
                if remaining_qty > 0:
                    open_positions.append({
                        'direction': 'short',
                        'entry_time': fill.openTime,
                        'entry_price': fill.openPrice,
                        'remaining_qty': remaining_qty,
                        'original_qty': remaining_qty,
                        'entry_fill': fill
                    })
        
        # Convert aggregated trades to ProcessedTradeData
        for trade_key, trade_data in aggregated_trades.items():
            if len(trade_data['exit_fills']) > 0:
                # Calculate weighted average exit price
                total_exit_value = sum(ef['price'] * ef['qty'] for ef in trade_data['exit_fills'])
                total_exit_qty = sum(ef['qty'] for ef in trade_data['exit_fills'])
                weighted_exit_price = total_exit_value / total_exit_qty
                
                # Calculate aggregated P&L using CME specifications
                realized_pnl, metadata = calculate_futures_pnl(
                    symbol=symbol,
                    entry_price=trade_data['entry_price'],
                    exit_price=weighted_exit_price,
                    quantity=total_exit_qty,
                    trade_direction=trade_data['direction']
                )
                
                # Aggregate commissions and swaps from all fills
                total_commission = (trade_data['entry_fill'].commission or 0)
                total_swap = (trade_data['entry_fill'].swap or 0)
                
                for ef in trade_data['exit_fills']:
                    total_commission += (ef['fill'].commission or 0)
                    total_swap += (ef['fill'].swap or 0)
                
                net_pnl = realized_pnl - total_commission - total_swap
                
                # Get close time (last exit fill)
                last_exit = max(trade_data['exit_fills'], key=lambda x: x['time'])
                
                # Create aggregated round-trip trade
                roundtrip = ProcessedTradeData(
                    symbol=symbol,
                    openTime=trade_data['entry_time'],
                    closeTime=last_exit['time'],
                    openPrice=trade_data['entry_price'],
                    closePrice=weighted_exit_price,
                    lots=total_exit_qty,
                    type=trade_data['direction'],
                    pnl=realized_pnl,
                    commission=total_commission,
                    swap=total_swap,
                    raw_row_data={
                        'calculation_method': metadata.get('calculation_method', 'aggregated_fifo'),
                        'net_pnl': net_pnl,
                        'trade_direction': trade_data['direction'],
                        'entry_type': 'buy' if trade_data['direction'] == 'long' else 'sell',
                        'exit_type': 'sell' if trade_data['direction'] == 'long' else 'buy',
                        'partial_fills_count': len(trade_data['exit_fills']),
                        'weighted_exit_price': weighted_exit_price,
                        'entry_fill_id': trade_data['entry_fill'].raw_row_data.get('id', ''),
                        'exit_fill_ids': [ef['fill'].raw_row_data.get('id', '') for ef in trade_data['exit_fills']],
                        'cme_metadata': metadata
                    }
                )
                round_trips.append(roundtrip)
    
    pass
    return round_trips

def _get_header_based_fallback(file_content: bytes, filename: str) -> Dict:
    """Provide intelligent header-based mapping when AI analysis fails"""
    try:
        # Extract file extension
        file_ext = filename.lower().split('.')[-1]
        
        if file_ext == 'csv':
            # Parse CSV to get headers
            file_text = file_content.decode('utf-8', errors='ignore')
            lines = file_text.split('\n')
            
            # Find the header row (first non-empty line with commas)
            header_line = None
            data_start_row = 0
            
            for i, line in enumerate(lines[:10]):  # Check first 10 lines
                line = line.strip()
                if line and ',' in line:
                    header_line = line
                    data_start_row = i + 1  # Data starts after header
                    break
            
            if not header_line:
                # No headers found, assume data starts at row 0
                header_line = lines[0] if lines else ""
                data_start_row = 0
            
            # Parse headers
            headers = [h.strip().strip('"').strip("'") for h in header_line.split(',')]
            
            # Create intelligent mapping based on header names
            column_mapping = {}
            file_type = "forex"  # Default
            
            for i, header in enumerate(headers):
                col_key = f"column_{i}"
                header_lower = header.lower().replace(' ', '').replace('_', '')
                
                # Symbol/Instrument mapping
                if any(pattern in header_lower for pattern in ['symbol', 'instrument', 'contract', 'pair', 'asset']):
                    column_mapping[col_key] = "symbol"
                    # Detect file type from symbol column name
                    if 'contract' in header_lower:
                        file_type = "futures"
                    elif any(p in header_lower for p in ['pair', 'forex']):
                        file_type = "forex"
                        
                # Direction/Side mapping
                elif any(pattern in header_lower for pattern in ['side', 'direction', 'action', 'type', 'bs', 'buysell']):
                    column_mapping[col_key] = "direction"
                    
                # Quantity/Volume mapping
                elif any(pattern in header_lower for pattern in ['quantity', 'qty', 'volume', 'size', 'lots', 'units', 'filledqty']):
                    column_mapping[col_key] = "quantity"
                    
                # Price mapping
                elif any(pattern in header_lower for pattern in ['price', 'avgprice', 'fillprice', 'averageprice']):
                    if 'entry' in header_lower or 'open' in header_lower:
                        column_mapping[col_key] = "entry_price"
                    elif 'exit' in header_lower or 'close' in header_lower:
                        column_mapping[col_key] = "exit_price"
                    else:
                        column_mapping[col_key] = "price"
                        
                # Time mapping
                elif any(pattern in header_lower for pattern in ['time', 'date', 'timestamp']):
                    if 'entry' in header_lower or 'open' in header_lower:
                        column_mapping[col_key] = "entry_time"
                    elif 'exit' in header_lower or 'close' in header_lower:
                        column_mapping[col_key] = "exit_time"
                    else:
                        column_mapping[col_key] = "timestamp"
                        
                # P&L mapping
                elif any(pattern in header_lower for pattern in ['pnl', 'profit', 'loss', 'pl', 'netprofit', 'netpnl']):
                    column_mapping[col_key] = "pnl"
                    
                # Commission mapping
                elif any(pattern in header_lower for pattern in ['commission', 'fee', 'cost']):
                    column_mapping[col_key] = "commission"
                    
                # Swap mapping
                elif any(pattern in header_lower for pattern in ['swap', 'rollover']):
                    column_mapping[col_key] = "swap"
                    
                # ID mapping
                elif any(pattern in header_lower for pattern in ['id', 'orderid', 'tradeid', 'ticket']):
                    column_mapping[col_key] = "unique_id"
                    
                # Account mapping
                elif any(pattern in header_lower for pattern in ['account', 'login']):
                    column_mapping[col_key] = "account"
                    
                else:
                    column_mapping[col_key] = "unknown"
            
            # Count mapped fields
            mapped_fields = [f for f in column_mapping.values() if f != 'unknown']
            confidence = "high" if len(mapped_fields) >= 4 else "medium" if len(mapped_fields) >= 2 else "low"
            
            pass
            pass
            
            return {
                "file_type": file_type,
                "data_start_row": data_start_row,
                "column_mapping": column_mapping,
                "confidence": confidence,
                "total_columns_detected": len(headers),
                "required_fields_found": [f for f in mapped_fields if f in ['symbol', 'direction', 'quantity', 'price', 'timestamp']],
                "mapping_strategy": "header_based_fallback",
                "fallback_used": True
            }
            
        elif file_ext in ['xlsx', 'xls']:
            # For Excel files, try to extract positions data
            positions_df = extract_mt5_positions_from_xlsx(file_content)
            if positions_df is not None and len(positions_df) > 1:
                # Use the first row as headers
                headers = [str(col) for col in positions_df.iloc[0]]
                # Apply same header mapping logic as CSV
                return _map_excel_headers_to_fields(headers)
                
        # Default fallback if we can't parse the file
        return {
            "data_start_row": 0,
            "column_mapping": {"column_0": "unknown", "column_1": "unknown", "column_2": "unknown"},
            "confidence": "low",
            "total_columns_detected": 3,
            "fallback_used": True,
            "file_type": "unknown"
        }
        
    except Exception as e:
        pass
        return {
            "data_start_row": 0,
            "column_mapping": {"column_0": "unknown", "column_1": "unknown", "column_2": "unknown"},
            "confidence": "low",
            "total_columns_detected": 3,
            "fallback_used": True,
            "file_type": "unknown"
        }

def _map_excel_headers_to_fields(headers: List[str]) -> Dict:
    """Map Excel headers to standardized fields"""
    # Create a mapping dictionary
    column_mapping = {}
    file_type = "forex"  # Default file type
    
    # Apply header mapping logic
    for i, header in enumerate(headers):
        col_key = f"column_{i}"
        header_lower = header.lower().replace(' ', '').replace('_', '')
        
        # Symbol/Instrument mapping
        if any(pattern in header_lower for pattern in ['symbol', 'instrument', 'contract', 'pair', 'asset']):
            column_mapping[col_key] = "symbol"
            # Detect file type from symbol column name
            if 'contract' in header_lower:
                file_type = "futures"
            elif any(p in header_lower for p in ['pair', 'forex']):
                file_type = "forex"
                
        # Direction/Side mapping
        elif any(pattern in header_lower for pattern in ['side', 'direction', 'action', 'type', 'bs', 'buysell']):
            column_mapping[col_key] = "direction"
            
        # Quantity/Volume mapping
        elif any(pattern in header_lower for pattern in ['quantity', 'qty', 'volume', 'size', 'lots', 'units', 'filledqty']):
            column_mapping[col_key] = "quantity"
            
        # Price mapping
        elif any(pattern in header_lower for pattern in ['price', 'avgprice', 'fillprice', 'averageprice']):
            if 'entry' in header_lower or 'open' in header_lower:
                column_mapping[col_key] = "entry_price"
            elif 'exit' in header_lower or 'close' in header_lower:
                column_mapping[col_key] = "exit_price"
            else:
                column_mapping[col_key] = "price"
                
        # Time mapping
        elif any(pattern in header_lower for pattern in ['time', 'date', 'timestamp']):
            if 'entry' in header_lower or 'open' in header_lower:
                column_mapping[col_key] = "entry_time"
            elif 'exit' in header_lower or 'close' in header_lower:
                column_mapping[col_key] = "exit_time"
            else:
                column_mapping[col_key] = "timestamp"
                
        # P&L mapping
        elif any(pattern in header_lower for pattern in ['pnl', 'profit', 'loss', 'pl', 'netprofit', 'netpnl']):
            column_mapping[col_key] = "pnl"
            
        # Commission mapping
        elif any(pattern in header_lower for pattern in ['commission', 'fee', 'cost']):
            column_mapping[col_key] = "commission"
            
        # Swap mapping
        elif any(pattern in header_lower for pattern in ['swap', 'rollover']):
            column_mapping[col_key] = "swap"
            
        # ID mapping
        elif any(pattern in header_lower for pattern in ['id', 'orderid', 'tradeid', 'ticket']):
            column_mapping[col_key] = "unique_id"
            
        # Account mapping
        elif any(pattern in header_lower for pattern in ['account', 'login']):
            column_mapping[col_key] = "account"
            
        else:
            column_mapping[col_key] = "unknown"
    
    # Count mapped fields
    mapped_fields = [f for f in column_mapping.values() if f != 'unknown']
    confidence = "high" if len(mapped_fields) >= 4 else "medium" if len(mapped_fields) >= 2 else "low"
    
    pass
    pass
    
    return {
        "file_type": file_type,
        "data_start_row": 1,
        "column_mapping": column_mapping,
        "confidence": confidence,
        "total_columns_detected": len(headers),
        "required_fields_found": [f for f in mapped_fields if f in ['symbol', 'direction', 'quantity', 'price', 'timestamp']],
        "mapping_strategy": "excel_header_based_fallback",
        "fallback_used": True
    }

def _enhance_with_header_analysis(analysis_result: Dict, file_content: bytes, filename: str) -> Dict:
    """Enhance AI analysis with header-based fallback when too many fields are unknown"""
    try:
        # Get header-based mapping
        header_analysis = _get_header_based_fallback(file_content, filename)
        
        if header_analysis.get('fallback_used'):
            # Replace unknown fields in original analysis with header-based mapping
            original_mapping = analysis_result.get('column_mapping', {})
            header_mapping = header_analysis.get('column_mapping', {})
            
            enhanced_mapping = {}
            for col_key in original_mapping:
                if original_mapping[col_key] == 'unknown' and col_key in header_mapping:
                    # Use header-based mapping for unknown fields
                    enhanced_mapping[col_key] = header_mapping[col_key]
                else:
                    # Keep original AI mapping for non-unknown fields
                    enhanced_mapping[col_key] = original_mapping[col_key]
            
            # Update the analysis result
            analysis_result['column_mapping'] = enhanced_mapping
            analysis_result['mapping_strategy'] = 'ai_enhanced_with_headers'
            analysis_result['enhanced'] = True
            
            # Recalculate confidence
            mapped_fields = [f for f in enhanced_mapping.values() if f != 'unknown']
            unknown_count = len([f for f in enhanced_mapping.values() if f == 'unknown'])
            total_count = len(enhanced_mapping)
            
            if len(mapped_fields) >= total_count * 0.8:
                analysis_result['confidence'] = 'high'
            elif len(mapped_fields) >= total_count * 0.5:
                analysis_result['confidence'] = 'medium'
            else:
                analysis_result['confidence'] = 'low'
                
            pass
            
        return analysis_result
        
    except Exception as e:
        pass
        return analysis_result

async def _check_for_identical_trade(db_firestore: firestore.Client, user_id: str, evaluation_id: str, trade_data: Dict) -> bool:
    """Check for identical trades by querying symbol and openTime first, then comparing all fields in memory."""
    
    try:
        # Get the collection of trades for the specified evaluation
        trades_collection = db_firestore.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades")
        
        # Define the key fields that must match exactly for a duplicate
        key_fields = ['symbol', 'openTime', 'closeTime', 'quantity', 'openPrice', 'closePrice', 'pnl']
        
        # Start with the most selective query - symbol and openTime
        # Firestore limits us to max 10 equality comparisons, so we'll query by these two first
        symbol = trade_data.get('symbol')
        open_time = trade_data.get('openTime')
        
        if not symbol or not open_time:
            return False  # Can't check for duplicates without these key fields
        
        # Query for trades with matching symbol and openTime
        potential_duplicates = trades_collection.where('symbol', '==', symbol).where('openTime', '==', open_time).get()
        
        # Check each potential duplicate for exact match on ALL key fields
        for trade_doc in potential_duplicates:
            existing_trade = trade_doc.to_dict()
            
            # Check if ALL key fields match exactly
            is_identical = True
            for field in key_fields:
                new_value = trade_data.get(field)
                existing_value = existing_trade.get(field)
                
                # Handle numeric comparisons with tolerance for floating point precision
                if field in ['quantity', 'openPrice', 'closePrice', 'pnl']:
                    try:
                        new_num = float(new_value) if new_value is not None else 0
                        existing_num = float(existing_value) if existing_value is not None else 0
                        if abs(new_num - existing_num) > 0.0001:  # Small tolerance for floating point
                            is_identical = False
                            break
                    except (ValueError, TypeError):
                        if new_value != existing_value:
                            is_identical = False
                            break
                else:
                    # Exact string comparison for symbol, times
                    if new_value != existing_value:
                        is_identical = False
                        break
            
            if is_identical:
                pass
                return True
        
        return False  # No identical trade found
    
    except Exception as e:
        pass
        return False  # Proceed with saving in case of error

def _parse_field_value(value: Any, field_name: str) -> Any:
    """Parse field values using deterministic logic instead of AI"""

    if pd.isna(value) or value == '':
        return None
    
    try:
        # Handle different field types with specific conversion logic
        if field_name in ['opentime', 'closetime', 'datetime']:
            return _parse_datetime(value)
        
        elif field_name in ['openprice', 'closeprice', 'pnl', 'profit', 'commission', 'commissions', 'swap', 'lots', 'volume', 'size', 'price', 'number', 'pnl']:
            return _parse_number(value)
        
        elif field_name in ['symbol', 'type', 'account_id', 'string']:
            return _parse_string(value)
        
        else:
            # For unknown fields, try to infer type
            return _auto_convert(value)

    except Exception as e:
        pass
        return None


def _parse_datetime(value: Any) -> str:
    """Parse various datetime formats into ISO string"""
    if isinstance(value, str):
        # Try common datetime formats
        formats = [
            '%Y.%m.%d %H:%M:%S',  # Excel format with dots
            '%Y.%m.%d %H:%M',     # Excel format with dots (no seconds)
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d %H:%M',
            '%Y-%m-%d',
            '%m/%d/%Y %H:%M:%S',
            '%m/%d/%Y %H:%M',
            '%m/%d/%Y',
            '%d/%m/%Y %H:%M:%S',
            '%d/%m/%Y %H:%M',
            '%d/%m/%Y',
            '%H:%M:%S',
            '%H:%M'
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(value, fmt)
                # If only time is provided, assume today's date
                if fmt in ['%H:%M:%S', '%H:%M']:
                    dt = dt.replace(year=datetime.now().year, month=datetime.now().month, day=datetime.now().day)
                return dt.isoformat()
            except ValueError:
                continue
                
        # If no format works, return as string
        return value
    
    elif hasattr(value, 'isoformat'):  # datetime object
        return value.isoformat()
    
    else:
        return str(value)


def _parse_datetime_with_timezone(value: Any, timezone_str: str) -> Optional[str]:
    """Parse a datetime string with a given timezone and convert to UTC ISO string."""
    if pd.isna(value) or value == '':
        return None

    try:
        tz = pytz.timezone(timezone_str)
    except pytz.UnknownTimeZoneError:
        pass
        tz = pytz.utc

    naive_dt = None
    if isinstance(value, str):
        # Add more formats as needed
        formats = [
            '%Y.%m.%d %H:%M:%S',
            '%Y-%m-%d %H:%M:%S',
            '%m/%d/%Y %H:%M:%S',
            '%Y.%m.%d %H:%M',
            '%Y-%m-%d %H:%M',
            '%m/%d/%Y %H:%M',
        ]
        for fmt in formats:
            try:
                naive_dt = datetime.strptime(value, fmt)
                break
            except ValueError:
                continue
    elif hasattr(value, 'to_pydatetime'): # Handle pandas Timestamp
        naive_dt = value.to_pydatetime()

    if naive_dt is None:
        try: # Fallback for pandas auto-parsing
            naive_dt = pd.to_datetime(value).to_pydatetime()
        except (ValueError, TypeError):
             pass
             return None

    # Localize the naive datetime and convert to UTC
    localized_dt = tz.localize(naive_dt, is_dst=None)
    utc_dt = localized_dt.astimezone(pytz.utc)
    return utc_dt.isoformat()


def _parse_number(value: Any) -> float:
    """Parse various number formats"""
    if isinstance(value, (int, float)):
        return float(value)
    elif isinstance(value, str):
        # Handle comma as decimal separator
        if ',' in value and '.' not in value:
            value = value.replace(',', '.')
        try:
            return float(value)
        except ValueError:
            pass
            return None
    else:
        pass
        return None


def _parse_string(value: Any) -> str:
    """Parse string values"""
    if pd.isna(value):
        return ""
    elif isinstance(value, str):
        return value.strip()
    else:
        return str(value)


def _auto_convert(value: Any) -> Any:
    """Try to automatically convert value to appropriate type"""
    if pd.isna(value):
        return None
    elif isinstance(value, (int, float, str)):
        return value
    elif hasattr(value, 'to_pydatetime'): # Handle pandas Timestamp
        return value.to_pydatetime().isoformat()
    else:
        return str(value)
