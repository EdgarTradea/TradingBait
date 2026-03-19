


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import databutton as db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os

router = APIRouter()

class WelcomeEmailRequest(BaseModel):
    email: EmailStr
    user_id: str
    signup_method: str = "email"  # "email" or "google"
    user_name: Optional[str] = None

class WelcomeEmailResponse(BaseModel):
    success: bool
    message: str

@router.post("/send-welcome-email", response_model=WelcomeEmailResponse)
async def send_welcome_email(request: WelcomeEmailRequest):
    """Send welcome email to new users after signup"""
    try:
        print(f"Sending welcome email to: {request.email} (User ID: {request.user_id}, Method: {request.signup_method})")
        
        # Get SMTP configuration from secrets
        smtp_host = os.environ.get("SMTP_HOST")
        smtp_port = int(os.environ.get("SMTP_PORT", 587))
        smtp_user = os.environ.get("SMTP_USER")
        smtp_pass = os.environ.get("SMTP_PASS")
        
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "🚀 Welcome to TradingBait - Your Trading Psychology Command Center!"
        msg['From'] = smtp_user
        msg['To'] = request.email
        
        # Determine user display name
        display_name = request.user_name or "Trader"
        
        # Create HTML content with TradingBait styling
        html_content = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #e2e8f0; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #06b6d4; font-size: 32px; margin: 0; text-shadow: 0 0 20px rgba(6, 182, 212, 0.3); font-weight: 700;">🚀 TradingBait</h1>
                <p style="color: #64748b; font-size: 18px; margin: 10px 0 0 0; font-weight: 300;">Your Trading Psychology Command Center</p>
            </div>
            
            <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; backdrop-filter: blur(10px);">
                <h2 style="color: #06b6d4; font-size: 24px; margin: 0 0 15px 0; font-weight: 600;">Welcome, {display_name}! 🎯</h2>
                <p style="color: #cbd5e1; line-height: 1.7; margin: 0; font-size: 16px;">You've just joined the elite ranks of professional traders who understand that psychology is the ultimate edge in the markets. TradingBait is your command center for mastering trading discipline and unlocking consistent profitability.</p>
            </div>
            
            <div style="margin: 30px 0;">
                <h3 style="color: #e2e8f0; font-size: 20px; margin: 0 0 20px 0; font-weight: 600;">🎯 Your Next Steps to Trading Excellence:</h3>
                
                <div style="margin: 20px 0;">
                    <div style="background: rgba(15, 23, 42, 0.6); border-left: 4px solid #10b981; padding: 20px; margin: 15px 0; border-radius: 8px;">
                        <h4 style="color: #10b981; font-size: 18px; margin: 0 0 10px 0; display: flex; align-items: center;">
                            <span style="margin-right: 10px;">📊</span>Import Your Trading Data
                        </h4>
                        <p style="color: #94a3b8; margin: 0; line-height: 1.6;">Upload CSV or HTML files from your broker to get started. Export your trade history from MetaTrader, cTrader, or any major platform and import it in seconds. Our advanced analytics will reveal patterns in your trading behavior that drive performance.</p>
                    </div>
                    
                    <div style="background: rgba(15, 23, 42, 0.6); border-left: 4px solid #f59e0b; padding: 20px; margin: 15px 0; border-radius: 8px;">
                        <h4 style="color: #f59e0b; font-size: 18px; margin: 0 0 10px 0; display: flex; align-items: center;">
                            <span style="margin-right: 10px;">🧠</span>Explore AI-Powered Insights
                        </h4>
                        <p style="color: #94a3b8; margin: 0; line-height: 1.6;">Access personalized coaching recommendations based on your trading patterns. Our AI identifies blind spots and suggests specific improvements.</p>
                    </div>
                </div>
            </div>
            
            <div style="background: linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                <h3 style="color: #e2e8f0; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">🏆 Master Your Trading Psychology</h3>
                <p style="color: #94a3b8; line-height: 1.7; margin: 0 0 20px 0;">Join thousands of profitable traders who've transformed their performance with TradingBait's behavioral analytics and disciplined journaling approach.</p>
                <div style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);">
                    <a href="https://www.tradingbait.com/dashboard" style="color: white; text-decoration: none;">Start Your Journey →</a>
                </div>
            </div>
            
            <div style="margin: 30px 0;">
                <h3 style="color: #e2e8f0; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">💡 Pro Tips for Success:</h3>
                <ul style="color: #94a3b8; line-height: 1.8; padding-left: 20px; margin: 0;">
                    <li>📝 Journal every trade, win or lose - consistency is key</li>
                    <li>🎯 Focus on your behavioral patterns, not just P&L</li>
                    <li>⚡ Review your weekly analytics to spot improvement areas</li>
                    <li>🧘 Use our habit tracking to build disciplined routines</li>
                    <li>🤖 Let our AI coach guide your development journey</li>
                </ul>
            </div>
            
            <div style="border-top: 1px solid rgba(100, 116, 139, 0.3); padding-top: 25px; text-align: center; margin-top: 40px;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">Need help getting started? We're here for you.</p>
                <p style="color: #64748b; font-size: 14px; margin: 0;">📧 <a href="mailto:support@tradingbait.com" style="color: #06b6d4; text-decoration: none;">support@tradingbait.com</a> | 🌐 <a href="https://www.tradingbait.com" style="color: #06b6d4; text-decoration: none;">www.tradingbait.com</a></p>
                <p style="color: #475569; font-size: 12px; margin: 15px 0 0 0;">TradingBait - Transform Your Trading Psychology</p>
            </div>
        </div>
        """
        
        # Create text content (fallback for email clients that don't support HTML)
        text_content = f"""
        Welcome to TradingBait, {display_name}!
        
        You've just joined the elite ranks of professional traders who understand that psychology is the ultimate edge in the markets.
        
        Your Next Steps:
        1. Import Your Trading Data - Upload CSV or HTML files from your broker to get started
        2. Explore AI-Powered Insights - Access personalized coaching recommendations
        
        Pro Tips for Success:
        - Import your trade history from MetaTrader, cTrader, or any major platform
        - Focus on your behavioral patterns, not just P&L
        - Review your weekly analytics to spot improvement areas
        - Use our habit tracking to build disciplined routines
        - Let our AI coach guide your development journey
        
        Get started at: https://www.tradingbait.com/dashboard
        
        Need help? Contact us at support@tradingbait.com
        
        TradingBait - Transform Your Trading Psychology
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
                server.sendmail(smtp_user, [request.email], msg.as_string())
        else:
            # Use STARTTLS for other ports (like 587)
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [request.email], msg.as_string())
        
        print(f"Welcome email sent successfully to {request.email}")
        
        return WelcomeEmailResponse(
            success=True,
            message="Welcome email sent successfully!"
        )
        
    except Exception as e:
        print(f"Error sending welcome email: {str(e)}")
        # Don't raise HTTP exception to avoid blocking signup process
        return WelcomeEmailResponse(
            success=False,
            message="Email sending failed, but signup was successful"
        )
