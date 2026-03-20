import stripe
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from app.auth import AuthorizedUser
import uuid
import re
import os

# Initialize Firebase
initialize_firebase()

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

router = APIRouter(prefix="/discount-management")

# Admin verification
def verify_admin_access(user: AuthorizedUser):
    """Verify that the user has admin access"""
    admin_user_ids = [
        "c5tjdjaLvSVY6XDsjVsDtyrwPg43",  # Edgar's production user ID
        "test-user-id"  # Development/test user ID
    ]
    if user.sub not in admin_user_ids:
        raise HTTPException(status_code=403, detail="Admin access required")

# Pydantic Models
class DiscountType(str):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_TRIAL = "free_trial"

class DiscountCreateRequest(BaseModel):
    code: str = Field(..., min_length=3, max_length=50, description="Discount code (e.g., SAVE20)")
    name: str = Field(..., min_length=1, max_length=100, description="Display name for the discount")
    discount_type: str = Field(..., description="Type of discount: percentage, fixed_amount, or free_trial")
    value: float = Field(..., gt=0, description="Discount value (percentage or amount in dollars)")
    max_uses: Optional[int] = Field(None, ge=1, description="Maximum total uses (null for unlimited)")
    max_uses_per_user: Optional[int] = Field(1, ge=1, description="Maximum uses per user")
    expires_at: Optional[datetime] = Field(None, description="Expiration date (null for no expiration)")
    minimum_amount: Optional[float] = Field(None, ge=0, description="Minimum purchase amount required")
    description: Optional[str] = Field(None, max_length=500, description="Internal description")
    active: bool = Field(True, description="Whether the discount is active")

    @validator('code')
    def validate_code(cls, v):
        # Code should be uppercase alphanumeric with optional underscores/hyphens
        if not re.match(r'^[A-Z0-9_-]+$', v.upper()):
            raise ValueError('Code must contain only uppercase letters, numbers, underscores, and hyphens')
        return v.upper()

    @validator('discount_type')
    def validate_discount_type(cls, v):
        valid_types = ['percentage', 'fixed_amount', 'free_trial']
        if v not in valid_types:
            raise ValueError(f'Discount type must be one of: {valid_types}')
        return v

    @validator('value')
    def validate_value(cls, v, values):
        if 'discount_type' in values:
            if values['discount_type'] == 'percentage' and v > 100:
                raise ValueError('Percentage discount cannot exceed 100%')
            elif values['discount_type'] == 'fixed_amount' and v > 1000:
                raise ValueError('Fixed amount discount cannot exceed $1000')
            elif values['discount_type'] == 'free_trial' and v > 365:
                raise ValueError('Free trial cannot exceed 365 days')
        return v

class DiscountUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    max_uses: Optional[int] = Field(None, ge=1)
    max_uses_per_user: Optional[int] = Field(None, ge=1)
    expires_at: Optional[datetime] = None
    minimum_amount: Optional[float] = Field(None, ge=0)
    description: Optional[str] = Field(None, max_length=500)
    active: Optional[bool] = None

class DiscountDetails(BaseModel):
    id: str
    code: str
    name: str
    discount_type: str
    value: float
    max_uses: Optional[int]
    max_uses_per_user: int
    current_uses: int
    expires_at: Optional[datetime]
    minimum_amount: Optional[float]
    description: Optional[str]
    active: bool
    created_at: datetime
    created_by: str
    updated_at: Optional[datetime]
    updated_by: Optional[str]
    stripe_coupon_id: Optional[str]

class DiscountUsage(BaseModel):
    user_id: str
    user_email: Optional[str]
    used_at: datetime
    order_amount: float
    discount_amount: float
    stripe_session_id: Optional[str]

class DiscountAnalytics(BaseModel):
    total_discounts: int
    active_discounts: int
    total_uses: int
    total_savings: float
    total_revenue_impact: float
    top_performing_codes: List[Dict[str, Any]]
    usage_by_month: List[Dict[str, Any]]

class ApplyDiscountRequest(BaseModel):
    code: str
    user_email: str
    order_amount: Optional[float] = None

class ApplyDiscountResponse(BaseModel):
    valid: bool
    discount_amount: float
    discount_type: str
    message: str
    stripe_coupon_id: Optional[str] = None
    minimum_amount_required: Optional[float] = None

def _parse_discount_datetimes(discount_data: dict) -> dict:
    """Convert ISO string datetime fields back to datetime objects."""
    for field in ("expires_at", "created_at", "updated_at"):
        if discount_data.get(field):
            discount_data[field] = datetime.fromisoformat(discount_data[field])
    return discount_data

# API Endpoints
@router.get("/health")
def discount_health_check():
    """Health check endpoint for discount management"""
    return {"status": "healthy", "service": "discount_management"}

