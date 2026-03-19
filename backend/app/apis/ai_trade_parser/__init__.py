


from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from openai import OpenAI
import pandas as pd
import json
import io
from datetime import datetime
import re
from app.auth import AuthorizedUser
from app.libs.trade_parser_prompt import (
    SYSTEM_MESSAGE, 
    build_parsing_prompt,
    ParseResponse,
    ParsedTradeAnalysis,
    ParsedTrade,
    OPENAI_FUNCTION_SCHEMA
)
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
import os

# Import file processing libraries
try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

try:
    import magic
except ImportError:
    magic = None

router = APIRouter(prefix="/ai-trade-parser")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class FileUploadResponse(BaseModel):
    success: bool
    file_id: str = ""
    file_type: str = ""
    file_size: int = 0
    analysis: Optional[ParsedTradeAnalysis] = None
    errors: List[str] = []
    processing_time_ms: int = 0

class SupportedFormat(BaseModel):
    extension: str
    description: str
    example_source: str
    confidence: str

class ParseValidationRequest(BaseModel):
    trade_data: Dict[str, Any]

class ParseValidationResponse(BaseModel):
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    suggested_fixes: List[str]

# ============================================================================
# FILE PROCESSING FUNCTIONS
# ============================================================================

def detect_file_type(filename: str) -> str:
    """Detect file type from filename"""
    
    # Check by extension first
    if filename.lower().endswith('.csv'):
        return 'csv'
    elif filename.lower().endswith(('.xlsx', '.xls')):
        return 'excel'
    elif filename.lower().endswith('.html'):
        return 'html'
    elif filename.lower().endswith('.pdf'):
        return 'pdf'
    elif filename.lower().endswith('.txt'):
        return 'text'
    
    # Fallback to text
    return 'text'

# ============================================================================
# OPENAI INTEGRATION FUNCTIONS
# ============================================================================

def parse_trades_with_openai(text_content: str, file_type: str = "unknown") -> ParseResponse:
    """Parse trading data using OpenAI with structured output"""
    
    try:
        # Build the parsing prompt
        user_prompt = build_parsing_prompt(text_content, file_type)
        
        # Call OpenAI with function calling for structured output
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_MESSAGE},
                {"role": "user", "content": user_prompt}
            ],
            functions=[OPENAI_FUNCTION_SCHEMA],
            function_call={"name": "parse_trading_data"},
            temperature=0.1,  # Low temperature for consistent parsing
            max_tokens=4000
        )
        
        # Extract function call result
        function_call = response.choices[0].message.function_call
        if not function_call or function_call.name != "parse_trading_data":
            raise Exception("OpenAI did not return expected function call")
        
        # Parse the JSON response
        response_text = function_call.arguments
        pass
        pass
        
        # Parse the JSON response
        parsed_data = json.loads(response_text)
        
        # Debug: log the parsed structure
        if "analysis" in parsed_data and "trades" in parsed_data["analysis"]:
            trades = parsed_data["analysis"]["trades"]
            pass
            for i, trade in enumerate(trades[:3]):  # Log first 3 trades
                pass
        
        return ParseResponse(**parsed_data)
        
    except json.JSONDecodeError as e:
        return ParseResponse(
            success=False,
            analysis=ParsedTradeAnalysis(
                total_trades_found=0,
                parsing_confidence="low",
                detected_broker="Unknown",
                trades=[]
            ),
            errors=[f"Failed to parse OpenAI response: {str(e)}"]
        )
    except Exception as e:
        return ParseResponse(
            success=False,
            analysis=ParsedTradeAnalysis(
                total_trades_found=0,
                parsing_confidence="low",
                detected_broker="Unknown",
                trades=[]
            ),
            errors=[f"OpenAI parsing failed: {str(e)}"]
        )

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

