import stripe
import databutton as db
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
import json
from firebase_admin import firestore
import os

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

router = APIRouter(prefix="/business-metrics")

class MRRMetrics(BaseModel):
    current_mrr: float
    arr: float  # Annual Recurring Revenue
    new_mrr: float
    expansion_mrr: float
    contraction_mrr: float
    churned_mrr: float
    net_mrr_growth: float
    mrr_growth_rate: float
    
class CLTVMetrics(BaseModel):
    average_cltv: float
    median_cltv: float
    cltv_by_cohort: Dict[str, float]
    average_customer_lifespan_months: float
    average_monthly_revenue_per_user: float
    
class ChurnMetrics(BaseModel):
    monthly_churn_rate: float
    annual_churn_rate: float
    revenue_churn_rate: float
    gross_revenue_retention: float
    net_revenue_retention: float
    customers_at_risk: int
    churn_by_segment: Dict[str, float]
    churn_reasons: Dict[str, int]
    
class CohortAnalysis(BaseModel):
    cohort_data: List[Dict[str, Any]]
    retention_by_cohort: Dict[str, List[float]]
    revenue_by_cohort: Dict[str, List[float]]
    
class BusinessMetricsResponse(BaseModel):
    mrr_metrics: MRRMetrics
    cltv_metrics: CLTVMetrics
    churn_metrics: ChurnMetrics
    cohort_analysis: CohortAnalysis
    key_ratios: Dict[str, float]
    historical_trends: List[Dict[str, Any]]
    timestamp: str

