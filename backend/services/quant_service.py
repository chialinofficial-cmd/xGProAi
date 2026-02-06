import ccxt
import pandas as pd
import pandas_ta as ta
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
            # However, for production scale, async ccxt is better.
            # Here we use standard sync for simplicity in MVP.
            
            # Map symbol if needed
            mapped_symbol = symbol
            if symbol == "XAU/USD":
                mapped_symbol = "XAU/USD" 
            
            # Fetch
            ohlcv = self.exchange.fetch_ohlcv(mapped_symbol, timeframe, limit=limit)
            
            # Convert to Pandas DataFrame
            df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            
            return df
        except Exception as e:
            print(f"Quant Error: {e}")
            return pd.DataFrame()

    def calculate_indicators(self, df):
        """
        Adds technical indicators: ATR, RSI, EMAs
        """
        if df.empty:
            return df
            
        # ATR (Volatility)
        df.ta.atr(length=14, append=True)
        
        # RSI (Momentum)
        df.ta.rsi(length=14, append=True)
        
        # EMAs (Trend)
        df.ta.ema(length=20, append=True)
        df.ta.ema(length=50, append=True)
        
        return df

    def analyze_market_structure(self, df):
        """
        Basic Quant Analysis: Trend & Volatility
        """
        if df.empty:
            return {"status": "error", "message": "No data"}
            
        current = df.iloc[-1]
        prev = df.iloc[-2]
        
        # Trend Detection
        trend = "Neutral"
        if current['EMA_20'] > current['EMA_50']:
            trend = "Bullish"
        elif current['EMA_20'] < current['EMA_50']:
            trend = "Bearish"
            
        # Volatility Check
        avg_atr = df['ATRr_14'].mean()
        current_atr = current['ATRr_14']
        is_volatile = current_atr > (avg_atr * 1.5)
        
        return {
            "trend": trend,
            "current_price": current['close'],
            "volatility_alert": is_volatile,
            "rsi": current['RSI_14']
        }
