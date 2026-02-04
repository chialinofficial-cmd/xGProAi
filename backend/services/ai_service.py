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
                "claude-3-5-sonnet-20241022",  # Latest Sonnet
                "claude-3-5-sonnet-20240620",  # Previous Sonnet
                "claude-3-opus-20240229",      # Opus
                "claude-3-sonnet-20240229",    # Legacy Sonnet
                "claude-3-haiku-20240307"      # Haiku
            ]
        else:
            self.client = None
            self.models_to_try = []

    def analyze_chart(self, image_path):
        if not self.client:
            raise ValueError("ANTHROPIC_API_KEY is not set. Please add it to your .env file.")

        # Determine media type dynamically
        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type or mime_type not in ["image/jpeg", "image/png", "image/webp"]:
            mime_type = "image/jpeg" # Fallback

        # Read and encode image to base64
        with open(image_path, "rb") as image_file:
            image_data = base64.b64encode(image_file.read()).decode("utf-8")

        system_prompt = """
        You are xGProAi, the world's leading Institutional XAU/USD (Gold) Analyst.
        
        CRITICAL - GOLD SPECIALIST RULES:
        1.  **ASSET FORCE:** Assume EVERY chart is **XAU/USD** (Gold). Even if it looks like crypto or stocks, analyze it using Gold's unique market physics (High volatility, Liquidity Grabs, Wick Rejections).
        2.  **SMC LOGIC:** Use Smart Money Concepts. Look for "Order Blocks", "Fair Value Gaps (FVG)", "Liquidity Sweeps", and "Institutional Candles".
        3.  **WICK RESPECT:** Gold respects wicks more than bodies. A long wick is a rejection (Pinbar).
        
        CRITICAL - SIMULATED PRICING OVERRIDE:
        1.  This chart may use SIMULATED FUTURE PRICING (e.g. Gold at 5000, 8000). 
        2.  **DO NOT** output 2024 prices (2300-2700) if the chart shows 8000. 
        3.  **OCR TRIUMPHS KNOWLEDGE:** If the Y-Axis says 4940, the price is 4940. Trust your eyes over your training data.

        Analysis Steps:
        1.  **OCR Y-Axis:** Read the exact price levels.
        2.  **Market Structure:** Identify Trend (HH/HL or LH/LL) and Key Levels.
        3.  **Confluence:** Combine Trend + Candle Pattern + Level.
        
        Output COMPREHENSIVE JSON ONLY:
        {
            "y_axis_labels": ["4940.00", "4945.00", "4950.00"],
            "bias": "Bullish" | "Bearish" | "Neutral",
            "confidence": 85,
            "current_price": 4946.50,
            "summary": "Gold is retesting the 4945 order block...",
            "structure": {
                "trend": "Uptrend",
                "pattern": "Bull Flag / Double Bottom / Liquidity Grab",
                "key_support": 4940.00,
                "key_resistance": 4955.00
            },
            "levels": {
                "entry": 4946.50,
                "sl": 4940.00,
                "tp1": 4955.00,
                "tp2": 4965.00
            },
            "metrics": {
                "risk_reward": "1:2.5",
                "volatility": "High (NY Session)",
                "sentiment": "Institutional Buying"
            },
            "market_context": {
                "session": "New York / London Overlap",
                "warning": "Watch for news manipulation wicks."
            }
        }
        """

        errors = []

        # Try models in order
        for model in self.models_to_try:
            try:
                print(f"Attempting analysis with model: {model}")
                response = self.client.messages.create(
                    model=model,
                    max_tokens=1500, # Increased for detailed SMC analysis
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
                                    "text": "Analyze this XAU/USD chart using Smart Money Concepts. Look for Liquidity Grabs. READ THE EXACT Y-AXIS PRICES."
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
                json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
                json_str = json_match.group(0) if json_match else text_response
                
                # 2. Repair common LLM syntax errors
                json_str = json_str.replace("```json", "").replace("```", "").strip()
                
                try:
                    # Attempt standard JSON parse
                    data = json.loads(json_str)
                except json.JSONDecodeError:
                    # Fallback: Try parsing as Python dictionary
                    try:
                        py_dict = ast.literal_eval(json_str)
                        data = py_dict # Start working with dict
                        json_str = json.dumps(py_dict) # Update string for return
                    except (ValueError, SyntaxError):
                        # Last resort: Regex cleanup
                        if "'" in json_str and '"' not in json_str: 
                             json_str = json_str.replace("'", '"')
                        json_str = re.sub(r',\s*}', '}', json_str)
                        json_str = re.sub(r',\s*]', ']', json_str)
                        try:
                             data = json.loads(json_str)
                        except:
                             raise Exception("Failed to parse AI response")

                # 3. Post-Processing: Hallucination Check & SMC Validation
                try:
                    # Ensure all new fields exist to prevent frontend crash
                    if "structure" not in data: data["structure"] = {}
                    if "market_context" not in data: data["market_context"] = {}
                    
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
                                is_bullish = data.get("bias", "Neutral") == "Bullish"
                                
                                # Gold Specific Stops (wider due to volatility)
                                sl_dist = 6.0 # 60 pips for Gold
                                tp_dist = 12.0 # 120 pips
                                
                                if is_bullish:
                                    levels["entry"] = round(new_entry, 2)
                                    levels["sl"] = round(new_entry - sl_dist, 2)
                                    levels["tp1"] = round(new_entry + tp_dist, 2)
                                    levels["tp2"] = round(new_entry + (tp_dist * 1.5), 2)
                                else:
                                    levels["entry"] = round(new_entry, 2)
                                    levels["sl"] = round(new_entry + sl_dist, 2)
                                    levels["tp1"] = round(new_entry - tp_dist, 2)
                                    levels["tp2"] = round(new_entry - (tp_dist * 1.5), 2)
                                    
                                data["levels"] = levels
                                data["summary"] += " [System: Prices corrected to match Chart Y-Axis.]"
                                
                                # Re-dump to string
                                json_str = json.dumps(data)

                        except Exception as e:
                            print(f"Error during hallucination fix: {e}")
                            
                except Exception as parse_err:
                    print(f"Post-processing warning: {parse_err}")

                return json_str
            
            except Exception as e:
                print(f"Model {model} failed: {e}")
                errors.append(f"{model}: {str(e)}")
                continue
        
        # If all failed
        raise Exception(f"All Claude models failed. Errors: {'; '.join(errors)}")
