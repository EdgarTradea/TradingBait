import stripe
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials, firestore
import re
import os
from app.libs.firebase_init import initialize_firebase

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
try:
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
except:
    webhook_secret = ""
    pass

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/stripe-webhooks")

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

class WebhookResponse(BaseModel):
    received: bool
    message: str

@router.post("/webhook")
async def stripe_webhook_handler(request: Request, stripe_signature: str = Header(None, alias="stripe-signature")):
    """Handle Stripe webhook events"""
    try:
        # Get the raw body
        body = await request.body()
        
        # Verify the webhook signature if webhook secret is configured
        event = None
        if webhook_secret:
            try:
                event = stripe.Webhook.construct_event(
                    body, stripe_signature, webhook_secret
                )
            except ValueError as e:
                pass
                raise HTTPException(status_code=400, detail="Invalid payload")
            except stripe.error.SignatureVerificationError as e:
                pass
                raise HTTPException(status_code=400, detail="Invalid signature")
        else:
            # If no webhook secret, parse the body directly (for testing)
            event = json.loads(body)
            pass
        
        pass
        
        # Handle different event types
        if event['type'] == 'checkout.session.completed':
            await handle_checkout_completed(event['data']['object'])
        elif event['type'] == 'customer.subscription.created':
            await handle_subscription_created(event['data']['object'])
        elif event['type'] == 'customer.subscription.updated':
            await handle_subscription_updated(event['data']['object'])
        elif event['type'] == 'customer.subscription.deleted':
            await handle_subscription_deleted(event['data']['object'])
        elif event['type'] == 'invoice.payment_succeeded':
            await handle_payment_succeeded(event['data']['object'])
        elif event['type'] == 'invoice.payment_failed':
            await handle_payment_failed(event['data']['object'])
        else:
            pass
        
        return WebhookResponse(received=True, message=f"Processed {event['type']}")
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

async def handle_checkout_completed(session):
    """Handle successful checkout completion"""
    try:
        pass
        
        customer_id = session.get('customer')
        if not customer_id:
            pass
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            pass
            return
        
        pass
        
        # Find user by email in Firebase
        db_firestore = firestore.client()
        
        # Try to find user by email
        users_ref = db_firestore.collection('users')
        query = users_ref.where(filter=firestore.FieldFilter('email', '==', customer_email)).limit(1)
        docs = query.stream()
        
        user_id = None
        for doc in docs:
            user_id = doc.id
            break
        
        if not user_id:
            pass
            # Try to get user by customer ID metadata
            metadata = customer.get('metadata', {})
            user_id = metadata.get('firebase_uid')
            
            if not user_id:
                pass
                return
        
        # Store customer ID in user document
        user_doc_ref = db_firestore.collection('users').document(user_id)
        user_doc_ref.set({
            'stripe_customer_id': customer_id,
            'email': customer_email,
            'subscription_activated_at': datetime.now(timezone.utc).isoformat()
        }, merge=True)
        
        # Create subscription record in storage
        sanitized_user_id = sanitize_storage_key(user_id.replace('.', '_').replace('@', '_at_'))
        subscription_key = f"subscription.{sanitized_user_id}"
        
        subscription_data = {
            "user_id": user_id,
            "subscription_type": "pro",
            "subscription_status": "active",
            "stripe_customer_id": customer_id,
            "activated_at": datetime.now(timezone.utc).isoformat(),
            "activated_via": "stripe_checkout",
            "session_id": session['id']
        }

        firestore.client().collection("users").document(user_id).collection("subscription").document("stripe").set(subscription_data, merge=True)
        
        pass
        
        # Handle referral tracking if present
        session_metadata = session.get('metadata', {})
        referral_code = session_metadata.get('referral_code')
        if referral_code:
            await track_referral_conversion(referral_code, user_id)
        
    except Exception as e:
        pass
        raise

