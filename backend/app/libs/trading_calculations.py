from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from pydantic import BaseModel
import statistics
import re

# ============================================================================
# DATA CONTRACTS & TYPES
# ============================================================================

class TradeData(BaseModel):
    """Standardized trade data structure"""
    symbol: Optional[str] = None
    open_time: Optional[str] = None
    close_time: Optional[str] = None
    pnl: float = 0.0
    volume: float = 0.0
    lots: Optional[float] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    trade_type: Optional[str] = None  # 'buy', 'sell'
    
    @property
    def quantity(self) -> float:
        """Return quantity as volume or lots for compatibility"""
        return self.volume or self.lots or 0.0
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TradeData':
        """Create TradeData from various input formats"""
        # Handle different field naming conventions
        pnl = (
            data.get('pnl') or 
            data.get('profit') or 
            data.get('net_profit') or 
            0.0
        )
        
        open_time = (
            data.get('open_time') or 
            data.get('openTime') or 
            data.get('entry_time')
        )
        
        close_time = (
            data.get('close_time') or 
            data.get('closeTime') or 
            data.get('exit_time')
        )
        
        volume = (
            data.get('volume') or 
            data.get('lots') or 
            data.get('size') or 
            0.0
        )
        
        return cls(
            symbol=data.get('symbol'),
            open_time=open_time,
            close_time=close_time,
            pnl=float(pnl) if pnl is not None else 0.0,
            volume=float(volume) if volume is not None else 0.0,
            lots=data.get('lots'),
            entry_price=data.get('entry_price') or data.get('open_price'),
            exit_price=data.get('exit_price') or data.get('close_price'),
            trade_type=data.get('trade_type') or data.get('type')
        )

class BasicMetrics(BaseModel):
    """Core trading performance metrics"""
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    break_even_trades: int = 0
    total_pnl: float = 0.0
    win_rate: float = 0.0
    loss_rate: float = 0.0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    profit_factor: float = 0.0
    best_trade: float = 0.0
    worst_trade: float = 0.0
    largest_win: float = 0.0
    largest_loss: float = 0.0

class RiskMetrics(BaseModel):
    """Risk and drawdown metrics"""
    max_drawdown: float = 0.0
    max_drawdown_percent: float = 0.0
    current_drawdown: float = 0.0
    current_drawdown_percent: float = 0.0
    peak_balance: float = 0.0
    valley_balance: float = 0.0
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    volatility: Optional[float] = None
    max_consecutive_wins: int = 0
    max_consecutive_losses: int = 0

class VolumeMetrics(BaseModel):
    """Volume and position sizing metrics"""
    total_volume: float = 0.0
    avg_volume_per_trade: float = 0.0
    max_volume: float = 0.0
    min_volume: float = 0.0
    volume_weighted_pnl: float = 0.0

class TimeMetrics(BaseModel):
    """Time-based trading metrics"""
    avg_holding_time_seconds: float = 0.0
    avg_holding_time_formatted: str = "0h 0m"
    shortest_trade_seconds: float = 0.0
    longest_trade_seconds: float = 0.0
    total_trading_days: int = 0
    trades_per_day: float = 0.0

class ComprehensiveMetrics(BaseModel):
    """Complete trading metrics package"""
    basic: BasicMetrics
    risk: RiskMetrics
    volume: VolumeMetrics
    time: TimeMetrics
    calculation_timestamp: str
    data_quality_score: float = 0.0

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def sanitize_trade_data(trades: List[Dict[str, Any]]) -> List[TradeData]:
    """Convert and validate trade data from various sources"""
    sanitized_trades = []
    
    for trade in trades:
        try:
            trade_data = TradeData.from_dict(trade)
            sanitized_trades.append(trade_data)
        except Exception as e:
            pass
            continue
    
    return sanitized_trades

