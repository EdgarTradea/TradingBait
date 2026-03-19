"""
OpenAI Prompt System for Intelligent Trade Data Parsing

This module contains the prompt design, schema definitions, and examples
for parsing trade data from various broker formats using OpenAI.
"""

from typing import Dict, List, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

# JSON Schema for Parsed Trade Data
class ParsedTrade(BaseModel):
    """Individual trade data structure matching backend expectations"""
    
    symbol: str = Field(..., description="Trading symbol (e.g., EURUSD, XAUUSD)")
    openTime: str = Field(..., description="Trade open time in ISO format (YYYY-MM-DD HH:MM:SS)")
    closeTime: str = Field(..., description="Trade close time in ISO format (YYYY-MM-DD HH:MM:SS)")
    openPrice: float = Field(..., description="Entry price")
    closePrice: float = Field(..., description="Exit price")
    lots: float = Field(..., description="Trade volume in lots")
    type: Literal["buy", "sell"] = Field(..., description="Trade direction")
    pnl: float = Field(..., description="Net profit/loss")
    commission: float = Field(default=0.0, description="Commission fees")
    swap: float = Field(default=0.0, description="Swap/rollover fees")
    trade_id: str = Field(default="", description="Broker trade ID")
    order_type: str = Field(default="market", description="Order type")
    comment: str = Field(default="", description="Trade comment or notes")

class ParsedTradeAnalysis(BaseModel):
    """Analysis metadata for parsed trades"""
    
    total_trades_found: int = Field(..., description="Total number of trades extracted")
    detected_broker: str = Field(..., description="Detected broker or platform name")
    date_format_detected: str = Field(default="", description="Detected date format pattern")
    currency_detected: str = Field(default="USD", description="Detected account currency")
    warnings: List[str] = Field(default_factory=list, description="Any warnings or issues during parsing")
    trades: List[ParsedTrade] = Field(..., description="List of extracted trades")

class ParseResponse(BaseModel):
    """Complete parsing response structure"""
    
    success: bool = Field(..., description="Whether parsing was successful")
    analysis: ParsedTradeAnalysis = Field(..., description="Parsed trade analysis")
    errors: List[str] = Field(default_factory=list, description="Any errors encountered")
    raw_sample: List[str] = Field(default_factory=list, description="Sample of raw data processed")

# System Message Design
SYSTEM_MESSAGE = """
You are an expert trading data parser specialized in extracting trade information from various broker platforms and file formats. Your expertise covers:

**BROKER PLATFORMS:**
- MetaTrader 4/5 (MT4/MT5) HTML reports and CSV exports
- cTrader platform exports
- TradingView data
- Interactive Brokers reports
- Plus500, eToro, and other retail broker formats
- Custom spreadsheet formats

**CORE RESPONSIBILITIES:**
1. **Data Extraction**: Parse trading data from any text format (CSV, HTML tables, structured text, etc.)
2. **Format Recognition**: Automatically detect broker type and data structure
3. **Data Standardization**: Convert all data to consistent JSON format
4. **Error Handling**: Clearly identify unparseable content and missing data

**FIELD DEFINITIONS - Extract these specific values:**

**symbol**: Trading instrument/currency pair (e.g., EURUSD, GBPUSD, XAUUSD, US100cash)
**openTime**: When the trade was opened (YYYY-MM-DD HH:MM:SS format)
**closeTime**: When the trade was closed (YYYY-MM-DD HH:MM:SS format)
**openPrice**: Price at which the trade was opened/entered
**closePrice**: Price at which the trade was closed/exited
**lots**: Size of the trade in lots (e.g., 0.1 lots, 1.0 lots, 2.5 lots)
**type**: Direction of trade - "buy" (long position) or "sell" (short position)
**pnl**: Net result of the trade in account currency after all fees (positive = profit, negative = loss)
**commission**: Broker commission fees (usually negative values like -2.50)
**swap**: Overnight holding fees/credits (can be positive or negative)
**trade_id**: Unique identifier for the trade from broker (ticket number, order ID)
**order_type**: How the trade was executed ("market", "limit", "stop", etc.)
**comment**: Any notes or comments about the trade

**OUTPUT REQUIREMENTS:**
- Return ONLY valid JSON matching the ParseResponse schema
- Extract ALL trades found in the data
- Standardize date formats to ISO format (YYYY-MM-DD HH:MM:SS)
- Convert all prices to decimal numbers
- Identify buy/sell directions consistently
- Calculate Net P&L when possible
- Include commission and swap fees when available

**PARSING RULES:**
1. **Dates**: Accept various formats (MM/DD/YYYY, DD.MM.YYYY, YYYY-MM-DD, etc.) and convert to ISO
2. **Symbols**: Standardize currency pairs (EUR/USD → EURUSD, Gold → XAUUSD)
3. **Volume**: Convert to decimal lot sizes (100000 units = 1.0 lot for forex)
4. **P&L**: Extract gross profit/loss, separate from fees when possible
5. **Direction**: Identify buy/sell from various indicators (Buy/Sell, Long/Short, +/-)

**ERROR HANDLING:**
- If no trades found: Return success=false with clear explanation
- If data format unrecognizable: Provide specific guidance
- If partial parsing: Include warnings about missing/uncertain data

Process the provided trading data and return a complete ParseResponse JSON.
"""

