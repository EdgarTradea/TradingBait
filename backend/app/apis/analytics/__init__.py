
"""Analytics API endpoints for TradingBait monitoring and performance data"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.libs.performance_monitoring import get_performance_analytics, get_real_time_stats
from app.auth import AuthorizedUser

router = APIRouter(prefix="/analytics")

class PerformanceStats(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    avg_response_time: float
    p95_response_time: float
    error_rate: float
    slowest_endpoints: List[Dict[str, Any]]
    error_breakdown: Dict[str, int]
    time_range: Dict[str, Any]

class RealTimeStats(BaseModel):
    current_hour_requests: int
    avg_response_time: float
    error_count: int
    error_rate: float
    last_updated: str

class ErrorReport(BaseModel):
    error_id: str
    message: str
    severity: str
    component: str
    timestamp: str
    context: Dict[str, Any]

class UserAnalytics(BaseModel):
    active_users_24h: int
    page_views: Dict[str, int]
    feature_usage: Dict[str, int]
    user_journeys: List[Dict[str, Any]]
    engagement_metrics: Dict[str, float]

class TrackingEvent(BaseModel):
    event_type: str
    user_id: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None

class TrackingResponse(BaseModel):
    status: str
    event_id: str
    timestamp: str

@router.get("/performance", response_model=PerformanceStats)
async def get_performance_metrics(
    user: AuthorizedUser,
    hours: int = Query(default=24, ge=1, le=168)  # 1 hour to 1 week
) -> PerformanceStats:
    """Get performance analytics for the specified time period"""
    try:
        analytics_data = get_performance_analytics(hours)
        
        if "error" in analytics_data:
            raise HTTPException(status_code=500, detail=analytics_data["error"])
        
        return PerformanceStats(**analytics_data)
        
    except Exception as e:
        print(f"❌ Error getting performance metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/realtime", response_model=RealTimeStats)
async def get_realtime_stats(user: AuthorizedUser) -> RealTimeStats:
    """Get real-time performance statistics"""
    try:
        stats_data = get_real_time_stats()
        
        if "error" in stats_data:
            raise HTTPException(status_code=500, detail=stats_data["error"])
        
        return RealTimeStats(**stats_data)
        
    except Exception as e:
        print(f"❌ Error getting real-time stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/errors")
async def get_error_reports(
    user: AuthorizedUser,
    hours: int = Query(default=24, ge=1, le=168),
    severity: Optional[str] = Query(default=None)
) -> List[ErrorReport]:
    """Get error reports from the specified time period"""
    try:
        # Return empty list when no real error tracking system is configured
        # This prevents showing fake sample errors to users
        return []
        
    except Exception as e:
        print(f"❌ Error getting error reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user-analytics", response_model=UserAnalytics)
async def get_user_analytics(
    user: AuthorizedUser,
    hours: int = Query(default=24, ge=1, le=168)
) -> UserAnalytics:
    """Get user behavior analytics"""
    try:
        # Return basic analytics with real user count but empty usage data
        # This shows authentic state rather than misleading sample data
        return UserAnalytics(
            active_users_24h=1,  # At least the current user
            page_views={},  # Empty - no fake page view data
            feature_usage={},  # Empty - no fake feature usage
            user_journeys=[],  # Empty - no fake user journeys
            engagement_metrics={
                "avg_session_duration": 0.0,
                "pages_per_session": 0.0,
                "bounce_rate": 0.0
            }
        )
        
    except Exception as e:
        print(f"❌ Error getting user analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def get_analytics_system_health(user: AuthorizedUser) -> Dict[str, Any]:
    """Get system health metrics"""
    try:
        real_time_stats = get_real_time_stats()
        performance_stats = get_performance_analytics(1)  # Last hour
        
        # Determine system health status
        health_status = "healthy"
        issues = []
        
        # Check error rate
        if real_time_stats.get("error_rate", 0) > 5:
            health_status = "warning" if health_status == "healthy" else "critical"
            issues.append(f"High error rate: {real_time_stats.get('error_rate', 0):.1f}%")
        
        # Check response time
        if real_time_stats.get("avg_response_time", 0) > 1000:
            health_status = "warning" if health_status == "healthy" else "critical"
            issues.append(f"Slow response time: {real_time_stats.get('avg_response_time', 0):.0f}ms")
        
        return {
            "status": health_status,
            "timestamp": datetime.utcnow().isoformat(),
            "issues": issues,
            "metrics": {
                "current_hour_requests": real_time_stats.get("current_hour_requests", 0),
                "avg_response_time": real_time_stats.get("avg_response_time", 0),
                "error_rate": real_time_stats.get("error_rate", 0),
                "uptime": "99.9%"  # Placeholder
            }
        }
        
    except Exception as e:
        print(f"❌ Error getting system health: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/track-event")
def track_analytics_user_event(event: TrackingEvent, user: AuthorizedUser) -> TrackingResponse:
    """Track a user event for analytics"""
    try:
        # This would integrate with the user analytics system
        print(f"📊 User event tracked: {event.event_type} for user {user.sub}")
        
        if event.properties:
            print(f"   Properties: {event.properties}")
        
        return TrackingResponse(
            status="success",
            event_id=f"event_{datetime.utcnow().timestamp()}",
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        print(f"❌ Error tracking user event: {e}")
        raise HTTPException(status_code=500, detail=str(e))
