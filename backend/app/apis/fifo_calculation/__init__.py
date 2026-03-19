"""FIFO calculation API for grouped trades"""

import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import re

from app.auth import AuthorizedUser
from app.libs.fifo_calculator import FifoCalculator, FifoResult
from app.libs.trade_grouping_engine import TradeGroupingEngine, GroupingStrategy

router = APIRouter()

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

class FifoCalculationRequest(BaseModel):
    """Request for FIFO calculation"""
    trades: List[Dict[str, Any]] = Field(..., description="List of trades to calculate FIFO for")
    use_grouping: bool = Field(True, description="Whether to use trade grouping before FIFO calculation")
    grouping_strategies: Optional[List[str]] = Field(
        default=["symbol", "session", "scaling"], 
        description="Grouping strategies to apply"
    )
    include_audit_trail: bool = Field(True, description="Include detailed audit trail in response")

class FifoTradeResult(BaseModel):
    """FIFO calculation result for a single trade"""
    trade_id: str
    symbol: str
    timestamp: str
    action: str
    quantity: float
    price: float
    
    # FIFO-calculated P&L
    realized_pnl: float
    unrealized_pnl: float
    total_commission: float
    total_swap: float
    fifo_net_pnl: float
    
    # Broker P&L comparison
    broker_pnl: float
    pnl_difference: float
    
    # Position after trade
    position_quantity: float
    position_avg_price: float
    position_direction: str
    
    # Audit details
    lots_closed: List[Dict[str, Any]] = Field(default_factory=list)
    lots_opened: List[Dict[str, Any]] = Field(default_factory=list)
    calculation_details: Dict[str, Any] = Field(default_factory=dict)

class FifoGroupResult(BaseModel):
    """FIFO calculation result for a group of trades"""
    group_id: str
    group_type: str
    grouping_strategy: str
    symbol: str
    trade_count: int
    
    # Group-level FIFO metrics
    total_fifo_pnl: float
    total_broker_pnl: float
    total_pnl_difference: float
    total_realized_pnl: float
    total_unrealized_pnl: float
    
    # Individual trade results
    trades: List[FifoTradeResult]
    
    # Group summary
    fifo_win_rate: float
    broker_win_rate: float
    avg_fifo_pnl: float
    avg_broker_pnl: float

class FifoCalculationResponse(BaseModel):
    """Response from FIFO calculation"""
    success: bool
    message: str
    
    # Summary metrics
    total_trades_processed: int
    total_groups: int
    total_fifo_pnl: float
    total_broker_pnl: float
    total_pnl_difference: float
    
    # Methodology comparison
    fifo_win_rate: float
    broker_win_rate: float
    methodology_impact: str  # "positive", "negative", "neutral"
    
    # Detailed results
    group_results: List[FifoGroupResult]
    ungrouped_trades: List[FifoTradeResult] = Field(default_factory=list)
    
    # Audit trail
    audit_trail: List[Dict[str, Any]] = Field(default_factory=list)
    calculation_timestamp: str

@router.post("/calculate-fifo", response_model=FifoCalculationResponse)
async def calculate_fifo_for_trades(request: FifoCalculationRequest, user: AuthorizedUser):
    """Calculate FIFO P&L for trades with optional grouping"""
    
    try:
        print(f"🧮 Starting FIFO calculation for user {user.sub}")
        print(f"📊 Processing {len(request.trades)} trades with grouping: {request.use_grouping}")
        
        if not request.trades:
            return FifoCalculationResponse(
                success=False,
                message="No trades provided for FIFO calculation",
                total_trades_processed=0,
                total_groups=0,
                total_fifo_pnl=0.0,
                total_broker_pnl=0.0,
                total_pnl_difference=0.0,
                fifo_win_rate=0.0,
                broker_win_rate=0.0,
                methodology_impact="neutral",
                group_results=[],
                calculation_timestamp=datetime.now().isoformat()
            )
        
        # Initialize FIFO calculator
        fifo_calculator = FifoCalculator()
        
        if request.use_grouping:
            # Use trade grouping engine first
            result = await _calculate_fifo_with_grouping(
                request, fifo_calculator, user
            )
        else:
            # Calculate FIFO directly without grouping
            result = await _calculate_fifo_direct(
                request, fifo_calculator, user
            )
        
        print(f"✅ FIFO calculation complete: {result.total_groups} groups, {result.total_trades_processed} trades")
        return result
        
    except Exception as e:
        print(f"❌ Error in FIFO calculation: {e}")
        raise HTTPException(status_code=500, detail=f"FIFO calculation failed: {str(e)}")

