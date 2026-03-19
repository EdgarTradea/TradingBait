from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class GlobalCORSMiddleware(BaseHTTPMiddleware):
    """
    Global CORS middleware that handles ALL preflight OPTIONS requests
    and adds CORS headers to all responses.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Handle OPTIONS preflight requests globally
        if request.method == "OPTIONS":
            response = JSONResponse(
                content={},
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "86400"
                }
            )
            return response
        
        # Process the request
        response = await call_next(request)
        
        # Add CORS headers to all responses
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response

def configure_cors(app: FastAPI):
    """
    Configure comprehensive CORS for the FastAPI application
    This function should be called early in the app setup.
    """
    
    # Add standard CORS middleware first
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://tradingbait.com",
            "https://www.tradingbait.com",
            "https://riff.new",
            "https://*.riff.new",
            "http://localhost:3000",
            "http://localhost:5173"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add our global CORS middleware for comprehensive coverage
    app.add_middleware(GlobalCORSMiddleware)
    
    pass
    return app
