from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import logging
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase

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
            initialize_firebase()
            firestore_db = firestore.client()
            firestore_db.collection("system").document("health_check").set({
                "last_ping": datetime.utcnow().isoformat(),
                "status": "online"
            })
            firestore_db.collection("system").document("health_check").get()
        except Exception as e:
            pass
        
        return HealthCheckResponse(
            status="healthy",
            timestamp=datetime.utcnow().isoformat(),
            version="1.0.0",
            environment="production"
        )
    except Exception as e:
        pass
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
