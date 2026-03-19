from fastapi import APIRouter
from fastapi.responses import Response
import databutton as db

router = APIRouter(prefix="/pdf")

@router.get("/technical-assessment")
def download_technical_assessment():
    """Download the TradingBait technical assessment PDF."""
    pdf_bytes = db.storage.binary.get("tradingbait-technical-assessment")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=TradingBait-Technical-Assessment.pdf"}
    )