# Few-shot Examples for Different Formats
FEW_SHOT_EXAMPLES = {
    "mt4_html": {
        "input": """
        <table>
        <tr><td>Ticket</td><td>Open Time</td><td>Type</td><td>Size</td><td>Item</td><td>Price</td><td>S/L</td><td>T/P</td><td>Close Time</td><td>Price</td><td>Commission</td><td>Swap</td><td>Profit</td></tr>
        <tr><td>12345</td><td>2024.01.15 10:30</td><td>buy</td><td>0.10</td><td>EURUSD</td><td>1.08500</td><td>0.00000</td><td>0.00000</td><td>2024.01.15 15:45</td><td>1.08750</td><td>-0.20</td><td>0.00</td><td>25.00</td></tr>
        <tr><td>12346</td><td>2024.01.16 09:15</td><td>sell</td><td>0.20</td><td>GBPUSD</td><td>1.27200</td><td>0.00000</td><td>0.00000</td><td>2024.01.16 16:30</td><td>1.27000</td><td>-0.40</td><td>-1.50</td><td>40.00</td></tr>
        </table>
        """,
        "output": {
            "success": True,
            "analysis": {
                "total_trades_found": 2,
                "detected_broker": "MetaTrader 4",
                "date_format_detected": "YYYY.MM.DD HH:MM",
                "currency_detected": "USD",
                "warnings": [],
                "trades": [
                    {
                        "symbol": "EURUSD",
                        "openTime": "2024-01-15 10:30:00",
                        "closeTime": "2024-01-15 15:45:00",
                        "openPrice": 1.08500,
                        "closePrice": 1.08750,
                        "lots": 0.10,
                        "type": "buy",
                        "pnl": 25.00,
                        "commission": -0.20,
                        "swap": 0.00,
                        "trade_id": "12345",
                        "order_type": "market"
                    },
                    {
                        "symbol": "GBPUSD",
                        "openTime": "2024-01-16 09:15:00",
                        "closeTime": "2024-01-16 16:30:00",
                        "openPrice": 1.27200,
                        "closePrice": 1.27000,
                        "lots": 0.20,
                        "type": "sell",
                        "pnl": 40.00,
                        "commission": -0.40,
                        "swap": -1.50,
                        "trade_id": "12346",
                        "order_type": "market"
                    }
                ]
            },
            "errors": [],
            "raw_sample": ["Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Swap,Profit"]
        }
    },
    
    "csv_format": {
        "input": """
        Date,Time,Symbol,Action,Quantity,Price,Commission,P&L
        01/15/2024,14:30,EUR/USD,BUY,10000,1.0850,-2.00,250.00
        01/16/2024,09:45,GBP/USD,SELL,20000,1.2720,-4.00,400.00
        """,
        "output": {
            "success": True,
            "analysis": {
                "total_trades_found": 2,
                "detected_broker": "Generic CSV Format",
                "date_format_detected": "MM/DD/YYYY HH:MM",
                "currency_detected": "USD",
                "warnings": ["Close times not available - using open time as placeholder", "Volume converted from units to lots"],
                "trades": [
                    {
                        "symbol": "EURUSD",
                        "openTime": "2024-01-15 14:30:00",
                        "closeTime": "2024-01-15 14:30:00",
                        "openPrice": 1.0850,
                        "closePrice": 1.1100,  # Calculated from P&L
                        "lots": 0.10,
                        "type": "buy",
                        "pnl": 250.00,
                        "commission": -2.00,
                        "swap": 0.00,
                        "trade_id": "",
                        "order_type": "market"
                    },
                    {
                        "symbol": "GBPUSD",
                        "openTime": "2024-01-16 09:45:00",
                        "closeTime": "2024-01-16 09:45:00",
                        "openPrice": 1.2720,
                        "closePrice": 1.2520,  # Calculated from P&L
                        "lots": 0.20,
                        "type": "sell",
                        "pnl": 400.00,
                        "commission": -4.00,
                        "swap": 0.00,
                        "trade_id": "",
                        "order_type": "market"
                    }
                ]
            },
            "errors": [],
            "raw_sample": ["Date,Time,Symbol,Action,Quantity,Price,Commission,P&L"]
        }
    },
    
    "error_example": {
        "input": "This is not trading data, just random text about weather.",
        "output": {
            "success": False,
            "analysis": {
                "total_trades_found": 0,
                "detected_broker": "Unknown",
                "date_format_detected": "",
                "currency_detected": "",
                "warnings": ["No recognizable trading data structure found"],
                "trades": []
            },
            "errors": ["Unable to identify trading data format", "No trade records found in provided text"],
            "raw_sample": ["This is not trading data, just random text about weather."]
        }
    }
}

