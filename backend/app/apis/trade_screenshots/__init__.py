


from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response
from app.auth import AuthorizedUser
import databutton as db
import re
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter(prefix="/trade-screenshots")


def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)


class ScreenshotMetadata(BaseModel):
    screenshot_id: str
    trade_id: str
    filename: str
    content_type: str
    file_size: int
    uploaded_at: str
    static_url: str  # New field for static asset URL
    caption: Optional[str] = None


class ScreenshotListResponse(BaseModel):
    screenshots: List[ScreenshotMetadata]


class ScreenshotUploadResponse(BaseModel):
    screenshot_id: str
    static_url: str
    message: str


@router.get("/list/{trade_id}")
def list_trade_screenshots(trade_id: str, user: AuthorizedUser) -> ScreenshotListResponse:
    """List all screenshots for a specific trade"""
    try:
        # Sanitize trade_id
        trade_id = sanitize_storage_key(trade_id)
        
        # Get list of all stored metadata files
        metadata_files = db.storage.json.list()
        
        screenshots = []
        user_id = user.sub
        
        for file in metadata_files:
            # Look for screenshot metadata files for this trade
            # Handle both old and new patterns:
            # Old pattern: screenshot_*_metadata
            # New pattern: trade_screenshot_metadata_*
            is_old_pattern = (file.name.startswith(f"screenshot_") and 
                            file.name.endswith("_metadata"))
            is_new_pattern = file.name.startswith(f"trade_screenshot_metadata_")
            
            if is_old_pattern or is_new_pattern:
                try:
                    metadata = db.storage.json.get(file.name)
                    
                    # Check if this screenshot belongs to the user and trade
                    if (metadata.get("user_id") == user_id and 
                        metadata.get("trade_id") == trade_id):
                        
                        screenshots.append(ScreenshotMetadata(
                            screenshot_id=metadata["screenshot_id"],
                            trade_id=metadata["trade_id"],
                            filename=metadata["original_filename"],
                            content_type=metadata["content_type"],
                            file_size=metadata["file_size"],
                            uploaded_at=metadata["uploaded_at"],
                            static_url=metadata["static_url"],
                            caption=metadata.get("caption")
                        ))
                        
                except Exception as e:
                    print(f"Error processing metadata file {file.name}: {e}")
                    continue
        
        # Sort by upload time (newest first)
        screenshots.sort(key=lambda x: x.uploaded_at, reverse=True)
        
        print(f"Found {len(screenshots)} screenshots for trade {trade_id}")
        return ScreenshotListResponse(screenshots=screenshots)
        
    except Exception as e:
        print(f"Error listing screenshots for trade {trade_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to list screenshots")


@router.post("/upload/{trade_id}")
def upload_trade_screenshot(
    trade_id: str,
    user: AuthorizedUser,
    file: UploadFile = File(...)
) -> ScreenshotUploadResponse:
    """Upload a screenshot for a specific trade"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read file data
        file_data = file.file.read()

        if len(file_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
        
        # Generate unique screenshot ID
        screenshot_id = f"screenshot_{uuid.uuid4().hex[:12]}"

        # Sanitize trade_id and filename
        trade_id = sanitize_storage_key(trade_id)
        safe_filename = sanitize_storage_key(file.filename or "screenshot")

        # Store in binary storage
        db.storage.binary.put(screenshot_id, file_data)
        
        # Create public URL for serving using /public/ endpoint
        public_url = f"/trade-screenshots/public/{screenshot_id}"
        
        # Store metadata
        metadata = {
            "screenshot_id": screenshot_id,
            "trade_id": trade_id,
            "user_id": user.sub,
            "original_filename": file.filename,
            "content_type": file.content_type,
            "file_size": len(file_data),
            "uploaded_at": datetime.now().isoformat(),
            "static_url": public_url,
            "caption": None
        }

        metadata_key = f"{screenshot_id}_metadata"
        db.storage.json.put(metadata_key, metadata)

        print(f"Uploaded screenshot {screenshot_id} for trade {trade_id}")
        
        return ScreenshotUploadResponse(
            screenshot_id=screenshot_id,
            static_url=public_url,
            message="Screenshot uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading screenshot: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload screenshot")


# Public endpoint for serving screenshots (no auth required)
@router.get("/public/{screenshot_id}")
def get_public_screenshot(screenshot_id: str):
    """Serve screenshot publicly (no authentication required)"""
    try:
        # Sanitize the screenshot ID
        screenshot_id = sanitize_storage_key(screenshot_id)
        
        # Get the screenshot data
        screenshot_data = db.storage.binary.get(screenshot_id)
        
        # Get metadata to determine content type
        try:
            metadata_key = f"{screenshot_id}_metadata"
            metadata = db.storage.json.get(metadata_key, default={})
            content_type = metadata.get('content_type', 'image/png')
        except:
            content_type = 'image/png'
        
        return Response(
            content=screenshot_data,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=86400",  # Cache for 1 day
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*"
            }
        )
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    except Exception as e:
        print(f"Error serving screenshot {screenshot_id}: {e}")
        raise HTTPException(status_code=500, detail="Error serving screenshot")


# Backward compatibility endpoint (same as public but different path)
@router.get("/image/{screenshot_id}")
def get_trade_screenshot(screenshot_id: str):
    """Serve screenshot via /image/ path for backward compatibility"""
    return get_public_screenshot(screenshot_id)


@router.delete("/delete/{screenshot_id}")
def delete_trade_screenshot(screenshot_id: str, user: AuthorizedUser):
    """Delete a specific screenshot"""
    try:
        # Sanitize screenshot_id
        screenshot_id = sanitize_storage_key(screenshot_id)
        
        # Get metadata to verify ownership
        metadata_key = f"{screenshot_id}_metadata"
        try:
            metadata = db.storage.json.get(metadata_key)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Screenshot not found")
        
        # Verify user owns this screenshot
        if metadata.get("user_id") != user.sub:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete the image and metadata
        try:
            db.storage.binary.delete(screenshot_id)
        except FileNotFoundError:
            pass  # Image already deleted
        
        try:
            db.storage.json.delete(metadata_key)
        except FileNotFoundError:
            pass  # Metadata already deleted
        
        print(f"Deleted screenshot {screenshot_id}")
        return {"message": "Screenshot deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting screenshot {screenshot_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete screenshot")
