import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import databutton as db
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
import json

def send_email(to: str, subject: str, html_content: str, text_content: str = None) -> bool:
    """Send email using SMTP configuration"""
    try:
        # Get SMTP configuration from environment variables
        smtp_host = os.environ.get("SMTP_HOST")
        smtp_port_str = os.environ.get("SMTP_PORT", "587")
        smtp_port = int(smtp_port_str) if smtp_port_str else 587
        smtp_user = os.environ.get("SMTP_USER")
        smtp_pass = os.environ.get("SMTP_PASS")
        
        if not all([smtp_host, smtp_user, smtp_pass]):
            print("SMTP configuration missing")
            return False

        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_user
        msg['To'] = to
        
        # Create text content if not provided
        if text_content is None:
            text_content = strip_html_tags(html_content)
            
        # Attach parts
        text_part = MIMEText(text_content, 'plain')
        html_part = MIMEText(html_content, 'html')
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Send email using SMTP
        if smtp_port == 465:
            # Use SSL for port 465
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [to], msg.as_string())
        else:
            # Use STARTTLS for other ports (like 587)
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [to], msg.as_string())
                
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False

def strip_html_tags(html: str) -> str:
    """Simple HTML tag removal for text content"""
    import re
    clean = re.compile('<.*?>')
    return re.sub(clean, '', html)

def generate_ticket_id() -> str:
    """Generate a unique ticket ID"""
    return f"TB-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

def create_support_ticket(
    user_email: str,
    subject: str,
    message: str,
    category: str,
    priority: str = "medium",
    user_context: Optional[Dict[str, Any]] = None,
    conversation_history: Optional[list] = None
) -> Dict[str, Any]:
    """Create a support ticket and send emails"""
    
    ticket_id = generate_ticket_id()
    timestamp = datetime.now().isoformat()
    
    # Prepare ticket data
    ticket_data = {
        "ticket_id": ticket_id,
        "user_email": user_email,
        "subject": subject,
        "message": message,
        "category": category,
        "priority": priority,
        "created_at": timestamp,
        "status": "open",
        "user_context": user_context or {},
        "conversation_history": conversation_history or []
    }
    
    try:
        # Store ticket in databutton storage
        db.storage.json.put(f"support_tickets_{ticket_id}", ticket_data)
        
        # Send ticket to support team
        support_email_sent = send_support_team_email(ticket_data)
        
        # Send confirmation to user
        user_email_sent = send_user_confirmation_email(ticket_data)
        
        return {
            "success": True,
            "ticket_id": ticket_id,
            "support_email_sent": support_email_sent,
            "user_email_sent": user_email_sent,
            "message": f"Support ticket {ticket_id} created successfully"
        }
        
    except Exception as e:
        print(f"Error creating support ticket: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to create support ticket"
        }