async def _calculate_fifo_with_grouping(
    request: FifoCalculationRequest, 
    fifo_calculator: FifoCalculator, 
    user: AuthorizedUser
) -> FifoCalculationResponse:
    """Calculate FIFO with trade grouping"""
    
    # Prepare trades DataFrame for grouping
    trades_df = pd.DataFrame(request.trades)
    
    # Standardize column names for grouping engine
    column_mapping = {
        'openTime': 'entry_time',
        'closeTime': 'exit_time',
        'lots': 'quantity'
    }
    
    for old_col, new_col in column_mapping.items():
        if old_col in trades_df.columns and new_col not in trades_df.columns:
            trades_df[new_col] = trades_df[old_col]
    
    # Ensure all required columns exist for trade grouping engine
    required_columns = ['symbol', 'entry_time', 'exit_time', 'quantity', 'pnl']
    
    for col in required_columns:
        if col not in trades_df.columns:
            # Try to map from common alternative column names
            if col == 'entry_time' and 'openTime' in trades_df.columns:
                trades_df['entry_time'] = trades_df['openTime']
            elif col == 'exit_time' and 'closeTime' in trades_df.columns:
                trades_df['exit_time'] = trades_df['closeTime']
            elif col == 'quantity' and 'lots' in trades_df.columns:
                trades_df['quantity'] = trades_df['lots']
            elif col == 'pnl' and col not in trades_df.columns:
                # If no pnl column, create it with 0 values (will be calculated by FIFO)
                trades_df['pnl'] = 0.0
            
    # Final validation - ensure all required columns are present
    missing_columns = [col for col in required_columns if col not in trades_df.columns]
    if missing_columns:
        print(f"⚠️ Missing required columns for grouping: {missing_columns}")
        print(f"Available columns: {list(trades_df.columns)}")
        # Create missing columns with default values
        for col in missing_columns:
            if col == 'symbol':
                trades_df['symbol'] = 'UNKNOWN'
            elif col in ['entry_time', 'exit_time']:
                trades_df[col] = pd.Timestamp.now()
            elif col == 'quantity':
                trades_df['quantity'] = 1.0
            elif col == 'pnl':
                trades_df['pnl'] = 0.0
    
    # Convert grouping strategy strings to enum values
    strategy_mapping = {
        'symbol': GroupingStrategy.SYMBOL,
        'session': GroupingStrategy.SESSION,
        'scaling': GroupingStrategy.SCALING,
        'time_window': GroupingStrategy.TIME_WINDOW,
        'strategy_pattern': GroupingStrategy.STRATEGY_PATTERN
    }
    
    strategies = []
    for strategy_name in request.grouping_strategies or ['symbol', 'session', 'scaling']:
        if strategy_name in strategy_mapping:
            strategies.append(strategy_mapping[strategy_name])
    
    # Group trades
    grouping_engine = TradeGroupingEngine()
    grouping_result = grouping_engine.group_trades(trades_df, strategies)
    
    print(f"🔗 Trade grouping result: {len(grouping_result.groups)} groups, {len(grouping_result.ungrouped_trades)} ungrouped")
    
    # Calculate FIFO for each group
    group_results = []
    total_fifo_pnl = 0.0
    total_broker_pnl = 0.0
    total_trades_processed = 0
    
    for group in grouping_result.groups:
        group_fifo_results = fifo_calculator.calculate_group_fifo(group.trades)
        
        # Convert to API response format
        trade_results = []
        group_fifo_pnl = 0.0
        group_broker_pnl = 0.0
        group_realized_pnl = 0.0
        group_unrealized_pnl = 0.0
        
        for fifo_result in group_fifo_results:
            trade_result = _convert_fifo_result_to_api(fifo_result)
            trade_results.append(trade_result)
            
            group_fifo_pnl += fifo_result.fifo_net_pnl
            group_broker_pnl += fifo_result.broker_pnl
            group_realized_pnl += fifo_result.realized_pnl
            group_unrealized_pnl += fifo_result.unrealized_pnl
        
        # Calculate group metrics
        fifo_wins = len([t for t in trade_results if t.fifo_net_pnl > 0])
        broker_wins = len([t for t in trade_results if t.broker_pnl > 0])
        
        group_result = FifoGroupResult(
            group_id=group.group_id,
            group_type=group.group_type,
            grouping_strategy=group.grouping_strategy.value,
            symbol=group.trades[0]['symbol'] if group.trades else "Unknown",
            trade_count=len(group.trades),
            total_fifo_pnl=group_fifo_pnl,
            total_broker_pnl=group_broker_pnl,
            total_pnl_difference=group_fifo_pnl - group_broker_pnl,
            total_realized_pnl=group_realized_pnl,
            total_unrealized_pnl=group_unrealized_pnl,
            trades=trade_results,
            fifo_win_rate=(fifo_wins / len(trade_results)) * 100 if trade_results else 0,
            broker_win_rate=(broker_wins / len(trade_results)) * 100 if trade_results else 0,
            avg_fifo_pnl=group_fifo_pnl / len(trade_results) if trade_results else 0,
            avg_broker_pnl=group_broker_pnl / len(trade_results) if trade_results else 0
        )
        
        group_results.append(group_result)
        total_fifo_pnl += group_fifo_pnl
        total_broker_pnl += group_broker_pnl
        total_trades_processed += len(group.trades)
    
    # Process ungrouped trades
    ungrouped_results = []
    if grouping_result.ungrouped_trades:
        ungrouped_fifo_results = fifo_calculator.calculate_group_fifo(
            grouping_result.ungrouped_trades
        )
        
        for fifo_result in ungrouped_fifo_results:
            trade_result = _convert_fifo_result_to_api(fifo_result)
            ungrouped_results.append(trade_result)
            total_fifo_pnl += fifo_result.fifo_net_pnl
            total_broker_pnl += fifo_result.broker_pnl
            total_trades_processed += 1
    
    # Calculate overall metrics
    all_fifo_pnls = [t.fifo_net_pnl for gr in group_results for t in gr.trades] + [t.fifo_net_pnl for t in ungrouped_results]
    all_broker_pnls = [t.broker_pnl for gr in group_results for t in gr.trades] + [t.broker_pnl for t in ungrouped_results]
    
    fifo_wins = len([pnl for pnl in all_fifo_pnls if pnl > 0])
    broker_wins = len([pnl for pnl in all_broker_pnls if pnl > 0])
    
    fifo_win_rate = (fifo_wins / len(all_fifo_pnls)) * 100 if all_fifo_pnls else 0
    broker_win_rate = (broker_wins / len(all_broker_pnls)) * 100 if all_broker_pnls else 0
    
    # Determine methodology impact
    pnl_difference = total_fifo_pnl - total_broker_pnl
    if abs(pnl_difference) < 0.01:
        methodology_impact = "neutral"
    elif pnl_difference > 0:
        methodology_impact = "positive"
    else:
        methodology_impact = "negative"
    
    # Get audit trail if requested
    audit_trail = []
    if request.include_audit_trail:
        audit_trail = fifo_calculator.get_audit_trail()
    
    return FifoCalculationResponse(
        success=True,
        message=f"FIFO calculation completed for {total_trades_processed} trades in {len(group_results)} groups",
        total_trades_processed=total_trades_processed,
        total_groups=len(group_results),
        total_fifo_pnl=total_fifo_pnl,
        total_broker_pnl=total_broker_pnl,
        total_pnl_difference=pnl_difference,
        fifo_win_rate=fifo_win_rate,
        broker_win_rate=broker_win_rate,
        methodology_impact=methodology_impact,
        group_results=group_results,
        ungrouped_trades=ungrouped_results,
        audit_trail=audit_trail,
        calculation_timestamp=datetime.now().isoformat()
    )

