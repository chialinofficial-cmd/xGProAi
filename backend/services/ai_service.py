import os
import base64
import anthropic
import mimetypes
from dotenv import load_dotenv

load_dotenv()

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
            self.models_to_try = []

    def analyze_chart(self, image_path, equity=1000.0):
        if not self.client:
            raise ValueError("ANTHROPIC_API_KEY is not set. Please add it to your .env file.")

        # Determine media type dynamically
        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type or mime_type not in ["image/jpeg", "image/png", "image/webp"]:
            mime_type = "image/jpeg" # Fallback

        # Read and encode image to base64
        with open(image_path, "rb") as image_file:
            image_data = base64.b64encode(image_file.read()).decode("utf-8")

        system_prompt = f"""
        You are xGProAi, the world's leading Institutional XAU/USD (Gold) Analyst & Fund Manager.
        
        CURRENT ACCOUNT EQUITY: ${equity}
        RISK PER TRADE: 1.0% (${equity * 0.01})
        
        CRITICAL - GOLD SPECIALIST RULES:
        1.  **ASSET FORCE:** Assume EVERY chart is **XAU/USD** (Gold).
        2.  **VOLATILITY AWARENESS:** 
            *   Gold is highly volatile. **NEVER** use tight stops (< 30 pips) on H1/H4 timeframes.
            *   **Assess Visual Volatility:** Look at candle wicks. Large wicks = High Volatility.
            *   **Stop Loss Padding:** 
                *   Low Volatility: Width of Structure + 10-20 pips.
                *   High Volatility: Width of Structure + 30-50 pips (to survive liquidity grabs).
        3.  **DYNAMIC LOT SIZING (Real Math):**
            *   Your Risk Amount is ${equity * 0.01}.
            *   Calculate the Lot Size based on your SL Pips.
            *   Formula: (Risk Amount) / (SL_Pips * 10) [Approx for Gold]. 
            *   Example: $10 Risk / (50 pips * 10) = 0.02 Lots.
        4.  **SCENARIO PLANNING:**
            *   **Invalidation Level:** distinct from SL. The price level where the whole ANALYSIS is wrong (e.g., Structure Break).
            *   **Breakeven Trigger:** A logical level (e.g., 1:1 RR) to secure the trade.
        
        Analysis Steps (CHAIN OF THOUGHT):
        1.  **Thinking Phase (<analysis>):**
            *   **Volatility Check:** Rate volatility 1-10.
            *   **Bias:** Bullish/Bearish?
            *   **Level Logic:** Entry, SL, TP.
            *   **Risk Math:** Show your calculation for the Lot Size for ${equity}.
        2.  **Final Output:** Generate the JSON.
        
        Output Format:
        <analysis>
        [Reasoning including Lot Size Math...]
        </analysis>
        
        {{
            "y_axis_labels": ["2040.00", "2045.00", "2050.00"],
            "bias": "Bullish" | "Bearish" | "Neutral",
            "confidence": 85,
            "current_price": 2046.50,
            "summary": "Gold is rejecting the demand zone...",
            "structure": {{
                "trend": "Uptrend",
                "pattern": "Bull Flag"
            }},
            "levels": {{
                "entry": 2046.50,
                "sl": 2040.00,
                "tp1": 2059.50,
                "tp2": 2065.00
            }},
            "risk_management": {{
                "stop_loss_pips": 65,
                "risk_amount_usd": {equity * 0.01},
                "recommended_lot_size": 0.15,
                "recommended_leverage": "1:50",
                "management_rules": ["Move SL to BE at 2055", "Take Partial at TP1"]
            }},
            "scenarios": {{
                "invalidation_price": 2038.00,
                "breakeven_trigger": 2052.50,
                "bearish_alternative": "If price closes below 2038, look for sells to 2030."
            }},
            "technique_confluence": {{
                "fibonacci_level": "0.618",
                "wyckoff_phase": "Spring",
                "liquidity_trap": "Equal Highs"
            }},
            "metrics": {{
                "risk_reward": "1:2",
                "volatility": "High",
                "volatility_score": 8,
                "sentiment": "Bullish"
            }},
             "market_context": {{
                "session": "NY Session",
                "warning": "News impact expected"
            }}
        }}
        """

        errors = []

        # Try models in order
        for model in self.models_to_try:
            try:
                print(f"Attempting analysis with model: {model}")
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
                              print(f"Analysis CoT captured but JSON failed: {text_response[:200]}...")
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
                                print(f"HALLUCINATION DETECTED: Entry {entry_float} vs AvgLabel {avg_label}")
                                
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
                                print(f"Invalid Logic Detected ({bias}, Entry: {entry_price}, SL: {sl_price}). Resetting to default 60pip SL.")
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
                            print(f"Logic enforcement error: {logic_err}")

                        except Exception as e:
                            print(f"Error during hallucination fix: {e}")

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
                                print(f"Logic Fix (Bullish): SL {sl} >= Entry {entry}. Resetting SL.")
                                levels["sl"] = round(entry - points_sl, 2)
                            if tp1 <= entry:
                                print(f"Logic Fix (Bullish): TP {tp1} <= Entry {entry}. Resetting TP.")
                                levels["tp1"] = round(entry + points_tp, 2)
                                levels["tp2"] = round(entry + (points_tp * 1.5), 2)

                        elif is_bearish:
                            # Rule: TP < Entry < SL
                            if sl <= entry:
                                print(f"Logic Fix (Bearish): SL {sl} <= Entry {entry}. Resetting SL.")
                                levels["sl"] = round(entry + points_sl, 2)
                            if tp1 >= entry:
                                print(f"Logic Fix (Bearish): TP {tp1} >= Entry {entry}. Resetting TP.")
                                levels["tp1"] = round(entry - points_tp, 2)
                                levels["tp2"] = round(entry - (points_tp * 1.5), 2)
                        
                        data["levels"] = levels
                        json_str = json.dumps(data)
                        
                    except Exception as logic_err:
                        print(f"Logic validation error: {logic_err}")
                            
                except Exception as parse_err:
                    print(f"Post-processing warning: {parse_err}")

                return json_str
            
            except Exception as e:
                print(f"Model {model} failed: {e}")
                errors.append(f"{model}: {str(e)}")
                continue
        
        # If all failed
        raise Exception(f"All Claude models failed. Errors: {'; '.join(errors)}")