@router.post("/discounts")
def create_discount(request: DiscountCreateRequest, user: AuthorizedUser) -> DiscountDetails:
    """Create a new discount code (admin only)"""
    verify_admin_access(user)

    try:
        db_firestore = firestore.client()
        discount_id = str(uuid.uuid4())

        # Check if code already exists
        existing = db_firestore.collection("discount_codes").where(
            filter=firestore.FieldFilter("code", "==", request.code)
        ).stream()
        if any(existing):
            raise HTTPException(status_code=400, detail=f"Discount code '{request.code}' already exists")

        # Create Stripe coupon
        stripe_coupon_id = None
        try:
            if request.discount_type == "percentage":
                coupon = stripe.Coupon.create(
                    id=f"DISC_{request.code}_{discount_id[:8]}",
                    percent_off=request.value,
                    duration="once",
                    name=request.name,
                    metadata={
                        "discount_id": discount_id,
                        "created_by": user.sub,
                        "type": "tradingbait_discount"
                    }
                )
                stripe_coupon_id = coupon.id
            elif request.discount_type == "fixed_amount":
                amount_off_cents = int(request.value * 100)
                coupon = stripe.Coupon.create(
                    id=f"DISC_{request.code}_{discount_id[:8]}",
                    amount_off=amount_off_cents,
                    currency="usd",
                    duration="once",
                    name=request.name,
                    metadata={
                        "discount_id": discount_id,
                        "created_by": user.sub,
                        "type": "tradingbait_discount"
                    }
                )
                stripe_coupon_id = coupon.id
            # For free_trial, handled in checkout logic
        except Exception as e:
            pass

        # Create discount record
        now = datetime.now(timezone.utc)
        discount_data = {
            "id": discount_id,
            "code": request.code,
            "name": request.name,
            "discount_type": request.discount_type,
            "value": request.value,
            "max_uses": request.max_uses,
            "max_uses_per_user": request.max_uses_per_user,
            "current_uses": 0,
            "expires_at": request.expires_at.isoformat() if request.expires_at else None,
            "minimum_amount": request.minimum_amount,
            "description": request.description,
            "active": request.active,
            "created_at": now.isoformat(),
            "created_by": user.sub,
            "updated_at": None,
            "updated_by": None,
            "stripe_coupon_id": stripe_coupon_id
        }

        db_firestore.collection("discount_codes").document(discount_id).set(discount_data)

        return DiscountDetails(**_parse_discount_datetimes(dict(discount_data)))

    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to create discount: {str(e)}")

@router.get("/discounts")
def list_discounts(user: AuthorizedUser, active_only: bool = False) -> List[DiscountDetails]:
    """List all discount codes (admin only)"""
    verify_admin_access(user)

    try:
        db_firestore = firestore.client()

        query = db_firestore.collection("discount_codes")
        if active_only:
            query = query.where(filter=firestore.FieldFilter("active", "==", True))

        discounts = []
        for doc in query.stream():
            try:
                discount_data = doc.to_dict()
                if discount_data:
                    discount = DiscountDetails(**_parse_discount_datetimes(discount_data))
                    discounts.append(discount)
            except Exception as e:
                pass
                continue

        discounts.sort(key=lambda x: x.created_at, reverse=True)
        return discounts

    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to list discounts: {str(e)}")

@router.get("/discounts/{discount_id}")
def get_discount(discount_id: str, user: AuthorizedUser) -> DiscountDetails:
    """Get a specific discount by ID (admin only)"""
    verify_admin_access(user)

    try:
        db_firestore = firestore.client()
        doc = db_firestore.collection("discount_codes").document(discount_id).get()
        discount_data = doc.to_dict()

        if not discount_data:
            raise HTTPException(status_code=404, detail="Discount not found")

        return DiscountDetails(**_parse_discount_datetimes(discount_data))

    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to get discount: {str(e)}")

@router.put("/discounts/{discount_id}")
def update_discount(discount_id: str, request: DiscountUpdateRequest, user: AuthorizedUser) -> DiscountDetails:
    """Update a discount code (admin only)"""
    verify_admin_access(user)

    try:
        db_firestore = firestore.client()
        doc_ref = db_firestore.collection("discount_codes").document(discount_id)
        doc = doc_ref.get()
        discount_data = doc.to_dict()

        if not discount_data:
            raise HTTPException(status_code=404, detail="Discount not found")

        # Apply updates
        update_data = request.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "expires_at" and value:
                discount_data[field] = value.isoformat()
            else:
                discount_data[field] = value

        discount_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        discount_data["updated_by"] = user.sub

        doc_ref.set(discount_data)

        return DiscountDetails(**_parse_discount_datetimes(dict(discount_data)))

    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to update discount: {str(e)}")