def parse_datetime_flexible(date_str: Optional[str]) -> Optional[datetime]:
    """Parse datetime with multiple format support"""
    if not date_str:
        return None
    
    # Common datetime formats
    formats = [
        '%Y-%m-%dT%H:%M:%S.%fZ',  # ISO with microseconds and Z
        '%Y-%m-%dT%H:%M:%SZ',     # ISO with Z
        '%Y-%m-%dT%H:%M:%S',      # ISO basic
        '%Y-%m-%d %H:%M:%S',      # Space separated
        '%Y-%m-%d',               # Date only
    ]
    
    # Remove timezone suffixes for parsing
    clean_date_str = date_str.replace('Z', '').replace('+00:00', '')
    
    for fmt in formats:
        try:
            return datetime.strptime(clean_date_str, fmt)
        except ValueError:
            continue
    
    # Try ISO format parsing as fallback
    try:
        return datetime.fromisoformat(clean_date_str)
    except ValueError:
        pass
        return None

def format_duration(seconds: float) -> str:
    """Format duration in seconds to human readable format"""
    if seconds == 0:
        return "0h 0m"
    
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    
    if hours > 24:
        days = hours // 24
        hours = hours % 24
        return f"{days}d {hours}h {minutes}m"
    else:
        return f"{hours}h {minutes}m"

def calculate_data_quality_score(trades: List[TradeData]) -> float:
    """Calculate data quality score based on completeness"""
    if not trades:
        return 0.0
    
    total_fields = len(trades) * 8  # 8 key fields per trade
    complete_fields = 0
    
    for trade in trades:
        if trade.symbol:
            complete_fields += 1
        if trade.open_time:
            complete_fields += 1
        if trade.close_time:
            complete_fields += 1
        if trade.pnl != 0:
            complete_fields += 1
        if trade.volume > 0:
            complete_fields += 1
        if trade.entry_price:
            complete_fields += 1
        if trade.exit_price:
            complete_fields += 1
        if trade.trade_type:
            complete_fields += 1
    
    return min(100.0, (complete_fields / total_fields) * 100)

# ============================================================================
# CORE CALCULATION FUNCTIONS
# ============================================================================

def calculate_basic_metrics(trades: List[TradeData]) -> BasicMetrics:
    """Calculate basic trading performance metrics"""
    if not trades:
        return BasicMetrics()
    
    total_trades = len(trades)
    winning_trades = len([t for t in trades if t.pnl > 0])
    losing_trades = len([t for t in trades if t.pnl < 0])
    break_even_trades = len([t for t in trades if t.pnl == 0])
    
    total_pnl = sum(t.pnl for t in trades)
    
    # Win/Loss rates
    win_rate = (winning_trades / total_trades) * 100 if total_trades > 0 else 0
    loss_rate = (losing_trades / total_trades) * 100 if total_trades > 0 else 0
    
    # Average win/loss
    winning_amounts = [t.pnl for t in trades if t.pnl > 0]
    losing_amounts = [abs(t.pnl) for t in trades if t.pnl < 0]
    
    avg_win = statistics.mean(winning_amounts) if winning_amounts else 0
    avg_loss = statistics.mean(losing_amounts) if losing_amounts else 0
    
    # Profit factor (handle division by zero)
    if avg_loss > 0:
        profit_factor = avg_win / avg_loss
    elif avg_win > 0:
        profit_factor = float('inf')
    else:
        profit_factor = 0
    
    # Best/worst trades
    all_pnls = [t.pnl for t in trades]
    best_trade = max(all_pnls) if all_pnls else 0
    worst_trade = min(all_pnls) if all_pnls else 0
    
    return BasicMetrics(
        total_trades=total_trades,
        winning_trades=winning_trades,
        losing_trades=losing_trades,
        break_even_trades=break_even_trades,
        total_pnl=round(total_pnl, 2),
        win_rate=round(win_rate, 2),
        loss_rate=round(loss_rate, 2),
        avg_win=round(avg_win, 2),
        avg_loss=round(avg_loss, 2),
        profit_factor=round(profit_factor, 2) if profit_factor != float('inf') else 999.99,
        best_trade=round(best_trade, 2),
        worst_trade=round(worst_trade, 2),
        largest_win=round(best_trade, 2),
        largest_loss=round(abs(worst_trade), 2)
    )

