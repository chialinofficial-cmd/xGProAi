import ccxt
import pandas as pd
import numpy as np
import asyncio

class QuantService:
    def __init__(self):
        self.exchange = ccxt.kraken() # Public data, no API key needed for basic OHLCV

    async def fetch_ohlcv(self, symbol="XAU/USD", timeframe="1h", limit=100):
        """
        Fetches OHLCV data from Kraken (or fallback).
        Assets are mapped: XAU/USD -> XAU/USD or similar.
        """
        try:
            # CCXT is synchronous by default unless using ccxt.async_support
            # For MVP, we wrap in asyncio.to_thread if we want async, or just use sync for now.
            
            # Map symbol if needed
            mapped_symbol = symbol
            if symbol == "XAU/USD":
                mapped_symbol = "XAU/USD" 
            
            # Fetch (Async Wrapper)
            # Run blocking CCXT call in a separate thread to avoid blocking the event loop
            try:
                ohlcv = await asyncio.to_thread(self.exchange.fetch_ohlcv, mapped_symbol, timeframe, limit=limit)
            except Exception as e:
                # Fallback to mock data if exchange fails (e.g. rate limit or network)
                print(f"Exchange fetch failed: {e}. Using mock data.")
                return self.generate_mock_data(limit)
            
            # Convert to Pandas DataFrame
            df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            
            return df
        except Exception as e:
            print(f"Quant Error: {e}")
            return pd.DataFrame()

    def generate_mock_data(self, limit):
        # Generate some realistic looking gold data
        base_price = 2030.0
        data = []
        now = pd.Timestamp.now()
        for i in range(limit):
            time = now - pd.Timedelta(hours=limit-i)
            base_price += np.random.normal(0, 2)
            data.append([time.timestamp()*1000, base_price, base_price+1, base_price-1, base_price, 100])
        
        df = pd.DataFrame(data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        return df

    def calculate_indicators(self, df):
        """
        Adds technical indicators: ATR, RSI, EMAs manually without pandas_ta
        """
        if df.empty:
            return df
            
        # Helper for EMA
        def calculate_ema(series, span):
            return series.ewm(span=span, adjust=False).mean()

        # Helper for RSI
        def calculate_rsi(series, period=14):
            delta = series.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            rs = gain / loss
            return 100 - (100 / (1 + rs))
            
        # Helper for ATR
        def calculate_atr(df, period=14):
            high_low = df['high'] - df['low']
            high_close = np.abs(df['high'] - df['close'].shift())
            low_close = np.abs(df['low'] - df['close'].shift())
            ranges = pd.concat([high_low, high_close, low_close], axis=1)
            true_range = np.max(ranges, axis=1)
            return true_range.rolling(window=period).mean()

        # Calculation
        df['EMA_20'] = calculate_ema(df['close'], 20)
        df['EMA_50'] = calculate_ema(df['close'], 50)
        df['RSI_14'] = calculate_rsi(df['close'], 14)
        df['ATRr_14'] = calculate_atr(df, 14)
        
        return df

    def analyze_market_structure(self, df):
        """
        Basic Quant Analysis: Trend & Volatility
        """
        if df.empty or len(df) < 50:
            return {"status": "error", "message": "Insufficient data"}
            
        df = self.calculate_indicators(df)
        current = df.iloc[-1]
        
        if pd.isna(current['EMA_20']):
             return {"status": "neutral", "message": "Not enough data for indicators"}

        # Trend Detection
        trend = "Neutral"
        if current['EMA_20'] > current['EMA_50']:
            trend = "Bullish"
        elif current['EMA_20'] < current['EMA_50']:
            trend = "Bearish"
            
        # Volatility Check
        avg_atr = df['ATRr_14'].mean()
        current_atr = current['ATRr_14']
        is_volatile = current_atr > (avg_atr * 1.5) if not pd.isna(avg_atr) else False
        
        return {
            "trend": trend,
            "current_price": current['close'],
            "volatility_alert": bool(is_volatile),
            "rsi": float(current['RSI_14']) if not pd.isna(current['RSI_14']) else 50.0
        }
