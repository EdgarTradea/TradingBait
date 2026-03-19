import stripe
import databutton as db
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

router = APIRouter(prefix="/stripe")

class StripeConnectionResponse(BaseModel):
    connected: bool
    account_id: Optional[str] = None
    currency: Optional[str] = None
    
class CreateProductRequest(BaseModel):
    name: str
    price_cents: int
    currency: str = "usd"
    interval: str = "month"
    
class CreateProductResponse(BaseModel):
    product_id: str
    price_id: str
    amount: int
    currency: str
    interval: str

class CreateCheckoutRequest(BaseModel):
    customer_email: str
    success_url: str
    cancel_url: str
    referral_code: Optional[str] = None
    discount_code: Optional[str] = None
    include_pro_waitlist: Optional[bool] = False

class CreateCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    discount_applied: bool = False
    discount_amount: Optional[float] = None

class CreateTrialCheckoutRequest(BaseModel):
    customer_email: str
    success_url: str
    cancel_url: str
    discount_code: Optional[str] = None
    plan_name: str = "basic"  # Default to basic plan

class CreateTrialCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    discount_applied: bool = False
    discount_amount: Optional[float] = None

class CreateSubscriptionCheckoutRequest(BaseModel):
    customer_email: str
    success_url: str
    cancel_url: str
    plan_name: str
    discount_code: Optional[str] = None

class CreateSubscriptionCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    discount_applied: bool = False
    discount_amount: Optional[float] = None

@router.get("/health")
def check_stripe_connection() -> StripeConnectionResponse:
    """Test Stripe API connection"""
    try:
        # Try to retrieve account information
        account = stripe.Account.retrieve()
        return StripeConnectionResponse(
            connected=True,
            account_id=account.id,
            currency=account.default_currency
        )
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Stripe connection failed: {str(e)}")

