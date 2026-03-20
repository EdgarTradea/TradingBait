"""Journal Data Migration Library

Consolidates all scattered journal data into unified Firestore storage pattern.
Handles migration from legacy formats, index arrays, and separate habit storage.
"""

from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from typing import Dict, List, Any, Optional
from datetime import datetime
import re

# Initialize Firebase
initialize_firebase()

def extract_date_from_key(key: str) -> Optional[str]:
    """Extract date from a document ID or key"""
    match = re.search(r'(\d{4}-\d{2}-\d{2})', key)
    return match.group(1) if match else None

def migrate_user_journal_data(user_id: str) -> Dict[str, Any]:
    """Migrate all journal data for a specific user to unified Firestore format"""
    db_firestore = firestore.client()

    # Collect entries from various possible Firestore paths
    unified_entries: Dict[str, Any] = {}

    # 1. Read from unified journal_entries collection
    journal_ref = db_firestore.collection(f"users/{user_id}/journal_entries")
    for doc in journal_ref.stream():
        date = doc.id if re.match(r'\d{4}-\d{2}-\d{2}', doc.id) else extract_date_from_key(doc.id)
        if date:
            unified_entries[date] = doc.to_dict()

    # 2. Read from legacy journal collection (if it exists)
    legacy_ref = db_firestore.collection(f"users/{user_id}/journals")
    for doc in legacy_ref.stream():
        data = doc.to_dict()
        if not data:
            continue
        date = extract_date_from_key(doc.id) or data.get('date')
        if date and date not in unified_entries:
            unified_entries[date] = data

    # 3. Read from habit_completions sub-collection
    habits_ref = db_firestore.collection(f"users/{user_id}/habit_completions")
    for doc in habits_ref.stream():
        data = doc.to_dict()
        if not data:
            continue
        date = extract_date_from_key(doc.id) or data.get('date')
        if not date:
            continue
        if date in unified_entries:
            if 'habit_completions' in data:
                unified_entries[date]['habits'] = data['habit_completions']
        else:
            unified_entries[date] = {
                'date': date,
                'user_id': user_id,
                'habits': data.get('habit_completions', []),
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
                'created_at': data.get('created_at', datetime.now().isoformat()),
                'updated_at': datetime.now().isoformat()
            }

    # Save all unified entries to canonical path
    saved_count = 0
    for date, entry in unified_entries.items():
        try:
            entry['user_id'] = user_id
            entry['date'] = date
            db_firestore.collection(f"users/{user_id}/journal_entries").document(date).set(entry)
            saved_count += 1
        except Exception as e:
            pass

    return {
        'user_id': user_id,
        'entries_migrated': saved_count,
        'dates_consolidated': list(unified_entries.keys())
    }

def migrate_all_journal_data() -> Dict[str, Any]:
    """Migrate all journal data across all users to unified format"""
    db_firestore = firestore.client()

    # Find all users with journal data
    users_ref = db_firestore.collection("users")
    user_ids = set()
    for user_doc in users_ref.stream():
        user_ids.add(user_doc.id)

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
                'entries_migrated': 0
            })

    total_entries = sum(r.get('entries_migrated', 0) for r in migration_results)
    successful_users = len([r for r in migration_results if not r.get('error')])

    return {
        'migration_timestamp': datetime.now().isoformat(),
        'users_processed': len(user_ids),
        'users_successful': successful_users,
        'total_entries_migrated': total_entries,
        'user_results': migration_results
    }

def cleanup_legacy_storage(dry_run: bool = True) -> Dict[str, Any]:
    """Clean up legacy Firestore journal collections after successful migration"""
    db_firestore = firestore.client()

    legacy_collections = ['journals', 'habit_completions']
    files_identified = 0
    files_deleted = 0

    users_ref = db_firestore.collection("users")
    for user_doc in users_ref.stream():
        user_id = user_doc.id
        for coll_name in legacy_collections:
            legacy_ref = db_firestore.collection(f"users/{user_id}/{coll_name}")
            for doc in legacy_ref.stream():
                files_identified += 1
                if not dry_run:
                    try:
                        doc.reference.delete()
                        files_deleted += 1
                    except Exception as e:
                        pass

    return {
        'files_identified': files_identified,
        'files_deleted': files_deleted,
        'dry_run': dry_run
    }
