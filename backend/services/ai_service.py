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

            except Exception as e:
                print(f"Model {model} failed: {e}")
                errors.append(f"{model}: {str(e)}")
                # Continue to next model
                continue
        
        # If all failed
        error_summary = "; ".join(errors)
        raise Exception(f"All Claude models failed. Errors: {error_summary}")