@router.post("/create-product")
def create_stripe_product(request: CreateProductRequest) -> CreateProductResponse:
    """Create a Stripe product and price for subscriptions"""
    try:
        # Create product
        product = stripe.Product.create(
            name=request.name,
            description=f"TradingBait {request.name} subscription"
        )
        
        # Create recurring price
        price = stripe.Price.create(
            product=product.id,
            unit_amount=request.price_cents,
            currency=request.currency,
            recurring={"interval": request.interval}
        )
        
        pass
        
        return CreateProductResponse(
            product_id=product.id,
            price_id=price.id,
            amount=request.price_cents,
            currency=request.currency,
            interval=request.interval
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to create product: {str(e)}")

@router.get("/products")
def list_stripe_products() -> Dict[str, Any]:
    """List all Stripe products and prices"""
    try:
        products = stripe.Product.list(active=True, limit=10)
        prices = stripe.Price.list(active=True, limit=20)
        
        return {
            "products": [{
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "active": p.active
            } for p in products.data],
            "prices": [{
                "id": p.id,
                "product": p.product,
                "unit_amount": p.unit_amount,
                "currency": p.currency,
                "recurring": p.recurring
            } for p in prices.data]
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to list products: {str(e)}")

@router.post("/create-checkout")
def create_stripe_checkout(request: CreateCheckoutRequest) -> CreateCheckoutResponse:
    """Create a Stripe checkout session with dynamic discount support"""
    try:
        # Choose price based on Pro Waitlist selection
        if request.include_pro_waitlist:
            # Pro Waitlist bundle: $25.99/month (includes $1 waitlist fee)
            price_id = "price_1RrhPvGrJCCoKQYJSVFFy0PI"  # TradingBait Basic + Pro Waitlist $25.99/month
            base_amount = 25.99
            product_name = "TradingBait Basic + Pro Waitlist"
        else:
            # Regular subscription: $24.99/month
            price_id = "price_1RkVz1GrJCCoKQYJS8gdRe4B"  # TradingBait Pro $24.99/month
            base_amount = 24.99
            product_name = "TradingBait Basic"
        
        # Prepare line items
        line_items = [{
            "price": price_id,
            "quantity": 1
        }]
        
        # Handle discount codes
        discounts = []
        discount_applied = False
        discount_amount = None
        
        # Check for discount code first
        if request.discount_code:
            try:
                from app.apis.discount_management import apply_discount, ApplyDiscountRequest
                
                # Validate the discount code using the discount management system
                discount_request = ApplyDiscountRequest(
                    code=request.discount_code,
                    user_email=request.customer_email,
                    order_amount=base_amount
                )
                
                # Import the function directly to avoid circular imports
                import importlib
                discount_module = importlib.import_module("app.apis.discount_management")
                discount_response = discount_module.apply_discount(discount_request)
                
                if discount_response.valid and discount_response.stripe_coupon_id:
                    # Use the discount
                    discounts = [{"coupon": discount_response.stripe_coupon_id}]
                    discount_applied = True
                    discount_amount = discount_response.discount_amount
                    pass
                else:
                    pass
            except Exception as e:
                pass
        
        # Fallback to referral code if no discount code was applied
        elif request.referral_code:
            # First check if it's a custom discount code
            try:
                from app.apis.discount_management import apply_discount, ApplyDiscountRequest
                
                # Validate the discount code
                discount_request = ApplyDiscountRequest(
                    code=request.referral_code,
                    user_email=request.customer_email,
                    order_amount=base_amount  # Use dynamic base amount
                )
                
                # Import the function directly to avoid circular imports
                import importlib
                discount_module = importlib.import_module("app.apis.discount_management")
                discount_response = discount_module.apply_discount(discount_request)
                
                if discount_response.valid and discount_response.stripe_coupon_id:
                    # Use the custom discount
                    discounts = [{"coupon": discount_response.stripe_coupon_id}]
                    discount_applied = True
                    discount_amount = discount_response.discount_amount
                    pass
                else:
                    # Fall back to legacy 20% referral discount
                    coupon_id = "REFERRAL20"
                    try:
                        # Check if the coupon exists in Stripe
                        coupon = stripe.Coupon.retrieve(coupon_id)
                        discounts = [{"coupon": coupon_id}]
                        discount_applied = True
                        discount_amount = 20.0
                        pass
                    except Exception as coupon_error:
                        pass
                        # Create the referral coupon if it doesn't exist
                        try:
                            coupon = stripe.Coupon.create(
                                id=coupon_id,
                                percent_off=20,
                                duration="once",
                                name="Referral Discount 20%",
                                metadata={
                                    "created_by": "system",
                                    "type": "legacy_referral"
                                }
                            )
                            discounts = [{"coupon": coupon_id}]
                            discount_applied = True
                            discount_amount = 20.0
                            pass
                        except Exception as create_error:
                            pass
            except Exception as e:
                pass
                # Fall back to legacy 20% referral discount
                coupon_id = "REFERRAL20"
                try:
                    # Check if the coupon exists in Stripe
                    coupon = stripe.Coupon.retrieve(coupon_id)
                    discounts = [{"coupon": coupon_id}]
                    discount_applied = True
                    discount_amount = 20.0
                except Exception as e:
                    pass
                    # Create the referral coupon if it doesn't exist
                    try:
                        coupon = stripe.Coupon.create(
                            id=coupon_id,
                            percent_off=20,
                            duration="once",
                            name="Referral Discount 20%",
                            metadata={
                                "created_by": "system",
                                "type": "legacy_referral"
                            }
                        )
                        discounts = [{"coupon": coupon_id}]
                        discount_applied = True
                        discount_amount = 20.0
                    except Exception as e:
                        pass

        if request.discount_code:
            # Apply the discount code
            try:
                coupon = stripe.Coupon.retrieve(request.discount_code)
                discounts = [{"coupon": request.discount_code}]
                discount_applied = True
                discount_amount = coupon.percent_off
                pass
            except Exception as e:
                pass
        
        # Create checkout session
        session_params = {
            "payment_method_types": ["card"],
            "mode": "subscription",
            "line_items": line_items,
            "success_url": request.success_url,
            "cancel_url": request.cancel_url,
            "customer_email": request.customer_email,
            "metadata": {
                "referral_code": request.referral_code or "",
                "discount_applied": str(discount_applied),
                "product_name": product_name
            },
            "billing_address_collection": "auto"
        }
        
        if discounts:
            session_params["discounts"] = discounts
        
        session = stripe.checkout.Session.create(**session_params)
        
        pass
        
        return CreateCheckoutResponse(
            checkout_url=session.url,
            session_id=session.id,
            discount_applied=discount_applied,
            discount_amount=discount_amount
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")


@router.post("/create-subscription-checkout")
def create_subscription_checkout(request: CreateSubscriptionCheckoutRequest) -> CreateSubscriptionCheckoutResponse:
    """Create a Stripe checkout session for a direct subscription (no trial)"""
    try:
        # Map plan names to Stripe Price IDs
        price_ids = {
            "Enthusiast": "price_1RkVz1GrJCCoKQYJS8gdRe4B",  # Example Price ID
            "Professional": "price_1RkVz1GrJCCoKQYJS8gdRe4C", # Example Price ID
            "Elite": "price_1RkVz1GrJCCoKQYJS8gdRe4D" # Example Price ID
        }
        price_id = price_ids.get(request.plan_name)
        if not price_id:
            raise HTTPException(status_code=400, detail="Invalid plan name provided.")

        # Simplified base amount for discount logic, can be enhanced
        base_amount = {"Enthusiast": 49.00, "Professional": 99.00, "Elite": 199.00}.get(request.plan_name, 0)

        line_items = [{"price": price_id, "quantity": 1}]
        
        discounts = []
        discount_applied = False
        discount_amount = None

        if request.discount_code:
            try:
                from app.apis.discount_management import apply_discount, ApplyDiscountRequest
                import importlib
                discount_module = importlib.import_module("app.apis.discount_management")
                
                discount_request = ApplyDiscountRequest(
                    code=request.discount_code,
                    user_email=request.customer_email,
                    order_amount=base_amount
                )
                discount_response = discount_module.apply_discount(discount_request)
                
                if discount_response.valid and discount_response.stripe_coupon_id:
                    discounts = [{"coupon": discount_response.stripe_coupon_id}]
                    discount_applied = True
                    discount_amount = discount_response.discount_amount
            except Exception as e:
                pass

        session_params = {
            "payment_method_types": ["card"],
            "mode": "subscription",
            "line_items": line_items,
            "success_url": request.success_url,
            "cancel_url": request.cancel_url,
            "customer_email": request.customer_email,
            "metadata": {
                "plan_name": request.plan_name,
                "discount_code": request.discount_code or "",
                "discount_applied": str(discount_applied)
            },
            "billing_address_collection": "auto",
            "allow_promotion_codes": True
        }
        
        if discounts:
            session_params["discounts"] = discounts
        
        session = stripe.checkout.Session.create(**session_params)
        
        return CreateSubscriptionCheckoutResponse(
            checkout_url=session.url,
            session_id=session.id,
            discount_applied=discount_applied,
            discount_amount=discount_amount
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to create subscription checkout: {str(e)}")


@router.post("/create-trial-checkout")
def create_trial_checkout(request: CreateTrialCheckoutRequest) -> CreateTrialCheckoutResponse:
    """Create a Stripe checkout session for TradingBait at $7.99/month — no trial."""
    try:
        price_id = "price_1TCiR2GrJCCoKQYJPxcEKBuP"  # TradingBait $7.99/month
        base_amount = 7.99

        line_items = [{
            "price": price_id,
            "quantity": 1
        }]

        # Handle optional discount codes
        discounts = []
        discount_applied = False
        discount_amount = None

        if request.discount_code:
            try:
                import importlib
                discount_module = importlib.import_module("app.apis.discount_management")
                from app.apis.discount_management import ApplyDiscountRequest
                discount_request = ApplyDiscountRequest(
                    code=request.discount_code,
                    user_email=request.customer_email,
                    order_amount=base_amount
                )
                discount_response = discount_module.apply_discount(discount_request)
                if discount_response.valid and discount_response.stripe_coupon_id:
                    discounts = [{"coupon": discount_response.stripe_coupon_id}]
                    discount_applied = True
                    discount_amount = discount_response.discount_amount
                    pass
                else:
                    pass
            except Exception as e:
                pass

        session_params = {
            "payment_method_types": ["card"],
            "mode": "subscription",
            "line_items": line_items,
            "success_url": request.success_url,
            "cancel_url": request.cancel_url,
            "customer_email": request.customer_email,
            "metadata": {
                "plan_name": request.plan_name,
                "discount_code": request.discount_code or "",
                "discount_applied": str(discount_applied)
            },
            "billing_address_collection": "auto",
            "allow_promotion_codes": True
        }

        if discounts:
            session_params["discounts"] = discounts

        session = stripe.checkout.Session.create(**session_params)
        pass

        return CreateTrialCheckoutResponse(
            checkout_url=session.url,
            session_id=session.id,
            discount_applied=discount_applied,
            discount_amount=discount_amount
        )

    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")
