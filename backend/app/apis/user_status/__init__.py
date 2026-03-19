


from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.auth import AuthorizedUser
import databutton as db
from typing import Optional
import re
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase

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
        pass
        pass
        pass
        pass
        pass
        
        # CHROME DEBUGGING: Log additional auth context
        pass
        pass
        pass
        pass
        pass
        pass
        pass
        pass
        
        # Check if this is Valeria specifically
        if user_email == "valeriatorresal@gmail.com" or user_id == "anEsjUyGlzMeyajIe1D9HDaABMw1":
            pass
            pass
            pass
        
        pass
        
        # Check if user is admin - grant automatic access (check this first, before email)
        admin_user_ids = [
            "c5tjdjaLvSVY6XDsjVsDtyrwPg43",  # Edgar's production user ID
            "test-user-id",  # Development/test user ID
            "admin-user-id",  # Workspace admin user ID
            "admin-user"  # Current workspace user ID
        ]
        
        if user_id in admin_user_ids:
            pass
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
            pass
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
        try:
            initialize_firebase()
            db_firestore = firestore.client()
            user_doc = db_firestore.collection('users').document(user_id).get()
            user_data = user_doc.to_dict() if user_doc.exists else {}
            
            if user_doc.exists and user_data.get("subscription_status"):
                subscription_status = user_data.get("subscription_status")
                subscription_type = user_data.get("subscription_type", "professional")
                
                pass
                pass
                
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
                pass
                
        except Exception as storage_error:
            pass
        
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
        pass
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
