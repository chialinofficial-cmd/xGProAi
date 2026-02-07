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
                "claude-3-5-sonnet-latest",    # Generic Alias (often works when specific IDs fail)
                "claude-3-5-sonnet-20241022",  # Latest Sonnet
                "claude-3-5-sonnet-20240620",  # Previous Sonnet
                "claude-3-opus-latest",        # Generic Opus
                "claude-3-opus-20240229",      # Opus
                "claude-3-sonnet-20240229",    # Legacy Sonnet
                "claude-3-haiku-20240307"      # Haiku (Fastest, often works)
            ]
        else:
            self.client = None
            self.client = None
            self.models_to_try = []

    def resize_image_if_needed(self, image_path, max_size=1024):
        """
        Resizes image to max_size (width or height) to optimize payload and speed.
        Returns bytes of resized image.
        """
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if needed
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
                img.save(img_byte_arr, format='JPEG', quality=85)
                return img_byte_arr.getvalue()
        except Exception as e:
            logger.error(f"Resize failed: {e}")
            with open(image_path, "rb") as f:
                return f.read()

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

        # Read and encode image to base64
        # with open(image_path, "rb") as image_file:
        #     image_data = base64.b64encode(image_file.read()).decode("utf-8")
        
        # Optimize Image Size for Speed
        try:
             optimized_image_bytes = self.resize_image_if_needed(image_path)
             image_data = base64.b64encode(optimized_image_bytes).decode("utf-8")
             mime_type = "image/jpeg" # We force convert to JPEG in resizer
        except Exception as e:
             logger.error(f"Image Optimization Failed: {e}. Falling back to raw.")
             with open(image_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode("utf-8")

        # Format Context Strings
        quant_str = "Unavailable"
        if quant_data:
            quant_str = f"Trend: {quant_data.get('trend')}, RSI: {quant_data.get('rsi')}, Volatility Alert: {quant_data.get('volatility_alert')}"
            
        sentiment_str = "Unavailable"
        if sentiment_data:
            sentiment_str = f"Score: {sentiment_data.get('score')}, Label: {sentiment_data.get('label')}, Summary: {sentiment_data.get('summary')}"

        system_prompt = f"""
        You are xGProAi, the world's leading **Institutional Quantitative & SMC Technical Analyst**.
        
        CURRENT ACCOUNT EQUITY: ${equity}
        RISK PER TRADE: 1.0% (${equity * 0.01})
        
        **LIVE MARKET CONTEXT (TRI-MODEL INPUTS):**
        *   **QUANT ENGINE:** {quant_str}
        *   **SENTIMENT ENGINE:** {sentiment_str}
        
        **CORE PHILOSOPHY: Smart Money Concepts (SMC)**
        Retail traders look for triangles and wedges. You look for **Liquidity, Inefficiency, and Order Flow.**
        
        **CRITICAL ANALYSIS RULES:**
        1.  **MARKET STRUCTURE (BOSS):** Identify Break of Structure (BOS) and Change of Character (CHoCH/MSS).
        2.  **LIQUIDITY (The Fuel):**
            *   **BSL (Buy Side Liquidity):** Equal Highs or Trendline Liquidity above price.
            *   **SSL (Sell Side Liquidity):** Equal Lows or Trendline Liquidity below price.
            *   **Sweep:** Has price recently "swept" a liquidity pool? (Wick grab).
        3.  **INEFFICIENCY (The Magnet):** Identify Fair Value Gaps (FVG) / Imbalances. Price often returns to these.
        4.  **ORDER BLOCKS (The Defense):** Identify the institutional Order Block (OB) responsible for the move.
        5.  **SYNTHESIS:** Combine Visual SMC with the QUANT/SENTIMENT context provided above.
            *   If Sentiment is Bearish but Chart is Bullish -> **Reduce Confidence**.
            *   If Quant RSI is overbought + Bearish Structure -> **High Confidence Sell**.
        
        **RISK MANAGEMENT (GOLD SPECIALIST):**
        *   **Volatility Aware:** Gold XAU/USD is volatile.
        *   **Stop Loss Placement:** BEHIND the invalidation point (e.g. Swing High/Low or OB), plus padding (30-50 pips).
        *   **Lot Size Formula:** (Equity * 0.01) / (SL_Pips * 10).
        
        **OUTPUT REQUIREMENTS:**
        Thinking Process (<analysis>):
        1.  Identify Logic: Liquidity Sweep -> Reversal? FVG Retest -> Continuation?
        2.  Integrate Context: How does Quant/Sentiment support or contradict the chart?
        3.  Define Zones: Entry at OB or FVG. SL behind Structure.
        4.  Calculate Math: Exact Pips and Lot Size.
        
        JSON Output Specification:
        {{
            "y_axis_labels": ["2040.00", "2050.00"],
            "bias": "Bullish" | "Bearish" | "Neutral",
            "confidence": 90,
            "current_price": 2045.50,
            "summary": "Price swept SSL at 2040 and rejected the H4 Order Block. Quant confirms bullish divergence...",
            "structure": {{
                "trend": "Bullish",
                "phase": "Accumulation" | "Markup" | "Distribution" | "Markdown",
                "key_event": "MSS (Market Structure Shift) Confirmed"
            }},
            "smc_context": {{
                "fair_value_gap": "Bullish FVG at 2042-2044",
                "order_block": "H4 Bullish OB at 2040",
                "liquidity_sweep": "Swept Previous Daily Lows",
                "market_structure_break": "BOS to upside"
            }},
            "levels": {{
                "entry": 2046.00,
                "sl": 2038.00,
                "tp1": 2055.00,
                "tp2": 2065.00
            }},
            "risk_management": {{
                "stop_loss_pips": 80,
                "risk_amount_usd": {equity * 0.01},
                "recommended_lot_size": 0.12,
                "leverage": "1:30"
            }},
            "scenarios": {{
                "invalidation_price": 2037.00,
                "bullish_thesis": "Retest of FVG holds, targeting BSL at 2060.",
                "bearish_invalidation": "Close below 2037 negates the OB."
            }},
            "metrics": {{
                "risk_reward": "1:2.5",
                "volatility_score": 8,
                "sentiment": "Institutional Buying"
            }}
        }}
        """

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
                                    "text": f"Analyze this XAU/USD chart. Equity: ${equity}. Ensure 1:2 Risk/Reward. THINK in <analysis> first. JSON ONLY at the end."
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
                import ast
                
                # 1. Extract JSON block
                # Regex improvements: find largest { ... } block even with nesting
                # This assumes the JSON is the LAST major bracketed block
                json_candidates = re.findall(r'\{[\s\S]*\}', text_response)
                
                # Extract Analysis Block (Chain of Thought)
                analysis_match = re.search(r'<analysis>(.*?)</analysis>', text_response, re.DOTALL)
                analysis_reasoning = analysis_match.group(1).strip() if analysis_match else "Reasoning not provided."

                if json_candidates:
                    json_str = json_candidates[-1] # Take the last one
                else:
                    json_str = text_response
                
                # 2. Repair common LLM syntax errors
                json_str = json_str.replace("```json", "").replace("```", "").strip()
                
                try:
                    data = json.loads(json_str)
                    data['reasoning'] = analysis_reasoning
                except json.JSONDecodeError:
                    try:
                        py_dict = ast.literal_eval(json_str)
                        data = py_dict
                        data['reasoning'] = analysis_reasoning
                        json_str = json.dumps(py_dict)
                    except (ValueError, SyntaxError):
                         if "'" in json_str and '"' not in json_str: 
                              json_str = json_str.replace("'", '"')
                         json_str = re.sub(r',\s*}', '}', json_str)
                         json_str = re.sub(r',\s*]', ']', json_str)
                         try:
                              data = json.loads(json_str)
                         except:
                              logger.warning(f"Analysis CoT captured but JSON failed: {text_response[:200]}...")
                              raise Exception("Failed to parse AI response")

                # 3. Post-Processing: Hallucination Check & SMC Validation
                try:
                    # Ensure all new fields exist to prevent frontend crash
                    for key in ["structure", "market_context", "risk_management", "technique_confluence", "metrics", "scenarios"]:
                         if key not in data: data[key] = {}
                    
                    y_labels = data.get("y_axis_labels", [])
                    levels = data.get("levels", {})
                    entry = levels.get("entry")
                    
                    # Convert strings to floats for math
                    valid_labels = []
                    for lbl in y_labels:
                        try:
                            valid_labels.append(float(str(lbl).replace(",", "")))
                        except:
                            pass
                            
                    if valid_labels and entry:
                        avg_label = sum(valid_labels) / len(valid_labels)
                        
                        try:
                            entry_float = float(str(entry).replace(",", ""))
                            
                            # HALLUCINATION CHECK: > 1000 points deviation
                            if abs(entry_float - avg_label) > 1000:
                                logger.warning(f"HALLUCINATION DETECTED: Entry {entry_float} vs AvgLabel {avg_label}")
                                
                                # FIX: Re-center around visual labels
                                new_entry = avg_label
                                data["levels"]["entry"] = round(new_entry, 2)
                                data["summary"] += " [System: Prices corrected to match Chart Y-Axis.]"
                                # Note: Actual levels will be fixed by the Universal Logic Enforcement below
                                entry_price = round(new_entry, 2)
                            else:
                                entry_price = entry_float

                            # 4. UNIVERSAL LOGIC ENFORCEMENT & 1:2 R:R FORCE
                            bias = data.get("bias", "Neutral")
                            levels = data.get("levels", {})
                            
                            # Get SL (Trust AI's structural read unless huge error)
                            sl_price = float(str(levels.get("sl", 0) or 0).replace(",", ""))
                            
                            is_bullish = "Bullish" in bias
                            is_bearish = "Bearish" in bias
                            
                            valid_trade = False
                            
                            if is_bullish and entry_price > sl_price:
                                risk = entry_price - sl_price
                                valid_trade = True
                                # FORCE 1:2 RR
                                tp_price = entry_price + (risk * 2)
                                levels["tp1"] = round(tp_price, 2)
                                levels["tp2"] = round(entry_price + (risk * 3), 2)
                                levels["entry"] = entry_price
                                levels["sl"] = sl_price
                                
                            elif is_bearish and entry_price < sl_price:
                                risk = sl_price - entry_price
                                valid_trade = True
                                # FORCE 1:2 RR
                                tp_price = entry_price - (risk * 2)
                                levels["tp1"] = round(tp_price, 2)
                                levels["tp2"] = round(entry_price - (risk * 3), 2)
                                levels["entry"] = entry_price
                                levels["sl"] = sl_price
                            
                            # If invalid logic (e.g. Bullish but SL > Entry), reset to default 1:2
                            if not valid_trade and (is_bullish or is_bearish):
                                logger.warning(f"Invalid Logic Detected ({bias}, Entry: {entry_price}, SL: {sl_price}). Resetting to default 60pip SL.")
                                sl_pips = 6.0 # 60 pips gold standard
                                if is_bullish:
                                    levels["entry"] = entry_price
                                    levels["sl"] = round(entry_price - sl_pips, 2)
                                    levels["tp1"] = round(entry_price + (sl_pips * 2), 2)
                                    levels["tp2"] = round(entry_price + (sl_pips * 3), 2)
                                else:
                                    levels["entry"] = entry_price
                                    levels["sl"] = round(entry_price + sl_pips, 2)
                                    levels["tp1"] = round(entry_price - (sl_pips * 2), 2)
                                    levels["tp2"] = round(entry_price - (sl_pips * 3), 2)
                            
                            # Update Metrics
                            if is_bullish or is_bearish:
                                data["metrics"]["risk_reward"] = "1:2 (Fixed)"
                            
                            data["levels"] = levels
                            
                            # Re-dump to string
                            json_str = json.dumps(data)
                            
                        except Exception as logic_err:
                            logger.error(f"Logic enforcement error: {logic_err}")

                        except Exception as e:
                            logger.error(f"Error during hallucination fix: {e}")

                    # 4. UNIVERSAL LOGIC VALIDATION (Sanity Check)
                    # This runs regardless of hallucination check to catch minor logic errors
                    try:
                        bias = data.get("bias", "Neutral")
                        levels = data.get("levels", {})
                        entry = niveles_float = float(str(levels.get("entry", 0)).replace(",", ""))
                        sl = float(str(levels.get("sl", 0)).replace(",", ""))
                        tp1 = float(str(levels.get("tp1", 0)).replace(",", ""))
                        
                        is_bullish = "Bullish" in bias
                        is_bearish = "Bearish" in bias
                        
                        points_sl = 6.0 # Default fallback
                        points_tp = 12.0

                        if is_bullish:
                            # Rule: SL < Entry < TP
                            if sl >= entry:
                                logger.warning(f"Logic Fix (Bullish): SL {sl} >= Entry {entry}. Resetting SL.")
                                levels["sl"] = round(entry - points_sl, 2)
                            if tp1 <= entry:
                                logger.warning(f"Logic Fix (Bullish): TP {tp1} <= Entry {entry}. Resetting TP.")
                                levels["tp1"] = round(entry + points_tp, 2)
                                levels["tp2"] = round(entry + (points_tp * 1.5), 2)

                        elif is_bearish:
                            # Rule: TP < Entry < SL
                            if sl <= entry:
                                logger.warning(f"Logic Fix (Bearish): SL {sl} <= Entry {entry}. Resetting SL.")
                                levels["sl"] = round(entry + points_sl, 2)
                            if tp1 >= entry:
                                logger.warning(f"Logic Fix (Bearish): TP {tp1} >= Entry {entry}. Resetting TP.")
                                levels["tp1"] = round(entry - points_tp, 2)
                                levels["tp2"] = round(entry - (points_tp * 1.5), 2)
                        
                        data["levels"] = levels
                        json_str = json.dumps(data)
                        
                    except Exception as logic_err:
                        logger.error(f"Logic validation error: {logic_err}")
                            
                except Exception as parse_err:
                    logger.warning(f"Post-processing warning: {parse_err}")

                return json_str
            
            except Exception as e:
                logger.error(f"Model {model} failed: {e}")
                errors.append(f"{model}: {str(e)}")
                continue
        
        # If all failed
        raise Exception(f"All Claude models failed. Errors: {'; '.join(errors)}")
