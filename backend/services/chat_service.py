import os
import logging
from typing import AsyncGenerator
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.api_key = os.getenv("DEEPSEEK_API_KEY")
        self.client = None
        if self.api_key:
            self.client = AsyncOpenAI(
                api_key=self.api_key,
                base_url="https://api.deepseek.com"
            )
        else:
            logger.warning("DEEPSEEK_API_KEY is not set. Chat will not work.")

    async def stream_chat_response(self, message: str, history: list) -> AsyncGenerator[str, None]:
        """
        Streams chat response from Deepseek API.
        """
        if not self.client:
            yield "⚠️ Error: Deepseek API Key is missing. Please configure the backend."
            return

        # Prepare messages
        messages = [
            {"role": "system", "content": "You are xGPro AI, an expert trading assistant specializing in XAU/USD (Gold) and Forex market structure. Provide concise, actionable analysis with Entry, SL, and TP levels where appropriate. Use markdown formatting."}
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
