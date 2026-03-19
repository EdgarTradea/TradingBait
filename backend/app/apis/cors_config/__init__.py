"""
CORS Configuration API

This API configures Cross-Origin Resource Sharing (CORS) to allow
the frontend to make requests to the backend API in production.

The CORS issue was blocking all API requests in production with:
"Access-Control-Allow-Origin header is present on the requested resource"
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

# Global OPTIONS handler for CORS preflight requests
@router.options("/{full_path:path}")
async def options_handler():
    """Handle all OPTIONS requests globally for CORS"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*", 
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400"
        }
    )
