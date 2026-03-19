from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.auth import AuthorizedUser
import databutton as db
import re

router = APIRouter(prefix="/admin/early-access")

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# Admin verification
def verify_admin_access(user: AuthorizedUser):
    """Verify that the user has admin access"""
    admin_user_ids = [
        "c5tjdjaLvSVY6XDsjVsDtyrwPg43",  # Edgar's production user ID
        "test-user-id",  # Development/test user ID
        "admin-user-id",  # Workspace admin user ID
        "admin-user"  # Current workspace user ID
    ]
    pass
    pass
    if user.sub not in admin_user_ids:
        pass
        raise HTTPException(status_code=403, detail="Admin access required")

# === DATA MODELS ===

class EarlyAccessSignup(BaseModel):
    email: str
    signup_date: str
    confirmed: bool
    source: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None

class EarlyAccessStats(BaseModel):
    total_signups: int
    confirmed_signups: int
    confirmation_rate: float
    signups_today: int
    signups_this_week: int
    signups_this_month: int

class EarlyAccessResponse(BaseModel):
    signups: List[EarlyAccessSignup]
    stats: EarlyAccessStats
    total_count: int

# === ENDPOINTS ===

@router.get("/signups")
async def get_early_access_signups(
    user: AuthorizedUser
) -> EarlyAccessResponse:
    """Get all early access signups (admin only)"""
    verify_admin_access(user)
    
    try:
        # Get all early access signups from storage
        signups_data = []
        
        try:
            # List all early access files
            early_access_files = db.storage.json.list()
            early_access_keys = [f.name for f in early_access_files if f.name.startswith('early_access_email_')]
            
            for key in early_access_keys:
                try:
                    signup_data = db.storage.json.get(key)
                    if signup_data:
                        signups_data.append(EarlyAccessSignup(**signup_data))
                except Exception as e:
                    pass
                    continue
                    
        except Exception as e:
            pass
        
        # Calculate stats
        total_signups = len(signups_data)
        confirmed_signups = len([s for s in signups_data if s.confirmed])
        confirmation_rate = (confirmed_signups / total_signups * 100) if total_signups > 0 else 0
        
        # Calculate time-based stats
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)
        
        signups_today = 0
        signups_this_week = 0
        signups_this_month = 0
        
        for signup in signups_data:
            try:
                signup_date = datetime.fromisoformat(signup.signup_date.replace('Z', '+00:00'))
                if signup_date >= today_start:
                    signups_today += 1
                if signup_date >= week_start:
                    signups_this_week += 1
                if signup_date >= month_start:
                    signups_this_month += 1
            except Exception as e:
                pass
                continue
        
        stats = EarlyAccessStats(
            total_signups=total_signups,
            confirmed_signups=confirmed_signups,
            confirmation_rate=round(confirmation_rate, 1),
            signups_today=signups_today,
            signups_this_week=signups_this_week,
            signups_this_month=signups_this_month
        )
        
        # Sort signups by date (newest first)
        signups_data.sort(key=lambda x: x.signup_date, reverse=True)
        
        return EarlyAccessResponse(
            signups=signups_data,
            stats=stats,
            total_count=total_signups
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to fetch signups: {str(e)}")

@router.post("/export")
async def export_early_access_signups(
    user: AuthorizedUser
) -> Dict[str, Any]:
    """Export early access signups as CSV data (admin only)"""
    verify_admin_access(user)
    
    try:
        # Get signups data
        signups_response = await get_early_access_signups(user)
        signups = signups_response.signups
        
        # Generate CSV content
        csv_lines = ["Email,Signup Date,Confirmed,Source,User Agent"]
        
        for signup in signups:
            # Format the signup data for CSV
            email = signup.email.replace(',', ' ')
            signup_date = signup.signup_date
            confirmed = "Yes" if signup.confirmed else "No"
            source = (signup.source or "").replace(',', ' ')
            user_agent = (signup.user_agent or "").replace(',', ' ')
            
            csv_lines.append(f"{email},{signup_date},{confirmed},{source},{user_agent}")
        
        csv_content = "\n".join(csv_lines)
        
        return {
            "success": True,
            "csv_content": csv_content,
            "filename": f"early_access_signups_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
            "total_records": len(signups)
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to export signups: {str(e)}")

@router.post("/mark-confirmed/{email}")
async def mark_signup_confirmed(
    email: str,
    user: AuthorizedUser
) -> Dict[str, Any]:
    """Manually mark an email as confirmed (admin only)"""
    verify_admin_access(user)
    
    try:
        # Find the signup record
        # Convert email to the same format used in early_access_signup API
        sanitized_email = email.lower().strip().replace('@', '_at_').replace('.', '_dot_')
        storage_key = sanitize_storage_key(f"early_access_email_{sanitized_email}")
        
        try:
            signup_data = db.storage.json.get(storage_key)
            if not signup_data:
                raise HTTPException(status_code=404, detail="Signup not found")
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Signup not found")
        
        # Update confirmation status
        signup_data['confirmed'] = True
        signup_data['confirmed_by_admin'] = True
        signup_data['admin_confirmed_at'] = datetime.utcnow().isoformat() + 'Z'
        signup_data['admin_confirmed_by'] = user.sub
        
        # Save back to storage
        db.storage.json.put(storage_key, signup_data)
        
        return {
            "success": True,
            "message": f"Email {email} marked as confirmed",
            "email": email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to mark as confirmed: {str(e)}")
