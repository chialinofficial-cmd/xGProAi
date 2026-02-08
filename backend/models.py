from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    asset = Column(String, default="XAU/USD")
    image_path = Column(String)
    bias = Column(String) # Bullish, Bearish, Neutral
    confidence = Column(Integer)
    summary = Column(String)
    result = Column(String, nullable=True) # win, loss, breakeven
    entry = Column(Float, nullable=True)
    sl = Column(Float, nullable=True)
    tp1 = Column(Float, nullable=True)
    tp2 = Column(Float, nullable=True)
    risk_reward = Column(String, nullable=True)
    sentiment = Column(String, nullable=True)
    user_id = Column(String, index=True) # Firebase UID
    processing_time_ms = Column(Integer, nullable=True) # AI Latency
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True) # Optional if using Firebase only
    firebase_uid = Column(String, unique=True, index=True) 
    full_name = Column(String, default="Trader")
    plan_tier = Column(String, default="trial") # trial, free, starter, active, advanced
    credits_balance = Column(Integer, default=3) # 3 credits for trial
    daily_usage_count = Column(Integer, default=0) # Resets daily
    last_usage_date = Column(DateTime, nullable=True) # Tracks last usage for reset
    trial_ends_at = Column(DateTime, nullable=True)
    subscription_ends_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Profile Fields
    mobile = Column(String, nullable=True)
    country = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    age_group = Column(String, nullable=True)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True)
    user_id = Column(String, index=True)
    amount = Column(Float)
    currency = Column(String)
    status = Column(String, default="pending") # pending, paid, expired
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