@router.get("/health")
def business_metrics_health_check():
    """Health check for business metrics system"""
    try:
        # Test Stripe connection
        stripe.Account.retrieve()
        
        # Test Firebase connection
        db_firestore = firestore.client()
        
        return {
            "status": "healthy",
            "stripe_connected": True,
            "firebase_connected": True,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Business metrics system unhealthy: {str(e)}")

@router.get("/comprehensive", response_model=BusinessMetricsResponse)
def get_comprehensive_business_metrics(
    months: int = Query(default=12, ge=1, le=36, description="Number of months to analyze")
) -> BusinessMetricsResponse:
    """Get comprehensive business metrics including MRR, CLTV, and churn analytics"""
    try:
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=months * 30)
        
        # Get subscription data
        subscription_data = get_subscription_data(start_date, end_date)
        
        # Calculate MRR metrics
        mrr_metrics = calculate_mrr_metrics(subscription_data, end_date)
        
        # Calculate CLTV metrics
        cltv_metrics = calculate_cltv_metrics(subscription_data)
        
        # Calculate churn metrics
        churn_metrics = calculate_churn_metrics(subscription_data, end_date)
        
        # Generate cohort analysis
        cohort_analysis = generate_cohort_analysis(subscription_data)
        
        # Calculate key business ratios
        key_ratios = calculate_key_ratios(mrr_metrics, cltv_metrics, churn_metrics)
        
        # Generate historical trends
        historical_trends = generate_historical_trends(subscription_data, months)
        
        return BusinessMetricsResponse(
            mrr_metrics=mrr_metrics,
            cltv_metrics=cltv_metrics,
            churn_metrics=churn_metrics,
            cohort_analysis=cohort_analysis,
            key_ratios=key_ratios,
            historical_trends=historical_trends,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Failed to calculate business metrics: {str(e)}")

def get_subscription_data(start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
    """Retrieve subscription data from Stripe and local storage"""
    subscriptions = []
    
    try:
        # Get Stripe subscriptions
        stripe_subs = stripe.Subscription.list(
            limit=1000,
            created={
                'gte': int(start_date.timestamp()),
                'lte': int(end_date.timestamp())
            }
        )
        
        # Get all current subscriptions as well
        all_subs = stripe.Subscription.list(limit=1000)
        
        # Combine and deduplicate
        all_subscription_ids = set()
        for sub in stripe_subs.data + all_subs.data:
            if sub.id not in all_subscription_ids:
                all_subscription_ids.add(sub.id)
                
                # Get customer details
                customer = stripe.Customer.retrieve(sub.customer)
                
                # Get pricing info
                amount = 0
                interval = 'month'
                if sub.items and sub.items.data:
                    price = sub.items.data[0].price
                    amount = price.unit_amount / 100 if price.unit_amount else 0
                    interval = price.recurring.interval if price.recurring else 'month'
                
                subscription_data = {
                    'id': sub.id,
                    'customer_id': sub.customer,
                    'customer_email': customer.email,
                    'status': sub.status,
                    'amount': amount,
                    'interval': interval,
                    'created': datetime.fromtimestamp(sub.created, tz=timezone.utc),
                    'current_period_start': datetime.fromtimestamp(sub.current_period_start, tz=timezone.utc),
                    'current_period_end': datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc),
                    'canceled_at': datetime.fromtimestamp(sub.canceled_at, tz=timezone.utc) if sub.canceled_at else None,
                    'ended_at': datetime.fromtimestamp(sub.ended_at, tz=timezone.utc) if sub.ended_at else None,
                    'trial_start': datetime.fromtimestamp(sub.trial_start, tz=timezone.utc) if sub.trial_start else None,
                    'trial_end': datetime.fromtimestamp(sub.trial_end, tz=timezone.utc) if sub.trial_end else None
                }
                
                subscriptions.append(subscription_data)
        
        pass
        return subscriptions
        
    except Exception as e:
        pass
        return []

def calculate_mrr_metrics(subscriptions: List[Dict[str, Any]], end_date: datetime) -> MRRMetrics:
    """Calculate Monthly Recurring Revenue metrics"""
    current_mrr = 0
    new_mrr = 0
    expansion_mrr = 0
    contraction_mrr = 0
    churned_mrr = 0
    
    current_month_start = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    
    current_active_subs = []
    last_month_active_subs = []
    
    for sub in subscriptions:
        # Normalize amount to monthly
        monthly_amount = sub['amount']
        if sub['interval'] == 'year':
            monthly_amount = sub['amount'] / 12
        
        # Current month active subscriptions
        if (sub['status'] == 'active' and 
            sub['created'] <= end_date and 
            (not sub['canceled_at'] or sub['canceled_at'] >= current_month_start)):
            current_active_subs.append({**sub, 'monthly_amount': monthly_amount})
            current_mrr += monthly_amount
        
        # Last month active subscriptions
        if (sub['created'] <= last_month_start + timedelta(days=31) and 
            (not sub['canceled_at'] or sub['canceled_at'] >= last_month_start)):
            last_month_active_subs.append({**sub, 'monthly_amount': monthly_amount})
    
    # Calculate MRR changes
    last_month_mrr = sum(sub['monthly_amount'] for sub in last_month_active_subs)
    
    # New MRR (subscriptions created this month)
    for sub in current_active_subs:
        if sub['created'] >= current_month_start:
            new_mrr += sub['monthly_amount']
    
    # Churned MRR (subscriptions canceled this month)
    for sub in subscriptions:
        if (sub['canceled_at'] and 
            current_month_start <= sub['canceled_at'] < end_date):
            monthly_amount = sub['amount']
            if sub['interval'] == 'year':
                monthly_amount = sub['amount'] / 12
            churned_mrr += monthly_amount
    
    # Calculate growth metrics
    net_mrr_growth = current_mrr - last_month_mrr
    mrr_growth_rate = (net_mrr_growth / last_month_mrr * 100) if last_month_mrr > 0 else 0
    
    return MRRMetrics(
        current_mrr=round(current_mrr, 2),
        arr=round(current_mrr * 12, 2),
        new_mrr=round(new_mrr, 2),
        expansion_mrr=round(expansion_mrr, 2),
        contraction_mrr=round(contraction_mrr, 2),
        churned_mrr=round(churned_mrr, 2),
        net_mrr_growth=round(net_mrr_growth, 2),
        mrr_growth_rate=round(mrr_growth_rate, 2)
    )

def calculate_cltv_metrics(subscriptions: List[Dict[str, Any]]) -> CLTVMetrics:
    """Calculate Customer Lifetime Value metrics"""
    active_subs = [sub for sub in subscriptions if sub['status'] == 'active']
    ended_subs = [sub for sub in subscriptions if sub['ended_at']]
    
    # Calculate average monthly revenue per user
    total_monthly_revenue = 0
    for sub in active_subs:
        monthly_amount = sub['amount']
        if sub['interval'] == 'year':
            monthly_amount = sub['amount'] / 12
        total_monthly_revenue += monthly_amount
    
    average_monthly_revenue_per_user = total_monthly_revenue / len(active_subs) if active_subs else 0
    
    # Calculate average customer lifespan from ended subscriptions
    lifespans = []
    for sub in ended_subs:
        if sub['created'] and sub['ended_at']:
            lifespan_days = (sub['ended_at'] - sub['created']).days
            lifespan_months = lifespan_days / 30.44  # Average days per month
            lifespans.append(lifespan_months)
    
    # If we don't have enough churn data, estimate based on churn rate
    if len(lifespans) < 5:
        # Estimate 5% monthly churn rate for new businesses
        estimated_lifespan_months = 20  # 1/0.05 = 20 months
    else:
        estimated_lifespan_months = sum(lifespans) / len(lifespans)
    
    # Calculate CLTV
    average_cltv = average_monthly_revenue_per_user * estimated_lifespan_months
    
    # Generate cohort CLTV data
    cltv_by_cohort = {}
    cohorts = {}
    
    for sub in subscriptions:
        cohort_month = sub['created'].strftime('%Y-%m')
        if cohort_month not in cohorts:
            cohorts[cohort_month] = []
        cohorts[cohort_month].append(sub)
    
    for cohort_month, cohort_subs in cohorts.items():
        cohort_revenue = 0
        for sub in cohort_subs:
            monthly_amount = sub['amount']
            if sub['interval'] == 'year':
                monthly_amount = sub['amount'] / 12
            cohort_revenue += monthly_amount
        
        cohort_avg_revenue = cohort_revenue / len(cohort_subs) if cohort_subs else 0
        cltv_by_cohort[cohort_month] = round(cohort_avg_revenue * estimated_lifespan_months, 2)
    
    return CLTVMetrics(
        average_cltv=round(average_cltv, 2),
        median_cltv=round(average_cltv, 2),  # Simplified for now
        cltv_by_cohort=cltv_by_cohort,
        average_customer_lifespan_months=round(estimated_lifespan_months, 2),
        average_monthly_revenue_per_user=round(average_monthly_revenue_per_user, 2)
    )

def calculate_churn_metrics(subscriptions: List[Dict[str, Any]], end_date: datetime) -> ChurnMetrics:
    """Calculate churn and retention metrics"""
    current_month_start = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    
    # Count active subscriptions at start of current month
    active_start_month = 0
    churned_this_month = 0
    total_revenue_start = 0
    churned_revenue = 0
    
    for sub in subscriptions:
        monthly_amount = sub['amount']
        if sub['interval'] == 'year':
            monthly_amount = sub['amount'] / 12
        
        # Was active at start of current month
        if (sub['created'] < current_month_start and 
            (not sub['canceled_at'] or sub['canceled_at'] >= current_month_start)):
            active_start_month += 1
            total_revenue_start += monthly_amount
            
            # Churned during current month
            if (sub['canceled_at'] and 
                current_month_start <= sub['canceled_at'] < end_date):
                churned_this_month += 1
                churned_revenue += monthly_amount
    
    # Calculate churn rates
    monthly_churn_rate = (churned_this_month / active_start_month * 100) if active_start_month > 0 else 0
    annual_churn_rate = (1 - (1 - monthly_churn_rate/100) ** 12) * 100
    revenue_churn_rate = (churned_revenue / total_revenue_start * 100) if total_revenue_start > 0 else 0
    
    # Calculate retention rates
    gross_revenue_retention = 100 - revenue_churn_rate
    net_revenue_retention = gross_revenue_retention  # Simplified, could add expansion revenue
    
    # Identify customers at risk (simplified - those past due)
    customers_at_risk = len([sub for sub in subscriptions if sub['status'] == 'past_due'])
    
    # Segment churn by subscription amount
    churn_by_segment = {
        'low_value': 0,    # < $20/month
        'medium_value': 0, # $20-50/month
        'high_value': 0    # > $50/month
    }
    
    for sub in subscriptions:
        if sub['canceled_at'] and current_month_start <= sub['canceled_at'] < end_date:
            monthly_amount = sub['amount']
            if sub['interval'] == 'year':
                monthly_amount = sub['amount'] / 12
            
            if monthly_amount < 20:
                churn_by_segment['low_value'] += 1
            elif monthly_amount <= 50:
                churn_by_segment['medium_value'] += 1
            else:
                churn_by_segment['high_value'] += 1
    
    # Churn reasons (simplified)
    churn_reasons = {
        'payment_failed': len([s for s in subscriptions if s['status'] == 'unpaid']),
        'voluntary_cancellation': churned_this_month,
        'trial_ended': 0  # Could be enhanced
    }
    
    return ChurnMetrics(
        monthly_churn_rate=round(monthly_churn_rate, 2),
        annual_churn_rate=round(annual_churn_rate, 2),
        revenue_churn_rate=round(revenue_churn_rate, 2),
        gross_revenue_retention=round(gross_revenue_retention, 2),
        net_revenue_retention=round(net_revenue_retention, 2),
        customers_at_risk=customers_at_risk,
        churn_by_segment=churn_by_segment,
        churn_reasons=churn_reasons
    )

def generate_cohort_analysis(subscriptions: List[Dict[str, Any]]) -> CohortAnalysis:
    """Generate cohort analysis for retention and revenue"""
    cohorts = {}
    
    # Group subscriptions by cohort (month of first subscription)
    for sub in subscriptions:
        cohort_month = sub['created'].strftime('%Y-%m')
        if cohort_month not in cohorts:
            cohorts[cohort_month] = []
        cohorts[cohort_month].append(sub)
    
    cohort_data = []
    retention_by_cohort = {}
    revenue_by_cohort = {}
    
    for cohort_month, cohort_subs in cohorts.items():
        if len(cohort_subs) < 2:  # Skip small cohorts
            continue
            
        cohort_size = len(cohort_subs)
        cohort_start_date = datetime.strptime(cohort_month, '%Y-%m').replace(tzinfo=timezone.utc)
        
        # Calculate retention for each month after cohort start
        retention_periods = []
        revenue_periods = []
        
        for month_offset in range(12):  # Track 12 months
            period_start = cohort_start_date + timedelta(days=month_offset * 30)
            period_end = period_start + timedelta(days=30)
            
            active_count = 0
            period_revenue = 0
            
            for sub in cohort_subs:
                # Check if subscription was active during this period
                if (sub['created'] <= period_end and 
                    (not sub['ended_at'] or sub['ended_at'] >= period_start)):
                    active_count += 1
                    
                    monthly_amount = sub['amount']
                    if sub['interval'] == 'year':
                        monthly_amount = sub['amount'] / 12
                    period_revenue += monthly_amount
            
            retention_rate = (active_count / cohort_size * 100) if cohort_size > 0 else 0
            retention_periods.append(round(retention_rate, 1))
            revenue_periods.append(round(period_revenue, 2))
        
        cohort_data.append({
            'cohort_month': cohort_month,
            'cohort_size': cohort_size,
            'retention_rates': retention_periods,
            'revenue_by_month': revenue_periods
        })
        
        retention_by_cohort[cohort_month] = retention_periods
        revenue_by_cohort[cohort_month] = revenue_periods
    
    return CohortAnalysis(
        cohort_data=cohort_data,
        retention_by_cohort=retention_by_cohort,
        revenue_by_cohort=revenue_by_cohort
    )

def calculate_key_ratios(mrr_metrics: MRRMetrics, cltv_metrics: CLTVMetrics, churn_metrics: ChurnMetrics) -> Dict[str, float]:
    """Calculate key business ratios"""
    # Estimate Customer Acquisition Cost (simplified)
    estimated_cac = 50  # This would typically come from marketing spend data
    
    ltv_cac_ratio = cltv_metrics.average_cltv / estimated_cac if estimated_cac > 0 else 0
    
    # Payback period in months
    payback_period = estimated_cac / cltv_metrics.average_monthly_revenue_per_user if cltv_metrics.average_monthly_revenue_per_user > 0 else 0
    
    return {
        'ltv_cac_ratio': round(ltv_cac_ratio, 2),
        'estimated_cac': estimated_cac,
        'payback_period_months': round(payback_period, 1),
        'mrr_growth_rate': mrr_metrics.mrr_growth_rate,
        'net_revenue_retention': churn_metrics.net_revenue_retention,
        'gross_margin': 85.0,  # Typical for SaaS
        'magic_number': round(mrr_metrics.net_mrr_growth / estimated_cac, 2) if estimated_cac > 0 else 0
    }

def generate_historical_trends(subscriptions: List[Dict[str, Any]], months: int) -> List[Dict[str, Any]]:
    """Generate historical trends for key metrics"""
    trends = []
    end_date = datetime.now(timezone.utc)
    
    for month_offset in range(months):
        month_end = end_date - timedelta(days=month_offset * 30)
        month_start = month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Calculate MRR for this month
        month_mrr = 0
        active_subs_count = 0
        new_subs_count = 0
        churned_subs_count = 0
        
        for sub in subscriptions:
            monthly_amount = sub['amount']
            if sub['interval'] == 'year':
                monthly_amount = sub['amount'] / 12
            
            # Active during this month
            if (sub['created'] <= month_end and 
                (not sub['ended_at'] or sub['ended_at'] >= month_start)):
                month_mrr += monthly_amount
                active_subs_count += 1
            
            # New subscription this month
            if month_start <= sub['created'] <= month_end:
                new_subs_count += 1
            
            # Churned this month
            if (sub['canceled_at'] and 
                month_start <= sub['canceled_at'] <= month_end):
                churned_subs_count += 1
        
        trends.append({
            'month': month_start.strftime('%Y-%m'),
            'mrr': round(month_mrr, 2),
            'active_subscriptions': active_subs_count,
            'new_subscriptions': new_subs_count,
            'churned_subscriptions': churned_subs_count,
            'churn_rate': round((churned_subs_count / active_subs_count * 100) if active_subs_count > 0 else 0, 2)
        })
    
    return list(reversed(trends))  # Return chronological order
