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
        
        CRITICAL INSTRUCTION:
        1. FIRST, scan the Y-Axis (Right side) and list the numeric labels you see (e.g., 4920, 4930, 4940).
        2. use these visual labels to determine the EXACT Market Price.
        3. Do NOT use historical data (e.g. 2040). Trust the image.
        
        Output valid JSON ONLY:
        {
            "y_axis_labels": ["4920.00", "4930.00", "4940.00"],
            "bias": "Bullish" | "Bearish" | "Neutral",
            "confidence": 85,
            "summary": "Concise technical summary.",
            "levels": {
                "sl": 4925.00,
                "entry": 4932.50,
                "tp1": 4940.00,
                "tp2": 4950.00
            },
            "metrics": {
                "risk_reward": "1:2",
                "volatility": "High",
                "sentiment": "Strong Buy"
            }
        }
        Do not add Markdown formatting. Return raw JSON. No comments in JSON.
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
                                    "text": "Analyze this XAU/USD chart and provide a trading signal."
                                }
                            ],
                        }
                    ],
                )
                
                # If successful, extract and return
                text_response = response.content[0].text
                
                # Robust JSON Cleaning
                import re
                json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
                if json_match:
                    return json_match.group(0)
                else:
                    # Fallback cleanup if regex doesn't match (unlikely for valid JSON)
                    return text_response.replace("```json", "").replace("```", "").strip()

            except Exception as e:
                print(f"Model {model} failed: {e}")
                errors.append(f"{model}: {str(e)}")
                # Continue to next model
                continue
        
        # If all failed
        error_summary = "; ".join(errors)
        raise Exception(f"All Claude models failed. Errors: {error_summary}")
