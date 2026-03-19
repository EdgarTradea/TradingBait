from fastapi import APIRouter

router = APIRouter(prefix="/migration")

@router.post("/migrate-journal-data")
@router.post("/migrate-user-data")
@router.post("/cleanup-legacy-storage")
@router.get("/migration-status")
async def retired():
    return {"status": "retired", "message": "migration_tools was a one-time utility. Migration to Firestore is complete."}
