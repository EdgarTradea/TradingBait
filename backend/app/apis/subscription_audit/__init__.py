import stripe
import databutton as db
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from app.auth import AuthorizedUser
import firebase_admin
from firebase_admin import credentials, firestore
from app.libs.firebase_init import initialize_firebase
import json
import re
import os

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/subscription-audit")

# Admin verification
def verify_admin_access(user: AuthorizedUser):
    """Verify that the user has admin access"""
    admin_user_ids = [
        "c5tjdjaLvSVY6XDsjVsDtyrwPg43",  # Edgar's production user ID
        "Rw439poJqXdr0OhD9tO2vnMXxkr2",  # Current workspace user ID
        "test-user-id",  # Development/test user ID
        "anquimera@gmail.com",  # Admin user by email pattern
        "yFWOUiin60dAIa5wLYPb12rvYe92",  # anquimera@gmail.com Firebase UID
    ]
    
    admin_emails = [
        "anquimera@gmail.com",
        "grau.edgar@protonmail.com"  # Current workspace user email
    ]
    
    user_email = getattr(user, 'email', '')
    
    if user.sub not in admin_user_ids and user_email not in admin_emails and user.sub not in admin_emails:
        raise HTTPException(status_code=403, detail="Admin access required")

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

class SubscriptionAuditResult(BaseModel):
    user_email: str
    user_id: Optional[str]
    local_subscription: Optional[Dict[str, Any]]
    stripe_customer: Optional[Dict[str, Any]]
    stripe_subscriptions: List[Dict[str, Any]]
    firestore_user: Optional[Dict[str, Any]]
    status: str  # "complete", "missing_local", "missing_stripe", "mismatch", "error"
    recommendations: List[str]

class BulkAuditResponse(BaseModel):
    total_users: int
    complete_records: int
    missing_local_subscriptions: int
    missing_stripe_data: int
    mismatched_data: int
    errors: int
    users: List[SubscriptionAuditResult]

class SubscriptionRestoreRequest(BaseModel):
    user_email: str
    subscription_type: str = "professional"
    subscription_status: str = "active"
    force_restore: bool = False

class SubscriptionRestoreResponse(BaseModel):
    success: bool
    message: str
    subscription_data: Optional[Dict[str, Any]]

