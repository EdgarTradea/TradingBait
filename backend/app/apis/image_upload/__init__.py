from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.auth import AuthorizedUser
from firebase_admin import storage, firestore
from app.libs.firebase_init import initialize_firebase
import re
from typing import List, Optional
import uuid
from datetime import datetime

router = APIRouter(prefix="/image-upload")

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

class ImageUploadResponse(BaseModel):
    success: bool
    image_id: str
    message: str
    file_size: Optional[int] = None
    content_type: Optional[str] = None

class ImageDeleteResponse(BaseModel):
    success: bool
    message: str

@router.post("/upload")
async def upload_image(user: AuthorizedUser, file: UploadFile = File(...)) -> ImageUploadResponse:
    """Upload chart screenshot or other trading-related images"""
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed types: {', '.join(allowed_types)}"
            )
        
        # Validate file size (max 10MB)
        content = await file.read()
        max_size = 10 * 1024 * 1024  # 10MB
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail="File size too large. Maximum size is 10MB."
            )
        
        # Generate unique image ID
        image_id = f"img_{uuid.uuid4().hex[:12]}"
        
        # Initialize Firebase and connect
        initialize_firebase()
        bucket = storage.bucket()
        firestore_db = firestore.client()
        
        # Store image in Firebase Storage
        blob_path = f"images/{user.sub}/{image_id}"
        blob = bucket.blob(blob_path)
        blob.upload_from_string(content, content_type=file.content_type)
        
        # Generate a signed URL valid for a long time (or use download URL)
        # Note: Frontend can also retrieve using standard getDownloadURL if requested.
        
        # Store metadata in Firestore
        metadata = {
            "image_id": image_id,
            "blob_path": blob_path,
            "original_filename": file.filename,
            "content_type": file.content_type,
            "file_size": len(content),
            "uploaded_at": datetime.now().isoformat(),
            "user_id": user.sub
        }
        
        firestore_db.collection(f"users/{user.sub}/images").document(image_id).set(metadata)
        
        return ImageUploadResponse(
            success=True,
            image_id=image_id,
            message="Image uploaded successfully",
            file_size=len(content),
            content_type=file.content_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to upload image")

@router.get("/image/{image_id}")
async def get_image(image_id: str, user: AuthorizedUser):
    """Retrieve an uploaded image"""
    try:
        # Get metadata first
        initialize_firebase()
        firestore_db = firestore.client()
        bucket = storage.bucket()
        
        doc = firestore_db.collection(f"users/{user.sub}/images").document(image_id).get()
        metadata = doc.to_dict()
        
        if not metadata:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Verify ownership
        if metadata.get("user_id") != user.sub:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get image data from Firebase Storage
        blob_path = metadata.get("blob_path", f"images/{user.sub}/{image_id}")
        blob = bucket.blob(blob_path)
        image_data = blob.download_as_bytes()
        
        from fastapi.responses import Response
        return Response(
            content=image_data,
            media_type=metadata["content_type"],
            headers={
                "Content-Disposition": f"inline; filename={metadata['original_filename']}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to retrieve image")

@router.delete("/image/{image_id}")
async def delete_image(image_id: str, user: AuthorizedUser) -> ImageDeleteResponse:
    """Delete an uploaded image"""
    try:
        # Get metadata first
        initialize_firebase()
        firestore_db = firestore.client()
        bucket = storage.bucket()
        
        doc_ref = firestore_db.collection(f"users/{user.sub}/images").document(image_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Image not found")
            
        metadata = doc.to_dict()
        
        # Verify ownership
        if metadata.get("user_id") != user.sub:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete image data and metadata
        blob_path = metadata.get("blob_path", f"images/{user.sub}/{image_id}")
        blob = bucket.blob(blob_path)
        if blob.exists():
            blob.delete()
            
        doc_ref.delete()
        
        return ImageDeleteResponse(
            success=True,
            message="Image deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to delete image")

@router.get("/list")
async def list_user_images(user: AuthorizedUser):
    """List all images uploaded by the user"""
    try:
        initialize_firebase()
        firestore_db = firestore.client()
        
        docs = firestore_db.collection(f"users/{user.sub}/images").stream()
        
        user_images = []
        for doc in docs:
            metadata = doc.to_dict()
            user_images.append({
                "image_id": metadata.get("image_id"),
                "original_filename": metadata.get("original_filename"),
                "content_type": metadata.get("content_type"),
                "file_size": metadata.get("file_size"),
                "uploaded_at": metadata.get("uploaded_at")
            })
        
        # Sort by upload date (newest first)
        user_images.sort(key=lambda x: x.get("uploaded_at", ""), reverse=True)
        
        return {
            "success": True,
            "images": user_images,
            "total_count": len(user_images)
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to list images")