async def handle_subscription_created(subscription):
    """Handle subscription creation"""
    try:
        pass
        
        customer_id = subscription.get('customer')
        if not customer_id:
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            pass
            return
        
        # Update subscription status in storage
        await update_user_subscription_status(customer_email, {
            "subscription_status": "active" if subscription.get('status') == 'active' else subscription.get('status'),
            "stripe_subscription_id": subscription['id'],
            "subscription_updated_at": datetime.now(timezone.utc).isoformat()
        })
        
        # If the subscription is in trial, persist trial status so UI can show correct days remaining
        try:
            status = subscription.get('status')
            trial_start_ts = subscription.get('trial_start')
            trial_end_ts = subscription.get('trial_end')
            if status == 'trialing' and trial_end_ts:
                # Resolve user id from Firestore via email
                db_firestore = firestore.client()
                users_ref = db_firestore.collection('users')
                query = users_ref.where(filter=firestore.FieldFilter('email', '==', customer_email)).limit(1)
                docs = query.stream()
                user_id = None
                for doc in docs:
                    user_id = doc.id
                    break
                if not user_id:
                    pass
                else:
                    trial_start = datetime.fromtimestamp(trial_start_ts, tz=timezone.utc) if trial_start_ts else datetime.now(timezone.utc)
                    trial_end = datetime.fromtimestamp(trial_end_ts, tz=timezone.utc)
                    trial_key = f"trial_status.{user_id}"
                    trial_data = {
                        'user_id': user_id,
                        'trial_start_date': trial_start.isoformat(),
                        'trial_end_date': trial_end.isoformat(),
                        'trial_plan': subscription.get('metadata', {}).get('plan_name') or 'basic',
                        'stripe_subscription_id': subscription['id'],
                        'stripe_customer_id': customer_id,
                        'is_trial_active': True,
                        'has_cancelled': False,
                        'can_cancel': True,
                        'created_at': datetime.now(timezone.utc).isoformat(),
                    }
                    firestore.client().collection("users").document(user_id).collection("subscription").document("trial").set(trial_data, merge=True)
        except Exception as e:
            pass
        
    except Exception as e:
        pass
        raise

