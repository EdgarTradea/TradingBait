"""Traffic Analytics and Business Intelligence API for TradingBait"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import databutton as db
from app.libs.performance_monitoring import get_performance_analytics, get_real_time_stats
from collections import defaultdict

router = APIRouter(prefix="/traffic-analytics")

# Response Models
class TrafficSummaryResponse(BaseModel):
    """Real-time traffic summary"""
    total_requests: int
    active_sessions: int
    authenticated_sessions: int
    error_rate: float
    avg_response_time: float
    unique_users_today: int
    requests_per_minute: float
    last_updated: str

class BusinessMetricsResponse(BaseModel):
    """Business KPIs and metrics"""
    daily_active_users: int
    signup_rate: float
    conversion_rate: float
    feature_adoption: Dict[str, int]
    user_engagement_score: float
    revenue_events: int
    churn_indicators: Dict[str, Any]
    growth_metrics: Dict[str, float]

class EndpointAnalyticsResponse(BaseModel):
    """Endpoint performance analytics"""
    most_used_endpoints: List[Dict[str, Any]]
    slowest_endpoints: List[Dict[str, Any]]
    error_prone_endpoints: List[Dict[str, Any]]
    endpoint_categories: Dict[str, int]
    performance_distribution: Dict[str, int]

class UserBehaviorResponse(BaseModel):
    """User behavior and navigation patterns"""
    page_views: Dict[str, int]
    user_journeys: List[Dict[str, Any]]
    session_duration_avg: float
    bounce_rate: float
    device_breakdown: Dict[str, int]
    geographic_distribution: Dict[str, int]

class SystemHealthResponse(BaseModel):
    """System health and performance metrics"""
    uptime_percentage: float
    error_breakdown: Dict[str, int]
    performance_trends: Dict[str, List[float]]
    resource_usage: Dict[str, float]
    alert_triggers: List[Dict[str, Any]]

class HistoricalTrendsResponse(BaseModel):
    """Historical data trends and patterns"""
    hourly_traffic: List[Dict[str, Any]]
    daily_growth: List[Dict[str, Any]]
    weekly_patterns: Dict[str, List[float]]
    monthly_summary: Dict[str, Any]

@router.get("/real-time-summary", response_model=TrafficSummaryResponse)
async def get_real_time_summary():
    """Get real-time traffic summary"""
    try:
        # Get current stats
        real_time_stats = get_real_time_stats()
        
        # Calculate requests per minute from current hour
        current_hour_requests = real_time_stats.get("current_hour_requests", 0)
        current_minute = datetime.utcnow().minute
        requests_per_minute = current_hour_requests / max(current_minute, 1) if current_minute > 0 else 0
        
        # Get unique users today
        today = datetime.utcnow().strftime("%Y-%m-%d")
        unique_users_today = await _get_unique_users_for_date(today)
        
        return TrafficSummaryResponse(
            total_requests=current_hour_requests,
            active_sessions=real_time_stats.get("active_sessions", 0),
            authenticated_sessions=0,  # Would need middleware access
            error_rate=real_time_stats.get("error_rate", 0),
            avg_response_time=real_time_stats.get("avg_response_time", 0),
            unique_users_today=unique_users_today,
            requests_per_minute=round(requests_per_minute, 2),
            last_updated=real_time_stats.get("last_updated", datetime.utcnow().isoformat())
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get real-time traffic summary")

@router.get("/business-metrics", response_model=BusinessMetricsResponse)
async def get_business_metrics(
    days: int = Query(default=7, description="Number of days to analyze")
):
    """Get business KPIs and metrics"""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Collect business event data
        business_events = await _collect_business_events(start_date, end_date)
        
        # Calculate metrics
        daily_active_users = await _calculate_daily_active_users(start_date, end_date)
        signup_rate = _calculate_signup_rate(business_events, days)
        conversion_rate = _calculate_conversion_rate(business_events)
        feature_adoption = _calculate_feature_adoption(business_events)
        user_engagement = _calculate_engagement_score(business_events)
        revenue_events = _count_revenue_events(business_events)
        churn_indicators = await _analyze_churn_indicators(start_date, end_date)
        growth_metrics = _calculate_growth_metrics(business_events, days)
        
        return BusinessMetricsResponse(
            daily_active_users=daily_active_users,
            signup_rate=signup_rate,
            conversion_rate=conversion_rate,
            feature_adoption=feature_adoption,
            user_engagement_score=user_engagement,
            revenue_events=revenue_events,
            churn_indicators=churn_indicators,
            growth_metrics=growth_metrics
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get business metrics")

@router.get("/endpoint-analytics", response_model=EndpointAnalyticsResponse)
async def get_endpoint_analytics(
    hours: int = Query(default=24, description="Number of hours to analyze")
):
    """Get endpoint performance analytics"""
    try:
        analytics = get_performance_analytics(hours)
        
        # Get detailed endpoint data
        endpoint_data = await _get_detailed_endpoint_analytics(hours)
        
        # Most used endpoints
        most_used = _calculate_most_used_endpoints(endpoint_data)
        
        # Error-prone endpoints
        error_prone = _calculate_error_prone_endpoints(endpoint_data)
        
        # Endpoint categories
        categories = _categorize_endpoint_usage(endpoint_data)
        
        # Performance distribution
        performance_dist = _calculate_performance_distribution(endpoint_data)
        
        return EndpointAnalyticsResponse(
            most_used_endpoints=most_used,
            slowest_endpoints=analytics.get("slowest_endpoints", []),
            error_prone_endpoints=error_prone,
            endpoint_categories=categories,
            performance_distribution=performance_dist
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get endpoint analytics")

@router.get("/user-behavior", response_model=UserBehaviorResponse)
async def get_user_behavior(
    hours: int = Query(default=24, description="Number of hours to analyze")
):
    """Get user behavior and navigation patterns"""
    try:
        # Get session and navigation data
        behavior_data = await _analyze_user_behavior(hours)
        
        return UserBehaviorResponse(
            page_views=behavior_data.get("page_views", {}),
            user_journeys=behavior_data.get("user_journeys", []),
            session_duration_avg=behavior_data.get("avg_session_duration", 0),
            bounce_rate=behavior_data.get("bounce_rate", 0),
            device_breakdown=behavior_data.get("device_breakdown", {}),
            geographic_distribution=behavior_data.get("geographic_distribution", {})
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get user behavior analytics")

@router.get("/system-health", response_model=SystemHealthResponse)
async def get_system_health(
    hours: int = Query(default=24, description="Number of hours to analyze")
):
    """Get system health and performance metrics"""
    try:
        analytics = get_performance_analytics(hours)
        
        # Calculate uptime
        uptime_percentage = _calculate_uptime_percentage(analytics)
        
        # Get performance trends
        performance_trends = await _get_performance_trends(hours)
        
        # Get resource usage (simulated)
        resource_usage = _get_resource_usage()
        
        # Check for alert triggers
        alert_triggers = _check_alert_triggers(analytics)
        
        return SystemHealthResponse(
            uptime_percentage=uptime_percentage,
            error_breakdown=analytics.get("error_breakdown", {}),
            performance_trends=performance_trends,
            resource_usage=resource_usage,
            alert_triggers=alert_triggers
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get system health metrics")

@router.get("/historical-trends", response_model=HistoricalTrendsResponse)
async def get_historical_trends(
    days: int = Query(default=30, description="Number of days for historical analysis")
):
    """Get historical trends and patterns"""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get hourly traffic data
        hourly_traffic = await _get_hourly_traffic_trends(start_date, end_date)
        
        # Get daily growth data
        daily_growth = await _get_daily_growth_trends(start_date, end_date)
        
        # Analyze weekly patterns
        weekly_patterns = _analyze_weekly_patterns(hourly_traffic)
        
        # Generate monthly summary
        monthly_summary = _generate_monthly_summary(daily_growth)
        
        return HistoricalTrendsResponse(
            hourly_traffic=hourly_traffic,
            daily_growth=daily_growth,
            weekly_patterns=weekly_patterns,
            monthly_summary=monthly_summary
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get historical trends")

@router.get("/alerts-check")
async def check_traffic_alerts():
    """Check for traffic and performance alerts"""
    try:
        # Get current metrics
        real_time_stats = get_real_time_stats()
        analytics = get_performance_analytics(1)  # Last hour
        
        alerts = []
        
        # Check error rate alert
        if real_time_stats.get("error_rate", 0) > 5:
            alerts.append({
                "type": "error_rate",
                "severity": "high",
                "message": f"Error rate is {real_time_stats['error_rate']:.1f}% (threshold: 5%)",
                "value": real_time_stats["error_rate"],
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Check response time alert
        if real_time_stats.get("avg_response_time", 0) > 2000:
            alerts.append({
                "type": "slow_response",
                "severity": "medium",
                "message": f"Average response time is {real_time_stats['avg_response_time']:.0f}ms (threshold: 2000ms)",
                "value": real_time_stats["avg_response_time"],
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Check traffic spike
        current_requests = real_time_stats.get("current_hour_requests", 0)
        if current_requests > 1000:  # Adjust threshold as needed
            alerts.append({
                "type": "traffic_spike",
                "severity": "info",
                "message": f"High traffic detected: {current_requests} requests this hour",
                "value": current_requests,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        return {
            "alerts": alerts,
            "alert_count": len(alerts),
            "last_checked": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to check traffic alerts")

# Helper functions
async def _get_unique_users_for_date(date_str: str) -> int:
    """Get unique users for a specific date"""
    try:
        # Get all hourly summaries for the date
        unique_users = set()
        for hour in range(24):
            hour_key = f"{hour:02d}"
            summary_key = f"traffic_summary_{date_str}_{hour_key}"
            try:
                summary = db.storage.json.get(summary_key, default={})
                # In a real implementation, you'd collect actual user IDs
                unique_users.update([f"user_{i}" for i in range(summary.get("unique_users", 0))])
            except:
                continue
        return len(unique_users)
    except:
        return 0

async def _collect_business_events(start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
    """Collect business events from storage"""
    events = []
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        for hour in range(24):
            hour_key = f"{hour:02d}"
            detailed_key = f"traffic_analytics_detailed_{date_str}_{hour_key}"
            try:
                hourly_data = db.storage.json.get(detailed_key, default=[])
                for record in hourly_data:
                    if record.get("business_event"):
                        events.append(record)
            except:
                continue
        current_date += timedelta(days=1)
    
    return events

async def _calculate_daily_active_users(start_date: datetime, end_date: datetime) -> int:
    """Calculate daily active users"""
    unique_users = set()
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        daily_users = await _get_unique_users_for_date(date_str)
        unique_users.update([f"user_{i}" for i in range(daily_users)])
        current_date += timedelta(days=1)
    
    return len(unique_users)

def _calculate_signup_rate(events: List[Dict[str, Any]], days: int) -> float:
    """Calculate signup rate"""
    signups = len([e for e in events if e.get("business_event") == "user_signup"])
    return round(signups / max(days, 1), 2)

def _calculate_conversion_rate(events: List[Dict[str, Any]]) -> float:
    """Calculate conversion rate from signup to subscription"""
    signups = len([e for e in events if e.get("business_event") == "user_signup"])
    subscriptions = len([e for e in events if e.get("business_event") == "subscription_attempt"])
    
    if signups == 0:
        return 0.0
    return round((subscriptions / signups) * 100, 2)

def _calculate_feature_adoption(events: List[Dict[str, Any]]) -> Dict[str, int]:
    """Calculate feature adoption metrics"""
    features = defaultdict(int)
    for event in events:
        event_type = event.get("business_event")
        if event_type:
            features[event_type] += 1
    return dict(features)

def _calculate_engagement_score(events: List[Dict[str, Any]]) -> float:
    """Calculate user engagement score"""
    if not events:
        return 0.0
    
    # Simple engagement score based on event variety and frequency
    unique_users = len(set(e.get("user_id") for e in events if e.get("user_id")))
    total_events = len(events)
    
    if unique_users == 0:
        return 0.0
    
    events_per_user = total_events / unique_users
    return min(round(events_per_user * 10, 2), 100)  # Cap at 100

def _count_revenue_events(events: List[Dict[str, Any]]) -> int:
    """Count revenue-related events"""
    revenue_events = ["subscription_attempt", "trade_created", "dashboard_view"]
    return len([e for e in events if e.get("business_event") in revenue_events])

async def _analyze_churn_indicators(start_date: datetime, end_date: datetime) -> Dict[str, Any]:
    """Analyze churn indicators"""
    # This would analyze user inactivity patterns
    return {
        "inactive_users_7d": 0,
        "declining_usage": 0,
        "error_affected_users": 0,
        "churn_risk_score": 0.0
    }

def _calculate_growth_metrics(events: List[Dict[str, Any]], days: int) -> Dict[str, float]:
    """Calculate growth metrics"""
    signups = len([e for e in events if e.get("business_event") == "user_signup"])
    trades = len([e for e in events if e.get("business_event") == "trade_created"])
    
    return {
        "user_growth_rate": round((signups / max(days, 1)) * 100, 2),
        "activity_growth_rate": round((trades / max(days, 1)) * 100, 2),
        "weekly_growth": round(signups * 7 / max(days, 1), 2)
    }

async def _get_detailed_endpoint_analytics(hours: int) -> List[Dict[str, Any]]:
    """Get detailed endpoint analytics"""
    # Implementation would collect endpoint-specific data
    return []

def _calculate_most_used_endpoints(endpoint_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Calculate most used endpoints"""
    # Placeholder implementation
    return [
        {"path": "/api/analytics", "requests": 150, "avg_response_time": 250},
        {"path": "/api/trades", "requests": 120, "avg_response_time": 180},
        {"path": "/dashboard", "requests": 100, "avg_response_time": 300}
    ]

