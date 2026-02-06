import asyncio
from services.quant_service import QuantService

async def test_quant():
    print("Initializing Quant Service...")
    qs = QuantService()
    
    print("\n1. Fetching Data for XAU/USD...")
    try:
        df = await qs.fetch_ohlcv("XAU/USD", limit=50)
        if not df.empty:
            print(f"Success! Fetched {len(df)} candles.")
            print(df.tail(3)[['timestamp', 'close', 'volume']])
        else:
            print("Failed: DataFrame is empty.")
            return
            
        print("\n2. Calculating Indicators...")
        df = qs.calculate_indicators(df)
        print("Indicators added:")
        print(df.tail(1)[['ATRr_14', 'RSI_14', 'EMA_20']])
        
        print("\n3. Analyzing Market Structure...")
        analysis = qs.analyze_market_structure(df)
        print("Analysis Result:")
        print(analysis)
        
    except Exception as e:
        print(f"Test Failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(test_quant())
