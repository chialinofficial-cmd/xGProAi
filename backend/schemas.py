from pydantic import BaseModel, EmailStr
from datetime import datetime

# Auth & User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ProfileUpdate(BaseModel):
    mobile: str | None = None
    country: str | None = None
    gender: str | None = None
    age_group: str | None = None

class TierUpdate(BaseModel):
    tier: str

class CreditUpdate(BaseModel):
    amount: int

class TrialExtension(BaseModel):
    days: int

class StatsResponse(BaseModel):
    total_analyses: int
    charts_analyzed: int
    ai_responses: int
    credits_remaining: int
    plan_tier: str
    trial_ends_at: datetime | None = None
    subscription_ends_at: datetime | None = None
    # Profile Data
    mobile: str | None = None
    country: str | None = None
    gender: str | None = None
    age_group: str | None = None

# Analysis Schemas
class AnalysisResponse(BaseModel):
    id: int
    asset: str
    bias: str
    confidence: int
    summary: str
    recommendation: str | None = None
    entry: float | None = None
    sl: float | None = None
    tp1: float | None = None
    tp2: float | None = None
    risk_reward: str | None = None
    sentiment: str | None = None
    image_path: str
    result: str | None = None # win, loss, breakeven
    meta_data: dict | None = None
    quant_engine: dict | None = None
    sentiment_engine: dict | None = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AnalysisUpdateResult(BaseModel):
    result: str # win, loss, breakeven

# Payment Schemas
class PaymentInit(BaseModel):
    amount: float
    email: str
    plan_tier: str

# Chat Schemas
class ChatMessage(BaseModel):
    message: str
    history: list = []
