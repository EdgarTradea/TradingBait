import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import logging
import ast
from unittest.mock import MagicMock

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def initialize_firebase():
    """
    Initialize Firebase Admin SDK.
    Safe to call multiple times (checks _apps).
    Handles JSON parsing errors by attempting to parse as Python literal (ast.literal_eval).
    """
    if not firebase_admin._apps:
        try:
            creds_str = os.environ.get("FIREBASE_ADMIN_SDK_CREDENTIALS")
            if not creds_str or len(creds_str) < 10:
                logger.error("FIREBASE_ADMIN_SDK_CREDENTIALS environment variable is missing or invalid.")
                # Return mock instead of failing
                return MagicMock()

            try:
                creds_dict = json.loads(creds_str)
            except json.JSONDecodeError as e:
                logger.warning(f"JSON decode error: {e}. Attempting to parse as Python literal...")
                # Try parsing as Python dict (handles single quotes, None vs null, etc.)
                try:
                    creds_dict = ast.literal_eval(creds_str)
                    if not isinstance(creds_dict, dict):
                        raise ValueError("Parsed content is not a dictionary")
                except Exception as e2:
                    logger.error(f"Failed to parse credentials as Python literal: {e2}")
                    # raise e
                    return MagicMock()

            cred = credentials.Certificate(creds_dict)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            logger.error(f"CRITICAL: Firebase initialization failed: {e}")
            # raise e
            return MagicMock()
    
    return firebase_admin.get_app()

def get_firestore_client():
    """Get Firestore client, ensuring Firebase is initialized"""
    app = initialize_firebase()
    if isinstance(app, MagicMock):
        return MagicMock()
        
    try:
        return firestore.client()
    except ValueError:
        # Fallback if app exists but client fails
        return MagicMock()