def send_support_team_email(ticket_data: Dict[str, Any]) -> bool:
    """Send support ticket to the support team"""
    
    # Format conversation history
    conversation_html = ""
    if ticket_data.get("conversation_history"):
        conversation_html = "<h3>Chat Conversation History:</h3><div style='background: #f8f9fa; padding: 15px; border-left: 3px solid #007bff; margin: 15px 0;'>"
        for msg in ticket_data["conversation_history"]:
            sender = "User" if msg.get("sender") == "user" else "Assistant"
            conversation_html += f"<p><strong>{sender}:</strong> {msg.get('message', '')}</p>"
        conversation_html += "</div>"
    
    # Format user context
    context_html = ""
    if ticket_data.get("user_context"):
        context_html = "<h3>User Context:</h3><ul>"
        for key, value in ticket_data["user_context"].items():
            context_html += f"<li><strong>{key.replace('_', ' ').title()}:</strong> {value}</li>"
        context_html += "</ul>"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px;">🎯 New Support Ticket</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">TradingBait Support Portal</p>
                </div>
                
                <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #e0e0e0;">
                        <h2 style="margin: 0; color: #495057;">Ticket Details</h2>
                    </div>
                    
                    <div style="padding: 20px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; width: 30%; font-weight: bold; color: #666;">Ticket ID:</td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #007bff; font-weight: bold;">{ticket_data['ticket_id']}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">User Email:</td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">{ticket_data['user_email']}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Category:</td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                    <span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px;">{ticket_data['category']}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Priority:</td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                    <span style="background: {'#fff3cd' if ticket_data['priority'] == 'medium' else '#f8d7da' if ticket_data['priority'] == 'high' else '#d4edda'}; 
                                                 color: {'#856404' if ticket_data['priority'] == 'medium' else '#721c24' if ticket_data['priority'] == 'high' else '#155724'}; 
                                                 padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">{ticket_data['priority']}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #666;">Created:</td>
                                <td style="padding: 8px 0;">{datetime.fromisoformat(ticket_data['created_at']).strftime('%Y-%m-%d %H:%M:%S UTC')}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; margin-top: 20px; overflow: hidden;">
                    <div style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #e0e0e0;">
                        <h3 style="margin: 0; color: #495057;">Subject</h3>
                    </div>
                    <div style="padding: 20px;">
                        <p style="margin: 0; font-size: 16px; font-weight: 500;">{ticket_data['subject']}</p>
                    </div>
                </div>
                
                <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; margin-top: 20px; overflow: hidden;">
                    <div style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #e0e0e0;">
                        <h3 style="margin: 0; color: #495057;">Message</h3>
                    </div>
                    <div style="padding: 20px;">
                        <div style="background: #f8f9fa; padding: 15px; border-left: 3px solid #007bff; border-radius: 4px;">
                            {ticket_data['message'].replace(chr(10), '<br>')}
                        </div>
                    </div>
                </div>
                
                {context_html}
                {conversation_html}
                
                <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #666;">Reply to this email to respond to the customer.</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">Ticket created via TradingBait Support Widget</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(
        to="support@tradingbait.com",
        subject=f"[{ticket_data['ticket_id']}] {ticket_data['subject']}",
        html_content=html_content
    )

def send_user_confirmation_email(ticket_data: Dict[str, Any]) -> bool:
    """Send confirmation email to user"""
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px;">✅ Support Ticket Received</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">TradingBait Support Team</p>
                </div>
                
                <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
                    <p style="margin-top: 0;">Hi there,</p>
                    
                    <p>Thank you for contacting TradingBait support! We've received your support request and wanted to confirm the details:</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-left: 3px solid #007bff; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Ticket ID:</strong> <span style="color: #007bff; font-weight: bold;">{ticket_data['ticket_id']}</span></p>
                        <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> {ticket_data['subject']}</p>
                        <p style="margin: 0;"><strong>Category:</strong> {ticket_data['category']}</p>
                    </div>
                    
                    <p><strong>What happens next?</strong></p>
                    <ul>
                        <li>Our support team will review your request within 24 hours</li>
                        <li>We'll send you updates via email using this ticket ID</li>
                        <li>For urgent issues, you can also reach us via Discord</li>
                    </ul>
                    
                    <p><strong>Your message:</strong></p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
                        {ticket_data['message'].replace(chr(10), '<br>')}
                    </div>
                    
                    <p>If you have any additional information or need to update your request, simply reply to this email with your ticket ID <strong>{ticket_data['ticket_id']}</strong>.</p>
                    
                    <div style="margin-top: 30px; padding: 20px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #28a745;">
                        <h3 style="margin: 0 0 10px 0; color: #28a745;">🚀 Quick Self-Help</h3>
                        <p style="margin: 0;">While you wait, check out our <a href="https://www.tradingbait.com" style="color: #007bff;">Knowledge Base</a> for instant answers to common questions!</p>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
                    <p>Best regards,<br>The TradingBait Support Team</p>
                    <p>Questions? Contact us at support@tradingbait.com</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return send_email(
        to=ticket_data['user_email'],
        subject=f"Support Ticket Received - {ticket_data['ticket_id']}",
        html_content=html_content
    )

def get_ticket_by_id(ticket_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a support ticket by ID"""
    try:
        return db.storage.json.get(f"support_tickets_{ticket_id}")
    except Exception:
        return None

def list_recent_tickets(limit: int = 50) -> list:
    """List recent support tickets"""
    try:
        files = db.storage.json.list()
        ticket_files = [f for f in files if f.name.startswith('support_tickets_')]
        
        tickets = []
        for file in sorted(ticket_files, key=lambda x: x.name, reverse=True)[:limit]:
            try:
                ticket = db.storage.json.get(file.name)
                tickets.append(ticket)
            except Exception:
                continue
                
        return tickets
    except Exception:
        return []
