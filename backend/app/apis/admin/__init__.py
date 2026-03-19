from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import databutton as db
from app.auth import AuthorizedUser
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from app.libs.firebase_init import initialize_firebase
import re
import json
import os

# Initialize Firebase
initialize_firebase()

router = APIRouter()

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
    
    # Also allow admin access based on email for anquimera@gmail.com
    admin_emails = [
        "anquimera@gmail.com",
        "grau.edgar@protonmail.com"  # Current workspace user email
    ]
    
    print(f"Admin check - Current user ID: {user.sub}")
    print(f"Admin check - User email: {getattr(user, 'email', 'unknown')}")
    
    user_email = getattr(user, 'email', '')
    
    # Check both user ID and email patterns
    if user.sub not in admin_user_ids and user_email not in admin_emails and user.sub not in admin_emails:
        print(f"Access denied - User {user.sub} with email {user_email} is not in admin list")
        raise HTTPException(status_code=403, detail="Admin access required")
    print(f"Admin access granted to user {user.sub} with email {user_email}")

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

class SubscriptionManagementRequest(BaseModel):
    user_id: str
    subscription_type: str
    subscription_status: str
    subscription_notes: Optional[str] = None

class SubscriptionManagementResponse(BaseModel):
    success: bool
    message: str

class UserAccessSummary(BaseModel):
    user_id: str
    email: str
    name: str
    access_status: str
    granted_at: Optional[str] = None
    last_login: Optional[str] = None
    access_expires: Optional[str] = None
    application_id: Optional[str] = None
    granted_by: Optional[str] = None
    revoked_by: Optional[str] = None
    revoked_at: Optional[str] = None
    admin_notes: Optional[str] = None
    subscription_type: str = "free"
    subscription_status: str = "active"

@router.get("/admin/test")
def test_admin(user: AuthorizedUser):
    verify_admin_access(user)
    return {"message": "Admin API is working", "user_id": user.sub, "isAdmin": True}

@router.get("/admin/users")
def list_all_users(page: int = 1, limit: int = 50, user: AuthorizedUser = None) -> List[UserAccessSummary]:
    """List all users with pagination (admin only)"""
    if user:
        verify_admin_access(user)
    
    try:
        print(f"Loading users for admin dashboard (page {page}, limit {limit})")
        
        # Get Firebase users
        firebase_users = []
        result = firebase_auth.list_users(max_results=min(limit, 1000))
        firebase_users.extend(result.users)
        
        print(f"Found {len(firebase_users)} Firebase users")
        
        # Process Firebase users
        users = []
        for firebase_user in firebase_users:
            user_id = firebase_user.uid
            user_email = firebase_user.email or ""
            user_name = firebase_user.display_name or ""
            
            # Safe timestamp processing with proper type handling
            creation_date = "Unknown"
            last_login = "Never"
            
            try:
                if firebase_user.user_metadata.creation_timestamp:
                    timestamp = firebase_user.user_metadata.creation_timestamp
                    # Handle both datetime objects and Unix timestamps (int/float)
                    if hasattr(timestamp, 'strftime'):
                        creation_date = timestamp.strftime("%Y-%m-%d")
                    elif isinstance(timestamp, (int, float)):
                        from datetime import datetime
                        # Firebase timestamps might be in milliseconds, convert to seconds if needed
                        if timestamp > 10000000000:  # If timestamp is likely in milliseconds
                            timestamp = timestamp / 1000
                        try:
                            creation_date = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
                        except (ValueError, OSError) as ts_error:
                            print(f"Invalid timestamp {timestamp} for user {user_id}: {ts_error}")
                            creation_date = "Invalid"
                    else:
                        creation_date = str(timestamp)[:10]  # Fallback to string conversion
                        
                if firebase_user.user_metadata.last_sign_in_timestamp:
                    timestamp = firebase_user.user_metadata.last_sign_in_timestamp
                    # Handle both datetime objects and Unix timestamps (int/float)
                    if hasattr(timestamp, 'strftime'):
                        last_login = timestamp.strftime("%Y-%m-%d")
                    elif isinstance(timestamp, (int, float)):
                        from datetime import datetime
                        # Firebase timestamps might be in milliseconds, convert to seconds if needed
                        if timestamp > 10000000000:  # If timestamp is likely in milliseconds
                            timestamp = timestamp / 1000
                        try:
                            last_login = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
                        except (ValueError, OSError) as ts_error:
                            print(f"Invalid timestamp {timestamp} for user {user_id}: {ts_error}")
                            last_login = "Invalid"
                    else:
                        last_login = str(timestamp)[:10]  # Fallback to string conversion
                        
            except Exception as e:
                print(f"Error processing timestamps for {user_id}: {e}")
                print(f"Timestamp types - creation: {type(firebase_user.user_metadata.creation_timestamp) if firebase_user.user_metadata.creation_timestamp else 'None'}, last_login: {type(firebase_user.user_metadata.last_sign_in_timestamp) if firebase_user.user_metadata.last_sign_in_timestamp else 'None'}")
            
            # Check for subscription data - FIXED LOGIC
            subscription_type = "none"  # Default to "none" instead of "free"
            subscription_status = "no_subscription"  # Default to "no_subscription"
            subscription_granted_by = None
            
            try:
                sanitized_user_id = sanitize_storage_key(user_id.replace('.', '_').replace('@', '_at_'))
                subscription_key = f"subscription.{sanitized_user_id}"
                subscription_data = db.storage.json.get(subscription_key)
                if subscription_data:
                    # User has an actual subscription record
                    subscription_type = subscription_data.get("subscription_type", "unknown")
                    subscription_status = subscription_data.get("subscription_status", "unknown")
                    subscription_granted_by = subscription_data.get("granted_by")
                    print(f"Found subscription for {user_email}: {subscription_type} - {subscription_status}")
                else:
                    # No subscription record found - user has no subscription
                    print(f"No subscription record for {user_email} - showing as no subscription")
            except Exception as e:
                # No subscription found - this is normal for users without subscriptions
                print(f"No subscription found for {user_email}: {e}")
                # Keep defaults: subscription_type = "none", subscription_status = "no_subscription"
            
            # Create user summary
            user_summary = UserAccessSummary(
                user_id=user_id,
                email=user_email,
                name=user_name or "Unknown",
                access_status="active" if not firebase_user.disabled else "suspended",
                granted_at=creation_date,
                last_login=last_login,
                access_expires=None,
                application_id=None,
                granted_by=subscription_granted_by or "firebase",
                revoked_by=None,
                revoked_at=None,
                admin_notes=f"Firebase user - Email verified: {firebase_user.email_verified}",
                subscription_type=subscription_type,
                subscription_status=subscription_status
            )
            
            users.append(user_summary)
        
        print(f"Processed {len(users)} users for admin dashboard")
        return users
        
    except Exception as e:
        print(f"Error in list_all_users: {e}")
        # Return minimal fallback data
        return [
            UserAccessSummary(
                user_id="c5tjdjaLvSVY6XDsjVsDtyrwPg43",
                email="edgartradea@gmail.com",
                name="Edgar Grau",
                access_status="active",
                granted_at="2025-06-18",
                last_login="2025-07-02",
                access_expires=None,
                application_id=None,
                granted_by="system",
                revoked_by=None,
                revoked_at=None,
                admin_notes="Admin user - API error fallback",
                subscription_type="free",
                subscription_status="active"
            )
        ]

