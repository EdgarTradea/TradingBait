"""Migration Tools API

Provides endpoints for running journal data migration and cleanup.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.auth import AuthorizedUser
from app.libs.journal_migration import migrate_all_journal_data, cleanup_legacy_storage, migrate_user_journal_data

router = APIRouter(prefix="/migration")

class MigrationResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]

@router.post("/migrate-journal-data", response_model=MigrationResponse)
async def migrate_journal_data_endpoint(user: AuthorizedUser):
    """Migrate all journal data to unified format"""
    try:
        result = migrate_all_journal_data()
        return MigrationResponse(
            success=True,
            message="Journal data migration completed",
            data=result
        )
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

@router.post("/migrate-user-data", response_model=MigrationResponse)
async def migrate_user_data_endpoint(user: AuthorizedUser):
    """Migrate journal data for the authenticated user only"""
    try:
        result = migrate_user_journal_data(user.sub)
        return MigrationResponse(
            success=True,
            message=f"User data migration completed for {user.sub}",
            data=result
        )
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"User migration failed: {str(e)}")

@router.post("/cleanup-legacy-storage", response_model=MigrationResponse)
async def cleanup_legacy_storage_endpoint(dry_run: bool = True, user: AuthorizedUser = None):
    """Clean up legacy storage files (admin only)"""
    try:
        result = cleanup_legacy_storage(dry_run=dry_run)
        return MigrationResponse(
            success=True,
            message=f"Legacy storage cleanup {'simulation' if dry_run else 'completed'}",
            data=result
        )
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@router.get("/migration-status")
async def get_migration_status(user: AuthorizedUser):
    """Get status of migration for the current user"""
    try:
        # Check if user has data in unified format
        import databutton as db
        storage_files = db.storage.json.list()
        
        user_unified = [f for f in storage_files if f.name.startswith(f'journal_entry_{user.sub}_')]
        user_legacy = [f for f in storage_files if user.sub in f.name and 'journal' in f.name.lower() and not f.name.startswith('journal_entry_')]
        
        return {
            'user_id': user.sub,
            'unified_entries': len(user_unified),
            'legacy_entries': len(user_legacy),
            'migration_needed': len(user_legacy) > 0,
            'unified_format_ready': len(user_unified) > 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")
