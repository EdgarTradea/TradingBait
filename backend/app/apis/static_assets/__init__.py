

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
import databutton as db
from typing import Optional
import re

router = APIRouter()

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

@router.get("/favicon.ico")
async def get_favicon_ico():
    """Serve favicon.ico file"""
    try:
        # Use the 32x32 PNG as the default favicon.ico
        favicon_data = db.storage.binary.get("favicon-32x32-png")
        return Response(
            content=favicon_data,
            media_type="image/x-icon",
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Favicon not found")

@router.get("/favicon-{size}.png")
async def get_favicon_png(size: str):
    """Serve favicon PNG files (16x16, 32x32)"""
    if size not in ["16x16", "32x32"]:
        raise HTTPException(status_code=404, detail="Invalid favicon size")
    
    try:
        filename = f"favicon-{size}-png"
        favicon_data = db.storage.binary.get(filename)
        return Response(
            content=favicon_data,
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Favicon {size} not found")

@router.get("/apple-touch-icon.png")
async def get_apple_touch_icon():
    """Serve Apple Touch Icon (180x180)"""
    try:
        # Serve the actual PNG file from storage
        icon_data = db.storage.binary.get("apple-touch-icon-png")
        return Response(
            content=icon_data,
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Apple Touch Icon not found")

@router.get("/logo-{size}.{format}")
async def get_logo(size: str, format: str):
    """Serve logo files in various sizes and formats"""
    valid_sizes = ["512", "og-image", "twitter-image"]
    valid_formats = ["svg", "png"]
    
    if size not in valid_sizes or format not in valid_formats:
        raise HTTPException(status_code=404, detail="Invalid logo size or format")
    
    try:
        if format == "svg":
            filename = f"{size}.svg" if size == "logo-512" else f"{size}.svg"
            logo_data = db.storage.text.get(filename)
            media_type = "image/svg+xml"
        else:
            # For PNG, we'll serve SVG for now until we have proper PNG conversion
            filename = f"{size}.svg" if size == "logo-512" else f"{size}.svg"
            logo_data = db.storage.text.get(filename)
            media_type = "image/svg+xml"
        
        return Response(
            content=logo_data,
            media_type=media_type,
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Logo not found")

@router.get("/og-image.png")
async def get_og_image():
    """Serve Open Graph image (1200x630)"""
    try:
        svg_data = db.storage.text.get("og-image.svg")
        return Response(
            content=svg_data,
            media_type="image/svg+xml",
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="OG image not found")

@router.get("/twitter-image.png")
async def get_twitter_image():
    """Serve Twitter card image (1200x675)"""
    try:
        svg_data = db.storage.text.get("twitter-image.svg")
        return Response(
            content=svg_data,
            media_type="image/svg+xml",
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Twitter image not found")

@router.get("/logo.png")
async def get_main_logo():
    """Serve main logo (512x512)"""
    try:
        svg_data = db.storage.text.get("logo-512.svg")
        return Response(
            content=svg_data,
            media_type="image/svg+xml",
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Main logo not found")

@router.get("/light.ico")
async def get_light_favicon():
    """Serve light theme favicon"""
    try:
        favicon_data = db.storage.binary.get("favicon-32x32-png")
        return Response(
            content=favicon_data,
            media_type="image/x-icon",
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Light favicon not found")

@router.get("/dark.ico")
async def get_dark_favicon():
    """Serve dark theme favicon"""
    try:
        favicon_data = db.storage.binary.get("favicon-32x32-png")
        return Response(
            content=favicon_data,
            media_type="image/x-icon",
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dark favicon not found")