@router.get("/health")
async def subscription_audit_health_check():
    """Health check for subscription audit system"""
    try:
        # Test Stripe connection
        stripe.Account.retrieve()
        
        # Test Firestore connection
        db_firestore = firestore.client()
        test_doc = db_firestore.collection("system_health").document("subscription_audit_test")
        test_doc.set({"last_check": datetime.utcnow().isoformat()}, merge=True)
        
        # Test storage
        db.storage.json.put("subscription_audit_health", {"status": "healthy", "timestamp": datetime.utcnow().isoformat()})
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "components": {
                "stripe": "connected",
                "firestore": "connected",
                "storage": "available"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subscription audit health check failed: {str(e)}")

@router.post("/audit-user")
async def audit_single_user(user_email: str, user: AuthorizedUser) -> SubscriptionAuditResult:
    """Audit subscription data for a single user"""
    verify_admin_access(user)
    
    try:
        result = SubscriptionAuditResult(
            user_email=user_email,
            user_id=None,
            local_subscription=None,
            stripe_customer=None,
            stripe_subscriptions=[],
            firestore_user=None,
            status="error",
            recommendations=[]
        )
        
        # 1. Find user in Firestore by email
        db_firestore = firestore.client()
        users_ref = db_firestore.collection('users')
        query = users_ref.where('email', '==', user_email).limit(1)
        docs = query.stream()
        
        firestore_user_data = None
        user_id = None
        
        for doc in docs:
            firestore_user_data = doc.to_dict()
            user_id = doc.id
            result.user_id = user_id
            result.firestore_user = firestore_user_data
            break
        
        if not user_id:
            result.status = "missing_firestore_user"
            result.recommendations.append("User not found in Firestore - may need account creation")
            return result
        
        # 2. Check local subscription storage
        sanitized_user_id = sanitize_storage_key(user_id.replace('.', '_').replace('@', '_at_'))
        subscription_key = f"subscription.{sanitized_user_id}"
        
        try:
            local_subscription = db.storage.json.get(subscription_key)
            result.local_subscription = local_subscription
        except FileNotFoundError:
            result.local_subscription = None
        
        # 3. Check Stripe customer data
        stripe_customer_id = firestore_user_data.get('stripe_customer_id') if firestore_user_data else None
        
        if stripe_customer_id:
            try:
                stripe_customer = stripe.Customer.retrieve(stripe_customer_id)
                result.stripe_customer = {
                    "id": stripe_customer.id,
                    "email": stripe_customer.email,
                    "created": stripe_customer.created,
                    "metadata": stripe_customer.metadata
                }
                
                # Get Stripe subscriptions
                subscriptions = stripe.Subscription.list(customer=stripe_customer_id)
                result.stripe_subscriptions = [
                    {
                        "id": sub.id,
                        "status": sub.status,
                        "created": sub.created,
                        "current_period_start": sub.current_period_start,
                        "current_period_end": sub.current_period_end,
                        "metadata": sub.metadata
                    } for sub in subscriptions.data
                ]
                
            except Exception as e:
                pass
                result.recommendations.append(f"Error accessing Stripe customer: {e}")
        else:
            # Try to find customer by email in Stripe
            try:
                customers = stripe.Customer.search(query=f"email:'{user_email}'")
                if customers.data:
                    stripe_customer = customers.data[0]
                    result.stripe_customer = {
                        "id": stripe_customer.id,
                        "email": stripe_customer.email,
                        "created": stripe_customer.created,
                        "metadata": stripe_customer.metadata
                    }
                    result.recommendations.append(f"Found Stripe customer but missing link in Firestore: {stripe_customer.id}")
            except Exception as e:
                pass
        
        # 4. Determine status and recommendations
        has_local = result.local_subscription is not None
        has_stripe = result.stripe_customer is not None
        has_active_stripe_sub = any(sub['status'] == 'active' for sub in result.stripe_subscriptions)
        
        if has_local and has_stripe and has_active_stripe_sub:
            result.status = "complete"
        elif has_stripe and has_active_stripe_sub and not has_local:
            result.status = "missing_local"
            result.recommendations.append("Has active Stripe subscription but missing local subscription record")
        elif has_local and not has_stripe:
            result.status = "missing_stripe"
            result.recommendations.append("Has local subscription but no Stripe customer found")
        elif not has_local and not has_stripe:
            result.status = "missing_all"
            result.recommendations.append("No subscription data found in either system")
        else:
            result.status = "mismatch"
            result.recommendations.append("Data exists but with inconsistencies")
        
        return result
        
    except Exception as e:
        result.status = "error"
        result.recommendations.append(f"Error during audit: {str(e)}")
        return result

@router.post("/audit-missing-users")
async def audit_missing_users(user: AuthorizedUser) -> BulkAuditResponse:
    """Audit all users known to have missing subscriptions"""
    verify_admin_access(user)
    
    missing_subscription_users = [
        "andreagm143@gmail.com",
        "testingtesting123@gmail.com", 
        "testintesting123123@gmail.com",
        "ansoldado@gmail.com",
        "edgar.grau.montero@gmail.com",
        "spamemilio608@gmail.com",
        "baybayitem@gmail.com",
        "erickgonzalo.gg@gmail.com",
        "coralede@fxzig.com"
    ]
    
    results = []
    stats = {
        "complete": 0,
        "missing_local": 0,
        "missing_stripe": 0,
        "mismatch": 0,
        "error": 0
    }
    
    for email in missing_subscription_users:
        result = await audit_single_user(email, user)
        results.append(result)
        
        if result.status in stats:
            stats[result.status] += 1
        else:
            stats["error"] += 1
    
    return BulkAuditResponse(
        total_users=len(missing_subscription_users),
        complete_records=stats["complete"],
        missing_local_subscriptions=stats["missing_local"],
        missing_stripe_data=stats["missing_stripe"],
        mismatched_data=stats["mismatch"],
        errors=stats["error"],
        users=results
    )

@router.post("/restore-subscription")
async def restore_subscription(request: SubscriptionRestoreRequest, user: AuthorizedUser) -> SubscriptionRestoreResponse:
    """Restore missing subscription record for a user"""
    verify_admin_access(user)
    
    try:
        # First audit the user to understand current state
        audit_result = await audit_single_user(request.user_email, user)
        
        if audit_result.status == "complete" and not request.force_restore:
            return SubscriptionRestoreResponse(
                success=False,
                message="User already has complete subscription data. Use force_restore=true to override.",
                subscription_data=audit_result.local_subscription
            )
        
        if not audit_result.user_id:
            return SubscriptionRestoreResponse(
                success=False,
                message="User not found in Firestore. Cannot restore subscription.",
                subscription_data=None
            )
        
        # Create subscription record
        sanitized_user_id = sanitize_storage_key(audit_result.user_id.replace('.', '_').replace('@', '_at_'))
        subscription_key = f"subscription.{sanitized_user_id}"
        
        subscription_data = {
            "user_id": audit_result.user_id,
            "subscription_type": request.subscription_type,
            "subscription_status": request.subscription_status,
            "restored_at": datetime.now(timezone.utc).isoformat(),
            "restored_by": user.sub,
            "restored_via": "admin_restoration",
            "original_audit": {
                "status": audit_result.status,
                "recommendations": audit_result.recommendations,
                "had_stripe_data": audit_result.stripe_customer is not None,
                "had_local_data": audit_result.local_subscription is not None
            }
        }
        
        # Add Stripe customer ID if available
        if audit_result.stripe_customer:
            subscription_data["stripe_customer_id"] = audit_result.stripe_customer["id"]
        
        # Store the subscription
        db.storage.json.put(subscription_key, subscription_data)
        
        pass
        
        return SubscriptionRestoreResponse(
            success=True,
            message=f"Successfully restored {request.subscription_type} subscription for {request.user_email}",
            subscription_data=subscription_data
        )
        
    except Exception as e:
        return SubscriptionRestoreResponse(
            success=False,
            message=f"Error restoring subscription: {str(e)}",
            subscription_data=None
        )
