"""
CME Contract Specifications Library

Provides official CME contract specifications including tick values, multipliers,
and contract details for accurate futures P&L calculations.

Based on official CME Group specifications as of 2024.
"""

import re
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ContractSpec:
    """CME Contract Specification"""
    symbol: str
    name: str
    tick_size: float  # Minimum price movement
    tick_value: float  # Dollar value per tick
    multiplier: float  # Contract multiplier
    currency: str
    exchange: str
    sector: str
    
    def calculate_pnl(self, price_diff: float, quantity: float) -> float:
        """Calculate P&L using proper tick-based calculation"""
        # Convert price difference to ticks
        ticks = price_diff / self.tick_size
        # Calculate P&L using tick value
        return ticks * self.tick_value * quantity


# CME Contract Specifications Database
CME_CONTRACTS: Dict[str, ContractSpec] = {
    # E-mini Equity Index Futures
    "ES": ContractSpec(
        symbol="ES",
        name="E-mini S&P 500",
        tick_size=0.25,
        tick_value=12.50,
        multiplier=50.0,
        currency="USD",
        exchange="CME",
        sector="equity_index"
    ),
    "NQ": ContractSpec(
        symbol="NQ",
        name="E-mini Nasdaq-100",
        tick_size=0.25,
        tick_value=5.00,
        multiplier=20.0,
        currency="USD",
        exchange="CME",
        sector="equity_index"
    ),
    "YM": ContractSpec(
        symbol="YM",
        name="E-mini Dow Jones",
        tick_size=1.0,
        tick_value=5.00,
        multiplier=5.0,
        currency="USD",
        exchange="CBOT",
        sector="equity_index"
    ),
    "RTY": ContractSpec(
        symbol="RTY",
        name="E-mini Russell 2000",
        tick_size=0.10,
        tick_value=5.00,
        multiplier=50.0,
        currency="USD",
        exchange="CME",
        sector="equity_index"
    ),
    
    # Micro E-mini Futures
    "MES": ContractSpec(
        symbol="MES",
        name="Micro E-mini S&P 500",
        tick_size=0.25,
        tick_value=1.25,
        multiplier=5.0,
        currency="USD",
        exchange="CME",
        sector="equity_index"
    ),
    "MNQ": ContractSpec(
        symbol="MNQ",
        name="Micro E-mini Nasdaq-100",
        tick_size=0.25,
        tick_value=0.50,
        multiplier=2.0,
        currency="USD",
        exchange="CME",
        sector="equity_index"
    ),
    "MYM": ContractSpec(
        symbol="MYM",
        name="Micro E-mini Dow Jones",
        tick_size=1.0,
        tick_value=0.50,
        multiplier=0.5,
        currency="USD",
        exchange="CBOT",
        sector="equity_index"
    ),
    "M2K": ContractSpec(
        symbol="M2K",
        name="Micro E-mini Russell 2000",
        tick_size=0.10,
        tick_value=0.50,
        multiplier=5.0,
        currency="USD",
        exchange="CME",
        sector="equity_index"
    ),
    
    # Energy Futures
    "CL": ContractSpec(
        symbol="CL",
        name="Crude Oil",
        tick_size=0.01,
        tick_value=10.00,
        multiplier=1000.0,
        currency="USD",
        exchange="NYMEX",
        sector="energy"
    ),
    "NG": ContractSpec(
        symbol="NG",
        name="Natural Gas",
        tick_size=0.001,
        tick_value=10.00,
        multiplier=10000.0,
        currency="USD",
        exchange="NYMEX",
        sector="energy"
    ),
    "RB": ContractSpec(
        symbol="RB",
        name="RBOB Gasoline",
        tick_size=0.0001,
        tick_value=4.20,
        multiplier=42000.0,
        currency="USD",
        exchange="NYMEX",
        sector="energy"
    ),
    "HO": ContractSpec(
        symbol="HO",
        name="Heating Oil",
        tick_size=0.0001,
        tick_value=4.20,
        multiplier=42000.0,
        currency="USD",
        exchange="NYMEX",
        sector="energy"
    ),
    
    # Metals Futures
    "GC": ContractSpec(
        symbol="GC",
        name="Gold",
        tick_size=0.10,
        tick_value=10.00,
        multiplier=100.0,
        currency="USD",
        exchange="COMEX",
        sector="metals"
    ),
    "SI": ContractSpec(
        symbol="SI",
        name="Silver",
        tick_size=0.005,
        tick_value=25.00,
        multiplier=5000.0,
        currency="USD",
        exchange="COMEX",
        sector="metals"
    ),
    "HG": ContractSpec(
        symbol="HG",
        name="Copper",
        tick_size=0.0005,
        tick_value=12.50,
        multiplier=25000.0,
        currency="USD",
        exchange="COMEX",
        sector="metals"
    ),
    "PL": ContractSpec(
        symbol="PL",
        name="Platinum",
        tick_size=0.10,
        tick_value=5.00,
        multiplier=50.0,
        currency="USD",
        exchange="NYMEX",
        sector="metals"
    ),
    
    # Agricultural Futures
    "ZC": ContractSpec(
        symbol="ZC",
        name="Corn",
        tick_size=0.0025,  # 1/4 cent
        tick_value=12.50,
        multiplier=5000.0,
        currency="USD",
        exchange="CBOT",
        sector="agriculture"
    ),
    "ZS": ContractSpec(
        symbol="ZS",
        name="Soybeans",
        tick_size=0.0025,  # 1/4 cent
        tick_value=12.50,
        multiplier=5000.0,
        currency="USD",
        exchange="CBOT",
        sector="agriculture"
    ),
    "ZW": ContractSpec(
        symbol="ZW",
        name="Wheat",
        tick_size=0.0025,  # 1/4 cent
        tick_value=12.50,
        multiplier=5000.0,
        currency="USD",
        exchange="CBOT",
        sector="agriculture"
    ),
    "LE": ContractSpec(
        symbol="LE",
        name="Live Cattle",
        tick_size=0.00025,
        tick_value=10.00,
        multiplier=40000.0,
        currency="USD",
        exchange="CME",
        sector="agriculture"
    ),
    
    # Interest Rate Futures
    "ZN": ContractSpec(
        symbol="ZN",
        name="10-Year Treasury Note",
        tick_size=0.015625,  # 1/64
        tick_value=15.625,
        multiplier=1000.0,
        currency="USD",
        exchange="CBOT",
        sector="interest_rates"
    ),
    "ZB": ContractSpec(
        symbol="ZB",
        name="30-Year Treasury Bond",
        tick_size=0.03125,  # 1/32
        tick_value=31.25,
        multiplier=1000.0,
        currency="USD",
        exchange="CBOT",
        sector="interest_rates"
    ),
    "ZF": ContractSpec(
        symbol="ZF",
        name="5-Year Treasury Note",
        tick_size=0.0078125,  # 1/128
        tick_value=7.8125,
        multiplier=1000.0,
        currency="USD",
        exchange="CBOT",
        sector="interest_rates"
    ),
    
    # Currency Futures
    "6E": ContractSpec(
        symbol="6E",
        name="Euro FX",
        tick_size=0.00005,
        tick_value=6.25,
        multiplier=125000.0,
        currency="USD",
        exchange="CME",
        sector="currency"
    ),
    "6J": ContractSpec(
        symbol="6J",
        name="Japanese Yen",
        tick_size=0.0000005,
        tick_value=6.25,
        multiplier=12500000.0,
        currency="USD",
        exchange="CME",
        sector="currency"
    ),
    "6B": ContractSpec(
        symbol="6B",
        name="British Pound",
        tick_size=0.00005,
        tick_value=6.25,
        multiplier=62500.0,
        currency="USD",
        exchange="CME",
        sector="currency"
    ),
}


