from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import databutton as db

router = APIRouter(prefix="/health")

class HealthCheckResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    environment: str

@router.get("/check")
def basic_health_check() -> HealthCheckResponse:
    """Basic unauthenticated health check endpoint for monitoring"""
    try:
        # Simple health check - just verify the API is responding
        # Test basic db connection
        try:
            db.storage.text.put("health_check_test", "test")
            db.storage.text.get("health_check_test")
        except Exception as e:
            print(f"⚠️ Storage health check warning: {e}")
            # Don't fail the health check for storage issues
        
        return HealthCheckResponse(
            status="healthy",
            timestamp=datetime.utcnow().isoformat(),
            version="1.0.0",
            environment="production"
        )
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return HealthCheckResponse(
            status="unhealthy", 
            timestamp=datetime.utcnow().isoformat(),
            version="1.0.0",
            environment="production"
        )

@router.get("/ping")
def ping() -> dict:
    """Simple ping endpoint"""
    return {"message": "pong", "timestamp": datetime.utcnow().isoformat()}
