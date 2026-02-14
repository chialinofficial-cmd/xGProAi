import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.quant_service import QuantService
import asyncio
import json

async def main():
    quant = QuantService()
    # Test fetch_ohlcv
    print("Fetching OHLCV...")
    df = await quant.fetch_ohlcv("XAU/USD", "1h", 200)
    print(f"Dataframe Shape: {df.shape}")
    
    if df.empty:
        print("Failed to fetch data.")
        return

    # Test analyze_market_structure
    print("\nAnalyzing Market Structure...")
    result = quant.analyze_market_structure(df)
    
    # Print JSON
    print(json.dumps(result, indent=4))
    
    # Verify Fields
    assert "indicators" in result
    assert "macd" in result["indicators"]
    assert "rsi" in result["indicators"]
    assert "pivots" in result
    assert "pivot" in result["pivots"]
    
    print("\nTest Passed: Advanced Quant Features are functional!")

if __name__ == "__main__":
    asyncio.run(main())