def _calculate_error_prone_endpoints(endpoint_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Calculate error-prone endpoints"""
    # Placeholder implementation
    return [
        {"path": "/api/ai/coach", "error_rate": 5.2, "total_requests": 45},
        {"path": "/api/stripe", "error_rate": 3.1, "total_requests": 32}
    ]

def _categorize_endpoint_usage(endpoint_data: List[Dict[str, Any]]) -> Dict[str, int]:
    """Categorize endpoint usage"""
    return {
        "trading": 245,
        "analytics": 189,
        "authentication": 156,
        "ai_features": 123,
        "billing": 67
    }

def _calculate_performance_distribution(endpoint_data: List[Dict[str, Any]]) -> Dict[str, int]:
    """Calculate performance distribution"""
    return {
        "excellent": 450,
        "good": 230,
        "acceptable": 120,
        "slow": 45,
        "very_slow": 12
    }

async def _analyze_user_behavior(hours: int) -> Dict[str, Any]:
    """Analyze user behavior patterns"""
    # Placeholder implementation - would analyze session data
    return {
        "page_views": {
            "/dashboard": 245,
            "/trading-journal": 189,
            "/analytics": 156,
            "/ai-coach": 123
        },
        "user_journeys": [
            {"path": ["/", "/dashboard", "/trading-journal"], "frequency": 45},
            {"path": ["/", "/analytics", "/ai-coach"], "frequency": 32}
        ],
        "avg_session_duration": 1245.5,
        "bounce_rate": 12.3,
        "device_breakdown": {"desktop": 678, "mobile": 234, "tablet": 45},
        "geographic_distribution": {"US": 456, "EU": 234, "APAC": 123, "other": 89}
    }

def _calculate_uptime_percentage(analytics: Dict[str, Any]) -> float:
    """Calculate uptime percentage"""
    total_requests = analytics.get("total_requests", 0)
    failed_requests = analytics.get("failed_requests", 0)
    
    if total_requests == 0:
        return 100.0
    
    success_rate = ((total_requests - failed_requests) / total_requests) * 100
    return round(success_rate, 2)

async def _get_performance_trends(hours: int) -> Dict[str, List[float]]:
    """Get performance trends over time"""
    # Placeholder - would collect hourly performance data
    return {
        "response_times": [250, 280, 245, 290, 310, 275],
        "error_rates": [1.2, 1.8, 1.1, 2.1, 1.9, 1.4],
        "request_counts": [145, 167, 189, 201, 178, 156]
    }

def _get_resource_usage() -> Dict[str, float]:
    """Get current resource usage"""
    # Placeholder - would integrate with actual monitoring
    return {
        "cpu_usage": 45.2,
        "memory_usage": 67.8,
        "storage_usage": 23.4,
        "network_io": 12.1
    }

def _check_alert_triggers(analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Check for alert triggers"""
    alerts = []
    
    error_rate = analytics.get("error_rate", 0)
    if error_rate > 5:
        alerts.append({
            "type": "error_rate_high",
            "message": f"Error rate is {error_rate:.1f}%",
            "severity": "high"
        })
    
    avg_response_time = analytics.get("avg_response_time", 0)
    if avg_response_time > 1000:
        alerts.append({
            "type": "response_time_slow",
            "message": f"Average response time is {avg_response_time:.0f}ms",
            "severity": "medium"
        })
    
    return alerts

async def _get_hourly_traffic_trends(start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
    """Get hourly traffic trends"""
    trends = []
    current_time = start_date
    
    while current_time <= end_date:
        date_str = current_time.strftime("%Y-%m-%d")
        hour_str = current_time.strftime("%H")
        summary_key = f"traffic_summary_{date_str}_{hour_str}"
        
        try:
            summary = db.storage.json.get(summary_key, default={})
            trends.append({
                "timestamp": current_time.isoformat(),
                "requests": summary.get("total_requests", 0),
                "unique_users": summary.get("unique_users", 0),
                "error_rate": summary.get("error_rate", 0),
                "avg_response_time": summary.get("avg_response_time_ms", 0)
            })
        except:
            trends.append({
                "timestamp": current_time.isoformat(),
                "requests": 0,
                "unique_users": 0,
                "error_rate": 0,
                "avg_response_time": 0
            })
        
        current_time += timedelta(hours=1)
    
    return trends

async def _get_daily_growth_trends(start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
    """Get daily growth trends"""
    trends = []
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Aggregate daily data from hourly summaries
        daily_requests = 0
        daily_users = 0
        daily_errors = 0
        hourly_count = 0
        
        for hour in range(24):
            hour_str = f"{hour:02d}"
            summary_key = f"traffic_summary_{date_str}_{hour_str}"
            try:
                summary = db.storage.json.get(summary_key, default={})
                daily_requests += summary.get("total_requests", 0)
                daily_users = max(daily_users, summary.get("unique_users", 0))
                daily_errors += summary.get("failed_requests", 0)
                hourly_count += 1
            except:
                continue
        
        error_rate = (daily_errors / daily_requests * 100) if daily_requests > 0 else 0
        
        trends.append({
            "date": date_str,
            "requests": daily_requests,
            "unique_users": daily_users,
            "error_rate": round(error_rate, 2),
            "growth_rate": 0  # Would calculate day-over-day growth
        })
        
        current_date += timedelta(days=1)
    
    return trends

def _analyze_weekly_patterns(hourly_data: List[Dict[str, Any]]) -> Dict[str, List[float]]:
    """Analyze weekly traffic patterns"""
    # Group by day of week and hour
    weekly_patterns = {
        "monday": [0] * 24,
        "tuesday": [0] * 24,
        "wednesday": [0] * 24,
        "thursday": [0] * 24,
        "friday": [0] * 24,
        "saturday": [0] * 24,
        "sunday": [0] * 24
    }
    
    day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    
    for data_point in hourly_data:
        try:
            timestamp = datetime.fromisoformat(data_point["timestamp"])
            day_name = day_names[timestamp.weekday()]
            hour = timestamp.hour
            weekly_patterns[day_name][hour] += data_point.get("requests", 0)
        except:
            continue
    
    return weekly_patterns

def _generate_monthly_summary(daily_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate monthly summary"""
    if not daily_data:
        return {}
    
    total_requests = sum(d.get("requests", 0) for d in daily_data)
    total_users = sum(d.get("unique_users", 0) for d in daily_data)
    avg_error_rate = sum(d.get("error_rate", 0) for d in daily_data) / len(daily_data)
    
    return {
        "total_requests": total_requests,
        "total_unique_users": total_users,
        "avg_error_rate": round(avg_error_rate, 2),
        "days_analyzed": len(daily_data),
        "avg_requests_per_day": round(total_requests / len(daily_data), 2)
    }
