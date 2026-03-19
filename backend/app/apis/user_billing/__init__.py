import stripe
import databutton as db
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.auth import AuthorizedUser
import firebase_admin
from firebase_admin import credentials, firestore
from app.libs.firebase_init import initialize_firebase
import json
import os

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/user-billing")

# Pydantic models
class SubscriptionDetails(BaseModel):
    id: str
    status: str
    current_period_start: int
    current_period_end: int
    cancel_at_period_end: bool
    product_name: str
    price_amount: int
    currency: str
    interval: str
    created: int
    next_payment_date: Optional[int] = None

class PaymentMethod(BaseModel):
    id: str
    type: str
    card_brand: Optional[str] = None
    card_last4: Optional[str] = None
    card_exp_month: Optional[int] = None
    card_exp_year: Optional[int] = None
    is_default: bool

class BillingHistory(BaseModel):
    id: str
    amount: int
    currency: str
    status: str
    created: int
    description: str
    invoice_pdf: Optional[str] = None
    receipt_url: Optional[str] = None

class UserBillingInfo(BaseModel):
    customer_id: Optional[str] = None
    subscription: Optional[SubscriptionDetails] = None
    payment_methods: List[PaymentMethod] = []
    billing_history: List[BillingHistory] = []
    customer_portal_url: Optional[str] = None
    total_spent: int = 0

class CustomerPortalResponse(BaseModel):
    url: str

class UsageInfo(BaseModel):
    trades_count: int
    trades_limit: Optional[int] = None
    journal_entries_count: int
    ai_insights_used: int
    ai_insights_limit: Optional[int] = None
    plan_name: str
    features: List[str] = []

# Add helper function for affiliate tracking
async def track_affiliate_conversion_for_payment(user_id: str, subscription_id: str, amount_cents: int):
    """Track affiliate conversion when user makes first payment"""
    try:
        # Import here to avoid circular imports
        from app.apis.affiliate_system import track_referral_conversion
        
        amount_dollars = amount_cents / 100.0
        result = await track_referral_conversion(
            user_id=user_id,
            subscription_id=subscription_id,
            payment_amount=amount_dollars
        )
        
        if result.get("success"):
            print(f"Affiliate conversion tracked: ${amount_dollars} -> ${result.get('commission_amount', 0)} commission")
        
    except Exception as e:
        print(f"Failed to track affiliate conversion: {e}")
        # Don't fail the payment if affiliate tracking fails

@router.get("/info")
async def get_user_billing_info(user: AuthorizedUser) -> UserBillingInfo:
    """Get comprehensive billing information for the current user"""
    try:
        print(f"Getting billing info for user: {user.sub}")

        # Get user's Stripe customer from Firestore or email
        db_firestore = firestore.client()
        user_doc_ref = db_firestore.collection("users").document(user.sub)
        user_doc = user_doc_ref.get()

        customer_id = None
        if user_doc.exists:
            user_data = user_doc.to_dict()
            customer_id = user_data.get('stripe_customer_id')

        # If no customer ID, try to find by email
        if not customer_id and hasattr(user, 'email') and user.email:
            customers = stripe.Customer.list(email=user.email, limit=1)
            if customers.data:
                customer_id = customers.data[0].id
                # Store customer ID in Firestore
                user_doc_ref.set({'stripe_customer_id': customer_id}, merge=True)

        billing_info = UserBillingInfo(customer_id=customer_id)

        if not customer_id:
            print(f"No Stripe customer found for user {user.sub}")
            return billing_info

        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)

        # Get subscription details
        subscriptions = stripe.Subscription.list(customer=customer_id, status='all', limit=1)
        if subscriptions.data:
            subscription = subscriptions.data[0]
            price = subscription['items']['data'][0]['price']
            product = stripe.Product.retrieve(price.product)

            billing_info.subscription = SubscriptionDetails(
                id=subscription.id,
                status=subscription.status,
                current_period_start=subscription.current_period_start,
                current_period_end=subscription.current_period_end,
                cancel_at_period_end=subscription.cancel_at_period_end,
                product_name=product.name,
                price_amount=price.unit_amount,
                currency=price.currency,
                interval=price.recurring.interval,
                created=subscription.created,
                next_payment_date=subscription.current_period_end if subscription.status == 'active' else None
            )

        # Get payment methods
        payment_methods = stripe.PaymentMethod.list(customer=customer_id, type='card')
        for pm in payment_methods.data:
            billing_info.payment_methods.append(PaymentMethod(
                id=pm.id,
                type=pm.type,
                card_brand=pm.card.brand if pm.card else None,
                card_last4=pm.card.last4 if pm.card else None,
                card_exp_month=pm.card.exp_month if pm.card else None,
                card_exp_year=pm.card.exp_year if pm.card else None,
                is_default=pm.id == customer.invoice_settings.default_payment_method
            ))

        # Get billing history (invoices)
        invoices = stripe.Invoice.list(customer=customer_id, limit=10)
        total_spent = 0
        for invoice in invoices.data:
            if invoice.status == 'paid':
                total_spent += invoice.amount_paid
                billing_info.billing_history.append(BillingHistory(
                    id=invoice.id,
                    amount=invoice.amount_paid,
                    currency=invoice.currency,
                    status=invoice.status,
                    created=invoice.created,
                    description=invoice.description or f"Subscription payment",
                    invoice_pdf=invoice.invoice_pdf,
                    receipt_url=invoice.hosted_invoice_url
                ))

        billing_info.total_spent = total_spent

        print(f"Successfully retrieved billing info for user {user.sub}")
        return billing_info

    except Exception as e:
        print(f"Error getting billing info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve billing information: {str(e)}")

