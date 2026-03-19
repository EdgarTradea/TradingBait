

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import databutton as db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.auth import AuthorizedUser
import os

router = APIRouter()

class SupportEmailRequest(BaseModel):
    user_email: EmailStr
    subject: str
    message: str
    priority: str = "medium"  # low, medium, high, urgent
    user_name: Optional[str] = None
    user_id: Optional[str] = None

class SupportEmailResponse(BaseModel):
    success: bool
    message: str

@router.post("/send-support-email", response_model=SupportEmailResponse)
async def send_support_email(request: SupportEmailRequest):
    """Send support email from user to support team"""
    try:
        pass
        
        # Get SMTP configuration from secrets
        smtp_host = os.environ.get("SMTP_HOST")
        smtp_port = int(os.environ.get("SMTP_PORT"))
        smtp_user = os.environ.get("SMTP_USER")
        smtp_pass = os.environ.get("SMTP_PASS")
        
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"[Support Request - {request.priority.upper()}] {request.subject}"
        msg['From'] = smtp_user
        msg['To'] = "support@tradingbait.com"
        msg['Reply-To'] = request.user_email
        
        # Determine user display name
        display_name = request.user_name or request.user_email.split('@')[0]
        user_id_text = f" (ID: {request.user_id})" if request.user_id else " (Anonymous)"
        
        # Priority emoji mapping
        priority_emojis = {
            "low": "🟢",
            "medium": "🟡", 
            "high": "🟠",
            "urgent": "🔴"
        }
        priority_emoji = priority_emojis.get(request.priority, "🟡")
        
        # Create HTML content
        html_content = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 8px;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #e2e8f0; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="color: #06b6d4; font-size: 24px; margin: 0 0 10px 0; font-weight: 700;">🎯 TradingBait Support Request</h1>
                <p style="color: #64748b; margin: 0; font-size: 14px;">New customer inquiry</p>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0; display: flex; align-items: center;">
                    {priority_emoji} Priority: {request.priority.upper()}
                </h2>
                
                <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <h3 style="color: #475569; font-size: 16px; margin: 0 0 5px 0;">Customer Details:</h3>
                    <p style="margin: 5px 0; color: #64748b;"><strong>Name:</strong> {display_name}</p>
                    <p style="margin: 5px 0; color: #64748b;"><strong>Email:</strong> {request.user_email}</p>
                    <p style="margin: 5px 0; color: #64748b;"><strong>User ID:</strong> {user_id_text}</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3 style="color: #475569; font-size: 16px; margin: 0 0 10px 0;">Subject:</h3>
                    <p style="color: #1e293b; font-size: 16px; font-weight: 500; margin: 0; background: #f8fafc; padding: 10px; border-radius: 4px;">{request.subject}</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3 style="color: #475569; font-size: 16px; margin: 0 0 10px 0;">Message:</h3>
                    <div style="color: #1e293b; line-height: 1.6; background: #f8fafc; padding: 15px; border-radius: 4px; white-space: pre-wrap;">{request.message}</div>
                </div>
            </div>
            
            <div style="background: #e0f2fe; border: 1px solid #0891b2; border-radius: 6px; padding: 15px; text-align: center;">
                <p style="color: #0c4a6e; margin: 0; font-size: 14px;">📧 Reply to this email to respond directly to the customer</p>
            </div>
        </div>
        """
        
        # Create text content (fallback)
        text_content = f"""
        TradingBait Support Request
        
        Priority: {request.priority.upper()} {priority_emoji}
        
        Customer Details:
        Name: {display_name}
        Email: {request.user_email}
        User ID: {user_id_text}
        
        Subject: {request.subject}
        
        Message:
        {request.message}
        
        ---
        Reply to this email to respond directly to the customer.
        """
        
        # Attach parts
        text_part = MIMEText(text_content, 'plain')
        html_part = MIMEText(html_content, 'html')
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Send email using SMTP configuration
        if smtp_port == 465:
            # Use SSL for port 465
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, ["support@tradingbait.com"], msg.as_string())
        else:
            # Use STARTTLS for other ports (like 587)
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, ["support@tradingbait.com"], msg.as_string())
        
        pass
        
        return SupportEmailResponse(
            success=True,
            message="Support email sent successfully!"
        )
        
    except Exception as e:
        pass
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to send support email: {str(e)}"
        )
