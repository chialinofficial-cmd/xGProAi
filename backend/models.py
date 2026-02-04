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
    entry = Column(Float, nullable=True)
    sl = Column(Float, nullable=True)
    tp1 = Column(Float, nullable=True)
    tp2 = Column(Float, nullable=True)
    risk_reward = Column(String, nullable=True)
    sentiment = Column(String, nullable=True)
    user_id = Column(String, index=True) # Firebase UID
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True) # Optional if using Firebase only
    firebase_uid = Column(String, unique=True, index=True) 
    full_name = Column(String, default="Trader")
    plan_tier = Column(String, default="trial") # trial, pro, free
    credits_balance = Column(Integer, default=10) # 10 credits for trial
    trial_ends_at = Column(DateTime, nullable=True)
    subscription_ends_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True)
    user_id = Column(String, index=True)
    amount = Column(Float)
    currency = Column(String)
    status = Column(String, default="pending") # pending, paid, expired
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
