from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
import databutton as db
import io
from PIL import Image
from typing import Optional

router = APIRouter()

# Create these endpoints at the root level without any prefix
# These should match exactly what the HTML expects

@router.get("/light.ico")
async def get_light_favicon():
    """Serve light theme favicon.ico"""
    try:
        # Get the favicon PNG data
        favicon_data = db.storage.binary.get("favicon-32x32-png")
        
        # Convert PNG to ICO format
        png_image = Image.open(io.BytesIO(favicon_data))
        ico_buffer = io.BytesIO()
        
        # Save as ICO with multiple sizes
        png_image.save(ico_buffer, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
        ico_data = ico_buffer.getvalue()
        
        return Response(
            content=ico_data,
            media_type="image/x-icon",
            headers={
                "Cache-Control": "public, max-age=31536000",  # 1 year
                "Etag": f'"favicon-light-v1"'
            }
        )
    except Exception as e:
        print(f"Error serving light favicon: {e}")
        # Return empty response if error
        return Response(
            content=b"",
            media_type="image/x-icon",
            status_code=404
        )

@router.get("/dark.ico")
async def get_dark_favicon():
    """Serve dark theme favicon.ico (same as light for now)"""
    try:
        # Get the favicon PNG data
        favicon_data = db.storage.binary.get("favicon-32x32-png")
        
        # Convert PNG to ICO format
        png_image = Image.open(io.BytesIO(favicon_data))
        ico_buffer = io.BytesIO()
        
        # Save as ICO with multiple sizes
        png_image.save(ico_buffer, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
        ico_data = ico_buffer.getvalue()
        
        return Response(
            content=ico_data,
            media_type="image/x-icon",
            headers={
                "Cache-Control": "public, max-age=31536000",  # 1 year
                "Etag": f'"favicon-dark-v1"'
            }
        )
    except Exception as e:
        print(f"Error serving dark favicon: {e}")
        # Return empty response if error
        return Response(
            content=b"",
            media_type="image/x-icon",
            status_code=404
        )

@router.get("/favicon.ico")
async def get_default_favicon():
    """Serve default favicon.ico (fallback)"""
    try:
        # Get the favicon PNG data
        favicon_data = db.storage.binary.get("favicon-32x32-png")
        
        # Convert PNG to ICO format
        png_image = Image.open(io.BytesIO(favicon_data))
        ico_buffer = io.BytesIO()
        
        # Save as ICO with multiple sizes
        png_image.save(ico_buffer, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
        ico_data = ico_buffer.getvalue()
        
        return Response(
            content=ico_data,
            media_type="image/x-icon",
            headers={
                "Cache-Control": "public, max-age=31536000",  # 1 year
                "Etag": f'"favicon-default-v1"'
            }
        )
    except Exception as e:
        print(f"Error serving default favicon: {e}")
        # Return empty response if error
        return Response(
            content=b"",
            media_type="image/x-icon",
            status_code=404
        )
