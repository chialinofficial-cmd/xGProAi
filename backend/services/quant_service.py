try:
    import ccxt
except ImportError:
    ccxt = None
import pandas as pd
import numpy as np
import asyncio
import yfinance as yf
import requests
import os
import io

import logging

logger = logging.getLogger(__name__)

class QuantService:
    def __init__(self):
        self.exchange = ccxt.kraken() if ccxt else None # Public data fallback
        self.av_key = os.getenv("ALPHA_VANTAGE_KEY")

    async def fetch_alpha_vantage_data(self, symbol="XAU/USD", timeframe="1h", limit=100):
        """
        Fetches data from Alpha Vantage API.
        """
        if not self.av_key:
            logger.warning("Alpha Vantage Key missing.")
            return pd.DataFrame()

        try:
            # Map symbol
            from_symbol = "XAU"
            to_symbol = "USD"
            if "/" in symbol:
                parts = symbol.split("/")
                from_symbol = parts[0]
                to_symbol = parts[1]

            # Map timeframe to AV interval
            function = "FX_INTRADAY"
            interval = "60min"
            if timeframe == "1m": interval = "1min"
            elif timeframe == "5m": interval = "5min"
            elif timeframe == "15m": interval = "15min"
            elif timeframe == "30m": interval = "30min"
            elif timeframe == "1h": interval = "60min"
            elif timeframe == "1d": function = "FX_DAILY"

            url = f"https://www.alphavantage.co/query?function={function}&from_symbol={from_symbol}&to_symbol={to_symbol}&apikey={self.av_key}&datatype=csv"
            
            if function == "FX_INTRADAY":
                url += f"&interval={interval}"
            
            # Fetch data (blocking IO in thread)
            def fetch_av():
                response = requests.get(url)
                if response.status_code == 200:
                    return response.content
                return None

            content = await asyncio.to_thread(fetch_av)
            
            if not content:
                return pd.DataFrame()

            # Check for JSON error response (starts with {)
            if content.strip().startswith(b'{'):
                # Try to parse the error for logging
                try:
                    import json
                    error_json = json.loads(content)
                    logger.warning(f"Alpha Vantage API Message: {error_json}")
                except:
                    logger.error(f"Alpha Vantage API returned JSON (likely error/limit): {content[:100]}")
                return pd.DataFrame()

            # Parse CSV
            try:
                df = pd.read_csv(io.BytesIO(content))
            except Exception as e:
                logger.error(f"Alpha Vantage CSV Parse Failed: {e}")
                return pd.DataFrame()
            
            if df.empty:
                return pd.DataFrame()

            # Normalize Columns
            # AV CSV returns: timestamp,open,high,low,close
            df.columns = [c.lower() for c in df.columns]
            # print(f"DEBUG: AV Columns: {df.columns.tolist()}") # Commented out debug print
            
            if 'timestamp' in df.columns:
                 # Ensure datetime
                 df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Ensure volume (AV FX doesn't always give volume, fill 0)
            if 'volume' not in df.columns:
                df['volume'] = 0
            
            df = df.sort_values('timestamp')
            
            return df.tail(limit)

        except Exception as e:
            logger.error(f"Alpha Vantage Error: {e}")
            return pd.DataFrame()

    async def fetch_ohlcv(self, symbol="XAU/USD", timeframe="1h", limit=100):
        """
        Fetches OHLCV data from Alpha Vantage (Primary) -> yfinance (Secondary) -> Mock (Fallback).
        """
        try:
            # 1. Try Alpha Vantage
            df_av = await self.fetch_alpha_vantage_data(symbol, timeframe, limit)
            if not df_av.empty and len(df_av) > 5:
                return df_av

            logger.info("Alpha Vantage failed or returned empty. Falling back to yfinance...")

            # 2. Try yfinance for Gold
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
                        
                        # Flatten MultiIndex columns if present
                        if isinstance(df.columns, pd.MultiIndex):
                            df.columns = df.columns.get_level_values(0)
                        
                        df.columns = [str(c).lower() for c in df.columns]
                        
                        if 'date' in df.columns:
                             df.rename(columns={'date': 'timestamp'}, inplace=True)
                        if 'datetime' in df.columns:
                             df.rename(columns={'datetime': 'timestamp'}, inplace=True)
                             
                        # Ensure we have the required columns
                        required_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
                        available_cols = [c for c in required_cols if c in df.columns]
                        
                        if len(available_cols) < 6:
                             # Try mapping 'adj close' if 'close' missing, etc. 
                             # But usually yfinance gives these.
                             pass
                             
                        df = df[available_cols]
                        
                        return df.tail(limit)
                except Exception as e:
                     logger.error(f"yfinance failed: {e}. Trying fallback...")

            # 3. Fallback to Mock
            logger.warning(f"Quant: Using mock data due to primary feed failure.")
            return self.generate_mock_data(limit)
            
        except Exception as e:
            logger.error(f"Quant Error: {e}")
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
            logger.error(f"Multi-Timeframe Analysis Failed: {e}")
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

        # Helper for Pivot Points (Standard)
        def calculate_pivots(df):
            # Using previous day's High, Low, Close
            # Since this df might be intraday, we should look for previous 'day' boundary ideally.
            # But for simplicity in this context (often H1 data), we'll calculate based on the *rolling* or *window* of last P periods as proxy or just last completed bar if D1.
            # Better approach for H1/H4: Take the last completed candle as "Pivot" source if input is D1.
            # If input is H1, we can't easily get D1 pivots without D1 data.
            # However, we can calculate local pivots based on local extrema or just standard formula on the *current timeframe* bars (less standard).
            
            # Let's start simple: Standard Pivot on the provided data frame's last complete bar? 
            # No, standard functionality: (H+L+C)/3
            high = df['high']
            low = df['low']
            close = df['close']
            
            pivot = (high + low + close) / 3
            r1 = (2 * pivot) - low
            s1 = (2 * pivot) - high
            r2 = pivot + (high - low)
            s2 = pivot - (high - low)
            
            return pivot, r1, s1, r2, s2

        # Calculation
        df['EMA_20'] = calculate_ema(df['close'], 20)
        df['EMA_50'] = calculate_ema(df['close'], 50)
        df['RSI_14'] = calculate_rsi(df['close'], 14)
        df['ATRr_14'] = calculate_atr(df, 14)
        
        # MACD
        df['MACD'], df['MACD_Signal'] = calculate_macd(df['close'])
        
        # Bollinger Bands
        df['BB_Upper'], df['BB_Lower'] = calculate_bb(df['close'])
        
        # Pivot Points (Calculated for every row based on that row's HLC - useful for intraday levels if using D1 data, or just local pivots)
        df['Pivot'], df['R1'], df['S1'], df['R2'], df['S2'] = calculate_pivots(df)
        
        return df

    def analyze_market_structure(self, df):
        """
        Advanced Quant Analysis: Trend, Volatility, Momentum, and Levels
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
        
        # Momentum (RSI)
        rsi = float(current['RSI_14']) if not pd.isna(current['RSI_14']) else 50.0
        momentum = "Neutral"
        if rsi > 70: momentum = "Overbought"
        elif rsi < 30: momentum = "Oversold"
        elif rsi > 55: momentum = "Bullish"
        elif rsi < 45: momentum = "Bearish"

        # MACD
        macd_val = current['MACD']
        macd_sig = current['MACD_Signal']
        macd_hist = macd_val - macd_sig
        macd_sentiment = "Bullish" if macd_hist > 0 else "Bearish"

        # Bollinger Bands Position
        bb_upper = current['BB_Upper']
        bb_lower = current['BB_Lower']
        close = current['close']
        bb_position = "Inside"
        if close > bb_upper: bb_position = "Above Upper"
        elif close < bb_lower: bb_position = "Below Lower"
        
        # AI Levels Calculation (Enhanced with Pivots)
        entry = current['close']
        sl = 0.0
        tp = 0.0
        
        # Use Pivot Points if available and valid (non-nan)
        pivot = current['Pivot'] if not pd.isna(current['Pivot']) else entry
        r1 = current['R1'] if not pd.isna(current['R1']) else (entry + current_atr)
        s1 = current['S1'] if not pd.isna(current['S1']) else (entry - current_atr)

        if trend == "Bullish":
            # SL below S1 or EMA50
            sl = s1 if s1 < entry else (current['EMA_50'] - current_atr)
            risk = entry - sl
            if risk > 0:
                tp = r1 if r1 > entry else (entry + (risk * 2))
        elif trend == "Bearish":
            # SL above R1 or EMA50
            sl = r1 if r1 > entry else (current['EMA_50'] + current_atr)
            risk = sl - entry
            if risk > 0:
                tp = s1 if s1 < entry else (entry - (risk * 2))
        
        return {
            "trend": trend,
            "momentum": momentum,
            "volatility_alert": bool(is_volatile),
            "current_price": float(current['close']),
            "indicators": {
                "rsi": rsi,
                "macd": {"line": float(macd_val), "signal": float(macd_sig), "hist": float(macd_hist), "sentiment": macd_sentiment},
                "bollinger": {"upper": float(bb_upper), "lower": float(bb_lower), "position": bb_position},
                "atr": float(current_atr),
                "ema_20": float(current['EMA_20']),
                "ema_50": float(current['EMA_50'])
            },
            "pivots": {
                "pivot": float(pivot),
                "r1": float(r1),
                "s1": float(s1),
                "r2": float(current['R2']) if not pd.isna(current['R2']) else 0.0,
                "s2": float(current['S2']) if not pd.isna(current['S2']) else 0.0
            },
            "ai_levels": {
                "entry": float(entry),
                "sl": float(sl),
                "tp": float(tp)
            }
        }
