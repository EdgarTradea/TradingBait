"""
Trading Data Aggregator - Unified data collection from all sources

This module collects and structures all trader data required for the AI Trading Coach,
including journal entries, habits, trades, and calculated metrics.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from firebase_admin import firestore
from dataclasses import dataclass
import pandas as pd
from collections import defaultdict
import re

@dataclass
class TraderDataSummary:
    """Structured summary of all trader data"""
    # Meta information
    user_id: str
    data_collection_period: Tuple[datetime, datetime]  # (start, end)
    days_of_data: int
    
    # Raw data counts
    total_trades: int
    journal_entries_count: int
    habits_tracked: int
    
    # Performance summary
    total_pnl: float
    win_rate: float
    winning_trades: int
    losing_trades: int
    avg_trade_size: float
    
    # Behavioral data
    mood_entries: List[str]
    habit_completion_rate: float
    stop_loss_adherence: float
    
    # Correlation data
    correlations: List[Dict[str, Any]]
    
    # Raw data for detailed analysis
    trades: List[Dict[str, Any]]
    journal_entries: List[Dict[str, Any]]
    habit_data: Dict[str, List[bool]]

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

class TradingDataAggregator:
    """Aggregates all trading-related data for AI analysis"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.user_key = sanitize_storage_key(f"user_{user_id}")
    
    async def get_comprehensive_data(self, days_back: int = 90) -> TraderDataSummary:
        """Get comprehensive trader data for the specified period"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Collect all data sources
        trades = await self._get_trades_data(start_date, end_date)
        journal_entries = await self._get_journal_entries(start_date, end_date)
        habit_data = await self._get_habit_data(start_date, end_date)
        
        # Calculate performance metrics
        performance_summary = self._calculate_performance_summary(trades)
        
        # Extract behavioral data
        behavioral_data = self._extract_behavioral_data(journal_entries, habit_data)
        
        # Calculate correlations
        correlations = self._calculate_basic_correlations(trades, journal_entries, habit_data)
        
        return TraderDataSummary(
            user_id=self.user_id,
            data_collection_period=(start_date, end_date),
            days_of_data=(end_date - start_date).days,
            total_trades=len(trades),
            journal_entries_count=len(journal_entries),
            habits_tracked=len(habit_data.keys()) if habit_data else 0,
            **performance_summary,
            **behavioral_data,
            correlations=correlations,
            trades=trades,
            journal_entries=journal_entries,
            habit_data=habit_data
        )
    
    async def _get_trades_data(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get trades data from storage"""
        try:
            db_firestore = firestore.client()
            trades = []
            
            # Use timezone-aware logic safely
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=datetime.now().astimezone().tzinfo)
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=start_date.tzinfo)
                
            evaluations_ref = db_firestore.collection(f"users/{self.user_id}/evaluations").stream()
            for eval_doc in evaluations_ref:
                eval_id = eval_doc.id
                trades_ref = db_firestore.collection(f"users/{self.user_id}/evaluations/{eval_id}/trades").stream()
                for trade_doc in trades_ref:
                    trade_data = trade_doc.to_dict()
                    if 'closeTime' in trade_data:
                        close_time_str = trade_data['closeTime'].replace('Z', '+00:00')
                        close_time = datetime.fromisoformat(close_time_str)
                        if close_time.tzinfo is None:
                            close_time = close_time.replace(tzinfo=start_date.tzinfo)
                        if start_date <= close_time <= end_date:
                            trades.append(trade_data)
            return trades
            
        except Exception as e:
            pass
            return []
    
    async def _get_journal_entries(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get journal entries from storage"""
        try:
            db_firestore = firestore.client()
            entries_ref = db_firestore.collection(f"journal_entries/{self.user_id}/entries").stream()
            
            # Use timezone-aware logic safely
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=datetime.now().astimezone().tzinfo)
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=start_date.tzinfo)
                
            filtered_entries = []
            for entry_doc in entries_ref:
                entry = entry_doc.to_dict()
                if 'date' in entry:
                    entry_date = datetime.fromisoformat(entry['date'].replace('Z', '+00:00'))
                    if entry_date.tzinfo is None:
                        entry_date = entry_date.replace(tzinfo=start_date.tzinfo)
                    if start_date <= entry_date <= end_date:
                        filtered_entries.append(entry)
            
            return filtered_entries
            
        except Exception as e:
            pass
            return []
    
    async def _get_habit_data(self, start_date: datetime, end_date: datetime) -> Dict[str, List[bool]]:
        """Get habit completion data from journal entries"""
        try:
            journal_entries = await self._get_journal_entries(start_date, end_date)
            
            habit_data = defaultdict(list)
            
            for entry in journal_entries:
                if 'habits' in entry and isinstance(entry['habits'], dict):
                    for habit_name, completed in entry['habits'].items():
                        habit_data[habit_name].append(bool(completed))
            
            return dict(habit_data)
            
        except Exception as e:
            pass
            return {}
    
    def _calculate_performance_summary(self, trades: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate basic performance metrics"""
        if not trades:
            return {
                'total_pnl': 0.0,
                'win_rate': 0.0,
                'winning_trades': 0,
                'losing_trades': 0,
                'avg_trade_size': 0.0
            }
        
        total_pnl = 0.0
        winning_trades = 0
        losing_trades = 0
        total_volume = 0.0
        
        for trade in trades:
            pnl = float(trade.get('pnl', 0))
            total_pnl += pnl
            
            if pnl > 0:
                winning_trades += 1
            elif pnl < 0:
                losing_trades += 1
            
            volume = float(trade.get('volume', 0))
            total_volume += volume
        
        total_trades = len(trades)
        win_rate = winning_trades / total_trades if total_trades > 0 else 0.0
        avg_trade_size = total_volume / total_trades if total_trades > 0 else 0.0
        
        return {
            'total_pnl': round(total_pnl, 2),
            'win_rate': round(win_rate, 3),
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'avg_trade_size': round(avg_trade_size, 2)
        }
    
    def _extract_behavioral_data(self, journal_entries: List[Dict[str, Any]], habit_data: Dict[str, List[bool]]) -> Dict[str, Any]:
        """Extract behavioral data from journal entries and habits"""
        mood_entries = []
        stop_loss_count = 0
        total_trades_with_stops = 0
        
        # Extract mood data
        for entry in journal_entries:
            if 'mood' in entry and entry['mood']:
                mood_entries.append(entry['mood'])
        
        # Calculate habit completion rate
        all_completions = []
        for habit_name, completions in habit_data.items():
            all_completions.extend(completions)
        
        habit_completion_rate = sum(all_completions) / len(all_completions) if all_completions else 0.0
        
        # TODO: Calculate stop loss adherence from trade data
        # This would require analyzing actual trade data for stop loss usage
        stop_loss_adherence = 0.6  # Placeholder - should be calculated from actual trade data
        
        return {
            'mood_entries': mood_entries,
            'habit_completion_rate': round(habit_completion_rate, 3),
            'stop_loss_adherence': round(stop_loss_adherence, 3)
        }
    
    def _calculate_basic_correlations(self, trades: List[Dict[str, Any]], 
                                     journal_entries: List[Dict[str, Any]], 
                                     habit_data: Dict[str, List[bool]]) -> List[Dict[str, Any]]:
        """Calculate basic correlations between different data sources"""
        correlations = []
        
        # Group trades by date for correlation analysis
        daily_pnl = defaultdict(float)
        for trade in trades:
            if 'closeTime' in trade:
                trade_date = datetime.fromisoformat(trade['closeTime'].replace('Z', '+00:00')).date()
                daily_pnl[trade_date] += float(trade.get('pnl', 0))
        
        # Group journal entries by date
        daily_habits = defaultdict(dict)
        for entry in journal_entries:
            if 'date' in entry:
                entry_date = datetime.fromisoformat(entry['date'].replace('Z', '+00:00')).date()
                if 'habits' in entry:
                    daily_habits[entry_date] = entry['habits']
        
        # Calculate habit completion vs PnL correlation for each habit
        for habit_name, completions in habit_data.items():
            if len(completions) >= 3:  # Need minimum data points
                # This is a simplified correlation - should use proper statistical methods
                correlation_value = 0.0  # Placeholder
                
                correlations.append({
                    'variable_1': habit_name,
                    'variable_2': 'daily_pnl',
                    'correlation': correlation_value,
                    'sample_size': len(completions),
                    'significance': 'insufficient_data' if len(completions) < 10 else 'low'
                })
        
        return correlations

# Utility functions for data validation and formatting

def validate_trade_data(trade: Dict[str, Any]) -> bool:
    """Validate that trade data contains required fields"""
    required_fields = ['symbol', 'pnl', 'closeTime']
    return all(field in trade for field in required_fields)

def validate_journal_entry(entry: Dict[str, Any]) -> bool:
    """Validate that journal entry contains required fields"""
    required_fields = ['date']
    return all(field in entry for field in required_fields)

def format_data_for_ai_prompt(data_summary: TraderDataSummary) -> Dict[str, Any]:
    """Format aggregated data for AI prompt consumption"""
    return {
        'data_sufficiency': {
            'days_of_data': data_summary.days_of_data,
            'journal_entries': data_summary.journal_entries_count,
            'total_trades': data_summary.total_trades,
            'habits_tracked': data_summary.habits_tracked
        },
        'performance_summary': {
            'total_pnl': data_summary.total_pnl,
            'win_rate': data_summary.win_rate,
            'trade_count': data_summary.total_trades,
            'winning_trades': data_summary.winning_trades,
            'losing_trades': data_summary.losing_trades
        },
        'correlations': data_summary.correlations,
        'behavioral_data': {
            'mood_entries': data_summary.mood_entries,
            'habit_completion_rate': data_summary.habit_completion_rate,
            'stop_loss_adherence': data_summary.stop_loss_adherence
        }
    }
