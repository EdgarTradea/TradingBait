from fastapi import APIRouter, HTTPException, Query
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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# Initialize Firebase
initialize_firebase()

router = APIRouter(prefix="/admin/affiliate")

# Admin verification
def verify_admin_access(user: AuthorizedUser):
    """Verify that the user has admin access"""
    admin_user_ids = [
        "c5tjdjaLvSVY6XDsjVsDtyrwPg43",  # Edgar's production user ID
        "test-user-id",  # Development/test user ID
        "admin-user-id",  # Workspace admin user ID
        "admin-user"  # Current workspace user ID
    ]
    pass
    pass
    if user.sub not in admin_user_ids:
        pass
        raise HTTPException(status_code=403, detail="Admin access required")

# === DATA MODELS ===

class AffiliateApprovalRequest(BaseModel):
    affiliate_id: str
    action: str  # "approve" or "reject"
    notes: Optional[str] = None

class AffiliateApprovalResponse(BaseModel):
    success: bool
    message: str

class AffiliateListItem(BaseModel):
    affiliate_id: str
    full_name: str
    email: str
    company_name: Optional[str] = None
    website_url: Optional[str] = None
    status: str
    referral_code: str
    total_earnings: float
    total_referrals: int
    active_referrals: int
    created_at: str
    marketing_experience: str
    referral_method: str

class AffiliateManagementResponse(BaseModel):
    affiliates: List[AffiliateListItem]
    total_count: int
    pending_count: int
    approved_count: int
    total_earnings_paid: float
    total_active_referrals: int

# === HELPER FUNCTIONS ===

def get_firestore_client():
    """Get Firestore client"""
    return firestore.client()

# === AFFILIATE EMAIL NOTIFICATIONS ===

