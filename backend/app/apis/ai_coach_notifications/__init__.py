from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import databutton as db
from datetime import datetime
import json
from typing import Dict, Any
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/ai-coach-notifications")

class NotificationSignupRequest(BaseModel):
    email: EmailStr
    features_interested: list[str] = []
    current_role: str = ""
    experience_level: str = ""

class NotificationSignupResponse(BaseModel):
    success: bool
    message: str
    signup_id: str

class GetNotificationStatsResponse(BaseModel):
    total_signups: int
    recent_signups: int
    top_features: list[Dict[str, Any]]

@router.post("/signup", response_model=NotificationSignupResponse)
async def signup_for_ai_coach_notifications(request: NotificationSignupRequest) -> NotificationSignupResponse:
    """
    Register user for AI Coach launch notifications
    """
    try:
        # Get existing signups
        existing_signups = db.storage.json.get("ai_coach_notifications", default={})
        
        # Check if email already exists
        if request.email in existing_signups:
            return NotificationSignupResponse(
                success=False,
                message="Email already registered for notifications",
                signup_id=""
            )
        
        # Create signup entry
        signup_id = f"signup_{len(existing_signups) + 1}_{int(datetime.now().timestamp())}"
        signup_data = {
            "email": request.email,
            "features_interested": request.features_interested,
            "current_role": request.current_role,
            "experience_level": request.experience_level,
            "signup_date": datetime.now().isoformat(),
            "signup_id": signup_id
        }
        
        # Add to signups
        existing_signups[request.email] = signup_data
        
        # Save updated signups
        db.storage.json.put("ai_coach_notifications", existing_signups)
        
        # Send welcome email
        try:
            # Create the email message
            msg = MIMEMultipart()
            msg['From'] = "TradingBait"
            msg['To'] = request.email
            msg['Subject'] = "🤖 You're on the AI Trading Coach Early Access List!"
            
            # Add HTML content
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #e2e8f0; padding: 40px; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #06b6d4; font-size: 28px; margin: 0; text-shadow: 0 0 20px rgba(6, 182, 212, 0.3);">🤖 TradingBait AI Coach</h1>
                    <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">Early Access Confirmed</p>
                </div>
                
                <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <h2 style="color: #06b6d4; font-size: 20px; margin: 0 0 15px 0;">Welcome to the Future of Trading Psychology!</h2>
                    <p style="color: #cbd5e1; line-height: 1.6; margin: 0;">You're now on our exclusive early access list for the revolutionary AI Trading Coach. Get ready for personalized insights, real-time coaching, and behavioral pattern recognition that will transform your trading journey.</p>
                </div>
                
                <div style="margin: 25px 0;">
                    <h3 style="color: #e2e8f0; font-size: 18px; margin: 0 0 15px 0;">What to Expect:</h3>
                    <ul style="color: #94a3b8; line-height: 1.8; padding-left: 20px;">
                        <li>🎯 Personalized trading psychology insights</li>
                        <li>💬 Real-time conversational coaching</li>
                        <li>🔊 Voice-enabled coaching sessions</li>
                        <li>📊 Advanced behavioral pattern recognition</li>
                        <li>⚡ 24/7 AI-powered trading guidance</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">We'll notify you the moment the AI Coach goes live!</p>
                </div>
                
                <div style="border-top: 1px solid rgba(100, 116, 139, 0.3); padding-top: 20px; text-align: center;">
                    <p style="color: #64748b; font-size: 12px; margin: 0;">TradingBait - Your Trading Psychology Command Center</p>
                </div>
            </div>
            """
            msg.attach(MIMEText(html_content, 'html'))
            
            # Add text content
            text_content = "Welcome to TradingBait AI Coach Early Access! You're now registered to receive notifications when our revolutionary conversational AI trading coach launches. Get ready for personalized insights, real-time coaching, and behavioral pattern recognition."
            msg.attach(MIMEText(text_content, 'plain'))
            
            # Send the email
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login("your_email@gmail.com", "your_password")
            server.sendmail("your_email@gmail.com", request.email, msg.as_string())
            server.quit()
        except Exception as email_error:
            pass
            # Continue anyway - signup was successful
        
        return NotificationSignupResponse(
            success=True,
            message="Successfully registered for AI Coach notifications!",
            signup_id=signup_id
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to register for notifications")

@router.get("/stats", response_model=GetNotificationStatsResponse)
async def get_notification_stats() -> GetNotificationStatsResponse:
    """
    Get statistics about AI Coach notification signups
    """
    try:
        signups = db.storage.json.get("ai_coach_notifications", default={})
        
        total_signups = len(signups)
        
        # Count recent signups (last 7 days)
        recent_threshold = datetime.now().timestamp() - (7 * 24 * 60 * 60)
        recent_signups = 0
        
        # Count feature interests
        feature_counts = {}
        
        for email, data in signups.items():
            signup_date = datetime.fromisoformat(data.get('signup_date', '2024-01-01T00:00:00'))
            if signup_date.timestamp() > recent_threshold:
                recent_signups += 1
            
            for feature in data.get('features_interested', []):
                feature_counts[feature] = feature_counts.get(feature, 0) + 1
        
        # Get top features
        top_features = [
            {"feature": feature, "count": count}
            for feature, count in sorted(feature_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]
        
        return GetNotificationStatsResponse(
            total_signups=total_signups,
            recent_signups=recent_signups,
            top_features=top_features
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to get notification stats")
