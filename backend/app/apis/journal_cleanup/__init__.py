from fastapi import APIRouter

router = APIRouter()

@router.get("/detect-corrupted-entries")
@router.post("/cleanup-corrupted-entries")
async def retired():
    return {"status": "retired", "message": "journal_cleanup was a one-time db.storage utility. Migration to Firestore is complete."}
