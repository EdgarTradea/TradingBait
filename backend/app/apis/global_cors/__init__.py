from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

router = APIRouter()

@router.options("/{full_path:path}")
async def global_options_handler(full_path: str):
    """Global OPTIONS handler for all CORS preflight requests"""
    return JSONResponse(
        content={},
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true", 
            "Access-Control-Max-Age": "86400"
        }
    )

@router.get("/cors-status")
async def cors_status():
    """Check CORS configuration status"""
    return {
        "cors_enabled": True,
        "global_options_handler": "active",
        "allowed_origins": ["*"],
        "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allowed_headers": ["*"]
    }