@router.get("/customer-portal")
async def get_customer_portal_url(user: AuthorizedUser) -> CustomerPortalResponse:
    """Create and return Stripe Customer Portal URL for subscription management"""
    try:
        print(f"Creating customer portal URL for user: {user.sub}")

        # Get user's Stripe customer ID
        db_firestore = firestore.client()
        user_doc_ref = db_firestore.collection("users").document(user.sub)
        user_doc = user_doc_ref.get()

        customer_id = None
        if user_doc.exists:
            user_data = user_doc.to_dict()
            customer_id = user_data.get('stripe_customer_id')

        if not customer_id:
            raise HTTPException(status_code=404, detail="No subscription found")

        # Create customer portal session
        # Use correct return URL based on environment
        if mode == Mode.DEV:
            return_url = 'https://riff.new/_projects/47e89438-adfe-4372-b617-66a3eabfadfe/dbtn/devx/ui/settings'
        else:
            return_url = 'https://www.tradingbait.com/settings'
            
        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )

        print(f"Created customer portal URL: {portal_session.url}")
        return CustomerPortalResponse(url=portal_session.url)

    except Exception as e:
        print(f"Error creating customer portal: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create customer portal: {str(e)}")

@router.get("/usage")
async def get_usage_info(user: AuthorizedUser) -> UsageInfo:
    """Get current usage statistics and limits for the user"""
    try:
        print(f"Getting usage info for user: {user.sub}")

        db_firestore = firestore.client()

        # Count trades from all evaluations
        all_trades = []
        evaluations_ref = db_firestore.collection(f"users/{user.sub}/evaluations")
        evaluations = evaluations_ref.stream()
        
        for evaluation_doc in evaluations:
            evaluation_id = evaluation_doc.id
            trades_ref = db_firestore.collection(f"users/{user.sub}/evaluations/{evaluation_id}/trades")
            trades_docs = list(trades_ref.stream())
            all_trades.extend(trades_docs)
        
        trades_count = len(all_trades)

        # Count journal entries 
        journals_collection = db_firestore.collection(f"users/{user.sub}/journal_entries")
        journal_entries_count = len(list(journals_collection.stream()))

        # Get subscription info to determine plan
        billing_info = await get_user_billing_info(user)
        print(f"Retrieved billing info - has subscription: {billing_info.subscription is not None}")
        
        # Default plan is $24.99/month TradingBait subscription
        plan_name = "TradingBait Pro ($24.99/month)"
        features = [
            "Unlimited Trades", 
            "AI-Powered Insights", 
            "Advanced Analytics", 
            "Trading Journal",
            "Performance Tracking",
            "Risk Management Tools",
            "Platform Integrations",
            "Email Support"
        ]
        trades_limit = None  # Unlimited
        ai_insights_limit = None  # Unlimited
        
        # Check subscription status
        if billing_info.subscription:
            print(f"Subscription details - Product: {billing_info.subscription.product_name}, Price: {billing_info.subscription.price_amount}, Status: {billing_info.subscription.status}")
            
            # Verify it's the correct $24.99 subscription (or legacy $49.99)
            if billing_info.subscription.price_amount == 2499 and billing_info.subscription.status == 'active':
                plan_name = "TradingBait Pro ($24.99/month)"
            elif billing_info.subscription.price_amount == 4999 and billing_info.subscription.status == 'active':
                plan_name = "TradingBait Pro (Legacy $49.99/month)"
            else:
                plan_name = f"Unknown Plan (${billing_info.subscription.price_amount/100:.2f}/{billing_info.subscription.interval})"
        else:
            print(f"Warning: User {user.sub} has no active subscription")
            plan_name = "No Active Subscription"
            features = ["Limited Access - Subscription Required"]

        # For now, set AI insights used to 0 (we'll track this later)
        ai_insights_used = 0

        return UsageInfo(
            trades_count=trades_count,
            trades_limit=trades_limit,
            journal_entries_count=journal_entries_count,
            ai_insights_used=ai_insights_used,
            ai_insights_limit=ai_insights_limit,
            plan_name=plan_name,
            features=features
        )

    except Exception as e:
        print(f"Error getting usage info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve usage information: {str(e)}")

@router.post("/cancel-subscription")
async def cancel_subscription(user: AuthorizedUser) -> Dict[str, Any]:
    """Cancel user's subscription at period end"""
    try:
        print(f"Cancelling subscription for user: {user.sub}")

        # Get user's subscription
        billing_info = await get_user_billing_info(user)
        if not billing_info.subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        # Cancel at period end
        stripe.Subscription.modify(
            billing_info.subscription.id,
            cancel_at_period_end=True
        )

        print(f"Successfully scheduled cancellation for subscription {billing_info.subscription.id}")
        return {
            "success": True,
            "message": "Subscription will be cancelled at the end of the current billing period",
            "cancel_at_period_end": True
        }

    except Exception as e:
        print(f"Error cancelling subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel subscription: {str(e)}")

@router.post("/reactivate-subscription")
async def reactivate_subscription(user: AuthorizedUser) -> Dict[str, Any]:
    """Reactivate a subscription that was scheduled for cancellation"""
    try:
        print(f"Reactivating subscription for user: {user.sub}")

        # Get user's subscription
        billing_info = await get_user_billing_info(user)
        if not billing_info.subscription:
            raise HTTPException(status_code=404, detail="No subscription found")

        # Remove cancellation
        stripe.Subscription.modify(
            billing_info.subscription.id,
            cancel_at_period_end=False
        )

        print(f"Successfully reactivated subscription {billing_info.subscription.id}")
        return {
            "success": True,
            "message": "Subscription has been reactivated",
            "cancel_at_period_end": False
        }

    except Exception as e:
        print(f"Error reactivating subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reactivate subscription: {str(e)}")