# OpenAI Function Schema for Structured Output
OPENAI_FUNCTION_SCHEMA = {
    "name": "parse_trading_data",
    "description": "Parse trading data from any format and return standardized trade information",
    "parameters": {
        "type": "object",
        "properties": {
            "success": {
                "type": "boolean",
                "description": "Whether parsing was successful"
            },
            "analysis": {
                "type": "object",
                "properties": {
                    "total_trades_found": {"type": "integer"},
                    "detected_broker": {"type": "string"},
                    "date_format_detected": {"type": "string"},
                    "currency_detected": {"type": "string"},
                    "warnings": {"type": "array", "items": {"type": "string"}},
                    "trades": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "symbol": {"type": "string"},
                                "openTime": {"type": "string"},
                                "closeTime": {"type": "string"},
                                "openPrice": {"type": "number"},
                                "closePrice": {"type": "number"},
                                "lots": {"type": "number"},
                                "type": {"type": "string", "enum": ["buy", "sell"]},
                                "pnl": {"type": "number"},
                                "commission": {"type": "number"},
                                "swap": {"type": "number"},
                                "trade_id": {"type": "string"},
                                "order_type": {"type": "string"},
                                "comment": {"type": "string"}
                            },
                            "required": ["symbol", "openTime", "closeTime", "openPrice", "closePrice", "lots", "type", "pnl"]
                        }
                    }
                },
                "required": ["total_trades_found", "detected_broker", "trades"]
            },
            "errors": {"type": "array", "items": {"type": "string"}},
            "raw_sample": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["success", "analysis"]
    }
}

