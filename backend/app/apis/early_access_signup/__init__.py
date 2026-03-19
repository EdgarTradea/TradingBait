from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import databutton as db
import re
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import os

router = APIRouter()

class EarlyAccessSignupRequest(BaseModel):
    email: EmailStr

class EarlyAccessSignupResponse(BaseModel):
    success: bool
    message: str
    already_subscribed: bool = False

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def send_confirmation_email(email: str) -> bool:
    """Send confirmation email to the subscriber"""
    try:
        # Get SMTP configuration
        smtp_host = os.environ.get("SMTP_HOST")
        smtp_port_str = os.environ.get("SMTP_PORT")
        smtp_port = int(smtp_port_str) if smtp_port_str else 587
        smtp_user = os.environ.get("SMTP_USER")
        smtp_pass = os.environ.get("SMTP_PASS")
        
        if not all([smtp_host, smtp_user, smtp_pass]):
            pass
            return False
        
        # Create email content
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Welcome to TradingBait Early Access! 🚀"
        msg['From'] = smtp_user
        msg['To'] = email
        
        # HTML email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to TradingBait Early Access</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; background: linear-gradient(90deg, #10b981, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">TradingBait</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Master Your Trading Psychology</p>
            </div>
            
            <div style="padding: 30px 0;">
                <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to Early Access! 🎉</h2>
                
                <p>Hi there!</p>
                
                <p>Thank you for joining the TradingBait early access program! You're now part of an exclusive group that will be the first to experience our revolutionary AI-powered trading psychology platform.</p>
                
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #047857; margin-top: 0;">What's Coming Your Way:</h3>
                    <ul style="color: #065f46; margin: 0; padding-left: 20px;">
                        <li><strong>Exclusive Beta Access</strong> - Be among the first to test new features</li>
                        <li><strong>Launch Notifications</strong> - Get notified the moment we go live</li>
                        <li><strong>Special Discount</strong> - Exclusive pricing for early supporters</li>
                        <li><strong>Direct Feedback Channel</strong> - Your input shapes our platform</li>
                    </ul>
                </div>
                
                <p>We're working hard to build something truly special that will transform how traders understand and improve their psychology. Your early interest means the world to us!</p>
                
                <p>Stay tuned for updates - we'll be in touch very soon with exciting news about our beta launch.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.tradingbait.com" style="display: inline-block; background: linear-gradient(90deg, #10b981, #3b82f6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Visit TradingBait</a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>The TradingBait Team</p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
                <p>This email was sent to {email} because you signed up for TradingBait early access.</p>
                <p>© 2024 TradingBait. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        # Text version for email clients that don't support HTML
        text_content = f"""
        Welcome to TradingBait Early Access!
        
        Hi there!
        
        Thank you for joining the TradingBait early access program! You're now part of an exclusive group that will be the first to experience our revolutionary AI-powered trading psychology platform.
        
        What's Coming Your Way:
        • Exclusive Beta Access - Be among the first to test new features
        • Launch Notifications - Get notified the moment we go live  
        • Special Discount - Exclusive pricing for early supporters
        • Direct Feedback Channel - Your input shapes our platform
        
        We're working hard to build something truly special that will transform how traders understand and improve their psychology. Your early interest means the world to us!
        
        Stay tuned for updates - we'll be in touch very soon with exciting news about our beta launch.
        
        Best regards,
        The TradingBait Team
        
        Visit us at: https://www.tradingbait.com
        
        This email was sent to {email} because you signed up for TradingBait early access.
        © 2024 TradingBait. All rights reserved.
        """
        
        # Attach parts
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Use proper SSL connection for port 465
        if smtp_port == 465:
            # SSL connection (port 465)
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, email, msg.as_string())
        else:
            # TLS connection (port 587)
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, email, msg.as_string())
        
        pass
        return True
        
    except Exception as e:
        pass
        return False

@router.post("/early-access-signup")
async def early_access_signup(request: EarlyAccessSignupRequest) -> EarlyAccessSignupResponse:
    """
    Handle early access email signup with duplicate prevention and confirmation email.
    """
    try:
        email = request.email.lower().strip()
        
        # Create sanitized storage key for the email
        email_key = f"early_access_email_{sanitize_storage_key(email.replace('@', '_at_').replace('.', '_dot_'))}"
        
        # Check if email already exists
        try:
            existing_data = db.storage.json.get(email_key)
            if existing_data:
                return EarlyAccessSignupResponse(
                    success=True,
                    message="You're already on our early access list! We'll be in touch soon.",
                    already_subscribed=True
                )
        except Exception:
            # Email doesn't exist yet, which is what we want
            pass
        
        # Store email with timestamp and metadata FIRST (this is the critical part)
        signup_data = {
            "email": email,
            "signup_date": datetime.utcnow().isoformat(),
            "source": "homepage_hero",
            "confirmed": False
        }
        
        # Save to storage - this MUST succeed
        db.storage.json.put(email_key, signup_data)
        
        # Also maintain a list of all early access emails for easy retrieval
        try:
            email_list = db.storage.json.get("early_access_emails_list", default=[])
        except Exception:
            email_list = []
        
        # Add email to list if not already there
        if email not in email_list:
            email_list.append(email)
            db.storage.json.put("early_access_emails_list", email_list)
        
        pass
        
        # Try to send confirmation email with proper SSL/TLS handling
        email_sent = False
        try:
            email_sent = send_confirmation_email(email)
            if email_sent:
                # Update confirmation status
                signup_data["confirmed"] = True
                signup_data["confirmation_sent_at"] = datetime.utcnow().isoformat()
                db.storage.json.put(email_key, signup_data)
                pass
        except Exception as e:
            pass
        
        # Always return success since email is stored successfully
        return EarlyAccessSignupResponse(
            success=True,
            message="Welcome to early access! You're all set - we'll be in touch soon with exclusive updates." + (" Check your email for confirmation!" if email_sent else ""),
            already_subscribed=False
        )
        
    except Exception as e:
        pass
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your signup. Please try again."
        )

@router.get("/early-access-stats")
async def get_early_access_stats():
    """
    Get early access signup statistics (for admin use).
    """
    try:
        email_list = db.storage.json.get("early_access_emails_list", default=[])
        return {
            "total_signups": len(email_list),
            "signup_count": len(email_list)
        }
    except Exception as e:
        pass
        return {
            "total_signups": 0,
            "signup_count": 0
        }
