import ccxt
import pandas as pd
import numpy as np
import asyncio
import yfinance as yf

class QuantService:
    def __init__(self):
        self.exchange = ccxt.kraken() # Public data fallback

    async def fetch_ohlcv(self, symbol="XAU/USD", timeframe="1h", limit=100):
        """
        Fetches OHLCV data from yfinance (Gold Futures) or Kraken (fallback).
        """
        try:
            # 1. Try yfinance for Gold
            if symbol == "XAU/USD":
                try:
                    # Map timeframe to yfinance format
                    yf_interval = "1h"
                    if timeframe == "1m": yf_interval = "1m"
                    elif timeframe == "5m": yf_interval = "5m"
                    elif timeframe == "15m": yf_interval = "15m"
                    elif timeframe == "30m": yf_interval = "30m"
                    elif timeframe == "1d": yf_interval = "1d"
                    
                    # Fetch data in thread to avoid blocking
                    def fetch_yf():
                        # GC=F is Gold Futures
                        data = yf.download("GC=F", period="1mo", interval=yf_interval, progress=False)
                        return data

                    df = await asyncio.to_thread(fetch_yf)
                    
                    if not df.empty and len(df) > 10:
                        # Normalize yfinance dataframe
                        df = df.reset_index()
                        df.columns = [c.lower() for c in df.columns] 
                        if 'date' in df.columns:
                             df.rename(columns={'date': 'timestamp'}, inplace=True)
                        if 'datetime' in df.columns:
                             df.rename(columns={'datetime': 'timestamp'}, inplace=True)
                             
                        df = df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
                        
                        return df.tail(limit)
                except Exception as e:
                     print(f"yfinance failed: {e}. Trying fallback...")

            # 2. Fallback to Mock
            print(f"Quant: Using mock data due to primary feed failure.")
            return self.generate_mock_data(limit)
            
        except Exception as e:
            print(f"Quant Error: {e}")
            return pd.DataFrame() 

    async def get_multi_timeframe_analysis(self, symbol="XAU/USD"):
        """
        Fetches 1H, 4H (resampled), and Daily data to build a comprehensive market context.
        """
        try:
            # Fetch 1H and Daily in parallel
            task_1h = self.fetch_ohlcv(symbol, "1h", limit=200)
            task_1d = self.fetch_ohlcv(symbol, "1d", limit=50)
            
            df_1h, df_1d = await asyncio.gather(task_1h, task_1d)
            
            # Construct 4H from 1H
            if not df_1h.empty:
                df_1h.set_index('timestamp', inplace=True)
                df_4h = df_1h.resample('4h').agg({
                    'open': 'first',
                    'high': 'max',
                    'low': 'min',
                    'close': 'last',
                    'volume': 'sum'
                }).dropna()
                df_1h.reset_index(inplace=True)
                df_4h.reset_index(inplace=True)
            else:
                df_4h = pd.DataFrame()

            # Analyze Each Timeframe
            analysis_1h = self.analyze_market_structure(df_1h)
            analysis_4h = self.analyze_market_structure(df_4h)
            analysis_1d = self.analyze_market_structure(df_1d)
            
            # Synthesize Context
            trends = {
                "1h": analysis_1h.get("trend", "Neutral"),
                "4h": analysis_4h.get("trend", "Neutral"),
                "1d": analysis_1d.get("trend", "Neutral")
            }
            
            # Calculate Alignment
            alignment = "Mixed"
            if trends["1h"] == trends["4h"] == trends["1d"]:
                alignment = f"Strong {trends['1h']}"
            elif trends["4h"] == trends["1d"]:
                alignment = f"{trends['1d']} (Higher Timeframe Dominance)"
                
            return {
                "alignment": alignment,
                "trends": trends,
                "1h": analysis_1h,
                "4h": analysis_4h,
                "1d": analysis_1d
            }
            
        except Exception as e:
            print(f"Multi-Timeframe Analysis Failed: {e}")
            return {}

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

        # Helper for MACD
        def calculate_macd(series, fast=12, slow=26, signal=9):
            ema_fast = series.ewm(span=fast, adjust=False).mean()
            ema_slow = series.ewm(span=slow, adjust=False).mean()
            macd = ema_fast - ema_slow
            signal_line = macd.ewm(span=signal, adjust=False).mean()
            return macd, signal_line

        # Helper for Bollinger Bands
        def calculate_bb(series, period=20, std_dev=2):
            sma = series.rolling(window=period).mean()
            std = series.rolling(window=period).std()
            upper = sma + (std * std_dev)
            lower = sma - (std * std_dev)
            return upper, lower

        # Calculation
        df['EMA_20'] = calculate_ema(df['close'], 20)
        df['EMA_50'] = calculate_ema(df['close'], 50)
        df['RSI_14'] = calculate_rsi(df['close'], 14)
        df['ATRr_14'] = calculate_atr(df, 14)
        
        # MACD
        df['MACD'], df['MACD_Signal'] = calculate_macd(df['close'])
        
        # Bollinger Bands
        df['BB_Upper'], df['BB_Lower'] = calculate_bb(df['close'])
        
        # ADX (Simple approximation if needed, or skip for now)
        
        return df

    def analyze_market_structure(self, df):
        """
        Basic Quant Analysis: Trend & Volatility
        """
        if df.empty or len(df) < 20: # Lower threshold to 20 for D1
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
        
        # AI Levels Calculation
        entry = current['close']
        sl = 0.0
        tp = 0.0
        
        if trend == "Bullish":
            # SL below recent support (BB Lower or EMA50)
            sl = current['BB_Lower'] if not pd.isna(current['BB_Lower']) else (current['EMA_50'] - current_atr)
            risk = entry - sl
            if risk > 0:
                tp = entry + (risk * 2) # 1:2 Risk Reward
        elif trend == "Bearish":
            # SL above recent resistance (BB Upper or EMA50)
            sl = current['BB_Upper'] if not pd.isna(current['BB_Upper']) else (current['EMA_50'] + current_atr)
            risk = sl - entry
            if risk > 0:
                tp = entry - (risk * 2) # 1:2 Risk Reward
        
        return {
            "trend": trend,
            "current_price": current['close'],
            "volatility_alert": bool(is_volatile),
            "rsi": float(current['RSI_14']) if not pd.isna(current['RSI_14']) else 50.0,
            "macd_signal": "Buy" if current['MACD'] > current['MACD_Signal'] else "Sell",
            "ai_levels": {
                "entry": float(entry),
                "sl": float(sl),
                "tp": float(tp)
            }
        }
