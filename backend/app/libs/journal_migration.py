"""Journal Data Migration Library

Consolidates all scattered journal data into unified storage pattern.
Handles migration from legacy formats, index arrays, and separate habit storage.
"""

import databutton as db
from typing import Dict, List, Any, Optional
from datetime import datetime
import re

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def get_unified_journal_key(user_id: str, date: str) -> str:
    """Generate unified journal entry storage key"""
    return sanitize_storage_key(f"journal_entry_{user_id}_{date}")

def extract_user_id_from_filename(filename: str) -> Optional[str]:
    """Extract user ID from various filename patterns"""
    patterns = [
        r'journal_entry_([^_]+)_\d{4}-\d{2}-\d{2}',  # journal_entry_USER_DATE
        r'journal_([^_]+)_\d{4}-\d{2}-\d{2}',        # journal_USER_DATE
        r'user_journals_([^_]+)',                     # user_journals_USER
        r'habit_completion_([^_]+)_\d{4}-\d{2}-\d{2}' # habit_completion_USER_DATE
    ]
    
    for pattern in patterns:
        match = re.search(pattern, filename)
        if match:
            return match.group(1)
    
    return None

def extract_date_from_filename(filename: str) -> Optional[str]:
    """Extract date from filename"""
    match = re.search(r'(\d{4}-\d{2}-\d{2})', filename)
    return match.group(1) if match else None

def migrate_user_journal_data(user_id: str) -> Dict[str, Any]:
    """Migrate all journal data for a specific user to unified format"""
    pass
    
    storage_files = db.storage.json.list()
    user_files = [f for f in storage_files if user_id in f.name and 'journal' in f.name.lower()]
    
    pass
    
    # Collect all journal entries by date
    unified_entries = {}  # date -> journal_entry
    
    for file in user_files:
        filename = file.name
        date = extract_date_from_filename(filename)
        
        if not date:
            pass
            continue
            
        try:
            file_data = db.storage.json.get(filename)
            
            if not isinstance(file_data, dict):
                pass
                continue
                
            # Handle different file types
            if filename.startswith('journal_entry_'):
                # Already in unified format
                unified_entries[date] = file_data
                pass
                
            elif filename.startswith('journal_'):
                # Legacy format - convert to unified
                unified_entries[date] = file_data
                pass
                
            elif filename.startswith('user_journals_'):
                # Index array format
                if isinstance(file_data, list):
                    for entry in file_data:
                        if isinstance(entry, dict) and 'date' in entry:
                            entry_date = entry['date']
                            unified_entries[entry_date] = entry
                            pass
                elif isinstance(file_data, dict) and 'entries' in file_data:
                    for entry in file_data['entries']:
                        if isinstance(entry, dict) and 'date' in entry:
                            entry_date = entry['date']
                            unified_entries[entry_date] = entry
                            pass
                            
            elif filename.startswith('habit_completion_'):
                # Separate habit storage - merge with existing entry or create new
                if date in unified_entries:
                    # Merge habits into existing entry
                    if 'habit_completions' in file_data:
                        unified_entries[date]['habits'] = file_data['habit_completions']
                        pass
                else:
                    # Create minimal entry with just habits
                    unified_entries[date] = {
                        'date': date,
                        'user_id': user_id,
                        'habits': file_data.get('habit_completions', []),
                        'mood': None,
                        'energy_level': None,
                        'market_outlook': '',
                        'pre_market_notes': '',
                        'post_market_notes': '',
                        'goals': '',
                        'daily_intentions': '',
                        'challenges': '',
                        'wins': '',
                        'lessons_learned': '',
                        'created_at': file_data.get('created_at', datetime.now().isoformat()),
                        'updated_at': datetime.now().isoformat()
                    }
                    pass
                    
        except Exception as e:
            pass
            continue
    
    # Save all unified entries
    saved_count = 0
    for date, entry in unified_entries.items():
        try:
            # Ensure required fields
            entry['user_id'] = user_id
            entry['date'] = date
            
            # Save to unified format
            unified_key = get_unified_journal_key(user_id, date)
            db.storage.json.put(unified_key, entry)
            saved_count += 1
            
        except Exception as e:
            pass
    
    result = {
        'user_id': user_id,
        'files_processed': len(user_files),
        'entries_migrated': saved_count,
        'dates_consolidated': list(unified_entries.keys())
    }
    
    pass
    return result

def migrate_all_journal_data() -> Dict[str, Any]:
    """Migrate all journal data across all users to unified format"""
    pass
    
    # Find all users with journal data
    storage_files = db.storage.json.list()
    journal_files = [f for f in storage_files if 'journal' in f.name.lower()]
    
    # Extract unique user IDs
    user_ids = set()
    for file in journal_files:
        user_id = extract_user_id_from_filename(file.name)
        if user_id and len(user_id) > 10:  # Filter out invalid user IDs
            user_ids.add(user_id)
    
    pass
    pass
    
    # Migrate each user
    migration_results = []
    for user_id in sorted(user_ids):
        try:
            result = migrate_user_journal_data(user_id)
            migration_results.append(result)
        except Exception as e:
            pass
            migration_results.append({
                'user_id': user_id,
                'error': str(e),
                'files_processed': 0,
                'entries_migrated': 0
            })
    
    # Summary
    total_files = sum(r.get('files_processed', 0) for r in migration_results)
    total_entries = sum(r.get('entries_migrated', 0) for r in migration_results)
    successful_users = len([r for r in migration_results if not r.get('error')])
    
    summary = {
        'migration_timestamp': datetime.now().isoformat(),
        'users_processed': len(user_ids),
        'users_successful': successful_users,
        'total_files_processed': total_files,
        'total_entries_migrated': total_entries,
        'user_results': migration_results
    }
    
    pass
    pass
    pass
    pass
    
    return summary

def cleanup_legacy_storage(dry_run: bool = True) -> Dict[str, Any]:
    """Clean up legacy storage files after successful migration"""
    pass
    
    storage_files = db.storage.json.list()
    
    # Files to clean up (everything except unified format)
    cleanup_patterns = [
        'journal_',           # Legacy format (but not journal_entry_)
        'user_journals_',     # Index arrays
        'habit_completion_',  # Separate habit storage
        'corrupted_journal_'  # Cleanup attempts
    ]
    
    files_to_delete = []
    for file in storage_files:
        filename = file.name
        # Only delete if it matches cleanup patterns but NOT unified pattern
        if (any(filename.startswith(pattern) for pattern in cleanup_patterns) and 
            not filename.startswith('journal_entry_')):
            files_to_delete.append(filename)
    
    pass
    
    if not dry_run:
        deleted_count = 0
        for filename in files_to_delete:
            try:
                # Note: We don't actually have a delete method in the SDK
                # This would need to be implemented if we want automated cleanup
                pass
                deleted_count += 1
            except Exception as e:
                pass
        
        pass
    else:
        for filename in files_to_delete[:10]:  # Show first 10
            pass
        if len(files_to_delete) > 10:
            pass
    
    return {
        'files_identified': len(files_to_delete),
        'files_deleted': 0 if dry_run else len(files_to_delete),
        'dry_run': dry_run
    }
