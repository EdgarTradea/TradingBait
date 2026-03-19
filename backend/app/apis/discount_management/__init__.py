import stripe
import databutton as db
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from app.auth import AuthorizedUser
import uuid
import re
import os

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

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

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

# Storage helpers
def get_discount_storage_key(discount_id: str) -> str:
    return f"discount.{sanitize_storage_key(discount_id)}"

def get_usage_storage_key(discount_id: str) -> str:
    return f"discount_usage.{sanitize_storage_key(discount_id)}"

def get_user_usage_storage_key(discount_id: str, user_id: str) -> str:
    sanitized_user = sanitize_storage_key(user_id.replace('.', '_').replace('@', '_at_'))
    return f"discount_user_usage.{sanitize_storage_key(discount_id)}.{sanitized_user}"

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
        # Generate unique ID
        discount_id = str(uuid.uuid4())
        
        # Check if code already exists
        try:
            existing_discounts = db.storage.json.get("discount_codes_index", default={})
            if request.code in existing_discounts:
                raise HTTPException(status_code=400, detail=f"Discount code '{request.code}' already exists")
        except Exception:
            existing_discounts = {}
        
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
                # Convert dollars to cents for Stripe
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
            # For free_trial, we'll handle it in the checkout logic
            
            pass
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
        
        # Store discount
        storage_key = get_discount_storage_key(discount_id)
        db.storage.json.put(storage_key, discount_data)
        
        # Update index
        existing_discounts[request.code] = discount_id
        db.storage.json.put("discount_codes_index", existing_discounts)
        
        pass
        
        return DiscountDetails(**discount_data)
        
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
        # Get discount index
        discount_index = db.storage.json.get("discount_codes_index", default={})
        
        discounts = []
        for code, discount_id in discount_index.items():
            try:
                storage_key = get_discount_storage_key(discount_id)
                discount_data = db.storage.json.get(storage_key)
                
                if discount_data:
                    # Convert datetime strings back to datetime objects
                    if discount_data.get("expires_at"):
                        discount_data["expires_at"] = datetime.fromisoformat(discount_data["expires_at"])
                    if discount_data.get("created_at"):
                        discount_data["created_at"] = datetime.fromisoformat(discount_data["created_at"])
                    if discount_data.get("updated_at"):
                        discount_data["updated_at"] = datetime.fromisoformat(discount_data["updated_at"])
                    
                    discount = DiscountDetails(**discount_data)
                    
                    # Filter by active status if requested
                    if not active_only or discount.active:
                        discounts.append(discount)
                        
            except Exception as e:
                pass
                continue
        
        # Sort by creation date (newest first)
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
        storage_key = get_discount_storage_key(discount_id)
        discount_data = db.storage.json.get(storage_key)
        
        if not discount_data:
            raise HTTPException(status_code=404, detail="Discount not found")
        
        # Convert datetime strings back to datetime objects
        if discount_data.get("expires_at"):
            discount_data["expires_at"] = datetime.fromisoformat(discount_data["expires_at"])
        if discount_data.get("created_at"):
            discount_data["created_at"] = datetime.fromisoformat(discount_data["created_at"])
        if discount_data.get("updated_at"):
            discount_data["updated_at"] = datetime.fromisoformat(discount_data["updated_at"])
        
        return DiscountDetails(**discount_data)
        
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
        storage_key = get_discount_storage_key(discount_id)
        discount_data = db.storage.json.get(storage_key)
        
        if not discount_data:
            raise HTTPException(status_code=404, detail="Discount not found")
        
        # Update fields that were provided
        update_data = request.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "expires_at" and value:
                discount_data[field] = value.isoformat()
            else:
                discount_data[field] = value
        
        # Update metadata
        discount_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        discount_data["updated_by"] = user.sub
        
        # Save updated discount
        db.storage.json.put(storage_key, discount_data)
        
        pass
        
        # Convert datetime strings back for response
        if discount_data.get("expires_at"):
            discount_data["expires_at"] = datetime.fromisoformat(discount_data["expires_at"])
        if discount_data.get("created_at"):
            discount_data["created_at"] = datetime.fromisoformat(discount_data["created_at"])
        if discount_data.get("updated_at"):
            discount_data["updated_at"] = datetime.fromisoformat(discount_data["updated_at"])
        
        return DiscountDetails(**discount_data)
        
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
        storage_key = get_discount_storage_key(discount_id)
        discount_data = db.storage.json.get(storage_key)
        
        if not discount_data:
            raise HTTPException(status_code=404, detail="Discount not found")
        
        # Delete from Stripe if it exists
        if discount_data.get("stripe_coupon_id"):
            try:
                stripe.Coupon.delete(discount_data["stripe_coupon_id"])
                pass
            except Exception as e:
                pass
        
        # Remove from index
        discount_index = db.storage.json.get("discount_codes_index", default={})
        code = discount_data["code"]
        if code in discount_index:
            del discount_index[code]
            db.storage.json.put("discount_codes_index", discount_index)
        
        # Delete discount data (we'll keep it with _deleted suffix for audit)
        deleted_key = f"{storage_key}_deleted_{int(datetime.now().timestamp())}"
        db.storage.json.put(deleted_key, discount_data)
        
        # Delete original
        try:
            # Try to delete the original storage entry
            storage_data = db.storage.json.get(storage_key)
            # Storage deletion handled by putting to deleted key above
        except FileNotFoundError:
            # This is expected - the file doesn't exist or was already deleted
            pass
        except Exception as delete_error:
            pass
            # Continue anyway as the main deletion was successful
        
        pass
        
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
        # Find discount by code
        discount_index = db.storage.json.get("discount_codes_index", default={})
        discount_id = discount_index.get(request.code.upper())
        
        if not discount_id:
            return ApplyDiscountResponse(
                valid=False,
                discount_amount=0,
                discount_type="",
                message="Invalid discount code"
            )
        
        # Get discount details
        storage_key = get_discount_storage_key(discount_id)
        discount_data = db.storage.json.get(storage_key)
        
        if not discount_data or not discount_data.get("active"):
            return ApplyDiscountResponse(
                valid=False,
                discount_amount=0,
                discount_type="",
                message="Discount code is not active"
            )
        
        # Check expiration
        if discount_data.get("expires_at"):
            expires_at = datetime.fromisoformat(discount_data["expires_at"])
            # Ensure both datetimes have timezone info for comparison
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
        
        # Check minimum amount (if order amount provided)
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
        # Get all discounts
        discount_index = db.storage.json.get("discount_codes_index", default={})
        
        total_discounts = len(discount_index)
        active_discounts = 0
        total_uses = 0
        total_savings = 0
        total_revenue_impact = 0
        
        discount_performance = []
        
        for code, discount_id in discount_index.items():
            try:
                storage_key = get_discount_storage_key(discount_id)
                discount_data = db.storage.json.get(storage_key)
                
                if discount_data:
                    if discount_data.get("active"):
                        active_discounts += 1
                    
                    current_uses = discount_data.get("current_uses", 0)
                    total_uses += current_uses
                    
                    # Calculate performance metrics
                    discount_performance.append({
                        "code": code,
                        "name": discount_data.get("name", ""),
                        "uses": current_uses,
                        "type": discount_data.get("discount_type", ""),
                        "value": discount_data.get("value", 0)
                    })
                    
            except Exception as e:
                pass
                continue
        
        # Sort by usage
        top_performing = sorted(discount_performance, key=lambda x: x["uses"], reverse=True)[:10]
        
        # Mock monthly usage data (would be calculated from actual usage logs)
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
