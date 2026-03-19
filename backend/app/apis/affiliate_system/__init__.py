import stripe
import databutton as db
from fastapi import APIRouter, HTTPException, Query, Request, Depends
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from app.auth import AuthorizedUser
import firebase_admin
from firebase_admin import credentials, firestore
from app.libs.firebase_init import initialize_firebase
import json
import uuid
import re
from decimal import Decimal
import os

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/affiliate")

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# === DATA MODELS ===

class AffiliateRegistrationRequest(BaseModel):
    full_name: str
    email: EmailStr
    company_name: Optional[str] = None
    website_url: Optional[str] = None
    social_media_handles: Optional[Dict[str, str]] = None  # {"youtube": "...", "twitter": "..."}
    audience_size: Optional[int] = None
    audience_description: str
    marketing_experience: str  # "beginner", "intermediate", "expert"
    referral_method: str  # "content_creation", "direct_referral", "community", "other"
    motivation: str
    terms_accepted: bool

class AffiliateProfile(BaseModel):
    affiliate_id: str
    user_id: str
    full_name: str
    email: str
    company_name: Optional[str] = None
    website_url: Optional[str] = None
    social_media_handles: Optional[Dict[str, str]] = None
    audience_size: Optional[int] = None
    audience_description: str
    marketing_experience: str
    referral_method: str
    motivation: str
    status: str  # "pending", "approved", "rejected", "suspended"
    referral_code: str
    commission_rate_first_month: float = 0.20  # 20%
    commission_rate_recurring: float = 0.10     # 10%
    total_earnings: float = 0.0
    pending_earnings: float = 0.0
    paid_earnings: float = 0.0
    total_referrals: int = 0
    active_referrals: int = 0
    created_at: str
    updated_at: str
    approved_at: Optional[str] = None
    approved_by: Optional[str] = None

class ReferralRecord(BaseModel):
    referral_id: str
    affiliate_id: str
    referred_user_id: str
    referred_email: str
    referral_code: str
    status: str  # "pending", "converted", "cancelled"
    subscription_id: Optional[str] = None
    first_payment_amount: Optional[float] = None
    first_payment_date: Optional[str] = None
    first_commission_amount: Optional[float] = None
    first_commission_status: str = "pending"  # "pending", "paid", "cancelled"
    recurring_commission_total: float = 0.0
    last_payment_date: Optional[str] = None
    created_at: str
    converted_at: Optional[str] = None

class CommissionPayment(BaseModel):
    payment_id: str
    affiliate_id: str
    amount: float
    currency: str = "usd"
    payment_method: str  # "stripe_transfer", "manual"
    status: str  # "pending", "processing", "completed", "failed"
    stripe_transfer_id: Optional[str] = None
    referral_ids: List[str]  # Which referrals this payment covers
    created_at: str
    processed_at: Optional[str] = None
    notes: Optional[str] = None

class AffiliateAnalytics(BaseModel):
    affiliate_id: str
    period_start: str
    period_end: str
    total_clicks: int = 0
    total_signups: int = 0
    total_conversions: int = 0
    conversion_rate: float = 0.0
    total_revenue_generated: float = 0.0
    total_commissions_earned: float = 0.0
    active_subscribers: int = 0
    cancelled_subscribers: int = 0

# === REQUEST/RESPONSE MODELS ===

class AffiliateRegistrationResponse(BaseModel):
    success: bool
    message: str
    affiliate_id: Optional[str] = None
    status: str

class AffiliateProfileResponse(BaseModel):
    profile: AffiliateProfile
    analytics: AffiliateAnalytics
    recent_referrals: List[ReferralRecord]

class ReferralLinkRequest(BaseModel):
    campaign_name: Optional[str] = None
    custom_params: Optional[Dict[str, str]] = None

class ReferralLinkResponse(BaseModel):
    referral_url: str
    referral_code: str
    qr_code_url: Optional[str] = None

class CommissionPaymentRequest(BaseModel):
    affiliate_id: str
    amount: float
    payment_method: str = "stripe_transfer"
    notes: Optional[str] = None

# === HELPER FUNCTIONS ===

