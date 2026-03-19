"""Core trade grouping engine for analyzing and grouping trading data"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple, Set
from enum import Enum
from dataclasses import dataclass
import uuid

class GroupingStrategy(Enum):
    """Strategies for grouping trades"""
    SYMBOL = "symbol"
    TIME_WINDOW = "time_window"
    SESSION = "session"
    POSITION = "position"
    STRATEGY_PATTERN = "strategy_pattern"
    SCALING = "scaling"
    CORRELATION = "correlation"

class TradingStyle(Enum):
    """Detected trading styles"""
    SCALPING = "scalping"  # Very short holds, many trades
    DAY_TRADING = "day_trading"  # Intraday, no overnight
    SWING_TRADING = "swing_trading"  # Multi-day holds
    POSITION_TRADING = "position_trading"  # Long-term holds
    MIXED = "mixed"  # Multiple styles

class MarketType(Enum):
    """Market types for platform-specific logic"""
    FUTURES = "futures"
    FOREX = "forex"
    STOCKS = "stocks"
    CRYPTO = "crypto"
    CFD = "cfd"
    UNKNOWN = "unknown"

@dataclass
class TradeGroup:
    """Represents a group of related trades"""
    group_id: str
    trades: List[Dict[str, Any]]
    grouping_strategy: GroupingStrategy
    group_type: str
    metadata: Dict[str, Any]
    
    # Group-level metrics
    total_pnl: float = 0.0
    total_trades: int = 0
    win_rate: float = 0.0
    avg_hold_time: Optional[timedelta] = None
    total_volume: float = 0.0
    risk_reward_ratio: float = 0.0
    
    # Time-based info
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration: Optional[timedelta] = None
    
    # Classification
    trading_style: Optional[TradingStyle] = None
    market_type: Optional[MarketType] = None
    confidence_score: float = 0.0

@dataclass
class GroupingResult:
    """Result of trade grouping operation"""
    groups: List[TradeGroup]
    ungrouped_trades: List[Dict[str, Any]]
    summary: Dict[str, Any]
    grouping_stats: Dict[str, Any]

class TradeGroupingEngine:
    """Advanced trade grouping engine with multiple strategies"""
    
    def __init__(self):
        self.default_time_window = timedelta(hours=1)
        self.session_gap_threshold = timedelta(hours=2)
        self.scaling_time_window = timedelta(minutes=30)
        self.min_group_size = 2
        self.max_groups_per_symbol = 10
        
    def group_trades(self, 
                    trades_df: pd.DataFrame, 
                    strategies: List[GroupingStrategy] = None,
                    custom_params: Dict[str, Any] = None) -> GroupingResult:
        """Main entry point for trade grouping"""
        
        if strategies is None:
            strategies = [GroupingStrategy.SYMBOL, GroupingStrategy.SESSION, GroupingStrategy.SCALING]
        
        if custom_params is None:
            custom_params = {}
            
        # Validate and prepare data
        processed_df = self._prepare_data(trades_df)
        
        # Apply grouping strategies in order
        all_groups = []
        remaining_trades = processed_df.copy()
        
        for strategy in strategies:
            groups, remaining_trades = self._apply_grouping_strategy(
                remaining_trades, strategy, custom_params
            )
            all_groups.extend(groups)
        
        # Calculate group metrics
        for group in all_groups:
            self._calculate_group_metrics(group)
            
        # Generate summary
        summary = self._generate_summary(all_groups, remaining_trades)
        grouping_stats = self._calculate_grouping_stats(all_groups, len(trades_df))
        
        return GroupingResult(
            groups=all_groups,
            ungrouped_trades=remaining_trades.to_dict('records'),
            summary=summary,
            grouping_stats=grouping_stats
        )
    
    def _prepare_data(self, trades_df: pd.DataFrame) -> pd.DataFrame:
        """Prepare and validate trade data for grouping"""
        df = trades_df.copy()
        
        # Ensure required columns exist
        required_columns = ['symbol', 'entry_time', 'exit_time', 'quantity', 'pnl']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Convert time columns to datetime
        time_columns = ['entry_time', 'exit_time']
        for col in time_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # Calculate additional metrics
        df['hold_time'] = df['exit_time'] - df['entry_time']
        df['abs_quantity'] = df['quantity'].abs()
        
        # Detect market type
        df['market_type'] = df['symbol'].apply(self._detect_market_type)
        
        # Add trade index for tracking
        df['trade_index'] = range(len(df))
        
        return df.sort_values('entry_time')
    
    def _detect_market_type(self, symbol: str) -> MarketType:
        """Detect market type from symbol"""
        symbol_upper = symbol.upper()
        
        # Futures patterns
        futures_patterns = ['ES', 'NQ', 'YM', 'RTY', 'CL', 'GC', 'SI']
        if any(pattern in symbol_upper for pattern in futures_patterns):
            return MarketType.FUTURES
        
        # Forex patterns
        forex_patterns = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD']
        if len(symbol_upper) == 6 and any(curr in symbol_upper for curr in forex_patterns):
            return MarketType.FOREX
        
        # Crypto patterns
        crypto_patterns = ['BTC', 'ETH', 'LTC', 'XRP', 'ADA']
        if any(pattern in symbol_upper for pattern in crypto_patterns):
            return MarketType.CRYPTO
            
        return MarketType.UNKNOWN
    
    def _apply_grouping_strategy(self, 
                               trades_df: pd.DataFrame, 
                               strategy: GroupingStrategy,
                               custom_params: Dict[str, Any]) -> Tuple[List[TradeGroup], pd.DataFrame]:
        """Apply a specific grouping strategy"""
        
        if strategy == GroupingStrategy.SYMBOL:
            return self._group_by_symbol(trades_df, custom_params)
        elif strategy == GroupingStrategy.SESSION:
            return self._group_by_session(trades_df, custom_params)
        elif strategy == GroupingStrategy.SCALING:
            return self._group_by_scaling(trades_df, custom_params)
        elif strategy == GroupingStrategy.TIME_WINDOW:
            return self._group_by_time_window(trades_df, custom_params)
        elif strategy == GroupingStrategy.STRATEGY_PATTERN:
            return self._group_by_strategy_pattern(trades_df, custom_params)
        else:
            return [], trades_df
    
    def _group_by_symbol(self, trades_df: pd.DataFrame, params: Dict[str, Any]) -> Tuple[List[TradeGroup], pd.DataFrame]:
        """Group trades by symbol within time windows"""
        groups = []
        ungrouped_trades = []
        
        for symbol in trades_df['symbol'].unique():
            symbol_trades = trades_df[trades_df['symbol'] == symbol].copy()
            
            if len(symbol_trades) >= self.min_group_size:
                group = TradeGroup(
                    group_id=str(uuid.uuid4()),
                    trades=symbol_trades.to_dict('records'),
                    grouping_strategy=GroupingStrategy.SYMBOL,
                    group_type=f"Symbol: {symbol}",
                    metadata={'symbol': symbol, 'trade_count': len(symbol_trades)}
                )
                groups.append(group)
            else:
                ungrouped_trades.extend(symbol_trades.to_dict('records'))
        
        ungrouped_df = pd.DataFrame(ungrouped_trades) if ungrouped_trades else pd.DataFrame()
        return groups, ungrouped_df
    
    def _group_by_session(self, trades_df: pd.DataFrame, params: Dict[str, Any]) -> Tuple[List[TradeGroup], pd.DataFrame]:
        """Group trades by trading sessions based on time gaps"""
        if trades_df.empty:
            return [], trades_df
            
        groups = []
        current_session_trades = []
        last_trade_time = None
        session_number = 1
        
        for _, trade in trades_df.iterrows():
            trade_time = trade['entry_time']
            
            if (last_trade_time is None or 
                trade_time - last_trade_time <= self.session_gap_threshold):
                # Continue current session
                current_session_trades.append(trade.to_dict())
            else:
                # Start new session
                if len(current_session_trades) >= self.min_group_size:
                    group = TradeGroup(
                        group_id=str(uuid.uuid4()),
                        trades=current_session_trades,
                        grouping_strategy=GroupingStrategy.SESSION,
                        group_type=f"Session {session_number}",
                        metadata={
                            'session_number': session_number,
                            'trade_count': len(current_session_trades)
                        }
                    )
                    groups.append(group)
                
                # Start new session
                current_session_trades = [trade.to_dict()]
                session_number += 1
            
            last_trade_time = trade_time
        
        # Handle final session
        if len(current_session_trades) >= self.min_group_size:
            group = TradeGroup(
                group_id=str(uuid.uuid4()),
                trades=current_session_trades,
                grouping_strategy=GroupingStrategy.SESSION,
                group_type=f"Session {session_number}",
                metadata={
                    'session_number': session_number,
                    'trade_count': len(current_session_trades)
                }
            )
            groups.append(group)
        
        # All trades are either grouped or will be handled by other strategies
        return groups, pd.DataFrame()
    
    def _group_by_scaling(self, trades_df: pd.DataFrame, params: Dict[str, Any]) -> Tuple[List[TradeGroup], pd.DataFrame]:
        """Group trades that represent scaling in/out of positions"""
        groups = []
        ungrouped_trades = []
        
        # Group by symbol first
        for symbol in trades_df['symbol'].unique():
            symbol_trades = trades_df[trades_df['symbol'] == symbol].sort_values('entry_time')
            
            # Look for scaling patterns within time windows
            i = 0
            while i < len(symbol_trades):
                scaling_group = [symbol_trades.iloc[i]]
                current_time = symbol_trades.iloc[i]['entry_time']
                
                # Look for additional trades in the same direction within time window
                j = i + 1
                while j < len(symbol_trades):
                    next_trade = symbol_trades.iloc[j]
                    time_diff = next_trade['entry_time'] - current_time
                    
                    if time_diff <= self.scaling_time_window:
                        # Check if same direction (both long or both short)
                        if (np.sign(scaling_group[0]['quantity']) == 
                            np.sign(next_trade['quantity'])):
                            scaling_group.append(next_trade)
                        j += 1
                    else:
                        break
                
                if len(scaling_group) >= 2:  # Found scaling pattern
                    group = TradeGroup(
                        group_id=str(uuid.uuid4()),
                        trades=[trade.to_dict() for trade in scaling_group],
                        grouping_strategy=GroupingStrategy.SCALING,
                        group_type=f"Scaling: {symbol}",
                        metadata={
                            'symbol': symbol,
                            'scaling_trades': len(scaling_group),
                            'direction': 'Long' if scaling_group[0]['quantity'] > 0 else 'Short'
                        }
                    )
                    groups.append(group)
                    i += len(scaling_group)
                else:
                    ungrouped_trades.append(scaling_group[0].to_dict())
                    i += 1
        
        ungrouped_df = pd.DataFrame(ungrouped_trades) if ungrouped_trades else pd.DataFrame()
        return groups, ungrouped_df
    
    def _group_by_time_window(self, trades_df: pd.DataFrame, params: Dict[str, Any]) -> Tuple[List[TradeGroup], pd.DataFrame]:
        """Group trades within specific time windows"""
        time_window = params.get('time_window', self.default_time_window)
        groups = []
        ungrouped_trades = []
        
        if trades_df.empty:
            return groups, trades_df
        
        # Sort by entry time
        sorted_trades = trades_df.sort_values('entry_time')
        processed_indices = set()
        
        for i, trade in sorted_trades.iterrows():
            if i in processed_indices:
                continue
                
            window_trades = [trade]
            window_start = trade['entry_time']
            window_end = window_start + time_window
            processed_indices.add(i)
            
            # Find trades within the time window
            for j, other_trade in sorted_trades.iterrows():
                if (j not in processed_indices and 
                    window_start <= other_trade['entry_time'] <= window_end):
                    window_trades.append(other_trade)
                    processed_indices.add(j)
            
            if len(window_trades) >= self.min_group_size:
                group = TradeGroup(
                    group_id=str(uuid.uuid4()),
                    trades=[t.to_dict() for t in window_trades],
                    grouping_strategy=GroupingStrategy.TIME_WINDOW,
                    group_type=f"Time Window: {window_start.strftime('%H:%M')}",
                    metadata={
                        'window_start': window_start,
                        'window_end': window_end,
                        'trade_count': len(window_trades)
                    }
                )
                groups.append(group)
            else:
                ungrouped_trades.extend([t.to_dict() for t in window_trades])
        
        ungrouped_df = pd.DataFrame(ungrouped_trades) if ungrouped_trades else pd.DataFrame()
        return groups, ungrouped_df
    
    def _group_by_strategy_pattern(self, trades_df: pd.DataFrame, params: Dict[str, Any]) -> Tuple[List[TradeGroup], pd.DataFrame]:
        """Group trades by detected strategy patterns"""
        # This is a placeholder for more advanced pattern recognition
        # For now, we'll use simple heuristics
        groups = []
        
        return groups, trades_df
    
    def _calculate_group_metrics(self, group: TradeGroup):
        """Calculate comprehensive metrics for a trade group"""
        if not group.trades:
            return
        
        trades_df = pd.DataFrame(group.trades)
        
        # Basic metrics
        group.total_trades = len(group.trades)
        group.total_pnl = trades_df['pnl'].sum()
        group.total_volume = trades_df['abs_quantity'].sum() if 'abs_quantity' in trades_df.columns else 0
        
        # Win rate
        winning_trades = trades_df[trades_df['pnl'] > 0]
        group.win_rate = len(winning_trades) / len(trades_df) if len(trades_df) > 0 else 0
        
        # Time-based metrics
        if 'entry_time' in trades_df.columns:
            group.start_time = trades_df['entry_time'].min()
            
        if 'exit_time' in trades_df.columns:
            group.end_time = trades_df['exit_time'].max()
            
        if group.start_time and group.end_time:
            group.duration = group.end_time - group.start_time
            
        # Average hold time
        if 'hold_time' in trades_df.columns:
            hold_times = trades_df['hold_time'].dropna()
            if not hold_times.empty:
                group.avg_hold_time = hold_times.mean()
        
        # Risk-reward ratio
        if len(winning_trades) > 0 and len(trades_df[trades_df['pnl'] < 0]) > 0:
            avg_win = winning_trades['pnl'].mean()
            avg_loss = abs(trades_df[trades_df['pnl'] < 0]['pnl'].mean())
            group.risk_reward_ratio = avg_win / avg_loss if avg_loss > 0 else 0
        
        # Detect trading style
        group.trading_style = self._detect_trading_style(trades_df)
        
        # Detect market type
        if 'market_type' in trades_df.columns:
            group.market_type = trades_df['market_type'].iloc[0]
        
        # Confidence score (based on group coherence)
        group.confidence_score = self._calculate_confidence_score(group, trades_df)
    
    def _detect_trading_style(self, trades_df: pd.DataFrame) -> TradingStyle:
        """Detect the trading style based on trade characteristics"""
        if 'hold_time' not in trades_df.columns:
            return TradingStyle.MIXED
        
        hold_times = trades_df['hold_time'].dropna()
        if hold_times.empty:
            return TradingStyle.MIXED
        
        avg_hold = hold_times.mean()
        
        if avg_hold <= timedelta(minutes=30):
            return TradingStyle.SCALPING
        elif avg_hold <= timedelta(hours=8):
            return TradingStyle.DAY_TRADING
        elif avg_hold <= timedelta(days=7):
            return TradingStyle.SWING_TRADING
        else:
            return TradingStyle.POSITION_TRADING
    
    def _calculate_confidence_score(self, group: TradeGroup, trades_df: pd.DataFrame) -> float:
        """Calculate confidence score for the grouping"""
        score = 0.0
        
        # Time coherence (trades close in time)
        if group.duration and group.total_trades > 1:
            avg_time_gap = group.duration / group.total_trades
            if avg_time_gap <= timedelta(hours=1):
                score += 0.3
            elif avg_time_gap <= timedelta(hours=6):
                score += 0.2
            else:
                score += 0.1
        
        # Symbol coherence (same symbol)
        if 'symbol' in trades_df.columns:
            unique_symbols = trades_df['symbol'].nunique()
            if unique_symbols == 1:
                score += 0.3
            elif unique_symbols <= 3:
                score += 0.2
        
        # Volume coherence (similar trade sizes)
        if 'abs_quantity' in trades_df.columns:
            quantity_std = trades_df['abs_quantity'].std()
            quantity_mean = trades_df['abs_quantity'].mean()
            if quantity_mean > 0:
                cv = quantity_std / quantity_mean
                if cv <= 0.5:
                    score += 0.2
                elif cv <= 1.0:
                    score += 0.1
        
        # Group size bonus
        if group.total_trades >= 5:
            score += 0.2
        elif group.total_trades >= 3:
            score += 0.1
        
        return min(score, 1.0)
    
    def _generate_summary(self, groups: List[TradeGroup], ungrouped_trades: pd.DataFrame) -> Dict[str, Any]:
        """Generate summary statistics for the grouping result"""
        total_trades = sum(group.total_trades for group in groups) + len(ungrouped_trades)
        grouped_trades = sum(group.total_trades for group in groups)
        
        return {
            'total_groups': len(groups),
            'total_trades': total_trades,
            'grouped_trades': grouped_trades,
            'ungrouped_trades': len(ungrouped_trades),
            'grouping_efficiency': grouped_trades / total_trades if total_trades > 0 else 0,
            'avg_group_size': grouped_trades / len(groups) if len(groups) > 0 else 0,
            'total_pnl': sum(group.total_pnl for group in groups),
            'profitable_groups': len([g for g in groups if g.total_pnl > 0]),
            'avg_group_confidence': sum(group.confidence_score for group in groups) / len(groups) if len(groups) > 0 else 0
        }
    
    def _calculate_grouping_stats(self, groups: List[TradeGroup], total_trades: int) -> Dict[str, Any]:
        """Calculate detailed grouping statistics"""
        strategy_stats = {}
        style_stats = {}
        market_stats = {}
        
        for group in groups:
            # Strategy distribution
            strategy = group.grouping_strategy.value
            if strategy not in strategy_stats:
                strategy_stats[strategy] = {'count': 0, 'trades': 0, 'pnl': 0}
            strategy_stats[strategy]['count'] += 1
            strategy_stats[strategy]['trades'] += group.total_trades
            strategy_stats[strategy]['pnl'] += group.total_pnl
            
            # Trading style distribution
            if group.trading_style:
                style = group.trading_style.value
                if style not in style_stats:
                    style_stats[style] = {'count': 0, 'trades': 0}
                style_stats[style]['count'] += 1
                style_stats[style]['trades'] += group.total_trades
            
            # Market type distribution
            if group.market_type:
                market = group.market_type.value
                if market not in market_stats:
                    market_stats[market] = {'count': 0, 'trades': 0}
                market_stats[market]['count'] += 1
                market_stats[market]['trades'] += group.total_trades
        
        return {
            'strategy_distribution': strategy_stats,
            'trading_style_distribution': style_stats,
            'market_type_distribution': market_stats,
            'performance_metrics': {
                'best_group_pnl': max((g.total_pnl for g in groups), default=0),
                'worst_group_pnl': min((g.total_pnl for g in groups), default=0),
                'avg_group_pnl': sum(g.total_pnl for g in groups) / len(groups) if groups else 0,
                'best_win_rate': max((g.win_rate for g in groups), default=0),
                'avg_win_rate': sum(g.win_rate for g in groups) / len(groups) if groups else 0
            }
        }
