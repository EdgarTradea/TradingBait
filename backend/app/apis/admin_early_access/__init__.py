from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.auth import AuthorizedUser

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/admin/early-access")

# Admin verification
def verify_admin_access(user: AuthorizedUser):
    """Verify that the user has admin access"""
    admin_user_ids = [
        "c5tjdjaLvSVY6XDsjVsDtyrwPg43",  # Edgar's production user ID
        "test-user-id",  # Development/test user ID
        "admin-user-id",  # Workspace admin user ID
        "admin-user"  # Current workspace user ID
    ]
    if user.sub not in admin_user_ids:
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
async def get_early_access_signups(user: AuthorizedUser) -> EarlyAccessResponse:
    """Get all early access signups (admin only)"""
    verify_admin_access(user)

    try:
        db_firestore = firestore.client()
        signups_data = []

        for doc in db_firestore.collection("early_access").stream():
            try:
                data = doc.to_dict()
                if data:
                    signups_data.append(EarlyAccessSignup(**{
                        "email": data.get("email", doc.id),
                        "signup_date": data.get("signup_date", ""),
                        "confirmed": data.get("confirmed", False),
                        "source": data.get("source", ""),
                        "user_agent": data.get("user_agent"),
                        "ip_address": data.get("ip_address"),
                    }))
            except Exception as e:
                pass
                continue

        total_signups = len(signups_data)
        confirmed_signups = len([s for s in signups_data if s.confirmed])
        confirmation_rate = (confirmed_signups / total_signups * 100) if total_signups > 0 else 0

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
async def export_early_access_signups(user: AuthorizedUser) -> Dict[str, Any]:
    """Export early access signups as CSV data (admin only)"""
    verify_admin_access(user)

    try:
        signups_response = await get_early_access_signups(user)
        signups = signups_response.signups

        csv_lines = ["Email,Signup Date,Confirmed,Source,User Agent"]

        for signup in signups:
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
async def mark_signup_confirmed(email: str, user: AuthorizedUser) -> Dict[str, Any]:
    """Manually mark an email as confirmed (admin only)"""
    verify_admin_access(user)

    try:
        db_firestore = firestore.client()
        normalized_email = email.lower().strip()
        doc_ref = db_firestore.collection("early_access").document(normalized_email)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Signup not found")

        doc_ref.update({
            "confirmed": True,
            "confirmed_by_admin": True,
            "admin_confirmed_at": datetime.utcnow().isoformat() + 'Z',
            "admin_confirmed_by": user.sub
        })

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
