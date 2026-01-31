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
    user_id = Column(String, index=True) # Firebase UID
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True) # Optional if using Firebase only
    firebase_uid = Column(String, unique=True, index=True) 
    full_name = Column(String, default="Trader")
    plan_tier = Column(String, default="free") # free, pro
    credits = Column(Integer, default=3)
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