def send_affiliate_approval_email(affiliate_data: dict, referral_url: str) -> bool:
    """Send approval email to affiliate with referral link and commission details"""
    try:
        # Get SMTP configuration
        smtp_host = os.environ.get("SMTP_HOST")
        smtp_port = int(os.environ.get("SMTP_PORT"))
        smtp_user = os.environ.get("SMTP_USER")
        smtp_pass = os.environ.get("SMTP_PASS")
        
        affiliate_name = affiliate_data.get('full_name', 'Affiliate')
        affiliate_email = affiliate_data['email']
        
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "🎉 Your TradingBait Affiliate Application Has Been Approved!"
        msg['From'] = smtp_user
        msg['To'] = affiliate_email
        
        # HTML email template
        html_content = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #e2e8f0; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #06b6d4; font-size: 32px; margin: 0; text-shadow: 0 0 20px rgba(6, 182, 212, 0.3); font-weight: 700;">🎉 TradingBait</h1>
                <p style="color: #64748b; font-size: 18px; margin: 10px 0 0 0; font-weight: 300;">Affiliate Program</p>
            </div>
            
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; backdrop-filter: blur(10px);">
                <h2 style="color: #10b981; font-size: 24px; margin: 0 0 15px 0; font-weight: 600;">Congratulations, {affiliate_name}! 🚀</h2>
                <p style="color: #cbd5e1; line-height: 1.7; margin: 0; font-size: 16px;">Your affiliate application has been approved! Welcome to the TradingBait Affiliate Program. You're now ready to start earning commissions by referring traders to our platform.</p>
            </div>
            
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #06b6d4; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">💰 Your Commission Structure</h3>
                <ul style="color: #94a3b8; line-height: 1.8; padding-left: 20px; margin: 0;">
                    <li><strong style="color: #10b981;">$15 fixed commission</strong> per successful conversion</li>
                    <li><strong style="color: #10b981;">One-time payment</strong> for each new paid subscriber</li>
                    <li><strong style="color: #f59e0b;">Monthly payments</strong> on the 1st of each month</li>
                    <li><strong style="color: #ef4444;">Minimum payout:</strong> $100</li>
                    <li><strong style="color: #8b5cf6;">Customer discount:</strong> 20% off with your referral</li>
                </ul>
            </div>
            
            <div style="background: linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #e2e8f0; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">🔗 Your Unique Referral Link</h3>
                <div style="background: rgba(15, 23, 42, 0.8); border-radius: 8px; padding: 15px; margin: 15px 0; word-break: break-all;">
                    <code style="color: #06b6d4; font-size: 14px;">{referral_url}</code>
                </div>
                <p style="color: #94a3b8; line-height: 1.6; margin: 0;">Share this link on your platforms to start earning commissions. Your customers will automatically receive a 20% discount!</p>
            </div>
            
            <div style="margin: 30px 0;">
                <h3 style="color: #e2e8f0; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">🚀 Next Steps:</h3>
                <ul style="color: #94a3b8; line-height: 1.8; padding-left: 20px; margin: 0;">
                    <li>Visit your <strong>Affiliate Dashboard</strong> to track performance</li>
                    <li>Download our <strong>marketing materials</strong> and resources</li>
                    <li>Start sharing your referral link with your audience</li>
                    <li>Monitor your earnings and conversions in real-time</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);">
                    <a href="https://www.tradingbait.com/affiliate-dashboard" style="color: white; text-decoration: none;">Access Dashboard →</a>
                </div>
            </div>
            
            <div style="border-top: 1px solid rgba(100, 116, 139, 0.3); padding-top: 25px; text-align: center; margin-top: 40px;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">Questions? We're here to help you succeed!</p>
                <p style="color: #64748b; font-size: 14px; margin: 0;">📧 <a href="mailto:support@tradingbait.com" style="color: #06b6d4; text-decoration: none;">support@tradingbait.com</a> | 🌐 <a href="https://www.tradingbait.com" style="color: #06b6d4; text-decoration: none;">www.tradingbait.com</a></p>
                <p style="color: #475569; font-size: 12px; margin: 15px 0 0 0;">TradingBait Affiliate Program</p>
            </div>
        </div>
        """
        
        # Text content fallback
        text_content = f"""
        Congratulations, {affiliate_name}!
        
        Your TradingBait affiliate application has been approved! Welcome to our affiliate program.
        
        COMMISSION STRUCTURE:
        - $15 fixed commission per successful conversion
        - One-time payment for each new paid subscriber
        - Monthly payments on the 1st of each month
        - Minimum payout: $100
        - Customer discount: 20% off with your referral
        
        YOUR REFERRAL LINK:
        {referral_url}
        
        NEXT STEPS:
        1. Visit your Affiliate Dashboard to track performance
        2. Download marketing materials and resources
        3. Start sharing your referral link with your audience
        4. Monitor your earnings and conversions in real-time
        
        Access your dashboard: https://www.tradingbait.com/affiliate-dashboard
        
        Questions? Contact us at support@tradingbait.com
        
        TradingBait Affiliate Program
        """
        
        # Attach parts
        text_part = MIMEText(text_content, 'plain')
        html_part = MIMEText(html_content, 'html')
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Send email
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [affiliate_email], msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [affiliate_email], msg.as_string())
        
        pass
        return True
        
    except Exception as e:
        pass
        return False

def send_affiliate_rejection_email(affiliate_data: dict, admin_notes: str = None) -> bool:
    """Send rejection email to affiliate with feedback and reapplication possibility"""
    try:
        # Get SMTP configuration
        smtp_host = os.environ.get("SMTP_HOST")
        smtp_port = int(os.environ.get("SMTP_PORT"))
        smtp_user = os.environ.get("SMTP_USER")
        smtp_pass = os.environ.get("SMTP_PASS")
        
        affiliate_name = affiliate_data.get('full_name', 'Affiliate')
        affiliate_email = affiliate_data['email']
        
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "TradingBait Affiliate Application Update"
        msg['From'] = smtp_user
        msg['To'] = affiliate_email
        
        # Prepare feedback section
        feedback_section = ""
        if admin_notes:
            feedback_section = f"""
            <div style="background: rgba(15, 23, 42, 0.6); border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h4 style="color: #f59e0b; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">📝 Feedback from Our Team</h4>
                <p style="color: #94a3b8; margin: 0; line-height: 1.6;">{admin_notes}</p>
            </div>
            """
        
        # HTML email template
        html_content = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #e2e8f0; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #06b6d4; font-size: 32px; margin: 0; text-shadow: 0 0 20px rgba(6, 182, 212, 0.3); font-weight: 700;">📋 TradingBait</h1>
                <p style="color: #64748b; font-size: 18px; margin: 10px 0 0 0; font-weight: 300;">Affiliate Program</p>
            </div>
            
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; backdrop-filter: blur(10px);">
                <h2 style="color: #ef4444; font-size: 24px; margin: 0 0 15px 0; font-weight: 600;">Application Update, {affiliate_name}</h2>
                <p style="color: #cbd5e1; line-height: 1.7; margin: 0; font-size: 16px;">Thank you for your interest in the TradingBait Affiliate Program. After careful review, we're unable to approve your application at this time.</p>
            </div>
            
            {feedback_section}
            
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #06b6d4; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">🔄 What's Next?</h3>
                <ul style="color: #94a3b8; line-height: 1.8; padding-left: 20px; margin: 0;">
                    <li><strong style="color: #10b981;">Reapplication Welcome:</strong> You can reapply in the future</li>
                    <li><strong style="color: #f59e0b;">Improve Your Profile:</strong> Consider building your audience or experience</li>
                    <li><strong style="color: #8b5cf6;">Stay Connected:</strong> Follow our updates and opportunities</li>
                    <li><strong style="color: #06b6d4;">Ask Questions:</strong> Reach out if you need clarification</li>
                </ul>
            </div>
            
            <div style="margin: 30px 0;">
                <h3 style="color: #e2e8f0; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">💡 Tips for Future Applications:</h3>
                <ul style="color: #94a3b8; line-height: 1.8; padding-left: 20px; margin: 0;">
                    <li>Build a larger, engaged audience interested in trading</li>
                    <li>Develop content that demonstrates trading knowledge</li>
                    <li>Show evidence of successful affiliate partnerships</li>
                    <li>Provide detailed information about your marketing plans</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);">
                    <a href="https://www.tradingbait.com/affiliate-dashboard" style="color: white; text-decoration: none;">Reapply in Future →</a>
                </div>
            </div>
            
            <div style="border-top: 1px solid rgba(100, 116, 139, 0.3); padding-top: 25px; text-align: center; margin-top: 40px;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">We appreciate your interest and encourage you to try again!</p>
                <p style="color: #64748b; font-size: 14px; margin: 0;">📧 <a href="mailto:support@tradingbait.com" style="color: #06b6d4; text-decoration: none;">support@tradingbait.com</a> | 🌐 <a href="https://www.tradingbait.com" style="color: #06b6d4; text-decoration: none;">www.tradingbait.com</a></p>
                <p style="color: #475569; font-size: 12px; margin: 15px 0 0 0;">TradingBait Affiliate Program</p>
            </div>
        </div>
        """
        
        # Text content fallback
        feedback_text = f"\n\nFeedback from our team:\n{admin_notes}\n" if admin_notes else ""
        
        text_content = f"""
        Application Update - TradingBait Affiliate Program
        
        Hello {affiliate_name},
        
        Thank you for your interest in the TradingBait Affiliate Program. After careful review, we're unable to approve your application at this time.{feedback_text}
        
        WHAT'S NEXT:
        - Reapplication Welcome: You can reapply in the future
        - Improve Your Profile: Consider building your audience or experience
        - Stay Connected: Follow our updates and opportunities
        - Ask Questions: Reach out if you need clarification
        
        TIPS FOR FUTURE APPLICATIONS:
        - Build a larger, engaged audience interested in trading
        - Develop content that demonstrates trading knowledge
        - Show evidence of successful affiliate partnerships
        - Provide detailed information about your marketing plans
        
        We appreciate your interest and encourage you to try again!
        
        Reapply at: https://www.tradingbait.com/affiliate-dashboard
        Questions? Contact us at support@tradingbait.com
        
        TradingBait Affiliate Program
        """
        
        # Attach parts
        text_part = MIMEText(text_content, 'plain')
        html_part = MIMEText(html_content, 'html')
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Send email
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [affiliate_email], msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [affiliate_email], msg.as_string())
        
        pass
        return True
        
    except Exception as e:
        pass
        return False

