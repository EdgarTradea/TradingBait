"""Trade calculation utilities for processing parsed trade data"""

from typing import Dict, List, Any
from datetime import datetime
import pandas as pd

def calculate_trade_metrics(trade_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate additional metrics for a single trade"""
    try:
        # Parse times
        open_time = pd.to_datetime(trade_data['open_time'])
        close_time = pd.to_datetime(trade_data['close_time'])
        
        # Calculate duration
        duration_seconds = (close_time - open_time).total_seconds()
        duration_minutes = int(duration_seconds / 60)
        duration_hours = round(duration_seconds / 3600, 2)
        
        # Calculate P&L if not provided
        entry_price = float(trade_data['entry_price'])
        exit_price = float(trade_data['exit_price'])
        volume = float(trade_data['volume'])
        side = trade_data['side'].lower()
        
        # Calculate gross P&L if not provided
        if trade_data.get('gross_pnl') is None:
            if side == 'buy':
                gross_pnl = (exit_price - entry_price) * volume
            else:  # sell
                gross_pnl = (entry_price - exit_price) * volume
        else:
            gross_pnl = float(trade_data['gross_pnl'])
            
        # Calculate net P&L if not provided
        commission = float(trade_data.get('commission', 0))
        swap = float(trade_data.get('swap', 0))
        
        if trade_data.get('net_pnl') is None:
            net_pnl = gross_pnl - abs(commission) + swap
        else:
            net_pnl = float(trade_data['net_pnl'])
            
        # Calculate percentage return
        if entry_price > 0:
            if side == 'buy':
                percentage_return = ((exit_price - entry_price) / entry_price) * 100
            else:
                percentage_return = ((entry_price - exit_price) / entry_price) * 100
        else:
            percentage_return = 0
            
        # Calculate pip movement (for forex pairs)
        symbol = trade_data['symbol'].upper()
        if is_forex_pair(symbol):
            pip_value = calculate_pip_movement(symbol, entry_price, exit_price)
        else:
            pip_value = None
            
        return {
            'duration_minutes': duration_minutes,
            'duration_hours': duration_hours,
            'gross_pnl': gross_pnl,
            'net_pnl': net_pnl,
            'commission': commission,
            'swap': swap,
            'percentage_return': round(percentage_return, 2),
            'pip_movement': pip_value,
            'is_profitable': net_pnl > 0
        }
        
    except Exception as e:
        print(f"Error calculating trade metrics: {e}")
        return {}

def is_forex_pair(symbol: str) -> bool:
    """Check if symbol is a forex pair"""
    forex_pairs = [
        'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
        'EURJPY', 'GBPJPY', 'EURGBP', 'AUDJPY', 'EURAUD', 'EURCHF', 'AUDCAD',
        'GBPCHF', 'GBPCAD', 'GBPAUD', 'AUDCHF', 'NZDJPY', 'CADJPY', 'CHFJPY'
    ]
    
    # Remove common suffixes
    clean_symbol = symbol.replace('.m', '').replace('_', '').replace('/', '')
    return clean_symbol in forex_pairs

def calculate_pip_movement(symbol: str, entry_price: float, exit_price: float) -> float:
    """Calculate pip movement for forex pairs"""
    try:
        # Most forex pairs have 4 decimal places (1 pip = 0.0001)
        # JPY pairs have 2 decimal places (1 pip = 0.01)
        if 'JPY' in symbol.upper():
            pip_size = 0.01
        else:
            pip_size = 0.0001
            
        pip_movement = abs(exit_price - entry_price) / pip_size
        return round(pip_movement, 1)
        
    except Exception:
        return 0.0

def process_parsed_trades(trades_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Process a list of parsed trades and add calculated metrics"""
    processed_trades = []
    
    for trade in trades_data:
        try:
            # Calculate additional metrics
            metrics = calculate_trade_metrics(trade)
            
            # Combine original data with calculated metrics
            processed_trade = {**trade, **metrics}
            processed_trades.append(processed_trade)
            
        except Exception as e:
            print(f"Error processing trade: {e}")
            # Still include the trade but without calculated metrics
            processed_trades.append(trade)
            
    return processed_trades

def validate_trade_data(trade: Dict[str, Any]) -> List[str]:
    """Validate trade data and return list of issues"""
    issues = []
    
    required_fields = ['symbol', 'open_time', 'close_time', 'side', 'volume', 'entry_price', 'exit_price']
    
    for field in required_fields:
        if field not in trade or trade[field] is None:
            issues.append(f"Missing required field: {field}")
            
    # Validate data types and ranges
    try:
        if 'volume' in trade and float(trade['volume']) <= 0:
            issues.append("Volume must be positive")
            
        if 'entry_price' in trade and float(trade['entry_price']) <= 0:
            issues.append("Entry price must be positive")
            
        if 'exit_price' in trade and float(trade['exit_price']) <= 0:
            issues.append("Exit price must be positive")
            
        # Validate dates
        if 'open_time' in trade and 'close_time' in trade:
            open_time = pd.to_datetime(trade['open_time'])
            close_time = pd.to_datetime(trade['close_time'])
            
            if close_time <= open_time:
                issues.append("Close time must be after open time")
                
    except (ValueError, TypeError) as e:
        issues.append(f"Invalid data format: {str(e)}")
        
    return issues
