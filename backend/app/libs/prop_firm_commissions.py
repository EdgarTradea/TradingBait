"""Prop Firm Commission Database for Accurate P&L Calculations

This module provides commission structures for major prop firms to enable
accurate net P&L calculations after trading fees.
"""

from typing import Dict, Optional, Any
from dataclasses import dataclass

@dataclass
class CommissionStructure:
    """Commission structure for a specific instrument type"""
    commission_per_contract: float  # Commission per contract/lot
    description: str  # Description of the commission
    instrument_type: str  # 'futures' or 'forex'
    commission_unit: str  # 'per_contract' or 'per_lot' or 'per_100k'
    
class PropFirmCommissions:
    """Database of prop firm commission structures"""
    
    # Commission structures by prop firm
    PROP_FIRMS = {
        "tradeify": {
            "name": "Tradeify",
            "commissions": {
                # Micro Futures
                "MNQ": CommissionStructure(1.82, "Micro NASDAQ-100 E-mini", "futures", "per_contract"),
                "MES": CommissionStructure(1.82, "Micro E-mini S&P 500", "futures", "per_contract"),
                "MYM": CommissionStructure(1.82, "Micro E-mini Dow", "futures", "per_contract"),
                "M2K": CommissionStructure(1.82, "Micro E-mini Russell 2000", "futures", "per_contract"),
                "MGC": CommissionStructure(2.12, "Micro Gold", "futures", "per_contract"),
                "MCL": CommissionStructure(2.12, "Micro Crude Oil", "futures", "per_contract"),
                "M6A": CommissionStructure(1.60, "Micro Australian Dollar", "futures", "per_contract"),
                "M6E": CommissionStructure(1.60, "Micro Euro", "futures", "per_contract"),
                
                # E-Mini Futures
                "NQ": CommissionStructure(5.76, "NASDAQ-100 E-mini", "futures", "per_contract"),
                "ES": CommissionStructure(5.76, "E-mini S&P 500", "futures", "per_contract"),
                "YM": CommissionStructure(5.76, "E-mini Dow", "futures", "per_contract"),
                "RTY": CommissionStructure(5.76, "E-mini Russell 2000", "futures", "per_contract"),
                "EMD": CommissionStructure(5.76, "E-mini S&P MidCap 400", "futures", "per_contract"),
                
                # Default for unknown futures instruments
                "DEFAULT": CommissionStructure(2.50, "Default futures commission rate", "futures", "per_contract")
            }
        },
        
        "apex_trader_funding": {
            "name": "Apex Trader Funding",
            "commissions": {
                # Common Apex commission structure
                "MNQ": CommissionStructure(2.00, "Micro NASDAQ-100 E-mini", "futures", "per_contract"),
                "MES": CommissionStructure(2.00, "Micro E-mini S&P 500", "futures", "per_contract"),
                "MYM": CommissionStructure(2.00, "Micro E-mini Dow", "futures", "per_contract"),
                "M2K": CommissionStructure(2.00, "Micro E-mini Russell 2000", "futures", "per_contract"),
                "NQ": CommissionStructure(6.00, "NASDAQ-100 E-mini", "futures", "per_contract"),
                "ES": CommissionStructure(6.00, "E-mini S&P 500", "futures", "per_contract"),
                "YM": CommissionStructure(6.00, "E-mini Dow", "futures", "per_contract"),
                "RTY": CommissionStructure(6.00, "E-mini Russell 2000", "futures", "per_contract"),
                "DEFAULT": CommissionStructure(3.00, "Default futures commission rate", "futures", "per_contract")
            }
        },
        
        "ftmo": {
            "name": "FTMO",
            "commissions": {
                # FTMO typically has higher commissions
                "MNQ": CommissionStructure(2.50, "Micro NASDAQ-100 E-mini", "futures", "per_contract"),
                "MES": CommissionStructure(2.50, "Micro E-mini S&P 500", "futures", "per_contract"),
                "MYM": CommissionStructure(2.50, "Micro E-mini Dow", "futures", "per_contract"),
                "M2K": CommissionStructure(2.50, "Micro E-mini Russell 2000", "futures", "per_contract"),
                "NQ": CommissionStructure(7.00, "NASDAQ-100 E-mini", "futures", "per_contract"),
                "ES": CommissionStructure(7.00, "E-mini S&P 500", "futures", "per_contract"),
                "YM": CommissionStructure(7.00, "E-mini Dow", "futures", "per_contract"),
                "RTY": CommissionStructure(7.00, "E-mini Russell 2000", "futures", "per_contract"),
                "DEFAULT": CommissionStructure(3.50, "Default futures commission rate", "futures", "per_contract")
            }
        },
        
        "topstep": {
            "name": "TopStep",
            "commissions": {
                "MNQ": CommissionStructure(2.25, "Micro NASDAQ-100 E-mini", "futures", "per_contract"),
                "MES": CommissionStructure(2.25, "Micro E-mini S&P 500", "futures", "per_contract"),
                "MYM": CommissionStructure(2.25, "Micro E-mini Dow", "futures", "per_contract"),
                "M2K": CommissionStructure(2.25, "Micro E-mini Russell 2000", "futures", "per_contract"),
                "NQ": CommissionStructure(6.50, "NASDAQ-100 E-mini", "futures", "per_contract"),
                "ES": CommissionStructure(6.50, "E-mini S&P 500", "futures", "per_contract"),
                "YM": CommissionStructure(6.50, "E-mini Dow", "futures", "per_contract"),
                "RTY": CommissionStructure(6.50, "E-mini Russell 2000", "futures", "per_contract"),
                "DEFAULT": CommissionStructure(3.25, "Default futures commission rate", "futures", "per_contract")
            }
        },
        
        "the5ers": {
            "name": "The5ers",
            "commissions": {
                "MNQ": CommissionStructure(2.10, "Micro NASDAQ-100 E-mini", "futures", "per_contract"),
                "MES": CommissionStructure(2.10, "Micro E-mini S&P 500", "futures", "per_contract"),
                "MYM": CommissionStructure(2.10, "Micro E-mini Dow", "futures", "per_contract"),
                "M2K": CommissionStructure(2.10, "Micro E-mini Russell 2000", "futures", "per_contract"),
                "NQ": CommissionStructure(6.25, "NASDAQ-100 E-mini", "futures", "per_contract"),
                "ES": CommissionStructure(6.25, "E-mini S&P 500", "futures", "per_contract"),
                "YM": CommissionStructure(6.25, "E-mini Dow", "futures", "per_contract"),
                "RTY": CommissionStructure(6.25, "E-mini Russell 2000", "futures", "per_contract"),
                "DEFAULT": CommissionStructure(3.10, "Default futures commission rate", "futures", "per_contract")
            }
        },
        
        "custom": {
            "name": "Custom/Other",
            "commissions": {
                "DEFAULT": CommissionStructure(2.50, "Custom futures commission rate (user-defined)", "futures", "per_contract")
            }
        }
    }
    
    @classmethod
    def get_commission_rate(cls, prop_firm: str, symbol: str) -> float:
        """Get commission rate for a specific prop firm and symbol
        
        Args:
            prop_firm: Prop firm identifier (e.g., 'tradeify')
            symbol: Trading symbol (e.g., 'MNQ', 'ES')
            
        Returns:
            Commission rate per contract in USD
        """
        prop_firm = prop_firm.lower().strip()
        symbol = symbol.upper().strip()
        
        # Get prop firm data
        firm_data = cls.PROP_FIRMS.get(prop_firm)
        if not firm_data:
            # Default to custom if prop firm not found
            firm_data = cls.PROP_FIRMS["custom"]
        
        commissions = firm_data["commissions"]
        
        # Get commission for specific symbol or default
        if symbol in commissions:
            return commissions[symbol].commission_per_contract
        else:
            return commissions["DEFAULT"].commission_per_contract
    
    @classmethod
    def get_available_prop_firms(cls) -> Dict[str, str]:
        """Get list of available prop firms
        
        Returns:
            Dictionary mapping prop firm ID to display name
        """
        return {firm_id: firm_data["name"] for firm_id, firm_data in cls.PROP_FIRMS.items()}
    
    @classmethod
    def get_prop_firm_info(cls, prop_firm: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a prop firm
        
        Args:
            prop_firm: Prop firm identifier
            
        Returns:
            Prop firm information including commission structure
        """
        prop_firm = prop_firm.lower().strip()
        firm_data = cls.PROP_FIRMS.get(prop_firm)
        
        if not firm_data:
            return None
            
        # Convert commission structures to dict for JSON serialization
        commissions_dict = {}
        for symbol, commission in firm_data["commissions"].items():
            commissions_dict[symbol] = {
                "commission_per_contract": commission.commission_per_contract,
                "description": commission.description,
                "instrument_type": commission.instrument_type,
                "commission_unit": commission.commission_unit
            }
            
        return {
            "name": firm_data["name"],
            "commissions": commissions_dict
        }
    
    @classmethod
    def calculate_commission_cost(cls, prop_firm: str, symbol: str, quantity: int) -> float:
        """Calculate total commission cost for a trade
        
        Args:
            prop_firm: Prop firm identifier
            symbol: Trading symbol
            quantity: Number of contracts traded
            
        Returns:
            Total commission cost in USD
        """
        commission_rate = cls.get_commission_rate(prop_firm, symbol)
        return commission_rate * abs(quantity)  # Commission is always positive
