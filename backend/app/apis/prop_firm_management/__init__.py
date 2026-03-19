"""Prop Firm Management API

Provides endpoints for managing prop firm preferences and accessing commission data.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase
from app.auth import AuthorizedUser
from app.libs.prop_firm_commissions import PropFirmCommissions

router = APIRouter(prefix="/prop-firms")

# Initialize Firebase
initialize_firebase()

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class PropFirmPreferenceRequest(BaseModel):
    prop_firm: str
    custom_commission_rate: Optional[float] = None

class PropFirmPreferenceResponse(BaseModel):
    success: bool
    prop_firm: str
    commission_info: Dict[str, Any]
    message: str

class PropFirmListResponse(BaseModel):
    available_firms: Dict[str, str]
    current_selection: Optional[str] = None
    commission_info: Optional[Dict[str, Any]] = None

class CommissionCalculationRequest(BaseModel):
    prop_firm: str
    symbol: str
    quantity: int

class CommissionCalculationResponse(BaseModel):
    prop_firm: str
    symbol: str
    quantity: int
    commission_per_contract: float
    total_commission: float
    calculation_method: str

# ============================================================================
# PROP FIRM ENDPOINTS
# ============================================================================

@router.get("/health")
async def prop_firm_health_check():
    """Health check for prop firm management system"""
    try:
        # Test prop firm database access
        available_firms = PropFirmCommissions.get_available_prop_firms()
        test_commission = PropFirmCommissions.get_commission_rate("tradeify", "MNQ")
        
        return {
            "status": "healthy",
            "available_firms_count": len(available_firms),
            "test_commission_rate": test_commission,
            "database_accessible": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prop firm system unhealthy: {str(e)}")

@router.get("/list")
async def get_available_prop_firms(user: AuthorizedUser) -> PropFirmListResponse:
    """Get list of available prop firms and user's current selection"""
    try:
        user_id = user.sub
        
        # Get available prop firms
        available_firms = PropFirmCommissions.get_available_prop_firms()
        
        # Get user's current selection
        db_firestore = firestore.client()
        doc = db_firestore.collection("users").document(user_id).collection("preferences").document("prop_firm").get()
        user_prefs = doc.to_dict() if doc.exists else {}
        current_prop_firm = user_prefs.get('prop_firm', 'custom')
        
        # Get commission info for current selection
        commission_info = None
        if current_prop_firm:
            commission_info = PropFirmCommissions.get_prop_firm_info(current_prop_firm)
        
        return PropFirmListResponse(
            available_firms=available_firms,
            current_selection=current_prop_firm,
            commission_info=commission_info
        )
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to retrieve prop firm data")

@router.post("/set-preference")
async def set_user_prop_firm_preference(request: PropFirmPreferenceRequest, user: AuthorizedUser) -> PropFirmPreferenceResponse:
    """Set user's prop firm preference"""
    try:
        user_id = user.sub
        prop_firm = request.prop_firm.lower().strip()
        
        # Validate prop firm exists
        available_firms = PropFirmCommissions.get_available_prop_firms()
        if prop_firm not in available_firms:
            raise HTTPException(status_code=400, detail=f"Unknown prop firm: {prop_firm}")
        
        # Get or create user preferences
        db_firestore = firestore.client()
        doc = db_firestore.collection("users").document(user_id).collection("preferences").document("prop_firm").get()
        user_prefs = doc.to_dict() if doc.exists else {}

        # Update prop firm preference
        user_prefs['prop_firm'] = prop_firm

        # Handle custom commission rate if provided
        if request.custom_commission_rate is not None and prop_firm == 'custom':
            user_prefs['custom_commission_rate'] = request.custom_commission_rate

        # Save preferences
        db_firestore.collection("users").document(user_id).collection("preferences").document("prop_firm").set(user_prefs)
        
        # Get commission info for response
        commission_info = PropFirmCommissions.get_prop_firm_info(prop_firm)
        
        return PropFirmPreferenceResponse(
            success=True,
            prop_firm=prop_firm,
            commission_info=commission_info or {},
            message=f"Prop firm preference updated to {available_firms[prop_firm]}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to update prop firm preference")

@router.get("/commission-info/{prop_firm}")
async def get_prop_firm_commission_info(prop_firm: str) -> Dict[str, Any]:
    """Get detailed commission information for a specific prop firm"""
    try:
        prop_firm = prop_firm.lower().strip()
        
        commission_info = PropFirmCommissions.get_prop_firm_info(prop_firm)
        if not commission_info:
            raise HTTPException(status_code=404, detail=f"Prop firm not found: {prop_firm}")
        
        return commission_info
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to retrieve commission information")

@router.post("/calculate-commission")
async def calculate_commission_cost(request: CommissionCalculationRequest) -> CommissionCalculationResponse:
    """Calculate commission cost for a specific trade"""
    try:
        prop_firm = request.prop_firm.lower().strip()
        symbol = request.symbol.upper().strip()
        quantity = abs(request.quantity)  # Ensure positive
        
        # Validate prop firm
        available_firms = PropFirmCommissions.get_available_prop_firms()
        if prop_firm not in available_firms:
            raise HTTPException(status_code=400, detail=f"Unknown prop firm: {prop_firm}")
        
        # Calculate commission
        commission_per_contract = PropFirmCommissions.get_commission_rate(prop_firm, symbol)
        total_commission = PropFirmCommissions.calculate_commission_cost(prop_firm, symbol, quantity)
        
        return CommissionCalculationResponse(
            prop_firm=prop_firm,
            symbol=symbol,
            quantity=quantity,
            commission_per_contract=commission_per_contract,
            total_commission=total_commission,
            calculation_method=f"{available_firms[prop_firm]} commission structure"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to calculate commission")

@router.get("/user-preference")
async def get_user_prop_firm_preference(user: AuthorizedUser) -> Dict[str, Any]:
    """Get user's current prop firm preference and commission info"""
    try:
        user_id = user.sub
        
        # Get user preferences
        db_firestore = firestore.client()
        doc = db_firestore.collection("users").document(user_id).collection("preferences").document("prop_firm").get()
        user_prefs = doc.to_dict() if doc.exists else {}
        prop_firm = user_prefs.get('prop_firm', 'custom')
        
        # Get commission info
        commission_info = PropFirmCommissions.get_prop_firm_info(prop_firm)
        available_firms = PropFirmCommissions.get_available_prop_firms()
        
        return {
            "prop_firm": prop_firm,
            "prop_firm_name": available_firms.get(prop_firm, "Unknown"),
            "commission_info": commission_info,
            "custom_commission_rate": user_prefs.get('custom_commission_rate'),
            "preferences_set": bool(user_prefs.get('prop_firm'))
        }
        
    except Exception as e:
        pass
        raise HTTPException(status_code=500, detail="Failed to retrieve user preference")
