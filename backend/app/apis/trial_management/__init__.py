import stripe
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from app.auth import AuthorizedUser
import firebase_admin
from firebase_admin import credentials, firestore
from app.libs.firebase_init import initialize_firebase
import json
from app.env import Mode, mode
import os

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

# Initialize Firebase Admin
initialize_firebase()

router = APIRouter(prefix="/trial-management")

# Models
class TrialStatus(BaseModel):
    user_id: str
    is_trial_active: bool
    trial_start_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    trial_plan: Optional[str] = None  # basic or pro
    days_remaining: Optional[int] = None
    usage_limits: Dict[str, int] = Field(default_factory=dict)
    current_usage: Dict[str, int] = Field(default_factory=dict)
    stripe_subscription_id: Optional[str] = None
    has_cancelled: bool = False
    can_cancel: bool = True

class TrialUsage(BaseModel):
    trades_used: int = 0
    evaluations_used: int = 0
    analytics_insights_used: int = 0
    habits_unlimited: bool = True
    journaling_unlimited: bool = True

class CreateTrialRequest(BaseModel):
    plan_name: str  # "basic" or "pro" 
    price_id: str  # Stripe price ID for the plan

class TrialUsageUpdate(BaseModel):
    feature_type: str  # "trades", "evaluations", "analytics_insights"
    increment: int = 1

class CancelTrialRequest(BaseModel):
    reason: Optional[str] = None

# Constants
TRIAL_LIMITS = {
    "trades": 50,
    "evaluations": 2,
    "analytics_insights": 10
}

TRIAL_DURATION_DAYS = 7

# Deprecated storage functions removed

# Helper functions for other APIs to use
def check_trial_usage_limit(user_id: str, feature_type: str) -> tuple[bool, int]:
    """Helper function to check if user can use a feature. Returns (can_use, remaining)"""
    try:
        db_firestore = firestore.client()
        trial_doc = db_firestore.collection('users').document(user_id).collection('subscription').document('trial').get()
        
        if not trial_doc.exists or not trial_doc.to_dict().get('is_trial_active'):
            return True, 999
            
        usage_doc = db_firestore.collection('users').document(user_id).collection('subscription').document('usage').get()
        usage_data = usage_doc.to_dict() if usage_doc.exists else {}
        
        current_usage = usage_data.get(f"{feature_type}_used", 0)
        limit = TRIAL_LIMITS.get(feature_type, 0)
        
        if feature_type in ['habits', 'journaling']:
            return True, 999
            
        can_use = current_usage < limit
        remaining = max(0, limit - current_usage)
        
        return can_use, remaining
    except Exception as e:
        return True, 999

def update_trial_usage(user_id: str, feature_type: str, increment: int = 1) -> bool:
    """Helper function to update trial usage. Returns success status"""
    try:
        db_firestore = firestore.client()
        trial_ref = db_firestore.collection('users').document(user_id).collection('subscription').document('trial')
        trial_doc = trial_ref.get()
        
        if not trial_doc.exists or not trial_doc.to_dict().get('is_trial_active'):
            return True
            
        usage_ref = db_firestore.collection('users').document(user_id).collection('subscription').document('usage')
        usage_doc = usage_ref.get()
        usage_data = usage_doc.to_dict() if usage_doc.exists else {}
        
        current_count = usage_data.get(f"{feature_type}_used", 0)
        new_count = current_count + increment
        usage_data[f"{feature_type}_used"] = new_count
        
        usage_ref.set(usage_data, merge=True)
        return True
    except Exception as e:
        return False

