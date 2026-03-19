from fastapi import APIRouter, Response

router = APIRouter()

# NOTE: All favicon/icon assets are now bundled directly in the frontend
# /public directory. These root-level backend routes are deprecated.
# The frontend HTML references /favicon.svg served by Vite directly.

GONE_RESPONSE = Response(
    content=b"",
    status_code=404,
    media_type="image/x-icon"
)

@router.get("/light.ico")
async def get_light_favicon():
    return GONE_RESPONSE

@router.get("/dark.ico")
async def get_dark_favicon():
    return GONE_RESPONSE

@router.get("/favicon.ico")
async def get_default_favicon():
    return GONE_RESPONSE
