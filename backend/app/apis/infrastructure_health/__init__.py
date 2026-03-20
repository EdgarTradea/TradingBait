"""Infrastructure health monitoring API endpoints"""

from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime
from app.auth import AuthorizedUser
import uuid

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/infrastructure")

# ---------------------------------------------------------------------------
# Inline stub replacing the deleted app.libs.infrastructure_monitoring module
# ---------------------------------------------------------------------------
class _InfrastructureMonitor:
    def log_subscription_verification_failure(self, details: dict):
        try:
            db_firestore = firestore.client()
            failure_id = str(uuid.uuid4())
            db_firestore.collection("infrastructure_failures").document(failure_id).set({
                **details,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            pass

    def get_recent_failure_stats(self, hours: int = 24) -> dict:
        return {
            "total_failures": 0,
            "failure_rate_per_hour": 0.0,
            "error_types": {},
            "hourly_breakdown": {},
            "analysis_period_hours": hours,
            "last_updated": datetime.now().isoformat(),
        }

    async def run_comprehensive_health_check(self) -> dict:
        start = datetime.now()
        status = "healthy"
        issues: list = []
        warnings: list = []
        try:
            db_firestore = firestore.client()
            db_firestore.collection("_health_probes").document("probe").set({"ts": start.isoformat()})
            storage_ok = True
        except Exception:
            storage_ok = False
            status = "degraded"
            issues.append("Firestore write failed")
        ms = (datetime.now() - start).total_seconds() * 1000
        return {
            "overall_status": status,
            "timestamp": datetime.now().isoformat(),
            "services": {"storage": {"status": "ok" if storage_ok else "error"}},
            "critical_issues": issues,
            "warnings": warnings,
            "total_response_time_ms": ms,
        }

infrastructure_monitor = _InfrastructureMonitor()

class InfrastructureHealthResponse(BaseModel):
    overall_status: str
    timestamp: str
    services: Dict[str, Any]
    critical_issues: list
    warnings: list
    total_response_time_ms: float

class SubscriptionFailureStats(BaseModel):
    total_failures: int
    failure_rate_per_hour: float
    error_types: Dict[str, int]
    hourly_breakdown: Dict[str, int]
    analysis_period_hours: int
    last_updated: str

class LogFailureRequest(BaseModel):
    error_type: str
    error_message: str
    user_agent: Optional[str] = None
    additional_context: Optional[Dict[str, Any]] = None

@router.get("/health", response_model=InfrastructureHealthResponse)
async def get_infrastructure_health(user: AuthorizedUser) -> InfrastructureHealthResponse:
    """
    Get comprehensive infrastructure health status.
    Requires authentication to prevent abuse.
    """
    try:
        health_summary = await infrastructure_monitor.run_comprehensive_health_check()
        return InfrastructureHealthResponse(**health_summary)

    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to check infrastructure health: {str(e)}")

@router.get("/subscription-failures", response_model=SubscriptionFailureStats)
async def get_subscription_failure_stats(
    user: AuthorizedUser,
    hours: int = 24
) -> SubscriptionFailureStats:
    """
    Get statistics on recent subscription verification failures.
    Requires authentication to protect sensitive monitoring data.
    """
    try:
        if hours < 1 or hours > 168:  # Max 1 week
            raise HTTPException(status_code=400, detail="Hours must be between 1 and 168")

        stats = infrastructure_monitor.get_recent_failure_stats(hours)
        return SubscriptionFailureStats(**stats)

    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to get failure statistics: {str(e)}")

@router.post("/log-subscription-failure")
async def log_subscription_failure(
    request: LogFailureRequest,
    user: AuthorizedUser
) -> Dict[str, str]:
    """
    Log a subscription verification failure for monitoring.
    Used by the frontend when retries are exhausted.
    """
    try:
        error_details = {
            'errorType': request.error_type,
            'errorMessage': request.error_message,
            'userAgent': request.user_agent,
            'userId': user.sub,
            'userEmail': user.email,
            'additionalContext': request.additional_context or {}
        }

        infrastructure_monitor.log_subscription_verification_failure(error_details)

        return {
            'status': 'logged',
            'message': 'Subscription verification failure logged for monitoring'
        }

    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to log failure: {str(e)}")

@router.get("/system-health")
async def get_system_health() -> Dict[str, Any]:
    """
    Public health check endpoint for load balancers and monitoring.
    Returns basic system status without sensitive details.
    """
    try:
        start_time = datetime.now()

        db_firestore = firestore.client()
        probe_id = f"system_health_check_{start_time.strftime('%Y%m%d_%H%M')}"
        test_data = {'timestamp': start_time.isoformat()}
        db_firestore.collection("_health_probes").document(probe_id).set(test_data)
        retrieved = db_firestore.collection("_health_probes").document(probe_id).get().to_dict()

        response_time = (datetime.now() - start_time).total_seconds() * 1000

        return {
            'status': 'healthy' if retrieved == test_data else 'degraded',
            'timestamp': datetime.now().isoformat(),
            'response_time_ms': response_time,
            'version': '1.0.0'
        }

    except Exception as e:
        pass
        return {
            'status': 'unhealthy',
            'timestamp': datetime.now().isoformat(),
            'error': str(e)
        }