# Month codes for futures expiration
MONTH_CODES = {
    "F": "January", "G": "February", "H": "March",
    "J": "April", "K": "May", "M": "June",
    "N": "July", "Q": "August", "U": "September",
    "V": "October", "X": "November", "Z": "December"
}


def parse_futures_symbol(symbol: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Parse futures symbol into base symbol, month, and year
    
    Examples:
        'ESU24' -> ('ES', 'U', '24')
        'MESU5' -> ('MES', 'U', '5')
        'MNQU24' -> ('MNQ', 'U', '24')
        'ES' -> ('ES', None, None)
    """
    if not symbol:
        return None, None, None
    
    symbol = symbol.upper()
    
    # Sort base symbols by length (longest first) to handle overlapping patterns
    # e.g., MES vs MESU where MES should match first
    sorted_bases = sorted(CME_CONTRACTS.keys(), key=len, reverse=True)
    
    # Try to match known base symbols with expiration codes
    for base_symbol in sorted_bases:
        if symbol.startswith(base_symbol):
            remainder = symbol[len(base_symbol):]
            
            # If no remainder, it's just the base symbol
            if not remainder:
                return base_symbol, None, None
            
            # Check if remainder matches month+year pattern
            if len(remainder) >= 2:
                month_code = remainder[0]
                year_code = remainder[1:]
                
                # Validate month code
                if month_code in MONTH_CODES:
                    return base_symbol, month_code, year_code
    
    # If no match found, return the original symbol as base
    return symbol, None, None


def get_contract_spec(symbol: str) -> Optional[ContractSpec]:
    """Get contract specification for a given symbol
    
    Handles both base symbols (ES) and full contract symbols (ESU24)
    """
    base_symbol, month_code, year_code = parse_futures_symbol(symbol)
    
    if base_symbol and base_symbol in CME_CONTRACTS:
        return CME_CONTRACTS[base_symbol]
    
    return None


def calculate_futures_pnl(
    symbol: str, 
    entry_price: float, 
    exit_price: float, 
    quantity: float,
    trade_direction: str = "long"
) -> Tuple[float, Dict]:
    """Calculate P&L for futures trade using CME specifications
    
    Returns:
        Tuple of (pnl, metadata)
    """
    contract_spec = get_contract_spec(symbol)
    
    if not contract_spec:
        # Fallback to simple calculation if contract not found
        price_diff = exit_price - entry_price
        if trade_direction.lower() == "short":
            price_diff = -price_diff
        
        return price_diff * quantity, {
            "calculation_method": "fallback",
            "contract_found": False,
            "symbol": symbol
        }
    
    # Calculate price difference based on trade direction
    if trade_direction.lower() == "long":
        price_diff = exit_price - entry_price
    else:  # short
        price_diff = entry_price - exit_price
    
    # Use CME tick-based calculation
    pnl = contract_spec.calculate_pnl(price_diff, quantity)
    
    metadata = {
        "calculation_method": "cme_tick_based",
        "contract_found": True,
        "symbol": symbol,
        "base_symbol": contract_spec.symbol,
        "contract_name": contract_spec.name,
        "tick_size": contract_spec.tick_size,
        "tick_value": contract_spec.tick_value,
        "multiplier": contract_spec.multiplier,
        "price_diff": price_diff,
        "ticks": price_diff / contract_spec.tick_size,
        "sector": contract_spec.sector
    }
    
    return pnl, metadata


def is_futures_symbol(symbol: str) -> bool:
    """Check if symbol is a recognized futures contract"""
    if not symbol:
        return False
    
    base_symbol, _, _ = parse_futures_symbol(symbol)
    return base_symbol in CME_CONTRACTS


def get_all_contracts() -> Dict[str, ContractSpec]:
    """Get all available contract specifications"""
    return CME_CONTRACTS.copy()


def get_contracts_by_sector(sector: str) -> Dict[str, ContractSpec]:
    """Get contracts filtered by sector"""
    return {
        symbol: spec for symbol, spec in CME_CONTRACTS.items()
        if spec.sector == sector
    }
