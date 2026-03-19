"""Data Quality Assessment API for Manual Intervention System"""

import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import re
from enum import Enum

from app.auth import AuthorizedUser
from app.libs.trade_grouping_engine import TradeGroupingEngine
from app.libs.fifo_calculator import FifoCalculator

router = APIRouter(prefix="/data-quality")

class IssueType(str, Enum):
    MISSING_DATA = "missing_data"
    DATA_CONFLICT = "data_conflict"
    INVALID_FORMAT = "invalid_format"
    DUPLICATE_TRADES = "duplicate_trades"
    UNMATCHED_TRADES = "unmatched_trades"
    SYMBOL_MISMATCH = "symbol_mismatch"
    TIMESTAMP_ISSUES = "timestamp_issues"
    CALCULATION_MISMATCH = "calculation_mismatch"

class IssueSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class DataQualityIssue(BaseModel):
    issue_id: str
    issue_type: IssueType
    severity: IssueSeverity
    title: str
    description: str
    affected_trades: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    auto_resolvable: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str

class TradeConflict(BaseModel):
    trade_id: str
    field_name: str
    broker_value: Any
    parsed_value: Any
    confidence_level: float  # 0-1, confidence in parsed value
    suggested_value: Any
    reasoning: str

class DataQualityAssessment(BaseModel):
    total_trades: int
    quality_score: float  # 0-100
    issues: List[DataQualityIssue]
    conflicts: List[TradeConflict]
    unmatched_trades: List[Dict[str, Any]]
    summary_stats: Dict[str, Any]
    recommendations: List[str]
    assessment_timestamp: str

class TradeEditRequest(BaseModel):
    trade_id: str
    field_updates: Dict[str, Any]
    reason: str
    user_notes: Optional[str] = None

class BulkEditRequest(BaseModel):
    trade_ids: List[str]
    field_updates: Dict[str, Any]
    reason: str
    user_notes: Optional[str] = None

class ManualTradeEntry(BaseModel):
    symbol: str
    trade_type: str  # "buy" or "sell"
    quantity: float
    open_price: float
    close_price: float
    open_time: str
    close_time: str
    commission: Optional[float] = 0.0
    swap: Optional[float] = 0.0
    comment: Optional[str] = None
    account_id: Optional[str] = None

class AuditLogEntry(BaseModel):
    action_id: str
    action_type: str  # "edit", "delete", "add", "merge", "split"
    user_id: str
    affected_trades: List[str]
    changes_made: Dict[str, Any]
    timestamp: str
    reason: str
    user_notes: Optional[str] = None

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