def calculate_risk_metrics(trades: List[TradeData]) -> RiskMetrics:
    """Calculate risk and drawdown metrics"""
    if not trades:
        return RiskMetrics()
    
    # Sort trades by close time for drawdown calculation
    sorted_trades = []
    for trade in trades:
        close_time = parse_datetime_flexible(trade.close_time)
        if close_time:
            sorted_trades.append((close_time, trade))
    
    sorted_trades.sort(key=lambda x: x[0])
    
    # Calculate running balance and drawdown
    running_balance = 0
    peak_balance = 0
    valley_balance = 0
    max_drawdown = 0
    current_drawdown = 0
    
    balances = []
    
    for _, trade in sorted_trades:
        running_balance += trade.pnl
        balances.append(running_balance)
        
        if running_balance > peak_balance:
            peak_balance = running_balance
            valley_balance = running_balance
        
        if running_balance < valley_balance:
            valley_balance = running_balance
        
        drawdown = peak_balance - running_balance
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    
    current_drawdown = peak_balance - running_balance if running_balance else 0
    
    # Calculate percentages
    max_drawdown_percent = (max_drawdown / peak_balance) * 100 if peak_balance > 0 else 0
    current_drawdown_percent = (current_drawdown / peak_balance) * 100 if peak_balance > 0 else 0
    
    # Calculate consecutive wins/losses
    max_consecutive_wins = 0
    max_consecutive_losses = 0
    current_win_streak = 0
    current_loss_streak = 0
    
    for _, trade in sorted_trades:
        if trade.pnl > 0:
            current_win_streak += 1
            current_loss_streak = 0
            max_consecutive_wins = max(max_consecutive_wins, current_win_streak)
        elif trade.pnl < 0:
            current_loss_streak += 1
            current_win_streak = 0
            max_consecutive_losses = max(max_consecutive_losses, current_loss_streak)
        else:
            current_win_streak = 0
            current_loss_streak = 0
    
    # Calculate Sharpe ratio (simplified)
    sharpe_ratio = None
    if balances and len(balances) > 1:
        returns = [balances[i] - balances[i-1] for i in range(1, len(balances))]
        if returns:
            avg_return = statistics.mean(returns)
            std_return = statistics.stdev(returns) if len(returns) > 1 else 0
            sharpe_ratio = avg_return / std_return if std_return > 0 else 0
    
    return RiskMetrics(
        max_drawdown=round(max_drawdown, 2),
        max_drawdown_percent=round(max_drawdown_percent, 2),
        current_drawdown=round(current_drawdown, 2),
        current_drawdown_percent=round(current_drawdown_percent, 2),
        peak_balance=round(peak_balance, 2),
        valley_balance=round(valley_balance, 2),
        sharpe_ratio=round(sharpe_ratio, 3) if sharpe_ratio is not None else None,
        max_consecutive_wins=max_consecutive_wins,
        max_consecutive_losses=max_consecutive_losses
    )

def calculate_volume_metrics(trades: List[TradeData]) -> VolumeMetrics:
    """Calculate volume and position sizing metrics"""
    if not trades:
        return VolumeMetrics()
    
    volumes = [t.volume for t in trades if t.volume > 0]
    
    if not volumes:
        return VolumeMetrics()
    
    total_volume = sum(volumes)
    avg_volume = statistics.mean(volumes)
    max_volume = max(volumes)
    min_volume = min(volumes)
    
    # Volume-weighted P&L
    volume_weighted_pnl = sum(t.pnl * t.volume for t in trades if t.volume > 0)
    volume_weighted_pnl = volume_weighted_pnl / total_volume if total_volume > 0 else 0
    
    return VolumeMetrics(
        total_volume=round(total_volume, 2),
        avg_volume_per_trade=round(avg_volume, 2),
        max_volume=round(max_volume, 2),
        min_volume=round(min_volume, 2),
        volume_weighted_pnl=round(volume_weighted_pnl, 2)
    )