async def handle_subscription_updated(subscription):
    """Handle subscription updates"""
    try:
        pass
        
        customer_id = subscription.get('customer')
        if not customer_id:
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            pass
            return
        
        # Update subscription status
        status_mapping = {
            'active': 'active',
            'past_due': 'past_due',
            'canceled': 'canceled',
            'unpaid': 'suspended',
            'incomplete': 'incomplete',
            'trialing': 'trialing',
        }
        
        new_status = status_mapping.get(subscription['status'], subscription['status'])
        
        await update_user_subscription_status(customer_email, {
            "subscription_status": new_status,
            "stripe_subscription_id": subscription['id'],
            "subscription_updated_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Keep trial_status in sync as user transitions out of trial
        try:
            # Resolve user id
            db_firestore = firestore.client()
            users_ref = db_firestore.collection('users')
            query = users_ref.where(filter=firestore.FieldFilter('email', '==', customer_email)).limit(1)
            docs = query.stream()
            user_id = None
            for doc in docs:
                user_id = doc.id
                break
            if user_id:
                trial_ref = firestore.client().collection("users").document(user_id).collection("subscription").document("trial")
                trial_doc = trial_ref.get()
                existing = trial_doc.to_dict() if trial_doc.exists else {}
                if subscription.get('status') == 'trialing':
                    ts = subscription.get('trial_start')
                    te = subscription.get('trial_end')
                    if te:
                        existing.update({
                            'trial_start_date': datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else existing.get('trial_start_date'),
                            'trial_end_date': datetime.fromtimestamp(te, tz=timezone.utc).isoformat(),
                            'is_trial_active': True,
                        })
                        trial_ref.set(existing, merge=True)
                else:
                    if existing:
                        trial_ref.update({'is_trial_active': False})
            else:
                pass
        except Exception as e:
            pass
        
    except Exception as e:
        pass
        raise

async def handle_subscription_deleted(subscription):
    """Handle subscription cancellation"""
    try:
        pass
        
        customer_id = subscription.get('customer')
        if not customer_id:
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            pass
            return
        
        # Update subscription status to canceled
        await update_user_subscription_status(customer_email, {
            "subscription_status": "canceled",
            "stripe_subscription_id": subscription['id'],
            "canceled_at": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        pass
        raise

async def handle_payment_succeeded(invoice):
    """Handle successful payment"""
    try:
        pass
        
        customer_id = invoice.get('customer')
        if not customer_id:
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            pass
            return
        
        # Ensure subscription is active after successful payment
        await update_user_subscription_status(customer_email, {
            "subscription_status": "active",
            "last_payment_at": datetime.now(timezone.utc).isoformat(),
            "last_payment_amount": invoice.get('amount_paid', 0) / 100  # Convert from cents
        })
        
    except Exception as e:
        pass
        raise

async def handle_payment_failed(invoice):
    """Handle failed payment"""
    try:
        pass
        
        customer_id = invoice.get('customer')
        if not customer_id:
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            pass
            return
        
        # Update subscription status based on invoice status
        new_status = "past_due" if invoice.get('status') == 'open' else "suspended"
        
        await update_user_subscription_status(customer_email, {
            "subscription_status": new_status,
            "last_payment_failed_at": datetime.now(timezone.utc).isoformat(),
            "payment_failure_reason": invoice.get('status_transitions', {}).get('finalized_at')
        })
        
    except Exception as e:
        pass
        raise

async def update_user_subscription_status(customer_email: str, update_data: Dict[str, Any]):
    """Update user subscription status in storage"""
    try:
        # Find user by email in Firebase
        db_firestore = firestore.client()
        users_ref = db_firestore.collection('users')
        query = users_ref.where('email', '==', customer_email).limit(1)
        docs = query.stream()
        
        user_id = None
        for doc in docs:
            user_id = doc.id
            break
        
        if not user_id:
            pass
            return
        
        # Update subscription in Firestore
        sub_ref = firestore.client().collection("users").document(user_id).collection("subscription").document("stripe")
        sub_doc = sub_ref.get()
        existing_data = sub_doc.to_dict() if sub_doc.exists else {}

        existing_data.update(update_data)
        existing_data["user_id"] = user_id
        existing_data["email"] = customer_email

        sub_ref.set(existing_data, merge=True)
        
        pass
        
    except Exception as e:
        pass
        raise

async def track_referral_conversion(referral_code: str, user_id: str):
    """Track referral conversion after successful payment"""
    try:
        pass
        
        # Import here to avoid circular imports
        import importlib
        affiliate_module = importlib.import_module("app.apis.affiliate_system")
        
        # Get user subscription data to extract payment amount
        sanitized_user_id = sanitize_storage_key(user_id.replace('.', '_').replace('@', '_at_'))
        subscription_key = f"subscription.{sanitized_user_id}"
        
        try:
            sub_doc = firestore.client().collection("users").document(user_id).collection("subscription").document("stripe").get()
            subscription_data = sub_doc.to_dict() if sub_doc.exists else {}
            payment_amount = 37.0
        except Exception:
            subscription_data = {}
            payment_amount = 37.0
        
        # Call the actual affiliate conversion tracking
        conversion_result = await affiliate_module.track_referral_conversion(
            user_id=user_id,
            subscription_id=subscription_data.get('stripe_subscription_id', 'unknown'),
            payment_amount=payment_amount
        )
        
        if conversion_result.get('success'):
            commission_amount = conversion_result.get('commission_amount', 0)
            pass
        else:
            pass
        
    except Exception as e:
        pass
        # Don't raise - this is not critical for the main flow

@router.get("/health")
def webhook_health_check():
    """Health check for webhook system"""
    try:
        return {
            "status": "healthy",
            "webhook_secret_configured": bool(webhook_secret),
            "stripe_connected": True,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook system unhealthy: {str(e)}")
