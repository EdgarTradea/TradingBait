import os
import sys
import json
import argparse

# Add backend directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase

def run_migration(data_file_path: str):
    print("Initializing Firebase...")
    initialize_firebase()
    
    db_firestore = firestore.client()
    
    print(f"Reading exported data from {data_file_path}...")
    try:
        with open(data_file_path, 'r') as f:
            all_files = json.load(f)  # Expected format: {"trial_status.XYZ": {...}, "trial_usage.XYZ": {...}}
    except Exception as e:
        print(f"Failed to read file {data_file_path}: {e}")
        return
        
    trial_status_keys = [k for k in all_files.keys() if k.startswith('trial_status.')]
    trial_usage_keys = [k for k in all_files.keys() if k.startswith('trial_usage.')]
    
    print(f"Found {len(trial_status_keys)} trial_status records.")
    for key in trial_status_keys:
        user_id = key.replace('trial_status.', '')
        try:
            data = all_files[key]
            if data:
                doc_ref = db_firestore.collection('users').document(user_id).collection('subscription').document('trial')
                doc_ref.set(data, merge=True)
                print(f"  ✅ Migrated trial status for {user_id}")
        except Exception as e:
            print(f"  ❌ Error migrating trial status for {user_id}: {e}")
            
    print(f"\nFound {len(trial_usage_keys)} trial_usage records.")
    for key in trial_usage_keys:
        user_id = key.replace('trial_usage.', '')
        try:
            data = all_files[key]
            if data:
                doc_ref = db_firestore.collection('users').document(user_id).collection('subscription').document('usage')
                doc_ref.set(data, merge=True)
                print(f"  ✅ Migrated trial usage for {user_id}")
        except Exception as e:
            print(f"  ❌ Error migrating trial usage for {user_id}: {e}")
            
    print("\n🎉 Migration Phase 2 Complete (Pure Firebase Admin mode)!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate trial data to Firestore")
    parser.add_argument('data_file', type=str, help='Path to the db.storage JSON export file')
    args = parser.parse_args()
    
    if os.path.exists(args.data_file):
        run_migration(args.data_file)
    else:
        print(f"File not found: {args.data_file}")