def calculate_time_metrics(trades: List[TradeData]) -> TimeMetrics:
    """Calculate time-based trading metrics"""
    if not trades:
        return TimeMetrics()
    
    holding_times = []
    trading_dates = set()
    
    for trade in trades:
        # Calculate holding time
        open_time = parse_datetime_flexible(trade.open_time)
        close_time = parse_datetime_flexible(trade.close_time)
        
        if open_time and close_time:
            holding_time = (close_time - open_time).total_seconds()
            holding_times.append(holding_time)
            
            # Track unique trading dates
            trading_dates.add(open_time.date())
            trading_dates.add(close_time.date())
    
    # Average holding time
    avg_holding_seconds = statistics.mean(holding_times) if holding_times else 0
    avg_holding_formatted = format_duration(avg_holding_seconds)
    
    # Shortest and longest trades
    shortest_trade = min(holding_times) if holding_times else 0
    longest_trade = max(holding_times) if holding_times else 0
    
    # Trading frequency
    total_trading_days = len(trading_dates)
    trades_per_day = len(trades) / total_trading_days if total_trading_days > 0 else 0
    
    return TimeMetrics(
        avg_holding_time_seconds=round(avg_holding_seconds, 2),
        avg_holding_time_formatted=avg_holding_formatted,
        shortest_trade_seconds=round(shortest_trade, 2),
        longest_trade_seconds=round(longest_trade, 2),
        total_trading_days=total_trading_days,
        trades_per_day=round(trades_per_day, 2)
    )

# ============================================================================
# MAIN CALCULATION FUNCTION
# ============================================================================

def calculate_comprehensive_metrics(trade_data: List[Dict[str, Any]]) -> ComprehensiveMetrics:
    """Calculate all trading metrics from raw trade data"""
    
    # Sanitize and validate input data
    trades = sanitize_trade_data(trade_data)
    
    if not trades:
        return ComprehensiveMetrics(
            basic=BasicMetrics(),
            risk=RiskMetrics(),
            volume=VolumeMetrics(),
            time=TimeMetrics(),
            calculation_timestamp=datetime.now().isoformat(),
            data_quality_score=0.0
        )
    
    # Calculate all metric categories
    basic_metrics = calculate_basic_metrics(trades)
    risk_metrics = calculate_risk_metrics(trades)
    volume_metrics = calculate_volume_metrics(trades)
    time_metrics = calculate_time_metrics(trades)
    
    # Calculate data quality score
    data_quality = calculate_data_quality_score(trades)
    
    return ComprehensiveMetrics(
        basic=basic_metrics,
        risk=risk_metrics,
        volume=volume_metrics,
        time=time_metrics,
        calculation_timestamp=datetime.now().isoformat(),
        data_quality_score=round(data_quality, 1)
    )

# ============================================================================
# LEGACY COMPATIBILITY FUNCTIONS
# ============================================================================

def calculate_legacy_trade_metrics(trade_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate metrics in legacy format for backward compatibility"""
    
    comprehensive = calculate_comprehensive_metrics(trade_data)
    
    # Convert to legacy format matching existing TradeMetrics model
    return {
        "totalTrades": comprehensive.basic.total_trades,
        "winningTrades": comprehensive.basic.winning_trades,
        "losingTrades": comprehensive.basic.losing_trades,
        "totalPnL": comprehensive.basic.total_pnl,
        "winRate": comprehensive.basic.win_rate,
        "avgWin": comprehensive.basic.avg_win,
        "avgLoss": comprehensive.basic.avg_loss,
        "profitFactor": comprehensive.basic.profit_factor,
        "bestTrade": comprehensive.basic.best_trade,
        "worstTrade": comprehensive.basic.worst_trade,
        "totalVolume": comprehensive.volume.total_volume,
        "avgHoldingTime": comprehensive.time.avg_holding_time_formatted,
        "sharpeRatio": comprehensive.risk.sharpe_ratio,
        "maxDrawdown": comprehensive.risk.max_drawdown,
        "maxDrawdownPercent": comprehensive.risk.max_drawdown_percent
    }


