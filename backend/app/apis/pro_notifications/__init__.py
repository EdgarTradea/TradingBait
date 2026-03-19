from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from app.auth import AuthorizedUser
from datetime import datetime

router = APIRouter(prefix="/pro-notifications")

# Initialize Firebase
initialize_firebase()

class ProNotificationRequest(BaseModel):
    email: str
    user_id: str
    notify_me: bool
    current_plan: Optional[str] = "Basic"
    
class ProNotificationResponse(BaseModel):
    success: bool
    message: str
    discount_eligible: bool

@router.post("/signup", response_model=ProNotificationResponse)
async def signup_for_pro_notifications(request: ProNotificationRequest, user: AuthorizedUser) -> ProNotificationResponse:
    """
    Store user preference for Pro tier notifications and discount eligibility
    """
    try:
        # Create user preference record
        user_preference = {
            "email": request.email,
            "user_id": request.user_id,
            "notify_me": request.notify_me,
            "current_plan": request.current_plan,
            "signup_date": datetime.now().isoformat(),
            "discount_eligible": True,  # Early signups get discount eligibility
            "authenticated_user_id": user.sub
        }

        # Save preference as individual document
        db_firestore = firestore.client()
        db_firestore.collection("pro_waitlist").document(request.user_id).set(user_preference)
        
        return ProNotificationResponse(
            success=True,
            message="You'll be notified when Pro launches with exclusive early access!",
            discount_eligible=True
        )
        
    except Exception as e:
        pass
        return ProNotificationResponse(
            success=False,
            message="Something went wrong. Please try again.",
            discount_eligible=False
        )

@router.get("/check/{user_id}")
async def check_notification_preference(user_id: str, user: AuthorizedUser):
    """
    Check if user has already signed up for Pro notifications
    """
    try:
        db_firestore = firestore.client()
        doc = db_firestore.collection("pro_waitlist").document(user_id).get()
        user_pref = doc.to_dict() if doc.exists else None

        if user_pref:
            return {
                "signed_up": True,
                "notify_me": user_pref.get("notify_me", False),
                "discount_eligible": user_pref.get("discount_eligible", False),
                "signup_date": user_pref.get("signup_date")
            }
        else:
            return {
                "signed_up": False,
                "notify_me": False,
                "discount_eligible": False
            }
            
    except Exception as e:
        pass
        return {
            "signed_up": False,
            "notify_me": False,
            "discount_eligible": False
        }

@router.get("/stats")
async def get_waitlist_stats(user: AuthorizedUser):
    """
    Get Pro waitlist statistics (admin only for now)
    """
    try:
        db_firestore = firestore.client()
        docs = list(db_firestore.collection("pro_waitlist").stream())
        preferences = {doc.id: doc.to_dict() for doc in docs}

        total_signups = len(preferences)
        notify_enabled = sum(1 for pref in preferences.values() if pref.get("notify_me", False))
        discount_eligible = sum(1 for pref in preferences.values() if pref.get("discount_eligible", False))
        
        return {
            "total_signups": total_signups,
            "notify_enabled": notify_enabled,
            "discount_eligible": discount_eligible,
            "conversion_potential": f"{notify_enabled}/{total_signups} users want notifications"
        }
        
    except Exception as e:
        pass
        return {
            "total_signups": 0,
            "notify_enabled": 0,
            "discount_eligible": 0,
            "conversion_potential": "0/0 users want notifications"
        }
