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
        1. Look at the chart image.
        2. READ the current price specifically from the price label (usually on the right y-axis).
        3. TRUST THE IMAGE PRICE EXACTLY. Do not use your internal knowledge of what Gold price "should" be.
        4. If the chart says 4930, output 4930. If it says 2040, output 2040.
        
        Analyze the chart for:
        1. Market Structure (Trends, Support/Resistance, Key Levels)
        2. Candlestick Patterns
        3. Indicators
        
        Output valid JSON ONLY:
        {
            "bias": "Bullish" | "Bearish" | "Neutral",
            "confidence": 85,
            "summary": "Concise technical summary. STATE THE CURRENT PRICE YOU SEE IN THE SUMMARY.",
            "levels": {
                "sl": 0.00, // Derived from chart
                "entry": 0.00, // THE EXACT CURRENT PRICE ON CHART
                "tp1": 0.00,
                "tp2": 0.00
            },
            "metrics": {
                "risk_reward": "1:2",
                "volatility": "High",
                "sentiment": "Strong Buy"
            }
        }
        Do not add Markdown formatting. Return raw JSON.
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