class DataQualityAnalyzer:
    """Core data quality analysis engine"""
    
    def __init__(self):
        self.grouping_engine = TradeGroupingEngine()
        self.fifo_calculator = FifoCalculator()
    
    def assess_data_quality(self, trades: List[Dict[str, Any]]) -> DataQualityAssessment:
        """Perform comprehensive data quality assessment"""
        
        if not trades:
            return DataQualityAssessment(
                total_trades=0,
                quality_score=0.0,
                issues=[],
                conflicts=[],
                unmatched_trades=[],
                summary_stats={},
                recommendations=["Import trade data to begin quality assessment"],
                assessment_timestamp=datetime.now().isoformat()
            )
        
        trades_df = pd.DataFrame(trades)
        issues = []
        conflicts = []
        unmatched_trades = []
        
        # 1. Check for missing data
        missing_data_issues = self._check_missing_data(trades_df)
        issues.extend(missing_data_issues)
        
        # 2. Check for data conflicts
        conflict_issues, trade_conflicts = self._check_data_conflicts(trades_df)
        issues.extend(conflict_issues)
        conflicts.extend(trade_conflicts)
        
        # 3. Check for duplicates
        duplicate_issues = self._check_duplicates(trades_df)
        issues.extend(duplicate_issues)
        
        # 4. Check timestamp consistency
        timestamp_issues = self._check_timestamp_issues(trades_df)
        issues.extend(timestamp_issues)
        
        # 5. Check for calculation mismatches
        calc_issues = self._check_calculation_mismatches(trades_df)
        issues.extend(calc_issues)
        
        # 6. Identify unmatched trades (those that don't group well)
        unmatched_trades = self._identify_unmatched_trades(trades_df)
        
        # Calculate overall quality score
        quality_score = self._calculate_quality_score(len(trades), issues)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(issues, quality_score)
        
        # Summary statistics
        summary_stats = self._calculate_summary_stats(trades_df, issues)
        
        return DataQualityAssessment(
            total_trades=len(trades),
            quality_score=quality_score,
            issues=issues,
            conflicts=conflicts,
            unmatched_trades=unmatched_trades,
            summary_stats=summary_stats,
            recommendations=recommendations,
            assessment_timestamp=datetime.now().isoformat()
        )
    
    def _check_missing_data(self, trades_df: pd.DataFrame) -> List[DataQualityIssue]:
        """Check for missing essential data"""
        issues = []
        required_fields = ['symbol', 'quantity', 'open_price', 'close_price', 'open_time', 'close_time']
        
        for field in required_fields:
            if field not in trades_df.columns:
                issues.append(DataQualityIssue(
                    issue_id=f"missing_column_{field}",
                    issue_type=IssueType.MISSING_DATA,
                    severity=IssueSeverity.CRITICAL,
                    title=f"Missing Required Column: {field}",
                    description=f"The {field} column is missing from trade data",
                    suggested_actions=[f"Add {field} column to data source", "Map existing column to {field}"],
                    auto_resolvable=False,
                    created_at=datetime.now().isoformat()
                ))
            else:
                # Check for null values
                null_count = trades_df[field].isnull().sum()
                if null_count > 0:
                    severity = IssueSeverity.HIGH if null_count > len(trades_df) * 0.1 else IssueSeverity.MEDIUM
                    affected_trades = trades_df[trades_df[field].isnull()].get('trade_id', trades_df.index).tolist()
                    
                    issues.append(DataQualityIssue(
                        issue_id=f"null_values_{field}",
                        issue_type=IssueType.MISSING_DATA,
                        severity=severity,
                        title=f"Missing Values in {field}",
                        description=f"{null_count} trades have missing {field} values",
                        affected_trades=[str(t) for t in affected_trades],
                        suggested_actions=["Fill missing values manually", "Use interpolation", "Remove incomplete trades"],
                        auto_resolvable=False,
                        metadata={'null_count': null_count, 'total_trades': len(trades_df)},
                        created_at=datetime.now().isoformat()
                    ))
        
        return issues
    
    def _check_data_conflicts(self, trades_df: pd.DataFrame) -> tuple[List[DataQualityIssue], List[TradeConflict]]:
        """Check for conflicts between broker and parsed data"""
        issues = []
        conflicts = []
        
        # Look for trades with both broker_pnl and calculated_pnl
        if 'broker_pnl' in trades_df.columns and 'pnl' in trades_df.columns:
            for idx, trade in trades_df.iterrows():
                broker_pnl = trade.get('broker_pnl')
                parsed_pnl = trade.get('pnl')
                
                if pd.notna(broker_pnl) and pd.notna(parsed_pnl):
                    difference = abs(broker_pnl - parsed_pnl)
                    if difference > 0.01:  # More than 1 cent difference
                        conflicts.append(TradeConflict(
                            trade_id=str(trade.get('trade_id', idx)),
                            field_name='pnl',
                            broker_value=broker_pnl,
                            parsed_value=parsed_pnl,
                            confidence_level=0.8,  # Higher confidence in broker data
                            suggested_value=broker_pnl,
                            reasoning="Broker P&L typically includes all costs and is more accurate"
                        ))
            
            if conflicts:
                issues.append(DataQualityIssue(
                    issue_id="pnl_conflicts",
                    issue_type=IssueType.DATA_CONFLICT,
                    severity=IssueSeverity.MEDIUM,
                    title="P&L Calculation Conflicts",
                    description=f"{len(conflicts)} trades have conflicting P&L values between broker and parsed data",
                    affected_trades=[c.trade_id for c in conflicts],
                    suggested_actions=["Use broker P&L values", "Recalculate P&L", "Review calculation method"],
                    auto_resolvable=True,
                    metadata={'conflict_count': len(conflicts)},
                    created_at=datetime.now().isoformat()
                ))
        
        return issues, conflicts
    
    def _check_duplicates(self, trades_df: pd.DataFrame) -> List[DataQualityIssue]:
        """Check for duplicate trades"""
        issues = []
        
        # Check for exact duplicates
        duplicate_cols = ['symbol', 'open_time', 'close_time', 'quantity', 'open_price', 'close_price']
        available_cols = [col for col in duplicate_cols if col in trades_df.columns]
        
        if len(available_cols) >= 4:  # Need at least 4 columns to detect duplicates
            duplicates = trades_df.duplicated(subset=available_cols, keep=False)
            duplicate_count = duplicates.sum()
            
            if duplicate_count > 0:
                duplicate_trades = trades_df[duplicates].get('trade_id', trades_df[duplicates].index).tolist()
                
                issues.append(DataQualityIssue(
                    issue_id="duplicate_trades",
                    issue_type=IssueType.DUPLICATE_TRADES,
                    severity=IssueSeverity.MEDIUM,
                    title="Duplicate Trades Detected",
                    description=f"{duplicate_count} potential duplicate trades found",
                    affected_trades=[str(t) for t in duplicate_trades],
                    suggested_actions=["Review and remove duplicates", "Mark as separate positions", "Verify trade data"],
                    auto_resolvable=False,
                    metadata={'duplicate_count': duplicate_count},
                    created_at=datetime.now().isoformat()
                ))
        
        return issues
    
    def _check_timestamp_issues(self, trades_df: pd.DataFrame) -> List[DataQualityIssue]:
        """Check for timestamp-related issues"""
        issues = []
        
        if 'open_time' in trades_df.columns and 'close_time' in trades_df.columns:
            try:
                open_times = pd.to_datetime(trades_df['open_time'])
                close_times = pd.to_datetime(trades_df['close_time'])
                
                # Check for trades where close time is before open time
                invalid_times = close_times < open_times
                invalid_count = invalid_times.sum()
                
                if invalid_count > 0:
                    invalid_trades = trades_df[invalid_times].get('trade_id', trades_df[invalid_times].index).tolist()
                    
                    issues.append(DataQualityIssue(
                        issue_id="invalid_timestamps",
                        issue_type=IssueType.TIMESTAMP_ISSUES,
                        severity=IssueSeverity.HIGH,
                        title="Invalid Trade Timestamps",
                        description=f"{invalid_count} trades have close time before open time",
                        affected_trades=[str(t) for t in invalid_trades],
                        suggested_actions=["Swap open and close times", "Verify timestamp format", "Check timezone settings"],
                        auto_resolvable=True,
                        metadata={'invalid_count': invalid_count},
                        created_at=datetime.now().isoformat()
                    ))
            except Exception:
                issues.append(DataQualityIssue(
                    issue_id="timestamp_format_error",
                    issue_type=IssueType.INVALID_FORMAT,
                    severity=IssueSeverity.HIGH,
                    title="Timestamp Format Issues",
                    description="Unable to parse trade timestamps",
                    suggested_actions=["Standardize timestamp format", "Check date format", "Verify timezone"],
                    auto_resolvable=False,
                    created_at=datetime.now().isoformat()
                ))
        
        return issues
    
    def _check_calculation_mismatches(self, trades_df: pd.DataFrame) -> List[DataQualityIssue]:
        """Check for calculation-related issues"""
        issues = []
        
        # Check for unreasonable P&L values
        if 'pnl' in trades_df.columns:
            pnl_values = trades_df['pnl'].dropna()
            if len(pnl_values) > 0:
                # Check for extremely large P&L values (potential data errors)
                mean_pnl = abs(pnl_values.mean())
                std_pnl = pnl_values.std()
                threshold = mean_pnl + (5 * std_pnl)  # 5 standard deviations
                
                outliers = abs(pnl_values) > threshold
                outlier_count = outliers.sum()
                
                if outlier_count > 0:
                    outlier_trades = trades_df[outliers].get('trade_id', trades_df[outliers].index).tolist()
                    
                    issues.append(DataQualityIssue(
                        issue_id="pnl_outliers",
                        issue_type=IssueType.CALCULATION_MISMATCH,
                        severity=IssueSeverity.MEDIUM,
                        title="Unusual P&L Values",
                        description=f"{outlier_count} trades have unusually large P&L values",
                        affected_trades=[str(t) for t in outlier_trades],
                        suggested_actions=["Verify trade size", "Check calculation method", "Review for data entry errors"],
                        auto_resolvable=False,
                        metadata={'outlier_count': outlier_count, 'threshold': threshold},
                        created_at=datetime.now().isoformat()
                    ))
        
        return issues
    
    def _identify_unmatched_trades(self, trades_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Identify trades that don't group well with others"""
        try:
            # Use grouping engine to identify ungrouped trades
            from app.libs.strategy_definitions import get_default_strategies
            strategies = get_default_strategies()
            
            grouping_result = self.grouping_engine.group_trades(trades_df, strategies)
            return grouping_result.ungrouped_trades
        except Exception as e:
            pass
            return []
    
    def _calculate_quality_score(self, total_trades: int, issues: List[DataQualityIssue]) -> float:
        """Calculate overall data quality score (0-100)"""
        if total_trades == 0:
            return 0.0
        
        # Weight issues by severity
        severity_weights = {
            IssueSeverity.LOW: 1,
            IssueSeverity.MEDIUM: 3,
            IssueSeverity.HIGH: 7,
            IssueSeverity.CRITICAL: 15
        }
        
        total_penalty = sum(severity_weights.get(issue.severity, 1) for issue in issues)
        
        # Base score of 100, subtract penalties
        base_score = 100
        penalty_per_trade = total_penalty / total_trades
        
        # Cap penalty at 90 (minimum score of 10)
        final_score = max(10, base_score - (penalty_per_trade * 10))
        return round(final_score, 1)
    
    def _generate_recommendations(self, issues: List[DataQualityIssue], quality_score: float) -> List[str]:
        """Generate actionable recommendations based on issues found"""
        recommendations = []
        
        if quality_score >= 90:
            recommendations.append("Excellent data quality! Your trades are well-structured and complete.")
        elif quality_score >= 70:
            recommendations.append("Good data quality with minor issues that can be easily resolved.")
        elif quality_score >= 50:
            recommendations.append("Moderate data quality. Address missing data and conflicts for better insights.")
        else:
            recommendations.append("Poor data quality detected. Immediate intervention required for reliable analytics.")
        
        # Specific recommendations based on issue types
        issue_types = [issue.issue_type for issue in issues]
        
        if IssueType.MISSING_DATA in issue_types:
            recommendations.append("Fill missing essential fields like symbol, prices, and timestamps.")
        
        if IssueType.DATA_CONFLICT in issue_types:
            recommendations.append("Resolve P&L conflicts by choosing broker values or recalculating.")
        
        if IssueType.DUPLICATE_TRADES in issue_types:
            recommendations.append("Review and remove duplicate trades to avoid skewed analytics.")
        
        if IssueType.TIMESTAMP_ISSUES in issue_types:
            recommendations.append("Fix timestamp issues to ensure accurate time-based analysis.")
        
        # Always add general recommendation
        recommendations.append("Use the manual intervention tools below to resolve identified issues.")
        
        return recommendations
    
    def _calculate_summary_stats(self, trades_df: pd.DataFrame, issues: List[DataQualityIssue]) -> Dict[str, Any]:
        """Calculate summary statistics for the assessment"""
        stats = {
            'total_trades': len(trades_df),
            'complete_trades': 0,
            'missing_data_trades': 0,
            'conflicted_trades': 0,
            'total_issues': len(issues)
        }
        
        # Count issue types
        issue_counts = {}
        for issue in issues:
            issue_type = issue.issue_type.value
            issue_counts[issue_type] = issue_counts.get(issue_type, 0) + 1
            
            # Count affected trades
            if issue.issue_type == IssueType.MISSING_DATA:
                stats['missing_data_trades'] += len(issue.affected_trades)
            elif issue.issue_type == IssueType.DATA_CONFLICT:
                stats['conflicted_trades'] += len(issue.affected_trades)
        
        # Calculate completeness
        required_fields = ['symbol', 'quantity', 'open_price', 'close_price', 'open_time', 'close_time']
        available_fields = [col for col in required_fields if col in trades_df.columns]
        
        if available_fields:
            complete_rows = trades_df[available_fields].notna().all(axis=1).sum()
            stats['complete_trades'] = complete_rows
        
        stats['issue_breakdown'] = issue_counts
        stats['completeness_percentage'] = (stats['complete_trades'] / max(stats['total_trades'], 1)) * 100
        
        return stats

# Global analyzer instance
analyzer = DataQualityAnalyzer()

@router.post("/assess", response_model=DataQualityAssessment)
async def assess_data_quality(user: AuthorizedUser):
    """Assess data quality for user's trades"""
    try:
        # Get user's trades from all evaluations
        from firebase_admin import firestore
        db_firestore = firestore.client()
        
        user_id = user.sub
        all_trades = []
        
        # Fetch trades from all evaluations
        evaluations_ref = db_firestore.collection(f"users/{user_id}/evaluations")
        evaluations = evaluations_ref.stream()
        
        for evaluation_doc in evaluations:
            evaluation_id = evaluation_doc.id
            trades_ref = db_firestore.collection(f"users/{user_id}/evaluations/{evaluation_id}/trades")
            trades_docs = trades_ref.stream()
            
            for trade_doc in trades_docs:
                trade_data = trade_doc.to_dict()
                trade_data['trade_id'] = trade_doc.id
                trade_data['evaluation_id'] = evaluation_id
                all_trades.append(trade_data)
        
        # Perform assessment
        assessment = analyzer.assess_data_quality(all_trades)
        return assessment
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to assess data quality: {str(e)}")

@router.get("/issues/{issue_id}")
async def get_issue_details(issue_id: str, user: AuthorizedUser):
    """Get detailed information about a specific data quality issue"""
    try:
        # This would fetch issue details from storage
        # For now, return basic info
        return {
            "issue_id": issue_id,
            "details": f"Detailed information about issue {issue_id}",
            "resolution_steps": ["Step 1", "Step 2", "Step 3"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resolve-auto")
async def auto_resolve_issues(issue_ids: List[str], user: AuthorizedUser):
    """Automatically resolve resolvable issues"""
    try:
        resolved_count = 0
        failed_resolutions = []
        
        for issue_id in issue_ids:
            try:
                # Implement auto-resolution logic here
                # For now, just simulate resolution
                pass
                resolved_count += 1
            except Exception as e:
                failed_resolutions.append({"issue_id": issue_id, "error": str(e)})
        
        return {
            "resolved_count": resolved_count,
            "failed_resolutions": failed_resolutions,
            "message": f"Successfully auto-resolved {resolved_count} issues"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
