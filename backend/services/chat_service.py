import os
import logging
from typing import AsyncGenerator
from openai import AsyncOpenAI

from services.quant_service import QuantService

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.api_key = os.getenv("DEEPSEEK_API_KEY")
        self.client = None
        self.quant = QuantService()
        if self.api_key:
            self.client = AsyncOpenAI(
                api_key=self.api_key,
                base_url="https://api.deepseek.com"
            )
        else:
            logger.warning("DEEPSEEK_API_KEY is not set. Chat will not work.")

    async def stream_chat_response(self, message: str, history: list) -> AsyncGenerator[str, None]:
        """
        Streams chat response from Deepseek API with live market context.
        """
        if not self.client:
            yield "⚠️ Error: Deepseek API Key is missing. Please configure the backend."
            return

        # 1. Fetch Live Market Context
        market_context_str = ""
        try:
            df = await self.quant.fetch_ohlcv("XAU/USD", timeframe="1h", limit=100)
            analysis = self.quant.analyze_market_structure(df)
            
            if "current_price" in analysis:
                market_context_str = (
                    f"Live Market Data (XAU/USD 1H):\n"
                    f"- Price: {analysis['current_price']:.2f}\n"
                    f"- Trend: {analysis['trend']}\n"
                    f"- RSI: {analysis.get('rsi', 50):.1f}\n"
                    f"- MACD Signal: {analysis.get('macd_signal', 'Neutral')}\n"
                    f"- Volatility Alert: {analysis.get('volatility_alert', False)}\n"
                )
                if "ai_levels" in analysis:
                    levels = analysis['ai_levels']
                    market_context_str += (
                        f"- AI Levels: Entry {levels['entry']:.2f}, SL {levels['sl']:.2f}, TP {levels['tp']:.2f}\n"
                    )
        except Exception as e:
            logger.error(f"Failed to fetch market context for chat: {e}")

        # Prepare messages
        system_prompt = (
            "You are xGPro AI, an expert trading assistant specializing in XAU/USD (Gold). "
            "Use the provided Live Market Data to inform your advice. "
            "Provide concise, actionable analysis with Entry, SL, and TP levels where appropriate. "
            "Use markdown formatting."
        )
        
        if market_context_str:
            system_prompt += f"\n\nCONTEXT:\n{market_context_str}"

        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add history (limit to last 10 messages to save context)
        for msg in history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        # Add current message
        messages.append({"role": "user", "content": message})

        try:
            stream = await self.client.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                stream=True,
                temperature=0.7
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error(f"Deepseek API Error: {e}")
            yield f"⚠️ API Error: {str(e)}"
