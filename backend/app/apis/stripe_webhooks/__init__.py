import stripe
import databutton as db
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
    print("Warning: STRIPE_WEBHOOK_SECRET not configured - webhook signature verification disabled")

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
                print(f"Invalid payload: {e}")
                raise HTTPException(status_code=400, detail="Invalid payload")
            except stripe.error.SignatureVerificationError as e:
                print(f"Invalid signature: {e}")
                raise HTTPException(status_code=400, detail="Invalid signature")
        else:
            # If no webhook secret, parse the body directly (for testing)
            event = json.loads(body)
            print("Warning: Processing webhook without signature verification")
        
        print(f"Received Stripe webhook: {event['type']}")
        
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
            print(f"Unhandled event type: {event['type']}")
        
        return WebhookResponse(received=True, message=f"Processed {event['type']}")
        
    except Exception as e:
        print(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

async def handle_checkout_completed(session):
    """Handle successful checkout completion"""
    try:
        print(f"Processing checkout completion for session: {session['id']}")
        
        customer_id = session.get('customer')
        if not customer_id:
            print("No customer ID in checkout session")
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            print(f"No email found for customer {customer_id}")
            return
        
        print(f"Processing subscription activation for customer email: {customer_email}")
        
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
            print(f"No Firebase user found for email: {customer_email}")
            # Try to get user by customer ID metadata
            metadata = customer.get('metadata', {})
            user_id = metadata.get('firebase_uid')
            
            if not user_id:
                print(f"⚠️ Warning: No user ID found for {customer_email}. User should be created on authentication.")
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
        
        db.storage.json.put(subscription_key, subscription_data)
        
        print(f"✅ Successfully activated subscription for user {user_id} (email: {customer_email})")
        
        # Handle referral tracking if present
        session_metadata = session.get('metadata', {})
        referral_code = session_metadata.get('referral_code')
        if referral_code:
            await track_referral_conversion(referral_code, user_id)
        
    except Exception as e:
        print(f"Error handling checkout completion: {e}")
        raise

async def handle_subscription_created(subscription):
    """Handle subscription creation"""
    try:
        print(f"Processing subscription creation: {subscription['id']}")
        
        customer_id = subscription.get('customer')
        if not customer_id:
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            print(f"No email found for customer {customer_id}")
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
                    print(f"Could not resolve user id for trial status (email: {customer_email})")
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
                    db.storage.json.put(trial_key, trial_data)
                    print(f"✅ Stored trial_status for {user_id} with end {trial_end.isoformat()}")
        except Exception as e:
            print(f"Non-fatal: failed to persist trial_status on subscription.created: {e}")
        
    except Exception as e:
        print(f"Error handling subscription creation: {e}")
        raise

async def handle_subscription_updated(subscription):
    """Handle subscription updates"""
    try:
        print(f"Processing subscription update: {subscription['id']} - Status: {subscription['status']}")
        
        customer_id = subscription.get('customer')
        if not customer_id:
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            print(f"No email found for customer {customer_id}")
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
                trial_key = f"trial_status.{user_id}"
                existing = db.storage.json.get(trial_key, default={})
                if subscription.get('status') == 'trialing':
                    # Update dates if provided
                    ts = subscription.get('trial_start')
                    te = subscription.get('trial_end')
                    if te:
                        existing.update({
                            'trial_start_date': datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else existing.get('trial_start_date'),
                            'trial_end_date': datetime.fromtimestamp(te, tz=timezone.utc).isoformat(),
                            'is_trial_active': True,
                        })
                        db.storage.json.put(trial_key, existing)
                        print(f"🔄 Updated trial_status for {user_id} (still trialing)")
                else:
                    # Mark trial as inactive once subscription becomes active or canceled
                    if existing:
                        existing['is_trial_active'] = False
                        db.storage.json.put(trial_key, existing)
                        print(f"✅ Marked trial_status inactive for {user_id} (status: {subscription.get('status')})")
            else:
                print(f"Could not resolve user id for subscription.updated (email: {customer_email})")
        except Exception as e:
            print(f"Non-fatal: failed to sync trial_status on subscription.updated: {e}")
        
    except Exception as e:
        print(f"Error handling subscription update: {e}")
        raise

async def handle_subscription_deleted(subscription):
    """Handle subscription cancellation"""
    try:
        print(f"Processing subscription deletion: {subscription['id']}")
        
        customer_id = subscription.get('customer')
        if not customer_id:
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            print(f"No email found for customer {customer_id}")
            return
        
        # Update subscription status to canceled
        await update_user_subscription_status(customer_email, {
            "subscription_status": "canceled",
            "stripe_subscription_id": subscription['id'],
            "canceled_at": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        print(f"Error handling subscription deletion: {e}")
        raise

async def handle_payment_succeeded(invoice):
    """Handle successful payment"""
    try:
        print(f"Processing successful payment: {invoice['id']}")
        
        customer_id = invoice.get('customer')
        if not customer_id:
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            print(f"No email found for customer {customer_id}")
            return
        
        # Ensure subscription is active after successful payment
        await update_user_subscription_status(customer_email, {
            "subscription_status": "active",
            "last_payment_at": datetime.now(timezone.utc).isoformat(),
            "last_payment_amount": invoice.get('amount_paid', 0) / 100  # Convert from cents
        })
        
    except Exception as e:
        print(f"Error handling payment success: {e}")
        raise

async def handle_payment_failed(invoice):
    """Handle failed payment"""
    try:
        print(f"Processing failed payment: {invoice['id']}")
        
        customer_id = invoice.get('customer')
        if not customer_id:
            return
        
        # Get customer details
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get('email')
        
        if not customer_email:
            print(f"No email found for customer {customer_id}")
            return
        
        # Update subscription status based on invoice status
        new_status = "past_due" if invoice.get('status') == 'open' else "suspended"
        
        await update_user_subscription_status(customer_email, {
            "subscription_status": new_status,
            "last_payment_failed_at": datetime.now(timezone.utc).isoformat(),
            "payment_failure_reason": invoice.get('status_transitions', {}).get('finalized_at')
        })
        
    except Exception as e:
        print(f"Error handling payment failure: {e}")
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
            print(f"No user found for email: {customer_email}")
            return
        
        # Update subscription in storage
        sanitized_user_id = sanitize_storage_key(user_id.replace('.', '_').replace('@', '_at_'))
        subscription_key = f"subscription.{sanitized_user_id}"
        
        # Get existing subscription data
        try:
            existing_data = db.storage.json.get(subscription_key)
        except FileNotFoundError:
            existing_data = {}
        except Exception as e:
            print(f"Error getting existing subscription data: {e}")
            existing_data = {}
        
        # Merge with update data
        existing_data.update(update_data)
        existing_data["user_id"] = user_id
        existing_data["email"] = customer_email
        
        # Save updated subscription data
        db.storage.json.put(subscription_key, existing_data)
        
        print(f"Updated subscription for user {user_id}: {update_data}")
        
    except Exception as e:
        print(f"Error updating user subscription status: {e}")
        raise

async def track_referral_conversion(referral_code: str, user_id: str):
    """Track referral conversion after successful payment"""
    try:
        print(f"Tracking referral conversion: {referral_code} -> {user_id}")
        
        # Import here to avoid circular imports
        import importlib
        affiliate_module = importlib.import_module("app.apis.affiliate_system")
        
        # Get user subscription data to extract payment amount
        sanitized_user_id = sanitize_storage_key(user_id.replace('.', '_').replace('@', '_at_'))
        subscription_key = f"subscription.{sanitized_user_id}"
        
        try:
            subscription_data = db.storage.json.get(subscription_key, default={})
            # Use a default payment amount if not available (professional plan price)
            payment_amount = 37.0  # $37 after 20% discount for affiliate referrals
        except Exception as e:
            print(f"Could not get subscription data for payment amount: {e}")
            payment_amount = 37.0
        
        # Call the actual affiliate conversion tracking
        conversion_result = await affiliate_module.track_referral_conversion(
            user_id=user_id,
            subscription_id=subscription_data.get('stripe_subscription_id', 'unknown'),
            payment_amount=payment_amount
        )
        
        if conversion_result.get('success'):
            commission_amount = conversion_result.get('commission_amount', 0)
            print(f"✅ Referral conversion tracked successfully: ${payment_amount} -> ${commission_amount} commission")
        else:
            print(f"❌ Failed to track referral conversion: {conversion_result.get('message', 'Unknown error')}")
        
    except Exception as e:
        print(f"Error tracking referral conversion: {e}")
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