async def _calculate_fifo_direct(
    request: FifoCalculationRequest, 
    fifo_calculator: FifoCalculator, 
    user: AuthorizedUser
) -> FifoCalculationResponse:
    """Calculate FIFO directly without grouping"""
    
    # Calculate FIFO for all trades as one group
    fifo_results = fifo_calculator.calculate_group_fifo(request.trades)
    
    # Convert to API response format
    trade_results = []
    total_fifo_pnl = 0.0
    total_broker_pnl = 0.0
    
    for fifo_result in fifo_results:
        trade_result = _convert_fifo_result_to_api(fifo_result)
        trade_results.append(trade_result)
        total_fifo_pnl += fifo_result.fifo_net_pnl
        total_broker_pnl += fifo_result.broker_pnl
    
    # Calculate metrics
    fifo_wins = len([t for t in trade_results if t.fifo_net_pnl > 0])
    broker_wins = len([t for t in trade_results if t.broker_pnl > 0])
    
    fifo_win_rate = (fifo_wins / len(trade_results)) * 100 if trade_results else 0
    broker_win_rate = (broker_wins / len(trade_results)) * 100 if trade_results else 0
    
    # Determine methodology impact
    pnl_difference = total_fifo_pnl - total_broker_pnl
    if abs(pnl_difference) < 0.01:
        methodology_impact = "neutral"
    elif pnl_difference > 0:
        methodology_impact = "positive"
    else:
        methodology_impact = "negative"
    
    # Create single group result
    group_result = FifoGroupResult(
        group_id="all_trades",
        group_type="All Trades (No Grouping)",
        grouping_strategy="none",
        symbol="Mixed" if len(set(t['symbol'] for t in request.trades)) > 1 else request.trades[0]['symbol'],
        trade_count=len(request.trades),
        total_fifo_pnl=total_fifo_pnl,
        total_broker_pnl=total_broker_pnl,
        total_pnl_difference=pnl_difference,
        total_realized_pnl=sum(t.realized_pnl for t in trade_results),
        total_unrealized_pnl=sum(t.unrealized_pnl for t in trade_results),
        trades=trade_results,
        fifo_win_rate=fifo_win_rate,
        broker_win_rate=broker_win_rate,
        avg_fifo_pnl=total_fifo_pnl / len(trade_results) if trade_results else 0,
        avg_broker_pnl=total_broker_pnl / len(trade_results) if trade_results else 0
    )
    
    # Get audit trail if requested
    audit_trail = []
    if request.include_audit_trail:
        audit_trail = fifo_calculator.get_audit_trail()
    
    return FifoCalculationResponse(
        success=True,
        message=f"FIFO calculation completed for {len(request.trades)} trades without grouping",
        total_trades_processed=len(request.trades),
        total_groups=1,
        total_fifo_pnl=total_fifo_pnl,
        total_broker_pnl=total_broker_pnl,
        total_pnl_difference=pnl_difference,
        fifo_win_rate=fifo_win_rate,
        broker_win_rate=broker_win_rate,
        methodology_impact=methodology_impact,
        group_results=[group_result],
        audit_trail=audit_trail,
        calculation_timestamp=datetime.now().isoformat()
    )

