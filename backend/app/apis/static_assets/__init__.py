
from fastapi import APIRouter, Response
from typing import Optional

router = APIRouter()

# NOTE: All static assets (favicon, logos, OG images) are now bundled
# directly in the frontend /public directory and served by Vite/CDN.
# These backend endpoints are deprecated and return 404 to prevent old
# clients from hanging on unavailable Databutton storage reads.

GONE_RESPONSE = Response(
    content=b"This asset is now served directly from the frontend bundle.",
    status_code=404,
    media_type="text/plain"
)

@router.get("/favicon.ico")
async def get_favicon_ico():
    return GONE_RESPONSE

@router.get("/favicon-{size}.png")
async def get_favicon_png(size: str):
    return GONE_RESPONSE

@router.get("/apple-touch-icon.png")
async def get_apple_touch_icon():
    return GONE_RESPONSE

@router.get("/logo-{size}.{format}")
async def get_logo(size: str, format: str):
    return GONE_RESPONSE

@router.get("/og-image.png")
async def get_og_image():
    return GONE_RESPONSE

@router.get("/twitter-image.png")
async def get_twitter_image():
    return GONE_RESPONSE

@router.get("/logo.png")
async def get_main_logo():
    return GONE_RESPONSE

@router.get("/light.ico")
async def get_light_favicon():
    return GONE_RESPONSE

@router.get("/dark.ico")
async def get_dark_favicon():
    return GONE_RESPONSE
