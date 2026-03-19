from fastapi import APIRouter

router = APIRouter(prefix="/journal-migration", tags=["migration"])

@router.post("/dry-run")
@router.post("/execute")
@router.get("/status")
async def retired():
    return {"status": "retired", "message": "journal_migration was a one-time db.storage → Firestore migration tool. Migration is complete."}
