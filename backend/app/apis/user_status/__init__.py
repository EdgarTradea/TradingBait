


from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.auth import AuthorizedUser
import databutton as db
from typing import Optional
import re

router = APIRouter(prefix="/user-status")

class UserStatusResponse(BaseModel):
    has_access: bool
    status: str  # "subscribed", "no_subscription"
    subscription_active: bool = False
    access_reason: str  # Explanation of why user has/doesn't have access

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

@router.options("/check")
def options_user_status() -> JSONResponse:
    """Handle preflight CORS requests for user status check"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true"
        }
    )

@router.get("/check")
def check_user_status(user: AuthorizedUser, response: Response, _t: Optional[int] = None) -> JSONResponse:
    """Check if the authenticated user has an active subscription"""
    try:
        user_email = user.email
        user_id = user.sub
        
        # Enhanced logging for debugging Chrome-specific issues
        print(f"=== USER STATUS CHECK DEBUG ===")
        print(f"User email: {user_email or 'NO_EMAIL'}")
        print(f"User ID: {user_id}")
        print(f"User ID type: {type(user_id)}")
        print(f"User ID length: {len(user_id) if user_id else 0}")
        
        # CHROME DEBUGGING: Log additional auth context
        print(f"🔍 CHROME DEBUG - Auth context details:")
        print(f"   - User sub: {getattr(user, 'sub', 'NOT_SET')}")
        print(f"   - User email: {getattr(user, 'email', 'NOT_SET')}")
        print(f"   - User iss: {getattr(user, 'iss', 'NOT_SET')}")
        print(f"   - User aud: {getattr(user, 'aud', 'NOT_SET')}")
        print(f"   - User exp: {getattr(user, 'exp', 'NOT_SET')}")
        print(f"   - User iat: {getattr(user, 'iat', 'NOT_SET')}")
        print(f"   - Full user object: {user.__dict__ if hasattr(user, '__dict__') else 'No dict'}")
        
        # Check if this is Valeria specifically
        if user_email == "valeriatorresal@gmail.com" or user_id == "anEsjUyGlzMeyajIe1D9HDaABMw1":
            print(f"🔍 VALERIA DETECTED - Enhanced debugging enabled")
            print(f"Auth context - Sub: {user.sub}")
            print(f"Auth context - Email: {getattr(user, 'email', 'NOT_SET')}")
        
        print(f"Checking subscription for user: {user_email or 'no-email'} (ID: {user_id})")
        
        # Check if user is admin - grant automatic access (check this first, before email)
        admin_user_ids = [
            "c5tjdjaLvSVY6XDsjVsDtyrwPg43",  # Edgar's production user ID
            "test-user-id",  # Development/test user ID
            "admin-user-id",  # Workspace admin user ID
            "admin-user"  # Current workspace user ID
        ]
        
        if user_id in admin_user_ids:
            print("Admin user detected - granting automatic access")
            user_status = UserStatusResponse(
                has_access=True,
                status="admin_access",
                subscription_active=True,
                access_reason="Administrator - automatic access granted"
            )
            return JSONResponse(
                content=user_status.dict(),
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Credentials": "true"
                }
            )
        
        if not user_email:
            print(f"❌ No email found for user ID: {user_id}")
            user_status = UserStatusResponse(
                has_access=False,
                status="no_subscription",
                access_reason="No email found for user"
            )
            return JSONResponse(
                content=user_status.dict(),
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Credentials": "true"
                }
            )
        
        # Check for active subscription
        print(f"Building storage key for user ID: {user_id}")
        sanitized_user_id = sanitize_storage_key(user_id.replace('.', '_').replace('@', '_at_'))
        subscription_key = f"subscription.{sanitized_user_id}"
        print(f"Storage key: {subscription_key}")
        
        try:
            print(f"Attempting to retrieve subscription data...")
            subscription_data = db.storage.json.get(subscription_key)
            
            if subscription_data:
                subscription_status = subscription_data.get("subscription_status")
                subscription_type = subscription_data.get("subscription_type")
                
                print(f"✅ Found subscription - Type: {subscription_type}, Status: {subscription_status}")
                print(f"Full subscription data: {subscription_data}")
                
                # Check if subscription is active
                if subscription_status in ["active", "trialing"]:
                    user_status = UserStatusResponse(
                        has_access=True,
                        status="subscribed",
                        subscription_active=True,
                        access_reason=f"Active {subscription_type} subscription"
                    )
                    return JSONResponse(
                        content=user_status.dict(),
                        headers={
                            "Cache-Control": "no-cache, no-store, must-revalidate",
                            "Pragma": "no-cache",
                            "Expires": "0",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                            "Access-Control-Allow-Headers": "*",
                            "Access-Control-Allow-Credentials": "true"
                        }
                    )
                else:
                    user_status = UserStatusResponse(
                        has_access=False,
                        status="no_subscription",
                        access_reason=f"Subscription status: {subscription_status}"
                    )
                    return JSONResponse(
                        content=user_status.dict(),
                        headers={
                            "Cache-Control": "no-cache, no-store, must-revalidate",
                            "Pragma": "no-cache",
                            "Expires": "0",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                            "Access-Control-Allow-Headers": "*",
                            "Access-Control-Allow-Credentials": "true"
                        }
                    )
            else:
                print(f"❌ No subscription data found for key: {subscription_key}")
                
        except Exception as storage_error:
            print(f"❌ Error accessing subscription storage: {storage_error}")
        
        # If no subscription found, return access denied
        user_status = UserStatusResponse(
            has_access=False,
            status="no_subscription",
            access_reason="No active subscription found"
        )
        return JSONResponse(
            content=user_status.dict(),
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true"
            }
        )
        
    except Exception as e:
        print(f"❌ Error in check_user_status: {e}")
        error_status = UserStatusResponse(
            has_access=False,
            status="error",
            access_reason=f"Error checking subscription: {str(e)}"
        )
        return JSONResponse(
            content=error_status.dict(),
            status_code=500,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true"
            }
        )
