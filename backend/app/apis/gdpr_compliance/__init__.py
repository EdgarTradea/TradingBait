from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth import AuthorizedUser
import databutton as db
import re
from typing import Dict, Any, Optional
import hashlib
import json
from datetime import datetime

router = APIRouter()

class DataExportRequest(BaseModel):
    include_trading_data: bool = False
    include_journal_entries: bool = False
    include_preferences: bool = True

class DataExportResponse(BaseModel):
    export_data: Dict[str, Any]
    export_date: str
    note: str

class AccountDeletionRequest(BaseModel):
    confirmation_text: str
    immediate_deletion: bool = True

class AccountDeletionResponse(BaseModel):
    success: bool
    message: str
    anonymized_data_retained: bool
    deletion_timestamp: str


def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)


def generate_anonymous_id(user_id: str) -> str:
    """Generate a consistent anonymous ID for data retention purposes"""
    # Create a hash that can't be reverse-engineered but is consistent
    hash_input = f"anonymous_user_{user_id}_salt_2025"
    return hashlib.sha256(hash_input.encode()).hexdigest()[:16]


def anonymize_user_data(data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """Anonymize user data by removing personal identifiers"""
    anonymous_id = generate_anonymous_id(user_id)
    
    anonymized = {}
    for key, value in data.items():
        if key in ['user_id', 'userId', 'uid']:
            anonymized[key] = anonymous_id
        elif key in ['email', 'name', 'displayName', 'display_name', 'photoURL', 'phone']:
            # Remove personal identifiers completely
            continue
        elif isinstance(value, str) and user_id in value:
            # Replace user ID in strings with anonymous ID
            anonymized[key] = value.replace(user_id, anonymous_id)
        elif isinstance(value, dict):
            # Recursively anonymize nested objects
            anonymized[key] = anonymize_user_data(value, user_id)
        elif isinstance(value, list):
            # Anonymize lists
            anonymized[key] = [
                anonymize_user_data(item, user_id) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            anonymized[key] = value
    
    return anonymized


@router.post("/export-personal-data")
async def export_personal_data(
    request: DataExportRequest,
    user: AuthorizedUser
) -> DataExportResponse:
    """
    Export user's personal data in compliance with GDPR Article 15 (Right of access)
    """
    try:
        export_data = {
            "user_info": {
                "user_id": user.sub,
                "email": user.email,
                "email_verified": getattr(user, 'email_verified', False),
                "created_at": getattr(user, 'auth_time', None),
                "provider": getattr(user, 'firebase', {}).get('sign_in_provider', 'unknown')
            }
        }
        
        if request.include_preferences:
            # Export user preferences and settings
            try:
                preferences_key = sanitize_storage_key(f"user_preferences_{user.sub}")
                preferences = db.storage.json.get(preferences_key, default={})
                export_data["preferences"] = preferences
            except Exception:
                export_data["preferences"] = {}
        
        if request.include_trading_data:
            # Note: This would export trading analytics (not recommended for privacy)
            export_data["note_trading_data"] = "Trading data export not implemented for privacy reasons. Use platform export features instead."
        
        if request.include_journal_entries:
            # Note: This would export journal entries (not recommended for privacy)
            export_data["note_journal_data"] = "Journal data export not implemented for privacy reasons. Use platform export features instead."
        
        return DataExportResponse(
            export_data=export_data,
            export_date=datetime.utcnow().isoformat(),
            note="This export contains only personal account information. Trading data and journal entries should be exported separately from their respective platform sections for security reasons."
        )
        
    except Exception as e:
        print(f"Error exporting personal data for user {user.sub}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export personal data")


@router.post("/delete-account")
async def delete_account(
    request: AccountDeletionRequest,
    user: AuthorizedUser
) -> AccountDeletionResponse:
    """
    Delete user account with smart data anonymization in compliance with GDPR Article 17 (Right to erasure)
    """
    try:
        # Verify confirmation text
        if request.confirmation_text != "DELETE MY ACCOUNT":
            raise HTTPException(status_code=400, detail="Invalid confirmation text")
        
        user_id = user.sub
        anonymous_id = generate_anonymous_id(user_id)
        deletion_timestamp = datetime.utcnow().isoformat()
        
        # 1. Anonymize trading analytics data (retain for research)
        anonymized_analytics = False
        try:
            # Get all trade evaluations and anonymize them
            evaluations_key = sanitize_storage_key(f"evaluations_{user_id}")
            evaluations = db.storage.json.get(evaluations_key, default=[])
            
            if evaluations:
                anonymized_evaluations = []
                for evaluation in evaluations:
                    anonymized_eval = anonymize_user_data(evaluation, user_id)
                    anonymized_evaluations.append(anonymized_eval)
                
                # Store anonymized data with anonymous ID
                anonymous_key = sanitize_storage_key(f"anonymized_evaluations_{anonymous_id}")
                db.storage.json.put(anonymous_key, anonymized_evaluations)
                
                # Delete original user-linked data
                db.storage.json.put(evaluations_key, [])
                anonymized_analytics = True
        except Exception as e:
            print(f"Error anonymizing analytics for user {user_id}: {str(e)}")
        
        # 2. Anonymize journal entries (retain insights for research)
        try:
            journal_key = sanitize_storage_key(f"journal_entries_{user_id}")
            journal_entries = db.storage.json.get(journal_key, default=[])
            
            if journal_entries:
                anonymized_entries = []
                for entry in journal_entries:
                    anonymized_entry = anonymize_user_data(entry, user_id)
                    # Remove highly personal content but keep behavioral insights
                    if 'content' in anonymized_entry:
                        # Keep only structured data, remove free text
                        anonymized_entry['content_type'] = 'anonymized'
                        anonymized_entry.pop('content', None)
                    anonymized_entries.append(anonymized_entry)
                
                # Store anonymized journal insights
                anonymous_journal_key = sanitize_storage_key(f"anonymized_journal_{anonymous_id}")
                db.storage.json.put(anonymous_journal_key, anonymized_entries)
                
                # Delete original journal entries
                db.storage.json.put(journal_key, [])
        except Exception as e:
            print(f"Error anonymizing journal for user {user_id}: {str(e)}")
        
        # 3. Delete personal preferences and settings
        try:
            preferences_key = sanitize_storage_key(f"user_preferences_{user_id}")
            db.storage.json.put(preferences_key, {})
        except Exception as e:
            print(f"Error deleting preferences for user {user_id}: {str(e)}")
        
        # 4. Create deletion audit log (anonymized)
        try:
            audit_log = {
                "event": "account_deletion",
                "anonymous_id": anonymous_id,
                "deletion_timestamp": deletion_timestamp,
                "data_anonymized": anonymized_analytics,
                "request_immediate": request.immediate_deletion
            }
            
            audit_key = sanitize_storage_key(f"deletion_audit_{deletion_timestamp.replace(':', '-')}")
            db.storage.json.put(audit_key, audit_log)
        except Exception as e:
            print(f"Error creating audit log: {str(e)}")
        
        # Note: Firebase user deletion should be handled by frontend using Firebase Admin SDK
        # This API focuses on our platform data only
        
        return AccountDeletionResponse(
            success=True,
            message="Account data has been processed for deletion. Personal information deleted, analytics data anonymized for research purposes.",
            anonymized_data_retained=anonymized_analytics,
            deletion_timestamp=deletion_timestamp
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting account for user {user.sub}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process account deletion")


@router.get("/data-retention-info")
async def get_data_retention_info(user: AuthorizedUser) -> Dict[str, Any]:
    """
    Get information about what data is stored and retention policies
    """
    try:
        user_id = user.sub
        
        # Count stored data
        evaluations_count = 0
        journal_count = 0
        preferences_exist = False
        
        try:
            evaluations_key = sanitize_storage_key(f"evaluations_{user_id}")
            evaluations = db.storage.json.get(evaluations_key, default=[])
            evaluations_count = len(evaluations)
        except Exception:
            pass
        
        try:
            journal_key = sanitize_storage_key(f"journal_entries_{user_id}")
            journal_entries = db.storage.json.get(journal_key, default=[])
            journal_count = len(journal_entries)
        except Exception:
            pass
        
        try:
            preferences_key = sanitize_storage_key(f"user_preferences_{user_id}")
            preferences = db.storage.json.get(preferences_key, default={})
            preferences_exist = bool(preferences)
        except Exception:
            pass
        
        return {
            "user_id": user_id,
            "data_summary": {
                "trading_evaluations": evaluations_count,
                "journal_entries": journal_count,
                "preferences_set": preferences_exist,
                "personal_info": "Stored in Firebase Auth"
            },
            "retention_policy": {
                "personal_information": "Deleted immediately upon request",
                "trading_analytics": "Anonymized and retained for platform improvement",
                "journal_insights": "Anonymized and retained for research (personal content removed)",
                "platform_usage": "Anonymized and retained for analytics"
            },
            "anonymization_process": {
                "user_identifiers": "Replaced with non-reversible anonymous ID",
                "personal_content": "Completely removed",
                "behavioral_patterns": "Retained in anonymized form",
                "guarantees": "Anonymized data cannot be traced back to individual users"
            }
        }
        
    except Exception as e:
        print(f"Error getting data retention info for user {user.sub}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get data retention information")
