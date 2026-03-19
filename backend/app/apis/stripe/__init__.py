from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import stripe
import os

router = APIRouter()

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

class TrialCheckoutRequest(BaseModel):
    customer_email: str
    success_url: str
    cancel_url: str
    plan_name: str

class TrialCheckoutResponse(BaseModel):
    checkout_url: str

@router.post("/create-trial-checkout", response_model=TrialCheckoutResponse)
def create_trial_checkout(body: TrialCheckoutRequest):
    """
    Creates a Stripe checkout session for a free trial.
    """
    # Price IDs from your Stripe account
    price_ids = {
        'founder': 'price_1PQRg8Rxz3I4A9p8xRznf2lK',
        'trader': 'price_1PQRgSRxz3I4A9p8P41r2sT6',
        'pro': 'price_1PQRhBRxz3I4A9p8oCRlF20Z',
    }
    
    plan_price_id = price_ids.get(body.plan_name.lower())
    
    if not plan_price_id:
        raise HTTPException(status_code=400, detail="Invalid plan name specified.")

    try:
        # Check if customer already exists
        existing_customers = stripe.Customer.list(email=body.customer_email, limit=1)
        if existing_customers.data:
            customer = existing_customers.data[0]
        else:
            # Create a new customer in Stripe
            customer = stripe.Customer.create(email=body.customer_email)

        # Create a checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            line_items=[
                {
                    'price': plan_price_id,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            subscription_data={
                'trial_period_days': 7,
            },
            success_url=body.success_url,
            cancel_url=body.cancel_url,
        )

        if not checkout_session.url:
            raise HTTPException(status_code=500, detail="Could not create Stripe checkout session.")

        return TrialCheckoutResponse(checkout_url=checkout_session.url)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