def build_parsing_prompt(file_content: str, file_type: str = "unknown") -> str:
    """Build the complete prompt for OpenAI trade parsing with futures-aware FIFO priority mapping"""
    
    # Analyze file content for futures indicators
    sample_content = file_content[:1000].lower()
    is_futures_file = (
        '_ticksize' in sample_content or 
        'contract' in sample_content or
        # More specific futures symbols to avoid forex false positives
        any(symbol in sample_content for symbol in ['mnqu', 'mgcq', 'esz', 'mes', 'gc', 'cl', 'ng', 'zn', 'zb'])
    )
    
    if is_futures_file:
        mapping_instructions = """
**FUTURES FILE DETECTED - USE FIFO-PRIORITY COLUMN MAPPING:**

**CRITICAL: DO NOT MIX DATA TYPES - NUMBERS GO TO NUMBER FIELDS, TEXT GOES TO TEXT FIELDS**

CONTRACT/SYMBOL (text field):
- Priority 1: "Contract" 
- Priority 2: "symbol"
- Priority 3: "Symbol"
- Priority 4: "Instrument"
- NEVER put quantity values in symbol field!

DIRECTION (text field - convert to buy/sell):
- Priority 1: "B/S" (B = buy, S = sell)
- Priority 2: "Side"
- Priority 3: "Type"
- Priority 4: "Direction"
- Convert: B/Buy → "buy", S/Sell → "sell"

QUANTITY (numeric field - choose ONLY ONE column):
- Priority 1: "filledQty"
- Priority 2: "Filled, Qty"
- Priority 3: "Quantity"
- Priority 4: "Volume"
- Priority 5: "Size"
- Priority 6: "Lots"
- **DATA VALIDATION**: Quantity values should be small numbers (1-100 for futures). If multiple columns match headers, examine the actual data values and choose the column with realistic lot sizes (1.0, 2.0, 5.0, etc.) NOT large price numbers (20000+).
- NEVER put text like "Buy" or "Sell" in this field!

PRICE (numeric field - choose ONLY ONE column):
- Priority 1: "Avg Fill Price"
- Priority 2: "avgPrice"
- Priority 3: "Price"
- Priority 4: "Fill Price"
- Priority 5: "Entry Price"
- **DATA VALIDATION**: Price values should be large numbers (100-50000 for futures). If multiple columns match headers, examine actual data values and choose the column with realistic price ranges, NOT small numbers like 1.0, 2.0.

TIMESTAMP (for both open and close time in FIFO):
- Priority 1: "Fill Time"
- Priority 2: "Timestamp"
- Priority 3: "Date"
- Priority 4: "Time"
- For FIFO: closeTime should be EMPTY or same as openTime (individual fills, not roundtrips)
- Convert all times to ISO format: YYYY-MM-DDTHH:MM:SS

P&L/PROFIT (numeric field):
- Priority 1: "P&L"
- Priority 2: "PnL"
- Priority 3: "Profit"
- Priority 4: "Net P&L"
- Priority 5: "Realized P&L"
- If no P&L column found, set to 0

UNIQUE ID (text field):
- Priority 1: "orderId"
- Priority 2: "Order ID"
- Priority 3: "ID"
- Priority 4: "TradeId"

FUTURES-SPECIFIC FIELDS:
- Account: "Account" (position tracking)
- Status: "Status" (filter for executed only)
- Tick Size: "_tickSize" (P&L calculation)
- Commission: "Commission", "Fee", "Fees"

**STATUS FILTERING**: Only process trades with status 'filled', 'executed', 'complete', or 'done'
**FIFO BEHAVIOR**: For individual fills, closeTime should be empty or same as openTime
- **CRITICAL FOR FIFO**: Set closeTime to EMPTY string "" (not same as openTime) since these are individual fills, not roundtrips
"""
    else:
        mapping_instructions = """
**CFD/STOCKS/FOREX FILE - USE ROUNDTRIP MAPPING:**

CFD/Stocks/Forex files contain complete roundtrip trade data with separate entry and exit information.

**CFD-SPECIFIC FIELD MAPPING PRIORITIES:**

SYMBOL (text field):
- Priority 1: "Symbol"
- Priority 2: "Instrument" 
- Priority 3: "Asset"
- Priority 4: "Product"

DIRECTION (text field):
- Priority 1: "Action"
- Priority 2: "Side"
- Priority 3: "Type"
- Priority 4: "Direction"
- Convert to "buy" or "sell"

QUANTITY (number field):
- Priority 1: "Volume"
- Priority 2: "Size"
- Priority 3: "Lots"
- Priority 4: "Quantity"
- Priority 5: "Units"

ENTRY PRICE (number field):
- Priority 1: "Entry Price"
- Priority 2: "Open Price"
- Priority 3: "Opening Price"
- Priority 4: "Price" (if only one price column)

EXIT PRICE (number field):
- Priority 1: "Exit Price"
- Priority 2: "Close Price"
- Priority 3: "Closing Price"
- Priority 4: Second price column if entry price is mapped

ENTRY TIME (timestamp field):
- Priority 1: "Open Time"
- Priority 2: "Entry Time"
- Priority 3: "Opening Time"
- Priority 4: "Start Time"
- Priority 5: "Date" or "Time" (if only one time column)

EXIT TIME (timestamp field):
- Priority 1: "Close Time"
- Priority 2: "Exit Time"
- Priority 3: "Closing Time"
- Priority 4: "End Time"
- Priority 5: Second time column if entry time is mapped

P&L (number field):
- Priority 1: "P&L"
- Priority 2: "PnL"
- Priority 3: "Profit"
- Priority 4: "Net P&L"
- Priority 5: "Realized P&L"
- Priority 6: "Net Profit"
- Can be positive or negative

COMMISSION (number field):
- Priority 1: "Commission"
- Priority 2: "Fee"
- Priority 3: "Fees"
- If no commission column found, set to 0

SWAP (number field):
- Priority 1: "Swap"
- Priority 2: "Overnight Fee"
- Priority 3: "Rollover"
- If no swap column found, set to 0

UNIQUE ID (text field):
- Priority 1: "ID"
- Priority 2: "Trade ID"
- Priority 3: "TradeId"
- Priority 4: "Order ID"

**CFD PROCESSING RULES:**
- Process all trades (no status filtering needed for roundtrips)
- Use entry time as openTime and exit time as closeTime
- Calculate duration between entry and exit times
- Ensure P&L values are preserved as calculated
- Include commission and swap fees in calculations
"""
    
    user_prompt = f"""
**FILE TYPE**: {file_type}
{mapping_instructions}

**CONTENT TO PARSE**:
```
{file_content[:5000]}  # Limit content to avoid token limits
```

Please parse this trading data and extract all trade information following the ParseResponse schema. 

**SPECIFIC INSTRUCTIONS:**
1. Analyze the structure and identify the broker/platform
2. Extract ALL trades found in the data (don't skip any)
3. Convert all dates to ISO format (YYYY-MM-DD HH:MM:SS)
4. Standardize symbol names (remove slashes, spaces)
5. Ensure buy/sell directions are correctly identified
6. Calculate or extract P&L values accurately
7. Include commission and swap fees when available
8. For futures files: Apply status filtering and use FIFO-priority column mapping
9. Provide appropriate confidence level and warnings

Return the result as a valid JSON object matching the ParseResponse schema.
"""
    
    return user_prompt

