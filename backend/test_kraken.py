import ccxt
import asyncio

async def list_symbols():
    try:
        exchange = ccxt.kraken()
        print("Fetching markets...")
        markets = exchange.load_markets()
        print("Markets loaded.")
        
        gold_pairs = [symbol for symbol in markets.keys() if "XAU" in symbol or "GOLD" in symbol]
        print("Found Gold pairs:", gold_pairs)
        
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(list_symbols())
