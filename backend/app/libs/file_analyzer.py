from typing import Dict, List, Optional, Tuple
from openai import OpenAI
import databutton as db
import json
import pandas as pd
import os

# Our standardized trade fields that we need to extract
STANDARD_TRADE_FIELDS = {
    "symbol": "Trading instrument/symbol (e.g., EURUSD, AAPL, BTC)",
    "entry_time": "When the trade was opened/entered", 
    "exit_time": "When the trade was closed/exited",
    "entry_price": "Price at which position was opened",
    "exit_price": "Price at which position was closed", 
    "volume": "Trade size/volume/lots",
    "side": "Buy or Sell direction",
    "pnl": "Profit and Loss amount",
    "commission": "Commission/fees charged",
    "swap": "Swap/rollover fees"
}

class FileAnalyzer:
    """Analyzes trading files using OpenAI to map columns to our standard format"""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    def build_analysis_prompt(self, sample_data: str, filename: str) -> str:
        """Build the prompt for OpenAI to analyze file structure"""
        
        prompt = f"""
You are a trading data analysis expert tasked with analyzing a trading data file to map its columns to standardized fields for a trading journaling app. Your goal is to interpret the file's structure, identify whether it contains futures or forex trading data, and map columns accurately, handling duplicated or ambiguous column names (e.g., multiple "Date" columns or vague "Price" columns).

FILENAME: {filename}

STANDARDIZED FIELDS:
- symbol: Trading instrument/symbol (e.g., "ES_F" for futures, "EURUSD" for forex)
- entry_time: When the trade was opened/entered (date and time)
- exit_time: When the trade was closed/exited (date and time)
- entry_price: Price at which position was opened
- exit_price: Price at which position was closed
- volume: Trade size (number of contracts for futures, lots for forex)
- side: Buy or Sell direction
- pnl: Profit and Loss amount
- commission: Commission/fees charged
- swap: Swap/rollover fees (more common in forex)

SAMPLE DATA FROM FILE:
{sample_data}

INSTRUCTIONS:
1. **Identify File Type**:
   - Determine if the file contains futures or forex trading data based on:
     - Futures: Symbols like "ES_F", "CL_F", "GC_F" (often with underscores or specific suffixes), and columns like "Contracts", "Tick Value", or "Contract Size".
     - Forex: Currency pairs like "EURUSD", "GBPUSD", "USDJPY", and columns like "Lots", "Pip Value", or "Spread".
     - If ambiguous, use column names, data patterns, or broker platform hints to infer the type.
   - Include a "file_type" field in the response with either "futures" or "forex".
2. **Identify Data Start Row**:
   - Find the row where actual trading data begins (skip headers, account info, summaries, or blank rows).
3. **Map Columns**:
   - Map each column to one of the standardized fields or mark as "unknown" if not relevant.
   - For duplicated columns (e.g., "Date" and "Date"), differentiate by context (e.g., "entry_time" vs. "exit_time").
   - For ambiguous columns (e.g., "Price"), infer the most likely mapping based on data patterns or sample data.
   - Use the following common column names to guide mapping:
     - Futures: "Contract", "Instrument", "Symbol", "Ticker" (for symbol); "Size", "Contracts", "Qty" (for volume); "Price", "Entry Price", "Trade Price" (for entry_price/exit_price).
     - Forex: "Pair", "Currency Pair", "Symbol" (for symbol); "Lots", "Volume", "Size" (for volume); "Open Price", "Close Price" (for entry_price/exit_price).
4. **Detect Data Patterns**:
   - Identify formats for dates (e.g., "YYYY-MM-DD HH:MM:SS"), numbers (e.g., "float with 2 decimals for forex, 4 for futures"), and the likely broker platform (e.g., MetaTrader for forex, TradeStation for futures).
5. **Assess Confidence**:
   - Rate confidence in your mappings and file type detection (high, medium, low) based on clarity of column names, data patterns, and sample data.
6. **Identify Issues**:
   - Note potential issues like duplicated columns, ambiguous names, missing required fields, or inconsistent data formats.
7. **Provide Recommendations**:
   - Suggest solutions, such as user confirmation for ambiguous columns or additional data to clarify file type.

RESPONSE FORMAT:
Return a JSON object with the following structure:
{{
    "file_type": "<futures|forex>",
    "data_start_row": <integer, row number where trading data begins (0-based index)>,
    "column_mapping": {{
        "column_0": "<standard_field_name_or_unknown>",
        "column_1": "<standard_field_name_or_unknown>",
        ...
    }},
    "detected_patterns": {{
        "date_format": "<detected format, e.g., YYYY-MM-DD HH:MM:SS>",
        "number_format": "<detected format, e.g., float with 2 decimals>",
        "broker_platform": "<detected platform or unknown>"
    }},
    "confidence": "<high|medium|low>",
    "issues": ["<list of potential issues>"],
    "recommendations": ["<suggestions for better mapping>"]
}}

Ensure the response is precise, handles edge cases, and prioritizes accurate file type detection and column mappings based on the provided sample data and standard field definitions.
        """
        return prompt
    
    async def analyze_file_structure(self, file_content: bytes, filename: str) -> Dict:
        """Analyze file structure using OpenAI"""
        
        try:
            # Convert file to readable format and get sample
            sample_data = self._extract_sample_data(file_content, filename)
            
            # Build prompt
            prompt = self.build_analysis_prompt(sample_data, filename)
            
            # Call OpenAI
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert at analyzing trading data files from various brokers and platforms."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1
            )
            
            # Parse response
            analysis_text = response.choices[0].message.content
            
            # Extract JSON from response
            analysis = self._extract_json_from_response(analysis_text)
            
            return {
                "success": True,
                "analysis": analysis,
                "raw_response": analysis_text
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "analysis": None
            }
    
    def _extract_sample_data(self, file_content: bytes, filename: str) -> str:
        """Extract first few rows of data for analysis"""
        
        file_ext = filename.lower().split('.')[-1]
        
        if file_ext == 'csv':
            # For CSV, just take first 10 lines
            text_content = file_content.decode('utf-8', errors='ignore')
            lines = text_content.split('\n')[:15]  # First 15 lines
            return '\n'.join(lines)
            
        elif file_ext in ['xlsx', 'xls']:
            # For Excel, read first few rows
            import io
            df = pd.read_excel(io.BytesIO(file_content), nrows=10)
            return df.to_string()
            
        else:
            # Default: treat as text
            text_content = file_content.decode('utf-8', errors='ignore')
            return text_content[:2000]  # First 2000 characters
    
    def _extract_json_from_response(self, response_text: str) -> Dict:
        """Extract JSON from OpenAI response"""
        
        try:
            # Try to find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
                
        except json.JSONDecodeError as e:
            # Fallback: try to parse the whole response
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                raise ValueError(f"Failed to parse JSON: {e}") from e
