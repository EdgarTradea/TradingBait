from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import databutton as db
from app.auth import AuthorizedUser
import re
from datetime import datetime

router = APIRouter()

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

class CorruptedEntryInfo(BaseModel):
    date: str
    storage_key: str
    data_type: str
    corrupted_data: Any
    error_message: str

class CleanupResult(BaseModel):
    fixed_entries: List[str]
    skipped_entries: List[str]
    backup_created: bool
    backup_key: str

class CleanupResponse(BaseModel):
    success: bool
    corrupted_entries_found: List[CorruptedEntryInfo]
    cleanup_result: CleanupResult = None
    message: str

@router.get("/detect-corrupted-entries")
async def detect_corrupted_entries(user: AuthorizedUser) -> CleanupResponse:
    """Detect corrupted journal entries for the current user"""
    try:
        user_id = user.sub
        corrupted_entries = []
        
        print(f"🔍 Scanning for corrupted journal entries for user {user_id}")
        
        # Check both individual entries and entries list
        # Individual entries pattern: journal_entry_{user_id}_{date}
        # Entries list pattern: journal_entries_{user_id}
        
        # First, check the entries list for corrupted data
        entries_key = sanitize_storage_key(f"journal_entries_{user_id}")
        try:
            entries_data = db.storage.json.get(entries_key, default=[])
            
            for i, entry_data in enumerate(entries_data):
                if not isinstance(entry_data, dict):
                    # Found corrupted entry in the list
                    corrupted_entries.append(CorruptedEntryInfo(
                        date=f"list_entry_{i}",
                        storage_key=entries_key,
                        data_type=str(type(entry_data)),
                        corrupted_data=str(entry_data)[:200],  # Limit to first 200 chars
                        error_message=f"Entry {i} in list is not a dict: {type(entry_data)}"
                    ))
                    print(f"Warning: Found corrupted entry in list at index {i}: {type(entry_data)}")
        except Exception as e:
            print(f"Error checking entries list: {e}")
        
        # Also check for individual date entries that might be corrupted
        # For the specific dates mentioned in the logs
        problematic_dates = [
            "2025-08-05", "2025-08-06", "2025-08-07", 
            "2025-08-08", "2025-08-09", "2025-08-10", "2025-08-11"
        ]
        
        for date in problematic_dates:
            individual_key = sanitize_storage_key(f"journal_entry_{user_id}_{date}")
            try:
                entry_data = db.storage.json.get(individual_key)
                
                # Try to validate the structure
                if not isinstance(entry_data, dict):
                    corrupted_entries.append(CorruptedEntryInfo(
                        date=date,
                        storage_key=individual_key,
                        data_type=str(type(entry_data)),
                        corrupted_data=str(entry_data)[:200],
                        error_message=f"Individual entry is not a dict: {type(entry_data)}"
                    ))
                    print(f"Warning: Found corrupted individual entry for {date}: {type(entry_data)}")
                elif not entry_data.get('date'):
                    corrupted_entries.append(CorruptedEntryInfo(
                        date=date,
                        storage_key=individual_key,
                        data_type="dict_missing_date",
                        corrupted_data=str(entry_data)[:200],
                        error_message="Dict entry missing date field"
                    ))
                    
            except FileNotFoundError:
                # This is normal - entry doesn't exist
                continue
            except Exception as e:
                corrupted_entries.append(CorruptedEntryInfo(
                    date=date,
                    storage_key=individual_key,
                    data_type="unknown_error",
                    corrupted_data="N/A",
                    error_message=f"Error accessing entry: {str(e)}"
                ))
        
        return CleanupResponse(
            success=True,
            corrupted_entries_found=corrupted_entries,
            message=f"Found {len(corrupted_entries)} corrupted entries"
        )
        
    except Exception as e:
        print(f"Error detecting corrupted entries: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to detect corrupted entries: {str(e)}")

@router.post("/cleanup-corrupted-entries")
async def cleanup_corrupted_entries(user: AuthorizedUser) -> CleanupResponse:
    """Clean up corrupted journal entries by removing them and creating backups"""
    try:
        user_id = user.sub
        
        print(f"🧹 Starting cleanup of corrupted journal entries for user {user_id}")
        
        # First detect corrupted entries
        detection_result = await detect_corrupted_entries(user)
        
        if not detection_result.corrupted_entries_found:
            return CleanupResponse(
                success=True,
                corrupted_entries_found=[],
                cleanup_result=CleanupResult(
                    fixed_entries=[],
                    skipped_entries=[],
                    backup_created=False,
                    backup_key=""
                ),
                message="No corrupted entries found to clean up"
            )
        
        # Create backup before cleanup
        backup_key = sanitize_storage_key(f"corrupted_journal_backup_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        backup_data = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "corrupted_entries": [entry.dict() for entry in detection_result.corrupted_entries_found]
        }
        
        db.storage.json.put(backup_key, backup_data)
        print(f"✅ Created backup at {backup_key}")
        
        fixed_entries = []
        skipped_entries = []
        
        # Process each corrupted entry
        for corrupted_entry in detection_result.corrupted_entries_found:
            try:
                if "list_entry_" in corrupted_entry.date:
                    # This is a corrupted entry in the entries list
                    # We need to clean the entries list
                    entries_key = corrupted_entry.storage_key
                    entries_data = db.storage.json.get(entries_key, default=[])
                    
                    # Filter out corrupted entries (non-dict entries)
                    clean_entries = []
                    for entry in entries_data:
                        if isinstance(entry, dict):
                            clean_entries.append(entry)
                        else:
                            print(f"Removing corrupted entry from list: {type(entry)}")
                    
                    # Save the cleaned list
                    db.storage.json.put(entries_key, clean_entries)
                    fixed_entries.append(f"Cleaned entries list: removed {len(entries_data) - len(clean_entries)} corrupted entries")
                    
                else:
                    # This is an individual corrupted entry
                    # Remove the corrupted individual entry
                    try:
                        # We can't easily "fix" a corrupted individual entry
                        # So we'll document it but leave it for manual review
                        skipped_entries.append(f"Individual entry {corrupted_entry.date}: {corrupted_entry.error_message}")
                        print(f"Skipped individual corrupted entry for manual review: {corrupted_entry.date}")
                    except Exception as delete_error:
                        print(f"Error handling individual entry {corrupted_entry.date}: {delete_error}")
                        skipped_entries.append(f"Error processing {corrupted_entry.date}: {delete_error}")
                        
            except Exception as fix_error:
                print(f"Error fixing entry {corrupted_entry.date}: {fix_error}")
                skipped_entries.append(f"Error fixing {corrupted_entry.date}: {fix_error}")
        
        cleanup_result = CleanupResult(
            fixed_entries=fixed_entries,
            skipped_entries=skipped_entries,
            backup_created=True,
            backup_key=backup_key
        )
        
        return CleanupResponse(
            success=True,
            corrupted_entries_found=detection_result.corrupted_entries_found,
            cleanup_result=cleanup_result,
            message=f"Cleanup completed. Fixed {len(fixed_entries)} entries, skipped {len(skipped_entries)} entries. Backup created at {backup_key}"
        )
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cleanup corrupted entries: {str(e)}")
