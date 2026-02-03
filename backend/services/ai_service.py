import os
import base64
import anthropic
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)
            self.model = "claude-3-5-sonnet-20240620"
        else:
            self.client = None
            self.model = None

    def analyze_chart(self, image_path):
        if not self.client:
            raise ValueError("ANTHROPIC_API_KEY is not set. Please add it to your .env file.")

        # Read and encode image to base64
        with open(image_path, "rb") as image_file:
            image_data = base64.b64encode(image_file.read()).decode("utf-8")
            media_type = "image/jpeg" # Default to jpeg, typically fine for most uploads

        system_prompt = """
        You are xGProAi, an elite XAU/USD (Gold) Scalper and Swing Trader with 20 years of institutional experience.
        Your job is to analyze chart screenshots and provide a precise, professional trading signal.
        
        Analyze the chart for:
        1. Market Structure (Trends, Support/Resistance, Key Levels)
        2. Candlestick Patterns (Engulfing, Pinbars, Rejections)
        3. Indicators (if visible, ignore if not)
        
        Output valid JSON ONLY with this structure:
        {
            "bias": "Bullish" | "Bearish" | "Neutral",
            "confidence": 85, // integer 0-100
            "summary": "Concise technical summary (max 3 sentences). Mention specific price action.",
            "levels": {
                "sl": 2030.50, // Stop Loss
                "entry": 2035.00, // Current/Entry
                "tp1": 2040.00,
                "tp2": 2045.00
            },
            "metrics": {
                "risk_reward": "1:2.5",
                "volatility": "High",
                "sentiment": "Strong Buy"
            }
        }
        Do not add Markdown formatting (like ```json), just raw JSON.
        """

        try:
            response = self.client.messages.create(
                model=self.model,
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
                                    "media_type": media_type,
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
            
            # Extract text response
            text_response = response.content[0].text
            
            # Clean up markdown if Claude adds it
            text_response = text_response.replace("```json", "").replace("```", "").strip()
            
            return text_response
            
        except Exception as e:
            print(f"Error calling Claude: {e}")
            raise Exception(f"Claude Error: {e}")
