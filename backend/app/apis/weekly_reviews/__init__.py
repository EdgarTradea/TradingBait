from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.auth import AuthorizedUser
from firebase_admin import storage, firestore
from app.libs.firebase_init import initialize_firebase
import uuid
import base64
import re

router = APIRouter()

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# ============================================================================
# MODELS
# ============================================================================

class WeeklyReviewCreate(BaseModel):
    start_date: str
    end_date: str
    trading_days: int
    total_trades: int
    good_trades: int
    bad_trades: int
    wins: int
    losses: int
    break_even: int
    total_pnl: float
    emotional_reflection: str
    trading_reflections: str
    execution_goals: str
    habit_metrics: List[Dict[str, Any]]
    improvement_metrics: List[Dict[str, Any]]
    chart_images_base64: List[str]

class WeeklyReviewResponse(BaseModel):
    review_id: str
    user_id: str
    start_date: str
    end_date: str
    trading_days: int
    total_trades: int
    good_trades: int
    bad_trades: int
    wins: int
    losses: int
    break_even: int
    total_pnl: float
    emotional_reflection: str
    trading_reflections: str
    execution_goals: str
    habit_metrics: List[Dict[str, Any]]
    improvement_metrics: List[Dict[str, Any]]
    created_at: str

class WeeklyReviewListResponse(BaseModel):
    reviews: List[WeeklyReviewResponse]
    total: int
    page: int
    limit: int

class DailySummary(BaseModel):
    date: str
    mood: str
    habit_completion: float

class WeeklyReviewDetailResponse(BaseModel):
    review: WeeklyReviewResponse
    daily_summaries: List[DailySummary]
    chart_images: List[str]

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/weekly-reviews")
async def create_weekly_review(
    review_data: WeeklyReviewCreate,
    user: AuthorizedUser
) -> WeeklyReviewResponse:
    """Create a new weekly review"""
    user_id = user.sub
    review_id = str(uuid.uuid4())
    
    # Save review data
    initialize_firebase()
    firestore_db = firestore.client()
    firestore_db.collection(f"users/{user_id}/weekly_reviews").document(review_id).set(review_storage)
    
    # Save chart images
    for idx, image_base64 in enumerate(review_data.chart_images_base64):
        if image_base64:
            try:
                # Remove data URL prefix if present
                if ',' in image_base64:
                    image_base64 = image_base64.split(',')[1]
                
                image_data = base64.b64decode(image_base64)
                bucket = storage.bucket()
                blob = bucket.blob(f"weekly-review-images/{user_id}/{review_id}/{idx}")
                blob.upload_from_string(image_data, content_type="image/png")
            except Exception as e:
                pass
    
    return WeeklyReviewResponse(**review_storage)

@router.get("/weekly-reviews")
async def list_weekly_reviews(
    user: AuthorizedUser,
    page: int = 1,
    limit: int = 10
) -> WeeklyReviewListResponse:
    """List all weekly reviews for a user with pagination"""
    user_id = user.sub
    
    # List all review files for this user
    initialize_firebase()
    firestore_db = firestore.client()
    docs = firestore_db.collection(f"users/{user_id}/weekly_reviews").stream()
    
    # Load all reviews
    reviews = []
    for doc in docs:
        try:
            review_data = doc.to_dict()
            reviews.append(WeeklyReviewResponse(**review_data))
        except Exception as e:
            pass
    
    # Sort by created_at descending (newest first)
    reviews.sort(key=lambda x: x.created_at, reverse=True)
    
    # Paginate
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_reviews = reviews[start_idx:end_idx]
    
    return WeeklyReviewListResponse(
        reviews=paginated_reviews,
        total=len(reviews),
        page=page,
        limit=limit
    )

@router.get("/weekly-reviews/{review_id}")
async def get_weekly_review(
    review_id: str,
    user: AuthorizedUser
) -> WeeklyReviewDetailResponse:
    """Get a specific weekly review with daily summaries and chart images"""
    user_id = user.sub
    
    # Load review
    initialize_firebase()
    firestore_db = firestore.client()
    doc = firestore_db.collection(f"users/{user_id}/weekly_reviews").document(review_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Weekly review not found")
        
    review_data = doc.to_dict()
    
    review = WeeklyReviewResponse(**review_data)
    
    # Load daily summaries for the date range
    start_date = datetime.fromisoformat(review.start_date)
    end_date = datetime.fromisoformat(review.end_date)
    
    daily_summaries = []
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        try:
            doc = firestore_db.collection(f"users/{user_id}/journal").document(date_str).get()
            if not doc.exists:
                raise Exception
                
            entry = doc.to_dict()
            mood = entry.get("mood", "neutral")
            habits = entry.get("habits", [])
            habit_completion = (len([h for h in habits if h.get("completed", False)]) / len(habits) * 100) if habits else 0
            
            daily_summaries.append(DailySummary(
                date=date_str,
                mood=mood,
                habit_completion=habit_completion
            ))
        except Exception:
            # Entry doesn't exist for this day
            daily_summaries.append(DailySummary(
                date=date_str,
                mood="",
                habit_completion=0
            ))
        
        current_date += timedelta(days=1)
    
    # Load chart images
    bucket = storage.bucket()
    blobs = bucket.list_blobs(prefix=f"weekly-review-images/{user_id}/{review_id}/")
    
    chart_images = []
    sorted_blobs = sorted(list(blobs), key=lambda b: b.name)
    
    for blob in sorted_blobs:
        try:
            image_data = blob.download_as_bytes()
            # Convert to base64 for frontend
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            chart_images.append(f"data:image/png;base64,{image_base64}")
        except Exception:
            pass
    
    return WeeklyReviewDetailResponse(
        review=review,
        daily_summaries=daily_summaries,
        chart_images=chart_images
    )