@router.post("/admin/grant-subscription")
def grant_subscription(request: SubscriptionManagementRequest, user: AuthorizedUser) -> SubscriptionManagementResponse:
    """Grant subscription access to a user (admin only)"""
    verify_admin_access(user)
    
    try:
        # Sanitize user ID for storage key
        sanitized_user_id = sanitize_storage_key(request.user_id.replace('.', '_').replace('@', '_at_'))
        subscription_key = f"subscription.{sanitized_user_id}"
        
        # Fetch user email from Firebase
        user_email = None
        try:
            db_firestore = firestore.client()
            user_doc = db_firestore.collection('users').document(request.user_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                user_email = user_data.get('email')
            
            # If not found in Firestore, try to get from Firebase Auth
            if not user_email:
                from firebase_admin import auth
                try:
                    user_record = auth.get_user(request.user_id)
                    user_email = user_record.email
                except Exception as e:
                    print(f"Could not fetch user email from Firebase Auth: {e}")
        except Exception as e:
            print(f"Error fetching user email: {e}")
        
        # Prepare subscription data
        subscription_data = {
            "user_id": request.user_id,
            "email": user_email,  # Add email to subscription record
            "subscription_type": request.subscription_type,
            "subscription_status": request.subscription_status,
            "granted_at": datetime.now(timezone.utc).isoformat(),
            "granted_by": user.sub,
            "notes": request.subscription_notes or "",
            "activated_via": "admin_grant"
        }
        
        # Store subscription data
        db.storage.json.put(subscription_key, subscription_data)
        
        email_info = f" (email: {user_email})" if user_email else " (email not found)"
        print(f"Admin {user.sub} granted {request.subscription_type} subscription to user {request.user_id}{email_info}")
        
        return SubscriptionManagementResponse(
            success=True,
            message=f"Successfully granted {request.subscription_type} subscription to user"
        )
        
    except Exception as e:
        print(f"Error granting subscription: {e}")
        return SubscriptionManagementResponse(
            success=False,
            message=f"Failed to grant subscription: {str(e)}"
        )

@router.post("/admin/revoke-subscription")
def revoke_subscription(request: SubscriptionManagementRequest, user: AuthorizedUser) -> SubscriptionManagementResponse:
    """Revoke subscription access from a user (admin only)"""
    verify_admin_access(user)
    
    try:
        # Sanitize user ID for storage key
        sanitized_user_id = sanitize_storage_key(request.user_id.replace('.', '_').replace('@', '_at_'))
        subscription_key = f"subscription.{sanitized_user_id}"
        
        # Prepare revoked subscription data
        subscription_data = {
            "user_id": request.user_id,
            "subscription_type": request.subscription_type,
            "subscription_status": request.subscription_status,
            "revoked_at": datetime.now(timezone.utc).isoformat(),
            "revoked_by": user.sub,
            "notes": request.subscription_notes or ""
        }
        
        # Store revoked subscription data
        db.storage.json.put(subscription_key, subscription_data)
        
        print(f"Admin {user.sub} revoked subscription from user {request.user_id}")
        
        return SubscriptionManagementResponse(
            success=True,
            message=f"Successfully revoked subscription from user"
        )
        
    except Exception as e:
        print(f"Error revoking subscription: {e}")
        return SubscriptionManagementResponse(
            success=False,
            message=f"Failed to revoke subscription: {str(e)}"
        )