@router.delete("/discounts/{discount_id}")
def delete_discount(discount_id: str, user: AuthorizedUser) -> Dict[str, Any]:
    """Delete a discount code (admin only)"""
    verify_admin_access(user)

    try:
        db_firestore = firestore.client()
        doc_ref = db_firestore.collection("discount_codes").document(discount_id)
        doc = doc_ref.get()
        discount_data = doc.to_dict()

        if not discount_data:
            raise HTTPException(status_code=404, detail="Discount not found")

        # Delete from Stripe if it exists
        if discount_data.get("stripe_coupon_id"):
            try:
                stripe.Coupon.delete(discount_data["stripe_coupon_id"])
            except Exception as e:
                pass

        # Soft-delete: archive to deleted collection
        deleted_id = f"{discount_id}_deleted_{int(datetime.now().timestamp())}"
        db_firestore.collection("discount_codes_deleted").document(deleted_id).set(discount_data)

        # Delete original
        doc_ref.delete()

        code = discount_data["code"]
        return {"success": True, "message": f"Discount '{code}' has been deleted"}

    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to delete discount: {str(e)}")

@router.post("/apply-discount")
def apply_discount(request: ApplyDiscountRequest) -> ApplyDiscountResponse:
    """Apply and validate a discount code for a customer"""
    try:
        db_firestore = firestore.client()

        # Find discount by code
        results = db_firestore.collection("discount_codes").where(
            filter=firestore.FieldFilter("code", "==", request.code.upper())
        ).stream()

        discount_data = None
        for doc in results:
            discount_data = doc.to_dict()
            break

        if not discount_data:
            return ApplyDiscountResponse(
                valid=False,
                discount_amount=0,
                discount_type="",
                message="Invalid discount code"
            )

        if not discount_data.get("active"):
            return ApplyDiscountResponse(
                valid=False,
                discount_amount=0,
                discount_type="",
                message="Discount code is not active"
            )

        # Check expiration
        if discount_data.get("expires_at"):
            expires_at = datetime.fromisoformat(discount_data["expires_at"])
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expires_at:
                return ApplyDiscountResponse(
                    valid=False,
                    discount_amount=0,
                    discount_type="",
                    message="Discount code has expired"
                )

        # Check maximum uses
        if discount_data.get("max_uses") and discount_data.get("current_uses", 0) >= discount_data["max_uses"]:
            return ApplyDiscountResponse(
                valid=False,
                discount_amount=0,
                discount_type="",
                message="Discount code has reached its usage limit"
            )

        # Check minimum amount
        if request.order_amount and discount_data.get("minimum_amount"):
            if request.order_amount < discount_data["minimum_amount"]:
                return ApplyDiscountResponse(
                    valid=False,
                    discount_amount=0,
                    discount_type="",
                    message=f"Minimum order amount of ${discount_data['minimum_amount']:.2f} required",
                    minimum_amount_required=discount_data["minimum_amount"]
                )

        # Calculate discount amount
        discount_amount = 0
        if request.order_amount:
            if discount_data["discount_type"] == "percentage":
                discount_amount = request.order_amount * (discount_data["value"] / 100)
            elif discount_data["discount_type"] == "fixed_amount":
                discount_amount = min(discount_data["value"], request.order_amount)

        return ApplyDiscountResponse(
            valid=True,
            discount_amount=discount_amount,
            discount_type=discount_data["discount_type"],
            message="Discount code is valid",
            stripe_coupon_id=discount_data.get("stripe_coupon_id")
        )

    except Exception as e:
        pass
        return ApplyDiscountResponse(
            valid=False,
            discount_amount=0,
            discount_type="",
            message="Error validating discount code"
        )

@router.get("/analytics")
def get_discount_analytics(user: AuthorizedUser) -> DiscountAnalytics:
    """Get discount usage analytics (admin only)"""
    verify_admin_access(user)

    try:
        db_firestore = firestore.client()

        total_discounts = 0
        active_discounts = 0
        total_uses = 0
        total_savings = 0
        total_revenue_impact = 0
        discount_performance = []

        for doc in db_firestore.collection("discount_codes").stream():
            try:
                discount_data = doc.to_dict()
                if not discount_data:
                    continue

                total_discounts += 1

                if discount_data.get("active"):
                    active_discounts += 1

                current_uses = discount_data.get("current_uses", 0)
                total_uses += current_uses

                discount_performance.append({
                    "code": discount_data.get("code", ""),
                    "name": discount_data.get("name", ""),
                    "uses": current_uses,
                    "type": discount_data.get("discount_type", ""),
                    "value": discount_data.get("value", 0)
                })

            except Exception as e:
                pass
                continue

        top_performing = sorted(discount_performance, key=lambda x: x["uses"], reverse=True)[:10]

        usage_by_month = [
            {"month": "2025-01", "uses": 0, "savings": 0},
            {"month": "2025-02", "uses": 0, "savings": 0},
            {"month": "2025-03", "uses": 0, "savings": 0}
        ]

        return DiscountAnalytics(
            total_discounts=total_discounts,
            active_discounts=active_discounts,
            total_uses=total_uses,
            total_savings=total_savings,
            total_revenue_impact=total_revenue_impact,
            top_performing_codes=top_performing,
            usage_by_month=usage_by_month
        )

    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")
