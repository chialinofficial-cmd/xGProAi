import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def analyze_chart(self, image_path):
        if not self.model:
            raise ValueError("GEMINI_API_KEY is not set. Please add it to your .env file.")

        # Read image
        with open(image_path, "rb") as f:
            image_data = f.read()

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
            # Gemini supports passing image bytes directly or via mime types
            # For simplicity with the python client, we can pass a dict for blob
            image_part = {
                "mime_type": "image/jpeg", # Assuming jpeg/png, gemini handles most
                "data": image_data
            }

            response = self.model.generate_content([system_prompt, image_part])
            
            text_response = response.text
            # Clean up markdown if Gemini adds it
            text_response = text_response.replace("```json", "").replace("```", "").strip()
            
            return text_response
            
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            raise e
