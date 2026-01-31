import base64
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)

    def encode_image(self, image_path):
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def analyze_chart(self, image_path):
        if not self.client:
            raise ValueError("OPENAI_API_KEY is not set. Please add it to your .env file.")

        base64_image = self.encode_image(image_path)

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
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o", 
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Analyze this XAU/USD chart and provide a trade setup."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                response_format={ "type": "json_object" },
                max_tokens=600
            )

            return response.choices[0].message.content
        except Exception as e:
            print(f"Error calling OpenAI: {e}")
            raise e
