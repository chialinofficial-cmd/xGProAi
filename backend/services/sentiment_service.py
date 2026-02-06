import os
import requests
import datetime
import json
from datetime import timedelta

class SentimentService:
    def __init__(self):
        self.api_key = os.getenv("FINNHUB_API_KEY")
        self.base_url = "https://finnhub.io/api/v1"

    def check_high_impact_news(self):
        """
        Checks for high-impact economic events (NFP, CPI, FOMC) via Finnhub.
        Returns: {"risk": "HIGH"|"LOW", "event": "..."}
        """
        if not self.api_key:
            return {"risk": "LOW", "event": "No API Key - Safe Mode"}

        try:
            # Get Calendar for Today
            today = datetime.datetime.now().strftime("%Y-%m-%d")
            tomorrow = (datetime.datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            
            url = f"{self.base_url}/calendar?from={today}&to={tomorrow}&token={self.api_key}"
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                
                # Filter for High Impact (importance 'high' in Finnhub usually refers to 'impact')
                # Finnhub calendar fields: 'event', 'impact', 'time'
                # Note: Finnhub 'impact' might be distinct. We look for keywords too.
                
                major_keywords = ["Non-Farm Employment Change", "CPI", "FOMC", "Fed Interest Rate", "GDP"]
                
                for event in data.get("economicCalendar", []):
                    # Check if event is High Impact (impact is often absent in free tier, relies on name)
                    event_name = event.get("event", "")
                    
                    if any(key in event_name for key in major_keywords):
                        # check time
                        event_time_str = event.get("time", "") # "12:30:00"
                        # Simple logic: If we are close to this time? 
                        # For MVP, just alerting existence is enough.
                        return {"risk": "HIGH", "event": f"Upcoming: {event_name}"}

            return {"risk": "LOW", "event": "No major events detected"}
            
        except Exception as e:
            print(f"Sentiment Error: {e}")
            return {"risk": "LOW", "event": "Error fetching news"}

    def get_market_sentiment(self):
        """
        Fetches 'News Sentiment' or raw news to determine bias.
        """
        if not self.api_key:
             return {"score": 0, "label": "Neutral", "summary": "No Data"}

        try:
            # Use News Sentiment Endpoint if available (Standard Tier+)
            # Fallback to general news
            url = f"{self.base_url}/news-sentiment?symbol=XAU&token={self.api_key}" 
            response = requests.get(url)
            
            sentiment_score = 0
            label = "Neutral"
            summary = "Market is balanced."

            if response.status_code == 200:
                data = response.json()
                # Finnhub sentiment data structure:
                # {'sentiment': {'bullishPercent': 0.5, 'bearishPercent': 0.2}}
                
                sentiment = data.get('sentiment', {})
                if sentiment:
                    bullish = sentiment.get('bullishPercent', 0.5)
                    bearish = sentiment.get('bearishPercent', 0.5)
                    
                    if bullish > 0.6:
                        sentiment_score = 75
                        label = "Bullish"
                        summary = "Strong News Sentiment Detected."
                    elif bearish > 0.6:
                        sentiment_score = -75
                        label = "Bearish"
                        summary = "Negative News Sentiment Detected."
                else:
                    # Fallback if no sentiment data (e.g. Free Tier restriction)
                    # Fetch generic news
                    news_url = f"{self.base_url}/news?category=forex&token={self.api_key}"
                    news_res = requests.get(news_url)
                    if news_res.status_code == 200:
                        headlines = news_res.json()[:5]
                        summary = f"Latest: {headlines[0].get('headline')}" if headlines else "No news"

            return {
                "score": sentiment_score, 
                "label": label,
                "summary": summary
            }
            
        except Exception:
            return {"score": 0, "label": "Neutral", "summary": "Analysis Failed"}