def _convert_fifo_result_to_api(fifo_result: FifoResult) -> FifoTradeResult:
    """Convert internal FIFO result to API response format"""
    position = fifo_result.position_after
    
    return FifoTradeResult(
        trade_id=fifo_result.trade_id,
        symbol=fifo_result.symbol,
        timestamp=fifo_result.timestamp.isoformat(),
        action=fifo_result.action.value,
        quantity=fifo_result.quantity,
        price=fifo_result.price,
        realized_pnl=fifo_result.realized_pnl,
        unrealized_pnl=fifo_result.unrealized_pnl,
        total_commission=fifo_result.total_commission,
        total_swap=fifo_result.total_swap,
        fifo_net_pnl=fifo_result.fifo_net_pnl,
        broker_pnl=fifo_result.broker_pnl,
        pnl_difference=fifo_result.pnl_difference,
        position_quantity=position.total_quantity if position else 0,
        position_avg_price=position.avg_price if position else 0,
        position_direction=position.direction.value if position else "flat",
        lots_closed=fifo_result.lots_closed,
        lots_opened=fifo_result.lots_opened,
        calculation_details=fifo_result.calculation_details
    )

@router.get("/health")
async def fifo_health_check():
    """Health check for FIFO calculation API"""
    return {
        "status": "healthy",
        "service": "FIFO Calculator",
        "version": "1.0.0",
        "features": [
            "Trade grouping integration",
            "FIFO P&L calculation",
            "Audit trail generation",
            "Broker vs FIFO comparison",
            "Position tracking",
            "Edge case handling"
        ]
    }
