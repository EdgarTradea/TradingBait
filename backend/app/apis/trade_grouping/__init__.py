"""Trade grouping API endpoints for advanced trade analysis"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from app.libs.trade_grouping_engine import (
    TradeGroupingEngine,
    GroupingStrategy,
    TradeGroup,
    GroupingResult,
    TradingStyle,
    MarketType
)

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/trade-grouping")

# Pydantic models
class TradeData(BaseModel):
    """Individual trade data"""
    symbol: str
    entry_time: datetime
    exit_time: Optional[datetime] = None
    quantity: float
    entry_price: float
    exit_price: Optional[float] = None
    pnl: float
    commission: Optional[float] = 0.0
    platform: Optional[str] = None
    strategy: Optional[str] = None

class GroupingRequest(BaseModel):
    """Request for trade grouping"""
    trades: List[TradeData]
    strategies: Optional[List[str]] = Field(default=["symbol", "session", "scaling"])
    custom_params: Optional[Dict[str, Any]] = Field(default_factory=dict)
    user_id: Optional[str] = None

class GroupMetrics(BaseModel):
    """Group-level metrics"""
    group_id: str
    group_type: str
    grouping_strategy: str
    total_trades: int
    total_pnl: float
    win_rate: float
    total_volume: float
    risk_reward_ratio: float
    avg_hold_time_minutes: Optional[float] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    trading_style: Optional[str] = None
    market_type: Optional[str] = None
    confidence_score: float
    metadata: Dict[str, Any]

class GroupWithTrades(BaseModel):
    """Group with full trade details"""
    metrics: GroupMetrics
    trades: List[Dict[str, Any]]

class GroupingSummary(BaseModel):
    """Summary of grouping operation"""
    total_groups: int
    total_trades: int
    grouped_trades: int
    ungrouped_trades: int
    grouping_efficiency: float
    avg_group_size: float
    total_pnl: float
    profitable_groups: int
    avg_group_confidence: float

class GroupingStats(BaseModel):
    """Detailed grouping statistics"""
    strategy_distribution: Dict[str, Dict[str, Any]]
    trading_style_distribution: Dict[str, Dict[str, Any]]
    market_type_distribution: Dict[str, Dict[str, Any]]
    performance_metrics: Dict[str, float]

class GroupingResponse(BaseModel):
    """Complete grouping response"""
    groups: List[GroupWithTrades]
    ungrouped_trades: List[Dict[str, Any]]
    summary: GroupingSummary
    grouping_stats: GroupingStats
    execution_time_ms: float

class GroupAnalysisRequest(BaseModel):
    """Request for analyzing existing groups"""
    group_ids: List[str]
    analysis_type: str = Field(default="comprehensive", description="Type of analysis: basic, comprehensive, comparative")
    user_id: Optional[str] = None

class GroupAnalysisResponse(BaseModel):
    """Group analysis response"""
    group_analyses: List[Dict[str, Any]]
    comparative_metrics: Optional[Dict[str, Any]] = None
    insights: List[str]
    recommendations: List[str]

# Initialize grouping engine
grouping_engine = TradeGroupingEngine()

@router.post("/analyze-trades", response_model=GroupingResponse)
async def analyze_trades(request: GroupingRequest):
    """Analyze and group trades using multiple strategies"""
    try:
        import time
        start_time = time.time()
        
        # Convert pydantic models to DataFrame
        trades_data = [trade.dict() for trade in request.trades]
        trades_df = pd.DataFrame(trades_data)
        
        # Convert strategy strings to enums
        strategies = []
        for strategy_str in request.strategies:
            try:
                strategies.append(GroupingStrategy(strategy_str))
            except ValueError:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid grouping strategy: {strategy_str}"
                )
        
        # Perform grouping
        result: GroupingResult = grouping_engine.group_trades(
            trades_df=trades_df,
            strategies=strategies,
            custom_params=request.custom_params
        )
        
        # Convert result to response format
        groups_with_trades = []
        for group in result.groups:
            metrics = GroupMetrics(
                group_id=group.group_id,
                group_type=group.group_type,
                grouping_strategy=group.grouping_strategy.value,
                total_trades=group.total_trades,
                total_pnl=group.total_pnl,
                win_rate=group.win_rate,
                total_volume=group.total_volume,
                risk_reward_ratio=group.risk_reward_ratio,
                avg_hold_time_minutes=group.avg_hold_time.total_seconds() / 60 if group.avg_hold_time else None,
                start_time=group.start_time,
                end_time=group.end_time,
                duration_minutes=group.duration.total_seconds() / 60 if group.duration else None,
                trading_style=group.trading_style.value if group.trading_style else None,
                market_type=group.market_type.value if group.market_type else None,
                confidence_score=group.confidence_score,
                metadata=group.metadata
            )
            
            groups_with_trades.append(GroupWithTrades(
                metrics=metrics,
                trades=group.trades
            ))
        
        # Store results for later analysis if user_id provided
        if request.user_id:
            await _store_grouping_results(request.user_id, result)
        
        execution_time = (time.time() - start_time) * 1000
        
        return GroupingResponse(
            groups=groups_with_trades,
            ungrouped_trades=result.ungrouped_trades,
            summary=GroupingSummary(**result.summary),
            grouping_stats=GroupingStats(**result.grouping_stats),
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grouping analysis failed: {str(e)}")

@router.get("/user-groups/{user_id}")
async def get_user_groups(user_id: str, limit: int = Query(50, ge=1, le=200)):
    """Get stored grouping results for a user"""
    try:
        # Retrieve stored grouping results from Firestore
        db_firestore = firestore.client()
        groups_ref = db_firestore.collection("users").document(user_id).collection("trade_groups")
        
        # Get latest groups (ordered by created_at)
        query = groups_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
        docs = query.stream()
        
        recent_groups = []
        for doc in docs:
            group_data = doc.to_dict()
            recent_groups.append(group_data)
        
        # Get count of all groups for this user
        # Note: In a production app, we might store the count separately for efficiency
        # but for this scale, we can just return the current session count or a fixed number
        # for UX purposes or use a count() aggregation if needed.
        
        return {
            'user_id': user_id,
            'returned_groups': len(recent_groups),
            'groups': recent_groups,
            'last_updated': datetime.now().isoformat() if recent_groups else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user groups: {str(e)}")

@router.post("/analyze-groups", response_model=GroupAnalysisResponse)
async def analyze_groups(request: GroupAnalysisRequest):
    """Perform detailed analysis on specific trade groups"""
    try:
        if not request.group_ids:
            raise HTTPException(status_code=400, detail="No group IDs provided")
        
        # Retrieve groups from storage
        groups_data = await _get_groups_by_ids(request.user_id, request.group_ids)
        
        if not groups_data:
            raise HTTPException(status_code=404, detail="No groups found for the provided IDs")
        
        # Perform analysis based on type
        if request.analysis_type == "basic":
            analyses = _perform_basic_analysis(groups_data)
        elif request.analysis_type == "comprehensive":
            analyses = _perform_comprehensive_analysis(groups_data)
        elif request.analysis_type == "comparative":
            analyses = _perform_comparative_analysis(groups_data)
        else:
            raise HTTPException(status_code=400, detail="Invalid analysis type")
        
        # Generate insights and recommendations
        insights = _generate_insights(groups_data, analyses)
        recommendations = _generate_recommendations(groups_data, analyses)
        
        # Comparative metrics for multiple groups
        comparative_metrics = None
        if len(groups_data) > 1:
            comparative_metrics = _calculate_comparative_metrics(groups_data)
        
        return GroupAnalysisResponse(
            group_analyses=analyses,
            comparative_metrics=comparative_metrics,
            insights=insights,
            recommendations=recommendations
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Group analysis failed: {str(e)}")

@router.get("/strategies")
async def get_available_strategies():
    """Get available grouping strategies and their descriptions"""
    strategies = {
        "symbol": {
            "name": "Symbol Grouping",
            "description": "Group trades by trading symbol within time windows",
            "best_for": "Analyzing performance per instrument"
        },
        "session": {
            "name": "Session Grouping",
            "description": "Group trades by trading sessions based on time gaps",
            "best_for": "Analyzing daily trading performance"
        },
        "scaling": {
            "name": "Scaling Grouping",
            "description": "Group trades that represent scaling in/out of positions",
            "best_for": "Analyzing position management strategies"
        },
        "time_window": {
            "name": "Time Window Grouping",
            "description": "Group trades within specific time windows",
            "best_for": "Analyzing burst trading activity"
        },
        "strategy_pattern": {
            "name": "Strategy Pattern Grouping",
            "description": "Group trades by detected strategy patterns",
            "best_for": "Advanced pattern recognition (coming soon)"
        }
    }
    
    return {
        "available_strategies": strategies,
        "recommended_combinations": [
            ["symbol", "session"],
            ["session", "scaling"],
            ["symbol", "time_window", "scaling"]
        ],
        "default_strategy": ["symbol", "session", "scaling"]
    }

@router.get("/health")
async def grouping_health_check():
    """Health check for trade grouping service"""
    try:
        # Test basic functionality
        test_trades = pd.DataFrame({
            'symbol': ['AAPL', 'AAPL'],
            'entry_time': [datetime.now(), datetime.now()],
            'exit_time': [datetime.now(), datetime.now()],
            'quantity': [100, -100],
            'pnl': [50, -25]
        })
        
        result = grouping_engine.group_trades(test_trades)
        
        return {
            "status": "healthy",
            "engine_status": "operational",
            "test_result": {
                "groups_created": len(result.groups),
                "strategies_available": len(GroupingStrategy),
                "test_passed": True
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Helper functions
async def _store_grouping_results(user_id: str, result: GroupingResult):
    """Store grouping results for later retrieval"""
    try:
        db_firestore = firestore.client()
        batch = db_firestore.batch()
        
        # Convert and store each group
        for group in result.groups:
            group_doc_ref = db_firestore.collection("users").document(user_id).collection("trade_groups").document(group.group_id)
            
            group_data = {
                'group_id': group.group_id,
                'group_type': group.group_type,
                'grouping_strategy': group.grouping_strategy.value,
                'trades': group.trades,
                'metadata': group.metadata,
                'metrics': {
                    'total_trades': group.total_trades,
                    'total_pnl': group.total_pnl,
                    'win_rate': group.win_rate,
                    'total_volume': group.total_volume,
                    'risk_reward_ratio': group.risk_reward_ratio,
                    'confidence_score': group.confidence_score,
                    'start_time': group.start_time.isoformat() if group.start_time else None,
                    'end_time': group.end_time.isoformat() if group.end_time else None,
                    'trading_style': group.trading_style.value if group.trading_style else None,
                    'market_type': group.market_type.value if group.market_type else None
                },
                'created_at': datetime.now().isoformat()
            }
            batch.set(group_doc_ref, group_data)
        
        # Commit the batch
        batch.commit()
        
    except Exception as e:
        pass

async def _get_groups_by_ids(user_id: str, group_ids: List[str]) -> List[Dict[str, Any]]:
    """Retrieve specific groups by their IDs"""
    if not user_id:
        return []
    
    try:
        db_firestore = firestore.client()
        groups_ref = db_firestore.collection("users").document(user_id).collection("trade_groups")
        
        # Firestore "in" query matches against doc ID
        # Note: Limit is 30 IDs per query
        found_groups = []
        
        # Split group_ids into chunks of 30
        for i in range(0, len(group_ids), 30):
            chunk = group_ids[i:i + 30]
            query = groups_ref.where(firestore.FieldPath.document_id(), "in", chunk)
            docs = query.stream()
            for doc in docs:
                found_groups.append(doc.to_dict())
        
        return found_groups
        
    except Exception:
        return []

def _perform_basic_analysis(groups_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Perform basic analysis on groups"""
    analyses = []
    
    for group in groups_data:
        metrics = group['metrics']
        analysis = {
            'group_id': group['group_id'],
            'analysis_type': 'basic',
            'performance_grade': _calculate_performance_grade(metrics),
            'key_metrics': {
                'profitability': 'Profitable' if metrics['total_pnl'] > 0 else 'Unprofitable',
                'consistency': 'High' if metrics['win_rate'] > 0.6 else 'Medium' if metrics['win_rate'] > 0.4 else 'Low',
                'trade_count': metrics['total_trades'],
                'confidence': metrics['confidence_score']
            }
        }
        analyses.append(analysis)
    
    return analyses

