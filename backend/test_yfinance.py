import yfinance as yf

def test_yfinance():
    print("Testing yfinance for Gold (XAU-USD)...")
    try:
        # XAU-USD is Spot Gold
        data = yf.download("GC=F", period="1d", interval="1h") # Gold Futures
        if not data.empty:
            print("Success! Data received:")
            print(data.tail())
        else:
            print("Failed: Empty data")
            
    except Exception as e:
        print(f"Failed with error: {e}")

if __name__ == "__main__":
    test_yfinance()
