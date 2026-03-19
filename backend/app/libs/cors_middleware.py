from fastapi import Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import re

class CustomCORSMiddleware:
    """
    Custom CORS middleware to handle all preflight requests and CORS headers
    specifically for production domain issues.
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Handle OPTIONS preflight requests for ALL endpoints
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
            await response(scope, receive, send)
            return
        
        # For all other requests, add CORS headers to response
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = dict(message.get("headers", []))
                
                # Add CORS headers if not already present
                cors_headers = {
                    b"access-control-allow-origin": b"*",
                    b"access-control-allow-methods": b"GET, POST, PUT, DELETE, OPTIONS, PATCH",
                    b"access-control-allow-headers": b"*",
                    b"access-control-allow-credentials": b"true"
                }
                
                for key, value in cors_headers.items():
                    if key not in headers:
                        headers[key] = value
                
                message["headers"] = list(headers.items())
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)

def setup_cors(app):
    """
    Setup comprehensive CORS configuration for the FastAPI app
    """
    # Add the standard CORS middleware
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
    
    # Add our custom middleware as well for comprehensive coverage
    app.middleware("http")(CustomCORSMiddleware(app))
    
    return app
