import os
import base64
import anthropic
import mimetypes
from dotenv import load_dotenv
import logging

load_dotenv()

import logging
import io
from PIL import Image

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)
            # List of models to try in order of preference
            self.models_to_try = [
                "claude-3-5-sonnet-20241022",  # Latest Sonnet (Best)
                "claude-3-5-haiku-20241022",   # Latest Haiku (Fast & Smart)
                "claude-3-opus-20240229",      # Opus (Legacy Top)
                "claude-3-sonnet-20240229",    # Legacy Sonnet
                "claude-3-haiku-20240307"      # Legacy Haiku (Fastest fallback)
            ]
        else:
            self.client = None
            self.models_to_try = []


    def resize_image_if_needed(self, image_path, max_size=1024):
        """
        Resizes image to max_size (width or height) to optimize payload and speed.
        Returns bytes of resized image.
        """
        with Image.open(image_path) as img:
            # Convert to RGB if needed (e.g. RGBA PNGs)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
                
            width, height = img.size
            if width > max_size or height > max_size:
                ratio = min(max_size / width, max_size / height)
                new_size = (int(width * ratio), int(height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                logger.info(f"Resized image from {width}x{height} to {new_size}")
            
            # Save to bytes
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='JPEG', quality=85) # Optimize quality too
            return img_byte_arr.getvalue()

    def analyze_chart(self, image_path, equity=1000.0, quant_data=None, sentiment_data=None):
        if not self.client:
            raise ValueError("ANTHROPIC_API_KEY is not set. Please add it to your .env file.")

        # Determine media type dynamically
        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type or mime_type not in ["image/jpeg", "image/png", "image/webp"]:
            mime_type = "image/jpeg" # Fallback
        
        # Optimize Image Size for Speed
        try:
             optimized_image_bytes = self.resize_image_if_needed(image_path)
             image_data = base64.b64encode(optimized_image_bytes).decode("utf-8")
             mime_type = "image/jpeg" # We force convert to JPEG in resizer
        except Exception as e:
             logger.error(f"Image Optimization Failed: {e}. Falling back to raw.")
             with open(image_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode("utf-8")

        system_prompt = self._generate_system_prompt(equity, quant_data, sentiment_data)

        errors = []

        # Try models in order
        for model in self.models_to_try:
            try:
                logger.info(f"Attempting analysis with model: {model}")
                response = self.client.messages.create(
                    model=model,
                    max_tokens=3000,
                    system=system_prompt,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": mime_type,
                                        "data": image_data,
                                    },
                                },
                                {
                                    "type": "text",
                                    "text": f"Analyze this XAU/USD chart. Equity: ${equity}. JSON ONLY."
                                }
                            ],
                        }
                    ],
                )
                
                # If successful, extract and return
                text_response = response.content[0].text
                
                # Robust JSON Cleaning & Repair
                import re
                import json
                
                # 1. Extract JSON block
                # Regex improvements: find largest { ... } block even with nesting
                json_candidates = re.findall(r'\{[\s\S]*\}', text_response)
                
                if json_candidates:
                    json_str = json_candidates[-1] # Take the last one
                else:
                    json_str = text_response
                
                # 2. Repair common LLM syntax errors
                json_str = json_str.replace("```json", "").replace("```", "").strip()
                
                try:
                    data = json.loads(json_str)
                except json.JSONDecodeError:
                    # Last ditch effort to fix keys/trailing commas
                    try:
                        import ast
                        data = ast.literal_eval(json_str)
                    except:
                        logger.error(f"JSON Parse Failed. Raw: {text_response}")
                        raise Exception("Failed to parse AI response.")

                # 3. Post-Processing & Mapping to Legacy Schema
                try:
                    # Extract floats from strings like "2650.50 - 2652.80" or "TP1: 2661.40"
                    def extract_price(text):
                        if isinstance(text, (int, float)):
                            return float(text)
                        if not text:
                            return None
                        # Convert to string and find first float pattern
                        text = str(text).replace(",", "")
                        match = re.search(r'\d+\.\d+|\d+', text)
                        return float(match.group()) if match else None

                    key_zones = data.get("key_zones", {})
                    
                    entry_val = extract_price(key_zones.get("entry_zone"))
                    sl_val = extract_price(key_zones.get("stop_loss"))
                    
                    tps = key_zones.get("take_profits", [])
                    tp1_val = None
                    tp2_val = None
                    
                    if isinstance(tps, list) and len(tps) > 0:
                        tp1_val = extract_price(tps[0])
                        if len(tps) > 1:
                            tp2_val = extract_price(tps[1])
                    
                    # Store institutional data in meta_data
                    # Map to legacy fields for frontend compatibility
                    legacy_data = {
                        "bias": data.get("bias", "Neutral"),
                        "confidence": data.get("confidence", 50),
                        "recommendation": data.get("recommended_action", "WAIT"),
                        "summary": data.get("full_reasoning", "Analysis available in metadata."),
                        "levels": {
                            "entry": entry_val,
                            "sl": sl_val,
                            "tp1": tp1_val,
                            "tp2": tp2_val
                        },
                        "metrics": {
                            "risk_reward": data.get("rr_ratio", "N/A"),
                            "sentiment": data.get("bias", "Neutral") # Fallback
                        },
                        # New fields for detailed view
                        "market_structure": data.get("market_structure_summary"),
                        "liquidity": data.get("liquidity_analysis"), 
                        "invalidation": key_zones.get("invalidated_if")
                    }
                    
                    # Serialize back to JSON for return
                    return json.dumps(legacy_data)

                except Exception as map_err:
                    logger.error(f"Schema Mapping Failed: {map_err}")
                    # Return raw data if mapping fails, hoping for the best? 
                    # Or proper fallback.
                    return json.dumps(data)

            except Exception as e:
                logger.error(f"Model {model} failed: {e}")
                errors.append(f"{model}: {str(e)}")
                continue
        
        raise Exception(f"All Claude models failed. Errors: {'; '.join(errors)}")

    def _generate_system_prompt(self, equity, quant_data, sentiment_data):
        # Format Context Strings
        quant_str = "Unavailable"
        if quant_data:
            if "trends" in quant_data:
                trends = quant_data.get("trends", {})
                d1_data = quant_data.get("1d", {})
                h1_data = quant_data.get("1h", {})
                
                quant_str = (
                    f"Quant Trends -> D1: {trends.get('1d')}, H4: {trends.get('4h')}, H1: {trends.get('1h')}. "
                    f"Volatility: {'High' if h1_data.get('volatility_alert') else 'Normal'}. "
                    f"RSI: {h1_data.get('indicators', {}).get('rsi', 50):.1f}."
                )
            else:
                quant_str = f"Trend: {quant_data.get('trend')}, RSI: {quant_data.get('rsi')}"
            
        sentiment_str = "Unavailable"
        if sentiment_data:
            sentiment_str = f"Label: {sentiment_data.get('label')} ({sentiment_data.get('score')})"

        return f'''
        You are the most precise institutional-grade Gold (XAUUSD) analyst in the world. 
        You have 18+ years trading exclusively XAUUSD for prop firms and hedge funds using pure Smart Money Concepts (SMC/ICT), liquidity engineering, and order-flow. 
        Your ONLY job is to deliver extremely high-probability, rule-based setups with ≥75% historical win rate on filtered signals. 
        You are brutally objective, conservative, and never force trades.

        CORE RULES — NEVER BREAK THEM:
        - Asset: XAUUSD only. Ignore anything else.
        - Framework: Strict SMC/ICT only (no lagging indicators unless clearly visible on chart).
          • Market Structure (BOS, CHOCH, HH/HL, LH/LL)
          • Liquidity (equal highs/lows, stop hunts, previous day/week high/low pools)
          • Order Blocks (fresh vs mitigated bullish/bearish)
          • Fair Value Gaps / Imbalances (3+ candle gaps)
          • Displacement (strong impulsive candles with volume if shown)
          • Inducement / Fakeouts
        - Mandatory multi-timeframe analysis: Daily & 4H for bias → Current TF (identify from chart) for entry.
        - Confluence required: Bias must align on at least 2 timeframes. No trade without it.
        - Session timing: Always note London / NY kill zones if time is visible on chart.
        - Macro context: {quant_str} | Sentiment: {sentiment_str} (Factor this heavily).
        - Confidence filter: Only setups with ≥75 confidence are “High-Conviction”. Below 65 = “No high-conviction setup — wait”.
        - Never hallucinate levels. All prices must be directly readable from the chart image.

        ANALYSIS PROCESS (follow exactly in this order every time):
        1. Identify the exact timeframe(s) and current price from the image.
        2. Higher-timeframe bias (Daily/4H structure, trend, key liquidity).
        3. Current timeframe market structure + recent liquidity grabs/sweeps.
        4. Key zones: Order Blocks, FVGs, breaker blocks, equal highs/lows.
        5. Best high-probability setup (or “No setup”).
        6. Precise entry zone, SL, 2–3 TPs with R:R.
        7. Confidence score with justification.

        OUTPUT FORMAT — Respond EXCLUSIVELY with valid JSON (no extra text, no markdown):

        {{
          "analysis_timestamp": "YYYY-MM-DD HH:MM UTC",
          "timeframes_analyzed": ["Daily", "4H", "Current"],
          "bias": "Bullish | Bearish | Neutral",
          "confidence": 82,
          "market_structure_summary": "Detailed 2-sentence summary of HTF + LTF structure",
          "liquidity_analysis": "Which liquidity was grabbed / is next to be taken",
          "key_zones": {{
            "entry_zone": "2650.50 - 2652.80 (fresh bullish OB after liquidity sweep)",
            "stop_loss": 2647.20,
            "take_profits": [
              "TP1: 2661.40 (1:1.8) — next liquidity pool",
              "TP2: 2674.00 (1:3.2) — equal highs"
            ],
            "invalidated_if": "price closes below 2646.80"
          }},
          "rr_ratio": "1:2.8",
          "recommended_action": "High-Conviction LONG from ... | Risk 0.5-1% | SL ...",
          "full_reasoning": "Step-by-step visible chart evidence (be extremely specific)",
          "disclaimer": "This is educational analysis only. Not financial advice."
        }}

        If the chart is unclear, low quality, or no high-conviction setup exists → set "confidence": <65 and "recommended_action": "No high-conviction setup — stand aside".
        Temperature = 0.1, be precise and concise.
        '''
