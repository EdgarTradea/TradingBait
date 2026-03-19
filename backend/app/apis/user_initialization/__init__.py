import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone
from app.auth import AuthorizedUser
from app.libs.firebase_init import initialize_firebase
import json
import re
import os

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/user-initialization")

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

class UserInitializationRequest(BaseModel):
    user_id: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    provider_id: Optional[str] = None

class UserInitializationResponse(BaseModel):
    success: bool
    message: str
    user_created: bool
    firestore_updated: bool

@router.post("/initialize-user", response_model=UserInitializationResponse)
async def initialize_user(request: UserInitializationRequest, user: AuthorizedUser):
    """Initialize a new user in Firestore and our storage systems"""
    try:
        pass
        
        # Verify the requesting user is the same as the user being initialized (security check)
        if user.sub != request.user_id:
            raise HTTPException(status_code=403, detail="Can only initialize your own user account")
        
        db_firestore = firestore.client()
        user_doc_ref = db_firestore.collection("users").document(request.user_id)
        
        # Check if user already exists
        user_doc = user_doc_ref.get()
        user_created = False
        
        if not user_doc.exists:
            # Create new user document in Firestore
            user_data = {
                "uid": request.user_id,
                "email": request.email,
                "display_name": request.display_name,
                "provider_id": request.provider_id or "email",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login": datetime.now(timezone.utc).isoformat(),
                "subscription_status": "free",
                "trial_used": False,
                "onboarding_completed": False
            }
            
            user_doc_ref.set(user_data)
            user_created = True
            pass
        else:
            # Update last login time
            user_doc_ref.update({
                "last_login": datetime.now(timezone.utc).isoformat()
            })
            pass
        
        # Initialize user preferences in Firestore
        pref_ref = db_firestore.collection("users").document(request.user_id).collection("settings").document("preferences")
        pref_doc = pref_ref.get()
        if not pref_doc.exists:
            default_preferences = {
                "user_id": request.user_id,
                "email": request.email,
                "timezone": "UTC",
                "currency": "USD",
                "notifications": {
                    "email": True,
                    "browser": True,
                    "coaching_reminders": True,
                    "weekly_reviews": True
                },
                "display_preferences": {
                    "theme": "dark",
                    "charts_style": "professional",
                    "density": "comfortable"
                },
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            pref_ref.set(default_preferences)
        
        # Send welcome email if this is a new user
        if user_created and request.email:
            try:
                # import brain
                # await brain.send_welcome_email({
                #     "email": request.email,
                #     "user_id": request.user_id,
                #     "signup_method": request.provider_id or "email",
                #     "user_name": request.display_name
                # })
                pass
            except Exception as e:
                pass
                # Don't fail the whole process if email fails
        
        return UserInitializationResponse(
            success=True,
            message="User initialized successfully" if user_created else "User updated successfully",
            user_created=user_created,
            firestore_updated=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to initialize user: {str(e)}")

@router.post("/auto-initialize")
async def auto_initialize_user(user: AuthorizedUser):
    """Auto-initialize the current authenticated user"""
    try:
        # Extract user info from the authenticated user object
        user_id = user.sub
        email = getattr(user, 'email', None)
        display_name = getattr(user, 'name', None) or getattr(user, 'display_name', None)
        
        # Call the main initialization function
        request = UserInitializationRequest(
            user_id=user_id,
            email=email,
            display_name=display_name,
            provider_id="auto"
        )
        
        return await initialize_user(request, user)
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Auto-initialization failed: {str(e)}")

@router.get("/health")
def user_initialization_health_check():
    """Health check for user initialization system"""
    try:
        db_firestore = firestore.client()
        db_firestore.collection("system").document("user_init_health").set(
            {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}
        )
        return {
            "status": "healthy",
            "firestore": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"User initialization system unhealthy: {str(e)}")
