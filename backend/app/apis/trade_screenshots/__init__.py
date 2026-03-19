from fastapi import APIRouter
import logging

"""
Migration Phase 3: Binary Files
Screenshots are now uploaded directly from the frontend React components to Firebase Storage. 
This backend router is deprecated and maintained solely to prevent frontend API client crashes
from residual outdated caches.
"""

router = APIRouter(prefix="/trade-screenshots")

@router.get("/list/{trade_id}")
async def list_trade_screenshots(trade_id: str):
    return {"screenshots": [], "detail": "Superseded by Firebase Storage"}

@router.post("/upload/{trade_id}")
async def upload_trade_screenshot(trade_id: str):
    return {"detail": "Superseded by Firebase Storage directly from frontend"}

@router.delete("/delete/{screenshot_id}")
async def delete_trade_screenshot(screenshot_id: str):
    return {"detail": "Superseded by Firebase Storage directly from frontend"}
