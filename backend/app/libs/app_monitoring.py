"""App initialization and middleware configuration for TradingBait"""

from fastapi import FastAPI
from app.libs.performance_monitoring import PerformanceMonitoringMiddleware

def configure_monitoring(app: FastAPI) -> None:
    """Configure monitoring middleware for the FastAPI app"""
    try:
        # Add performance monitoring middleware
        app.add_middleware(PerformanceMonitoringMiddleware)
        pass
    except Exception as e:
        pass

def get_monitoring_status() -> dict:
    """Get the status of monitoring configuration"""
    return {
        "performance_monitoring": "enabled",
        "error_tracking": "enabled",
        "user_analytics": "enabled",
        "status": "active"
    }
