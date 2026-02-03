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
        You are xGProAi, an elite XAU/USD (Gold) Scalper and Swing Trader.
        
        CRITICAL - OVERRIDE INTERNAL KNOWLEDGE:
        1. This chart uses SIMULATED FUTURE PRICING (e.g. Gold at 4000, 5000, 8000).
        2. Do NOT output 2024/2025 prices (2000-2700). That is wrong.
        3. READ THE Y-AXIS LABELS from the image. If the image says 4940, OUTPUT 4940.
        4. If the image says 8000, OUTPUT 8000.
        
        Analysis Steps:
        1. OCR the Y-Axis labels.
        2. Identify the current Last Price Candle.
        3. Formulate a plan based ONLY on those visual prices.

        Output valid JSON ONLY:
        {
            "y_axis_labels": ["4940.00", "4945.00", "4950.00"],
            "bias": "Bullish" | "Bearish" | "Neutral",
            "confidence": 85,
            "summary": "The chart shows price reacting at 4945 level...",
            "levels": {
                "sl": 4940.00,
                "entry": 4946.50,
                "tp1": 4955.00,
                "tp2": 4965.00
            },
            "metrics": {
                "risk_reward": "1:2",
                "volatility": "High",
                "sentiment": "Strong Buy"
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
                    max_tokens=1024,
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
                                    "text": "READ THE EXACT PRICE FROM THE Y-AXIS. Do not hallucinate historical prices."
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
                # Fix Markdown code blocks if missed by regex
                json_str = json_str.replace("```json", "").replace("```", "").strip()
                
                try:
                    # Attempt standard JSON parse
                    json.loads(json_str)
                    return json_str
                except json.JSONDecodeError:
                    # Fallback: Try parsing as Python dictionary (handles single quotes, etc.)
                    try:
                        # AST safely evaluates string as a python literal
                        py_dict = ast.literal_eval(json_str)
                        # If successful, dump back to valid JSON string
                        return json.dumps(py_dict)
                    except (ValueError, SyntaxError):
                        # Last resort: Simple string replacements (trailing commas, etc)
                         # Fix Single Quotes (common in Python dicts but invalid JSON)
                        if "'" in json_str and '"' not in json_str: 
                             json_str = json_str.replace("'", '"')
                        
                        # Fix trailing commas
                        json_str = re.sub(r',\s*}', '}', json_str)
                        json_str = re.sub(r',\s*]', ']', json_str)
                        
                        return json_str

                # 3. Post-Processing: Hallucination Check & Fix
                # The model often hallucinates ~2000-2400 (historical Gold price) even when the chart shows 4000-5000+
                # We use the y_axis_labels (which it usually OCRs correctly) to validate the Trade Levels.
                
                try:
                    data = json.loads(json_str) if isinstance(json_str, str) else json_str
                    
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
                            
                            # CHECK: Is Entry wildly far from the visual labels? (e.g. > 1000 points difference)
                            # This catches the 2040 vs 4940 error.
                            if abs(entry_float - avg_label) > 1000:
                                print(f"HALLUCINATION DETECTED: Entry {entry_float} vs AvgLabel {avg_label}")
                                
                                # FIX: We can't trust the specific levels, but we can trust the BIAS (Long/Short)
                                # and the RELATIVE distance.
                                # Strategy: Re-center the trade around the Average Label.
                                
                                # Use the 'avg_label' as the rough current price.
                                new_entry = avg_label
                                
                                # Determine direction based on TP/SL relation or Bias
                                is_bullish = data.get("bias", "Neutral") == "Bullish"
                                
                                # Create standard scalping structure around the REAL price (Labels)
                                if is_bullish:
                                    levels["entry"] = round(new_entry, 2)
                                    levels["sl"] = round(new_entry - 5.0, 2)   # -50 pips
                                    levels["tp1"] = round(new_entry + 5.0, 2)  # +50 pips
                                    levels["tp2"] = round(new_entry + 10.0, 2) # +100 pips
                                else:
                                    levels["entry"] = round(new_entry, 2)
                                    levels["sl"] = round(new_entry + 5.0, 2)
                                    levels["tp1"] = round(new_entry - 5.0, 2)
                                    levels["tp2"] = round(new_entry - 10.0, 2)
                                    
                                data["levels"] = levels
                                data["summary"] += " [SYSTEM NOTE: Prices auto-corrected based on Y-Axis OCR to fix AI hallucination.]"
                                
                                # Re-dump to string
                                json_str = json.dumps(data)

                        except Exception as e:
                            print(f"Error during hallucination fix: {e}")
                            
                except Exception as parse_err:
                    print(f"Post-processing parse warning: {parse_err}")

                return json_str
            
            except Exception as e:
                print(f"Model {model} failed: {e}")
                errors.append(f"{model}: {str(e)}")
                # Continue to next model
                continue
        
        # If all failed
        error_summary = "; ".join(errors)
        raise Exception(f"All Claude models failed. Errors: {error_summary}")
