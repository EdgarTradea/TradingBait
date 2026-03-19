from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.libs.firebase_init import initialize_firebase
from firebase_admin import storage

router = APIRouter(prefix="/pdf")

@router.get("/technical-assessment")
def download_technical_assessment():
    """Download the TradingBait technical assessment PDF."""
    try:
        initialize_firebase()
        bucket = storage.bucket()
        blob = bucket.blob("documents/tradingbait-technical-assessment.pdf")
        if not blob.exists():
            raise HTTPException(status_code=404, detail="PDF not found. Please contact support.")
        pdf_bytes = blob.download_as_bytes()
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=TradingBait-Technical-Assessment.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