# === API ENDPOINTS ===

@router.get("/list")
async def list_affiliates(
    status: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected, suspended"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: AuthorizedUser = None
) -> AffiliateManagementResponse:
    """List all affiliates with filtering and pagination (admin only)"""
    verify_admin_access(user)
    
    try:
        db_firestore = get_firestore_client()
        
        # Build query
        query = db_firestore.collection("affiliates")
        
        if status:
            query = query.where("status", "==", status)
        
        # Get total count
        all_affiliates = query.get()
        total_count = len(all_affiliates)
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.order_by("created_at", direction=firestore.Query.DESCENDING)
        query = query.offset(offset).limit(limit)
        
        affiliates_docs = query.get()
        
        affiliates = []
        total_earnings_paid = 0
        total_active_referrals = 0
        pending_count = 0
        approved_count = 0
        
        for doc in affiliates_docs:
            data = doc.to_dict()
            affiliate = AffiliateListItem(**data)
            affiliates.append(affiliate)
            
            if data["status"] == "approved":
                approved_count += 1
                total_earnings_paid += data.get("paid_earnings", 0)
                total_active_referrals += data.get("active_referrals", 0)
            elif data["status"] == "pending":
                pending_count += 1
        
        # If not filtering, get counts from all affiliates
        if not status:
            for doc in all_affiliates:
                data = doc.to_dict()
                if data["status"] == "pending":
                    pending_count += 1
                elif data["status"] == "approved":
                    approved_count += 1
        
        return AffiliateManagementResponse(
            affiliates=affiliates,
            total_count=total_count,
            pending_count=pending_count,
            approved_count=approved_count,
            total_earnings_paid=total_earnings_paid,
            total_active_referrals=total_active_referrals
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to list affiliates")

@router.post("/approve")
async def approve_affiliate(
    request: AffiliateApprovalRequest,
    user: AuthorizedUser
) -> AffiliateApprovalResponse:
    """Approve or reject an affiliate application (admin only)"""
    verify_admin_access(user)
    
    try:
        if request.action not in ["approve", "reject"]:
            raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
        
        db_firestore = get_firestore_client()
        affiliate_ref = db_firestore.collection("affiliates").document(request.affiliate_id)
        affiliate_doc = affiliate_ref.get()
        
        if not affiliate_doc.exists:
            raise HTTPException(status_code=404, detail="Affiliate not found")
        
        affiliate_data = affiliate_doc.to_dict()
        
        if affiliate_data["status"] != "pending":
            raise HTTPException(status_code=400, detail="Affiliate is not in pending status")
        
        # Update affiliate status
        update_data = {
            "status": "approved" if request.action == "approve" else "rejected",
            "updated_at": datetime.utcnow().isoformat(),
            "approved_by" if request.action == "approve" else "rejected_by": user.sub,
            "approved_at" if request.action == "approve" else "rejected_at": datetime.utcnow().isoformat()
        }
        
        if request.notes:
            update_data["admin_notes"] = request.notes
        
        # Update database first (critical operation)
        affiliate_ref.update(update_data)
        
        action_word = "approved" if request.action == "approve" else "rejected"
        pass
        
        # Send email notification (non-blocking)
        try:
            if request.action == "approve":
                referral_url = f"https://www.tradingbait.com/?ref={affiliate_data['referral_code']}"
                email_sent = send_affiliate_approval_email(affiliate_data, referral_url)
                if email_sent:
                    pass
                else:
                    pass
            else:
                email_sent = send_affiliate_rejection_email(affiliate_data, request.notes)
                if email_sent:
                    pass
                else:
                    pass
        except Exception as email_error:
            # Log email error but don't fail the approval process
            pass
        
        return AffiliateApprovalResponse(
            success=True,
            message=f"Affiliate application {action_word} successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to process affiliate application")

@router.get("/analytics")
async def get_affiliate_program_analytics(user: AuthorizedUser) -> Dict[str, Any]:
    """Get overall affiliate program analytics (admin only)"""
    verify_admin_access(user)
    
    try:
        db_firestore = get_firestore_client()
        
        # Get all affiliates
        affiliates = db_firestore.collection("affiliates").get()
        
        # Get all referrals
        referrals = db_firestore.collection("referrals").get()
        
        # Calculate analytics
        total_affiliates = len(affiliates)
        active_affiliates = 0
        total_earnings_paid = 0
        total_earnings_pending = 0
        total_referrals = 0
        total_conversions = 0
        
        status_counts = {"pending": 0, "approved": 0, "rejected": 0, "suspended": 0}
        
        for affiliate_doc in affiliates:
            data = affiliate_doc.to_dict()
            status = data.get("status", "pending")
            status_counts[status] = status_counts.get(status, 0) + 1
            
            if status == "approved":
                active_affiliates += 1
                total_earnings_paid += data.get("paid_earnings", 0)
                total_earnings_pending += data.get("pending_earnings", 0)
        
        for referral_doc in referrals:
            data = referral_doc.to_dict()
            total_referrals += 1
            if data.get("status") == "converted":
                total_conversions += 1
        
        conversion_rate = (total_conversions / max(total_referrals, 1)) * 100
        
        return {
            "overview": {
                "total_affiliates": total_affiliates,
                "active_affiliates": active_affiliates,
                "total_referrals": total_referrals,
                "total_conversions": total_conversions,
                "conversion_rate": round(conversion_rate, 2),
                "total_earnings_paid": total_earnings_paid,
                "total_earnings_pending": total_earnings_pending
            },
            "status_breakdown": status_counts,
            "commission_summary": {
                "total_paid": total_earnings_paid,
                "total_pending": total_earnings_pending,
                "total_committed": total_earnings_paid + total_earnings_pending
            }
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get affiliate analytics")

@router.get("/referrals")
async def list_all_referrals(
    status: Optional[str] = Query(None, description="Filter by status: pending, converted, cancelled"),
    affiliate_id: Optional[str] = Query(None, description="Filter by affiliate ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user: AuthorizedUser = None
) -> Dict[str, Any]:
    """List all referrals with filtering (admin only)"""
    verify_admin_access(user)
    
    try:
        db_firestore = get_firestore_client()
        
        # Build query
        query = db_firestore.collection("referrals")
        
        if status:
            query = query.where(filter=firestore.FieldFilter("status", "==", status))
        
        if affiliate_id:
            query = query.where(filter=firestore.FieldFilter("affiliate_id", "==", affiliate_id))
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.order_by("created_at", direction=firestore.Query.DESCENDING)
        query = query.offset(offset).limit(limit)
        
        referrals_docs = query.get()
        
        referrals = []
        for doc in referrals_docs:
            data = doc.to_dict()
            referrals.append(data)
        
        # Get total count
        total_query = db_firestore.collection("referrals")
        if status:
            total_query = total_query.where("status", "==", status)
        if affiliate_id:
            total_query = total_query.where("affiliate_id", "==", affiliate_id)
        
        total_count = len(total_query.get())
        
        return {
            "referrals": referrals,
            "total_count": total_count,
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to list referrals")