def generate_referral_code(full_name: str, email: str) -> str:
    """Generate a unique referral code based on user info"""
    # Create a readable code based on name + random suffix
    name_part = re.sub(r'[^a-zA-Z]', '', full_name.upper())[:6]
    if len(name_part) < 3:
        name_part = "TRADER"
    
    # Add random suffix to ensure uniqueness
    suffix = str(uuid.uuid4())[:4].upper()
    return f"{name_part}{suffix}"

def calculate_commission(amount: float, rate: float) -> float:
    """Calculate commission amount - now returns fixed $15 CPA"""
    # Fixed $15 commission per successful conversion
    return 15.00

def get_firestore_client():
    """Get Firestore client"""
    return firestore.client()

# === API ENDPOINTS ===

@router.get("/health")
def affiliate_system_health_check():
    """Health check for affiliate system"""
    try:
        # Test Firestore connection
        db_firestore = get_firestore_client()
        test_doc = db_firestore.collection("system_health").document("affiliate_test")
        test_doc.set({"last_check": datetime.utcnow().isoformat()}, merge=True)
        
        # Test Stripe connection
        stripe.Account.retrieve()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "components": {
                "firestore": "connected",
                "stripe": "connected",
                "storage": "available"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Affiliate system health check failed: {str(e)}")

@router.post("/register")
async def register_affiliate(
    request: AffiliateRegistrationRequest,
    user: AuthorizedUser
) -> AffiliateRegistrationResponse:
    """Register a new affiliate"""
    try:
        if not request.terms_accepted:
            raise HTTPException(status_code=400, detail="Terms and conditions must be accepted")
        
        # Check if user is already an affiliate
        db_firestore = get_firestore_client()
        existing_affiliate = db_firestore.collection("affiliates").where("user_id", "==", user.sub).get()
        
        if len(existing_affiliate) > 0:
            existing_data = existing_affiliate[0].to_dict()
            status = existing_data.get('status', 'unknown')
            if status == 'pending':
                raise HTTPException(status_code=400, detail="Application already submitted and pending review")
            elif status == 'approved':
                raise HTTPException(status_code=400, detail="User is already an approved affiliate")
            elif status == 'rejected':
                # Allow reapplication if previously rejected
                affiliate_id = existing_data['affiliate_id']
                pass
            else:
                raise HTTPException(status_code=400, detail="User already has an affiliate record")
        else:
            # Generate unique affiliate ID for new registration
            affiliate_id = str(uuid.uuid4())
        
        # Generate referral code
        referral_code = generate_referral_code(request.full_name, request.email)
        
        # Check referral code uniqueness
        while True:
            existing_code = db_firestore.collection("affiliates").where("referral_code", "==", referral_code).get()
            if len(existing_code) == 0:
                break
            referral_code = generate_referral_code(request.full_name, request.email)
        
        # Create affiliate profile
        affiliate_profile = AffiliateProfile(
            affiliate_id=affiliate_id,
            user_id=user.sub,
            full_name=request.full_name,
            email=request.email,
            company_name=request.company_name,
            website_url=request.website_url,
            social_media_handles=request.social_media_handles or {},
            audience_size=request.audience_size,
            audience_description=request.audience_description,
            marketing_experience=request.marketing_experience,
            referral_method=request.referral_method,
            motivation=request.motivation,
            status="pending",
            referral_code=referral_code,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat()
        )
        
        # Save to Firestore (use set with merge for reapplications)
        db_firestore.collection("affiliates").document(affiliate_id).set(affiliate_profile.dict(), merge=True)
        
        pass
        
        return AffiliateRegistrationResponse(
            success=True,
            message="Affiliate application submitted successfully. You will be notified once approved.",
            affiliate_id=affiliate_id,
            status="pending"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to register affiliate")

@router.get("/profile")
async def get_affiliate_profile(user: AuthorizedUser) -> AffiliateProfileResponse:
    """Get affiliate profile and analytics"""
    try:
        # Get affiliate profile
        db_firestore = get_firestore_client()
        affiliate_query = db_firestore.collection("affiliates").where(filter=firestore.FieldFilter("user_id", "==", user.sub)).get()
        
        if not affiliate_query or len(affiliate_query) == 0:
            raise HTTPException(status_code=404, detail="Affiliate profile not found")
        
        affiliate_doc = affiliate_query[0]
        profile_data = affiliate_doc.to_dict()
        profile = AffiliateProfile(**profile_data)
        
        # Try to get recent referrals, but handle index error gracefully
        recent_referrals = []
        try:
            recent_referrals_query = db_firestore.collection("referrals").where(
                "affiliate_id", "==", profile.affiliate_id
            ).order_by("created_at", direction=firestore.Query.DESCENDING).limit(10).get()
            
            for ref_doc in recent_referrals_query:
                ref_data = ref_doc.to_dict()
                recent_referrals.append(ReferralRecord(**ref_data))
        except Exception as e:
            pass
            # Continue without referrals - they're not critical for profile display
        
        # Calculate analytics for current month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        analytics = AffiliateAnalytics(
            affiliate_id=profile.affiliate_id,
            period_start=month_start.isoformat(),
            period_end=datetime.utcnow().isoformat(),
            total_signups=profile.total_referrals,
            total_conversions=profile.active_referrals,
            conversion_rate=profile.active_referrals / max(profile.total_referrals, 1) * 100,
            total_commissions_earned=profile.total_earnings,
            active_subscribers=profile.active_referrals
        )
        
        return AffiliateProfileResponse(
            profile=profile,
            analytics=analytics,
            recent_referrals=recent_referrals
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get affiliate profile")

@router.post("/generate-link")
async def generate_referral_link(
    request: ReferralLinkRequest,
    user: AuthorizedUser
) -> ReferralLinkResponse:
    """Generate a new referral link for affiliate"""
    try:
        # Get affiliate profile
        db_firestore = get_firestore_client()
        affiliate_query = db_firestore.collection("affiliates").where("user_id", "==", user.sub).get()
        
        if not affiliate_query:
            raise HTTPException(status_code=404, detail="Affiliate profile not found")
        
        affiliate_doc = affiliate_query[0]
        profile_data = affiliate_doc.to_dict()
        
        if profile_data["status"] != "approved":
            raise HTTPException(status_code=403, detail="Affiliate account not approved yet")
        
        referral_code = profile_data["referral_code"]
        
        # Build referral URL
        base_url = "https://www.tradingbait.com"
        referral_url = f"{base_url}?ref={referral_code}"
        
        # Add custom parameters if provided
        if request.custom_params:
            for key, value in request.custom_params.items():
                referral_url += f"&{key}={value}"
        
        return ReferralLinkResponse(
            referral_url=referral_url,
            referral_code=referral_code
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to generate referral link")

@router.get("/earnings")
async def get_affiliate_earnings(user: AuthorizedUser) -> Dict[str, Any]:
    """Get detailed earnings information for affiliate"""
    try:
        # Get affiliate profile
        db_firestore = get_firestore_client()
        affiliate_query = db_firestore.collection("affiliates").where("user_id", "==", user.sub).get()
        
        if not affiliate_query:
            raise HTTPException(status_code=404, detail="Affiliate profile not found")
        
        affiliate_doc = affiliate_query[0]
        profile_data = affiliate_doc.to_dict()
        affiliate_id = profile_data["affiliate_id"]
        
        # Get commission payments
        payments_query = db_firestore.collection("commission_payments").where(
            "affiliate_id", "==", affiliate_id
        ).order_by("created_at", direction=firestore.Query.DESCENDING).get()
        
        payments = []
        for payment_doc in payments_query:
            payment_data = payment_doc.to_dict()
            payments.append(CommissionPayment(**payment_data))
        
        # Calculate earnings summary
        total_paid = sum(p.amount for p in payments if p.status == "completed")
        total_pending = sum(p.amount for p in payments if p.status in ["pending", "processing"])
        
        return {
            "total_earnings": profile_data["total_earnings"],
            "pending_earnings": profile_data["pending_earnings"],
            "paid_earnings": profile_data["paid_earnings"],
            "payments": [p.dict() for p in payments],
            "summary": {
                "lifetime_earnings": profile_data["total_earnings"],
                "total_paid": total_paid,
                "total_pending": total_pending,
                "next_payment_date": "Monthly on the 1st"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get affiliate earnings")

# === REFERRAL TRACKING ENDPOINT ===

@router.post("/track-signup")
async def track_referral_signup(
    referred_user_id: str,
    referred_email: str,
    referral_code: Optional[str] = None
) -> Dict[str, Any]:
    """Track when a referred user signs up (called during user registration)"""
    try:
        if not referral_code:
            return {"success": True, "message": "No referral code provided"}
        
        # Find affiliate by referral code
        db_firestore = get_firestore_client()
        affiliate_query = db_firestore.collection("affiliates").where(
            filter=firestore.FieldFilter("referral_code", "==", referral_code)
        ).where(filter=firestore.FieldFilter("status", "==", "approved")).get()
        
        if not affiliate_query:
            pass
            return {"success": True, "message": "Invalid or inactive referral code"}
        
        affiliate_doc = affiliate_query[0]
        affiliate_data = affiliate_doc.to_dict()
        affiliate_id = affiliate_data["affiliate_id"]
        
        # Create referral record
        referral_id = str(uuid.uuid4())
        referral_record = ReferralRecord(
            referral_id=referral_id,
            affiliate_id=affiliate_id,
            referred_user_id=referred_user_id,
            referred_email=referred_email,
            referral_code=referral_code,
            status="pending",
            created_at=datetime.utcnow().isoformat()
        )
        
        # Save referral record
        db_firestore.collection("referrals").document(referral_id).set(referral_record.dict())
        
        # Update affiliate stats
        affiliate_ref = db_firestore.collection("affiliates").document(affiliate_data["affiliate_id"])
        affiliate_ref.update({
            "total_referrals": firestore.Increment(1),
            "updated_at": datetime.utcnow().isoformat()
        })
        
        pass
        
        return {
            "success": True,
            "message": "Referral tracked successfully",
            "referral_id": referral_id
        }
        
    except Exception as e:
        pass
        return {"success": False, "message": "Failed to track referral"}

@router.post("/track-conversion")
async def track_referral_conversion(
    user_id: str,
    subscription_id: str,
    payment_amount: float
) -> Dict[str, Any]:
    """Track when a referred user converts to paid subscription"""
    try:
        # Find referral record
        db_firestore = get_firestore_client()
        referral_query = db_firestore.collection("referrals").where(
            "referred_user_id", "==", user_id
        ).where("status", "==", "pending").get()
        
        if not referral_query:
            pass
            return {"success": True, "message": "No referral to convert"}
        
        referral_doc = referral_query[0]
        referral_data = referral_doc.to_dict()
        
        # Get affiliate info
        affiliate_doc = db_firestore.collection("affiliates").document(referral_data["affiliate_id"]).get()
        affiliate_data = affiliate_doc.to_dict()
        
        # Calculate first month commission
        commission_rate = affiliate_data["commission_rate_first_month"]
        commission_amount = calculate_commission(payment_amount, commission_rate)
        
        # Update referral record
        conversion_time = datetime.utcnow().isoformat()
        referral_ref = db_firestore.collection("referrals").document(referral_data["referral_id"])
        referral_ref.update({
            "status": "converted",
            "subscription_id": subscription_id,
            "first_payment_amount": payment_amount,
            "first_payment_date": conversion_time,
            "first_commission_amount": commission_amount,
            "converted_at": conversion_time
        })
        
        # Update affiliate earnings
        affiliate_ref = db_firestore.collection("affiliates").document(referral_data["affiliate_id"])
        affiliate_ref.update({
            "total_earnings": firestore.Increment(commission_amount),
            "pending_earnings": firestore.Increment(commission_amount),
            "active_referrals": firestore.Increment(1),
            "updated_at": datetime.utcnow().isoformat()
        })
        
        pass
        
        return {
            "success": True,
            "message": "Conversion tracked successfully",
            "commission_amount": commission_amount
        }
        
    except Exception as e:
        pass
        return {"success": False, "message": "Failed to track conversion"}
