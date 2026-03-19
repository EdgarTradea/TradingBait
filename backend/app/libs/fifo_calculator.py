"""FIFO (First-In-First-Out) calculation engine for grouped trades"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import uuid

class PositionDirection(Enum):
    """Direction of position"""
    LONG = "long"
    SHORT = "short"
    FLAT = "flat"

class TradeAction(Enum):
    """Type of trade action"""
    OPEN = "open"  # Opening new position
    ADD = "add"    # Adding to existing position
    REDUCE = "reduce"  # Reducing existing position
    CLOSE = "close"   # Closing entire position
    REVERSE = "reverse"  # Reversing position direction

@dataclass
class FifoTrade:
    """Individual trade for FIFO calculation"""
    trade_id: str
    timestamp: datetime
    symbol: str
    quantity: float  # Positive for buy, negative for sell
    price: float
    commission: float = 0.0
    swap: float = 0.0
    original_pnl: float = 0.0  # Broker-calculated P&L
    group_id: Optional[str] = None
    
    @property
    def is_buy(self) -> bool:
        return self.quantity > 0
    
    @property
    def is_sell(self) -> bool:
        return self.quantity < 0
    
    @property
    def abs_quantity(self) -> float:
        return abs(self.quantity)

@dataclass
class FifoPosition:
    """FIFO position tracking"""
    symbol: str
    direction: PositionDirection
    total_quantity: float
    avg_price: float
    total_cost: float
    unrealized_pnl: float = 0.0
    
    # FIFO queue for tracking individual lots
    lots: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.lots is None:
            self.lots = []

@dataclass
class FifoResult:
    """Result of FIFO calculation for a trade"""
    trade_id: str
    symbol: str
    timestamp: datetime
    action: TradeAction
    quantity: float
    price: float
    
    # FIFO-calculated P&L components
    realized_pnl: float = 0.0
    unrealized_pnl: float = 0.0
    total_commission: float = 0.0
    total_swap: float = 0.0
    fifo_net_pnl: float = 0.0
    
    # Original broker P&L for comparison
    broker_pnl: float = 0.0
    pnl_difference: float = 0.0
    
    # Position information after this trade
    position_after: Optional[FifoPosition] = None
    
    # Audit trail
    calculation_details: Dict[str, Any] = None
    lots_closed: List[Dict[str, Any]] = None
    lots_opened: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.calculation_details is None:
            self.calculation_details = {}
        if self.lots_closed is None:
            self.lots_closed = []
        if self.lots_opened is None:
            self.lots_opened = []
        
        # Calculate FIFO net P&L
        self.fifo_net_pnl = self.realized_pnl + self.total_commission + self.total_swap
        self.pnl_difference = self.fifo_net_pnl - self.broker_pnl

class FifoCalculator:
    """FIFO calculation engine for grouped trades"""
    
    def __init__(self):
        self.positions: Dict[str, FifoPosition] = {}
        self.calculation_history: List[FifoResult] = []
        self.total_realized_pnl = 0.0
        self.total_unrealized_pnl = 0.0
        
    def calculate_group_fifo(self, grouped_trades: List[Dict[str, Any]]) -> List[FifoResult]:
        """Calculate FIFO P&L for a group of trades"""
        
        # Convert trades to FifoTrade objects
        fifo_trades = self._prepare_trades(grouped_trades)
        
        # Sort trades by timestamp for FIFO processing
        fifo_trades.sort(key=lambda t: t.timestamp)
        
        results = []
        
        for trade in fifo_trades:
            result = self._process_trade(trade)
            results.append(result)
            self.calculation_history.append(result)
        
        return results
    
    def calculate_multiple_groups(self, trade_groups: List[Dict[str, Any]]) -> Dict[str, List[FifoResult]]:
        """Calculate FIFO P&L for multiple trade groups"""
        group_results = {}
        
        for group in trade_groups:
            group_id = group.get('group_id', str(uuid.uuid4()))
            trades = group.get('trades', [])
            
            # Reset calculator state for each group
            self._reset_for_group()
            
            # Calculate FIFO for this group
            results = self.calculate_group_fifo(trades)
            group_results[group_id] = results
        
        return group_results
    
    def _prepare_trades(self, trades: List[Dict[str, Any]]) -> List[FifoTrade]:
        """Convert trade data to FifoTrade objects"""
        fifo_trades = []
        
        for trade in trades:
            # Parse timestamp
            timestamp = self._parse_timestamp(trade.get('entry_time') or trade.get('openTime'))
            
            # Determine quantity (positive for buy, negative for sell)
            quantity = self._parse_quantity(trade)
            
            # Parse price - try multiple field names
            price = self._parse_price(trade)
            
            fifo_trade = FifoTrade(
                trade_id=str(trade.get('id', trade.get('ticket', uuid.uuid4()))),
                timestamp=timestamp,
                symbol=trade['symbol'],
                quantity=quantity,
                price=price,
                commission=float(trade.get('commission', 0)),
                swap=float(trade.get('swap', 0)),
                original_pnl=float(trade.get('pnl', 0)),
                group_id=trade.get('group_id')
            )
            
            fifo_trades.append(fifo_trade)
        
        return fifo_trades
    
    def _parse_timestamp(self, timestamp_str: Any) -> datetime:
        """Parse timestamp from various formats"""
        if isinstance(timestamp_str, datetime):
            return timestamp_str
        
        if isinstance(timestamp_str, str):
            # Try common datetime formats
            formats = [
                '%Y-%m-%d %H:%M:%S',
                '%Y-%m-%d %H:%M:%S.%f',
                '%Y-%m-%dT%H:%M:%S',
                '%Y-%m-%dT%H:%M:%S.%f',
                '%Y-%m-%dT%H:%M:%SZ',
                '%Y-%m-%dT%H:%M:%S.%fZ'
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(timestamp_str, fmt)
                except ValueError:
                    continue
        
        # Default to current time if parsing fails
        return datetime.now()
    
    def _parse_quantity(self, trade: Dict[str, Any]) -> float:
        """Parse trade quantity and direction"""
        quantity = float(trade.get('quantity', trade.get('lots', 0)))
        trade_type = trade.get('type', '').lower()
        
        # If quantity is already signed, use as-is
        if quantity != 0:
            return quantity
        
        # Otherwise determine from trade type
        if trade_type in ['buy', 'long']:
            return abs(quantity) if quantity != 0 else 1.0
        elif trade_type in ['sell', 'short']:
            return -abs(quantity) if quantity != 0 else -1.0
        
        # Default assumption based on P&L if available
        pnl = float(trade.get('pnl', 0))
        if pnl != 0:
            return 1.0 if pnl > 0 else -1.0
        
        return 1.0  # Default to buy
    
    def _parse_price(self, trade: Dict[str, Any]) -> float:
        """Parse trade price from various field names"""
        # Try different price field names
        price_fields = ['entry_price', 'openPrice', 'open_price', 'price']
        
        for field in price_fields:
            if field in trade and trade[field] is not None:
                try:
                    price = float(trade[field])
                    if price > 0:  # Valid price
                        return price
                except (ValueError, TypeError):
                    continue
        
        # If no valid price found, log warning and return 0
        print(f"⚠️ Warning: No valid price found for trade {trade.get('id', 'unknown')}")
        return 0.0
    
    def _process_trade(self, trade: FifoTrade) -> FifoResult:
        """Process a single trade using FIFO methodology"""
        symbol = trade.symbol
        
        # Initialize position if it doesn't exist
        if symbol not in self.positions:
            self.positions[symbol] = FifoPosition(
                symbol=symbol,
                direction=PositionDirection.FLAT,
                total_quantity=0.0,
                avg_price=0.0,
                total_cost=0.0,
                lots=[]
            )
        
        position = self.positions[symbol]
        
        # Determine trade action
        action = self._determine_trade_action(trade, position)
        
        # Process the trade based on action
        if action == TradeAction.OPEN:
            return self._process_open_trade(trade, position)
        elif action == TradeAction.ADD:
            return self._process_add_trade(trade, position)
        elif action in [TradeAction.REDUCE, TradeAction.CLOSE]:
            return self._process_reduce_trade(trade, position)
        elif action == TradeAction.REVERSE:
            return self._process_reverse_trade(trade, position)
        else:
            return self._create_result(trade, action, position)
    
    def _determine_trade_action(self, trade: FifoTrade, position: FifoPosition) -> TradeAction:
        """Determine what action this trade represents"""
        current_quantity = position.total_quantity
        trade_quantity = trade.quantity
        
        if current_quantity == 0:
            return TradeAction.OPEN
        
        # Same direction = adding to position
        if (current_quantity > 0 and trade_quantity > 0) or (current_quantity < 0 and trade_quantity < 0):
            return TradeAction.ADD
        
        # Opposite direction
        if abs(trade_quantity) < abs(current_quantity):
            return TradeAction.REDUCE
        elif abs(trade_quantity) == abs(current_quantity):
            return TradeAction.CLOSE
        else:
            return TradeAction.REVERSE
    
    def _process_open_trade(self, trade: FifoTrade, position: FifoPosition) -> FifoResult:
        """Process opening trade"""
        # Create new lot
        lot = {
            'quantity': trade.abs_quantity,
            'price': trade.price,
            'timestamp': trade.timestamp,
            'trade_id': trade.trade_id
        }
        
        position.lots.append(lot)
        position.total_quantity = trade.quantity
        position.avg_price = trade.price
        position.total_cost = trade.abs_quantity * trade.price
        position.direction = PositionDirection.LONG if trade.quantity > 0 else PositionDirection.SHORT
        
        result = self._create_result(trade, TradeAction.OPEN, position)
        result.lots_opened = [lot]
        result.calculation_details['opening_position'] = True
        
        return result
    
    def _process_add_trade(self, trade: FifoTrade, position: FifoPosition) -> FifoResult:
        """Process adding to existing position"""
        # Create new lot
        lot = {
            'quantity': trade.abs_quantity,
            'price': trade.price,
            'timestamp': trade.timestamp,
            'trade_id': trade.trade_id
        }
        
        position.lots.append(lot)
        
        # Update position averages
        old_cost = position.total_cost
        new_cost = trade.abs_quantity * trade.price
        position.total_cost += new_cost
        position.total_quantity += trade.quantity
        position.avg_price = position.total_cost / abs(position.total_quantity)
        
        result = self._create_result(trade, TradeAction.ADD, position)
        result.lots_opened = [lot]
        result.calculation_details['adding_to_position'] = True
        result.calculation_details['old_avg_price'] = (old_cost / abs(position.total_quantity - trade.quantity))
        result.calculation_details['new_avg_price'] = position.avg_price
        
        return result
    
    def _process_reduce_trade(self, trade: FifoTrade, position: FifoPosition) -> FifoResult:
        """Process reducing existing position using FIFO"""
        remaining_to_close = trade.abs_quantity
        realized_pnl = 0.0
        lots_closed = []
        
        # Process lots in FIFO order
        while remaining_to_close > 0 and position.lots:
            oldest_lot = position.lots[0]
            lot_quantity = oldest_lot['quantity']
            lot_price = oldest_lot['price']
            
            if lot_quantity <= remaining_to_close:
                # Close entire lot
                position.lots.pop(0)
                quantity_closed = lot_quantity
                remaining_to_close -= lot_quantity
                
                # Calculate P&L for this lot
                if position.direction == PositionDirection.LONG:
                    lot_pnl = quantity_closed * (trade.price - lot_price)
                else:  # SHORT
                    lot_pnl = quantity_closed * (lot_price - trade.price)
                
                realized_pnl += lot_pnl
                
                lots_closed.append({
                    'original_lot': oldest_lot,
                    'quantity_closed': quantity_closed,
                    'entry_price': lot_price,
                    'exit_price': trade.price,
                    'pnl': lot_pnl
                })
                
            else:
                # Partially close lot
                quantity_closed = remaining_to_close
                oldest_lot['quantity'] -= remaining_to_close
                
                # Calculate P&L for partial closure
                if position.direction == PositionDirection.LONG:
                    lot_pnl = quantity_closed * (trade.price - lot_price)
                else:  # SHORT
                    lot_pnl = quantity_closed * (lot_price - trade.price)
                
                realized_pnl += lot_pnl
                
                lots_closed.append({
                    'original_lot': oldest_lot.copy(),
                    'quantity_closed': quantity_closed,
                    'entry_price': lot_price,
                    'exit_price': trade.price,
                    'pnl': lot_pnl
                })
                
                remaining_to_close = 0
        
        # Update position
        position.total_quantity += trade.quantity  # trade.quantity is negative for reduction
        position.total_cost = sum(lot['quantity'] * lot['price'] for lot in position.lots)
        
        if position.total_quantity == 0:
            position.direction = PositionDirection.FLAT
            position.avg_price = 0.0
            position.total_cost = 0.0
        elif position.lots:
            position.avg_price = position.total_cost / abs(position.total_quantity)
        
        action = TradeAction.CLOSE if position.total_quantity == 0 else TradeAction.REDUCE
        
        result = self._create_result(trade, action, position)
        result.realized_pnl = realized_pnl
        result.lots_closed = lots_closed
        result.calculation_details['fifo_calculation'] = True
        result.calculation_details['lots_processed'] = len(lots_closed)
        
        self.total_realized_pnl += realized_pnl
        
        return result
    
    def _process_reverse_trade(self, trade: FifoTrade, position: FifoPosition) -> FifoResult:
        """Process position reversal"""
        # First close existing position
        close_quantity = -position.total_quantity  # Opposite sign to close
        close_trade = FifoTrade(
            trade_id=f"{trade.trade_id}_close",
            timestamp=trade.timestamp,
            symbol=trade.symbol,
            quantity=close_quantity,
            price=trade.price,
            commission=0,  # Commission will be on the main trade
            swap=0
        )
        
        close_result = self._process_reduce_trade(close_trade, position)
        
        # Then open new position in opposite direction
        remaining_quantity = trade.quantity - close_quantity
        open_trade = FifoTrade(
            trade_id=f"{trade.trade_id}_open",
            timestamp=trade.timestamp,
            symbol=trade.symbol,
            quantity=remaining_quantity,
            price=trade.price,
            commission=0,  # Commission will be on the main trade
            swap=0
        )
        
        open_result = self._process_open_trade(open_trade, position)
        
        # Combine results
        result = self._create_result(trade, TradeAction.REVERSE, position)
        result.realized_pnl = close_result.realized_pnl
        result.lots_closed = close_result.lots_closed
        result.lots_opened = open_result.lots_opened
        result.calculation_details['position_reversal'] = True
        result.calculation_details['close_pnl'] = close_result.realized_pnl
        result.calculation_details['new_position_size'] = remaining_quantity
        
        return result
    
    def _create_result(self, trade: FifoTrade, action: TradeAction, position: FifoPosition) -> FifoResult:
        """Create FIFO result object"""
        result = FifoResult(
            trade_id=trade.trade_id,
            symbol=trade.symbol,
            timestamp=trade.timestamp,
            action=action,
            quantity=trade.quantity,
            price=trade.price,
            total_commission=trade.commission,
            total_swap=trade.swap,
            broker_pnl=trade.original_pnl,
            position_after=FifoPosition(
                symbol=position.symbol,
                direction=position.direction,
                total_quantity=position.total_quantity,
                avg_price=position.avg_price,
                total_cost=position.total_cost,
                lots=position.lots.copy()
            )
        )
        
        return result
    
    def _reset_for_group(self):
        """Reset calculator state for processing a new group"""
        self.positions.clear()
        self.total_realized_pnl = 0.0
        self.total_unrealized_pnl = 0.0
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary of FIFO calculations"""
        return {
            'total_realized_pnl': self.total_realized_pnl,
            'total_unrealized_pnl': self.total_unrealized_pnl,
            'active_positions': len([p for p in self.positions.values() if p.total_quantity != 0]),
            'total_trades_processed': len(self.calculation_history),
            'positions_summary': {
                symbol: {
                    'direction': pos.direction.value,
                    'quantity': pos.total_quantity,
                    'avg_price': pos.avg_price,
                    'unrealized_pnl': pos.unrealized_pnl
                }
                for symbol, pos in self.positions.items()
                if pos.total_quantity != 0
            }
        }
    
    def get_audit_trail(self) -> List[Dict[str, Any]]:
        """Get detailed audit trail of all FIFO calculations"""
        audit_trail = []
        
        for result in self.calculation_history:
            audit_entry = {
                'trade_id': result.trade_id,
                'timestamp': result.timestamp.isoformat(),
                'symbol': result.symbol,
                'action': result.action.value,
                'quantity': result.quantity,
                'price': result.price,
                'fifo_pnl': result.fifo_net_pnl,
                'broker_pnl': result.broker_pnl,
                'pnl_difference': result.pnl_difference,
                'lots_closed': result.lots_closed,
                'lots_opened': result.lots_opened,
                'calculation_details': result.calculation_details
            }
            audit_trail.append(audit_entry)
        
        return audit_trail