def _perform_comprehensive_analysis(groups_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Perform comprehensive analysis on groups"""
    analyses = []
    
    for group in groups_data:
        basic_analysis = _perform_basic_analysis([group])[0]
        
        # Add comprehensive metrics
        trades_df = pd.DataFrame(group['trades'])
        
        comprehensive_metrics = {
            'risk_metrics': _calculate_risk_metrics(trades_df),
            'timing_analysis': _analyze_timing_patterns(trades_df),
            'position_analysis': _analyze_position_patterns(trades_df),
            'market_conditions': _analyze_market_conditions(trades_df)
        }
        
        analysis = {
            **basic_analysis,
            'analysis_type': 'comprehensive',
            'detailed_metrics': comprehensive_metrics
        }
        
        analyses.append(analysis)
    
    return analyses

def _perform_comparative_analysis(groups_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Perform comparative analysis between groups"""
    comprehensive_analyses = _perform_comprehensive_analysis(groups_data)
    
    # Add comparative rankings
    pnl_ranking = sorted(enumerate(groups_data), key=lambda x: x[1]['metrics']['total_pnl'], reverse=True)
    winrate_ranking = sorted(enumerate(groups_data), key=lambda x: x[1]['metrics']['win_rate'], reverse=True)
    
    for i, analysis in enumerate(comprehensive_analyses):
        analysis['analysis_type'] = 'comparative'
        analysis['rankings'] = {
            'pnl_rank': next(rank for rank, (idx, _) in enumerate(pnl_ranking, 1) if idx == i),
            'winrate_rank': next(rank for rank, (idx, _) in enumerate(winrate_ranking, 1) if idx == i),
            'total_groups': len(groups_data)
        }
    
    return comprehensive_analyses

def _calculate_performance_grade(metrics: Dict[str, Any]) -> str:
    """Calculate a performance grade for a group"""
    score = 0
    
    # Profitability (40%)
    if metrics['total_pnl'] > 0:
        score += 40
    
    # Win rate (30%)
    score += metrics['win_rate'] * 30
    
    # Risk-reward (20%)
    if metrics['risk_reward_ratio'] > 1.5:
        score += 20
    elif metrics['risk_reward_ratio'] > 1.0:
        score += 15
    elif metrics['risk_reward_ratio'] > 0.5:
        score += 10
    
    # Confidence (10%)
    score += metrics['confidence_score'] * 10
    
    if score >= 90:
        return "A+"
    elif score >= 80:
        return "A"
    elif score >= 70:
        return "B"
    elif score >= 60:
        return "C"
    else:
        return "D"

def _calculate_risk_metrics(trades_df: pd.DataFrame) -> Dict[str, Any]:
    """Calculate risk metrics for trades"""
    if trades_df.empty:
        return {}
    
    pnl_series = trades_df['pnl']
    
    return {
        'max_drawdown': pnl_series.cumsum().expanding().max().sub(pnl_series.cumsum()).max(),
        'volatility': pnl_series.std(),
        'sharpe_ratio': pnl_series.mean() / pnl_series.std() if pnl_series.std() > 0 else 0,
        'max_loss': pnl_series.min(),
        'max_win': pnl_series.max()
    }

def _analyze_timing_patterns(trades_df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze timing patterns in trades"""
    if trades_df.empty or 'entry_time' not in trades_df.columns:
        return {}
    
    trades_df['entry_time'] = pd.to_datetime(trades_df['entry_time'])
    trades_df['hour'] = trades_df['entry_time'].dt.hour
    trades_df['day_of_week'] = trades_df['entry_time'].dt.dayofweek
    
    return {
        'most_active_hour': trades_df['hour'].mode().iloc[0] if not trades_df['hour'].mode().empty else None,
        'most_active_day': trades_df['day_of_week'].mode().iloc[0] if not trades_df['day_of_week'].mode().empty else None,
        'trading_hours_range': [trades_df['hour'].min(), trades_df['hour'].max()],
        'avg_trades_per_session': len(trades_df) / trades_df['entry_time'].dt.date.nunique()
    }

def _analyze_position_patterns(trades_df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze position sizing and direction patterns"""
    if trades_df.empty:
        return {}
    
    return {
        'long_short_ratio': len(trades_df[trades_df['quantity'] > 0]) / len(trades_df[trades_df['quantity'] < 0]) if len(trades_df[trades_df['quantity'] < 0]) > 0 else float('inf'),
        'avg_position_size': trades_df['quantity'].abs().mean(),
        'position_size_consistency': trades_df['quantity'].abs().std() / trades_df['quantity'].abs().mean() if trades_df['quantity'].abs().mean() > 0 else 0,
        'largest_position': trades_df['quantity'].abs().max()
    }

def _analyze_market_conditions(trades_df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze market conditions during trading"""
    if trades_df.empty:
        return {}
    
    symbols = trades_df['symbol'].unique() if 'symbol' in trades_df.columns else []
    
    return {
        'symbols_traded': len(symbols),
        'primary_symbol': symbols[0] if len(symbols) > 0 else None,
        'multi_symbol_trading': len(symbols) > 1,
        'symbol_diversity': len(symbols) / len(trades_df) if len(trades_df) > 0 else 0
    }

def _calculate_comparative_metrics(groups_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate comparative metrics across multiple groups"""
    if len(groups_data) < 2:
        return {}
    
    metrics = [group['metrics'] for group in groups_data]
    
    return {
        'performance_spread': {
            'pnl_range': max(m['total_pnl'] for m in metrics) - min(m['total_pnl'] for m in metrics),
            'winrate_range': max(m['win_rate'] for m in metrics) - min(m['win_rate'] for m in metrics),
            'confidence_range': max(m['confidence_score'] for m in metrics) - min(m['confidence_score'] for m in metrics)
        },
        'consistency_metrics': {
            'pnl_std': pd.Series([m['total_pnl'] for m in metrics]).std(),
            'winrate_std': pd.Series([m['win_rate'] for m in metrics]).std(),
            'avg_group_performance': sum(m['total_pnl'] for m in metrics) / len(metrics)
        },
        'best_performing_group': max(groups_data, key=lambda x: x['metrics']['total_pnl'])['group_id'],
        'most_consistent_group': min(groups_data, key=lambda x: abs(x['metrics']['win_rate'] - 0.5))['group_id']
    }

def _generate_insights(groups_data: List[Dict[str, Any]], analyses: List[Dict[str, Any]]) -> List[str]:
    """Generate actionable insights from group analysis"""
    insights = []
    
    if not groups_data:
        return insights
    
    # Performance insights
    profitable_groups = sum(1 for group in groups_data if group['metrics']['total_pnl'] > 0)
    total_groups = len(groups_data)
    
    if profitable_groups / total_groups > 0.7:
        insights.append(f"Strong overall performance: {profitable_groups}/{total_groups} groups are profitable")
    elif profitable_groups / total_groups < 0.3:
        insights.append(f"Performance concern: Only {profitable_groups}/{total_groups} groups are profitable")
    
    # Win rate insights
    avg_winrate = sum(group['metrics']['win_rate'] for group in groups_data) / len(groups_data)
    if avg_winrate > 0.6:
        insights.append(f"High consistency: Average win rate of {avg_winrate:.1%} across groups")
    elif avg_winrate < 0.4:
        insights.append(f"Consistency issue: Low average win rate of {avg_winrate:.1%}")
    
    # Trading style insights
    styles = [group['metrics'].get('trading_style') for group in groups_data if group['metrics'].get('trading_style')]
    if styles:
        most_common_style = max(set(styles), key=styles.count)
        insights.append(f"Dominant trading style: {most_common_style}")
    
    return insights

def _generate_recommendations(groups_data: List[Dict[str, Any]], analyses: List[Dict[str, Any]]) -> List[str]:
    """Generate actionable recommendations based on analysis"""
    recommendations = []
    
    if not groups_data:
        return recommendations
    
    # Performance-based recommendations
    poor_performers = [group for group in groups_data if group['metrics']['total_pnl'] < 0]
    if poor_performers:
        recommendations.append(f"Review and optimize {len(poor_performers)} underperforming trade groups")
    
    # Win rate recommendations
    low_winrate_groups = [group for group in groups_data if group['metrics']['win_rate'] < 0.4]
    if low_winrate_groups:
        recommendations.append(f"Focus on improving entry/exit timing for {len(low_winrate_groups)} groups with low win rates")
    
    # Risk management recommendations
    high_risk_groups = [group for group in groups_data if group['metrics']['risk_reward_ratio'] < 0.5]
    if high_risk_groups:
        recommendations.append(f"Improve risk management for {len(high_risk_groups)} groups with poor risk-reward ratios")
    
    # Volume recommendations
    total_trades = sum(group['metrics']['total_trades'] for group in groups_data)
    if total_trades > 100:
        recommendations.append("Consider reducing trade frequency and focusing on higher-quality setups")
    elif total_trades < 20:
        recommendations.append("Consider increasing trade frequency while maintaining quality standards")
    
    return recommendations