@router.options("/status")
async def options_trial_status() -> JSONResponse:
    """Handle preflight CORS requests for trial status"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true"
        }
    )

@router.get("/status")
async def get_trial_status(user: AuthorizedUser) -> JSONResponse:
    """Get current trial status for the user"""
    try:
        pass
        
        # Get trial data from storage
        db_firestore = firestore.client()
        
        trial_doc = db_firestore.collection('users').document(user.sub).collection('subscription').document('trial').get()
        trial_data = trial_doc.to_dict() if trial_doc.exists else {}
        
        usage_doc = db_firestore.collection('users').document(user.sub).collection('subscription').document('usage').get()
        usage_data = usage_doc.to_dict() if usage_doc.exists else {}
        
        # If no trial data exists, check if user has active subscription
        if not trial_data:
            # Check for existing subscription in Firestore
            user_doc = db_firestore.collection("users").document(user.sub).get()
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                customer_id = user_data.get('stripe_customer_id')
                
                if customer_id:
                    # Check for active subscription
                    subscriptions = stripe.Subscription.list(customer=customer_id, status='active', limit=1)
                    if subscriptions.data:
                        # User has active subscription, no trial
                        trial_status = TrialStatus(
                            user_id=user.sub,
                            is_trial_active=False,
                            usage_limits={},
                            current_usage={}
                        )
                        return JSONResponse(
                            content=trial_status.dict(),
                            headers={
                                "Access-Control-Allow-Origin": "*",
                                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                                "Access-Control-Allow-Headers": "*",
                                "Access-Control-Allow-Credentials": "true"
                            }
                        )
            
            # No trial or subscription data
            trial_status = TrialStatus(
                user_id=user.sub,
                is_trial_active=False,
                usage_limits=TRIAL_LIMITS,
                current_usage=usage_data
            )
            return JSONResponse(
                content=trial_status.dict(),
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Credentials": "true"
                }
            )
        
        # Parse dates
        trial_start_date = None
        trial_end_date = None
        days_remaining = None
        
        if trial_data.get('trial_start_date'):
            trial_start_date = datetime.fromisoformat(trial_data['trial_start_date'])
        if trial_data.get('trial_end_date'):
            trial_end_date = datetime.fromisoformat(trial_data['trial_end_date'])
            # Calculate days remaining
            if trial_end_date:
                now = datetime.now(timezone.utc)
                if trial_end_date.tzinfo is None:
                    trial_end_date = trial_end_date.replace(tzinfo=timezone.utc)
                days_remaining = max(0, (trial_end_date - now).days)
        
        trial_status = TrialStatus(
            user_id=user.sub,
            is_trial_active=trial_data.get('is_trial_active', False),
            trial_start_date=trial_start_date,
            trial_end_date=trial_end_date,
            trial_plan=trial_data.get('trial_plan'),
            days_remaining=days_remaining,
            usage_limits=TRIAL_LIMITS,
            current_usage=usage_data,
            stripe_subscription_id=trial_data.get('stripe_subscription_id'),
            has_cancelled=trial_data.get('has_cancelled', False),
            can_cancel=trial_data.get('can_cancel', True)
        )
        
        pass
        return JSONResponse(
            content=trial_status.dict(),
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true"
            }
        )
        
    except Exception as e:
        pass
        error_response = {
            "user_id": user.sub,
            "is_trial_active": False,
            "usage_limits": TRIAL_LIMITS,
            "current_usage": {},
            "error": str(e)
        }
        return JSONResponse(
            content=error_response,
            status_code=500,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true"
            }
        )

@router.post("/create")
async def create_trial_subscription(request: CreateTrialRequest, user: AuthorizedUser) -> Dict[str, Any]:
    """Create a new trial subscription with Stripe"""
    try:
        pass
        
        # Check if user already has trial or subscription
        trial_status = await get_trial_status(user)
        if trial_status.is_trial_active:
            raise HTTPException(status_code=400, detail="User already has an active trial")
        
        # Get or create Stripe customer
        db_firestore = firestore.client()
        user_doc_ref = db_firestore.collection("users").document(user.sub)
        user_doc = user_doc_ref.get()
        
        customer_id = None
        if user_doc.exists:
            user_data = user_doc.to_dict()
            customer_id = user_data.get('stripe_customer_id')
        
        # Create customer if doesn't exist
        if not customer_id:
            customer = stripe.Customer.create(
                email=user.email if hasattr(user, 'email') else None,
                metadata={
                    'user_id': user.sub,
                    'trial_user': 'true'
                }
            )
            customer_id = customer.id
            
            # Store customer ID in Firestore
            user_doc_ref.set({'stripe_customer_id': customer_id}, merge=True)
        
        # Create subscription with trial
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{
                'price': request.price_id,
            }],
            trial_period_days=TRIAL_DURATION_DAYS,
            metadata={
                'user_id': user.sub,
                'plan_name': request.plan_name,
                'is_trial': 'true'
            }
        )
        
        # Calculate trial dates
        trial_start = datetime.now(timezone.utc)
        trial_end = trial_start + timedelta(days=TRIAL_DURATION_DAYS)
        
        # Store trial data
        trial_data = {
            'user_id': user.sub,
            'trial_start_date': trial_start.isoformat(),
            'trial_end_date': trial_end.isoformat(),
            'trial_plan': request.plan_name,
            'stripe_subscription_id': subscription.id,
            'stripe_customer_id': customer_id,
            'has_cancelled': False,
            'can_cancel': True,
            'created_at': trial_start.isoformat()
        }
        
        db_firestore.collection('users').document(user.sub).collection('subscription').document('trial').set(trial_data)
        
        # Initialize usage tracking
        initial_usage = {
            'trades_used': 0,
            'evaluations_used': 0,
            'analytics_insights_used': 0
        }
        db_firestore.collection('users').document(user.sub).collection('subscription').document('usage').set(initial_usage)
        
        pass
        
        return {
            'success': True,
            'subscription_id': subscription.id,
            'trial_start': trial_start.isoformat(),
            'trial_end': trial_end.isoformat(),
            'days_remaining': TRIAL_DURATION_DAYS
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to create trial: {str(e)}")

@router.post("/track-usage")
async def track_feature_usage(request: TrialUsageUpdate, user: AuthorizedUser) -> Dict[str, Any]:
    """Track usage of trial features"""
    try:
        pass
        
        # Get current usage
        db_firestore = firestore.client()
        usage_ref = db_firestore.collection('users').document(user.sub).collection('subscription').document('usage')
        usage_doc = usage_ref.get()
        usage_data = usage_doc.to_dict() if usage_doc.exists else {}
        
        # Update usage
        current_count = usage_data.get(f"{request.feature_type}_used", 0)
        new_count = current_count + request.increment
        usage_data[f"{request.feature_type}_used"] = new_count
        
        # Store updated usage
        usage_ref.set(usage_data, merge=True)
        
        # Check if limit exceeded
        limit = TRIAL_LIMITS.get(request.feature_type, 0)
        limit_exceeded = new_count > limit
        
        return {
            'success': True,
            'feature_type': request.feature_type,
            'current_usage': new_count,
            'limit': limit,
            'limit_exceeded': limit_exceeded,
            'remaining': max(0, limit - new_count)
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to track usage: {str(e)}")

@router.get("/check-limit/{feature_type}")
async def check_feature_limit(feature_type: str, user: AuthorizedUser) -> Dict[str, Any]:
    """Check if user can use a specific feature"""
    try:
        # Get trial status
        trial_status = await get_trial_status(user)
        
        # If not on trial, allow unlimited access
        if not trial_status.is_trial_active:
            return {
                'can_use': True,
                'is_trial': False,
                'unlimited': True
            }
        
        # Get current usage
        db_firestore = firestore.client()
        usage_doc = db_firestore.collection('users').document(user.sub).collection('subscription').document('usage').get()
        usage_data = usage_doc.to_dict() if usage_doc.exists else {}
        current_usage = usage_data.get(f"{feature_type}_used", 0)
        limit = TRIAL_LIMITS.get(feature_type, 0)
        
        # Habits and journaling are unlimited during trial
        if feature_type in ['habits', 'journaling']:
            return {
                'can_use': True,
                'is_trial': True,
                'unlimited': True
            }
        
        can_use = current_usage < limit
        
        return {
            'can_use': can_use,
            'is_trial': True,
            'current_usage': current_usage,
            'limit': limit,
            'remaining': max(0, limit - current_usage),
            'unlimited': False
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to check limit: {str(e)}")

@router.post("/cancel")
async def cancel_trial(request: CancelTrialRequest, user: AuthorizedUser) -> Dict[str, Any]:
    """Cancel trial subscription to avoid charges"""
    try:
        pass
        
        # Get trial data
        db_firestore = firestore.client()
        trial_ref = db_firestore.collection('users').document(user.sub).collection('subscription').document('trial')
        trial_doc = trial_ref.get()
        trial_data = trial_doc.to_dict() if trial_doc.exists else {}
        
        if not trial_data or not trial_data.get('stripe_subscription_id'):
            raise HTTPException(status_code=404, detail="No active trial found")
        
        # Cancel Stripe subscription
        subscription_id = trial_data['stripe_subscription_id']
        stripe.Subscription.cancel(subscription_id)
        
        # Update trial data
        trial_data['has_cancelled'] = True
        trial_data['can_cancel'] = False
        trial_data['cancelled_at'] = datetime.now(timezone.utc).isoformat()
        trial_data['cancellation_reason'] = request.reason
        
        trial_ref.set(trial_data, merge=True)
        
        pass
        
        return {
            'success': True,
            'message': 'Trial cancelled successfully. You will not be charged.',
            'cancelled_at': trial_data['cancelled_at']
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to cancel trial: {str(e)}")

@router.get("/admin/users")
async def get_trial_users(user: AuthorizedUser) -> List[Dict[str, Any]]:
    """Admin endpoint to view all trial users"""
    try:
        # Admin verification
        admin_user_ids = [
            "c5tjdjaLvSVY6XDsjVsDtyrwPg43",  # Edgar's production user ID
            "test-user-id"  # Development/test user ID
        ]
        
        if user.sub not in admin_user_ids:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get all trial files via Firestore users instead of scanning storage
        db_firestore = firestore.client()
        users_ref = db_firestore.collection('users').stream()
        trial_users = []
        
        for user_doc in users_ref:
            user_id = user_doc.id
            trial_doc = db_firestore.collection('users').document(user_id).collection('subscription').document('trial').get()
            
            if trial_doc.exists:
                trial_data = trial_doc.to_dict()
                usage_doc = db_firestore.collection('users').document(user_id).collection('subscription').document('usage').get()
                usage_data = usage_doc.to_dict() if usage_doc.exists else {}
                
                trial_users.append({
                    'user_id': user_id,
                    'trial_plan': trial_data.get('trial_plan'),
                    'trial_start': trial_data.get('trial_start_date'),
                    'trial_end': trial_data.get('trial_end_date'),
                    'has_cancelled': trial_data.get('has_cancelled', False),
                    'subscription_id': trial_data.get('stripe_subscription_id'),
                    'usage': usage_data
                })
        
        return trial_users
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to get trial users: {str(e)}")

@router.get("/health")
def trial_health_check() -> Dict[str, Any]:
    """Health check for trial management system"""
    try:
        # Test Firestore access as health signal
        from firebase_admin import firestore as _fs
        health_ref = _fs.client().collection("system").document("trial_health")
        health_ref.set({"test": True, "timestamp": datetime.now().isoformat()})
        retrieved = health_ref.get().to_dict()
        
        # Test Stripe connection
        stripe.Account.retrieve()
        
        return {
            "status": "healthy",
            "storage": "working",
            "stripe": "connected",
            "trial_limits": TRIAL_LIMITS,
            "trial_duration_days": TRIAL_DURATION_DAYS
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