def validate_trade_data(trade_data: Dict[str, Any]) -> List[str]:
    """Validate a single parsed trade and return list of errors"""
    errors = []
    
    # Required fields
    required_fields = ['symbol', 'open_time', 'close_time', 'entry_price', 'exit_price', 'volume', 'side', 'gross_pnl']
    for field in required_fields:
        if field not in trade_data or trade_data[field] is None:
            errors.append(f"Missing required field: {field}")
    
    # Validate data types and ranges
    if 'entry_price' in trade_data and (not isinstance(trade_data['entry_price'], (int, float)) or trade_data['entry_price'] <= 0):
        errors.append("Entry price must be a positive number")
    
    if 'exit_price' in trade_data and (not isinstance(trade_data['exit_price'], (int, float)) or trade_data['exit_price'] <= 0):
        errors.append("Exit price must be a positive number")
    
    if 'volume' in trade_data and (not isinstance(trade_data['volume'], (int, float)) or trade_data['volume'] <= 0):
        errors.append("Volume must be a positive number")
    
    if 'side' in trade_data and trade_data['side'] not in ['buy', 'sell']:
        errors.append("Side must be 'buy' or 'sell'")
    
    # Validate date formats
    for date_field in ['open_time', 'close_time']:
        if date_field in trade_data:
            try:
                datetime.fromisoformat(trade_data[date_field].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                errors.append(f"{date_field} is not in valid ISO format")
    
    return errors

# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/upload-and-parse")
async def upload_and_parse_trades_endpoint(file: UploadFile, user: AuthorizedUser) -> FileUploadResponse:
    """Parse trading data from uploaded file using AI"""
    
    start_time = datetime.now()
    
    try:
        pass
        pass
        pass
        
        # Read and process file content
        file_content = await file.read()
        pass
        
        # Detect file type
        file_type = detect_file_type(file.filename or "unknown")
        pass
        
        # Convert to text based on file type
        if file_type == "csv":
            text_content = file_content.decode('utf-8')
        elif file_type == "excel":
            # Handle Excel files
            df = pd.read_excel(io.BytesIO(file_content))
            text_content = df.to_csv(index=False)
        elif file_type == "html":
            text_content = file_content.decode('utf-8')
        elif file_type == "pdf":
            # Handle PDF files (basic text extraction)
            text_content = str(file_content)  # Simplified - would need proper PDF parsing
        else:
            text_content = file_content.decode('utf-8')
        
        if not text_content or len(text_content.strip()) < 10:
            raise HTTPException(status_code=400, detail="No readable content found in file")
        
        pass
        pass
        
        # Initialize OpenAI client
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        # Parse with OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_MESSAGE},
                {"role": "user", "content": build_parsing_prompt(text_content, file_type)}
            ],
            functions=[OPENAI_FUNCTION_SCHEMA],
            function_call={"name": "parse_trading_data"},
            temperature=0.1
        )
        
        pass
        function_call = response.choices[0].message.function_call
        if not function_call:
            pass
            raise ValueError("No function call returned from AI")
            
        pass
        pass
        pass
        pass
            
        # Parse the function arguments
        try:
            ai_result = json.loads(function_call.arguments)
            pass
            pass
            pass
            
            # Log first trade details for debugging
            trades = ai_result.get('analysis', {}).get('trades', [])
            if trades:
                first_trade = trades[0]
                pass
                pass
                pass
                pass
                pass
                pass
                pass
                pass
                pass
                pass
                pass
            
        except json.JSONDecodeError as e:
            pass
            pass
            raise ValueError(f"Invalid JSON in AI response: {e}")
        
        # Calculate processing time
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        pass
        pass
        
        # Save parsed results to storage for coach access
        try:
            # Save parsed results to storage with timestamp
            if ai_result.get('success', False) and ai_result.get('analysis', {}).get('trades'):
                timestamp = int(datetime.now().timestamp())
                storage_key = f"ai_parsed_{user.sub}_{timestamp}"
                
                # Save the complete AI analysis result
                storage_data = {
                    "success": ai_result.get('success', False),
                    "file_info": {
                        "filename": file.filename,
                        "file_type": file_type,
                        "file_size": len(file_content),
                        "processing_time_ms": processing_time
                    },
                    "analysis": ai_result.get('analysis', {}),
                    "errors": ai_result.get('errors', []),
                    "timestamp": datetime.now().isoformat(),
                    "parsed_by": "ai_trade_parser",
                    "user_id": user.sub
                }
                
                try:
                    initialize_firebase()
                    db_firestore = firestore.client()
                    ts_key = str(int(datetime.now().timestamp()))
                    db_firestore.collection("users").document(user.sub).collection("ai_parse_results").document(ts_key).set(storage_data)
                except Exception as storage_error:
                    pass
        
        return FileUploadResponse(
            success=ai_result.get('success', False),
            file_id=f"file_{int(datetime.now().timestamp())}",
            file_type=file_type,
            file_size=len(file_content),
            analysis=ParsedTradeAnalysis(**ai_result.get('analysis', {})),
            errors=ai_result.get('errors', []),
            processing_time_ms=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        return FileUploadResponse(
            success=False,
            file_type="unknown",
            file_size=len(file_content) if 'file_content' in locals() else 0,
            errors=[f"Unexpected error: {str(e)}"],
            processing_time_ms=processing_time
        )

@router.get("/supported-formats")
async def get_supported_formats() -> List[SupportedFormat]:
    """Get list of supported file formats"""
    
    return [
        SupportedFormat(
            extension=".csv",
            description="Comma-separated values files from various brokers",
            example_source="MetaTrader CSV export, broker trade history",
            confidence="high"
        ),
        SupportedFormat(
            extension=".xlsx/.xls",
            description="Excel spreadsheets with trade data",
            example_source="MetaTrader Excel reports, custom trade logs",
            confidence="high"
        ),
        SupportedFormat(
            extension=".html",
            description="HTML reports with trade tables",
            example_source="MetaTrader HTML reports, broker web exports",
            confidence="high"
        ),
        SupportedFormat(
            extension=".pdf",
            description="PDF statements and reports",
            example_source="Broker statements, trading reports",
            confidence="medium"
        ),
        SupportedFormat(
            extension=".txt",
            description="Plain text files with trade data",
            example_source="Custom export formats, log files",
            confidence="medium"
        )
    ]

@router.post("/validate-parsing")
async def validate_parsed_trade_endpoint(request: ParseValidationRequest) -> ParseValidationResponse:
    """Validate a single parsed trade and suggest fixes"""
    
    try:
        errors = validate_trade_data(request.trade_data)
        warnings = []
        suggested_fixes = []
        
        # Add specific validation logic
        if 'symbol' in request.trade_data:
            symbol = request.trade_data['symbol']
            if len(symbol) < 3:
                warnings.append("Symbol appears to be very short")
                suggested_fixes.append("Verify symbol format (e.g., EURUSD, XAUUSD)")
        
        if 'volume' in request.trade_data:
            volume = request.trade_data['volume']
            if volume > 100:
                warnings.append("Volume appears very large - may be in units instead of lots")
                suggested_fixes.append("Convert units to lots (divide by 100,000 for forex)")
        
        return ParseValidationResponse(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggested_fixes=suggested_fixes
        )
        
    except Exception as e:
        return ParseValidationResponse(
            is_valid=False,
            errors=[f"Validation failed: {str(e)}"],
            warnings=[],
            suggested_fixes=["Review trade data structure and required fields"]
        )

@router.get("/health")
async def ai_parser_health_check():
    """Health check for AI trade parser"""
    
    try:
        # Test OpenAI connection
        client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        
        return {
            "status": "healthy",
            "openai_connection": "active",
            "supported_formats": ["csv", "excel", "html", "pdf", "text"],
            "features": {
                "file_upload": True,
                "structured_parsing": True,
                "multi_format_support": True,
                "validation": True
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "openai_connection": "failed"
        }