# Validation Functions
def validate_parsed_trade(trade_data: Dict[str, Any]) -> List[str]:
    """Validate a single parsed trade and return list of errors"""
    errors = []
    
    # Required fields
    required_fields = ['symbol', 'openTime', 'closeTime', 'openPrice', 'closePrice', 'lots', 'type', 'pnl']
    for field in required_fields:
        if field not in trade_data or trade_data[field] is None:
            errors.append(f"Missing required field: {field}")
    
    # Validate data types and ranges
    if 'openPrice' in trade_data and (not isinstance(trade_data['openPrice'], (int, float)) or trade_data['openPrice'] <= 0):
        errors.append("Open price must be a positive number")
    
    if 'closePrice' in trade_data and (not isinstance(trade_data['closePrice'], (int, float)) or trade_data['closePrice'] <= 0):
        errors.append("Close price must be a positive number")
    
    if 'lots' in trade_data and (not isinstance(trade_data['lots'], (int, float)) or trade_data['lots'] <= 0):
        errors.append("Volume must be a positive number")
    
    if 'type' in trade_data and trade_data['type'] not in ['buy', 'sell']:
        errors.append("Side must be 'buy' or 'sell'")
    
    # Validate date formats
    for date_field in ['openTime', 'closeTime']:
        if date_field in trade_data:
            try:
                datetime.fromisoformat(trade_data[date_field].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                errors.append(f"{date_field} is not in valid ISO format")
    
    return errors
