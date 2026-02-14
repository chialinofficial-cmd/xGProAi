import sys
import os
import asyncio
import pandas as pd
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load Environment Variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".env"))

from backend.services.quant_service import QuantService

async def test_alpha_vantage():
    print("--- Testing Alpha Vantage Integration ---")
    
    quant = QuantService()
    
    if not quant.av_key:
        print("ERROR: ALPHA_VANTAGE_KEY not found in environment.")
        return

    print(f"API Key detected: {quant.av_key[:4]}****")
    
    # Test 1: Fetch Intraday (1h)
    print("\n1. Fetching 1H Data (FX_INTRADAY)...")
    df_1h = await quant.fetch_alpha_vantage_data(symbol="XAU/USD", timeframe="1h", limit=5)
    
    if df_1h.empty:
        print("FAILED: Returned empty DataFrame for 1H.")
    else:
        print("SUCCESS: 1H Data Fetched.")
        print(df_1h.head())
        print("Columns:", df_1h.columns.tolist())
        
        # Validation
        required = ['timestamp', 'open', 'high', 'low', 'close']
        if all(col in df_1h.columns for col in required):
            print("VALIDATION: Schema matches.")
        else:
            print(f"VALIDATION FAILED: Missing columns. Got {df_1h.columns.tolist()}")

    # Test 2: Fetch Daily (1d)
    print("\n2. Fetching Daily Data (FX_DAILY)...")
    df_1d = await quant.fetch_alpha_vantage_data(symbol="XAU/USD", timeframe="1d", limit=5)
    
    if df_1d.empty:
        print("FAILED: Returned empty DataFrame for 1D (Expected if API limit reached).")
    else:
        print("SUCCESS: 1D Data Fetched.")
        print(df_1d.head())

    # Test 3: Fallback Mechanism (fetch_ohlcv)
    print("\n3. Testing Fallback Mechanism (fetch_ohlcv)...")
    df_fallback = await quant.fetch_ohlcv(symbol="XAU/USD", timeframe="1h", limit=5)
    
    if not df_fallback.empty:
        print("SUCCESS: Fallback returned data (likely yfinance).")
        print(df_fallback.head())
        print("Columns:", df_fallback.columns.tolist())
    else:
        print("FAILED: Fallback mechanism returned empty DataFrame.")

if __name__ == "__main__":
    try:
        asyncio.run(test_alpha_vantage())
    except Exception as e:
        print(f"TEST CRASHED: {e}")
